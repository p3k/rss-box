import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { after, before, describe, it, mock } from "node:test";

import "./dom.js";
import { expectGolden } from "./golden.js";
import { RssParser } from "../src/rss-parser.js";

// The parser falls back to the current time for missing or unparsable dates
const NOW = Date.UTC(2024, 8, 19, 12, 0, 0);

const feedsDir = new URL("./fixtures/feeds/", import.meta.url);
const goldenDir = new URL("./fixtures/golden/", import.meta.url);

describe("RssParser", () => {
  before(() => {
    mock.method(Date, "now", () => NOW);
  });

  after(() => {
    mock.restoreAll();
  });

  // The golden files record what the parser produces, including behavior that
  // is questionable (e.g. missing `content:encoded` texts, Atom dates and links)
  // and unsanitized markup. Changes to them are meant to show up in the pull
  // requests that fix these things – and nowhere else.
  describe("parses the fixture feeds", () => {
    const names = readdirSync(feedsDir)
      .filter(name => name.endsWith(".xml"))
      .sort();

    for (const name of names) {
      it(name, () => {
        const xml = readFileSync(new URL(name, feedsDir), "utf8");
        const feed = RssParser().parse(xml);
        expectGolden(new URL(name.replace(/\.xml$/, ".json"), goldenDir), feed);
      });
    }
  });

  describe("rejects malformed input", () => {
    const cases = {
      "an empty string": "",
      "plain text": "just some text",
      "truncated XML": "<rss><channel></rss>",
      "an unrelated document": "<html/>",
      "a Scripting News document without header": "<scriptingNews/>"
    };

    for (const [description, xml] of Object.entries(cases)) {
      it(description, () => {
        assert.throws(() => RssParser().parse(xml), {
          message: "Malformed RSS syntax"
        });
      });
    }
  });
});
