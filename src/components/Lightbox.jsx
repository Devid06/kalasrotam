import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useBodyLock, useEscape } from '../lib/hooks.js'
import { rupees, waLink, buyMessage } from '../lib/whatsapp.js'
import { ArtImage, ArrowIcon, CloseIcon, WhatsAppIcon } from './ui.jsx'

const STATUS_LABEL = {
  available: 'Available',
  sold: 'Sold',
  'made-to-order': 'Made to order',
}

export default function Lightbox({ art, index, total, onClose, onPrev, onNext }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  useBodyLock(true)
  useEscape(true, onClose)

  // Focus the close button on open, and give focus back to whatever opened the
  // lightbox when it closes — otherwise keyboard users land at the page top.
  useEffect(() => {
    const opener = document.activeElement
    closeRef.current?.focus()
    return () => {
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true })
    }
  }, [])

  // Arrow keys page through the collection, and Tab is trapped inside the
  // dialog so focus cannot wander onto the page behind it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        onPrev()
        return
      }
      if (e.key === 'ArrowRight') {
        onNext()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext])

  const sold = art.status === 'sold'

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lb-title"
      onMouseDown={(e) => {
        // Only close on a click that both starts and ends on the backdrop, so
        // dragging to select text inside the panel does not dismiss it.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="lightbox__panel" ref={panelRef}>
        <button type="button" className="lightbox__close" onClick={onClose} ref={closeRef} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="lightbox__art">
          <ArtImage
            src={art.image}
            seed={art.seed}
            variant={art.variant}
            w={1000}
            h={1250}
            eager
            alt={`${art.title} — ${art.medium}, ${art.size}`}
          />
        </div>

        <div className="lightbox__info">
          <div>
            <p className="kicker">{STATUS_LABEL[art.status] || 'Available'}</p>
            <h2 className="lightbox__title" id="lb-title">
              {art.title}
            </h2>
          </div>

          <dl className="lightbox__specs">
            <div className="spec">
              <dt>Medium</dt>
              <dd>{art.medium}</dd>
            </div>
            <div className="spec">
              <dt>Size</dt>
              <dd>{art.size}</dd>
            </div>
            <div className="spec">
              <dt>Year</dt>
              <dd>{art.year}</dd>
            </div>
          </dl>

          <p className="lightbox__price">{rupees(art.price)}</p>
          <p className="lightbox__note">{art.note}</p>

          <div className="lightbox__actions">
            {sold ? (
              <a
                href={waLink(
                  `Hello Kalasrotam 👋\n\nI saw "${art.title}" on your website. I know it is sold — could you make something similar for me?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--wa btn--block"
              >
                <WhatsAppIcon />
                Ask for something similar
              </a>
            ) : (
              <a
                href={waLink(buyMessage(art))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--wa btn--block"
              >
                <WhatsAppIcon />
                Buy on WhatsApp
              </a>
            )}
            <p className="lightbox__note">
              Buying happens over a conversation, not a checkout — ask anything you like about the piece, shipping or
              framing before you pay.
            </p>
          </div>

          <div className="lightbox__nav">
            <span className="lightbox__count" aria-hidden="true">
              {index + 1} / {total}
            </span>
            <button type="button" className="lightbox__arrow" onClick={onPrev} aria-label="Previous piece">
              <ArrowIcon dir="left" />
            </button>
            <button type="button" className="lightbox__arrow" onClick={onNext} aria-label="Next piece">
              <ArrowIcon dir="right" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
