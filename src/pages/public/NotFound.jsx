import Button from '../../components/common/Button.jsx'
import { Icon } from '../../components/common/Icon.jsx'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container container-narrow text-center">
        <div
          className="empty-icon"
          style={{ width: 96, height: 96, margin: '0 auto 24px' }}
          aria-hidden="true"
        >
          <Icon name="alert-circle" size={44} />
        </div>
        <span className="eyebrow">Error 404</span>
        <h1 style={{ fontSize: 'var(--text-5xl)' }}>Page not found</h1>
        <p className="text-muted mb-3" style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          The page you are looking for does not exist, has been moved, or you may have
          mistyped the address.
        </p>
        <div className="row-wrap" style={{ justifyContent: 'center' }}>
          <Button to="/" size="lg" icon="home">
            Back to homepage
          </Button>
          <Button to="/doctors" size="lg" variant="secondary" icon="stethoscope">
            Find a doctor
          </Button>
          <Button to="/contact" size="lg" variant="ghost" icon="message">
            Contact us
          </Button>
        </div>
      </div>
    </section>
  )
}
