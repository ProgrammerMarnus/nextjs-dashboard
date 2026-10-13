'use client';

import SideNav from '@/app/ui/dashboard/sidenav';
import BottomNav from '@/app/ui/dashboard/bottom-nav';
import { SettingsProvider } from '@/app/ui/settings/settings-context';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav />
        </div>
        <div className="grow p-4 pb-24 md:overflow-y-auto md:p-12 md:pb-12">{children}</div>
        <BottomNav />
      </div>
    </SettingsProvider>
  );
}