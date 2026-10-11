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

  // Re-hydrate & revalidate the session on first mount.
  useEffect(() => {
    let active = true
    authService
      .getCurrentUser()
      .then((fresh) => {
        if (active && fresh) setUser(fresh)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setInitializing(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const { user: nextUser } = await authService.login(credentials)
    setUser(nextUser)
    return nextUser
  }, [])

  const register = useCallback(async (payload) => {
    const { user: nextUser } = await authService.register(payload)
    setUser(nextUser)
    return nextUser
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
