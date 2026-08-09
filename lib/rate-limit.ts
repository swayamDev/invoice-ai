/**
 * Minimal in-memory rate limiter, keyed per authenticated user id.
 *
 * This is process-local: on Vercel's serverless/edge runtime each instance
 * has its own memory, so this is a "best effort" throttle, not a hard
 * guarantee across a fleet of instances. It still stops the common abuse
 * case (a single user/script hammering a route) and costs nothing to run.
 *
 * For a hard guarantee across instances, swap this for Upstash Redis +
 * @upstash/ratelimit (a few lines, see README "Hardening" section).
 */

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodically clear stale buckets so this map doesn't grow forever.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupIfNeeded() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key        Unique identifier for the caller (e.g. user id + route name)
 * @param limit      Max requests allowed within the window
 * @param windowMs   Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanupIfNeeded()

  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}
