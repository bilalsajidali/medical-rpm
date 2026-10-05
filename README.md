# Medical RPM — Remote Patient Monitoring Platform

A clickable, fully working frontend MVP of a US **Remote Patient Monitoring (RPM)** SaaS for clinics.
Patients send blood pressure, pulse, oxygen and blood sugar readings twice a day; nurses act on
out-of-range alerts; doctors review escalations and trends; clinic admins run the monthly RPM
billing report; and a platform admin manages clinics and the audit log.

> **Prototype only.** There is no backend yet. All data is generated demo data stored in the
> browser (localStorage). Never enter real patient information.

---

## Features by role

| Role | What they can do |
|---|---|
| **Patient** | Home with next due reading, latest vitals (In range / Above range / Below range), trend chart with a healthy-range band, monthly progress, today's schedule and medications, care team with *Send a message* and *Request a call*, full reading history with *Download PDF* (print). Mobile layout with bottom tab bar. |
| **Nurse / call center** | Live alert queue (critical first, then oldest; refreshes every 15 s; waiting time ticks live), side panel with call, call outcome, live-conversation flag, notes, auto-starting billable timer, *Escalate to doctor* and *Save and close alert*. Missed-readings list with call logging, call log, personal time tracker, patient list and charts. |
| **Doctor** | Dashboard (critical/at-risk/adherence KPIs, featured escalated patient, *Needs review* table), own patients only, full patient chart (overview, readings, notes & calls, medical history, thresholds, time log), mark escalations reviewed, edit thresholds and medical history. |
| **Clinic admin** | Clinic overview KPIs, team management (invite, resend invite, edit role, disable), patient list with *Add patient* and CSV export, monthly billing report (CPT 99454 / 99445 / 99457 / 99458 / 99470) with filters and CSV export, clinic settings with default thresholds. |
| **Super admin** | All clinics with KPIs, *Add clinic* (onboarding + invited admin), manage drawer to pause/activate, platform-wide audit log with filters. |

### Business rules (in `src/lib/rules/`, unit tested)
- **Reading status:** each vital is compared with the patient's thresholds (critical → at-risk → normal); the reading takes the worst status and records every out-of-range vital.
- **Alerts:** every at-risk or critical reading opens an alert. Opening it assigns it to the nurse; escalating sends it to the patient's doctor; the doctor's review closes it.
- **Missed readings:** an active patient with no reading for more than 48 hours.
- **Billing (per patient, per calendar month):** reading days → 99454 (16+) or 99445 (2–15); staff minutes with at least one live conversation → 99457 (20+ min) plus 99458 per extra 20 min, or 99470 (10–19 min). Report only — no claims are sent.
- **Audit:** every write and every chart view is recorded.

---

## Tech stack

- React 19 + Vite + TypeScript (strict)
- Tailwind CSS v4 with design tokens in `src/styles/index.css` (`@theme`)
- React Router (data router, route-level code splitting, role guards)
- TanStack Query (all reads and writes) and TanStack Table
- Zustand + `persist` as the fake database
- Recharts, React Hook Form + Zod, Radix UI primitives (dialog, sheet, menu, tooltip), sonner, lucide-react, date-fns
- Vitest for the business rules and seed data

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run test` | Run the Vitest suite |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | oxlint |

Requires Node 20+ (see `.nvmrc`).

### Demo sign-in
On `/login`, use **Demo mode: sign in as** to enter instantly as any role:

| Role | Account |
|---|---|
| Patient | Mary Collins |
| Nurse | Nina Lopez, RN |
| Doctor | Dr. A. Patel |
| Clinic admin | Rachel Green |
| Super admin | Sam Avery |

Email + password sign-in also works with any password (e.g. `n.lopez@lakesidekidney.example`);
staff accounts then ask for a 6-digit code — any 6 digits pass.
**Reset demo data** in the user menu regenerates everything and signs you out.

The seed is deterministic and relative to today: 6 clinics, 40 patients at Lakeside Kidney Care
with 30 days of readings, four critical alerts waiting in today's queue, three patients with
missed readings, and a month of calls, notes and staff time for a realistic billing mix.

---

## Project structure

```
src/
  app/            router (routes + role guards), providers
  auth/           session store, RequireRole
  components/ui/  design-system components (Button, Card, StatusPill, DataTable, …)
  components/charts/  VitalTrendChart, Sparkline
  data/
    types.ts      domain types
    db.ts         Zustand store = fake database (persisted)
    api/          fake async API: role checks, clinic scoping, audit, 200–400 ms latency
    queries/      TanStack Query hooks used by screens
  features/       auth, patient, nurse, doctor, admin, super, chart (shared patient chart)
  layouts/        TopNavLayout (patient, doctor), SidebarLayout (nurse, admin, super)
  lib/            rules/, seed/, formatting, CSV, hooks
  styles/         Tailwind entry + design tokens
```

Screens never touch the store directly: **screens → `data/queries` → `data/api` → `data/db`**.
Every API function filters by the signed-in user's clinic (mimicking row-level security) and
throws `Forbidden` for the wrong role, so the `data/api` files can later be swapped for real
`fetch` calls to a backend without changing any screen.

## Deployment (AWS Amplify Hosting)

`amplify.yml` is included (`npm ci` → `npm run build` → `dist`). After connecting the GitHub
repo in the Amplify console, add this rewrite so deep links such as `/doctor/patients/p_01` work:

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
    "status": "200",
    "target": "/index.html",
    "condition": null
  }
]
```

## Accessibility & responsiveness

Real buttons and links, labelled inputs, `aria-label` on icon buttons, visible focus rings,
status always shown as dot + word (never color alone). Layouts are built for 390 px, 768 px and
1440 px; wide tables scroll inside their card.

## Roadmap

- FastAPI backend replacing `src/data/api/*`
- Real authentication with TOTP-based MFA
- Device integrations (cellular BP cuffs, glucometers, oximeters)
- HIPAA hosting and a signed AWS BAA before any real patient data
