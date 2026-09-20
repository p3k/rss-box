import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

// This has to come first: DOMPurify sets itself up with the window at hand
import "./dom.js";
import DOMPurify from "dompurify";
import {
  createSanitizer,
  cssUrl,
  escapeHtml,
  sanitizeHtml,
  sanitizeUrl
} from "../src/sanitize.js";
import { RssParser } from "../src/rss-parser.js";

const parse = html => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
};

const sanitized = html => parse(sanitizeHtml(html));

const elements = root => [...root.querySelectorAll("*")];

// Whitespace and control characters are ignored within URL schemes
const scheme = value =>
  // eslint-disable-next-line no-control-regex
  value.replace(/[\u0000-\u0020]/g, "").toLowerCase();

// Nothing in here may run code, no matter how the browser reads it
const assertHarmless = (root, description) => {
  for (const element of elements(root)) {
    for (const { name, value } of [...element.attributes]) {
      assert.ok(
        !/^on/i.test(name),
        `${description}: <${element.localName} ${name}>`
      );
      assert.notEqual(name.toLowerCase(), "srcdoc", description);

      if (
        ["href", "src", "data", "action", "formaction", "xlink:href"].includes(
          name
        )
      ) {
        assert.ok(
          !/^(javascript|vbscript|data):/.test(scheme(value)) ||
            (element.localName === "img" &&
              /^data:image\//.test(scheme(value))),
          `${description}: <${element.localName} ${name}="${value}">`
        );
      }
    }
  }

  for (const tag of [
    "script",
    "style",
    "link",
    "base",
    "meta",
    "form",
    "input",
    "button",
    "svg",
    "math"
  ]) {
    assert.equal(
      root.querySelectorAll(tag).length,
      0,
      `${description}: <${tag}> is left`
    );
  }

  for (const frame of root.querySelectorAll("iframe")) {
    assert.ok(
      frame.hasAttribute("sandbox"),
      `${description}: unsandboxed iframe`
    );
  }
};

describe("sanitize", () => {
  it("runs on a browser that supports the sanitizer", () => {
    assert.ok(DOMPurify.isSupported);
  });

  describe("sanitizeHtml", () => {
    // Includes the classic mutation attacks, which depend on the browser\u2019s parser
    const attacks = {
      "script": "<script>alert(1)</script>",
      "event handler": "<img src=x onerror=alert(1)>",
      "javascript URL": '<a href="javascript:alert(1)">x</a>',
      "javascript URL in mixed case": '<a href="  JaVaScRiPt:alert(1)">x</a>',
      "javascript URL with a line break":
        '<a href="java\nscript:alert(1)">x</a>',
      "javascript URL as entity": '<a href="&#106;avascript:alert(1)">x</a>',
      "data URL": '<a href="data:text/html,<script>alert(1)</script>">x</a>',
      "iframe with srcdoc":
        '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      "iframe with javascript URL":
        '<iframe src="javascript:alert(1)"></iframe>',
      "iframe with data URL":
        '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      "object with javascript URL":
        '<object data="javascript:alert(1)"></object>',
      "object with data URL":
        '<object data="data:text/html,<script>alert(1)</script>"></object>',
      "embed with javascript URL": '<embed src="javascript:alert(1)">',
      "svg with handler": "<svg onload=alert(1)>",
      "svg with script": "<svg><script>alert(1)</script></svg>",
      "math with link":
        '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
      "style sheet": "<style>body{display:none}</style>",
      "linked style sheet":
        '<link rel="stylesheet" href="https://evil.example/x.css">',
      "base element": '<base href="https://evil.example/">',
      "meta refresh":
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      "form":
        '<form action="https://evil.example/"><input name=password></form>',
      "button with action":
        '<button formaction="javascript:alert(1)">x</button>',
      "autofocus input": "<input onfocus=alert(1) autofocus>",
      "media source": "<video><source onerror=alert(1)></video>",
      "body handler": "<body onload=alert(1)>",
      "nested links": '<a href="x"><a href="javascript:alert(1)">y</a></a>',
      "mutation with style":
        '<svg></p><style><a id="</style><img src=1 onerror=alert(1)>">',
      "mutation with noscript":
        '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
      "mutation with math":
        '<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;img src=1 onerror=alert(1)&gt;">',
      "mutation with forms":
        "<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>"
    };

    for (const [description, attack] of Object.entries(attacks)) {
      it(`neutralizes ${description}`, () => {
        assertHarmless(sanitized(attack), description);
        // \u2026 also when the markup is nested in some more
        assertHarmless(sanitized(`<div><p>${attack}</p></div>`), description);
      });
    }

    it("leaves ordinary content alone", () => {
      const article = `
        <p>Hello <em>world</em> and <strong>friends</strong>, see
          <a href="https://example.org/a?b=1&amp;c=2" title="Example">this link</a>.</p>
        <h3>Heading</h3>
        <blockquote><p>A quote</p></blockquote>
        <ul><li>One</li><li>Two</li></ul>
        <ol><li>First</li></ol>
        <pre><code>let a = 1 &lt; 2;</code></pre>
        <figure><img src="https://example.org/a.jpg" alt="A" width="100" height="50"><figcaption>Caption</figcaption></figure>
        <table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>
        <p style="color: red; text-align: center">Styled</p>
        <p><font color="red">Old</font> <center>Centered</center> <b>bold</b> <i>italic</i> <u>underlined</u></p>
        <p>Line<br>break, <a href="mailto:me@example.org">mail</a>, <a href="/relative">relative</a>,
          <a href="#anchor">anchor</a> and <a href="tel:+43123456">phone</a></p>
        <video controls poster="https://example.org/p.jpg"><source src="https://example.org/v.mp4" type="video/mp4"></video>
        <audio controls src="https://example.org/a.mp3"></audio>
        <img src="data:image/png;base64,iVBORw0KGgo=" alt="inline">
        <p style="position: relative; float: right">Positioned relatively</p>`;

      const actual = sanitized(article);

      assert.ok(actual.isEqualNode(parse(article)), actual.innerHTML);
    });

    it("keeps `target` but opens no way back to the page", () => {
      const result = sanitized(
        '<a href="https://example.org/" target="_blank" rel="nofollow">x</a><a href="https://example.org/" target="_blank" rel="noopener">y</a>'
      );

      const [first, second] = result.querySelectorAll("a");

      assert.equal(first.getAttribute("target"), "_blank");
      assert.equal(first.getAttribute("rel"), "nofollow noopener");
      assert.equal(second.getAttribute("rel"), "noopener");
    });

    it("removes the parts of a style that cover the page", () => {
      const result = sanitized(
        '<p style="position: fixed; top: 0; color: red">a</p><p style="POSITION:absolute !important">b</p><p style="position: sticky">c</p>'
      );

      const [fixed, absolute, sticky] = result.querySelectorAll("p");

      assert.equal(fixed.style.position, "");
      assert.equal(fixed.style.color, "red");
      assert.equal(absolute.style.position, "");
      assert.equal(sticky.style.position, "");
    });

    describe("with embedded content", () => {
      it("keeps a player and sandboxes it", () => {
        const [frame] = sanitized(
          '<iframe src="https://www.youtube.com/embed/abc" width="560" height="315" frameborder="0" allowfullscreen></iframe>'
        ).querySelectorAll("iframe");

        assert.equal(
          frame.getAttribute("src"),
          "https://www.youtube.com/embed/abc"
        );
        assert.equal(frame.getAttribute("width"), "560");
        assert.equal(frame.getAttribute("height"), "315");
        assert.ok(frame.hasAttribute("allowfullscreen"));
        assert.equal(
          frame.getAttribute("sandbox"),
          "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        );
      });

      it("keeps protocol-relative URLs, which old players use", () => {
        const [frame] = sanitized(
          '<iframe src="//player.vimeo.com/video/1"></iframe>'
        ).querySelectorAll("iframe");

        assert.equal(frame.getAttribute("src"), "//player.vimeo.com/video/1");
      });

      it("replaces a sandbox the feed asks for", () => {
        const [frame] = sanitized(
          '<iframe src="https://example.org/" sandbox="allow-top-navigation allow-forms"></iframe>'
        ).querySelectorAll("iframe");

        assert.ok(
          !frame.getAttribute("sandbox").includes("allow-top-navigation")
        );
        assert.ok(!frame.getAttribute("sandbox").includes("allow-forms"));
      });

      it("only lets frames and plug-ins load from the web", () => {
        const result = sanitized(
          '<iframe src="file:///etc/passwd"></iframe><iframe src="/local"></iframe><object data="ftp://example.org/x.swf"></object><embed src="blob:https://example.org/x">'
        );

        for (const element of elements(result)) {
          assert.ok(
            !element.hasAttribute("src") && !element.hasAttribute("data"),
            element.outerHTML
          );
        }
      });

      it("keeps legacy plug-in content that loads from the web", () => {
        const result = sanitized(
          '<object data="https://example.org/x.swf" width="400"></object><embed src="https://example.org/x.swf" width="400">'
        );

        assert.equal(
          result.querySelector("object").getAttribute("data"),
          "https://example.org/x.swf"
        );
        assert.equal(
          result.querySelector("embed").getAttribute("src"),
          "https://example.org/x.swf"
        );
      });
    });

    it("copes with nothing", () => {
      assert.equal(sanitizeHtml(undefined), "");
      assert.equal(sanitizeHtml(null), "");
      assert.equal(sanitizeHtml(""), "");
    });

    it("shows markup as text if the sanitizer cannot work", () => {
      const unsupported = createSanitizer({ isSupported: false });

      assert.equal(
        unsupported("<img src=x onerror=alert(1)>"),
        "&lt;img src=x onerror=alert(1)&gt;"
      );
      assert.equal(unsupported(null), "");
    });

    // The point of it all: what is broken is not the content of the feeds
    it("leaves the titles and descriptions of the fixture feeds alone", () => {
      const feedsDir = new URL("./fixtures/feeds/", import.meta.url);

      const names = readdirSync(feedsDir).filter(
        name => name.endsWith(".xml") && !name.startsWith("hostile")
      );

      assert.ok(names.length > 5);

      for (const name of names) {
        const feed = RssParser().parse(
          readFileSync(new URL(name, feedsDir), "utf8")
        );

        for (const item of feed.items) {
          for (const html of [item.title, item.description]) {
            const actual = sanitized(html);

            assert.ok(
              actual.isEqualNode(parse(html)),
              `${name}: ${html} became ${actual.innerHTML}`
            );
          }
        }
      }
    });
  });

  describe("sanitizeUrl", () => {
    it("lets safe URLs pass", () => {
      const safe = [
        "https://example.org/a?b=1#c",
        "http://example.org/",
        "mailto:me@example.org",
        "tel:+43123456",
        "ftp://example.org/file",
        "//example.org/protocol-relative",
        "/absolute/path",
        "relative/path",
        "#anchor",
        "?query=1"
      ];

      for (const url of safe) {
        assert.equal(sanitizeUrl(url), url);
      }
    });

    it("leaves out URLs that could run code or read local data", () => {
      const unsafe = [
        "javascript:alert(1)",
        "  JaVaScRiPt:alert(1)",
        "java\tscript:alert(1)",
        "java\nscript:alert(1)",
        "\u0001javascript:alert(1)",
        "\u00A0javascript:alert(1)",
        "vbscript:msgbox(1)",
        "data:text/html,<script>alert(1)</script>",
        "file:///etc/passwd",
        "blob:https://example.org/x",
        "about:blank",
        "tag:blog.example,2024:2",
        ""
      ];

      for (const url of unsafe) {
        assert.equal(sanitizeUrl(url), undefined, JSON.stringify(url));
      }
    });

    it("leaves out anything that is not a string", () => {
      for (const value of [undefined, null, 5, {}, ["https://example.org/"]]) {
        assert.equal(sanitizeUrl(value), undefined);
      }
    });
  });

  describe("cssUrl", () => {
    it("wraps a URL", () => {
      assert.equal(
        cssUrl("https://example.org/a.png"),
        'url("https://example.org/a.png")'
      );
    });

    it("keeps a URL from breaking out of the function", () => {
      const result = cssUrl(
        'https://example.org/a.png"); background: red; x: url("'
      );

      // Quotes, parentheses and spaces are encoded; the rest is harmless within
      // a string
      assert.equal(
        result,
        'url("https://example.org/a.png%22%29;%20background:%20red;%20x:%20url%28%22")'
      );
      assert.ok(!/[()"' ]/.test(result.slice(5, -2)));
    });

    it("has no image for unsafe or missing URLs", () => {
      for (const value of [
        "javascript:alert(1)",
        "data:text/html,x",
        "",
        undefined,
        null
      ]) {
        assert.equal(cssUrl(value), "none");
      }
    });
  });

  describe("escapeHtml", () => {
    it("escapes what could start markup", () => {
      assert.equal(
        escapeHtml(`<a href="x">'&'</a>`),
        "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
      );
      assert.equal(escapeHtml(new Error("<b>")), "Error: &lt;b&gt;");
    });
  });
});
