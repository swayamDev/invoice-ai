import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readEnvVar, readEmailEnvVar } from '@/lib/env'

const ORIGINAL_ENV = { ...process.env }

describe('readEnvVar', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns the value unchanged when set normally', () => {
    process.env.TEST_VAR = 'noreply@invoice.swayam.space'
    expect(readEnvVar('TEST_VAR')).toBe('noreply@invoice.swayam.space')
  })

  it('strips an accidentally-pasted "NAME=" prefix', () => {
    // This is the exact bug reported: the platform's env var UI was
    // given "RESEND_FROM_EMAIL=noreply@invoice.swayam.space" as the
    // *value*, instead of just "noreply@invoice.swayam.space", so the
    // From header rendered as
    // "utkal tech <RESEND_FROM_EMAIL=noreply@invoice.swayam.space>".
    process.env.RESEND_FROM_EMAIL = 'RESEND_FROM_EMAIL=noreply@invoice.swayam.space'
    expect(readEnvVar('RESEND_FROM_EMAIL')).toBe('noreply@invoice.swayam.space')
  })

  it('returns undefined when the var is not set', () => {
    delete process.env.TEST_VAR
    expect(readEnvVar('TEST_VAR')).toBeUndefined()
  })

  it('does not strip a prefix that merely resembles another key', () => {
    // Only strips when the value starts with *this exact* var name.
    process.env.TEST_VAR = 'OTHER_VAR=something'
    expect(readEnvVar('TEST_VAR')).toBe('OTHER_VAR=something')
  })
})

describe('readEmailEnvVar', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns a valid, correctly-set email as-is', () => {
    process.env.RESEND_FROM_EMAIL = 'noreply@invoice.swayam.space'
    expect(readEmailEnvVar('RESEND_FROM_EMAIL', 'fallback@example.com')).toBe(
      'noreply@invoice.swayam.space'
    )
  })

  it('recovers a valid email from the "NAME=" paste-mistake', () => {
    process.env.RESEND_FROM_EMAIL = 'RESEND_FROM_EMAIL=noreply@invoice.swayam.space'
    expect(readEmailEnvVar('RESEND_FROM_EMAIL', 'fallback@example.com')).toBe(
      'noreply@invoice.swayam.space'
    )
  })

  it('falls back when the var is unset', () => {
    delete process.env.RESEND_FROM_EMAIL
    expect(readEmailEnvVar('RESEND_FROM_EMAIL', 'fallback@example.com')).toBe(
      'fallback@example.com'
    )
  })

  it('falls back when the value is set but not a valid email even after stripping', () => {
    process.env.RESEND_FROM_EMAIL = 'not-an-email'
    expect(readEmailEnvVar('RESEND_FROM_EMAIL', 'fallback@example.com')).toBe(
      'fallback@example.com'
    )
  })
})
