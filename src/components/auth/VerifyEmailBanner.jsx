import { Link } from 'react-router-dom'
import { Icon } from '../common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as authService from '../../services/authService.js'

/**
 * Slim amber strip shown while the signed-in user still has an unverified
 * email. Rendered under the navbar on public pages and inside the patient
 * portal. disappears as soon as verifyEmailCode() succeeds.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuth()
  const toast = useToast()
  if (!user || authService.isEmailVerified(user)) return null

  const email = user.email

  const resend = async () => {
    try {
      await authService.resendVerificationCode(email)
      toast.info('Code sent', `A fresh 6-digit code was sent to ${email}.`)
    } catch (error) {
      toast.error('Could not resend the code', error.message)
    }
  }

  return (
    <div className="verify-banner" role="status">
      <Icon name="mail" size={18} />
      <span>
        <strong>Confirm your email</strong> — enter the 6-digit code sent to {email} to
        unlock booking.
      </span>
      <Link to="/verify-email" state={{ email }} className="btn btn-sm btn-primary">
        Verify now
      </Link>
      <button type="button" className="btn btn-sm btn-ghost" onClick={resend}>
        Resend code
      </button>
    </div>
  )
}
