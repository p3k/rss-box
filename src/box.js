import ready from "domready";

import { getPingUrl, getQueryOf, parseQuery } from "./embed";
import { ConfigStore, FeedStore } from "./stores";
import { urls } from "./urls";
import getNativeObject from "./native.js";

import Box from "./Box.svelte";

// These are backwards-compatible settings
const defaults = {
  align: "initial",
  boxFillColor: "#fff",
  compact: false,
  fontFace: "inherit",
  frameColor: "#000",
  headless: false,
  height: "",
  linkColor: "",
  maxItems: 7,
  radius: 0,
  showXmlButton: false,
  textColor: "#000",
  titleBarColor: "#add8e6",
  titleBarTextColor: "#000",
  width: "200"
};

const keys = [...Object.keys(defaults), "url"];

ready(() => {
  const reduce = getNativeObject("Array").prototype.reduce;

  // Earlier versions used protocol-less URLs like `//p3k.org/rss`
  const search = urls.app.replace(/^https?:/, "");
  const scripts = Array.apply(
    null,
    document.querySelectorAll(`script[src*="${search}"]`)
  );
  const feedUrls = [];

  scripts.forEach(script => {
    const query = getQueryOf(script.src);

    if (!query) return;

    let data = parseQuery(query, keys, reduce);

    if (!data.url) data.url = urls.feed;

    data = Object.assign({}, defaults, data);

    // Create new stores for each box to prevent multiple boxes getting the same data
    const feed = FeedStore();
    const config = ConfigStore();

    config.set(data);
    feed.fetch(data.url, feed);

    const parent = script.parentNode;
    const container = document.createElement("div");

    parent.insertBefore(container, script);

    void new Box({
      target: container,
      props: { feed, config }
    });

    // Only for IE11
    script.parentNode.removeChild(script);

    if (data.url !== urls.feed && feedUrls.indexOf(data.url) < 0) {
      feedUrls.push(data.url);
    }
  });

  if (location.href.indexOf(urls.app) < 0) {
    fetch(getPingUrl(urls.referrers, location.href, feedUrls));
  }
});
