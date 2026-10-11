import { Link } from 'react-router-dom'
import { Icon } from './Icon.jsx'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  accent: 'btn-accent',
  light: 'btn-light',
}

const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

/**
 * The single button used across the app.
 * Renders a <Link>, <a> or <button> depending on the props it receives.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconRight,
  loading = false,
  to,
  href,
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] ?? '',
    block && 'btn-block',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  const inner = (
    <>
      {loading ? (
        <span className="spinner spinner-sm" aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={iconSize} />
      ) : null}
      {children != null && children !== '' ? <span>{children}</span> : null}
      {!loading && iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </>
  )

  const isDisabled = disabled || loading

  if (to && !isDisabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {inner}
      </Link>
    )
  }
  if (href && !isDisabled) {
    return (
      <a href={href} className={classes} {...rest}>
        {inner}
      </a>
    )
  }
  return (
    <button type={type} className={classes} disabled={isDisabled} {...rest}>
      {inner}
    </button>
  )
}
