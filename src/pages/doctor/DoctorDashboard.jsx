import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx'
import AppointmentStatus from '../../components/appointments/AppointmentStatus.jsx'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as appointmentService from '../../services/appointmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { formatTime, relativeDayLabel } from '../../utils/formatDate.js'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const toast = useToast()

  const [doctor, setDoctor] = useState(null)
  const [stats, setStats] = useState(null)
  const [today, setToday] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    doctorService
      .getDoctorByUserId(user.id)
      .then(async (doc) => {
        if (!active) return
        setDoctor(doc)
        const [statsResult, todayResult, upcomingResult] = await Promise.all([
          doctorService.getDoctorStats(doc.id),
          appointmentService.queryAppointments({ doctorId: doc.id, scope: 'today' }),
          appointmentService.queryAppointments({ doctorId: doc.id, scope: 'upcoming', sort: 'date-asc' }),
        ])
        if (!active) return
        setStats(statsResult)
        setToday(todayResult)
        setUpcoming(upcomingResult)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  const refresh = async () => {
    if (!doctor) return
    const [statsResult, todayResult, upcomingResult] = await Promise.all([
      doctorService.getDoctorStats(doctor.id),
      appointmentService.queryAppointments({ doctorId: doctor.id, scope: 'today' }),
      appointmentService.queryAppointments({ doctorId: doctor.id, scope: 'upcoming', sort: 'date-asc' }),
    ])
    setStats(statsResult)
    setToday(todayResult)
    setUpcoming(upcomingResult)
  }

  const setStatus = async (appointment, status, note) => {
    try {
      await appointmentService.updateAppointmentStatus(appointment.id, status, note)
      toast.success(
        status === 'confirmed'
          ? 'Appointment confirmed'
          : status === 'completed'
            ? 'Appointment completed'
            : 'Appointment cancelled',
      )
      refresh()
    } catch (error) {
      toast.error('Action failed', error.message)
    }
  }

  if (loading) return <Loader label="Loading your dashboard…" />

  return (
    <>
      <DashboardHeader
        title={doctor ? `Good day, ${doctor.name.split(' ')[0]}` : 'Doctor dashboard'}
        subtitle="Your consultations and upcoming schedule at a glance."
        actions={
          <Button to="/doctor/appointments" icon="calendar">
            All appointments
          </Button>
        }
      />

      <div className="stat-grid">
        <StatCard icon="calendar" label="Today" value={stats?.today ?? 0} tone="brand" hint={today[0] ? `First visit at ${formatTime(today[0].time)}` : 'No visits scheduled'} />
        <StatCard icon="clock" label="Pending" value={stats?.pending ?? 0} tone="warning" hint="Awaiting your confirmation" />
        <StatCard icon="check-circle" label="Confirmed" value={stats?.confirmed ?? 0} tone="success" hint="Booked and ready" />
        <StatCard icon="clipboard" label="Completed" value={stats?.completed ?? 0} tone="info" hint="Visits so far" />
      </div>

      {today.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h3>Today&apos;s schedule</h3>
            <span className="badge badge-brand">
              {today.filter((a) => a.status === 'pending').length} pending action
            </span>
          </div>
          <div className="card-body">
            <AppointmentTable
              appointments={today}
              perspective="doctor"
              actions={(appt) => (
                <>
                  {appt.status === 'pending' && (
                    <Button size="sm" icon="check" onClick={() => setStatus(appt, 'confirmed')}>
                      Confirm
                    </Button>
                  )}
                  {appt.status === 'confirmed' && (
                    <Button size="sm" variant="success" icon="check" onClick={() => setStatus(appt, 'completed')}>
                      Complete
                    </Button>
                  )}
                </>
              )}
              emptyTitle="Nothing scheduled today"
              emptyDescription="Enjoy a free slot — new requests arrive throughout the day."
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Upcoming appointments</h3>
          <Link to="/doctor/appointments" className="btn btn-ghost btn-sm">
            View all <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        <div className="card-body stack-sm" style={{ gap: 12 }}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted mb-0">No upcoming appointments.</p>
          ) : (
            upcoming.slice(0, 5).map((appt) => (
              <div key={appt.id} className="appt-card card" style={{ padding: '14px 18px', boxShadow: 'none' }}>
                <div className="appt-date" style={{ width: 54 }}>
                  <strong>{appt.date.slice(8, 10)}</strong>
                  <span>{new Date(appt.date + 'T00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div className="grow">
                  <div className="row-between" style={{ gap: 10 }}>
                    <strong>{appt.patientName}</strong>
                    <AppointmentStatus status={appt.status} />
                  </div>
                  <div className="appt-meta">
                    {formatTime(appt.time)} · {relativeDayLabel(appt.date)} · {appt.reason.slice(0, 70)}
                    {appt.reason.length > 70 ? '…' : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-2 mt-3">
        <Link to="/doctor/availability" className="tile">
          <div className="tile-icon">
            <Icon name="clock" size={24} />
          </div>
          <h3>Manage availability</h3>
          <p>Set your clinic days and adjust which time slots patients can book.</p>
        </Link>
        <Link to="/doctor/profile" className="tile">
          <div className="tile-icon">
            <Icon name="user" size={24} />
          </div>
          <h3>Edit my profile</h3>
          <p>Update your bio, consultation fee and room details.</p>
        </Link>
      </div>
    </>
  )
}