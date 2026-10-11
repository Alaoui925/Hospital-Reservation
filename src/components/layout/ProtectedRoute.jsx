import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Loader from '../common/Loader.jsx'
import { hasRole } from '../../utils/permissions.js'

/**
 * Guards a route branch.
 *
 *   <Route element={<ProtectedRoute roles={['admin']} />}>…</Route>
 *
 * - Not signed in  -> redirect to /login (remembering where the user wanted to go)
 * - Wrong role     -> redirect to /unauthorized
 */
export default function ProtectedRoute({ roles = [], redirectTo = '/login' }) {
  const { user, isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return <Loader label="Checking your session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (!hasRole(user, roles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
