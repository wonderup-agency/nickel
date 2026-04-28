/*
Component: timeline-vertical-lines
Webflow attribute: data-component="timeline-vertical-lines"

Expected DOM (see .claude/rules/components/timeline-vertical-lines.md):
  [data-component="timeline-vertical-lines"]
    └── .timeline_vertical-line × N

Behavior:
  Independent from the timeline component — animates on its own when the
  closest <section> reaches 50% of the viewport. Each line grows scaleY 0→1
  from the top, with a small stagger left → right.
*/

const STAGGER = 0.08
const DURATION = 0.7
const EASE = 'power3.out'
const TRIGGER_START = 'top 50%'

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='timeline-vertical-lines']
 */
export default function (elements) {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn(
      '[timeline-vertical-lines] GSAP or ScrollTrigger not found — skipping'
    )
    return
  }

  elements.forEach(setupVerticalLines)
}

function setupVerticalLines(wrapper) {
  const lines = wrapper.querySelectorAll('.timeline_vertical-line')
  if (!lines.length) return

  const section = wrapper.closest('section') || wrapper

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set(lines, { scaleY: 1, transformOrigin: 'top center' })
  })

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set(lines, { scaleY: 0, transformOrigin: 'top center' })
    gsap.to(lines, {
      scaleY: 1,
      duration: DURATION,
      ease: EASE,
      stagger: STAGGER,
      scrollTrigger: {
        trigger: section,
        start: TRIGGER_START,
        once: true,
      },
    })
  })
}
