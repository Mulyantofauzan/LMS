'use server'

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { jobsites } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const data = Object.fromEntries(formData);
    await signIn('credentials', { ...data, redirectTo: '/dashboard' });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function authenticateWithGoogle(formData: FormData) {
  const jobsiteId = Number(formData.get('jobsiteId'));
  if (!Number.isInteger(jobsiteId) || jobsiteId <= 0) {
    return;
  }

  const jobsite = await db.select({ id: jobsites.id })
    .from(jobsites)
    .where(eq(jobsites.id, jobsiteId))
    .get();
  if (!jobsite) return;

  const cookieStore = await cookies();
  cookieStore.set('oauth_jobsite_id', String(jobsiteId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/',
  });
  await signIn('google', { redirectTo: '/dashboard' });
}
