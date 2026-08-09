import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('merges conflicting Tailwind classes, keeping the last one', () => {
    // tailwind-merge should resolve conflicting utilities of the same
    // kind (padding here) to the last one specified.
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('supports conditional object syntax via clsx', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  it('returns an empty string when given nothing', () => {
    expect(cn()).toBe('')
  })
})
