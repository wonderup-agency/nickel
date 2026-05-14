/*
Component: connect-form
Webflow attribute: data-component="connect-form"

Expected DOM (see .claude/rules/components/connect-form.md for full tree):
  [data-component="connect-form"]
    ├── .connect_cards
    │     └── [data-connect="<slug>"] × 3   (get-product / support / something-else)
    └── [data-connect="form-<slug>"] × 3    (matching form panels)

Required CSS embed: embeds/connect-form.css
*/

import intlTelInput from 'intl-tel-input'
import 'intl-tel-input/styles'

const CARD_TO_FORM = {
  'get-product': 'form-product-demo',
  support: 'form-support',
  'something-else': 'form-something-else',
}

const PHONE_DEFAULT_COUNTRY = 'us'
// Countries pinned to the top of the dropdown. The full country list is
// still available below them so users can search for any country.
const PHONE_TOP_COUNTRIES = [
  'us',
  'ca',
  'mx',
  'br',
  'ar',
  'co',
  'cl',
  'es',
  'gb',
  'au',
]

// Inputs marked required via JS so the user doesn't have to toggle the
// attribute on every field in Webflow Designer. HTML5 native validation
// blocks the submit and surfaces the browser's localized tooltip.
// Note: `revenue` is excluded here on purpose — it's a hidden <select>
// driven by a custom dropdown; we validate it manually on submit.
const REQUIRED_FIELD_NAMES = [
  'first-name',
  'last-name',
  'email',
  'company',
  'phone',
  'message',
]

// How long the success message stays on screen before the form auto-closes
// back to the card view. Reset to 0 to disable auto-close.
const SUCCESS_AUTO_CLOSE_MS = 5000

// Success copy per form type, written into each form's `.w-form-done` at
// init so Webflow's native success handler reveals the contextual message.
// Edit here to change the wording.
const SUCCESS_MESSAGES = {
  'form-product-demo': {
    title: "Thanks — we'll be in touch soon",
    body: 'Our sales team will reach out within one business day to schedule your demo.',
  },
  'form-support': {
    title: 'We got it',
    body: 'A support specialist will follow up shortly — we usually reply within a few hours.',
  },
  'form-something-else': {
    title: 'Thanks for reaching out',
    body: "We've received your message and will get back to you as soon as possible.",
  },
}

// intl-tel-input ships its flag sprite as a relative path (../img/flags.webp)
// inside its own CSS. Once Rollup's PostCSS extracts that CSS to dist/styles.css,
// the relative path resolves to a non-existent location. Point the library's
// CSS vars at the jsDelivr-hosted copy of the same package so flags render.
const ITI_FLAGS_BASE =
  'https://cdn.jsdelivr.net/npm/intl-tel-input@28/dist/img'

function patchItiFlagPaths() {
  if (patchItiFlagPaths.done) return
  const root = document.documentElement
  root.style.setProperty(
    '--iti-path-flags-1x',
    `url(${ITI_FLAGS_BASE}/flags.webp)`
  )
  root.style.setProperty(
    '--iti-path-flags-2x',
    `url(${ITI_FLAGS_BASE}/flags@2x.webp)`
  )
  patchItiFlagPaths.done = true
}

const FADE_OUT_DURATION = 0.3
const FADE_IN_DURATION = 0.4
const HEIGHT_DURATION = 0.5
const CURTAIN_DURATION = 0.8
const FADE_EASE = 'power2.out'
const HEIGHT_EASE = 'power2.inOut'
const CURTAIN_EASE = 'power3.inOut'

// inset(top right bottom left). HIDDEN clips the form to a 0-height slice at
// the top; animating to VISIBLE drops the curtain down from top to bottom.
const CLIP_HIDDEN = 'inset(0% 0% 100% 0%)'
const CLIP_VISIBLE = 'inset(0% 0% 0% 0%)'

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='connect-form']
 */
export default function (elements) {
  if (typeof gsap === 'undefined') {
    console.warn('[connect-form] GSAP not found on window — using instant fallback')
    elements.forEach(setupFallback)
    return
  }

  elements.forEach(setupConnectForm)
}

function setupConnectForm(root) {
  const cardsContainer = root.querySelector('.connect_cards')
  const cards = cardsContainer
    ? Array.from(cardsContainer.querySelectorAll('[data-connect]'))
    : []
  const forms = Array.from(
    root.querySelectorAll('[data-connect^="form-"]')
  )

  if (!cardsContainer || !cards.length || !forms.length) {
    console.warn('[connect-form] missing cards or forms', root)
    return
  }

  const formBySlug = new Map(
    forms.map((form) => [form.getAttribute('data-connect'), form])
  )

  // Stage container needs height animation — locate the closest ancestor that
  // wraps both .connect_cards and the form siblings.
  const stage = cards[0].closest('.connect_cards').parentElement

  // Initial form state: hidden but kept in DOM so we can measure on demand.
  forms.forEach((form, i) => {
    if (!form.id) form.id = `connect-form-${i}`
    form.setAttribute('role', 'region')
    form.setAttribute('tabindex', '-1')
    gsap.set(form, { autoAlpha: 0, display: 'none' })
  })

  // intl-tel-input: replaces the static "+1" chip with a real country picker
  // per form. Keyed by form so the Clear button can reset the right instance.
  const itiByForm = new Map()
  const phoneInputs = forms
    .map((form) => ({ form, input: form.querySelector('input[type="tel"]') }))
    .filter(({ input }) => input)
  if (phoneInputs.length) patchItiFlagPaths()
  phoneInputs.forEach(({ form, input }) => {
    const staticPrefix = form.querySelector('.connect-form_phone-prefix')
    if (staticPrefix) staticPrefix.remove()
    input.setAttribute('placeholder', '')
    const iti = intlTelInput(input, {
      initialCountry: PHONE_DEFAULT_COUNTRY,
      separateDialCode: true,
      countryOrder: PHONE_TOP_COUNTRIES,
      countrySearch: true,
      // The country dropdown ends up clipped by the form container's
      // overflow:hidden. Attaching it to <body> lets it escape and the
      // library handles positioning relative to the trigger automatically.
      dropdownContainer: document.body,
      autoPlaceholder: 'polite',
    })
    itiByForm.set(form, { instance: iti, input })
  })

  // Mark required fields, inject contextual success copy, and listen for
  // Webflow's form handler revealing .w-form-done (it does so via inline
  // display:block). When that happens, scroll the form back into view and
  // schedule an automatic close so the cards reappear after a few seconds.
  forms.forEach((form) => {
    const formEl = form.querySelector('form')
    if (!formEl) return
    REQUIRED_FIELD_NAMES.forEach((name) => {
      const field = formEl.querySelector(`[name="${name}"]`)
      if (field) {
        field.setAttribute('required', '')
        field.setAttribute('aria-required', 'true')
      }
    })
    setSuccessMessage(form, form.getAttribute('data-connect'))
    setupCustomDropdowns(form)
    attachCustomValidation(formEl)

    const doneBlock = form.querySelector('.w-form-done')
    if (!doneBlock) return
    let autoCloseTimer = null
    const observer = new MutationObserver(() => {
      const isShown =
        doneBlock.style.display && doneBlock.style.display !== 'none'
      if (isShown && !autoCloseTimer) {
        smoothScrollTo(form)
        if (SUCCESS_AUTO_CLOSE_MS > 0) {
          autoCloseTimer = setTimeout(() => {
            autoCloseTimer = null
            if (activeCard) closeForm(form)
          }, SUCCESS_AUTO_CLOSE_MS)
        }
      } else if (!isShown && autoCloseTimer) {
        // Manual close happened first — cancel the pending auto-close.
        clearTimeout(autoCloseTimer)
        autoCloseTimer = null
      }
    })
    observer.observe(doneBlock, {
      attributes: true,
      attributeFilter: ['style'],
    })
  })

  // Clear Form: native <button> defaults to type="submit" inside a <form>,
  // so without intervention clicking it fires the submit handler. Force
  // type="button" and run a controlled reset.
  forms.forEach((form) => {
    const formEl = form.querySelector('form')
    if (!formEl) return
    const clearBtn = form.querySelector('.connect-form_button.is-secondary')
    if (!clearBtn) return
    clearBtn.setAttribute('type', 'button')
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault()
      resetForm(form, formEl, itiByForm.get(form))
    })
  })

  let activeCard = null
  let isAnimating = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  cards.forEach((card) => {
    const slug = card.getAttribute('data-connect')
    const formKey = CARD_TO_FORM[slug]
    const targetForm = formKey ? formBySlug.get(formKey) : null

    if (!targetForm) {
      console.warn(`[connect-form] no matching form for card "${slug}"`, card)
      return
    }

    card.setAttribute('role', 'button')
    card.setAttribute('tabindex', '0')
    card.setAttribute('aria-controls', targetForm.id)
    card.setAttribute('aria-expanded', 'false')

    // Webflow auto-injects <a class="item-link"> for CMS linking — neutralize
    // so it doesn't navigate or steal focus from the card.
    card.querySelectorAll('.item-link').forEach((link) => {
      link.setAttribute('tabindex', '-1')
      link.setAttribute('aria-hidden', 'true')
      link.addEventListener('click', (e) => e.preventDefault())
    })

    const open = () => openForm(card, targetForm)
    card.addEventListener('click', open)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open()
      }
    })
  })

  // Bind every "Go back" trigger inside each form. Prefers explicit
  // [data-connect-back]; falls back to .button containing "Go back" text.
  forms.forEach((form) => {
    // Neutralize Webflow's decorative item-link inside the back button.
    form.querySelectorAll('.connect-form_card-top .item-link').forEach((link) => {
      link.setAttribute('tabindex', '-1')
      link.setAttribute('aria-hidden', 'true')
      link.addEventListener('click', (e) => e.preventDefault())
    })

    const backTriggers = form.querySelectorAll('[data-connect-back]')
    const triggers = backTriggers.length
      ? Array.from(backTriggers)
      : Array.from(form.querySelectorAll('.connect-form_card-top .button')).filter(
          (el) => /go\s*back/i.test(el.textContent || '')
        )

    triggers.forEach((trigger) => {
      // Make sure the back trigger is keyboard-reachable.
      if (!trigger.matches('button, a, [tabindex]')) {
        trigger.setAttribute('role', 'button')
        trigger.setAttribute('tabindex', '0')
      }
      const close = (e) => {
        e.preventDefault()
        closeForm(form)
      }
      trigger.addEventListener('click', close)
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          close(e)
        }
      })
    })
  })

  // Esc inside any open form acts as Go back.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !activeCard) return
    const formKey = CARD_TO_FORM[activeCard.getAttribute('data-connect')]
    const form = formBySlug.get(formKey)
    if (form) closeForm(form)
  })

  function openForm(card, form) {
    if (isAnimating || activeCard) return
    isAnimating = true
    activeCard = card
    card.setAttribute('aria-expanded', 'true')

    scrollToWrapper()

    if (reducedMotion) {
      gsap.set(cardsContainer, { display: 'none', autoAlpha: 0 })
      gsap.set(form, { display: 'block', autoAlpha: 1, clipPath: CLIP_VISIBLE })
      focusFirstField(form)
      isAnimating = false
      return
    }

    // Origin of the curtain: the cards' y-position inside the stage. Anything
    // above (e.g. the section header) stays untouched in the layout flow.
    const cardsTopOffset = cardsContainer.offsetTop
    const startHeight = stage.getBoundingClientRect().height
    gsap.set(stage, {
      height: startHeight,
      overflow: 'hidden',
      position: 'relative',
    })

    // Position the form absolutely at the cards' y-position so the curtain
    // drops down from there. Cards fade out underneath in parallel.
    gsap.set(form, {
      display: 'block',
      autoAlpha: 1,
      clipPath: CLIP_HIDDEN,
      position: 'absolute',
      top: cardsTopOffset,
      left: 0,
      width: '100%',
    })
    const endHeight = cardsTopOffset + form.getBoundingClientRect().height

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(cardsContainer, { display: 'none' })
        gsap.set(form, {
          clearProps: 'position,top,left,width,clipPath',
        })
        gsap.set(stage, { clearProps: 'height,overflow,position' })
        focusFirstField(form)
        isAnimating = false
      },
    })

    tl.to(cardsContainer, {
      autoAlpha: 0,
      duration: FADE_OUT_DURATION,
      ease: FADE_EASE,
    })
      .to(
        stage,
        {
          height: endHeight,
          duration: HEIGHT_DURATION,
          ease: HEIGHT_EASE,
        },
        '<'
      )
      .to(
        form,
        {
          clipPath: CLIP_VISIBLE,
          duration: CURTAIN_DURATION,
          ease: CURTAIN_EASE,
        },
        '<+=0.1'
      )
  }

  function closeForm(form) {
    if (isAnimating || !activeCard) return
    const cardToRestore = activeCard
    isAnimating = true

    // If we're closing out of a success state, restore Webflow's
    // form/done block visibility and clear the form fields so the user gets
    // a clean form on the next open.
    const formEl = form.querySelector('form')
    const doneBlock = form.querySelector('.w-form-done')
    const isInSuccessState =
      doneBlock &&
      doneBlock.style.display &&
      doneBlock.style.display !== 'none'
    const resetSuccessState = () => {
      if (!isInSuccessState) return
      if (formEl) formEl.style.removeProperty('display')
      if (doneBlock) doneBlock.style.removeProperty('display')
      if (formEl) resetForm(form, formEl, itiByForm.get(form))
    }

    scrollToWrapper()

    if (reducedMotion) {
      gsap.set(form, { display: 'none', autoAlpha: 0 })
      gsap.set(cardsContainer, { clearProps: 'display', autoAlpha: 1 })
      cardToRestore.setAttribute('aria-expanded', 'false')
      cardToRestore.focus({ preventScroll: true })
      resetSuccessState()
      activeCard = null
      isAnimating = false
      return
    }

    const startHeight = stage.getBoundingClientRect().height

    // Pin stage + lift form out of flow so cards can be restored underneath.
    gsap.set(stage, {
      height: startHeight,
      overflow: 'hidden',
      position: 'relative',
    })
    gsap.set(form, {
      clipPath: CLIP_VISIBLE,
      position: 'absolute',
      left: 0,
      width: '100%',
    })

    // Restore cards in flow (still hidden) so we can measure their position.
    gsap.set(cardsContainer, { clearProps: 'display', autoAlpha: 0 })
    const cardsTopOffset = cardsContainer.offsetTop
    const cardsHeight = cardsContainer.offsetHeight

    // Anchor form's `top` to the cards' position so the curtain retreats
    // back into the same place it dropped from.
    gsap.set(form, { top: cardsTopOffset })

    const endHeight = cardsTopOffset + cardsHeight

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(form, { display: 'none', autoAlpha: 0 })
        gsap.set(form, {
          clearProps: 'position,top,left,width,clipPath',
        })
        gsap.set(stage, { clearProps: 'height,overflow,position' })
        cardToRestore.setAttribute('aria-expanded', 'false')
        cardToRestore.focus({ preventScroll: true })
        resetSuccessState()
        activeCard = null
        isAnimating = false
      },
    })

    tl.to(form, {
      clipPath: CLIP_HIDDEN,
      duration: CURTAIN_DURATION,
      ease: CURTAIN_EASE,
    })
      .to(
        stage,
        {
          height: endHeight,
          duration: HEIGHT_DURATION,
          ease: HEIGHT_EASE,
        },
        '<'
      )
      .to(
        cardsContainer,
        {
          autoAlpha: 1,
          duration: FADE_IN_DURATION,
          ease: FADE_EASE,
        },
        '-=0.3'
      )
  }

  function scrollToWrapper() {
    smoothScrollTo(root)
  }
}

// Uses the site's global Lenis instance when available (set in global.js)
// and falls back to native scrollIntoView. Respects prefers-reduced-motion
// by jumping instantly when the user has it on.
function smoothScrollTo(target) {
  if (!target) return
  const reduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  if (!reduced && window.__lenis) {
    window.__lenis.scrollTo(target, { duration: 1.0 })
    return
  }
  target.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: 'start',
  })
}

function focusFirstField(form) {
  const field = form.querySelector(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
  )
  if (field) field.focus({ preventScroll: true })
}

// Writes the contextual success copy into the form's native .w-form-done.
// Webflow's form handler reveals that block on successful submit, so the
// custom text shows up without us hooking into the submission lifecycle.
function setSuccessMessage(form, slug) {
  const msg = SUCCESS_MESSAGES[slug]
  if (!msg) return
  const doneBlock = form.querySelector('.w-form-done')
  if (!doneBlock) return
  doneBlock.replaceChildren()
  const title = document.createElement('div')
  title.className = 'connect-form_thank-you-title'
  title.textContent = msg.title
  const body = document.createElement('div')
  body.className = 'connect-form_thank-you-body'
  body.textContent = msg.body
  doneBlock.append(title, body)
}

// Native form.reset() handles inputs/selects/textareas/checkboxes, but the
// custom .is-checked combo class, the intl-tel-input instance, and the
// custom dropdown visual state all live outside that lifecycle.
function resetForm(formCard, formEl, itiEntry) {
  formEl.reset()
  formCard
    .querySelectorAll('.connect-form_checkbox.is-checked')
    .forEach((cb) => cb.classList.remove('is-checked'))
  formCard
    .querySelectorAll('.connect-form_dropdown')
    .forEach(resetDropdownVisualState)
  if (itiEntry) {
    itiEntry.input.value = ''
    itiEntry.instance.setCountry(PHONE_DEFAULT_COUNTRY)
  }
}

// Replaces each native <select>.connect-form_select inside `formCard` with
// a styled trigger + listbox while keeping the original <select> hidden so
// Webflow Forms still submits the value.
function setupCustomDropdowns(formCard) {
  formCard.querySelectorAll('.connect-form_select').forEach(buildDropdown)
}

function buildDropdown(select) {
  // Skip if already wrapped (re-init safety).
  if (
    select.previousElementSibling &&
    select.previousElementSibling.classList.contains('connect-form_dropdown')
  ) {
    return
  }
  const opts = Array.from(select.querySelectorAll('option'))
  if (!opts.length) return

  // The first <option> is treated as the placeholder; force it to empty value
  // and disabled so form.reset() lands back on it.
  const placeholderOpt = opts[0]
  const valueOpts = opts.slice(1)
  placeholderOpt.value = ''
  placeholderOpt.disabled = true
  placeholderOpt.selected = true

  const wrapper = document.createElement('div')
  wrapper.className = 'connect-form_dropdown'

  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.className = 'connect-form_dropdown-trigger'
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-expanded', 'false')

  const valueSpan = document.createElement('span')
  valueSpan.className = 'connect-form_dropdown-value'
  valueSpan.dataset.placeholder = 'true'
  valueSpan.textContent = placeholderOpt.textContent.trim()

  const chevron = document.createElement('span')
  chevron.className = 'connect-form_dropdown-chevron'
  chevron.setAttribute('aria-hidden', 'true')
  trigger.append(valueSpan, chevron)

  const list = document.createElement('ul')
  list.className = 'connect-form_dropdown-list'
  list.setAttribute('role', 'listbox')

  valueOpts.forEach((opt) => {
    const item = document.createElement('li')
    item.className = 'connect-form_dropdown-item'
    item.setAttribute('role', 'option')
    item.setAttribute('tabindex', '-1')
    item.dataset.value = opt.value || opt.textContent.trim()
    item.textContent = opt.textContent.trim()
    list.appendChild(item)
  })

  wrapper.append(trigger, list)
  select.parentNode.insertBefore(wrapper, select)
  select.style.display = 'none'
  select.setAttribute('aria-hidden', 'true')
  select.setAttribute('tabindex', '-1')

  // Stash refs on the wrapper so resetDropdownVisualState can restore them.
  wrapper._select = select
  wrapper._placeholderText = placeholderOpt.textContent.trim()
  wrapper._valueSpan = valueSpan
  wrapper._trigger = trigger

  let isOpen = false
  const open = () => {
    if (isOpen) return
    isOpen = true
    trigger.setAttribute('aria-expanded', 'true')
    wrapper.classList.add('is-open')
  }
  const close = () => {
    if (!isOpen) return
    isOpen = false
    trigger.setAttribute('aria-expanded', 'false')
    wrapper.classList.remove('is-open')
  }
  const selectValue = (value, label) => {
    select.value = value
    valueSpan.textContent = label
    valueSpan.dataset.placeholder = 'false'
    wrapper.classList.remove('is-invalid')
    select.dispatchEvent(new Event('change', { bubbles: true }))
    close()
    trigger.focus()
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault()
    if (isOpen) close()
    else open()
  })

  list.addEventListener('click', (e) => {
    const item = e.target.closest('.connect-form_dropdown-item')
    if (!item) return
    selectValue(item.dataset.value, item.textContent.trim())
  })

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
      const first = list.querySelector('.connect-form_dropdown-item')
      if (first) first.focus()
    } else if (e.key === 'Escape') {
      close()
    }
  })

  list.addEventListener('keydown', (e) => {
    const items = Array.from(
      list.querySelectorAll('.connect-form_dropdown-item')
    )
    const idx = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = items[Math.min(idx + 1, items.length - 1)]
      if (next) next.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = items[Math.max(idx - 1, 0)]
      if (prev) prev.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const focused = items[idx]
      if (focused) selectValue(focused.dataset.value, focused.textContent.trim())
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
      trigger.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  })

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close()
  })
}

function resetDropdownVisualState(wrapper) {
  const valueSpan = wrapper._valueSpan
  if (valueSpan) {
    valueSpan.textContent = wrapper._placeholderText || ''
    valueSpan.dataset.placeholder = 'true'
  }
  wrapper.classList.remove('is-invalid', 'is-open')
  if (wrapper._trigger) wrapper._trigger.setAttribute('aria-expanded', 'false')
}

// Native HTML5 validation doesn't run on selects hidden via display:none,
// so handle the .connect-form_select in capture phase before Webflow's
// submit handler. preventDefault + stopImmediatePropagation blocks both
// the browser submit and Webflow's AJAX submission.
function attachCustomValidation(formEl) {
  formEl.addEventListener(
    'submit',
    (e) => {
      const select = formEl.querySelector('.connect-form_select')
      if (!select || select.value) return
      e.preventDefault()
      e.stopImmediatePropagation()
      const wrapper = select.previousElementSibling
      if (
        wrapper &&
        wrapper.classList.contains('connect-form_dropdown')
      ) {
        wrapper.classList.add('is-invalid')
        const trigger = wrapper.querySelector('.connect-form_dropdown-trigger')
        if (trigger) trigger.focus()
      }
    },
    true
  )
}

// Minimal fallback when GSAP is missing: cards/forms still switch, no animation.
function setupFallback(root) {
  const cardsContainer = root.querySelector('.connect_cards')
  const cards = cardsContainer
    ? Array.from(cardsContainer.querySelectorAll('[data-connect]'))
    : []
  const forms = Array.from(root.querySelectorAll('[data-connect^="form-"]'))
  if (!cardsContainer || !cards.length || !forms.length) return

  const formBySlug = new Map(
    forms.map((form) => [form.getAttribute('data-connect'), form])
  )
  forms.forEach((form) => (form.style.display = 'none'))

  let activeCard = null

  cards.forEach((card) => {
    const slug = card.getAttribute('data-connect')
    const target = formBySlug.get(CARD_TO_FORM[slug])
    if (!target) return
    card.addEventListener('click', () => {
      cardsContainer.style.display = 'none'
      target.style.display = 'block'
      activeCard = card
    })
  })

  forms.forEach((form) => {
    const triggers = form.querySelectorAll(
      '[data-connect-back], .connect-form_card-top .button'
    )
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault()
        form.style.display = 'none'
        cardsContainer.style.removeProperty('display')
        activeCard = null
      })
    })
  })
}
