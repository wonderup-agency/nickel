/*
Component: navbar
Webflow attribute: data-component="navbar"

Stripe-style dropdown navigation with two modes:
  Desktop (≥992px): shared carousel dropdown with hover
  Mobile  (<992px): iOS-style slide-from-right panels with tap

Required CSS classes (JS-created elements, style via custom code):
  Desktop: .navbar_dropdown-container, .navbar_dropdown-bg,
           .navbar_dropdown-panel, .navbar_dropdown-overlay
  Mobile:  .navbar_mobile-panel, .navbar_mobile-back
*/

const DESKTOP_BP = 992

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='navbar']
 */
export default function (elements) {
  if (typeof gsap === 'undefined') {
    console.warn('[navbar] GSAP not found on window — skipping')
    return
  }

  const instances = new Map()

  function setupAll() {
    teardownAll()
    const isDesktop = window.innerWidth >= DESKTOP_BP
    elements.forEach((nav) => {
      const destroy = isDesktop ? initDesktopNavbar(nav) : initMobileNavbar(nav)
      if (destroy) instances.set(nav, destroy)
    })
  }

  function teardownAll() {
    instances.forEach((destroy) => destroy())
    instances.clear()
  }

  setupAll()

  return {
    breakpoint(current, previous) {
      const wasDesktop = previous >= DESKTOP_BP
      const isDesktop = current >= DESKTOP_BP
      if (isDesktop !== wasDesktop) setupAll()
    },
  }
}

// ── Shared helper: clone dropdown cards ──────────────────────

function cloneDropdownCards(trigger) {
  const cards = []
  const sourceLinks = trigger.querySelectorAll(
    '.navbar_dropdown-list .navbar_dropdow-inner-link, .navbar_dropdown-list > a'
  )
  sourceLinks.forEach((link) => {
    const clone = link.cloneNode(true)
    // Strip Webflow IX2 attributes so interactions don't fire on clones
    clone.removeAttribute('data-w-id')
    clone
      .querySelectorAll('[data-w-id]')
      .forEach((el) => el.removeAttribute('data-w-id'))
    cards.push(clone)
  })
  return cards
}

// ═════════════════════════════════════════════════════════════
// DESKTOP — Stripe-style carousel dropdown (hover)
// ═════════════════════════════════════════════════════════════

function initDesktopNavbar(nav) {
  const menuLinks = nav.querySelector('.navbar_menu')
  if (!menuLinks) return null

  const triggers = nav.querySelectorAll('.navbar_menu-dropdown')
  if (!triggers.length) return null

  const navComponent = nav.closest('.navbar_component') || nav
  const isDebug = nav.hasAttribute('data-debug')
  const ac = new AbortController()
  const sig = { signal: ac.signal }

  // Build shared dropdown container
  const container = document.createElement('div')
  container.className = 'navbar_dropdown-container'

  const bg = document.createElement('div')
  bg.className = 'navbar_dropdown-bg'

  const panels = {}
  const panelOrder = []

  triggers.forEach((trigger, i) => {
    const name = `panel-${i}`
    panelOrder.push(name)

    const panel = document.createElement('div')
    panel.className = 'navbar_dropdown-panel'

    cloneDropdownCards(trigger).forEach((clone) => panel.appendChild(clone))

    bg.appendChild(panel)
    panels[name] = { el: panel, trigger }
  })

  container.appendChild(bg)
  menuLinks.appendChild(container)

  const overlay = document.createElement('div')
  overlay.className = 'navbar_dropdown-overlay'
  document.body.appendChild(overlay)

  // State
  let isOpen = false
  let activePanel = null
  let leaveTimeout = null
  let currentTl = null

  function killTimeline() {
    if (currentTl) {
      currentTl.kill()
      currentTl = null
    }
  }

  function resetAll() {
    Object.values(panels).forEach((p) =>
      gsap.set(p.el, { autoAlpha: 0, xPercent: 0, x: 0 })
    )
    gsap.set(container, { autoAlpha: 0, y: 8 })
    gsap.set(overlay, { autoAlpha: 0 })
    navComponent.classList.remove('is-dropdown-open')
    isOpen = false
    activePanel = null
  }

  function snapOpen(name) {
    Object.values(panels).forEach((p) =>
      gsap.set(p.el, { autoAlpha: 0, xPercent: 0, x: 0 })
    )
    gsap.set(panels[name].el, { autoAlpha: 1, xPercent: 0, x: 0 })
    gsap.set(container, { autoAlpha: 1, y: 0 })
    gsap.set(overlay, { autoAlpha: 1 })
    gsap.set(bg, { height: getPanelHeight(panels[name].el) })
    isOpen = true
    activePanel = name
  }

  function getPanelHeight(panelEl) {
    const prev = {
      position: panelEl.style.position,
      visibility: panelEl.style.visibility,
      opacity: panelEl.style.opacity,
    }
    panelEl.style.position = 'relative'
    panelEl.style.visibility = 'hidden'
    panelEl.style.opacity = '0'
    const h = panelEl.offsetHeight
    panelEl.style.position = prev.position
    panelEl.style.visibility = prev.visibility
    panelEl.style.opacity = prev.opacity
    return h
  }

  function getPanelIndex(name) {
    return panelOrder.indexOf(name)
  }

  resetAll()

  // Open
  function show(name) {
    clearTimeout(leaveTimeout)
    killTimeline()
    if (!panels[name]) return

    if (isOpen && name === activePanel) {
      snapOpen(name)
      return
    }
    if (isOpen) {
      switchPanel(name)
      return
    }

    const height = getPanelHeight(panels[name].el)
    resetAll()
    gsap.set(bg, { height })
    gsap.set(panels[name].el, { autoAlpha: 1, x: 0 })
    isOpen = true
    activePanel = name
    navComponent.classList.add('is-dropdown-open')

    currentTl = gsap.timeline()
    currentTl
      .to(overlay, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .to(
        container,
        { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        0.05
      )
  }

  // Switch panels (carousel)
  function switchPanel(name) {
    if (name === activePanel) return
    killTimeline()

    const oldPanel = panels[activePanel]
    const newPanel = panels[name]
    if (!newPanel) return

    const newHeight = getPanelHeight(newPanel.el)
    const goingRight = getPanelIndex(name) > getPanelIndex(activePanel)

    gsap.set(container, { autoAlpha: 1, y: 0 })
    gsap.set(overlay, { autoAlpha: 1 })

    Object.entries(panels).forEach(([key, p]) => {
      if (key !== activePanel) gsap.set(p.el, { autoAlpha: 0, xPercent: 0 })
    })
    gsap.set(oldPanel.el, { autoAlpha: 1, xPercent: 0 })
    gsap.set(newPanel.el, { autoAlpha: 1, xPercent: goingRight ? 100 : -100 })

    activePanel = name

    currentTl = gsap.timeline({
      onComplete: () => gsap.set(oldPanel.el, { autoAlpha: 0, xPercent: 0 }),
    })
    currentTl.to(
      oldPanel.el,
      {
        xPercent: goingRight ? -100 : 100,
        duration: 0.5,
        ease: 'power3.inOut',
      },
      0
    )
    currentTl.to(
      newPanel.el,
      { xPercent: 0, duration: 0.5, ease: 'power3.inOut' },
      0
    )
    currentTl.to(
      bg,
      { height: newHeight, duration: 0.45, ease: 'power3.inOut' },
      0
    )
  }

  // Close
  function hide() {
    leaveTimeout = setTimeout(() => {
      killTimeline()
      currentTl = gsap.timeline({ onComplete: resetAll })
      currentTl
        .to(
          container,
          { autoAlpha: 0, y: 8, duration: 0.3, ease: 'power2.in' },
          0
        )
        .to(overlay, { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut' }, 0.1)
    }, 150)
  }

  function cancelHide() {
    clearTimeout(leaveTimeout)
  }

  // Destroy
  function destroy() {
    ac.abort()
    clearTimeout(leaveTimeout)
    killTimeline()
    container.remove()
    overlay.remove()
    triggers.forEach((trigger) => {
      const icon = trigger.querySelector('.nav_link-icon')
      if (icon) gsap.set(icon, { clearProps: 'all' })
    })
  }

  // Debug mode
  if (isDebug) {
    snapOpen(panelOrder[0])
    return destroy
  }

  // Events
  triggers.forEach((trigger, i) => {
    const name = `panel-${i}`
    trigger.addEventListener(
      'mouseenter',
      () => {
        cancelHide()
        show(name)
      },
      sig
    )
    trigger.addEventListener('mouseleave', hide, sig)

    const icon = trigger.querySelector('.nav_link-icon')
    if (icon) {
      trigger.addEventListener(
        'mouseenter',
        () => {
          gsap.to(icon, { rotation: 180, duration: 0.25, ease: 'power2.out' })
        },
        sig
      )
      trigger.addEventListener(
        'mouseleave',
        () => {
          gsap.to(icon, { rotation: 0, duration: 0.25, ease: 'power2.out' })
        },
        sig
      )
    }
  })

  menuLinks.querySelectorAll('.navbar_link').forEach((link) => {
    link.addEventListener('mouseenter', hide, sig)
  })

  container.addEventListener('mouseenter', cancelHide, sig)
  container.addEventListener('mouseleave', hide, sig)

  nav.querySelectorAll('.navbar_dropdwn-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (e) => e.preventDefault(), sig)
  })

  return destroy
}

// ═════════════════════════════════════════════════════════════
// MOBILE — iOS-style slide-from-right panels (tap)
// ═════════════════════════════════════════════════════════════

function initMobileNavbar(nav) {
  const navMenu = nav.querySelector('.navbar_menu')
  if (!navMenu) return null

  const triggers = nav.querySelectorAll('.navbar_menu-dropdown')
  if (!triggers.length) return null

  const navComponent = nav.closest('.navbar_component') || nav

  const ac = new AbortController()
  const sig = { signal: ac.signal }

  // Main content that slides left when a panel opens
  const mainContent = navMenu.querySelectorAll(
    '.navbar_menu-links, .navbar_menu-buttons'
  )

  // Build mobile panels
  const panels = {}

  triggers.forEach((trigger, i) => {
    const name = `mobile-${i}`
    const toggleEl = trigger.querySelector('.navbar_dropdwn-toggle')
    const triggerText =
      toggleEl?.querySelector('div:first-child')?.textContent?.trim() || 'Menu'

    const panel = document.createElement('div')
    panel.className = 'navbar_mobile-panel'

    // Back button with left chevron
    const back = document.createElement('div')
    back.className = 'navbar_mobile-back'
    back.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
      '<path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<span>' +
      triggerText +
      '</span>'
    panel.appendChild(back)

    // Clone dropdown content
    cloneDropdownCards(trigger).forEach((clone) => panel.appendChild(clone))

    // Append to body so clicks don't bubble through Webflow's overlay.
    // Panel is position:fixed so visual position is the same.
    gsap.set(panel, { xPercent: 100 })
    document.body.appendChild(panel)

    panels[name] = { el: panel, back }

    // Tap trigger → open panel. Listen to both click + touchend
    // so it works on real touch devices where Webflow may block click.
    // Debounce prevents double-firing on devices that emit both.
    let lastTriggerTap = 0
    const triggerHandler = (e) => {
      const now = Date.now()
      if (now - lastTriggerTap < 300) return
      lastTriggerTap = now
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      openPanel(name)
    }
    toggleEl?.addEventListener('click', triggerHandler, {
      signal: ac.signal,
      capture: true,
    })
    toggleEl?.addEventListener('touchend', triggerHandler, {
      signal: ac.signal,
      capture: true,
    })

    // Tap back → close panel (same dual-event approach)
    let lastBackTap = 0
    const backHandler = (e) => {
      const now = Date.now()
      if (now - lastBackTap < 300) return
      lastBackTap = now
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      closePanel(name)
    }
    back.addEventListener('click', backHandler, {
      signal: ac.signal,
      capture: true,
    })
    back.addEventListener('touchend', backHandler, {
      signal: ac.signal,
      capture: true,
    })

    // Block all events inside the panel from bubbling to Webflow
    panel.addEventListener('click', (e) => e.stopPropagation(), sig)
    panel.addEventListener('touchend', (e) => e.stopPropagation(), sig)
  })

  let activePanel = null
  let currentTl = null

  function openPanel(name) {
    if (currentTl) currentTl.kill()
    const panel = panels[name]
    if (!panel) return

    // Close any other open panel instantly
    if (activePanel && activePanel !== name) {
      gsap.set(panels[activePanel].el, { xPercent: 100 })
    }

    activePanel = name
    navComponent.classList.add('is-dropdown-open')

    currentTl = gsap.timeline()
    currentTl
      .to(
        mainContent,
        { xPercent: -30, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut' },
        0
      )
      .to(panel.el, { xPercent: 0, duration: 0.35, ease: 'power2.out' }, 0.05)
  }

  function closePanel(name) {
    if (currentTl) currentTl.kill()
    const panel = panels[name || activePanel]
    if (!panel) return

    currentTl = gsap.timeline({
      onComplete: () => {
        activePanel = null
      },
    })
    currentTl
      .to(panel.el, { xPercent: 100, duration: 0.35, ease: 'power2.inOut' }, 0)
      .to(
        mainContent,
        { xPercent: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' },
        0.05
      )
  }

  function resetAll() {
    if (currentTl) currentTl.kill()
    Object.values(panels).forEach((p) => gsap.set(p.el, { xPercent: 100 }))
    gsap.set(mainContent, { xPercent: 0, autoAlpha: 1 })
    navComponent.classList.remove('is-dropdown-open')
    activePanel = null
  }

  // Track menu open/close via Webflow's w--open class on the nav menu.
  // This catches all close triggers: hamburger tap, overlay tap, link click.
  const menuObserver = new MutationObserver(() => {
    const isOpen = navMenu.classList.contains('w--open')
    navComponent.classList.toggle('is-menu-open', isOpen)
    if (!isOpen) resetAll()
  })
  menuObserver.observe(navMenu, {
    attributes: true,
    attributeFilter: ['class'],
  })

  function destroy() {
    menuObserver.disconnect()
    ac.abort()
    resetAll()
    navComponent.classList.remove('is-menu-open')
    Object.values(panels).forEach((p) => p.el.remove())
    mainContent.forEach((el) => gsap.set(el, { clearProps: 'all' }))
  }

  return destroy
}
