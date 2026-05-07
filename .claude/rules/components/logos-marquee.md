# logos-marquee

## Overview

Infinite logo marquee. Logos scroll continuously in a seamless loop. The animation is pure CSS — JS only runs once on init to **double the items inside the list** (so CMS-driven setups can ship a single Collection List, the JS clones each item and appends it back into the same list). Class-agnostic: hooks into `data-logo="..."` attributes only, so renaming Webflow classes won't break it.

## Webflow attributes

| Attribute | On | Purpose |
|---|---|---|
| `data-component="logos-marquee"` | The outer section / root | Loads the JS that duplicates `[data-logo="item"]` children of the list on init |
| `data-logo="root"` | The outer section (can be the same element as `data-component="logos-marquee"`) | Clips overflow so the list can't cause horizontal page scroll |
| `data-logo="list"` | The flex container holding the logos (the **inner** Collection List in Webflow CMS — `.w-dyn-items`) | Animated element; JS doubles its items |
| `data-logo="item"` | Each logo wrapper (Collection Item template) | Prevents flex compression |
| `data-logos-direction` | The animated list (`[data-logo="list"]`) | Optional. `"ltr"` (case-insensitive) reverses the marquee so logos scroll **left → right**. Anything else, or omitting the attribute, keeps the default `rtl` (right → left). Each list is independent — sibling marquees can run in opposite directions. |

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

At runtime, JS clones each `[data-logo="item"]` and appends it back into the same `[data-logo="list"]`, marked `aria-hidden="true"`. So a CMS list with 13 items becomes a single list with 26 items, and the seamless `translateX(-50%)` loop has its visual duplicate.

## Invariants

1. The list must be `display: flex` with a consistent `gap` between items — set both in the Webflow Designer. The same gap then applies between the original tail and the cloned head, which is what makes the loop seamless.
2. Items must be `flex-shrink: 0` so they don't compress when the list grows past viewport width.

## Behavior

- Marquee scrolls right-to-left by default, ~40s per full cycle, `linear` (no ease — easings make the loop boundary visible). Set `data-logos-direction="ltr"` on a `[data-logo="list"]` to flip that list to left → right via `animation-direction: reverse`.
- On hover of the list, the animation pauses (`animation-play-state: paused`); resumes from the same position on mouse leave.
- On hover of the list, all logos desaturate to grayscale and only the logo currently under the cursor stays in color (`filter: grayscale()` with a 0.3s ease transition). Pure CSS — no JS, no class toggles. Touch devices don't have sustained hover, so the effect is desktop-only in practice.
- Same speed and layout on every breakpoint — `-50%` is relative to the list's own width, so the seamless loop holds at any viewport size.
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

None. The clone runs once on init and is idempotent (the list is marked with `data-logos-marquee-cloned="true"` so re-runs skip).

## File

`src/components/logos-marquee.js` + `embeds/logos-marquee.css`
