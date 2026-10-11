import { ApiError, request, store, toPublicUser, uid } from './api.js'
import { APPOINTMENT_STATUS, ROLES } from '../utils/constants.js'
import { addDays, parseISODate, toISODate } from '../utils/formatDate.js'

/** Admin analytics, user management and reporting. */

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export async function getDashboardStats() {
  return request(() => {
    const appointments = store.all('appointments')
    const doctors = store.all('doctors')
    const patients = store.find('users', (u) => u.role === ROLES.PATIENT)
    const departments = store.all('departments')
    const today = toISODate(new Date())
    const in7 = addDays(new Date(), 7)

    const completed = appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED)
    const revenue = completed.reduce((sum, a) => {
      const doctor = store.findById('doctors', a.doctorId)
      return sum + (doctor?.fee || 0)
    }, 0)

    const byDepartment = departments
      .map((dep) => ({
        id: dep.id,
        name: dep.name,
        icon: dep.icon,
        doctors: doctors.filter((d) => d.departmentId === dep.id).length,
        appointments: appointments.filter((a) => a.departmentId === dep.id).length,
      }))
      .sort((a, b) => b.appointments - a.appointments)

    return {
      totalAppointments: appointments.length,
      todayAppointments: appointments.filter((a) => a.date === today).length,
      upcomingWeek: appointments.filter((a) => a.date >= today && a.date <= in7 && a.status !== APPOINTMENT_STATUS.CANCELLED).length,
      pending: appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length,
      confirmed: appointments.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length,
      completed: completed.length,
      cancelled: appointments.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length,
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter((d) => d.status === 'active').length,
      totalPatients: patients.length,
      totalDepartments: departments.length,
      newPatientsThisMonth: patients.filter((p) => (p.createdAt || '').slice(0, 7) === monthKey(new Date())).length,
      estimatedRevenue: revenue,
      byDepartment,
    }
  })
}

export async function getUsers({ role = 'all', search = '' } = {}) {
  return request(() => {
    let list = store.all('users').map(toPublicUser)
    if (role !== 'all') list = list.filter((u) => u.role === role)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  })
}

export async function getPatients({ search = '' } = {}) {
  return request(() => {
    let patients = store.find('users', (u) => u.role === ROLES.PATIENT)
    if (search) {
      const q = search.toLowerCase()
      patients = patients.filter(
        (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
      )
    }
    return patients
      .map((p) => {
        const history = store.find('appointments', (a) => a.patientId === p.id)
        return {
          ...toPublicUser(p),
          appointments: history.length,
          lastVisit: history
            .map((a) => a.date)
            .sort()
            .reverse()[0] || null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  })
}

export async function updateUser(id, patch) {
  return request(() => {
    const updated = store.update('users', id, patch)
    if (!updated) throw new ApiError('User not found.', { status: 404 })
    return toPublicUser(updated)
  })
}

export async function deleteUser(id) {
  return request(() => {
    const user = store.findById('users', id)
    if (!user) throw new ApiError('User not found.', { status: 404 })
    if (user.role === ROLES.ADMIN) throw new ApiError('You cannot delete an administrator.', { status: 403 })
    store.remove('users', id)
    store.find('appointments', (a) => a.patientId === id).forEach((a) => store.remove('appointments', a.id))
    return { success: true }
  })
}

export async function getRecentActivity(limit = 6) {
  return request(() =>
    store
      .all('appointments')
      .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
      .slice(0, limit)
      .map((a) => {
        const doctor = store.findById('doctors', a.doctorId)
        const patient = store.findById('users', a.patientId)
        return {
          id: a.id,
          patientName: patient?.name || 'Unknown',
          doctorName: doctor ? `${doctor.title} ${doctor.name}` : 'Unassigned',
          date: a.date,
          time: a.time,
          status: a.status,
          updatedAt: a.updatedAt || a.createdAt,
        }
      }),
  )
}

export async function getReports({ months = 6 } = {}) {
  return request(() => {
    const appointments = store.all('appointments')
    const doctors = store.all('doctors')
    const departments = store.all('departments')

    // Appointments per month for the trailing window.
    const series = []
    const cursor = new Date()
    cursor.setDate(1)
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1)
      const key = monthKey(d)
      const inMonth = appointments.filter((a) => (a.date || '').slice(0, 7) === key)
      series.push({
        key,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total: inMonth.length,
        completed: inMonth.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
        cancelled: inMonth.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length,
      })
    }

    const statusBreakdown = Object.values(APPOINTMENT_STATUS).map((status) => ({
      status,
      count: appointments.filter((a) => a.status === status).length,
    }))

    const departmentShare = departments
      .map((dep) => {
        const count = appointments.filter((a) => a.departmentId === dep.id).length
        return { name: dep.name, icon: dep.icon, color: dep.color, count }
      })
      .sort((a, b) => b.count - a.count)

    const doctorLoad = doctors
      .map((d) => ({
        id: d.id,
        name: `${d.title} ${d.name}`,
        avatar: d.avatar,
        department: store.findById('departments', d.departmentId)?.name || '—',
        total: appointments.filter((a) => a.doctorId === d.id).length,
        completed: appointments.filter((a) => a.doctorId === d.id && a.status === APPOINTMENT_STATUS.COMPLETED).length,
        revenue: appointments.filter((a) => a.doctorId === d.id && a.status === APPOINTMENT_STATUS.COMPLETED).length * (d.fee || 0),
      }))
      .sort((a, b) => b.total - a.total)

    const revenue = doctorLoad.reduce((sum, d) => sum + d.revenue, 0)
    const completedCount = appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length
    const cancelledCount = appointments.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length
    const cancellationRate = appointments.length
      ? Math.round((cancelledCount / appointments.length) * 100)
      : 0

    return {
      series,
      statusBreakdown,
      departmentShare,
      doctorLoad,
      totals: {
        appointments: appointments.length,
        completed: completedCount,
        cancelled: cancelledCount,
        cancellationRate,
        revenue,
        avgFee: completedCount ? Math.round(revenue / completedCount) : 0,
      },
    }
  })
}

/* ---------------------------- contact messages --------------------------- */

export async function submitContactMessage({ name, email, subject, message }) {
  return request(() => {
    const record = store.insert('contactMessages', {
      id: uid('msg'),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    })
    return { success: true, id: record.id }
  })
}

export async function getContactMessages() {
  return request(() =>
    store.all('contactMessages').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
}

export async function updateContactMessage(id, patch) {
  return request(() => {
    const updated = store.update('contactMessages', id, patch)
    if (!updated) throw new ApiError('Message not found.', { status: 404 })
    return updated
  })
}

export async function deleteContactMessage(id) {
  return request(() => {
    const ok = store.remove('contactMessages', id)
    if (!ok) throw new ApiError('Message not found.', { status: 404 })
    return { success: true }
  })
}

/** Compare helper exported for pages that build their own summaries. */
export function appointmentsOn(date) {
  return store.find('appointments', (a) => a.date === toISODate(date))
}

export const _helpers = { parseISODate }
