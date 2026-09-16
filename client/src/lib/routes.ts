import { ROLES, type Role } from '@/types';

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  portal: '/portal',
  dashboard: '/dashboard',
} as const;

// Where a freshly authenticated user should land, by role.
export function homeForRole(role: Role): string {
  return role === ROLES.BORROWER ? ROUTES.portal : ROUTES.dashboard;
}
