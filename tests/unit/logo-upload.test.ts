import { describe, it, expect } from 'vitest'
import { validateImageFile, LogoUploadError, MAX_LOGO_UPLOAD_BYTES } from '@/lib/logo-upload'

function makeFile(type: string, sizeBytes: number): File {
  // A real Blob of this exact size, without allocating sizeBytes of
  // memory for content we never read, content is irrelevant here, only
  // `type` and `size` matter to validateImageFile.
  const blob = new Blob([new Uint8Array(sizeBytes)], { type })
  return new File([blob], 'logo', { type })
}

describe('validateImageFile', () => {
  it('accepts a normal image file', () => {
    expect(() => validateImageFile(makeFile('image/png', 1024))).not.toThrow()
  })

  it('rejects a non-image file', () => {
    expect(() => validateImageFile(makeFile('application/pdf', 1024))).toThrow(LogoUploadError)
  })

  it('rejects a file over the size cap', () => {
    expect(() => validateImageFile(makeFile('image/png', MAX_LOGO_UPLOAD_BYTES + 1))).toThrow(
      LogoUploadError
    )
  })

  it('accepts a file exactly at the size cap', () => {
    expect(() => validateImageFile(makeFile('image/png', MAX_LOGO_UPLOAD_BYTES))).not.toThrow()
  })

  it('gives a human-readable message for a rejected type', () => {
    try {
      validateImageFile(makeFile('text/plain', 100))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(LogoUploadError)
      expect((err as Error).message).toMatch(/image file/i)
    }
  })

  it('gives a human-readable message for an oversized file', () => {
    try {
      validateImageFile(makeFile('image/jpeg', MAX_LOGO_UPLOAD_BYTES + 1))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(LogoUploadError)
      expect((err as Error).message).toMatch(/8MB/i)
    }
  })
})
