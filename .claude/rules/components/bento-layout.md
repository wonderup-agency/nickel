# bento-layout

## Overview

Fully numeric bento grid. The wrapper declares its column count, each card declares its colspan and (optionally) rowspan. Pure CSS — no JavaScript. Designed to be wrapped in a Webflow Component so editors change layout from the right-hand panel without touching attributes.

## Webflow attribute

```
data-component="bento-layout"
```

Place on the `<section>` (or wrapper) that contains `.bento-layout_grid-list`.

## Expected DOM

```html
<section data-component="bento-layout" class="section_bento-layout">
  <div class="bento-layout_grid-list" data-bento-cols="6">

    <!-- One full-width card -->
    <div class="bento-layout_card" data-bento-colspan="6">…</div>

    <!-- Two halves -->
    <div class="bento-layout_card" data-bento-colspan="3">…</div>
    <div class="bento-layout_card" data-bento-colspan="3">…</div>

    <!-- Three thirds -->
    <div class="bento-layout_card" data-bento-colspan="2">…</div>
    <div class="bento-layout_card" data-bento-colspan="2">…</div>
    <div class="bento-layout_card" data-bento-colspan="2">…</div>

  </div>
</section>
```

Cards auto-flow into the next available cell. As long as each "row" of card colspans sums to `data-bento-cols`, you control the layout entirely from attributes.

## Attributes

### `.bento-layout_grid-list` → `data-bento-cols`

| Value     | Desktop columns        |
| --------- | ---------------------- |
| `2`–`12`  | `repeat(N, 1fr)`       |
| _(none)_  | falls back to 6        |

### `.bento-layout_card` → `data-bento-colspan`

| Value     | Span on desktop |
| --------- | --------------- |
| `1`–`12`  | `grid-column: span N` |
| _(none)_  | spans 1 column  |

`colspan` should never exceed the wrapper's `cols` (the embed clamps via the available CSS rules — values 1–12 are wired up).

### `.bento-layout_card` → `data-bento-rowspan` (optional)

| Value     | Span on desktop |
| --------- | --------------- |
| `2`–`5`   | `grid-row: span N` |
| _(none / `1`)_ | spans 1 row |

Reset to `auto` on tablet/mobile.

### `.bento-layout_card` → `data-bento-tablet="full"` (optional)

Force a card to full-width (2/2 cols) on tablet, even when its desktop colspan would otherwise auto-collapse to half. Useful when the auto-rule below isn't quite right for a particular card.

## Responsive behavior

- **Desktop (≥992px):** N-column grid based on `data-bento-cols`. Cards span what `data-bento-colspan` says.
- **Tablet (768–991px):** grid collapses to **2 columns**. Auto-collapse rule:
  - Cards spanning **>50%** of desktop cols → full-width on tablet (2/2).
  - Cards spanning **≤50%** → half-width (1/2).
  - Override per card with `data-bento-tablet="full"`.
  - `rowspan` is reset to `auto`.
- **Mobile (≤767px):** single-column stack. Every card goes full-width in DOM order.

The auto-collapse rule is enumerated in CSS for every (cols, colspan) combination from cols=2 to cols=12. No JS — pure CSS.

## Layout examples

```html
<!-- Original screenshot: 1 full + 2 halves + 3 thirds (6-col grid) -->
<div class="bento-layout_grid-list" data-bento-cols="6">
  <div class="bento-layout_card" data-bento-colspan="6">…</div>
  <div class="bento-layout_card" data-bento-colspan="3">…</div>
  <div class="bento-layout_card" data-bento-colspan="3">…</div>
  <div class="bento-layout_card" data-bento-colspan="2">…</div>
  <div class="bento-layout_card" data-bento-colspan="2">…</div>
  <div class="bento-layout_card" data-bento-colspan="2">…</div>
</div>

<!-- Tall right-side card spanning 2 rows -->
<div class="bento-layout_grid-list" data-bento-cols="6">
  <div class="bento-layout_card" data-bento-colspan="4">…</div>
  <div class="bento-layout_card" data-bento-colspan="2" data-bento-rowspan="2">…</div>
  <div class="bento-layout_card" data-bento-colspan="2">…</div>
  <div class="bento-layout_card" data-bento-colspan="2">…</div>
</div>

<!-- 12-col dashboard layout -->
<div class="bento-layout_grid-list" data-bento-cols="12">
  <div class="bento-layout_card" data-bento-colspan="8" data-bento-rowspan="2">…</div>
  <div class="bento-layout_card" data-bento-colspan="4">…</div>
  <div class="bento-layout_card" data-bento-colspan="4">…</div>
  <div class="bento-layout_card" data-bento-colspan="3">…</div>
  <div class="bento-layout_card" data-bento-colspan="3">…</div>
  <div class="bento-layout_card" data-bento-colspan="3">…</div>
  <div class="bento-layout_card" data-bento-colspan="3">…</div>
</div>
```

Use [`playground/bento-layout/index.html`](../../../playground/bento-layout/index.html) to prototype layouts before pasting into Webflow.

## Required CSS

Paste [`embeds/bento-layout.css`](../../../embeds/bento-layout.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`).

The embed uses `!important` on every span rule. This is deliberate: Webflow's native grid system auto-generates `#w-node-… { grid-area: … }` rules for any element placed inside a Designer-built grid, and those would otherwise override the data-attribute spans.

Everything else (gap, card backgrounds, padding, image sizing, etc.) stays in the Webflow Designer.

**Recommended Designer settings on `.bento-layout_grid-list`:**

- `display: grid` — also set in Designer for consistency.
- `gap` (row + column) — set whatever spacing you want between cards.
- Don't assign `grid-template-areas` or per-child `grid-column-start/end` in Designer.

**Recommended Designer settings on `.bento-layout_card`:**

- Background, border-radius, padding — all in Designer.
- `min-height` if you want short-content cards to match taller siblings.
- Don't set `grid-column` or `grid-row` in Designer.

## Webflow Component setup (step-by-step)

The embed turns into a customizable component by binding the three attributes to Component Properties so the editor can change them per instance from the right-hand panel.

### 1. Create the base structure in Designer

1. Drop a `<section>` and add the custom attribute `data-component` = `bento-layout`.
2. Inside, add a `<div>` with class `bento-layout_grid-list` and the custom attribute `data-bento-cols` = `6`.
3. Inside the grid, add a `<div>` with class `bento-layout_card` and the custom attribute `data-bento-colspan` = `2`. Build out the card's inner structure (heading, paragraph, image-wrapper, etc.) — whatever a "Bento card" is meant to contain.
4. Style everything in the Designer (backgrounds, padding, gap, etc.).

### 2. Convert the card to a "Bento Card" Component

1. Select the `.bento-layout_card` element.
2. Right-click → **Create Component** (or `⌘ + ⇧ + A`). Name it `Bento Card`.
3. With the component template open, click the **Properties** panel (right sidebar, the icon that looks like sliders) → **+ Add property**:
   - **Property 1**
     - Name: `Colspan`
     - Type: `Plain text` (Webflow doesn't have a native "number" property, so plain text + a default of `2` is the cleanest)
     - Default value: `2`
   - **Property 2**
     - Name: `Rowspan`
     - Type: `Plain text`
     - Default value: `1`
   - **Property 3**
     - Name: `Tablet full width`
     - Type: `Visibility` (boolean toggle) — this maps to "show/hide" but we'll repurpose it for the conditional attribute below.
4. Bind the properties to attributes:
   - Select the root `.bento-layout_card` element inside the template.
   - Open **Settings** panel → **Custom Attributes**.
   - Edit `data-bento-colspan` → click the small "🔗 Bind to property" icon next to the value field → pick `Colspan`.
   - Add a new attribute `data-bento-rowspan` → bind value to `Rowspan`.
   - Add a new attribute `data-bento-tablet` with value `full` → use the **Conditional visibility** trick: bind the attribute's *visibility* to `Tablet full width = true` so the attribute is only emitted when the toggle is on. (If your Webflow workspace doesn't support attribute-level conditional binding, leave it as a manual attribute the editor adds when needed.)
5. Add any text/image/link properties for the card content (heading, body, image, etc.) so editors can fill the card from the panel without editing nested elements.
6. Close the template.

### 3. Convert the grid wrapper to a "Bento Grid" Component

1. Select the `.bento-layout_grid-list` element (the parent of the cards).
2. Right-click → **Create Component**. Name it `Bento Grid`.
3. Inside the template, the children should be the `Bento Card` instances you set up in step 2. The default state of the template can include 6 `Bento Card` instances arranged like the screenshot (`6 + 3 + 3 + 2 + 2 + 2`).
4. Open the **Properties** panel for `Bento Grid`:
   - **Property**: `Cols`, type `Plain text`, default `6`.
5. Bind it to the `.bento-layout_grid-list` element's `data-bento-cols` attribute (Settings → Custom Attributes → 🔗 next to the value).
6. Close the template.

### 4. Use it on a page

1. Drag a `Bento Grid` instance from the Components panel onto the page.
2. With the instance selected, the right-hand Properties panel shows `Cols`. Type any value 2–12.
3. Click on a `Bento Card` instance inside the grid. The Properties panel shows `Colspan`, `Rowspan`, `Tablet full width`. Edit per card.
4. Add or remove `Bento Card` instances from the grid via the navigator (drag in from the Components panel).

That's the entire authoring workflow. No code changes needed to add a new layout — the editor adjusts numbers in the right panel.

## Tips for editors

- **Make rows sum to `Cols`.** If the colspans on a row don't add up to the wrapper's Cols value, the last cell will have a gap (or wrap to a new row). The `playground/bento-layout/index.html` shows a warning when this happens — useful sanity check.
- **For tall content, use Rowspan.** A phone mockup or tall chart looks better with `Rowspan = 2` than letting the grid stretch all neighbors.
- **`Tablet full width`** is for "hero" cards that look squashed at half-width on tablet. Most cards don't need it — the auto-rule promotes >50% spans automatically.

## Dependencies

None. Pure CSS.

## Lifecycle hooks

N/A — no JS file.

## File

`embeds/bento-layout.css` (no JS file)
