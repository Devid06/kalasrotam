/* ============================================================================
   CONTENT STORE
   ----------------------------------------------------------------------------
   The site reads all its text, prices and images from here rather than from
   src/data/site.js directly. Three layers, each overriding the one before:

     1. src/data/site.js   the built-in defaults — always present
     2. public/content.json  what you published from the admin panel
     3. localStorage draft   your unpublished edits, on your machine only

   That ordering is what makes the admin panel safe: a broken or missing
   content.json cannot take the site down, it just falls back to the defaults.
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as defaults from '../data/site.js'

export const DRAFT_KEY = 'kalasrotam.draft.v1'
const CONTENT_URL = './content.json'

/** The defaults, as one plain object. */
export function baseContent() {
  return structuredClone({ ...defaults })
}

/* ── Merging ──────────────────────────────────────────────────────────────────
   Objects merge key by key; arrays are replaced wholesale.

   Arrays are deliberately NOT merged element-wise. If they were, deleting the
   third artwork in the admin panel would silently resurrect it from the layer
   below — the edit would appear to work and then undo itself on reload. */

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function merge(base, override) {
  if (override === undefined) return base
  if (!isPlainObject(base) || !isPlainObject(override)) return structuredClone(override)

  const out = { ...base }
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key]) ? merge(base[key], value) : structuredClone(value)
  }
  return out
}

/* ── Loading ──────────────────────────────────────────────────────────────── */

/** Reads the published content.json. A missing file is normal, not an error. */
export async function loadPublished() {
  try {
    const res = await fetch(CONTENT_URL, { cache: 'no-cache' })
    if (!res.ok) return null
    const json = await res.json()
    return isPlainObject(json) ? json : null
  } catch {
    // No content.json yet, offline, or invalid JSON. Defaults still work.
    return null
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const json = JSON.parse(raw)
    return isPlainObject(json) ? json : null
  } catch {
    return null
  }
}

export function saveDraft(overrides) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(overrides))
    return true
  } catch {
    // Usually means the draft has outgrown the ~5MB localStorage budget,
    // which in practice means too many embedded images.
    return false
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* nothing to do */
  }
}

/**
 * Resolves all three layers. Called once before the app renders, so visitors
 * never see default content flash and get replaced.
 */
export async function resolveContent() {
  const published = await loadPublished()
  const draft = loadDraft()
  return {
    base: baseContent(),
    published: published || {},
    draft: draft || {},
  }
}

/* ── Non-React access ────────────────────────────────────────────────────────
   Plain modules (the WhatsApp link builder, for one) need the live contact
   details but cannot call a hook. The provider keeps this snapshot current. */

let snapshot = baseContent()
export function getContent() {
  return snapshot
}

/* ── Provider ─────────────────────────────────────────────────────────────── */

const ContentContext = createContext(null)

export function ContentProvider({ layers, children }) {
  const [published] = useState(layers.published)
  const [draft, setDraftState] = useState(layers.draft)

  const content = useMemo(() => merge(merge(layers.base, published), draft), [layers.base, published, draft])

  // Keep the non-React snapshot in step, synchronously with each render, so a
  // WhatsApp link built during this render never uses stale details.
  snapshot = content

  const hasDraft = useMemo(() => Object.keys(draft || {}).length > 0, [draft])

  /** Replaces the whole draft layer. */
  const setDraft = useCallback((next) => {
    setDraftState(next)
    if (Object.keys(next || {}).length === 0) clearDraft()
    else saveDraft(next)
  }, [])

  const discardDraft = useCallback(() => {
    setDraftState({})
    clearDraft()
  }, [])

  const value = useMemo(
    () => ({ content, draft, setDraft, discardDraft, hasDraft, published, base: layers.base }),
    [content, draft, setDraft, discardDraft, hasDraft, published, layers.base]
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

/** The merged content. This is what every section component reads. */
export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>')
  return ctx.content
}

/** Draft controls. Only the admin panel needs these. */
export function useContentAdmin() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContentAdmin must be used inside <ContentProvider>')
  return ctx
}

/* ── Draft editing helpers ────────────────────────────────────────────────── */

/**
 * Returns a new draft with `path` set to `value`.
 * Path is dot/index notation: 'hero.body', 'artworks.2.price'.
 *
 * Arrays are copied from the CURRENT merged content, not from the draft — the
 * draft may not contain that array yet, and writing one index into an empty
 * draft would otherwise produce a sparse array that wipes every sibling.
 */
export function setPath(draft, content, path, value) {
  const keys = path.split('.')
  const next = structuredClone(draft || {})

  let target = next
  let source = content

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    source = source?.[key]

    if (target[key] === undefined || target[key] === null) {
      target[key] = Array.isArray(source) ? structuredClone(source) : {}
    } else if (Array.isArray(source) && !Array.isArray(target[key])) {
      target[key] = structuredClone(source)
    }
    target = target[key]
  }

  target[keys[keys.length - 1]] = value
  return next
}

/** Replaces a whole array (used when adding, deleting or reordering items). */
export function setArray(draft, path, array) {
  const keys = path.split('.')
  const next = structuredClone(draft || {})
  let target = next
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isPlainObject(target[keys[i]])) target[keys[i]] = {}
    target = target[keys[i]]
  }
  target[keys[keys.length - 1]] = structuredClone(array)
  return next
}

/* ── Publishing ───────────────────────────────────────────────────────────── */

/**
 * The file to upload. Published and draft layers are flattened together, so
 * the download always represents the complete current state of the site.
 */
export function buildPublishPayload(published, draft) {
  return merge(published || {}, draft || {})
}

export function downloadContentJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'content.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Rough byte size, for the admin panel's weight warning. */
export function payloadSize(payload) {
  return new Blob([JSON.stringify(payload)]).size
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ── Draft badge ──────────────────────────────────────────────────────────────
   Shown only when unpublished edits exist. Without it, it is genuinely easy to
   edit for an hour, close the tab, and believe the live site changed. */

export function useDraftStatus() {
  const { hasDraft } = useContentAdmin()
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (!hasDraft) setDismissed(false)
  }, [hasDraft])
  return { visible: hasDraft && !dismissed, dismiss: () => setDismissed(true) }
}
