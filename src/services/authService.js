import { ApiError, request, session, store, toPublicUser, uid } from './api.js'
import { ROLES } from '../utils/constants.js'

/**
 * Authentication & account service.
 * All functions return promises so they can be swapped for real HTTP calls.
 */

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

function issueSession(user) {
  const payload = {
    token: `mock.${uid('tok')}`,
    user: toPublicUser(user),
    issuedAt: new Date().toISOString(),
  }
  session.set(payload)
  return payload
}

export async function login({ email, password }) {
  return request(() => {
    const user = store.findBy('users', (u) => normalizeEmail(u.email) === normalizeEmail(email))
    if (!user || user.password !== password) {
      throw new ApiError('Incorrect email or password. Please try again.', { status: 401 })
    }
    return issueSession(user)
  })
}

export async function register({ name, email, password, phone }) {
  return request(() => {
    const exists = store.findBy('users', (u) => normalizeEmail(u.email) === normalizeEmail(email))
    if (exists) {
      throw new ApiError('An account with this email already exists.', {
        status: 409,
        fields: { email: 'This email is already registered.' },
      })
    }
    const user = store.insert('users', {
      id: uid('user'),
      name: String(name).trim(),
      email: normalizeEmail(email),
      password,
      phone: phone || '',
      role: ROLES.PATIENT,
      avatar: null,
      createdAt: new Date().toISOString(),
      bloodGroup: '',
      address: '',
    })
    return issueSession(user)
  })
}

export function logout() {
  session.clear()
}

export function getSession() {
  return session.get()
}

/** Re-read the signed-in user from the database (keeps profile edits in sync). */
export async function getCurrentUser() {
  return request(() => {
    const current = session.get()
    if (!current?.user?.id) return null
    const fresh = store.findById('users', current.user.id)
    return fresh ? toPublicUser(fresh) : current.user
  }, { ms: 80 })
}

export async function updateProfile(userId, patch) {
  return request(() => {
    const allowed = [
      'name',
      'phone',
      'dob',
      'gender',
      'bloodGroup',
      'address',
      'insuranceProvider',
      'insuranceNumber',
      'emergencyContact',
      'avatar',
    ]
    const safePatch = Object.fromEntries(
      Object.entries(patch).filter(([key]) => allowed.includes(key)),
    )
    const updated = store.update('users', userId, safePatch)
    if (!updated) throw new ApiError('Account not found.', { status: 404 })

    // Keep the doctor directory record in sync with profile edits.
    if (updated.role === ROLES.DOCTOR && updated.doctorId) {
      store.update('doctors', updated.doctorId, {
        ...(safePatch.name ? { name: String(safePatch.name).replace(/^(Dr\.?\s*)/i, '').trim() } : {}),
        ...(safePatch.phone ? { phone: safePatch.phone } : {}),
        ...(safePatch.avatar ? { avatar: safePatch.avatar } : {}),
      })
    }

    const current = session.get()
    if (current) session.set({ ...current, user: toPublicUser(updated) })
    return toPublicUser(updated)
  })
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  return request(() => {
    const user = store.findById('users', userId)
    if (!user) throw new ApiError('Account not found.', { status: 404 })
    if (user.password !== currentPassword) {
      throw new ApiError('Your current password is incorrect.', {
        status: 400,
        fields: { currentPassword: 'Incorrect password.' },
      })
    }
    store.update('users', userId, { password: newPassword })
    return { success: true }
  })
}

export async function requestPasswordReset(email) {
  return request(() => {
    const user = store.findBy('users', (u) => normalizeEmail(u.email) === normalizeEmail(email))
    // Do not reveal whether the account exists.
    return {
      sent: true,
      email: normalizeEmail(email),
      // In the demo the token is returned so the flow can be completed offline.
      demoToken: user ? `reset-${user.id}` : null,
    }
  })
}

export async function resetPassword({ token, password }) {
  return request(() => {
    const userId = String(token || '').replace(/^reset-/, '')
    const user = store.findById('users', userId)
    if (!user) throw new ApiError('This reset link is invalid or has expired.', { status: 400 })
    store.update('users', userId, { password })
    return { success: true }
  })
}

/** Simulated "delete my account" used on the profile page. */
export async function deleteAccount(userId) {
  return request(() => {
    session.clear()
    store.remove('users', userId)
    return { success: true }
  })
}
