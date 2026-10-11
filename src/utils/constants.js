/**
 * Application-wide constants.
 * Importing this module keeps magic strings and shared lists in one place.
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MediCare Hospital'

export const HOSPITAL = {
  name: 'MediCare Hospital',
  tagline: 'Care you can count on, booked in seconds.',
  phone: import.meta.env.VITE_HOSPITAL_PHONE || '+1 (555) 010-2000',
  emergencyPhone: '+1 (555) 010-9111',
  email: import.meta.env.VITE_HOSPITAL_EMAIL || 'contact@medicare-hospital.test',
  address: '24 Riverside Medical Park, Springfield, IL 62704',
  hours: [
    { label: 'Monday – Friday', value: '08:00 – 20:00' },
    { label: 'Saturday', value: '09:00 – 17:00' },
    { label: 'Sunday', value: '10:00 – 15:00 (Emergency only)' },
  ],
  social: [
    { label: 'Facebook', href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Instagram', href: '#' },
  ],
}

/** User roles supported by the application. */
export const ROLES = Object.freeze({
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
})

export const ROLE_LABELS = Object.freeze({
  [ROLES.PATIENT]: 'Patient',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.ADMIN]: 'Administrator',
})

/** Appointment lifecycle. */
export const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
})

export const STATUS_META = Object.freeze({
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
})

export const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Half-hour consultation slots used across schedules and the booking form. */
export const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30 // 09:00 -> 17:30
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const m = String(totalMinutes % 60).padStart(2, '0')
  return `${h}:${m}`
})

export const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say']

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const SORT_OPTIONS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'fee-asc', label: 'Fee (low to high)' },
  { value: 'fee-desc', label: 'Fee (high to low)' },
  { value: 'experience', label: 'Most experienced' },
]

export const DOCTORS_PER_PAGE = 6

/** Primary navigation for the public site. */
export const PUBLIC_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/departments', label: 'Departments' },
  { to: '/doctors', label: 'Find a Doctor' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export const PATIENT_NAV = [
  { to: '/patient', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/patient/book', label: 'Book appointment', icon: 'calendar-plus' },
  { to: '/patient/appointments', label: 'My appointments', icon: 'calendar' },
  { to: '/patient/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/patient/profile', label: 'Profile', icon: 'user' },
]

export const DOCTOR_NAV = [
  { to: '/doctor', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/doctor/appointments', label: 'Appointments', icon: 'calendar' },
  { to: '/doctor/availability', label: 'Availability', icon: 'clock' },
  { to: '/doctor/schedule', label: 'Schedule', icon: 'list' },
  { to: '/doctor/profile', label: 'My profile', icon: 'user' },
]

export const ADMIN_NAV = [
  { section: 'Overview' },
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/reports', label: 'Reports', icon: 'chart' },
  { section: 'Manage' },
  { to: '/admin/appointments', label: 'Appointments', icon: 'calendar' },
  { to: '/admin/doctors', label: 'Doctors', icon: 'stethoscope' },
  { to: '/admin/patients', label: 'Patients', icon: 'users' },
  { to: '/admin/departments', label: 'Departments', icon: 'building' },
  { to: '/admin/schedules', label: 'Schedules', icon: 'clock' },
  { section: 'Support' },
  { to: '/admin/users', label: 'Users', icon: 'user' },
  { to: '/admin/messages', label: 'Messages', icon: 'message' },
]

/** Demo credentials surfaced on the login screen. */
export const DEMO_ACCOUNTS = [
  { role: 'patient', label: 'Patient', email: 'sara.ahmed@mail.test', password: 'patient123' },
  { role: 'doctor', label: 'Doctor', email: 'aisha.khan@medicare.test', password: 'doctor123' },
  { role: 'admin', label: 'Admin', email: 'admin@medicare.test', password: 'admin123' },
]

export const CONSULTATION_TYPES = [
  { value: 'in-person', label: 'In person' },
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone call' },
]

/** Phosphor icon keys admins can pick for a department (see components/common/Icon). */
export const DEPARTMENT_ICONS = [
  { value: 'heartbeat', label: 'Heartbeat' },
  { value: 'baby', label: 'Baby' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'brain', label: 'Brain' },
  { value: 'bone', label: 'Bone' },
  { value: 'tooth', label: 'Tooth' },
  { value: 'eye', label: 'Eye' },
  { value: 'stethoscope', label: 'Stethoscope' },
  { value: 'heart', label: 'Heart' },
  { value: 'first-aid', label: 'First aid' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'pill', label: 'Pill' },
  { value: 'thermometer', label: 'Thermometer' },
  { value: 'activity', label: 'Activity' },
]
