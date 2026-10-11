import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import DoctorGrid from '../../components/doctors/DoctorGrid.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import * as departmentService from '../../services/departmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { HOSPITAL } from '../../utils/constants.js'

const BENEFITS = [
  {
    icon: 'calendar-check',
    title: 'Book in minutes',
    text: 'See real availability and reserve a slot online, 24 hours a day.',
  },
  {
    icon: 'shield',
    title: 'In safe hands',
    text: 'Board-certified specialists across eight major departments.',
  },
  {
    icon: 'clock',
    title: 'Short waiting times',
    text: 'Smart scheduling keeps clinics running on time, every time.',
  },
  {
    icon: 'video',
    title: 'Video consultations',
    text: 'Meet your doctor from home for follow-ups and quick advice.',
  },
  {
    icon: 'clipboard',
    title: 'Your records, organised',
    text: 'Every appointment, note and prescription in one place.',
  },
  {
    icon: 'bell',
    title: 'Helpful reminders',
    text: 'Get notified about confirmations, changes and upcoming visits.',
  },
]

const STEPS = [
  { icon: 'search', title: 'Find your specialist', text: 'Search by department, condition or doctor name.' },
  { icon: 'calendar', title: 'Pick a slot', text: 'Choose a date and time that suits your schedule.' },
  { icon: 'check-circle', title: 'Get confirmed', text: 'Receive your confirmation and visit reminders.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState({ q: '', departmentId: 'all' })

  useEffect(() => {
    let active = true
    Promise.all([
      departmentService.getDepartments(),
      doctorService.getFeaturedDoctors(4),
    ])
      .then(([deps, docs]) => {
        if (!active) return
        setDepartments(deps)
        setDoctors(docs)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (search.q.trim()) params.set('search', search.q.trim())
    if (search.departmentId !== 'all') params.set('department', search.departmentId)
    navigate(`/doctors${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-inner">
          <span className="eyebrow" style={{ color: 'var(--brand-200)' }}>
            Multi-specialty hospital · Springfield
          </span>
          <h1>Your health, booked around your life.</h1>
          <p className="lead">
            Reserve an appointment with a trusted specialist in under two minutes. No
            phone queues, no paperwork — just clear, convenient care.
          </p>
          <div className="hero-actions">
            <Button to="/patient/book" size="lg" icon="calendar-plus" variant="light">
              Book an appointment
            </Button>
            <Button to="/doctors" size="lg" variant="light" icon="stethoscope">
              Browse doctors
            </Button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>8</strong>
              <span>Departments</span>
            </div>
            <div className="hero-stat">
              <strong>40+</strong>
              <span>Specialists</span>
            </div>
            <div className="hero-stat">
              <strong>24/7</strong>
              <span>Online booking</span>
            </div>
            <div className="hero-stat">
              <strong>4.8</strong>
              <span>Patient rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search bar overlapping the hero */}
      <div className="container">
        <form
          className="search-bar"
          onSubmit={handleSearch}
          style={{ gridTemplateColumns: '1fr 1.5fr auto' }}
        >
          <Select
            label="Department"
            name="home-department"
            value={search.departmentId}
            onChange={(event) => setSearch((s) => ({ ...s, departmentId: event.target.value }))}
            options={[
              { value: 'all', label: 'All departments' },
              ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
            ]}
          />
          <Input
            label="Condition or doctor"
            name="home-search"
            icon="search"
            placeholder="e.g. cardiologist, migraine, Dr. Khan"
            value={search.q}
            onChange={(event) => setSearch((s) => ({ ...s, q: event.target.value }))}
          />
          <Button type="submit" size="lg" icon="search">
            Search
          </Button>
        </form>
      </div>

      {/* Departments */}
      <section className="section">
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">Our specialties</span>
            <h2 className="section-title">Care for every member of the family</h2>
            <p className="section-subtitle">
              Eight dedicated departments, each led by experienced consultants and
              supported by modern diagnostic facilities.
            </p>
          </div>

          <div className="grid grid-auto">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="tile">
                    <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }} />
                    <div className="skeleton mt-2" style={{ height: 16, width: '60%' }} />
                    <div className="skeleton mt-1" style={{ height: 12, width: '85%' }} />
                  </div>
                ))
              : departments.map((dep) => (
                  <Link
                    key={dep.id}
                    to={`/departments/${dep.slug}`}
                    className="tile"
                    style={{ display: 'block' }}
                  >
                    <div className="tile-icon" aria-hidden="true">
                      <Icon name={dep.icon} size={26} />
                    </div>
                    <h3>{dep.name}</h3>
                    <p>{dep.short}</p>
                    <span className="text-xs text-muted mt-1" style={{ display: 'block' }}>
                      {dep.doctorCount} {dep.doctorCount === 1 ? 'doctor' : 'doctors'} ·{' '}
                      {dep.floor}
                    </span>
                  </Link>
                ))}
          </div>

          <div className="text-center mt-4">
            <Button to="/departments" variant="secondary" iconRight="arrow-right">
              Explore all departments
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ background: 'var(--surface-alt)' }}>
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">Three simple steps to your appointment</h2>
            <p className="section-subtitle">
              Booking online takes about the same time as making a cup of tea.
            </p>
          </div>
          <div className="grid grid-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="tile text-center">
                <div className="tile-icon" style={{ margin: '0 auto 16px' }}>
                  <Icon name={step.icon} size={24} />
                </div>
                <span className="badge badge-brand mb-1">Step {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top doctors */}
      <section className="section">
        <div className="container">
          <div className="row-between">
            <div>
              <span className="eyebrow">Meet the team</span>
              <h2 className="section-title mb-0">Highly rated doctors</h2>
            </div>
            <Button to="/doctors" variant="ghost" iconRight="arrow-right">
              See all doctors
            </Button>
          </div>
          <div className="mt-3">
            <DoctorGrid doctors={doctors} loading={loading} skeletonCount={4} />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section" style={{ background: 'var(--surface-alt)' }}>
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">Why patients choose us</span>
            <h2 className="section-title">Thoughtful care, thoughtfully delivered</h2>
          </div>
          <div className="grid grid-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="tile">
                <div className="tile-icon">
                  <Icon name={benefit.icon} size={24} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Ready to see a specialist?</h2>
              <p>
                Create a free account and book your first appointment today. It only
                takes a moment — and it is completely free to reserve.
              </p>
            </div>
            <div className="row-wrap">
              <Button to="/register" variant="light" size="lg" icon="user">
                Create an account
              </Button>
              <Button to="/contact" variant="light" size="lg" icon="phone">
                Call {HOSPITAL.phone}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
