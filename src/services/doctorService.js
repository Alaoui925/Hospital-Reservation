import { ApiError, request, store, uid } from './api.js'
import { ROLES, DOCTORS_PER_PAGE } from '../utils/constants.js'
import { isPast, toISODate } from '../utils/formatDate.js'

/** Doctor directory, availability and admin CRUD. */

function decorate(doctor) {
  const department = store.findById('departments', doctor.departmentId)
  return { ...doctor, departmentName: department?.name || 'General', departmentSlug: department?.slug }
}

export async function getDoctors({
  search = '',
  departmentId = 'all',
  sort = 'rating',
  page = 1,
  perPage = DOCTORS_PER_PAGE,
  maxFee,
  featured = false,
} = {}) {
  return request(() => {
    let list = store.all('doctors').map(decorate)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.departmentName.toLowerCase().includes(q) ||
          d.qualifications.toLowerCase().includes(q),
      )
    }

    if (departmentId && departmentId !== 'all') {
      list = list.filter((d) => d.departmentId === departmentId)
    }

    if (typeof maxFee === 'number') {
      list = list.filter((d) => d.fee <= maxFee)
    }

    const sorters = {
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      name: (a, b) => a.name.localeCompare(b.name),
      'fee-asc': (a, b) => a.fee - b.fee,
      'fee-desc': (a, b) => b.fee - a.fee,
      experience: (a, b) => b.experienceYears - a.experienceYears,
    }
    list.sort(sorters[sort] || sorters.rating)

    const total = list.length
    const safePerPage = Math.max(1, perPage)
    const totalPages = Math.max(1, Math.ceil(total / safePerPage))
    const current = Math.min(Math.max(1, page), totalPages)
    const start = (current - 1) * safePerPage
    const items = featured
      ? list.slice(0, safePerPage)
      : list.slice(start, start + safePerPage)

    return { items, total, page: current, perPage: safePerPage, totalPages }
  })
}

export async function getFeaturedDoctors(limit = 4) {
  return request(() => store.all('doctors').map(decorate).sort((a, b) => b.rating - a.rating).slice(0, limit))
}

export async function getDoctorById(id) {
  return request(() => {
    const doctor = store.findById('doctors', id)
    if (!doctor) throw new ApiError('Doctor not found.', { status: 404 })
    return decorate(doctor)
  })
}

export async function getDoctorByUserId(userId) {
  return request(() => {
    const doctor = store.findBy('doctors', (d) => String(d.userId) === String(userId))
    return doctor ? decorate(doctor) : null
  })
}

/**
 * Availability for a doctor on a specific date.
 * Each slot is annotated with `taken` (already booked) and `past`.
 */
export async function getDoctorAvailability(doctorId, date) {
  return request(() => {
    const doctor = store.findById('doctors', doctorId)
    if (!doctor) throw new ApiError('Doctor not found.', { status: 404 })

    const weekday = new Date(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
    ).getDay()
    const worksToday = (doctor.availableDays || []).includes(weekday)

    const booked = store
      .find(
        'appointments',
        (a) =>
          a.doctorId === doctorId &&
          a.date === date &&
          a.status !== 'cancelled',
      )
      .map((a) => a.time)

    const slots = (doctor.slots || []).map((time) => ({
      time,
      taken: booked.includes(time),
      past: isPast(date, time),
    }))

    return {
      date,
      weekday,
      worksToday,
      slots: worksToday ? slots : [],
      availableCount: slots.filter((s) => !s.taken && !s.past).length,
    }
  })
}

/** Next N dates on which the doctor has free slots (used by the booking wizard). */
export async function getNextAvailableDates(doctorId, count = 7, from = new Date()) {
  return request(() => {
    const doctor = store.findById('doctors', doctorId)
    if (!doctor) throw new ApiError('Doctor not found.', { status: 404 })
    const results = []
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    let guard = 0
    while (results.length < count && guard < 60) {
      const date = toISODate(cursor)
      const weekday = cursor.getDay()
      if ((doctor.availableDays || []).includes(weekday)) {
        const booked = store
          .find('appointments', (a) => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled')
          .map((a) => a.time)
        const free = (doctor.slots || []).filter((t) => !booked.includes(t) && !isPast(date, t))
        results.push({ date, weekday, availableCount: free.length })
      }
      cursor.setDate(cursor.getDate() + 1)
      guard += 1
    }
    return results
  }, { ms: 120 })
}

export async function getDoctorStats(doctorId) {
  return request(() => {
    const all = store.find('appointments', (a) => a.doctorId === doctorId)
    const today = toISODate(new Date())
    return {
      total: all.length,
      today: all.filter((a) => a.date === today && a.status !== 'cancelled').length,
      pending: all.filter((a) => a.status === 'pending').length,
      confirmed: all.filter((a) => a.status === 'confirmed').length,
      completed: all.filter((a) => a.status === 'completed').length,
      cancelled: all.filter((a) => a.status === 'cancelled').length,
      upcoming: all.filter((a) => a.date >= today && a.status === 'confirmed').length,
    }
  })
}

/* --------------------------------- admin --------------------------------- */

export async function createDoctor(payload) {
  return request(() => {
    const email = String(payload.email).trim().toLowerCase()
    if (store.findBy('users', (u) => u.email === email)) {
      throw new ApiError('A user with this email already exists.', {
        status: 409,
        fields: { email: 'Email already in use.' },
      })
    }
    const doctorId = uid('doc')
    const userId = uid('user')

    const doctor = store.insert('doctors', {
      id: doctorId,
      userId,
      title: payload.title || 'Dr.',
      name: String(payload.name).trim(),
      departmentId: payload.departmentId,
      specialty: payload.specialty || 'Consultant',
      gender: payload.gender || 'Prefer not to say',
      email,
      phone: payload.phone || '',
      avatar: payload.avatar || '/images/doctors/doctor-1.svg',
      qualifications: payload.qualifications || '',
      experienceYears: Number(payload.experienceYears) || 0,
      fee: Number(payload.fee) || 0,
      rating: Number(payload.rating) || 4.5,
      reviews: 0,
      languages: payload.languages || ['English'],
      room: payload.room || '',
      status: payload.status || 'active',
      bio: payload.bio || '',
      availableDays: payload.availableDays || [1, 2, 3, 4, 5],
      slots: payload.slots || [],
    })

    store.insert('users', {
      id: userId,
      name: `${doctor.title} ${doctor.name}`,
      email,
      password: payload.password || 'doctor123',
      role: ROLES.DOCTOR,
      doctorId,
      phone: doctor.phone,
      avatar: doctor.avatar,
      departmentId: doctor.departmentId,
      createdAt: new Date().toISOString(),
    })

    return decorate(doctor)
  })
}

export async function updateDoctor(id, patch) {
  return request(() => {
    const updated = store.update('doctors', id, patch)
    if (!updated) throw new ApiError('Doctor not found.', { status: 404 })
    if (updated.userId) {
      store.update('users', updated.userId, {
        name: `${updated.title} ${updated.name}`,
        phone: updated.phone,
        departmentId: updated.departmentId,
        avatar: updated.avatar,
      })
    }
    return decorate(updated)
  })
}

export async function deleteDoctor(id) {
  return request(() => {
    const doctor = store.findById('doctors', id)
    if (!doctor) throw new ApiError('Doctor not found.', { status: 404 })
    store.remove('doctors', id)
    if (doctor.userId) store.remove('users', doctor.userId)
    // Appointments stay for the historical record but lose their doctor link.
    store
      .find('appointments', (a) => a.doctorId === id)
      .forEach((a) => store.update('appointments', a.id, { status: 'cancelled', doctorId: id }))
    return { success: true }
  })
}
