import { describe, it, expect, vi, beforeEach } from 'vitest'

// requireUser() calls lib/supabase/server's createClient(), which itself
// calls next/headers' cookies() and talks to Supabase. Mock the Supabase
// client boundary so this test exercises requireUser's own logic (auth
// check + rate limiting) without needing a real Supabase project or a
// real Next.js request context.
const getUserMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
}))

import { requireUser } from '@/lib/api-auth'

describe('requireUser', () => {
  beforeEach(() => {
    getUserMock.mockReset()
  })

  it('returns 401 Unauthorized when there is no session', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })

    const result = await requireUser('test-route-401', 5, 60_000)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
      const body = await result.response.json()
      expect(body.error).toBe('Unauthorized')
    }
  })

  it('returns 401 Unauthorized when Supabase returns an auth error', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error('invalid token') })

    const result = await requireUser('test-route-401b', 5, 60_000)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('allows an authenticated request under the rate limit', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-abc' } }, error: null })

    const result = await requireUser('test-route-ok', 5, 60_000)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.userId).toBe('user-abc')
  })

  it('returns 429 once the same user exceeds the limit for that route', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-rate-limited' } }, error: null })

    const routeName = 'test-route-429'
    // Exhaust the limit.
    await requireUser(routeName, 2, 60_000)
    await requireUser(routeName, 2, 60_000)
    const third = await requireUser(routeName, 2, 60_000)

    expect(third.ok).toBe(false)
    if (!third.ok) {
      expect(third.response.status).toBe(429)
      expect(third.response.headers.get('Retry-After')).toBeTruthy()
    }
  })

  it('rate-limits per user, not globally', async () => {
    const routeName = 'test-route-per-user'

    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    await requireUser(routeName, 1, 60_000)
    const user1Blocked = await requireUser(routeName, 1, 60_000)
    expect(user1Blocked.ok).toBe(false)

    getUserMock.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null })
    const user2Allowed = await requireUser(routeName, 1, 60_000)
    expect(user2Allowed.ok).toBe(true)
  })

  it('does not check the rate limit at all when unauthenticated', async () => {
    // An unauthenticated caller should be rejected on the auth check
    // alone, it should never consume a slot in the per-user rate
    // limiter (which is keyed by user id and wouldn't exist yet anyway).
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })
    const result = await requireUser('test-route-no-consume', 1, 60_000)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })
})
