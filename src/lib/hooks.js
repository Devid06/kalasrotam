import { useCallback, useEffect, useRef, useState } from 'react'

/* ── Motion preference ────────────────────────────────────────────────────────
   Every animation on the site checks this. Someone who gets motion sickness
   from parallax should still be able to use the shop. */

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/* ── Reveal on scroll ─────────────────────────────────────────────────────────
   Returns a ref and a boolean. Unobserves after the first reveal so elements
   don't re-animate when you scroll back up — that reads as a glitch. */

export function useInView({ threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView]
}

/* ── Scroll position ──────────────────────────────────────────────────────── */

export function useScrolled(offset = 40) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}

/* ── Which section am I looking at ────────────────────────────────────────────
   Drives the underline in the nav. Picks the section whose top is closest to
   just under the header, which behaves better than a plain IntersectionObserver
   when sections differ wildly in height. */

export function useScrollSpy(ids, offset = 120) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    let frame = null
    const update = () => {
      frame = null
      let current = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - offset <= 0) current = id
      }
      // At the very bottom of the page, force the last section active — the
      // footer is short and would otherwise never light up.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
        current = ids[ids.length - 1]
      }
      setActive(current)
    }
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ids, offset])

  return active
}

/* ── Body scroll lock ─────────────────────────────────────────────────────────
   Compensates for the scrollbar's width so the page doesn't jump sideways when
   a modal opens. */

export function useBodyLock(locked) {
  useEffect(() => {
    if (!locked) return
    const { overflow, paddingRight } = document.body.style
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}

/* ── Escape to close ──────────────────────────────────────────────────────── */

export function useEscape(active, onEscape) {
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onEscape])
}

/* ── Pointer parallax ─────────────────────────────────────────────────────────
   Writes CSS custom properties instead of React state — this runs on every
   mouse move, and re-rendering the hero 60 times a second would be wasteful.
   Disabled entirely on touch and under reduced-motion. */

export function usePointerParallax(enabled = true) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let frame = null
    let tx = 0
    let ty = 0

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - (r.left + r.width / 2)) / r.width
      ty = (e.clientY - (r.top + r.height / 2)) / r.height
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          frame = null
          el.style.setProperty('--px', tx.toFixed(4))
          el.style.setProperty('--py', ty.toFixed(4))
        })
      }
    }
    const onLeave = () => {
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])

  return ref
}

/* ── Smooth in-page navigation ────────────────────────────────────────────────
   Sections carry `scroll-margin-top` in CSS so the sticky header never covers
   a heading. Also moves keyboard focus to the target, which plain anchor
   scrolling does not do reliably. */

export function useSmoothScroll() {
  return useCallback((href) => {
    const el = document.querySelector(href)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
    if (history.replaceState) history.replaceState(null, '', href)
  }, [])
}
