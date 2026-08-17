import { useState } from 'react'
import { useContent } from '../lib/content.jsx'
import { useSmoothScroll } from '../lib/hooks.js'
import { Reveal, ArtImage, ArrowIcon } from './ui.jsx'

/* An editorial index rather than a row of four identical cards. On wide screens
   the preview on the right swaps as you move through the list; on narrow
   screens each row carries its own image, so nothing depends on hover. */

export default function Practice() {
  const { practice } = useContent()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollTo = useSmoothScroll()
  const active = practice.items[activeIndex]

  return (
    <section className="band" id="practice" aria-labelledby="practice-title">
      <div className="shell">
        <Reveal className="section-head">
          <p className="kicker">{practice.kicker}</p>
          <h2 className="section-title" id="practice-title">
            {practice.headline}
          </h2>
          <p className="section-lede">{practice.body}</p>
        </Reveal>

        <div className="practice__layout">
          <div className="practice__index">
            {practice.items.map((item, i) => (
              <Reveal
                as="article"
                className="practice__row"
                key={item.id}
                delay={i * 70}
                onMouseEnter={() => setActiveIndex(i)}
                onFocusCapture={() => setActiveIndex(i)}
              >
                <span className="practice__n" aria-hidden="true">
                  {item.n}
                </span>

                <h3 className="practice__title">
                  {item.title}
                  <span className="practice__lede">{item.lede}</span>
                </h3>

                <div className="practice__detail">
                  <p className="practice__desc">{item.body}</p>
                  <ul className="practice__tags">
                    {item.meta.map((m) => (
                      <li className="tag" key={m}>
                        {m}
                      </li>
                    ))}
                  </ul>
                  <p className="practice__from">
                    From <b>{item.from}</b> ·{' '}
                    <a
                      href="#commission"
                      className="link-draw"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollTo('#commission')
                      }}
                    >
                      Enquire about {item.title.toLowerCase()}
                    </a>
                  </p>
                </div>

                <div className="frame practice__inline-art">
                  <ArtImage src={item.image} seed={item.seed} variant={item.variant} w={900} h={600} alt={item.title} />
                </div>
              </Reveal>
            ))}
          </div>

          {/* Desktop preview. All four images stay mounted and cross-fade by
              opacity, so switching never shows a loading gap. */}
          <div className="practice__preview-wrap" aria-hidden="true">
            <div className="frame practice__preview">
              {practice.items.map((item, i) => (
                <ArtImage
                  key={item.id}
                  src={item.image}
                  seed={item.seed}
                  variant={item.variant}
                  w={900}
                  h={1125}
                  alt=""
                  className={i === activeIndex ? 'is-shown' : ''}
                />
              ))}
            </div>
            <div className="wall-label practice__preview-label">
              <span className="wall-label__title">{active.title}</span>
              <span className="wall-label__meta">{active.lede}</span>
              <span className="wall-label__meta">From {active.from}</span>
            </div>
          </div>
        </div>

        <Reveal style={{ marginTop: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
          <a
            href="#collection"
            className="btn btn--ghost"
            onClick={(e) => {
              e.preventDefault()
              scrollTo('#collection')
            }}
          >
            See what is available now
            <ArrowIcon />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
