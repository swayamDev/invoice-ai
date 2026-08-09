import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    // Each test uses a unique key (see randomKey()) so buckets never leak
    // between tests, but we also reset fake timers between tests.
    vi.useRealTimers()
  })

  function randomKey(prefix: string) {
    return `${prefix}:${Math.random().toString(36).slice(2)}`
  }

  it('allows the first request under the limit', () => {
    const result = rateLimit(randomKey('first'), 5, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('allows up to `limit` requests within the window', () => {
    const key = randomKey('within-limit')
    for (let i = 0; i < 3; i++) {
      const result = rateLimit(key, 3, 60_000)
      expect(result.success).toBe(true)
    }
  })

  it('rejects the request once the limit is exceeded', () => {
    const key = randomKey('exceeded')
    rateLimit(key, 2, 60_000)
    rateLimit(key, 2, 60_000)
    const third = rateLimit(key, 2, 60_000)
    expect(third.success).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('decrements `remaining` by one on each successful call', () => {
    const key = randomKey('decrement')
    const first = rateLimit(key, 5, 60_000)
    const second = rateLimit(key, 5, 60_000)
    const third = rateLimit(key, 5, 60_000)
    expect([first.remaining, second.remaining, third.remaining]).toEqual([4, 3, 2])
  })

  it('tracks separate buckets per key', () => {
    const keyA = randomKey('a')
    const keyB = randomKey('b')
    rateLimit(keyA, 1, 60_000)
    const blockedA = rateLimit(keyA, 1, 60_000)
    const allowedB = rateLimit(keyB, 1, 60_000)

    expect(blockedA.success).toBe(false)
    expect(allowedB.success).toBe(true)
  })

  it('resets the bucket once the window has elapsed', () => {
    vi.useFakeTimers()
    const key = randomKey('reset')
    const start = Date.now()
    vi.setSystemTime(start)

    rateLimit(key, 1, 1_000)
    const blocked = rateLimit(key, 1, 1_000)
    expect(blocked.success).toBe(false)

    // Move past the window.
    vi.setSystemTime(start + 1_001)
    const afterReset = rateLimit(key, 1, 1_000)
    expect(afterReset.success).toBe(true)
    expect(afterReset.remaining).toBe(0)

    vi.useRealTimers()
  })

  it('returns a resetAt timestamp in the future', () => {
    const key = randomKey('reset-at')
    const before = Date.now()
    const result = rateLimit(key, 1, 60_000)
    expect(result.resetAt).toBeGreaterThan(before)
  })
})
