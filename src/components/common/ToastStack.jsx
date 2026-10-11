import { useContext } from 'react'
import { NotificationContext } from '../../context/NotificationContext.jsx'
import { Icon } from './Icon.jsx'

const TONE_ICON = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
}

/** Renders the transient toast messages produced by `useToast()`. */
export default function ToastStack() {
  const ctx = useContext(NotificationContext)
  if (!ctx) return null
  const { toasts, dismiss } = ctx
  if (!toasts.length) return null

  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <Icon name={TONE_ICON[toast.type] || 'info'} size={18} />
          <div className="grow">
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
