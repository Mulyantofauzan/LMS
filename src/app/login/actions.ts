'use server'

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

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

export async function loginAs(email: string) {
  await signIn('credentials', { email, password: 'password123', redirectTo: '/dashboard' });
}
