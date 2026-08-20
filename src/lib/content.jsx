/* ============================================================================
   CONTENT STORE
   ----------------------------------------------------------------------------
   Where the site's words, prices and images come from, in order of authority:

     1. src/data/site.js    built-in defaults — always present, never fails
     2. public/content.json a published snapshot, if one exists
     3. Supabase            the live database — the real source of truth
     4. localStorage draft  the editor's unsaved changes, on their machine only

   Layers 1 and 2 are the safety net. If Supabase is unreachable, misconfigured
   or slow, the site still renders — with slightly older content instead of an
   error page. A gallery showing last week's prices beats a blank screen.

   Layer 4 is why editing is safe. Changes are previewed locally and only reach
   the database when Publish is pressed, so a half-typed headline never appears
   in front of a visitor.
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as defaults from '../data/site.js'
import {
  isConfigured,
  loadClient,
  restUrl,
  restHeaders,
  CONTENT_TABLE,
  CONTENT_ROW_ID,
} from './supabase.js'

export const DRAFT_KEY = 'kalasrotam.draft.v1'
const CONTENT_URL = './content.json'

/* How long to wait for the database before falling back. A visitor on poor
   mobile data should see the site, not a spinner that never resolves. */
const FETCH_TIMEOUT_MS = 4000

/** The defaults, as one plain object. */
export function baseContent() {
  return structuredClone({ ...defaults })
}

/* ── Merging ──────────────────────────────────────────────────────────────────
   Objects merge key by key; arrays are replaced wholesale.

   Arrays are deliberately NOT merged element-wise. If they were, deleting the
   third artwork would silently resurrect it from the layer below — the edit
   would appear to work and then undo itself on the next load. */

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

/** Rejects rather than hangs, so one slow service cannot stall the whole page. */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out')), ms)),
  ])
}

/** Reads the published snapshot. A missing file is normal, not an error. */
export async function loadPublished() {
  try {
    const res = await withTimeout(fetch(CONTENT_URL, { cache: 'no-cache' }), FETCH_TIMEOUT_MS, 'content.json')
    if (!res.ok) return null
    const json = await res.json()
    return isPlainObject(json) ? json : null
  } catch {
    return null
  }
}

/**
 * Reads the live row from the database.
 *
 * Plain fetch rather than the client library: this runs on every visit, and
 * pulling in the whole SDK to read one row would cost every visitor about 60KB
 * gzipped for something they never interact with.
 */
export async function loadRemote() {
  if (!isConfigured) return null
  try {
    const url =
      restUrl(CONTENT_TABLE) + '?select=data&id=eq.' + CONTENT_ROW_ID
    const res = await withTimeout(
      fetch(url, {
        headers: restHeaders({ Accept: 'application/vnd.pgrst.object+json' }),
        cache: 'no-store',
      }),
      FETCH_TIMEOUT_MS,
      'Supabase'
    )
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const row = await res.json()
    return isPlainObject(row?.data) ? row.data : null
  } catch (err) {
    // Never let a backend problem take the site down — fall through to the
    // published snapshot and the built-in defaults.
    console.warn('[kalasrotam] Live content unavailable, using fallback.', err?.message || err)
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
 * Resolves every layer. Called once before the app renders, so visitors never
 * see default content flash and then get replaced.
 */
export async function resolveContent() {
  // Both fetches start together. The database is the source of truth, but
  // waiting for it serially behind content.json would double the delay.
  const [published, remote] = await Promise.all([loadPublished(), loadRemote()])
  return {
    base: baseContent(),
    published: published || {},
    remote: remote || {},
    draft: loadDraft() || {},
    liveContentAvailable: remote !== null,
  }
}

/* ── Non-React access ────────────────────────────────────────────────────────
   Plain modules (the WhatsApp link builder) need the live contact details but
   cannot call a hook. The provider keeps this snapshot current. */

let snapshot = baseContent()
export function getContent() {
  return snapshot
}

/* ── Provider ─────────────────────────────────────────────────────────────── */

const ContentContext = createContext(null)

export function ContentProvider({ layers, children }) {
  const [published] = useState(layers.published)
  // Turned on by the admin panel; ordinary visitors never open a socket.
  const [liveUpdates, setLiveUpdates] = useState(false)
  const [remote, setRemote] = useState(layers.remote)
  const [draft, setDraftState] = useState(layers.draft)

  const content = useMemo(
    () => merge(merge(merge(layers.base, published), remote), draft),
    [layers.base, published, remote, draft]
  )

  // Kept in step synchronously with each render, so a WhatsApp link built
  // during this render never uses stale details.
  snapshot = content

  const hasDraft = useMemo(() => Object.keys(draft || {}).length > 0, [draft])

  /* ── Live updates ────────────────────────────────────────────────────
     Subscribes only when the editor is open, which is the only place the client
     library is loaded. Divyansh can then edit on his laptop and watch his phone
     update beside it.

     Ordinary visitors do not hold a socket open. They get fresh content on
     every page load, which is what actually matters, without the cost of a
     persistent connection on a mobile network. */
  useEffect(() => {
    if (!isConfigured || !liveUpdates) return

    let channel = null
    let cancelled = false

    loadClient().then((client) => {
      if (!client || cancelled) return
      channel = client
        .channel('site_content_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: CONTENT_TABLE,
            filter: 'id=eq.' + CONTENT_ROW_ID,
          },
          (payload) => {
            const next = payload?.new?.data
            if (isPlainObject(next)) setRemote(next)
          }
        )
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) loadClient().then((c) => c?.removeChannel(channel))
    }
  }, [liveUpdates])

  const setDraft = useCallback((next) => {
    setDraftState(next)
    if (Object.keys(next || {}).length === 0) clearDraft()
    else saveDraft(next)
  }, [])

  const discardDraft = useCallback(() => {
    setDraftState({})
    clearDraft()
  }, [])

  /**
   * Writes the current state to the database. This is what publishing means
   * now — one call, live everywhere in about a second, no files to move.
   *
   * The draft is folded into the remote layer and then cleared, so the editor
   * ends up in a clean state showing exactly what visitors see.
   */
  const publish = useCallback(async () => {
    if (!isConfigured) throw new Error('Not connected to Supabase')

    const client = await loadClient()
    if (!client) throw new Error('Could not load the editor connection')

    const payload = merge(merge(published, remote), draft)
    const { error } = await client
      .from(CONTENT_TABLE)
      .update({ data: payload })
      .eq('id', CONTENT_ROW_ID)

    if (error) throw error

    setRemote(payload)
    setDraftState({})
    clearDraft()
    return payload
  }, [published, remote, draft])

  const value = useMemo(
    () => ({
      content,
      draft,
      remote,
      published,
      base: layers.base,
      setDraft,
      discardDraft,
      publish,
      hasDraft,
      enableLiveUpdates: setLiveUpdates,
      liveContentAvailable: layers.liveContentAvailable,
    }),
    [
      content,
      draft,
      remote,
      published,
      layers.base,
      layers.liveContentAvailable,
      setDraft,
      discardDraft,
      publish,
      hasDraft,
    ]
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

/** The merged content. This is what every section component reads. */
export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>')
  return ctx.content
}

/** Draft controls and publishing. Only the admin panel needs these. */
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

/* ── Backup export ────────────────────────────────────────────────────────────
   Publishing no longer needs a file, but being able to take a copy of
   everything still matters — it is the difference between a bad afternoon and
   a lost website. */

export function buildPublishPayload(published, remote, draft) {
  return merge(merge(published || {}, remote || {}), draft || {})
}

export function downloadContentJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kalasrotam-backup-' + new Date().toISOString().slice(0, 10) + '.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function payloadSize(payload) {
  return new Blob([JSON.stringify(payload)]).size
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/* ── Draft badge ──────────────────────────────────────────────────────────── */

export function useDraftStatus() {
  const { hasDraft } = useContentAdmin()
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (!hasDraft) setDismissed(false)
  }, [hasDraft])
  return { visible: hasDraft && !dismissed, dismiss: () => setDismissed(true) }
}
