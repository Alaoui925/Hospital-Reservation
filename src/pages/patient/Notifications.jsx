import { useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'
import { relativeTime } from '../../utils/formatDate.js'

const TONE_ICON = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
}

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
  } = useNotifications()

  const [filter, setFilter] = useState('all')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read)
    return notifications
  }, [notifications, filter])

  const handleClear = async () => {
    await clearAll()
    setConfirmClear(false)
  }

  return (
    <>
      <DashboardHeader
        title="Notifications"
        subtitle="Confirmation, reminders and updates about your appointments."
        actions={
          <>
            <Button
              variant="secondary"
              icon="check"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              icon="trash"
              onClick={() => setConfirmClear(true)}
              disabled={notifications.length === 0}
            >
              Clear all
            </Button>
          </>
        }
      />

      <div className="row-wrap mb-2">
        <button
          type="button"
          className={`chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={`chip ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading ? (
        <Loader label="Loading notifications…" />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="bell"
            title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            description="Appointment confirmations, reminders and updates will appear here."
            actionLabel="Book an appointment"
            actionTo="/patient/book"
            actionIcon="calendar-plus"
          />
        </div>
      ) : (
        <div className="stack-sm" style={{ gap: 12 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card card-pad"
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                borderLeft: `4px solid var(--${
                  item.type === 'success'
                    ? 'success'
                    : item.type === 'warning'
                      ? 'warning'
                      : item.type === 'error'
                        ? 'danger'
                        : 'info'
                })`,
                opacity: item.read ? 0.75 : 1,
              }}
            >
              <span className={`stat-icon ${item.type === 'error' ? 'danger' : item.type}`}>
                <Icon name={TONE_ICON[item.type] || 'info'} size={20} />
              </span>
              <div className="grow">
                <div className="row-between" style={{ gap: 10 }}>
                  <strong>{item.title}</strong>
                  <span className="text-xs text-muted">{relativeTime(item.createdAt)}</span>
                </div>
                <p className="text-sm text-muted mb-0">{item.message}</p>
              </div>
              <div className="row" style={{ gap: 4 }}>
                {!item.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(item.id)} title="Mark as read">
                    <Icon name="check" size={16} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotification(item.id)}
                  title="Remove"
                >
                  <Icon name="x" size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear all notifications?"
        description="This removes every notification from your feed. Appointment records are not affected."
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        tone="danger"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  )
}
