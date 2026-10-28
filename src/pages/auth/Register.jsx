import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import { passwordStrength, validateDoctorApplication, validateRegister } from '../../utils/validation.js'
import { getRoleHome } from '../../utils/permissions.js'
import * as applicationService from '../../services/applicationService.js'
import * as departmentService from '../../services/departmentService.js'

const PATIENT_BENEFITS = [
  'Book appointments 24/7 with real availability',
  'Keep all your visit history in one place',
  'Cancel or reschedule free of charge',
  'Get reminders before every appointment',
]

const DOCTOR_BENEFITS = [
  'Your application is reviewed by the hospital administration',
  'Once approved: a public listing, availability editor and patient portal',
  'Confirm, complete and reschedule appointments from one workspace',
  'File visit reports so your patients keep structured medical records',
]

const PATIENT_FIELDS = { name: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: true }
const EMPTY_DOCTOR = {
  ...PATIENT_FIELDS,
  departmentId: '',
  specialty: '',
  qualifications: '',
  experienceYears: '',
  fee: '',
  bio: '',
}

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [role, setRole] = useState('patient') // 'patient' | 'doctor'
  const [values, setValues] = useState(PATIENT_FIELDS)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    let active = true
    departmentService.getDepartments().then((list) => active && setDepartments(list))
    return () => {
      active = false
    }
  }, [])

  const benefits = role === 'patient' ? PATIENT_BENEFITS : DOCTOR_BENEFITS
  const isDoctor = role === 'doctor'

  const switchRole = (next) => {
    setRole(next)
    setErrors({})
    setValues(next === 'patient' ? PATIENT_FIELDS : EMPTY_DOCTOR)
  }

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const strength = passwordStrength(values.password)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validator = isDoctor ? validateDoctorApplication : validateRegister
    const result = validator(values)
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      if (isDoctor) {
        await submitDoctorApplication()
      } else {
        const user = await register({
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
        })
        toast.success('Account created', `Welcome to MediCare, ${user.name.split(' ')[0]}!`)
        navigate(getRoleHome(user.role), { replace: true })
      }
    } catch (error) {
      setErrors({ form: error.message, ...(error.fields || {}) })
      toast.error(isDoctor ? 'Application failed' : 'Registration failed', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitDoctorApplication = async () => {
    await applicationService.submitApplication({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      departmentId: values.departmentId,
      specialty: values.specialty,
      qualifications: values.qualifications,
      experienceYears: Number(values.experienceYears) || 0,
      fee: Number(values.fee),
      bio: values.bio,
    })
    toast.success('Application submitted', 'The administration will review it — you can sign in once approved.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <h2>{isDoctor ? 'Join the medical team' : 'Join MediCare Hospital'}</h2>
        <p style={{ color: 'rgba(255,255,255,.85)' }}>
          {isDoctor
            ? 'Apply with your details — the hospital administration reviews every doctor application.'
            : 'Create your free patient account and take control of your healthcare.'}
        </p>
        <ul>
          {benefits.map((item) => (
            <li key={item}>
              <Icon name="check-circle" size={20} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="mb-3">
            <span className="eyebrow">Create account</span>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>
              {isDoctor ? 'Apply as a doctor' : 'Register as a patient'}
            </h1>
            <p className="text-muted mb-0">{isDoctor ? 'Approvals usually take one working day.' : 'It takes less than a minute.'}</p>
          </div>

          {/* Role switch */}
          <div className=" mb-3">
            <Button
              type="button"
              variant={role === 'patient' ? 'primary' : 'ghost'}
              icon="user"
              onClick={() => switchRole('patient')}
              aria-pressed={role === 'patient'}
              className="mr-1"
            >
              I'm a patient
            </Button>
            <Button
              type="button"
              variant={role === 'doctor' ? 'primary' : 'ghost'}
              icon="stethoscope"
              onClick={() => switchRole('doctor')}
              aria-pressed={role === 'doctor'}
            >
              I'm a doctor
            </Button>
          </div>

          {errors.form && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert-circle" size={18} />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Full name"
              name="name"
              icon="user"
              required
              placeholder={isDoctor ? 'Dr. Jane Doe' : 'Jane Doe'}
              value={values.name}
              onChange={setField('name')}
              error={errors.name}
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              icon="mail"
              required
              placeholder="you@example.com"
              value={values.email}
              onChange={setField('email')}
              error={errors.email}
            />
            <Input
              label="Phone number"
              name="phone"
              icon="phone"
              placeholder="+1 (555) 000-0000"
              value={values.phone}
              onChange={setField('phone')}
              error={errors.phone}
            />

            {isDoctor && (
              <>
                <Select
                  label="Department"
                  name="reg-department"
                  required
                  placeholder="Choose a department"
                  options={departments.map((dep) => ({ value: dep.id, label: dep.name }))}
                  value={values.departmentId}
                  onChange={setField('departmentId')}
                  error={errors.departmentId}
                />
                <Input
                  label="Specialty"
                  name="reg-specialty"
                  required
                  placeholder="e.g. Interventional cardiologist"
                  value={values.specialty}
                  onChange={setField('specialty')}
                  error={errors.specialty}
                />
                <Input
                  label="Qualifications"
                  name="reg-qualifications"
                  required
                  placeholder="e.g. MBBS, MD (Cardiology)"
                  value={values.qualifications}
                  onChange={setField('qualifications')}
                  error={errors.qualifications}
                />
                <div className="row" style={{ gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div className="grow" style={{ minWidth: 140 }}>
                    <Input
                      label="Years of experience"
                      name="reg-experience"
                      type="number"
                      min="0"
                      value={values.experienceYears}
                      onChange={setField('experienceYears')}
                      error={errors.experienceYears}
                    />
                  </div>
                  <div className="grow" style={{ minWidth: 140 }}>
                    <Input
                      label="Consultation fee (USD)"
                      name="reg-fee"
                      type="number"
                      min="1"
                      required
                      value={values.fee}
                      onChange={setField('fee')}
                      error={errors.fee}
                    />
                  </div>
                </div>
                <Input
                  as="textarea"
                  name="reg-bio"
                  label="Short bio"
                  placeholder="A few sentences patients will see on your listing."
                  value={values.bio}
                  onChange={setField('bio')}
                  error={errors.bio}
                  rows={3}
                />
              </>
            )}

            <Input
              label="Password"
              name="password"
              type="password"
              icon="lock"
              required
              placeholder="At least 6 characters"
              value={values.password}
              onChange={setField('password')}
              error={errors.password}
            />

            {values.password && (
              <div className="mb-2">
                <div className="progress">
                  <span style={{ width: `${(strength.score / 5) * 100}%` }} />
                </div>
                <span className="field-hint">Password strength: {strength.label}</span>
              </div>
            )}

            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              icon="lock"
              required
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={setField('confirmPassword')}
              error={errors.confirmPassword}
            />

            <label className="checkbox mb-2">
              <input
                type="checkbox"
                checked={values.acceptTerms}
                onChange={setField('acceptTerms')}
              />
              <span>
                I agree to the <Link to="/contact">terms of service</Link> and{' '}
                <Link to="/contact">privacy policy</Link>.
              </span>
            </label>
            {errors.acceptTerms && <span className="field-error">{errors.acceptTerms}</span>}

            <Button type="submit" block size="lg" loading={submitting} icon={isDoctor ? 'stethoscope' : 'user'}>
              {isDoctor ? 'Submit application' : 'Create my account'}
            </Button>
          </form>

          <p className="text-sm text-center mt-3">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
