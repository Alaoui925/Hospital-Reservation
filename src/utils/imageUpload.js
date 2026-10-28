/**
 * Client-side avatar processing.
 *
 * Files are validated, square-cropped and downscaled to a small JPEG data URL
 * so the mock persistence layer (localStorage) stays comfortably small.
 * When a real backend exists, swap this to a multipart upload instead.
 */

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const OUTPUT_SIZE = 320

/** Read, validate and downscale an image file to a data-URL avatar. */
export function readImageAsAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'))
    if (!ACCEPTED.includes(file.type)) {
      return reject(new Error('Please choose a JPG, PNG or WebP image.'))
    }
    if (file.size > MAX_BYTES) {
      return reject(new Error('Images must be smaller than 5 MB.'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('The image could not be read. Please try again.'))
    reader.onload = () => {
      try {
        const image = new Image()
        image.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = OUTPUT_SIZE
            canvas.height = OUTPUT_SIZE
            const context = canvas.getContext('2d')
            if (!context) return reject(new Error('Image processing is not supported in this browser.'))

            // Cover-crop: centre the source on its shorter side.
            const sourceSize = Math.min(image.width, image.height)
            const offsetX = (image.width - sourceSize) / 2
            const offsetY = (image.height - sourceSize) / 2
            context.drawImage(
              image,
              offsetX,
              offsetY,
              sourceSize,
              sourceSize,
              0,
              0,
              OUTPUT_SIZE,
              OUTPUT_SIZE,
            )
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Image processing failed.'))
          }
        }
        image.onerror = () => reject(new Error('This file is not a valid image.'))
        image.src = String(reader.result)
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Image processing failed.'))
      }
    }
    reader.readAsDataURL(file)
    return undefined
  })
}
