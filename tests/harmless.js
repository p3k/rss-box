import assert from "node:assert/strict";

// Browsers ignore whitespace and control characters within URL schemes
const IGNORED = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(32)}]`,
  "g"
);

const scheme = value => value.replace(IGNORED, "").toLowerCase();

const URL_ATTRIBUTES = [
  "href",
  "src",
  "data",
  "action",
  "formaction",
  "xlink:href"
];

export const elements = root => [...root.querySelectorAll("*")];

// No attribute may point to code, and none may be an event handler, no matter
// how the browser reads the markup
export const assertNoScripting = (root, description) => {
  for (const element of elements(root)) {
    for (const { name, value } of [...element.attributes]) {
      assert.ok(
        !/^on/i.test(name),
        `${description}: <${element.localName} ${name}>`
      );
      assert.notEqual(name.toLowerCase(), "srcdoc", description);

      if (URL_ATTRIBUTES.includes(name)) {
        const isImage =
          element.localName === "img" && /^data:image\//.test(scheme(value));

        assert.ok(
          isImage || !/^(javascript|vbscript|data):/.test(scheme(value)),
          `${description}: <${element.localName} ${name}="${value}">`
        );
      }
    }
  }
};

// Nothing in here may run code or take over the page, either
export const assertHarmless = (root, description) => {
  assertNoScripting(root, description);

  for (const tag of [
    "script",
    "style",
    "link",
    "base",
    "meta",
    "form",
    "input",
    "button",
    "svg",
    "math"
  ]) {
    assert.equal(
      root.querySelectorAll(tag).length,
      0,
      `${description}: <${tag}> is left`
    );
  }

  for (const frame of root.querySelectorAll("iframe")) {
    assert.ok(
      frame.hasAttribute("sandbox"),
      `${description}: unsandboxed iframe`
    );
  }
};
