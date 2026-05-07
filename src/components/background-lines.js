/*
Component: background-lines
Webflow attribute: data-component="background-lines"

Expected DOM:
  <div data-component="background-lines" class="background_lines-component">
    <div class="background_lines"></div>
    <div class="background_lines is-right"></div>
  </div>

Animation model:
  - Within a single wrapper, every line animates in PARALLEL (no stagger).
  - Across wrappers (different sections on the page), animations are
    QUEUED — section N+1 waits for section N to finish drawing before its
    own lines start, even if the user scrolls quickly and ScrollTrigger
    fires N+1 while N is still mid-animation.

The CSS embed (embeds/background-lines.css) pre-hides the lines via a
mask set to 0% until this component adds `.is-ready` to the wrapper. That
class removes the pre-hide rule from the cascade — at that point either
the JS-driven inline mask (during animation) or the natural rendering
(after animation completes and mask is cleared) takes over.
*/

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='background-lines']
 */
export default function (elements) {
  // Mask sweeps top-to-bottom — each diagonal segment is drawn
  // progressively from its top end down to its bottom end.
  const maskAt = (p) =>
    `linear-gradient(to bottom, #000 ${p}%, transparent ${p}%)`

  // Each line draws over this duration. Lines within one wrapper share
  // the same start time, so a wrapper's "occupancy" in the page-level
  // queue is exactly DRAW_DURATION seconds.
  const DRAW_DURATION = 2

  // Fallback: if GSAP isn't available, reveal the lines immediately so the
  // pre-hide CSS doesn't leave them invisible forever.
  if (typeof gsap === 'undefined') {
    console.warn(
      '[background-lines] GSAP not found on window — revealing lines without animation'
    )
    elements.forEach((wrapper) => wrapper.classList.add('is-ready'))
    return
  }

  const animateLine = (line, delay = 0) => {
    const state = { p: 0 }
    return gsap.to(state, {
      p: 100,
      duration: DRAW_DURATION,
      delay,
      ease: 'power2.inOut',
      onUpdate: () => {
        const mask = maskAt(state.p)
        line.style.webkitMaskImage = mask
        line.style.maskImage = mask
      },
      onComplete: () => {
        // Clean up so the mask doesn't interfere with future styling. Safe
        // because the wrapper already has `.is-ready`, so the CSS pre-hide
        // won't re-apply.
        line.style.webkitMaskImage = ''
        line.style.maskImage = ''
      },
    })
  }

  // Page-level queue. Each wrapper reserves a slot when it triggers; the
  // next wrapper to trigger starts no earlier than the queue's tail. Stored
  // as a `performance.now()` timestamp in ms.
  let nextAvailableAt = 0

  elements.forEach((wrapper) => {
    const lines = wrapper.querySelectorAll('.background_lines')
    if (!lines.length) return

    // Take ownership of the mask: set inline mask to 0% (still hidden, now
    // via inline styles) BEFORE marking `.is-ready` so there's no flash gap.
    lines.forEach((line) => {
      line.style.webkitMaskImage = maskAt(0)
      line.style.maskImage = maskAt(0)
    })
    wrapper.classList.add('is-ready')

    const play = () => {
      const now = performance.now()
      // Start time = whichever is later: right now, or the queue's tail.
      const startAt = Math.max(now, nextAvailableAt)
      const delaySec = (startAt - now) / 1000

      // Both lines in this wrapper animate at the exact same time. The
      // wait-for-previous-section behavior comes from `delaySec`, which is
      // 0 if no other wrapper is currently animating.
      lines.forEach((line) => animateLine(line, delaySec))

      // Reserve this wrapper's slot in the queue.
      nextAvailableAt = startAt + DRAW_DURATION * 1000
    }

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top 85%',
        once: true,
        onEnter: play,
      })
    } else {
      play()
    }
  })
}
