# pricing

## Overview

Custom tabs for the pricing section with an animated pill that slides between tab links like a switch. The active link's text color flips (black → white via `is-active`), and the tab panes cross-fade.

## Webflow attribute

```
data-component="pricing"
```

## Expected DOM

```html
<section data-component="pricing" class="section_pricing">
  <div class="pricing_tabs">
    <div class="pricing_tabs-menu">
      <div data-pricing="tab-link" class="pricing_tab-link is-active">
        <!-- "Anual" + 20% off tag -->
      </div>
      <div data-pricing="tab-link" class="pricing_tab-link">
        <!-- "Monthly" -->
      </div>
    </div>
    <div class="princing_tabs-content">
      <div data-pricing="tab-pane" class="princing_tab-pane">
        <!-- pane 1 content (matches link 1 by index) -->
      </div>
      <div data-pricing="tab-pane" class="princing_tab-pane">
        <!-- pane 2 content -->
      </div>
    </div>
  </div>
</section>
```

Links and panes are matched 1:1 by DOM order. Count must match.

## Behavior

- **Init**: Reads which `[data-pricing="tab-link"]` has `is-active` and positions the pill on it. Hides all non-active panes (`autoAlpha: 0`).
- **Click a tab**:
  - `is-active` class moves from the old link to the new one.
  - Pill animates `x` + `width` to match the new link (`0.4s`, `power2.out`).
  - Old pane fades out (`0.25s`), new pane fades in (`0.25s`), `power2.out`.
  - Clicking the already-active tab is a no-op.
  - Pair the text-color CSS transition to the same duration + curve so the color flip stays synced with the pill: `transition: color 0.4s cubic-bezier(0.25, 1, 0.5, 1)`.
- **Rapid clicks**: `overwrite: true` on each tween — no animation pile-up.

## DOM elements created by JS

| Element | Class | Inserted into |
|---------|-------|--------------|
| Pill | `pricing_tab-pill` | `.pricing_tabs-menu` (prepended) |

## Required CSS

Paste [`embeds/pricing.css`](../../../embeds/pricing.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`). It only contains:

- `.pricing_tab-pill` absolute positioning + `z-index: 0` + `pointer-events: none`.
- `.pricing_tab-link` `position: relative` + `z-index: 1` so links sit above the pill.
- `.pricing_tab-link` base color black; `.is-active` forces color white (including nested rich-text children, since the copy lives inside `.w-richtext > p`).

Everything else is styled in the Webflow Designer:

- `.pricing_tabs-menu`: `position: relative`, flex row, background of the pill track, border-radius, padding. No `overflow: hidden` needed — the pill is sized to the link.
- `.pricing_tab-link` (base): padding, border-radius (matches pill), `cursor: pointer`, text color **black**.
- `.pricing_tab-link.is-active`: text color **white**. No background — the pill provides it.
- `.pricing_tab-pill`: background-color (black), border-radius (same as links).
- `.princing_tab-pane`: stacked however (they don't need to overlay — only one is visible at a time via `autoAlpha`).

**Remove the old black background from `.pricing_tab-link.is-active` in Webflow** — the pill replaces it.

## Dependencies

- **GSAP** (global `gsap`) — required; loaded natively by Webflow. Logs a warning and skips if not found.

## Lifecycle hooks

- **resize**: Recalculates the pill's position and size so it stays aligned with the active link when the viewport width changes.

## File

`src/components/pricing.js`
