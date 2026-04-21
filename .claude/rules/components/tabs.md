# tabs

## Overview

Dynamic tabs with an accordion body on the left and a cross-fading image on the right. The number of tabs is read from the DOM — JS adapts automatically.

- Active tab: gets `is-active` class, paragraph expands like an accordion, full opacity.
- Inactive tabs: reduced opacity, paragraph collapsed to height 0.
- Image panes: switch with a smooth top-to-bottom clip-path curtain reveal.

## Webflow attribute

```
data-component="tabs"
```

## Expected DOM

```html
<section data-component="tabs" class="section_tabs">
  <div class="tabs_component">
    ...
    <div class="tabs_tabs-content">
      <!-- one pane per tab, in the same order as links -->
      <div data-tabs="pane" class="tabs_tab-pane">
        <div class="tabs_image-wrapper">
          <img data-tabs="image" class="tabs_image" />
        </div>
      </div>
      <!-- more panes -->
    </div>
    <div class="tabs_menu">
      <!-- one link per tab -->
      <div data-tabs="link" class="tabs_tab-link">
        <div class="tabs_tab-top">
          <div class="tabs_tab-title">
            <h3>Tab title</h3>
            <div class="layout497_tab-icon-wrapper">
              <div class="tabs_icon"><!-- "+" svg (shown when inactive) --></div>
              <div data-tabs="icon" class="tabs_icon"><!-- "−" svg (shown when active) --></div>
            </div>
          </div>
          <div class="tabs_paragraph">
            <p>Tab body copy.</p>
          </div>
        </div>
      </div>
      <!-- more links -->
    </div>
  </div>
</section>
```

The number of `[data-tabs="pane"]` elements must match the number of `[data-tabs="link"]` elements (1:1 by index).

## Behavior

- **First tab is active on load** — its paragraph is expanded, `is-active` applied, full opacity; its pane is fully visible; its icon shows as "−".
- **Click a tab** to activate it:
  - Previously active tab: paragraph collapses (height → 0), opacity fades down, `is-active` removed, icon morphs back to "+".
  - New active tab: paragraph expands (height → auto), opacity fades up, `is-active` added, icon morphs from "+" to "−".
  - Image pane swaps via a top-to-bottom clip-path curtain (`inset(0% 0% 100% 0%)` → `inset(0% 0% 0% 0%)`) on top of the previous pane. The previous pane stays visible behind until the new one fully covers it, so there's never a blank frame.
- **Rapid clicks** are handled gracefully — in-flight tweens are overwritten and panes re-stacked correctly.

## Icon morph ("+" ⇄ "−")

At init, the "+" icon's single `<path>` (which contains two subpaths in its `d` attribute — `M... H...` for horizontal and `M... V...` for vertical) is split into two separate `<path>` elements in the SVG. The vertical `<path>` is then animated with `scaleY: 1 ⇄ 0` around its center (`transformOrigin: 50% 50%`), synced to the accordion duration and ease, so the vertical legs retract/extend smoothly and the remaining horizontal line reads as "−" when active.

The standalone `[data-tabs="icon"]` element (the "−" svg in the original markup) is unused and hidden via the CSS embed. It can be removed from the Webflow structure if desired.

## Timings & easing

| Animation | Duration | Ease |
|-----------|----------|------|
| Curtain reveal | 0.9s | `power3.inOut` |
| Paragraph accordion | 0.55s | `power3.inOut` |
| Icon "+" ⇄ "−" morph | 0.55s | `power3.inOut` |
| Link opacity fade | 0.4s | `power2.out` |
| Inactive opacity | 0.4 | — |

## Required CSS

Paste [`embeds/tabs.css`](../../../embeds/tabs.css) into **Webflow → Project Settings → Custom Code → Head** (inside a `<style>` tag). It contains only rules that can't be authored in the Webflow Designer:

- Hiding the standalone `[data-tabs="icon"]` (the redundant "−" icon — the plus animates into a minus via GSAP).
- `[data-tabs="link"]:last-child` → `border-bottom-color: transparent` (removes the divider under the last tab).

Everything else is styled manually in the Webflow Designer:

- Stack all `[data-tabs="pane"]` elements in the same spot (e.g. `position: absolute; inset: 0;` on panes with a positioned wrapper, or `display: grid` with all panes in `grid-area: 1 / 1`). Required so the curtain-drop pane overlays the previous one cleanly.
- `overflow: hidden` on `.tabs_paragraph` — required for the accordion to clip at height 0.
- `cursor: pointer` on `[data-tabs="link"]`.

## Dependencies

- **GSAP** (global `gsap`) — required; loaded natively by Webflow. Logs a warning and skips if not found.

## Lifecycle hooks

None.

## File

`src/components/tabs.js`
