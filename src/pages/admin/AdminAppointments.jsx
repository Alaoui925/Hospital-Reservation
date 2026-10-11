import { useState } from 'react'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import { useAppointments } from '../../hooks/useAppointments.js'
import * as appointmentService from '../../services/appointmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { STATUS_FILTERS } from '../../utils/constants.js'

const SCOPES = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past' },
]

const SORTS = [
  { value: 'date-asc', label: 'Date (soonest first)' },
  { value: 'date-desc', label: 'Date (newest first)' },
  { value: 'patient', label: 'Patient name' },
  { value: 'doctor', label: 'Doctor name' },
  { value: 'status', label: 'Status' },
]

export default function AdminAppointments() {
  const toast = useToast()
  const { items, loading, params, updateParams, refetch } = useAppointments({
    status: 'all',
    scope: 'all',
    search: '',
    sort: 'date-desc',
  })

  const [busy, setBusy] = useState(false)
  const [toCancel, setToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [toReassign, setToReassign] = useState(null)
  const [doctorOptions, setDoctorOptions] = useState([])
  const [newDoctorId, setNewDoctorId] = useState('')

  const resetFilters = () => updateParams({ status: 'all', scope: 'all', search: '' })

  const openReassign = async (appt) => {
    setToReassign(appt)
    setNewDoctorId('')
    if (!doctorOptions.length) {
      const doctors = await doctorService.getDoctors({ perPage: 100 })
      setDoctorOptions(doctors.items.map((d) => ({ value: d.id, label: `${d.title} ${d.name}` })))
    }
  }

  const setStatus = async (appt, status) => {
    setBusy(true)
    try {
      await appointmentService.updateAppointmentStatus(appt.id, status)
      toast.success('Appointment updated', `${appt.patientName}'s visit is now ${status}.`)
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
      await appointmentService.cancelAppointment(toCancel.id, cancelReason || 'Cancelled by administrator.')
      toast.success('Appointment cancelled', `${toCancel.patientName} has been notified.`)
      setToCancel(null)
      setCancelReason('')
      refetch()
    } catch (error) {
      toast.error('Could not cancel', error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReassign = async () => {
    if (!toReassign || !newDoctorId) return
    setBusy(true)
    try {
      await appointmentService.reassignDoctor(toReassign.id, newDoctorId)
      toast.success('Doctor reassigned', 'The appointment now points to the new doctor.')
      setToReassign(null)
      refetch()
    } catch (error) {
      toast.error('Could not reassign', error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DashboardHeader
        title="All appointments"
        subtitle="Search the full booking ledger, change status and reassign doctors."
        actions={
          <Button variant="secondary" icon="refresh" onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr auto' }}>
        <Input
          label="Search"
          name="admin-appt-search"
          icon="search"
          placeholder="Patient, doctor, department or reason"
          value={params.search}
          onChange={(event) => updateParams({ search: event.target.value })}
        />
        <Select
          label="Status"
          name="admin-appt-status"
          value={params.status}
          options={STATUS_FILTERS}
          onChange={(event) => updateParams({ status: event.target.value })}
        />
        <Select
          label="Timeframe"
          name="admin-appt-scope"
          value={params.scope}
          options={SCOPES}
          onChange={(event) => updateParams({ scope: event.target.value })}
        />
        <Select
          label="Sort"
          name="admin-appt-sort"
          value={params.sort}
          options={SORTS}
          onChange={(event) => updateParams({ sort: event.target.value })}
        />
        <Button variant="secondary" icon="refresh" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <AppointmentTable
        appointments={items}
        loading={loading}
        perspective="admin"
        emptyTitle="No appointments found"
        emptyDescription="Adjust the filters above, or wait for new booking requests to arrive."
        onReset={resetFilters}
        actions={(appt) => (
          <>
            {appt.status === 'pending' && (
              <Button size="sm" icon="check" loading={busy} onClick={() => setStatus(appt, 'confirmed')}>
                Confirm
              </Button>
            )}
            {appt.status === 'confirmed' && (
              <Button size="sm" variant="success" icon="check" loading={busy} onClick={() => setStatus(appt, 'completed')}>
                Complete
              </Button>
            )}
            {['pending', 'confirmed'].includes(appt.status) && (
              <Button size="sm" variant="ghost" icon="x" onClick={() => setToCancel(appt)}>
                Cancel
              </Button>
            )}
            <Button size="sm" variant="ghost" icon="refresh" onClick={() => openReassign(appt)}>
              Assign
            </Button>
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(toCancel)}
        onCancel={() => setToCancel(null)}
        onConfirm={handleCancel}
        title="Cancel this appointment?"
        description={`This cancels ${toCancel?.patientName}'s visit with ${toCancel?.doctorName}.`}
        confirmLabel="Cancel appointment"
        loading={busy}
      >
        <Input
          as="textarea"
          label="Reason (sent to the patient)"
          name="admin-cancel-reason"
          placeholder="Optional — e.g. clinic closed."
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          wrapperClassName="mt-2"
        />
      </ConfirmDialog>

      <Modal
        open={Boolean(toReassign)}
        onClose={() => setToReassign(null)}
        title="Reassign appointment"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToReassign(null)}>
              Cancel
            </Button>
            <Button icon="check" onClick={handleReassign} loading={busy} disabled={!newDoctorId}>
              Reassign
            </Button>
          </>
        }
      >
        {toReassign && (
          <div className="stack-sm">
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              <Icon name="info" size={18} />
              <span>
                Moving <strong>{toReassign.patientName}</strong> to another doctor updates the
                department and notifies the new clinic.
              </span>
            </div>
            <Select
              label="New doctor"
              name="reassign-doctor"
              placeholder="Choose a doctor…"
              options={doctorOptions}
              value={newDoctorId}
              onChange={(event) => setNewDoctorId(event.target.value)}
            />
          </div>
        )}
      </Modal>
    </>
  )
}