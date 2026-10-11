import { Link } from 'react-router-dom'
import { HOSPITAL, PUBLIC_NAV } from '../../utils/constants.js'
import { Icon } from '../common/Icon.jsx'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/images/hospital-logo-full.svg" alt="MediCare Hospital" />
            <p className="mt-2" style={{ fontSize: 'var(--text-sm)' }}>
              A modern multi-specialty hospital combining compassionate care with
              straightforward, online appointment booking.
            </p>
            <div className="footer-social mt-2">
              {HOSPITAL.social.map((item) => (
                <a key={item.label} href={item.href} aria-label={item.label}>
                  <Icon name={item.label.toLowerCase()} size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <nav className="footer-links">
              {PUBLIC_NAV.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
              <Link to="/register">Create account</Link>
            </nav>
          </div>

          <div>
            <h4>Patients</h4>
            <nav className="footer-links">
              <Link to="/patient/book">Book an appointment</Link>
              <Link to="/doctors">Find a doctor</Link>
              <Link to="/departments">Departments</Link>
              <Link to="/contact">Contact us</Link>
              <Link to="/login">Patient sign in</Link>
            </nav>
          </div>

          <div>
            <h4>Contact</h4>
            <ul className="info-list" style={{ gap: 16 }}>
              <li>
                <span className="ico" style={{ background: 'rgba(255,255,255,.08)', color: '#5eead4' }}>
                  <Icon name="map-pin" size={18} />
                </span>
                <span style={{ color: 'inherit' }}>{HOSPITAL.address}</span>
              </li>
              <li>
                <span className="ico" style={{ background: 'rgba(255,255,255,.08)', color: '#5eead4' }}>
                  <Icon name="phone" size={18} />
                </span>
                <span style={{ color: 'inherit' }}>
                  {HOSPITAL.phone}
                  <br />
                  Emergency: {HOSPITAL.emergencyPhone}
                </span>
              </li>
              <li>
                <span className="ico" style={{ background: 'rgba(255,255,255,.08)', color: '#5eead4' }}>
                  <Icon name="mail" size={18} />
                </span>
                <span style={{ color: 'inherit' }}>{HOSPITAL.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} {HOSPITAL.name}. All rights reserved. Demo project — not a real
            healthcare provider.
          </span>
          <span className="row" style={{ gap: 18 }}>
            <Link to="/contact">Privacy</Link>
            <Link to="/contact">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
