/* ============================================================================
   KALASROTAM — DEFAULT SITE CONTENT
   ----------------------------------------------------------------------------
   These are the DEFAULTS the site falls back to.

   You do not normally edit this file any more — use the admin panel instead:

       yoursite.com/?admin=1

   Change any text, price or image there, press "Publish", and it downloads a
   `content.json` you upload to your host. That file overrides everything below.
   This file is the safety net: if content.json is ever missing or broken, the
   site still loads exactly as written here.

   Anything marked  // ✎  is a placeholder meant to be replaced.
   ========================================================================== */

/* ── Studio identity ──────────────────────────────────────────────────────── */

export const studio = {
  name: 'Kalasrotam',
  nameDevanagari: 'कलास्रोतम्',
  tagline: 'Where art flows into life',
  etymology: {
    parts: [
      { word: 'कला', roman: 'kalā', meaning: 'art' },
      { word: 'स्रोतम्', roman: 'srotam', meaning: 'a stream, a source, a current' },
    ],
    line: 'A stream of art — moving, never still, always finding its way into someone’s life.',
  },
  founded: 2021, // ✎ the year you started
  city: 'Indore, India',
}

/* ── The artist ───────────────────────────────────────────────────────────── */

export const artist = {
  name: 'Divyansh Tiwari',
  role: 'Artist & Founder',
  portrait: null, // ✎ add your photo in the admin panel
  short: 'I draw the people someone is afraid of forgetting.',
  story: [
    'Kalasrotam started on the back pages of a school notebook. I was the boy who could never sit through a lecture without a face appearing in the margin — a grandfather’s hands, a friend mid-laugh, a street dog asleep in the sun. The drawings were bad. The habit stuck.',
    'Years later somebody paid me for one. Not because it was technically perfect, but because I had drawn their mother the way they remembered her, not the way the photograph showed her. That is the day this stopped being a hobby.',
    'Today I work mostly in graphite and charcoal, some paint, and increasingly in digital — but the job has not changed. Somebody hands me a memory. I hand it back in a form they can live with.',
  ],
  signature: 'Divyansh',
  philosophy: 'A portrait is not a copy of a face. It is a record of how someone was loved.',
}

/* ── Contact & social ─────────────────────────────────────────────────────── */

export const contact = {
  // Digits only, with country code, no + or spaces. 91 = India.
  // Every WhatsApp button on the site uses this.
  whatsapp: '916264256570',
  whatsappDisplay: '+91 62642 56570',
  email: 'tdivyansh928@gmail.com',
  location: 'Indore, Madhya Pradesh, India',
  hours: 'Replies within a day, most days',
}

/* `featured: true` gives a channel the big highlight card in the Contact
   section and top billing in the footer. Instagram is where the work actually
   lives, so it gets it. */
export const socials = [
  {
    label: 'Instagram',
    handle: '@kala.srotam',
    url: 'https://instagram.com/kala.srotam',
    featured: true,
    blurb: 'New pieces, work-in-progress and studio days — posted here first.',
  },
  { label: 'Pinterest', handle: 'kalasrotam', url: 'https://pinterest.com/kalasrotam' }, // ✎ or delete
  { label: 'YouTube', handle: 'Kalasrotam', url: 'https://youtube.com/@kalasrotam' }, // ✎ or delete
]

/* ── Navigation ───────────────────────────────────────────────────────────── */

export const nav = [
  { label: 'Commissions', href: '#commission' },
  { label: 'About', href: '#about' },
  { label: 'Practice', href: '#practice' },
  { label: 'Collection', href: '#collection' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#connect' },
]

/* ── Hero ─────────────────────────────────────────────────────────────────────
   A full-bleed artwork with the words laid over it.

   OTHER TAGLINES, if you want to swap `emotional` for one of these:
     · Some faces deserve more than a photograph.
     · Drawn slowly, for the people who cannot be replaced.
     · Because a photograph fades. Graphite does not.
     · The ones you are afraid of forgetting.
     · Every line is somebody’s memory.
   ────────────────────────────────────────────────────────────────────────── */

export const hero = {
  eyebrow: 'Hand-made art studio · Indore, India',
  headline: ['Where art', 'flows into', 'life'],
  emotional: 'For the faces you are afraid of forgetting.',
  body:
    'Send me the photograph you cannot stop looking at — a grandmother, a first home, a dog who still waited by the door. I will spend three weeks with it, by hand, and give it back as something you can hang on a wall.',
  primary: { label: 'Commission a piece', href: '#commission' },
  secondary: { label: 'See the collection', href: '#collection' },

  // The full-bleed background artwork.
  background: { image: null, seed: 'hero-field', variant: 'graphite' }, // ✎ add your best piece
  scrim: 62, // 0–100. How dark the overlay is. Raise it if your artwork is pale.

  // The museum wall label in the corner.
  featured: { title: 'Aaji', medium: 'Graphite on acid-free sheet', size: '16 × 20 in', year: 2025 },

  stats: [
    { value: '140+', label: 'pieces delivered' }, // ✎ your real numbers
    { value: '9', label: 'states shipped to' },
    { value: '1', label: 'pair of hands' },
  ],
}

export const ribbon = [
  'graphite',
  'charcoal',
  'portraiture',
  'watercolour',
  'digital prints',
  'home decor',
  'commissions',
  'gifting',
]

/* ── Commission / custom work ─────────────────────────────────────────────────
   ⚠ PRICES BELOW ARE PLACEHOLDERS. Set your real ones in the admin panel.
   ────────────────────────────────────────────────────────────────────────── */

export const commission = {
  kicker: 'Custom work',
  headline: 'Bring me your story. Leave with it framed.',
  body:
    'Most of what I make does not exist until somebody asks for it. A wedding portrait. A father who passed. A house the family had to sell. Tell me what it is, and we will work out how to draw it.',
  steps: [
    { n: '01', title: 'Tell me about it', body: 'Send a photo and a few lines over WhatsApp. No commitment, no charge for asking.' },
    { n: '02', title: 'Sketch & approval', body: 'I share a rough layout and a fixed quote. Nothing proceeds until you are happy with both.' },
    { n: '03', title: 'Made by hand', body: 'Two to three weeks, with progress photographs as it develops so there are no surprises.' },
    { n: '04', title: 'Packed & delivered', body: 'Sealed flat, board-backed and insured. Framing available on request. Shipped across India.' },
  ],
  mediumOptions: [
    'Graphite / pencil portrait',
    'Charcoal portrait',
    'Painting (acrylic / watercolour)',
    'Digital art print',
    'Home decor piece',
    'Not sure yet — help me choose',
  ],
  sizeOptions: ['A4 (8 × 12 in)', 'A3 (12 × 16 in)', '16 × 20 in', '18 × 24 in', 'Custom size'],
  budgetOptions: ['Under ₹2,000', '₹2,000 – ₹5,000', '₹5,000 – ₹10,000', '₹10,000+', 'Tell me what it costs'],
  note: 'Commission slots are limited each month so that nothing gets rushed.',
}

/* ── Practice — "what we do" ──────────────────────────────────────────────── */

export const practice = {
  kicker: 'The practice',
  headline: 'Four ways the work arrives',
  body: 'Different mediums, same intent — something made deliberately, by hand, for a particular person.',
  items: [
    {
      id: 'graphite',
      n: '01',
      title: 'Graphite & Charcoal',
      lede: 'Portraiture, mostly.',
      body:
        'The core of the studio. Pencil and compressed charcoal on a rich quality, high-GSM, acid-free sheet — archival paper that will not yellow or go brittle with age, and that holds skin, cloth and hair better than anything else I have tried. Best for portraits, memorial pieces and wedding gifts.',
      meta: ['Portraits', 'Memorial pieces', 'Pet portraits'],
      from: '₹1,800', // ⚠ placeholder — set in admin
      seed: 'practice-graphite',
      variant: 'graphite',
      image: null,
    },
    {
      id: 'paintings',
      n: '02',
      title: 'Paintings',
      lede: 'Colour, when the subject asks for it.',
      body:
        'Acrylic and watercolour on canvas or acid-free paper. Landscapes, abstracts and larger statement pieces meant to carry a whole wall on their own.',
      meta: ['Acrylic', 'Watercolour', 'Canvas & paper'],
      from: '₹3,500', // ⚠ placeholder
      seed: 'practice-paint',
      variant: 'paint',
      image: null,
    },
    {
      id: 'digital',
      n: '03',
      title: 'Digital Art Prints',
      lede: 'Drawn once, printed properly.',
      body:
        'Illustration made on a tablet, output on archival matte paper with pigment inks. Editions stay small. Ideal when you want more than one copy, or a size that paper cannot take.',
      meta: ['Archival prints', 'Small editions', 'Any size'],
      from: '₹900', // ⚠ placeholder
      seed: 'practice-digital',
      variant: 'digital',
      image: null,
    },
    {
      id: 'decor',
      n: '04',
      title: 'Home Decor',
      lede: 'Art that has a job to do.',
      body:
        'Hand-painted nameplates, wall sets, mandala panels and gifting pieces — made to fit an actual room rather than a portfolio.',
      meta: ['Wall sets', 'Nameplates', 'Gifting'],
      from: '₹1,200', // ⚠ placeholder
      seed: 'practice-decor',
      variant: 'decor',
      image: null,
    },
  ],
}

/* ── Collection — the shop ────────────────────────────────────────────────────
   ⚠ ALL PRICES ARE PLACEHOLDERS. Set them in the admin panel.
   ────────────────────────────────────────────────────────────────────────── */

export const collectionMeta = {
  kicker: 'The collection',
  headline: 'Available now',
  body:
    'Original pieces and open prints, ready to ship. Tap any work to see it larger — buying happens over WhatsApp, so you can ask questions before you pay.',
}

export const filters = [
  { id: 'all', label: 'Everything' },
  { id: 'graphite', label: 'Graphite & Charcoal' },
  { id: 'paintings', label: 'Paintings' },
  { id: 'digital', label: 'Digital Prints' },
  { id: 'decor', label: 'Home Decor' },
]

export const artworks = [
  {
    id: 'w1',
    title: 'Aaji',
    category: 'graphite',
    medium: 'Graphite on high-GSM acid-free sheet',
    size: '16 × 20 in',
    year: 2025,
    price: 6500,
    status: 'available', // 'available' | 'sold' | 'made-to-order'
    note: 'Original. One of one — this piece cannot be reprinted.',
    tall: true,
    seed: 'w1',
    variant: 'graphite',
    image: null,
  },
  {
    id: 'w2',
    title: 'Monsoon, Third Floor',
    category: 'paintings',
    medium: 'Acrylic on canvas',
    size: '18 × 24 in',
    year: 2025,
    price: 9800,
    status: 'available',
    note: 'Gallery-wrapped, ready to hang without a frame.',
    seed: 'w2',
    variant: 'paint',
    image: null,
  },
  {
    id: 'w3',
    title: 'Static Bloom',
    category: 'digital',
    medium: 'Pigment print on archival matte, edition of 25',
    size: '12 × 16 in',
    year: 2026,
    price: 1600,
    status: 'available',
    note: 'Signed and numbered. Larger sizes on request.',
    seed: 'w3',
    variant: 'digital',
    image: null,
  },
  {
    id: 'w4',
    title: 'Threshold',
    category: 'decor',
    medium: 'Hand-painted wooden panel',
    size: '10 × 24 in',
    year: 2025,
    price: 2400,
    status: 'made-to-order',
    note: 'Made to order — your name or text hand-lettered in.',
    seed: 'w4',
    variant: 'decor',
    image: null,
  },
  {
    id: 'w5',
    title: 'The Long Wait',
    category: 'graphite',
    medium: 'Charcoal on toned acid-free sheet',
    size: '12 × 16 in',
    year: 2024,
    price: 4200,
    status: 'sold',
    note: 'Sold. A similar piece can be commissioned.',
    seed: 'w5',
    variant: 'graphite',
    image: null,
  },
  {
    id: 'w6',
    title: 'Kanha, After Rain',
    category: 'paintings',
    medium: 'Watercolour on high-GSM acid-free sheet',
    size: '11 × 15 in',
    year: 2025,
    price: 5200,
    status: 'available',
    note: 'Unframed. Ships flat with board backing.',
    tall: true,
    seed: 'w6',
    variant: 'paint',
    image: null,
  },
  {
    id: 'w7',
    title: 'Signal / Noise',
    category: 'digital',
    medium: 'Pigment print on archival matte, edition of 25',
    size: '16 × 16 in',
    year: 2026,
    price: 1900,
    status: 'available',
    note: 'Part of a three-piece set — ask about the full set.',
    seed: 'w7',
    variant: 'digital',
    image: null,
  },
  {
    id: 'w8',
    title: 'Bagh Print Study I',
    category: 'decor',
    medium: 'Acrylic on MDF, set of three',
    size: '8 × 8 in each',
    year: 2025,
    price: 3600,
    status: 'available',
    note: 'Sold as a set of three. Mounting hardware included.',
    seed: 'w8',
    variant: 'decor',
    image: null,
  },
  {
    id: 'w9',
    title: 'Baba',
    category: 'graphite',
    medium: 'Graphite on high-GSM acid-free sheet',
    size: '12 × 16 in',
    year: 2026,
    price: 4800,
    status: 'available',
    note: 'Original. Framing available at extra cost.',
    seed: 'w9',
    variant: 'graphite',
    image: null,
  },
]

/* ── Commissions delivered + reviews ──────────────────────────────────────────
   ⚠ THESE ARE WRITTEN EXAMPLES, NOT REAL CUSTOMERS.

   You control this section. Visitors press "Leave a review", which sends their
   words to you on WhatsApp — you then add the good ones in the admin panel.
   Nothing appears here that you did not put here.

   Replace every entry below with real words from real buyers before you launch.
   ────────────────────────────────────────────────────────────────────────── */

export const reviewsMeta = {
  kicker: 'Delivered',
  headline: 'Made for somebody, already',
  body:
    'Every piece below left the studio and went to a real wall. The words are theirs, lightly trimmed for length.',
  trust: [
    { value: '140+', label: 'commissions completed' }, // ✎ your real numbers
    { value: '4.9', label: 'average rating' },
    { value: '38%', label: 'come back for a second piece' },
  ],
  ctaTitle: 'Bought something from me?',
  ctaBody: 'Send me a line about it on WhatsApp. If you are happy for it to appear here, I will add it.',
  ctaLabel: 'Leave a review',

  /* Shows a visible "these are samples" banner above the reviews.
     Turn it OFF in the admin panel (Reviews tab) the moment you have replaced
     the examples below with real customers' words. Until then it stays on, so
     nobody who sees this site mistakes invented testimonials for real ones. */
  sampleNotice: true,
  sampleNoticeText:
    'Sample content — these reviews are placeholders written to show the layout, not real customers. They will be replaced with genuine ones.',
}

export const reviews = [
  {
    id: 'r1',
    name: 'Sneha Deshpande',
    city: 'Pune',
    rating: 5,
    piece: 'Graphite portrait of her grandmother, 16 × 20 in',
    quote:
      'I sent a blurry photo from 1978 and honestly expected a nice drawing. What came back looked at me the way she used to. My mother cried. That is the whole review.',
    seed: 'r1',
    variant: 'graphite',
    image: null,
  },
  {
    id: 'r2',
    name: 'Arjun Menon',
    city: 'Bengaluru',
    rating: 5,
    piece: 'Wedding portrait, charcoal on toned sheet',
    quote:
      'He asked more questions about our relationship than about the photograph, which I did not expect. It shows in the result. Delivered four days ahead of the date he promised.',
    seed: 'r2',
    variant: 'graphite',
    image: null,
  },
  {
    id: 'r3',
    name: 'Ritika Sharma',
    city: 'Delhi',
    rating: 5,
    piece: 'Set of three hand-painted decor panels',
    quote:
      'I have ordered from four different online art sellers. This is the only one where a person actually replied to me, sent progress photos, and packed it like it mattered.',
    seed: 'r3',
    variant: 'decor',
    image: null,
  },
  {
    id: 'r4',
    name: 'Faizan Qureshi',
    city: 'Bhopal',
    rating: 4,
    piece: 'Digital illustration + archival print, 16 × 16 in',
    quote:
      'Took a little longer than the estimate because I kept changing my mind about the background. He never once made me feel like a nuisance about it. Print quality is genuinely excellent.',
    seed: 'r4',
    variant: 'digital',
    image: null,
  },
  {
    id: 'r5',
    name: 'Meera Iyer',
    city: 'Kochi',
    rating: 5,
    piece: 'Pet portrait in graphite, A3',
    quote:
      'We lost our dog in March. I could not look at photographs of him. Somehow I can look at this. Thank you for taking it seriously.',
    seed: 'r5',
    variant: 'graphite',
    image: null,
  },
  {
    id: 'r6',
    name: 'Anand & Priya',
    city: 'Nagpur',
    rating: 5,
    piece: 'Acrylic painting of their first home, 18 × 24 in',
    quote:
      'We sold the house last year. This hangs in the new one. Everyone who visits asks about it, and we get to tell the story again.',
    seed: 'r6',
    variant: 'paint',
    image: null,
  },
]

/* ── Connect / mailing list ───────────────────────────────────────────────── */

export const connect = {
  kicker: 'Stay in the stream',
  headline: 'Get first look at new work',
  body:
    'New pieces usually sell before they reach Instagram. Leave your details and I will message you directly when something comes off the desk — new drops, studio sales, and open commission slots.',
  promise: 'A few messages a year. No forwards, no spam, and I will never pass your number on.',
}

/* ── Footer ───────────────────────────────────────────────────────────────── */

export const footer = {
  line: 'Every piece on this site was made by one person, by hand, in Indore.',
  legal: [
    { label: 'Shipping & returns', href: '#connect' },
    { label: 'Commission terms', href: '#commission' },
  ],
}
