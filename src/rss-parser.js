import { escapeHtml } from "./sanitize";

function RssParser() {
  const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/";
  const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  const CONTENT_NAMESPACE = "http://purl.org/rss/1.0/modules/content/";
  const ISO_DATE_PATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

  const getDocument = function (xml) {
    if (!xml) return;

    let doc;

    if (document.implementation.createDocument) {
      const parser = new DOMParser();
      doc = parser.parseFromString(xml, "application/xml");
    } else if (window.ActiveXObject) {
      doc = new window.ActiveXObject("Microsoft.XMLDOM");
      doc.async = "false";
      doc.loadXML(xml);
    }

    return doc;
  };

  const getChildElement = function (name, parent, namespace) {
    if (!name || !parent) return null;

    // The namespace variant takes the namespace URI first, then the local name
    const elements = namespace
      ? parent.getElementsByTagNameNS(namespace, name)
      : parent.getElementsByTagName(name);

    return elements[0];
  };

  // Unlike `getChildElement` this ignores all nested elements
  const getChildElements = function (name, parent) {
    const elements = [];

    for (let node = parent.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 1 && node.nodeName === name) {
        elements.push(node);
      }
    }

    return elements;
  };

  // Prefers the alternate link (which is the default relation) over links like
  // `self` or `replies`; with `fallback` any link is better than none
  const getAtomLink = function (parent, fallback) {
    const links = getChildElements("link", parent);

    for (let index = 0; index < links.length; index++) {
      const rel = links[index].getAttribute("rel");

      if (!rel || rel === "alternate") {
        return links[index].getAttribute("href");
      }
    }

    if (fallback && links.length) {
      return links[0].getAttribute("href");
    }
  };

  const getText = function (node) {
    if (!node) return "";
    if (node.length) node = node[0];
    return node.textContent;
  };

  // The text of a direct child, so a missing element is not confused with a
  // like-named one of an item or entry
  const getOwnText = function (name, parent) {
    return getText(getChildElements(name, parent)[0]);
  };

  const error = Error("Malformed RSS syntax");

  // Deliberately not limited to the channel’s own elements (getChildElement
  // searches all descendants): a feed without a date of its own ends up
  // showing the date of its first item instead, as a side effect of that
  // broader search rather than a separate fallback of its own
  const getChannelDate = function (channel) {
    return getDate(
      getText(getChildElement("lastBuildDate", channel)) ||
        getText(getChildElement("pubDate", channel))
    );
  };

  const parseRss = function (root, type) {
    const rss = { items: [] };
    const channel = getChildElement("channel", root);

    if (!channel) throw error;

    rss.format = "RSS";
    rss.version = type === "rdf:RDF" ? "1.0" : root.getAttribute("version");
    rss.title = getOwnText("title", channel);
    rss.description = getOwnText("description", channel);
    rss.link = getOwnText("link", channel);

    const image = getChildElement("image", channel);

    rss.image = image
      ? {
          source:
            getText(getChildElement("url", image)) ||
            image.getAttributeNS(RDF_NAMESPACE, "resource"),
          title: getText(getChildElement("title", image)),
          link: getText(getChildElement("link", image)),
          width: getText(getChildElement("width", image)),
          height: getText(getChildElement("height", image)),
          description: getText(getChildElement("description", image))
        }
      : "";

    if (type === "rdf:RDF") {
      const date = channel.getElementsByTagNameNS(DC_NAMESPACE, "date");
      rss.date = getDate(getText(date));
      rss.rights = getText(
        channel.getElementsByTagNameNS(DC_NAMESPACE, "creator")
      );

      // The channel only references the text input, its data is a sibling of
      // the channel; some feeds (wrongly) put it into the channel, though
      const textInput =
        getChildElements("textinput", root)[0] ||
        getChildElement("textinput", root);

      rss.input = "";

      if (textInput) {
        const input = {
          link: getText(getChildElement("link", textInput)),
          description: getText(getChildElement("description", textInput)),
          name: getText(getChildElement("name", textInput)),
          title: getText(getChildElement("title", textInput))
        };

        // Without a target and a field name the form could not be submitted
        if (input.link && input.name) {
          rss.input = input;
        }
      }
    } else {
      rss.date = getChannelDate(channel);
      rss.rights = getText(getChildElement("copyright", channel));
    }

    // Create a native Array from HTMLCollection
    const items = Array.apply(null, root.getElementsByTagName("item"));

    items.forEach(node => {
      const item = {
        title: getText(getChildElement("title", node)),
        description: getText(getChildElement("description", node)),
        link:
          getText(getChildElement("link", node)) ||
          getText(getChildElement("guid", node))
      };

      if (!item.description) {
        let content = getText(
          getChildElement("encoded", node, CONTENT_NAMESPACE)
        );
        if (content) {
          item.description = content;
        } else {
          content = getText(getChildElement("encoded", node));
          if (content) {
            item.description = content;
          }
        }
      }

      addItemExtensions(node, item);
      rss.items.push(item);
    });

    return rss;
  };

  const parseAtom = function (root) {
    const rss = { items: [] };

    rss.format = "Atom";
    rss.version = "1.0";
    rss.title = getOwnText("title", root);
    rss.description = getOwnText("subtitle", root);
    rss.image = "";

    const link = getAtomLink(root);

    if (link) {
      rss.link = link;
    }

    rss.date = getDate(getText(getChildElements("updated", root)[0]));

    const entries = Array.apply(null, root.getElementsByTagName("entry"));

    entries.forEach(node => {
      const item = {
        title: getText(getChildElement("title", node)),
        description: getText(getChildElement("summary", node))
      };

      const link = getAtomLink(node, true);

      if (link) {
        item.link = link;
      }

      rss.items.push(item);
    });

    return rss;
  };

  const parseScriptingNews = function (root) {
    const rss = { items: [] };
    const channel = getChildElement("header", root);

    if (!channel) throw error;

    rss.format = "Scripting News";
    rss.version = getText(getChildElement("scriptingNewsVersion", channel));
    rss.title = getText(getChildElement("channelTitle", channel));
    rss.description = getText(getChildElement("channelDescription", channel));
    rss.link = getText(getChildElement("channelLink", channel));

    rss.date = getChannelDate(channel);

    const imageUrl = getChildElement("imageUrl", channel);

    if (imageUrl) {
      rss.image = {
        source: getText(imageUrl),
        title: getText(getChildElement("imageTitle", channel)),
        link: getText(getChildElement("imageLink", channel)),
        width: getText(getChildElement("imageWidth", channel)),
        height: getText(getChildElement("imageHeight", channel)),
        description: getText(getChildElement("imageCaption", channel))
      };
    }

    const items = Array.apply(null, root.getElementsByTagName("item"));

    items.forEach(node => {
      const item = { title: "" };

      item.description = getText(getChildElement("text", node)).replace(
        /\n/g,
        " "
      );

      const link = getChildElement("link", node);

      if (link) {
        const text = getText(getChildElement("linetext", link))
          .replace(/\n/g, " ")
          .trim();
        if (text) {
          const anchor =
            '<a href="' +
            escapeHtml(getText(getChildElement("url", node))) +
            '">' +
            text +
            "</a>";

          // The text is looked for as it is – not as a regular expression –
          // and the anchor is used as it is, `$&` and the like included
          item.description = item.description.replace(text, () => anchor);
        }
        item.link = getText(getChildElement("url", link));
      }

      addItemExtensions(node, item);
      rss.items.push(item);
    });

    return rss;
  };

  const addItemExtensions = function (node, item) {
    const source = getChildElement("source", node);
    // Create a native Array from HTMLCollection
    const enclosures = Array.apply(
      null,
      node.getElementsByTagName("enclosure")
    );
    const category = getChildElement("category", node);

    if (source) {
      item.source = {
        url: source.getAttribute("url"),
        title: source.textContent
      };
    }

    item.enclosures = enclosures.map(enclosure => {
      return {
        url: enclosure.getAttribute("url"),
        length: enclosure.getAttribute("length"),
        type: enclosure.getAttribute("type")
      };
    });

    if (category) {
      item.category = {
        domain: category.getAttribute("domain") || "",
        content: category.textContent
      };
    }

    return item;
  };

  // A substring check on an attacker-controlled, URL-shaped value is easy to
  // fool (e.g. "https://evil.example/jsonfeed.org/x") – parsing it and
  // comparing the actual host avoids that
  const isJsonFeedVersion = function (value) {
    try {
      return new URL(value).hostname === "jsonfeed.org";
    } catch {
      return false;
    }
  };

  const parseJsonFeed = function (data) {
    const rss = { items: [] };

    rss.format = "JSON Feed";
    rss.version = String(data.version).split("/").pop() || "";
    // Plain text per spec, but rendered as HTML downstream like every other format
    rss.title = escapeHtml(data.title || "");
    rss.description = data.description || "";
    rss.link = data.home_page_url || data.feed_url || "";

    // Unlike RSS/Scripting News, icon/favicon are bare URLs with none of the
    // other image metadata – Box.svelte only ever reads the actual loaded
    // image’s own dimensions anyway, never these fields, so leaving them
    // empty renders exactly like a sparse RSS image already does
    const icon = data.icon || data.favicon;

    rss.image = icon
      ? {
          source: icon,
          title: "",
          link: "",
          width: "",
          height: "",
          description: ""
        }
      : "";

    data.items.forEach(node => {
      if (!node || typeof node !== "object") return;

      const item = {
        title: escapeHtml(node.title || ""),
        link: node.url || node.external_url || "",
        enclosures: []
      };

      if (node.content_html) {
        item.description = node.content_html;
      } else {
        item.description = escapeHtml(node.content_text || node.summary || "");
      }

      if (Array.isArray(node.attachments)) {
        item.enclosures = node.attachments.map(attachment => ({
          url: attachment.url,
          length: attachment.size_in_bytes,
          type: attachment.mime_type
        }));
      }

      rss.items.push(item);
    });

    // No date of its own, same as RSS falling back to its first item’s date
    const first = data.items[0] || {};
    rss.date = getDate(first.date_published || first.date_modified);

    return rss;
  };

  const getDate = function (str) {
    let millis = Date.parse(str);

    if (isNaN(millis)) {
      millis = Date.parse(String(str).replace(ISO_DATE_PATTERN, "$1/$2/$3 $4"));
      if (isNaN(millis)) millis = Date.now();
    }

    return new Date(millis);
  };

  return {
    parse: function (xml) {
      // Valid XML never parses as JSON – `<` alone already rules it out – so
      // trying this first is safe for every other format and costs nothing
      // when it isn’t JSON at all
      let data;
      let isJson = true;

      try {
        data = JSON.parse(xml);
      } catch {
        isJson = false;
      }

      if (isJson) {
        if (
          !data ||
          typeof data !== "object" ||
          !Array.isArray(data.items) ||
          typeof data.version !== "string" ||
          !isJsonFeedVersion(data.version)
        ) {
          throw error;
        }

        return parseJsonFeed(data);
      }

      const doc = getDocument(xml);

      if (!doc || getChildElement("parsererror", doc.documentElement))
        throw error;

      const root = doc.documentElement;
      const type = root.nodeName;

      switch (type) {
        case "feed":
          return parseAtom(root);

        case "scriptingNews":
          return parseScriptingNews(root);

        default:
          return parseRss(root, type);
      }
    }
  };
}

export { RssParser };
