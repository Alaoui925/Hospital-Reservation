import { Link } from 'react-router-dom'
import AppointmentCard from '../appointments/AppointmentCard.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Loader from '../common/Loader.jsx'
import { Icon } from '../common/Icon.jsx'

/**
 * "Latest appointments" panel for dashboards.
 * `perspective` is forwarded to AppointmentCard (patient | doctor | admin).
 */
export default function RecentAppointments({
  appointments = [],
  loading = false,
  title = 'Recent appointments',
  perspective = 'patient',
  viewAllTo,
  viewAllLabel = 'View all',
  emptyTitle = 'No appointments yet',
  emptyDescription = 'New activity will appear here.',
  itemLinkTo,
}) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
        {viewAllTo && (
          <Link to={viewAllTo} className="btn btn-ghost btn-sm">
            {viewAllLabel} <Icon name="arrow-right" size={14} />
          </Link>
        )}
      </div>
      <div className="card-body">
        {loading ? (
          <Loader label="Loading appointments…" />
        ) : appointments.length === 0 ? (
          <EmptyState icon="calendar" title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="stack-sm" style={{ gap: 12 }}>
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                perspective={perspective}
                to={itemLinkTo ? itemLinkTo(appt) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
