import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/hooks.js'
import { makeNoise } from '../lib/noise.js'

/* ============================================================================
   INK FLOW
   ----------------------------------------------------------------------------
   Kalasrotam means "a stream of art". So the hero's background is an actual
   current: hundreds of ink particles carried along a slowly-rotating flow
   field, leaving trails on paper the way ink does in water.

   Deliberate constraints:
     • Trails fade gradually rather than being cleared — that is what produces
       the wash rather than a swarm of moving dots.
     • The field itself rotates over time, so the current never settles into a
       fixed pattern you can notice repeating.
     • Stops completely when off-screen, on a hidden tab, or under
       prefers-reduced-motion (where it paints one still frame instead).

   Two tones:
     'paper'  dark strokes laid onto an opaque cream ground
     'night'  light strokes over whatever is behind it, on a transparent
              canvas — used over the hero's full-bleed artwork
   ========================================================================== */

/* ── Component ────────────────────────────────────────────────────────────── */

export default function InkFlow({ tone = 'paper' }) {
  const canvasRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const night = tone === 'night'
    const noise = makeNoise(20260815)

    const PAPER = '247, 240, 225'
    // Graphite only on paper. Brass was in here originally and looked right for
    // a few seconds — but trails accumulate over hundreds of frames, and the
    // warm pigment built up until the whole hero read yellow-green rather than
    // pencil on paper. Over the dark artwork the same restraint applies, in
    // light values.
    const INKS = night
      ? [
          'rgba(247, 240, 225, ALPHA)', // paper
          'rgba(221, 181, 112, ALPHA)', // brass-lite
          'rgba(200, 190, 172, ALPHA)', // dim cream
        ]
      : [
          'rgba(18, 16, 12, ALPHA)', // ink
          'rgba(43, 36, 27, ALPHA)', // warm ink
          'rgba(107, 97, 84, ALPHA)', // stone
        ]

    let width = 0
    let height = 0
    let dpr = 1
    let particles = []
    let raf = null
    let running = false
    let t = 0

    const spawn = () => ({
      // Weighted toward the left edge so particles enter and cross, rather than
      // appearing uniformly and reading as a static texture.
      x: Math.random() < 0.35 ? -Math.random() * width * 0.15 : Math.random() * width,
      y: Math.random() * height,
      life: Math.random() * 260,
      maxLife: 180 + Math.random() * 220,
      color: INKS[Math.random() < 0.55 ? 0 : Math.random() < 0.75 ? 1 : 2],
      weight: 0.35 + Math.random() * 1.4,
      speed: 0.35 + Math.random() * 0.85,
    })

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      // Capping DPR at 1.5 keeps this cheap on phones without visible aliasing.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Particle count scales with area, so a phone does not run a desktop load.
      const target = Math.round(Math.min(520, Math.max(90, (width * height) / 2600)))
      particles = Array.from({ length: target }, spawn)

      if (night) ctx.clearRect(0, 0, width, height)
      else {
        ctx.fillStyle = `rgb(${PAPER})`
        ctx.fillRect(0, 0, width, height)
      }
    }

    /**
     * Fades the previous frame.
     *
     * On paper we lay a translucent sheet of the background over everything.
     * Over the artwork there is no background to lay down — painting anything
     * opaque would hide the piece — so we erase instead, with 'destination-out'
     * lowering the alpha of what is already drawn and leaving the photograph
     * underneath untouched.
     */
    const fadeFrame = () => {
      if (night) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.045)'
        ctx.fillRect(0, 0, width, height)
        ctx.globalCompositeOperation = 'source-over'
      } else {
        ctx.fillStyle = `rgba(${PAPER}, 0.035)`
        ctx.fillRect(0, 0, width, height)
      }
    }

    const step = () => {
      fadeFrame()

      t += 0.0009

      for (const p of particles) {
        // A gentle field plus a constant rightward drift. Without the drift the
        // particles curl in place and read as grass; with it, they read as a
        // current moving across the page — which is the whole point.
        const angle = noise(p.x * 0.0011, p.y * 0.0011 + t) * Math.PI * 2
        const nx = p.x + (Math.cos(angle) * 0.65 + 0.75) * p.speed * 2.4
        const ny = p.y + Math.sin(angle) * 0.9 * p.speed * 2.4

        // Fade in and out over the particle's life so nothing pops or cuts.
        const fade = Math.sin((p.life / p.maxLife) * Math.PI)
        const alpha = Math.max(0, fade) * (night ? 0.16 : 0.1)

        ctx.strokeStyle = p.color.replace('ALPHA', alpha.toFixed(3))
        ctx.lineWidth = p.weight
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(nx, ny)
        ctx.stroke()

        p.x = nx
        p.y = ny
        p.life++

        if (p.life > p.maxLife || p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) {
          Object.assign(p, spawn(), { life: 0 })
        }
      }

      raf = requestAnimationFrame(step)
    }

    /** One still frame — what reduced-motion users get instead of the animation. */
    const paintStill = () => {
      if (night) ctx.clearRect(0, 0, width, height)
      else {
        ctx.fillStyle = `rgb(${PAPER})`
        ctx.fillRect(0, 0, width, height)
      }
      for (let i = 0; i < 900; i++) {
        const p = spawn()
        let { x, y } = p
        ctx.strokeStyle = p.color.replace('ALPHA', night ? '0.07' : '0.04')
        ctx.lineWidth = p.weight
        ctx.beginPath()
        ctx.moveTo(x, y)
        for (let s = 0; s < 30; s++) {
          const angle = noise(x * 0.0011, y * 0.0011) * Math.PI * 2
          x += Math.cos(angle) * 0.65 + 0.75
          y += Math.sin(angle) * 0.9
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    const start = () => {
      if (running || reduced) return
      running = true
      raf = requestAnimationFrame(step)
    }
    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = null
    }

    resize()
    if (reduced) {
      paintStill()
    } else {
      start()
    }

    // Only run while the hero is actually on screen.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 })
    io.observe(canvas)

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    // Debounced, because a window drag fires resize continuously and each one
    // reallocates the particle array.
    let resizeTimer = null
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resize()
        if (reduced) paintStill()
      }, 180)
    }
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
    }
  }, [reduced, tone])

  return <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
}
