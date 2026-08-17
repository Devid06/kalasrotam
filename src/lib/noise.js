/* ============================================================================
   VALUE NOISE
   ----------------------------------------------------------------------------
   Shared by the hero's live ink current and by the generated artwork studies,
   so both are literally the same field — the studies read as frozen moments of
   the stream running behind the headline.

   Full Perlin would be overkill: the field only needs to be smooth and
   non-repeating, not perfectly isotropic.
   ========================================================================== */

export function makeNoise(seed = 1) {
  const perm = new Uint8Array(512)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i

  // Deterministic shuffle, so a given seed always produces the same field.
  let s = seed >>> 0
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = p[i]
    p[i] = p[j]
    p[j] = t
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a, b, t) => a + (b - a) * t
  const grad = (h, x, y) => (h & 1 ? x : -x) + (h & 2 ? y : -y)

  return function noise2(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)
    const aa = perm[perm[X] + Y]
    const ab = perm[perm[X] + Y + 1]
    const ba = perm[perm[X + 1] + Y]
    const bb = perm[perm[X + 1] + Y + 1]
    return (
      lerp(
        lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v
      ) * 0.5
    )
  }
}

/* ── Seeded randomness ────────────────────────────────────────────────────── */

/** FNV-1a — turns a seed string into a 32-bit integer. */
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

/** mulberry32 — small, fast, well-distributed PRNG. */
export function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The little toolkit every generator draws with. */
export function makeRng(seed) {
  const rand = mulberry32(hashString(String(seed)))
  return {
    rand,
    range: (lo, hi) => lo + rand() * (hi - lo),
    int: (lo, hi) => Math.floor(lo + rand() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
    chance: (p) => rand() < p,
  }
}
