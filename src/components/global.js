import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export default function () {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (!reducedMotion) initLenis()
  initFadeAnimations(reducedMotion)
}

// ───────────────────────── Lenis smooth scroll ──────────────────────────

function initLenis() {
  const lenis = new Lenis({
    lerp: 0.1,
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  })

  // Drive Lenis off GSAP's RAF so every animation shares one loop and
  // ScrollTrigger reads the latest scroll position before each tick.
  if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update)
    }
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  } else {
    const raf = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }

  window.__lenis = lenis

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]')
    if (!link) return
    if (link.target === '_blank' || link.hasAttribute('download')) return
    const href = link.getAttribute('href')
    if (!href || href === '#') return
    const target = document.querySelector(href)
    if (!target) return
    e.preventDefault()
    lenis.scrollTo(target, { offset: 0 })
    history.pushState(null, '', href)
    if (target.hasAttribute('tabindex')) {
      target.focus({ preventScroll: true })
    } else {
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
  })
}

// ───────────────────────── Fade-in / scroll-reveal ──────────────────────
//
// Wrappers carrying one of these data-components animate on scroll-enter:
//   fade-in, fade-up, fade-blur, fade-stagger
//
// Stagger is automatic when the wrapper has 2+ direct children. Per-instance
// overrides via data-fade-delay / duration / distance / stagger / ease.
//
// The CSS hidden states (anti-FOUC) live in embeds/global-animations.css.
// Adding `.is-ready` releases the cascade so GSAP can take over.

const FADE_DEFAULTS = {
  duration: 0.8,
  delay: 0,
  ease: 'power3.out',
  stagger: 0.08,
  start: 'top 85%',
}

const FADE_VARIANTS = {
  'fade-in': { from: () => ({ opacity: 0 }) },
  'fade-up': { from: (d) => ({ y: d.distance ?? 24, opacity: 0 }) },
  'fade-blur': {
    from: (d) => ({
      filter: `blur(${d.distance ?? 12}px)`,
      opacity: 0,
    }),
    to: { filter: 'blur(0px)' },
  },
  'fade-stagger': {
    // Slow, leisurely cascade — small travel, generous rhythm.
    from: (d) => ({ y: d.distance ?? 12, opacity: 0 }),
    defaultStagger: 0.2,
    defaultDuration: 1.1,
    defaultEase: 'power2.out',
  },
}

const FADE_VARIANT_NAMES = Object.keys(FADE_VARIANTS)

function initFadeAnimations(reducedMotion) {
  // If we can't / won't animate, the CSS still has every wrapper hidden via
  // :not(.is-ready). Release them so content remains visible.
  const releaseAll = () =>
    FADE_VARIANT_NAMES.forEach((name) => {
      document
        .querySelectorAll(`[data-component="${name}"]`)
        .forEach((el) => el.classList.add('is-ready'))
    })

  if (reducedMotion) return releaseAll()
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn(
      '[global-animations] GSAP / ScrollTrigger missing — skipping fade animations'
    )
    return releaseAll()
  }

  FADE_VARIANT_NAMES.forEach((name) => {
    document
      .querySelectorAll(`[data-component="${name}"]`)
      .forEach((el) => initStandardFade(el, name))
  })
}

function readFadeConfig(el) {
  return {
    duration: parseFloat(el.dataset.fadeDuration) || null,
    delay: parseFloat(el.dataset.fadeDelay) || FADE_DEFAULTS.delay,
    ease: el.dataset.fadeEase || null,
    stagger: parseFloat(el.dataset.fadeStagger) || null,
    distance: el.dataset.fadeDistance
      ? parseFloat(el.dataset.fadeDistance)
      : null,
  }
}

function initStandardFade(el, variantName) {
  const variant = FADE_VARIANTS[variantName]
  const cfg = readFadeConfig(el)
  const children = Array.from(el.children)
  const hasChildren = variantName === 'fade-stagger' || children.length >= 2
  const targets = hasChildren ? children : [el]
  if (hasChildren) el.classList.add('has-children')

  if (cfg.stagger == null) {
    cfg.stagger = variant.defaultStagger ?? FADE_DEFAULTS.stagger
  }
  if (cfg.duration == null) {
    cfg.duration = variant.defaultDuration ?? FADE_DEFAULTS.duration
  }
  if (cfg.ease == null) {
    cfg.ease = variant.defaultEase ?? FADE_DEFAULTS.ease
  }

  const fromVars = {
    ...variant.from({ distance: cfg.distance }),
    willChange: 'transform, opacity, filter',
  }
  const toVars = variant.to || {}

  ScrollTrigger.create({
    trigger: el,
    start: FADE_DEFAULTS.start,
    once: true,
    onEnter: () => {
      gsap.set(targets, fromVars)
      gsap.to(targets, {
        ...toVars,
        opacity: 1,
        y: 0,
        duration: cfg.duration,
        delay: cfg.delay,
        ease: cfg.ease,
        stagger: targets.length > 1 ? cfg.stagger : 0,
        onStart: () => el.classList.add('is-ready'),
        onComplete: () => {
          gsap.set(targets, { clearProps: 'willChange,filter' })
        },
      })
    },
  })
}
