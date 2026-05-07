# counter

## Overview

Odometer-style number counter. Each digit becomes a vertical reel of 0–9 clipped to one digit height; non-digit characters (`.`, `,`, `x`, `%`, `$`, `+`, `k`) render as static spans so spacing stays correct. The end value, prefix, suffix and decimal count are **auto-parsed from the existing text content** — in most cases no data attributes are needed.

Animation triggers on scroll (top 85% of viewport) once per element. Multiple counters that enter the viewport together are staggered.

## Webflow attribute

```
data-component="counter"
```

## Expected DOM

```html
<div data-component="counter" class="stats-grid_number">
  <div class="component-rich-text w-richtext">
    <p>34x</p>
  </div>
</div>
```

The text can be nested any depth inside the host — the script walks the tree and operates on the first element with non-empty text content. So a Webflow rich-text wrapper around the number works as-is.

## Auto-parse rules

The text inside the inner element is parsed as `<prefix><number><suffix>`:

| Text       | end    | prefix | suffix | decimals |
| ---------- | ------ | ------ | ------ | -------- |
| `34x`      | 34     | —      | `x`    | 0        |
| `99.5%`    | 99.5   | —      | `%`    | 1        |
| `$1,250`   | 1250   | `$`    | —      | 0        |
| `10k+`     | 10     | —      | `k+`   | 0        |
| `-42°`     | -42    | —      | `°`    | 0        |

Commas inside the number are stripped (treated as thousands separators). Decimal places are inferred from the number of digits after the dot.

## Optional data-attribute overrides

All optional. Set on the `[data-component="counter"]` element to override the auto-parsed values or tweak timing per instance.

**Empty / whitespace-only attribute values are treated as "not set"** — useful for Webflow Component instances where you bind attribute slots but leave them blank by default. The parsed text wins in that case.

| Attribute                  | What it controls                                            |
| -------------------------- | ----------------------------------------------------------- |
| `data-counter-end`         | End value (number)                                          |
| `data-counter-decimals`    | Decimal places to render                                    |
| `data-counter-prefix`      | Leading static chars (`$`, etc.)                            |
| `data-counter-suffix`      | Trailing static chars (`%`, `x`, `+`, etc.)                 |
| `data-counter-duration`    | Tween duration in seconds (default `2.5`)                   |
| `data-counter-ease`        | GSAP ease (default `expo.out`)                              |
| `data-counter-digit-stagger` | Seconds between digit reels, leftmost first (default `0.15`) |

Example: a counter that should animate to a different number than what's in the rich text:

```html
<div data-component="counter" data-counter-end="2024" data-counter-suffix="">
  <p>0</p>
</div>
```

## Behavior

- **Init**: Walks each host to find the inner text element, parses the text, applies overrides, replaces the text element's children with `[data-counter="reel"]` spans (one per digit) and `[data-counter="static"]` spans (for separators). Sets each reel's stack to `yPercent: 0` (showing "0").
- **Scroll trigger**: A single `ScrollTrigger.batch` watches all hosts. When one or more enter at `top 85%`, each counter in the batch plays with a `0.2s` stagger between instances. Triggers once per page load.
- **Per-counter playback**: Each digit reel tweens `yPercent` to `-10 * target` (e.g., target digit `4` → `-40%`). Reels stagger left-to-right by `0.15s` so the leftmost digit lands first.
- **No ScrollTrigger fallback**: If `ScrollTrigger` isn't loaded, all counters play immediately on load with the same instance stagger.
- **Reduced motion**: `prefers-reduced-motion: reduce` skips animation and renders each reel at its final position.

## DOM elements created by JS

The original text element gets `data-counter="value"` added to it and its children replaced with:

| Element | Attribute              | Inserted into          |
| ------- | ---------------------- | ---------------------- |
| Reel    | `data-counter="reel"`  | `[data-counter="value"]` |
| Stack   | `data-counter="stack"` | each reel              |
| Digit   | `data-counter="digit"` | each stack (×10)       |
| Static  | `data-counter="static"` | `[data-counter="value"]` (for separators) |

## Required CSS

Paste [`embeds/counter.css`](../../../embeds/counter.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`). Selectors are class-agnostic — they target `data-counter` attributes only, so the styling is invariant to whatever Webflow class ends up on the inner text element.

The embed handles:

- Inline-flex layout on the value element with baseline alignment.
- Clipping each reel to one digit height via `clip-path` (not `overflow: hidden` — that would break baseline alignment with sibling static chars).
- An invisible `::before { content: "0" }` on each reel so the reel has real in-flow text and its baseline matches surrounding chars.
- Absolute-positioned stacks with `will-change: transform` to keep tweens on the GPU.

## Accessibility

- The value element gets `aria-label` set to the final string (e.g. `"34x"`) and `aria-live="polite"` so screen readers announce the result, not the intermediate digits.
- All injected reel/digit/static spans are `aria-hidden="true"`.
- `prefers-reduced-motion: reduce` jumps straight to the final state.

## Dependencies

- **GSAP** (global `gsap`) — required. Loaded natively by Webflow on every page.
- **ScrollTrigger** (global `ScrollTrigger`) — optional but recommended. Without it, counters play immediately on load instead of on scroll.

If GSAP is missing, the component logs a warning and skips.

## Lifecycle hooks

None. The animation runs once per page load.

## File

`src/components/counter.js`
