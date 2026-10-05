import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { HOME_BY_ROLE, useCurrentUser } from '@/auth/session';
import { RequireRole } from '@/auth/RequireRole';
import { SkeletonRows } from '@/components/ui/States';
import type { Role } from '@/data/types';
import { SidebarLayout } from '@/layouts/SidebarLayout';
import { TopNavLayout } from '@/layouts/TopNavLayout';

type PageModule = { default: ComponentType };

/** Route-level code splitting: each page is its own chunk. */
const page = (load: () => Promise<PageModule>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
});

function RootRedirect() {
  const user = useCurrentUser();
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}

function guarded(roles: Role[], layout: 'top' | 'side', children: RouteObject[]): RouteObject {
  const Layout = layout === 'top' ? TopNavLayout : SidebarLayout;
  return {
    element: <RequireRole roles={roles}><Layout /></RequireRole>,
    hydrateFallbackElement: <SkeletonRows />,
    children,
  };
}

const routes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  { path: '/login', ...page(() => import('@/features/auth/LoginPage')) },

  guarded(['patient'], 'top', [
    { path: '/patient', ...page(() => import('@/features/patient/PatientHomePage')) },
    { path: '/patient/add-reading', ...page(() => import('@/features/patient/AddReadingPage')) },
    { path: '/patient/readings', ...page(() => import('@/features/patient/PatientReadingsPage')) },
    { path: '/patient/care-team', ...page(() => import('@/features/patient/CareTeamPage')) },
  ]),

  guarded(['nurse'], 'side', [
    { path: '/nurse', ...page(() => import('@/features/nurse/AlertQueuePage')) },
    { path: '/nurse/missed', ...page(() => import('@/features/nurse/MissedReadingsPage')) },
    { path: '/nurse/calls', ...page(() => import('@/features/nurse/CallLogPage')) },
    { path: '/nurse/time', ...page(() => import('@/features/nurse/TimeTrackerPage')) },
    { path: '/nurse/patients', ...page(() => import('@/features/chart/PatientsListPage')) },
    { path: '/nurse/patients/:id', ...page(() => import('@/features/chart/PatientChartPage')) },
  ]),

  guarded(['doctor'], 'top', [
    { path: '/doctor', ...page(() => import('@/features/doctor/DoctorDashboardPage')) },
    { path: '/doctor/patients', ...page(() => import('@/features/chart/PatientsListPage')) },
    { path: '/doctor/patients/:id', ...page(() => import('@/features/chart/PatientChartPage')) },
    { path: '/doctor/escalations', ...page(() => import('@/features/doctor/EscalationsPage')) },
  ]),

  guarded(['clinic_admin'], 'side', [
    { path: '/admin', ...page(() => import('@/features/admin/AdminOverviewPage')) },
    { path: '/admin/team', ...page(() => import('@/features/admin/TeamPage')) },
    { path: '/admin/patients', ...page(() => import('@/features/chart/PatientsListPage')) },
    { path: '/admin/billing', ...page(() => import('@/features/admin/BillingPage')) },
    { path: '/admin/settings', ...page(() => import('@/features/admin/SettingsPage')) },
  ]),

  guarded(['super_admin'], 'side', [
    { path: '/super', ...page(() => import('@/features/super/ClinicsPage')) },
    { path: '/super/audit', ...page(() => import('@/features/super/AuditLogPage')) },
  ]),

  ...(import.meta.env.DEV ? [{ path: '/dev/ui', ...page(() => import('@/features/dev/UiKitPage')) }] : []),

  { path: '*', ...page(() => import('@/features/auth/NotFoundPage')) },
];

export const router = createBrowserRouter(routes);
