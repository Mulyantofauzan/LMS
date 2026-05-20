'use client';

import { useActionState } from 'react';
import { authenticate, loginAs } from './actions';

export default function LoginForm() {
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
        <h3 className="text-sm font-medium text-center mb-4 text-gray-500 uppercase tracking-wider">Demo Accounts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <form action={() => loginAs('superadmin@demo.com')}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Super Admin
            </button>
          </form>
          <form action={() => loginAs('siteadmin@demo.com')}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Site Admin
            </button>
          </form>
          <form action={() => loginAs('manager@demo.com')}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Manager
            </button>
          </form>
          <form action={() => loginAs('trainer@demo.com')}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Trainer
            </button>
          </form>
          <form className="sm:col-span-2" action={() => loginAs('trainee@demo.com')}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Trainee
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
