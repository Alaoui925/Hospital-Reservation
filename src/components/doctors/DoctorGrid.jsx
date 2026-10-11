import DoctorCard from './DoctorCard.jsx'
import EmptyState from '../common/EmptyState.jsx'

function DoctorSkeleton() {
  return (
    <div className="card card-pad">
      <div className="row" style={{ gap: 16 }}>
        <div className="skeleton" style={{ width: 78, height: 78, borderRadius: 12 }} />
        <div className="grow">
          <div className="skeleton" style={{ height: 18, width: '65%' }} />
          <div className="skeleton mt-1" style={{ height: 13, width: '45%' }} />
          <div className="skeleton mt-1" style={{ height: 13, width: '35%' }} />
        </div>
      </div>
      <div className="skeleton mt-3" style={{ height: 12, width: '90%' }} />
      <div className="skeleton mt-1" style={{ height: 12, width: '70%' }} />
      <div className="skeleton mt-3" style={{ height: 34, width: '100%' }} />
    </div>
  )
}

/** Responsive grid of <DoctorCard>. Handles loading and empty states. */
export default function DoctorGrid({
  doctors = [],
  loading = false,
  skeletonCount = 6,
  onBook,
  onReset,
  emptyTitle = 'No doctors found',
  emptyDescription = 'Try a different specialty or clear your search filters.',
  children,
}) {
  if (loading) {
    return (
      <div className="grid grid-auto">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <DoctorSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!doctors.length) {
    return (
      <div className="card">
        <EmptyState
          icon="stethoscope"
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
    <div className="grid grid-auto">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} onBook={onBook} />
      ))}
      {children}
    </div>
  )
}
