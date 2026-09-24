// This file is always loaded before any of the other IE11 bundles (see
// index.html and main.js), so it carries the full weight of what they
// need: every language feature the declared browser target lacks
// (core-js/stable, expanded by the "entry" useBuiltIns mode in
// rollup.config.js into whatever IE11 is actually missing, rather than
// a hand-picked list that's easy to leave gaps in), plus the two DOM/Web
// APIs core-js has no notion of at all, which is the other half of what
// polyfill.io used to provide silently:
//
// - fetch(), via whatwg-fetch
// - classList on SVGElement, via classlist.js — a plausible match for
//   the "Object doesn't support this action" error IE11 gave: this
//   project uses SVG icons, and Svelte's compiled runtime relies on
//   classList to toggle classes

import "core-js/stable";
import "whatwg-fetch";
import "classlist.js";
