# grid-custom

## Overview

Fully numeric custom grid. Independent sibling of [`bento-layout`](bento-layout.md) — same logic and capabilities, different namespace and embed file, so it can evolve in isolation. The wrapper declares its column count + gap, each card declares its colspan and (optionally) rowspan. Pure CSS, no JavaScript. Designed to be wrapped in a Webflow Component so editors change layout from the right-hand panel without touching attributes.

## Webflow attribute

```
data-component="grid-custom"
```

Place on the `<section>` (or wrapper) that contains `.grid-custom_list`.

## Expected DOM

```html
<section data-component="grid-custom" class="section_grid-custom">
  <div class="grid-custom_list" data-grid-cols="6" data-grid-gap="1">

    <!-- One full-width card -->
    <div class="grid-custom_card" data-grid-colspan="6">…</div>

    <!-- Two halves -->
    <div class="grid-custom_card" data-grid-colspan="3">…</div>
    <div class="grid-custom_card" data-grid-colspan="3">…</div>

    <!-- Three thirds -->
    <div class="grid-custom_card" data-grid-colspan="2">…</div>
    <div class="grid-custom_card" data-grid-colspan="2">…</div>
    <div class="grid-custom_card" data-grid-colspan="2">…</div>

  </div>
</section>
```

Cards auto-flow into the next available cell. As long as each "row" of card colspans sums to `data-grid-cols`, you control the layout entirely from attributes.

## Attributes

### `.grid-custom_list` → `data-grid-cols`

| Value     | Desktop columns        |
| --------- | ---------------------- |
| `2`–`12`  | `repeat(N, 1fr)`       |
| _(none)_  | falls back to 6        |

### `.grid-custom_list` → `data-grid-gap` (optional)

| Value | Gap |
|-------|-----|
| `0`     | 0    |
| `0.25`  | `0.25rem` |
| `0.5`   | `0.5rem`  |
| `0.75`  | `0.75rem` |
| `1`     | `1rem`    |
| `1.5`   | `1.5rem`  |
| `2`     | `2rem`    |
| `2.5`   | `2.5rem`  |
| `3`     | `3rem`    |
| `4`     | `4rem`    |
| _(none)_ | whatever Webflow Designer sets |

Skip the attribute and set `gap` directly in Webflow Designer if you want a custom value not on the list.

### `.grid-custom_card` → `data-grid-colspan`

| Value     | Span on desktop |
| --------- | --------------- |
| `1`–`12`  | `grid-column: span N` |
| _(none)_  | spans 1 column  |

`colspan` should never exceed the wrapper's `cols` (the embed only wires up values 1–12).

### `.grid-custom_card` → `data-grid-rowspan` (optional)

| Value     | Span on desktop |
| --------- | --------------- |
| `2`–`5`   | `grid-row: span N` |
| _(none / `1`)_ | spans 1 row |

Reset to `auto` on tablet/mobile.

### `.grid-custom_card` → `data-grid-tablet="full"` (optional)

Force a card to full-width (2/2 cols) on tablet, even when its desktop colspan would otherwise auto-collapse to half. Useful when the auto-rule below isn't quite right for a particular card.

## Responsive behavior

- **Desktop (≥992px):** N-column grid based on `data-grid-cols`. Cards span what `data-grid-colspan` says. Gap from `data-grid-gap` or Designer.
- **Tablet (768–991px):** grid collapses to **2 columns**. Auto-collapse rule:
  - Cards spanning **>50%** of desktop cols → full-width on tablet (2/2).
  - Cards spanning **≤50%** → half-width (1/2).
  - Override per card with `data-grid-tablet="full"`.
  - `rowspan` is reset to `auto`.
- **Mobile (≤767px):** single-column stack. Every card goes full-width in DOM order.

The auto-collapse rule is enumerated in CSS for every (cols, colspan) combination from cols=2 to cols=12. No JS — pure CSS.

## Required CSS

Paste [`embeds/grid-custom.css`](../../../embeds/grid-custom.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`).

The embed uses `!important` on every span/cols/gap rule — Webflow's native grid system auto-generates `#w-node-… { grid-area: … }` rules for any element placed inside a Designer-built grid, and those would otherwise override the data-attribute spans.

Everything else (card backgrounds, padding, image sizing, etc.) stays in the Webflow Designer.

**Recommended Designer settings on `.grid-custom_list`:**

- `display: grid` — also set in Designer for consistency.
- `gap` — only if you're not using `data-grid-gap`.
- Don't assign `grid-template-areas` or per-child `grid-column-start/end` in Designer.

**Recommended Designer settings on `.grid-custom_card`:**

- Background, border-radius, padding — all in Designer.
- `min-height` if you want short-content cards to match taller siblings.
- Don't set `grid-column` or `grid-row` in Designer.

## Webflow Component setup (step-by-step)

The embed turns into a customizable component by binding the four attributes (`cols`, `gap`, `colspan`, `rowspan`, `tablet full`) to Component Properties so the editor can change them per instance from the right-hand panel.

### 1. Create the base structure in Designer

1. Drop a `<section>` and add the custom attribute `data-component` = `grid-custom`.
2. Inside, add a `<div>` with class `grid-custom_list` and the custom attributes `data-grid-cols` = `6` and `data-grid-gap` = `1`.
3. Inside the grid, add a `<div>` with class `grid-custom_card` and the custom attribute `data-grid-colspan` = `2`. Build out the card's inner structure (heading, paragraph, image-wrapper, etc.).
4. Style everything in the Designer (backgrounds, padding, etc.).

### 2. Convert the card to a "Grid Custom Card" Component

1. Select the `.grid-custom_card` element.
2. Right-click → **Create Component** (or `⌘ + ⇧ + A`). Name it `Grid Custom Card`.
3. With the component template open, click the **Properties** panel → **+ Add property**:
   - **Property 1**: `Colspan`, type `Plain text`, default value `2`
   - **Property 2**: `Rowspan`, type `Plain text`, default value `1`
   - **Property 3**: `Tablet full width`, type `Visibility` (boolean toggle)
4. Bind the properties to attributes:
   - Edit `data-grid-colspan` → bind value to `Colspan`.
   - Add `data-grid-rowspan` → bind value to `Rowspan`.
   - Add `data-grid-tablet` with value `full` → bind its visibility to `Tablet full width`.
5. Add any text/image/link properties for the card content (heading, body, image, etc.).
6. Close the template.

### 3. Convert the grid wrapper to a "Grid Custom" Component

1. Select the `.grid-custom_list` element (the parent of the cards).
2. Right-click → **Create Component**. Name it `Grid Custom`.
3. Inside the template, the children should be the `Grid Custom Card` instances you set up in step 2.
4. Open the **Properties** panel for `Grid Custom`:
   - **Property 1**: `Cols`, type `Plain text`, default `6`.
   - **Property 2**: `Gap`, type `Plain text`, default `1`.
5. Bind them to the `.grid-custom_list` attributes (`data-grid-cols` ↔ `Cols`, `data-grid-gap` ↔ `Gap`).
6. Close the template.

### 4. Use it on a page

1. Drag a `Grid Custom` instance from the Components panel onto the page.
2. With the instance selected, the right-hand Properties panel shows `Cols` + `Gap`. Type any value 2–12 and any allowed gap.
3. Click on a `Grid Custom Card` instance inside the grid. The Properties panel shows `Colspan`, `Rowspan`, `Tablet full width`. Edit per card.
4. Add or remove `Grid Custom Card` instances from the grid via the navigator (drag in from the Components panel).

## Tips for editors

- **Make rows sum to `Cols`.** If the colspans on a row don't add up to the wrapper's Cols value, the last cell will have a gap (or wrap to a new row).
- **For tall content, use Rowspan.** A phone mockup or tall chart looks better with `Rowspan = 2` than letting the grid stretch all neighbors.
- **`Tablet full width`** is for "hero" cards that look squashed at half-width on tablet. Most cards don't need it — the auto-rule promotes >50% spans automatically.
- **Custom gap?** If none of the `data-grid-gap` presets match, drop the attribute and set `gap` directly in Webflow Designer.

## Dependencies

None. Pure CSS.

## Lifecycle hooks

N/A — no JS file.

## File

`embeds/grid-custom.css` (no JS file)
