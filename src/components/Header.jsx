import { useEffect, useMemo, useRef, useState } from 'react'
import { useContent } from '../lib/content.jsx'
import { useScrolled, useScrollSpy, useBodyLock, useEscape, useSmoothScroll } from '../lib/hooks.js'
import { ArrowIcon } from './ui.jsx'

/* The studio mark: a stroke that flows and settles into a drop. Drawn rather
   than imported so it inherits colour and never loads as a separate request. */
function Mark() {
  return (
    <svg className="brand__mark" viewBox="0 0 34 34" fill="none" aria-hidden="true">
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

export default function Header() {
  const { studio, nav, socials, contact } = useContent()
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled(40)
  // Memoised because useScrollSpy takes this array as a dependency — a fresh
  // array each render would tear down and rebuild its scroll listener forever.
  const sectionIds = useMemo(() => nav.map((n) => n.href.slice(1)), [nav])
  const active = useScrollSpy(sectionIds)
  const scrollTo = useSmoothScroll()
  const burgerRef = useRef(null)

  useBodyLock(open)
  useEscape(open, () => setOpen(false))

  // Returning focus to the toggle is what makes the menu usable by keyboard —
  // without it, closing drops you back at the top of the document.
  useEffect(() => {
    if (!open) burgerRef.current?.blur()
  }, [open])

  const go = (e, href) => {
    e.preventDefault()
    setOpen(false)
    // Wait for the menu's clip-path to finish before scrolling, otherwise the
    // browser scrolls behind a still-visible overlay.
    setTimeout(() => scrollTo(href), open ? 320 : 0)
  }

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-menu-open' : ''}`}>
        <div className="shell header__inner">
          <a className="brand" href="#top" onClick={(e) => go(e, '#top')} aria-label={`${studio.name} — home`}>
            <Mark />
            <span className="brand__text">
              <span className="brand__name">{studio.name}</span>
              <span className="brand__deva deva">{studio.nameDevanagari}</span>
            </span>
          </a>

          <nav className="nav" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav__link ${active === item.href.slice(1) ? 'is-active' : ''}`}
                aria-current={active === item.href.slice(1) ? 'true' : undefined}
                onClick={(e) => go(e, item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a href="#commission" className="btn btn--sm header__cta" onClick={(e) => go(e, '#commission')}>
            Enquire
            <ArrowIcon />
          </a>

          <button
            ref={burgerRef}
            type="button"
            className={`burger ${open ? 'is-open' : ''}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="burger__box" aria-hidden="true">
              <span className="burger__line" />
              <span className="burger__line" />
            </span>
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div />
        <nav className="mobile-menu__list" aria-label="Mobile">
          {nav.map((item, i) => (
            <div className="mobile-menu__item" key={item.href} style={{ '--i': i }}>
              <a
                href={item.href}
                className="mobile-menu__link"
                onClick={(e) => go(e, item.href)}
                tabIndex={open ? 0 : -1}
              >
                <span className="mobile-menu__n">{String(i + 1).padStart(2, '0')}</span>
                {item.label}
              </a>
            </div>
          ))}
        </nav>
        <div className="mobile-menu__foot">
          <div className="mobile-menu__socials">
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="link-draw" tabIndex={open ? 0 : -1}>
                {s.label}
              </a>
            ))}
          </div>
          <a href={`tel:+${contact.whatsapp}`} className="mobile-menu__phone" tabIndex={open ? 0 : -1}>
            {contact.whatsappDisplay}
          </a>
        </div>
      </div>
    </>
  )
}
