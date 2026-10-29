/**
 * Auth configuration.
 *
 * The platform supports two authentication modes (see the README section
 * "Email verification & social login"):
 *
 * - "demo"      — fully offline simulation. The 6-digit code is generated
 *                 locally and displayed on the verification screen; the social
 *                 buttons explain that they need Supabase.
 * - "supabase"  — real emails (6-digit codes via Supabase Email OTP) and real
 *                 Google / GitHub / Facebook sign-in. Requires
 *                 VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in `.env.local`,
 *                 created from the two values Supabase shows in
 *                 Project Settings → API.
 *
 * Switch modes with `VITE_AUTH_MODE=demo|supabase` (default: demo).
 * If the Supabase keys are missing we silently fall back to demo so the app
 * always boots.
 */

const env = import.meta.env

const wantsSupabase = String(env.VITE_AUTH_MODE ?? 'demo').trim().toLowerCase() === 'supabase'
const hasKeys = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)

export const authMode = wantsSupabase && hasKeys ? 'supabase' : 'demo'
export const isSupabaseMode = authMode === 'supabase'
export const isDemoMode = authMode === 'demo'

export const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', icon: 'google' },
  { id: 'github', label: 'GitHub', icon: 'github' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook' },
]

export function supabaseEnv() {
  return { url: env.VITE_SUPABASE_URL ?? '', anonKey: env.VITE_SUPABASE_ANON_KEY ?? '' }
}

if (import.meta.env.DEV && wantsSupabase && !hasKeys) {
  console.warn(
    '%c[auth] VITE_AUTH_MODE=supabase but the Supabase keys are missing — falling back to demo mode.',
    'color:#d97706',
  )
}
