import AppointmentStatus from './AppointmentStatus.jsx'
import Avatar from '../common/Avatar.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Loader from '../common/Loader.jsx'
import { CONSULTATION_TYPES } from '../../utils/constants.js'
import { formatDate, formatTime } from '../../utils/formatDate.js'

/**
 * Tabular appointment list for the admin and doctor workspaces.
 * `actions` is a render prop: (appointment) => ReactNode.
 */
export default function AppointmentTable({
  appointments = [],
  perspective = 'admin',
  actions,
  loading = false,
  emptyTitle = 'No appointments',
  emptyDescription = 'Nothing matches the current filters.',
  onReset,
}) {
  const showPatient = perspective !== 'patient'
  const showDoctor = perspective !== 'doctor'
  const typeLabel = (value) => CONSULTATION_TYPES.find((t) => t.value === value)?.label || value

  if (loading) {
    return (
      <div className="table-wrap">
        <Loader label="Loading appointments…" />
      </div>
    )
  }

  if (!appointments.length) {
    return (
      <div className="table-wrap">
        <EmptyState
          icon="calendar"
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={onReset ? 'Clear filters' : undefined}
          actionIcon="refresh"
          onAction={onReset}
        />
      </div>
    )
  }

  return (
    <div className="table-wrap table-scroll">
      <table className="data">
        <thead>
          <tr>
            <th>Reference</th>
            {showPatient && <th>Patient</th>}
            {showDoctor && <th>Doctor</th>}
            <th>Department</th>
            <th>Date &amp; time</th>
            <th>Type</th>
            <th>Status</th>
            {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id}>
              <td>
                <span className="text-xs text-muted">#{appt.id.slice(-6).toUpperCase()}</span>
              </td>
              {showPatient && (
                <td>
                  <div className="cell-user">
                    <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" />
                    <span>
                      <strong>{appt.patientName}</strong>
                      <span>{appt.patientEmail}</span>
                    </span>
                  </div>
                </td>
              )}
              {showDoctor && (
                <td>
                  <div className="cell-user">
                    <Avatar src={appt.doctorAvatar} name={appt.doctorName} size="sm" />
                    <span>
                      <strong>{appt.doctorName}</strong>
                      <span>{appt.doctorSpecialty}</span>
                    </span>
                  </div>
                </td>
              )}
              <td>{appt.departmentName}</td>
              <td>
                <strong style={{ display: 'block' }}>{formatDate(appt.date)}</strong>
                <span className="text-xs text-muted">{formatTime(appt.time)}</span>
              </td>
              <td>{typeLabel(appt.type)}</td>
              <td>
                <AppointmentStatus status={appt.status} />
              </td>
              {actions && (
                <td>
                  <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    {actions(appt)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
