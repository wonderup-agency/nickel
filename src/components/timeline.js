/*
Component: timeline
Webflow attribute: data-component="timeline"

Expected DOM (see .claude/rules/components/timeline.md for full tree):
  [data-component="timeline"]
    └── [data-timeline="spacer"]                  (line may participate; no content)
    └── [data-timeline="item"]                    × N
          ├── .timeline_item-top                  (date + title — animated content)
          ├── [data-timeline="circle"]            (milestone marker; absent on intro item)
          │     └── .timeline_icon                (revealed when the milestone activates)
          ├── [data-timeline="line"]              (grey base; red overlay fills as step plays)
          └── .timeline17_item-bottom             (bullets/copy — animated content)

Behavior: the closest <section> is pinned (falls back to the wrapper if no
section ancestor) and the user advances through DISCRETE STEPS (one per
[data-timeline="line"], in DOM order). Each step plays a full mini-timeline
at its own pace — no scrub. A red fill overlay (auto-injected as
[data-timeline-fill]) animates scaleX 0→1 inside its line, so the progress
line "advances" one segment at a time as each dot activates. Pinning the
section (instead of just the timeline wrapper) keeps sibling decorations
like [data-component="background-lines"] — positioned absolute inside the
section — visually still throughout the pin. ScrollTrigger snap aligns the
scroll position to step boundaries.

Per step (when the line is inside a milestone item):
  - the line's red fill overlay grows left → right (scaleX 0 → 1)
  - the circle's background fills from white → var(--base--red)
  - the .timeline_icon inside the circle fades in (visible against the red fill)
  - .timeline_item-top + .timeline17_item-bottom fade up

Per step (intro item line, no circle):
  - the line's red fill grows
  - top + bottom copy fade up alongside

Per step (closing spacer line, no item):
  - the line's red fill grows (visual tail of the timeline)

Custom events broadcast on the closest <section>:
  timeline:progress         { progress: 0..1 }   (every scroll update)
  timeline:milestone        { index, total }     (a circled item just activated)
  timeline:milestone-leave  { index, total }     (a circled item scrolled back out)
*/

const VH_PER_STEP = 0.5 // pin length per step, in viewport heights

const FILL_DURATION = 0.6
const ICON_DURATION = 0.4
const TOP_DURATION = 0.5
const BOTTOM_DURATION = 0.55

// Stagger inside a step (relative to step start / line fill start)
const ICON_DELAY = 0.15
const TOP_DELAY = 0.1
const BOTTOM_DELAY = 0.2

const HIDDEN_Y = 16

// Snap behavior — magnetizes scroll to the nearest step boundary
const SNAP_DURATION_MIN = 0.2
const SNAP_DURATION_MAX = 0.5
const SNAP_DELAY = 0.08

// Floating-point guard: progress at a snap point may arrive as 0.5999...
// instead of 0.6, which would drop the matching step on the floor() rounding.
const STEP_EPSILON = 1e-4

// Extra breathing room below the fixed navbar before the pin starts —
// pushes the heading further into the viewport so it's not flush to the navbar.
const PIN_EXTRA_OFFSET_PX = 32 // 2rem at default root font-size

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='timeline']
 */
export default function (elements) {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[timeline] GSAP or ScrollTrigger not found — skipping')
    return
  }

  elements.forEach(setupTimeline)

  return {
    resize() {
      ScrollTrigger.refresh()
    },
  }
}

function ensureFill(line) {
  let fill = line.querySelector('[data-timeline-fill]')
  if (!fill) {
    fill = document.createElement('span')
    fill.setAttribute('data-timeline-fill', '')
    line.appendChild(fill)
  }
  // Inline the structural CSS the fill needs so it renders even without the
  // optional embeds/timeline.css. The line becomes the positioning ancestor
  // and the fill is stretched to cover it. Background + transform-origin
  // could live in the embed but we keep them inline so this works zero-config.
  gsap.set(line, { position: 'relative', overflow: 'hidden' })
  gsap.set(fill, {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--base--red)',
    transformOrigin: 'left center',
  })
  return fill
}

function setupTimeline(wrapper) {
  // Steps are driven by lines inside [data-timeline="item"] only. Lines
  // inside [data-timeline="spacer"] (e.g. the small closing tail) stay in
  // the DOM as static grey decoration — no fill, no step, no extra snap.
  const allLines = Array.from(
    wrapper.querySelectorAll('[data-timeline="line"]')
  )
  if (!allLines.length) return

  const section = wrapper.closest('section') || wrapper

  const segments = allLines
    .filter((line) => line.closest('[data-timeline="item"]'))
    .map((line) => {
      const item = line.closest('[data-timeline="item"]')
      const circle = item.querySelector('[data-timeline="circle"]')
      return {
        line,
        fill: ensureFill(line),
        item,
        circle,
        icon: circle ? circle.querySelector('.timeline_icon') : null,
        itemTop: item.querySelector('.timeline_item-top'),
        itemBottom: item.querySelector('.timeline17_item-bottom'),
        isMilestone: !!circle,
      }
    })

  if (!segments.length) return

  const milestoneSegmentIndices = []
  segments.forEach((s, i) => {
    if (s.isMilestone) milestoneSegmentIndices.push(i)
  })
  const milestoneTotal = milestoneSegmentIndices.length

  const mm = gsap.matchMedia()

  // Reduced motion: skip pin + step animations, leave everything in active state
  mm.add('(prefers-reduced-motion: reduce)', () => {
    segments.forEach(({ circle, fill, icon, itemTop, itemBottom }) => {
      gsap.set(fill, { scaleX: 1, transformOrigin: 'left center' })
      if (circle) gsap.set(circle, { backgroundColor: 'var(--base--red)' })
      if (icon) gsap.set(icon, { autoAlpha: 1 })
      if (itemTop) gsap.set(itemTop, { opacity: 1, y: 0 })
      if (itemBottom) gsap.set(itemBottom, { opacity: 1, y: 0 })
    })
    milestoneSegmentIndices.forEach((_, msIdx) => {
      section.dispatchEvent(
        new CustomEvent('timeline:milestone', {
          detail: { index: msIdx, total: milestoneTotal },
        })
      )
    })
  })

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Resting state — only what we'll animate
    segments.forEach(({ fill, icon, itemTop, itemBottom }) => {
      gsap.set(fill, { scaleX: 0, transformOrigin: 'left center' })
      if (icon) gsap.set(icon, { autoAlpha: 0 })
      // Use opacity (not autoAlpha) on copy so screen readers still see it
      if (itemTop) gsap.set(itemTop, { opacity: 0, y: HIDDEN_Y })
      if (itemBottom) gsap.set(itemBottom, { opacity: 0, y: HIDDEN_Y })
    })

    // One paused mini-timeline per segment. Plays forward when the step is
    // crossed, reverses when scrolled back out.
    const stepTimelines = segments.map((s) => {
      const stl = gsap.timeline({ paused: true })
      stl.to(
        s.fill,
        {
          scaleX: 1,
          duration: FILL_DURATION,
          ease: 'power2.out',
        },
        0
      )

      if (s.isMilestone) {
        if (s.circle) {
          stl.to(
            s.circle,
            {
              backgroundColor: 'var(--base--red)',
              duration: FILL_DURATION,
              ease: 'power2.out',
            },
            0
          )
        }
        if (s.icon) {
          stl.to(
            s.icon,
            {
              autoAlpha: 1,
              duration: ICON_DURATION,
              ease: 'power2.out',
            },
            ICON_DELAY
          )
        }
        if (s.itemTop) {
          stl.to(
            s.itemTop,
            {
              opacity: 1,
              y: 0,
              duration: TOP_DURATION,
              ease: 'power3.out',
            },
            TOP_DELAY
          )
        }
        if (s.itemBottom) {
          stl.to(
            s.itemBottom,
            {
              opacity: 1,
              y: 0,
              duration: BOTTOM_DURATION,
              ease: 'power3.out',
            },
            BOTTOM_DELAY
          )
        }
      } else {
        // Intro item (no circle): top + bottom rise alongside the line fill
        if (s.itemTop) {
          stl.to(
            s.itemTop,
            {
              opacity: 1,
              y: 0,
              duration: BOTTOM_DURATION,
              ease: 'power3.out',
            },
            0
          )
        }
        if (s.itemBottom) {
          stl.to(
            s.itemBottom,
            {
              opacity: 1,
              y: 0,
              duration: BOTTOM_DURATION,
              ease: 'power3.out',
            },
            0
          )
        }
      }
      return stl
    })

    let lastStep = -1

    // Offset the pin start by the fixed navbar's height + a bit of extra
    // breathing room so the timeline heading sits comfortably below the navbar
    // instead of getting clipped or flush against it.
    const getPinOffset = () => {
      const navbar = document.querySelector('[data-component="navbar"]')
      const navbarHeight = navbar ? navbar.offsetHeight : 0
      return navbarHeight + PIN_EXTRA_OFFSET_PX
    }

    ScrollTrigger.create({
      trigger: wrapper,
      start: () => `top top+=${getPinOffset()}px`,
      end: () => `+=${segments.length * VH_PER_STEP * window.innerHeight}`,
      // Pin the closest section (falls back to wrapper if not inside one).
      // This keeps sibling decorations like [data-component="background-lines"]
      // — which are positioned absolute inside the section — visually still
      // throughout the pin instead of scrolling past underneath the timeline.
      pin: section,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: 1 / segments.length,
        duration: { min: SNAP_DURATION_MIN, max: SNAP_DURATION_MAX },
        delay: SNAP_DELAY,
        ease: 'power2.inOut',
      },
      onUpdate(self) {
        const p = self.progress
        section.dispatchEvent(
          new CustomEvent('timeline:progress', { detail: { progress: p } })
        )

        // Map scroll progress to a discrete step index. Epsilon protects
        // against snap landings arriving as 0.4999... instead of 0.5.
        const currentStep = Math.min(
          Math.floor(p * segments.length + STEP_EPSILON),
          segments.length - 1
        )
        if (currentStep === lastStep) return

        if (currentStep > lastStep) {
          for (let i = lastStep + 1; i <= currentStep; i++) {
            stepTimelines[i].play()
            const msIdx = milestoneSegmentIndices.indexOf(i)
            if (msIdx >= 0) {
              section.dispatchEvent(
                new CustomEvent('timeline:milestone', {
                  detail: { index: msIdx, total: milestoneTotal },
                })
              )
            }
          }
        } else {
          for (let i = lastStep; i > currentStep; i--) {
            stepTimelines[i].reverse()
            const msIdx = milestoneSegmentIndices.indexOf(i)
            if (msIdx >= 0) {
              section.dispatchEvent(
                new CustomEvent('timeline:milestone-leave', {
                  detail: { index: msIdx, total: milestoneTotal },
                })
              )
            }
          }
        }
        lastStep = currentStep
      },
    })
  })
}
