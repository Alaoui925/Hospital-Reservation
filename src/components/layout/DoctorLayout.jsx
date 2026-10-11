import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import { DOCTOR_NAV } from '../../utils/constants.js'

/** Shell for the doctor workspace. */
export default function DoctorLayout() {
  return (
    <>
      <Navbar />
      <div className="app-shell">
        <Sidebar items={DOCTOR_NAV} title="Doctor workspace" />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  )
}
