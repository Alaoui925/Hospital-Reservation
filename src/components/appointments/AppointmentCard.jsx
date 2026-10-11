import { Link } from 'react-router-dom'
import AppointmentStatus from './AppointmentStatus.jsx'
import { Icon } from '../common/Icon.jsx'
import { CONSULTATION_TYPES } from '../../utils/constants.js'
import { formatTime, monthShort, parseISODate, relativeDayLabel } from '../../utils/formatDate.js'

const truncate = (text, max = 130) =>
  text && text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

/**
 * Compact appointment row.
 * `perspective` decides whose details are highlighted: patient | doctor | admin.
 */
export default function AppointmentCard({ appointment, perspective = 'patient', to, children }) {
  const appt = appointment
  const date = parseISODate(appt.date)
  const typeLabel = CONSULTATION_TYPES.find((t) => t.value === appt.type)?.label || appt.type

  const person =
    perspective === 'doctor'
      ? { name: appt.patientName, sub: appt.patientEmail || 'Patient' }
      : { name: appt.doctorName, sub: appt.doctorSpecialty }

  return (
    <article className="card appt-card">
      <div className="appt-date">
        <strong>{date.getDate()}</strong>
        <span>{monthShort(appt.date)}</span>
      </div>

      <div className="grow">
        <div className="row-between" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div className="appt-title">
            {to ? <Link to={to}>{person.name}</Link> : person.name}
          </div>
          <AppointmentStatus status={appt.status} />
        </div>
        <div className="appt-meta">{person.sub}</div>

        <div className="appt-meta row-wrap mt-1" style={{ gap: 16 }}>
          <span className="row" style={{ gap: 6 }}>
            <Icon name="clock" size={14} />
            {formatTime(appt.time)}
            <span className="text-muted">· {relativeDayLabel(appt.date)}</span>
          </span>
          <span className="row" style={{ gap: 6 }}>
            <Icon name="building" size={14} />
            {appt.departmentName}
          </span>
          <span className="row" style={{ gap: 6 }}>
            <Icon name={appt.type === 'video' ? 'video' : 'clipboard'} size={14} />
            {typeLabel}
          </span>
          {perspective === 'admin' && (
            <span className="row" style={{ gap: 6 }}>
              <Icon name="user" size={14} />
              {appt.patientName}
            </span>
          )}
        </div>

        {appt.reason && (
          <p className="text-sm text-muted mt-1 mb-0">{truncate(appt.reason)}</p>
        )}
      </div>

      {children && (
        <div className="row-wrap" style={{ alignSelf: 'center', justifyContent: 'flex-end' }}>
          {children}
        </div>
      )}
    </article>
  )
}
