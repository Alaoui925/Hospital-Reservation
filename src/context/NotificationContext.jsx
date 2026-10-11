/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as notificationService from '../services/notificationService.js'
import { AuthContext } from './AuthContext.jsx'

/**
 * Two jobs in one provider:
 *  1. Transient "toast" messages (success/error feedback for any action).
 *  2. The persistent in-app notification feed for the signed-in user.
 */
export const NotificationContext = createContext(null)

const TOAST_TTL = 4200

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [toasts, setToasts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const entry = {
        id,
        type: toast.type || 'info',
        title: toast.title || 'Notice',
        message: toast.message || '',
      }
      setToasts((prev) => [entry, ...prev].slice(0, 4))
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), toast.duration ?? TOAST_TTL),
      )
      return id
    },
    [dismiss],
  )

  // Shorthand helpers: toast.success('Saved'), toast.error('Nope')
  const toast = useMemo(
    () => ({
      success: (title, message) => notify({ type: 'success', title, message }),
      error: (title, message) => notify({ type: 'error', title, message }),
      info: (title, message) => notify({ type: 'info', title, message }),
      warning: (title, message) => notify({ type: 'warning', title, message }),
      show: notify,
    }),
    [notify],
  )

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setLoading(false)
      return []
    }
    setLoading(true)
    try {
      const list = await notificationService.getNotifications(user.id)
      setNotifications(list)
      return list
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer))
      timers.current.clear()
    },
    [],
  )

  const markRead = useCallback(
    async (id) => {
      await notificationService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    },
    [],
  )

  const markAllRead = useCallback(async () => {
    if (!user?.id) return
    await notificationService.markAllAsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [user?.id])

  const removeNotification = useCallback(async (id) => {
    await notificationService.removeNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(async () => {
    if (!user?.id) return
    await notificationService.clearNotifications(user.id)
    setNotifications([])
  }, [user?.id])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      toasts,
      notify,
      toast,
      dismiss,
      notifications,
      loading,
      unreadCount,
      refresh,
      markRead,
      markAllRead,
      removeNotification,
      clearAll,
    }),
    [
      toasts,
      notify,
      toast,
      dismiss,
      notifications,
      loading,
      unreadCount,
      refresh,
      markRead,
      markAllRead,
      removeNotification,
      clearAll,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useToast must be used inside <NotificationProvider>')
  return ctx.toast
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}
