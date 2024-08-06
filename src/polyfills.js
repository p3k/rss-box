// These are the polyfills used with polyfill.io before
// Something is amiss, though; IE11 complains about
// `Object doesn't support this action` in a Svelte file…

import "whatwg-fetch";

import "core-js/modules/es.array.fill";
import "core-js/modules/es.array.from";
import "core-js/modules/es.object.assign";
import "core-js/modules/es.promise";
import "core-js/modules/es.string.pad-start";
import "core-js/modules/es.string.starts-with";
