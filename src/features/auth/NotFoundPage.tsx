import { Link } from 'react-router';
import { HOME_BY_ROLE, useCurrentUser } from '@/auth/session';
import { Card } from '@/components/ui/Card';
import { focusRing } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { usePageTitle } from '@/lib/usePageTitle';
import { Brand } from '@/layouts/Brand';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  const user = useCurrentUser();
  const home = user ? HOME_BY_ROLE[user.role] : '/login';
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <Card padding="lg" className="flex w-full max-w-md flex-col gap-4">
        <Brand />
        <h1 className="m-0 font-display text-[30px] leading-[38px] font-semibold">Page not found</h1>
        <p className="m-0 text-[15px] text-ink-muted">This page does not exist or has moved.</p>
        <Link
          to={home}
          className={cn('inline-flex h-11 w-fit items-center rounded-full bg-ink px-5 text-sm font-semibold text-surface no-underline', focusRing)}
        >
          {user ? 'Go to my home' : 'Go to sign in'}
        </Link>
      </Card>
    </div>
  );
}
