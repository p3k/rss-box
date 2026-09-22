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
        link.hasAttribute("disabled")
      );

      assert.deepEqual(disabled, [false, true, true]);
    });
  });
});
