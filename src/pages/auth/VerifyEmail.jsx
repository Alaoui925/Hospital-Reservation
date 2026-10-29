import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as authService from '../../services/authService.js'
import { isDemoMode } from '../../services/authConfig.js'

const RESEND_COOLDOWN = 60

/**
 * 6-digit email verification screen.
 *
 * Reached after registering or signing in with an unverified account.
 * On success the user is signed in (session issued by the service) and sent
 * to their profile page — the banner disappears everywhere.
 */
export default function VerifyEmail() {
  const { setUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const email = location.state?.email ?? ''

  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)

  // Demo mode: surface the simulated code the way a inbox would deliver it.
  const [demoCode, setDemoCode] = useState(() => authService.peekDemoCode(email))
  useEffect(() => {
    if (!isDemoMode) return undefined
    const timer = setInterval(() => setDemoCode(authService.peekDemoCode(email)), 400)
    return () => clearInterval(timer)
  }, [email])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const codeError = useMemo(() => errors.code, [errors])

  const setCodeValue = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: 'Enter the 6 digits from the email.' })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const { user } = await authService.verifyEmailCode({ email, code })
      setUser(user)
      toast.success('Email verified', `You're all set, ${user.name.split(' ')[0]} — your account is now active.`)
      navigate('/patient/profile', { replace: true })
    } catch (error) {
      setErrors({ code: error.fields?.code ?? error.message, form: error.message })
      toast.error('Verification failed', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authService.resendVerificationCode(email)
      toast.info('Code sent', `A fresh 6-digit code was sent to ${email}.`)
      setCode('')
      setErrors({})
      setCooldown(RESEND_COOLDOWN)
    } catch (error) {
      toast.error('Could not resend the code', error.message)
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return (
      <div className="auth-wrap">
        <div className="auth-form-side" style={{ width: '100%' }}>
          <div className="auth-card">
            <div className="mb-3">
              <span className="eyebrow">Verify email</span>
              <h1 style={{ fontSize: 'var(--text-3xl)' }}>No email provided</h1>
              <p className="text-muted mb-0">
                Start again to receive a verification code.
              </p>
            </div>
            <Button to="/register" size="lg" icon="user">
              Create an account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <h2>One last step</h2>
        <p style={{ color: 'rgba(255,255,255,.85)' }}>
          Confirm your email address to activate your MediCare account. Until then you
          can browse the site, but booking stays locked.
        </p>
        <ul>
          <li>
            <Icon name="check-circle" size={20} />
            <span>Open your inbox and find the MediCare code</span>
          </li>
          <li>
            <Icon name="check-circle" size={20} />
            <span>Type the 6 digits below</span>
          </li>
          <li>
            <Icon name="check-circle" size={20} />
            <span>You land on your profile, verified</span>
          </li>
        </ul>
      </aside>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="mb-3">
            <span className="eyebrow">Verify email</span>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>Enter your code</h1>
            <p className="text-muted mb-0">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          {errors.form && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert-circle" size={18} />
              <span>{errors.form}</span>
            </div>
          )}

          {isDemoMode && demoCode && (
            <div className="demo-mailbox" role="note">
              <div>
                <Icon name="mail" size={18} />
                <span>
                  <strong>Demo mailbox</strong> — emails are simulated in demo mode. Your code:
                </span>
              </div>
              <code>{demoCode}</code>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Verification code"
              name="verify-code"
              icon="shield"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="••••••"
              value={code}
              onChange={setCodeValue}
              error={codeError}
              className="otp-input"
            />

            <Button type="submit" block size="lg" loading={submitting} icon="check-circle">
              Verify my email
            </Button>
          </form>

          <div className="auth-split verify-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
            >
              <Icon name="refresh" size={14} />
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <Link to="/login" className="text-sm">
              Use a different email
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
