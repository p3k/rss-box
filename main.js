function debug(str) {
   return document.write('<p><span style="background-color: yellow;">', 
         str, '</span><p>');
}

new function() {
   var baseUri = "http://p3k.org/rss2/";
   var ref;

   var data = org.p3k;
   data.defaults = {
      url: "http://blog.p3k.org/rss",
      maxItems: 7,
      width: 200,
      align: "",
      frameColor: "black",
      titleBarColor: "lightblue",
      titleBarTextColor: "black",
      boxFillColor: "white",
      textColor: "black",
      showXmlButton: "",
      compact: ""
   };
   
   var value;
   for (var i in data.defaults) {
      value = data.param[i];
      if (!value || value.length === 0) {
         data.param[i] = data.defaults[i];
      } 
   }

   // FIXME: Ugly work-around for many boxes using too small width 
   // values because the former version did not show the exact output.
   if (data.param.javascript && data.param.width < 200) {
      data.param.width = 200;
   }
   
   var NAMESPACES = {
      dc: "http://purl.org/dc/elements/1.1/",
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   };

   var getUrl = function(url) {
      url = baseUri + "proxy.r?" + encodeURIComponent(url);
   
      var HttpRequest = function() {
         return (typeof XMLHttpRequest !== "undefined") ?
            new XMLHttpRequest() : new ActiveXObject("Msxml2.XMLHTTP");
      }
   
      var request = new HttpRequest();
      request.open("GET", url, false);
      request.send(null);   
      if (!request.getResponseHeader("Date")) {
         var cached = request;
         var ifModifiedSince = cached.getResponseHeader("Last-Modified") || 
               new Date(0); // January 1, 1970
         request = new HttpRequest();
         request.open("GET", url, false);
         request.setRequestHeader("If-Modified-Since", ifModifiedSince);
         request.send("");
         if (request.status === 304) {
            request = cached; 
         }
      }
      return request;
   }
   
   var getDocument = function(source) {
      if (document.implementation.createDocument) {
         var parser = new DOMParser();
         var doc = parser.parseFromString(source, "text/xml");
         return doc;
      } else if (window.ActiveXObject) {
         var doc = new ActiveXObject("Microsoft.XMLDOM");
         doc.async = "false";
         doc.loadXML(source);
         return doc;
      }
   }
   
   var getError = function() {
      var msg;
      if (!xml || data.message.length > 0) {
         msg = data.message || "Unknown error.";
      } else if (xml.parseError && xml.parseError.errorCode) {
         msg = xml.parseError.reason;
      } else if (xml.documentElement.nodeName === "parsererror") {
         msg = xml.documentElement.textContent;
      } else if (!/rss|rdf|scriptingNews/i.test(xml.documentElement.nodeName)) {
         msg = "Incompatible data format. Are you sure this is an RSS feed?";
      } else {
         return null;
      }
      return encodeXml(msg);
   }
   
   var getNode = function(parent, name, namespace) {
      if (namespace) {
         var elements = parent.getElementsByTagNameNS(NAMESPACES[namespace], name);
      } else {
         var elements = parent.getElementsByTagName(name);
      }
      if (elements && elements[0]) {
         return elements[0];
      }
      return null;
   }
   
   var getText = function(node) {
      if (node && node.childNodes && node.childNodes.length > 0) {
         return node.childNodes[0].nodeValue;
      }
      return "";
   }
   
   var trim = function(str) {
      return str.replace(/^\s*(\S*)\s*$/, "$1");
   }
   
   var encodeXml = function(str) {
      return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
   }
      
   var render = function(template, param) {
      if (!template || !param) {
         return template;
      }
      template = template.replace(/\$\{([^}]+)\}/g, function() {
         var key = arguments[1];
         return param[key] || "";
      });
      return template;
   }
   
   var renderDate = function(str) {
      var ISOPATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

      var padZero = function(n) {
         if (n < 10) {
            return "0" + n
         }
         return n;
      }
   
      var date;
      var millis = Date.parse(str.replace(ISOPATTERN, "$1/$2/$3 $4"));
      if (millis) {
         date = new Date(millis);
      } else {
         date = new Date;
      }

      return render(data.date, {
         year: date.getFullYear(),
         month: padZero(date.getMonth() + 1),
         day: padZero(date.getDate()),
         hours: padZero(date.getHours()),
         minutes: padZero(date.getMinutes()),
         seconds: padZero(date.getSeconds()),
         timeZone: "" // date.getTimezoneOffset()
      });
   }
   
   var renderButtons = function(enclosure, source) {
      var result = "";
      if (enclosure && enclosure.link) {
         result += render(data.image, {
            source: baseUri + "enclosure.gif",
            title: enclosure.type,
            link: enclosure.link,
            width: 16,
            height: 16
         });
      }
      if (source && source.link) {
         result += render(data.image, {
            source: baseUri + "source.gif",
            title: source.title,
            link: source.link,
            width: 15,
            height: 15
         });
      }
      return result;         
   }
   
   var param = data.param;
   var rss = data.rss = {items: []};
   var xml = getDocument(data.xml);
   
   var error = getError();
   if (error !== null) {
      xml = getDocument(render(data.error, {
         link: baseUri + "?" + encodeXml(data.query),
         message: error
      }));
   }

   var root = xml.documentElement;
   var type = root.nodeName;

   if (type === "scriptingNews") {
      var channel = getNode(xml, "header");
      rss.format = "Scripting News";
      rss.version = getText(getNode(channel, "scriptingNewsVersion"));
      rss.title = getText(getNode(channel, "channelTitle"));
      rss.description = getText(getNode(channel, "channelDescription"));
      rss.link = getText(getNode(channel, "channelLink"));
      if (ref = getText(getNode(channel, "imageUrl"))) {
         ref = rss.image = {source: ref};
         ref.title = getText(getNode(channel, "imageTitle"));
         ref.link = getText(getNode(channel, "imageLink"));
         ref.width = getText(getNode(channel, "imageWidth"));
         ref.height = getText(getNode(channel, "imageHeight"));
         ref.description = getText(getNode(channel, "imageCaption"));
      }
   } else {
      var channel = getNode(xml, "channel");
      rss.format = "RSS";
      rss.version = (type === "rdf:RDF") ? "1.0" : 
            root.getAttribute("version");
      rss.title = getText(getNode(channel, "title"));
      rss.description = getText(getNode(channel, "description"));
      rss.link = getText(getNode(channel, "link"));
      var image = getNode(xml, "image");
      if (image) {
         ref = rss.image = {};
         ref.source = getText(getNode(image, "url"));
         ref.title = getText(getNode(image, "title"));
         ref.link = getText(getNode(image, "link"));
         ref.width = getText(getNode(image, "width"));
         ref.height = getText(getNode(image, "height"));
         ref.description = getText(getNode(image, "description"));
      }
   }
   
   if (type === "RDF") {
      rss.date = renderDate(getText(getNode(channel, "date", "dc")));
      rss.rights = getText(getNode(channel, "creator", "dc"));
      var input = getNode(root, "textinput");
      if (input && !getNode(input, "link")) {
         input = root.getElementsByTagName("textinput")[1];
      }
      if (input) {
         ref = rss.input = {};
         ref.link = getText(getNode(input, "link"));
         ref.description = getText(getNode(input, "description"));
         ref.name = getText(getNode(input, "name"));
         ref.title = getText(getNode(input, "title"));
      }
   } else {
      rss.date = renderDate(getText(getNode(channel, "pubDate")) || data.modified);
      rss.rights = getText(getNode(channel, "copyright"));
   }
   
   var item, text, node;
   var items = xml.getElementsByTagName("item");

   for (var i=0; i<Math.min(items.length, param.maxItems); i+=1) {
      item = items[i];

      if (type === "scriptingNews") {
         ref = {title: ""};
         ref.description = getText(getNode(item, "text")).replace(/\n/g, " ");
         ref.link = getText(getNode(item, "link"));
         if (text = trim(getText(getNode(item, "linetext")).replace(/\n/g, " "))) {
            ref.description = ref.description.replace(new RegExp(text), 
                  '<a href="' + getText(getNode(item, "url")) + '">' + text + '</a>');
         }
      } else {
         ref = {
            title: getText(getNode(item, "title")),
            description: getText(getNode(item, "description")),
            link: getText(getNode(item, "link") || getNode(item, "guid"))
         };
     }

     if (node = getNode(item, "source")) {
        ref.source = {
           link: node.getAttribute("url"),
           title: getText(node)
        }
     }
     
     if (node = getNode(item, "enclosure")) {
        ref.enclosure = {
           link: node.getAttribute("url"),
           length: node.getAttribute("length"),
           type: node.getAttribute("type")
        }
     }
     
     if (node = getNode(item, "category")) {
        ref.category = {
           domain: node.getAttribute("domain") || "",
           content: getText(node)
        }
     }
     
     rss.items.push(ref);
   }
   
   var item, items = "";
   for (var i in rss.items) {
      item = rss.items[i];
      items += render(data.item, {
         title: new function() {
            var title = (!param.compact ? "<strong>" : "");
            if (item.link) {
               title += render(data.link, {
                  link: item.link,
                  text: item.title,
                  'class': "rssBoxItemTitle"
               });
            } else {
               title += item.title;
            }
            !param.contact && (title += "</strong>");
            return new String(title); // FIXME: Funny, title alone will be rendered as [object]
         }(),
         'break': item.title && item.description ? "<br />" : "",
         description: (!param.compact || !item.title) && item.description,
         buttons: renderButtons(item.enclosure, item.source)
      });
   }
   
   var box = render(data.box, {
      title: rss.link ? render(data.link, {
         link: rss.link,
         text: rss.title,
         'class': "rssBoxTitle",
         style: "color: " + param.titleBarTextColor
      }) : rss.title,
      description: rss.description,
      items: items,

      xmlButton: param.showXmlButton && render(data.image, {
         link: param.url,
         source: baseUri + "rss.png",
         title: rss.format + " " + rss.version,
         align: "right"
      }),
      
      image: !param.compact && rss.image && render(data.image, {
         link: rss.image.link,
         source: rss.image.source,
         width: rss.image.width,
         height: rss.image.height,
         title: rss.image.title,
         align: "right",
         valign: "baseline",
         hspace: 5,
         vspace: 5
      }),
      
      input: !param.compact && rss.input && render(data.input, {
         link: rss.input.link,
         description: rss.input.description,
         name: rss.input.name,
         title: rss.input.title
      }),
      
      date: rss.date,
      width: param.width,
      frameColor: param.frameColor,
      fontFace: param.fontFace,
      align: param.align,
      titleBarColor: param.titleBarColor,
      titleBarTextColor: param.titleBarTextColor,
      boxFillColor: param.boxFillColor,
      textColor: param.textColor
   });

   document.write(box);

}();
