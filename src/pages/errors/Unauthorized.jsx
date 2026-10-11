import { useAuth } from '../../hooks/useAuth.js'
import Button from '../../components/common/Button.jsx'
import { Icon } from '../../components/common/Icon.jsx'

/** 403 — signed in, but not allowed here. */
export default function Unauthorized() {
  const { homePath } = useAuth()

  return (
    <section className="section">
      <div className="container container-narrow text-center">
        <div
          className="empty-icon"
          style={{ width: 96, height: 96, margin: '0 auto 24px' }}
          aria-hidden="true"
        >
          <Icon name="lock" size={44} />
        </div>
        <span className="eyebrow">Error 403</span>
        <h1 style={{ fontSize: 'var(--text-5xl)' }}>Access denied</h1>
        <p className="text-muted mb-3" style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          You are signed in, but your account doesn&apos;t have permission to view this
          page. If you think this is a mistake, contact the hospital administration.
        </p>
        <div className="row-wrap" style={{ justifyContent: 'center' }}>
          <Button to={homePath} size="lg" icon="home">
            Go to my dashboard
          </Button>
          <Button to="/" size="lg" variant="secondary" icon="building">
            Hospital homepage
          </Button>
        </div>
      </div>
    </section>
  )
}