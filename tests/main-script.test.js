import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import "./dom.js";
import { urls } from "../src/urls.js";
import { version } from "../package.json";

const initFlag = `__rssbox_viewer_${version.replace(/\D/g, "_")}_init__`;

// main.js runs immediately at module top level rather than exporting
// anything to call, and Node caches a module by its exact specifier – a
// cache-busting query string forces a fresh evaluation on every import,
// and clearing the already-loaded guard first lets that evaluation’s own
// logic run rather than immediately no-opping on a flag an earlier test set
const runMain = async () => {
  delete window[initFlag];
  await import(`../src/main.js?t=${Date.now()}-${Math.random()}`);
};

describe("the embed loader", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    delete window.msCrypto;
    delete window[initFlag];
  });

  it("loads polyfills.js before box.js in IE 11", async () => {
    window.msCrypto = {};
    await runMain();

    const scripts = document.head.querySelectorAll("script");

    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, `${urls.app}/polyfills.js`);

    scripts[0].dispatchEvent(new window.Event("load"));

    const afterLoad = document.head.querySelectorAll("script");

    assert.equal(afterLoad.length, 2);
    assert.equal(afterLoad[1].src, `${urls.app}/box.js`);
  });

  it("loads box-esm.js directly outside IE 11, without polyfills.js", async () => {
    await runMain();

    const scripts = document.head.querySelectorAll("script");

    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, `${urls.app}/box-esm.js`);
  });

  it("does not load anything again once already initialized", async () => {
    await runMain();
    assert.equal(document.head.querySelectorAll("script").length, 1);

    // Leaves window[initFlag] set from the run above, unlike runMain()
    document.head.innerHTML = "";
    await import(`../src/main.js?t=${Date.now()}-${Math.random()}`);

    assert.equal(document.head.querySelectorAll("script").length, 0);
  });
});
