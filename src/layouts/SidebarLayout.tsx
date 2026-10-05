import { Bell, Building, Calendar, Clock, FileText, House, Menu as MenuIcon, Phone, Settings, User, Users } from 'lucide-react';
import { useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { Sheet } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { SidebarNav, type SidebarItem } from '@/components/ui/SidebarNav';
import { useMyClinic } from '@/data/queries/admin';
import { useNurseCounts } from '@/data/queries/care';
import type { Role } from '@/data/types';
import { Brand } from './Brand';
import { UserMenu } from './UserMenu';

const ICON = { size: 18, strokeWidth: 1.8 };

function useNavItems(role: Role): SidebarItem[] {
  const counts = useNurseCounts();
  if (role === 'nurse') {
    return [
      { to: '/nurse', end: true, label: 'Alert queue', icon: <Bell {...ICON} />, count: counts.data?.openAlerts, countTone: 'critical' },
      { to: '/nurse/patients', label: 'Patients', icon: <Users {...ICON} /> },
      { to: '/nurse/missed', label: 'Missed readings', icon: <Calendar {...ICON} />, count: counts.data?.missed, countTone: 'neutral' },
      { to: '/nurse/calls', label: 'Call log', icon: <Phone {...ICON} /> },
      { to: '/nurse/time', label: 'Time tracker', icon: <Clock {...ICON} /> },
    ];
  }
  if (role === 'clinic_admin') {
    return [
      { to: '/admin', end: true, label: 'Overview', icon: <House {...ICON} /> },
      { to: '/admin/team', label: 'Team', icon: <Users {...ICON} /> },
      { to: '/admin/patients', label: 'Patients', icon: <User {...ICON} /> },
      { to: '/admin/billing', label: 'Billing report', icon: <FileText {...ICON} /> },
      { to: '/admin/settings', label: 'Clinic settings', icon: <Settings {...ICON} /> },
    ];
  }
  return [
    { to: '/super', end: true, label: 'Clinics', icon: <Building {...ICON} /> },
    { to: '/super/audit', label: 'Audit log', icon: <FileText {...ICON} /> },
  ];
}

const NAV_LABEL: Partial<Record<Role, string>> = { nurse: 'Nurse', clinic_admin: 'Clinic admin', super_admin: 'Platform admin' };

function SidebarContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const items = useNavItems(role);
  const clinic = useMyClinic(role === 'clinic_admin');
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="px-2"><Brand to={items[0].to} /></div>
      {role === 'super_admin' && (
        <span className="ml-2 self-start rounded-full bg-ink px-3 py-[5px] text-xs font-bold tracking-[0.04em] text-surface">PLATFORM ADMIN</span>
      )}
      {role === 'clinic_admin' && (
        <div className="flex flex-col rounded-inner bg-bg px-3 py-2.5">
          <span className="text-xs text-ink-muted">Clinic</span>
          <span className="text-sm font-semibold">{clinic.data?.clinic.name ?? '…'}</span>
        </div>
      )}
      <SidebarNav items={items} aria-label={NAV_LABEL[role] ?? 'Main'} onNavigate={onNavigate} />
      <div className="mt-auto"><UserMenu variant="card" /></div>
    </div>
  );
}

/** Layout B: 240px sidebar (nurse, clinic admin, super admin). Below 1024px the sidebar becomes a drawer. */
export function SidebarLayout() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="flex min-h-dvh bg-bg text-sm">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-surface">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto border-r border-border bg-surface px-4 py-6 lg:block">
        <SidebarContent role={user.role} />
      </aside>
      <div className="flex min-w-0 grow flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <Brand to="/" />
          <IconButton aria-label="Open menu" icon={<MenuIcon size={20} strokeWidth={1.8} />} onClick={() => setOpen(true)} />
        </header>
        <main id="main" className="flex min-w-0 grow flex-col gap-5 px-4 pt-6 pb-10 sm:px-7 sm:pt-7">
          <Outlet />
          <ScrollRestoration />
        </main>
      </div>
      <Sheet open={open} onOpenChange={setOpen} title="Menu" side="left">
        <SidebarContent role={user.role} onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
