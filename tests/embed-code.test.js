import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { tick } from "svelte";

import "./dom.js";
import { getQueryOf, parseQuery } from "../src/embed.js";
import Configurator from "../src/lib/Configurator.svelte";
import { ConfigStore, FeedStore } from "../src/stores.js";

describe("the embed code of the configurator", () => {
  const configurators = [];

  afterEach(() => {
    configurators.splice(0).forEach(configurator => configurator.$destroy());
    document.body.innerHTML = "";
  });

  // The code is what the visitors of the page copy into their own pages
  const render = async settings => {
    const config = ConfigStore();
    const target = document.createElement("div");

    config.set(settings);
    document.body.appendChild(target);
    configurators.push(
      new Configurator({ target, props: { feed: FeedStore(), config } })
    );
    await tick();

    return target.querySelector("textarea#code").value;
  };

  const settings = {
    url: "https://a.example/it's/feed.xml?a=1&b='2'",
    fontFace: "12px 'Open Sans', sans-serif",
    maxItems: 5
  };

  // The attribute is delimited by single quotes, which URLs and fonts may contain
  it("is a single script tag, whatever the settings contain", async () => {
    const code = await render(settings);

    assert.match(code, /^<script async defer src='[^']*'><\/script>$/);
  });

  it("carries the settings unchanged", async () => {
    const code = await render(settings);

    // What the browser makes of the attribute, and then what the script makes of it
    const src = code.match(/src='([^']*)'/)[1].replaceAll("&amp;", "&");
    const data = parseQuery(getQueryOf(src), ["url", "fontFace", "maxItems"]);

    assert.equal(data.url, settings.url);
    assert.equal(data.fontFace, settings.fontFace);
    assert.equal(data.maxItems, "5");
  });
});
