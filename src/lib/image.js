/* ============================================================================
   IMAGE HANDLING FOR THE ADMIN PANEL
   ----------------------------------------------------------------------------
   Pick a photo in the admin panel and it is resized in the browser, uploaded to
   Supabase Storage, and the resulting URL is stored in the content. The file
   never touches the code and never bloats content.json.

   Resizing happens BEFORE upload, on purpose. A 6MB phone photo would be slow
   to upload on Indian mobile data, would eat the free storage quota, and would
   be far larger than any slot on the page needs. Capping the long edge is the
   single biggest thing keeping the site quick.

   If Supabase is not configured, it falls back to embedding the image directly
   in the content as a data URL — the old behaviour — so the panel still works
   before the backend is set up.
   ========================================================================== */

import { isConfigured, loadClient, BUCKET } from './supabase.js'

const MAX_EDGE = 1600 // plenty for a full-bleed hero on a large screen
const QUALITY = 0.82

export const ACCEPTED = 'image/jpeg,image/png,image/webp'

/* ── Resizing ─────────────────────────────────────────────────────────────── */

/**
 * Reads a File, downscales it, and returns a Blob plus a preview URL.
 * Rejects with a readable message — these surface directly in the panel.
 */
export function resizeImage(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
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

        // Photographs of artwork are the whole point, so quality matters more
        // than the few milliseconds this costs.
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Transparent PNGs need a white ground before JPEG encoding, or the
        // transparent areas come out black.
        const hasAlpha = file.type === 'image/png' || file.type === 'image/webp'
        if (!hasAlpha) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, w, h)
        }
        ctx.drawImage(img, 0, 0, w, h)

        // Keep alpha where the original had it (logos), otherwise JPEG is far
        // smaller for photographs.
        const type = hasAlpha ? 'image/png' : 'image/jpeg'

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('That image could not be processed'))
            resolve({ blob, type, width: w, height: h, dataUrl: canvas.toDataURL(type, quality) })
          },
          type,
          quality
        )
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/* ── Upload ───────────────────────────────────────────────────────────────── */

/** A filename that cannot collide and cannot break a URL. */
function safeName(file, type) {
  const ext = type === 'image/png' ? 'png' : 'jpg'
  const stem = (file.name || 'image')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image'
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 7)
  return stem + '-' + stamp + rand + '.' + ext
}

/**
 * Resize, upload, and return a public URL.
 *
 * @param {File} file
 * @param {(pct:number)=>void} [onProgress]  0–100, coarse
 * @returns {Promise<{url:string, embedded:boolean, bytes:number}>}
 */
export async function uploadImage(file, onProgress) {
  onProgress?.(10)
  const { blob, type, dataUrl } = await resizeImage(file)
  onProgress?.(45)

  // No backend yet — embed it, exactly as the panel used to.
  if (!isConfigured) {
    onProgress?.(100)
    return { url: dataUrl, embedded: true, bytes: blob.size }
  }

  const client = await loadClient()
  if (!client) {
    onProgress?.(100)
    return { url: dataUrl, embedded: true, bytes: blob.size }
  }

  const path = safeName(file, type)
  const { error } = await client.storage.from(BUCKET).upload(path, blob, {
    contentType: type,
    cacheControl: '31536000', // a year; filenames are unique so this is safe
    upsert: false,
  })

  if (error) {
    throw new Error('Upload failed: ' + (error.message || 'unknown error'))
  }

  onProgress?.(90)
  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  onProgress?.(100)

  if (!data?.publicUrl) throw new Error('Uploaded, but no public URL came back')
  return { url: data.publicUrl, embedded: false, bytes: blob.size }
}

/** Removes a previously uploaded file. Only touches files in our own bucket. */
export async function deleteImage(url) {
  if (!isConfigured || !isUploaded(url)) return
  const client = await loadClient()
  if (!client) return
  const marker = '/' + BUCKET + '/'
  const path = url.slice(url.indexOf(marker) + marker.length).split('?')[0]
  if (!path) return
  await client.storage.from(BUCKET).remove([decodeURIComponent(path)])
}

/* ── Classification, for the panel's status line ──────────────────────────── */

/** Embedded directly in the content as base64. */
export function isEmbedded(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

/** Living in our Supabase storage bucket. */
export function isUploaded(value) {
  return typeof value === 'string' && value.includes('/' + BUCKET + '/') && value.startsWith('http')
}

/** Approximate decoded byte size of a data URL. */
export function dataUrlSize(value) {
  if (!isEmbedded(value)) return 0
  const base64 = value.slice(value.indexOf(',') + 1)
  return Math.round((base64.length * 3) / 4)
}
