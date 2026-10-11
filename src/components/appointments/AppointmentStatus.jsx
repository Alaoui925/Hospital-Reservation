import { STATUS_META } from '../../utils/constants.js'

/** Coloured pill for an appointment status. */
export default function AppointmentStatus({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: 'neutral' }
  return (
    <span className={`badge badge-${meta.tone}`}>
      <span className="badge-dot" />
      {meta.label}
    </span>
  )
}
