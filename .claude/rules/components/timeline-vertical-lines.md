# timeline-vertical-lines

## Overview

Vertical column dividers that animate independently when the closest `<section>` reaches 50% of the viewport. Each line grows top-to-bottom (`scaleY: 0 → 1`) with a small stagger left → right. **Not tied to the timeline** — runs on its own ScrollTrigger and doesn't listen for any milestone events.

## Webflow attribute

```
data-component="timeline-vertical-lines"
```

## Expected DOM

```html
<section class="section_timeline">
  <div data-component="timeline">…</div>

  <div data-component="timeline-vertical-lines" class="timeline_vertical-lines">
    <div class="timeline_vertical-line"></div>
    <div class="timeline_vertical-line"></div>
    <div class="timeline_vertical-line"></div>
    <div class="timeline_vertical-line"></div>
    <div class="timeline_vertical-line"></div>
  </div>
</section>
```

**Invariants:**

- Render as many `.timeline_vertical-line` elements as needed for the visual column grid — count is independent from the timeline's milestone count.
- The component animates the lines in **DOM order**, so place them left-to-right in the markup so the stagger flows the same direction.
- Must share a common ancestor `<section>` so the trigger can fire when the section enters viewport.

## Behavior

- **Initial state**: `scaleY: 0`, `transformOrigin: "top center"` — lines collapsed at the top.
- **Trigger**: `ScrollTrigger { trigger: section, start: "top 50%", once: true }` — fires once when the section's top crosses 50% of the viewport.
- **Animation**: each line tweens `scaleY: 1`, duration `0.7s`, ease `power3.out`, stagger `0.08s`. The stagger picks up DOM order, producing a left-to-right cascade.
- After firing once, no further animations — the lines remain visible.

## Accessibility

- `prefers-reduced-motion: reduce` (via `gsap.matchMedia`) — lines are set to `scaleY: 1` immediately, no scroll trigger, no stagger.
- Lines are decorative — no ARIA attributes needed.

## Required CSS

None. Sizing/positioning of `.timeline_vertical-line` is authored in the Webflow Designer (typically grid-positioned at column boundaries inside the timeline). The JS only manipulates `transform` via GSAP.

## Dependencies

- **GSAP** (global `gsap`) — required.
- **ScrollTrigger** (global `ScrollTrigger`) — required.

If either is missing, logs a warning and skips.

## Lifecycle hooks

None. The trigger fires once and uses `start: "top 50%"`, so it adapts naturally to viewport height changes (ScrollTrigger refreshes positions on resize automatically).

## Tuning

The constants at the top of [`src/components/timeline-vertical-lines.js`](../../../src/components/timeline-vertical-lines.js):

| Constant | Default | What it controls |
|---|---|---|
| `STAGGER` | `0.08` | Seconds between each line's start (left → right) |
| `DURATION` | `0.7` | Per-line `scaleY` tween duration |
| `EASE` | `power3.out` | Ease curve |
| `TRIGGER_START` | `top 50%` | Where in the viewport the section triggers the animation |

## File

`src/components/timeline-vertical-lines.js`
