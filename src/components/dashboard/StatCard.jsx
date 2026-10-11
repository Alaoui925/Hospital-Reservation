import { Link } from 'react-router-dom'
import { Icon } from '../common/Icon.jsx'

/**
 * Metric tile for the patient / doctor / admin dashboards.
 * Renders as a link when `to` is provided.
 */
export default function StatCard({ icon, label, value, tone = 'brand', hint, to }) {
  const content = (
    <>
      <span className={`stat-icon ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="grow">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
      </div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="card stat-card card-hover">
        {content}
      </Link>
    )
  }

  return <div className="card stat-card">{content}</div>
}
