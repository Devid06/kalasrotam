import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  useContentAdmin,
  setPath,
  setArray,
  buildPublishPayload,
  downloadContentJson,
  payloadSize,
  formatBytes,
  merge,
} from '../../lib/content.jsx'
import { getLeads, clearLeads, downloadCsv } from '../../lib/leads.js'
import { CloseIcon } from '../ui.jsx'
import { AText, ANumber, ASelect, AToggle, AList, AImage, AItemCard, arrayOps } from './fields.jsx'

/* ============================================================================
   ADMIN PANEL  —  /?admin=1
   ----------------------------------------------------------------------------
   Edit any text, price or image on the site and watch the page behind update
   as you type. Press Publish and it downloads a content.json to upload to your
   host, which is what makes the change public.

   On access: ?admin=1 is a convenience, NOT a password — anybody who knows the
   URL can open this panel. That is acceptable here because it cannot damage
   anything: edits live only in the visitor's own browser, and publishing means
   uploading a file to your hosting, which only you can do.
   ========================================================================== */

const TABS = [
  { id: 'studio', label: 'Studio' },
  { id: 'hero', label: 'Hero' },
  { id: 'commission', label: 'Commission' },
  { id: 'about', label: 'About' },
  { id: 'practice', label: 'Practice' },
  { id: 'collection', label: 'Collection' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'leads', label: 'Leads' },
]

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'made-to-order', label: 'Made to order' },
]

const VARIANT_OPTIONS = [
  { value: 'graphite', label: 'Graphite / charcoal' },
  { value: 'paint', label: 'Painting' },
  { value: 'digital', label: 'Digital' },
  { value: 'decor', label: 'Decor' },
]

export default function AdminPanel() {
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState('studio')
  const [openCard, setOpenCard] = useState(null)
  const [published, setPublishedNote] = useState(false)

  const { content, draft, setDraft, discardDraft, hasDraft, published: publishedLayer } = useContentAdmin()

  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).get('admin') === '1')
  }, [])

  /* One setter for every scalar field on every screen. */
  const set = useCallback(
    (path, value) => setDraft(setPath(draft, content, path, value)),
    [draft, content, setDraft]
  )

  /* …and one for whole arrays, used by add / delete / reorder. */
  const setList = useCallback((path, arr) => setDraft(setArray(draft, path, arr)), [draft, setDraft])

  const payload = useMemo(() => buildPublishPayload(publishedLayer, draft), [publishedLayer, draft])
  const size = useMemo(() => payloadSize(payload), [payload])

  const publish = () => {
    downloadContentJson(payload)
    setPublishedNote(true)
    setTimeout(() => setPublishedNote(false), 6000)
  }

  const importJson = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      // Merged over the current draft rather than replacing it, so importing a
      // backup does not silently discard edits made since.
      setDraft(merge(draft, parsed))
    } catch {
      alert('That file could not be read as content.json')
    }
    e.target.value = ''
  }

  if (!enabled) return null

  if (!open) {
    return createPortal(
      <button type="button" className="admin-fab" onClick={() => setOpen(true)}>
        Edit site {hasDraft && <span className="admin-dot" aria-label="unpublished changes" />}
      </button>,
      document.body
    )
  }

  return createPortal(
    <aside className="admin" aria-label="Site editor">
      <header className="admin__bar">
        <div>
          <span className="admin__title">Edit site</span>
          <span className="admin__sub">
            {hasDraft ? 'Unpublished changes' : 'No changes yet'} · {formatBytes(size)}
          </span>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close editor" className="admin__x">
          <CloseIcon />
        </button>
      </header>

      <nav className="admin__tabs" aria-label="Editor sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin__tab ${tab === t.id ? 'is-on' : ''}`}
            onClick={() => {
              setTab(t.id)
              setOpenCard(null)
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="admin__body">
        {tab === 'studio' && <StudioTab content={content} set={set} setList={setList} />}
        {tab === 'hero' && <HeroTab content={content} set={set} />}
        {tab === 'commission' && <CommissionTab content={content} set={set} setList={setList} openCard={openCard} setOpenCard={setOpenCard} />}
        {tab === 'about' && <AboutTab content={content} set={set} />}
        {tab === 'practice' && <PracticeTab content={content} setList={setList} openCard={openCard} setOpenCard={setOpenCard} set={set} />}
        {tab === 'collection' && <CollectionTab content={content} set={set} setList={setList} openCard={openCard} setOpenCard={setOpenCard} />}
        {tab === 'reviews' && <ReviewsTab content={content} set={set} setList={setList} openCard={openCard} setOpenCard={setOpenCard} />}
        {tab === 'leads' && <LeadsTab />}
      </div>

      <footer className="admin__foot">
        {published && (
          <p className="admin__flash">
            content.json downloaded. Upload it to your website’s folder to make these changes public.
          </p>
        )}
        {size > 2_500_000 && (
          <p className="admin__warn">
            This is getting heavy ({formatBytes(size)}). Visitors download it on every visit — consider putting large
            photos in <code>public/images/</code> and using paths instead.
          </p>
        )}
        <div className="admin__actions">
          <button type="button" className="abtn abtn--primary" onClick={publish} disabled={!hasDraft && !publishedLayer}>
            Publish
          </button>
          <label className="abtn abtn--ghost">
            Import
            <input type="file" accept="application/json" onChange={importJson} hidden />
          </label>
          <button
            type="button"
            className="abtn abtn--ghost"
            disabled={!hasDraft}
            onClick={() => {
              if (confirm('Throw away every unpublished change?')) discardDraft()
            }}
          >
            Discard
          </button>
        </div>
      </footer>
    </aside>,
    document.body
  )
}

/* ── Studio & contact ─────────────────────────────────────────────────────── */

function StudioTab({ content, set, setList }) {
  const { studio, contact, socials } = content
  return (
    <>
      <Group title="Studio">
        <AImage
          label="Logo"
          value={studio.logo}
          seed="studio-logo"
          variant="decor"
          onChange={(v) => set('studio.logo', v)}
          hint="Shown in the header and the footer. A square PNG with a transparent background works best. Clear it to fall back to the simple drawn mark."
        />
        <AText label="Studio name" value={studio.name} onChange={(v) => set('studio.name', v)} />
        <AText label="Name in Devanagari" value={studio.nameDevanagari} onChange={(v) => set('studio.nameDevanagari', v)} />
        <AText label="Tagline" value={studio.tagline} onChange={(v) => set('studio.tagline', v)} />
      </Group>

      <Group title="Contact" note="The WhatsApp number drives every WhatsApp button on the site.">
        <AText
          label="WhatsApp number"
          value={contact.whatsapp}
          onChange={(v) => set('contact.whatsapp', v.replace(/\D/g, ''))}
          hint="Digits only, with country code. 91 for India."
        />
        <AText label="Number as shown" value={contact.whatsappDisplay} onChange={(v) => set('contact.whatsappDisplay', v)} />
        <AText label="Email" value={contact.email} onChange={(v) => set('contact.email', v)} />
        <AText label="Location" value={contact.location} onChange={(v) => set('contact.location', v)} />
        <AText label="Response time" value={contact.hours} onChange={(v) => set('contact.hours', v)} />
      </Group>

      <Group title="Social" note="Tick “Highlight” to give a channel the big card in the Contact section. One only.">
        {socials.map((s, i) => (
          <div className="asub" key={i}>
            <AText label="Name" value={s.label} onChange={(v) => setList('socials', arrayOps.update(socials, i, { label: v }))} />
            <AText label="Handle" value={s.handle} onChange={(v) => setList('socials', arrayOps.update(socials, i, { handle: v }))} />
            <AText label="Link" value={s.url} onChange={(v) => setList('socials', arrayOps.update(socials, i, { url: v }))} />
            <AToggle
              label="Highlight this one"
              value={s.featured}
              onChange={(v) =>
                // Only one highlight makes sense — setting one clears the rest.
                setList(
                  'socials',
                  socials.map((x, idx) => ({ ...x, featured: v && idx === i }))
                )
              }
            />
            {s.featured && (
              <AText
                label="Highlight text"
                multiline
                value={s.blurb}
                onChange={(v) => setList('socials', arrayOps.update(socials, i, { blurb: v }))}
              />
            )}
            <button type="button" className="abtn abtn--sm abtn--ghost" onClick={() => setList('socials', arrayOps.remove(socials, i))}>
              Remove {s.label}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="abtn abtn--sm"
          onClick={() => setList('socials', arrayOps.add(socials, { label: 'New', handle: '', url: '' }))}
        >
          + Add a channel
        </button>
      </Group>
    </>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function HeroTab({ content, set }) {
  const { hero } = content
  return (
    <>
      <Group title="Background artwork" note="The full-bleed piece behind the words. Landscape photos work best.">
        <AImage
          label="Hero artwork"
          value={hero.background?.image}
          seed={hero.background?.seed || 'hero-field'}
          variant={hero.background?.variant || 'graphite'}
          onChange={(v) => set('hero.background.image', v)}
        />
        <ANumber
          label="Darkening"
          value={hero.scrim}
          min={0}
          max={100}
          onChange={(v) => set('hero.scrim', v)}
          hint="0–100. Raise it if your artwork is pale and the text is hard to read."
        />
      </Group>

      <Group title="Words">
        <AText label="Small line above" value={hero.eyebrow} onChange={(v) => set('hero.eyebrow', v)} />
        <AList label="Headline" value={hero.headline} onChange={(v) => set('hero.headline', v)} hint="One line per row. The last line is italic and gold." rows={3} />
        <AText
          label="Emotional line"
          multiline
          rows={2}
          value={hero.emotional}
          onChange={(v) => set('hero.emotional', v)}
          hint="The one sentence meant to land first."
        />
        <AText label="Paragraph" multiline rows={5} value={hero.body} onChange={(v) => set('hero.body', v)} />
      </Group>

      <Group title="Buttons">
        <AText label="Main button" value={hero.primary?.label} onChange={(v) => set('hero.primary.label', v)} />
        <AText label="Second button" value={hero.secondary?.label} onChange={(v) => set('hero.secondary.label', v)} />
      </Group>

      <Group title="Wall label" note="Names the piece in the background, bottom right.">
        <AText label="Title" value={hero.featured?.title} onChange={(v) => set('hero.featured.title', v)} />
        <AText label="Medium" value={hero.featured?.medium} onChange={(v) => set('hero.featured.medium', v)} />
        <AText label="Size" value={hero.featured?.size} onChange={(v) => set('hero.featured.size', v)} />
        <ANumber label="Year" value={hero.featured?.year} onChange={(v) => set('hero.featured.year', v)} />
      </Group>

      <Group title="Numbers" note="Keep these honest — they are the first thing people check.">
        {hero.stats.map((s, i) => (
          <div className="arow" key={i}>
            <AText label="Figure" value={s.value} onChange={(v) => set(`hero.stats.${i}.value`, v)} />
            <AText label="Caption" value={s.label} onChange={(v) => set(`hero.stats.${i}.label`, v)} />
          </div>
        ))}
      </Group>
    </>
  )
}

/* ── Commission ───────────────────────────────────────────────────────────── */

function CommissionTab({ content, set, setList, openCard, setOpenCard }) {
  const { commission } = content
  return (
    <>
      <Group title="Section text">
        <AText label="Kicker" value={commission.kicker} onChange={(v) => set('commission.kicker', v)} />
        <AText label="Heading" multiline rows={2} value={commission.headline} onChange={(v) => set('commission.headline', v)} />
        <AText label="Paragraph" multiline rows={4} value={commission.body} onChange={(v) => set('commission.body', v)} />
        <AText label="Note under the form" value={commission.note} onChange={(v) => set('commission.note', v)} />
      </Group>

      <Group title="How it works">
        {commission.steps.map((s, i) => (
          <AItemCard
            key={i}
            title={`${s.n} · ${s.title}`}
            open={openCard === `step-${i}`}
            onToggle={() => setOpenCard(openCard === `step-${i}` ? null : `step-${i}`)}
            onDelete={() => setList('commission.steps', arrayOps.remove(commission.steps, i))}
            onMoveUp={() => setList('commission.steps', arrayOps.move(commission.steps, i, -1))}
            onMoveDown={() => setList('commission.steps', arrayOps.move(commission.steps, i, 1))}
          >
            <AText label="Number" value={s.n} onChange={(v) => set(`commission.steps.${i}.n`, v)} />
            <AText label="Title" value={s.title} onChange={(v) => set(`commission.steps.${i}.title`, v)} />
            <AText label="Text" multiline value={s.body} onChange={(v) => set(`commission.steps.${i}.body`, v)} />
          </AItemCard>
        ))}
      </Group>

      <Group title="Enquiry form dropdowns">
        <AList label="What can be made" value={commission.mediumOptions} onChange={(v) => set('commission.mediumOptions', v)} rows={6} />
        <AList label="Sizes" value={commission.sizeOptions} onChange={(v) => set('commission.sizeOptions', v)} rows={5} />
        <AList label="Budgets" value={commission.budgetOptions} onChange={(v) => set('commission.budgetOptions', v)} rows={5} />
      </Group>
    </>
  )
}

/* ── About ────────────────────────────────────────────────────────────────── */

function AboutTab({ content, set }) {
  const { artist } = content
  return (
    <>
      <Group title="You">
        <AText label="Your name" value={artist.name} onChange={(v) => set('artist.name', v)} />
        <AText label="Role" value={artist.role} onChange={(v) => set('artist.role', v)} />
        <AText label="Heading" multiline rows={2} value={artist.short} onChange={(v) => set('artist.short', v)} />
        <AImage label="Your photo" value={artist.portrait} seed="artist-portrait" variant="graphite" onChange={(v) => set('artist.portrait', v)} />
      </Group>

      <Group title="Your story" note="Write this in your own words. It is the section that makes people trust a one-person studio.">
        {artist.story.map((p, i) => (
          <AText key={i} label={`Paragraph ${i + 1}`} multiline rows={5} value={p} onChange={(v) => set(`artist.story.${i}`, v)} />
        ))}
      </Group>

      <Group title="Closing">
        <AText label="Pull quote" multiline rows={3} value={artist.philosophy} onChange={(v) => set('artist.philosophy', v)} />
        <AText label="Signature" value={artist.signature} onChange={(v) => set('artist.signature', v)} />
      </Group>
    </>
  )
}

/* ── Practice ─────────────────────────────────────────────────────────────── */

function PracticeTab({ content, set, setList, openCard, setOpenCard }) {
  const { practice } = content
  return (
    <>
      <Group title="Section text">
        <AText label="Kicker" value={practice.kicker} onChange={(v) => set('practice.kicker', v)} />
        <AText label="Heading" value={practice.headline} onChange={(v) => set('practice.headline', v)} />
        <AText label="Paragraph" multiline value={practice.body} onChange={(v) => set('practice.body', v)} />
      </Group>

      <Group title="What you do" note="Prices here are the “from” figures shown on the site.">
        {practice.items.map((item, i) => (
          <AItemCard
            key={item.id}
            title={item.title}
            subtitle={`from ${item.from}`}
            open={openCard === `p-${i}`}
            onToggle={() => setOpenCard(openCard === `p-${i}` ? null : `p-${i}`)}
            onDelete={() => setList('practice.items', arrayOps.remove(practice.items, i))}
            onMoveUp={() => setList('practice.items', arrayOps.move(practice.items, i, -1))}
            onMoveDown={() => setList('practice.items', arrayOps.move(practice.items, i, 1))}
          >
            <AText label="Title" value={item.title} onChange={(v) => set(`practice.items.${i}.title`, v)} />
            <AText label="One-liner" value={item.lede} onChange={(v) => set(`practice.items.${i}.lede`, v)} />
            <AText label="Description" multiline rows={5} value={item.body} onChange={(v) => set(`practice.items.${i}.body`, v)} />
            <AText label="Price from" value={item.from} onChange={(v) => set(`practice.items.${i}.from`, v)} hint="Type it exactly as you want it shown, e.g. ₹1,800" />
            <AList label="Tags" value={item.meta} onChange={(v) => set(`practice.items.${i}.meta`, v)} rows={3} />
            <AImage
              label="Example image"
              value={item.image}
              seed={item.seed}
              variant={item.variant}
              onChange={(v) => set(`practice.items.${i}.image`, v)}
            />
          </AItemCard>
        ))}
      </Group>
    </>
  )
}

/* ── Collection ───────────────────────────────────────────────────────────── */

function CollectionTab({ content, set, setList, openCard, setOpenCard }) {
  const { artworks, collectionMeta, filters } = content

  const addArtwork = () => {
    const id = `w${Date.now().toString(36)}`
    setList(
      'artworks',
      arrayOps.add(artworks, {
        id,
        title: 'New piece',
        category: filters[1]?.id || 'graphite',
        medium: '',
        size: '',
        year: new Date().getFullYear(),
        price: 0,
        status: 'available',
        note: '',
        seed: id,
        variant: 'graphite',
        image: null,
      })
    )
    setOpenCard(`a-${artworks.length}`)
  }

  return (
    <>
      <Group title="Section text">
        <AText label="Kicker" value={collectionMeta.kicker} onChange={(v) => set('collectionMeta.kicker', v)} />
        <AText label="Heading" value={collectionMeta.headline} onChange={(v) => set('collectionMeta.headline', v)} />
        <AText label="Paragraph" multiline value={collectionMeta.body} onChange={(v) => set('collectionMeta.body', v)} />
      </Group>

      <Group title={`Artworks (${artworks.length})`}>
        {artworks.map((a, i) => (
          <AItemCard
            key={a.id}
            title={a.title}
            subtitle={`₹${a.price?.toLocaleString('en-IN')} · ${a.status}`}
            open={openCard === `a-${i}`}
            onToggle={() => setOpenCard(openCard === `a-${i}` ? null : `a-${i}`)}
            onDelete={() => {
              if (confirm(`Delete “${a.title}”?`)) setList('artworks', arrayOps.remove(artworks, i))
            }}
            onMoveUp={() => setList('artworks', arrayOps.move(artworks, i, -1))}
            onMoveDown={() => setList('artworks', arrayOps.move(artworks, i, 1))}
          >
            <AImage label="Photo" value={a.image} seed={a.seed} variant={a.variant} onChange={(v) => set(`artworks.${i}.image`, v)} />
            <AText label="Title" value={a.title} onChange={(v) => set(`artworks.${i}.title`, v)} />
            <ASelect
              label="Category"
              value={a.category}
              options={filters.filter((f) => f.id !== 'all').map((f) => ({ value: f.id, label: f.label }))}
              onChange={(v) => set(`artworks.${i}.category`, v)}
            />
            <AText label="Medium" value={a.medium} onChange={(v) => set(`artworks.${i}.medium`, v)} />
            <div className="arow">
              <AText label="Size" value={a.size} onChange={(v) => set(`artworks.${i}.size`, v)} />
              <ANumber label="Year" value={a.year} onChange={(v) => set(`artworks.${i}.year`, v)} />
            </div>
            <ANumber label="Price" prefix="₹" value={a.price} min={0} onChange={(v) => set(`artworks.${i}.price`, v)} />
            <ASelect label="Status" value={a.status} options={STATUS_OPTIONS} onChange={(v) => set(`artworks.${i}.status`, v)} />
            <AText label="Note" multiline value={a.note} onChange={(v) => set(`artworks.${i}.note`, v)} />
            <AToggle label="Feature it larger in the grid" value={a.tall} onChange={(v) => set(`artworks.${i}.tall`, v)} />
            <ASelect
              label="Placeholder style"
              value={a.variant}
              options={VARIANT_OPTIONS}
              onChange={(v) => set(`artworks.${i}.variant`, v)}
              hint="Only matters until you add a real photo."
            />
          </AItemCard>
        ))}
        <button type="button" className="abtn abtn--sm" onClick={addArtwork}>
          + Add an artwork
        </button>
      </Group>
    </>
  )
}

/* ── Reviews ──────────────────────────────────────────────────────────────── */

function ReviewsTab({ content, set, setList, openCard, setOpenCard }) {
  const { reviews, reviewsMeta } = content

  const addReview = () => {
    const id = `r${Date.now().toString(36)}`
    setList('reviews', arrayOps.add(reviews, { id, name: '', city: '', rating: 5, piece: '', quote: '', seed: id, variant: 'graphite', image: null }))
    setOpenCard(`r-${reviews.length}`)
  }

  return (
    <>
      <p className="admin__note">
        You control this list. Customers send their words to you on WhatsApp with the “Leave a review” button, and you
        add the ones you want here. Nothing appears on the site that you did not put here.
      </p>

      <Group title="Section text">
        <AText label="Kicker" value={reviewsMeta.kicker} onChange={(v) => set('reviewsMeta.kicker', v)} />
        <AText label="Heading" value={reviewsMeta.headline} onChange={(v) => set('reviewsMeta.headline', v)} />
        <AText label="Paragraph" multiline value={reviewsMeta.body} onChange={(v) => set('reviewsMeta.body', v)} />
      </Group>

      <Group title="Sample warning">
        <AToggle
          label="Show the “these are samples” banner"
          value={reviewsMeta.sampleNotice}
          onChange={(v) => set('reviewsMeta.sampleNotice', v)}
          hint="Turn this off once every review below is from a real customer."
        />
        {reviewsMeta.sampleNotice && (
          <AText
            label="Banner text"
            multiline
            value={reviewsMeta.sampleNoticeText}
            onChange={(v) => set('reviewsMeta.sampleNoticeText', v)}
          />
        )}
      </Group>

      <Group title="Trust numbers">
        {reviewsMeta.trust.map((t, i) => (
          <div className="arow" key={i}>
            <AText label="Figure" value={t.value} onChange={(v) => set(`reviewsMeta.trust.${i}.value`, v)} />
            <AText label="Caption" value={t.label} onChange={(v) => set(`reviewsMeta.trust.${i}.label`, v)} />
          </div>
        ))}
      </Group>

      <Group title={`Reviews (${reviews.length})`}>
        {reviews.map((r, i) => (
          <AItemCard
            key={r.id}
            title={r.name || 'New review'}
            subtitle={`${r.rating}★ · ${r.city}`}
            open={openCard === `r-${i}`}
            onToggle={() => setOpenCard(openCard === `r-${i}` ? null : `r-${i}`)}
            onDelete={() => {
              if (confirm(`Delete the review from ${r.name}?`)) setList('reviews', arrayOps.remove(reviews, i))
            }}
            onMoveUp={() => setList('reviews', arrayOps.move(reviews, i, -1))}
            onMoveDown={() => setList('reviews', arrayOps.move(reviews, i, 1))}
          >
            <AImage label="Photo of the piece" value={r.image} seed={r.seed} variant={r.variant} onChange={(v) => set(`reviews.${i}.image`, v)} />
            <div className="arow">
              <AText label="Customer name" value={r.name} onChange={(v) => set(`reviews.${i}.name`, v)} />
              <AText label="City" value={r.city} onChange={(v) => set(`reviews.${i}.city`, v)} />
            </div>
            <ANumber label="Stars" value={r.rating} min={1} max={5} onChange={(v) => set(`reviews.${i}.rating`, v)} />
            <AText label="What you made" value={r.piece} onChange={(v) => set(`reviews.${i}.piece`, v)} />
            <AText label="Their words" multiline rows={5} value={r.quote} onChange={(v) => set(`reviews.${i}.quote`, v)} />
          </AItemCard>
        ))}
        <button type="button" className="abtn abtn--sm" onClick={addReview}>
          + Add a review
        </button>
      </Group>

      <Group title="Review invitation">
        <AText label="Heading" value={reviewsMeta.ctaTitle} onChange={(v) => set('reviewsMeta.ctaTitle', v)} />
        <AText label="Text" multiline value={reviewsMeta.ctaBody} onChange={(v) => set('reviewsMeta.ctaBody', v)} />
        <AText label="Button" value={reviewsMeta.ctaLabel} onChange={(v) => set('reviewsMeta.ctaLabel', v)} />
      </Group>
    </>
  )
}

/* ── Leads ────────────────────────────────────────────────────────────────── */

function LeadsTab() {
  const [leads, setLeads] = useState([])

  useEffect(() => {
    setLeads(getLeads())
    const timer = setInterval(() => setLeads(getLeads()), 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <p className="admin__note">
        These are enquiries captured <strong>in this browser only</strong>. Real visitors’ entries stay on their own
        devices — what reaches you is the WhatsApp message each form opens. Useful for testing the forms.
      </p>

      <Group title={`Captured (${leads.length})`}>
        {leads.length === 0 ? (
          <p className="af__hint">Nothing yet. Submit either form to test it.</p>
        ) : (
          leads.map((l) => (
            <div className="alead" key={l.id}>
              <b>{l.name}</b>
              <span>
                {l.phone}
                {l.email ? ` · ${l.email}` : ''}
              </span>
              <span>
                {l.type} · {new Date(l.at).toLocaleString('en-IN')}
              </span>
              {l.medium && (
                <span>
                  {l.medium} · {l.size} · {l.budget}
                </span>
              )}
              {l.message && <span>“{l.message}”</span>}
            </div>
          ))
        )}
        <div className="admin__actions">
          <button type="button" className="abtn abtn--sm" disabled={!leads.length} onClick={() => downloadCsv(leads)}>
            Export CSV
          </button>
          <button
            type="button"
            className="abtn abtn--sm abtn--ghost"
            disabled={!leads.length}
            onClick={() => {
              if (confirm('Delete all leads stored in this browser?')) {
                clearLeads()
                setLeads([])
              }
            }}
          >
            Clear
          </button>
        </div>
      </Group>
    </>
  )
}

/* ── Layout helper ────────────────────────────────────────────────────────── */

function Group({ title, note, children }) {
  return (
    <section className="agroup">
      <h3 className="agroup__title">{title}</h3>
      {note && <p className="agroup__note">{note}</p>}
      <div className="agroup__body">{children}</div>
    </section>
  )
}
