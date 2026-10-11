import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as authService from '../../services/authService.js'
import { passwordStrength } from '../../utils/validation.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const token = searchParams.get('token') || ''
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const setField = (key) => (event) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const strength = passwordStrength(values.password)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!token) nextErrors.form = 'This reset link is missing or invalid.'
    if (!values.password || values.password.length < 6)
      nextErrors.password = 'Use at least 6 characters.'
    if (values.confirmPassword !== values.password)
      nextErrors.confirmPassword = 'Passwords do not match.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await authService.resetPassword({ token, password: values.password })
      toast.success('Password updated', 'You can now sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      setErrors({ form: error.message })
      toast.error('Reset failed', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="card card-pad">
          <div className="text-center mb-3">
            <div className="tile-icon" style={{ margin: '0 auto 16px' }}>
              <Icon name="shield" size={24} />
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>Choose a new password</h1>
            <p className="text-muted mb-0">
              Pick something you have not used before. You will use it the next time you
              sign in.
            </p>
          </div>

          {errors.form && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert-circle" size={18} />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="New password"
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
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              icon="lock"
              required
              placeholder="Repeat your new password"
              value={values.confirmPassword}
              onChange={setField('confirmPassword')}
              error={errors.confirmPassword}
            />

            <Button type="submit" block size="lg" icon="check" loading={submitting}>
              Update password
            </Button>
          </form>

          <p className="text-sm text-center mt-3 mb-0">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
