import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import { passwordStrength, validateRegister } from '../../utils/validation.js'
import { getRoleHome } from '../../utils/permissions.js'

const BENEFITS = [
  'Book appointments 24/7 with real availability',
  'Keep all your visit history in one place',
  'Cancel or reschedule free of charge',
  'Get reminders before every appointment',
]

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: true,
}

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const strength = passwordStrength(values.password)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = validateRegister(values)
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      const user = await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
      toast.success('Account created', `Welcome to MediCare, ${user.name.split(' ')[0]}!`)
      navigate(getRoleHome(user.role), { replace: true })
    } catch (error) {
      setErrors({ form: error.message, ...(error.fields || {}) })
      toast.error('Registration failed', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <h2>Join MediCare Hospital</h2>
        <p style={{ color: 'rgba(255,255,255,.85)' }}>
          Create your free patient account and take control of your healthcare.
        </p>
        <ul>
          {BENEFITS.map((item) => (
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
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>Register as a patient</h1>
            <p className="text-muted mb-0">It takes less than a minute.</p>
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
              placeholder="Jane Doe"
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

            <Button type="submit" block size="lg" loading={submitting} icon="user">
              Create my account
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
