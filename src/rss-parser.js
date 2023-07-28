function RssParser() {
  const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/";
  const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
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
    let method = "getElementsByTagName";
    if (namespace) method += "NS";
    return parent[method](name, namespace)[0];
  };

  const getText = function (node) {
    if (!node) return "";
    if (node.length) node = node[0];
    return node.textContent;
  };

  const error = Error("Malformed RSS syntax");

  const parseRss = function (root, type) {
    const rss = { items: [] };
    const channel = getChildElement("channel", root);

    if (!channel) throw error;

    rss.format = "RSS";
    rss.version = type === "rdf:RDF" ? "1.0" : root.getAttribute("version");
    rss.title = getText(getChildElement("title", channel));
    rss.description = getText(getChildElement("description", channel));
    rss.link = getText(getChildElement("link", channel));

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

      const textInput = getChildElement("textinput", root);

      rss.input = textInput
        ? {
            link: getText(getChildElement("link", textInput)),
            description: getText(getChildElement("description", textInput)),
            name: getText(getChildElement("name", textInput)),
            title: getText(getChildElement("title", textInput))
          }
        : "";
    } else {
      rss.date = getDate(
        getText(getChildElement("lastBuildDate", channel)) ||
          getText(getChildElement("pubDate", channel))
      );
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
        let content = getText(getChildElement("encoded", node, "content"));
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
    rss.title = getText(getChildElement("title", root));
    rss.description = getText(getChildElement("subtitle", root));
    rss.image = "";

    const link = getChildElement("link:not([self])", root);
    if (link) rss.link = link.getAttribute("href");

    rss.date = getDate(getChildElement("updated", root));

    const entries = Array.apply(null, root.getElementsByTagName("entry"));

    entries.forEach(node => {
      const item = {
        title: getText(getChildElement("title", node)),
        description: getText(getChildElement("summary", node))
      };

      const link = getChildElement("link", node);
      if (link) item.link = link.getAttribute("href");

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

    rss.date = getDate(
      getText(getChildElement("lastBuildDate", channel)) ||
        getText(getChildElement("pubDate", channel))
    );

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
          item.description = item.description.replace(
            new RegExp(text),
            '<a href="' +
              getText(getChildElement("url", node)) +
              '">' +
              text +
              "</a>"
          );
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
