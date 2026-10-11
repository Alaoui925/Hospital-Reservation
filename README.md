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
- Department catalogue with details pages (`/departments/:slug`)
- Doctor directory with search, filters, sorting and pagination (`/doctors`)
- Doctor profiles with live availability and slot picker (`/doctors/:id`)
- About & contact pages (contact submissions land in the admin inbox)

### Patients
- Book an appointment: department → doctor → date → slot (deep-linkable via
  `/patient/book?doctor=&date=&time=` or `/doctors?search=&department=`)
- My appointments with confirm / reschedule / cancel flows
- Appointment details timeline, notifications feed, profile & password management

### Doctors
- Dashboard with today's schedule & upcoming visits
- Confirm `/` complete `/` cancel appointments
- Availability editor (clinic days + half-hour slots)
- Weekly schedule view; profile editing

### Administrators
- Overview dashboard with KPIs and recent activity
- Reports: monthly volume chart, status breakdown, department share, doctor workload
- Manage appointments (change status, cancel, reassign doctor)
- CRUD for doctors, departments; patient & user records; doctor schedules
- Contact message inbox

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

- The mock database lives under the `medicare:hospital-db:v1` key in
  `localStorage` and is seeded relative to *today* so demos always look current.
- `resetDB()` / `wipeDB()` in `src/services/api.js` re-seed / clear the store
  (useful for a "reset demo data" button).
- Dates are handled as local-time `YYYY-MM-DD` strings via `src/utils/formatDate.js`.