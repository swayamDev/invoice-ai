/**
 * Converts a user-selected image file into a resized, size-capped data URL
 * (a base64 "data:image/..." string), entirely client-side, no upload to
 * any server or storage bucket required.
 *
 * Why resize before encoding: a raw phone photo can be 5-10MB. Stored
 * as-is in a Postgres text column (via profiles.logo_url /
 * invoices.sender_logo_url), that bloats every row that references it.
 * Since a company logo is only ever rendered at a few dozen pixels
 * (avatar previews, the PDF header), downscaling to a small square and
 * re-encoding as JPEG keeps the result in the tens-of-KB range regardless
 * of the original file size.
 */

export const MAX_LOGO_UPLOAD_BYTES = 8 * 1024 * 1024 // 8MB raw file cap

export class LogoUploadError extends Error {}

export function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new LogoUploadError('Please choose an image file (PNG, JPG, WEBP, etc).')
  }
  if (file.size > MAX_LOGO_UPLOAD_BYTES) {
    throw new LogoUploadError('That image is larger than 8MB. Please choose a smaller file.')
  }
}

export function fileToResizedDataUrl(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<string> {
  const { maxDimension = 256, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new LogoUploadError('Could not read that file.'))

    reader.onload = () => {
      const img = new Image()

      img.onerror = () => reject(new LogoUploadError('Could not read that image.'))

      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new LogoUploadError('Your browser could not process that image.'))
          return
        }

        // Flatten transparency onto white first, PNG logos with
        // transparent backgrounds would otherwise turn black once
        // re-encoded as JPEG.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }

      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
