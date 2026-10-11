import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Loader from '../common/Loader.jsx'
import AvailabilitySlots from '../doctors/AvailabilitySlots.jsx'
import AppointmentSummary from './AppointmentSummary.jsx'
import { Icon } from '../common/Icon.jsx'
import * as departmentService from '../../services/departmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { CONSULTATION_TYPES } from '../../utils/constants.js'
import { validateAppointment } from '../../utils/validation.js'

const EMPTY = {
  departmentId: '',
  doctorId: '',
  date: '',
  time: '',
  type: 'in-person',
  reason: '',
  notes: '',
}

/**
 * The booking wizard: pick a department → doctor → date & slot → describe the
 * visit. Self-contained: it loads its own departments, doctors and availability.
 *
 * `initialValues` lets a page deep-link a specific doctor, e.g. from
 * `/doctors/:id` → "Book appointment".
 */
export default function AppointmentForm({
  initialValues = {},
  onSubmit,
  loading = false,
  submitLabel = 'Confirm appointment',
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [days, setDays] = useState([])
  const [availability, setAvailability] = useState(null)

  const [booting, setBooting] = useState(true)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const setField = useCallback((key) => (event) => {
    const value = event?.target ? event.target.value : event
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  /* -- load departments --------------------------------------------------- */
  useEffect(() => {
    let active = true
    departmentService
      .getDepartments()
      .then((list) => {
        if (active) setDepartments(list)
      })
      .finally(() => active && setBooting(false))
    return () => {
      active = false
    }
  }, [])

  /* -- load doctors for the chosen department ----------------------------- */
  useEffect(() => {
    let active = true
    if (!values.departmentId) {
      setDoctors([])
      return undefined
    }
    setLoadingDoctors(true)
    doctorService
      .getDoctors({ departmentId: values.departmentId, perPage: 100, sort: 'name' })
      .then((result) => {
        if (active) setDoctors(result.items)
      })
      .finally(() => active && setLoadingDoctors(false))
    return () => {
      active = false
    }
  }, [values.departmentId])

  /* -- when the doctor changes, fetch their upcoming clinic days ---------- */
  useEffect(() => {
    let active = true
    if (!values.doctorId) {
      setDays([])
      setAvailability(null)
      return undefined
    }
    setLoadingSlots(true)
    doctorService
      .getNextAvailableDates(values.doctorId, 10)
      .then((list) => {
        if (!active) return
        setDays(list.map((item) => item.date))
        setValues((prev) => {
          // Keep a deep-linked date if the doctor still has that clinic day.
          const stillValid = list.some((item) => item.date === prev.date)
          return {
            ...prev,
            date: stillValid ? prev.date : list[0]?.date || '',
            time: stillValid ? prev.time : '',
          }
        })
      })
      .finally(() => active && setLoadingSlots(false))
    return () => {
      active = false
    }
  }, [values.doctorId])

  /* -- availability for the selected date --------------------------------- */
  useEffect(() => {
    let active = true
    if (!values.doctorId || !values.date) {
      setAvailability(null)
      return undefined
    }
    setLoadingSlots(true)
    doctorService
      .getDoctorAvailability(values.doctorId, values.date)
      .then((result) => {
        if (active) setAvailability(result)
      })
      .finally(() => active && setLoadingSlots(false))
    return () => {
      active = false
    }
  }, [values.doctorId, values.date])

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === values.doctorId) || null,
    [doctors, values.doctorId],
  )
  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === values.departmentId) || null,
    [departments, values.departmentId],
  )

  // Pre-select the department once we know the initial doctor.
  useEffect(() => {
    if (!initialValues.doctorId || doctors.length === 0) return
    const match = doctors.find((d) => d.id === initialValues.doctorId)
    if (match && match.departmentId !== values.departmentId) {
      setValues((prev) => ({ ...prev, departmentId: match.departmentId }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors])

  const handleDepartmentChange = (event) => {
    setValues((prev) => ({ ...prev, departmentId: event.target.value, doctorId: '', date: '', time: '' }))
    setErrors({})
  }

  const handleDoctorChange = (event) => {
    setValues((prev) => ({ ...prev, doctorId: event.target.value, date: '', time: '' }))
    setErrors({})
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitError('')
    const result = validateAppointment(values)
    setErrors(result.errors)
    if (!result.valid) {
      setSubmitError('Please complete the highlighted fields before continuing.')
      return
    }
    onSubmit?.(values)
  }

  if (booting) return <Loader label="Preparing the booking form…" />

  const departmentOptions = departments.map((dep) => ({ value: dep.id, label: dep.name }))
  const doctorOptions = doctors.map((doc) => ({
    value: doc.id,
    label: `${doc.title} ${doc.name} — ${doc.specialty}`,
  }))

  return (
    <form onSubmit={handleSubmit} className="detail-layout">
      <div className="stack">
        {submitError && (
          <div className="alert alert-danger" role="alert">
            <Icon name="alert-circle" size={18} />
            <span>{submitError}</span>
          </div>
        )}

        <section className="card">
          <div className="card-header">
            <h3>
              <span className="badge badge-brand">1</span> Choose your care team
            </h3>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <Select
                label="Department"
                name="departmentId"
                required
                placeholder="Select a department"
                options={departmentOptions}
                value={values.departmentId}
                onChange={handleDepartmentChange}
                error={errors.departmentId}
              />
              <Select
                label="Doctor"
                name="doctorId"
                required
                placeholder={
                  values.departmentId
                    ? loadingDoctors
                      ? 'Loading doctors…'
                      : 'Select a doctor'
                    : 'Choose a department first'
                }
                options={doctorOptions}
                value={values.doctorId}
                onChange={handleDoctorChange}
                disabled={!values.departmentId || loadingDoctors}
                error={errors.doctorId}
              />
            </div>

            {selectedDoctor && (
              <div className="row mt-1" style={{ gap: 14, alignItems: 'flex-start' }}>
                <img src={selectedDoctor.avatar} alt="" className="avatar avatar-lg" />
                <div>
                  <strong>
                    {selectedDoctor.title} {selectedDoctor.name}
                  </strong>
                  <div className="text-sm" style={{ color: 'var(--brand-700)', fontWeight: 600 }}>
                    {selectedDoctor.specialty}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {selectedDoctor.qualifications} · {selectedDoctor.experienceYears} yrs · Room{' '}
                    {selectedDoctor.room}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3>
              <span className="badge badge-brand">2</span> Pick a date &amp; time
            </h3>
          </div>
          <div className="card-body">
            {!values.doctorId ? (
              <p className="text-sm text-muted mb-0">
                Select a doctor to see their available appointment slots.
              </p>
            ) : (
              <AvailabilitySlots
                days={days}
                activeDate={values.date}
                onDateChange={(date) => setValues((prev) => ({ ...prev, date, time: '' }))}
                availability={availability}
                loading={loadingSlots}
                selectedTime={values.time}
                onSelectTime={(time) => setValues((prev) => ({ ...prev, time }))}
              />
            )}
            {errors.time && <span className="field-error">{errors.time}</span>}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3>
              <span className="badge badge-brand">3</span> Tell us about the visit
            </h3>
          </div>
          <div className="card-body">
            <Select
              label="Consultation type"
              name="type"
              options={CONSULTATION_TYPES}
              value={values.type}
              onChange={setField('type')}
            />
            <Input
              as="textarea"
              label="Reason for visit"
              name="reason"
              required
              placeholder="Please describe your symptoms, how long you have had them, and anything the doctor should know."
              value={values.reason}
              onChange={setField('reason')}
              error={errors.reason}
              hint="This helps the doctor prepare for your visit."
            />
            <Input
              as="textarea"
              label="Additional notes (optional)"
              name="notes"
              placeholder="Allergies, current medication, accessibility needs…"
              value={values.notes}
              onChange={setField('notes')}
            />
          </div>
        </section>
      </div>

      <aside className="sticky-aside stack-sm">
        <AppointmentSummary
          doctor={selectedDoctor}
          department={selectedDepartment}
          date={values.date}
          time={values.time}
          type={values.type}
          fee={selectedDoctor?.fee}
        />
        <Button type="submit" block icon="check" loading={loading} size="lg">
          {submitLabel}
        </Button>
        <p className="text-xs text-muted text-center mb-0">
          You will receive a confirmation once the doctor&apos;s office accepts your request.
        </p>
      </aside>
    </form>
  )
}
