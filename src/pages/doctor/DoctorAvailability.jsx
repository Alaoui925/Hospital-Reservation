import { useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as doctorService from '../../services/doctorService.js'
import { TIME_SLOTS, WEEKDAYS } from '../../utils/constants.js'
import { formatTime } from '../../utils/formatDate.js'

/**
 * Doctor availability editor.
 * Clinic days and consulting slots are chosen as chips, then saved to the
 * doctor record — the same record the patient booking flow reads from.
 */
export default function DoctorAvailability() {
  const { user } = useAuth()
  const toast = useToast()

  const [doctor, setDoctor] = useState(null)
  const [days, setDays] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    doctorService
      .getDoctorByUserId(user.id)
      .then((doc) => {
        if (!active || !doc) return
        setDoctor(doc)
        setDays(doc.availableDays || [])
        setSlots(doc.slots || [])
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  const toggleDay = (day) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)))

  const toggleSlot = (slot) =>
    setSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()))

  const reload = async () => {
    const doc = await doctorService.getDoctorByUserId(user.id)
    if (!doc) return
    setDoctor(doc)
    setDays(doc.availableDays || [])
    setSlots(doc.slots || [])
  }

  const save = async (event) => {
    event.preventDefault()
    if (!doctor) return
    setSaving(true)
    try {
      await doctorService.updateDoctor(doctor.id, { availableDays: days, slots })
      toast.success('Availability saved', 'Your updated schedule is now live for patient bookings.')
    } catch (error) {
      toast.error('Could not save', error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Loading your availability…" />

  return (
    <>
      <DashboardHeader
        title="My availability"
        subtitle="Choose the days and time slots that patients can book."
        actions={
          <Button variant="secondary" icon="refresh" onClick={reload}>
            Reload
          </Button>
        }
      />

      <form className="stack" onSubmit={save} noValidate>
        <div className="card">
          <div className="card-header">
            <h3>Clinic days</h3>
            <span className="badge badge-brand">{days.length} of 7 days</span>
          </div>
          <div className="card-body">
            <p className="text-sm text-muted mt-0">
              Patients can only book on the days you select. Appointments that already
              exist are never affected.
            </p>
            <div className="row-wrap">
              {WEEKDAYS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`chip ${days.includes(index) ? 'active' : ''}`}
                  aria-pressed={days.includes(index)}
                  onClick={() => toggleDay(index)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Consulting slots</h3>
            <span className="badge badge-neutral">{slots.length} slots</span>
          </div>
          <div className="card-body">
            <p className="text-sm text-muted mt-0">
              Tap to add or remove half-hour slots. Remove a slot and any future booking
              for it will stay valid.
            </p>
            <div className="slots-grid">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot ${slots.includes(slot) ? 'selected' : ''}`}
                  aria-pressed={slots.includes(slot)}
                  onClick={() => toggleSlot(slot)}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="row-between card" style={{ padding: 16 }}>
          <p className="text-sm text-muted mb-0">
            Your availability preview — {days.length} clinic day{days.length === 1 ? '' : 's'} on your
            schedule page.
          </p>
          <Button type="submit" icon="check" loading={saving}>
            Save availability
          </Button>
        </div>
      </form>
    </>
  )
}