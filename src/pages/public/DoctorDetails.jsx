import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import AvailabilitySlots from '../../components/doctors/AvailabilitySlots.jsx'
import { useDoctor } from '../../hooks/useDoctors.js'
import * as doctorService from '../../services/doctorService.js'
import { WEEKDAYS } from '../../utils/constants.js'
import { formatCurrency, formatTime, relativeDayLabel } from '../../utils/formatDate.js'

const SAMPLE_REVIEWS = [
  {
    name: 'Verified patient',
    rating: 5,
    text: 'Took the time to explain everything clearly and never made me feel rushed. Highly recommended.',
    when: '2 weeks ago',
  },
  {
    name: 'Verified patient',
    rating: 5,
    text: 'Very thorough examination and a treatment plan I could actually follow. The whole visit was smooth.',
    when: '1 month ago',
  },
  {
    name: 'Verified patient',
    rating: 4,
    text: 'Excellent clinician. Waiting time was minimal and the staff were friendly.',
    when: '3 months ago',
  },
]

export default function DoctorDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { doctor, loading, error } = useDoctor(id)

  const [days, setDays] = useState([])
  const [date, setDate] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [time, setTime] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)

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
                          ({doctor.reviews} reviews)
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
                  <Icon name="star" size={12} filled /> {doctor.rating} average
                </span>
              </div>
              <div className="card-body stack-sm">
                {SAMPLE_REVIEWS.map((review, index) => (
                  <div key={index} className="panel">
                    <div className="row-between">
                      <strong>{review.name}</strong>
                      <span className="rating">
                        {Array.from({ length: review.rating }).map((_, star) => (
                          <Icon key={star} name="star" size={13} filled />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1 mb-0">{review.text}</p>
                    <span className="text-xs text-muted">{review.when}</span>
                  </div>
                ))}
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
