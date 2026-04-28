/*
Component: pricing
Webflow attribute: data-component="pricing"
*/

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='pricing']
 */
export default function (elements) {
  if (typeof gsap === 'undefined') {
    console.warn('[pricing] GSAP not found — skipping')
    return
  }

  const instances = elements.map(setup).filter(Boolean)

  return {
    resize() {
      instances.forEach((inst) => inst.reposition())
    },
  }
}

function setup(root) {
  const menu = root.querySelector('.pricing_tabs-menu')
  const links = Array.from(root.querySelectorAll('[data-pricing="tab-link"]'))
  const panes = Array.from(root.querySelectorAll('[data-pricing="tab-pane"]'))

  if (!menu || links.length < 2 || panes.length !== links.length) {
    console.warn('[pricing] missing menu/links/panes or count mismatch')
    return null
  }

  const pill = document.createElement('div')
  pill.className = 'pricing_tab-pill'
  menu.prepend(pill)

  let activeIndex = Math.max(
    0,
    links.findIndex((l) => l.classList.contains('is-active'))
  )

  // Initial pane state: active visible, others hidden
  panes.forEach((pane, i) => {
    gsap.set(pane, { autoAlpha: i === activeIndex ? 1 : 0 })
  })

  const reposition = () => {
    const target = links[activeIndex]
    gsap.set(pill, {
      x: target.offsetLeft,
      width: target.offsetWidth,
      height: target.offsetHeight,
      top: target.offsetTop,
    })
  }

  reposition()

  const activate = (nextIndex) => {
    if (nextIndex === activeIndex) return

    const prevPane = panes[activeIndex]
    const nextPane = panes[nextIndex]

    links[activeIndex].classList.remove('is-active')
    links[nextIndex].classList.add('is-active')

    const target = links[nextIndex]
    gsap.to(pill, {
      x: target.offsetLeft,
      width: target.offsetWidth,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
    })

    gsap.to(prevPane, {
      autoAlpha: 0,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })
    gsap.to(nextPane, {
      autoAlpha: 1,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    })

    activeIndex = nextIndex
  }

  links.forEach((link, i) => {
    link.addEventListener('click', () => activate(i))
  })

  return { reposition }
}
