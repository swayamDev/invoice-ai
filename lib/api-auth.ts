import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export interface AuthedRequest {
  userId: string
}

/**
 * Verifies the caller has a valid Supabase session AND is within the
 * per-user rate limit for the given route. Every API route that costs
 * money (OpenAI) or can be abused (sending email) must call this first.
 *
 * Returns either `{ ok: true, userId }` or `{ ok: false, response }` where
 * `response` is the NextResponse to return immediately.
 */
export async function requireUser(
  routeName: string,
  limit: number,
  windowMs: number
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { success, resetAt } = rateLimit(`${routeName}:${user.id}`, limit, windowMs)
  if (!success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many requests. Please slow down and try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      ),
    }
  }

  return { ok: true, userId: user.id }
}
