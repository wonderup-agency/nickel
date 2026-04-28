// --------------------------------------------------
// Component Registry
// --------------------------------------------------
// Each entry maps a data-component attribute to a lazy import.
// Components only load when their selector exists on the page.
//
// 2 ways to add a component:
//
// 1. Ask Claude  → "create a component called calculator"
// 2. Terminal    → npm run create-component -- calculator
//
// Both scaffold the file and add an entry here automatically.
// --------------------------------------------------

export default [
  {
    selector: "[data-component='counter']",
    importFn: () => import('./components/counter.js'),
  },
  {
    selector: "[data-component='timeline']",
    importFn: () => import('./components/timeline.js'),
  },
  {
    selector: "[data-component='timeline-vertical-lines']",
    importFn: () => import('./components/timeline-vertical-lines.js'),
  },
  {
    selector: "[data-component='pricing']",
    importFn: () => import('./components/pricing.js'),
  },
  {
    selector: "[data-component='tabs']",
    importFn: () => import('./components/tabs.js'),
  },
  {
    selector: "[data-component='carousel-large']",
    importFn: () => import('./components/carousel-large.js'),
  },
  {
    selector: "[data-component='navbar']",
    importFn: () => import('./components/navbar.js'),
  },
  {
    selector: "[data-component='background-lines']",
    importFn: () => import('./components/background-lines.js'),
  },
]
