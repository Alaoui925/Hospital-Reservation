import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppointmentStatus from '../../components/appointments/AppointmentStatus.jsx'
import RescheduleDialog from '../../components/appointments/RescheduleDialog.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as appointmentService from '../../services/appointmentService.js'
import { CONSULTATION_TYPES } from '../../utils/constants.js'
import { formatCurrency, formatDate, formatDateTime, formatTime, relativeDayLabel, relativeTime } from '../../utils/formatDate.js'
import { canModifyAppointment } from '../../utils/permissions.js'

export default function AppointmentDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  const load = useCallback(() => {
    let active = true
    setLoading(true)
    appointmentService
      .getAppointmentById(id)
      .then((appt) => {
        if (!active) return
        const isOwner = appt.patientId === user?.id
        if (!isOwner && user?.role === 'patient') {
          setDenied(true)
        } else {
          setAppointment(appt)
        }
      })
      .catch(() => active && setAppointment(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, user?.id, user?.role])

  useEffect(() => {
    const cleanup = load()
    return cleanup
  }, [load])

  const handleCancel = async () => {
    setBusy(true)
    try {
      const updated = await appointmentService.cancelAppointment(
        appointment.id,
        'Cancelled by patient.',
      )
      setAppointment(updated)
      setConfirmCancel(false)
      toast.success('Appointment cancelled', 'You can book a new visit at any time.')
    } catch (error) {
      toast.error('Could not cancel', error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReschedule = async ({ date, time }) => {
    setBusy(true)
    try {
      const updated = await appointmentService.rescheduleAppointment(appointment.id, { date, time })
      setAppointment(updated)
      setRescheduling(false)
      toast.success('Appointment rescheduled', 'Awaiting confirmation from the clinic.')
    } catch (error) {
      toast.error('Could not reschedule', error.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader label="Loading appointment…" />

  if (denied) {
    return (
      <div className="card">
        <EmptyState
          icon="lock"
          title="You cannot view this appointment"
          description="It belongs to a different patient account."
          actionLabel="Back to my appointments"
          actionTo="/patient/appointments"
          actionIcon="arrow-left"
        />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="card">
        <EmptyState
          icon="calendar"
          title="Appointment not found"
          description="This appointment may have been removed."
          actionLabel="Back to my appointments"
          actionTo="/patient/appointments"
          actionIcon="arrow-left"
        />
      </div>
    )
  }

  const typeLabel = CONSULTATION_TYPES.find((t) => t.value === appointment.type)?.label || appointment.type
  const modifiable = canModifyAppointment(user, appointment)

  const timeline = [
    { title: 'Request submitted', when: appointment.createdAt, done: true },
    {
      title: 'Confirmed by clinic',
      when: ['confirmed', 'completed'].includes(appointment.status) ? appointment.updatedAt : null,
      done: ['confirmed', 'completed'].includes(appointment.status),
    },
    {
      title: appointment.status === 'cancelled' ? 'Appointment cancelled' : 'Visit completed',
      when: ['completed', 'cancelled'].includes(appointment.status) ? appointment.updatedAt : null,
      done: ['completed', 'cancelled'].includes(appointment.status),
    },
  ]

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/patient">Dashboard</Link>
        <Icon name="chevron-right" size={14} />
        <Link to="/patient/appointments">My appointments</Link>
        <Icon name="chevron-right" size={14} />
        <span>#{appointment.id.slice(-6).toUpperCase()}</span>
      </nav>

      <div className="page-header row-between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="row" style={{ gap: 12 }}>
            <h1 style={{ marginBottom: 0 }}>Appointment details</h1>
            <AppointmentStatus status={appointment.status} />
          </div>
          <p>Reference #{appointment.id.slice(-6).toUpperCase()}</p>
        </div>
        <div className="row-wrap">
          <Button variant="secondary" to="/patient/appointments" icon="arrow-left">
            Back
          </Button>
          {modifiable && (
            <>
              <Button variant="secondary" icon="calendar" onClick={() => setRescheduling(true)}>
                Reschedule
              </Button>
              <Button variant="danger" icon="x" onClick={() => setConfirmCancel(true)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="stack">
          <div className="card">
            <div className="card-header">
              <h3>Visit information</h3>
              <span className="badge badge-neutral">{typeLabel}</span>
            </div>
            <div className="card-body">
              <div className="grid grid-2" style={{ gap: 20 }}>
                <div>
                  <div className="stat-label">Doctor</div>
                  <div className="row mt-1" style={{ gap: 12 }}>
                    <img src={appointment.doctorAvatar} alt="" className="avatar avatar-lg" />
                    <div>
                      <strong>{appointment.doctorName}</strong>
                      <div className="text-sm" style={{ color: 'var(--brand-700)', fontWeight: 600 }}>
                        {appointment.doctorSpecialty}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="stat-label">Department</div>
                  <p className="mt-1 mb-0">
                    <Icon name={appointment.departmentIcon} size={15} /> {appointment.departmentName}
                  </p>
                </div>
                <div>
                  <div className="stat-label">Date &amp; time</div>
                  <p className="mt-1 mb-0">
                    <strong>{formatDate(appointment.date)}</strong>
                    <br />
                    <span className="text-muted">
                      {formatTime(appointment.time)} · {relativeDayLabel(appointment.date)}
                    </span>
                  </p>
                </div>
                <div>
                  <div className="stat-label">Consultation fee</div>
                  <p className="mt-1 mb-0">
                    <strong>{formatCurrency(appointment.doctorFee)}</strong>
                    <br />
                    <span className="text-muted">Payable after your visit</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Reason for visit</h3>
            </div>
            <div className="card-body">
              <p className="mb-0">{appointment.reason}</p>
            </div>
          </div>

          {appointment.notes && (
            <div className="card">
              <div className="card-header">
                <h3>Clinical notes</h3>
              </div>
              <div className="card-body">
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3>Progress</h3>
            </div>
            <div className="card-body">
              <div className="timeline">
                {timeline.map((step) => (
                  <div key={step.title} className="timeline-item">
                    <strong style={{ color: step.done ? 'var(--ink-900)' : 'var(--ink-400)' }}>
                      {step.title}
                    </strong>
                    <p className="text-sm text-muted mb-0">
                      {step.when ? relativeTime(step.when) : 'Pending'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="sticky-aside stack-sm">
          <div className="card">
            <div className="card-header">
              <h3>Purpose</h3>
            </div>
            <div className="card-body">
              <ul className="info-list">
                <li>
                  <span className="ico">
                    <Icon name="calendar-check" size={18} />
                  </span>
                  <div>
                    <strong>Scheduled</strong>
                    <span>{formatDateTime(appointment.date, appointment.time)}</span>
                  </div>
                </li>
                <li>
                  <span className="ico">
                    <Icon name="clock" size={18} />
                  </span>
                  <div>
                    <strong>Duration</strong>
                    <span>30 minutes</span>
                  </div>
                </li>
                <li>
                  <span className="ico">
                    <Icon name="info" size={18} />
                  </span>
                  <div>
                    <strong>What to bring</strong>
                    <span>Photo ID, insurance card and any relevant test results.</span>
                  </div>
                </li>
              </ul>
              <Button to="/contact" variant="secondary" block className="mt-2" icon="message">
                Ask about this visit
              </Button>
            </div>
          </div>

          {appointment.status === 'pending' && (
            <div className="alert alert-warning mb-0">
              <Icon name="alert-triangle" size={18} />
              <span>
                This appointment is waiting for confirmation from the clinic. You will be
                notified as soon as it is reviewed.
              </span>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this appointment?"
        description="The clinic will be notified and your slot will be released. This cannot be undone."
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep appointment"
        loading={busy}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />

      <RescheduleDialog
        open={rescheduling}
        appointment={appointment}
        loading={busy}
        onClose={() => setRescheduling(false)}
        onConfirm={handleReschedule}
      />
    </>
  )
}
