'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { signOut } from '@/app/lib/actions';

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Patients', href: '/dashboard/patients', icon: UsersIcon },
  { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarDaysIcon },
];

// Always-visible bottom navigation for mobile. Replaces the top nav row so the
// primary sections and sign-out stay reachable with one thumb.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch pb-[env(safe-area-inset-bottom)]">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium',
                active ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600',
              )}
            >
              <LinkIcon className="h-6 w-6" />
              {link.name}
            </Link>
          );
        })}
        <form action={signOut} className="flex flex-1">
          <button
            type="submit"
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-gray-500 hover:text-blue-600"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
