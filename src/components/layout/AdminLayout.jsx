import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import { ADMIN_NAV } from '../../utils/constants.js'
import { useNotifications } from '../../context/NotificationContext.jsx'

/** Shell for the hospital administration console. */
export default function AdminLayout() {
  const { unreadCount } = useNotifications()

  const items = ADMIN_NAV.map((item) =>
    item.to === '/admin/reports' && unreadCount > 0 ? { ...item, badge: unreadCount } : item,
  )

  return (
    <>
      <Navbar />
      <div className="app-shell">
        <Sidebar items={items} title="Administration" />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  )
}
