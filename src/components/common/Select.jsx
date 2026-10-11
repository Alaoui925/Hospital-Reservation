/**
 * Native <select> wrapper with a consistent label / error treatment.
 * `options` is an array of `{ value, label }`; children are rendered as-is
 * (useful for <optgroup>).
 */
export default function Select({
  label,
  name,
  id,
  error,
  hint,
  options = [],
  placeholder,
  required = false,
  className = '',
  wrapperClassName = '',
  children,
  ...rest
}) {
  const selectId = id || name
  const invalid = Boolean(error)

  return (
    <div className={['field', wrapperClassName].filter(Boolean).join(' ')}>
      {label && (
        <label className="field-label" htmlFor={selectId}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        className={['select', invalid ? 'invalid' : '', className].filter(Boolean).join(' ')}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
