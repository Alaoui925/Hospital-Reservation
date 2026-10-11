import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { PUBLIC_NAV, ROLE_LABELS } from '../../utils/constants.js'
import { relativeTime } from '../../utils/formatDate.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useNotifications, useToast } from '../../context/NotificationContext.jsx'
import Button from '../common/Button.jsx'
import Avatar from '../common/Avatar.jsx'
import { Icon } from '../common/Icon.jsx'

/** Global top navigation: public links, notification bell and account menu. */
export default function Navbar() {
  const { user, isAuthenticated, logout, homePath } = useAuth()
  const { unreadCount, notifications, markAllRead, markRead } = useNotifications()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [navOpen, setNavOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const menusRef = useRef(null)

  // Close every menu when the route changes.
  useEffect(() => {
    setNavOpen(false)
    setUserOpen(false)
    setBellOpen(false)
  }, [location.pathname])

  // Close dropdowns when clicking outside of them.
  useEffect(() => {
    const onPointerDown = (event) => {
      if (menusRef.current && !menusRef.current.contains(event.target)) {
        setUserOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Signed out', 'You have been logged out safely.')
    navigate('/')
  }

  const recent = notifications.slice(0, 5)

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="MediCare Hospital home">
          <img src="/images/hospital-logo.svg" alt="" />
          <span className="brand-text">
            <strong>MediCare</strong>
            <span>HOSPITAL</span>
          </span>
        </Link>

        <nav className={`nav-links ${navOpen ? 'open' : ''}`} aria-label="Main navigation">
          {PUBLIC_NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink
              to={homePath}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              My portal
            </NavLink>
          )}
        </nav>

        <div className="nav-actions" ref={menusRef}>
          {isAuthenticated ? (
            <>
              {user?.role === 'patient' && (
                <Button to="/patient/book" icon="calendar-plus" size="sm" className="hide-sm">
                  Book
                </Button>
              )}

              {/* Notification bell */}
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setBellOpen((v) => !v)
                    setUserOpen(false)
                  }}
                  aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
                  aria-expanded={bellOpen}
                  style={{ position: 'relative' }}
                >
                  <Icon name="bell" size={20} />
                  {unreadCount > 0 && (
                    <span
                      className="badge badge-danger"
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        padding: '0 6px',
                        minWidth: 18,
                        justifyContent: 'center',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="dropdown-menu" style={{ minWidth: 320 }}>
                    <div className="row-between dropdown-head">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {recent.length === 0 ? (
                      <p className="text-sm text-muted" style={{ padding: '10px 12px', margin: 0 }}>
                        You have no notifications yet.
                      </p>
                    ) : (
                      recent.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => markRead(item.id)}
                          style={{ alignItems: 'flex-start' }}
                        >
                          <span
                            className={`badge badge-${
                              item.type === 'success'
                                ? 'success'
                                : item.type === 'warning'
                                  ? 'warning'
                                  : 'info'
                            }`}
                            style={{ marginTop: 3 }}
                          >
                            •
                          </span>
                          <span className="grow">
                            <strong style={{ display: 'block', color: 'var(--ink-900)' }}>
                              {item.title}
                            </strong>
                            <span style={{ fontWeight: 400, color: 'var(--ink-500)' }}>
                              {item.message}
                            </span>
                            <span className="text-xs text-muted" style={{ display: 'block' }}>
                              {relativeTime(item.createdAt)}
                            </span>
                          </span>
                          {!item.read && <span className="badge-dot" style={{ marginTop: 8 }} />}
                        </button>
                      ))
                    )}
                    <Link
                      to={user?.role === 'patient' ? '/patient/notifications' : homePath}
                      className="dropdown-item"
                      style={{ justifyContent: 'center', color: 'var(--brand-700)' }}
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>

              {/* Account menu */}
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setUserOpen((v) => !v)
                    setBellOpen(false)
                  }}
                  aria-label="Account menu"
                  aria-expanded={userOpen}
                  style={{ padding: 4 }}
                >
                  <Avatar src={user?.avatar} name={user?.name} size="sm" />
                </button>

                {userOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-head">
                      <strong>{user?.name}</strong>
                      <span>
                        {ROLE_LABELS[user?.role]} · {user?.email}
                      </span>
                    </div>
                    <Link to={homePath} className="dropdown-item">
                      <Icon name="grid" size={16} /> Dashboard
                    </Link>
                    {user?.role === 'patient' && (
                      <>
                        <Link to="/patient/appointments" className="dropdown-item">
                          <Icon name="calendar" size={16} /> My appointments
                        </Link>
                        <Link to="/patient/profile" className="dropdown-item">
                          <Icon name="user" size={16} /> Profile
                        </Link>
                      </>
                    )}
                    {user?.role === 'doctor' && (
                      <Link to="/doctor/profile" className="dropdown-item">
                        <Icon name="user" size={16} /> My profile
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link to="/admin/reports" className="dropdown-item">
                        <Icon name="chart" size={16} /> Reports
                      </Link>
                    )}
                    <button type="button" className="dropdown-item danger" onClick={handleLogout}>
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button to="/register" size="sm">
                Create account
              </Button>
            </>
          )}

          <button
            type="button"
            className="nav-toggle"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            <Icon name={navOpen ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
