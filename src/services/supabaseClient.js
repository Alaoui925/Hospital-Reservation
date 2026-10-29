/**
 * Supabase browser client.
 *
 * The SDK is imported lazily so demo mode never loads it and works even if the
 * env vars are absent. The anon key is a public client-side key (safe to ship
 * in frontend code) — create one at supabase.com → Project Settings → API,
 * paste it into `.env.local`, and the auth providers (Email OTP + the social
 * provider apps) are configured in the Supabase dashboard.
 */

import { ApiError } from './api.js'
import { isSupabaseMode, supabaseEnv } from './authConfig.js'

let cached = null

/** Friendly error used everywhere auth requires Supabase but it is not configured. */
export function supabaseNotConfiguredError() {
  return new ApiError(
    'Social sign-in and real emails need Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and set VITE_AUTH_MODE=supabase (see README).',
    { status: 501 },
  )
}

export async function getSupabase() {
  if (cached) return cached
  if (!isSupabaseMode) throw supabaseNotConfiguredError()
  const { url, anonKey } = supabaseEnv()
  if (!url || !anonKey) throw supabaseNotConfiguredError()

  const { createClient } = await import('@supabase/supabase-js')
  cached = createClient(url, anonKey, {
    auth: { persistSession: true, detectSessionInUrl: true },
  })
  return cached
}
