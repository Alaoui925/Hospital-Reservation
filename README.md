# 🏥 MediCare Hospital — Appointment Reservation Platform

A fully client-side hospital booking application built with **React + Vite**.
Patients discover departments and doctors, book appointments against real-time
availability, and track their visits. Doctors manage their schedules and confirm
bookings. Administrators run the whole hospital from a dedicated console.

> Everything runs in the browser against a mock API backed by `localStorage` —
> no server is required. Swapping in a real backend later only touches the
> service layer in `src/services`.

---

## ✨ Features

### Public site
- Landing page with hero, search, departments and top-rated doctors
- Department catalogue — same icon-card design as the landing page — with
  details pages (`/departments/:slug`)
- Doctor directory with search, filters, sorting and pagination (`/doctors`)
- Doctor profiles with live availability, slot picker and **real patient
  reviews** (`/doctors/:id`)
- About & contact pages (contact submissions land in the admin inbox)
- Patient & doctor registration (doctor sign-ups are applications reviewed
  by an administrator)

### Patients
- Book an appointment: department → doctor → date → slot (deep-linkable via
  `/patient/book?doctor=&date=&time=` or `/doctors?search=&department=`)
- My appointments with confirm / reschedule / cancel flows
- **Medical records page** (`/patient/records`): diagnosis, prescription and
  care instructions for every completed visit
- **Profile photo upload** (client-side square crop + downscale)
- Appointment details timeline, notifications feed, password management

### Doctors
- Dashboard with today's schedule & upcoming visits
- Confirm `/` complete `/` cancel appointments
- **File visit reports** (diagnosis, prescription, follow-up) on completed visits
- Availability editor (clinic days + half-hour slots)
- Weekly schedule view; profile editing with photo upload

### Administrators
- Overview dashboard with KPIs, pending-application counter and recent activity
- Reports: monthly volume chart, status breakdown, department share, doctor workload
- Manage appointments (change status, cancel, reassign doctor)
- CRUD for doctors, departments; patient & user records; doctor schedules
- **Doctor application review queue** (`/admin/applications`) — approve
  provisions the account & listing, reject records a reason
- Contact message inbox

## 🔐 Email verification & social login

New patient sign-ups verify their email with a **6-digit code** before their
account is active; the flow state shows as an amber banner while unverified and
booking unlocks once the code is accepted. Google / GitHub / Facebook
sign-in buttons live on the login page — social accounts are always patients and
arrive auto-verified. Admin and doctor accounts stay manual (approved via the
admin console).

Two modes, switched by one env var (`.env.local`):

| Mode | `VITE_AUTH_MODE` | Emails | Social buttons |
|---|---|---|---|
| Demo fallback *(default)* | `demo` | simulated — the code appears in a "Demo mailbox" box on the verify screen | disabled with an explanatory hint |
| Supabase | `supabase` | real 6-digit code emails (Supabase Email OTP) | live OAuth (Google / GitHub / Facebook) |

### Enable Supabase (real emails + social login)

1. Create a free project at [supabase.com](https://supabase.com) and copy the
   **Project URL** and **anon public key** (Project Settings → API).
2. Auth configuration in the dashboard:
   - **Authentication → Sign In / Up → Email**: turn **"Confirm email" OFF**
     (the app's own 6-digit flow is the verification step).
   - **Authentication → Emails**: use the **Magic Link** template with a
     `{{ .Token }}` body so the mail contains the 6-digit code.
3. Add the providers under **Authentication → Providers** — Google (client
   ID/secret from [console.cloud.google.com](https://console.cloud.google.com)),
   GitHub (OAuth app), Facebook (Meta developer app). Facebook/GitHub apps need
   the real production domain, so they are optional for localhost demos.
   For localhost, set the Site URL to `http://localhost:5173` under
   **Authentication → URL Configuration**.
4. Put the two values in `.env.local` and set `VITE_AUTH_MODE=supabase`, then
   restart `npm run dev`.

`VITE_SUPABASE_URL=…` and `VITE_SUPABASE_ANON_KEY=…` are public client-side
values; secrets (provider client secrets) are stored only in the Supabase
dashboard.

## 🔑 Demo accounts

| Role | Email | Password |
| ---- | ----- | -------- |
| Patient | `sara.ahmed@mail.test` | `patient123` |
| Doctor | `aisha.khan@medicare.test` | `doctor123` |
| Admin | `admin@medicare.test` | `admin123` |

The login page includes click-to-fill buttons for these accounts. A freshly
created doctor account is seeded with the password `doctor123`.

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # production build into dist/
npm run preview  # serve the production build
npm run lint     # ESLint
```

## 🧩 Tech stack

- **React 18** + **react-router-dom 6**
- **Vite 5** with an `@` → `src` alias
- Plain CSS design system in `src/assets/styles/index.css` (no UI framework)
- Icons from **Phosphor Icons** (`@phosphor-icons/react`), wrapped by `src/components/common/Icon.jsx`
- Mock API in `src/services/*` persisted through `localStorage`

## 🗂 Project structure

```
public/                     static assets (favicon, logo, hero, doctor avatars)
src/
  assets/styles/index.css   design system (tokens, components, utilities)
  components/
    common/                 Button, Input, Select, Modal, ConfirmDialog, …
    layout/                 Navbar, Footer, Sidebar, role shells, ProtectedRoute
    doctors/                DoctorCard, DoctorFilters, AvailabilitySlots, …
    appointments/           AppointmentForm, AppointmentTable, RescheduleDialog, …
    dashboard/              StatCard, DashboardHeader, RecentAppointments
  context/                  AuthContext, NotificationContext (toasts + feed)
  hooks/                    useAuth, useDoctors, useAppointments
  pages/
    public/  auth/  patient/  doctor/  admin/  errors/
  routes/AppRouter.jsx      the whole route table
  services/                 API layer (auth, doctors, appointments, admin, …)
  utils/                    constants, date helpers, validation, permissions
```

## 🌐 Swapping the mock API for a real backend

Every page imports from `src/services/*`. Each service returns promises and
shares latency + persistence primitives from `src/services/api.js`. To go live:

1. Keep the function signatures (`login`, `getDoctors`, `createAppointment`, …).
2. Replace each function body with `fetch(`${API_URL}/…`)`.
3. Type-check the response shapes documented in `src/services/mockData.js`.

No component, hook, or route needs to change.

## ℹ️ Notes

- The mock database lives under the `medicare:hospital-db:v3` key in
  `localStorage` and is seeded relative to *today* so demos always look current.
- A "Reset demo data" button on the login page calls `resetDemoData()`
  (which wipes and re-seeds the store — see `src/services/api.js`).
- Doctor ratings are computed live from the `reviews` collection; a review is
  one per patient per doctor.
- Doctor registrations from the public form are stored as `doctorApplications`
  and become real accounts only when an administrator approves them.
- Dates are handled as local-time `YYYY-MM-DD` strings via `src/utils/formatDate.js`.