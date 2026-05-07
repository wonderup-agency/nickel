# cards

## Overview

Hover system for every card type in the project. Pure CSS, no JS. Each card gets one or more of: a Ken Burns drift on its inner image, an icon scale + slight rotate (icon cards), and the Stripe-style button arrow triggered by card hover.

## Card types covered

| Webflow class | Ken Burns image | Icon scale + rotate | Card-hover button arrow |
|---|---|---|---|
| `.card-images_card` | `.card-images_bg-img` | — | ✅ |
| `.carousel-large_item` | `.carousel-large_item-img` | — | ✅ |
| `.card-resources_item` | `.card-resources_image` | — | ✅ |
| `.card-product_item` | `.card-product_image` | — | ✅ |
| `.bento-layout_card` | `.bento-layout_image` | — | — |
| `.card_item` (icon card) | — | `.card_img` (1 → 1.18 + `rotate(-4deg)`) | ✅ |

**Important**: the image's wrapper element (e.g. `.bento-layout_image-wrapper`) must have `overflow: hidden` set in the Webflow Designer — otherwise the scaled image bleeds outside the card on hover.

## Hover behaviors

### Ken Burns drift

- Inner image transforms from rest to `scale(1.08) translate(-1.5%, -1.5%)` over `1.6s` with `cubic-bezier(0.22, 1, 0.36, 1)`.
- `transform-origin: 30% 70%` anchors the focal point bottom-left so the drift reads as motion, not just zoom.

### `.card_item` recipe (icon card)

- The icon (`.card_img`) scales from `1` to `1.18` and rotates `-4deg` on hover (`0.55s`, `cubic-bezier(0.22, 1, 0.36, 1)`).
- The `.card4_title-line` is left as authored in Webflow — no hover animation on the line.

### Card-hover button arrow

- Mirrors `embeds/button.css` — when any card is hovered, the inner button's two-path SVG arrow triggers (line fades in, chevron slides into place). Base button-hover behavior in `button.css` is unchanged; this just adds the parent-card trigger.

## Required CSS

Paste [`embeds/cards.css`](../../../embeds/cards.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`).

The embed contains **only** animation rules — no `box-sizing`, padding, layout, or anything that should live in the Webflow Designer.

## Dependencies

- `embeds/button.css` — for the base button arrow rest state. The cards embed only adds the hover trigger from the card root.

## Tuning

All knobs in [`embeds/cards.css`](../../../embeds/cards.css):

| Constant | Default | What it controls |
|---|---|---|
| `scale(1.08) translate(-1.5%, -1.5%)` | — | Ken Burns intensity; lower scale or translate for less drift |
| `1.6s` | — | Ken Burns duration; longer = more cinematic |
| `scale(1.18) rotate(-4deg)` | — | Icon hover transform on `.card_item` |

## File

`embeds/cards.css` (no JS file)
