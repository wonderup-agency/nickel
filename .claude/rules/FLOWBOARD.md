# Flowboard / Webflow paste-extension rules

How to generate HTML+CSS structures that the Flowboard HTML→Webflow extension parses cleanly **and** Webflow's publish validator accepts. Every rule below is anchored to an actual failure observed in this project — not theoretical.

When the user asks for "una estructura para Flowboard" / "paste extension" / "one-shot paste a Webflow", follow this file.

## How Flowboard parses paste

- Reads `text/html` from clipboard (NOT `text/plain` alone — see clipboard rule below).
- Maps standard HTML tags → Webflow elements: `<section>` → Section, `<div>` → Div Block, `<h1>`–`<h6>` → Heading, `<p>` → Paragraph, `<button>` → Button, `<form>` → Form Block, `<input>` → Form Input, etc.
- Reads `class="..."` attributes and creates corresponding Webflow classes.
- Reads `<style>` blocks (when present in the clipboard payload) and applies the rules to the matching classes — but only if the selectors are simple and Webflow-compatible.
- Supports combo classes (`.base.is-variant`), responsive variants (via `@media`), and basic state pseudos (`:hover`, `:focus`).
- Does NOT support: parent-hover-child chains, deep pseudo-element selectors, attribute selectors as styling hooks.

## Webflow's publish validator: rules to avoid

If even one CSS rule trips the validator, the whole site fails to publish. These have all caused real failures in this project:

| Don't use | Why | Use instead |
|---|---|---|
| `:invalid` | Webflow rejects | Native HTML5 `required` attribute; show errors via JS classes |
| `:focus-within` | Webflow rejects | Put the focus state on the inner input via `:focus` |
| `:checked + .sibling` (adjacent sibling with pseudo-class) | Selector unsupported by Webflow's class system | JS toggles a `.is-checked` combo class on the parent, CSS uses `.parent.is-checked .child` |
| `:placeholder-shown`, `::placeholder` | Pseudo-element rules unsupported | Skip — accept the browser default placeholder color |
| `appearance: none` / `-webkit-appearance: none` | Designer doesn't expose this property; validator may reject | Use native `<select>` arrow / native `<input type="checkbox">` |
| `*` universal selector | Unsupported | Apply rules to specific classes only (Webflow's reset handles `box-sizing` globally already) |
| `.a + .b` (adjacent sibling combinator) | Webflow doesn't generate these | Combo class: add `.is-overlap` (or similar) to the elements that need the variant |
| `.a > .b` (direct child combinator) | Often rejected | `.a .b` (descendant) is fine |
| `[data-foo='bar']` chained with classes for styling | Attribute selectors as style hooks usually skipped | Use class names; reserve `data-*` for JS hooks |
| `:has()` | Modern but Webflow rejects | Restructure HTML or use JS |
| `flex: 1` (shorthand) | Designer stores expanded | `flex-grow: 1; flex-shrink: 1; flex-basis: 0%;` |
| `border: 1px solid #X` (shorthand) | Designer stores expanded | `border-style: solid; border-width: 1px; border-color: #X;` |
| `border: none` (shorthand) | Designer stores expanded | `border-style: none;` |
| `padding: 1rem 2rem` (shorthand) | Designer stores expanded | `padding-top/right/bottom/left` |
| `outline: none` | Validator picky | `outline-style: none;` |
| `gap: 1rem` (flex shorthand) | Inconsistent | `row-gap` / `column-gap` (explicit) |
| `grid-column: 1 / -1` (shorthand) | Inconsistent | `grid-column-start: 1; grid-column-end: -1;` |
| `var(--my-token)` for ad-hoc unknown tokens | Reference to a variable Webflow doesn't know about | Only reference tokens that **already exist** in the site's `:root` (Webflow Variables panel) — see "CSS variables" section below |
| CSS rule nesting (`.a { .b { … } }`) | CSS nesting is modern but Flowboard parses flat | Flat rules |
| Webflow's own `w-*` classes as style hooks | Webflow controls those | Style via your custom `*_*` classes; leave `w-input`, `w-form` etc. on the markup unstyled |

## Patterns to use

### CSS variables — **use the site's existing tokens**

Always reference the variables that already exist in the user's Webflow `:root` (their Variables panel). Flowboard preserves `var(--token-name)` and Webflow links the style to its variable — so when the user updates the token in the Variables panel, the form follows automatically. This is the whole point of the design system.

**Do NOT** invent new variable names. Only reference tokens already defined.

The nickel project's tokens (current, from `:root`):

| Color tokens | Resolves to | Use for |
|---|---|---|
| `--base--white` | `#fff` | white surfaces |
| `--base--light-gray` | `#fafafa` | page bg |
| `--base--gray` | `#e5e5e5` | borders |
| `--base--dark-gray` | `#737373` | muted text |
| `--base--nickel-black` | `#0a0a0a` | primary text |
| `--base--red` | `#611c33` | accent (burgundy) |
| `--base--gold` | `#eb9101` | submit/CTA |
| `--background-color--background-primary` | white | card/input bg |
| `--text-color--text-primary` | dark-gray | body text |
| `--text-color--text-secondary` | nickel-black | titles, labels |
| `--border-color--border-primary` | gray | input borders |
| `--system--focus-state` | red | focus rings |

| Spacer tokens | Value |
|---|---|
| `--_spacers---4` | 0.25rem |
| `--_spacers---8` | 0.5rem |
| `--_spacers---12` | 0.75rem |
| `--_spacers---16` | 1rem |
| `--_spacers---20` | 1.25rem |
| `--_spacers---24` | 1.5rem |
| `--_spacers---32` | 2rem |
| `--_spacers---48` | 3rem |
| `--_spacers---80` | 5rem |
| `--_spacers---112` | 7rem |

| Typography tokens | |
|---|---|
| `--_typography---family--body` | body font stack |
| `--_typography---family--headings` | display font stack |
| `--_typography---h2--size-h2` | 2.25rem |
| `--_typography---regular--size-regular` | 1rem |
| `--_typography---small--size-small` | 0.875rem |

| Container tokens | |
|---|---|
| `--_containers---large` | 80rem |
| `--_section-paddings---section-large` | 7rem |

**When to fall back to literals**: only if the token doesn't exist for the value you need (e.g. `0.5rem` border-radius — no radius token in this project, use the literal).

### Combo classes for variants

```css
/* Yes */
.myblock_button.is-primary { background-color: #eb9101; }
.myblock_button.is-secondary { background-color: #ffffff; }
.myblock_checkbox.is-checked .myblock_checkbox-box { background-color: #611c33; }
```

### Hover and focus states (only these two)

```css
.myblock_back:hover { color: #611c33; }
.myblock_input:focus { border-color: #611c33; box-shadow: 0 0 0 3px rgba(97, 28, 51, 0.12); }
```

### Responsive via `@media`

Webflow maps these to its breakpoint editor:

| Breakpoint | Range |
|---|---|
| Desktop XL | `(min-width: 1280px)` |
| Desktop | base (no media query) |
| Tablet | `(max-width: 991px)` |
| Mobile landscape | `(max-width: 767px)` |
| Mobile portrait | `(max-width: 479px)` |

Use these exact ranges so Webflow doesn't have to guess.

### Naming (Client-First)

- Classes: `block_element` and `block_element-variant` (e.g. `myblock_header`, `myblock_card-top`). Lowercase, hyphen-separated within the word, underscore between block and element.
- Variants: combo classes prefixed `is-` (`is-primary`, `is-checked`, `is-overlap`).
- Base utility classes the project already provides — DO NOT redefine them in the paste payload, just use them: `padding-global`, `padding-section-small/medium/large`, `container-small/medium/large`.

### HTML semantics

- Wrap each top-level block in `<section data-component="component-name">`.
- Use `<h2>`–`<h6>` for headings (h1 is reserved for page title).
- Forms: `<form name="wf-form-X" data-name="..." id="wf-form-X">` + sibling `.w-form-done` and `.w-form-fail` divs (Webflow Forms requires this exact pattern).
- Buttons: `<button type="reset">` for reset, `<input type="submit">` for submit (Webflow Forms expects `input[type=submit]`).
- Selects: native `<select>` with first `<option disabled selected value="">Placeholder</option>` for the placeholder behavior.
- Checkboxes: `<label class="block_checkbox">` containing `<input type="checkbox">` + optional `<span>` for custom visual + `<span>` for the text.

### Clipboard payload pattern

For "copy this block" buttons in playground files:

1. Store the markup inside a `<template data-block-content>` so its `<style>` doesn't apply to the playground page.
2. Use `ClipboardItem` to write **both** `text/html` and `text/plain` to the clipboard. Flowboard only reads `text/html` — `writeText()` alone is invisible to it.
3. Fallback for non-secure contexts: insert into a hidden `contenteditable` div, select the range, run `document.execCommand('copy')`.

```js
const item = new ClipboardItem({
  'text/html': new Blob([html], { type: 'text/html' }),
  'text/plain': new Blob([html], { type: 'text/plain' }),
});
await navigator.clipboard.write([item]);
```

### Two deployment strategies

The user picks whichever fits the situation:

**Plan A — One-shot paste with inline `<style>` (preferred when it works)**

- The payload bundles `<style>...</style>` + the markup in one paste.
- Flowboard parses both and Webflow ends up with named classes that already have styles.
- Constraint: the `<style>` must obey every Webflow-validator rule above. One bad rule kills publish.

**Plan B — Markup via Flowboard + CSS via Project Settings**

- The paste payload contains markup only (no `<style>`).
- The full CSS lives in `embeds/<name>.css` and the user pastes it into **Webflow → Project Settings → Custom Code → Head** wrapped in `<style></style>`.
- Custom Code is injected raw into the published `<head>` — Webflow does NOT validate it. Any CSS works.
- Trade-off: two paste operations, but bulletproof.

Default to Plan A. If the user reports publish errors, fall back to Plan B (move the CSS out of the payload and into the embed file).

## Playground file structure

For each component pasted via Flowboard, ship:

1. `playground/copy-paste/<name>.html` — full preview, all CSS inline in the `<head>` (NOT the validator-safe version; this file is just for visual reference).
2. `playground/copy-paste/<name>-blocks.html` — the per-block copy-paste workbench. Includes:
   - A featured block at the top with a `<template>` carrying the one-shot payload (markup + Webflow-safe `<style>`).
   - Granular blocks below — one per logical chunk (section shell, header, card, individual fields, actions, etc.).
   - A "Copy HTML" button per block that writes both `text/html` and `text/plain` to the clipboard.
3. `embeds/<name>.css` — Plan-B fallback CSS for Project Settings.
4. `.claude/rules/components/<name>.md` — the component doc.

## Quick pre-flight checklist before shipping a Flowboard payload

- [ ] Every CSS rule uses class selectors only — no `[attr]`, `*`, `+`, `>`, `~`, `:has()`, `:invalid`, `:focus-within`, `:placeholder-shown`, `::placeholder`.
- [ ] Every state is `:hover` or `:focus` — nothing else.
- [ ] No `appearance: none` (any prefix).
- [ ] No shorthand: `border`, `padding`, `margin`, `flex`, `gap`, `grid-column`, `grid-row`, `outline`, `font` — all expanded.
- [ ] CSS color/spacing/typography values use `var(--existing-token)` from the site's `:root`; literals only when no matching token exists (e.g. border-radius).
- [ ] No `:checked + .sibling` checkbox styling — use JS `.is-checked` combo class on the parent.
- [ ] Custom select chevron and check icon SVGs only inside `background-image` (data URL is fine, but accept native if validator complains).
- [ ] `<form>` has `name`, `data-name`, `id` and is followed by `.w-form-done` + `.w-form-fail` siblings.
- [ ] HTML wrapped in `<template data-block-content>` if rendered inside a playground page (prevents `<style>` leaking).
- [ ] Copy button writes `text/html` via `ClipboardItem` (not `writeText`).
- [ ] Featured block description explains the trade-offs (any feature dropped for validator compatibility).
