import { ApiError, request, store, uid } from './api.js'

/**
 * Patient reviews.
 * A patient may leave one review per doctor (ideally backed by a completed
 * appointment). Doctor `rating`/`reviews` aggregates are recalculated on every
 * write so the directory always agrees with the reviews table.
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

/** Attach the reviewer to a raw review row. */
export function decorateReview(review) {
  const patient = store.findById('users', review.patientId)
  const doctor = store.findById('doctors', review.doctorId)
  return {
    ...review,
    patientName: patient?.name || 'Verified patient',
    patientAvatar: patient?.avatar || null,
    doctorName: doctor ? `${doctor.title} ${doctor.name}` : '—',
  }
}

export async function getDoctorReviews(doctorId) {
  return request(
    () =>
      store
        .find('reviews', (r) => r.doctorId === doctorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(decorateReview),
    { ms: 100 },
  )
}

export async function getReviewContext(doctorId, patientId) {
  return request(() => {
    if (!patientId) {
      return { signedIn: false, canReview: false, reason: 'Sign in as a patient to leave a review.', existing: null }
    }
    const existing =
      store.findBy('reviews', (r) => r.doctorId === doctorId && r.patientId === patientId) || null
    if (existing) {
      return { signedIn: true, canReview: false, reason: 'You have already reviewed this doctor.', existing }
    }
    const completedVisit = store.findBy(
      'appointments',
      (a) =>
        a.doctorId === doctorId &&
        a.patientId === patientId &&
        a.status === 'completed',
    )
    if (!completedVisit) {
      return {
        signedIn: true,
        canReview: false,
        reason: 'Reviews are open to patients after a completed visit with this doctor.',
        existing: null,
      }
    }
    return { signedIn: true, canReview: true, reason: '', existing: null, appointmentId: completedVisit.id }
  }, { ms: 80 })
}

/** Recalculate the doctor aggregates from the reviews table. */
function recomputeDoctorRating(doctorId) {
  const list = store.find('reviews', (r) => r.doctorId === doctorId)
  const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0
  store.update('doctors', doctorId, {
    rating: average ? Math.round(average * 10) / 10 : 0,
    reviews: list.length,
  })
}

export async function addReview({ patientId, doctorId, rating, comment, appointmentId }) {
  return request(() => {
    const patient = store.findById('users', patientId)
    const doctor = store.findById('doctors', doctorId)
    if (!patient) throw new ApiError('Only signed-in patients can review.', { status: 401 })
    if (!doctor) throw new ApiError('Doctor not found.', { status: 404 })
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      throw new ApiError('Choose a rating from 1 to 5 stars.', { fields: { rating: 'Pick a star rating.' } })
    }
    const text = String(comment || '').trim()
    if (text.length < 10) {
      throw new ApiError('Please write at least 10 characters about your experience.', {
        fields: { comment: 'Tell us a little more (10+ characters).' },
      })
    }
    if (store.findBy('reviews', (r) => r.doctorId === doctorId && r.patientId === patientId)) {
      throw new ApiError('You have already reviewed this doctor.', { status: 409 })
    }

    const review = store.insert('reviews', {
      id: uid('rev'),
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      rating: Number(rating),
      comment: text,
      createdAt: nowISO(),
    })

    recomputeDoctorRating(doctorId)
    notify(doctor.userId, {
      title: 'New review received',
      message: `${patient.name} left a ${rating}-star review on your profile.`,
      type: 'success',
    })

    return decorateReview(review)
  })
}

export async function removeReview(reviewId) {
  return request(() => {
    const review = store.findById('reviews', reviewId)
    if (!review) throw new ApiError('Review not found.', { status: 404 })
    store.remove('reviews', reviewId)
    recomputeDoctorRating(review.doctorId)
    return { success: true }
  })
}
