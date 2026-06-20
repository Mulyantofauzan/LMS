import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { db } from './db';
import { jobsites, users } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true;

      const googleProfile = profile as { email?: string; email_verified?: boolean; sub?: string } | undefined;
      const email = googleProfile?.email?.trim().toLowerCase();
      const subject = googleProfile?.sub;
      if (!email || !googleProfile?.email_verified || !subject) return false;

      const cookieStore = await cookies();
      const selectedJobsiteId = Number(cookieStore.get('oauth_jobsite_id')?.value);
      if (!Number.isInteger(selectedJobsiteId) || selectedJobsiteId <= 0) return false;

      const selectedJobsite = await db.select({ id: jobsites.id })
        .from(jobsites)
        .where(eq(jobsites.id, selectedJobsiteId))
        .get();
      if (!selectedJobsite) return false;

      const existing = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .get();

      if (existing) {
        if (!existing.isActive) return false;
        if (existing.jobsiteId && existing.jobsiteId !== selectedJobsiteId) return false;

        await db.update(users)
          .set({ oauthProvider: 'google', oauthSubject: subject })
          .where(eq(users.id, existing.id));
        user.id = String(existing.id);
        user.name = existing.name;
        user.email = existing.email;
        (user as typeof user & { role: string; isActive: boolean }).role = existing.role;
        (user as typeof user & { role: string; isActive: boolean }).isActive = true;
        return true;
      }

      const created = await db.insert(users).values({
        name: user.name?.trim() || email.split('@')[0],
        email,
        passwordHash: `oauth:google:${subject}`,
        role: 'trainee',
        jobsiteId: selectedJobsiteId,
        isActive: true,
        oauthProvider: 'google',
        oauthSubject: subject,
      }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });
      const newUser = created[0];
      if (!newUser) return false;

      user.id = String(newUser.id);
      user.name = newUser.name;
      user.email = newUser.email;
      (user as typeof user & { role: string; isActive: boolean }).role = newUser.role;
      (user as typeof user & { role: string; isActive: boolean }).isActive = true;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (!token.id) return token;

      const current = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      }).from(users).where(eq(users.id, Number(token.id))).get();

      if (!current || !current.isActive) {
        token.role = 'inactive';
        token.isActive = false;
        return token;
      }

      token.name = current.name;
      token.email = current.email;
      token.role = current.role;
      token.isActive = true;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { id?: string; role?: string; isActive?: boolean }).id = String(token.id ?? '');
        (session.user as typeof session.user & { id?: string; role?: string; isActive?: boolean }).role = String(token.role ?? 'inactive');
        (session.user as typeof session.user & { id?: string; role?: string; isActive?: boolean }).isActive = token.isActive === true;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await db.select().from(users).where(eq(users.email, email)).get();
          if (!user || !user.isActive || !user.passwordHash.startsWith('$2')) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

          if (passwordsMatch) {
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: true,
            };
          }
        }

        return null;
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
});
