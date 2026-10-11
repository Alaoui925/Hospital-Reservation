import { request, store, uid } from './api.js'

/** In-app notifications shown in the navbar bell and the notifications page. */

export async function getNotifications(userId) {
  return request(() => {
    if (!userId) return []
    return store
      .find('notifications', (n) => n.userId === userId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, { ms: 120 })
}

export async function getUnreadCount(userId) {
  if (!userId) return 0
  return store.find('notifications', (n) => n.userId === userId && !n.read).length
}

export async function markAsRead(id) {
  return request(() => store.update('notifications', id, { read: true }), { ms: 60 })
}

export async function markAllAsRead(userId) {
  return request(() => {
    store
      .find('notifications', (n) => n.userId === userId && !n.read)
      .forEach((n) => store.update('notifications', n.id, { read: true }))
    return { success: true }
  }, { ms: 80 })
}

export async function removeNotification(id) {
  return request(() => ({ success: store.remove('notifications', id) }), { ms: 60 })
}

export async function clearNotifications(userId) {
  return request(() => {
    store.find('notifications', (n) => n.userId === userId).forEach((n) => store.remove('notifications', n.id))
    return { success: true }
  })
}

export async function pushNotification(userId, { title, message, type = 'info' }) {
  store.insert('notifications', {
    id: uid('not'),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  })
}
