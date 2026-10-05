import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { HOME_BY_ROLE, useCurrentUser } from '@/auth/session';
import { Button, focusRing } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toaster';
import { useCheckCredentials, useCompleteSignIn, useDemoSignIn, useVerifyMfa } from '@/data/queries/auth';
import type { Role, User } from '@/data/types';
import { cn } from '@/lib/cn';
import { usePageTitle } from '@/lib/usePageTitle';
import { Brand } from '@/layouts/Brand';

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
const mfaSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.') });

const DEMO_ROLES: { role: Role; label: string }[] = [
  { role: 'patient', label: 'Patient' },
  { role: 'nurse', label: 'Nurse' },
  { role: 'doctor', label: 'Doctor' },
  { role: 'clinic_admin', label: 'Clinic Admin' },
  { role: 'super_admin', label: 'Super Admin' },
];

function HeroPanel() {
  return (
    <div className="m-4 flex flex-[1_1_520px] flex-col justify-between gap-12 rounded-[24px] bg-ink p-8 text-surface sm:p-12">
      <Brand size="lg" inverse />
      <div className="flex max-w-[520px] flex-col gap-5">
        <h1 className="m-0 font-display text-[34px] leading-[42px] font-semibold tracking-[-0.02em] sm:text-[44px] sm:leading-[52px]">
          Every reading seen. Every patient followed up.
        </h1>
        <p className="m-0 text-[17px] leading-[26px] text-surface/75">
          Remote patient monitoring for US clinics. Patients send readings twice a day, nurses act on alerts, and doctors see the full picture.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 rounded-2xl bg-surface/8 p-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-critical-bg">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-critical" />Critical
          </span>
          <span className="text-sm text-surface/85">Live alerts to nurses</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-surface/8 p-4">
          <span className="text-[13px] font-semibold">Trends</span>
          <span className="text-sm text-surface/85">30-day charts per patient</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-surface/8 p-4">
          <span className="text-[13px] font-semibold">Billing</span>
          <span className="text-sm text-surface/85">Monthly eligibility report</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  usePageTitle('Sign in');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaUser, setMfaUser] = useState<User | null>(null);
  const check = useCheckCredentials();
  const verify = useVerifyMfa();
  const complete = useCompleteSignIn();
  const demo = useDemoSignIn();

  const creds = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: 'n.lopez@lakesidekidney.example', password: 'password123' },
  });
  const mfa = useForm<z.infer<typeof mfaSchema>>({ resolver: zodResolver(mfaSchema), defaultValues: { code: '' } });

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    const home = HOME_BY_ROLE[user.role];
    return <Navigate to={from && from.startsWith(home) ? from : home} replace />;
  }

  const finish = async (id: string) => {
    const u = await complete.mutateAsync(id);
    navigate(HOME_BY_ROLE[u.role], { replace: true });
  };

  const onCredentials = creds.handleSubmit(async ({ email }) => {
    try {
      const result = await check.mutateAsync(email);
      if (result.needsMfa) setMfaUser(result.user);
      else await finish(result.user.id);
    } catch (e) {
      creds.setError('email', { message: e instanceof Error ? e.message : 'Sign-in failed.' });
    }
  });

  const onMfa = mfa.handleSubmit(async ({ code }) => {
    try {
      await verify.mutateAsync(code);
      await finish(mfaUser!.id);
    } catch (e) {
      mfa.setError('code', { message: e instanceof Error ? e.message : 'Invalid code.' });
    }
  });

  const signInAs = async (role: Role) => {
    try {
      const u = await demo.signInAs(role);
      navigate(HOME_BY_ROLE[u.role], { replace: true });
    } catch {
      toast('That demo account is not available. Try Reset demo data.');
    }
  };

  return (
    <div className="flex min-h-dvh flex-wrap bg-bg">
      <HeroPanel />
      <main className="flex flex-[1_1_480px] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[440px] flex-col gap-6">
          {mfaUser ? (
            <form onSubmit={onMfa} className="flex flex-col gap-6" noValidate>
              <div className="flex flex-col gap-2">
                <h2 className="m-0 font-display text-[30px] leading-[38px] font-semibold">Two-factor code</h2>
                <p className="m-0 text-[15px] text-ink-muted">Enter the 6-digit code from your authenticator app for {mfaUser.email}. Any 6 digits work in the prototype.</p>
              </div>
              <TextField
                label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                className="[&_input]:h-12 [&_input]:text-center [&_input]:font-display [&_input]:text-2xl [&_input]:tracking-[0.3em]"
                error={mfa.formState.errors.code?.message} {...mfa.register('code')}
              />
              <Button type="submit" size="lg" block loading={verify.isPending || complete.isPending} className="text-base">Verify and sign in</Button>
              <button type="button" onClick={() => { setMfaUser(null); mfa.reset(); }} className={cn('self-start rounded-full text-sm font-medium text-accent', focusRing)}>
                Use a different account
              </button>
            </form>
          ) : (
            <form onSubmit={onCredentials} className="flex flex-col gap-6" noValidate>
              <div className="flex flex-col gap-2">
                <h2 className="m-0 font-display text-[30px] leading-[38px] font-semibold">Sign in</h2>
                <p className="m-0 text-[15px] text-ink-muted">Use the email your clinic registered for you.</p>
              </div>
              <TextField label="Email" type="email" autoComplete="email" className="[&_input]:h-12"
                error={creds.formState.errors.email?.message} {...creds.register('email')} />
              <div className="relative">
                <TextField label="Password" type="password" autoComplete="current-password" className="[&_input]:h-12"
                  error={creds.formState.errors.password?.message} {...creds.register('password')} />
                <button
                  type="button"
                  onClick={() => toast('Password reset is not part of the prototype. Any password works.')}
                  className={cn('absolute top-0 right-0 rounded-full text-sm font-medium text-accent hover:text-accent-ink', focusRing)}
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" size="lg" block loading={check.isPending || complete.isPending} className="text-base">Sign in</Button>
              <p className="m-0 text-[13px] leading-[19px] text-ink-muted">Staff accounts need a 6-digit code from an authenticator app after sign-in.</p>
            </form>
          )}

          <div className="flex flex-col gap-3 rounded-card border border-dashed border-border-strong bg-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Demo mode: sign in as</span>
              <Badge variant="neutral">Prototype only</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_ROLES.map(({ role, label }) => (
                <button
                  key={role}
                  type="button"
                  disabled={demo.isPending}
                  onClick={() => void signInAs(role)}
                  className={cn(
                    'h-10 rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors',
                    'hover:border-accent hover:bg-accent/8 hover:font-semibold hover:text-accent disabled:opacity-50', focusRing,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
