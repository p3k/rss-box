import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it, mock } from "node:test";
import { get } from "svelte/store";

import "./dom.js";
import { FeedStore } from "../src/stores.js";

const fixture = name =>
  readFileSync(new URL(`./fixtures/feeds/${name}`, import.meta.url), "utf8");

// The proxy wraps the feed into JSON
const response = content =>
  new Response(JSON.stringify({ content, headers: {} }));

const respondWith = (...contents) => {
  mock.method(globalThis, "fetch", async () => response(contents.shift()));
};

const rss = title =>
  `<rss version="2.0"><channel><title>${title}</title></channel></rss>`;

describe("FeedStore", () => {
  afterEach(() => {
    mock.restoreAll();
    mock.method(console, "error", () => {});
  });

  describe("fetching a feed", () => {
    it("shows the data of the feed", async () => {
      respondWith(fixture("rss-2.0.xml"));

      const feed = FeedStore();
      await feed.fetch("https://blog.example/feed.xml");

      const state = get(feed);
      assert.equal(state.title, "Example Blog");
      assert.equal(state.items.length, 2);
      assert.equal(state.loading, false);
    });

    it("does not keep the text input of a previous feed", async () => {
      respondWith(fixture("rss-1.0-rdf.xml"), fixture("rss-2.0.xml"));

      const feed = FeedStore();
      await feed.fetch("https://radio.example/feed.rdf");
      assert.ok(get(feed).input);

      await feed.fetch("https://blog.example/feed.xml");
      assert.equal(get(feed).input, "");
    });

    it("does not keep the image of a previous feed", async () => {
      const withoutImage =
        "<scriptingNews><header><channelTitle>Plain</channelTitle></header></scriptingNews>";
      respondWith(fixture("rss-2.0.xml"), withoutImage);

      const feed = FeedStore();
      await feed.fetch("https://blog.example/feed.xml");
      assert.ok(get(feed).image);

      await feed.fetch("https://plain.example/feed.xml");
      assert.equal(get(feed).title, "Plain");
      assert.equal(get(feed).image, "");
    });

    it("ignores a response that arrives after a later request", async () => {
      const slow = Promise.withResolvers();
      const fast = Promise.withResolvers();
      const pending = [slow, fast];

      mock.method(globalThis, "fetch", () => pending.shift().promise);

      const feed = FeedStore();
      const first = feed.fetch("https://slow.example/feed.xml");
      const second = feed.fetch("https://fast.example/feed.xml");

      fast.resolve(response(rss("Fast")));
      await second;
      slow.resolve(response(rss("Slow")));
      await first;

      assert.equal(get(feed).title, "Fast");
      assert.equal(get(feed).loading, false);
    });
  });

  describe("failing to fetch a feed", () => {
    it("shows the error instead of the previous feed", async () => {
      respondWith(fixture("rss-1.0-rdf.xml"), "this is not a feed");

      const feed = FeedStore();
      await feed.fetch("https://radio.example/feed.rdf");
      assert.ok(get(feed).input);

      await feed.fetch("https://broken.example/feed.xml");

      const state = get(feed);
      assert.equal(state.format, "Error");
      assert.equal(state.input, "");
      assert.equal(state.loading, false);
    });
  });
});
