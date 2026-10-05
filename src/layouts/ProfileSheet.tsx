import { LogOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toaster';
import { useResetDemo, useSignOut } from '@/data/queries/auth';

/** Mobile "Profile" tab for patients: who is signed in, reset demo, sign out. */
export function ProfileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const reset = useResetDemo();
  if (!user) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Profile">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Avatar firstName={user.firstName} lastName={user.lastName} size={64} />
          <div className="flex flex-col">
            <span className="font-display text-xl font-semibold">{user.firstName} {user.lastName}</span>
            <span className="text-base text-ink-muted">{user.email}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button size="lg" variant="secondary" block icon={<RotateCcw size={18} />} loading={reset.isPending}
            onClick={() => reset.mutate(undefined, { onSuccess: () => { navigate('/login', { replace: true }); toast('Demo data reset. You have been signed out.'); } })}
          >
            Reset demo data
          </Button>
          <Button size="lg" block icon={<LogOut size={18} />} onClick={() => { signOut(); navigate('/login', { replace: true }); }}>
            Sign out
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
