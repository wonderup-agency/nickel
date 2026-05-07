/*
Component: logos-marquee
Webflow attribute: data-component="logos-marquee"

Doubles the items inside [data-logo="list"] so the CSS marquee can translate
-50% for a seamless loop. Each [data-logo="item"] is cloned and appended to
the same list (instead of cloning the whole list as a sibling), which keeps
the layout flat and avoids fighting CMS wrappers like .w-dyn-list.
*/

/**
 * @param {HTMLElement[]} elements - All [data-component='logos-marquee'] roots
 */
export default function (elements) {
  elements.forEach((root) => {
    const lists = root.querySelectorAll('[data-logo="list"]')
    lists.forEach((list) => {
      if (list.dataset.logosMarqueeCloned === 'true') return
      const items = Array.from(list.querySelectorAll(':scope > [data-logo="item"]'))
      if (items.length === 0) return
      items.forEach((item) => {
        const clone = item.cloneNode(true)
        clone.setAttribute('aria-hidden', 'true')
        list.appendChild(clone)
      })
      list.dataset.logosMarqueeCloned = 'true'

      // Diagnostic: report on the list's actual layout after cloning.
      // Helps catch CSS conflicts (e.g. width: 100% overriding max-content,
      // display: block instead of flex, missing gap).
      requestAnimationFrame(() => {
        const cs = window.getComputedStyle(list)
        const allItems = list.querySelectorAll(':scope > [data-logo="item"]')
        const firstItem = allItems[0]
        const firstImg = firstItem?.querySelector('img')
        const firstItemCS = firstItem ? window.getComputedStyle(firstItem) : null
        const firstImgCS = firstImg ? window.getComputedStyle(firstImg) : null
        console.log('[logos-marquee] list layout', {
          items: allItems.length,
          display: cs.display,
          width: cs.width,
          gap: cs.gap,
          animationName: cs.animationName,
          parentWidth: window.getComputedStyle(list.parentNode).width,
          parentOverflow: window.getComputedStyle(list.parentNode).overflow,
          listBoundingRectWidth: Math.round(list.getBoundingClientRect().width),
          firstItemBoxWidth: firstItem ? Math.round(firstItem.getBoundingClientRect().width) : null,
          firstItemComputedWidth: firstItemCS?.width,
          firstItemFlexShrink: firstItemCS?.flexShrink,
          firstImgBoxWidth: firstImg ? Math.round(firstImg.getBoundingClientRect().width) : null,
          firstImgComputedWidth: firstImgCS?.width,
        })
      })
    })
  })
}
