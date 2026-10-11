import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Modal from '../common/Modal.jsx'
import Select from '../common/Select.jsx'
import { GENDERS } from '../../utils/constants.js'
import { validateDoctor } from '../../utils/validation.js'

const TITLES = ['Dr.', 'Prof.', 'Assoc. Prof.', 'Mr.', 'Ms.']

const pickDoctor = (doctor) => ({
  title: doctor?.title || 'Dr.',
  name: doctor?.name || '',
  departmentId: doctor?.departmentId || '',
  specialty: doctor?.specialty || '',
  email: doctor?.email || '',
  phone: doctor?.phone || '',
  qualifications: doctor?.qualifications || '',
  experienceYears: doctor?.experienceYears ?? '',
  fee: doctor?.fee ?? '',
  rating: doctor?.rating ?? '',
  gender: doctor?.gender || '',
  languages: (doctor?.languages || []).join(', '),
  room: doctor?.room || '',
  status: doctor?.status || 'active',
  bio: doctor?.bio || '',
})

/**
 * Create / edit form inside a modal for the admin doctors page.
 * Receives a `doctor` record (or null to create) and an async `onSubmit(payload)`.
 */
export default function DoctorFormModal({ open, onClose, doctor, departments = [], saving, onSubmit }) {
  const [values, setValues] = useState(() => pickDoctor(doctor))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setValues(pickDoctor(doctor))
      setErrors({})
    }
  }, [open, doctor])

  const setField = (key) => (event) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = validateDoctor(values)
    setErrors(result.errors)
    if (!result.valid) return
    await onSubmit({
      ...values,
      experienceYears: Number(values.experienceYears) || 0,
      fee: Number(values.fee) || 0,
      rating: values.rating === '' ? undefined : Number(values.rating),
      languages: values.languages
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? `Edit ${doctor.name}` : 'Add a doctor'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" icon="check" loading={saving}>
            {doctor ? 'Save changes' : 'Create doctor'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <Select
            label="Title"
            name="doctor-title"
            options={TITLES.map((t) => ({ value: t, label: t }))}
            value={values.title}
            onChange={setField('title')}
          />
          <Input
            label="Full name"
            name="doctor-name"
            required
            placeholder="e.g. Aisha Khan"
            value={values.name}
            onChange={setField('name')}
            error={errors.name}
          />
        </div>
        <div className="form-grid">
          <Select
            label="Department"
            name="doctor-department"
            required
            placeholder="Choose a department…"
            options={departments.map((dep) => ({ value: dep.id, label: dep.name }))}
            value={values.departmentId}
            onChange={setField('departmentId')}
            error={errors.departmentId}
          />
          <Input
            label="Specialty"
            name="doctor-specialty"
            placeholder="e.g. Interventional Cardiologist"
            value={values.specialty}
            onChange={setField('specialty')}
          />
        </div>
        <div className="form-grid">
          <Input
            label="Email address"
            name="doctor-email"
            type="email"
            required
            value={values.email}
            onChange={setField('email')}
            error={errors.email}
            hint="Also used as the sign-in for this doctor."
          />
          <Input
            label="Phone (clinic)"
            name="doctor-phone"
            value={values.phone}
            onChange={setField('phone')}
          />
        </div>
        <div className="form-grid">
          <Input
            label="Fee (USD)"
            name="doctor-fee"
            type="number"
            min="0"
            required
            value={values.fee}
            onChange={setField('fee')}
            error={errors.fee}
          />
          <Input
            label="Years of experience"
            name="doctor-years"
            type="number"
            min="0"
            value={values.experienceYears}
            onChange={setField('experienceYears')}
            error={errors.experienceYears}
          />
        </div>
        <div className="form-grid">
          <Input
            label="Qualifications"
            name="doctor-qualifications"
            placeholder="e.g. MBBS, MD (Cardiology)"
            value={values.qualifications}
            onChange={setField('qualifications')}
          />
          <Input
            label="Rating (0–5)"
            name="doctor-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={values.rating}
            onChange={setField('rating')}
          />
        </div>
        <div className="form-grid">
          <Select
            label="Gender"
            name="doctor-gender"
            placeholder="Prefer not to say"
            options={GENDERS.map((g) => ({ value: g, label: g }))}
            value={values.gender}
            onChange={setField('gender')}
          />
          <Select
            label="Account status"
            name="doctor-status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={values.status}
            onChange={setField('status')}
            hint="Inactive doctors are hidden from public booking."
          />
        </div>
        <div className="form-grid">
          <Input
            label="Languages spoken"
            name="doctor-languages"
            placeholder="English, Arabic…"
            value={values.languages}
            onChange={setField('languages')}
          />
          <Input
            label="Office / room"
            name="doctor-room"
            placeholder="e.g. A-312"
            value={values.room}
            onChange={setField('room')}
          />
        </div>
        <Input
          label="Short bio"
          name="doctor-bio"
          as="textarea"
          rows={3}
          value={values.bio}
          onChange={setField('bio')}
        />
        {!doctor && (
          <div className="alert alert-info" style={{ marginTop: 4 }}>
            <span>
              A sign-in account is created automatically with the password <code>doctor123</code>.
            </span>
          </div>
        )}
      </form>
    </Modal>
  )
}