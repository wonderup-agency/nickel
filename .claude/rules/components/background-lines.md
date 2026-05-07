# background-lines

## Overview

Animates diagonal background lines with a top-to-bottom mask reveal effect using GSAP. Pairs a small CSS embed with the JS component to avoid the lines flashing visible during page load before GSAP runs.

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

- **First paint** (before JS): the CSS embed pre-hides every `.background_lines` inside an unready wrapper via `mask-image: linear-gradient(to bottom, #000 0%, transparent 0%)`. No flash even if the JS bundle is slow to arrive.
- **JS init**: the component sets the same inline mask on each line (so the visual state is unchanged), then adds `.is-ready` to the wrapper — that removes the CSS pre-hide rule from the cascade and hands ownership of the mask to the JS.
- **On scroll into view** (top 85% of viewport): every line inside the wrapper animates the mask 0% → 100% over 2 seconds with `power2.inOut`, **all in parallel** — no stagger between lines within the same wrapper.
- **Page-level queue across wrappers**: when multiple `[data-component="background-lines"]` exist on the page (one per section), each wrapper waits for the previous wrapper's animation to finish before its own lines start. Implemented via a shared `nextAvailableAt` timestamp that each wrapper reads on trigger and updates on entry. So if the user scrolls fast and triggers section 2 while section 1 is still drawing, section 2's GSAP delay gets set to whatever wait is needed for section 1 to complete.
- **After animation**: the inline mask styles are cleared. Lines stay visible because the wrapper has `.is-ready` so the pre-hide rule doesn't reapply.
- **No GSAP fallback**: if GSAP isn't on the page, the component adds `.is-ready` to every wrapper immediately so the lines reveal without animation rather than staying invisible forever.

## Required CSS

Paste [`embeds/background-lines.css`](../../../embeds/background-lines.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`). Without it the lines will still animate correctly, but they'll flash visible in the milliseconds between first paint and JS load.

## Dependencies

- **GSAP** (global `gsap`) — required for the animation; if missing, lines reveal without animation.
- **ScrollTrigger** (global `ScrollTrigger`) — optional; if available, the animation triggers on scroll. If not, it plays immediately on load.

## Lifecycle hooks

None.

## File

`src/components/background-lines.js`
