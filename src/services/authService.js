import { ApiError, request, session, store, toPublicUser, uid, wipeDB } from './api.js'
import { ROLES } from '../utils/constants.js'
import { isSupabaseMode } from './authConfig.js'
import { getSupabase } from './supabaseClient.js'

/**
 * Authentication & account service.
 * All functions return promises so they can be swapped for real HTTP calls.
 *
 * Two modes coexist behind one API (see `authConfig.js`):
 *  - demo mode:      everything is simulated locally (codes shown on screen).
 *  - supabase mode:  real 6-digit email codes + Google/GitHub/Facebook OAuth.
 * Accounts mirror into the local mock `users` collection either way, so the
 * rest of the application (roles, appointments, dashboards) never changes.
 */

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

/* -------------------------------------------------------------------------- */
/* Email verification (6-digit code flow)                                     */
/* -------------------------------------------------------------------------- */

const VERIFY_KEY = 'medicare:email-verification:v1'
const CODE_TTL_MS = 10 * 60 * 1000
const MAX_CODE_ATTEMPTS = 5

function readVerifyStore() {
  try {
    return JSON.parse(localStorage.getItem(VERIFY_KEY)) || {}
  } catch {
    return {}
  }
}

function writeVerifyStore(next) {
  try {
    localStorage.setItem(VERIFY_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable — verification simply can't persist */
  }
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Demo mode only: store a fresh simulated code for this email. */
function putPendingCode(email) {
  const key = normalizeEmail(email)
  const next = readVerifyStore()
  next[key] = { code: generateCode(), sentAt: Date.now(), attempts: 0 }
  writeVerifyStore(next)
  return { email: key, expiresAt: next[key].sentAt + CODE_TTL_MS }
}

/** Demo mode only: validate a entered code against the simulated mailbox. */
function checkPendingCode(email, code) {
  const key = normalizeEmail(email)
  const all = readVerifyStore()
  const record = all[key]
  if (!record) {
    throw new ApiError('No code was sent for this email yet. Press “Resend code”.', {
      status: 400,
      fields: { code: 'Request a code first.' },
    })
  }
  if (Date.now() - record.sentAt > CODE_TTL_MS) {
    delete all[key]
    writeVerifyStore(all)
    throw new ApiError('This code has expired. Please request a new one.', {
      status: 400,
      fields: { code: 'Code expired.' },
    })
  }
  if (record.attempts >= MAX_CODE_ATTEMPTS) {
    throw new ApiError('Too many wrong attempts. Please request a new code.', {
      status: 429,
      fields: { code: 'Too many attempts.' },
    })
  }
  if (String(code).replace(/\s/g, '') !== record.code) {
    const bumped = readVerifyStore()
    if (bumped[key]) {
      bumped[key].attempts = (bumped[key].attempts || 0) + 1
      writeVerifyStore(bumped)
    }
    throw new ApiError('That code is incorrect. Check the email and try again.', {
      status: 400,
      fields: { code: 'Incorrect code.' },
    })
  }
  delete all[key]
  writeVerifyStore(all)
  return true
}

/** Clear any stored simulated code (used by the demo reset). */
function clearVerificationState() {
  try {
    localStorage.removeItem(VERIFY_KEY)
  } catch {
    /* ignore */
  }
}

/** Public boolean used by the UI (banner, booking gate). Legacy data is trusted. */
export function isEmailVerified(user) {
  return Boolean(user && user.emailVerified !== false)
}

/**
 * Demo mode only: current simulated code for an email, shown on the verify
 * screen ("Demo mailbox"). Returns null in supabase mode or when expired.
 */
export function peekDemoCode(email) {
  if (isSupabaseMode) return null
  const record = readVerifyStore()[normalizeEmail(email)]
  if (!record) return null
  if (Date.now() - record.sentAt > CODE_TTL_MS) return null
  return record.code
}

function issueSession(user) {
  const payload = {
    token: `mock.${uid('tok')}`,
    user: toPublicUser(user),
    issuedAt: new Date().toISOString(),
  }
  session.set(payload)
  return payload
}

/** Mirror a Supabase identity into the local mock `users` collection. */
function mirrorSupabaseUser(supabaseUser, { provider = 'email', password = null } = {}) {
  const email = normalizeEmail(supabaseUser.email)
  const meta = supabaseUser.user_metadata || {}
  let user = store.findBy('users', (u) => normalizeEmail(u.email) === email)

  if (!user) {
    // Social / Supabase sign-ups always become patient accounts.
    user = store.insert('users', {
      id: uid('user'),
      name: meta.full_name || meta.name || email.split('@')[0],
      email,
      password,
      phone: meta.phone || '',
      role: ROLES.PATIENT,
      avatar: meta.avatar_url || meta.picture || null,
      createdAt: new Date().toISOString(),
      bloodGroup: '',
      address: '',
      // Providers (Google etc.) already verified this email — no code needed.
      emailVerified: true,
      authProvider: provider,
    })
  } else {
    const patch = {}
    if (provider && provider !== 'email' && user.authProvider !== provider) patch.authProvider = provider
    if (provider && provider !== 'email' && user.emailVerified === false) patch.emailVerified = true
    if ((meta.avatar_url || meta.picture) && !user.avatar) patch.avatar = meta.avatar_url || meta.picture
    if (Object.keys(patch).length) user = store.update('users', user.id, patch)
  }
  return user
}

function applicationBlock(email) {
  const application = store.findBy('doctorApplications', (a) => a.email === normalizeEmail(email))
  if (application && application.status === 'pending') {
    throw new ApiError(
      'Your doctor application is still under review. Sign-in opens once an administrator approves it.',
      { status: 403 },
    )
  }
  if (application && application.status === 'rejected') {
    throw new ApiError('Your doctor application was not approved. Please contact the hospital administration.', {
      status: 403,
    })
  }
}

export async function login({ email, password }) {
  return request(async () => {
    const normalized = normalizeEmail(email)
    let user = store.findBy('users', (u) => normalizeEmail(u.email) === normalized)

    const localMatch = user && user.password && user.password === password
    if (!localMatch && isSupabaseMode && (!user || !user.password)) {
      // New-style accounts live in Supabase first, then mirror into our local database.
      try {
        const supabase = await getSupabase()
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password })
        if (error) {
          if (!/invalid login credentials/i.test(error.message ?? '')) {
            // Real config problem — surface it rather than the generic message.
            if (/email not confirmed/i.test(error.message ?? '')) {
              throw new ApiError(
                'Your email is still awaiting verification. Sign in again after entering the code from your inbox.',
                { status: 403 },
              )
            }
          }
          user = null // fall through to the friendly 401 below
        } else {
          user = mirrorSupabaseUser(data.user, { provider: data.user?.app_metadata?.provider || 'email', password })
        }
      } catch (error) {
        if (error instanceof ApiError) throw error
        user = null
      }
    }

    if (!user || !user.password || user.password !== password) {
      applicationBlock(normalized)
      throw new ApiError('Incorrect email or password. Please try again.', { status: 401 })
    }

    // Verification gate: the session is issued even when unverified so the UI
    // can show the banner — but Login routes to the verify screen instead of home.
    const payload = issueSession(user)
    if (user.emailVerified === false) return { ...payload, requiresVerification: true }
    return payload
  })
}

export async function register({ name, email, password, phone }) {
  return request(async () => {
    const normalized = normalizeEmail(email)
    const exists = store.findBy('users', (u) => normalizeEmail(u.email) === normalized)
    if (exists) {
      throw new ApiError('An account with this email already exists.', {
        status: 409,
        fields: { email: 'This email is already registered.' },
      })
    }

    if (isSupabaseMode) {
      // 1) Create the real auth account. Email confirmation is disabled in the
      //    Supabase dashboard so the ONLY challenge is our 6-digit code flow.
      const supabase = await getSupabase()
      const { error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { full_name: String(name).trim() } },
      })
      if (error) {
        if (/already registered/i.test(error.message ?? '')) {
          throw new ApiError('An account with this email already exists.', {
            status: 409,
            fields: { email: 'This email is already registered.' },
          })
        }
        throw new ApiError(error.message ?? 'Unable to create the account.', { status: 400 })
      }
      // 2) Send the 6-digit code to the inbox.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: false },
      })
      if (otpError) throw new ApiError(otpError.message, { status: 502 })
    } else {
      // Demo mode: store the simulated code — the verify screen shows it.
      putPendingCode(normalized)
    }

    store.insert('users', {
      id: uid('user'),
      name: String(name).trim(),
      email: normalized,
      password,
      phone: phone || '',
      role: ROLES.PATIENT,
      avatar: null,
      createdAt: new Date().toISOString(),
      bloodGroup: '',
      address: '',
      emailVerified: false,
      authProvider: 'email',
    })

    // No session yet — the account activates once the code is entered.
    return { requiresVerification: true, email: normalized }
  })
}

/** Send (or re-send) the verification code to an email that has an account. */
export async function resendVerificationCode(email) {
  return request(async () => {
    const normalized = normalizeEmail(email)
    const user = store.findBy('users', (u) => normalizeEmail(u.email) === normalized)
    if (!user) {
      throw new ApiError('No account matches this email. Please register first.', { status: 404 })
    }
    if (isSupabaseMode) {
      const supabase = await getSupabase()
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: false },
      })
      if (error) throw new ApiError(error.message ?? 'Unable to send the email.', { status: 502 })
    } else {
      putPendingCode(normalized)
    }
    return { sent: true, email: normalized }
  })
}

/** Check the 6-digit code; on success the account is verified and a session issued. */
export async function verifyEmailCode({ email, code }) {
  return request(async () => {
    const normalized = normalizeEmail(email)
    const user = store.findBy('users', (u) => normalizeEmail(u.email) === normalized)
    if (!user) {
      throw new ApiError('No account matches this email. Please register first.', { status: 404 })
    }

    if (isSupabaseMode) {
      const supabase = await getSupabase()
      const { error } = await supabase.auth.verifyOtp({
        email: normalized,
        token: String(code).replace(/\s/g, ''),
        type: 'email',
      })
      if (error) {
        throw new ApiError('That code is incorrect or has expired. Please try again.', {
          status: 400,
          fields: { code: 'Invalid code.' },
        })
      }
    } else {
      checkPendingCode(normalized, code)
    }

    const fresh = store.update('users', user.id, { emailVerified: true })
    return issueSession(fresh)
  })
}

export async function logout() {
  session.clear()
  clearVerificationState()
  if (isSupabaseMode) {
    try {
      const supabase = await getSupabase()
      await supabase.auth.signOut()
    } catch {
      /* supabase not reachable — the local session is already cleared */
    }
  }
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
    clearVerificationState()
    if (isSupabaseMode) {
      getSupabase()
        .then((supabase) => supabase.auth.signOut())
        .catch(() => {})
    }
    store.remove('users', userId)
    return { success: true }
  })
}

/* -------------------------------------------------------------------------- */
/* Social sign-in (Google / GitHub / Facebook)                                */
/* -------------------------------------------------------------------------- */

/**
 * Redirect the browser to the provider's consent screen.
 * Only meaningful in supabase mode — demo mode surfaces a friendly hint.
 * Social sign-ups always become patient accounts and arrive auto-verified
 * (the provider already owns a verified email).
 */
export async function signInWithProvider(provider) {
  const supabase = await getSupabase() // demo mode → friendly ApiError(501)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  })
  if (error) throw new ApiError(error.message ?? 'Unable to start the social sign-in.', { status: 502 })
  return data
}

/**
 * Called once on app boot: when the OAuth redirect comes back (or a Supabase
 * session exists) and no local session is active yet, mirror the identity into
 * the local database and issue our normal session. Returns the user or null.
 */
export async function syncExternalSession() {
  if (!isSupabaseMode) return null
  try {
    const supabase = await getSupabase()
    const { data } = await supabase.auth.getSession()
    const authUser = data?.session?.user
    if (!authUser) return null
    if (session.get()?.user?.id) return null // keep an already active session
    const user = mirrorSupabaseUser(authUser, {
      provider: authUser.app_metadata?.provider || 'oauth',
    })
    return issueSession(user)
  } catch {
    /* Supabase unreachable or not configured — stay anonymous */
    return null
  }
}

/** Demo helper: restore the seeded dataset (promised on the login screen). */
export async function resetDemoData() {
  return request(() => {
    wipeDB()
    clearVerificationState()
    return { success: true }
  })
}
