/**
 * Loading indicator.
 * - inline: sits next to text ("Saving…")
 * - block (default): centred block used while a page section loads
 */
export default function Loader({ label = 'Loading…', inline = false, className = '' }) {
  if (inline) {
    return (
      <span className="loader-inline">
        <span className="spinner spinner-sm" aria-hidden="true" />
        {label && <span>{label}</span>}
      </span>
    )
  }

  return (
    <div className={['loader-block', className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  )
}
