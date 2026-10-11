import { useState } from 'react'
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx'
import RescheduleDialog from '../../components/appointments/RescheduleDialog.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import { useAppointments } from '../../hooks/useAppointments.js'
import * as appointmentService from '../../services/appointmentService.js'
import { STATUS_FILTERS } from '../../utils/constants.js'
import { canModifyAppointment } from '../../utils/permissions.js'

const SCOPES = [
  { value: 'all', label: 'All appointments' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past & cancelled' },
]

export default function MyAppointments() {
  const { user } = useAuth()
  const toast = useToast()
  const { items, loading, params, updateParams, refetch } = useAppointments({
    patientId: user.id,
    scope: 'all',
    status: 'all',
    sort: 'date-asc',
  })

  const [toCancel, setToCancel] = useState(null)
  const [toReschedule, setToReschedule] = useState(null)
  const [busy, setBusy] = useState(false)

  const resetFilters = () => updateParams({ status: 'all', scope: 'all', search: '' })

  const handleCancel = async () => {
    if (!toCancel) return
    setBusy(true)
    try {
      await appointmentService.cancelAppointment(toCancel.id, 'Cancelled by patient.')
      toast.success('Appointment cancelled', 'You can book a new visit at any time.')
      setToCancel(null)
      refetch()
    } catch (error) {
      toast.error('Could not cancel', error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReschedule = async ({ date, time }) => {
    if (!toReschedule) return
    setBusy(true)
    try {
      await appointmentService.rescheduleAppointment(toReschedule.id, { date, time })
      toast.success('Appointment rescheduled', 'Awaiting confirmation from the clinic.')
      setToReschedule(null)
      refetch()
    } catch (error) {
      toast.error('Could not reschedule', error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DashboardHeader
        title="My appointments"
        subtitle="Every appointment you have booked, past and present."
        actions={
          <Button to="/patient/book" icon="calendar-plus">
            Book appointment
          </Button>
        }
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1.4fr 1fr 1fr auto' }}>
        <Input
          label="Search"
          name="appt-search"
          icon="search"
          placeholder="Doctor, department or reason"
          value={params.search}
          onChange={(event) => updateParams({ search: event.target.value })}
        />
        <Select
          label="Status"
          name="appt-status"
          value={params.status}
          options={STATUS_FILTERS}
          onChange={(event) => updateParams({ status: event.target.value })}
        />
        <Select
          label="Show"
          name="appt-scope"
          value={params.scope}
          options={SCOPES}
          onChange={(event) => updateParams({ scope: event.target.value })}
        />
        <Button variant="secondary" icon="refresh" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading your appointments…" />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="calendar"
            title="No appointments found"
            description="Nothing matches the current filters. Try widening your search or book a new visit."
            actionLabel="Book an appointment"
            actionTo="/patient/book"
            actionIcon="calendar-plus"
          />
        </div>
      ) : (
        <div className="stack-sm" style={{ gap: 14 }}>
          {items.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              perspective="patient"
              to={`/patient/appointments/${appt.id}`}
            >
              <Button
                to={`/patient/appointments/${appt.id}`}
                variant="secondary"
                size="sm"
                icon="eye"
              >
                Details
              </Button>
              {canModifyAppointment(user, appt) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="calendar"
                    onClick={() => setToReschedule(appt)}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="x"
                    onClick={() => setToCancel(appt)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </AppointmentCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel this appointment?"
        description={
          toCancel
            ? `Your appointment with ${toCancel.doctorName} on ${toCancel.date} at ${toCancel.time} will be cancelled. This cannot be undone.`
            : ''
        }
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep appointment"
        tone="danger"
        loading={busy}
        onConfirm={handleCancel}
        onCancel={() => setToCancel(null)}
      />

      <RescheduleDialog
        open={Boolean(toReschedule)}
        appointment={toReschedule}
        loading={busy}
        onClose={() => setToReschedule(null)}
        onConfirm={handleReschedule}
      />
    </>
  )
}
