import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import * as authService from '../../services/authService.js'
import { isEmail } from '../../utils/validation.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const response = await authService.requestPasswordReset(email)
      setResult(response)
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
              <Icon name="lock" size={24} />
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>Forgot your password?</h1>
            <p className="text-muted mb-0">
              Enter the email address on your account and we will send you a reset link.
            </p>
          </div>

          {result ? (
            <>
              <div className="alert alert-success">
                <Icon name="check-circle" size={18} />
                <span>
                  If an account exists for <strong>{result.email}</strong>, a reset link is
                  on its way.
                </span>
              </div>
              {result.demoToken ? (
                <div className="alert alert-info">
                  <Icon name="info" size={18} />
                  <span>
                    Demo mode: no email is actually sent. Continue directly to{' '}
                    <Link to={`/reset-password?token=${result.demoToken}`}>
                      reset your password
                    </Link>
                    .
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Remember, this is a demo — only the seeded accounts exist.
                </p>
              )}
              <Link to="/login" className="btn btn-secondary btn-block mt-2">
                Back to sign in
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Email address"
                name="email"
                type="email"
                icon="mail"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={error}
              />
              <Button type="submit" block size="lg" icon="send" loading={submitting}>
                Send reset link
              </Button>
            </form>
          )}

          <p className="text-sm text-center mt-3 mb-0">
            Remembered it? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
