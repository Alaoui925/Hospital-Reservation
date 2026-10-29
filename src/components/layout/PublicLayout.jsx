import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import VerifyEmailBanner from '../auth/VerifyEmailBanner.jsx'

/** Shell for the marketing / public site. */
export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <VerifyEmailBanner />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
