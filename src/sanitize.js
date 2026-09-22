// Feeds are written by strangers, but a box puts their markup and links right
// into the page of whoever embeds it. Everything from a feed that ends up in
// the page – as HTML, as a URL or within a style – has to pass this module.

import DOMPurify from "dompurify";

// Relative URLs and the schemes that are safe to follow (the same as DOMPurify
// allows); notably `javascript:` and `data:` are left out
const SAFE_URL =
  /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

// Browsers ignore whitespace and control characters within a scheme, e.g. in
// `java\nscript:`, so the check has to ignore them, too
// eslint-disable-next-line no-control-regex
const IGNORED = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

// Frames and plug-ins may only load from the web
const EMBED_URL = /^(?:https?:)?\/\//i;

// Embedded pages keep running scripts (players need them), but cannot navigate
// the embedding page or take over its origin
const SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox";

// A style that positions an element leaves the box and covers the page
const PAGE_COVERING_POSITION = /^(?:absolute|fixed|sticky)$/i;

const CONFIG = {
  // Feeds contain HTML, neither SVG nor MathML
  USE_PROFILES: { html: true },

  // Media players and legacy embeds, which are common in feeds
  ADD_TAGS: ["iframe", "object", "embed"],
  ADD_ATTR: ["allowfullscreen", "data", "frameborder", "target"],

  // Style sheets would restyle the page, and forms could ask the readers of a
  // page for their passwords
  FORBID_TAGS: [
    "style",
    "form",
    "input",
    "button",
    "select",
    "option",
    "optgroup",
    "textarea",
    "fieldset"
  ]
};

export const escapeHtml = text =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// The URL if it is safe to follow, otherwise `undefined`, which leaves out the
// attribute it is meant for
export const sanitizeUrl = url => {
  if (typeof url !== "string") {
    return undefined;
  }

  return SAFE_URL.test(url.replace(IGNORED, "")) ? url : undefined;
};

const percentEncode = character => {
  const hex = character.charCodeAt(0).toString(16).toUpperCase();
  return `%${`0${hex}`.slice(-2)}`;
};

// A URL for the CSS function of the same name; characters that could end the
// function or the string are encoded
export const cssUrl = url => {
  const safeUrl = sanitizeUrl(url);

  if (!safeUrl) {
    return "none";
  }

  return `url("${safeUrl.replace(/[\s"'()\\]/g, percentEncode)}")`;
};

export const createSanitizer = purify => {
  // Without a DOM (or in an ancient browser) DOMPurify offers nothing but this
  if (purify.isSupported) {
    purify.addHook("afterSanitizeAttributes", node => {
      const tag = node.nodeName.toLowerCase();

      // A page opened in another window must not get hold of the box’s page
      if (tag === "a" && node.hasAttribute("target")) {
        const rel = (node.getAttribute("rel") || "")
          .split(/\s+/)
          .filter(Boolean);

        if (rel.indexOf("noopener") < 0) {
          rel.push("noopener");
        }

        node.setAttribute("rel", rel.join(" "));
      }

      if (tag === "iframe" || tag === "object" || tag === "embed") {
        const name = tag === "object" ? "data" : "src";

        if (
          node.hasAttribute(name) &&
          !EMBED_URL.test(node.getAttribute(name).replace(IGNORED, ""))
        ) {
          node.removeAttribute(name);
        }

        if (tag === "iframe") {
          node.setAttribute("sandbox", SANDBOX);
        }
      }

      if (node.style && PAGE_COVERING_POSITION.test(node.style.position)) {
        node.style.removeProperty("position");
      }
    });

    purify.setConfig(CONFIG);
  }

  // Should the sanitizer be unable to work, show the markup as text instead of
  // passing it on unchecked
  return html => {
    if (html === null || html === undefined) {
      return "";
    }

    return purify.isSupported
      ? purify.sanitize(String(html))
      : escapeHtml(html);
  };
};

export const sanitizeHtml = createSanitizer(DOMPurify);
