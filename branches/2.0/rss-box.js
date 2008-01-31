function debug(str) {
   return document.write('<p><span style="background-color: yellow;">', str, '</span><p>');
}

NAMESPACES = {
   dc: "http://purl.org/dc/elements/1.1/",
   rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
};

getUrl = function(url) {
   url = "proxy.r?" + encodeURIComponent(url);

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
   if (node) {
      return node.textContent;
   }
   return "";
}

var trim = function(str) {
   return str.replace(/^\s*(\S*)\s*$/, "$1");
}

var ref;
var rss = {items: []};

var param = {};
var pairs = location.search.substring(1).split("&");

var parts;
for (var i in pairs) {
   parts = pairs[i].split("=");
   param[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
}

var xml = getUrl(param.url).responseXML;
if (xml) {
   xml.normalizeDocument();

   var root = xml.documentElement;
   rss.format = root.localName;

   if (rss.format === "scriptingNews") {
      var channel = getNode(xml, "header");
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
      rss.title = getText(getNode(channel, "title"));
      rss.description = getText(getNode(channel, "description"));
      rss.link = getText(getNode(channel, "link"));
      if (ref = getNode(xml, "image")) {
         ref = rss.image = {source: ref};
         ref.source = getText(getContent(image, "url"));
         ref.title = getText(getContent(image, "title"));
         ref.link = getText(getContent(image, "link"));
         ref.width = getText(getContent(image, "width"));
         ref.height = getText(getContent(image, "height"));
         ref.description = getText(getContent(image, "description"));
      }
   }
   
   if (rss.format === "RDF") {
      rss.date = getText(getNode(channel, "date", "dc"));
      rss.rights = getText(getNode(channel, "rights", "dc"));
      var input = getNode(xml, "textinput");
      if (input) {
         ref = rss.input = {};
         ref.link = getText(getNode(input, "link"));
         ref.description = getText(getNode(input, "description"));
         ref.name = getText(getNode(input, "name"));
         ref.title = getText(getNode(input, "title"));
      }
   } else {
      rss.date = getText(getNode(channel, "pubDate"));
      rss.rights = getText(getNode(channel, "copyright"));
   }
   
   var item, text, node;
   var items = xml.getElementsByTagName("item");

   for (var i=0; i<items.length; i+=1) {
      item = items[i];

      if (rss.format === "scriptingNews") {
         ref = {};
         ref.description = getText(getNode(item, "text")).replace(/\n/g, " ");
         ref.link = getText(getNode(item, "link"));
         text = trim(getText(getNode(item, "linetext")).replace(/\n/g, " "));
         ref.description = ref.description.replace(new RegExp(text, "g"), 
               '<a href="' + getText(getNode(item, "url")) + '>' + text + '</a>');
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
   
   var render = function(template, param) {
      for (var i in param) {
         template = template.replace(new RegExp("\\$" + i, "g"), param[i]);
      }
      document.write(template);
      return;
   }
   
   var box = getUrl("http://macke.local/~tobi/rss-box/box.html").responseText;
   render(box, {
      boxTitle: rss.title,
      link: rss.link,
      description: rss.description,
      xmlButton: "",
      image: "",
      content: "",
      textInput: "",
      lastBuildDate: rss.date,
      
      width: 200,
      frameColor: "black",
      fontFace: "sans-serif",
      align: "",
      titleBarColor: "lightblue",
      titleBarTextColor: "black",
      boxFillColor: "white",
      textColor: "black",
   });
}
