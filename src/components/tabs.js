/*
Component: tabs
Webflow attribute: data-component="tabs"

Expected DOM (see .claude/rules/components/tabs.md for full tree):
  [data-component="tabs"]
    └── [data-tabs="pane"]   × N   (image panes, stacked)
    └── [data-tabs="link"]   × N   (tab triggers)
          ├── .tabs_paragraph       (accordion body, starts at height 0)
          └── .layout497_tab-icon-wrapper
                └── .tabs_icon:first-child > svg > path   ("+" — split into
                     horizontal + vertical <path>s at init; vertical scales to 0
                     on active to visually become "−")

Required CSS embed: embeds/tabs.css
*/

const SVG_NS = 'http://www.w3.org/2000/svg'

const CURTAIN_DURATION = 0.9
const ACCORDION_DURATION = 0.55
const LINK_FADE_DURATION = 0.4
const INACTIVE_OPACITY = 0.4
const CURTAIN_EASE = 'power3.inOut'
const ACCORDION_EASE = 'power3.inOut'

// Explicit % units — GSAP interpolates inset() reliably when both states match
const CLIP_HIDDEN = 'inset(0% 0% 100% 0%)'
const CLIP_VISIBLE = 'inset(0% 0% 0% 0%)'

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='tabs']
 */
export default function (elements) {
  if (typeof gsap === 'undefined') {
    console.warn('[tabs] GSAP not found on window — skipping')
    return
  }

  elements.forEach(setupTabs)
}

function setupTabs(root) {
  const links = Array.from(root.querySelectorAll('[data-tabs="link"]'))
  const panes = Array.from(root.querySelectorAll('[data-tabs="pane"]'))

  if (!links.length || !panes.length) {
    console.warn(
      '[tabs] missing [data-tabs="link"] or [data-tabs="pane"]',
      root
    )
    return
  }

  const paragraphs = links.map((link) => link.querySelector('.tabs_paragraph'))
  const verticalLines = links.map(splitPlusIcon)

  let activeIndex = 0

  // Initial resting state
  links.forEach((link, i) => {
    const isFirst = i === 0
    link.classList.toggle('is-active', isFirst)
    gsap.set(link, { opacity: isFirst ? 1 : INACTIVE_OPACITY })

    const paragraph = paragraphs[i]
    if (paragraph) {
      gsap.set(paragraph, { height: isFirst ? 'auto' : 0 })
    }

    const verticalLine = verticalLines[i]
    if (verticalLine) {
      gsap.set(verticalLine, {
        scaleY: isFirst ? 0 : 1,
        transformOrigin: '50% 50%',
      })
    }

    link.addEventListener('click', () => activate(i))
  })

  panes.forEach((pane, i) => {
    const isFirst = i === 0
    gsap.set(pane, {
      clipPath: isFirst ? CLIP_VISIBLE : CLIP_HIDDEN,
      zIndex: isFirst ? 2 : 1,
    })
  })

  function activate(index) {
    if (index === activeIndex) return
    const prevIndex = activeIndex
    activeIndex = index

    // Links: toggle class, fade opacity, accordion paragraphs
    links.forEach((link, i) => {
      const isActive = i === index
      link.classList.toggle('is-active', isActive)
      gsap.to(link, {
        opacity: isActive ? 1 : INACTIVE_OPACITY,
        duration: LINK_FADE_DURATION,
        ease: 'power2.out',
        overwrite: 'auto',
      })

      const paragraph = paragraphs[i]
      if (paragraph) {
        gsap.to(paragraph, {
          height: isActive ? 'auto' : 0,
          duration: ACCORDION_DURATION,
          ease: ACCORDION_EASE,
          overwrite: 'auto',
        })
      }

      const verticalLine = verticalLines[i]
      if (verticalLine) {
        gsap.to(verticalLine, {
          scaleY: isActive ? 0 : 1,
          duration: ACCORDION_DURATION,
          ease: ACCORDION_EASE,
          transformOrigin: '50% 50%',
          overwrite: 'auto',
        })
      }
    })

    // Panes: keep previous visible behind, curtain-drop new one on top
    panes.forEach((pane, i) => {
      if (i === index) return
      const clipPath = i === prevIndex ? CLIP_VISIBLE : CLIP_HIDDEN
      gsap.set(pane, { zIndex: 1, clipPath })
    })

    gsap.fromTo(
      panes[index],
      { clipPath: CLIP_HIDDEN, zIndex: 2 },
      {
        clipPath: CLIP_VISIBLE,
        duration: CURTAIN_DURATION,
        ease: CURTAIN_EASE,
        overwrite: true,
      }
    )
  }
}

// Splits the "+" icon's single path ("Mx yHx2 Mx y2Vy3") into two <path>
// elements — one horizontal, one vertical — so the vertical can be scaled
// independently. Returns the vertical path (or null if the icon isn't found).
function splitPlusIcon(link) {
  const svg = link.querySelector(
    '.layout497_tab-icon-wrapper .tabs_icon:first-child svg'
  )
  if (!svg) return null

  const originalPath = svg.querySelector('path')
  if (!originalPath) return null

  const d = originalPath.getAttribute('d') || ''
  const subpaths = d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (subpaths.length < 2) return null

  const verticalD = subpaths.find((s) => /V/i.test(s))
  const horizontalD = subpaths.find((s) => /H/i.test(s))
  if (!verticalD || !horizontalD) return null

  const attrs = ['stroke', 'stroke-linecap', 'stroke-linejoin', 'stroke-width']
  const makePath = (pathD) => {
    const p = document.createElementNS(SVG_NS, 'path')
    p.setAttribute('d', pathD)
    attrs.forEach((name) => {
      const value = originalPath.getAttribute(name)
      if (value !== null) p.setAttribute(name, value)
    })
    return p
  }

  const hPath = makePath(horizontalD)
  const vPath = makePath(verticalD)

  originalPath.replaceWith(hPath, vPath)
  return vPath
}
