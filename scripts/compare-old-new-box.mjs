#!/usr/bin/env node
// Regression check against real-world feeds: pulls the feed URLs currently
// embedded out in the wild from ferris’s own referrer metadata, renders each
// one through the box as currently live in production and through a fresh
// local build, and reports any feed whose rendered output differs.
//
// Usage: node scripts/compare-old-new-box.mjs [--limit=N]

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENVIRONMENT_FILE = fileURLToPath(
  new URL("../src/environment.js", import.meta.url)
);

const FERRIS_URL = "https://p3k.org/json/ferris?group=rss-box&days=90";
const APP_URL = "https://p3k.org/rss";
const PROXY_URL = "https://p3k.org/json/roxy";
const REFERRERS_URL = "https://p3k.org/json/ferris?group=rss-box&days=30";

const RENDER_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 200;
const SETTLE_MS = 300;

const limitArg = process.argv.find(arg => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : Infinity;

// Ferris entries carry the feeds a page embeds as metadata.feedUrls, added
// by box.js itself when pinging the referrer service (see src/embed.js).
// At least one entry in the wild has it JSON-encoded twice over instead of
// as a real array, so both shapes have to be handled.
async function extractFeedUrls() {
  const res = await fetch(FERRIS_URL, {
    headers: { "Accept-Encoding": "identity" }
  });

  if (!res.ok) {
    throw new Error(`Could not fetch ferris data: ${res.status}`);
  }

  const referrers = await res.json();
  const feedUrls = new Set();

  for (const referrer of referrers) {
    let raw = referrer.metadata && referrer.metadata.feedUrls;

    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        continue;
      }
    }

    if (Array.isArray(raw)) {
      raw.forEach(url => {
        if (typeof url === "string" && url) feedUrls.add(url);
      });
    }
  }

  return [...feedUrls];
}

async function fetchProductionBundle() {
  const res = await fetch(`${APP_URL}/box-esm.js`, {
    headers: { "Accept-Encoding": "identity" }
  });

  if (!res.ok) {
    throw new Error(`Could not fetch the production bundle: ${res.status}`);
  }

  return res.text();
}

// Builds src/box-esm.js against production’s own URLs (rather than the
// empty local defaults), so both bundles resolve feeds through the same
// live proxy/referrer endpoints and only their own code can differ
function buildLocalBundle() {
  const hadEnvironmentFile = existsSync(ENVIRONMENT_FILE);
  const original = hadEnvironmentFile
    ? readFileSync(ENVIRONMENT_FILE, "utf8")
    : null;

  const environment = [
    "export const urls = {",
    `  app: ${JSON.stringify(APP_URL)},`,
    `  proxy: ${JSON.stringify(PROXY_URL)},`,
    `  referrers: ${JSON.stringify(REFERRERS_URL)}`,
    "};",
    ""
  ].join("\n");

  writeFileSync(ENVIRONMENT_FILE, environment);

  try {
    execFileSync("npm", ["run", "build"], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "ignore", "inherit"]
    });
  } finally {
    writeFileSync(ENVIRONMENT_FILE, original === null ? "" : original);
  }

  return readFileSync(
    fileURLToPath(new URL("../dist/box-esm.js", import.meta.url)),
    "utf8"
  );
}

// Renders one feed through one bundle in an isolated DOM and returns the
// box’s rendered markup, or null if it never settled within the timeout.
// The script tag box.js discovers itself through (matched by src, the same
// way a real embed script is) is kept separate from the one that actually
// executes the bundle, since a real <script src> ignores its own inline
// content – it would just try to fetch that fake main.js URL for real.
async function render(bundleCode, feedUrl) {
  const dom = new JSDOM("", { url: `${APP_URL}/`, runScripts: "dangerously" });
  const { window } = dom;

  // Node’s fetch doesn’t transparently decompress every gzip response the
  // proxy sends, so ask the server not to compress at all rather than
  // second-guess when that happens. init.headers may be a Headers
  // instance, a plain object, or an array of pairs – the Headers
  // constructor normalizes all three.
  window.fetch = (url, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("Accept-Encoding", "identity");
    return fetch(url, { ...init, headers });
  };

  const marker = window.document.createElement("script");
  marker.type = "javascript/blocked";
  marker.src = `${APP_URL}/main.js?url=${encodeURIComponent(feedUrl)}`;
  window.document.head.appendChild(marker);

  const runner = window.document.createElement("script");
  runner.textContent = bundleCode;
  window.document.head.appendChild(runner);

  const deadline = Date.now() + RENDER_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const container = window.document.head.querySelector("div");
    const settled =
      container &&
      container.querySelector(
        '.rssbox-item-title, .rssbox-item-content a, [class*="error"]'
      );

    if (settled) {
      await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
      return container.outerHTML;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  const container = window.document.head.querySelector("div");
  return container ? `${container.outerHTML}\n<!-- timed out -->` : null;
}

async function main() {
  console.log("Fetching feed URLs currently embedded, from ferris…");
  const feedUrls = await extractFeedUrls();
  const targets = Number.isFinite(limit) ? feedUrls.slice(0, limit) : feedUrls;

  console.log(
    `Found ${feedUrls.length} unique feed URL(s)${
      targets.length < feedUrls.length ? `, comparing ${targets.length}` : ""
    }.`
  );

  console.log("Fetching the production bundle…");
  const oldBundle = await fetchProductionBundle();

  console.log("Building a fresh local bundle…");
  const newBundle = buildLocalBundle();

  const differences = [];

  for (const [index, feedUrl] of targets.entries()) {
    console.log(`[${index + 1}/${targets.length}] ${feedUrl}`);

    let oldHtml;
    let newHtml;

    try {
      [oldHtml, newHtml] = await Promise.all([
        render(oldBundle, feedUrl),
        render(newBundle, feedUrl)
      ]);
    } catch (error) {
      console.log(`  failed to render: ${error.message}`);
      continue;
    }

    if (oldHtml !== newHtml) {
      differences.push({ feedUrl, oldHtml, newHtml });
      console.log("  DIFFERS");
    }
  }

  console.log(
    `\n${differences.length} of ${targets.length} feed(s) render differently.\n`
  );

  differences.forEach(({ feedUrl, oldHtml, newHtml }) => {
    console.log(`=== ${feedUrl} ===`);
    console.log("--- production ---");
    console.log(oldHtml);
    console.log("--- local build ---");
    console.log(newHtml);
    console.log("");
  });

  process.exitCode = differences.length > 0 ? 1 : 0;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
