# navbar

## Overview

Responsive dropdown navigation with two modes:
- **Desktop (≥992px):** Stripe-style carousel dropdown with hover. A single shared container spans the full menu width, panels slide in/out horizontally.
- **Mobile (<992px):** iOS-style slide-from-right panels with tap. Tapping a dropdown pushes the main menu left and slides the dropdown content in from the right with a back button.

## Webflow attribute

```
data-component="navbar"
```

## Expected DOM

```html
<div data-component="navbar" class="navbar_component w-nav">
  <div class="navbar_container">
    <nav class="navbar_menu w-nav-menu">
      <div class="navbar_menu-links">

        <!-- Dropdown items (Webflow w-dropdown) -->
        <div class="navbar_menu-dropdown w-dropdown">
          <div class="navbar_dropdwn-toggle w-dropdown-toggle">
            <div>Products</div>
            <div class="nav_link-icon"><!-- chevron svg --></div>
          </div>
          <nav class="navbar_dropdown-list w-dropdown-list">
            <div class="navbar_dropdow-inner-link">
              <div class="navbar_dropdown-icon-wrapper">
                <div class="navbar_dropdown-icon"><!-- svg --></div>
              </div>
              <div class="navbar_drowpdown-link-left">
                <div>Title</div>
                <div>Description</div>
              </div>
              <a href="#" class="item-link w-inline-block"></a>
            </div>
          </nav>
        </div>

        <!-- Static links (no dropdown) -->
        <a href="#" class="navbar_link">Customers</a>

      </div>
      <div class="navbar_menu-buttons"><!-- CTAs --></div>
    </nav>
  </div>
</div>
```

The component reads dropdown content from existing `.w-dropdown-list` elements. No extra HTML needed.

## Behavior — Desktop (≥992px)

- Creates a shared dropdown container (`.navbar_dropdown-container`) inside `.w-nav-menu` and a backdrop overlay (`.navbar_dropdown-overlay`) on the body. Both start hidden.
- On hover of a `.w-dropdown` trigger: container fades in, overlay appears with subtle blur.
- On switching between dropdown items: old panel slides out via `xPercent`, new panel slides in from the opposite side (carousel effect). Height morphs to fit.
- On hover of a static `.navbar_link`: dropdown closes.
- On mouse leave: dropdown closes after 150ms delay.
- Chevron icon (`.nav_link-icon`) rotates 180° on hover.
- When cloning cards, `data-w-id` attributes are stripped to prevent Webflow IX2 conflicts. Use CSS `:hover` for card hover states, not Webflow Interactions.

## Behavior — Mobile (<992px)

- Creates a `.navbar_mobile-panel` for each dropdown, appended to `.w-nav-menu`. Each panel has a `.navbar_mobile-back` button at the top.
- On tap of a `.w-dropdown-toggle`: main menu content (`.navbar_menu-links`, `.navbar_menu-buttons`) slides left and fades, the panel slides in from the right.
- On tap of the back button: panel slides out right, main menu slides back in.
- On hamburger tap (menu closing): any open panel resets instantly.
- Native Webflow dropdown behavior is suppressed (click prevented on `.w-dropdown-toggle`).

## Debug mode (desktop only)

Add `data-debug` to the navbar element to keep the dropdown always open with the first panel visible.

```html
<div data-component="navbar" data-debug>...</div>
```

## DOM elements created by JS

**All styling must be done via CSS — the JS sets no inline styles.** Only GSAP animation properties (autoAlpha, xPercent, y, height, rotation) are used.

### Desktop

| Element | Class | Inserted into |
|---------|-------|--------------|
| Dropdown wrapper | `navbar_dropdown-container` | `.w-nav-menu` |
| White background | `navbar_dropdown-bg` | `.navbar_dropdown-container` |
| Content panel (×N) | `navbar_dropdown-panel` | `.navbar_dropdown-bg` |
| Backdrop overlay | `navbar_dropdown-overlay` | `body` |

### Mobile

| Element | Class | Inserted into |
|---------|-------|--------------|
| Slide panel (×N) | `navbar_mobile-panel` | `document.body` |
| Back button (inside each panel) | `navbar_mobile-back` | `.navbar_mobile-panel` |

## Required CSS

Place in **Project Settings > Custom Code > Head**:

```css
/* Hide native Webflow dropdown lists (both breakpoints) */
[data-component="navbar"] .w-dropdown-list {
  display: none !important;
}

/* ── Desktop (≥992px) ───────────────────────────────────── */
@media (min-width: 992px) {
[data-component="navbar"] .w-dropdown {
  position: static;
}

.navbar_dropdown-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding-top: 0.75rem;
  pointer-events: none;
  z-index: 999;
}

.navbar_dropdown-bg {
  position: relative;
  background-color: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.12);
  overflow: hidden;
  pointer-events: auto;
  width: 100%;
}

.navbar_dropdown-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  row-gap: 0.75rem;
}

.navbar_dropdown-panel .navbar_dropdow-inner-link {
  position: relative;
}

.navbar_dropdown-panel .w-inline-block {
  display: block;
}

.navbar_dropdown-panel .navbar_drowpdown-link-left {
  color: var(--text-color--text-primary);
}

.navbar_dropdown-panel .navbar_dropdown-icon,
.navbar_dropdown-panel .navbar_drowpdown-link-left {
  transition: transform 0.25s ease, color 0.25s ease;
}
.navbar_dropdown-panel .navbar_dropdow-inner-link:hover .navbar_dropdown-icon {
  transform: rotate(-6deg);
  color: #000;
}
.navbar_dropdown-panel .navbar_dropdow-inner-link:hover .navbar_drowpdown-link-left {
  color: #000;
}

.navbar_dropdown-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 998;
  pointer-events: none;
}
} /* end desktop */

/* ── Mobile (<992px) ────────────────────────────────────── */
@media (max-width: 991px) {
[data-component="navbar"] .w-nav-menu {
  position: relative;
  overflow: hidden;
}

/* Fixed to viewport so scroll position doesn't matter.
   z-index below navbar so hamburger stays clickable.
   Adjust padding-top to match your navbar height. */
.navbar_mobile-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 2rem 0 0;
  background: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  z-index: 999;
}

.navbar_mobile-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  margin-bottom: 0.25rem;
}

.navbar_mobile-panel .navbar_dropdow-inner-link {
  position: relative;
  display: flex;
  align-items: center;
}

.navbar_mobile-panel .w-inline-block {
  display: block;
}
} /* end mobile */
```

## Menu open/close tracking

Uses a `MutationObserver` on the `.navbar_menu` (`.w-nav-menu`) element to watch for Webflow's `w--open` class. This catches every close trigger: hamburger tap, overlay tap, and link clicks. When the menu closes, `is-menu-open` is removed from `.navbar_component` and all mobile panels reset.

## Dependencies

- **GSAP** (global `gsap`) — required; logs a warning and skips if not found.

## Lifecycle hooks

- **breakpoint(current, previous)**: Switches between desktop and mobile mode when crossing the 992px threshold. Tears down the current mode and sets up the new one.

## File

`src/components/navbar.js`
