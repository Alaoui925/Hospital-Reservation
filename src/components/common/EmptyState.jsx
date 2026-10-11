import Button from './Button.jsx'
import { Icon } from './Icon.jsx'

/**
 * Friendly zero-state used by tables, lists and search results.
 * Pass an `action` node for custom content, or use `actionLabel` + `actionTo` /
 * `onAction` for the common "go somewhere" case.
 */
export default function EmptyState({
  icon = 'search',
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  actionTo,
  actionIcon,
  onAction,
  children,
}) {
  const actionNode =
    action ||
    (actionLabel ? (
      <Button variant="primary" to={actionTo} onClick={onAction} icon={actionIcon}>
        {actionLabel}
      </Button>
    ) : null)

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={32} strokeWidth={1.8} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionNode}
      {children}
    </div>
  )
}
