'use client';

import { useActionState } from 'react';
import { authenticate, authenticateWithGoogle } from './actions';
import { SearchableSelect } from '@/components/forms/SearchableSelect';

export default function LoginForm({
  jobsites,
  googleEnabled,
  oauthError,
}: {
  jobsites: { id: number; name: string }[];
  googleEnabled: boolean;
  oauthError?: string;
}) {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <>
      <form action={formAction} className="mt-8 space-y-6">
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
              placeholder="Password"
            />
          </div>
        </div>

        <div
          className="flex h-4 items-center"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            aria-disabled={isPending}
            className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-border pt-6">
        <div className="mb-4 flex items-center gap-3 text-xs font-medium uppercase text-gray-400">
          <span className="h-px flex-1 bg-border" />
          atau
          <span className="h-px flex-1 bg-border" />
        </div>
        {oauthError ? <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{oauthError}</p> : null}
        {googleEnabled ? (
          <form action={authenticateWithGoogle} className="space-y-3">
            <label className="block space-y-2 text-sm font-medium">
              Lokasi kerja
              <SearchableSelect
                name="jobsiteId"
                placeholder="Cari dan pilih jobsite"
                required
                options={jobsites.map((site) => ({ value: String(site.id), label: site.name }))}
              />
            </label>
            <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-xs font-bold text-blue-600">G</span>
              Lanjutkan dengan Google
            </button>
            <p className="text-xs leading-5 text-gray-500">
              Akun baru dibuat sebagai trainee pada jobsite yang dipilih. Email yang sudah terdaftar harus memilih jobsite yang sesuai.
            </p>
          </form>
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-gray-500">
            Login Google akan tersedia setelah kredensial OAuth dikonfigurasi.
          </p>
        )}
      </div>
    </>
  );
}
