function RssParser() {
  const DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/';
  const RDF_NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  const ISO_DATE_PATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

  // IE does not know forEach on node lists
  const forEach = Array.prototype.forEach;

  const getDocument = function(xml) {
    if (!xml) return;

    let doc;

    if (document.implementation.createDocument) {
      const parser = new DOMParser();
      doc = parser.parseFromString(xml, 'application/xml');
    } else if (window.ActiveXObject) {
      doc = new window.ActiveXObject('Microsoft.XMLDOM');
      doc.async = 'false';
      doc.loadXML(xml);
    }

    return doc;
  };

  const getText = function(node) {
    if (!node) return '';
    if (node.length) node = node[0];
    return node.textContent;
  };

  const error = Error('Malformed RSS syntax');

  const parseRss = function(root, type) {
    const rss = { items: [] };
    const channel = root.querySelector('channel');

    if (!channel) throw error;

    rss.format = 'RSS';
    rss.version = type === 'rdf:RDF' ? '1.0' : root.getAttribute('version');
    rss.title = getText(root.querySelector('channel > title'));
    rss.description = getText(root.querySelector('channel > description'));
    rss.link = getText(root.querySelector('channel > link'));

    const image = root.querySelector('image');

    rss.image = image
      ? {
          source: getText(image.querySelector('url')) || image.getAttributeNS(RDF_NAMESPACE, 'resource'),
          title: getText(image.querySelector('title')),
          link: getText(image.querySelector('link')),
          width: getText(image.querySelector('width')),
          height: getText(image.querySelector('height')),
          description: getText(image.querySelector('description'))
        }
      : '';

    if (type === 'rdf:RDF') {
      const date = channel.getElementsByTagNameNS(DC_NAMESPACE, 'date');
      rss.date = getDate(getText(date) /* || data.headers.date*/); // TODO
      rss.rights = getText(channel.getElementsByTagNameNS(DC_NAMESPACE, 'creator'));

      const textInput = root.querySelector('textinput');

      rss.input = textInput
        ? {
            link: getText(textInput.querySelector('link')),
            description: getText(textInput.querySelector('description')),
            name: getText(textInput.querySelector('name')),
            title: getText(textInput.querySelector('title'))
          }
        : '';
    } else {
      rss.date = getDate(
        getText(channel.querySelector('lastBuildDate')) ||
          getText(channel.querySelector('pubDate')) /*||
        data.headers.date*/ // TODO
      );
      rss.rights = getText(channel.querySelector('copyright'));
    }

    // IE does not know forEach on node lists
    forEach.call(root.querySelectorAll('item'), function(node) {
      const item = {
        title: getText(node.querySelector('title')),
        description: getText(node.querySelector('description')),
        link: getText(node.querySelector('link')) || getText(node.querySelector('guid'))
      };

      if (!item.description) {
        let content = getText(node.querySelector('content\\:encoded'));
        if (content) {
          item.description = content;
        } else {
          content = getText(node.querySelector('encoded'));
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

  const parseScriptingNews = function(root) {
    const rss = { items: [] };
    const channel = root.querySelector('header');

    if (!channel) throw error;

    rss.format = 'Scripting News';
    rss.version = getText(channel.querySelector('scriptingNewsVersion'));
    rss.title = getText(channel.querySelector('channelTitle'));
    rss.description = getText(channel.querySelector('channelDescription'));
    rss.link = getText(channel.querySelector('channelLink'));

    rss.date = getDate(getText(channel.querySelector('lastBuildDate')) || getText(channel.querySelector('pubDate')));

    const imageUrl = channel.querySelector('imageUrl');

    if (imageUrl) {
      rss.image = {
        source: getText(imageUrl),
        title: getText(channel.querySelector('imageTitle')),
        link: getText(channel.querySelector('imageLink')),
        width: getText(channel.querySelector('imageWidth')),
        height: getText(channel.querySelector('imageHeight')),
        description: getText(channel.querySelector('imageCaption'))
      };
    }

    // IE does not know forEach on node lists
    forEach.call(root.querySelectorAll('item'), function(node) {
      const item = { title: '' };

      item.description = getText(node.querySelector('text')).replace(/\n/g, ' ');

      const link = node.querySelector('link');

      if (link) {
        const text = getText(link.querySelector('linetext'))
          .replace(/\n/g, ' ')
          .trim();
        if (text) {
          item.description = item.description.replace(
            new RegExp(text),
            '<a href="' + getText(node.querySelector('url')) + '">' + text + '</a>'
          );
        }
        item.link = getText(link.querySelector('url'));
      }

      addItemExtensions(node, item);
      rss.items.push(item);
    });

    return rss;
  };

  const addItemExtensions = function(node, item) {
    const source = node.querySelector('source');
    const enclosures = node.querySelectorAll('enclosure');
    const category = node.querySelector('category');

    if (source) {
      item.source = {
        url: source.getAttribute('url'),
        title: source.textContent
      };
    }

    let map = Array.prototype.map;

    item.enclosures = map.call(enclosures, enclosure => {
      return {
        url: enclosure.getAttribute('url'),
        length: enclosure.getAttribute('length'),
        type: enclosure.getAttribute('type')
      };
    });

    if (category) {
      item.category = {
        domain: category.getAttribute('domain') || '',
        content: category.textContent
      };
    }

    return item;
  };

  const getDate = function(str) {
    let millis = Date.parse(str);

    if (isNaN(millis)) {
      millis = Date.parse(String(str).replace(ISO_DATE_PATTERN, '$1/$2/$3 $4'));
      if (isNaN(millis)) millis = Date.now();
    }

    return new Date(millis);
  };

  return {
    parse: function(xml) {
      const doc = getDocument(xml);
      console.log(doc);
      const root = doc.documentElement;
      const type = root.nodeName;

      return type === 'scriptingNews' ? parseScriptingNews(root) : parseRss(root, type);
    }
  };
}

export { RssParser };
