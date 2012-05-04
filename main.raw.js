 $(function() {
   
   BASE_URI = 'http://p3k.org/rss/';
   FERRIS_URI = 'http://3.p3k-001.appspot.com/ferris?callback=?&group=rssbox&limit=100';

   if (typeof DEBUG !== 'undefined' && DEBUG === true) {
      BASE_URI = 'http://macke.local/~tobi/rss-box/';
      FERRIS_URI = 'http://macke.local:8081/ferris?callback=?&group=rssbox&limit=100';
   }

   load({ // Load a first RSS Box with default settings.
      url: 'http://blog.p3k.org/stories.xml',
      maxItems: 7,
      width: 200,
      radius: 5,
      align: null,
      frameColor: '#B3A28E',
      titleBarColor: '#90A8B3',
      titleBarTextColor: '#FFEAD2',
      boxFillColor: '#FFEAD2',
      textColor: '#95412B',
      linkColor: '#2C7395',
      showXmlButton: true,
      compact: false,
      fontFace: '10pt sans-serif'
   });

   // Set up handlers of interface elements.
   
   $('input:text').change(updater);
   $('input:checkbox').click(updater);

   $('form').submit(function(event) {
      event.preventDefault();
      updater();
   });
   
   $('#code textarea').click(function() {
      $(this).select();
   });

   $('.toggler a').click(function() {
      $(this).parents('.toggler').next('.togglee').toggle();
      return false;
   }).click();

   $('#descriptionToggler').click(function() {
      $(this).hide();
      $('#description').show();
      return false;
   });
   
   $('.color').miniColors({
      //letterCase: 'lowercase',
      change: function(hex, rgb) {
         // FIXME: Call updater() less often.
         updater();
      }
   });
   
   // Set up referrers.
   $('#referrers').hide();
   $('#referrersToggle').click(function() {
      $.getJSON(FERRIS_URI, function(data) {
         var cache = {};
         var result = '';
         $.each(data, function(index, item) {
            if (this.url.indexOf('http') !== 0 || this.url.indexOf(BASE_URI) === 0) {
               return;
            }
            var item = this.url.replace(/^([^.]*)www\./, '$1');
            if (cache[item]) {
               return;
            }
            cache[item] = true;
            var host = item.split('/')[2];
            result += '<a href="' + item + '">' + 
                  host + '<' + '/a><br />';
         });
         $('#referrers').html(result).show();
         $('#referrersToggle').hide()
      });
      return false;
   });
   
   // Capture clicks on links to XML files and display these as RSS box.
   $('a[href$="\\\.xml"]').click(function(event) {
      event.preventDefault();
      $('#url').val($(this).attr('href'));
      updater();
   });

   function updater(event) {
      var config = getConfig();
      if (config.url !== window.rss.config.url) {
         load(config);
         return;
      }
      window.rss.renderBox(window.rss.data, config, function(box) {
         $('#preview').html(box);
         update(window.rss.data, config);  
      });
   }

   function load(config) {
      var query = getQuery(config);
      $('#reload').attr('disabled', true).css('color', 'gray');
      $('#source').text('Loading...').css('color', 'green');
 
      window.rss = null;
      window._rss_box_framework_has_loaded = null; // FIXME: This is only a hack.

      var script = document.createElement('script');
      script.src = BASE_URI + 'index.js?setup=true&' + query;
      script.type = 'text/javascript';
      script.onreadystatechange = script.onload = function() {
         /* ... */
      }
      $('#preview').empty().get(0).appendChild(script);

      var scheduler = setInterval(function() {
         if (typeof jQuery !== 'undefined') {
            if (window.rss) {
               clearTimeout(scheduler);
               update(window.rss.data, window.rss.config);
               if (window.rss.data.error) {
                  $('#source a').css('color', 'red');
                  $('#code textarea').attr('disabled', true);
               } else {
                  $('#code textarea').attr('disabled', false);
               }
               $('#reload').css('color', 'green').attr('disabled', false);
            }
         }
      }, 10);

   }
   
   function update(rss, config) {
      $('#url').val(config.url);
      $('#source').html('<a href="' + config.url + '">' + 
            rss.format + ' ' + rss.version + '</a>');
      $('#title').text(rss.title);
      $('#description').text(rss.description).hide();
      $('#descriptionToggler').show();
      $('#date').text($('.rssbox-date').text());
      $('#format').text(rss.format + ' ' + rss.version);

      $('#maxItems').val(config.maxItems);
      $('#width').val(config.width);
      $('#preview').css('width', config.width);
      $('#radius').val(config.radius);
      $('#align').val(config.align || 'default');
      $('#compact').prop('checked', !!config.compact);
      $('#showXmlButton').prop('checked', !!config.showXmlButton);
      $('#fontFace').val(config.fontFace);

      $('#frameColor').miniColors('value', config.frameColor);
      $('#titleBarColor').miniColors('value', config.titleBarColor);
      $('#titleBarTextColor').miniColors('value', config.titleBarTextColor);
      $('#boxFillColor').miniColors('value', config.boxFillColor);
      $('#textColor').miniColors('value', config.textColor);
      $('#linkColor').miniColors('value', config.linkColor);

      $('#code textarea').val('<script type="text/javascript" src="' +
            BASE_URI + 'index.js?' + getQuery(config).replace(/&/g, '&amp;') + '"></script>');
      return;
   }

   function getConfig() {
      var config = {};
      var keys = ['url', 'maxItems', 'width', 'radius', 'align', 'frameColor', 'titleBarColor', 
            'titleBarTextColor', 'boxFillColor', 'textColor', 'linkColor', 'fontFace'];
      for (var i=0; i<keys.length; i+=1) {
         var key = keys[i];
         config[key] = $('#' + key).val();
      }
      config.compact = $('#compact').prop('checked') && true;
      config.showXmlButton = $('#showXmlButton').prop('checked') && true;
      return config;
   }
   
   function getQuery(config) {
      if (!config) {
         return '';
      }
      var query = [];
      for (var key in config) {
         var value = config[key];
         if (key === 'setup' || !value) {
            continue;
         }
         query.push(key + '=' + encodeURIComponent(value));
      }
      return query.join('&');
   } 

});
