import { useRef, useState } from 'react'
import { ArtImage, CloseIcon } from '../ui.jsx'
import { fileToDataUrl, isEmbedded, dataUrlSize, ACCEPTED } from '../../lib/image.js'
import { formatBytes } from '../../lib/content.jsx'

/* ============================================================================
   ADMIN FIELD PRIMITIVES
   The building blocks every editor screen is assembled from.
   ========================================================================== */

export function AText({ label, value, onChange, hint, multiline, rows = 3, ...rest }) {
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <label className="af">
      <span className="af__label">{label}</span>
      <Tag
        className="af__input"
        value={value ?? ''}
        rows={multiline ? rows : undefined}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {hint && <span className="af__hint">{hint}</span>}
    </label>
  )
}

export function ANumber({ label, value, onChange, hint, prefix, ...rest }) {
  return (
    <label className="af">
      <span className="af__label">{label}</span>
      <span className="af__wrap">
        {prefix && <span className="af__prefix">{prefix}</span>}
        <input
          className="af__input"
          type="number"
          value={value ?? ''}
          // '' rather than 0 when cleared, so the field can actually be emptied
          // while typing instead of snapping back to zero on every keystroke.
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          {...rest}
        />
      </span>
      {hint && <span className="af__hint">{hint}</span>}
    </label>
  )
}

export function ASelect({ label, value, onChange, options, hint }) {
  return (
    <label className="af">
      <span className="af__label">{label}</span>
      <select className="af__input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      {hint && <span className="af__hint">{hint}</span>}
    </label>
  )
}

export function AToggle({ label, value, onChange, hint }) {
  return (
    <label className="af af--row">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="af__label">{label}</span>
        {hint && <span className="af__hint">{hint}</span>}
      </span>
    </label>
  )
}

/** A comma-free list editor — one item per line. */
export function AList({ label, value, onChange, hint, rows = 4 }) {
  return (
    <label className="af">
      <span className="af__label">{label}</span>
      <textarea
        className="af__input"
        rows={rows}
        value={(value || []).join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n').filter((l) => l.trim() !== ''))}
      />
      <span className="af__hint">{hint || 'One per line.'}</span>
    </label>
  )
}

/* ── Image field ─────────────────────────────────────────────────────────────
   Two ways to set a picture, because they suit different situations:

     • Choose a file — resized and embedded into content.json. One upload,
       nothing else to think about, but it adds weight to every page load.
     • Type a path — you put the file in public/images/ yourself and reference
       it. Keeps content.json tiny.

   Clearing the field restores the generated study, so nothing is ever broken. */

export function AImage({ label, value, onChange, seed, variant, hint }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { dataUrl } = await fileToDataUrl(file)
      onChange(dataUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      // Reset, so choosing the same file twice still fires a change event.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const embedded = isEmbedded(value)

  return (
    <div className="af">
      <span className="af__label">{label}</span>

      <div className="aimg">
        <div className="aimg__thumb">
          <ArtImage src={value} seed={seed} variant={variant} w={600} h={450} alt="" />
        </div>

        <div className="aimg__side">
          <button type="button" className="abtn abtn--sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Processing…' : value ? 'Replace' : 'Choose photo'}
          </button>
          {value && (
            <button type="button" className="abtn abtn--sm abtn--ghost" onClick={() => onChange(null)}>
              <CloseIcon size={12} />
              Remove
            </button>
          )}
          <span className="af__hint">
            {embedded
              ? `Embedded · ${formatBytes(dataUrlSize(value))}`
              : value
                ? 'Using a file path'
                : 'Showing a generated study'}
          </span>
        </div>
      </div>

      <input ref={inputRef} type="file" accept={ACCEPTED} onChange={pick} hidden />

      <input
        className="af__input af__input--path"
        value={embedded ? '' : value || ''}
        placeholder="…or type a path: ./images/my-art.jpg"
        onChange={(e) => onChange(e.target.value.trim() || null)}
        disabled={embedded}
      />

      {error && <span className="af__error">{error}</span>}
      {hint && <span className="af__hint">{hint}</span>}
    </div>
  )
}

/* ── Repeating list scaffolding ──────────────────────────────────────────── */

export function AItemCard({ title, subtitle, open, onToggle, onDelete, onMoveUp, onMoveDown, children }) {
  return (
    <div className={`acard ${open ? 'is-open' : ''}`}>
      <div className="acard__head">
        <button type="button" className="acard__toggle" onClick={onToggle} aria-expanded={open}>
          <span className="acard__chev" aria-hidden="true">
            ›
          </span>
          <span>
            <span className="acard__title">{title || 'Untitled'}</span>
            {subtitle && <span className="acard__sub">{subtitle}</span>}
          </span>
        </button>
        <div className="acard__tools">
          <button type="button" onClick={onMoveUp} aria-label="Move up" title="Move up">
            ↑
          </button>
          <button type="button" onClick={onMoveDown} aria-label="Move down" title="Move down">
            ↓
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete" title="Delete" className="acard__del">
            ×
          </button>
        </div>
      </div>
      {open && <div className="acard__body">{children}</div>}
    </div>
  )
}

/** Immutable array helpers, shared by every list editor. */
export const arrayOps = {
  update: (arr, i, patch) => arr.map((item, idx) => (idx === i ? { ...item, ...patch } : item)),
  remove: (arr, i) => arr.filter((_, idx) => idx !== i),
  move: (arr, i, delta) => {
    const j = i + delta
    if (j < 0 || j >= arr.length) return arr
    const next = [...arr]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  },
  add: (arr, item) => [...arr, item],
}
