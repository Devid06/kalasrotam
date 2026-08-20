# Kalasrotam — कलास्रोतम्

> *Where art flows into life.*
> For the faces you are afraid of forgetting.

A one-page website for a hand-made art studio: graphite and charcoal, paintings,
digital art prints and home decor — with custom commissions, direct purchase over
WhatsApp, client reviews, a mailing-list form, and a built-in editor so Divyansh
can change any text, price or photo himself and see it live in a second.

React + Vite, on Cloudflare Workers, with Supabase behind the editor. Every piece
of it sits inside a free tier.

---

## Running it

```bash
npm install     # once
npm run dev     # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Live preview while you edit. Changes appear instantly. |
| `npm run build` | Creates the `dist/` folder to upload. |
| `npm run preview` | Serves the built site so you can check it before deploying. |

---

## Editing the site

**Divyansh signs in at `yoursite.com/?admin=1`** and edits anything — text,
prices, photos. Press **Publish** and the live site updates for everyone in
about a second. No files, no uploads, no rebuild.

Setting that up (Supabase, Cloudflare, the domain) is a one-time job:
**see [SETUP.md](SETUP.md)** for the full walkthrough.

### How it fits together

```
Divyansh edits  ──▶  Publish  ──▶  Supabase  ──▶  every visitor
                                      │
Photos ─── resized in the browser ────┘  (storage + CDN)

Enquiries ─── from the forms ─────────▶  Supabase  ──▶  Leads tab
```

### Why there is still a Publish button

Publishing is instant, but deliberate. Edits preview privately on the editor's
own device until Publish is pressed. Saving every keystroke straight to a live
site would put half-typed headlines in front of whoever happens to be reading
the page at that moment.

### It cannot take the site down

Content is read in order: **live database → last published copy → built-in
defaults**. If Supabase is paused, slow or misconfigured, the site still renders
from the layer below rather than showing an error. Tested: with the database
deliberately unreachable, the page still paints in about half a second.

### Photos

Choose a photo and it is resized in the browser, uploaded to storage, and
referenced by URL. It never enters the repository and never bloats the page.
Clearing an image field restores the generated study, so nothing ever breaks.

### Enquiries

Both forms now write to the database, so **you actually receive them** — this
used to save to the visitor's own browser, where you never saw them. The Leads
tab lists every enquiry with a WhatsApp link and a CSV export.

Security: anyone may submit a form; only a signed-in account can read them back.
A visitor cannot list other people's names and numbers.

## Before you launch

1. **Reviews** — the six on the site now are **written examples, not real
   customers.** Replace them with real words in the Reviews tab. Visitors press
   "Leave a review", which sends their words to you on WhatsApp; you add the ones
   you want. Nothing appears without you putting it there.
2. **Prices** — every price is a placeholder. Set the real ones in the Collection
   tab (per artwork) and the Practice tab (the "from" figures).
3. **Your story** — the About text is written in a plausible voice, but it is not
   your life. Rewrite it in the About tab. It is the section that makes people
   trust a one-person studio.
4. **Numbers** — "140+ pieces delivered", "4.9 average rating", "9 states" are
   placeholders. Make them true or change them.
5. **Hero artwork** — the background is a generated study. Put your strongest
   piece there, then adjust the **Darkening** slider until the text reads clearly.
6. **Social preview** — add `public/images/og-cover.jpg` (1200 × 630). That is the
   thumbnail people see when your link is shared on WhatsApp.

---

## Putting it online

Hosted on **Cloudflare Workers** — free, commercial use permitted, unlimited
bandwidth, and the most Indian edge locations of the free options, which matters
for buyers here.

Worth knowing why not the obvious alternatives: Vercel's free Hobby plan is
non-commercial only, and GitHub Pages' terms discourage sites built around
commercial transactions. Both would have been a risk for a shop.

Every push to `main` redeploys automatically. Full steps in [SETUP.md](SETUP.md).

## About the placeholder artwork

Until you add real photographs, every artwork frame draws its own **generated ink
study** — hundreds of strokes traced through a noise field, in the studio palette.

They are deterministic: a given piece looks the same on every visit, so the
gallery does not shuffle. They are also frankly abstract — placeholders that hold
the composition, not pretend photographs of your work.

The same noise field animates the ink current behind the hero, so the studies are
frozen moments of that stream — which is what *kalāsrotam*, "a stream of art",
means.

---

## How it is put together

```
public/
├─ content.json         a published snapshot, used if the database is unreachable
├─ favicon-32.png       tab icon, generated from the logo
├─ apple-touch-icon.png home-screen icon
└─ images/logo.png      the studio mark

supabase/
└─ setup.sql            run once; creates the tables, rules and storage bucket

src/
├─ data/site.js         built-in defaults — the last line of defence
├─ lib/
│  ├─ supabase.js       config; REST for visitors, lazy SDK for the editor
│  ├─ content.jsx       the four content layers, drafts, publishing, live updates
│  ├─ auth.js           the editor login
│  ├─ image.js          resize + upload to storage
│  ├─ leads.js          enquiries in and out, validation, CSV
│  ├─ noise.js          shared value-noise field (hero + placeholders)
│  ├─ placeholder.js    generates the SVG art studies
│  ├─ whatsapp.js       wa.me links and message templates
│  └─ hooks.js          scroll spy, reveal, body lock, parallax
├─ components/
│  ├─ Header.jsx        sticky nav + mobile menu
│  ├─ Hero.jsx          full-bleed artwork with the words over it
│  ├─ InkFlow.jsx       the animated ink current
│  ├─ Commission.jsx    custom work + enquiry form
│  ├─ About.jsx         the artist, and what the name means
│  ├─ Practice.jsx      the four mediums
│  ├─ Collection.jsx    the dark gallery band
│  ├─ Lightbox.jsx      artwork detail + buy on WhatsApp
│  ├─ Reviews.jsx       delivered commissions + client words
│  ├─ Connect.jsx       contact details, Instagram card, mailing list
│  ├─ Footer.jsx
│  └─ admin/
│     ├─ AdminPanel.jsx  tiny gate: notices ?admin=1, lazy-loads the editor
│     ├─ Editor.jsx      the editor itself
│     ├─ Login.jsx       email + password
│     └─ fields.jsx      the form widgets
└─ styles/
   ├─ base.css          colour, type scale, buttons, forms
   └─ sections.css      layout for each band of the page
```

### Design decisions worth knowing

- **The editor is a separate chunk.** Visitors download 84KB gzipped; the editor
  and the Supabase library are another 67KB that load only on `?admin=1`. An
  earlier version imported the editor directly, and because React hooks must run
  unconditionally, its auth check fired for every visitor and pulled the whole
  library down on page views that would never edit anything.
- **No dark mode.** A gallery has one set of walls; the warm paper palette is the
  brand. The hero and the Collection band go dark deliberately, so the work glows
  against them.
- **The hero has two scrims.** One darkens the whole artwork, one is anchored to
  the text side. Text over a photograph is the easiest way to make something
  unreadable, so contrast is built in layers rather than left to luck — and the
  Darkening slider lets you tune it per artwork.
- **Motion respects `prefers-reduced-motion`.** The ink current paints a single
  still frame instead of animating, and every reveal is disabled.
- **The ink canvas stops** when scrolled out of view or when the tab is hidden, so
  it does not drain a phone battery.
- **Everything is keyboard-reachable.** The lightbox traps focus, closes on
  `Escape`, pages with arrow keys, and returns focus to the piece you opened it
  from.

---

## Credits

Typefaces: [Fraunces](https://fonts.google.com/specimen/Fraunces),
[Jost](https://fonts.google.com/specimen/Jost),
[Tiro Devanagari Hindi](https://fonts.google.com/specimen/Tiro+Devanagari+Hindi) —
all open source, served from Google Fonts.
