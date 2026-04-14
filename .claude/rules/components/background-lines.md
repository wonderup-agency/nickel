# background-lines

## Overview

Animates diagonal background lines with a top-to-bottom mask reveal effect using GSAP.

## Webflow attribute

```
data-component="background-lines"
```

## Expected DOM

```html
<div data-component="background-lines" class="background_lines-component">
  <div class="background_lines"></div>
  <div class="background_lines is-right"></div>
</div>
```

## Behavior

- On load, all `.background_lines` inside each wrapper are hidden via a CSS mask set to 0%.
- When the wrapper scrolls into view (top 85% of viewport), each line animates a `linear-gradient` mask from 0% to 100% over 2 seconds with `power2.inOut` easing.
- Multiple lines stagger by 0.4s each.
- After animation completes, the mask styles are removed to avoid interfering with other styling.

## Dependencies

- **GSAP** (global `gsap`) — required; logs a warning and skips if not found.
- **ScrollTrigger** (global `ScrollTrigger`) — optional; if available, the animation triggers on scroll. If not, it plays immediately on load.

## Lifecycle hooks

None.

## File

`src/components/background-lines.js`
