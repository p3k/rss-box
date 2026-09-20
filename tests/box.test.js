import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { tick } from "svelte";

import "./dom.js";
import Box from "../src/Box.svelte";
import error from "../src/error.js";
import { ConfigStore, FeedStore } from "../src/stores.js";

const items = [1, 2, 3].map(number => ({
  title: `Title ${number}`,
  description: `<p>Description ${number}</p>`,
  link: `https://example.org/${number}`,
  enclosures: []
}));

const boxes = [];

// Renders a box the way the embed script does, with a store pair per box
const render = async ({ feed: feedState = {}, config: configState = {} }) => {
  const feed = FeedStore();
  const config = ConfigStore();
  const target = document.createElement("div");

  feed.set(feedState);
  config.set(configState);
  document.body.appendChild(target);
  boxes.push(new Box({ target, props: { feed, config } }));
  await tick();

  return target;
};

const itemTitles = target =>
  [...target.querySelectorAll(".rssbox-item-title")].map(node =>
    node.textContent.trim()
  );

describe("Box", () => {
  afterEach(() => {
    boxes.splice(0).forEach(box => box.$destroy());
    document.body.innerHTML = "";
  });

  it("shows the title and the items of the feed", async () => {
    const target = await render({
      feed: { title: "Feed title", link: "https://example.org/", items }
    });

    // The first link of the title bar is the button for the feed itself
    const titleLink = target.querySelector(
      '.rssbox-titlebar a[href="https://example.org/"]'
    );

    assert.equal(titleLink.textContent.trim(), "Feed title");
    assert.deepEqual(itemTitles(target), ["Title 1", "Title 2", "Title 3"]);
    assert.ok(target.textContent.includes("Description 2"));
  });

  it("limits the items to `maxItems`", async () => {
    const target = await render({
      feed: { items },
      config: { maxItems: 2 }
    });

    assert.deepEqual(itemTitles(target), ["Title 1", "Title 2"]);
  });

  it("only shows the titles in compact mode", async () => {
    const target = await render({
      feed: { items },
      config: { compact: true }
    });

    assert.deepEqual(itemTitles(target), ["Title 1", "Title 2", "Title 3"]);
    assert.ok(!target.textContent.includes("Description"));
  });

  // The message would be useless if the embedding page could hide parts of it
  describe("showing an error", () => {
    const failed = () => error("https://feed.example/feed.xml", "Not Found");
    const itemCount = target =>
      target.querySelectorAll(".rssbox-item-content").length;

    it("shows the error message in compact mode", async () => {
      const target = await render({
        feed: failed(),
        config: { compact: true }
      });

      assert.ok(target.textContent.includes("Not Found"));
    });

    it("shows the whole error regardless of `maxItems`", async () => {
      const target = await render({
        feed: failed(),
        config: { maxItems: 1 }
      });

      assert.equal(itemCount(target), 3);
      assert.ok(target.textContent.includes("Not Found"));
    });
  });
});
