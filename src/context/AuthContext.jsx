/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'
import { getRoleHome } from '../utils/permissions.js'

/**
 * Holds the signed-in user and exposes auth actions to the whole tree.
 * The session is persisted by the service layer, so a page refresh keeps the
 * user logged in.
 */
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSession()?.user ?? null)
  const [initializing, setInitializing] = useState(true)

  // Boot sequence: pick up any OAuth redirect / Supabase session first, then
  // re-hydrate & revalidate the local session on first mount.
  useEffect(() => {
    let active = true
    authService
      .syncExternalSession()
      .then((synced) => {
        if (active && synced?.user) setUser(synced.user)
      })
      .catch(() => {})
      .finally(() => {
        authService
          .getCurrentUser()
          .then((fresh) => {
            if (active && fresh) setUser(fresh)
          })
          .catch(() => {})
          .finally(() => {
            if (active) setInitializing(false)
          })
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    // Keep the whole payload (session + requiresVerification) for the callers.
    const result = await authService.login(credentials)
    setUser(result.user)
    return result
  }, [])

  const register = useCallback(async (payload) => {
    // No session is issued yet — the user activates the account by entering
    // the 6-digit code on the /verify-email screen.
    const result = await authService.register(payload)
    return result
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return null
      const updated = await authService.updateProfile(user.id, patch)
      setUser(updated)
      return updated
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      initializing,
      homePath: getRoleHome(user?.role),
      login,
      register,
      logout,
      updateProfile,
      setUser,
    }),
    [user, initializing, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
