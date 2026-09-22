import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { get } from "svelte/store";

import "./dom.js";
import About from "../src/lib/About.svelte";
import { ConfigStore } from "../src/stores.js";

describe("About", () => {
  const abouts = [];

  afterEach(() => {
    abouts.splice(0).forEach(about => about.$destroy());
    document.body.innerHTML = "";
  });

  // The links to the example feeds show them in the viewer instead of leaving it
  it("loads an example feed instead of following its link", () => {
    const config = ConfigStore();
    const target = document.createElement("div");

    document.body.appendChild(target);
    abouts.push(new About({ target, props: { config } }));

    const link = target.querySelector('a[href$="scriptingNews2.xml"]');
    const click = new window.MouseEvent("click", {
      bubbles: true,
      cancelable: true
    });

    link.dispatchEvent(click);

    assert.ok(click.defaultPrevented);
    assert.equal(get(config).url, link.href);
  });
});
