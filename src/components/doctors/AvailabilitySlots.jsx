import Loader from '../common/Loader.jsx'
import { Icon } from '../common/Icon.jsx'
import { formatTime, monthShort, parseISODate, toISODate } from '../../utils/formatDate.js'
import { WEEKDAYS_SHORT } from '../../utils/constants.js'

const asISO = (value) => (value instanceof Date ? toISODate(value) : String(value))

/**
 * Date tabs + time slot picker for a single doctor.
 *
 * Props
 * - days: ISO date strings (e.g. from getNextAvailableDates)
 * - activeDate / onDateChange
 * - availability: result of doctorService.getDoctorAvailability
 * - selectedTime / onSelectTime
 */
export default function AvailabilitySlots({
  days = [],
  activeDate,
  onDateChange,
  availability,
  loading = false,
  selectedTime,
  onSelectTime,
}) {
  const noClinic = availability && !availability.worksToday

  return (
    <div>
      <div className="day-tabs mb-2" role="tablist" aria-label="Choose a date">
        {days.map((raw) => {
          const iso = asISO(raw)
          const date = parseISODate(iso)
          const isActive = iso === activeDate
          return (
            <button
              key={iso}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`day-tab ${isActive ? 'active' : ''}`}
              onClick={() => onDateChange(iso)}
            >
              <span>{WEEKDAYS_SHORT[date.getDay()]}</span>
              <strong>{date.getDate()}</strong>
              <span>{monthShort(iso)}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <Loader inline label="Checking availability…" />
      ) : noClinic || !availability?.slots?.length ? (
        <div className="alert alert-info mb-0">
          <Icon name="info" size={18} />
          <span>
            No clinic is held on this day. Please choose another date from above.
          </span>
        </div>
      ) : (
        <>
          <div className="row-between mb-1">
            <span className="text-sm text-muted">
              {availability.availableCount} of {availability.slots.length} slots free
            </span>
            <span className="text-xs text-muted">Each slot is 30 minutes</span>
          </div>
          <div className="slots-grid">
            {availability.slots.map((slot) => {
              const disabled = slot.taken || slot.past
              const title = slot.taken
                ? 'Already booked'
                : slot.past
                  ? 'This time has passed'
                  : 'Available'
              return (
                <button
                  key={slot.time}
                  type="button"
                  className={`slot ${selectedTime === slot.time ? 'selected' : ''}`}
                  disabled={disabled}
                  title={title}
                  onClick={() => onSelectTime(slot.time)}
                >
                  {formatTime(slot.time)}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
