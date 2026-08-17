/* ============================================================================
   IMAGE HANDLING FOR THE ADMIN PANEL
   ----------------------------------------------------------------------------
   When you pick a photo in the admin panel it gets downscaled and embedded
   straight into content.json, so there is no separate upload step — one file
   to upload, and the picture is in it.

   The catch is weight: content.json downloads on every single visit, so an
   un-resized 6MB phone photo would make the site painful on mobile data. Every
   image is therefore capped at MAX_EDGE and re-encoded as JPEG before it is
   stored, and the admin panel shows a running total with a warning.

   If you would rather keep content.json tiny, put the files in public/images/
   yourself and type the path (./images/name.jpg) into the image field instead.
   ========================================================================== */

const MAX_EDGE = 1400 // px on the long edge — plenty for a full-bleed hero
const QUALITY = 0.78

export const ACCEPTED = 'image/jpeg,image/png,image/webp'

/**
 * Reads a File, downscales it, and returns a JPEG data URL.
 * Rejects with a readable message — these surface directly in the panel.
 */
export function fileToDataUrl(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file chosen'))
    if (!file.type.startsWith('image/')) return reject(new Error('That is not an image file'))

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That image could not be opened — try re-saving it as a JPEG'))
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')

        // Photographs of artwork are the whole point here, so quality matters
        // more than the few milliseconds this costs.
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        // JPEG has no alpha; without a white ground, transparent PNGs come out
        // with black edges.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)

        try {
          resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), width: w, height: h })
        } catch {
          reject(new Error('That image could not be processed'))
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/** True for admin-embedded images, as opposed to a ./images/... path. */
export function isEmbedded(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

/** Approximate decoded byte size of a data URL. */
export function dataUrlSize(value) {
  if (!isEmbedded(value)) return 0
  const base64 = value.slice(value.indexOf(',') + 1)
  return Math.round((base64.length * 3) / 4)
}
