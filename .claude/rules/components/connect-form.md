# connect-form

## Overview

Card-to-form switcher for the "Connect with the Nickel team" section. The user lands on three selector cards (Product demo / Support / Something else); clicking one cross-fades the cards out, morphs the section height, and reveals the matching form. The form's "Go back" button reverses the transition.

The component is **purely a switcher** — it doesn't handle form submission. Whatever form logic already lives on `.connect-form_form` (Webflow Forms, validation, intl-tel-input, etc.) keeps working untouched.

## Webflow attribute

```
data-component="connect-form"
```

## Expected DOM

```html
<section data-component="connect-form" class="section_connect-form">
  ...
  <div class="connect_cards">
    <div data-connect="get-product" class="connect_card">
      <a href="#" class="item-link w-inline-block"></a>
      <div class="connect_icon-wrapper"><svg>…</svg></div>
      <h2>I want to get a product demo</h2>
    </div>
    <div data-connect="support" class="connect_card">…</div>
    <div data-connect="something-else" class="connect_card">…</div>
  </div>

  <div data-connect="form-product-demo" class="connect-form_card">
    <div class="connect-form_card-top">
      <div class="button_container">
        <div class="button_color">
          <!-- Add data-connect-back to make the binding explicit. The JS
               falls back to matching the "← Go back" text if missing. -->
          <div data-connect-back class="button">
            <div>← Go back</div>
          </div>
        </div>
      </div>
      <div class="connect-form_card-title">Product Demo</div>
    </div>
    <div class="connect-form_wrapper w-form">
      <form class="connect-form_form">…</form>
    </div>
  </div>

  <div data-connect="form-support" class="connect-form_card">…</div>
  <div data-connect="form-something-else" class="connect-form_card">…</div>
</section>
```

## Card → form mapping

| Card `data-connect` | Form `data-connect`     |
| ------------------- | ----------------------- |
| `get-product`       | `form-product-demo`     |
| `support`           | `form-support`          |
| `something-else`    | `form-something-else`   |

Defined in the `CARD_TO_FORM` constant at the top of [`src/components/connect-form.js`](../../../src/components/connect-form.js). Update both files together if Webflow slugs change.

## Behavior

- **Init**:
  - Every `[data-connect^="form-"]` panel starts hidden (`autoAlpha: 0`, `display: none`).
  - Each card gets `role="button"`, `tabindex="0"`, `aria-controls="<form-id>"`, `aria-expanded="false"`.
  - Webflow's decorative `.item-link` anchors inside cards and inside the back button are neutralized (`preventDefault`, `tabindex="-1"`, `aria-hidden="true"`) so they can't navigate or steal focus.

The "stage" of the animation is `cardsContainer.parentElement` — typically the `.container-large` that holds the section header, the cards, and the form panels. The curtain's origin is the **cards' y-offset within that stage** (`cardsContainer.offsetTop`), so anything above the cards — most importantly the section header — stays in normal flow and doesn't move or get covered during the transition.

- **Open form** (click on a card or `Enter` / `Space` while focused):
  1. Scroll smoothly to the top of `[data-component="connect-form"]` via `smoothScrollTo()` — uses `window.__lenis` (the site-wide Lenis instance from `global.js`) when available, falls back to native `scrollIntoView`. Both paths honor `prefers-reduced-motion`.
  2. Measure `cardsTopOffset = cardsContainer.offsetTop` — the y-position where the curtain originates.
  3. Pin the stage to its current height (`overflow: hidden`, `position: relative`) so the layout can't jump.
  4. Position the target form **absolutely** at the cards' position (`top: cardsTopOffset`, `left: 0`, `width: 100%`) with `clip-path: inset(0% 0% 100% 0%)` — visible in the DOM but visually masked to a 0-height slice at the top. Cards stay in flow underneath; the header above is untouched.
  5. Play one GSAP timeline:
     - `.connect_cards` → `autoAlpha 0` (0.3s, `power2.out`)
     - stage → `height: cardsTopOffset + <formHeight>` (0.5s, `power2.inOut`, runs alongside the fade-out)
     - form → `clip-path: inset(0% 0% 0% 0%)` (0.8s, `power3.inOut`, starts +0.1s) — **curtain drops top→bottom** revealing the form on top of the fading cards
  6. On complete: `.connect_cards` becomes `display: none`, the form's transient positioning + clip-path are cleared, and focus moves to the first input/select/textarea of the form.

- **Close form** (click on `[data-connect-back]` / the `← Go back` button, or `Esc` anywhere inside the wrapper):
  - Pin the stage at its current height, then lift the form out of flow (`position: absolute`).
  - Restore cards to flow (`display: ...`, `autoAlpha: 0`) so we can measure `cardsTopOffset` and the cards' natural height.
  - Anchor the form's `top` back to the cards' position so the curtain retreats into the same place it dropped from.
  - Timeline: form `clip-path` retreats to `inset(0% 0% 100% 0%)` (curtain rolls up from bottom), stage height shrinks back to `cardsTopOffset + cardsHeight`, cards fade in towards the end.
  - On complete: form returns to `display: none` and is stripped of transient positioning. Focus returns to the card that opened the form.

- **Animation guard**: `isAnimating` blocks new transitions while one is running. Open requests are also blocked if a form is already active.

- **`prefers-reduced-motion: reduce`**: the timelines are skipped and the swap happens with `gsap.set` (instant). Scroll switches to `behavior: 'auto'`. Focus management still runs.

- **Esc to close**: pressing `Esc` while a form is open is equivalent to clicking Go back. Useful for keyboard users.

## Decorative `.item-link` anchors

Webflow auto-injects `<a class="item-link w-inline-block">` inside cards and inside the back button so the editor can hook up CMS / Page links. The component disables them at runtime (`preventDefault` + `tabindex="-1"` + `aria-hidden="true"`), since both surfaces are activated by JS instead.

## Accessibility

- Cards: `role="button"`, keyboard-activatable with `Enter` / `Space`.
- `aria-controls` + `aria-expanded` keep the relationship between the card and its form readable by assistive tech.
- On open, focus moves to the first form field so screen readers announce the form context.
- On close, focus returns to the originating card.
- `prefers-reduced-motion: reduce` → no GSAP tweens, instant swap.
- `Esc` closes the active form.

## Required CSS

Paste [`embeds/connect-form.css`](../../../embeds/connect-form.css) into **Webflow → Project Settings → Custom Code → Head** (inside `<style>`). It covers:

- **Form switcher**:
  - `[data-connect^="form-"] { display: none }` — pre-hide forms before the JS runs so they don't flash visible on first paint.
  - `.connect_card { cursor: pointer }` and `:focus-visible` outline (using `var(--system--focus-state)`).
  - **Card hover** — all colors tint to `var(--base--light-red)` over `0.4s cubic-bezier(0.22, 1, 0.36, 1)`:
    - Icon: `transform: rotate(-6deg)` and `path { stroke }`
    - Text: `color` on the card + explicit override on `h2` / `p` (rich-text wrappers set their own color)
    - Border of the card: `border-color`
    - Side-line decorations (`.connect-form_card-lines`): both `background-color` and `border-color` (covers both authoring patterns in Designer)
- The pre-existing form-specific rules (custom checkbox, intl-tel-input overrides, thank-you block, hidden `.w-form-done` / `.w-form-fail`) stay in the same embed.

## Optional Webflow setup

- Add `data-connect-back` as a custom attribute on each form's back-button element. This makes the binding explicit and future-proof. If absent, the JS falls back to matching the `← Go back` text inside `.connect-form_card-top .button`.

## Phone input — country picker

Each form's `<input type="tel">` is upgraded with [intl-tel-input](https://github.com/jackocnr/intl-tel-input) (v28, npm). The static `.connect-form_phone-prefix` (the "+1" chip in the markup) is **removed at init** because the library injects its own dial-code chip via `separateDialCode: true`.

Init options:

| Option               | Value                                                                  | Why                                                                          |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `initialCountry`     | `'us'`                                                                 | Matches the original static `+1` prefix                                      |
| `separateDialCode`   | `true`                                                                 | Dial code rendered next to the input instead of being part of the value      |
| `countryOrder`       | `['us', 'ca', 'mx', 'br', 'ar', 'co', 'cl', 'es', 'gb', 'au']`         | Pins the most relevant markets to the top — full country list is still searchable below them |
| `countrySearch`      | `true`                                                                 | Search field inside the dropdown to find any country by name                 |
| `dropdownContainer`  | `document.body`                                                        | The dropdown was being clipped by the form container's `overflow: hidden`. Attaching it to `<body>` lets it escape; the library handles positioning relative to the trigger. |
| `autoPlaceholder`    | `'polite'`                                                             | Fills the placeholder with an example number for the selected country        |

To change which countries are pinned to the top, edit `PHONE_TOP_COUNTRIES` at the top of [`src/components/connect-form.js`](../../../src/components/connect-form.js).

### Styling

The library's CSS (`intl-tel-input/styles`) is imported in the JS and extracted by Rollup into `dist/styles.css`. The dropdown selectors inside [`embeds/connect-form.css`](../../../embeds/connect-form.css) are **unscoped** (`.iti__country-list`, `.iti__search-input`, etc.) — they have to be, because the dropdown is rendered as a child of `<body>`, not inside the component. The trigger (the flag + dial-code chip inside the input) stays scoped under `[data-component='connect-form']` and matches the nice-select aesthetic (transparent background, no border, body font tokens).

The CSS references the flag sprite via `../img/flags.webp`, which won't resolve once the CSS lives at `dist/styles.css` — the component overrides the `--iti-path-flags-1x` / `--iti-path-flags-2x` CSS variables on `document.documentElement` to point at the jsDelivr-hosted sprites (`cdn.jsdelivr.net/npm/intl-tel-input@28/dist/img/`).

## Validation

All visible fields are required. Most use native HTML5 (`required` attribute set at init via JS so the user doesn't have to toggle it per input in Webflow Designer); `revenue` is special because it's a hidden `<select>` driven by a custom dropdown, so it's validated manually.

| Input `name`     | Mechanism                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `first-name`     | HTML5 `required`                                                                                |
| `last-name`      | HTML5 `required`                                                                                |
| `email`          | HTML5 `required` + `type="email"` format check                                                  |
| `company`        | HTML5 `required`                                                                                |
| `phone`          | HTML5 `required` + intl-tel-input ensures a country/dial code is set                            |
| `revenue`        | Custom submit-time check (`attachCustomValidation`): blocks the submit if the hidden `<select>` is empty and marks the dropdown wrapper with `.is-invalid` for red-border styling |
| `message`        | HTML5 `required`                                                                                |

The "How did you hear about us?" checkbox group is **optional** (survey data — no group-min-required rule).

Webflow's submit handler doesn't fire until validation passes. To change the HTML5-required set, edit `REQUIRED_FIELD_NAMES` at the top of [`src/components/connect-form.js`](../../../src/components/connect-form.js).

## Custom dropdown (Annual Revenue)

The `<select>.connect-form_select` is replaced visually by a styled trigger + listbox (`setupCustomDropdowns`). The original `<select>` is hidden via `display: none` but kept in the DOM so Webflow Forms still submits its value under the `revenue` name. Selecting an item:

- Sets `select.value` and dispatches a synthetic `change` event (Webflow may observe it).
- Updates the trigger label and clears the placeholder data-attr.
- Clears any `.is-invalid` state from a previous submit attempt.

Behavior covered:

- Click trigger → open / close.
- Click outside → close.
- Click item → select.
- Keyboard from trigger: `Enter` / `Space` / `↓` open the list and focus the first option; `Esc` closes.
- Keyboard inside the list: `↑` / `↓` move focus; `Enter` / `Space` select; `Esc` closes and returns focus to the trigger; `Tab` closes.

The trigger and listbox both carry the right ARIA (`aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"`, `role="option"`).

Styling for the dropdown trigger + open list lives in [`embeds/connect-form.css`](../../../embeds/connect-form.css). Invalid state shows a `#3b0b0b` border on the trigger.

## Success message

Submission goes through **Webflow Forms native** (the form's `method`/endpoint is whatever the Designer set up — no JS intercept). On a successful submit Webflow reveals `.w-form-done` automatically (it does so via inline `style="display: block"`). At init, the component:

1. Rewrites the `.w-form-done` content into a `connect-form_thank-you-title` + `connect-form_thank-you-body` pair, with copy chosen by the form's `data-connect` slug.
2. Sets up a `MutationObserver` on each `.w-form-done` that watches for the `style` attribute change. When the block becomes visible (Webflow's reveal), the form is scrolled smoothly back into view via `smoothScrollTo()` (Lenis when available, native fallback) — the user may have scrolled past the form while filling fields, so this guarantees they see the success message.
3. **Schedules an auto-close** `SUCCESS_AUTO_CLOSE_MS` milliseconds (default `5000`) after the success appears. The timer fires `closeForm(form)`, which curtains the card view back in. If the user clicks `← Go back` (or `Esc`) before the timer fires, the timer is cancelled.

When `closeForm` runs while the success block is still visible (regardless of whether close came from the auto timer, the Go-back button, or Esc), it also:

- Removes the inline `display` styles Webflow added to the `<form>` and the `.w-form-done` (so a future open shows the fresh form again, not the thank-you).
- Calls `resetForm()` to clear all fields, the `.is-checked` combo class on custom checkboxes, and the intl-tel-input country selection.

To change the timing, edit `SUCCESS_AUTO_CLOSE_MS` at the top of [`src/components/connect-form.js`](../../../src/components/connect-form.js). Set it to `0` to disable auto-close.



| Form slug              | Title                              | Body                                                                              |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| `form-product-demo`    | Thanks — we'll be in touch soon    | Our sales team will reach out within one business day to schedule your demo.      |
| `form-support`         | We got it                          | A support specialist will follow up shortly — we usually reply within a few hours. |
| `form-something-else`  | Thanks for reaching out            | We've received your message and will get back to you as soon as possible.         |

Copy lives in the `SUCCESS_MESSAGES` object in [`src/components/connect-form.js`](../../../src/components/connect-form.js). Edit there to change it.

Basic styling for `.connect-form_thank-you-title` / `.connect-form_thank-you-body` is in [`embeds/connect-form.css`](../../../embeds/connect-form.css). Override in the Designer if you want something fancier.

## Clear Form button

The original markup has `<button class="connect-form_button is-secondary">Clear Form</button>`. Without `type="button"`, that defaults to `type="submit"` and silently fires the form on click. The component:

1. Forces `type="button"` on the Clear button.
2. Wires its click handler to a custom `resetForm()`:
   - calls native `form.reset()` (handles inputs, selects, textareas, native checkboxes)
   - removes the `.is-checked` combo class from any custom checkbox in the form card
   - clears the intl-tel-input value and sets the country back to `us`

## Dependencies

- **GSAP** (global `gsap`) — required for the cross-fade + height morph. Loaded natively by Webflow. If absent, the component falls back to instant `display: none/block` switching and logs a warning.
- **intl-tel-input** (npm, v28) — bundled via Rollup. Adds the country picker to each phone input.

## Lifecycle hooks

None. State is fully driven by user interaction.

## File

`src/components/connect-form.js` + `embeds/connect-form.css`
