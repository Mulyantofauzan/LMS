import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
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
  ],
});
