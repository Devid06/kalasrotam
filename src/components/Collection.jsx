import { useMemo, useState } from 'react'
import { useContent } from '../lib/content.jsx'
import { rupees, waLink, generalMessage } from '../lib/whatsapp.js'
import { useSmoothScroll } from '../lib/hooks.js'
import { Reveal, ArtImage, WhatsAppIcon } from './ui.jsx'
import Lightbox from './Lightbox.jsx'

const STATUS_TAG = {
  sold: { label: 'Sold', cls: 'piece__tag--sold' },
  'made-to-order': { label: 'Made to order', cls: 'piece__tag--order' },
}

export default function Collection() {
  const { artworks, filters, collectionMeta } = useContent()
  const [filter, setFilter] = useState('all')
  const [openIndex, setOpenIndex] = useState(null)
  const scrollTo = useSmoothScroll()

  const shown = useMemo(
    () => (filter === 'all' ? artworks : artworks.filter((a) => a.category === filter)),
    [filter, artworks]
  )

  // The lightbox pages through the FILTERED list, so the arrows never jump to a
  // piece the visitor has just filtered out.
  const openAt = (i) => setOpenIndex(i)
  const close = () => setOpenIndex(null)
  const step = (dir) => setOpenIndex((i) => (i === null ? null : (i + dir + shown.length) % shown.length))

  return (
    <section className="band collection" id="collection" aria-labelledby="collection-title">
      <div className="shell">
        <div className="collection__head">
          <Reveal className="section-head" style={{ marginBottom: 0 }}>
            <p className="kicker kicker--night">{collectionMeta.kicker}</p>
            <h2 className="section-title" id="collection-title">
              {collectionMeta.headline}
            </h2>
            <p className="section-lede">{collectionMeta.body}</p>
          </Reveal>

          <Reveal delay={100}>
            <div className="filters" role="group" aria-label="Filter the collection">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="filter"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Announced politely so screen-reader users hear the count change
            when they press a filter. */}
        <p className="sr-only" role="status">
          Showing {shown.length} {shown.length === 1 ? 'piece' : 'pieces'}.
        </p>

        {shown.length === 0 ? (
          <p className="gallery__empty">Nothing in this category right now — but it can be commissioned.</p>
        ) : (
          <div className="gallery">
            {shown.map((art, i) => {
              const tag = STATUS_TAG[art.status]
              return (
                <button
                  type="button"
                  // Keying on filter + id restarts the entrance animation when
                  // the set changes, so a new selection reads as new content.
                  key={`${filter}-${art.id}`}
                  className={`piece ${art.tall ? 'piece--tall' : ''}`}
                  style={{ '--i': i }}
                  onClick={() => openAt(i)}
                  aria-haspopup="dialog"
                >
                  <span className="frame piece__frame">
                    {tag && <span className={`piece__tag ${tag.cls}`}>{tag.label}</span>}
                    <ArtImage
                      src={art.image}
                      seed={art.seed}
                      variant={art.variant}
                      w={900}
                      h={art.tall ? 1200 : 1125}
                      alt={`${art.title} — ${art.medium}`}
                    />
                    <span className="piece__veil" aria-hidden="true">
                      <span className="piece__view">View</span>
                    </span>
                  </span>

                  <span className="piece__label">
                    <span className="wall-label">
                      <span className="wall-label__title">{art.title}</span>
                      <span className="wall-label__meta">
                        {art.size} · {art.year}
                      </span>
                    </span>
                    <span className={`piece__price ${art.status === 'sold' ? 'piece__price--sold' : ''}`}>
                      {rupees(art.price)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="collection__foot">
          <p>
            Do not see the one you want? Almost everything here started as a commission — tell me what you have in
            mind and I will make it for you.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="#commission"
              className="btn btn--night"
              onClick={(e) => {
                e.preventDefault()
                scrollTo('#commission')
              }}
            >
              Commission a piece
            </a>
            <a href={waLink(generalMessage())} target="_blank" rel="noopener noreferrer" className="btn btn--night-ghost">
              <WhatsAppIcon />
              Ask a question
            </a>
          </div>
        </div>
      </div>

      {openIndex !== null && (
        <Lightbox
          art={shown[openIndex]}
          index={openIndex}
          total={shown.length}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </section>
  )
}
