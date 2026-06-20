import type { Session } from 'next-auth';

export type AppSessionUser = Session['user'] & {
  id?: string;
  role?: string;
  isActive?: boolean;
};

export function getSessionUser(user: Session['user'] | undefined): AppSessionUser | undefined {
  return user as AppSessionUser | undefined;
}
