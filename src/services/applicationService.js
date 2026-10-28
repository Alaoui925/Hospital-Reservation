import { ApiError, request, store, uid } from './api.js'
import { ROLES } from '../utils/constants.js'

/**
 * Doctor applications.
 * Candidates register from the public site; admins review the queue and
 * approve (which provisions the doctor + account) or reject.
 */

const nowISO = () => new Date().toISOString()
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const notify = (userId, payload) => {
  if (!userId) return
  store.insert('notifications', {
    id: uid('not'),
    userId,
    title: payload.title,
    message: payload.message,
    type: payload.type || 'info',
    read: false,
    createdAt: nowISO(),
  })
}

function decorateApplication(application) {
  const department = store.findById('departments', application.departmentId)
  return {
    ...application,
    departmentName: department?.name || 'General',
    departmentSlug: department?.slug,
  }
}

export async function submitApplication(payload) {
  return request(() => {
    const email = normalizeEmail(payload.email)
    if (store.findBy('users', (u) => u.email === email)) {
      throw new ApiError('An account with this email already exists.', {
        status: 409,
        fields: { email: 'This email is already registered.' },
      })
    }
    if (store.findBy('doctorApplications', (a) => a.email === email && a.status === 'pending')) {
      throw new ApiError('An application with this email is already under review.', {
        status: 409,
        fields: { email: 'Application already pending review.' },
      })
    }
    const department = store.findById('departments', payload.departmentId)
    if (!department) {
      throw new ApiError('Choose a valid department.', { fields: { departmentId: 'Select a department.' } })
    }

    const application = store.insert('doctorApplications', {
      id: uid('app'),
      name: String(payload.name).trim(),
      email,
      phone: String(payload.phone || '').trim(),
      password: payload.password,
      departmentId: payload.departmentId,
      specialty: String(payload.specialty || '').trim(),
      qualifications: String(payload.qualifications || '').trim(),
      experienceYears: Number(payload.experienceYears) || 0,
      fee: Number(payload.fee) || 0,
      bio: String(payload.bio || '').trim(),
      status: 'pending',
      rejectionReason: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: nowISO(),
    })

    // Let admins know there is a new application to review.
    store
      .find('users', (u) => u.role === ROLES.ADMIN)
      .forEach((admin) =>
        notify(admin.id, {
          title: 'New doctor application',
          message: `${application.name} applied to join the ${department.name} department.`,
          type: 'info',
        }),
      )

    return decorateApplication(application)
  })
}

export async function getApplications(status = 'all', search = '') {
  return request(() => {
    let list = store.all('doctorApplications').map(decorateApplication)
    if (status && status !== 'all') list = list.filter((a) => a.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })
}

export async function getApplicationCount() {
  return request(() => store.find('doctorApplications', (a) => a.status === 'pending').length, { ms: 60 })
}

/** Admin approval: provision the doctor account exactly like manual creation. */
export async function approveApplication(applicationId, { adminId } = {}) {
  return request(() => {
    const application = store.findById('doctorApplications', applicationId)
    if (!application) throw new ApiError('Application not found.', { status: 404 })
    if (application.status !== 'pending') {
      throw new ApiError('This application has already been reviewed.', { status: 409 })
    }
    if (store.findBy('users', (u) => u.email === application.email)) {
      throw new ApiError('An account with this email was created in the meantime.', { status: 409 })
    }

    const doctorId = uid('doc')
    const userId = uid('user')

    store.insert('doctors', {
      id: doctorId,
      userId,
      title: 'Dr.',
      name: application.name,
      departmentId: application.departmentId,
      specialty: application.specialty || 'Consultant',
      gender: 'Prefer not to say',
      email: application.email,
      phone: application.phone,
      avatar: '/images/doctors/doctor-1.jpg',
      qualifications: application.qualifications,
      experienceYears: application.experienceYears || 0,
      fee: application.fee || 0,
      rating: 0,
      reviews: 0,
      languages: ['English'],
      room: '',
      status: 'active',
      bio: application.bio,
      availableDays: [1, 2, 3, 4, 5],
      slots: [],
    })
    store.insert('users', {
      id: userId,
      name: `Dr. ${application.name}`,
      email: application.email,
      password: application.password,
      role: ROLES.DOCTOR,
      doctorId,
      phone: application.phone,
      avatar: '/images/doctors/doctor-1.jpg',
      departmentId: application.departmentId,
      createdAt: nowISO(),
    })

    const updated = store.update('doctorApplications', applicationId, {
      status: 'approved',
      reviewedBy: adminId || null,
      reviewedAt: nowISO(),
    })

    notify(userId, {
      title: 'Welcome to MediCare!',
      message: 'Your application was approved. Your doctor workspace is ready — update your availability next.',
      type: 'success',
    })

    return decorateApplication(updated)
  })
}

export async function rejectApplication(applicationId, reason = '') {
  return request(() => {
    const application = store.findById('doctorApplications', applicationId)
    if (!application) throw new ApiError('Application not found.', { status: 404 })
    if (application.status !== 'pending') {
      throw new ApiError('This application has already been reviewed.', { status: 409 })
    }
    const updated = store.update('doctorApplications', applicationId, {
      status: 'rejected',
      rejectionReason: String(reason).trim(),
      reviewedAt: nowISO(),
    })
    return decorateApplication(updated)
  })
}

/** Admin helper consumed elsewhere, exported for the dashboard widgets. */
export async function getPendingApplications() {
  return request(
    () =>
      store
        .find('doctorApplications', (a) => a.status === 'pending')
        .map(decorateApplication)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    { ms: 100 },
  )
}

/** Login flow hook: surface "under review" instead of a generic auth failure. */
export function findByEmail(email) {
  return store.findBy('doctorApplications', (a) => a.email === normalizeEmail(email)) || null
}
