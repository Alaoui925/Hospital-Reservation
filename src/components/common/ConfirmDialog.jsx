import Button from './Button.jsx'
import Modal from './Modal.jsx'
import { Icon } from './Icon.jsx'

const TONE_ICON = { danger: 'alert-triangle', warning: 'alert-triangle', info: 'info' }

/**
 * Small confirmation dialog built on top of <Modal>.
 * Used before destructive actions such as cancelling an appointment or
 * deleting a record.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  icon,
  onConfirm,
  onCancel,
  children,
}) {
  const confirmVariant = tone === 'danger' ? 'danger' : tone === 'warning' ? 'primary' : 'primary'

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-center">
        <div className={`confirm-icon ${tone}`}>
          <Icon name={icon || TONE_ICON[tone] || 'alert-triangle'} size={26} />
        </div>
        {description && <p className="text-muted mb-0">{description}</p>}
        {children}
      </div>
    </Modal>
  )
}
