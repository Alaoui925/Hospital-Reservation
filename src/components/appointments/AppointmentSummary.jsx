import { CONSULTATION_TYPES } from '../../utils/constants.js'
import { formatCurrency, formatDate, formatTime } from '../../utils/formatDate.js'

/** Sticky recap card shown next to the booking form. */
export default function AppointmentSummary({
  doctor,
  department,
  date,
  time,
  type,
  fee,
  title = 'Appointment summary',
}) {
  const typeLabel = CONSULTATION_TYPES.find((t) => t.value === type)?.label

  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        {doctor ? (
          <div className="row mb-2" style={{ gap: 12 }}>
            <img src={doctor.avatar} alt="" className="avatar avatar-lg" />
            <div>
              <strong>
                {doctor.title} {doctor.name}
              </strong>
              <div className="text-sm" style={{ color: 'var(--brand-700)', fontWeight: 600 }}>
                {doctor.specialty}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Choose a department and doctor to see your summary here.
          </p>
        )}

        <div className="price-row">
          <span>Department</span>
          <strong>{department?.name || '—'}</strong>
        </div>
        <div className="price-row">
          <span>Date</span>
          <strong>{date ? formatDate(date) : '—'}</strong>
        </div>
        <div className="price-row">
          <span>Time</span>
          <strong>{time ? formatTime(time) : '—'}</strong>
        </div>
        <div className="price-row">
          <span>Consultation</span>
          <strong>{typeLabel || '—'}</strong>
        </div>
        {Number.isFinite(fee) && (
          <div className="price-row total">
            <span>Fee</span>
            <span>{formatCurrency(fee)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
