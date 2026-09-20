import assert from "node:assert/strict";
import { describe, it } from "node:test";

import error from "../src/error.js";

describe("error", () => {
  const url = `https://feed.example/"><img src=x onerror=alert(1)>?a=1&b=2`;

  it("encodes the feed URL in its links", () => {
    const result = error(url, "Not Found");
    const encoded = encodeURIComponent(url);

    assert.equal(result.link, `http://localhost:8000?url=${encoded}`);
    assert.ok(
      result.items[2].description.includes(`check.cgi?url=${encoded}"`)
    );
  });

  it("does not let the feed URL inject markup", () => {
    const { items } = error(url, "Not Found");

    assert.ok(!items[2].description.includes("<img"));
    assert.ok(!items[2].description.includes("onerror=alert(1)>"));
  });

  it("escapes the message", () => {
    const { items } = error(url, new Error("<b>Oops</b> & more"));

    assert.equal(
      items[1].description,
      "Error: &lt;b&gt;Oops&lt;/b&gt; &amp; more"
    );
  });
});
