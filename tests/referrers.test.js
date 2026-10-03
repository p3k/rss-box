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
    referrers.set(undefined);
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

    // Google’s sandboxed embed frames get a different, randomly-generated
    // host label per instance, so this can never be listed as one exact host
    it("skips a nasty host with a per-instance random prefix too", async () => {
      const result = await fetchReferrers([
        {
          url: "https://1042703800-atari-embeds.googleusercontent.com/x",
          hits: 1
        },
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

    // At least one referrer in the wild sends feedUrls JSON-encoded twice
    // over, rather than as a real array – recovered the same way a bare,
    // non-JSON string (like a lone URL) still is not, above
    it("recovers feed URLs that are JSON-encoded twice over", async () => {
      const result = await fetchReferrers([
        {
          url: "http://e.example/",
          hits: 1,
          metadata: {
            feedUrls: '["https://e.example/feed.xml", "javascript:alert(1)"]'
          }
        }
      ]);

      assert.deepEqual(result[0].metadata, {
        feedUrls: ["https://e.example/feed.xml"]
      });
    });

    it("survives a failing request", async () => {
      mock.method(globalThis, "fetch", async () => {
        throw new Error("Network down");
      });

      await referrers.fetch();
      assert.equal(get(referrers), undefined);

      await fetchReferrers({ not: "a list" });
      assert.equal(get(referrers), undefined);
    });

    // $referrers.length alone can’t tell a request still in flight apart
    // from one that resolved with no referrers at all
    it("stays unset until the first response arrives", async () => {
      let resolveFetch;

      mock.method(
        globalThis,
        "fetch",
        () => new Promise(resolve => (resolveFetch = resolve))
      );

      const fetchPromise = referrers.fetch();
      assert.equal(get(referrers), undefined);

      resolveFetch(new Response(JSON.stringify([])));
      await fetchPromise;
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

    it("shows a loading state while a request is in flight, then an empty state once it resolves with nothing", async () => {
      let resolveFetch;

      mock.method(
        globalThis,
        "fetch",
        () => new Promise(resolve => (resolveFetch = resolve))
      );

      const target = render();
      const fetchPromise = referrers.fetch();
      await tick();

      assert.ok(
        target.querySelector("details").textContent.includes("Loading…")
      );

      resolveFetch(new Response(JSON.stringify([])));
      await fetchPromise;
      await tick();

      const text = target.querySelector("details").textContent;

      assert.ok(!text.includes("Loading…"));
      assert.ok(text.includes("No referrers yet."));
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

    it("only renders a feed-dropdown for referrers with more than one feed URL", async () => {
      const target = render();

      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 3,
          metadata: {
            feedUrls: [
              "https://a.example/feed.xml",
              "https://a.example/feed2.xml"
            ]
          }
        },
        {
          url: "http://b.example/",
          hits: 2,
          metadata: { feedUrls: ["https://b.example/feed.xml"] }
        },
        { url: "http://c.example/", hits: 1, metadata: {} }
      ]);
      await tick();

      const hasDropdown = [...target.querySelectorAll(".referrer")].map(
        row => row.querySelector(".feed-dropdown-trigger") !== null
      );

      assert.deepEqual(hasDropdown, [true, false, false]);
    });

    it("renders no feed-dropdown options until the trigger is clicked", async () => {
      const target = render();

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

      assert.equal(target.querySelector(".feed-dropdown-option"), null);
    });

    it("labels feed-dropdown options by position, rendered after the trigger and before the host link", async () => {
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
              "https://a.example/feed2.xml",
              "https://a.example/feed3.xml"
            ]
          }
        }
      ]);
      await tick();

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      const row = target.querySelector(".referrer");
      const children = [...row.querySelectorAll(".feed-dropdown-option, a")];

      assert.deepEqual(
        children.map(child => child.textContent.trim()),
        ["1", "2", "3", "a.example"]
      );

      const [, , third] = target.querySelectorAll(".feed-dropdown-option");

      third.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

      assert.equal(get(config).url, "https://a.example/feed3.xml");
    });

    it("marks the selected feed-dropdown option as active, and only that one", async () => {
      const target = render();

      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 1,
          metadata: {
            feedUrls: [
              "https://a.example/feed.xml",
              "https://a.example/feed2.xml",
              "https://a.example/feed3.xml"
            ]
          }
        }
      ]);
      await tick();

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      const activeLabels = () =>
        [...target.querySelectorAll(".feed-dropdown-option")]
          .filter(option => option.classList.contains("active"))
          .map(option => option.textContent.trim());

      // The trigger primes the first option, same as loading its URL does
      assert.deepEqual(activeLabels(), ["1"]);

      const [, , third] = target.querySelectorAll(".feed-dropdown-option");

      third.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      assert.deepEqual(activeLabels(), ["3"]);
    });

    it("loads the first feed URL the moment the trigger is clicked, before any option is actively chosen", async () => {
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

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

      assert.equal(get(config).url, "https://a.example/feed.xml");
    });

    it("loads whichever feed URL was last chosen, not just the first one, the next time the trigger is clicked", async () => {
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

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      const [, second] = target.querySelectorAll(".feed-dropdown-option");

      second.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      // Closing the dropdown and re-opening it (see the next test for
      // staying open) must load that same choice again, not reset to the
      // first
      document.body.dispatchEvent(
        new window.MouseEvent("click", { bubbles: true })
      );
      await tick();
      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

      assert.equal(get(config).url, "https://a.example/feed2.xml");
    });

    it("keeps the feed-dropdown open after choosing an option", async () => {
      const target = render();

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

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      const [, second] = target.querySelectorAll(".feed-dropdown-option");

      second.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();

      assert.equal(target.querySelectorAll(".feed-dropdown-option").length, 2);
    });

    it("closes the feed-dropdown when clicking outside of it", async () => {
      const target = render();

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

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();
      assert.equal(target.querySelectorAll(".feed-dropdown-option").length, 2);

      document.body.dispatchEvent(
        new window.MouseEvent("click", { bubbles: true })
      );
      await tick();

      assert.equal(target.querySelector(".feed-dropdown-option"), null);
    });

    it("closes the feed-dropdown when Escape is pressed", async () => {
      const target = render();

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

      const trigger = target.querySelector(".feed-dropdown-trigger");

      trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await tick();
      assert.equal(target.querySelectorAll(".feed-dropdown-option").length, 2);

      document.body.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
      await tick();

      assert.equal(target.querySelector(".feed-dropdown-option"), null);
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

      // A referrer with more than one feed URL is covered by its
      // feed-dropdown and never actually receives a hover in a real browser
      // (see hasMultipleFeedUrls) – this only still matters for a single URL
      await fetchReferrers([
        {
          url: "http://a.example/",
          hits: 1,
          metadata: { feedUrls: ["https://a.example/feed.xml"] }
        }
      ]);
      await tick();

      const link = target.querySelector(".feed-link");
      link.dispatchEvent(new window.MouseEvent("mouseover"));
      assert.equal(link.href, "https://a.example/feed.xml");

      // A second hover must not change it again
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
