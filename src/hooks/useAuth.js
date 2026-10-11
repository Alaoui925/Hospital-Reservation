import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import { hasRole, isAdmin, isDoctor, isPatient } from '../utils/permissions.js'

/**
 * Access the authenticated user from anywhere in the tree.
 *
 *   const { user, role, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return {
    ...ctx,
    isPatient: isPatient(ctx.user),
    isDoctor: isDoctor(ctx.user),
    isAdmin: isAdmin(ctx.user),
    hasRole: (roles) => hasRole(ctx.user, roles),
  }
}

export default useAuth
