'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { modulesForRole } from '@/lib/dashboard-modules';
import { ROUTES } from '@/lib/routes';

/**
 * Module navigation — only the modules the signed-in role may open are
 * rendered (ADMIN sees all four). Sidebar on desktop, scrollable tabs on mobile.
 */
export function DashboardNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const items = [
    { key: 'home', label: 'Overview', href: ROUTES.dashboard },
    ...modulesForRole(user.role).map((m) => ({ key: m.key, label: m.label, href: m.href })),
  ];

  return (
    <nav aria-label="Dashboard modules" className="lg:w-56 lg:shrink-0">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0 lg:pb-0">
        {items.map((item) => {
          const active = item.href === ROUTES.dashboard ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.key} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'block rounded-lg px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900',
                ].join(' ')}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
