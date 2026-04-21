# carousel-large

## Overview

Swiper-powered carousel for large testimonial/case-study cards. Responsive: 3 slides on desktop, ~2 on tablet, ~1 on mobile.

## Webflow attribute

```
data-component="carousel-large"
```

## Expected DOM

```html
<div data-component="carousel-large" class="carousel-large_component">
  <div class="carousel-large_list-wrapper swiper">
    <div class="carousel-large_list swiper-wrapper">
      <div class="carousel-large_item swiper-slide">
        <div class="carousel-large_item-image-wrapper">
          <img class="carousel-large_item-img" />
          <div class="carousel-large_overlay"></div>
        </div>
        <div class="carousel-large_item-content">
          <div class="carousel-large_item-description"><!-- quote --></div>
          <div class="carousel-large_item-details">
            <div class="carousel-large_left"><!-- name, title --></div>
            <div class="carousel-large_button-wrapper"><!-- CTA --></div>
          </div>
        </div>
      </div>
      <!-- more .swiper-slide items -->
    </div>
  </div>
</div>
```

Swiper classes (`swiper`, `swiper-wrapper`, `swiper-slide`) must be on the elements as shown.

## Behavior

- Initializes a Swiper instance on each matching element.
- **Desktop (≥992px):** `slidesPerView: "auto"` (respects CSS max-width), 24px gap.
- **Tablet (≥768px):** ~2.15 slides visible, 20px gap.
- **Mobile landscape (≥480px):** ~1.25 slides visible, 16px gap.
- **Mobile portrait (<480px):** ~1.15 slides visible, 16px gap.
- **Initial slide**: starts on index 1 (second slide).
- **Centered slides**: active slide is centered in the viewport.
- **Grab cursor**: enabled for drag interaction.
- **Rewind**: reaching the last slide and dragging past it returns to the first (and vice versa).

## Dependencies

- **Swiper** (global `Swiper`) — loaded from CDN. Logs a warning and skips if not found.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" defer></script>
```

## Lifecycle hooks

- **resize**: Updates all Swiper instances on window resize.

## File

`src/components/carousel-large.js`
