import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon.jsx'

/**
 * Accessible modal dialog rendered in a portal.
 * Closes on Escape and (optionally) on overlay click, and locks body scroll.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClass = size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : ''

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        className={['modal', sizeClass, className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        {(title || showClose) && (
          <div className="modal-header">
            {typeof title === 'string' ? <h3>{title}</h3> : title || <span />}
            {showClose && (
              <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
                <Icon name="x" size={20} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
