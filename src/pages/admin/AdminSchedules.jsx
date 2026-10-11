import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as doctorService from '../../services/doctorService.js'
import { TIME_SLOTS, WEEKDAYS } from '../../utils/constants.js'
import { formatTime } from '../../utils/formatDate.js'

export default function AdminSchedules() {
  const toast = useToast()
  const [doctors, setDoctors] = useState([])
  const [doctorId, setDoctorId] = useState('')
  const [doctor, setDoctor] = useState(null)
  const [days, setDays] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDoctor, setLoadingDoctor] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    doctorService
      .getDoctors({ perPage: 200 })
      .then((result) => {
        if (active) {
          setDoctors(result.items)
          if (result.items.length > 0 && !doctorId) setDoctorId(result.items[0].id)
        }
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDoctor = useCallback(async (id) => {
    if (!id) return
    setLoadingDoctor(true)
    try {
      const doc = await doctorService.getDoctorById(id)
      setDoctor(doc)
      setDays(doc.availableDays || [])
      setSlots(doc.slots || [])
    } finally {
      setLoadingDoctor(false)
    }
  }, [])

  useEffect(() => {
    if (doctorId) loadDoctor(doctorId)
  }, [doctorId, loadDoctor])

  const toggleDay = (day) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)))

  const toggleSlot = (slot) =>
    setSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()))

  const save = async () => {
    if (!doctor) return
    setSaving(true)
    try {
      await doctorService.updateDoctor(doctor.id, { availableDays: days, slots })
      toast.success('Schedule saved', `Updated availability for ${doctor.title} ${doctor.name}.`)
    } catch (error) {
      toast.error('Could not save', error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Loading schedules…" />

  return (
    <>
      <DashboardHeader
        title="Doctor schedules"
        subtitle="View and adjust any doctor's clinic days and booking slots."
      />

      <div className="card">
        <div className="card-body">
          <div className="form-grid">
            <Select
              label="Doctor"
              name="schedule-doctor"
              options={doctors.map((doc) => ({
                value: doc.id,
                label: `${doc.title} ${doc.name} — ${doc.specialty}`,
              }))}
              value={doctorId}
              onChange={(event) => setDoctorId(event.target.value)}
            />
            {doctor && (
              <div className="row" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
                <div className="cell-user">
                  <Avatar src={doctor.avatar} name={doctor.name} size="sm" />
                  <span>
                    <strong>
                      {doctor.title} {doctor.name}
                    </strong>
                    <span>{doctor.departmentName}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loadingDoctor ? (
        <Loader inline label="Loading this doctor's schedule…" style={{ marginTop: 20 }} />
      ) : doctor ? (
        <div className="stack mt-3">
          <div className="card">
            <div className="card-header">
              <h3>Clinic days</h3>
              <span className="badge badge-brand">{days.length} of 7</span>
            </div>
            <div className="card-body">
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
              <h3>Booking slots</h3>
              <span className="badge badge-neutral">{slots.length} slots</span>
            </div>
            <div className="card-body">
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
              Changes go live immediately for patient booking.
            </p>
            <Button icon="check" loading={saving} onClick={save}>
              Save schedule
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted mt-3">Pick a doctor to manage their schedule.</p>
      )}
    </>
  )
}