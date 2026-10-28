import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import AvailabilitySlots from '../../components/doctors/AvailabilitySlots.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDoctor } from '../../hooks/useDoctors.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as doctorService from '../../services/doctorService.js'
import * as reviewService from '../../services/reviewService.js'
import { WEEKDAYS } from '../../utils/constants.js'
import { formatCurrency, formatTime, relativeDayLabel, relativeTime } from '../../utils/formatDate.js'

/** Five interactive stars used by the review form. */
function StarPicker({ value, onChange }) {
  return (
    <div className="star-picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          className={star <= value ? 'filled' : ''}
          onClick={() => onChange(star)}
        >
          <Icon name="star" size={22} filled={star <= value} />
        </button>
      ))}
    </div>
  )
}

export default function DoctorDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isPatient } = useAuth()
  const toast = useToast()
  const { doctor, setDoctor, loading, error } = useDoctor(id)

  const [days, setDays] = useState([])
  const [date, setDate] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [time, setTime] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Real patient reviews.
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewContext, setReviewContext] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [submittingReview, setSubmittingReview] = useState(false)

  const refreshReviews = async (doctorId) => {
    const list = await reviewService.getDoctorReviews(doctorId)
    setReviews(list)
    setReviewsLoading(false)
  }

  // Upcoming days on which this doctor holds a clinic.
  useEffect(() => {
    let active = true
    if (!doctor) return undefined
    setSlotsLoading(true)
    doctorService
      .getNextAvailableDates(doctor.id, 8)
      .then((list) => {
        if (!active) return
        setDays(list.map((item) => item.date))
        setDate(list[0]?.date || null)
      })
      .finally(() => active && setSlotsLoading(false))
    return () => {
      active = false
    }
  }, [doctor])

  // Availability for the selected day.
  useEffect(() => {
    let active = true
    if (!doctor || !date) return undefined
    setSlotsLoading(true)
    doctorService
      .getDoctorAvailability(doctor.id, date)
      .then((result) => active && setAvailability(result))
      .finally(() => active && setSlotsLoading(false))
    return () => {
      active = false
    }
  }, [doctor, date])

  // Reviews + the visitor's review eligibility.
  useEffect(() => {
    let active = true
    if (!doctor) return undefined
    setReviewsLoading(true)
    refreshReviews(doctor.id)
    reviewService
      .getReviewContext(doctor.id, isPatient ? user?.id : null)
      .then((result) => active && setReviewContext(result))
      .finally(() => active && setReviewsLoading(false))
    return () => {
      active = false
    }
  }, [doctor?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitReview = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!rating) nextErrors.rating = 'Pick a star rating.'
    if (comment.trim().length < 10) nextErrors.comment = 'Tell us a little more (10+ characters).'
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmittingReview(true)
    try {
      await reviewService.addReview({
        patientId: user.id,
        doctorId: doctor.id,
        rating,
        comment,
        appointmentId: reviewContext?.appointmentId,
      })
      setComment('')
      setRating(5)
      const [freshDoctor, freshContext] = await Promise.all([
        doctorService.getDoctorById(doctor.id),
        reviewService.getReviewContext(doctor.id, user.id),
      ])
      setDoctor(freshDoctor)
      setReviewContext(freshContext)
      refreshReviews(doctor.id)
      toast.success('Review published', 'Thank you — your feedback helps other patients.')
    } catch (err) {
      setFormErrors({ ...(err.fields || {}), form: err.message })
      toast.error('Could not publish review', err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <Loader label="Loading doctor profile…" />

  if (error || !doctor) {
    return (
      <section className="section">
        <div className="container">
          <div className="card">
            <EmptyState
              icon="stethoscope"
              title="Doctor not found"
              description="This profile may have been removed. Browse our other specialists instead."
              actionLabel="Back to doctors"
              actionTo="/doctors"
              actionIcon="arrow-left"
            />
          </div>
        </div>
      </section>
    )
  }

  const bookNow = () => {
    const query = new URLSearchParams({ doctor: doctor.id })
    if (date) query.set('date', date)
    if (time) query.set('time', time)
    navigate(`/patient/book?${query.toString()}`)
  }

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <Link to="/doctors">Doctors</Link>
          <Icon name="chevron-right" size={14} />
          <span>
            {doctor.title} {doctor.name}
          </span>
        </nav>

        <div className="detail-layout">
          <div className="stack">
            {/* Profile header */}
            <div className="card">
              <div className="card-body">
                <div className="row" style={{ gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    style={{ width: 132, height: 132, borderRadius: 'var(--r-lg)', objectFit: 'cover' }}
                  />
                  <div className="grow">
                    <span className="badge badge-brand">{doctor.departmentName}</span>
                    <h1 style={{ margin: '10px 0 4px', fontSize: 'var(--text-3xl)' }}>
                      {doctor.title} {doctor.name}
                    </h1>
                    <p style={{ color: 'var(--brand-700)', fontWeight: 700, marginBottom: 10 }}>
                      {doctor.specialty}
                    </p>
                    <div className="row-wrap" style={{ gap: 18 }}>
                      <span className="rating">
                        <Icon name="star" size={16} filled /> {doctor.rating}
                        <span className="text-xs text-muted" style={{ fontWeight: 400 }}>
                          ({doctor.reviews} {doctor.reviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </span>
                      <span className="text-sm text-muted row" style={{ gap: 6 }}>
                        <Icon name="award" size={15} /> {doctor.qualifications}
                      </span>
                      <span className="text-sm text-muted row" style={{ gap: 6 }}>
                        <Icon name="briefcase" size={15} /> {doctor.experienceYears} years
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="card">
              <div className="card-header">
                <h3>About {doctor.title} {doctor.name}</h3>
              </div>
              <div className="card-body prose">
                <p>{doctor.bio}</p>
                <div className="grid grid-2" style={{ gap: 18 }}>
                  <div>
                    <h4 className="text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                      Qualifications
                    </h4>
                    <p className="text-sm mb-0">{doctor.qualifications}</p>
                  </div>
                  <div>
                    <h4 className="text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                      Languages
                    </h4>
                    <p className="text-sm mb-0">{(doctor.languages || []).join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                      Consultation room
                    </h4>
                    <p className="text-sm mb-0">{doctor.room}</p>
                  </div>
                  <div>
                    <h4 className="text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                      Contact
                    </h4>
                    <p className="text-sm mb-0">
                      {doctor.phone}
                      <br />
                      {doctor.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="card">
              <div className="card-header">
                <h3>Available appointment slots</h3>
              </div>
              <div className="card-body">
                <AvailabilitySlots
                  days={days}
                  activeDate={date}
                  onDateChange={(next) => {
                    setDate(next)
                    setTime('')
                  }}
                  availability={availability}
                  loading={slotsLoading}
                  selectedTime={time}
                  onSelectTime={setTime}
                />
              </div>
            </div>

            {/* Reviews */}
            <div className="card">
              <div className="card-header">
                <h3>Patient reviews</h3>
                <span className="badge badge-warning">
                  <Icon name="star" size={12} filled /> {doctor.rating || '—'} average · {doctor.reviews || 0}{' '}
                  {doctor.reviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
              <div className="card-body stack-sm">
                {/* Review form for eligible patients */}
                {isPatient && reviewContext?.canReview && (
                  <form className="panel" onSubmit={submitReview} noValidate>
                    <strong>Your review of {doctor.title} {doctor.name}</strong>
                    <div className=" mt-2" style={{ marginBottom: 10 }}>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                    <Input
                      as="textarea"
                      name="review-comment"
                      label="Your experience"
                      placeholder="How was the visit? Did the doctor listen, explain clearly, keep the schedule?"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      error={formErrors.comment}
                      rows={3}
                    />
                    {formErrors.form && (
                      <div className="alert alert-danger mt-2" role="alert">
                        <Icon name="alert-circle" size={18} />
                        <span>{formErrors.form}</span>
                      </div>
                    )}
                    <div className="mt-2">
                      <Button type="submit" icon="paper-plane" loading={submittingReview}>
                        Publish review
                      </Button>
                    </div>
                  </form>
                )}

                {/* Eligibility hint */}
                {reviewContext && !reviewContext.canReview && (
                  <p className="text-sm text-muted" style={{ marginBottom: 4 }}>
                    <Icon name="info" size={15} /> {reviewContext.reason}
                  </p>
                )}

                {reviewsLoading ? (
                  <Loader label="Loading reviews…" />
                ) : reviews.length === 0 ? (
                  !reviewContext?.canReview && (
                    <div className="review-summary text-muted text-sm">
                      No reviews yet —{' '}
                      {isPatient ? ' book a visit and be the first to share your experience.' : ' verified patients can share their experience here after a completed visit.'}
                    </div>
                  )
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="panel review-summary">
                      <div className="row-between">
                        <div className="row" style={{ gap: 10 }}>
                          <Avatar src={review.patientAvatar} name={review.patientName} size="sm" />
                          <div>
                            <strong className="review-author">{review.patientName}</strong>
                            <div className="rating">
                              {Array.from({ length: review.rating }).map((_, star) => (
                                <Icon key={star} name="star" size={13} filled />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted">{relativeTime(review.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted mt-1 mb-0">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Booking aside */}
          <aside className="sticky-aside stack-sm">
            <div className="card">
              <div className="card-header">
                <h3>Book with {doctor.name.split(' ')[0]}</h3>
              </div>
              <div className="card-body">
                <div className="price-row">
                  <span>Consultation fee</span>
                  <strong>{formatCurrency(doctor.fee)}</strong>
                </div>
                <div className="price-row">
                  <span>Selected slot</span>
                  <strong>{time ? `${formatTime(time)} · ${relativeDayLabel(date)}` : 'Not chosen'}</strong>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm" style={{ color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Clinic days
                  </h4>
                  <div className="row-wrap" style={{ gap: 6 }}>
                    {(doctor.availableDays || []).map((day) => (
                      <span key={day} className="badge badge-neutral">
                        {WEEKDAYS[day]}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  block
                  size="lg"
                  icon="calendar-plus"
                  className="mt-3"
                  onClick={bookNow}
                  disabled={!date}
                >
                  Continue to booking
                </Button>
                <p className="text-xs text-muted text-center mt-1 mb-0">
                  You will choose a slot on the next screen and confirm your details.
                </p>
              </div>
            </div>

            <div className="card card-pad">
              <h3 style={{ fontSize: 'var(--text-lg)' }}>Insurance &amp; payment</h3>
              <p className="text-sm text-muted mb-0">
                We accept all major insurers. Payment is collected after your visit —
                booking online is free and can be cancelled at no cost.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
