import { useContent } from '../lib/content.jsx'
import { useSmoothScroll } from '../lib/hooks.js'
import { waLink, generalMessage } from '../lib/whatsapp.js'
import { ArrowIcon } from './ui.jsx'

export default function Footer() {
  const { studio, artist, contact, socials, nav, footer } = useContent()
  const scrollTo = useSmoothScroll()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__top">
          <div>
            <p className="footer__mark">
              {studio.name}
              <span className="footer__deva deva">{studio.nameDevanagari}</span>
            </p>
            <p className="footer__line">{footer.line}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="footer__h">Explore</h2>
            <ul className="footer__list">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo(item.href)
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="footer__h">Reach me</h2>
            <ul className="footer__list">
              <li>
                <a href={waLink(generalMessage())} target="_blank" rel="noopener noreferrer">
                  {contact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>{contact.location}</li>
            </ul>

            <h2 className="footer__h" style={{ marginTop: '1.75rem' }}>
              Follow
            </h2>
            <ul className="footer__list">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} <span style={{ opacity: 0.6 }}>{s.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © {year} {studio.name} · All artwork by {artist.name}. Please do not reproduce without permission.
          </p>
          <div className="footer__legal">
            {footer.legal.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(l.href)
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            className="to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to top
            <ArrowIcon dir="up" size={13} />
          </button>
        </div>
      </div>
    </footer>
  )
}
