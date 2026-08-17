import { useMemo, useState } from 'react'
import { artStudy } from '../lib/placeholder.js'
import { useInView } from '../lib/hooks.js'

/* ── ArtImage ────────────────────────────────────────────────────────────────
   The single place that decides between a real photograph and a generated
   study. Every artwork on the site goes through here, so adding real images is
   only ever a data change. */

export function ArtImage({ src, seed, variant = 'graphite', alt, w = 900, h = 1200, className = '', eager = false }) {
  const study = useMemo(() => (src ? null : artStudy(seed, variant, w, h)), [src, seed, variant, w, h])
  return (
    <img
      src={src || study}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
    />
  )
}

/* ── Reveal ──────────────────────────────────────────────────────────────────
   Fades content up the first time it enters the viewport. `as` keeps the
   markup semantic — a reveal wrapper should never force a <div> where a <li>
   or <section> belongs. */

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const [ref, inView] = useInView()
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ── Stars ───────────────────────────────────────────────────────────────── */

export function Stars({ rating = 5 }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"
            fill={i <= rating ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity={i <= rating ? 1 : 0.35}
          />
        </svg>
      ))}
    </span>
  )
}

/* ── Icons ───────────────────────────────────────────────────────────────── */

export function WhatsAppIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 015.83 2.42 8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.9 2.4 1.02 2.56c.12.17 1.75 2.67 4.24 3.75.59.25 1.05.4 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  )
}

/* ── Studio mark ──────────────────────────────────────────────────────────────
   Uses the real logo when one is set, and falls back to a drawn mark otherwise
   — including when the file is missing or fails to load. The fallback matters:
   a broken image icon in the header is far worse than a simple drawn one, and
   this way the site is never in a broken state while a logo is being swapped. */

export function StudioMark({ src, size = 38, alt = '' }) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <img
        className="brand__logo"
        src={src}
        alt={alt}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        draggable="false"
      />
    )
  }

  return (
    <svg className="brand__mark" viewBox="0 0 34 34" fill="none" aria-hidden="true" style={{ width: size, height: size }}>
      <path
        className="brand__stroke"
        d="M6 27c0-8 6-9.5 10-12.5S21 8 19.5 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle className="brand__drop" cx="24.5" cy="23.5" r="4" fill="var(--brass)" />
    </svg>
  )
}

export function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function ArrowIcon({ dir = 'right', size = 15 }) {
  const rot = { right: 0, left: 180, up: -90, down: 90 }[dir] ?? 0
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5l5.5 5.5L20 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Field ───────────────────────────────────────────────────────────────────
   One component for every input on the site so validation, error wiring and
   the aria-describedby link are never re-implemented by hand. */

export function Field({ label, name, error, required, hint, children, as = 'input', ...rest }) {
  const id = `f-${name}`
  const errId = `${id}-err`
  const Tag = as

  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label} {required && <span className="field__req" aria-hidden="true">*</span>}
      </label>
      <Tag
        id={id}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errId : undefined}
        required={required}
        {...rest}
      >
        {children}
      </Tag>
      <span className="field__error" id={errId} role={error ? 'alert' : undefined}>
        {error || hint || ''}
      </span>
    </div>
  )
}
