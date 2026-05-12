/*
Component: logos-marquee
Webflow attribute: data-component="logos-marquee"

Builds an infinite, seamless logo marquee. The CSS keyframe translates the
list by `--marquee-distance` (the period of the pattern) — JS computes that
distance and ensures the list is wide enough for it.

Two-axis correctness:

  1. Period (translate distance). Per cycle, the list must move exactly the
     width of one "copy" of the originals so the next copy lands where the
     current one started. With `display: flex; gap: G` and N originals:
         period = sum(originalWidths) + N × G
     (N gaps total: N-1 inside the original block + 1 trailing gap to the
     next copy.) Using `translateX(-50%)` is short by G/2 because flex only
     produces N-1 gaps for N items — that missing half-gap is the white
     sliver users see at the loop boundary.

  2. Coverage. When the list is translated by -period, the visible window
     spans list-coordinates [period, period + viewportWidth]. The list must
     therefore be at least that wide:
         listWidth ≥ period + viewportWidth
     If originals fit in less than one viewport (small/few logos), 2× clones
     leave the right edge empty for part of the cycle. JS clones additional
     copies until the list is wide enough, with a small safety buffer.
*/

const COVERAGE_BUFFER_PX = 50
const MAX_CLONE_PASSES = 10
// Pixels per second the marquee scrolls. Duration is computed per list as
// `period / SPEED_PX_PER_SECOND` so marquees of different widths run at the
// same visual speed. Lower = slower.
const SPEED_PX_PER_SECOND = 30

const ensureMarquee = (root, list) => {
  const allItems = Array.from(
    list.querySelectorAll(':scope > [data-logo="item"]')
  )
  if (allItems.length === 0) return

  // First pass marks the originals; subsequent passes (image-load, resize)
  // reuse that count so we always slice the originals correctly.
  let originalCount
  if (list.dataset.logosMarqueeOriginalCount) {
    originalCount = Number(list.dataset.logosMarqueeOriginalCount)
  } else {
    originalCount = allItems.length
    list.dataset.logosMarqueeOriginalCount = String(originalCount)
  }

  const originals = allItems.slice(0, originalCount)
  const cs = window.getComputedStyle(list)
  const gap = parseFloat(cs.columnGap || cs.gap) || 0
  const sumWidth = originals.reduce(
    (acc, el) => acc + el.getBoundingClientRect().width,
    0
  )
  const period = sumWidth + originalCount * gap
  if (period === 0) return

  const viewportWidth = root.getBoundingClientRect().width
  const targetWidth = period + viewportWidth + COVERAGE_BUFFER_PX

  let passes = 0
  let added = 0
  while (list.scrollWidth < targetWidth && passes < MAX_CLONE_PASSES) {
    originals.forEach((item) => {
      const clone = item.cloneNode(true)
      clone.setAttribute('aria-hidden', 'true')
      list.appendChild(clone)
      added++
    })
    passes++
  }

  list.style.setProperty('--marquee-distance', `${period}px`)
  const duration = period / SPEED_PX_PER_SECOND
  list.style.setProperty('--marquee-duration', `${duration}s`)

  // Diagnostic — remove once seamless loop is confirmed in the browser.
  console.log('[logos-marquee] measure', {
    originalCount,
    totalAfterClone: list.querySelectorAll(':scope > [data-logo="item"]')
      .length,
    addedThisPass: added,
    gapPx: gap,
    sumOriginalsWidthPx: Math.round(sumWidth),
    periodPx: Math.round(period),
    viewportWidthPx: Math.round(viewportWidth),
    targetWidthPx: Math.round(targetWidth),
    listScrollWidth: list.scrollWidth,
    durationSec: duration.toFixed(2),
  })
}

/**
 * @param {HTMLElement[]} elements - All [data-component='logos-marquee'] roots
 */
export default function (elements) {
  elements.forEach((root) => {
    const groupLists = Array.from(
      root.querySelectorAll('[data-logo="list"]')
    )
    if (groupLists.length === 0) return

    groupLists.forEach((list) => {
      // Initial pass deferred two frames so layout + flex gap settle.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ensureMarquee(root, list))
      })

      // Logo widths usually depend on intrinsic image size — re-run the
      // measurement after each image decodes so the period reflects the
      // final layout (and we add more clones if needed).
      const imgs = list.querySelectorAll('img')
      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) return
        const onSettle = () => ensureMarquee(root, list)
        img.addEventListener('load', onSettle, { once: true })
        img.addEventListener('error', onSettle, { once: true })
      })

      // Per-root hover-pause: hovering an item pauses every list inside
      // the same [data-component="logos-marquee"] root. Different roots
      // (separate sections) stay independent. Pausing only on item hover
      // (not on gaps) means mousing out of an icon resumes play.
      // Delegated so dynamically-added clones are covered.
      list.addEventListener('mouseover', (e) => {
        if (!e.target.closest('[data-logo="item"]')) return
        groupLists.forEach((l) => l.classList.add('is-marquee-paused'))
      })
      list.addEventListener('mouseout', (e) => {
        if (!e.target.closest('[data-logo="item"]')) return
        // Moving to another item inside the same group keeps it paused.
        const toItem = e.relatedTarget?.closest?.('[data-logo="item"]')
        if (toItem && groupLists.some((l) => l.contains(toItem))) return
        groupLists.forEach((l) => l.classList.remove('is-marquee-paused'))
      })
    })
  })

  return {
    resize() {
      elements.forEach((root) => {
        root
          .querySelectorAll('[data-logo="list"]')
          .forEach((list) => ensureMarquee(root, list))
      })
    },
  }
}
