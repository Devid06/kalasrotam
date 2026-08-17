import { useContent } from '../lib/content.jsx'
import { useSmoothScroll } from '../lib/hooks.js'
import InkFlow from './InkFlow.jsx'
import { ArtImage, ArrowIcon } from './ui.jsx'

/* ============================================================================
   HERO
   ----------------------------------------------------------------------------
   A full-bleed artwork with the words laid over it.

   Text over a photograph is the easiest way to make something unreadable, so
   contrast is handled in layers rather than left to chance:
     • a scrim whose strength is editable per-artwork (hero.scrim), because a
       pale watercolour needs far more darkening than a charcoal portrait
     • a second gradient anchored to the text side only
     • the ink current on top in its light-on-dark tone, so the studio's motif
       survives the change of ground
   ========================================================================== */

export default function Hero() {
  const { hero } = useContent()
  const scrollTo = useSmoothScroll()

  const go = (e, href) => {
    e.preventDefault()
    scrollTo(href)
  }

  const bg = hero.background || {}
  const f = hero.featured || {}
  const scrim = typeof hero.scrim === 'number' ? hero.scrim : 62

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <ArtImage
          src={bg.image}
          seed={bg.seed || 'hero-field'}
          variant={bg.variant || 'graphite'}
          w={1800}
          h={1200}
          eager
          alt=""
          className="hero__bg-img"
        />
        {/* Scrim strength is content, not style — a pale piece needs more. */}
        <span className="hero__scrim" style={{ '--scrim': scrim / 100 }} />
        <span className="hero__scrim-side" />
      </div>

      <InkFlow tone="night" />

      <div className="shell hero__inner">
        <div className="hero__copy">
          <p className="kicker kicker--night hero__eyebrow">{hero.eyebrow}</p>

          <h1 className="display hero__title" id="hero-title">
            {hero.headline.map((line, i) => (
              <span className="hero__line" key={line}>
                <span style={{ '--i': i }}>
                  {/* The last word carries the idea, so it gets the italic. */}
                  {i === hero.headline.length - 1 ? <em>{line}</em> : line}
                </span>
              </span>
            ))}
          </h1>

          {hero.emotional && <p className="hero__emotional">{hero.emotional}</p>}

          <p className="hero__body">{hero.body}</p>

          <div className="hero__actions">
            <a href={hero.primary.href} className="btn btn--night" onClick={(e) => go(e, hero.primary.href)}>
              {hero.primary.label}
              <ArrowIcon />
            </a>
            <a
              href={hero.secondary.href}
              className="btn btn--night-ghost"
              onClick={(e) => go(e, hero.secondary.href)}
            >
              {hero.secondary.label}
            </a>
          </div>

          <dl className="hero__stats">
            {hero.stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd style={{ margin: 0 }}>
                  <span className="hero__stat-v">{s.value}</span>
                  <span className="hero__stat-l">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* The wall label names the piece behind the words, so the background
          reads as a specific artwork rather than as decoration. */}
      {f.title && (
        <figcaption className="wall-label hero__wall-label">
          <span className="wall-label__title">{f.title}</span>
          <span className="wall-label__meta">{f.medium}</span>
          <span className="wall-label__meta">
            {f.size}
            {f.year ? ` · ${f.year}` : ''}
          </span>
        </figcaption>
      )}

      <span className="hero__cue" aria-hidden="true">
        Scroll
      </span>
    </section>
  )
}

/* ── Ribbon ──────────────────────────────────────────────────────────────────
   The marquee is duplicated once and translated by exactly -100% of a single
   copy, which is what makes the loop seamless rather than snapping. */

export function Ribbon() {
  const { ribbon } = useContent()

  const track = (
    <div className="ribbon__track" aria-hidden="true">
      {ribbon.map((w) => (
        <span key={w} style={{ display: 'contents' }}>
          <span className="ribbon__word">{w}</span>
          <span className="ribbon__dot" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="ribbon">
      <span className="sr-only">Mediums: {ribbon.join(', ')}.</span>
      {track}
      {track}
    </div>
  )
}
