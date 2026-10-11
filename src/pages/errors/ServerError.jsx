import Button from '../../components/common/Button.jsx'
import { Icon } from '../../components/common/Icon.jsx'

/** 500 — something went wrong on our side. */
export default function ServerError() {
  return (
    <section className="section">
      <div className="container container-narrow text-center">
        <div
          className="empty-icon"
          style={{ width: 96, height: 96, margin: '0 auto 24px' }}
          aria-hidden="true"
        >
          <Icon name="alert-triangle" size={44} />
        </div>
        <span className="eyebrow">Error 500</span>
        <h1 style={{ fontSize: 'var(--text-5xl)' }}>Something went wrong</h1>
        <p className="text-muted mb-3" style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          An unexpected error interrupted your request. Please try again — if the problem
          persists, contact the hospital support team.
        </p>
        <div className="row-wrap" style={{ justifyContent: 'center' }}>
          <Button to="/" size="lg" icon="refresh">
            Try again
          </Button>
          <Button to="/contact" size="lg" variant="secondary" icon="message">
            Report a problem
          </Button>
        </div>
      </div>
    </section>
  )
}