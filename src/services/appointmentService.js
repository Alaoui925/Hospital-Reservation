import { ApiError, request, store, uid } from './api.js'
import { APPOINTMENT_STATUS } from '../utils/constants.js'
import { isPast, toISODate } from '../utils/formatDate.js'

/** Appointment booking, querying and status management. */

const nowISO = () => new Date().toISOString()

/** Attach the resolved doctor / patient / department to a raw appointment. */
export function decorateAppointment(appt) {
  const doctor = store.findById('doctors', appt.doctorId)
  const patient = store.findById('users', appt.patientId)
  const department = store.findById('departments', appt.departmentId)
  return {
    ...appt,
    doctorName: doctor ? `${doctor.title} ${doctor.name}` : 'Unassigned doctor',
    doctorAvatar: doctor?.avatar || null,
    doctorSpecialty: doctor?.specialty || '—',
    doctorFee: doctor?.fee ?? 0,
    doctorPhone: doctor?.phone || '',
    patientName: patient?.name || 'Unknown patient',
    patientEmail: patient?.email || '',
    patientPhone: patient?.phone || '',
    patientAvatar: patient?.avatar || null,
    departmentName: department?.name || 'General',
    departmentIcon: department?.icon || 'hospital',
    isPast: isPast(appt.date, appt.time),
  }
}

function notify(userId, { title, message, type = 'info' }) {
  if (!userId) return
  store.insert('notifications', {
    id: uid('not'),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: nowISO(),
  })
}

/* ------------------------------- queries -------------------------------- */

export async function queryAppointments({
  patientId,
  doctorId,
  status = 'all',
  scope = 'all',
  search = '',
  sort = 'date-asc',
} = {}) {
  return request(() => {
    let list = store.all('appointments').map(decorateAppointment)

    if (patientId) list = list.filter((a) => a.patientId === patientId)
    if (doctorId) list = list.filter((a) => a.doctorId === doctorId)
    if (status && status !== 'all') list = list.filter((a) => a.status === status)

    const today = toISODate(new Date())
    if (scope === 'upcoming') {
      list = list.filter((a) => a.date >= today && a.status !== 'cancelled' && a.status !== 'completed')
    } else if (scope === 'today') {
      list = list.filter((a) => a.date === today && a.status !== 'cancelled')
    } else if (scope === 'past') {
      list = list.filter((a) => a.date < today || a.status === 'completed' || a.status === 'cancelled')
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.departmentName.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q),
      )
    }

    const sorters = {
      'date-asc': (a, b) => (a.date + a.time).localeCompare(b.date + b.time),
      'date-desc': (a, b) => (b.date + b.time).localeCompare(a.date + a.time),
      patient: (a, b) => a.patientName.localeCompare(b.patientName),
      doctor: (a, b) => a.doctorName.localeCompare(b.doctorName),
      status: (a, b) => a.status.localeCompare(b.status),
    }
    list.sort(sorters[sort] || sorters['date-asc'])
    return list
  })
}

export async function getAppointmentById(id) {
  return request(() => {
    const appt = store.findById('appointments', id)
    if (!appt) throw new ApiError('Appointment not found.', { status: 404 })
    return decorateAppointment(appt)
  })
}

export async function getAppointmentStats({ patientId, doctorId } = {}) {
  return request(() => {
    let list = store.all('appointments')
    if (patientId) list = list.filter((a) => a.patientId === patientId)
    if (doctorId) list = list.filter((a) => a.doctorId === doctorId)
    const today = toISODate(new Date())
    return {
      total: list.length,
      upcoming: list.filter((a) => a.date >= today && ['pending', 'confirmed'].includes(a.status)).length,
      today: list.filter((a) => a.date === today && a.status !== 'cancelled').length,
      pending: list.filter((a) => a.status === 'pending').length,
      confirmed: list.filter((a) => a.status === 'confirmed').length,
      completed: list.filter((a) => a.status === 'completed').length,
      cancelled: list.filter((a) => a.status === 'cancelled').length,
    }
  })
}

/* ------------------------------- commands -------------------------------- */

export async function createAppointment(payload) {
  return request(() => {
    const { patientId, doctorId, departmentId, date, time, reason, type, notes } = payload
    const doctor = store.findById('doctors', doctorId)
    if (!doctor) throw new ApiError('Please choose a valid doctor.', { status: 400 })

    if (isPast(date, time)) {
      throw new ApiError('That time slot is in the past. Please pick another slot.', {
        status: 400,
        fields: { time: 'This slot is no longer available.' },
      })
    }

    const clash = store.findBy(
      'appointments',
      (a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'cancelled',
    )
    if (clash) {
      throw new ApiError('Sorry, this slot was just booked. Please choose another time.', {
        status: 409,
        fields: { time: 'Slot already taken.' },
      })
    }

    const appointment = store.insert('appointments', {
      id: uid('apt'),
      patientId,
      doctorId,
      departmentId: departmentId || doctor.departmentId,
      date,
      time,
      type: type || 'in-person',
      status: APPOINTMENT_STATUS.PENDING,
      reason,
      notes: notes || '',
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })

    notify(doctor.userId, {
      title: 'New appointment request',
      message: `A new appointment was requested for ${date} at ${time}.`,
      type: 'info',
    })
    notify(patientId, {
      title: 'Appointment requested',
      message: `Your request with ${doctor.title} ${doctor.name} is awaiting confirmation.`,
      type: 'info',
    })

    return decorateAppointment(appointment)
  })
}

export async function updateAppointmentStatus(id, status, note = '') {
  return request(() => {
    const appointment = store.findById('appointments', id)
    if (!appointment) throw new ApiError('Appointment not found.', { status: 404 })

    const updated = store.update('appointments', id, {
      status,
      notes: note ? `${appointment.notes ? `${appointment.notes}\n` : ''}${note}` : appointment.notes,
      updatedAt: nowISO(),
    })

    const doctor = store.findById('doctors', appointment.doctorId)
    const messages = {
      confirmed: {
        title: 'Appointment confirmed',
        message: `Your appointment on ${appointment.date} at ${appointment.time} has been confirmed.`,
        type: 'success',
      },
      cancelled: {
        title: 'Appointment cancelled',
        message: `Your appointment on ${appointment.date} at ${appointment.time} was cancelled.`,
        type: 'warning',
      },
      completed: {
        title: 'Visit completed',
        message: `Your visit on ${appointment.date} is marked as completed.`,
        type: 'info',
      },
    }
    if (messages[status]) {
      notify(appointment.patientId, messages[status])
      if (doctor) notify(doctor.userId, messages[status])
    }
    return decorateAppointment(updated)
  })
}

export async function rescheduleAppointment(id, { date, time }) {
  return request(() => {
    const appointment = store.findById('appointments', id)
    if (!appointment) throw new ApiError('Appointment not found.', { status: 404 })

    if (isPast(date, time)) {
      throw new ApiError('Please choose a future time slot.', { status: 400 })
    }
    const clash = store.findBy(
      'appointments',
      (a) =>
        a.id !== id &&
        a.doctorId === appointment.doctorId &&
        a.date === date &&
        a.time === time &&
        a.status !== 'cancelled',
    )
    if (clash) throw new ApiError('That slot is already taken.', { status: 409, fields: { time: 'Taken.' } })

    const updated = store.update('appointments', id, {
      date,
      time,
      status: APPOINTMENT_STATUS.PENDING,
      updatedAt: nowISO(),
    })
    notify(appointment.patientId, {
      title: 'Appointment rescheduled',
      message: `Your appointment moved to ${date} at ${time}. Awaiting re-confirmation.`,
      type: 'info',
    })
    return decorateAppointment(updated)
  })
}

export async function cancelAppointment(id, reason = '') {
  return updateAppointmentStatus(id, APPOINTMENT_STATUS.CANCELLED, reason)
}

export async function deleteAppointment(id) {
  return request(() => {
    const ok = store.remove('appointments', id)
    if (!ok) throw new ApiError('Appointment not found.', { status: 404 })
    return { success: true }
  })
}

/** Admin action: assign or move an appointment to another doctor. */
export async function reassignDoctor(id, doctorId) {
  return request(() => {
    const doctor = store.findById('doctors', doctorId)
    if (!doctor) throw new ApiError('Doctor not found.', { status: 404 })
    const updated = store.update('appointments', id, {
      doctorId,
      departmentId: doctor.departmentId,
      updatedAt: nowISO(),
    })
    return decorateAppointment(updated)
  })
}
