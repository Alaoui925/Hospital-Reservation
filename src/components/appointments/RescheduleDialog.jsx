import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import AvailabilitySlots from '../doctors/AvailabilitySlots.jsx'
import * as doctorService from '../../services/doctorService.js'

/**
 * Modal that lets a patient (or the front desk) move an appointment to a new
 * date and time. Loads the doctor's real availability.
 */
export default function RescheduleDialog({ open, appointment, onClose, onConfirm, loading = false }) {
  const [days, setDays] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [availability, setAvailability] = useState(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    let active = true
    if (!open || !appointment?.doctorId) return undefined
    setFetching(true)
    setTime('')
    doctorService
      .getNextAvailableDates(appointment.doctorId, 10)
      .then((list) => {
        if (!active) return
        setDays(list.map((item) => item.date))
        setDate(list[0]?.date || '')
      })
      .finally(() => active && setFetching(false))
    return () => {
      active = false
    }
  }, [open, appointment?.doctorId])

  useEffect(() => {
    let active = true
    if (!open || !appointment?.doctorId || !date) return undefined
    setFetching(true)
    doctorService
      .getDoctorAvailability(appointment.doctorId, date)
      .then((result) => active && setAvailability(result))
      .finally(() => active && setFetching(false))
    return () => {
      active = false
    }
  }, [open, appointment?.doctorId, date])

  const handleConfirm = () => {
    if (!date || !time) return
    onConfirm({ date, time })
  }

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title="Reschedule appointment"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!date || !time} icon="calendar-check">
            Confirm new time
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Moving your appointment with <strong>{appointment?.doctorName}</strong>. Choose a
        new slot below — your appointment will need a fresh confirmation.
      </p>
      <AvailabilitySlots
        days={days}
        activeDate={date}
        onDateChange={(next) => {
          setDate(next)
          setTime('')
        }}
        availability={availability}
        loading={fetching}
        selectedTime={time}
        onSelectTime={setTime}
      />
    </Modal>
  )
}
