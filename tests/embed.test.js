import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { getPingUrl, getQueryOf, parseQuery } from "../src/embed.js";

describe("getQueryOf", () => {
  it("returns the part after the question mark", () => {
    assert.equal(
      getQueryOf("https://p3k.org/rss/main.js?url=x&maxItems=5"),
      "url=x&maxItems=5"
    );
  });

  it("does not stop at another question mark", () => {
    assert.equal(
      getQueryOf("https://p3k.org/rss/main.js?url=https://a.example/f?id=5"),
      "url=https://a.example/f?id=5"
    );
  });

  it("leaves out a fragment", () => {
    assert.equal(getQueryOf("https://p3k.org/rss/main.js?url=x#top"), "url=x");
  });

  it("has nothing for an address without settings", () => {
    assert.equal(getQueryOf("https://p3k.org/rss/main.js"), "");
    assert.equal(getQueryOf("https://p3k.org/rss/main.js#?url=x"), "");
    assert.equal(getQueryOf("https://p3k.org/rss/main.js?"), "");
  });
});

describe("parseQuery", () => {
  const keys = ["url", "maxItems", "compact", "headless", "fontFace"];

  it("takes the known keys and converts booleans", () => {
    assert.deepEqual(
      parseQuery(
        "url=https%3A%2F%2Fa.example%2Ffeed.xml&maxItems=5&compact=true&headless=false",
        keys
      ),
      {
        url: "https://a.example/feed.xml",
        maxItems: "5",
        compact: true,
        headless: false
      }
    );
  });

  it("decodes the values", () => {
    assert.deepEqual(
      parseQuery("fontFace=10pt%20sans-serif%2C%20serif", keys),
      {
        fontFace: "10pt sans-serif, serif"
      }
    );
  });

  it("keeps everything after the first `=` as the value", () => {
    assert.deepEqual(
      parseQuery("url=https://a.example/feed?id=5&maxItems=5", keys),
      { url: "https://a.example/feed?id=5", maxItems: "5" }
    );
  });

  it("copes with escape sequences that are malformed", () => {
    assert.deepEqual(parseQuery("fontFace=100%&maxItems=5", keys), {
      fontFace: "100%",
      maxItems: "5"
    });
    assert.deepEqual(parseQuery("url=%E0%A4%A", keys), { url: "%E0%A4%A" });
  });

  it("gives a key without `=` an empty value, not the word `undefined`", () => {
    assert.deepEqual(parseQuery("compact&maxItems=5", keys), {
      compact: "",
      maxItems: "5"
    });
  });

  it("does not decode a plus sign", () => {
    assert.deepEqual(parseQuery("fontFace=10pt+sans-serif", keys), {
      fontFace: "10pt+sans-serif"
    });
  });

  it("ignores everything else", () => {
    const data = parseQuery(
      "__proto__=x&constructor=y&evil=1&maxItems=5&toString=z",
      keys
    );

    assert.deepEqual(data, { maxItems: "5" });
    assert.equal(Object.getPrototypeOf(data), Object.prototype);
    assert.equal({}.x, undefined);
  });

  it("uses the `reduce` it is given", () => {
    const reduce = mock.fn(Array.prototype.reduce);

    assert.deepEqual(parseQuery("maxItems=5", keys, reduce), { maxItems: "5" });
    assert.equal(reduce.mock.callCount(), 1);
  });
});

describe("getPingUrl", () => {
  const referrers = "https://services.example/ferris?group=rss-box";
  const feedUrls = ["https://a.example/feed.xml"];

  const metadata = encodeURIComponent(JSON.stringify({ feedUrls }));

  it("tells about the page and its feeds", () => {
    assert.equal(
      getPingUrl(referrers, "https://blog.example/post?id=5", feedUrls),
      `${referrers}&url=${encodeURIComponent(
        "https://blog.example/post?id=5"
      )}&metadata=${metadata}`
    );
  });

  it("leaves out the fragment of the page", () => {
    const expected = getPingUrl(
      referrers,
      "https://blog.example/post?id=5",
      feedUrls
    );

    assert.equal(
      getPingUrl(
        referrers,
        "https://blog.example/post?id=5#comments",
        feedUrls
      ),
      expected
    );
    assert.equal(
      getPingUrl(referrers, "https://blog.example/post?id=5#", feedUrls),
      expected
    );
    assert.ok(!expected.includes("%23"));
  });

  it("works without feeds", () => {
    assert.ok(
      getPingUrl(referrers, "https://blog.example/", []).endsWith(
        `&metadata=${encodeURIComponent('{"feedUrls":[]}')}`
      )
    );
  });
});
