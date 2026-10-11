import { Icon } from './Icon.jsx'

/**
 * Text input / textarea with label, hint and error message.
 * Pass `as="textarea"` to render a multi-line control.
 */
export default function Input({
  label,
  name,
  id,
  error,
  hint,
  icon,
  as = 'input',
  required = false,
  className = '',
  wrapperClassName = '',
  children,
  ...rest
}) {
  const inputId = id || name
  const Tag = as
  const invalid = Boolean(error)
  const baseClass = as === 'textarea' ? 'textarea' : 'input'

  const control = (
    <Tag
      id={inputId}
      name={name}
      className={[baseClass, invalid ? 'invalid' : '', className].filter(Boolean).join(' ')}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </Tag>
  )

  return (
    <div className={['field', wrapperClassName].filter(Boolean).join(' ')}>
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {icon ? (
        <div className="input-icon">
          <Icon name={icon} size={18} />
          {control}
        </div>
      ) : (
        control
      )}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
