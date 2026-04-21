/*
Component: background-lines
Webflow attribute: data-component="background-lines"

Expected DOM:
  <div data-component="background-lines" class="background_lines-component">
    <div class="background_lines"></div>
    <div class="background_lines is-right"></div>
  </div>
*/

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='background-lines']
 */
export default function (elements) {
  if (typeof gsap === 'undefined') {
    console.warn(
      '[background-lines] GSAP not found on window — skipping animation'
    )
    return
  }

  // Mask sweeps top-to-bottom — each diagonal segment is drawn
  // progressively from its top end down to its bottom end.
  const maskAt = (p) =>
    `linear-gradient(to bottom, #000 ${p}%, transparent ${p}%)`

  const animateLine = (line, delay = 0) => {
    line.style.webkitMaskImage = maskAt(0)
    line.style.maskImage = maskAt(0)

    const state = { p: 0 }
    return gsap.to(state, {
      p: 100,
      duration: 2,
      delay,
      ease: 'power2.inOut',
      onUpdate: () => {
        const mask = maskAt(state.p)
        line.style.webkitMaskImage = mask
        line.style.maskImage = mask
      },
      onComplete: () => {
        // Clean up so the mask doesn't interfere with future styling
        line.style.webkitMaskImage = ''
        line.style.maskImage = ''
      },
    })
  }

  elements.forEach((wrapper) => {
    const lines = wrapper.querySelectorAll('.background_lines')
    if (!lines.length) return

    // Pre-hide so they don't flash before ScrollTrigger fires
    lines.forEach((line) => {
      line.style.webkitMaskImage = maskAt(0)
      line.style.maskImage = maskAt(0)
    })

    const play = () => {
      lines.forEach((line, i) => animateLine(line, i * 0.4))
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
