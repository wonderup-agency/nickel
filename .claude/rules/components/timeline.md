# timeline

## Overview

Sticky scroll-driven timeline with **discrete step playback**. The closest `<section>` is **pinned** at the top of the viewport (the wrapper itself is the fallback if there's no section ancestor), and as the user scrolls, each scroll step crosses a threshold that **plays a mini-timeline in full** — half-faded states are never visible. ScrollTrigger `snap` magnetizes the scroll to step boundaries.

Pinning the **section** instead of just the timeline wrapper is intentional: it lets sibling decorations like `[data-component="background-lines"]` (which are usually `position: absolute` inside the section) stay visually still throughout the pin, instead of scrolling past underneath the timeline.

Visual model:
- Each `[data-timeline="line"]` is a **grey base** segment that's always visible. The JS auto-injects a red `[data-timeline-fill]` overlay child that grows `scaleX 0 → 1` per step — so the progress line "advances" one segment at a time as each dot activates.
- Milestone circles always render with a **red border** and a **white fill** at rest. On activation, the inner `.timeline_icon` (a small red dot or image) fades in. The circle's border / background don't change.
- Date / title / bullets fade up alongside the line fill, with a small stagger.
- The intro item (no circle) just runs its line fill + content fade-up.
- Closing spacer line fills last (visual tail).
- Scrolling back up reverses the step's mini-timeline.

If a sibling `[data-component="background-lines"]` exists in the same `<section>`, the JS **moves it inside the timeline wrapper on init** so it pins along with the timeline content (otherwise it scrolls past underneath the pin).

Milestone activations broadcast `CustomEvent`s on the closest `<section>`, which the sibling `timeline-vertical-lines` component consumes.

## Webflow attribute

```
data-component="timeline"
```

## Expected DOM

```html
<section class="section_timeline">
  <div data-component="timeline" class="timeline_component">
    <div class="timeline_list">
      <!-- start spacer (purely visual, no line) -->
      <div data-timeline="spacer" class="timeline_item is-small">…</div>

      <!-- intro step: line fill + content fade-up, no circle -->
      <div data-timeline="item" class="timeline_item">
        <div class="timeline_progress-wrapper">
          <div data-timeline="line" class="timeline17_progress-line"></div>
        </div>
        <div class="timeline17_item-bottom"><!-- copy --></div>
      </div>

      <!-- milestone step × N -->
      <div data-timeline="item" class="timeline_item">
        <div class="timeline_item-top"><!-- date + title --></div>
        <div class="timeline_progress-wrapper">
          <div data-timeline="circle" class="timeline17_circle">
            <img class="timeline_icon" src="…">
          </div>
          <div data-timeline="line" class="timeline17_progress-line"></div>
        </div>
        <div class="timeline17_item-bottom"><!-- bullets --></div>
      </div>

      <!-- closing spacer (line participates as the trailing step) -->
      <div data-timeline="spacer" class="timeline_item is-small">
        <div class="timeline_progress-wrapper">
          <div data-timeline="line" class="timeline17_progress-line"></div>
        </div>
      </div>
    </div>

    <div data-component="timeline-vertical-lines">…</div>
  </div>
</section>
```

**Invariants:**

- The closest `<section>` is what gets pinned (wrapper as fallback).
- **One step per `[data-timeline="line"]` that lives inside a `[data-timeline="item"]`**, in DOM order. Lines inside `[data-timeline="spacer"]` (e.g. the small closing tail) stay as static grey decoration — no fill, no step.
- Milestones (items containing `[data-timeline="circle"]`) are indexed only among themselves (0..N-1) for the broadcast.
- The `.timeline_icon` element lives **inside** the circle and is the thing that appears on activation.

## Behavior

### Pin + step playback (no scrub)

A single `ScrollTrigger` triggers off the timeline wrapper but pins the closest section:

```
trigger: wrapper
start:   "top top+=<navbar height>px"   // dynamic — measured at runtime
end:     "+=" + segments.length * VH_PER_STEP * window.innerHeight
pin:     section            // wrapper.closest('section') — fallback to wrapper
pinSpacing: true
anticipatePin: 1
invalidateOnRefresh: true
snap:    snapTo 1/segments.length, duration 0.2–0.5s, delay 0.08s, power2.inOut
```

Pinning the section means everything inside it (the timeline content, plus sibling decorations like `[data-component="background-lines"]` that are positioned absolute relative to the section) stays visually still during the pin. The user keeps scrolling, but the section is fixed in place while the steps progress.

The `start` offset is computed dynamically at refresh time by reading `[data-component="navbar"]`'s height — so the heading isn't clipped behind a fixed navbar. If no navbar component exists on the page, the offset is 0 and the section pins flush to the viewport top.

The `onUpdate` callback maps current scroll progress to a step index using `Math.floor(p * segments.length + STEP_EPSILON)` and **plays/reverses the corresponding step timeline** when the index changes. The `STEP_EPSILON` (1e-4) protects against snap landings that arrive as `0.4999...` instead of `0.5` due to floating-point — without it, the matching step would be silently dropped on the floor() rounding.

### Per-step animation (paused mini-timeline)

For a milestone step:

| Tween | Position offset | Duration | Ease |
|---|---|---|---|
| Line fill (`scaleX` on `[data-timeline-fill]`) | `0` | `0.6` | `power2.out` |
| Icon reveal (`autoAlpha`) | `+0.15` | `0.4` | `power2.out` |
| `.timeline_item-top` fade-up | `+0.10` | `0.5` | `power3.out` |
| `.timeline17_item-bottom` fade-up | `+0.20` | `0.55` | `power3.out` |

For the intro step (no circle):

| Tween | Position offset | Duration | Ease |
|---|---|---|---|
| Line fill | `0` | `0.6` | `power2.out` |
| `.timeline_item-top` + `.timeline17_item-bottom` fade-up | `0` | `0.55` | `power3.out` |

When the user scrolls back up past a step's threshold, that step's timeline plays in `.reverse()` — fill recedes, icon fades out, content slides back down.

### Custom events (broadcast on `closest("section")`)

| Event | Detail | Fires when |
|---|---|---|
| `timeline:progress` | `{ progress }` (0..1) | Every scroll update inside the pin |
| `timeline:milestone` | `{ index, total }` | A milestone step is crossed forward |
| `timeline:milestone-leave` | `{ index, total }` | A milestone step is crossed backward |

`index` is the milestone's position among **circled segments only** — the intro item doesn't shift the index.

### Sibling decorations during the pin

Because the section itself is pinned, any decoration positioned inside it (e.g. `[data-component="background-lines"]` styled with `position: absolute; inset: 0`) stays in place automatically — no DOM manipulation needed. Keep authoring such decorations as siblings of `[data-component="timeline"]` inside the section, and they'll behave naturally throughout the pin.

For this to work, the **section must be the closest `<section>` ancestor** of the timeline wrapper, and the decorations must be positioned relative to that section (the most common Webflow pattern). If the section is significantly taller than the viewport, the user only sees the portion that was visible at the moment the pin started.

## Accessibility

- `prefers-reduced-motion: reduce` (via `gsap.matchMedia`) — pin and step animations are completely skipped. All fills render as fully grown, icons render as visible, content render as visible. Milestone events still fire once on init so the sibling vertical-lines component syncs.
- Content (`.timeline_item-top`, `.timeline17_item-bottom`) is hidden via `opacity` (not `autoAlpha`) so screen readers and tab focus still see it. Icons use `autoAlpha` (decorative).
- Animation is on `transform` + `opacity` only — no layout thrash.

## Required CSS

**The JS sets every structural style the component needs inline via `gsap.set`** — `position: relative` + `overflow: hidden` on the line, full-bleed positioning + `background: var(--base--red)` on the auto-injected `[data-timeline-fill]` overlay, etc. The component works with **zero CSS embed**.

[`embeds/timeline.css`](../../../embeds/timeline.css) is **optional**. The only thing it adds is `[data-component='timeline'] .timeline_icon { opacity: 0 }` to pre-paint hide the icons before JS runs (avoids a flash). Paste into **Webflow → Project Settings → Custom Code → Head** if the flash bothers you; skip otherwise.

## Required Webflow setup

| Element | Resting state (Webflow Designer) |
|---|---|
| `.timeline17_circle` | `border: 2px solid var(--base--red)`, `background: #fff` (or your white token), `border-radius: 50%`, sized however |
| `.timeline_icon` | Sized small inside the circle (e.g. 8px dot or img). Color: `var(--base--red)` for a dot. CSS embed handles the initial `opacity: 0`. |
| `.timeline_vertical-line` | `background: var(--base--gray)` |

**Sizing for the pin**: `.timeline_component` should fit within one viewport (e.g. `min-height: 100vh; display: flex; flex-direction: column; justify-content: center;`). The pin holds it at `top: 0` for the configured scroll distance.

**Cross-column row alignment (use CSS subgrid)**: `.timeline_item-top` heights vary depending on whether titles wrap. Without subgrid, each item's progress-wrapper falls at a different y-position, leaving the horizontal line zigzagging. Use a multi-column × 3-row grid on `.timeline_list` and have each `.timeline_item` participate in the parent rows via subgrid:

```css
.timeline_list {
  display: grid;
  grid-template-columns: 0.6fr 1.2fr 1.2fr 1.2fr 1.2fr 0.6fr; /* spacers + items */
  grid-template-rows: auto auto auto;
  column-gap: 0;
  row-gap: 1.5rem;
}
.timeline_item {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
}
.timeline_item-top         { grid-row: 1; }
.timeline_progress-wrapper { grid-row: 2; }
.timeline17_item-bottom    { grid-row: 3; }
```

This guarantees every `.timeline_progress-wrapper` sits in row 2, so the horizontal line is one continuous straight axis across the whole timeline regardless of which titles wrap.

**Circle / vertical-line alignment**: columns should butt up against each other (no horizontal padding on `.timeline_item`) — put padding on inner elements (`.timeline_item-top`, `.timeline17_item-bottom`) instead. The circle's negative `left` (e.g. `-14px` for a 28px circle) then puts its center exactly on the column boundary, where the vertical lines are.

**Vertical lines**: render **one per milestone circle**, not one per column. Place each line on the column where its circle lives via `grid-column`, e.g. with 3 milestones in columns 3, 4, 5:

```css
.timeline_vertical-line:nth-child(1) { grid-column: 3; } /* under milestone 1 */
.timeline_vertical-line:nth-child(2) { grid-column: 4; } /* under milestone 2 */
.timeline_vertical-line:nth-child(3) { grid-column: 5; } /* under milestone 3 */
```

## Dependencies

- **GSAP** (global `gsap`) — required.
- **ScrollTrigger** (global `ScrollTrigger`) — required.

If either is missing, logs a warning and skips.

## Lifecycle hooks

- **resize**: calls `ScrollTrigger.refresh()`. Combined with `invalidateOnRefresh: true` and the function-based `end`, the pin distance is recomputed against the new viewport height.

## Tuning

The constants at the top of [`src/components/timeline.js`](../../../src/components/timeline.js) are the knobs:

| Constant | Default | What it controls |
|---|---|---|
| `VH_PER_STEP` | `0.5` | Pin scroll length, per step, in viewport heights |
| `FILL_DURATION` | `0.6` | Line fill (red overlay scaleX) duration |
| `ICON_DURATION` | `0.4` | Icon fade-in duration |
| `TOP_DURATION` / `BOTTOM_DURATION` | `0.5 / 0.55` | Content fade-up durations |
| `ICON_DELAY` / `TOP_DELAY` / `BOTTOM_DELAY` | `0.15 / 0.10 / 0.20` | Stagger inside a step (relative to step start) |
| `SNAP_DURATION_MIN` / `SNAP_DURATION_MAX` | `0.2 / 0.5` | Snap animation length range |
| `SNAP_DELAY` | `0.08` | How long ScrollTrigger waits after scroll stops before snapping |
| `STEP_EPSILON` | `1e-4` | Floating-point guard for the floor() rounding at snap points |
| `PIN_EXTRA_OFFSET_PX` | `32` | Extra breathing room (px) below the fixed navbar before the pin starts — keeps the heading from sitting flush against the navbar |

Use [`playground/timeline/index.html`](../../../playground/timeline/index.html) to fine-tune in the browser via the live panel (it mirrors the same constants and lets you toggle snap on/off), then copy the values back here.

## File

`src/components/timeline.js`
