/** Circular avatar with an initials fallback. */
export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : ''
  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}` : 'Avatar'}
        className={['avatar', sizeClass, className].filter(Boolean).join(' ')}
        loading="lazy"
      />
    )
  }

  return (
    <span
      className={['avatar', 'avatar-fallback', sizeClass, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      title={name}
    >
      {initials || '?'}
    </span>
  )
}
