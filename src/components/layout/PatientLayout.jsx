import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import { PATIENT_NAV } from '../../utils/constants.js'

/** Shell for the patient portal. */
export default function PatientLayout() {
  return (
    <>
      <Navbar />
      <div className="app-shell">
        <Sidebar items={PATIENT_NAV} title="Patient portal" />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  )
}
