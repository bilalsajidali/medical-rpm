import { Bell, ChartLine, House, MessageSquare, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { focusRing } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { TopNav, type NavItem } from '@/components/ui/TopNav';
import { cn } from '@/lib/cn';
import { Brand } from './Brand';
import { ProfileSheet } from './ProfileSheet';
import { UserMenu } from './UserMenu';

const PATIENT_NAV: NavItem[] = [
  { to: '/patient', label: 'Home', end: true },
  { to: '/patient/readings', label: 'My readings' },
  { to: '/patient/care-team', label: 'Care team' },
];

const DOCTOR_NAV: NavItem[] = [
  // the patients list and charts read as part of the dashboard, so there is no separate "Patients" tab
  { to: '/doctor', label: 'Dashboard', end: true, activeFor: ['/doctor/patients'] },
  { to: '/doctor/escalations', label: 'Escalations' },
];

/** Search box in the doctor header: jumps to the patients list with the query. */
function DoctorSearch() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <form
      role="search"
      className="hidden xl:block"
      onSubmit={(e) => { e.preventDefault(); navigate(`/doctor/patients?q=${encodeURIComponent(q)}`); }}
    >
      <SearchInput value={q} onChange={setQ} placeholder="Search patients" tone="plain" inputClassName="w-40" />
    </form>
  );
}

/** Layout A: pill top nav (patient + doctor). Patients get a bottom tab bar under 768px. */
export function TopNavLayout() {
  const user = useCurrentUser();
  const isPatient = user?.role === 'patient';
  const location = useLocation();
  const fullScreenMobile = isPatient && location.pathname === '/patient/add-reading';

  return (
    <div className={cn('min-h-dvh bg-bg', isPatient ? 'text-base' : 'text-sm')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-surface">
        Skip to content
      </a>
      <div className={cn('mx-auto flex max-w-[1360px] flex-col gap-6 px-4 pt-5 pb-28 sm:px-8 sm:pt-7 md:pb-10', fullScreenMobile && 'max-md:p-0')}>
        <header className={cn('print-hide flex flex-wrap items-center justify-between gap-4', isPatient && 'max-md:hidden')}>
          <Brand to={isPatient ? '/patient' : '/doctor'} />
          <TopNav items={isPatient ? PATIENT_NAV : DOCTOR_NAV} aria-label="Main" size={isPatient ? 'lg' : 'md'} className="max-lg:order-last max-lg:w-full" />
          <div className="flex items-center gap-2.5">
            {!isPatient && <DoctorSearch />}
            <IconButton aria-label="Notifications" size={isPatient ? 48 : 44} icon={<Bell size={20} strokeWidth={1.8} />} />
            <UserMenu variant="chip" />
          </div>
        </header>
        <main id="main" className="flex min-w-0 flex-col gap-6">
          <Outlet />
          <ScrollRestoration />
        </main>
      </div>
      {isPatient && !fullScreenMobile && <PatientTabBar />}
    </div>
  );
}

function TabLink({ to, end, label, icon }: { to: string; end?: boolean; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-inner text-[13px] no-underline', focusRing,
        isActive ? 'font-semibold text-ink' : 'font-medium text-ink-muted',
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </NavLink>
  );
}

/** Mobile bottom tab bar: Home, Readings, Care team, Profile. */
function PatientTabBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <>
      <nav aria-label="App" className="print-hide fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface px-3 pt-2 pb-3.5 md:hidden">
        <TabLink to="/patient" end label="Home" icon={<House size={22} strokeWidth={1.8} />} />
        <TabLink to="/patient/readings" label="Readings" icon={<ChartLine size={22} strokeWidth={1.8} />} />
        <TabLink to="/patient/care-team" label="Care team" icon={<MessageSquare size={22} strokeWidth={1.8} />} />
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className={cn('flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-inner text-[13px] font-medium text-ink-muted', focusRing)}
        >
          <User size={22} strokeWidth={1.8} aria-hidden="true" />
          Profile
        </button>
      </nav>
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
