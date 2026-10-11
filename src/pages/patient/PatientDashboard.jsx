import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import RecentAppointments from '../../components/dashboard/RecentAppointments.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import * as appointmentService from '../../services/appointmentService.js'
import { formatDate, formatTime, relativeDayLabel } from '../../utils/formatDate.js'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined
    setLoading(true)
    Promise.all([
      appointmentService.getAppointmentStats({ patientId: user.id }),
      appointmentService.queryAppointments({
        patientId: user.id,
        scope: 'upcoming',
        sort: 'date-asc',
      }),
      appointmentService.queryAppointments({
        patientId: user.id,
        sort: 'date-desc',
      }),
    ])
      .then(([statsResult, upcomingResult, recentResult]) => {
        if (!active) return
        setStats(statsResult)
        setUpcoming(upcomingResult)
        setRecent(recentResult.slice(0, 4))
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user?.id])

  const next = upcoming[0]

  return (
    <>
      <DashboardHeader
        greet
        subtitle="Here is an overview of your upcoming care."
        actions={
          <Button to="/patient/book" icon="calendar-plus">
            Book appointment
          </Button>
        }
      />

      {loading ? (
        <Loader label="Loading your dashboard…" />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              icon="calendar"
              label="Upcoming"
              value={stats?.upcoming ?? 0}
              tone="brand"
              to="/patient/appointments"
            />
            <StatCard
              icon="check-circle"
              label="Confirmed"
              value={stats?.confirmed ?? 0}
              tone="success"
            />
            <StatCard
              icon="clipboard"
              label="Completed"
              value={stats?.completed ?? 0}
              tone="info"
            />
            <StatCard
              icon="alert-circle"
              label="Cancelled"
              value={stats?.cancelled ?? 0}
              tone="warning"
            />
          </div>

          {next ? (
            <div className="card mb-2" style={{ overflow: 'hidden' }}>
              <div
                className="row-between"
                style={{
                  padding: '22px 24px',
                  background: 'linear-gradient(120deg, var(--brand-700), var(--brand-500))',
                  color: '#fff',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 18,
                }}
              >
                <div>
                  <span className="text-xs" style={{ letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.85 }}>
                    Your next appointment
                  </span>
                  <h2 style={{ color: '#fff', margin: '8px 0 4px' }}>{next.doctorName}</h2>
                  <p style={{ color: 'rgba(255,255,255,.9)', margin: 0 }}>
                    {next.departmentName} · {next.doctorSpecialty}
                  </p>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
                    {formatDate(next.date)}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,.9)' }}>
                    {formatTime(next.time)} · {relativeDayLabel(next.date)}
                  </div>
                </div>
              </div>
              <div className="card-body row-between" style={{ flexWrap: 'wrap', gap: 14 }}>
                <div className="row" style={{ gap: 10 }}>
                  <Icon name="map-pin" size={16} />
                  <span className="text-sm text-muted">
                    Room {next.room || '—'} · please arrive 10 minutes early
                  </span>
                </div>
                <div className="row-wrap">
                  <Button to={`/patient/appointments/${next.id}`} variant="secondary" icon="eye">
                    View details
                  </Button>
                  <Button to={`/patient/appointments/${next.id}`} icon="calendar" >
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-pad row-between mb-2" style={{ flexWrap: 'wrap', gap: 16 }}>
              <div className="row" style={{ gap: 14 }}>
                <span className="stat-icon brand">
                  <Icon name="calendar-plus" size={22} />
                </span>
                <div>
                  <strong style={{ display: 'block' }}>No upcoming appointments</strong>
                  <span className="text-sm text-muted">
                    Book a visit with one of our specialists whenever you need.
                  </span>
                </div>
              </div>
              <Button to="/patient/book" icon="calendar-plus">
                Book now
              </Button>
            </div>
          )}

          {upcoming.length > 1 && (
            <div className="card mb-2">
              <div className="card-header">
                <h3>Also coming up</h3>
                <Link to="/patient/appointments" className="btn btn-ghost btn-sm">
                  View all <Icon name="arrow-right" size={14} />
                </Link>
              </div>
              <div className="card-body stack-sm" style={{ gap: 12 }}>
                {upcoming.slice(1, 4).map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    perspective="patient"
                    to={`/patient/appointments/${appt.id}`}
                  />
                ))}
              </div>
            </div>
          )}

          <RecentAppointments
            appointments={recent}
            perspective="patient"
            title="Recent activity"
            viewAllTo="/patient/appointments"
            itemLinkTo={(appt) => `/patient/appointments/${appt.id}`}
            emptyTitle="No appointment history yet"
            emptyDescription="Your past and cancelled appointments will appear here."
          />

          <div className="grid grid-3 mt-3">
            <Link to="/patient/book" className="tile">
              <div className="tile-icon">
                <Icon name="calendar-plus" size={24} />
              </div>
              <h3>Book appointment</h3>
              <p>Find a specialist and reserve a slot in minutes.</p>
            </Link>
            <Link to="/doctors" className="tile">
              <div className="tile-icon">
                <Icon name="stethoscope" size={24} />
              </div>
              <h3>Browse doctors</h3>
              <p>Compare experience, fees and patient ratings.</p>
            </Link>
            <Link to="/patient/profile" className="tile">
              <div className="tile-icon">
                <Icon name="user" size={24} />
              </div>
              <h3>Update profile</h3>
              <p>Keep your contact and medical details current.</p>
            </Link>
          </div>
        </>
      )}
    </>
  )
}
