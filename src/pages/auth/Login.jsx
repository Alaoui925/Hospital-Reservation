import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import { DEMO_ACCOUNTS } from '../../utils/constants.js'
import { getRoleHome } from '../../utils/permissions.js'
import { validateLogin } from '../../utils/validation.js'

const HIGHLIGHTS = [
  'Book and manage appointments in one place',
  'See real-time availability for every specialist',
  'Receive confirmations and reminders instantly',
]

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const setField = (key) => (event) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = validateLogin(values)
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      const user = await login(values)
      toast.success('Welcome back', `Signed in as ${user.name}.`)
      const redirect = location.state?.from?.pathname || getRoleHome(user.role)
      navigate(redirect, { replace: true })
    } catch (error) {
      setErrors({ form: error.message || 'Unable to sign in.' })
      toast.error('Sign in failed', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (account) => {
    setValues({ email: account.email, password: account.password })
    setErrors({})
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <h2>Welcome back to MediCare</h2>
        <p style={{ color: 'rgba(255,255,255,.85)' }}>
          Sign in to manage your appointments, review your history and stay in touch with
          your care team.
        </p>
        <ul>
          {HIGHLIGHTS.map((item) => (
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
            <span className="eyebrow">Sign in</span>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>Access your account</h1>
            <p className="text-muted mb-0">Patients, doctors and administrators sign in here.</p>
          </div>

          {errors.form && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert-circle" size={18} />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Email address"
              name="email"
              type="email"
              icon="mail"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={values.email}
              onChange={setField('email')}
              error={errors.email}
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                icon="lock"
                autoComplete="current-password"
                required
                placeholder="Your password"
                value={values.password}
                onChange={setField('password')}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', top: 26, right: 4 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name="eye" size={16} />
              </button>
            </div>

            <div className="auth-split">
              <label className="checkbox">
                <input type="checkbox" defaultChecked /> Keep me signed in
              </label>
              <Link to="/forgot-password" className="text-sm">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" block size="lg" loading={submitting} icon="logout">
              Sign in
            </Button>
          </form>

          <p className="text-sm text-center mt-3">
            New to MediCare? <Link to="/register">Create a free account</Link>
          </p>

          <div className="auth-demo">
            <strong style={{ display: 'block', marginBottom: 8 }}>
              Demo accounts — click to fill
            </strong>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                className="auth-demo-row"
                onClick={() => fillDemo(account)}
                style={{
                  width: '100%',
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>
                  <strong>{account.label}</strong> · {account.email}
                </span>
                <code>{account.password}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
