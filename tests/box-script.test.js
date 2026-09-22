import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, describe, it, mock } from "node:test";

import "./dom.js";

const feed = readFileSync(
  new URL("./fixtures/feeds/rss-2.0.xml", import.meta.url),
  "utf8"
);

const fetched = [];

// Runs the embed script on a page the way a browser would: the script tags are
// on the page and the script looks for them once the page is ready
describe("the embed script", () => {
  before(async () => {
    mock.method(globalThis, "fetch", async url => {
      fetched.push(String(url));

      return new Response(
        String(url).includes("/roxy?")
          ? JSON.stringify({ content: feed, headers: {} })
          : "1"
      );
    });

    // The page the boxes are embedded in
    Object.defineProperty(globalThis, "location", {
      value: { href: "https://blog.example/post?id=5#comments", search: "" },
      configurable: true
    });

    document.body.innerHTML = `
      <p>Before the boxes</p>
      <script src="http://localhost:8000/main.js?url=https%3A%2F%2Fa.example%2Ffeed.xml&maxItems=2&fontFace=100%"></script>
      <p>Between the boxes</p>
      <script src="http://localhost:8000/main.js?url=https://b.example/feed?id=5&compact=true"></script>
      <script src="http://localhost:8000/main.js"></script>
      <script src="https://elsewhere.example/other.js?url=ignored"></script>`;

    await import("../src/box.js");
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  it("replaces every script tag that asks for a box with a box", () => {
    assert.equal(document.querySelectorAll(".rssbox").length, 2);
    assert.equal(
      document.querySelectorAll('script[src*="localhost:8000"]').length,
      1,
      "only the one without any settings is left"
    );
    assert.equal(
      document.querySelectorAll('script[src*="elsewhere.example"]').length,
      1
    );
  });

  it("keeps the boxes in the place of their script tags", () => {
    const [first, second] = document.querySelectorAll(".rssbox");

    assert.equal(
      first.parentNode.previousElementSibling.textContent,
      "Before the boxes"
    );
    assert.equal(
      second.parentNode.previousElementSibling.textContent,
      "Between the boxes"
    );
  });

  it("loads the feeds even if their URLs are not properly encoded", () => {
    const requested = fetched
      .filter(url => url.includes("/roxy?"))
      .map(url => new URL(url).searchParams.get("url"));

    assert.deepEqual(requested.sort(), [
      "https://a.example/feed.xml",
      "https://b.example/feed?id=5"
    ]);
  });

  it("tells the referrer service which page shows which feeds", () => {
    const pings = fetched.filter(url => url.includes("/ferris?"));

    assert.equal(pings.length, 1);

    const ping = new URL(pings[0]);

    assert.equal(ping.searchParams.get("group"), "rss-box");
    assert.deepEqual(JSON.parse(ping.searchParams.get("metadata")), {
      feedUrls: ["https://a.example/feed.xml", "https://b.example/feed?id=5"]
    });
  });

  it("leaves the fragment of the page out of the ping", () => {
    const [ping] = fetched.filter(url => url.includes("/ferris?"));

    assert.equal(
      new URL(ping).searchParams.get("url"),
      "https://blog.example/post?id=5"
    );
    assert.ok(!ping.includes("comments"));
  });
});
