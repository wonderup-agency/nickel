# logos-marquee

## Overview

Infinite logo marquee. Logos scroll continuously in a seamless loop. The animation is CSS-driven, but the JS handles two correctness axes:

1. **Period** (the exact distance to translate per cycle). For `display: flex; gap: G` with N originals the period is `sum(originalWidths) + N × gap`. Using `translateX(-50%)` is short by `G/2` because flex produces only N-1 gaps for N items — that missing half-gap is the white sliver users see at the loop boundary. JS measures the period and writes it to `--marquee-distance` on the list; the keyframe consumes it.
2. **Coverage**. When the list is translated by `-period`, the visible window spans list-coordinates `[period, period + viewportWidth]`. The list must therefore be at least `period + viewportWidth` wide. If originals fit in less than one viewport (small or few logos), a single 2× duplication leaves the right edge empty for part of the cycle. JS clones additional copies of the originals until the list is wide enough (`period + viewportWidth + 50px` buffer), and re-runs that check on resize / image-load.

Class-agnostic: hooks into `data-logo="..."` attributes only.

## Webflow attributes

| Attribute | On | Purpose |
|---|---|---|
| `data-component="logos-marquee"` | The outer section / root | Loads the JS that duplicates `[data-logo="item"]` children of the list on init |
| `data-logo="root"` | The outer section (can be the same element as `data-component="logos-marquee"`) | Clips overflow so the list can't cause horizontal page scroll |
| `data-logo="list"` | The flex container holding the logos (the **inner** Collection List in Webflow CMS — `.w-dyn-items`) | Animated element; JS doubles its items |
| `data-logo="item"` | Each logo wrapper (Collection Item template) | Prevents flex compression |
| `data-logos-left-to-right` | The animated list (`[data-logo="list"]`) | Optional. `"true"` (case-insensitive — also matches `"True"`, `"TRUE"`) reverses the marquee so logos scroll **left → right**. Anything else, or omitting the attribute, keeps the default `rtl` (right → left). Each list is independent — sibling marquees can run in opposite directions. |

`data-logo="track"` is allowed (legacy / hover boundary) but **not load-bearing** — the animation runs on the list itself, so wrapper elements between the root and the list (e.g. Webflow's `.w-dyn-list` wrapper) don't break the layout.

## Expected DOM (CMS-driven)

```html
<section data-component="logos-marquee" data-logo="root">
  <!-- heading / padding wrappers -->

  <!-- Webflow renders the Collection List as: -->
  <!-- .w-dyn-list (Collection List Wrapper) > .w-dyn-items (Collection List) -->
  <!-- Put data-logo="list" on the INNER element (.w-dyn-items). -->
  <div class="w-dyn-list">
    <div data-logo="list" class="w-dyn-items">
      <!-- Collection Item template -->
      <div data-logo="item" class="w-dyn-item"><img /></div>
    </div>
  </div>
</section>
```

At runtime, JS appends clones of every `[data-logo="item"]` back into the same `[data-logo="list"]`, marked `aria-hidden="true"`, until the list is at least `period + viewportWidth + 50px` wide. The minimum is one extra copy of the originals (so a wide-enough originals block produces 2× items total — e.g. 13 originals → 26 items); narrow originals trigger more clone passes (e.g. 13 originals → 39 or 52 items). JS then writes the period to `--marquee-distance` on the list, and the keyframe consumes it via `transform: translateX(calc(-1 * var(--marquee-distance, 50%)))`. The `50%` fallback only kicks in if JS hasn't run.

## Invariants

1. The list must be `display: flex` with a consistent `gap` between items — set both in the Webflow Designer. JS reads the computed gap to compute the exact loop distance.
2. Items must be `flex-shrink: 0` so they don't compress when the list grows past viewport width.

## Behavior

- Marquee scrolls right-to-left by default, `linear` (no ease — easings make the loop boundary visible). Duration is **computed per list** as `period / SPEED_PX_PER_SECOND` (default `25 px/s`), exposed as `--marquee-duration` on the list. This means two marquees with different widths run at the **same visual speed** instead of being locked to the same duration. To slow everything down globally, lower `SPEED_PX_PER_SECOND` in [src/components/logos-marquee.js](../../../src/components/logos-marquee.js). Set `data-logos-left-to-right="true"` on a `[data-logo="list"]` to flip that list to left → right via `animation-direction: reverse`.
- On hover of any **logo item** (not on the gaps between items), the JS uses delegated `mouseover` / `mouseout` to detect the item and adds `.is-marquee-paused` to **every list inside the same `[data-component="logos-marquee"]` root** — so two stacked strips inside one section sync together, but a separate section with its own root stays independent. The class pauses the animation (`animation-play-state: paused`) **and** applies the grayscale + 1px blur filter to every logo in those lists. The hovered logo stays in full color and sharp via a `.is-marquee-paused [data-logo="item"]:hover` exception. Moving the cursor between items inside the same group keeps the paused state; mousing out of any item to a gap or off the lists resumes play. Touch devices don't have sustained hover, so the effect is desktop-only in practice.
- Distance is recomputed (a) once on init after two `requestAnimationFrame` ticks (lets layout + flex gap settle), (b) per `<img>` once it decodes (logo widths often depend on intrinsic image size), and (c) on window resize via the `resize` lifecycle hook. The seamless loop therefore holds at any viewport size.
- The root has `overflow: hidden` to prevent the list from causing horizontal page scroll.
- Animates only `transform` — stays on the GPU compositor, no layout/paint per frame.
- `will-change: transform` is set on the list only.

## Why we clone items, not the whole list

An earlier version cloned the entire `[data-logo="list"]` and inserted it as a sibling. With Webflow CMS that breaks: `.w-dyn-list` (the Collection List Wrapper) sits between the track and the inner list, and it's `display: block` by default — so two sibling lists end up stacked vertically instead of side-by-side, leaving a gap at the end of the marquee. Cloning items into the same list keeps everything inside the existing flex layout, regardless of how Webflow wraps the Collection List.

## Accessibility

- `prefers-reduced-motion: reduce` → animation disabled and logos reflow as a centered, wrapping grid so they remain visible.
- Cloned items are marked `aria-hidden="true"` so screen readers don't announce duplicate logos.
- Logos use empty `alt=""` (decorative) — context is provided by the section heading. If logos ever become links, give each `alt` the brand name.
- Hover-pause covers desktop "let me read that one" use cases. Touch devices don't have sustained hover, so the marquee keeps scrolling on mobile — expected behavior.

## Editor mode

Inside the Webflow Designer/Editor, the marquee can be paused via `.w-editor [data-logo="list"] { animation: none; }` if it interferes with editing.

## Required CSS

Paste [`embeds/logos-marquee.css`](../../../embeds/logos-marquee.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`). Selectors target `data-logo` attributes only — they're class-agnostic.

## Dependencies

The bundled JS file at `src/components/logos-marquee.js` must load (which happens automatically when `data-component="logos-marquee"` is on the page). Without JS, only the original items render — no seamless loop.

## Lifecycle hooks

- **resize**: re-runs the ensure-marquee pass on every `[data-logo="list"]`. If the viewport grew, more clones are appended until coverage is restored; the period is also re-written in case widths changed.

The original item count is stashed on `data-logos-marquee-original-count` on the list the first time the component runs, so subsequent passes (image-load, resize) can correctly slice the originals out of the (now doubled or tripled) list. Adding clones is bounded by a safety cap (max 10 passes) so a degenerate measurement can't loop forever.

## Diagnostic logs

The current implementation emits a `[logos-marquee] measure` `console.log` per pass (init, image-load, resize) with: `originalCount`, `totalAfterClone`, `addedThisPass`, `gapPx`, `sumOriginalsWidthPx`, `periodPx`, `viewportWidthPx`, `targetWidthPx`, `listScrollWidth`. These are **temporary** — remove them once the seamless loop is verified in production.

## File

`src/components/logos-marquee.js` + `embeds/logos-marquee.css`
