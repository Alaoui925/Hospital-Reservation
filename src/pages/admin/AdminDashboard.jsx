import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppointmentStatus from '../../components/appointments/AppointmentStatus.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as adminService from '../../services/adminService.js'
import { formatCurrency, formatTime, relativeTime } from '../../utils/formatDate.js'

const QUICK_ACTIONS = [
  { to: '/admin/appointments', icon: 'calendar', tone: 'brand', title: 'Appointments', text: 'Monitor bookings and confirm requests.' },
  { to: '/admin/doctors', icon: 'stethoscope', tone: 'success', title: 'Manage doctors', text: 'Add, edit or retire doctors.' },
  { to: '/admin/departments', icon: 'building', tone: 'info', title: 'Departments', text: 'Keep the specialty catalogue in shape.' },
  { to: '/admin/schedules', icon: 'clock', tone: 'warning', title: 'Schedules', text: 'Review each doctor’s availability.' },
]

export default function AdminDashboard() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [statsResult, activityResult] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentActivity(7),
    ])
    setStats(statsResult)
    setActivity(activityResult)
  }

  useEffect(() => {
    let active = true
    load()
      .catch((error) => {
        if (active) toast.error('Failed to load dashboard', error.message)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <Loader label="Loading hospital overview…" />

  const maxAppointments = Math.max(
    1,
    ...(stats?.byDepartment || []).map((d) => d.appointments),
  )

  return (
    <>
      <DashboardHeader
        title="Hospital overview"
        subtitle="A real-time pulse of appointments, doctors and revenue."
        actions={
          <Button variant="secondary" icon="refresh" onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="stat-grid">
        <StatCard icon="calendar" label="Total appointments" value={stats?.totalAppointments ?? 0} tone="brand" hint="All time" />
        <StatCard icon="activity" label="Today" value={stats?.todayAppointments ?? 0} tone="info" hint={`${stats?.upcomingWeek ?? 0} in the next 7 days`} />
        <StatCard icon="clock" label="Pending" value={stats?.pending ?? 0} tone="warning" hint="Awaiting confirmation" />
        <StatCard icon="check-circle" label="Completed" value={stats?.completed ?? 0} tone="success" hint="Visits finished" />
        <StatCard icon="dollar" label="Est. revenue" value={formatCurrency(stats?.estimatedRevenue ?? 0)} tone="success" hint="From completed visits" />
        <StatCard icon="users" label="Patients" value={stats?.totalPatients ?? 0} tone="info" hint={`${stats?.newPatientsThisMonth ?? 0} joined this month`} />
      </div>

      <div className="grid grid-2" style={{ gap: 18 }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent activity</h3>
            <Link to="/admin/appointments" className="btn btn-ghost btn-sm">
              All appointments <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <div className="card-body stack-sm" style={{ gap: 12 }}>
            {activity.length === 0 ? (
              <p className="text-sm text-muted mb-0">No activity yet.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div
                    className="empty-icon"
                    style={{ width: 36, height: 36, borderRadius: 10, flex: '0 0 auto' }}
                  >
                    <Icon name="activity" size={16} />
                  </div>
                  <div className="grow">
                    <strong className="text-sm" style={{ display: 'block' }}>
                      {item.patientName} → {item.doctorName}
                    </strong>
                    <span className="text-xs text-muted">
                      {formatTime(item.time)} · {relativeTime(item.updatedAt)}
                    </span>
                  </div>
                  <AppointmentStatus status={item.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Appointments by department</h3>
            <span className="badge badge-neutral">{stats?.totalDepartments ?? 0} departments</span>
          </div>
          <div className="card-body stack-sm" style={{ gap: 14 }}>
            {stats?.byDepartment?.length ? (
              stats.byDepartment.map((dep) => (
                <div key={dep.id}>
                  <div className="row-between mb-1">
                    <span className="text-sm" style={{ fontWeight: 600 }}>
                      <Icon name={dep.icon} size={15} /> {dep.name}
                    </span>
                    <span className="text-xs text-muted">
                      {dep.appointments} visit{dep.appointments === 1 ? '' : 's'} · {dep.doctors} doctor{dep.doctors === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${(dep.appointments / maxAppointments) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted mb-0">No department data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-4 mt-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} className="tile">
            <div className={`tile-icon stat-icon ${action.tone}`}>
              <Icon name={action.icon} size={22} />
            </div>
            <h3>{action.title}</h3>
            <p>{action.text}</p>
          </Link>
        ))}
      </div>

      <div className="card mt-3">
        <div className="card-header">
          <h3>Doctor status</h3>
          <span className="badge badge-brand">{stats?.activeDoctors ?? 0} active</span>
        </div>
        <div className="card-body">
          {stats && (
            <div className="row-wrap" style={{ gap: 18 }}>
              <div className="row" style={{ gap: 8 }}>
                <Avatar name="MediCare" />
                <div>
                  <strong className="text-sm" style={{ display: 'block' }}>
                    {stats.totalDoctors} doctors on staff
                  </strong>
                  <span className="text-xs text-muted">
                    {stats.activeDoctors} active · {stats.totalDoctors - stats.activeDoctors} inactive
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted mb-0" style={{ maxWidth: 420 }}>
                Keep doctor accounts and schedules current — patients book directly against
                the availability defined in <Link to="/admin/schedules">Schedules</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}