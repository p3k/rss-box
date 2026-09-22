import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { tick } from "svelte";

import "./dom.js";
import Box from "../src/Box.svelte";
import error from "../src/error.js";
import { RssParser } from "../src/rss-parser.js";
import { ConfigStore, FeedStore } from "../src/stores.js";
import { assertNoScripting } from "./harmless.js";

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

  // Feeds are written by strangers, but their content lands in the page of
  // whoever embeds the box
  describe("showing hostile content", () => {
    const hostile = () =>
      RssParser().parse(
        readFileSync(
          new URL("./fixtures/feeds/hostile-rss.xml", import.meta.url),
          "utf8"
        )
      );

    it("puts nothing into the page that could run code", async () => {
      const target = await render({
        feed: hostile(),
        config: { url: "javascript:alert(document.domain)" }
      });

      assert.equal(target.querySelectorAll("script").length, 0);
      assertNoScripting(target, "hostile feed");
    });

    it("keeps the harmless content", async () => {
      const target = await render({ feed: hostile() });

      const link = target.querySelector('a[href="https://hostile.example/"]');

      assert.ok(target.textContent.includes("Harmless neighbour"));
      assert.equal(link.textContent, "a normal link");
      assert.ok(
        target.querySelector('a[href="https://hostile.example/harmless"]')
      );
    });

    it("leaves out links and form targets that are not safe to follow", async () => {
      const feed = {
        ...hostile(),
        input: {
          link: "javascript:alert(1)",
          name: "q",
          description: "",
          title: ""
        }
      };

      const target = await render({
        feed,
        config: { url: "javascript:alert(2)", showXmlButton: true }
      });

      // The links are still there, but they lead nowhere
      const enclosure = target.querySelector("a.rssbox-enclosure");
      const source = target.querySelector("a.rssbox-source");
      const form = target.querySelector("form.rssbox-form");

      assert.ok(enclosure && !enclosure.hasAttribute("href"));
      assert.ok(source && !source.hasAttribute("href"));
      assert.ok(form && !form.hasAttribute("action"));

      const titleBarLinks = [...target.querySelectorAll(".rssbox-titlebar a")];

      assert.ok(titleBarLinks.length > 0);
      assert.ok(titleBarLinks.every(link => !link.hasAttribute("href")));
    });

    it("copes with a source that has no URL", async () => {
      const target = await render({
        feed: {
          items: [
            {
              title: "Title",
              description: "Description",
              source: { url: null, title: "A source" },
              enclosures: []
            }
          ]
        }
      });

      assert.ok(target.textContent.includes("Description"));
    });

    describe("with an image", () => {
      const RealImage = globalThis.Image;

      afterEach(() => {
        globalThis.Image = RealImage;
      });

      // jsdom does not load images, so let them load instantly
      const loadImages = () => {
        globalThis.Image = class {
          width = 200;
          height = 100;

          set src(value) {
            this.loaded = value;
            queueMicrotask(() => this.onload());
          }
        };
      };

      const image = source => ({
        source,
        title: "Logo",
        link: "https://example.org/",
        description: "A logo"
      });

      it("keeps the URL from breaking out of the style", async () => {
        loadImages();

        const target = await render({
          feed: {
            image: image(
              'https://example.org/a.png"); position: fixed; x: url("'
            )
          }
        });

        await new Promise(resolve => setTimeout(resolve));

        const logo = target.querySelector(".rssbox-image");

        assert.ok(logo);
        assert.equal(logo.style.position, "");
        assert.ok(logo.style.backgroundImage.startsWith("url("));
      });

      it("shows no image from an unsafe URL", async () => {
        loadImages();

        const target = await render({
          feed: { image: image("javascript:alert(1)") }
        });

        await new Promise(resolve => setTimeout(resolve));

        assert.equal(target.querySelector(".rssbox-image"), null);
      });
    });
  });
});
