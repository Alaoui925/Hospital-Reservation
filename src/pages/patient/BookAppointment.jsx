import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppointmentForm from '../../components/appointments/AppointmentForm.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as appointmentService from '../../services/appointmentService.js'
import * as doctorService from '../../services/doctorService.js'

export default function BookAppointment() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const presetDoctorId = searchParams.get('doctor') || ''
  const presetDate = searchParams.get('date') || ''
  const presetTime = searchParams.get('time') || ''

  const [initialValues, setInitialValues] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Resolve the deep-linked doctor so the form can pre-select the department.
  useEffect(() => {
    let active = true
    if (!presetDoctorId) {
      setInitialValues({})
      return undefined
    }
    doctorService
      .getDoctorById(presetDoctorId)
      .then((doctor) => {
        if (!active) return
        setInitialValues({
          doctorId: doctor.id,
          departmentId: doctor.departmentId,
          date: presetDate,
          time: presetTime,
        })
      })
      .catch(() => active && setInitialValues({}))
    return () => {
      active = false
    }
  }, [presetDoctorId, presetDate, presetTime])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const appointment = await appointmentService.createAppointment({
        ...values,
        patientId: user.id,
      })
      toast.success(
        'Appointment requested',
        `Your request was sent to ${appointment.doctorName}. You will be notified once it is confirmed.`,
      )
      navigate(`/patient/appointments/${appointment.id}`)
    } catch (error) {
      toast.error('Booking failed', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!initialValues) return <Loader label="Preparing the booking form…" />

  return (
    <>
      <DashboardHeader
        title="Book an appointment"
        subtitle="Choose a department and doctor, then pick a time that suits you."
        actions={
          <Button to="/patient/appointments" variant="secondary" icon="calendar">
            My appointments
          </Button>
        }
      />
      <AppointmentForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel="Request appointment"
      />
    </>
  )
}
