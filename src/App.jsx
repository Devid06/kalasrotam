import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Hero, { Ribbon } from './components/Hero.jsx'
import Commission from './components/Commission.jsx'
import About from './components/About.jsx'
import Practice from './components/Practice.jsx'
import Collection from './components/Collection.jsx'
import Reviews from './components/Reviews.jsx'
import Connect from './components/Connect.jsx'
import Footer from './components/Footer.jsx'
import AdminPanel from './components/admin/AdminPanel.jsx'
import { WhatsAppIcon, CloseIcon } from './components/ui.jsx'
import { waLink, generalMessage } from './lib/whatsapp.js'
import { ContentProvider, useDraftStatus } from './lib/content.jsx'

/* The floating WhatsApp button stays out of the way until the visitor has left
   the hero — offering it over the headline would undercut the first thing they
   are supposed to look at. */
function WhatsAppFab() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={waLink(generalMessage())}
      target="_blank"
      rel="noopener noreferrer"
      className={`fab ${shown ? 'is-shown' : ''}`}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
    >
      <WhatsAppIcon size={19} />
      <span className="fab__label">Chat on WhatsApp</span>
    </a>
  )
}

/* Only ever visible to whoever made the edits — the draft lives in their own
   browser. It exists so that editing for an hour and closing the tab cannot be
   mistaken for having published. */
function DraftBadge() {
  const { visible, dismiss } = useDraftStatus()
  if (!visible) return null
  return (
    <div className="draft-badge" role="status">
      <span>Unpublished changes — only you can see them</span>
      <button type="button" onClick={dismiss} aria-label="Hide this notice">
        <CloseIcon size={12} />
      </button>
    </div>
  )
}

function Site() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="grain" aria-hidden="true" />

      <Header />

      <main id="main">
        <Hero />
        <Ribbon />
        {/* Commission sits directly under the hero: custom work is the studio's
            main business, so it should be the first thing after the pitch. */}
        <Commission />
        <About />
        <Practice />
        <Collection />
        <Reviews />
        <Connect />
      </main>

      <Footer />
      <WhatsAppFab />
      <DraftBadge />
      <AdminPanel />
    </>
  )
}

export default function App({ layers }) {
  return (
    <ContentProvider layers={layers}>
      <Site />
    </ContentProvider>
  )
}
