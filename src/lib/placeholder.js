/* ============================================================================
   PROCEDURAL ART PLACEHOLDERS
   ----------------------------------------------------------------------------
   Grey boxes make a gallery look unfinished. Instead, every artwork without a
   real photograph gets its own generated study, drawn as an SVG in the studio
   palette.

   Each one is a flow-field drawing: hundreds of strokes carried through the
   same noise field that animates the hero. So the studies are literally frozen
   moments of the stream — the studio's name, made visible.

   The output is deterministic: the same `seed` always produces the same image,
   so the gallery does not reshuffle itself between visits and each piece keeps
   its identity.

   All of this disappears the moment you set a real `image` in src/data/site.js.
   ========================================================================== */

import { makeNoise, makeRng, hashString } from './noise.js'

/* ── Palette ──────────────────────────────────────────────────────────────── */

/* Kept in step with the CSS tokens in styles/base.css. */
const P = {
  paperCool: '#EDE8DC',
  paperWarm: '#F1E7D2',
  ink: '#12100C',
  stone: '#6B6154',
  brass: '#C08A3C',
  brassLite: '#DDB570',
  terracotta: '#B25A33',
  sage: '#6F7D61',
  night: '#0F0D0A',
  cream: '#F0E6D3',
}

/* ── Flow-field engine ────────────────────────────────────────────────────── */

/**
 * Traces strokes through the noise field.
 *
 * `density` shapes the composition: it returns 0–1 for a candidate start point,
 * and low values are rejected. That is what gives each study a subject — a
 * dense mass, a band, a diagonal sweep — instead of an even wash of lines.
 */
function traceLines(r, noise, w, h, cfg) {
  const lines = []
  const maxAttempts = cfg.count * 14
  let attempts = 0

  while (lines.length < cfg.count && attempts < maxAttempts) {
    attempts++
    const sx = r.range(-w * 0.06, w * 1.06)
    const sy = r.range(-h * 0.06, h * 1.06)
    if (r.rand() > cfg.density(sx, sy)) continue

    let x = sx
    let y = sy
    const pts = [[x, y]]

    for (let s = 0; s < cfg.steps; s++) {
      const a = noise(x * cfg.scale, y * cfg.scale) * Math.PI * cfg.turbulence + cfg.bias
      x += Math.cos(a) * cfg.step
      y += Math.sin(a) * cfg.step
      if (x < -w * 0.12 || x > w * 1.12 || y < -h * 0.12 || y > h * 1.12) break
      pts.push([x, y])
    }

    if (pts.length > 4) lines.push(pts)
  }
  return lines
}

/** Integer coordinates keep the data URI small without any visible loss. */
function toPath(pts) {
  let d = `M${Math.round(pts[0][0])},${Math.round(pts[0][1])}`
  for (let i = 1; i < pts.length; i++) d += `L${Math.round(pts[i][0])},${Math.round(pts[i][1])}`
  return d
}

/**
 * Splits strokes across a few weight/opacity tiers and emits one <g> per tier,
 * so stroke attributes are written once rather than on every path. Tiering is
 * also what makes the drawing read as hand-made — a uniform line weight looks
 * plotted, a varied one looks drawn.
 */
function strokeGroups(r, lines, tiers) {
  const buckets = tiers.map(() => [])
  for (const line of lines) {
    // Weighted pick, so most strokes are fine and only a few are heavy.
    let roll = r.rand()
    let idx = 0
    for (let i = 0; i < tiers.length; i++) {
      roll -= tiers[i].share
      if (roll <= 0) {
        idx = i
        break
      }
      idx = i
    }
    buckets[idx].push(toPath(line))
  }
  return buckets
    .map((paths, i) =>
      paths.length
        ? `<g fill='none' stroke='${tiers[i].color}' stroke-width='${tiers[i].width}' stroke-opacity='${tiers[i].opacity}' stroke-linecap='round'>` +
          paths.map((d) => `<path d='${d}'/>`).join('') +
          `</g>`
        : ''
    )
    .join('')
}

/* ── Composition shapes ──────────────────────────────────────────────────────
   Each returns a density function. Picking one per seed is what stops four
   graphite pieces in a row from looking like the same drawing. */

function composition(r, w, h) {
  const kind = r.pick(['mass', 'band', 'diagonal', 'field', 'twin'])

  if (kind === 'mass') {
    const cx = w * r.range(0.36, 0.64)
    const cy = h * r.range(0.36, 0.58)
    const rad = Math.min(w, h) * r.range(0.42, 0.6)
    return {
      kind,
      focus: [cx, cy, rad],
      density: (x, y) => {
        const d = Math.hypot(x - cx, y - cy) / rad
        return Math.max(0.06, 1 - d * d)
      },
    }
  }

  if (kind === 'band') {
    const cy = h * r.range(0.34, 0.64)
    const thick = h * r.range(0.2, 0.34)
    return {
      kind,
      focus: [w / 2, cy, thick * 1.4],
      density: (x, y) => Math.max(0.05, 1 - Math.abs(y - cy) / thick),
    }
  }

  if (kind === 'diagonal') {
    const dir = r.chance(0.5) ? 1 : -1
    const spread = Math.min(w, h) * r.range(0.35, 0.5)
    return {
      kind,
      focus: [w / 2, h / 2, spread * 1.5],
      density: (x, y) => {
        const t = (x / w) * dir + y / h
        const centre = dir > 0 ? 1 : 0.5
        return Math.max(0.05, 1 - Math.abs(t - centre) * (w / spread) * 0.32)
      },
    }
  }

  if (kind === 'twin') {
    const a = [w * r.range(0.2, 0.36), h * r.range(0.24, 0.42)]
    const b = [w * r.range(0.62, 0.82), h * r.range(0.56, 0.78)]
    const rad = Math.min(w, h) * r.range(0.3, 0.42)
    return {
      kind,
      focus: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, rad * 1.7],
      density: (x, y) => {
        const da = Math.hypot(x - a[0], y - a[1]) / rad
        const db = Math.hypot(x - b[0], y - b[1]) / rad
        return Math.max(0.06, 1 - Math.min(da, db) ** 2)
      },
    }
  }

  return { kind, focus: [w / 2, h / 2, Math.min(w, h) * 0.6], density: () => 0.9 }
}

/* ── Shared SVG pieces ────────────────────────────────────────────────────── */

const round = (v) => Math.round(v)

/** Soft tonal masses behind the linework, so the drawing has depth. */
function washes(r, w, h, focus, color, count = 3, strength = 0.16) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const cx = focus ? focus[0] + r.range(-w * 0.18, w * 0.18) : r.range(0, w)
    const cy = focus ? focus[1] + r.range(-h * 0.18, h * 0.18) : r.range(0, h)
    const rx = Math.min(w, h) * r.range(0.2, 0.45)
    const ry = rx * r.range(0.7, 1.3)
    out += `<ellipse cx='${round(cx)}' cy='${round(cy)}' rx='${round(rx)}' ry='${round(ry)}' fill='${color}' opacity='${(strength * r.range(0.5, 1)).toFixed(2)}' filter='url(#soft)'/>`
  }
  return out
}

function defs(extra = '') {
  return (
    `<defs>` +
    `<filter id='soft' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='70'/></filter>` +
    `<filter id='grain'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='11'/><feColorMatrix type='saturate' values='0'/></filter>` +
    `<radialGradient id='vig' cx='50%' cy='44%' r='74%'><stop offset='58%' stop-color='#000' stop-opacity='0'/><stop offset='100%' stop-color='#000' stop-opacity='0.22'/></radialGradient>` +
    extra +
    `</defs>`
  )
}

/* ── Variant: graphite / charcoal ─────────────────────────────────────────── */

function graphiteStudy(r, noise, w, h) {
  const comp = composition(r, w, h)
  const lines = traceLines(r, noise, w, h, {
    count: 170,
    steps: 26,
    step: Math.min(w, h) * 0.018,
    scale: 0.0018,
    turbulence: 3,
    bias: 0,
    density: comp.density,
  })

  const groups = strokeGroups(r, lines, [
    { color: P.ink, width: 0.7, opacity: 0.3, share: 0.5 },
    { color: P.ink, width: 1.5, opacity: 0.4, share: 0.32 },
    { color: P.ink, width: 3, opacity: 0.5, share: 0.13 },
    { color: P.ink, width: 6, opacity: 0.55, share: 0.05 },
  ])

  return {
    body:
      `<rect width='${w}' height='${h}' fill='${P.paperCool}'/>` +
      washes(r, w, h, comp.focus, P.stone, 3, 0.3) +
      washes(r, w, h, comp.focus, P.ink, 1, 0.16) +
      groups,
    grain: 0.2,
  }
}

/* ── Variant: paint ───────────────────────────────────────────────────────── */

function paintStudy(r, noise, w, h) {
  const comp = composition(r, w, h)
  const lines = traceLines(r, noise, w, h, {
    count: 46,
    steps: 22,
    step: Math.min(w, h) * 0.03,
    scale: 0.0013,
    turbulence: 2.4,
    bias: 0,
    density: comp.density,
  })

  const hues = [P.terracotta, P.sage, P.brass, P.stone, P.ink]
  const a = r.pick(hues)
  const b = r.pick(hues.filter((c) => c !== a))
  const c = r.pick(hues.filter((x) => x !== a && x !== b))

  const groups = strokeGroups(r, lines, [
    { color: a, width: 26, opacity: 0.4, share: 0.4 },
    { color: b, width: 14, opacity: 0.45, share: 0.34 },
    { color: c, width: 44, opacity: 0.3, share: 0.18 },
    { color: P.ink, width: 5, opacity: 0.45, share: 0.08 },
  ])

  return {
    body:
      `<rect width='${w}' height='${h}' fill='${P.paperWarm}'/>` +
      washes(r, w, h, null, a, 2, 0.42) +
      washes(r, w, h, comp.focus, b, 2, 0.36) +
      washes(r, w, h, null, c, 1, 0.3) +
      groups,
    grain: 0.18,
  }
}

/* ── Variant: digital ────────────────────────────────────────────────────────
   Deliberately the opposite of the others: dark ground, exact geometry, hard
   edges — so the print work reads as a different discipline at a glance. */

function digitalStudy(r, noise, w, h) {
  const comp = composition(r, w, h)
  const lines = traceLines(r, noise, w, h, {
    count: 130,
    steps: 24,
    step: Math.min(w, h) * 0.022,
    scale: 0.0016,
    turbulence: 2.6,
    bias: 0,
    density: comp.density,
  })

  const groups = strokeGroups(r, lines, [
    { color: P.cream, width: 0.7, opacity: 0.3, share: 0.5 },
    { color: P.brass, width: 1.4, opacity: 0.55, share: 0.3 },
    { color: P.brassLite, width: 2.6, opacity: 0.5, share: 0.15 },
    { color: P.terracotta, width: 5, opacity: 0.5, share: 0.05 },
  ])

  const cx = w / 2
  const cy = h * r.range(0.4, 0.56)
  const base = Math.min(w, h)

  let geometry = ''
  const ringCount = r.int(3, 6)
  for (let i = 0; i < ringCount; i++) {
    const rad = base * (0.18 + i * r.range(0.07, 0.11))
    const dash = r.chance(0.5) ? ` stroke-dasharray='${round(r.range(3, 26))} ${round(r.range(8, 34))}'` : ''
    geometry += `<circle cx='${round(cx)}' cy='${round(cy)}' r='${round(rad)}' fill='none' stroke='${P.brass}' stroke-width='1.2' opacity='${r.range(0.3, 0.7).toFixed(2)}'${dash}/>`
  }
  geometry += `<circle cx='${round(cx)}' cy='${round(cy)}' r='${round(base * r.range(0.1, 0.15))}' fill='url(#disc)'/>`

  const bandCount = r.int(3, 7)
  for (let i = 0; i < bandCount; i++) {
    const y = r.range(0, h)
    geometry += `<rect x='0' y='${round(y)}' width='${w}' height='${round(r.range(1, 4))}' fill='${P.cream}' opacity='${r.range(0.06, 0.18).toFixed(2)}'/>`
  }

  const gradient = `<radialGradient id='disc' cx='36%' cy='32%' r='78%'><stop offset='0%' stop-color='${P.brassLite}'/><stop offset='58%' stop-color='${P.brass}'/><stop offset='100%' stop-color='${P.night}'/></radialGradient>`

  return {
    extraDefs: gradient,
    body: `<rect width='${w}' height='${h}' fill='${P.night}'/>` + groups + geometry,
    grain: 0.1,
  }
}

/* ── Variant: decor ──────────────────────────────────────────────────────────
   Symmetry, an inset border, a repeating motif — the language of something
   made to fit a particular wall. One wedge is traced, then rotated by <use>,
   which is both how real ornament is built and far smaller in the file. */

function decorStudy(r, noise, w, h) {
  const cx = w / 2
  const cy = h / 2
  const folds = r.pick([6, 8, 10, 12])
  const wedge = Math.PI / folds
  const maxR = Math.min(w, h) * 0.46

  // Only trace inside one wedge; the rotations fill the rest of the frame.
  const lines = traceLines(r, noise, w, h, {
    count: Math.round(120 / folds) + 8,
    steps: 22,
    step: Math.min(w, h) * 0.016,
    scale: 0.0022,
    turbulence: 3,
    bias: 0,
    density: (x, y) => {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.hypot(dx, dy)
      if (dist > maxR || dist < maxR * 0.1) return 0
      const ang = Math.atan2(dy, dx)
      return Math.abs(ang) < wedge ? 1 : 0
    },
  })

  const groups = strokeGroups(r, lines, [
    { color: P.ink, width: 1, opacity: 0.45, share: 0.55 },
    { color: P.brass, width: 2, opacity: 0.6, share: 0.3 },
    { color: P.terracotta, width: 3.5, opacity: 0.5, share: 0.15 },
  ])

  let uses = ''
  for (let i = 1; i < folds * 2; i++) {
    const angle = (i * 360) / (folds * 2)
    uses += `<use href='#wedge' transform='rotate(${angle.toFixed(1)} ${round(cx)} ${round(cy)})'/>`
  }

  const inset = Math.min(w, h) * 0.07

  return {
    extraDefs: `<g id='wedge'>${groups}</g>`,
    body:
      `<rect width='${w}' height='${h}' fill='${P.paperWarm}'/>` +
      washes(r, w, h, [cx, cy, maxR], P.brass, 2, 0.22) +
      `<use href='#wedge'/>${uses}` +
      `<circle cx='${round(cx)}' cy='${round(cy)}' r='${round(maxR * 0.13)}' fill='${P.terracotta}' opacity='0.8'/>` +
      `<rect x='${round(inset)}' y='${round(inset)}' width='${round(w - inset * 2)}' height='${round(h - inset * 2)}' fill='none' stroke='${P.ink}' stroke-width='2' opacity='0.28'/>` +
      `<rect x='${round(inset * 1.6)}' y='${round(inset * 1.6)}' width='${round(w - inset * 3.2)}' height='${round(h - inset * 3.2)}' fill='none' stroke='${P.brass}' stroke-width='1' opacity='0.45'/>`,
    grain: 0.16,
  }
}

/* ── Assembly ─────────────────────────────────────────────────────────────── */

const GENERATORS = {
  graphite: graphiteStudy,
  paint: paintStudy,
  digital: digitalStudy,
  decor: decorStudy,
}

/**
 * Minimal data-URI encoding. encodeURIComponent would inflate every space and
 * comma in the path data threefold; these drawings are mostly path data, so
 * only the characters that genuinely need escaping are escaped.
 */
function encodeSvg(svg) {
  return svg.replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')
}

const cache = new Map()

/**
 * Returns a data-URI SVG "study" for a placeholder artwork.
 *
 * @param {string} seed     Any stable string — the artwork id works well.
 * @param {string} variant  'graphite' | 'paint' | 'digital' | 'decor'
 * @param {number} w        Intrinsic width  (aspect ratio only; SVG scales)
 * @param {number} h        Intrinsic height
 */
export function artStudy(seed, variant = 'graphite', w = 900, h = 1200) {
  const key = `${seed}|${variant}|${w}x${h}`
  const hit = cache.get(key)
  if (hit) return hit

  const r = makeRng(seed)
  // Offsetting the noise seed from the RNG seed keeps the field and the
  // composition choices independent, which gives far more variety.
  const noise = makeNoise(hashString(`${seed}-field`))

  const generate = GENERATORS[variant] || GENERATORS.graphite
  const { body, extraDefs = '', grain = 0.2 } = generate(r, noise, w, h)

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}' role='presentation'>` +
    defs(extraDefs) +
    body +
    `<rect width='${w}' height='${h}' filter='url(#grain)' opacity='${grain}' style='mix-blend-mode:multiply'/>` +
    `<rect width='${w}' height='${h}' fill='url(#vig)'/>` +
    `</svg>`

  const uri = `data:image/svg+xml;charset=utf-8,${encodeSvg(svg)}`
  cache.set(key, uri)
  return uri
}
