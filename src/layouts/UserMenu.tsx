import { LogOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { Avatar } from '@/components/ui/Avatar';
import { focusRing } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { toast } from '@/components/ui/Toaster';
import { useResetDemo, useSignOut } from '@/data/queries/auth';
import { useMyClinic } from '@/data/queries/admin';
import type { User } from '@/data/types';
import { cn } from '@/lib/cn';
import { nameWithCredential, roleLabel } from '@/lib/format';

export function userSubtitle(user: User, clinicSpecialty?: string): string {
  if (user.role === 'doctor') return clinicSpecialty ?? 'Doctor';
  if (user.role === 'nurse') return user.title === 'RN' || user.title === 'LVN' ? 'Call center · On shift' : roleLabel(user);
  return roleLabel(user);
}

function avatarTone(user: User) {
  if (user.role === 'super_admin') return 'platform' as const;
  return user.role === 'patient' ? 'patient' as const : 'staff' as const;
}

/** Avatar chip (top nav) or user card (sidebar) that opens Reset demo data / Sign out. */
export function UserMenu({ variant }: { variant: 'chip' | 'card' }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const reset = useResetDemo();
  const clinic = useMyClinic(user?.role === 'doctor');
  if (!user) return null;
  const isPatient = user.role === 'patient';
  const subtitle = userSubtitle(user, user.role === 'doctor' ? clinic.data?.clinic.specialty : undefined);

  const trigger = variant === 'chip' ? (
    <button
      type="button"
      aria-label={`Account menu for ${nameWithCredential(user)}`}
      className={cn('flex items-center gap-2.5 rounded-full border border-border bg-surface py-1 pr-4 pl-1 text-left hover:bg-subtle', focusRing)}
    >
      <Avatar firstName={user.firstName} lastName={user.lastName} size={isPatient ? 40 : 36} tone={avatarTone(user)} />
      <span className="flex flex-col">
        <span className={cn('font-semibold', isPatient ? 'text-[15px]' : 'text-[13px]')}>{nameWithCredential(user).replace(/, (RN|LVN)$/, '')}</span>
        {!isPatient && <span className="text-xs text-ink-muted">{subtitle}</span>}
      </span>
    </button>
  ) : (
    <button
      type="button"
      aria-label={`Account menu for ${nameWithCredential(user)}`}
      className={cn('flex w-full items-center gap-2.5 rounded-inner bg-bg p-3 text-left hover:bg-muted-bg', focusRing)}
    >
      <Avatar firstName={user.firstName} lastName={user.lastName} size={36} tone={avatarTone(user)} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-semibold">{nameWithCredential(user)}</span>
        <span className="truncate text-xs text-ink-muted">{subtitle}</span>
      </span>
    </button>
  );

  return (
    <Menu
      trigger={trigger}
      side={variant === 'card' ? 'top' : 'bottom'}
      align={variant === 'card' ? 'start' : 'end'}
      header={
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{nameWithCredential(user)}</span>
          <span className="text-xs text-ink-muted">{roleLabel(user)} · {user.email}</span>
        </div>
      }
      items={[
        {
          label: 'Reset demo data',
          icon: <RotateCcw size={16} />,
          onSelect: () => reset.mutate(undefined, {
            onSuccess: () => { navigate('/login', { replace: true }); toast('Demo data reset. You have been signed out.'); },
          }),
        },
        { label: 'Sign out', icon: <LogOut size={16} />, onSelect: () => { signOut(); navigate('/login', { replace: true }); } },
      ]}
    />
  );
}
