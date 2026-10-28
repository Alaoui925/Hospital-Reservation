import { useState } from 'react'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import MedicalRecordModal from '../../components/appointments/MedicalRecordModal.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import { useAppointments } from '../../hooks/useAppointments.js'
import * as appointmentService from '../../services/appointmentService.js'
import { STATUS_FILTERS } from '../../utils/constants.js'

const SCOPES = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past' },
]

const STATUS_STEPS = {
  pending: { label: 'Confirm', labelOn: 'confirmed', next: 'confirmed', variant: 'primary' },
  confirmed: { label: 'Complete', labelOn: 'completed', next: 'completed', variant: 'success' },
}

export default function DoctorAppointments() {
  const { user } = useAuth()
  const toast = useToast()
  const { items, loading, params, updateParams, refetch } = useAppointments({
    doctorId: user.doctorId,
    scope: 'all',
    status: 'all',
    sort: 'date-desc',
  })

  const [toCancel, setToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [recordTarget, setRecordTarget] = useState(null)

  const resetFilters = () => updateParams({ status: 'all', scope: 'all', search: '' })

  const advance = async (appt) => {
    const step = STATUS_STEPS[appt.status]
    if (!step) return
    setBusy(true)
    try {
      await appointmentService.updateAppointmentStatus(appt.id, step.next)
      toast.success('Appointment updated', `${appt.patientName}'s visit is now ${step.labelOn}.`)
      refetch()
    } catch (error) {
      toast.error('Action failed', error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (!toCancel) return
    setBusy(true)
    try {
      await appointmentService.cancelAppointment(toCancel.id, cancelReason || 'Cancelled by doctor.')
      toast.success('Appointment cancelled')
      setToCancel(null)
      setCancelReason('')
      refetch()
    } catch (error) {
      toast.error('Could not cancel', error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DashboardHeader
        title="My appointments"
        subtitle="Review requests, confirm bookings and complete visits."
        actions={
          <Button
            variant="secondary"
            icon="refresh"
            onClick={refetch}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1.6fr 1fr 1fr auto' }}>
        <Input
          label="Search"
          name="doc-appt-search"
          icon="search"
          placeholder="Patient name or reason"
          value={params.search}
          onChange={(event) => updateParams({ search: event.target.value })}
        />
        <Select
          label="Status"
          name="doc-appt-status"
          value={params.status}
          options={STATUS_FILTERS}
          onChange={(event) => updateParams({ status: event.target.value })}
        />
        <Select
          label="Timeframe"
          name="doc-appt-scope"
          value={params.scope}
          options={SCOPES}
          onChange={(event) => updateParams({ scope: event.target.value })}
        />
        <Button variant="secondary" icon="refresh" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <AppointmentTable
        appointments={items}
        loading={loading}
        perspective="doctor"
        emptyTitle="No appointments found"
        emptyDescription="Adjust the filters, or share a link with your patients to request a booking."
        onReset={resetFilters}
        actions={(appt) => (
          <>
            {STATUS_STEPS[appt.status] && (
              <Button
                size="sm"
                variant={STATUS_STEPS[appt.status].variant}
                icon="check"
                loading={busy}
                onClick={() => advance(appt)}
              >
                {STATUS_STEPS[appt.status].label}
              </Button>
            )}
            {appt.status === 'completed' && (
              <Button
                size="sm"
                variant="secondary"
                icon="clipboard-text"
                onClick={() => setRecordTarget(appt)}
              >
                Report
              </Button>
            )}
            {['pending', 'confirmed'].includes(appt.status) && (
              <Button size="sm" variant="ghost" icon="x" onClick={() => setToCancel(appt)}>
                Cancel
              </Button>
            )}
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        onCancel={() => setToCancel(null)}
        onConfirm={handleCancel}
        title="Cancel this appointment?"
        description={`This cancels ${toCancel?.patientName}'s visit. The patient will be notified.`}
        confirmLabel="Cancel appointment"
        loading={busy}
      >
        <Input
          as="textarea"
          label="Reason (sent to the patient)"
          name="cancel-reason"
          placeholder="Optional — e.g. doctor availability changed."
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          wrapperClassName="mt-2"
        />
      </ConfirmDialog>

      <MedicalRecordModal
        open={Boolean(recordTarget)}
        onClose={() => setRecordTarget(null)}
        appointment={recordTarget}
        doctor={{ id: user.doctorId, title: 'Dr.', name: user.name.replace(/^Dr\.?\s*/i, '') }}
      />
    </>
  )
}