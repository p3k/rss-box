import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { tick } from "svelte";

import "./dom.js";
import Configurator from "../src/lib/Configurator.svelte";
import { ConfigStore, FeedStore } from "../src/stores.js";
import { assertNoScripting } from "./harmless.js";

describe("Configurator", () => {
  const configurators = [];

  afterEach(() => {
    configurators.splice(0).forEach(configurator => configurator.$destroy());
    document.body.innerHTML = "";
  });

  const render = async url => {
    const feed = FeedStore();
    const config = ConfigStore();
    const target = document.createElement("div");

    feed.set({ format: "RSS", version: "2.0" });
    config.set({ url });
    document.body.appendChild(target);
    configurators.push(new Configurator({ target, props: { feed, config } }));
    await tick();

    return target;
  };

  it("links to the feed", async () => {
    const target = await render("https://example.org/feed.xml");

    assert.equal(
      target.querySelector(".source a").getAttribute("href"),
      "https://example.org/feed.xml"
    );
  });

  // The URL comes from the address of the page, i.e. from whoever linked to it
  it("does not link to a URL that could run code", async () => {
    const target = await render("javascript:alert(document.domain)");
    const link = target.querySelector(".source a");

    assert.ok(link);
    assert.ok(!link.hasAttribute("href"));
    assertNoScripting(target, "configurator");
  });
});
