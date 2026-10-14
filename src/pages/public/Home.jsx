import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import * as departmentService from '../../services/departmentService.js'
import * as doctorService from '../../services/doctorService.js'

const STATS = [
  { icon: 'stethoscope', value: '8', label: 'Specialty departments' },
  { icon: 'users', value: '40+', label: 'Experienced specialists' },
  { icon: 'clock', value: '24/7', label: 'Online appointment access' },
  { icon: 'star', value: '4.8/5', label: 'Patient satisfaction' },
]

const PROCESS = [
  {
    icon: 'search',
    title: 'Find your specialist',
    copy: 'Explore our departments and choose the right doctor for you.',
  },
  {
    icon: 'calendar',
    title: 'Choose your time',
    copy: 'Find an appointment that works with your day, not against it.',
  },
  {
    icon: 'check-circle',
    title: 'You’re in good hands',
    copy: 'Come in with confidence. We’ll take care of the rest.',
  },
]

const PROMISES = [
  {
    icon: 'award',
    title: 'Expertise you can trust',
    copy: 'Experienced specialists working together for your wellbeing.',
  },
  {
    icon: 'heart',
    title: 'Care that puts you first',
    copy: 'Thoughtful, personal attention. Because you’re more than a patient.',
  },
  {
    icon: 'calendar',
    title: 'Healthcare on your terms',
    copy: 'Simple online booking, with your next appointment just a few clicks away.',
  },
]

/** A single doctor card in the landing page grids. */
function HomeDoctorCard({ doctor }) {
  return (
    <article className="doctor-card">
      <div className="doctor-photo">
        <img src={doctor.avatar} alt={`${doctor.title} ${doctor.name}`} loading="lazy" />
        <span className="doctor-badge">
          <i />Accepting new patients
        </span>
      </div>
      <div className="doctor-info">
        <h3>
          {doctor.title} {doctor.name}
        </h3>
        <span className="doctor-specialty">{doctor.specialty}</span>
        <div className="doctor-bottom">
          <span className="doctor-rating">
            <Icon name="star" size={15} filled /> <strong>{doctor.rating}</strong>
            <small>({doctor.reviews} reviews)</small>
          </span>
          <Button
            to={`/patient/book?doctor=${doctor.id}`}
            variant="secondary"
            size="sm"
            iconRight="arrow-right"
          >
            Book a visit
          </Button>
        </div>
      </div>
    </article>
  )
}

function DoctorSkeletons() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="doctor-card" aria-hidden="true">
          <div className="doctor-photo skeleton" />
          <div className="doctor-info">
            <div className="skeleton" style={{ height: 18, width: '65%' }} />
            <div className="skeleton mt-1" style={{ height: 12, width: '45%' }} />
          </div>
        </div>
      ))}
    </>
  )
}

export default function Home() {
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [department, setDepartment] = useState('all')
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      departmentService.getDepartments(),
      doctorService.getDoctors({ sort: 'rating', perPage: 48 }),
    ])
      .then(([deps, docs]) => {
        if (!active) return
        setDepartments(deps)
        setDoctors(docs.items)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const featuredDoctors = useMemo(() => doctors.slice(0, 3), [doctors])

  const filteredDepartments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments.filter((dep) => {
      const matchesDepartment = department === 'all' || dep.id === department
      const matchesQuery = !q || `${dep.name} ${dep.short}`.toLowerCase().includes(q)
      return matchesDepartment && matchesQuery
    })
  }, [departments, department, query])

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase()
    return doctors.filter((doc) => {
      const matchesDepartment = department === 'all' || doc.departmentId === department
      const matchesQuery =
        !q ||
        `${doc.name} ${doc.specialty} ${doc.departmentName || ''}`.toLowerCase().includes(q)
      return matchesDepartment && matchesQuery
    })
  }, [doctors, department, query])

  const handleSearch = (event) => {
    event.preventDefault()
    setSearched(true)
    window.requestAnimationFrame(() => {
      document.getElementById('care-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const specialtyItems = searched ? filteredDepartments : departments
  const resultDoctors = searched ? filteredDoctors : []

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <img
          className="hero-image"
          src="/images/medicare-care-hero.jpg"
          alt="A doctor having a warm conversation with a patient"
          width="1920"
          height="1024"
        />
        <div className="container hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Your health. Our priority.
          </div>
          <h1>
            MediCare.
            <br />
            Expert care.
            <br />
            <span>A human touch.</span>
          </h1>
          <p className="hero-copy">
            The right specialists. Care that listens. A healthier tomorrow starts with a
            simple appointment.
          </p>
          <div className="hero-actions">
            <Button to="/patient/book" size="lg" icon="calendar-plus">
              Book an appointment
            </Button>
            <Button to="/doctors" size="lg" variant="light" iconRight="arrow-right">
              Find your doctor
            </Button>
          </div>
          <div className="hero-trust">
            <div className="avatar-stack" aria-hidden="true">
              {featuredDoctors.map((doc) => (
                <img key={doc.id} src={doc.avatar} alt="" width="40" height="40" loading="lazy" />
              ))}
            </div>
            <div className="hero-trust-copy">
              <div className="stars" aria-hidden="true">
                ★★★★★
              </div>
              <span>
                <strong>4.8/5</strong> from our patient community
              </span>
            </div>
          </div>
        </div>

        <div className="care-note">
          <span className="note-icon">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <strong>Care you can feel confident in</strong>
            <small>Experienced specialists. Personal attention.</small>
          </div>
        </div>
      </section>

      {/* Search bar overlapping the hero */}
      <div className="container search-wrap">
        <form className="care-search" onSubmit={handleSearch}>
          <div className="search-field">
            <Icon name="stethoscope" size={20} />
            <div>
              <label htmlFor="home-department">Choose a department</label>
              <select
                id="home-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option value="all">All departments</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="search-field">
            <Icon name="search" size={20} />
            <div>
              <label htmlFor="home-query">Doctor, specialty, or condition</label>
              <input
                id="home-query"
                placeholder="e.g. cardiology, migraine, Dr. Khan"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="lg" icon="search" iconRight="arrow-right">
            Find care
          </Button>
        </form>
      </div>

      {/* Stats */}
      <div className="container stats">
        {STATS.map((stat) => (
          <div className="stat" key={stat.label}>
            <Icon name={stat.icon} size={34} />
            <div>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Specialties */}
      <section className="container section" id="care-results">
        <div className="section-top">
          <div>
            <div className="eyebrow">Care for every part of you</div>
            <h2>{searched ? 'Find your care' : 'Specialized care. All in one place.'}</h2>
            <p>
              {searched
                ? 'Explore the departments and specialists matching your search.'
                : 'From everyday health to specialist support, we’re here for every stage of life.'}
            </p>
          </div>
          <Link to="/departments" className="text-link">
            Explore all departments <Icon name="arrow-right" size={16} />
          </Link>
        </div>

        <div className="specialty-grid">
          {specialtyItems.map((dep) => (
            <Link className="specialty-card" key={dep.id} to={`/departments/${dep.slug}`}>
              <span className="specialty-icon">
                <Icon name={dep.icon} size={26} />
              </span>
              <h3>{dep.name}</h3>
              <p>{dep.short}</p>
              <div className="specialty-bottom">
                <span>
                  {dep.doctorCount} {dep.doctorCount === 1 ? 'specialist' : 'specialists'}
                </span>
                <span className="specialty-arrow" aria-hidden="true">
                  <Icon name="arrow-right" size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {searched && specialtyItems.length === 0 && (
          <p className="home-empty">No departments found. Try another specialty or doctor name.</p>
        )}

        {searched && resultDoctors.length > 0 && (
          <div className="section-tight">
            <div className="home-doctor-grid">
              {resultDoctors.map((doc) => (
                <HomeDoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="process-section">
        <div className="container">
          <div className="center-heading">
            <div className="eyebrow">A little simpler. A lot better.</div>
            <h2>Your next appointment, made easy.</h2>
            <p>Less time arranging care. More time taking care of you.</p>
          </div>
          <div className="process-grid">
            {PROCESS.map((step, index) => (
              <div className="process-step" key={step.title}>
                <div className="process-icon">
                  <Icon name={step.icon} size={24} />
                  <span className="step-number">{index + 1}</span>
                </div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top doctors */}
      <section className="container section">
        <div className="section-top">
          <div>
            <div className="eyebrow">Expertise meets empathy</div>
            <h2>Good doctors. Great listeners.</h2>
            <p>Meet the people who put your health first.</p>
          </div>
          <Link to="/doctors" className="text-link">
            Meet all our doctors <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <div className="home-doctor-grid">
          {loading ? (
            <DoctorSkeletons />
          ) : (
            featuredDoctors.map((doc) => <HomeDoctorCard key={doc.id} doctor={doc} />)
          )}
        </div>
      </section>

      {/* Promise band */}
      <section className="promise-band">
        <div className="container promise-grid">
          {PROMISES.map((promise) => (
            <div className="promise" key={promise.title}>
              <Icon name={promise.icon} size={30} />
              <div>
                <h3>{promise.title}</h3>
                <p>{promise.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container">
        <div className="cta">
          <div>
            <h2>Your health deserves a little attention.</h2>
            <p>Let’s find the right care for you. We’re ready when you are.</p>
          </div>
          <Button to="/patient/book" size="lg" icon="calendar-plus" iconRight="arrow-right">
            Book an appointment
          </Button>
        </div>
      </section>
    </div>
  )
}
