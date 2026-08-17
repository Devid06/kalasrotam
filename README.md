# Kalasrotam — कलास्रोतम्

> *Where art flows into life.*
> For the faces you are afraid of forgetting.

A one-page website for a hand-made art studio: graphite and charcoal, paintings,
digital art prints and home decor — with custom commissions, direct purchase over
WhatsApp, client reviews, a mailing-list form, and a built-in admin panel so you
can change any text, price or photo yourself.

React + Vite. No backend, no database, nothing to pay for monthly.

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

## Editing the site — the admin panel

**Add `?admin=1` to the end of your address:**

```
http://localhost:5173/?admin=1        while developing
https://yoursite.com/?admin=1         once it is live
```

A panel opens on the right. Change anything and the page behind updates as you
type. There are tabs for Studio, Hero, Commission, About, Practice, Collection,
Reviews and Leads.

### The three buttons at the bottom

| Button | What it does |
| --- | --- |
| **Publish** | Downloads a `content.json` file. **Upload that file to your website's folder** — that is what makes your changes public. |
| **Import** | Load a `content.json` back in to keep editing where you left off. Also your backup. |
| **Discard** | Throws away unpublished changes and goes back to what is live. |

### Important: editing is not publishing

Your changes are saved in **your own browser** until you press Publish and upload
the file. Nobody else sees them before that. A black "Unpublished changes" badge
sits at the bottom of the screen while you have edits waiting, so this is hard to
get wrong — but it is worth understanding.

The order of precedence is: built-in defaults → your `content.json` → your
unpublished draft. That is what makes it safe. If `content.json` ever goes
missing or gets corrupted, the site still loads on the defaults in
`src/data/site.js` instead of breaking.

### Changing pictures

Every image field has two ways to set a photo:

1. **Choose photo** — resized automatically and packed into `content.json`. One
   file to upload, nothing else to think about.
2. **Type a path** — put the file in `public/images/` yourself and write
   `./images/name.jpg`. Keeps `content.json` small.

Option 1 is easier; option 2 is faster for visitors. The panel shows the total
file size at the top and warns you if it gets heavy — visitors download that file
on every visit, so on mobile data it matters. If you have many large photos,
switch those to paths.

Clearing an image field brings back the generated study, so nothing ever breaks.

### About access

`?admin=1` is a convenience, not a password — anyone who knows the URL can open
the panel. That is deliberate and safe: edits only ever live in the visitor's own
browser, and publishing means uploading a file to your hosting, which only you
can do. Nobody can change your live site from the panel.

---

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

## Where the enquiries go

Two forms: the commission enquiry and the mailing list. Both do the same thing:

1. Save the entry to **`localStorage` in the visitor's own browser**
2. Open **WhatsApp** with the details already written out, ready to send

**Leads are stored on the visitor's device, not yours.** You do not receive them.
What reaches you is the WhatsApp message. This is fine for launching, but it is
not lead capture. The Leads tab shows what was captured *in your own browser*,
with a CSV export — useful for testing the forms.

### Turning on real lead capture

Sign up for a free form service (Formspree, Getform, or a Google Apps Script
endpoint) and replace one function — `submitRemote` in
[`src/lib/leads.js`](src/lib/leads.js):

```js
export async function submitRemote(lead) {
  saveLead(lead)
  return fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  })
}
```

Both forms already `await` this and already handle failure, so nothing else
changes.

---

## Putting it online

Run `npm run build`, then upload the `dist/` folder.

- **Netlify / Vercel** — drag the `dist` folder onto their dashboard. Free,
  instant, HTTPS, and you can point your own domain at it.
- **GitHub Pages** — push `dist` to a `gh-pages` branch. `vite.config.js` already
  uses a relative `base`, so it works from a subfolder.
- **Ordinary hosting (Hostinger, GoDaddy)** — upload the contents of `dist` to
  `public_html`.

Your `content.json` goes in the **same folder as `index.html`**, whichever host
you use.

---

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
├─ content.json         ← what you publish from the admin panel (optional)
└─ images/              ← photos, if you reference them by path

src/
├─ data/site.js         built-in defaults. The fallback if content.json is missing.
├─ lib/
│  ├─ content.jsx       the three content layers, draft saving, publishing
│  ├─ noise.js          shared value-noise field (hero + placeholders)
│  ├─ placeholder.js    generates the SVG art studies
│  ├─ image.js          resizes and embeds photos chosen in the admin panel
│  ├─ leads.js          lead storage, validation, CSV export
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
│  └─ admin/            the editor panel
└─ styles/
   ├─ base.css          colour, type scale, buttons, forms
   └─ sections.css      layout for each band of the page
```

### Design decisions worth knowing

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
