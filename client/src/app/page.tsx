import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

// `proxy.ts` already sends authenticated users to their role home; anyone who
// reaches this page is anonymous, so the only sensible destination is login.

export default function HomePage() {
  redirect(ROUTES.login);
}
