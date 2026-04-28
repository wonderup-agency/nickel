/*
Component: counter
Webflow attribute: data-component="counter"

Odometer-style number counter. Each digit becomes a vertical reel of 0–9
clipped to one digit height; non-digit characters (".", ",", "x", "%", "$",
"+", "k") are rendered as static spans so the layout stays balanced.

End value, prefix, suffix and decimal count are auto-parsed from the
existing text content. Override any of them via data attributes on the
[data-component="counter"] element:

  data-counter-end="42"
  data-counter-decimals="1"
  data-counter-prefix="$"
  data-counter-suffix="%"
  data-counter-duration="2.5"        (seconds)
  data-counter-ease="expo.out"
  data-counter-digit-stagger="0.15"  (between digits inside a number)

Expected DOM (text can be nested any depth — innermost text element wins):

  <div data-component="counter" class="stats-grid_number">
    <div class="component-rich-text"><p>34x</p></div>
  </div>
*/

const DEFAULTS = {
  duration: 2.5,
  stagger: 0.2,
  digitStagger: 0.15,
  ease: 'expo.out',
  start: 'top 85%',
}

const DIGIT_RE = /[0-9]/

// Find the deepest element that directly contains a non-empty text node.
function findValueElement(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  })
  const first = walker.nextNode()
  return first ? first.parentNode : root
}

// "34x"    → { prefix:"",  end:34,   suffix:"x", decimals:0 }
// "$1,250" → { prefix:"$", end:1250, suffix:"",  decimals:0 }
// "99.5%"  → { prefix:"",  end:99.5, suffix:"%", decimals:1 }
function parseText(text) {
  const trimmed = text.trim()
  const match = trimmed.match(/^([^\d-]*)(-?[\d.,]+)([^\d]*)$/)
  if (!match) return null
  const [, prefix, numStr, suffix] = match
  const cleaned = numStr.replace(/,/g, '')
  const dot = cleaned.indexOf('.')
  const decimals = dot === -1 ? 0 : cleaned.length - dot - 1
  const value = parseFloat(cleaned)
  if (!Number.isFinite(value)) return null
  return { prefix, end: value, suffix, decimals }
}

// Treat empty / whitespace-only attribute values as "not set" so Webflow
// Component instances with unset attribute slots fall through to the
// parsed text value.
function override(value) {
  return value != null && value.trim() !== '' ? value : null
}

function buildCounter(host) {
  const valueEl = findValueElement(host)
  const original = valueEl.textContent
  const parsed = parseText(original)
  if (!parsed) {
    console.warn('[counter] Cannot parse number from text:', original, host)
    return null
  }

  const ds = host.dataset
  const endStr = override(ds.counterEnd)
  const endOverride = endStr != null ? parseFloat(endStr) : NaN
  const end = Number.isFinite(endOverride) ? endOverride : parsed.end

  const decStr = override(ds.counterDecimals)
  const decOverride = decStr != null ? parseInt(decStr, 10) : NaN
  const decimals = Number.isFinite(decOverride) ? decOverride : parsed.decimals

  const prefix = override(ds.counterPrefix) ?? parsed.prefix
  const suffix = override(ds.counterSuffix) ?? parsed.suffix

  const durStr = override(ds.counterDuration)
  const durOverride = durStr != null ? parseFloat(durStr) : NaN
  const duration = Number.isFinite(durOverride)
    ? durOverride
    : DEFAULTS.duration

  const ease = override(ds.counterEase) ?? DEFAULTS.ease

  const dsStr = override(ds.counterDigitStagger)
  const dsOverride = dsStr != null ? parseFloat(dsStr) : NaN
  const digitStagger = Number.isFinite(dsOverride)
    ? dsOverride
    : DEFAULTS.digitStagger

  const finalText = `${prefix}${end.toFixed(decimals)}${suffix}`

  // Mark the text element so the embed CSS can lay it out, then replace
  // its children with reels + static separators.
  valueEl.setAttribute('data-counter', 'value')
  valueEl.setAttribute('aria-label', finalText)
  valueEl.setAttribute('aria-live', 'polite')
  valueEl.textContent = ''

  const reels = []
  for (const ch of finalText) {
    if (DIGIT_RE.test(ch)) {
      const reel = document.createElement('span')
      reel.setAttribute('data-counter', 'reel')
      reel.setAttribute('aria-hidden', 'true')

      const stack = document.createElement('span')
      stack.setAttribute('data-counter', 'stack')
      for (let i = 0; i <= 9; i++) {
        const d = document.createElement('span')
        d.setAttribute('data-counter', 'digit')
        d.textContent = String(i)
        stack.appendChild(d)
      }
      reel.appendChild(stack)
      valueEl.appendChild(reel)
      reels.push({ stack, target: parseInt(ch, 10) })
    } else {
      const sep = document.createElement('span')
      sep.setAttribute('data-counter', 'static')
      sep.setAttribute('aria-hidden', 'true')
      sep.textContent = ch
      valueEl.appendChild(sep)
    }
  }

  reels.forEach(({ stack }) => gsap.set(stack, { yPercent: 0 }))

  let played = false

  const setFinal = () => {
    played = true
    reels.forEach(({ stack, target }) => {
      gsap.killTweensOf(stack)
      gsap.set(stack, { yPercent: -10 * target })
    })
  }

  const play = () => {
    if (played) return
    played = true
    reels.forEach(({ stack, target }, i) => {
      gsap.fromTo(
        stack,
        { yPercent: 0 },
        {
          yPercent: -10 * target,
          duration,
          ease,
          delay: i * digitStagger,
        }
      )
    })
  }

  return { host, play, setFinal }
}

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='counter']
 */
export default function (elements) {
  if (typeof gsap === 'undefined') {
    console.warn('[counter] GSAP not found on window — skipping')
    return
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const counters = elements.map(buildCounter).filter(Boolean)
  if (!counters.length) return

  if (reduce) {
    counters.forEach((c) => c.setFinal())
    return
  }

  if (typeof ScrollTrigger === 'undefined') {
    counters.forEach((c, i) =>
      gsap.delayedCall(i * DEFAULTS.stagger, () => c.play())
    )
    return
  }

  const counterByEl = new Map(counters.map((c) => [c.host, c]))

  ScrollTrigger.batch(
    counters.map((c) => c.host),
    {
      once: true,
      start: DEFAULTS.start,
      onEnter: (batch) => {
        batch.forEach((el, i) => {
          const counter = counterByEl.get(el)
          if (counter) {
            gsap.delayedCall(i * DEFAULTS.stagger, () => counter.play())
          }
        })
      },
    }
  )
}
