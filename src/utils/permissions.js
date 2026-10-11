import { ROLES, APPOINTMENT_STATUS } from './constants.js'

/** Landing route for each role after login. */
export const ROLE_HOME = Object.freeze({
  [ROLES.PATIENT]: '/patient',
  [ROLES.DOCTOR]: '/doctor',
  [ROLES.ADMIN]: '/admin',
})

export function getRoleHome(role) {
  return ROLE_HOME[role] || '/'
}

/** Does the user hold one of the allowed roles? */
export function hasRole(user, roles = []) {
  if (!user) return false
  const list = Array.isArray(roles) ? roles : [roles]
  if (list.length === 0) return true
  return list.includes(user.role)
}

export function isPatient(user) {
  return user?.role === ROLES.PATIENT
}
export function isDoctor(user) {
  return user?.role === ROLES.DOCTOR
}
export function isAdmin(user) {
  return user?.role === ROLES.ADMIN
}

/**
 * A user may open an appointment when they are the admin, the doctor it is
 * booked with, or the patient who booked it.
 */
export function canManageAppointment(user, appointment) {
  if (!user || !appointment) return false
  if (user.role === ROLES.ADMIN) return true
  if (user.role === ROLES.DOCTOR && String(appointment.doctorId) === String(user.doctorId))
    return true
  if (user.role === ROLES.PATIENT && String(appointment.patientId) === String(user.id))
    return true
  return false
}

/** Only admins may edit the catalogue of doctors & departments. */
export function canManageCatalog(user) {
  return user?.role === ROLES.ADMIN
}

/** Patients can cancel/reschedule only while the visit is not past. */
export function canModifyAppointment(user, appointment) {
  if (!canManageAppointment(user, appointment)) return false
  if ([APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(appointment.status))
    return false
  if (user.role === ROLES.PATIENT && appointment.status === APPOINTMENT_STATUS.COMPLETED)
    return false
  return true
}

/** Which appointment statuses can this user transition to? */
export function allowedTransitions(user, appointment) {
  if (!user || !appointment) return []
  const { status } = appointment
  if (user.role === ROLES.PATIENT) {
    if ([APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(status))
      return [APPOINTMENT_STATUS.CANCELLED]
    return []
  }
  if (user.role === ROLES.DOCTOR) {
    if (status === APPOINTMENT_STATUS.PENDING)
      return [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.CANCELLED]
    if (status === APPOINTMENT_STATUS.CONFIRMED)
      return [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED]
    return []
  }
  // Admin
  return Object.values(APPOINTMENT_STATUS).filter((s) => s !== status)
}
