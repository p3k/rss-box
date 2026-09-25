import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { tick } from "svelte";
import { get } from "svelte/store";

import "./dom.js";
import Referrers from "../src/lib/Referrers.svelte";
import { ConfigStore, referrers } from "../src/stores.js";

const respondWith = data => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response(JSON.stringify(data))
  );
};

const fetchReferrers = async data => {
  respondWith(data);
  await referrers.fetch();
  return get(referrers);
};

describe("referrers", () => {
  beforeEach(() => {
    referrers.set([]);
    mock.method(console, "error", () => {});
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("fetching", () => {
    it("groups the pings by host and sorts them by their share", async () => {
      const result = await fetchReferrers([
        { url: "http://other.example/", hits: 2 },
        { url: "https://www.example.org/a", hits: 3 },
        { url: "https://example.org/b", hits: 5 }
      ]);

      assert.deepEqual(
        result.map(({ host, url, hits, total, percentage }) => ({
          host,
          url,
          hits,
          total,
          percentage
        })),
        [
          {
            host: "example.org",
            url: "https://example.org/b",
            hits: 5,
            total: 8,
            percentage: 80
          },
          {
            host: "other.example",
            url: "http://other.example/",
            hits: 2,
            total: 2,
            percentage: 20
          }
        ]
      );
    });

    it("skips URLs that are not of interest", async () => {
      const result = await fetchReferrers([
        { url: "ftp://files.example/", hits: 1 },
        { url: "javascript:alert(1)", hits: 1 },
        { url: "http://localhost:8000/page", hits: 1 },
        { url: "https://atari-embeds.googleusercontent.com/x", hits: 1 },
        { url: "https://kept.example/", hits: 1 }
      ]);

      assert.deepEqual(
        result.map(referrer => referrer.host),
        ["kept.example"]
      );
    });

    // A substring check would also match a host that merely mentions the
    // noisy host somewhere else in the URL
    it("only skips a nasty host by its actual hostname", async () => {
      const result = await fetchReferrers([
        {
          url: "https://evil.example/?x=atari-embeds.googleusercontent.com",
          hits: 1
        }
      ]);

      assert.deepEqual(
        result.map(referrer => referrer.host),
        ["evil.example"]
      );
    });

    // Anybody can register a referrer, and host names are arbitrary text
    it("copes with host names that are also property names", async () => {
      const names = [
        "length",
        "constructor",
        "__proto__",
        "hasOwnProperty",
        "push"
      ];

      const result = await fetchReferrers(
        names.map(name => ({ url: `http://${name}/`, hits: 1 }))
      );

      assert.deepEqual(
        result.map(referrer => referrer.host).sort(),
        [...names].sort()
      );
    });

    it("only keeps feed URLs that are safe to load", async () => {
      const result = await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 1,
          metadata: {
            feedUrls: [
              "https://a.example/feed.xml",
              "javascript:alert(1)",
              "data:text/html,x",
              5,
              null
            ]
          }
        },
        {
          url: "http://b.example/",
          hits: 1,
          metadata: { feedUrls: "https://b.example/feed.xml" }
        },
        { url: "http://c.example/", hits: 1, metadata: { feedUrls: [] } },
        { url: "http://d.example/", hits: 1 }
      ]);

      const metadata = Object.fromEntries(
        result.map(referrer => [referrer.host, referrer.metadata])
      );

      assert.deepEqual(metadata["a.example"], {
        feedUrls: ["https://a.example/feed.xml"]
      });
      assert.deepEqual(metadata["b.example"], {});
      assert.deepEqual(metadata["c.example"], {});
      assert.deepEqual(metadata["d.example"], {});
    });

    it("survives a failing request", async () => {
      mock.method(globalThis, "fetch", async () => {
        throw new Error("Network down");
      });

      await referrers.fetch();
      assert.deepEqual(get(referrers), []);

      await fetchReferrers({ not: "a list" });
      assert.deepEqual(get(referrers), []);
    });
  });

  describe("the list", () => {
    const boxes = [];

    const render = () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      boxes.push(new Referrers({ target, props: { config: ConfigStore() } }));
      return target;
    };

    const toggle = (target, open) => {
      const details = target.querySelector("details");
      details.open = open;
      details.dispatchEvent(new window.Event("toggle"));
    };

    afterEach(() => {
      boxes.splice(0).forEach(box => box.$destroy());
      document.body.innerHTML = "";
    });

    it("loads the referrers when opened, but not when closed", async () => {
      respondWith([]);

      const target = render();
      assert.equal(globalThis.fetch.mock.callCount(), 0);

      toggle(target, true);
      assert.equal(globalThis.fetch.mock.callCount(), 1);

      toggle(target, false);
      assert.equal(globalThis.fetch.mock.callCount(), 1);
    });

    it("disables the feed links of referrers without feed URLs", async () => {
      const target = render();

      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 3,
          metadata: { feedUrls: ["https://a.example/feed.xml"] }
        },
        { url: "http://b.example/", hits: 2, metadata: { feedUrls: [] } },
        { url: "http://c.example/", hits: 1, metadata: {} }
      ]);
      await tick();

      const disabled = [...target.querySelectorAll(".feed-link")].map(link =>
        link.classList.contains("disabled")
      );

      assert.deepEqual(disabled, [false, true, true]);
    });

    it("does nothing when a disabled feed link is clicked", async () => {
      const config = ConfigStore();
      const target = document.createElement("div");
      document.body.appendChild(target);
      boxes.push(new Referrers({ target, props: { config } }));

      await fetchReferrers([
        { url: "http://a.example/", hits: 1, metadata: {} }
      ]);
      await tick();

      const link = target.querySelector(".feed-link");
      link.dispatchEvent(new window.MouseEvent("click", { cancelable: true }));

      assert.equal(get(config).url, "");
    });

    it("initializes the feed link href on the first hover only", async () => {
      const config = ConfigStore();
      const target = document.createElement("div");
      document.body.appendChild(target);
      boxes.push(new Referrers({ target, props: { config } }));

      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 1,
          metadata: {
            feedUrls: [
              "https://a.example/feed.xml",
              "https://a.example/feed2.xml"
            ]
          }
        }
      ]);
      await tick();

      const link = target.querySelector(".feed-link");
      link.dispatchEvent(new window.MouseEvent("mouseover"));
      assert.equal(link.href, "https://a.example/feed.xml");

      // A second hover must not cycle it forward again — that's only
      // meta-click's job, not a plain re-hover's
      link.dispatchEvent(new window.MouseEvent("mouseover"));
      assert.equal(link.href, "https://a.example/feed.xml");
    });

    it("loads the feed when an enabled feed link is clicked", async () => {
      const config = ConfigStore();
      const target = document.createElement("div");
      document.body.appendChild(target);
      boxes.push(new Referrers({ target, props: { config } }));

      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 1,
          metadata: { feedUrls: ["https://a.example/feed.xml"] }
        }
      ]);
      await tick();

      const link = target.querySelector(".feed-link");
      link.dispatchEvent(new window.MouseEvent("click", { cancelable: true }));

      assert.equal(get(config).url, link.href);
    });

    it("resolves the link correctly even when the click targets the icon rather than the anchor", async () => {
      const config = ConfigStore();
      const target = document.createElement("div");
      document.body.appendChild(target);
      boxes.push(new Referrers({ target, props: { config } }));

      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 1,
          metadata: { feedUrls: ["https://a.example/feed.xml"] }
        }
      ]);
      await tick();

      const link = target.querySelector(".feed-link");
      const icon = link.querySelector("svg");
      icon.dispatchEvent(
        new window.MouseEvent("click", { bubbles: true, cancelable: true })
      );

      assert.equal(get(config).url, link.href);
    });
  });
});
