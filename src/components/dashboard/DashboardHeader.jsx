import { useAuth } from '../../hooks/useAuth.js'

/** Page heading block with an optional greeting and action buttons. */
export default function DashboardHeader({ title, subtitle, actions, greet = false }) {
  const { user } = useAuth()
  const firstName = user?.name?.replace(/^Dr\.?\s*/i, '').split(' ')[0]

  const heading = greet && firstName ? `Welcome back, ${firstName}` : title

  return (
    <div className="page-header row-between" style={{ alignItems: 'flex-end' }}>
      <div>
        <h1>{heading}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row-wrap">{actions}</div>}
    </div>
  )
}
