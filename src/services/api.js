/**
 * Mock API layer.
 *
 * The application talks to this module instead of the network. It persists the
 * whole dataset in `localStorage` and exposes small CRUD helpers plus a
 * `delay()` used to simulate realistic request latency, so loading states and
 * spinners behave exactly like they would against a real backend.
 *
 * Swapping in a real backend later means replacing the bodies of the service
 * modules (authService, doctorService, …) with `fetch(`${API_URL}/...`)` calls —
 * the component tree does not need to change.
 */

import {
  seedAppointments,
  seedContactMessages,
  seedDepartments,
  seedDoctors,
  seedMedicalRecords,
  seedNotifications,
  seedReviews,
  seedUsers,
} from './mockData.js'

export const DB_KEY = 'medicare:hospital-db:v3'
export const SESSION_KEY = 'medicare:session:v1'

const LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 300)

let cache = null

function buildSeed() {
  const departments = seedDepartments()
  const doctors = seedDoctors()
  const users = seedUsers(doctors)
  const reviews = seedReviews()

  // Make the advertised rating / review counts agree with the seeded reviews.
  doctors.forEach((doctor) => {
    const list = reviews.filter((r) => r.doctorId === doctor.id)
    doctor.rating = list.length
      ? Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10
      : 0
    doctor.reviews = list.length
  })

  return {
    departments,
    doctors,
    users,
    appointments: seedAppointments(),
    reviews,
    medicalRecords: seedMedicalRecords(),
    doctorApplications: [],
    notifications: seedNotifications(),
    contactMessages: seedContactMessages(),
    meta: { version: 3, seededAt: new Date().toISOString() },
  }
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache))
  } catch {
    /* storage unavailable (private mode) — keep working in memory */
  }
}

export function readDB() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      cache = JSON.parse(raw)
      return cache
    }
  } catch {
    /* fall through to a fresh seed */
  }
  cache = buildSeed()
  persist()
  return cache
}

export function resetDB() {
  cache = buildSeed()
  persist()
  return cache
}

/** Remove the persisted database and session (used by the demo reset button). */
export function wipeDB() {
  cache = null
  try {
    localStorage.removeItem(DB_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/* Logging helpers                                                            */
/* -------------------------------------------------------------------------- */

const isDev = import.meta.env.DEV
const log = (...args) => isDev && console.debug('%c[api]', 'color:#0d9488', ...args)

/* -------------------------------------------------------------------------- */
/* Collection store                                                           */
/* -------------------------------------------------------------------------- */

export const store = {
  collection(name) {
    const dbData = readDB()
    if (!Array.isArray(dbData[name])) dbData[name] = []
    return dbData[name]
  },

  all(name) {
    return [...store.collection(name)]
  },

  find(name, predicate) {
    return store.collection(name).filter(predicate)
  },

  findById(name, id) {
    return store.collection(name).find((item) => String(item.id) === String(id)) || null
  },

  findBy(name, predicate) {
    return store.collection(name).find(predicate) || null
  },

  insert(name, item) {
    const items = store.collection(name)
    items.push(item)
    persist()
    log(`insert ${name}`, item.id)
    return item
  },

  update(name, id, patch) {
    const items = store.collection(name)
    const index = items.findIndex((item) => String(item.id) === String(id))
    if (index === -1) return null
    items[index] = { ...items[index], ...patch }
    persist()
    log(`update ${name}`, id)
    return items[index]
  },

  remove(name, id) {
    const items = store.collection(name)
    const index = items.findIndex((item) => String(item.id) === String(id))
    if (index === -1) return false
    items.splice(index, 1)
    persist()
    log(`remove ${name}`, id)
    return true
  },
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export const session = {
  get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set(payload) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  },
}

/** Strip secret fields before returning a user to the UI. */
export function toPublicUser(user) {
  if (!user) return null
  const { password: _password, ...safe } = user
  return safe
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

let counter = Date.now() % 100000
export function uid(prefix = 'id') {
  counter += 1
  return `${prefix}-${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function delay(ms = LATENCY) {
  if (!ms) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class ApiError extends Error {
  constructor(message, { status = 400, fields } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

/** Wrap async mock work so it always resolves after a short latency. */
export async function request(work, { ms = LATENCY } = {}) {
  await delay(ms)
  const result = await work()
  return result
}

export { LATENCY }
