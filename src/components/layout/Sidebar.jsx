import { NavLink } from 'react-router-dom'
import { Icon } from '../common/Icon.jsx'

/**
 * Vertical section navigation used by the patient, doctor and admin layouts.
 * Items may be links or `{ section: 'Title' }` dividers.
 * Items may also carry `badge` (a number) shown on the right.
 */
export default function Sidebar({ items, title }) {
  return (
    <aside className="sidebar" aria-label={title || 'Section navigation'}>
      {items.map((item, index) => {
        if (item.section) {
          return (
            <div key={`section-${index}`} className="sidebar-section">
              {item.section}
            </div>
          )
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={18} />
            <span className="grow">{item.label}</span>
            {item.badge ? <span className="badge badge-neutral">{item.badge}</span> : null}
          </NavLink>
        )
      })}
    </aside>
  )
}
