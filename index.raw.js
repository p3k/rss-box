(function() {

   var BASE_URI = location.protocol + '//p3k.org/rss/';
   var ROXY_URI = location.protocol + '//p3k-services.appspot.com/roxy';
   var FERRIS_URI = location.protocol + '//p3k-services.appspot.com/ferris?callback=?&group=rssbox';
   
   if (typeof DEBUG !== 'undefined' && DEBUG === true) {
      BASE_URI = 'http://macke.local/~tobi/rss-box/';
      ROXY_URI = 'http://macke.local:8081/roxy';
      FERRIS_URI = 'http://macke.local:8081/ferris?callback=?&group=rssbox';
   }

   // Check if a RSS Box script was already loaded to prevent redundant loading of libraries.
   if (window._rss_box_framework_has_loaded) {
      return;
   } else {
      window._rss_box_framework_has_loaded = true;
   }
   
   // IE, what else…
   if (!Date.now) {
      Date.now = function() {
         return (new Date).valueOf();
      }
   }
   
   jQuery.noConflict();

   var $ = jQuery; // This $ is a local variable!
   var templates;

   load(BASE_URI + 'templates.html', function(data) {
      templates = $(data.content).filter('script');
      main();
      if (location.href.indexOf(BASE_URI) < 0) {
         $.getJSON(FERRIS_URI + '&url=' + encodeURIComponent(location.href));
      }
   });
   
   function main() {
      // main() is called recursively, removing one script element at a time
      // until no matching script element is available, anymore.
      var script = $('script').filter(function() {
         return this.src.indexOf(BASE_URI + 'index.js') === 0;
      }).get(0);
      
      if (!script) {
         return;
      }

      script = $(script);
      
      // Define default settings (different from main.js for b/w compatibility reasons.)
      var config = {
         url: 'http://blog.p3k.org/stories.xml',
         maxItems: 7,
         width: 200,
         height: -1,
         radius: 0,
         align: 'none',
         frameColor: '#000',
         titleBarColor: '#add8e6',
         titleBarTextColor: '#000',
         boxFillColor: '#fff',
         textColor: '#000',
         linkColor: '',
         showXmlButton: false,
         compact: false,
         headless: false,
         fontFace: 'auto sans-serif'
      }
      
      var url = script.attr('src');
      // Remove src attribute to prevent multiple scripts from redundantly 
      // processing the same script element.
      script.attr('src', null);
      var index = url.indexOf('?');
      var query = index > -1 ? url.substr(index) : '';
      var param = $.deparam.querystring(query);

      var value;
      for (var i in param) {
         value = param[i];
         if (value && value.length > 0) {
            if (i.toLowerCase().indexOf('color') > -1) {
               config[i] = getHtmlColor(value);
            } else {
               config[i] = value;
            }
         } 
      }
      
      // Fix boolean settings.
      config.compact === 'false' && (config.compact = false);
      config.showXmlButton === 'false' && (config.showXmlButton = false);
      config.headless === 'false' && (config.headless = false);

      load(config.url, function(data, status, xhr) {
         var doc = getDocument(data.content || '');
         var rss = getRss(doc, data, config);
         var box = renderBox(rss, config);
         script.replaceWith(box);
         polish(rss, config);
         if (config.setup === 'true') {
            // Save the configuration and RSS data for further processing in the configurator.
            window.rss = {
               xml: data.content,
               doc: doc,
               data: rss,
               config: config,
               renderBox: function(rss, config, callback) {
                  callback(renderBox(rss, config));
                  polish(rss, config);
               }
            }
         }
         return main(); // Recursion

         /*console.log('param:', param)
         console.log('config:', config);
         console.log('data:', data);
         console.log('rss:', rss);*/
      });

      return;
   }
   
   function load(url, callback) {
      $.getJSON(ROXY_URI + '?callback=?&url=' + encodeURIComponent(url), callback);
   }
   
   function polish(rss, config) {
      if (config.headless) { 
         $('.rssbox-titlebar').hide();
         $('.rssbox').css({border: 'none'});
         $('.rssbox-content').css({'border-top': 'none'});
      }

      // Update unspecified dimensions of RSS image with actual width and/or height.
      if (rss.image && rss.image.source && (!rss.image.width || !rss.image.height)) {
         var image = new Image;
         image.src = rss.image.source;
         $(image).load(function() {
            if (!rss.image.width) {
               rss.image.width = this.width;
               $('.rssbox-image').css({width: this.width});
            }
            if (!rss.image.height) {
               rss.image.height = this.height;
               $('.rssbox-image').css({height: this.height});
            }
         });         
      }

      // Update dimensions of image elements to fit in the box.
      $('.rssbox img').each(function() {
         var img = $(this);
         var width = img.width();
         if (width < 1) {
             return;
         }
         var margin = 20;
         if (config.width - width < margin) {
            var newWidth = config.width - margin;
            img.width(newWidth).height(img.height() * newWidth / width);
         }
         img.show();                     
      });
      
      // Update dimensions of iframe, embed and object elements to fit in the box
      var width = config.width - 20;
      $('.rssbox iframe').attr({width: width, height: 'auto'});
      $('.rssbox object').attr({width: width, height: 'auto'});
      $('.rssbox embed').attr({width: width, height: 'auto'});      
   }
   
   function getDocument(xml) {
      if (xml) {
         if (document.implementation.createDocument) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(xml, 'text/xml');
            return doc;
         } else if (window.ActiveXObject) {
            var doc = new window.ActiveXObject('Microsoft.XMLDOM');
            doc.async = 'false';
            doc.loadXML(xml);
            return doc;
         }
      }
      return null;
   }

   function getHtmlColor(str) {
      if (str.indexOf('#') < 0) {
         var re = new RegExp('(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)', 'i');
         re.test(str) && (str = '#' + str);
      }
      return str.toLowerCase();
   }
   
   function getOuterHtml(element) {
      var wrapper = document.createElement('div');
      wrapper.appendChild(element);
      return wrapper.innerHTML;
   }

   function getRss(doc, data, config) {

      var ISO_DATE_PATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

      var NAMESPACES = {
         dc: "http://purl.org/dc/elements/1.1/",
         rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
      };

      function getDate(str) {
         var millis = Date.parse(str);
         if (isNaN(millis)) {
            millis = Date.parse(String(str).replace(ISO_DATE_PATTERN, "$1/$2/$3 $4"));
            isNaN(millis) && (millis = Date.now());
         }
         return new Date(millis);
      }
      
      function getError() {
         var msg = null, root;
         if (!doc || data.headers.error) {
            msg = (data.headers.error === 404 ? '404 File not found.' : 
                  data.headers.message || 'Unknown error.');
         } else if (doc.parseError && doc.parseError.errorCode) {
            msg = doc.parseError.reason; // IExplore
         } else if (root = doc.documentElement) {
            var errorNode;
            if (root.nodeName === "parsererror") {
               msg = doc.documentElement.textContent; // Mozilla
            } else if ((errorNode = root.childNodes[0]) && 
                  errorNode.nodeName === "parsererror") {
               msg = errorNode.textContent; // Safari
            } else if (!/rss|rdf|scriptingNews/i.test(doc.documentElement.nodeName)) {
               msg = "Incompatible data format. Are you sure this is an RSS feed?";
            }
         }
         return msg;
      }

      function encodeXml(str) {
         if (!str) {
            return '';
         }
         return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
      }

      var rss = {
         items: [],
         error: getError()
      }

      if (rss.error !== null) {
         doc = getDocument(render('error', {
            link: BASE_URI + '?url=' + encodeXml(config.url),
            validatorUrl: 'http://validator.w3.org/appc/check.cgi?url=' + encodeXml(config.url),
            message: encodeXml(rss.error)
         }));
      }

      var root = doc.documentElement;
      var type = root.nodeName;
      var $root = $(root);

      if (type === "scriptingNews") {
         var channel = $root.find('header');
         rss.format = "Scripting News";
         rss.version = channel.find("scriptingNewsVersion").text();
         rss.title = channel.find("channelTitle").text();
         rss.description = channel.find('channelDescription').text();
         rss.link = channel.find('channelLink').text();
         if (ref = channel.find('imageUrl').text()) {
            ref = rss.image = {source: ref};
            ref.title = channel.find('imageTitle').text();
            ref.link = channel.find('imageLink').text();
            ref.width = channel.find('imageWidth').text();
            ref.height = channel.find('imageHeight').text();
            ref.description = channel.find('imageCaption').text();
         }
      } else {
         var channel = $root.find("channel");
         rss.format = "RSS";
         rss.version = (type === "rdf:RDF" ? "1.0" : $root.attr("version"));
         rss.title = $root.find('channel > title').text();
         rss.description = $root.find('channel > description').text();
         rss.link = $root.find('channel > link').text();
         
         var images = $root.find('image');
         ref = rss.image = {
            source: images.find('url').text() || images.attr('rdf:resource'),
            title: images.find('title').text(),
            link: images.find('link').text(),
            width: images.find('width').text(),
            height: images.find('height').text(),
            description: images.find('description').text()
         }
      }

      if (type === "rdf:RDF") {
         rss.date = getDate(channel.find("dc:date") || data.headers.date);
         rss.rights = channel.find("dc:creator");
         var input = $root.find("textinput");
         if (input.length > 0) {
            ref = rss.input = {};
            ref.link = input.find('link').text();
            ref.description = input.find('description').text();
            ref.name = input.find('name').text();
            ref.title = input.find('title').text();
         }
      } else {
         rss.date = getDate($(channel).find("lastBuildDate") || 
               channel.find('pubDate').text() || data.headers.date);
         rss.rights = channel.find('copyright').text();
      }

      var item, text, node;
      $(doc.getElementsByTagName("item")).each(function(index) {
         var item = $(this);

         if (type === "scriptingNews") {
            ref = {title: ""};
            ref.description = item.find('text').text().replace(/\n/g, " ");
            ref.link = item.find('link').text();
            if (text = $.trim(item.find("linetext").text().replace(/\n/g, " "))) {
               ref.description = ref.description.replace(new RegExp(text), 
                     '<a href="' + item.find('url').text() + '">' + text + '</a>');
            }
         } else {
            ref = {
               title: item.find('title').text(),
               description: item.find('description').text(),
               link: item.find("link").text() || item.find("guid").text()
            }
            if (!ref.description) {
                var content = item.find('content\\:encoded').text();
                if (content) {
                   ref.description = content;
                } else {
                   content = item.find('encoded').text()
                   if (content) {
                      ref.description = content;
                   }
                }
            }
        }

        if (node = item.find("source")) {
           ref.source = {
              link: node.attr("url"),
              title: node.text()
           }
        }

        if (node = item.find("enclosure")) {
           ref.enclosure = {
              link: node.attr("url"),
              length: node.attr("length"),
              type: node.attr("type")
           }
        }

        if (node = item.find("category")) {
           ref.category = {
              domain: node.attr("domain") || "",
              content: node.text()
           }
        }

        rss.items.push(ref);
      });

      return rss;
   }
   
   function renderBox(rss, config) {
      
      function renderButtons(enclosure, source) {
         var result = "";
         if (enclosure && enclosure.link) {
            result += render('image', {
               display: 'inline',
               source: BASE_URI + "images/attach.png",
               title: enclosure.type,
               link: encodeURI(enclosure.link),
               padding: '16px'
            });
         }
         if (source && source.link) {
            result += render('image', {
               display: 'inline',
               source: BASE_URI + "images/globe.png",
               title: source.title,
               link: encodeURI(source.link),
               padding: '15px'
            });
         }
         return result;         
      }

      if (rss.error) {
         config.compact = 0;
         config.showXmlButton = 1;
         config.maxItems = 3;
      }

      var item, items = "";
      for (var i=0; i<Math.min(rss.items.length, config.maxItems || 10); i+=1) {
         item = rss.items[i];
         items += render('item', {
            fontWeight: config.compact ? 'normal' : 'bold',
            title: (function() {
               var title = '';
               if (item.link) {
                  title += render('link', {
                     link: encodeURI(item.link),
                     text: item.title,
                     'class': "rssBoxItemTitle rssbox-item-title"
                  });
               } else {
                  title += item.title;
               }
               return title;
            })(),
            description: (!config.compact || !item.title) ? item.description : '',
            buttons: renderButtons(item.enclosure, item.source)
         });
      }
      
      var id = 'rssbox-' + Date.now();
      
      var box = render('box', {
         id: id,

         title: rss.link ? render('link', {
            link: encodeURI(rss.link),
            text: rss.title,
            'class': "rssBoxTitle"
         }) : rss.title,

         description: rss.description,
         items: items,

         xmlButton: (function() {
            if (!config.showXmlButton) {
               return '';
            }
            return render('image', {
               display: 'inline-block',
               link: config.url,
               source: BASE_URI + "images/rss.png",
               title: rss.format + " " + rss.version,
               width: '16px',
               height: '16px',
               align: "right",
               hspace: '3px',
               vspace: '0px'
            });
         })(),

         image: (function() {
            if (config.compact || !rss.image || !rss.image.source) {
               return '';
            }
            return render('image', {
               'class': 'rssbox-image',
               display: 'inline-block',
               link: encodeURI(rss.image.link),
               source: rss.image.source,
               width: rss.image.width + 'px',
               height: rss.image.height + 'px',
               title: rss.image.title,
               align: "right",
               valign: "baseline",
               hspace: '5px',
               vspace: '5px'
            });        
         })(),

         input: (function() {
            if (config.compact || !rss.input) {
               return '';
            }
            render('input', {
               link: encodeURI(rss.input.link),
               description: rss.input.description,
               name: rss.input.name,
               title: rss.input.title
            });            
         })(),

         date: renderDate(rss.date),
         width: config.width,
         height: config.height,
         frameColor: config.frameColor,
         fontFace: config.fontFace,
         align: config.align,
         titleBarColor: config.titleBarColor,
         titleBarTextColor: config.titleBarTextColor,
         boxFillColor: config.boxFillColor,
         textColor: config.textColor,
         radius: config.radius
      });

      // FIXME: This belongs somewhere else… (or does it?)
      var css = render('stylesheet', {
         id: id,
         width: config.width,
         height: config.height < 0 ? 'auto' : config.height + 'px',
         frameColor: config.frameColor,
         fontFace: config.fontFace,
         align: config.align,
         radius: config.radius,
         titleBarTextColor: config.titleBarTextColor,
         titleBarColor: config.titleBarColor,
         boxFillColor: config.boxFillColor,
         textColor: config.textColor,
         linkColor: config.linkColor
      });

      var style = document.createElement('style');
      $('head').prepend(style);
      style.type = 'text/css';
      style.rel = 'stylesheet';
      style.media = 'screen';
      if (style.styleSheet) {
         style.styleSheet.cssText = css;
      } else {
         $(style).text(css);
      }
      
      return box;
   }
   
   function renderDate(date) {

      function padZero(n) {
         return (n < 10) ? '0' + n : n;
      }

      return render('date', {
         year: date.getFullYear(),
         month: padZero(date.getMonth() + 1),
         day: padZero(date.getDate()),
         hours: padZero(date.getHours()),
         minutes: padZero(date.getMinutes()),
         seconds: padZero(date.getSeconds()),
         timeZone: "" // date.getTimezoneOffset()
      });
   }
   
   function render(name, data) {
      //data || (data = {});
      var template = getTemplate(name);
      if (template && data) {
         return template.replace(/\$\{([^}]+)\}/g, function() {
            var key = arguments[1];
            var value = data[key];
            return value || '';
         });
      }
      return ''; 
   }
   
   function getTemplate(name) {
      return $.trim(templates.filter(function() {
         return $(this).hasClass('template') && $(this).hasClass(name);
      }).html());
   }

})();
