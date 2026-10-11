import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import DoctorGrid from '../../components/doctors/DoctorGrid.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import * as departmentService from '../../services/departmentService.js'
import { HOSPITAL } from '../../utils/constants.js'

export default function DepartmentDetails() {
  const { slug } = useParams()
  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    departmentService
      .getDepartmentBySlug(slug)
      .then(async (dep) => {
        if (!active) return
        setDepartment(dep)
        const list = await departmentService.getDepartmentDoctors(dep.id)
        if (active) setDoctors(list)
      })
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <Loader label="Loading department…" />

  if (error || !department) {
    return (
      <section className="section">
        <div className="container">
          <div className="card">
            <EmptyState
              icon="building"
              title="Department not found"
              description="The department you are looking for may have been renamed or removed."
              actionLabel="Back to departments"
              actionTo="/departments"
              actionIcon="arrow-left"
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <Icon name="chevron-right" size={14} />
            <Link to="/departments">Departments</Link>
            <Icon name="chevron-right" size={14} />
            <span>{department.name}</span>
          </nav>

          <div className="row-between" style={{ alignItems: 'flex-end' }}>
            <div className="row" style={{ gap: 18, alignItems: 'center' }}>
              <div className="tile-icon" style={{ margin: 0, width: 68, height: 68 }}>
                <Icon name={department.icon} size={34} />
              </div>
              <div>
                <h1 style={{ marginBottom: 4 }}>{department.name}</h1>
                <p className="text-muted mb-0">{department.short}</p>
              </div>
            </div>
            <Button to="/patient/book" icon="calendar-plus" size="lg">
              Book appointment
            </Button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="detail-layout">
            <div className="stack">
              <div className="card">
                <div className="card-header">
                  <h3>About this department</h3>
                </div>
                <div className="card-body prose">
                  <p>{department.description}</p>
                  <p className="mb-0">
                    The {department.name} team works closely with our diagnostic and
                    inpatient services, so investigations and follow-up care are
                    coordinated around you.
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Services offered</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    {(department.services || []).map((service) => (
                      <div key={service} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                        <Icon name="check-circle" size={18} />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="row-between mb-2">
                  <h2 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>
                    Our {department.name.toLowerCase()} doctors
                  </h2>
                  <Button to="/doctors" variant="ghost" iconRight="arrow-right">
                    All doctors
                  </Button>
                </div>
                <DoctorGrid
                  doctors={doctors}
                  emptyTitle="No doctors listed yet"
                  emptyDescription="This department is currently recruiting. Please contact reception for a referral."
                />
              </div>
            </div>

            <aside className="sticky-aside stack-sm">
              <div className="card">
                <div className="card-header">
                  <h3>Department details</h3>
                </div>
                <div className="card-body">
                  <ul className="info-list">
                    <li>
                      <span className="ico">
                        <Icon name="map-pin" size={18} />
                      </span>
                      <div>
                        <strong>Location</strong>
                        <span>{department.floor}</span>
                        <span style={{ display: 'block' }}>{HOSPITAL.address}</span>
                      </div>
                    </li>
                    <li>
                      <span className="ico">
                        <Icon name="phone" size={18} />
                      </span>
                      <div>
                        <strong>Department line</strong>
                        <span>{department.phone}</span>
                      </div>
                    </li>
                    <li>
                      <span className="ico">
                        <Icon name="clock" size={18} />
                      </span>
                      <div>
                        <strong>Opening hours</strong>
                        {HOSPITAL.hours.map((slot) => (
                          <span key={slot.label} style={{ display: 'block' }}>
                            {slot.label}: {slot.value}
                          </span>
                        ))}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card card-pad">
                <h3 style={{ fontSize: 'var(--text-lg)' }}>Need help choosing?</h3>
                <p className="text-sm text-muted">
                  Our reception team can point you to the right specialist.
                </p>
                <Button to="/contact" variant="secondary" block icon="message">
                  Ask a question
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
