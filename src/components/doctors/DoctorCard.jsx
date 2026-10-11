import Button from '../common/Button.jsx'
import { Icon } from '../common/Icon.jsx'
import { formatCurrency } from '../../utils/formatDate.js'
import { WEEKDAYS_SHORT } from '../../utils/constants.js'

const truncate = (text, max = 108) => {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

/** Doctor summary card used across the directory, home page and department page. */
export default function DoctorCard({ doctor, onBook, bookTo }) {
  const days = doctor.availableDays || []
  const bookLink = bookTo ?? `/patient/book?doctor=${doctor.id}`

  return (
    <article className="card card-hover doctor-card">
      <div className="doctor-card-top">
        <img src={doctor.avatar} alt={doctor.name} className="doctor-photo" loading="lazy" />
        <div className="grow">
          <h3>
            {doctor.title} {doctor.name}
          </h3>
          <div className="doctor-specialty">{doctor.specialty}</div>
          <div className="doctor-meta">
            {doctor.departmentName} · {doctor.experienceYears} yrs experience
          </div>
          <div className="row mt-1" style={{ gap: 8 }}>
            <span className="rating">
              <Icon name="star" size={14} filled /> {doctor.rating}
            </span>
            <span className="text-xs text-muted">({doctor.reviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="doctor-card-body">
        <p className="text-sm text-muted" style={{ marginBottom: 12, minHeight: 40 }}>
          {truncate(doctor.bio)}
        </p>
        <div className="row-wrap" style={{ gap: 6 }}>
          {days.slice(0, 6).map((day) => (
            <span key={day} className="badge badge-brand">
              {WEEKDAYS_SHORT[day]}
            </span>
          ))}
          {days.length === 0 && <span className="badge badge-neutral">Schedule on request</span>}
        </div>
      </div>

      <div className="doctor-card-foot">
        <span className="fee">
          {formatCurrency(doctor.fee)} <span className="text-xs text-muted">/ visit</span>
        </span>
        <span className="row" style={{ gap: 8 }}>
          <Button to={`/doctors/${doctor.id}`} variant="secondary" size="sm">
            Profile
          </Button>
          <Button
            to={onBook ? undefined : bookLink}
            onClick={onBook ? () => onBook(doctor) : undefined}
            icon="calendar-plus"
            size="sm"
          >
            Book
          </Button>
        </span>
      </div>
    </article>
  )
}
