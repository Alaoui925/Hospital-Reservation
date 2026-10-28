import { ApiError, request, store, uid } from './api.js'

/**
 * Medical records & prescriptions.
 * Doctors file a report (diagnosis + prescription + instructions) against a
 * completed appointment; patients keep a permanent record of every visit.
 */

const nowISO = () => new Date().toISOString()

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

/** Attach resolved relations to a raw record. */
export function decorateRecord(record) {
  const doctor = store.findById('doctors', record.doctorId)
  const patient = store.findById('users', record.patientId)
  const department = store.findById('departments', record.departmentId)
  return {
    ...record,
    doctorName: doctor ? `${doctor.title} ${doctor.name}` : '—',
    doctorAvatar: doctor?.avatar || null,
    doctorSpecialty: doctor?.specialty || '—',
    patientName: patient?.name || 'Unknown patient',
    departmentName: department?.name || 'General',
    departmentIcon: department?.icon || 'hospital',
    report: record.prescription || [],
  }
}

export async function queryRecords({ patientId, doctorId, appointmentId } = {}) {
  return request(() => {
    let list = store.all('medicalRecords')
    if (patientId) list = list.filter((r) => r.patientId === patientId)
    if (doctorId) list = list.filter((r) => r.doctorId === doctorId)
    if (appointmentId) list = list.filter((r) => r.appointmentId === appointmentId)
    return list.sort((a, b) => (b.visitDate || '').localeCompare(a.visitDate || '')).map(decorateRecord)
  })
}

export async function getRecordByAppointment(appointmentId) {
  return request(() => {
    const record = store.findBy('medicalRecords', (r) => r.appointmentId === appointmentId)
    return record ? decorateRecord(record) : null
  }, { ms: 80 })
}

/** Create a report for a completed appointment (or replace an existing one). */
export async function upsertRecord({ appointmentId, doctor, diagnosis, prescription, instructions, followUpDate }) {
  return request(() => {
    const appointment = store.findById('appointments', appointmentId)
    if (!appointment) throw new ApiError('Appointment not found.', { status: 404 })
    if (!doctor || appointment.doctorId !== doctor.id) {
      throw new ApiError('Only the doctor who handled the visit can file a report.', { status: 403 })
    }
    if (appointment.status !== 'completed') {
      throw new ApiError('Reports can only be added once the visit is completed.', { status: 400 })
    }

    const diagnosisText = String(diagnosis || '').trim()
    if (diagnosisText.length < 5) {
      throw new ApiError('Add a diagnosis so the record is useful later.', {
        fields: { diagnosis: 'Describe the diagnosis or findings.' },
      })
    }

    const meds = String(prescription || '')
      .split('\n')
      .map((line) => line.replace(/\s*[;–—]\s*/g, ' — ').trim())
      .filter(Boolean)

    const payload = {
      diagnosis: diagnosisText,
      prescription: meds,
      instructions: String(instructions || '').trim(),
      followUpDate: followUpDate || null,
      updatedAt: nowISO(),
    }

    const existing = store.findBy('medicalRecords', (r) => r.appointmentId === appointmentId)
    const record = existing
      ? store.update('medicalRecords', existing.id, payload)
      : store.insert('medicalRecords', {
          id: uid('mr'),
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          departmentId: appointment.departmentId,
          visitDate: appointment.date,
          createdAt: nowISO(),
          ...payload,
        })

    if (!existing) {
      notify(appointment.patientId, {
        title: 'Visit report available',
        message: `${doctor.title} ${doctor.name} has filed the report of your visit on ${appointment.date}.`,
        type: 'success',
      })
    }

    return decorateRecord(record)
  })
}
