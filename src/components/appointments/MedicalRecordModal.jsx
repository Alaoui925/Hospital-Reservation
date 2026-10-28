import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Modal from '../common/Modal.jsx'
import Loader from '../common/Loader.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as recordService from '../../services/recordService.js'
import { toISODate } from '../../utils/formatDate.js'

/**
 * Add / view a visit report for a completed appointment.
 * The doctor files diagnosis, prescription (one medication per line),
 * instructions and an optional follow-up date; the patient receives it as a
 * permanent medical record.
 */
export default function MedicalRecordModal({ open, onClose, appointment, doctor, onSaved }) {
  const toast = useToast()

  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({ diagnosis: '', prescription: '', instructions: '', followUpDate: '' })

  useEffect(() => {
    if (!open || !appointment) return undefined
    let active = true
    setLoading(true)
    setErrors({})
    recordService
      .getRecordByAppointment(appointment.id)
      .then((record) => {
        if (!active) return
        setExisting(record)
        setValues({
          diagnosis: record?.diagnosis || '',
          prescription: (record?.prescription || []).join('\n'),
          instructions: record?.instructions || '',
          followUpDate: record?.followUpDate || '',
        })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [open, appointment?.id])

  const setField = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSave = async () => {
    const nextErrors = {}
    if (values.diagnosis.trim().length < 5) nextErrors.diagnosis = 'Describe the diagnosis or findings.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const record = await recordService.upsertRecord({
        appointmentId: appointment.id,
        doctor,
        diagnosis: values.diagnosis,
        prescription: values.prescription,
        instructions: values.instructions,
        followUpDate: values.followUpDate || null,
      })
      toast.success(existing ? 'Report updated' : 'Report saved', `${appointment.patientName}'s record is up to date.`)
      setExisting(record)
      onSaved?.(record)
      onClose?.()
    } catch (error) {
      setErrors({ ...(error.fields || {}), form: error.message })
    } finally {
      setSaving(false)
    }
  }

  if (!appointment) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `Visit report · ${appointment.patientName}` : `File visit report · ${appointment.patientName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button icon="check" onClick={handleSave} loading={saving}>
            {existing ? 'Update report' : 'Save report'}
          </Button>
        </>
      }
    >
      {loading ? (
        <Loader label="Loading report…" />
      ) : (
        <>
          <p className="text-sm text-muted" style={{ marginTop: 0 }}>
            {appointment.date} at {appointment.time} · {appointment.departmentName}
          </p>
          {errors.form && (
            <div className="alert alert-danger" role="alert">
              {errors.form}
            </div>
          )}
          <Input
            as="textarea"
            name="record-diagnosis"
            label="Diagnosis / findings"
            required
            rows={3}
            placeholder="e.g. Mild hypertension — BP 144/92 on two consecutive readings."
            value={values.diagnosis}
            onChange={setField('diagnosis')}
            error={errors.diagnosis}
          />
          <Input
            as="textarea"
            name="record-prescription"
            label="Prescription (one medication per line)"
            rows={3}
            placeholder={'Ibuprofen 400mg — twice daily for 5 days\nAmoxicillin 500mg — three times daily for 7 days'}
            value={values.prescription}
            onChange={setField('prescription')}
            hint="Leave empty if no medication is prescribed."
          />
          <Input
            as="textarea"
            name="record-instructions"
            label="Care instructions"
            rows={2}
            placeholder="Advice the patient should follow at home."
            value={values.instructions}
            onChange={setField('instructions')}
          />
          <Input
            label="Follow-up date"
            name="record-followup"
            type="date"
            min={toISODate(new Date())}
            value={values.followUpDate}
            onChange={setField('followUpDate')}
            wrapperClassName="mt-1"
          />
        </>
      )}
    </Modal>
  )
}
