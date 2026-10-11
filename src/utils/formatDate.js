import { WEEKDAYS } from './constants.js'

/**
 * Date helpers.
 * All values are treated as `YYYY-MM-DD` strings and parsed in *local* time to
 * avoid the off-by-one day bug caused by `new Date('2024-01-01')` (UTC).
 */

/** Convert a Date or date-string into a local `YYYY-MM-DD` string. */
export function toISODate(value = new Date()) {
  const d = value instanceof Date ? value : parseISODate(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse `YYYY-MM-DD` (or ISO datetime) as a local Date. */
export function parseISODate(value) {
  if (!value) return new Date(NaN)
  if (value instanceof Date) return new Date(value.getTime())
  const [datePart, timePart] = String(value).split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh = 0, mm = 0] = (timePart || '').split(':').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0)
}

export function formatDate(value, options = {}) {
  const d = parseISODate(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

export function formatDateShort(value) {
  return formatDate(value, { weekday: undefined })
}

export function formatDateLong(value) {
  return formatDate(value, { weekday: 'long', year: 'numeric' })
}

export function formatMonthYear(value) {
  const d = parseISODate(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** `14:30` -> `2:30 PM` */
export function formatTime(value) {
  if (!value) return '—'
  const [h, m] = String(value).split(':').map(Number)
  if (Number.isNaN(h)) return value
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

export function formatDateTime(dateValue, timeValue) {
  return `${formatDate(dateValue)} · ${formatTime(timeValue)}`
}

export function dayNumber(value) {
  return parseISODate(value).getDate()
}

export function monthShort(value) {
  return parseISODate(value).toLocaleDateString('en-US', { month: 'short' })
}

export function weekdayName(value) {
  const d = parseISODate(value)
  return Number.isNaN(d.getTime()) ? '' : WEEKDAYS[d.getDay()]
}

export function weekdayShort(value) {
  return weekdayName(value).slice(0, 3)
}

/** Return the next `count` days (inclusive of today) as Date objects. */
export function getUpcomingDays(count = 14, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** True when the given date (optionally with time) is before now. */
export function isPast(dateValue, timeValue) {
  const d = parseISODate(dateValue)
  if (Number.isNaN(d.getTime())) return false
  if (timeValue) {
    const [h, m] = String(timeValue).split(':').map(Number)
    d.setHours(h || 0, m || 0, 0, 0)
  } else {
    d.setHours(23, 59, 59, 999)
  }
  return d.getTime() < Date.now()
}

export function isToday(dateValue) {
  return toISODate(dateValue) === toISODate(new Date())
}

export function isTomorrow(dateValue) {
  const t = new Date()
  t.setDate(t.getDate() + 1)
  return toISODate(dateValue) === toISODate(t)
}

export function addDays(value, days) {
  const d = parseISODate(value)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Human friendly relative label: "in 3 days", "Yesterday", "Today". */
export function relativeDayLabel(value) {
  if (!value) return ''
  if (isToday(value)) return 'Today'
  if (isTomorrow(value)) return 'Tomorrow'
  const target = parseISODate(value)
  const today = startOfToday()
  const diff = Math.round((target - today) / 86400000)
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 7) return `In ${diff} days`
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`
  return formatDateShort(value)
}

export function formatCurrency(amount) {
  const n = Number(amount)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function relativeTime(value) {
  const then = parseISODate(value)
  if (Number.isNaN(then.getTime())) return ''
  const seconds = Math.round((Date.now() - then.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return formatDateShort(value)
}

export function ageFromDob(dob) {
  if (!dob) return null
  const birth = parseISODate(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}
