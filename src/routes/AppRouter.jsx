import { Routes, Route } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout.jsx'
import PatientLayout from '../components/layout/PatientLayout.jsx'
import DoctorLayout from '../components/layout/DoctorLayout.jsx'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx'

// Public pages
import Home from '../pages/public/Home.jsx'
import About from '../pages/public/About.jsx'
import Departments from '../pages/public/Departments.jsx'
import DepartmentDetails from '../pages/public/DepartmentDetails.jsx'
import Doctors from '../pages/public/Doctors.jsx'
import DoctorDetails from '../pages/public/DoctorDetails.jsx'
import Contact from '../pages/public/Contact.jsx'
import NotFound from '../pages/public/NotFound.jsx'

// Auth pages
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import ForgotPassword from '../pages/auth/ForgotPassword.jsx'
import ResetPassword from '../pages/auth/ResetPassword.jsx'

// Patient pages
import PatientDashboard from '../pages/patient/PatientDashboard.jsx'
import BookAppointment from '../pages/patient/BookAppointment.jsx'
import MyAppointments from '../pages/patient/MyAppointments.jsx'
import AppointmentDetails from '../pages/patient/AppointmentDetails.jsx'
import PatientProfile from '../pages/patient/PatientProfile.jsx'
import Notifications from '../pages/patient/Notifications.jsx'

// Doctor pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx'
import DoctorAppointments from '../pages/doctor/DoctorAppointments.jsx'
import DoctorAvailability from '../pages/doctor/DoctorAvailability.jsx'
import DoctorSchedule from '../pages/doctor/DoctorSchedule.jsx'
import DoctorProfile from '../pages/doctor/DoctorProfile.jsx'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminReports from '../pages/admin/AdminReports.jsx'
import AdminAppointments from '../pages/admin/AdminAppointments.jsx'
import AdminDoctors from '../pages/admin/AdminDoctors.jsx'
import AdminPatients from '../pages/admin/AdminPatients.jsx'
import AdminDepartments from '../pages/admin/AdminDepartments.jsx'
import AdminSchedules from '../pages/admin/AdminSchedules.jsx'
import AdminUsers from '../pages/admin/AdminUsers.jsx'
import AdminMessages from '../pages/admin/AdminMessages.jsx'

// Error pages
import Unauthorized from '../pages/errors/Unauthorized.jsx'
import ServerError from '../pages/errors/ServerError.jsx'

import { ROLES } from '../utils/constants.js'

/**
 * Route table for the whole application.
 * Public site lives under <PublicLayout>, each role gets its own shell, and
 * protected branches are guarded by <ProtectedRoute>.
 */
export default function AppRouter() {
  return (
    <Routes>
      {/* ---------------------------- public site --------------------------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/departments/:slug" element={<DepartmentDetails />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/server-error" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ------------------------------ patients ----------------------------- */}
      <Route element={<ProtectedRoute roles={[ROLES.PATIENT]} />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/book" element={<BookAppointment />} />
          <Route path="/patient/appointments" element={<MyAppointments />} />
          <Route path="/patient/appointments/:id" element={<AppointmentDetails />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/notifications" element={<Notifications />} />
        </Route>
      </Route>

      {/* ------------------------------- doctors ------------------------------ */}
      <Route element={<ProtectedRoute roles={[ROLES.DOCTOR]} />}>
        <Route element={<DoctorLayout />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/availability" element={<DoctorAvailability />} />
          <Route path="/doctor/schedule" element={<DoctorSchedule />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
        </Route>
      </Route>

      {/* -------------------------------- admins ------------------------------ */}
      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/patients" element={<AdminPatients />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/schedules" element={<AdminSchedules />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
        </Route>
      </Route>
    </Routes>
  )
}