/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	(function() {

	  'use strict';

	  __webpack_require__(1);
	  __webpack_require__(6);

	  var $ = window.jQuery = __webpack_require__(8);
	  __webpack_require__(9);

	  var Modernizr = __webpack_require__(10);
	  var settings = __webpack_require__(11);

	  var BASE_URI = settings.baseUri;
	  var FERRIS_URI = settings.ferrisUri;

	  $(function() {

	    var url, parts = location.href.split('?');
	    if (parts.length > 1) {
	      parts = parts[1].split('=');
	      if (parts[0] === 'url') {
	        url = decodeURIComponent(parts[1]);
	      }
	    }

	    load({ // Load a first RSS Box with default settings.
	      url: url || 'http://blog.p3k.org/stories.xml',
	      maxItems: 7,
	      width: 200,
	      height: -1,
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
	      headless: false,
	      fontFace: '10pt sans-serif'
	    });

	    // Set up handlers of interface elements.

	    $('input').change(updater);

	    $('form').submit(function(event) {
	      event.preventDefault();
	      updater();
	    });

	    $('.autoselect').click(function() {
	      $(this).select();
	    });

	    $('.toggler a').click(function(event) {
	      event.preventDefault();
	      $(this).parents('.toggler').next('.togglee').toggle();
	    }).click();

	    $('#descriptionToggler').click(function(event) {
	      event.preventDefault();
	      $(this).hide();
	      $('#description').show();
	    });

	    $('input.color').minicolors({
	      change: function(hex, rgb) {
	        updater();
	      }
	    });

	    // Set up referrers.
	    $('#referrers').hide();
	    $('#referrersToggle').click(function(event) {
	      event.preventDefault();
	      $.getJSON(FERRIS_URI, function(data) {
	        if (data.error) {
	          var error = $('<div>')
	            .attr('title', 'Error ' + data.status + ': ' + data.error)
	            .html('currently unavailable.');
	          $('#referrers').html(error).show();
	          $('#referrersToggle').hide();
	          return;
	        }
	        var cache = {};
	        var result = '';
	        $.each(data, function(index, item) {
	          if (this.url.indexOf('http') !== 0 || this.url.indexOf(BASE_URI) === 0) {
	            return;
	          }
	          var href = this.url.replace(/^([^.]*)www\./, '$1');
	          var host = href.split('/')[2];
	          if (cache[host]) {
	            return;
	          }
	          cache[host] = true;
	          result += '<a href="' + href + '">' + host + '<' + '/a><br />';
	        });
	        $('#referrers').html(result).show();
	        $('#referrersToggle').hide();
	      });
	    });

	    // Capture clicks on links to XML files and display these as RSS box.
	    $('a[href$="\\\.xml"]').click(function(event) {
	      event.preventDefault();
	      $('#url').val($(this).attr('href'));
	      updater();
	    });

	    function updater(event) {
	      var inputs = $('input');
	      for (var input, i = 0; i < inputs.length; i += 1) {
	        input = inputs.get(i);
	        if (input.validity && !input.validity.valid) {
	          return;
	        }
	      }
	      var config = getConfig();
	      if (!window.rss || config.url !== window.rss.config.url) {
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
	      script.src = BASE_URI + '/main.js?setup=true&' + query;
	      script.type = 'text/javascript';
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
	      $('#preview').css('width', config.width);

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
	      $('#height').val(config.height);
	      $('#radius').val(config.radius);
	      $('#align').val(config.align || 'default');
	      $('#compact').prop('checked', !!config.compact);
	      $('#showXmlButton').prop('checked', !!config.showXmlButton);
	      $('#headless').prop('checked', !!config.headless);
	      $('#fontFace').val(config.fontFace);

	      $('#frameColor').minicolors('value', config.frameColor);
	      $('#titleBarColor').minicolors('value', config.titleBarColor);
	      $('#titleBarTextColor').minicolors('value', config.titleBarTextColor);
	      $('#boxFillColor').minicolors('value', config.boxFillColor);
	      $('#textColor').minicolors('value', config.textColor);
	      $('#linkColor').minicolors('value', config.linkColor);

	      $('#code textarea').val('<script type="text/javascript" src="' +
	        BASE_URI + '/main.js?' + getQuery(config).replace(/&/g, '&amp;') + '"></script>');

	      // Dis-/enable controls depending on other settings
	      $('#showXmlButton').attr({disabled: config.headless});
	      $('#frameColor').attr({disabled: config.headless});
	      $('#titleBarColor').attr({disabled: config.headless});
	      $('#titleBarTextColor').attr({disabled: config.headless});
	      $('#textColor').attr({disabled: config.compact});
	      $('#radius').attr({disabled: !Modernizr.borderradius});
	      return;
	    }

	    function getConfig() {
	      var config = {};
	      var keys = ['url', 'maxItems', 'width', 'height', 'radius', 'align', 'frameColor',
	        'titleBarColor', 'titleBarTextColor', 'boxFillColor', 'textColor', 'linkColor', 'fontFace'];
	      for (var i=0; i<keys.length; i+=1) {
	        var key = keys[i];
	        config[key] = $('#' + key).val();
	      }
	      config.id = $('#preview .rssbox').attr('id');
	      config.compact = $('#compact').prop('checked') && true;
	      config.showXmlButton = $('#showXmlButton').prop('checked') && true;
	      config.headless = $('#headless').prop('checked') && true;
	      return config;
	    }

	    function getQuery(config) {
	      if (!config) {
	        return '';
	      }
	      var query = new Array;
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
	})();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(2);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(5)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../css-loader/index.js!./jquery.minicolors.css", function() {
				var newContent = require("!!./../css-loader/index.js!./jquery.minicolors.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports


	// module
	exports.push([module.id, ".minicolors {\n    position: relative;\n}\n\n.minicolors-sprite {\n    background-image: url(data:image/png;base64,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);\n}\n\n.minicolors-no-data-uris .minicolors-sprite {\n    background-image: url(" + __webpack_require__(4) + ");\n}\n\n.minicolors-swatch {\n    position: absolute;\n    vertical-align: middle;\n    background-position: -80px 0;\n    border: solid 1px #ccc;\n    cursor: text;\n    padding: 0;\n    margin: 0;\n    display: inline-block;\n}\n\n.minicolors-swatch-color {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n}\n\n.minicolors input[type=hidden] + .minicolors-swatch {\n    width: 28px;\n    position: static;\n    cursor: pointer;\n}\n\n.minicolors input[type=hidden][disabled] + .minicolors-swatch {\n    cursor: default;\n}\n\n/* Panel */\n.minicolors-panel {\n    position: absolute;\n    width: 173px;\n    height: 152px;\n    background: white;\n    border: solid 1px #CCC;\n    box-shadow: 0 0 20px rgba(0, 0, 0, .2);\n    z-index: 99999;\n    -moz-box-sizing: content-box;\n    -webkit-box-sizing: content-box;\n    box-sizing: content-box;\n    display: none;\n}\n\n.minicolors-panel.minicolors-visible {\n    display: block;\n}\n\n/* Panel positioning */\n.minicolors-position-top .minicolors-panel {\n    top: -154px;\n}\n\n.minicolors-position-right .minicolors-panel {\n    right: 0;\n}\n\n.minicolors-position-bottom .minicolors-panel {\n    top: auto;\n}\n\n.minicolors-position-left .minicolors-panel {\n    left: 0;\n}\n\n.minicolors-with-opacity .minicolors-panel {\n    width: 194px;\n}\n\n.minicolors .minicolors-grid {\n    position: absolute;\n    top: 1px;\n    left: 1px;\n    width: 150px;\n    height: 150px;\n    background-position: -120px 0;\n    cursor: crosshair;\n}\n\n.minicolors .minicolors-grid-inner {\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 150px;\n    height: 150px;\n}\n\n.minicolors-slider-saturation .minicolors-grid {\n    background-position: -420px 0;\n}\n\n.minicolors-slider-saturation .minicolors-grid-inner {\n    background-position: -270px 0;\n    background-image: inherit;\n}\n\n.minicolors-slider-brightness .minicolors-grid {\n    background-position: -570px 0;\n}\n\n.minicolors-slider-brightness .minicolors-grid-inner {\n    background-color: black;\n}\n\n.minicolors-slider-wheel .minicolors-grid {\n    background-position: -720px 0;\n}\n\n.minicolors-slider,\n.minicolors-opacity-slider {\n    position: absolute;\n    top: 1px;\n    left: 152px;\n    width: 20px;\n    height: 150px;\n    background-color: white;\n    background-position: 0 0;\n    cursor: row-resize;\n}\n\n.minicolors-slider-saturation .minicolors-slider {\n    background-position: -60px 0;\n}\n\n.minicolors-slider-brightness .minicolors-slider {\n    background-position: -20px 0;\n}\n\n.minicolors-slider-wheel .minicolors-slider {\n    background-position: -20px 0;\n}\n\n.minicolors-opacity-slider {\n    left: 173px;\n    background-position: -40px 0;\n    display: none;\n}\n\n.minicolors-with-opacity .minicolors-opacity-slider {\n    display: block;\n}\n\n/* Pickers */\n.minicolors-grid .minicolors-picker {\n    position: absolute;\n    top: 70px;\n    left: 70px;\n    width: 12px;\n    height: 12px;\n    border: solid 1px black;\n    border-radius: 10px;\n    margin-top: -6px;\n    margin-left: -6px;\n    background: none;\n}\n\n.minicolors-grid .minicolors-picker > div {\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 8px;\n    height: 8px;\n    border-radius: 8px;\n    border: solid 2px white;\n    -moz-box-sizing: content-box;\n    -webkit-box-sizing: content-box;\n    box-sizing: content-box;\n}\n\n.minicolors-picker {\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 18px;\n    height: 2px;\n    background: white;\n    border: solid 1px black;\n    margin-top: -2px;\n    -moz-box-sizing: content-box;\n    -webkit-box-sizing: content-box;\n    box-sizing: content-box;\n}\n\n/* Inline controls */\n.minicolors-inline {\n    display: inline-block;\n}\n\n.minicolors-inline .minicolors-input {\n    display: none !important;\n}\n\n.minicolors-inline .minicolors-panel {\n    position: relative;\n    top: auto;\n    left: auto;\n    box-shadow: none;\n    z-index: auto;\n    display: inline-block;\n}\n\n/* Default theme */\n.minicolors-theme-default .minicolors-swatch {\n    top: 5px;\n    left: 5px;\n    width: 18px;\n    height: 18px;\n}\n.minicolors-theme-default.minicolors-position-right .minicolors-swatch {\n    left: auto;\n    right: 5px;\n}\n.minicolors-theme-default.minicolors {\n    width: auto;\n    display: inline-block;\n}\n.minicolors-theme-default .minicolors-input {\n    height: 20px;\n    width: auto;\n    display: inline-block;\n    padding-left: 26px;\n}\n.minicolors-theme-default.minicolors-position-right .minicolors-input {\n    padding-right: 26px;\n    padding-left: inherit;\n}\n\n/* Bootstrap theme */\n.minicolors-theme-bootstrap .minicolors-swatch {\n    z-index: 2;\n    top: 3px;\n    left: 3px;\n    width: 28px;\n    height: 28px;\n    border-radius: 3px;\n}\n.minicolors-theme-bootstrap .minicolors-swatch-color {\n    border-radius: inherit;\n}\n.minicolors-theme-bootstrap.minicolors-position-right .minicolors-swatch {\n    left: auto;\n    right: 3px;\n}\n.minicolors-theme-bootstrap .minicolors-input {\n    float: none;\n    padding-left: 44px;\n}\n.minicolors-theme-bootstrap.minicolors-position-right .minicolors-input {\n    padding-right: 44px;\n    padding-left: 12px;\n}\n.minicolors-theme-bootstrap .minicolors-input.input-lg + .minicolors-swatch {\n    top: 4px;\n    left: 4px;\n    width: 37px;\n    height: 37px;\n    border-radius: 5px;\n}\n.minicolors-theme-bootstrap .minicolors-input.input-sm + .minicolors-swatch {\n    width: 24px;\n    height: 24px;\n}\n.input-group .minicolors-theme-bootstrap:not(:first-child) .minicolors-input {\n    border-top-left-radius: 0;\n    border-bottom-left-radius: 0;\n}\n", ""]);

	// exports


/***/ },
/* 3 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "img/d36c75.png";

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(7);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(5)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../node_modules/css-loader/index.js!./app.css", function() {
				var newContent = require("!!./../node_modules/css-loader/index.js!./app.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports


	// module
	exports.push([module.id, "body {\n   margin: 10px;\n   padding: 10px;\n   font-family: 'Droid Serif', serif;\n}\n\na {\n   text-decoration: none;\n}\n\na:hover {\n   text-decoration: underline;\n}\n\nh3 {\n   margin: 10px 0 0 0;\n   font-size: 30px;\n   font-weight: normal;\n   line-height: 1.7em;\n}\n\np, ul, li {\n   margin: .66em 0;\n   line-height: 1.4em;\n}\n\ncode {\n   font-size: .9em;\n}\n\ndiv#preview {\n   float: left;\n   width: 200px;\n   min-height: 1em;\n   margin-bottom: 1em;\n}\n\ntable#setup {\n   float: left;\n   width: 350px;\n   margin-bottom: 0;\n   border: 1px;\n   border-spacing: 0 0;\n}\n\ntable#setup td {\n   padding: 4px;\n}\n\nsmall, label, #referrers li {\n   color: gray;\n   font-size: .8em;\n}\n\nbutton#reset {\n   margin-right: 5px;\n}\n\nbutton#reload {\n   font-weight: bold;\n   color: green;\n}\n\n#noscript {\n\tposition: fixed;\n\tz-index: 99;\n\ttop: 0;\n\tright: 0;\n\tbottom: 0;\n\tleft: 0;\n\tpadding: 1em;\n\tbackground: rgba(255,255,255,0.8);\n\tfont-size: 6em;\n}\n\n#setup {\n   padding-left: 20px;\n   padding-right: 50px;\n}\n\n#setup td {\n   vertical-align: baseline;\n}\n\n#setup td:first-child {\n   text-align: right;\n   white-space: nowrap;\n}\n\n#title, #description, #date, #source {\n   font-size: .8em;\n}\n\n#url, #fontFace {\n   width: 165px;\n}\n\n#headless {\n   margin-right: 30px;\n}\n\n#maxItems, #width, #height, #radius {\n   width: 50px;\n}\n\n#code td {\n   padding-top: 30px;\n   vertical-align: top;\n}\n\n#code textarea {\n   width: 165px;\n   overflow: hidden;\n}\n\n#banner {\n   height: 85px;\n   vertical-align: top;\n}\n\n#about {\n   float: left;\n   width: 468px;\n   margin-right: 10px;\n}\n\n.rssbox a {\n   text-decoration: none;\n}\n\n.minicolors-theme-default .minicolors-input {\n  height: 13px;\n  padding-left: 20px;\n}\n\n.minicolors-theme-default .minicolors-swatch {\n  top: 1px;\n  left: 0;\n  width: 17px;\n  height: 17px;\n}", ""]);

	// exports


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * jQuery JavaScript Library v2.2.1
	 * http://jquery.com/
	 *
	 * Includes Sizzle.js
	 * http://sizzlejs.com/
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license
	 * http://jquery.org/license
	 *
	 * Date: 2016-02-22T19:11Z
	 */

	(function( global, factory ) {

		if ( typeof module === "object" && typeof module.exports === "object" ) {
			// For CommonJS and CommonJS-like environments where a proper `window`
			// is present, execute the factory and get jQuery.
			// For environments that do not have a `window` with a `document`
			// (such as Node.js), expose a factory as module.exports.
			// This accentuates the need for the creation of a real `window`.
			// e.g. var jQuery = require("jquery")(window);
			// See ticket #14549 for more info.
			module.exports = global.document ?
				factory( global, true ) :
				function( w ) {
					if ( !w.document ) {
						throw new Error( "jQuery requires a window with a document" );
					}
					return factory( w );
				};
		} else {
			factory( global );
		}

	// Pass this if window is not defined yet
	}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

	// Support: Firefox 18+
	// Can't be in strict mode, several libs including ASP.NET trace
	// the stack via arguments.caller.callee and Firefox dies if
	// you try to trace through "use strict" call chains. (#13335)
	//"use strict";
	var arr = [];

	var document = window.document;

	var slice = arr.slice;

	var concat = arr.concat;

	var push = arr.push;

	var indexOf = arr.indexOf;

	var class2type = {};

	var toString = class2type.toString;

	var hasOwn = class2type.hasOwnProperty;

	var support = {};



	var
		version = "2.2.1",

		// Define a local copy of jQuery
		jQuery = function( selector, context ) {

			// The jQuery object is actually just the init constructor 'enhanced'
			// Need init if jQuery is called (just allow error to be thrown if not included)
			return new jQuery.fn.init( selector, context );
		},

		// Support: Android<4.1
		// Make sure we trim BOM and NBSP
		rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

		// Matches dashed string for camelizing
		rmsPrefix = /^-ms-/,
		rdashAlpha = /-([\da-z])/gi,

		// Used by jQuery.camelCase as callback to replace()
		fcamelCase = function( all, letter ) {
			return letter.toUpperCase();
		};

	jQuery.fn = jQuery.prototype = {

		// The current version of jQuery being used
		jquery: version,

		constructor: jQuery,

		// Start with an empty selector
		selector: "",

		// The default length of a jQuery object is 0
		length: 0,

		toArray: function() {
			return slice.call( this );
		},

		// Get the Nth element in the matched element set OR
		// Get the whole matched element set as a clean array
		get: function( num ) {
			return num != null ?

				// Return just the one element from the set
				( num < 0 ? this[ num + this.length ] : this[ num ] ) :

				// Return all the elements in a clean array
				slice.call( this );
		},

		// Take an array of elements and push it onto the stack
		// (returning the new matched element set)
		pushStack: function( elems ) {

			// Build a new jQuery matched element set
			var ret = jQuery.merge( this.constructor(), elems );

			// Add the old object onto the stack (as a reference)
			ret.prevObject = this;
			ret.context = this.context;

			// Return the newly-formed element set
			return ret;
		},

		// Execute a callback for every element in the matched set.
		each: function( callback ) {
			return jQuery.each( this, callback );
		},

		map: function( callback ) {
			return this.pushStack( jQuery.map( this, function( elem, i ) {
				return callback.call( elem, i, elem );
			} ) );
		},

		slice: function() {
			return this.pushStack( slice.apply( this, arguments ) );
		},

		first: function() {
			return this.eq( 0 );
		},

		last: function() {
			return this.eq( -1 );
		},

		eq: function( i ) {
			var len = this.length,
				j = +i + ( i < 0 ? len : 0 );
			return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
		},

		end: function() {
			return this.prevObject || this.constructor();
		},

		// For internal use only.
		// Behaves like an Array's method, not like a jQuery method.
		push: push,
		sort: arr.sort,
		splice: arr.splice
	};

	jQuery.extend = jQuery.fn.extend = function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[ 0 ] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;

			// Skip the boolean and the target
			target = arguments[ i ] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
			target = {};
		}

		// Extend jQuery itself if only one argument is passed
		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			// Only deal with non-null/undefined values
			if ( ( options = arguments[ i ] ) != null ) {

				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
						( copyIsArray = jQuery.isArray( copy ) ) ) ) {

						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && jQuery.isArray( src ) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject( src ) ? src : {};
						}

						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	jQuery.extend( {

		// Unique for each copy of jQuery on the page
		expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

		// Assume jQuery is ready without the ready module
		isReady: true,

		error: function( msg ) {
			throw new Error( msg );
		},

		noop: function() {},

		isFunction: function( obj ) {
			return jQuery.type( obj ) === "function";
		},

		isArray: Array.isArray,

		isWindow: function( obj ) {
			return obj != null && obj === obj.window;
		},

		isNumeric: function( obj ) {

			// parseFloat NaNs numeric-cast false positives (null|true|false|"")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			// adding 1 corrects loss of precision from parseFloat (#15100)
			var realStringObj = obj && obj.toString();
			return !jQuery.isArray( obj ) && ( realStringObj - parseFloat( realStringObj ) + 1 ) >= 0;
		},

		isPlainObject: function( obj ) {

			// Not plain objects:
			// - Any object or value whose internal [[Class]] property is not "[object Object]"
			// - DOM nodes
			// - window
			if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
				return false;
			}

			if ( obj.constructor &&
					!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}

			// If the function hasn't returned already, we're confident that
			// |obj| is a plain object, created by {} or constructed with new Object
			return true;
		},

		isEmptyObject: function( obj ) {
			var name;
			for ( name in obj ) {
				return false;
			}
			return true;
		},

		type: function( obj ) {
			if ( obj == null ) {
				return obj + "";
			}

			// Support: Android<4.0, iOS<6 (functionish RegExp)
			return typeof obj === "object" || typeof obj === "function" ?
				class2type[ toString.call( obj ) ] || "object" :
				typeof obj;
		},

		// Evaluates a script in a global context
		globalEval: function( code ) {
			var script,
				indirect = eval;

			code = jQuery.trim( code );

			if ( code ) {

				// If the code includes a valid, prologue position
				// strict mode pragma, execute code by injecting a
				// script tag into the document.
				if ( code.indexOf( "use strict" ) === 1 ) {
					script = document.createElement( "script" );
					script.text = code;
					document.head.appendChild( script ).parentNode.removeChild( script );
				} else {

					// Otherwise, avoid the DOM node creation, insertion
					// and removal by using an indirect global eval

					indirect( code );
				}
			}
		},

		// Convert dashed to camelCase; used by the css and data modules
		// Support: IE9-11+
		// Microsoft forgot to hump their vendor prefix (#9572)
		camelCase: function( string ) {
			return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
		},

		nodeName: function( elem, name ) {
			return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
		},

		each: function( obj, callback ) {
			var length, i = 0;

			if ( isArrayLike( obj ) ) {
				length = obj.length;
				for ( ; i < length; i++ ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			}

			return obj;
		},

		// Support: Android<4.1
		trim: function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

		// results is for internal usage only
		makeArray: function( arr, results ) {
			var ret = results || [];

			if ( arr != null ) {
				if ( isArrayLike( Object( arr ) ) ) {
					jQuery.merge( ret,
						typeof arr === "string" ?
						[ arr ] : arr
					);
				} else {
					push.call( ret, arr );
				}
			}

			return ret;
		},

		inArray: function( elem, arr, i ) {
			return arr == null ? -1 : indexOf.call( arr, elem, i );
		},

		merge: function( first, second ) {
			var len = +second.length,
				j = 0,
				i = first.length;

			for ( ; j < len; j++ ) {
				first[ i++ ] = second[ j ];
			}

			first.length = i;

			return first;
		},

		grep: function( elems, callback, invert ) {
			var callbackInverse,
				matches = [],
				i = 0,
				length = elems.length,
				callbackExpect = !invert;

			// Go through the array, only saving the items
			// that pass the validator function
			for ( ; i < length; i++ ) {
				callbackInverse = !callback( elems[ i ], i );
				if ( callbackInverse !== callbackExpect ) {
					matches.push( elems[ i ] );
				}
			}

			return matches;
		},

		// arg is for internal usage only
		map: function( elems, callback, arg ) {
			var length, value,
				i = 0,
				ret = [];

			// Go through the array, translating each of the items to their new values
			if ( isArrayLike( elems ) ) {
				length = elems.length;
				for ( ; i < length; i++ ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}

			// Go through every key on the object,
			} else {
				for ( i in elems ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}
			}

			// Flatten any nested arrays
			return concat.apply( [], ret );
		},

		// A global GUID counter for objects
		guid: 1,

		// Bind a function to a context, optionally partially applying any
		// arguments.
		proxy: function( fn, context ) {
			var tmp, args, proxy;

			if ( typeof context === "string" ) {
				tmp = fn[ context ];
				context = fn;
				fn = tmp;
			}

			// Quick check to determine if target is callable, in the spec
			// this throws a TypeError, but we will just return undefined.
			if ( !jQuery.isFunction( fn ) ) {
				return undefined;
			}

			// Simulated bind
			args = slice.call( arguments, 2 );
			proxy = function() {
				return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
			};

			// Set the guid of unique handler to the same of original handler, so it can be removed
			proxy.guid = fn.guid = fn.guid || jQuery.guid++;

			return proxy;
		},

		now: Date.now,

		// jQuery.support is not used in Core but other projects attach their
		// properties to it so it needs to exist.
		support: support
	} );

	// JSHint would error on this code due to the Symbol not being defined in ES5.
	// Defining this global in .jshintrc would create a danger of using the global
	// unguarded in another place, it seems safer to just disable JSHint for these
	// three lines.
	/* jshint ignore: start */
	if ( typeof Symbol === "function" ) {
		jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
	}
	/* jshint ignore: end */

	// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
	function( i, name ) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	} );

	function isArrayLike( obj ) {

		// Support: iOS 8.2 (not reproducible in simulator)
		// `in` check used to prevent JIT error (gh-2145)
		// hasOwn isn't used here due to false negatives
		// regarding Nodelist length in IE
		var length = !!obj && "length" in obj && obj.length,
			type = jQuery.type( obj );

		if ( type === "function" || jQuery.isWindow( obj ) ) {
			return false;
		}

		return type === "array" || length === 0 ||
			typeof length === "number" && length > 0 && ( length - 1 ) in obj;
	}
	var Sizzle =
	/*!
	 * Sizzle CSS Selector Engine v2.2.1
	 * http://sizzlejs.com/
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license
	 * http://jquery.org/license
	 *
	 * Date: 2015-10-17
	 */
	(function( window ) {

	var i,
		support,
		Expr,
		getText,
		isXML,
		tokenize,
		compile,
		select,
		outermostContext,
		sortInput,
		hasDuplicate,

		// Local document vars
		setDocument,
		document,
		docElem,
		documentIsHTML,
		rbuggyQSA,
		rbuggyMatches,
		matches,
		contains,

		// Instance-specific data
		expando = "sizzle" + 1 * new Date(),
		preferredDoc = window.document,
		dirruns = 0,
		done = 0,
		classCache = createCache(),
		tokenCache = createCache(),
		compilerCache = createCache(),
		sortOrder = function( a, b ) {
			if ( a === b ) {
				hasDuplicate = true;
			}
			return 0;
		},

		// General-purpose constants
		MAX_NEGATIVE = 1 << 31,

		// Instance methods
		hasOwn = ({}).hasOwnProperty,
		arr = [],
		pop = arr.pop,
		push_native = arr.push,
		push = arr.push,
		slice = arr.slice,
		// Use a stripped-down indexOf as it's faster than native
		// http://jsperf.com/thor-indexof-vs-for/5
		indexOf = function( list, elem ) {
			var i = 0,
				len = list.length;
			for ( ; i < len; i++ ) {
				if ( list[i] === elem ) {
					return i;
				}
			}
			return -1;
		},

		booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

		// Regular expressions

		// http://www.w3.org/TR/css3-selectors/#whitespace
		whitespace = "[\\x20\\t\\r\\n\\f]",

		// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
		identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

		// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
		attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
			// Operator (capture 2)
			"*([*^$|!~]?=)" + whitespace +
			// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
			"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
			"*\\]",

		pseudos = ":(" + identifier + ")(?:\\((" +
			// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
			// 1. quoted (capture 3; capture 4 or capture 5)
			"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
			// 2. simple (capture 6)
			"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
			// 3. anything else (capture 2)
			".*" +
			")\\)|)",

		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		rwhitespace = new RegExp( whitespace + "+", "g" ),
		rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

		rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
		rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

		rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

		rpseudo = new RegExp( pseudos ),
		ridentifier = new RegExp( "^" + identifier + "$" ),

		matchExpr = {
			"ID": new RegExp( "^#(" + identifier + ")" ),
			"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
			"TAG": new RegExp( "^(" + identifier + "|[*])" ),
			"ATTR": new RegExp( "^" + attributes ),
			"PSEUDO": new RegExp( "^" + pseudos ),
			"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
				"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
			"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
			// For use in libraries implementing .is()
			// We use this for POS matching in `select`
			"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
				whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
		},

		rinputs = /^(?:input|select|textarea|button)$/i,
		rheader = /^h\d$/i,

		rnative = /^[^{]+\{\s*\[native \w/,

		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

		rsibling = /[+~]/,
		rescape = /'|\\/g,

		// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
		runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
		funescape = function( _, escaped, escapedWhitespace ) {
			var high = "0x" + escaped - 0x10000;
			// NaN means non-codepoint
			// Support: Firefox<24
			// Workaround erroneous numeric interpretation of +"0x"
			return high !== high || escapedWhitespace ?
				escaped :
				high < 0 ?
					// BMP codepoint
					String.fromCharCode( high + 0x10000 ) :
					// Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
		},

		// Used for iframes
		// See setDocument()
		// Removing the function wrapper causes a "Permission Denied"
		// error in IE
		unloadHandler = function() {
			setDocument();
		};

	// Optimize for push.apply( _, NodeList )
	try {
		push.apply(
			(arr = slice.call( preferredDoc.childNodes )),
			preferredDoc.childNodes
		);
		// Support: Android<4.0
		// Detect silently failing push.apply
		arr[ preferredDoc.childNodes.length ].nodeType;
	} catch ( e ) {
		push = { apply: arr.length ?

			// Leverage slice if possible
			function( target, els ) {
				push_native.apply( target, slice.call(els) );
			} :

			// Support: IE<9
			// Otherwise append directly
			function( target, els ) {
				var j = target.length,
					i = 0;
				// Can't trust NodeList.length
				while ( (target[j++] = els[i++]) ) {}
				target.length = j - 1;
			}
		};
	}

	function Sizzle( selector, context, results, seed ) {
		var m, i, elem, nid, nidselect, match, groups, newSelector,
			newContext = context && context.ownerDocument,

			// nodeType defaults to 9, since context defaults to document
			nodeType = context ? context.nodeType : 9;

		results = results || [];

		// Return early from calls with invalid selector or context
		if ( typeof selector !== "string" || !selector ||
			nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

			return results;
		}

		// Try to shortcut find operations (as opposed to filters) in HTML documents
		if ( !seed ) {

			if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
				setDocument( context );
			}
			context = context || document;

			if ( documentIsHTML ) {

				// If the selector is sufficiently simple, try using a "get*By*" DOM method
				// (excepting DocumentFragment context, where the methods don't exist)
				if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

					// ID selector
					if ( (m = match[1]) ) {

						// Document context
						if ( nodeType === 9 ) {
							if ( (elem = context.getElementById( m )) ) {

								// Support: IE, Opera, Webkit
								// TODO: identify versions
								// getElementById can match elements by name instead of ID
								if ( elem.id === m ) {
									results.push( elem );
									return results;
								}
							} else {
								return results;
							}

						// Element context
						} else {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( newContext && (elem = newContext.getElementById( m )) &&
								contains( context, elem ) &&
								elem.id === m ) {

								results.push( elem );
								return results;
							}
						}

					// Type selector
					} else if ( match[2] ) {
						push.apply( results, context.getElementsByTagName( selector ) );
						return results;

					// Class selector
					} else if ( (m = match[3]) && support.getElementsByClassName &&
						context.getElementsByClassName ) {

						push.apply( results, context.getElementsByClassName( m ) );
						return results;
					}
				}

				// Take advantage of querySelectorAll
				if ( support.qsa &&
					!compilerCache[ selector + " " ] &&
					(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

					if ( nodeType !== 1 ) {
						newContext = context;
						newSelector = selector;

					// qSA looks outside Element context, which is not what we want
					// Thanks to Andrew Dupont for this workaround technique
					// Support: IE <=8
					// Exclude object elements
					} else if ( context.nodeName.toLowerCase() !== "object" ) {

						// Capture the context ID, setting it first if necessary
						if ( (nid = context.getAttribute( "id" )) ) {
							nid = nid.replace( rescape, "\\$&" );
						} else {
							context.setAttribute( "id", (nid = expando) );
						}

						// Prefix every selector in the list
						groups = tokenize( selector );
						i = groups.length;
						nidselect = ridentifier.test( nid ) ? "#" + nid : "[id='" + nid + "']";
						while ( i-- ) {
							groups[i] = nidselect + " " + toSelector( groups[i] );
						}
						newSelector = groups.join( "," );

						// Expand context for sibling selectors
						newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
							context;
					}

					if ( newSelector ) {
						try {
							push.apply( results,
								newContext.querySelectorAll( newSelector )
							);
							return results;
						} catch ( qsaError ) {
						} finally {
							if ( nid === expando ) {
								context.removeAttribute( "id" );
							}
						}
					}
				}
			}
		}

		// All others
		return select( selector.replace( rtrim, "$1" ), context, results, seed );
	}

	/**
	 * Create key-value caches of limited size
	 * @returns {function(string, object)} Returns the Object data after storing it on itself with
	 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
	 *	deleting the oldest entry
	 */
	function createCache() {
		var keys = [];

		function cache( key, value ) {
			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			if ( keys.push( key + " " ) > Expr.cacheLength ) {
				// Only keep the most recent entries
				delete cache[ keys.shift() ];
			}
			return (cache[ key + " " ] = value);
		}
		return cache;
	}

	/**
	 * Mark a function for special use by Sizzle
	 * @param {Function} fn The function to mark
	 */
	function markFunction( fn ) {
		fn[ expando ] = true;
		return fn;
	}

	/**
	 * Support testing using an element
	 * @param {Function} fn Passed the created div and expects a boolean result
	 */
	function assert( fn ) {
		var div = document.createElement("div");

		try {
			return !!fn( div );
		} catch (e) {
			return false;
		} finally {
			// Remove from its parent by default
			if ( div.parentNode ) {
				div.parentNode.removeChild( div );
			}
			// release memory in IE
			div = null;
		}
	}

	/**
	 * Adds the same handler for all of the specified attrs
	 * @param {String} attrs Pipe-separated list of attributes
	 * @param {Function} handler The method that will be applied
	 */
	function addHandle( attrs, handler ) {
		var arr = attrs.split("|"),
			i = arr.length;

		while ( i-- ) {
			Expr.attrHandle[ arr[i] ] = handler;
		}
	}

	/**
	 * Checks document order of two siblings
	 * @param {Element} a
	 * @param {Element} b
	 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
	 */
	function siblingCheck( a, b ) {
		var cur = b && a,
			diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				( ~b.sourceIndex || MAX_NEGATIVE ) -
				( ~a.sourceIndex || MAX_NEGATIVE );

		// Use IE sourceIndex if available on both nodes
		if ( diff ) {
			return diff;
		}

		// Check if b follows a
		if ( cur ) {
			while ( (cur = cur.nextSibling) ) {
				if ( cur === b ) {
					return -1;
				}
			}
		}

		return a ? 1 : -1;
	}

	/**
	 * Returns a function to use in pseudos for input types
	 * @param {String} type
	 */
	function createInputPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for buttons
	 * @param {String} type
	 */
	function createButtonPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for positionals
	 * @param {Function} fn
	 */
	function createPositionalPseudo( fn ) {
		return markFunction(function( argument ) {
			argument = +argument;
			return markFunction(function( seed, matches ) {
				var j,
					matchIndexes = fn( [], seed.length, argument ),
					i = matchIndexes.length;

				// Match elements found at the specified indexes
				while ( i-- ) {
					if ( seed[ (j = matchIndexes[i]) ] ) {
						seed[j] = !(matches[j] = seed[j]);
					}
				}
			});
		});
	}

	/**
	 * Checks a node for validity as a Sizzle context
	 * @param {Element|Object=} context
	 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
	 */
	function testContext( context ) {
		return context && typeof context.getElementsByTagName !== "undefined" && context;
	}

	// Expose support vars for convenience
	support = Sizzle.support = {};

	/**
	 * Detects XML nodes
	 * @param {Element|Object} elem An element or a document
	 * @returns {Boolean} True iff elem is a non-HTML XML node
	 */
	isXML = Sizzle.isXML = function( elem ) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};

	/**
	 * Sets document-related variables once based on the current document
	 * @param {Element|Object} [doc] An element or document object to use to set the document
	 * @returns {Object} Returns the current document
	 */
	setDocument = Sizzle.setDocument = function( node ) {
		var hasCompare, parent,
			doc = node ? node.ownerDocument || node : preferredDoc;

		// Return early if doc is invalid or already selected
		if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
			return document;
		}

		// Update global variables
		document = doc;
		docElem = document.documentElement;
		documentIsHTML = !isXML( document );

		// Support: IE 9-11, Edge
		// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
		if ( (parent = document.defaultView) && parent.top !== parent ) {
			// Support: IE 11
			if ( parent.addEventListener ) {
				parent.addEventListener( "unload", unloadHandler, false );

			// Support: IE 9 - 10 only
			} else if ( parent.attachEvent ) {
				parent.attachEvent( "onunload", unloadHandler );
			}
		}

		/* Attributes
		---------------------------------------------------------------------- */

		// Support: IE<8
		// Verify that getAttribute really returns attributes and not properties
		// (excepting IE8 booleans)
		support.attributes = assert(function( div ) {
			div.className = "i";
			return !div.getAttribute("className");
		});

		/* getElement(s)By*
		---------------------------------------------------------------------- */

		// Check if getElementsByTagName("*") returns only elements
		support.getElementsByTagName = assert(function( div ) {
			div.appendChild( document.createComment("") );
			return !div.getElementsByTagName("*").length;
		});

		// Support: IE<9
		support.getElementsByClassName = rnative.test( document.getElementsByClassName );

		// Support: IE<10
		// Check if getElementById returns elements by name
		// The broken getElementById methods don't pick up programatically-set names,
		// so use a roundabout getElementsByName test
		support.getById = assert(function( div ) {
			docElem.appendChild( div ).id = expando;
			return !document.getElementsByName || !document.getElementsByName( expando ).length;
		});

		// ID find and filter
		if ( support.getById ) {
			Expr.find["ID"] = function( id, context ) {
				if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
					var m = context.getElementById( id );
					return m ? [ m ] : [];
				}
			};
			Expr.filter["ID"] = function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					return elem.getAttribute("id") === attrId;
				};
			};
		} else {
			// Support: IE6/7
			// getElementById is not reliable as a find shortcut
			delete Expr.find["ID"];

			Expr.filter["ID"] =  function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					var node = typeof elem.getAttributeNode !== "undefined" &&
						elem.getAttributeNode("id");
					return node && node.value === attrId;
				};
			};
		}

		// Tag
		Expr.find["TAG"] = support.getElementsByTagName ?
			function( tag, context ) {
				if ( typeof context.getElementsByTagName !== "undefined" ) {
					return context.getElementsByTagName( tag );

				// DocumentFragment nodes don't have gEBTN
				} else if ( support.qsa ) {
					return context.querySelectorAll( tag );
				}
			} :

			function( tag, context ) {
				var elem,
					tmp = [],
					i = 0,
					// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
					results = context.getElementsByTagName( tag );

				// Filter out possible comments
				if ( tag === "*" ) {
					while ( (elem = results[i++]) ) {
						if ( elem.nodeType === 1 ) {
							tmp.push( elem );
						}
					}

					return tmp;
				}
				return results;
			};

		// Class
		Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
			if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
				return context.getElementsByClassName( className );
			}
		};

		/* QSA/matchesSelector
		---------------------------------------------------------------------- */

		// QSA and matchesSelector support

		// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
		rbuggyMatches = [];

		// qSa(:focus) reports false when true (Chrome 21)
		// We allow this because of a bug in IE8/9 that throws an error
		// whenever `document.activeElement` is accessed on an iframe
		// So, we allow :focus to pass through QSA all the time to avoid the IE error
		// See http://bugs.jquery.com/ticket/13378
		rbuggyQSA = [];

		if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert(function( div ) {
				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explicitly
				// setting a boolean content attribute,
				// since its presence should be enough
				// http://bugs.jquery.com/ticket/12359
				docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
					"<select id='" + expando + "-\r\\' msallowcapture=''>" +
					"<option selected=''></option></select>";

				// Support: IE8, Opera 11-12.16
				// Nothing should be selected when empty strings follow ^= or $= or *=
				// The test attribute must be unknown in Opera but "safe" for WinRT
				// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
				if ( div.querySelectorAll("[msallowcapture^='']").length ) {
					rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
				}

				// Support: IE8
				// Boolean attributes and "value" are not treated correctly
				if ( !div.querySelectorAll("[selected]").length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
				}

				// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
				if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
					rbuggyQSA.push("~=");
				}

				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":checked").length ) {
					rbuggyQSA.push(":checked");
				}

				// Support: Safari 8+, iOS 8+
				// https://bugs.webkit.org/show_bug.cgi?id=136851
				// In-page `selector#id sibing-combinator selector` fails
				if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
					rbuggyQSA.push(".#.+[+~]");
				}
			});

			assert(function( div ) {
				// Support: Windows 8 Native Apps
				// The type and name attributes are restricted during .innerHTML assignment
				var input = document.createElement("input");
				input.setAttribute( "type", "hidden" );
				div.appendChild( input ).setAttribute( "name", "D" );

				// Support: IE8
				// Enforce case-sensitivity of name attribute
				if ( div.querySelectorAll("[name=d]").length ) {
					rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
				}

				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":enabled").length ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}

				// Opera 10-11 does not throw on post-comma invalid pseudos
				div.querySelectorAll("*,:x");
				rbuggyQSA.push(",.*:");
			});
		}

		if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
			docElem.webkitMatchesSelector ||
			docElem.mozMatchesSelector ||
			docElem.oMatchesSelector ||
			docElem.msMatchesSelector) )) ) {

			assert(function( div ) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				support.disconnectedMatch = matches.call( div, "div" );

				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call( div, "[s!='']:x" );
				rbuggyMatches.push( "!=", pseudos );
			});
		}

		rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
		rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

		/* Contains
		---------------------------------------------------------------------- */
		hasCompare = rnative.test( docElem.compareDocumentPosition );

		// Element contains another
		// Purposefully self-exclusive
		// As in, an element does not contain itself
		contains = hasCompare || rnative.test( docElem.contains ) ?
			function( a, b ) {
				var adown = a.nodeType === 9 ? a.documentElement : a,
					bup = b && b.parentNode;
				return a === bup || !!( bup && bup.nodeType === 1 && (
					adown.contains ?
						adown.contains( bup ) :
						a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
				));
			} :
			function( a, b ) {
				if ( b ) {
					while ( (b = b.parentNode) ) {
						if ( b === a ) {
							return true;
						}
					}
				}
				return false;
			};

		/* Sorting
		---------------------------------------------------------------------- */

		// Document order sorting
		sortOrder = hasCompare ?
		function( a, b ) {

			// Flag for duplicate removal
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			// Sort on method existence if only one input has compareDocumentPosition
			var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
			if ( compare ) {
				return compare;
			}

			// Calculate position if both inputs belong to the same document
			compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
				a.compareDocumentPosition( b ) :

				// Otherwise we know they are disconnected
				1;

			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		} :
		function( a, b ) {
			// Exit early if the nodes are identical
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			var cur,
				i = 0,
				aup = a.parentNode,
				bup = b.parentNode,
				ap = [ a ],
				bp = [ b ];

			// Parentless nodes are either documents or disconnected
			if ( !aup || !bup ) {
				return a === document ? -1 :
					b === document ? 1 :
					aup ? -1 :
					bup ? 1 :
					sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;

			// If the nodes are siblings, we can do a quick check
			} else if ( aup === bup ) {
				return siblingCheck( a, b );
			}

			// Otherwise we need full lists of their ancestors for comparison
			cur = a;
			while ( (cur = cur.parentNode) ) {
				ap.unshift( cur );
			}
			cur = b;
			while ( (cur = cur.parentNode) ) {
				bp.unshift( cur );
			}

			// Walk down the tree looking for a discrepancy
			while ( ap[i] === bp[i] ) {
				i++;
			}

			return i ?
				// Do a sibling check if the nodes have a common ancestor
				siblingCheck( ap[i], bp[i] ) :

				// Otherwise nodes in our document sort first
				ap[i] === preferredDoc ? -1 :
				bp[i] === preferredDoc ? 1 :
				0;
		};

		return document;
	};

	Sizzle.matches = function( expr, elements ) {
		return Sizzle( expr, null, null, elements );
	};

	Sizzle.matchesSelector = function( elem, expr ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}

		// Make sure that attribute selectors are quoted
		expr = expr.replace( rattributeQuotes, "='$1']" );

		if ( support.matchesSelector && documentIsHTML &&
			!compilerCache[ expr + " " ] &&
			( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
			( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

			try {
				var ret = matches.call( elem, expr );

				// IE 9's matchesSelector returns false on disconnected nodes
				if ( ret || support.disconnectedMatch ||
						// As well, disconnected nodes are said to be in a document
						// fragment in IE 9
						elem.document && elem.document.nodeType !== 11 ) {
					return ret;
				}
			} catch (e) {}
		}

		return Sizzle( expr, document, null, [ elem ] ).length > 0;
	};

	Sizzle.contains = function( context, elem ) {
		// Set document vars if needed
		if ( ( context.ownerDocument || context ) !== document ) {
			setDocument( context );
		}
		return contains( context, elem );
	};

	Sizzle.attr = function( elem, name ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}

		var fn = Expr.attrHandle[ name.toLowerCase() ],
			// Don't get fooled by Object.prototype properties (jQuery #13807)
			val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
				fn( elem, name, !documentIsHTML ) :
				undefined;

		return val !== undefined ?
			val :
			support.attributes || !documentIsHTML ?
				elem.getAttribute( name ) :
				(val = elem.getAttributeNode(name)) && val.specified ?
					val.value :
					null;
	};

	Sizzle.error = function( msg ) {
		throw new Error( "Syntax error, unrecognized expression: " + msg );
	};

	/**
	 * Document sorting and removing duplicates
	 * @param {ArrayLike} results
	 */
	Sizzle.uniqueSort = function( results ) {
		var elem,
			duplicates = [],
			j = 0,
			i = 0;

		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice( 0 );
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			while ( (elem = results[i++]) ) {
				if ( elem === results[ i ] ) {
					j = duplicates.push( i );
				}
			}
			while ( j-- ) {
				results.splice( duplicates[ j ], 1 );
			}
		}

		// Clear input after sorting to release objects
		// See https://github.com/jquery/sizzle/pull/225
		sortInput = null;

		return results;
	};

	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	getText = Sizzle.getText = function( elem ) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if ( !nodeType ) {
			// If no nodeType, this is expected to be an array
			while ( (node = elem[i++]) ) {
				// Do not traverse comment nodes
				ret += getText( node );
			}
		} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (jQuery #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {
				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes

		return ret;
	};

	Expr = Sizzle.selectors = {

		// Can be adjusted by the user
		cacheLength: 50,

		createPseudo: markFunction,

		match: matchExpr,

		attrHandle: {},

		find: {},

		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			"ATTR": function( match ) {
				match[1] = match[1].replace( runescape, funescape );

				// Move the given value to match[3] whether quoted or unquoted
				match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

				if ( match[2] === "~=" ) {
					match[3] = " " + match[3] + " ";
				}

				return match.slice( 0, 4 );
			},

			"CHILD": function( match ) {
				/* matches from matchExpr["CHILD"]
					1 type (only|nth|...)
					2 what (child|of-type)
					3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
					4 xn-component of xn+y argument ([+-]?\d*n|)
					5 sign of xn-component
					6 x of xn-component
					7 sign of y-component
					8 y of y-component
				*/
				match[1] = match[1].toLowerCase();

				if ( match[1].slice( 0, 3 ) === "nth" ) {
					// nth-* requires argument
					if ( !match[3] ) {
						Sizzle.error( match[0] );
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
					match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

				// other types prohibit arguments
				} else if ( match[3] ) {
					Sizzle.error( match[0] );
				}

				return match;
			},

			"PSEUDO": function( match ) {
				var excess,
					unquoted = !match[6] && match[2];

				if ( matchExpr["CHILD"].test( match[0] ) ) {
					return null;
				}

				// Accept quoted arguments as-is
				if ( match[3] ) {
					match[2] = match[4] || match[5] || "";

				// Strip excess characters from unquoted arguments
				} else if ( unquoted && rpseudo.test( unquoted ) &&
					// Get excess from tokenize (recursively)
					(excess = tokenize( unquoted, true )) &&
					// advance to the next closing parenthesis
					(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

					// excess is a negative index
					match[0] = match[0].slice( 0, excess );
					match[2] = unquoted.slice( 0, excess );
				}

				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice( 0, 3 );
			}
		},

		filter: {

			"TAG": function( nodeNameSelector ) {
				var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
				return nodeNameSelector === "*" ?
					function() { return true; } :
					function( elem ) {
						return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
					};
			},

			"CLASS": function( className ) {
				var pattern = classCache[ className + " " ];

				return pattern ||
					(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
					classCache( className, function( elem ) {
						return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
					});
			},

			"ATTR": function( name, operator, check ) {
				return function( elem ) {
					var result = Sizzle.attr( elem, name );

					if ( result == null ) {
						return operator === "!=";
					}
					if ( !operator ) {
						return true;
					}

					result += "";

					return operator === "=" ? result === check :
						operator === "!=" ? result !== check :
						operator === "^=" ? check && result.indexOf( check ) === 0 :
						operator === "*=" ? check && result.indexOf( check ) > -1 :
						operator === "$=" ? check && result.slice( -check.length ) === check :
						operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
						operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
						false;
				};
			},

			"CHILD": function( type, what, argument, first, last ) {
				var simple = type.slice( 0, 3 ) !== "nth",
					forward = type.slice( -4 ) !== "last",
					ofType = what === "of-type";

				return first === 1 && last === 0 ?

					// Shortcut for :nth-*(n)
					function( elem ) {
						return !!elem.parentNode;
					} :

					function( elem, context, xml ) {
						var cache, uniqueCache, outerCache, node, nodeIndex, start,
							dir = simple !== forward ? "nextSibling" : "previousSibling",
							parent = elem.parentNode,
							name = ofType && elem.nodeName.toLowerCase(),
							useCache = !xml && !ofType,
							diff = false;

						if ( parent ) {

							// :(first|last|only)-(child|of-type)
							if ( simple ) {
								while ( dir ) {
									node = elem;
									while ( (node = node[ dir ]) ) {
										if ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) {

											return false;
										}
									}
									// Reverse direction for :only-* (if we haven't yet done so)
									start = dir = type === "only" && !start && "nextSibling";
								}
								return true;
							}

							start = [ forward ? parent.firstChild : parent.lastChild ];

							// non-xml :nth-child(...) stores cache data on `parent`
							if ( forward && useCache ) {

								// Seek `elem` from a previously-cached index

								// ...in a gzip-friendly way
								node = parent;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex && cache[ 2 ];
								node = nodeIndex && parent.childNodes[ nodeIndex ];

								while ( (node = ++nodeIndex && node && node[ dir ] ||

									// Fallback to seeking `elem` from the start
									(diff = nodeIndex = 0) || start.pop()) ) {

									// When found, cache indexes on `parent` and break
									if ( node.nodeType === 1 && ++diff && node === elem ) {
										uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
										break;
									}
								}

							} else {
								// Use previously-cached element index if available
								if ( useCache ) {
									// ...in a gzip-friendly way
									node = elem;
									outerCache = node[ expando ] || (node[ expando ] = {});

									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[ node.uniqueID ] ||
										(outerCache[ node.uniqueID ] = {});

									cache = uniqueCache[ type ] || [];
									nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
									diff = nodeIndex;
								}

								// xml :nth-child(...)
								// or :nth-last-child(...) or :nth(-last)?-of-type(...)
								if ( diff === false ) {
									// Use the same loop as above to seek `elem` from the start
									while ( (node = ++nodeIndex && node && node[ dir ] ||
										(diff = nodeIndex = 0) || start.pop()) ) {

										if ( ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) &&
											++diff ) {

											// Cache the index of each encountered element
											if ( useCache ) {
												outerCache = node[ expando ] || (node[ expando ] = {});

												// Support: IE <9 only
												// Defend against cloned attroperties (jQuery gh-1709)
												uniqueCache = outerCache[ node.uniqueID ] ||
													(outerCache[ node.uniqueID ] = {});

												uniqueCache[ type ] = [ dirruns, diff ];
											}

											if ( node === elem ) {
												break;
											}
										}
									}
								}
							}

							// Incorporate the offset, then check against cycle size
							diff -= last;
							return diff === first || ( diff % first === 0 && diff / first >= 0 );
						}
					};
			},

			"PSEUDO": function( pseudo, argument ) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
					fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
						Sizzle.error( "unsupported pseudo: " + pseudo );

				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if ( fn[ expando ] ) {
					return fn( argument );
				}

				// But maintain support for old signatures
				if ( fn.length > 1 ) {
					args = [ pseudo, pseudo, "", argument ];
					return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
						markFunction(function( seed, matches ) {
							var idx,
								matched = fn( seed, argument ),
								i = matched.length;
							while ( i-- ) {
								idx = indexOf( seed, matched[i] );
								seed[ idx ] = !( matches[ idx ] = matched[i] );
							}
						}) :
						function( elem ) {
							return fn( elem, 0, args );
						};
				}

				return fn;
			}
		},

		pseudos: {
			// Potentially complex pseudos
			"not": markFunction(function( selector ) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
					results = [],
					matcher = compile( selector.replace( rtrim, "$1" ) );

				return matcher[ expando ] ?
					markFunction(function( seed, matches, context, xml ) {
						var elem,
							unmatched = matcher( seed, null, xml, [] ),
							i = seed.length;

						// Match elements unmatched by `matcher`
						while ( i-- ) {
							if ( (elem = unmatched[i]) ) {
								seed[i] = !(matches[i] = elem);
							}
						}
					}) :
					function( elem, context, xml ) {
						input[0] = elem;
						matcher( input, null, xml, results );
						// Don't keep the element (issue #299)
						input[0] = null;
						return !results.pop();
					};
			}),

			"has": markFunction(function( selector ) {
				return function( elem ) {
					return Sizzle( selector, elem ).length > 0;
				};
			}),

			"contains": markFunction(function( text ) {
				text = text.replace( runescape, funescape );
				return function( elem ) {
					return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
				};
			}),

			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction( function( lang ) {
				// lang value must be a valid identifier
				if ( !ridentifier.test(lang || "") ) {
					Sizzle.error( "unsupported lang: " + lang );
				}
				lang = lang.replace( runescape, funescape ).toLowerCase();
				return function( elem ) {
					var elemLang;
					do {
						if ( (elemLang = documentIsHTML ?
							elem.lang :
							elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
						}
					} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
					return false;
				};
			}),

			// Miscellaneous
			"target": function( elem ) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice( 1 ) === elem.id;
			},

			"root": function( elem ) {
				return elem === docElem;
			},

			"focus": function( elem ) {
				return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},

			// Boolean properties
			"enabled": function( elem ) {
				return elem.disabled === false;
			},

			"disabled": function( elem ) {
				return elem.disabled === true;
			},

			"checked": function( elem ) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
			},

			"selected": function( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			// Contents
			"empty": function( elem ) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
				//   but not by others (comment: 8; processing instruction: 7; etc.)
				// nodeType < 6 works because attributes (2) do not appear as children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					if ( elem.nodeType < 6 ) {
						return false;
					}
				}
				return true;
			},

			"parent": function( elem ) {
				return !Expr.pseudos["empty"]( elem );
			},

			// Element/input types
			"header": function( elem ) {
				return rheader.test( elem.nodeName );
			},

			"input": function( elem ) {
				return rinputs.test( elem.nodeName );
			},

			"button": function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"text": function( elem ) {
				var attr;
				return elem.nodeName.toLowerCase() === "input" &&
					elem.type === "text" &&

					// Support: IE<8
					// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
					( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
			},

			// Position-in-collection
			"first": createPositionalPseudo(function() {
				return [ 0 ];
			}),

			"last": createPositionalPseudo(function( matchIndexes, length ) {
				return [ length - 1 ];
			}),

			"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
				return [ argument < 0 ? argument + length : argument ];
			}),

			"even": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 0;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"odd": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 1;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; --i >= 0; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; ++i < length; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			})
		}
	};

	Expr.pseudos["nth"] = Expr.pseudos["eq"];

	// Add button/input type pseudos
	for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
		Expr.pseudos[ i ] = createInputPseudo( i );
	}
	for ( i in { submit: true, reset: true } ) {
		Expr.pseudos[ i ] = createButtonPseudo( i );
	}

	// Easy API for creating new setFilters
	function setFilters() {}
	setFilters.prototype = Expr.filters = Expr.pseudos;
	Expr.setFilters = new setFilters();

	tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
		var matched, match, tokens, type,
			soFar, groups, preFilters,
			cached = tokenCache[ selector + " " ];

		if ( cached ) {
			return parseOnly ? 0 : cached.slice( 0 );
		}

		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;

		while ( soFar ) {

			// Comma and first run
			if ( !matched || (match = rcomma.exec( soFar )) ) {
				if ( match ) {
					// Don't consume trailing commas as valid
					soFar = soFar.slice( match[0].length ) || soFar;
				}
				groups.push( (tokens = []) );
			}

			matched = false;

			// Combinators
			if ( (match = rcombinators.exec( soFar )) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					// Cast descendant combinators to space
					type: match[0].replace( rtrim, " " )
				});
				soFar = soFar.slice( matched.length );
			}

			// Filters
			for ( type in Expr.filter ) {
				if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
					(match = preFilters[ type ]( match ))) ) {
					matched = match.shift();
					tokens.push({
						value: matched,
						type: type,
						matches: match
					});
					soFar = soFar.slice( matched.length );
				}
			}

			if ( !matched ) {
				break;
			}
		}

		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		return parseOnly ?
			soFar.length :
			soFar ?
				Sizzle.error( selector ) :
				// Cache the tokens
				tokenCache( selector, groups ).slice( 0 );
	};

	function toSelector( tokens ) {
		var i = 0,
			len = tokens.length,
			selector = "";
		for ( ; i < len; i++ ) {
			selector += tokens[i].value;
		}
		return selector;
	}

	function addCombinator( matcher, combinator, base ) {
		var dir = combinator.dir,
			checkNonElements = base && dir === "parentNode",
			doneName = done++;

		return combinator.first ?
			// Check against closest ancestor/preceding element
			function( elem, context, xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						return matcher( elem, context, xml );
					}
				}
			} :

			// Check against all ancestor/preceding elements
			function( elem, context, xml ) {
				var oldCache, uniqueCache, outerCache,
					newCache = [ dirruns, doneName ];

				// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
				if ( xml ) {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							if ( matcher( elem, context, xml ) ) {
								return true;
							}
						}
					}
				} else {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							outerCache = elem[ expando ] || (elem[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

							if ( (oldCache = uniqueCache[ dir ]) &&
								oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

								// Assign to newCache so results back-propagate to previous elements
								return (newCache[ 2 ] = oldCache[ 2 ]);
							} else {
								// Reuse newcache so results back-propagate to previous elements
								uniqueCache[ dir ] = newCache;

								// A match means we're done; a fail means we have to keep checking
								if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
									return true;
								}
							}
						}
					}
				}
			};
	}

	function elementMatcher( matchers ) {
		return matchers.length > 1 ?
			function( elem, context, xml ) {
				var i = matchers.length;
				while ( i-- ) {
					if ( !matchers[i]( elem, context, xml ) ) {
						return false;
					}
				}
				return true;
			} :
			matchers[0];
	}

	function multipleContexts( selector, contexts, results ) {
		var i = 0,
			len = contexts.length;
		for ( ; i < len; i++ ) {
			Sizzle( selector, contexts[i], results );
		}
		return results;
	}

	function condense( unmatched, map, filter, context, xml ) {
		var elem,
			newUnmatched = [],
			i = 0,
			len = unmatched.length,
			mapped = map != null;

		for ( ; i < len; i++ ) {
			if ( (elem = unmatched[i]) ) {
				if ( !filter || filter( elem, context, xml ) ) {
					newUnmatched.push( elem );
					if ( mapped ) {
						map.push( i );
					}
				}
			}
		}

		return newUnmatched;
	}

	function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
		if ( postFilter && !postFilter[ expando ] ) {
			postFilter = setMatcher( postFilter );
		}
		if ( postFinder && !postFinder[ expando ] ) {
			postFinder = setMatcher( postFinder, postSelector );
		}
		return markFunction(function( seed, results, context, xml ) {
			var temp, i, elem,
				preMap = [],
				postMap = [],
				preexisting = results.length,

				// Get initial elements from seed or context
				elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

				// Prefilter to get matcher input, preserving a map for seed-results synchronization
				matcherIn = preFilter && ( seed || !selector ) ?
					condense( elems, preMap, preFilter, context, xml ) :
					elems,

				matcherOut = matcher ?
					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results :
					matcherIn;

			// Find primary matches
			if ( matcher ) {
				matcher( matcherIn, matcherOut, context, xml );
			}

			// Apply postFilter
			if ( postFilter ) {
				temp = condense( matcherOut, postMap );
				postFilter( temp, [], context, xml );

				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while ( i-- ) {
					if ( (elem = temp[i]) ) {
						matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
					}
				}
			}

			if ( seed ) {
				if ( postFinder || preFilter ) {
					if ( postFinder ) {
						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while ( i-- ) {
							if ( (elem = matcherOut[i]) ) {
								// Restore matcherIn since elem is not yet a final match
								temp.push( (matcherIn[i] = elem) );
							}
						}
						postFinder( null, (matcherOut = []), temp, xml );
					}

					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) &&
							(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

							seed[temp] = !(results[temp] = elem);
						}
					}
				}

			// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(
					matcherOut === results ?
						matcherOut.splice( preexisting, matcherOut.length ) :
						matcherOut
				);
				if ( postFinder ) {
					postFinder( null, results, matcherOut, xml );
				} else {
					push.apply( results, matcherOut );
				}
			}
		});
	}

	function matcherFromTokens( tokens ) {
		var checkContext, matcher, j,
			len = tokens.length,
			leadingRelative = Expr.relative[ tokens[0].type ],
			implicitRelative = leadingRelative || Expr.relative[" "],
			i = leadingRelative ? 1 : 0,

			// The foundational matcher ensures that elements are reachable from top-level context(s)
			matchContext = addCombinator( function( elem ) {
				return elem === checkContext;
			}, implicitRelative, true ),
			matchAnyContext = addCombinator( function( elem ) {
				return indexOf( checkContext, elem ) > -1;
			}, implicitRelative, true ),
			matchers = [ function( elem, context, xml ) {
				var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
					(checkContext = context).nodeType ?
						matchContext( elem, context, xml ) :
						matchAnyContext( elem, context, xml ) );
				// Avoid hanging onto element (issue #299)
				checkContext = null;
				return ret;
			} ];

		for ( ; i < len; i++ ) {
			if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
				matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
			} else {
				matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

				// Return special upon seeing a positional matcher
				if ( matcher[ expando ] ) {
					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for ( ; j < len; j++ ) {
						if ( Expr.relative[ tokens[j].type ] ) {
							break;
						}
					}
					return setMatcher(
						i > 1 && elementMatcher( matchers ),
						i > 1 && toSelector(
							// If the preceding token was a descendant combinator, insert an implicit any-element `*`
							tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
						).replace( rtrim, "$1" ),
						matcher,
						i < j && matcherFromTokens( tokens.slice( i, j ) ),
						j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
						j < len && toSelector( tokens )
					);
				}
				matchers.push( matcher );
			}
		}

		return elementMatcher( matchers );
	}

	function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
		var bySet = setMatchers.length > 0,
			byElement = elementMatchers.length > 0,
			superMatcher = function( seed, context, xml, results, outermost ) {
				var elem, j, matcher,
					matchedCount = 0,
					i = "0",
					unmatched = seed && [],
					setMatched = [],
					contextBackup = outermostContext,
					// We must always have either seed elements or outermost context
					elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
					// Use integer dirruns iff this is the outermost matcher
					dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
					len = elems.length;

				if ( outermost ) {
					outermostContext = context === document || context || outermost;
				}

				// Add elements passing elementMatchers directly to results
				// Support: IE<9, Safari
				// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
				for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
					if ( byElement && elem ) {
						j = 0;
						if ( !context && elem.ownerDocument !== document ) {
							setDocument( elem );
							xml = !documentIsHTML;
						}
						while ( (matcher = elementMatchers[j++]) ) {
							if ( matcher( elem, context || document, xml) ) {
								results.push( elem );
								break;
							}
						}
						if ( outermost ) {
							dirruns = dirrunsUnique;
						}
					}

					// Track unmatched elements for set filters
					if ( bySet ) {
						// They will have gone through all possible matchers
						if ( (elem = !matcher && elem) ) {
							matchedCount--;
						}

						// Lengthen the array for every element, matched or not
						if ( seed ) {
							unmatched.push( elem );
						}
					}
				}

				// `i` is now the count of elements visited above, and adding it to `matchedCount`
				// makes the latter nonnegative.
				matchedCount += i;

				// Apply set filters to unmatched elements
				// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
				// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
				// no element matchers and no seed.
				// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
				// case, which will result in a "00" `matchedCount` that differs from `i` but is also
				// numerically zero.
				if ( bySet && i !== matchedCount ) {
					j = 0;
					while ( (matcher = setMatchers[j++]) ) {
						matcher( unmatched, setMatched, context, xml );
					}

					if ( seed ) {
						// Reintegrate element matches to eliminate the need for sorting
						if ( matchedCount > 0 ) {
							while ( i-- ) {
								if ( !(unmatched[i] || setMatched[i]) ) {
									setMatched[i] = pop.call( results );
								}
							}
						}

						// Discard index placeholder values to get only actual matches
						setMatched = condense( setMatched );
					}

					// Add matches to results
					push.apply( results, setMatched );

					// Seedless set matches succeeding multiple successful matchers stipulate sorting
					if ( outermost && !seed && setMatched.length > 0 &&
						( matchedCount + setMatchers.length ) > 1 ) {

						Sizzle.uniqueSort( results );
					}
				}

				// Override manipulation of globals by nested matchers
				if ( outermost ) {
					dirruns = dirrunsUnique;
					outermostContext = contextBackup;
				}

				return unmatched;
			};

		return bySet ?
			markFunction( superMatcher ) :
			superMatcher;
	}

	compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
		var i,
			setMatchers = [],
			elementMatchers = [],
			cached = compilerCache[ selector + " " ];

		if ( !cached ) {
			// Generate a function of recursive functions that can be used to check each element
			if ( !match ) {
				match = tokenize( selector );
			}
			i = match.length;
			while ( i-- ) {
				cached = matcherFromTokens( match[i] );
				if ( cached[ expando ] ) {
					setMatchers.push( cached );
				} else {
					elementMatchers.push( cached );
				}
			}

			// Cache the compiled function
			cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

			// Save selector and tokenization
			cached.selector = selector;
		}
		return cached;
	};

	/**
	 * A low-level selection function that works with Sizzle's compiled
	 *  selector functions
	 * @param {String|Function} selector A selector or a pre-compiled
	 *  selector function built with Sizzle.compile
	 * @param {Element} context
	 * @param {Array} [results]
	 * @param {Array} [seed] A set of elements to match against
	 */
	select = Sizzle.select = function( selector, context, results, seed ) {
		var i, tokens, token, type, find,
			compiled = typeof selector === "function" && selector,
			match = !seed && tokenize( (selector = compiled.selector || selector) );

		results = results || [];

		// Try to minimize operations if there is only one selector in the list and no seed
		// (the latter of which guarantees us context)
		if ( match.length === 1 ) {

			// Reduce context if the leading compound selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;

				// Precompiled matchers will still verify ancestry, so step up a level
				} else if ( compiled ) {
					context = context.parentNode;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}

		// Compile and execute a filtering function if one is not provided
		// Provide `match` to avoid retokenization if we modified the selector above
		( compiled || compile( selector, match ) )(
			seed,
			context,
			!documentIsHTML,
			results,
			!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
		);
		return results;
	};

	// One-time assignments

	// Sort stability
	support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

	// Support: Chrome 14-35+
	// Always assume duplicates if they aren't passed to the comparison function
	support.detectDuplicates = !!hasDuplicate;

	// Initialize against the default document
	setDocument();

	// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert(function( div1 ) {
		// Should return 1, but returns 4 (following)
		return div1.compareDocumentPosition( document.createElement("div") ) & 1;
	});

	// Support: IE<8
	// Prevent attribute/property "interpolation"
	// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
	if ( !assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild.getAttribute("href") === "#" ;
	}) ) {
		addHandle( "type|href|height|width", function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
			}
		});
	}

	// Support: IE<9
	// Use defaultValue in place of getAttribute("value")
	if ( !support.attributes || !assert(function( div ) {
		div.innerHTML = "<input/>";
		div.firstChild.setAttribute( "value", "" );
		return div.firstChild.getAttribute( "value" ) === "";
	}) ) {
		addHandle( "value", function( elem, name, isXML ) {
			if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
				return elem.defaultValue;
			}
		});
	}

	// Support: IE<9
	// Use getAttributeNode to fetch booleans when getAttribute lies
	if ( !assert(function( div ) {
		return div.getAttribute("disabled") == null;
	}) ) {
		addHandle( booleans, function( elem, name, isXML ) {
			var val;
			if ( !isXML ) {
				return elem[ name ] === true ? name.toLowerCase() :
						(val = elem.getAttributeNode( name )) && val.specified ?
						val.value :
					null;
			}
		});
	}

	return Sizzle;

	})( window );



	jQuery.find = Sizzle;
	jQuery.expr = Sizzle.selectors;
	jQuery.expr[ ":" ] = jQuery.expr.pseudos;
	jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
	jQuery.text = Sizzle.getText;
	jQuery.isXMLDoc = Sizzle.isXML;
	jQuery.contains = Sizzle.contains;



	var dir = function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	};


	var siblings = function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	};


	var rneedsContext = jQuery.expr.match.needsContext;

	var rsingleTag = ( /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/ );



	var risSimple = /^.[^:#\[\.,]*$/;

	// Implement the identical functionality for filter and not
	function winnow( elements, qualifier, not ) {
		if ( jQuery.isFunction( qualifier ) ) {
			return jQuery.grep( elements, function( elem, i ) {
				/* jshint -W018 */
				return !!qualifier.call( elem, i, elem ) !== not;
			} );

		}

		if ( qualifier.nodeType ) {
			return jQuery.grep( elements, function( elem ) {
				return ( elem === qualifier ) !== not;
			} );

		}

		if ( typeof qualifier === "string" ) {
			if ( risSimple.test( qualifier ) ) {
				return jQuery.filter( qualifier, elements, not );
			}

			qualifier = jQuery.filter( qualifier, elements );
		}

		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	jQuery.filter = function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			} ) );
	};

	jQuery.fn.extend( {
		find: function( selector ) {
			var i,
				len = this.length,
				ret = [],
				self = this;

			if ( typeof selector !== "string" ) {
				return this.pushStack( jQuery( selector ).filter( function() {
					for ( i = 0; i < len; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				} ) );
			}

			for ( i = 0; i < len; i++ ) {
				jQuery.find( selector, self[ i ], ret );
			}

			// Needed because $( selector, context ) becomes $( context ).find( selector )
			ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
			ret.selector = this.selector ? this.selector + " " + selector : selector;
			return ret;
		},
		filter: function( selector ) {
			return this.pushStack( winnow( this, selector || [], false ) );
		},
		not: function( selector ) {
			return this.pushStack( winnow( this, selector || [], true ) );
		},
		is: function( selector ) {
			return !!winnow(
				this,

				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				typeof selector === "string" && rneedsContext.test( selector ) ?
					jQuery( selector ) :
					selector || [],
				false
			).length;
		}
	} );


	// Initialize a jQuery object


	// A central reference to the root jQuery(document)
	var rootjQuery,

		// A simple way to check for HTML strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
		// Strict HTML recognition (#11290: must start with <)
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

		init = jQuery.fn.init = function( selector, context, root ) {
			var match, elem;

			// HANDLE: $(""), $(null), $(undefined), $(false)
			if ( !selector ) {
				return this;
			}

			// Method init() accepts an alternate rootjQuery
			// so migrate can support jQuery.sub (gh-2101)
			root = root || rootjQuery;

			// Handle HTML strings
			if ( typeof selector === "string" ) {
				if ( selector[ 0 ] === "<" &&
					selector[ selector.length - 1 ] === ">" &&
					selector.length >= 3 ) {

					// Assume that strings that start and end with <> are HTML and skip the regex check
					match = [ null, selector, null ];

				} else {
					match = rquickExpr.exec( selector );
				}

				// Match html or make sure no context is specified for #id
				if ( match && ( match[ 1 ] || !context ) ) {

					// HANDLE: $(html) -> $(array)
					if ( match[ 1 ] ) {
						context = context instanceof jQuery ? context[ 0 ] : context;

						// Option to run scripts is true for back-compat
						// Intentionally let the error be thrown if parseHTML is not present
						jQuery.merge( this, jQuery.parseHTML(
							match[ 1 ],
							context && context.nodeType ? context.ownerDocument || context : document,
							true
						) );

						// HANDLE: $(html, props)
						if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
							for ( match in context ) {

								// Properties of context are called as methods if possible
								if ( jQuery.isFunction( this[ match ] ) ) {
									this[ match ]( context[ match ] );

								// ...and otherwise set as attributes
								} else {
									this.attr( match, context[ match ] );
								}
							}
						}

						return this;

					// HANDLE: $(#id)
					} else {
						elem = document.getElementById( match[ 2 ] );

						// Support: Blackberry 4.6
						// gEBID returns nodes no longer in the document (#6963)
						if ( elem && elem.parentNode ) {

							// Inject the element directly into the jQuery object
							this.length = 1;
							this[ 0 ] = elem;
						}

						this.context = document;
						this.selector = selector;
						return this;
					}

				// HANDLE: $(expr, $(...))
				} else if ( !context || context.jquery ) {
					return ( context || root ).find( selector );

				// HANDLE: $(expr, context)
				// (which is just equivalent to: $(context).find(expr)
				} else {
					return this.constructor( context ).find( selector );
				}

			// HANDLE: $(DOMElement)
			} else if ( selector.nodeType ) {
				this.context = this[ 0 ] = selector;
				this.length = 1;
				return this;

			// HANDLE: $(function)
			// Shortcut for document ready
			} else if ( jQuery.isFunction( selector ) ) {
				return root.ready !== undefined ?
					root.ready( selector ) :

					// Execute immediately if ready is not present
					selector( jQuery );
			}

			if ( selector.selector !== undefined ) {
				this.selector = selector.selector;
				this.context = selector.context;
			}

			return jQuery.makeArray( selector, this );
		};

	// Give the init function the jQuery prototype for later instantiation
	init.prototype = jQuery.fn;

	// Initialize central reference
	rootjQuery = jQuery( document );


	var rparentsprev = /^(?:parents|prev(?:Until|All))/,

		// Methods guaranteed to produce a unique set when starting from a unique set
		guaranteedUnique = {
			children: true,
			contents: true,
			next: true,
			prev: true
		};

	jQuery.fn.extend( {
		has: function( target ) {
			var targets = jQuery( target, this ),
				l = targets.length;

			return this.filter( function() {
				var i = 0;
				for ( ; i < l; i++ ) {
					if ( jQuery.contains( this, targets[ i ] ) ) {
						return true;
					}
				}
			} );
		},

		closest: function( selectors, context ) {
			var cur,
				i = 0,
				l = this.length,
				matched = [],
				pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
					jQuery( selectors, context || this.context ) :
					0;

			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( pos ?
						pos.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}

			return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
		},

		// Determine the position of an element within the set
		index: function( elem ) {

			// No argument, return index in parent
			if ( !elem ) {
				return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
			}

			// Index in selector
			if ( typeof elem === "string" ) {
				return indexOf.call( jQuery( elem ), this[ 0 ] );
			}

			// Locate the position of the desired element
			return indexOf.call( this,

				// If it receives a jQuery object, the first element is used
				elem.jquery ? elem[ 0 ] : elem
			);
		},

		add: function( selector, context ) {
			return this.pushStack(
				jQuery.uniqueSort(
					jQuery.merge( this.get(), jQuery( selector, context ) )
				)
			);
		},

		addBack: function( selector ) {
			return this.add( selector == null ?
				this.prevObject : this.prevObject.filter( selector )
			);
		}
	} );

	function sibling( cur, dir ) {
		while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
		return cur;
	}

	jQuery.each( {
		parent: function( elem ) {
			var parent = elem.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function( elem ) {
			return dir( elem, "parentNode" );
		},
		parentsUntil: function( elem, i, until ) {
			return dir( elem, "parentNode", until );
		},
		next: function( elem ) {
			return sibling( elem, "nextSibling" );
		},
		prev: function( elem ) {
			return sibling( elem, "previousSibling" );
		},
		nextAll: function( elem ) {
			return dir( elem, "nextSibling" );
		},
		prevAll: function( elem ) {
			return dir( elem, "previousSibling" );
		},
		nextUntil: function( elem, i, until ) {
			return dir( elem, "nextSibling", until );
		},
		prevUntil: function( elem, i, until ) {
			return dir( elem, "previousSibling", until );
		},
		siblings: function( elem ) {
			return siblings( ( elem.parentNode || {} ).firstChild, elem );
		},
		children: function( elem ) {
			return siblings( elem.firstChild );
		},
		contents: function( elem ) {
			return elem.contentDocument || jQuery.merge( [], elem.childNodes );
		}
	}, function( name, fn ) {
		jQuery.fn[ name ] = function( until, selector ) {
			var matched = jQuery.map( this, fn, until );

			if ( name.slice( -5 ) !== "Until" ) {
				selector = until;
			}

			if ( selector && typeof selector === "string" ) {
				matched = jQuery.filter( selector, matched );
			}

			if ( this.length > 1 ) {

				// Remove duplicates
				if ( !guaranteedUnique[ name ] ) {
					jQuery.uniqueSort( matched );
				}

				// Reverse order for parents* and prev-derivatives
				if ( rparentsprev.test( name ) ) {
					matched.reverse();
				}
			}

			return this.pushStack( matched );
		};
	} );
	var rnotwhite = ( /\S+/g );



	// Convert String-formatted options into Object-formatted ones
	function createOptions( options ) {
		var object = {};
		jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
			object[ flag ] = true;
		} );
		return object;
	}

	/*
	 * Create a callback list using the following parameters:
	 *
	 *	options: an optional list of space-separated options that will change how
	 *			the callback list behaves or a more traditional option object
	 *
	 * By default a callback list will act like an event callback list and can be
	 * "fired" multiple times.
	 *
	 * Possible options:
	 *
	 *	once:			will ensure the callback list can only be fired once (like a Deferred)
	 *
	 *	memory:			will keep track of previous values and will call any callback added
	 *					after the list has been fired right away with the latest "memorized"
	 *					values (like a Deferred)
	 *
	 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
	 *
	 *	stopOnFalse:	interrupt callings when a callback returns false
	 *
	 */
	jQuery.Callbacks = function( options ) {

		// Convert options from String-formatted to Object-formatted if needed
		// (we check in cache first)
		options = typeof options === "string" ?
			createOptions( options ) :
			jQuery.extend( {}, options );

		var // Flag to know if list is currently firing
			firing,

			// Last fire value for non-forgettable lists
			memory,

			// Flag to know if list was already fired
			fired,

			// Flag to prevent firing
			locked,

			// Actual callback list
			list = [],

			// Queue of execution data for repeatable lists
			queue = [],

			// Index of currently firing callback (modified by add/remove as needed)
			firingIndex = -1,

			// Fire callbacks
			fire = function() {

				// Enforce single-firing
				locked = options.once;

				// Execute callbacks for all pending executions,
				// respecting firingIndex overrides and runtime changes
				fired = firing = true;
				for ( ; queue.length; firingIndex = -1 ) {
					memory = queue.shift();
					while ( ++firingIndex < list.length ) {

						// Run callback and check for early termination
						if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
							options.stopOnFalse ) {

							// Jump to end and forget the data so .add doesn't re-fire
							firingIndex = list.length;
							memory = false;
						}
					}
				}

				// Forget the data if we're done with it
				if ( !options.memory ) {
					memory = false;
				}

				firing = false;

				// Clean up if we're done firing for good
				if ( locked ) {

					// Keep an empty list if we have data for future add calls
					if ( memory ) {
						list = [];

					// Otherwise, this object is spent
					} else {
						list = "";
					}
				}
			},

			// Actual Callbacks object
			self = {

				// Add a callback or a collection of callbacks to the list
				add: function() {
					if ( list ) {

						// If we have memory from a past run, we should fire after adding
						if ( memory && !firing ) {
							firingIndex = list.length - 1;
							queue.push( memory );
						}

						( function add( args ) {
							jQuery.each( args, function( _, arg ) {
								if ( jQuery.isFunction( arg ) ) {
									if ( !options.unique || !self.has( arg ) ) {
										list.push( arg );
									}
								} else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {

									// Inspect recursively
									add( arg );
								}
							} );
						} )( arguments );

						if ( memory && !firing ) {
							fire();
						}
					}
					return this;
				},

				// Remove a callback from the list
				remove: function() {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );

							// Handle firing indexes
							if ( index <= firingIndex ) {
								firingIndex--;
							}
						}
					} );
					return this;
				},

				// Check if a given callback is in the list.
				// If no argument is given, return whether or not list has callbacks attached.
				has: function( fn ) {
					return fn ?
						jQuery.inArray( fn, list ) > -1 :
						list.length > 0;
				},

				// Remove all callbacks from the list
				empty: function() {
					if ( list ) {
						list = [];
					}
					return this;
				},

				// Disable .fire and .add
				// Abort any current/pending executions
				// Clear all callbacks and values
				disable: function() {
					locked = queue = [];
					list = memory = "";
					return this;
				},
				disabled: function() {
					return !list;
				},

				// Disable .fire
				// Also disable .add unless we have memory (since it would have no effect)
				// Abort any pending executions
				lock: function() {
					locked = queue = [];
					if ( !memory ) {
						list = memory = "";
					}
					return this;
				},
				locked: function() {
					return !!locked;
				},

				// Call all callbacks with the given context and arguments
				fireWith: function( context, args ) {
					if ( !locked ) {
						args = args || [];
						args = [ context, args.slice ? args.slice() : args ];
						queue.push( args );
						if ( !firing ) {
							fire();
						}
					}
					return this;
				},

				// Call all the callbacks with the given arguments
				fire: function() {
					self.fireWith( this, arguments );
					return this;
				},

				// To know if the callbacks have already been called at least once
				fired: function() {
					return !!fired;
				}
			};

		return self;
	};


	jQuery.extend( {

		Deferred: function( func ) {
			var tuples = [

					// action, add listener, listener list, final state
					[ "resolve", "done", jQuery.Callbacks( "once memory" ), "resolved" ],
					[ "reject", "fail", jQuery.Callbacks( "once memory" ), "rejected" ],
					[ "notify", "progress", jQuery.Callbacks( "memory" ) ]
				],
				state = "pending",
				promise = {
					state: function() {
						return state;
					},
					always: function() {
						deferred.done( arguments ).fail( arguments );
						return this;
					},
					then: function( /* fnDone, fnFail, fnProgress */ ) {
						var fns = arguments;
						return jQuery.Deferred( function( newDefer ) {
							jQuery.each( tuples, function( i, tuple ) {
								var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];

								// deferred[ done | fail | progress ] for forwarding actions to newDefer
								deferred[ tuple[ 1 ] ]( function() {
									var returned = fn && fn.apply( this, arguments );
									if ( returned && jQuery.isFunction( returned.promise ) ) {
										returned.promise()
											.progress( newDefer.notify )
											.done( newDefer.resolve )
											.fail( newDefer.reject );
									} else {
										newDefer[ tuple[ 0 ] + "With" ](
											this === promise ? newDefer.promise() : this,
											fn ? [ returned ] : arguments
										);
									}
								} );
							} );
							fns = null;
						} ).promise();
					},

					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
						return obj != null ? jQuery.extend( obj, promise ) : promise;
					}
				},
				deferred = {};

			// Keep pipe for back-compat
			promise.pipe = promise.then;

			// Add list-specific methods
			jQuery.each( tuples, function( i, tuple ) {
				var list = tuple[ 2 ],
					stateString = tuple[ 3 ];

				// promise[ done | fail | progress ] = list.add
				promise[ tuple[ 1 ] ] = list.add;

				// Handle state
				if ( stateString ) {
					list.add( function() {

						// state = [ resolved | rejected ]
						state = stateString;

					// [ reject_list | resolve_list ].disable; progress_list.lock
					}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
				}

				// deferred[ resolve | reject | notify ]
				deferred[ tuple[ 0 ] ] = function() {
					deferred[ tuple[ 0 ] + "With" ]( this === deferred ? promise : this, arguments );
					return this;
				};
				deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
			} );

			// Make the deferred a promise
			promise.promise( deferred );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
		},

		// Deferred helper
		when: function( subordinate /* , ..., subordinateN */ ) {
			var i = 0,
				resolveValues = slice.call( arguments ),
				length = resolveValues.length,

				// the count of uncompleted subordinates
				remaining = length !== 1 ||
					( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

				// the master Deferred.
				// If resolveValues consist of only a single Deferred, just use that.
				deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

				// Update function for both resolve and progress values
				updateFunc = function( i, contexts, values ) {
					return function( value ) {
						contexts[ i ] = this;
						values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
						if ( values === progressValues ) {
							deferred.notifyWith( contexts, values );
						} else if ( !( --remaining ) ) {
							deferred.resolveWith( contexts, values );
						}
					};
				},

				progressValues, progressContexts, resolveContexts;

			// Add listeners to Deferred subordinates; treat others as resolved
			if ( length > 1 ) {
				progressValues = new Array( length );
				progressContexts = new Array( length );
				resolveContexts = new Array( length );
				for ( ; i < length; i++ ) {
					if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
						resolveValues[ i ].promise()
							.progress( updateFunc( i, progressContexts, progressValues ) )
							.done( updateFunc( i, resolveContexts, resolveValues ) )
							.fail( deferred.reject );
					} else {
						--remaining;
					}
				}
			}

			// If we're not waiting on anything, resolve the master
			if ( !remaining ) {
				deferred.resolveWith( resolveContexts, resolveValues );
			}

			return deferred.promise();
		}
	} );


	// The deferred used on DOM ready
	var readyList;

	jQuery.fn.ready = function( fn ) {

		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	};

	jQuery.extend( {

		// Is the DOM ready to be used? Set to true once it occurs.
		isReady: false,

		// A counter to track how many items to wait for before
		// the ready event fires. See #6781
		readyWait: 1,

		// Hold (or release) the ready event
		holdReady: function( hold ) {
			if ( hold ) {
				jQuery.readyWait++;
			} else {
				jQuery.ready( true );
			}
		},

		// Handle when the DOM is ready
		ready: function( wait ) {

			// Abort if there are pending holds or we're already ready
			if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
				return;
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If a normal DOM Ready event fired, decrement, and wait if need be
			if ( wait !== true && --jQuery.readyWait > 0 ) {
				return;
			}

			// If there are functions bound, to execute
			readyList.resolveWith( document, [ jQuery ] );

			// Trigger any bound ready events
			if ( jQuery.fn.triggerHandler ) {
				jQuery( document ).triggerHandler( "ready" );
				jQuery( document ).off( "ready" );
			}
		}
	} );

	/**
	 * The ready event handler and self cleanup method
	 */
	function completed() {
		document.removeEventListener( "DOMContentLoaded", completed );
		window.removeEventListener( "load", completed );
		jQuery.ready();
	}

	jQuery.ready.promise = function( obj ) {
		if ( !readyList ) {

			readyList = jQuery.Deferred();

			// Catch cases where $(document).ready() is called
			// after the browser event has already occurred.
			// Support: IE9-10 only
			// Older IE sometimes signals "interactive" too soon
			if ( document.readyState === "complete" ||
				( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

				// Handle it asynchronously to allow scripts the opportunity to delay ready
				window.setTimeout( jQuery.ready );

			} else {

				// Use the handy event callback
				document.addEventListener( "DOMContentLoaded", completed );

				// A fallback to window.onload, that will always work
				window.addEventListener( "load", completed );
			}
		}
		return readyList.promise( obj );
	};

	// Kick off the DOM ready check even if the user does not
	jQuery.ready.promise();




	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			len = elems.length,
			bulk = key == null;

		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				access( elems, fn, i, key[ i ], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {

				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < len; i++ ) {
					fn(
						elems[ i ], key, raw ?
						value :
						value.call( elems[ i ], i, fn( elems[ i ], key ) )
					);
				}
			}
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				len ? fn( elems[ 0 ], key ) : emptyGet;
	};
	var acceptData = function( owner ) {

		// Accepts only:
		//  - Node
		//    - Node.ELEMENT_NODE
		//    - Node.DOCUMENT_NODE
		//  - Object
		//    - Any
		/* jshint -W018 */
		return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
	};




	function Data() {
		this.expando = jQuery.expando + Data.uid++;
	}

	Data.uid = 1;

	Data.prototype = {

		register: function( owner, initial ) {
			var value = initial || {};

			// If it is a node unlikely to be stringify-ed or looped over
			// use plain assignment
			if ( owner.nodeType ) {
				owner[ this.expando ] = value;

			// Otherwise secure it in a non-enumerable, non-writable property
			// configurability must be true to allow the property to be
			// deleted with the delete operator
			} else {
				Object.defineProperty( owner, this.expando, {
					value: value,
					writable: true,
					configurable: true
				} );
			}
			return owner[ this.expando ];
		},
		cache: function( owner ) {

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( !acceptData( owner ) ) {
				return {};
			}

			// Check if the owner object already has a cache
			var value = owner[ this.expando ];

			// If not, create one
			if ( !value ) {
				value = {};

				// We can accept data for non-element nodes in modern browsers,
				// but we should not, see #8335.
				// Always return an empty object.
				if ( acceptData( owner ) ) {

					// If it is a node unlikely to be stringify-ed or looped over
					// use plain assignment
					if ( owner.nodeType ) {
						owner[ this.expando ] = value;

					// Otherwise secure it in a non-enumerable property
					// configurable must be true to allow the property to be
					// deleted when data is removed
					} else {
						Object.defineProperty( owner, this.expando, {
							value: value,
							configurable: true
						} );
					}
				}
			}

			return value;
		},
		set: function( owner, data, value ) {
			var prop,
				cache = this.cache( owner );

			// Handle: [ owner, key, value ] args
			if ( typeof data === "string" ) {
				cache[ data ] = value;

			// Handle: [ owner, { properties } ] args
			} else {

				// Copy the properties one-by-one to the cache object
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
			return cache;
		},
		get: function( owner, key ) {
			return key === undefined ?
				this.cache( owner ) :
				owner[ this.expando ] && owner[ this.expando ][ key ];
		},
		access: function( owner, key, value ) {
			var stored;

			// In cases where either:
			//
			//   1. No key was specified
			//   2. A string key was specified, but no value provided
			//
			// Take the "read" path and allow the get method to determine
			// which value to return, respectively either:
			//
			//   1. The entire cache object
			//   2. The data stored at the key
			//
			if ( key === undefined ||
					( ( key && typeof key === "string" ) && value === undefined ) ) {

				stored = this.get( owner, key );

				return stored !== undefined ?
					stored : this.get( owner, jQuery.camelCase( key ) );
			}

			// When the key is not a string, or both a key and value
			// are specified, set or extend (existing objects) with either:
			//
			//   1. An object of properties
			//   2. A key and value
			//
			this.set( owner, key, value );

			// Since the "set" path can have two possible entry points
			// return the expected data based on which path was taken[*]
			return value !== undefined ? value : key;
		},
		remove: function( owner, key ) {
			var i, name, camel,
				cache = owner[ this.expando ];

			if ( cache === undefined ) {
				return;
			}

			if ( key === undefined ) {
				this.register( owner );

			} else {

				// Support array or space separated string of keys
				if ( jQuery.isArray( key ) ) {

					// If "name" is an array of keys...
					// When data is initially created, via ("key", "val") signature,
					// keys will be converted to camelCase.
					// Since there is no way to tell _how_ a key was added, remove
					// both plain key and camelCase key. #12786
					// This will only penalize the array argument path.
					name = key.concat( key.map( jQuery.camelCase ) );
				} else {
					camel = jQuery.camelCase( key );

					// Try the string as a key before any manipulation
					if ( key in cache ) {
						name = [ key, camel ];
					} else {

						// If a key with the spaces exists, use it.
						// Otherwise, create an array by matching non-whitespace
						name = camel;
						name = name in cache ?
							[ name ] : ( name.match( rnotwhite ) || [] );
					}
				}

				i = name.length;

				while ( i-- ) {
					delete cache[ name[ i ] ];
				}
			}

			// Remove the expando if there's no more data
			if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

				// Support: Chrome <= 35-45+
				// Webkit & Blink performance suffers when deleting properties
				// from DOM nodes, so set to undefined instead
				// https://code.google.com/p/chromium/issues/detail?id=378607
				if ( owner.nodeType ) {
					owner[ this.expando ] = undefined;
				} else {
					delete owner[ this.expando ];
				}
			}
		},
		hasData: function( owner ) {
			var cache = owner[ this.expando ];
			return cache !== undefined && !jQuery.isEmptyObject( cache );
		}
	};
	var dataPriv = new Data();

	var dataUser = new Data();



	//	Implementation Summary
	//
	//	1. Enforce API surface and semantic compatibility with 1.9.x branch
	//	2. Improve the module's maintainability by reducing the storage
	//		paths to a single mechanism.
	//	3. Use the same single mechanism to support "private" and "user" data.
	//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	//	5. Avoid exposing implementation details on user objects (eg. expando properties)
	//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

	var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
		rmultiDash = /[A-Z]/g;

	function dataAttr( elem, key, data ) {
		var name;

		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {
			name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
			data = elem.getAttribute( name );

			if ( typeof data === "string" ) {
				try {
					data = data === "true" ? true :
						data === "false" ? false :
						data === "null" ? null :

						// Only convert to a number if it doesn't change the string
						+data + "" === data ? +data :
						rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
				} catch ( e ) {}

				// Make sure we set the data so it isn't changed later
				dataUser.set( elem, key, data );
			} else {
				data = undefined;
			}
		}
		return data;
	}

	jQuery.extend( {
		hasData: function( elem ) {
			return dataUser.hasData( elem ) || dataPriv.hasData( elem );
		},

		data: function( elem, name, data ) {
			return dataUser.access( elem, name, data );
		},

		removeData: function( elem, name ) {
			dataUser.remove( elem, name );
		},

		// TODO: Now that all calls to _data and _removeData have been replaced
		// with direct calls to dataPriv methods, these can be deprecated.
		_data: function( elem, name, data ) {
			return dataPriv.access( elem, name, data );
		},

		_removeData: function( elem, name ) {
			dataPriv.remove( elem, name );
		}
	} );

	jQuery.fn.extend( {
		data: function( key, value ) {
			var i, name, data,
				elem = this[ 0 ],
				attrs = elem && elem.attributes;

			// Gets all values
			if ( key === undefined ) {
				if ( this.length ) {
					data = dataUser.get( elem );

					if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
						i = attrs.length;
						while ( i-- ) {

							// Support: IE11+
							// The attrs elements can be null (#14894)
							if ( attrs[ i ] ) {
								name = attrs[ i ].name;
								if ( name.indexOf( "data-" ) === 0 ) {
									name = jQuery.camelCase( name.slice( 5 ) );
									dataAttr( elem, name, data[ name ] );
								}
							}
						}
						dataPriv.set( elem, "hasDataAttrs", true );
					}
				}

				return data;
			}

			// Sets multiple values
			if ( typeof key === "object" ) {
				return this.each( function() {
					dataUser.set( this, key );
				} );
			}

			return access( this, function( value ) {
				var data, camelKey;

				// The calling jQuery object (element matches) is not empty
				// (and therefore has an element appears at this[ 0 ]) and the
				// `value` parameter was not undefined. An empty jQuery object
				// will result in `undefined` for elem = this[ 0 ] which will
				// throw an exception if an attempt to read a data cache is made.
				if ( elem && value === undefined ) {

					// Attempt to get data from the cache
					// with the key as-is
					data = dataUser.get( elem, key ) ||

						// Try to find dashed key if it exists (gh-2779)
						// This is for 2.2.x only
						dataUser.get( elem, key.replace( rmultiDash, "-$&" ).toLowerCase() );

					if ( data !== undefined ) {
						return data;
					}

					camelKey = jQuery.camelCase( key );

					// Attempt to get data from the cache
					// with the key camelized
					data = dataUser.get( elem, camelKey );
					if ( data !== undefined ) {
						return data;
					}

					// Attempt to "discover" the data in
					// HTML5 custom data-* attrs
					data = dataAttr( elem, camelKey, undefined );
					if ( data !== undefined ) {
						return data;
					}

					// We tried really hard, but the data doesn't exist.
					return;
				}

				// Set the data...
				camelKey = jQuery.camelCase( key );
				this.each( function() {

					// First, attempt to store a copy or reference of any
					// data that might've been store with a camelCased key.
					var data = dataUser.get( this, camelKey );

					// For HTML5 data-* attribute interop, we have to
					// store property names with dashes in a camelCase form.
					// This might not apply to all properties...*
					dataUser.set( this, camelKey, value );

					// *... In the case of properties that might _actually_
					// have dashes, we need to also store a copy of that
					// unchanged property.
					if ( key.indexOf( "-" ) > -1 && data !== undefined ) {
						dataUser.set( this, key, value );
					}
				} );
			}, null, value, arguments.length > 1, null, true );
		},

		removeData: function( key ) {
			return this.each( function() {
				dataUser.remove( this, key );
			} );
		}
	} );


	jQuery.extend( {
		queue: function( elem, type, data ) {
			var queue;

			if ( elem ) {
				type = ( type || "fx" ) + "queue";
				queue = dataPriv.get( elem, type );

				// Speed up dequeue by getting out quickly if this is just a lookup
				if ( data ) {
					if ( !queue || jQuery.isArray( data ) ) {
						queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
					} else {
						queue.push( data );
					}
				}
				return queue || [];
			}
		},

		dequeue: function( elem, type ) {
			type = type || "fx";

			var queue = jQuery.queue( elem, type ),
				startLength = queue.length,
				fn = queue.shift(),
				hooks = jQuery._queueHooks( elem, type ),
				next = function() {
					jQuery.dequeue( elem, type );
				};

			// If the fx queue is dequeued, always remove the progress sentinel
			if ( fn === "inprogress" ) {
				fn = queue.shift();
				startLength--;
			}

			if ( fn ) {

				// Add a progress sentinel to prevent the fx queue from being
				// automatically dequeued
				if ( type === "fx" ) {
					queue.unshift( "inprogress" );
				}

				// Clear up the last queue stop function
				delete hooks.stop;
				fn.call( elem, next, hooks );
			}

			if ( !startLength && hooks ) {
				hooks.empty.fire();
			}
		},

		// Not public - generate a queueHooks object, or return the current one
		_queueHooks: function( elem, type ) {
			var key = type + "queueHooks";
			return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
				empty: jQuery.Callbacks( "once memory" ).add( function() {
					dataPriv.remove( elem, [ type + "queue", key ] );
				} )
			} );
		}
	} );

	jQuery.fn.extend( {
		queue: function( type, data ) {
			var setter = 2;

			if ( typeof type !== "string" ) {
				data = type;
				type = "fx";
				setter--;
			}

			if ( arguments.length < setter ) {
				return jQuery.queue( this[ 0 ], type );
			}

			return data === undefined ?
				this :
				this.each( function() {
					var queue = jQuery.queue( this, type, data );

					// Ensure a hooks for this queue
					jQuery._queueHooks( this, type );

					if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
						jQuery.dequeue( this, type );
					}
				} );
		},
		dequeue: function( type ) {
			return this.each( function() {
				jQuery.dequeue( this, type );
			} );
		},
		clearQueue: function( type ) {
			return this.queue( type || "fx", [] );
		},

		// Get a promise resolved when queues of a certain type
		// are emptied (fx is the type by default)
		promise: function( type, obj ) {
			var tmp,
				count = 1,
				defer = jQuery.Deferred(),
				elements = this,
				i = this.length,
				resolve = function() {
					if ( !( --count ) ) {
						defer.resolveWith( elements, [ elements ] );
					}
				};

			if ( typeof type !== "string" ) {
				obj = type;
				type = undefined;
			}
			type = type || "fx";

			while ( i-- ) {
				tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
				if ( tmp && tmp.empty ) {
					count++;
					tmp.empty.add( resolve );
				}
			}
			resolve();
			return defer.promise( obj );
		}
	} );
	var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

	var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


	var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

	var isHidden = function( elem, el ) {

			// isHidden might be called from jQuery#filter function;
			// in that case, element will be second argument
			elem = el || elem;
			return jQuery.css( elem, "display" ) === "none" ||
				!jQuery.contains( elem.ownerDocument, elem );
		};



	function adjustCSS( elem, prop, valueParts, tween ) {
		var adjusted,
			scale = 1,
			maxIterations = 20,
			currentValue = tween ?
				function() { return tween.cur(); } :
				function() { return jQuery.css( elem, prop, "" ); },
			initial = currentValue(),
			unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

			// Starting value computation is required for potential unit mismatches
			initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
				rcssNum.exec( jQuery.css( elem, prop ) );

		if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

			// Trust units reported by jQuery.css
			unit = unit || initialInUnit[ 3 ];

			// Make sure we update the tween properties later on
			valueParts = valueParts || [];

			// Iteratively approximate from a nonzero starting point
			initialInUnit = +initial || 1;

			do {

				// If previous iteration zeroed out, double until we get *something*.
				// Use string for doubling so we don't accidentally see scale as unchanged below
				scale = scale || ".5";

				// Adjust and apply
				initialInUnit = initialInUnit / scale;
				jQuery.style( elem, prop, initialInUnit + unit );

			// Update scale, tolerating zero or NaN from tween.cur()
			// Break the loop if scale is unchanged or perfect, or if we've just had enough.
			} while (
				scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
			);
		}

		if ( valueParts ) {
			initialInUnit = +initialInUnit || +initial || 0;

			// Apply relative offset (+=/-=) if specified
			adjusted = valueParts[ 1 ] ?
				initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
				+valueParts[ 2 ];
			if ( tween ) {
				tween.unit = unit;
				tween.start = initialInUnit;
				tween.end = adjusted;
			}
		}
		return adjusted;
	}
	var rcheckableType = ( /^(?:checkbox|radio)$/i );

	var rtagName = ( /<([\w:-]+)/ );

	var rscriptType = ( /^$|\/(?:java|ecma)script/i );



	// We have to close these tags to support XHTML (#13200)
	var wrapMap = {

		// Support: IE9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		// XHTML parsers do not magically insert elements in the
		// same way that tag soup parsers do. So we cannot shorten
		// this by omitting <tbody> or other required elements.
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

	// Support: IE9
	wrapMap.optgroup = wrapMap.option;

	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;


	function getAll( context, tag ) {

		// Support: IE9-11+
		// Use typeof to avoid zero-argument method invocation on host objects (#15151)
		var ret = typeof context.getElementsByTagName !== "undefined" ?
				context.getElementsByTagName( tag || "*" ) :
				typeof context.querySelectorAll !== "undefined" ?
					context.querySelectorAll( tag || "*" ) :
				[];

		return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
			jQuery.merge( [ context ], ret ) :
			ret;
	}


	// Mark scripts as having already been evaluated
	function setGlobalEval( elems, refElements ) {
		var i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			dataPriv.set(
				elems[ i ],
				"globalEval",
				!refElements || dataPriv.get( refElements[ i ], "globalEval" )
			);
		}
	}


	var rhtml = /<|&#?\w+;/;

	function buildFragment( elems, context, scripts, selection, ignored ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {

					// Support: Android<4.1, PhantomJS<2
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: Android<4.1, PhantomJS<2
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( ( elem = nodes[ i++ ] ) ) {

			// Skip elements already in the context collection (trac-4087)
			if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
				if ( ignored ) {
					ignored.push( elem );
				}
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( ( elem = tmp[ j++ ] ) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	}


	( function() {
		var fragment = document.createDocumentFragment(),
			div = fragment.appendChild( document.createElement( "div" ) ),
			input = document.createElement( "input" );

		// Support: Android 4.0-4.3, Safari<=5.1
		// Check state lost if the name is set (#11217)
		// Support: Windows Web Apps (WWA)
		// `name` and `type` must use .setAttribute for WWA (#14901)
		input.setAttribute( "type", "radio" );
		input.setAttribute( "checked", "checked" );
		input.setAttribute( "name", "t" );

		div.appendChild( input );

		// Support: Safari<=5.1, Android<4.2
		// Older WebKit doesn't clone checked state correctly in fragments
		support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

		// Support: IE<=11+
		// Make sure textarea (and checkbox) defaultValue is properly cloned
		div.innerHTML = "<textarea>x</textarea>";
		support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
	} )();


	var
		rkeyEvent = /^key/,
		rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
		rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

	function returnTrue() {
		return true;
	}

	function returnFalse() {
		return false;
	}

	// Support: IE9
	// See #13393 for more info
	function safeActiveElement() {
		try {
			return document.activeElement;
		} catch ( err ) { }
	}

	function on( elem, types, selector, data, fn, one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {

			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {

				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				on( elem, type, selector, data, types[ type ], one );
			}
			return elem;
		}

		if ( data == null && fn == null ) {

			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {

				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {

				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return elem;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {

				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};

			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return elem.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		} );
	}

	/*
	 * Helper functions for managing events -- not part of the public interface.
	 * Props to Dean Edwards' addEvent library for many of the ideas.
	 */
	jQuery.event = {

		global: {},

		add: function( elem, types, handler, data, selector ) {

			var handleObjIn, eventHandle, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.get( elem );

			// Don't attach events to noData or text/comment nodes (but allow plain objects)
			if ( !elemData ) {
				return;
			}

			// Caller can pass in an object of custom data in lieu of the handler
			if ( handler.handler ) {
				handleObjIn = handler;
				handler = handleObjIn.handler;
				selector = handleObjIn.selector;
			}

			// Make sure that the handler has a unique ID, used to find/remove it later
			if ( !handler.guid ) {
				handler.guid = jQuery.guid++;
			}

			// Init the element's event structure and main handler, if this is the first
			if ( !( events = elemData.events ) ) {
				events = elemData.events = {};
			}
			if ( !( eventHandle = elemData.handle ) ) {
				eventHandle = elemData.handle = function( e ) {

					// Discard the second event of a jQuery.event.trigger() and
					// when an event is called after a page has unloaded
					return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
						jQuery.event.dispatch.apply( elem, arguments ) : undefined;
				};
			}

			// Handle multiple events separated by a space
			types = ( types || "" ).match( rnotwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// There *must* be a type, no attaching namespace-only handlers
				if ( !type ) {
					continue;
				}

				// If event changes its type, use the special event handlers for the changed type
				special = jQuery.event.special[ type ] || {};

				// If selector defined, determine special event api type, otherwise given type
				type = ( selector ? special.delegateType : special.bindType ) || type;

				// Update special based on newly reset type
				special = jQuery.event.special[ type ] || {};

				// handleObj is passed to all event handlers
				handleObj = jQuery.extend( {
					type: type,
					origType: origType,
					data: data,
					handler: handler,
					guid: handler.guid,
					selector: selector,
					needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
					namespace: namespaces.join( "." )
				}, handleObjIn );

				// Init the event handler queue if we're the first
				if ( !( handlers = events[ type ] ) ) {
					handlers = events[ type ] = [];
					handlers.delegateCount = 0;

					// Only use addEventListener if the special events handler returns false
					if ( !special.setup ||
						special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

						if ( elem.addEventListener ) {
							elem.addEventListener( type, eventHandle );
						}
					}
				}

				if ( special.add ) {
					special.add.call( elem, handleObj );

					if ( !handleObj.handler.guid ) {
						handleObj.handler.guid = handler.guid;
					}
				}

				// Add to the element's handler list, delegates in front
				if ( selector ) {
					handlers.splice( handlers.delegateCount++, 0, handleObj );
				} else {
					handlers.push( handleObj );
				}

				// Keep track of which events have ever been used, for event optimization
				jQuery.event.global[ type ] = true;
			}

		},

		// Detach an event or set of events from an element
		remove: function( elem, types, handler, selector, mappedTypes ) {

			var j, origCount, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

			if ( !elemData || !( events = elemData.events ) ) {
				return;
			}

			// Once for each type.namespace in types; type may be omitted
			types = ( types || "" ).match( rnotwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// Unbind all events (on this namespace, if provided) for the element
				if ( !type ) {
					for ( type in events ) {
						jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
					}
					continue;
				}

				special = jQuery.event.special[ type ] || {};
				type = ( selector ? special.delegateType : special.bindType ) || type;
				handlers = events[ type ] || [];
				tmp = tmp[ 2 ] &&
					new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

				// Remove matching events
				origCount = j = handlers.length;
				while ( j-- ) {
					handleObj = handlers[ j ];

					if ( ( mappedTypes || origType === handleObj.origType ) &&
						( !handler || handler.guid === handleObj.guid ) &&
						( !tmp || tmp.test( handleObj.namespace ) ) &&
						( !selector || selector === handleObj.selector ||
							selector === "**" && handleObj.selector ) ) {
						handlers.splice( j, 1 );

						if ( handleObj.selector ) {
							handlers.delegateCount--;
						}
						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}
				}

				// Remove generic event handler if we removed something and no more handlers exist
				// (avoids potential for endless recursion during removal of special event handlers)
				if ( origCount && !handlers.length ) {
					if ( !special.teardown ||
						special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

						jQuery.removeEvent( elem, type, elemData.handle );
					}

					delete events[ type ];
				}
			}

			// Remove data and the expando if it's no longer used
			if ( jQuery.isEmptyObject( events ) ) {
				dataPriv.remove( elem, "handle events" );
			}
		},

		dispatch: function( event ) {

			// Make a writable jQuery.Event from the native event object
			event = jQuery.event.fix( event );

			var i, j, ret, matched, handleObj,
				handlerQueue = [],
				args = slice.call( arguments ),
				handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
				special = jQuery.event.special[ event.type ] || {};

			// Use the fix-ed jQuery.Event rather than the (read-only) native event
			args[ 0 ] = event;
			event.delegateTarget = this;

			// Call the preDispatch hook for the mapped type, and let it bail if desired
			if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
				return;
			}

			// Determine handlers
			handlerQueue = jQuery.event.handlers.call( this, event, handlers );

			// Run delegates first; they may want to stop propagation beneath us
			i = 0;
			while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
				event.currentTarget = matched.elem;

				j = 0;
				while ( ( handleObj = matched.handlers[ j++ ] ) &&
					!event.isImmediatePropagationStopped() ) {

					// Triggered event must either 1) have no namespace, or 2) have namespace(s)
					// a subset or equal to those in the bound event (both can have no namespace).
					if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

						event.handleObj = handleObj;
						event.data = handleObj.data;

						ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
							handleObj.handler ).apply( matched.elem, args );

						if ( ret !== undefined ) {
							if ( ( event.result = ret ) === false ) {
								event.preventDefault();
								event.stopPropagation();
							}
						}
					}
				}
			}

			// Call the postDispatch hook for the mapped type
			if ( special.postDispatch ) {
				special.postDispatch.call( this, event );
			}

			return event.result;
		},

		handlers: function( event, handlers ) {
			var i, matches, sel, handleObj,
				handlerQueue = [],
				delegateCount = handlers.delegateCount,
				cur = event.target;

			// Support (at least): Chrome, IE9
			// Find delegate handlers
			// Black-hole SVG <use> instance trees (#13180)
			//
			// Support: Firefox<=42+
			// Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
			if ( delegateCount && cur.nodeType &&
				( event.type !== "click" || isNaN( event.button ) || event.button < 1 ) ) {

				for ( ; cur !== this; cur = cur.parentNode || this ) {

					// Don't check non-elements (#13208)
					// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
					if ( cur.nodeType === 1 && ( cur.disabled !== true || event.type !== "click" ) ) {
						matches = [];
						for ( i = 0; i < delegateCount; i++ ) {
							handleObj = handlers[ i ];

							// Don't conflict with Object.prototype properties (#13203)
							sel = handleObj.selector + " ";

							if ( matches[ sel ] === undefined ) {
								matches[ sel ] = handleObj.needsContext ?
									jQuery( sel, this ).index( cur ) > -1 :
									jQuery.find( sel, this, null, [ cur ] ).length;
							}
							if ( matches[ sel ] ) {
								matches.push( handleObj );
							}
						}
						if ( matches.length ) {
							handlerQueue.push( { elem: cur, handlers: matches } );
						}
					}
				}
			}

			// Add the remaining (directly-bound) handlers
			if ( delegateCount < handlers.length ) {
				handlerQueue.push( { elem: this, handlers: handlers.slice( delegateCount ) } );
			}

			return handlerQueue;
		},

		// Includes some event props shared by KeyEvent and MouseEvent
		props: ( "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase " +
			"metaKey relatedTarget shiftKey target timeStamp view which" ).split( " " ),

		fixHooks: {},

		keyHooks: {
			props: "char charCode key keyCode".split( " " ),
			filter: function( event, original ) {

				// Add which for key events
				if ( event.which == null ) {
					event.which = original.charCode != null ? original.charCode : original.keyCode;
				}

				return event;
			}
		},

		mouseHooks: {
			props: ( "button buttons clientX clientY offsetX offsetY pageX pageY " +
				"screenX screenY toElement" ).split( " " ),
			filter: function( event, original ) {
				var eventDoc, doc, body,
					button = original.button;

				// Calculate pageX/Y if missing and clientX/Y available
				if ( event.pageX == null && original.clientX != null ) {
					eventDoc = event.target.ownerDocument || document;
					doc = eventDoc.documentElement;
					body = eventDoc.body;

					event.pageX = original.clientX +
						( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
						( doc && doc.clientLeft || body && body.clientLeft || 0 );
					event.pageY = original.clientY +
						( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
						( doc && doc.clientTop  || body && body.clientTop  || 0 );
				}

				// Add which for click: 1 === left; 2 === middle; 3 === right
				// Note: button is not normalized, so don't use it
				if ( !event.which && button !== undefined ) {
					event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
				}

				return event;
			}
		},

		fix: function( event ) {
			if ( event[ jQuery.expando ] ) {
				return event;
			}

			// Create a writable copy of the event object and normalize some properties
			var i, prop, copy,
				type = event.type,
				originalEvent = event,
				fixHook = this.fixHooks[ type ];

			if ( !fixHook ) {
				this.fixHooks[ type ] = fixHook =
					rmouseEvent.test( type ) ? this.mouseHooks :
					rkeyEvent.test( type ) ? this.keyHooks :
					{};
			}
			copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

			event = new jQuery.Event( originalEvent );

			i = copy.length;
			while ( i-- ) {
				prop = copy[ i ];
				event[ prop ] = originalEvent[ prop ];
			}

			// Support: Cordova 2.5 (WebKit) (#13255)
			// All events should have a target; Cordova deviceready doesn't
			if ( !event.target ) {
				event.target = document;
			}

			// Support: Safari 6.0+, Chrome<28
			// Target should not be a text node (#504, #13143)
			if ( event.target.nodeType === 3 ) {
				event.target = event.target.parentNode;
			}

			return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
		},

		special: {
			load: {

				// Prevent triggered image.load events from bubbling to window.load
				noBubble: true
			},
			focus: {

				// Fire native event if possible so blur/focus sequence is correct
				trigger: function() {
					if ( this !== safeActiveElement() && this.focus ) {
						this.focus();
						return false;
					}
				},
				delegateType: "focusin"
			},
			blur: {
				trigger: function() {
					if ( this === safeActiveElement() && this.blur ) {
						this.blur();
						return false;
					}
				},
				delegateType: "focusout"
			},
			click: {

				// For checkbox, fire native event so checked state will be right
				trigger: function() {
					if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
						this.click();
						return false;
					}
				},

				// For cross-browser consistency, don't fire native .click() on links
				_default: function( event ) {
					return jQuery.nodeName( event.target, "a" );
				}
			},

			beforeunload: {
				postDispatch: function( event ) {

					// Support: Firefox 20+
					// Firefox doesn't alert if the returnValue field is not set.
					if ( event.result !== undefined && event.originalEvent ) {
						event.originalEvent.returnValue = event.result;
					}
				}
			}
		}
	};

	jQuery.removeEvent = function( elem, type, handle ) {

		// This "if" is needed for plain objects
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle );
		}
	};

	jQuery.Event = function( src, props ) {

		// Allow instantiation without the 'new' keyword
		if ( !( this instanceof jQuery.Event ) ) {
			return new jQuery.Event( src, props );
		}

		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = src.defaultPrevented ||
					src.defaultPrevented === undefined &&

					// Support: Android<4.0
					src.returnValue === false ?
				returnTrue :
				returnFalse;

		// Event type
		} else {
			this.type = src;
		}

		// Put explicitly provided properties onto the event object
		if ( props ) {
			jQuery.extend( this, props );
		}

		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || jQuery.now();

		// Mark it as fixed
		this[ jQuery.expando ] = true;
	};

	// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
	// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	jQuery.Event.prototype = {
		constructor: jQuery.Event,
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse,

		preventDefault: function() {
			var e = this.originalEvent;

			this.isDefaultPrevented = returnTrue;

			if ( e ) {
				e.preventDefault();
			}
		},
		stopPropagation: function() {
			var e = this.originalEvent;

			this.isPropagationStopped = returnTrue;

			if ( e ) {
				e.stopPropagation();
			}
		},
		stopImmediatePropagation: function() {
			var e = this.originalEvent;

			this.isImmediatePropagationStopped = returnTrue;

			if ( e ) {
				e.stopImmediatePropagation();
			}

			this.stopPropagation();
		}
	};

	// Create mouseenter/leave events using mouseover/out and event-time checks
	// so that event delegation works in jQuery.
	// Do the same for pointerenter/pointerleave and pointerover/pointerout
	//
	// Support: Safari 7 only
	// Safari sends mouseenter too often; see:
	// https://code.google.com/p/chromium/issues/detail?id=470258
	// for the description of the bug (it existed in older Chrome versions as well).
	jQuery.each( {
		mouseenter: "mouseover",
		mouseleave: "mouseout",
		pointerenter: "pointerover",
		pointerleave: "pointerout"
	}, function( orig, fix ) {
		jQuery.event.special[ orig ] = {
			delegateType: fix,
			bindType: fix,

			handle: function( event ) {
				var ret,
					target = this,
					related = event.relatedTarget,
					handleObj = event.handleObj;

				// For mouseenter/leave call the handler if related is outside the target.
				// NB: No relatedTarget if the mouse left/entered the browser window
				if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
					event.type = handleObj.origType;
					ret = handleObj.handler.apply( this, arguments );
					event.type = fix;
				}
				return ret;
			}
		};
	} );

	jQuery.fn.extend( {
		on: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn );
		},
		one: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn, 1 );
		},
		off: function( types, selector, fn ) {
			var handleObj, type;
			if ( types && types.preventDefault && types.handleObj ) {

				// ( event )  dispatched jQuery.Event
				handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
					handleObj.namespace ?
						handleObj.origType + "." + handleObj.namespace :
						handleObj.origType,
					handleObj.selector,
					handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {

				// ( types-object [, selector] )
				for ( type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {

				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each( function() {
				jQuery.event.remove( this, types, fn, selector );
			} );
		}
	} );


	var
		rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,

		// Support: IE 10-11, Edge 10240+
		// In IE/Edge using regex groups here causes severe slowdowns.
		// See https://connect.microsoft.com/IE/feedback/details/1736512/
		rnoInnerhtml = /<script|<style|<link/i,

		// checked="checked" or checked
		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
		rscriptTypeMasked = /^true\/(.*)/,
		rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

	// Manipulating tables requires a tbody
	function manipulationTarget( elem, content ) {
		return jQuery.nodeName( elem, "table" ) &&
			jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

			elem.getElementsByTagName( "tbody" )[ 0 ] ||
				elem.appendChild( elem.ownerDocument.createElement( "tbody" ) ) :
			elem;
	}

	// Replace/restore the type attribute of script elements for safe DOM manipulation
	function disableScript( elem ) {
		elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
		return elem;
	}
	function restoreScript( elem ) {
		var match = rscriptTypeMasked.exec( elem.type );

		if ( match ) {
			elem.type = match[ 1 ];
		} else {
			elem.removeAttribute( "type" );
		}

		return elem;
	}

	function cloneCopyEvent( src, dest ) {
		var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

		if ( dest.nodeType !== 1 ) {
			return;
		}

		// 1. Copy private data: events, handlers, etc.
		if ( dataPriv.hasData( src ) ) {
			pdataOld = dataPriv.access( src );
			pdataCur = dataPriv.set( dest, pdataOld );
			events = pdataOld.events;

			if ( events ) {
				delete pdataCur.handle;
				pdataCur.events = {};

				for ( type in events ) {
					for ( i = 0, l = events[ type ].length; i < l; i++ ) {
						jQuery.event.add( dest, type, events[ type ][ i ] );
					}
				}
			}
		}

		// 2. Copy user data
		if ( dataUser.hasData( src ) ) {
			udataOld = dataUser.access( src );
			udataCur = jQuery.extend( {}, udataOld );

			dataUser.set( dest, udataCur );
		}
	}

	// Fix IE bugs, see support tests
	function fixInput( src, dest ) {
		var nodeName = dest.nodeName.toLowerCase();

		// Fails to persist the checked state of a cloned checkbox or radio button.
		if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
			dest.checked = src.checked;

		// Fails to return the selected option to the default selected state when cloning options
		} else if ( nodeName === "input" || nodeName === "textarea" ) {
			dest.defaultValue = src.defaultValue;
		}
	}

	function domManip( collection, args, callback, ignored ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = collection.length,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return collection.each( function( index ) {
				var self = collection.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				domManip( self, args, callback, ignored );
			} );
		}

		if ( l ) {
			fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			// Require either new content or an interest in ignored elements to invoke the callback
			if ( first || ignored ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item
				// instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {

							// Support: Android<4.1, PhantomJS<2
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( collection[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!dataPriv.access( node, "globalEval" ) &&
							jQuery.contains( doc, node ) ) {

							if ( node.src ) {

								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return collection;
	}

	function remove( elem, selector, keepData ) {
		var node,
			nodes = selector ? jQuery.filter( selector, elem ) : elem,
			i = 0;

		for ( ; ( node = nodes[ i ] ) != null; i++ ) {
			if ( !keepData && node.nodeType === 1 ) {
				jQuery.cleanData( getAll( node ) );
			}

			if ( node.parentNode ) {
				if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
					setGlobalEval( getAll( node, "script" ) );
				}
				node.parentNode.removeChild( node );
			}
		}

		return elem;
	}

	jQuery.extend( {
		htmlPrefilter: function( html ) {
			return html.replace( rxhtmlTag, "<$1></$2>" );
		},

		clone: function( elem, dataAndEvents, deepDataAndEvents ) {
			var i, l, srcElements, destElements,
				clone = elem.cloneNode( true ),
				inPage = jQuery.contains( elem.ownerDocument, elem );

			// Fix IE cloning issues
			if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
					!jQuery.isXMLDoc( elem ) ) {

				// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
				destElements = getAll( clone );
				srcElements = getAll( elem );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					fixInput( srcElements[ i ], destElements[ i ] );
				}
			}

			// Copy the events from the original to the clone
			if ( dataAndEvents ) {
				if ( deepDataAndEvents ) {
					srcElements = srcElements || getAll( elem );
					destElements = destElements || getAll( clone );

					for ( i = 0, l = srcElements.length; i < l; i++ ) {
						cloneCopyEvent( srcElements[ i ], destElements[ i ] );
					}
				} else {
					cloneCopyEvent( elem, clone );
				}
			}

			// Preserve script evaluation history
			destElements = getAll( clone, "script" );
			if ( destElements.length > 0 ) {
				setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
			}

			// Return the cloned set
			return clone;
		},

		cleanData: function( elems ) {
			var data, elem, type,
				special = jQuery.event.special,
				i = 0;

			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				if ( acceptData( elem ) ) {
					if ( ( data = elem[ dataPriv.expando ] ) ) {
						if ( data.events ) {
							for ( type in data.events ) {
								if ( special[ type ] ) {
									jQuery.event.remove( elem, type );

								// This is a shortcut to avoid jQuery.event.remove's overhead
								} else {
									jQuery.removeEvent( elem, type, data.handle );
								}
							}
						}

						// Support: Chrome <= 35-45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataPriv.expando ] = undefined;
					}
					if ( elem[ dataUser.expando ] ) {

						// Support: Chrome <= 35-45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataUser.expando ] = undefined;
					}
				}
			}
		}
	} );

	jQuery.fn.extend( {

		// Keep domManip exposed until 3.0 (gh-2225)
		domManip: domManip,

		detach: function( selector ) {
			return remove( this, selector, true );
		},

		remove: function( selector ) {
			return remove( this, selector );
		},

		text: function( value ) {
			return access( this, function( value ) {
				return value === undefined ?
					jQuery.text( this ) :
					this.empty().each( function() {
						if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
							this.textContent = value;
						}
					} );
			}, null, value, arguments.length );
		},

		append: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.appendChild( elem );
				}
			} );
		},

		prepend: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.insertBefore( elem, target.firstChild );
				}
			} );
		},

		before: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this );
				}
			} );
		},

		after: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this.nextSibling );
				}
			} );
		},

		empty: function() {
			var elem,
				i = 0;

			for ( ; ( elem = this[ i ] ) != null; i++ ) {
				if ( elem.nodeType === 1 ) {

					// Prevent memory leaks
					jQuery.cleanData( getAll( elem, false ) );

					// Remove any remaining nodes
					elem.textContent = "";
				}
			}

			return this;
		},

		clone: function( dataAndEvents, deepDataAndEvents ) {
			dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
			deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

			return this.map( function() {
				return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
			} );
		},

		html: function( value ) {
			return access( this, function( value ) {
				var elem = this[ 0 ] || {},
					i = 0,
					l = this.length;

				if ( value === undefined && elem.nodeType === 1 ) {
					return elem.innerHTML;
				}

				// See if we can take a shortcut and just use innerHTML
				if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
					!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

					value = jQuery.htmlPrefilter( value );

					try {
						for ( ; i < l; i++ ) {
							elem = this[ i ] || {};

							// Remove element nodes and prevent memory leaks
							if ( elem.nodeType === 1 ) {
								jQuery.cleanData( getAll( elem, false ) );
								elem.innerHTML = value;
							}
						}

						elem = 0;

					// If using innerHTML throws an exception, use the fallback method
					} catch ( e ) {}
				}

				if ( elem ) {
					this.empty().append( value );
				}
			}, null, value, arguments.length );
		},

		replaceWith: function() {
			var ignored = [];

			// Make the changes, replacing each non-ignored context element with the new content
			return domManip( this, arguments, function( elem ) {
				var parent = this.parentNode;

				if ( jQuery.inArray( this, ignored ) < 0 ) {
					jQuery.cleanData( getAll( this ) );
					if ( parent ) {
						parent.replaceChild( elem, this );
					}
				}

			// Force callback invocation
			}, ignored );
		}
	} );

	jQuery.each( {
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var elems,
				ret = [],
				insert = jQuery( selector ),
				last = insert.length - 1,
				i = 0;

			for ( ; i <= last; i++ ) {
				elems = i === last ? this : this.clone( true );
				jQuery( insert[ i ] )[ original ]( elems );

				// Support: QtWebKit
				// .get() because push.apply(_, arraylike) throws
				push.apply( ret, elems.get() );
			}

			return this.pushStack( ret );
		};
	} );


	var iframe,
		elemdisplay = {

			// Support: Firefox
			// We have to pre-define these values for FF (#10227)
			HTML: "block",
			BODY: "block"
		};

	/**
	 * Retrieve the actual display of a element
	 * @param {String} name nodeName of the element
	 * @param {Object} doc Document object
	 */

	// Called only from within defaultDisplay
	function actualDisplay( name, doc ) {
		var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

			display = jQuery.css( elem[ 0 ], "display" );

		// We don't have any data stored on the element,
		// so use "detach" method as fast way to get rid of the element
		elem.detach();

		return display;
	}

	/**
	 * Try to determine the default display value of an element
	 * @param {String} nodeName
	 */
	function defaultDisplay( nodeName ) {
		var doc = document,
			display = elemdisplay[ nodeName ];

		if ( !display ) {
			display = actualDisplay( nodeName, doc );

			// If the simple way fails, read from inside an iframe
			if ( display === "none" || !display ) {

				// Use the already-created iframe if possible
				iframe = ( iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" ) )
					.appendTo( doc.documentElement );

				// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
				doc = iframe[ 0 ].contentDocument;

				// Support: IE
				doc.write();
				doc.close();

				display = actualDisplay( nodeName, doc );
				iframe.detach();
			}

			// Store the correct default display
			elemdisplay[ nodeName ] = display;
		}

		return display;
	}
	var rmargin = ( /^margin/ );

	var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

	var getStyles = function( elem ) {

			// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
			// IE throws on elements created in popups
			// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
			var view = elem.ownerDocument.defaultView;

			if ( !view || !view.opener ) {
				view = window;
			}

			return view.getComputedStyle( elem );
		};

	var swap = function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	};


	var documentElement = document.documentElement;



	( function() {
		var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal,
			container = document.createElement( "div" ),
			div = document.createElement( "div" );

		// Finish early in limited (non-browser) environments
		if ( !div.style ) {
			return;
		}

		// Support: IE9-11+
		// Style of cloned element affects source element cloned (#8908)
		div.style.backgroundClip = "content-box";
		div.cloneNode( true ).style.backgroundClip = "";
		support.clearCloneStyle = div.style.backgroundClip === "content-box";

		container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
			"padding:0;margin-top:1px;position:absolute";
		container.appendChild( div );

		// Executing both pixelPosition & boxSizingReliable tests require only one layout
		// so they're executed at the same time to save the second computation.
		function computeStyleTests() {
			div.style.cssText =

				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;" +
				"position:relative;display:block;" +
				"margin:auto;border:1px;padding:1px;" +
				"top:1%;width:50%";
			div.innerHTML = "";
			documentElement.appendChild( container );

			var divStyle = window.getComputedStyle( div );
			pixelPositionVal = divStyle.top !== "1%";
			reliableMarginLeftVal = divStyle.marginLeft === "2px";
			boxSizingReliableVal = divStyle.width === "4px";

			// Support: Android 4.0 - 4.3 only
			// Some styles come back with percentage values, even though they shouldn't
			div.style.marginRight = "50%";
			pixelMarginRightVal = divStyle.marginRight === "4px";

			documentElement.removeChild( container );
		}

		jQuery.extend( support, {
			pixelPosition: function() {

				// This test is executed only once but we still do memoizing
				// since we can use the boxSizingReliable pre-computing.
				// No need to check if the test was already performed, though.
				computeStyleTests();
				return pixelPositionVal;
			},
			boxSizingReliable: function() {
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return boxSizingReliableVal;
			},
			pixelMarginRight: function() {

				// Support: Android 4.0-4.3
				// We're checking for boxSizingReliableVal here instead of pixelMarginRightVal
				// since that compresses better and they're computed together anyway.
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return pixelMarginRightVal;
			},
			reliableMarginLeft: function() {

				// Support: IE <=8 only, Android 4.0 - 4.3 only, Firefox <=3 - 37
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return reliableMarginLeftVal;
			},
			reliableMarginRight: function() {

				// Support: Android 2.3
				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// This support function is only executed once so no memoizing is needed.
				var ret,
					marginDiv = div.appendChild( document.createElement( "div" ) );

				// Reset CSS: box-sizing; display; margin; border; padding
				marginDiv.style.cssText = div.style.cssText =

					// Support: Android 2.3
					// Vendor-prefix box-sizing
					"-webkit-box-sizing:content-box;box-sizing:content-box;" +
					"display:block;margin:0;border:0;padding:0";
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";
				documentElement.appendChild( container );

				ret = !parseFloat( window.getComputedStyle( marginDiv ).marginRight );

				documentElement.removeChild( container );
				div.removeChild( marginDiv );

				return ret;
			}
		} );
	} )();


	function curCSS( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;

		computed = computed || getStyles( elem );
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;

		// Support: Opera 12.1x only
		// Fall back to style even without computed
		// computed is undefined for elems on document fragments
		if ( ( ret === "" || ret === undefined ) && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: IE9
		// getPropertyValue is only needed for .css('filter') (#12537)
		if ( computed ) {

			// A tribute to the "awesome hack by Dean Edwards"
			// Android Browser returns percentage for some values,
			// but width seems to be reliably pixels.
			// This is against the CSSOM draft spec:
			// http://dev.w3.org/csswg/cssom/#resolved-values
			if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret !== undefined ?

			// Support: IE9-11+
			// IE returns zIndex value as an integer.
			ret + "" :
			ret;
	}


	function addGetHookIf( conditionFn, hookFn ) {

		// Define the hook, we'll check on the first run if it's really needed.
		return {
			get: function() {
				if ( conditionFn() ) {

					// Hook not needed (or it's not possible to use it due
					// to missing dependency), remove it.
					delete this.get;
					return;
				}

				// Hook needed; redefine it so that the support test is not executed again.
				return ( this.get = hookFn ).apply( this, arguments );
			}
		};
	}


	var

		// Swappable if display is none or starts with table
		// except "table", "table-cell", or "table-caption"
		// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
		rdisplayswap = /^(none|table(?!-c[ea]).+)/,

		cssShow = { position: "absolute", visibility: "hidden", display: "block" },
		cssNormalTransform = {
			letterSpacing: "0",
			fontWeight: "400"
		},

		cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],
		emptyStyle = document.createElement( "div" ).style;

	// Return a css property mapped to a potentially vendor prefixed property
	function vendorPropName( name ) {

		// Shortcut for names that are not vendor prefixed
		if ( name in emptyStyle ) {
			return name;
		}

		// Check for vendor prefixed names
		var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
			i = cssPrefixes.length;

		while ( i-- ) {
			name = cssPrefixes[ i ] + capName;
			if ( name in emptyStyle ) {
				return name;
			}
		}
	}

	function setPositiveNumber( elem, value, subtract ) {

		// Any relative (+/-) values have already been
		// normalized at this point
		var matches = rcssNum.exec( value );
		return matches ?

			// Guard against undefined "subtract", e.g., when used as in cssHooks
			Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
			value;
	}

	function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
		var i = extra === ( isBorderBox ? "border" : "content" ) ?

			// If we already have the right measurement, avoid augmentation
			4 :

			// Otherwise initialize for horizontal or vertical properties
			name === "width" ? 1 : 0,

			val = 0;

		for ( ; i < 4; i += 2 ) {

			// Both box models exclude margin, so add it if we want it
			if ( extra === "margin" ) {
				val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
			}

			if ( isBorderBox ) {

				// border-box includes padding, so remove it if we want content
				if ( extra === "content" ) {
					val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
				}

				// At this point, extra isn't border nor margin, so remove border
				if ( extra !== "margin" ) {
					val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			} else {

				// At this point, extra isn't content, so add padding
				val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

				// At this point, extra isn't content nor padding, so add border
				if ( extra !== "padding" ) {
					val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			}
		}

		return val;
	}

	function getWidthOrHeight( elem, name, extra ) {

		// Start with offset property, which is equivalent to the border-box value
		var valueIsBorderBox = true,
			val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
			styles = getStyles( elem ),
			isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

		// Support: IE11 only
		// In IE 11 fullscreen elements inside of an iframe have
		// 100x too small dimensions (gh-1764).
		if ( document.msFullscreenElement && window.top !== window ) {

			// Support: IE11 only
			// Running getBoundingClientRect on a disconnected node
			// in IE throws an error.
			if ( elem.getClientRects().length ) {
				val = Math.round( elem.getBoundingClientRect()[ name ] * 100 );
			}
		}

		// Some non-html elements return undefined for offsetWidth, so check for null/undefined
		// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
		// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
		if ( val <= 0 || val == null ) {

			// Fall back to computed then uncomputed css if necessary
			val = curCSS( elem, name, styles );
			if ( val < 0 || val == null ) {
				val = elem.style[ name ];
			}

			// Computed unit is not pixels. Stop here and return.
			if ( rnumnonpx.test( val ) ) {
				return val;
			}

			// Check for style in case a browser which returns unreliable values
			// for getComputedStyle silently falls back to the reliable elem.style
			valueIsBorderBox = isBorderBox &&
				( support.boxSizingReliable() || val === elem.style[ name ] );

			// Normalize "", auto, and prepare for extra
			val = parseFloat( val ) || 0;
		}

		// Use the active box-sizing model to add/subtract irrelevant styles
		return ( val +
			augmentWidthOrHeight(
				elem,
				name,
				extra || ( isBorderBox ? "border" : "content" ),
				valueIsBorderBox,
				styles
			)
		) + "px";
	}

	function showHide( elements, show ) {
		var display, elem, hidden,
			values = [],
			index = 0,
			length = elements.length;

		for ( ; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}

			values[ index ] = dataPriv.get( elem, "olddisplay" );
			display = elem.style.display;
			if ( show ) {

				// Reset the inline display of this element to learn if it is
				// being hidden by cascaded rules or not
				if ( !values[ index ] && display === "none" ) {
					elem.style.display = "";
				}

				// Set elements which have been overridden with display: none
				// in a stylesheet to whatever the default browser style is
				// for such an element
				if ( elem.style.display === "" && isHidden( elem ) ) {
					values[ index ] = dataPriv.access(
						elem,
						"olddisplay",
						defaultDisplay( elem.nodeName )
					);
				}
			} else {
				hidden = isHidden( elem );

				if ( display !== "none" || !hidden ) {
					dataPriv.set(
						elem,
						"olddisplay",
						hidden ? display : jQuery.css( elem, "display" )
					);
				}
			}
		}

		// Set the display of most of the elements in a second loop
		// to avoid the constant reflow
		for ( index = 0; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}
			if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
				elem.style.display = show ? values[ index ] || "" : "none";
			}
		}

		return elements;
	}

	jQuery.extend( {

		// Add in style property hooks for overriding the default
		// behavior of getting and setting a style property
		cssHooks: {
			opacity: {
				get: function( elem, computed ) {
					if ( computed ) {

						// We should always get a number back from opacity
						var ret = curCSS( elem, "opacity" );
						return ret === "" ? "1" : ret;
					}
				}
			}
		},

		// Don't automatically add "px" to these possibly-unitless properties
		cssNumber: {
			"animationIterationCount": true,
			"columnCount": true,
			"fillOpacity": true,
			"flexGrow": true,
			"flexShrink": true,
			"fontWeight": true,
			"lineHeight": true,
			"opacity": true,
			"order": true,
			"orphans": true,
			"widows": true,
			"zIndex": true,
			"zoom": true
		},

		// Add in properties whose names you wish to fix before
		// setting or getting the value
		cssProps: {
			"float": "cssFloat"
		},

		// Get and set the style property on a DOM Node
		style: function( elem, name, value, extra ) {

			// Don't set styles on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
				return;
			}

			// Make sure that we're working with the right name
			var ret, type, hooks,
				origName = jQuery.camelCase( name ),
				style = elem.style;

			name = jQuery.cssProps[ origName ] ||
				( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

			// Gets hook for the prefixed version, then unprefixed version
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// Check if we're setting a value
			if ( value !== undefined ) {
				type = typeof value;

				// Convert "+=" or "-=" to relative numbers (#7345)
				if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
					value = adjustCSS( elem, name, ret );

					// Fixes bug #9237
					type = "number";
				}

				// Make sure that null and NaN values aren't set (#7116)
				if ( value == null || value !== value ) {
					return;
				}

				// If a number was passed in, add the unit (except for certain CSS properties)
				if ( type === "number" ) {
					value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
				}

				// Support: IE9-11+
				// background-* props affect original clone's values
				if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
					style[ name ] = "inherit";
				}

				// If a hook was provided, use that value, otherwise just set the specified value
				if ( !hooks || !( "set" in hooks ) ||
					( value = hooks.set( elem, value, extra ) ) !== undefined ) {

					style[ name ] = value;
				}

			} else {

				// If a hook was provided get the non-computed value from there
				if ( hooks && "get" in hooks &&
					( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

					return ret;
				}

				// Otherwise just get the value from the style object
				return style[ name ];
			}
		},

		css: function( elem, name, extra, styles ) {
			var val, num, hooks,
				origName = jQuery.camelCase( name );

			// Make sure that we're working with the right name
			name = jQuery.cssProps[ origName ] ||
				( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

			// Try prefixed name followed by the unprefixed name
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// If a hook was provided get the computed value from there
			if ( hooks && "get" in hooks ) {
				val = hooks.get( elem, true, extra );
			}

			// Otherwise, if a way to get the computed value exists, use that
			if ( val === undefined ) {
				val = curCSS( elem, name, styles );
			}

			// Convert "normal" to computed value
			if ( val === "normal" && name in cssNormalTransform ) {
				val = cssNormalTransform[ name ];
			}

			// Make numeric if forced or a qualifier was provided and val looks numeric
			if ( extra === "" || extra ) {
				num = parseFloat( val );
				return extra === true || isFinite( num ) ? num || 0 : val;
			}
			return val;
		}
	} );

	jQuery.each( [ "height", "width" ], function( i, name ) {
		jQuery.cssHooks[ name ] = {
			get: function( elem, computed, extra ) {
				if ( computed ) {

					// Certain elements can have dimension info if we invisibly show them
					// but it must have a current display style that would benefit
					return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&
						elem.offsetWidth === 0 ?
							swap( elem, cssShow, function() {
								return getWidthOrHeight( elem, name, extra );
							} ) :
							getWidthOrHeight( elem, name, extra );
				}
			},

			set: function( elem, value, extra ) {
				var matches,
					styles = extra && getStyles( elem ),
					subtract = extra && augmentWidthOrHeight(
						elem,
						name,
						extra,
						jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
						styles
					);

				// Convert to pixels if value adjustment is needed
				if ( subtract && ( matches = rcssNum.exec( value ) ) &&
					( matches[ 3 ] || "px" ) !== "px" ) {

					elem.style[ name ] = value;
					value = jQuery.css( elem, name );
				}

				return setPositiveNumber( elem, value, subtract );
			}
		};
	} );

	jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
		function( elem, computed ) {
			if ( computed ) {
				return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
					elem.getBoundingClientRect().left -
						swap( elem, { marginLeft: 0 }, function() {
							return elem.getBoundingClientRect().left;
						} )
					) + "px";
			}
		}
	);

	// Support: Android 2.3
	jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
		function( elem, computed ) {
			if ( computed ) {
				return swap( elem, { "display": "inline-block" },
					curCSS, [ elem, "marginRight" ] );
			}
		}
	);

	// These hooks are used by animate to expand properties
	jQuery.each( {
		margin: "",
		padding: "",
		border: "Width"
	}, function( prefix, suffix ) {
		jQuery.cssHooks[ prefix + suffix ] = {
			expand: function( value ) {
				var i = 0,
					expanded = {},

					// Assumes a single number if not a string
					parts = typeof value === "string" ? value.split( " " ) : [ value ];

				for ( ; i < 4; i++ ) {
					expanded[ prefix + cssExpand[ i ] + suffix ] =
						parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
				}

				return expanded;
			}
		};

		if ( !rmargin.test( prefix ) ) {
			jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
		}
	} );

	jQuery.fn.extend( {
		css: function( name, value ) {
			return access( this, function( elem, name, value ) {
				var styles, len,
					map = {},
					i = 0;

				if ( jQuery.isArray( name ) ) {
					styles = getStyles( elem );
					len = name.length;

					for ( ; i < len; i++ ) {
						map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
					}

					return map;
				}

				return value !== undefined ?
					jQuery.style( elem, name, value ) :
					jQuery.css( elem, name );
			}, name, value, arguments.length > 1 );
		},
		show: function() {
			return showHide( this, true );
		},
		hide: function() {
			return showHide( this );
		},
		toggle: function( state ) {
			if ( typeof state === "boolean" ) {
				return state ? this.show() : this.hide();
			}

			return this.each( function() {
				if ( isHidden( this ) ) {
					jQuery( this ).show();
				} else {
					jQuery( this ).hide();
				}
			} );
		}
	} );


	function Tween( elem, options, prop, end, easing ) {
		return new Tween.prototype.init( elem, options, prop, end, easing );
	}
	jQuery.Tween = Tween;

	Tween.prototype = {
		constructor: Tween,
		init: function( elem, options, prop, end, easing, unit ) {
			this.elem = elem;
			this.prop = prop;
			this.easing = easing || jQuery.easing._default;
			this.options = options;
			this.start = this.now = this.cur();
			this.end = end;
			this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
		},
		cur: function() {
			var hooks = Tween.propHooks[ this.prop ];

			return hooks && hooks.get ?
				hooks.get( this ) :
				Tween.propHooks._default.get( this );
		},
		run: function( percent ) {
			var eased,
				hooks = Tween.propHooks[ this.prop ];

			if ( this.options.duration ) {
				this.pos = eased = jQuery.easing[ this.easing ](
					percent, this.options.duration * percent, 0, 1, this.options.duration
				);
			} else {
				this.pos = eased = percent;
			}
			this.now = ( this.end - this.start ) * eased + this.start;

			if ( this.options.step ) {
				this.options.step.call( this.elem, this.now, this );
			}

			if ( hooks && hooks.set ) {
				hooks.set( this );
			} else {
				Tween.propHooks._default.set( this );
			}
			return this;
		}
	};

	Tween.prototype.init.prototype = Tween.prototype;

	Tween.propHooks = {
		_default: {
			get: function( tween ) {
				var result;

				// Use a property on the element directly when it is not a DOM element,
				// or when there is no matching style property that exists.
				if ( tween.elem.nodeType !== 1 ||
					tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
					return tween.elem[ tween.prop ];
				}

				// Passing an empty string as a 3rd parameter to .css will automatically
				// attempt a parseFloat and fallback to a string if the parse fails.
				// Simple values such as "10px" are parsed to Float;
				// complex values such as "rotate(1rad)" are returned as-is.
				result = jQuery.css( tween.elem, tween.prop, "" );

				// Empty strings, null, undefined and "auto" are converted to 0.
				return !result || result === "auto" ? 0 : result;
			},
			set: function( tween ) {

				// Use step hook for back compat.
				// Use cssHook if its there.
				// Use .style if available and use plain properties where available.
				if ( jQuery.fx.step[ tween.prop ] ) {
					jQuery.fx.step[ tween.prop ]( tween );
				} else if ( tween.elem.nodeType === 1 &&
					( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
						jQuery.cssHooks[ tween.prop ] ) ) {
					jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
				} else {
					tween.elem[ tween.prop ] = tween.now;
				}
			}
		}
	};

	// Support: IE9
	// Panic based approach to setting things on disconnected nodes
	Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
		set: function( tween ) {
			if ( tween.elem.nodeType && tween.elem.parentNode ) {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	};

	jQuery.easing = {
		linear: function( p ) {
			return p;
		},
		swing: function( p ) {
			return 0.5 - Math.cos( p * Math.PI ) / 2;
		},
		_default: "swing"
	};

	jQuery.fx = Tween.prototype.init;

	// Back Compat <1.8 extension point
	jQuery.fx.step = {};




	var
		fxNow, timerId,
		rfxtypes = /^(?:toggle|show|hide)$/,
		rrun = /queueHooks$/;

	// Animations created synchronously will run synchronously
	function createFxNow() {
		window.setTimeout( function() {
			fxNow = undefined;
		} );
		return ( fxNow = jQuery.now() );
	}

	// Generate parameters to create a standard animation
	function genFx( type, includeWidth ) {
		var which,
			i = 0,
			attrs = { height: type };

		// If we include width, step value is 1 to do all cssExpand values,
		// otherwise step value is 2 to skip over Left and Right
		includeWidth = includeWidth ? 1 : 0;
		for ( ; i < 4 ; i += 2 - includeWidth ) {
			which = cssExpand[ i ];
			attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
		}

		if ( includeWidth ) {
			attrs.opacity = attrs.width = type;
		}

		return attrs;
	}

	function createTween( value, prop, animation ) {
		var tween,
			collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

				// We're done with this property
				return tween;
			}
		}
	}

	function defaultPrefilter( elem, props, opts ) {
		/* jshint validthis: true */
		var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
			anim = this,
			orig = {},
			style = elem.style,
			hidden = elem.nodeType && isHidden( elem ),
			dataShow = dataPriv.get( elem, "fxshow" );

		// Handle queue: false promises
		if ( !opts.queue ) {
			hooks = jQuery._queueHooks( elem, "fx" );
			if ( hooks.unqueued == null ) {
				hooks.unqueued = 0;
				oldfire = hooks.empty.fire;
				hooks.empty.fire = function() {
					if ( !hooks.unqueued ) {
						oldfire();
					}
				};
			}
			hooks.unqueued++;

			anim.always( function() {

				// Ensure the complete handler is called before this completes
				anim.always( function() {
					hooks.unqueued--;
					if ( !jQuery.queue( elem, "fx" ).length ) {
						hooks.empty.fire();
					}
				} );
			} );
		}

		// Height/width overflow pass
		if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {

			// Make sure that nothing sneaks out
			// Record all 3 overflow attributes because IE9-10 do not
			// change the overflow attribute when overflowX and
			// overflowY are set to the same value
			opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

			// Set display property to inline-block for height/width
			// animations on inline elements that are having width/height animated
			display = jQuery.css( elem, "display" );

			// Test default display if display is currently "none"
			checkDisplay = display === "none" ?
				dataPriv.get( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

			if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {
				style.display = "inline-block";
			}
		}

		if ( opts.overflow ) {
			style.overflow = "hidden";
			anim.always( function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			} );
		}

		// show/hide pass
		for ( prop in props ) {
			value = props[ prop ];
			if ( rfxtypes.exec( value ) ) {
				delete props[ prop ];
				toggle = toggle || value === "toggle";
				if ( value === ( hidden ? "hide" : "show" ) ) {

					// If there is dataShow left over from a stopped hide or show
					// and we are going to proceed with show, we should pretend to be hidden
					if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
						hidden = true;
					} else {
						continue;
					}
				}
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

			// Any non-fx value stops us from restoring the original display value
			} else {
				display = undefined;
			}
		}

		if ( !jQuery.isEmptyObject( orig ) ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", {} );
			}

			// Store state if its toggle - enables .stop().toggle() to "reverse"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}
			if ( hidden ) {
				jQuery( elem ).show();
			} else {
				anim.done( function() {
					jQuery( elem ).hide();
				} );
			}
			anim.done( function() {
				var prop;

				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
			for ( prop in orig ) {
				tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

				if ( !( prop in dataShow ) ) {
					dataShow[ prop ] = tween.start;
					if ( hidden ) {
						tween.end = tween.start;
						tween.start = prop === "width" || prop === "height" ? 1 : 0;
					}
				}
			}

		// If this is a noop like .hide().hide(), restore an overwritten display value
		} else if ( ( display === "none" ? defaultDisplay( elem.nodeName ) : display ) === "inline" ) {
			style.display = display;
		}
	}

	function propFilter( props, specialEasing ) {
		var index, name, easing, value, hooks;

		// camelCase, specialEasing and expand cssHook pass
		for ( index in props ) {
			name = jQuery.camelCase( index );
			easing = specialEasing[ name ];
			value = props[ index ];
			if ( jQuery.isArray( value ) ) {
				easing = value[ 1 ];
				value = props[ index ] = value[ 0 ];
			}

			if ( index !== name ) {
				props[ name ] = value;
				delete props[ index ];
			}

			hooks = jQuery.cssHooks[ name ];
			if ( hooks && "expand" in hooks ) {
				value = hooks.expand( value );
				delete props[ name ];

				// Not quite $.extend, this won't overwrite existing keys.
				// Reusing 'index' because we have the correct "name"
				for ( index in value ) {
					if ( !( index in props ) ) {
						props[ index ] = value[ index ];
						specialEasing[ index ] = easing;
					}
				}
			} else {
				specialEasing[ name ] = easing;
			}
		}
	}

	function Animation( elem, properties, options ) {
		var result,
			stopped,
			index = 0,
			length = Animation.prefilters.length,
			deferred = jQuery.Deferred().always( function() {

				// Don't match elem in the :animated selector
				delete tick.elem;
			} ),
			tick = function() {
				if ( stopped ) {
					return false;
				}
				var currentTime = fxNow || createFxNow(),
					remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

					// Support: Android 2.3
					// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
					temp = remaining / animation.duration || 0,
					percent = 1 - temp,
					index = 0,
					length = animation.tweens.length;

				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( percent );
				}

				deferred.notifyWith( elem, [ animation, percent, remaining ] );

				if ( percent < 1 && length ) {
					return remaining;
				} else {
					deferred.resolveWith( elem, [ animation ] );
					return false;
				}
			},
			animation = deferred.promise( {
				elem: elem,
				props: jQuery.extend( {}, properties ),
				opts: jQuery.extend( true, {
					specialEasing: {},
					easing: jQuery.easing._default
				}, options ),
				originalProperties: properties,
				originalOptions: options,
				startTime: fxNow || createFxNow(),
				duration: options.duration,
				tweens: [],
				createTween: function( prop, end ) {
					var tween = jQuery.Tween( elem, animation.opts, prop, end,
							animation.opts.specialEasing[ prop ] || animation.opts.easing );
					animation.tweens.push( tween );
					return tween;
				},
				stop: function( gotoEnd ) {
					var index = 0,

						// If we are going to the end, we want to run all the tweens
						// otherwise we skip this part
						length = gotoEnd ? animation.tweens.length : 0;
					if ( stopped ) {
						return this;
					}
					stopped = true;
					for ( ; index < length ; index++ ) {
						animation.tweens[ index ].run( 1 );
					}

					// Resolve when we played the last frame; otherwise, reject
					if ( gotoEnd ) {
						deferred.notifyWith( elem, [ animation, 1, 0 ] );
						deferred.resolveWith( elem, [ animation, gotoEnd ] );
					} else {
						deferred.rejectWith( elem, [ animation, gotoEnd ] );
					}
					return this;
				}
			} ),
			props = animation.props;

		propFilter( props, animation.opts.specialEasing );

		for ( ; index < length ; index++ ) {
			result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
			if ( result ) {
				if ( jQuery.isFunction( result.stop ) ) {
					jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
						jQuery.proxy( result.stop, result );
				}
				return result;
			}
		}

		jQuery.map( props, createTween, animation );

		if ( jQuery.isFunction( animation.opts.start ) ) {
			animation.opts.start.call( elem, animation );
		}

		jQuery.fx.timer(
			jQuery.extend( tick, {
				elem: elem,
				anim: animation,
				queue: animation.opts.queue
			} )
		);

		// attach callbacks from options
		return animation.progress( animation.opts.progress )
			.done( animation.opts.done, animation.opts.complete )
			.fail( animation.opts.fail )
			.always( animation.opts.always );
	}

	jQuery.Animation = jQuery.extend( Animation, {
		tweeners: {
			"*": [ function( prop, value ) {
				var tween = this.createTween( prop, value );
				adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
				return tween;
			} ]
		},

		tweener: function( props, callback ) {
			if ( jQuery.isFunction( props ) ) {
				callback = props;
				props = [ "*" ];
			} else {
				props = props.match( rnotwhite );
			}

			var prop,
				index = 0,
				length = props.length;

			for ( ; index < length ; index++ ) {
				prop = props[ index ];
				Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
				Animation.tweeners[ prop ].unshift( callback );
			}
		},

		prefilters: [ defaultPrefilter ],

		prefilter: function( callback, prepend ) {
			if ( prepend ) {
				Animation.prefilters.unshift( callback );
			} else {
				Animation.prefilters.push( callback );
			}
		}
	} );

	jQuery.speed = function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
		};

		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ?
			opt.duration : opt.duration in jQuery.fx.speeds ?
				jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

		// Normalize opt.queue - true/undefined/null -> "fx"
		if ( opt.queue == null || opt.queue === true ) {
			opt.queue = "fx";
		}

		// Queueing
		opt.old = opt.complete;

		opt.complete = function() {
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}

			if ( opt.queue ) {
				jQuery.dequeue( this, opt.queue );
			}
		};

		return opt;
	};

	jQuery.fn.extend( {
		fadeTo: function( speed, to, easing, callback ) {

			// Show any hidden elements after setting opacity to 0
			return this.filter( isHidden ).css( "opacity", 0 ).show()

				// Animate to the value specified
				.end().animate( { opacity: to }, speed, easing, callback );
		},
		animate: function( prop, speed, easing, callback ) {
			var empty = jQuery.isEmptyObject( prop ),
				optall = jQuery.speed( speed, easing, callback ),
				doAnimation = function() {

					// Operate on a copy of prop so per-property easing won't be lost
					var anim = Animation( this, jQuery.extend( {}, prop ), optall );

					// Empty animations, or finishing resolves immediately
					if ( empty || dataPriv.get( this, "finish" ) ) {
						anim.stop( true );
					}
				};
				doAnimation.finish = doAnimation;

			return empty || optall.queue === false ?
				this.each( doAnimation ) :
				this.queue( optall.queue, doAnimation );
		},
		stop: function( type, clearQueue, gotoEnd ) {
			var stopQueue = function( hooks ) {
				var stop = hooks.stop;
				delete hooks.stop;
				stop( gotoEnd );
			};

			if ( typeof type !== "string" ) {
				gotoEnd = clearQueue;
				clearQueue = type;
				type = undefined;
			}
			if ( clearQueue && type !== false ) {
				this.queue( type || "fx", [] );
			}

			return this.each( function() {
				var dequeue = true,
					index = type != null && type + "queueHooks",
					timers = jQuery.timers,
					data = dataPriv.get( this );

				if ( index ) {
					if ( data[ index ] && data[ index ].stop ) {
						stopQueue( data[ index ] );
					}
				} else {
					for ( index in data ) {
						if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
							stopQueue( data[ index ] );
						}
					}
				}

				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this &&
						( type == null || timers[ index ].queue === type ) ) {

						timers[ index ].anim.stop( gotoEnd );
						dequeue = false;
						timers.splice( index, 1 );
					}
				}

				// Start the next in the queue if the last step wasn't forced.
				// Timers currently will call their complete callbacks, which
				// will dequeue but only if they were gotoEnd.
				if ( dequeue || !gotoEnd ) {
					jQuery.dequeue( this, type );
				}
			} );
		},
		finish: function( type ) {
			if ( type !== false ) {
				type = type || "fx";
			}
			return this.each( function() {
				var index,
					data = dataPriv.get( this ),
					queue = data[ type + "queue" ],
					hooks = data[ type + "queueHooks" ],
					timers = jQuery.timers,
					length = queue ? queue.length : 0;

				// Enable finishing flag on private data
				data.finish = true;

				// Empty the queue first
				jQuery.queue( this, type, [] );

				if ( hooks && hooks.stop ) {
					hooks.stop.call( this, true );
				}

				// Look for any active animations, and finish them
				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
						timers[ index ].anim.stop( true );
						timers.splice( index, 1 );
					}
				}

				// Look for any animations in the old queue and finish them
				for ( index = 0; index < length; index++ ) {
					if ( queue[ index ] && queue[ index ].finish ) {
						queue[ index ].finish.call( this );
					}
				}

				// Turn off finishing flag
				delete data.finish;
			} );
		}
	} );

	jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
		var cssFn = jQuery.fn[ name ];
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return speed == null || typeof speed === "boolean" ?
				cssFn.apply( this, arguments ) :
				this.animate( genFx( name, true ), speed, easing, callback );
		};
	} );

	// Generate shortcuts for custom animations
	jQuery.each( {
		slideDown: genFx( "show" ),
		slideUp: genFx( "hide" ),
		slideToggle: genFx( "toggle" ),
		fadeIn: { opacity: "show" },
		fadeOut: { opacity: "hide" },
		fadeToggle: { opacity: "toggle" }
	}, function( name, props ) {
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return this.animate( props, speed, easing, callback );
		};
	} );

	jQuery.timers = [];
	jQuery.fx.tick = function() {
		var timer,
			i = 0,
			timers = jQuery.timers;

		fxNow = jQuery.now();

		for ( ; i < timers.length; i++ ) {
			timer = timers[ i ];

			// Checks the timer has not already been removed
			if ( !timer() && timers[ i ] === timer ) {
				timers.splice( i--, 1 );
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
		fxNow = undefined;
	};

	jQuery.fx.timer = function( timer ) {
		jQuery.timers.push( timer );
		if ( timer() ) {
			jQuery.fx.start();
		} else {
			jQuery.timers.pop();
		}
	};

	jQuery.fx.interval = 13;
	jQuery.fx.start = function() {
		if ( !timerId ) {
			timerId = window.setInterval( jQuery.fx.tick, jQuery.fx.interval );
		}
	};

	jQuery.fx.stop = function() {
		window.clearInterval( timerId );

		timerId = null;
	};

	jQuery.fx.speeds = {
		slow: 600,
		fast: 200,

		// Default speed
		_default: 400
	};


	// Based off of the plugin by Clint Helfers, with permission.
	// http://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
	jQuery.fn.delay = function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = window.setTimeout( next, time );
			hooks.stop = function() {
				window.clearTimeout( timeout );
			};
		} );
	};


	( function() {
		var input = document.createElement( "input" ),
			select = document.createElement( "select" ),
			opt = select.appendChild( document.createElement( "option" ) );

		input.type = "checkbox";

		// Support: iOS<=5.1, Android<=4.2+
		// Default value for a checkbox should be "on"
		support.checkOn = input.value !== "";

		// Support: IE<=11+
		// Must access selectedIndex to make default options select
		support.optSelected = opt.selected;

		// Support: Android<=2.3
		// Options inside disabled selects are incorrectly marked as disabled
		select.disabled = true;
		support.optDisabled = !opt.disabled;

		// Support: IE<=11+
		// An input loses its value after becoming a radio
		input = document.createElement( "input" );
		input.value = "t";
		input.type = "radio";
		support.radioValue = input.value === "t";
	} )();


	var boolHook,
		attrHandle = jQuery.expr.attrHandle;

	jQuery.fn.extend( {
		attr: function( name, value ) {
			return access( this, jQuery.attr, name, value, arguments.length > 1 );
		},

		removeAttr: function( name ) {
			return this.each( function() {
				jQuery.removeAttr( this, name );
			} );
		}
	} );

	jQuery.extend( {
		attr: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set attributes on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			// Fallback to prop when attributes are not supported
			if ( typeof elem.getAttribute === "undefined" ) {
				return jQuery.prop( elem, name, value );
			}

			// All attributes are lowercase
			// Grab necessary hook if one is defined
			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
				name = name.toLowerCase();
				hooks = jQuery.attrHooks[ name ] ||
					( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
			}

			if ( value !== undefined ) {
				if ( value === null ) {
					jQuery.removeAttr( elem, name );
					return;
				}

				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				elem.setAttribute( name, value + "" );
				return value;
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ? undefined : ret;
		},

		attrHooks: {
			type: {
				set: function( elem, value ) {
					if ( !support.radioValue && value === "radio" &&
						jQuery.nodeName( elem, "input" ) ) {
						var val = elem.value;
						elem.setAttribute( "type", value );
						if ( val ) {
							elem.value = val;
						}
						return value;
					}
				}
			}
		},

		removeAttr: function( elem, value ) {
			var name, propName,
				i = 0,
				attrNames = value && value.match( rnotwhite );

			if ( attrNames && elem.nodeType === 1 ) {
				while ( ( name = attrNames[ i++ ] ) ) {
					propName = jQuery.propFix[ name ] || name;

					// Boolean attributes get special treatment (#10870)
					if ( jQuery.expr.match.bool.test( name ) ) {

						// Set corresponding property to false
						elem[ propName ] = false;
					}

					elem.removeAttribute( name );
				}
			}
		}
	} );

	// Hooks for boolean attributes
	boolHook = {
		set: function( elem, value, name ) {
			if ( value === false ) {

				// Remove boolean attributes when set to false
				jQuery.removeAttr( elem, name );
			} else {
				elem.setAttribute( name, name );
			}
			return name;
		}
	};
	jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
		var getter = attrHandle[ name ] || jQuery.find.attr;

		attrHandle[ name ] = function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {

				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		};
	} );




	var rfocusable = /^(?:input|select|textarea|button)$/i,
		rclickable = /^(?:a|area)$/i;

	jQuery.fn.extend( {
		prop: function( name, value ) {
			return access( this, jQuery.prop, name, value, arguments.length > 1 );
		},

		removeProp: function( name ) {
			return this.each( function() {
				delete this[ jQuery.propFix[ name ] || name ];
			} );
		}
	} );

	jQuery.extend( {
		prop: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set properties on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

				// Fix name and attach hooks
				name = jQuery.propFix[ name ] || name;
				hooks = jQuery.propHooks[ name ];
			}

			if ( value !== undefined ) {
				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				return ( elem[ name ] = value );
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			return elem[ name ];
		},

		propHooks: {
			tabIndex: {
				get: function( elem ) {

					// elem.tabIndex doesn't always return the
					// correct value when it hasn't been explicitly set
					// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
					// Use proper attribute retrieval(#12072)
					var tabindex = jQuery.find.attr( elem, "tabindex" );

					return tabindex ?
						parseInt( tabindex, 10 ) :
						rfocusable.test( elem.nodeName ) ||
							rclickable.test( elem.nodeName ) && elem.href ?
								0 :
								-1;
				}
			}
		},

		propFix: {
			"for": "htmlFor",
			"class": "className"
		}
	} );

	if ( !support.optSelected ) {
		jQuery.propHooks.selected = {
			get: function( elem ) {
				var parent = elem.parentNode;
				if ( parent && parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
				return null;
			}
		};
	}

	jQuery.each( [
		"tabIndex",
		"readOnly",
		"maxLength",
		"cellSpacing",
		"cellPadding",
		"rowSpan",
		"colSpan",
		"useMap",
		"frameBorder",
		"contentEditable"
	], function() {
		jQuery.propFix[ this.toLowerCase() ] = this;
	} );




	var rclass = /[\t\r\n\f]/g;

	function getClass( elem ) {
		return elem.getAttribute && elem.getAttribute( "class" ) || "";
	}

	jQuery.fn.extend( {
		addClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;

			if ( jQuery.isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			if ( typeof value === "string" && value ) {
				classes = value.match( rnotwhite ) || [];

				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );
					cur = elem.nodeType === 1 &&
						( " " + curValue + " " ).replace( rclass, " " );

					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {
							if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
								cur += clazz + " ";
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = jQuery.trim( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}

			return this;
		},

		removeClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;

			if ( jQuery.isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			if ( !arguments.length ) {
				return this.attr( "class", "" );
			}

			if ( typeof value === "string" && value ) {
				classes = value.match( rnotwhite ) || [];

				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );

					// This expression is here for better compressibility (see addClass)
					cur = elem.nodeType === 1 &&
						( " " + curValue + " " ).replace( rclass, " " );

					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {

							// Remove *all* instances
							while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
								cur = cur.replace( " " + clazz + " ", " " );
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = jQuery.trim( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}

			return this;
		},

		toggleClass: function( value, stateVal ) {
			var type = typeof value;

			if ( typeof stateVal === "boolean" && type === "string" ) {
				return stateVal ? this.addClass( value ) : this.removeClass( value );
			}

			if ( jQuery.isFunction( value ) ) {
				return this.each( function( i ) {
					jQuery( this ).toggleClass(
						value.call( this, i, getClass( this ), stateVal ),
						stateVal
					);
				} );
			}

			return this.each( function() {
				var className, i, self, classNames;

				if ( type === "string" ) {

					// Toggle individual class names
					i = 0;
					self = jQuery( this );
					classNames = value.match( rnotwhite ) || [];

					while ( ( className = classNames[ i++ ] ) ) {

						// Check each className given, space separated list
						if ( self.hasClass( className ) ) {
							self.removeClass( className );
						} else {
							self.addClass( className );
						}
					}

				// Toggle whole class name
				} else if ( value === undefined || type === "boolean" ) {
					className = getClass( this );
					if ( className ) {

						// Store className if set
						dataPriv.set( this, "__className__", className );
					}

					// If the element has a class name or if we're passed `false`,
					// then remove the whole classname (if there was one, the above saved it).
					// Otherwise bring back whatever was previously saved (if anything),
					// falling back to the empty string if nothing was stored.
					if ( this.setAttribute ) {
						this.setAttribute( "class",
							className || value === false ?
							"" :
							dataPriv.get( this, "__className__" ) || ""
						);
					}
				}
			} );
		},

		hasClass: function( selector ) {
			var className, elem,
				i = 0;

			className = " " + selector + " ";
			while ( ( elem = this[ i++ ] ) ) {
				if ( elem.nodeType === 1 &&
					( " " + getClass( elem ) + " " ).replace( rclass, " " )
						.indexOf( className ) > -1
				) {
					return true;
				}
			}

			return false;
		}
	} );




	var rreturn = /\r/g;

	jQuery.fn.extend( {
		val: function( value ) {
			var hooks, ret, isFunction,
				elem = this[ 0 ];

			if ( !arguments.length ) {
				if ( elem ) {
					hooks = jQuery.valHooks[ elem.type ] ||
						jQuery.valHooks[ elem.nodeName.toLowerCase() ];

					if ( hooks &&
						"get" in hooks &&
						( ret = hooks.get( elem, "value" ) ) !== undefined
					) {
						return ret;
					}

					ret = elem.value;

					return typeof ret === "string" ?

						// Handle most common string cases
						ret.replace( rreturn, "" ) :

						// Handle cases where value is null/undef or number
						ret == null ? "" : ret;
				}

				return;
			}

			isFunction = jQuery.isFunction( value );

			return this.each( function( i ) {
				var val;

				if ( this.nodeType !== 1 ) {
					return;
				}

				if ( isFunction ) {
					val = value.call( this, i, jQuery( this ).val() );
				} else {
					val = value;
				}

				// Treat null/undefined as ""; convert numbers to string
				if ( val == null ) {
					val = "";

				} else if ( typeof val === "number" ) {
					val += "";

				} else if ( jQuery.isArray( val ) ) {
					val = jQuery.map( val, function( value ) {
						return value == null ? "" : value + "";
					} );
				}

				hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

				// If set returns undefined, fall back to normal setting
				if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
					this.value = val;
				}
			} );
		}
	} );

	jQuery.extend( {
		valHooks: {
			option: {
				get: function( elem ) {

					// Support: IE<11
					// option.value not trimmed (#14858)
					return jQuery.trim( elem.value );
				}
			},
			select: {
				get: function( elem ) {
					var value, option,
						options = elem.options,
						index = elem.selectedIndex,
						one = elem.type === "select-one" || index < 0,
						values = one ? null : [],
						max = one ? index + 1 : options.length,
						i = index < 0 ?
							max :
							one ? index : 0;

					// Loop through all the selected options
					for ( ; i < max; i++ ) {
						option = options[ i ];

						// IE8-9 doesn't update selected after form reset (#2551)
						if ( ( option.selected || i === index ) &&

								// Don't return options that are disabled or in a disabled optgroup
								( support.optDisabled ?
									!option.disabled : option.getAttribute( "disabled" ) === null ) &&
								( !option.parentNode.disabled ||
									!jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

							// Get the specific value for the option
							value = jQuery( option ).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;
				},

				set: function( elem, value ) {
					var optionSet, option,
						options = elem.options,
						values = jQuery.makeArray( value ),
						i = options.length;

					while ( i-- ) {
						option = options[ i ];
						if ( option.selected =
								jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
						) {
							optionSet = true;
						}
					}

					// Force browsers to behave consistently when non-matching value is set
					if ( !optionSet ) {
						elem.selectedIndex = -1;
					}
					return values;
				}
			}
		}
	} );

	// Radios and checkboxes getter/setter
	jQuery.each( [ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			set: function( elem, value ) {
				if ( jQuery.isArray( value ) ) {
					return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
				}
			}
		};
		if ( !support.checkOn ) {
			jQuery.valHooks[ this ].get = function( elem ) {
				return elem.getAttribute( "value" ) === null ? "on" : elem.value;
			};
		}
	} );




	// Return jQuery for attributes-only inclusion


	var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;

	jQuery.extend( jQuery.event, {

		trigger: function( event, data, elem, onlyHandlers ) {

			var i, cur, tmp, bubbleType, ontype, handle, special,
				eventPath = [ elem || document ],
				type = hasOwn.call( event, "type" ) ? event.type : event,
				namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

			cur = tmp = elem = elem || document;

			// Don't do events on text and comment nodes
			if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
				return;
			}

			// focus/blur morphs to focusin/out; ensure we're not firing them right now
			if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
				return;
			}

			if ( type.indexOf( "." ) > -1 ) {

				// Namespaced trigger; create a regexp to match event type in handle()
				namespaces = type.split( "." );
				type = namespaces.shift();
				namespaces.sort();
			}
			ontype = type.indexOf( ":" ) < 0 && "on" + type;

			// Caller can pass in a jQuery.Event object, Object, or just an event type string
			event = event[ jQuery.expando ] ?
				event :
				new jQuery.Event( type, typeof event === "object" && event );

			// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
			event.isTrigger = onlyHandlers ? 2 : 3;
			event.namespace = namespaces.join( "." );
			event.rnamespace = event.namespace ?
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
				null;

			// Clean up the event in case it is being reused
			event.result = undefined;
			if ( !event.target ) {
				event.target = elem;
			}

			// Clone any incoming data and prepend the event, creating the handler arg list
			data = data == null ?
				[ event ] :
				jQuery.makeArray( data, [ event ] );

			// Allow special events to draw outside the lines
			special = jQuery.event.special[ type ] || {};
			if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
				return;
			}

			// Determine event propagation path in advance, per W3C events spec (#9951)
			// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
			if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

				bubbleType = special.delegateType || type;
				if ( !rfocusMorph.test( bubbleType + type ) ) {
					cur = cur.parentNode;
				}
				for ( ; cur; cur = cur.parentNode ) {
					eventPath.push( cur );
					tmp = cur;
				}

				// Only add window if we got to document (e.g., not plain obj or detached DOM)
				if ( tmp === ( elem.ownerDocument || document ) ) {
					eventPath.push( tmp.defaultView || tmp.parentWindow || window );
				}
			}

			// Fire handlers on the event path
			i = 0;
			while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {

				event.type = i > 1 ?
					bubbleType :
					special.bindType || type;

				// jQuery handler
				handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
					dataPriv.get( cur, "handle" );
				if ( handle ) {
					handle.apply( cur, data );
				}

				// Native handler
				handle = ontype && cur[ ontype ];
				if ( handle && handle.apply && acceptData( cur ) ) {
					event.result = handle.apply( cur, data );
					if ( event.result === false ) {
						event.preventDefault();
					}
				}
			}
			event.type = type;

			// If nobody prevented the default action, do it now
			if ( !onlyHandlers && !event.isDefaultPrevented() ) {

				if ( ( !special._default ||
					special._default.apply( eventPath.pop(), data ) === false ) &&
					acceptData( elem ) ) {

					// Call a native DOM method on the target with the same name name as the event.
					// Don't do default actions on window, that's where global variables be (#6170)
					if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

						// Don't re-trigger an onFOO event when we call its FOO() method
						tmp = elem[ ontype ];

						if ( tmp ) {
							elem[ ontype ] = null;
						}

						// Prevent re-triggering of the same event, since we already bubbled it above
						jQuery.event.triggered = type;
						elem[ type ]();
						jQuery.event.triggered = undefined;

						if ( tmp ) {
							elem[ ontype ] = tmp;
						}
					}
				}
			}

			return event.result;
		},

		// Piggyback on a donor event to simulate a different one
		simulate: function( type, elem, event ) {
			var e = jQuery.extend(
				new jQuery.Event(),
				event,
				{
					type: type,
					isSimulated: true

					// Previously, `originalEvent: {}` was set here, so stopPropagation call
					// would not be triggered on donor event, since in our own
					// jQuery.event.stopPropagation function we had a check for existence of
					// originalEvent.stopPropagation method, so, consequently it would be a noop.
					//
					// But now, this "simulate" function is used only for events
					// for which stopPropagation() is noop, so there is no need for that anymore.
					//
					// For the 1.x branch though, guard for "click" and "submit"
					// events is still used, but was moved to jQuery.event.stopPropagation function
					// because `originalEvent` should point to the original event for the constancy
					// with other events and for more focused logic
				}
			);

			jQuery.event.trigger( e, null, elem );

			if ( e.isDefaultPrevented() ) {
				event.preventDefault();
			}
		}

	} );

	jQuery.fn.extend( {

		trigger: function( type, data ) {
			return this.each( function() {
				jQuery.event.trigger( type, data, this );
			} );
		},
		triggerHandler: function( type, data ) {
			var elem = this[ 0 ];
			if ( elem ) {
				return jQuery.event.trigger( type, data, elem, true );
			}
		}
	} );


	jQuery.each( ( "blur focus focusin focusout load resize scroll unload click dblclick " +
		"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
		"change select submit keydown keypress keyup error contextmenu" ).split( " " ),
		function( i, name ) {

		// Handle event binding
		jQuery.fn[ name ] = function( data, fn ) {
			return arguments.length > 0 ?
				this.on( name, null, data, fn ) :
				this.trigger( name );
		};
	} );

	jQuery.fn.extend( {
		hover: function( fnOver, fnOut ) {
			return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
		}
	} );




	support.focusin = "onfocusin" in window;


	// Support: Firefox
	// Firefox doesn't have focus(in | out) events
	// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
	//
	// Support: Chrome, Safari
	// focus(in | out) events fire after focus & blur events,
	// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
	// Related ticket - https://code.google.com/p/chromium/issues/detail?id=449857
	if ( !support.focusin ) {
		jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

			// Attach a single capturing handler on the document while someone wants focusin/focusout
			var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
			};

			jQuery.event.special[ fix ] = {
				setup: function() {
					var doc = this.ownerDocument || this,
						attaches = dataPriv.access( doc, fix );

					if ( !attaches ) {
						doc.addEventListener( orig, handler, true );
					}
					dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
				},
				teardown: function() {
					var doc = this.ownerDocument || this,
						attaches = dataPriv.access( doc, fix ) - 1;

					if ( !attaches ) {
						doc.removeEventListener( orig, handler, true );
						dataPriv.remove( doc, fix );

					} else {
						dataPriv.access( doc, fix, attaches );
					}
				}
			};
		} );
	}
	var location = window.location;

	var nonce = jQuery.now();

	var rquery = ( /\?/ );



	// Support: Android 2.3
	// Workaround failure to string-cast null input
	jQuery.parseJSON = function( data ) {
		return JSON.parse( data + "" );
	};


	// Cross-browser xml parsing
	jQuery.parseXML = function( data ) {
		var xml;
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE9
		try {
			xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
		} catch ( e ) {
			xml = undefined;
		}

		if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	};


	var
		rhash = /#.*$/,
		rts = /([?&])_=[^&]*/,
		rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

		// #7653, #8125, #8152: local protocol detection
		rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
		rnoContent = /^(?:GET|HEAD)$/,
		rprotocol = /^\/\//,

		/* Prefilters
		 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
		 * 2) These are called:
		 *    - BEFORE asking for a transport
		 *    - AFTER param serialization (s.data is a string if s.processData is true)
		 * 3) key is the dataType
		 * 4) the catchall symbol "*" can be used
		 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
		 */
		prefilters = {},

		/* Transports bindings
		 * 1) key is the dataType
		 * 2) the catchall symbol "*" can be used
		 * 3) selection will start with transport dataType and THEN go to "*" if needed
		 */
		transports = {},

		// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
		allTypes = "*/".concat( "*" ),

		// Anchor tag for parsing the document origin
		originAnchor = document.createElement( "a" );
		originAnchor.href = location.href;

	// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
	function addToPrefiltersOrTransports( structure ) {

		// dataTypeExpression is optional and defaults to "*"
		return function( dataTypeExpression, func ) {

			if ( typeof dataTypeExpression !== "string" ) {
				func = dataTypeExpression;
				dataTypeExpression = "*";
			}

			var dataType,
				i = 0,
				dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

			if ( jQuery.isFunction( func ) ) {

				// For each dataType in the dataTypeExpression
				while ( ( dataType = dataTypes[ i++ ] ) ) {

					// Prepend if requested
					if ( dataType[ 0 ] === "+" ) {
						dataType = dataType.slice( 1 ) || "*";
						( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

					// Otherwise append
					} else {
						( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
					}
				}
			}
		};
	}

	// Base inspection function for prefilters and transports
	function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

		var inspected = {},
			seekingTransport = ( structure === transports );

		function inspect( dataType ) {
			var selected;
			inspected[ dataType ] = true;
			jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
				var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
				if ( typeof dataTypeOrTransport === "string" &&
					!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

					options.dataTypes.unshift( dataTypeOrTransport );
					inspect( dataTypeOrTransport );
					return false;
				} else if ( seekingTransport ) {
					return !( selected = dataTypeOrTransport );
				}
			} );
			return selected;
		}

		return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
	}

	// A special extend for ajax options
	// that takes "flat" options (not to be deep extended)
	// Fixes #9887
	function ajaxExtend( target, src ) {
		var key, deep,
			flatOptions = jQuery.ajaxSettings.flatOptions || {};

		for ( key in src ) {
			if ( src[ key ] !== undefined ) {
				( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
			}
		}
		if ( deep ) {
			jQuery.extend( true, target, deep );
		}

		return target;
	}

	/* Handles responses to an ajax request:
	 * - finds the right dataType (mediates between content-type and expected dataType)
	 * - returns the corresponding response
	 */
	function ajaxHandleResponses( s, jqXHR, responses ) {

		var ct, type, finalDataType, firstDataType,
			contents = s.contents,
			dataTypes = s.dataTypes;

		// Remove auto dataType and get content-type in the process
		while ( dataTypes[ 0 ] === "*" ) {
			dataTypes.shift();
			if ( ct === undefined ) {
				ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
			}
		}

		// Check if we're dealing with a known content-type
		if ( ct ) {
			for ( type in contents ) {
				if ( contents[ type ] && contents[ type ].test( ct ) ) {
					dataTypes.unshift( type );
					break;
				}
			}
		}

		// Check to see if we have a response for the expected dataType
		if ( dataTypes[ 0 ] in responses ) {
			finalDataType = dataTypes[ 0 ];
		} else {

			// Try convertible dataTypes
			for ( type in responses ) {
				if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
					finalDataType = type;
					break;
				}
				if ( !firstDataType ) {
					firstDataType = type;
				}
			}

			// Or just use first one
			finalDataType = finalDataType || firstDataType;
		}

		// If we found a dataType
		// We add the dataType to the list if needed
		// and return the corresponding response
		if ( finalDataType ) {
			if ( finalDataType !== dataTypes[ 0 ] ) {
				dataTypes.unshift( finalDataType );
			}
			return responses[ finalDataType ];
		}
	}

	/* Chain conversions given the request and the original response
	 * Also sets the responseXXX fields on the jqXHR instance
	 */
	function ajaxConvert( s, response, jqXHR, isSuccess ) {
		var conv2, current, conv, tmp, prev,
			converters = {},

			// Work with a copy of dataTypes in case we need to modify it for conversion
			dataTypes = s.dataTypes.slice();

		// Create converters map with lowercased keys
		if ( dataTypes[ 1 ] ) {
			for ( conv in s.converters ) {
				converters[ conv.toLowerCase() ] = s.converters[ conv ];
			}
		}

		current = dataTypes.shift();

		// Convert to each sequential dataType
		while ( current ) {

			if ( s.responseFields[ current ] ) {
				jqXHR[ s.responseFields[ current ] ] = response;
			}

			// Apply the dataFilter if provided
			if ( !prev && isSuccess && s.dataFilter ) {
				response = s.dataFilter( response, s.dataType );
			}

			prev = current;
			current = dataTypes.shift();

			if ( current ) {

			// There's only work to do if current dataType is non-auto
				if ( current === "*" ) {

					current = prev;

				// Convert response if prev dataType is non-auto and differs from current
				} else if ( prev !== "*" && prev !== current ) {

					// Seek a direct converter
					conv = converters[ prev + " " + current ] || converters[ "* " + current ];

					// If none found, seek a pair
					if ( !conv ) {
						for ( conv2 in converters ) {

							// If conv2 outputs current
							tmp = conv2.split( " " );
							if ( tmp[ 1 ] === current ) {

								// If prev can be converted to accepted input
								conv = converters[ prev + " " + tmp[ 0 ] ] ||
									converters[ "* " + tmp[ 0 ] ];
								if ( conv ) {

									// Condense equivalence converters
									if ( conv === true ) {
										conv = converters[ conv2 ];

									// Otherwise, insert the intermediate dataType
									} else if ( converters[ conv2 ] !== true ) {
										current = tmp[ 0 ];
										dataTypes.unshift( tmp[ 1 ] );
									}
									break;
								}
							}
						}
					}

					// Apply converter (if not an equivalence)
					if ( conv !== true ) {

						// Unless errors are allowed to bubble, catch and return them
						if ( conv && s.throws ) {
							response = conv( response );
						} else {
							try {
								response = conv( response );
							} catch ( e ) {
								return {
									state: "parsererror",
									error: conv ? e : "No conversion from " + prev + " to " + current
								};
							}
						}
					}
				}
			}
		}

		return { state: "success", data: response };
	}

	jQuery.extend( {

		// Counter for holding the number of active queries
		active: 0,

		// Last-Modified header cache for next request
		lastModified: {},
		etag: {},

		ajaxSettings: {
			url: location.href,
			type: "GET",
			isLocal: rlocalProtocol.test( location.protocol ),
			global: true,
			processData: true,
			async: true,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			/*
			timeout: 0,
			data: null,
			dataType: null,
			username: null,
			password: null,
			cache: null,
			throws: false,
			traditional: false,
			headers: {},
			*/

			accepts: {
				"*": allTypes,
				text: "text/plain",
				html: "text/html",
				xml: "application/xml, text/xml",
				json: "application/json, text/javascript"
			},

			contents: {
				xml: /\bxml\b/,
				html: /\bhtml/,
				json: /\bjson\b/
			},

			responseFields: {
				xml: "responseXML",
				text: "responseText",
				json: "responseJSON"
			},

			// Data converters
			// Keys separate source (or catchall "*") and destination types with a single space
			converters: {

				// Convert anything to text
				"* text": String,

				// Text to html (true = no transformation)
				"text html": true,

				// Evaluate text as a json expression
				"text json": jQuery.parseJSON,

				// Parse text as xml
				"text xml": jQuery.parseXML
			},

			// For options that shouldn't be deep extended:
			// you can add your own custom options here if
			// and when you create one that shouldn't be
			// deep extended (see ajaxExtend)
			flatOptions: {
				url: true,
				context: true
			}
		},

		// Creates a full fledged settings object into target
		// with both ajaxSettings and settings fields.
		// If target is omitted, writes into ajaxSettings.
		ajaxSetup: function( target, settings ) {
			return settings ?

				// Building a settings object
				ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

				// Extending ajaxSettings
				ajaxExtend( jQuery.ajaxSettings, target );
		},

		ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
		ajaxTransport: addToPrefiltersOrTransports( transports ),

		// Main method
		ajax: function( url, options ) {

			// If url is an object, simulate pre-1.5 signature
			if ( typeof url === "object" ) {
				options = url;
				url = undefined;
			}

			// Force options to be an object
			options = options || {};

			var transport,

				// URL without anti-cache param
				cacheURL,

				// Response headers
				responseHeadersString,
				responseHeaders,

				// timeout handle
				timeoutTimer,

				// Url cleanup var
				urlAnchor,

				// To know if global events are to be dispatched
				fireGlobals,

				// Loop variable
				i,

				// Create the final options object
				s = jQuery.ajaxSetup( {}, options ),

				// Callbacks context
				callbackContext = s.context || s,

				// Context for global events is callbackContext if it is a DOM node or jQuery collection
				globalEventContext = s.context &&
					( callbackContext.nodeType || callbackContext.jquery ) ?
						jQuery( callbackContext ) :
						jQuery.event,

				// Deferreds
				deferred = jQuery.Deferred(),
				completeDeferred = jQuery.Callbacks( "once memory" ),

				// Status-dependent callbacks
				statusCode = s.statusCode || {},

				// Headers (they are sent all at once)
				requestHeaders = {},
				requestHeadersNames = {},

				// The jqXHR state
				state = 0,

				// Default abort message
				strAbort = "canceled",

				// Fake xhr
				jqXHR = {
					readyState: 0,

					// Builds headers hashtable if needed
					getResponseHeader: function( key ) {
						var match;
						if ( state === 2 ) {
							if ( !responseHeaders ) {
								responseHeaders = {};
								while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
									responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
								}
							}
							match = responseHeaders[ key.toLowerCase() ];
						}
						return match == null ? null : match;
					},

					// Raw string
					getAllResponseHeaders: function() {
						return state === 2 ? responseHeadersString : null;
					},

					// Caches the header
					setRequestHeader: function( name, value ) {
						var lname = name.toLowerCase();
						if ( !state ) {
							name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
							requestHeaders[ name ] = value;
						}
						return this;
					},

					// Overrides response content-type header
					overrideMimeType: function( type ) {
						if ( !state ) {
							s.mimeType = type;
						}
						return this;
					},

					// Status-dependent callbacks
					statusCode: function( map ) {
						var code;
						if ( map ) {
							if ( state < 2 ) {
								for ( code in map ) {

									// Lazy-add the new callback in a way that preserves old ones
									statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
								}
							} else {

								// Execute the appropriate callbacks
								jqXHR.always( map[ jqXHR.status ] );
							}
						}
						return this;
					},

					// Cancel the request
					abort: function( statusText ) {
						var finalText = statusText || strAbort;
						if ( transport ) {
							transport.abort( finalText );
						}
						done( 0, finalText );
						return this;
					}
				};

			// Attach deferreds
			deferred.promise( jqXHR ).complete = completeDeferred.add;
			jqXHR.success = jqXHR.done;
			jqXHR.error = jqXHR.fail;

			// Remove hash character (#7531: and string promotion)
			// Add protocol if not provided (prefilters might expect it)
			// Handle falsy url in the settings object (#10093: consistency with old signature)
			// We also use the url parameter if available
			s.url = ( ( url || s.url || location.href ) + "" ).replace( rhash, "" )
				.replace( rprotocol, location.protocol + "//" );

			// Alias method option to type as per ticket #12004
			s.type = options.method || options.type || s.method || s.type;

			// Extract dataTypes list
			s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

			// A cross-domain request is in order when the origin doesn't match the current origin.
			if ( s.crossDomain == null ) {
				urlAnchor = document.createElement( "a" );

				// Support: IE8-11+
				// IE throws exception if url is malformed, e.g. http://example.com:80x/
				try {
					urlAnchor.href = s.url;

					// Support: IE8-11+
					// Anchor's host property isn't correctly set when s.url is relative
					urlAnchor.href = urlAnchor.href;
					s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
						urlAnchor.protocol + "//" + urlAnchor.host;
				} catch ( e ) {

					// If there is an error parsing the URL, assume it is crossDomain,
					// it can be rejected by the transport if it is invalid
					s.crossDomain = true;
				}
			}

			// Convert data if not already a string
			if ( s.data && s.processData && typeof s.data !== "string" ) {
				s.data = jQuery.param( s.data, s.traditional );
			}

			// Apply prefilters
			inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

			// If request was aborted inside a prefilter, stop there
			if ( state === 2 ) {
				return jqXHR;
			}

			// We can fire global events as of now if asked to
			// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
			fireGlobals = jQuery.event && s.global;

			// Watch for a new set of requests
			if ( fireGlobals && jQuery.active++ === 0 ) {
				jQuery.event.trigger( "ajaxStart" );
			}

			// Uppercase the type
			s.type = s.type.toUpperCase();

			// Determine if request has content
			s.hasContent = !rnoContent.test( s.type );

			// Save the URL in case we're toying with the If-Modified-Since
			// and/or If-None-Match header later on
			cacheURL = s.url;

			// More options handling for requests with no content
			if ( !s.hasContent ) {

				// If data is available, append data to url
				if ( s.data ) {
					cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );

					// #9682: remove data so that it's not used in an eventual retry
					delete s.data;
				}

				// Add anti-cache in url if needed
				if ( s.cache === false ) {
					s.url = rts.test( cacheURL ) ?

						// If there is already a '_' parameter, set its value
						cacheURL.replace( rts, "$1_=" + nonce++ ) :

						// Otherwise add one to the end
						cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
				}
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
				}
				if ( jQuery.etag[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
				}
			}

			// Set the correct header, if data is being sent
			if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
				jqXHR.setRequestHeader( "Content-Type", s.contentType );
			}

			// Set the Accepts header for the server, depending on the dataType
			jqXHR.setRequestHeader(
				"Accept",
				s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
					s.accepts[ s.dataTypes[ 0 ] ] +
						( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
					s.accepts[ "*" ]
			);

			// Check for headers option
			for ( i in s.headers ) {
				jqXHR.setRequestHeader( i, s.headers[ i ] );
			}

			// Allow custom headers/mimetypes and early abort
			if ( s.beforeSend &&
				( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {

				// Abort if not done already and return
				return jqXHR.abort();
			}

			// Aborting is no longer a cancellation
			strAbort = "abort";

			// Install callbacks on deferreds
			for ( i in { success: 1, error: 1, complete: 1 } ) {
				jqXHR[ i ]( s[ i ] );
			}

			// Get transport
			transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

			// If no transport, we auto-abort
			if ( !transport ) {
				done( -1, "No Transport" );
			} else {
				jqXHR.readyState = 1;

				// Send global event
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
				}

				// If request was aborted inside ajaxSend, stop there
				if ( state === 2 ) {
					return jqXHR;
				}

				// Timeout
				if ( s.async && s.timeout > 0 ) {
					timeoutTimer = window.setTimeout( function() {
						jqXHR.abort( "timeout" );
					}, s.timeout );
				}

				try {
					state = 1;
					transport.send( requestHeaders, done );
				} catch ( e ) {

					// Propagate exception as error if not done
					if ( state < 2 ) {
						done( -1, e );

					// Simply rethrow otherwise
					} else {
						throw e;
					}
				}
			}

			// Callback for when everything is done
			function done( status, nativeStatusText, responses, headers ) {
				var isSuccess, success, error, response, modified,
					statusText = nativeStatusText;

				// Called once
				if ( state === 2 ) {
					return;
				}

				// State is "done" now
				state = 2;

				// Clear timeout if it exists
				if ( timeoutTimer ) {
					window.clearTimeout( timeoutTimer );
				}

				// Dereference transport for early garbage collection
				// (no matter how long the jqXHR object will be used)
				transport = undefined;

				// Cache response headers
				responseHeadersString = headers || "";

				// Set readyState
				jqXHR.readyState = status > 0 ? 4 : 0;

				// Determine if successful
				isSuccess = status >= 200 && status < 300 || status === 304;

				// Get response data
				if ( responses ) {
					response = ajaxHandleResponses( s, jqXHR, responses );
				}

				// Convert no matter what (that way responseXXX fields are always set)
				response = ajaxConvert( s, response, jqXHR, isSuccess );

				// If successful, handle type chaining
				if ( isSuccess ) {

					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if ( s.ifModified ) {
						modified = jqXHR.getResponseHeader( "Last-Modified" );
						if ( modified ) {
							jQuery.lastModified[ cacheURL ] = modified;
						}
						modified = jqXHR.getResponseHeader( "etag" );
						if ( modified ) {
							jQuery.etag[ cacheURL ] = modified;
						}
					}

					// if no content
					if ( status === 204 || s.type === "HEAD" ) {
						statusText = "nocontent";

					// if not modified
					} else if ( status === 304 ) {
						statusText = "notmodified";

					// If we have data, let's convert it
					} else {
						statusText = response.state;
						success = response.data;
						error = response.error;
						isSuccess = !error;
					}
				} else {

					// Extract error from statusText and normalize for non-aborts
					error = statusText;
					if ( status || !statusText ) {
						statusText = "error";
						if ( status < 0 ) {
							status = 0;
						}
					}
				}

				// Set data for the fake xhr object
				jqXHR.status = status;
				jqXHR.statusText = ( nativeStatusText || statusText ) + "";

				// Success/Error
				if ( isSuccess ) {
					deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
				} else {
					deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
				}

				// Status-dependent callbacks
				jqXHR.statusCode( statusCode );
				statusCode = undefined;

				if ( fireGlobals ) {
					globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
						[ jqXHR, s, isSuccess ? success : error ] );
				}

				// Complete
				completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

					// Handle the global AJAX counter
					if ( !( --jQuery.active ) ) {
						jQuery.event.trigger( "ajaxStop" );
					}
				}
			}

			return jqXHR;
		},

		getJSON: function( url, data, callback ) {
			return jQuery.get( url, data, callback, "json" );
		},

		getScript: function( url, callback ) {
			return jQuery.get( url, undefined, callback, "script" );
		}
	} );

	jQuery.each( [ "get", "post" ], function( i, method ) {
		jQuery[ method ] = function( url, data, callback, type ) {

			// Shift arguments if data argument was omitted
			if ( jQuery.isFunction( data ) ) {
				type = type || callback;
				callback = data;
				data = undefined;
			}

			// The url can be an options object (which then must have .url)
			return jQuery.ajax( jQuery.extend( {
				url: url,
				type: method,
				dataType: type,
				data: data,
				success: callback
			}, jQuery.isPlainObject( url ) && url ) );
		};
	} );


	jQuery._evalUrl = function( url ) {
		return jQuery.ajax( {
			url: url,

			// Make this explicit, since user can override this through ajaxSetup (#11264)
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		} );
	};


	jQuery.fn.extend( {
		wrapAll: function( html ) {
			var wrap;

			if ( jQuery.isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapAll( html.call( this, i ) );
				} );
			}

			if ( this[ 0 ] ) {

				// The elements to wrap the target around
				wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

				if ( this[ 0 ].parentNode ) {
					wrap.insertBefore( this[ 0 ] );
				}

				wrap.map( function() {
					var elem = this;

					while ( elem.firstElementChild ) {
						elem = elem.firstElementChild;
					}

					return elem;
				} ).append( this );
			}

			return this;
		},

		wrapInner: function( html ) {
			if ( jQuery.isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapInner( html.call( this, i ) );
				} );
			}

			return this.each( function() {
				var self = jQuery( this ),
					contents = self.contents();

				if ( contents.length ) {
					contents.wrapAll( html );

				} else {
					self.append( html );
				}
			} );
		},

		wrap: function( html ) {
			var isFunction = jQuery.isFunction( html );

			return this.each( function( i ) {
				jQuery( this ).wrapAll( isFunction ? html.call( this, i ) : html );
			} );
		},

		unwrap: function() {
			return this.parent().each( function() {
				if ( !jQuery.nodeName( this, "body" ) ) {
					jQuery( this ).replaceWith( this.childNodes );
				}
			} ).end();
		}
	} );


	jQuery.expr.filters.hidden = function( elem ) {
		return !jQuery.expr.filters.visible( elem );
	};
	jQuery.expr.filters.visible = function( elem ) {

		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		// Use OR instead of AND as the element is not visible if either is true
		// See tickets #10406 and #13132
		return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
	};




	var r20 = /%20/g,
		rbracket = /\[\]$/,
		rCRLF = /\r?\n/g,
		rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
		rsubmittable = /^(?:input|select|textarea|keygen)/i;

	function buildParams( prefix, obj, traditional, add ) {
		var name;

		if ( jQuery.isArray( obj ) ) {

			// Serialize array item.
			jQuery.each( obj, function( i, v ) {
				if ( traditional || rbracket.test( prefix ) ) {

					// Treat each array item as a scalar.
					add( prefix, v );

				} else {

					// Item is non-scalar (array or object), encode its numeric index.
					buildParams(
						prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
						v,
						traditional,
						add
					);
				}
			} );

		} else if ( !traditional && jQuery.type( obj ) === "object" ) {

			// Serialize object item.
			for ( name in obj ) {
				buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
			}

		} else {

			// Serialize scalar item.
			add( prefix, obj );
		}
	}

	// Serialize an array of form elements or a set of
	// key/values into a query string
	jQuery.param = function( a, traditional ) {
		var prefix,
			s = [],
			add = function( key, value ) {

				// If value is a function, invoke it and return its value
				value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
				s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
			};

		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
		}

		// If an array was passed in, assume that it is an array of form elements.
		if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			} );

		} else {

			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( prefix in a ) {
				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join( "&" ).replace( r20, "+" );
	};

	jQuery.fn.extend( {
		serialize: function() {
			return jQuery.param( this.serializeArray() );
		},
		serializeArray: function() {
			return this.map( function() {

				// Can add propHook for "elements" to filter or add form elements
				var elements = jQuery.prop( this, "elements" );
				return elements ? jQuery.makeArray( elements ) : this;
			} )
			.filter( function() {
				var type = this.type;

				// Use .is( ":disabled" ) so that fieldset[disabled] works
				return this.name && !jQuery( this ).is( ":disabled" ) &&
					rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
					( this.checked || !rcheckableType.test( type ) );
			} )
			.map( function( i, elem ) {
				var val = jQuery( this ).val();

				return val == null ?
					null :
					jQuery.isArray( val ) ?
						jQuery.map( val, function( val ) {
							return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
						} ) :
						{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
			} ).get();
		}
	} );


	jQuery.ajaxSettings.xhr = function() {
		try {
			return new window.XMLHttpRequest();
		} catch ( e ) {}
	};

	var xhrSuccessStatus = {

			// File protocol always yields status code 0, assume 200
			0: 200,

			// Support: IE9
			// #1450: sometimes IE returns 1223 when it should be 204
			1223: 204
		},
		xhrSupported = jQuery.ajaxSettings.xhr();

	support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
	support.ajax = xhrSupported = !!xhrSupported;

	jQuery.ajaxTransport( function( options ) {
		var callback, errorCallback;

		// Cross domain only allowed if supported through XMLHttpRequest
		if ( support.cors || xhrSupported && !options.crossDomain ) {
			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr();

					xhr.open(
						options.type,
						options.url,
						options.async,
						options.username,
						options.password
					);

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						xhr.setRequestHeader( i, headers[ i ] );
					}

					// Callback
					callback = function( type ) {
						return function() {
							if ( callback ) {
								callback = errorCallback = xhr.onload =
									xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;

								if ( type === "abort" ) {
									xhr.abort();
								} else if ( type === "error" ) {

									// Support: IE9
									// On a manual native abort, IE9 throws
									// errors on any property access that is not readyState
									if ( typeof xhr.status !== "number" ) {
										complete( 0, "error" );
									} else {
										complete(

											// File: protocol always yields status 0; see #8605, #14207
											xhr.status,
											xhr.statusText
										);
									}
								} else {
									complete(
										xhrSuccessStatus[ xhr.status ] || xhr.status,
										xhr.statusText,

										// Support: IE9 only
										// IE9 has no XHR2 but throws on binary (trac-11426)
										// For XHR2 non-text, let the caller handle it (gh-2498)
										( xhr.responseType || "text" ) !== "text"  ||
										typeof xhr.responseText !== "string" ?
											{ binary: xhr.response } :
											{ text: xhr.responseText },
										xhr.getAllResponseHeaders()
									);
								}
							}
						};
					};

					// Listen to events
					xhr.onload = callback();
					errorCallback = xhr.onerror = callback( "error" );

					// Support: IE9
					// Use onreadystatechange to replace onabort
					// to handle uncaught aborts
					if ( xhr.onabort !== undefined ) {
						xhr.onabort = errorCallback;
					} else {
						xhr.onreadystatechange = function() {

							// Check readyState before timeout as it changes
							if ( xhr.readyState === 4 ) {

								// Allow onerror to be called first,
								// but that will not handle a native abort
								// Also, save errorCallback to a variable
								// as xhr.onerror cannot be accessed
								window.setTimeout( function() {
									if ( callback ) {
										errorCallback();
									}
								} );
							}
						};
					}

					// Create the abort callback
					callback = callback( "abort" );

					try {

						// Do send the request (this may raise an exception)
						xhr.send( options.hasContent && options.data || null );
					} catch ( e ) {

						// #14683: Only rethrow if this hasn't been notified as an error yet
						if ( callback ) {
							throw e;
						}
					}
				},

				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	// Install script dataType
	jQuery.ajaxSetup( {
		accepts: {
			script: "text/javascript, application/javascript, " +
				"application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /\b(?:java|ecma)script\b/
		},
		converters: {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			}
		}
	} );

	// Handle cache's special case and crossDomain
	jQuery.ajaxPrefilter( "script", function( s ) {
		if ( s.cache === undefined ) {
			s.cache = false;
		}
		if ( s.crossDomain ) {
			s.type = "GET";
		}
	} );

	// Bind script tag hack transport
	jQuery.ajaxTransport( "script", function( s ) {

		// This transport only deals with cross domain requests
		if ( s.crossDomain ) {
			var script, callback;
			return {
				send: function( _, complete ) {
					script = jQuery( "<script>" ).prop( {
						charset: s.scriptCharset,
						src: s.url
					} ).on(
						"load error",
						callback = function( evt ) {
							script.remove();
							callback = null;
							if ( evt ) {
								complete( evt.type === "error" ? 404 : 200, evt.type );
							}
						}
					);

					// Use native DOM manipulation to avoid our domManip AJAX trickery
					document.head.appendChild( script[ 0 ] );
				},
				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	var oldCallbacks = [],
		rjsonp = /(=)\?(?=&|$)|\?\?/;

	// Default jsonp settings
	jQuery.ajaxSetup( {
		jsonp: "callback",
		jsonpCallback: function() {
			var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
			this[ callback ] = true;
			return callback;
		}
	} );

	// Detect, normalize options and install callbacks for jsonp requests
	jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

		var callbackName, overwritten, responseContainer,
			jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
				"url" :
				typeof s.data === "string" &&
					( s.contentType || "" )
						.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
					rjsonp.test( s.data ) && "data"
			);

		// Handle iff the expected data type is "jsonp" or we have a parameter to set
		if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

			// Get callback name, remembering preexisting value associated with it
			callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
				s.jsonpCallback() :
				s.jsonpCallback;

			// Insert callback into url or form data
			if ( jsonProp ) {
				s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
			} else if ( s.jsonp !== false ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
			}

			// Use data converter to retrieve json after script execution
			s.converters[ "script json" ] = function() {
				if ( !responseContainer ) {
					jQuery.error( callbackName + " was not called" );
				}
				return responseContainer[ 0 ];
			};

			// Force json dataType
			s.dataTypes[ 0 ] = "json";

			// Install callback
			overwritten = window[ callbackName ];
			window[ callbackName ] = function() {
				responseContainer = arguments;
			};

			// Clean-up function (fires after converters)
			jqXHR.always( function() {

				// If previous value didn't exist - remove it
				if ( overwritten === undefined ) {
					jQuery( window ).removeProp( callbackName );

				// Otherwise restore preexisting value
				} else {
					window[ callbackName ] = overwritten;
				}

				// Save back as free
				if ( s[ callbackName ] ) {

					// Make sure that re-using the options doesn't screw things around
					s.jsonpCallback = originalSettings.jsonpCallback;

					// Save the callback name for future use
					oldCallbacks.push( callbackName );
				}

				// Call if it was a function and we have a response
				if ( responseContainer && jQuery.isFunction( overwritten ) ) {
					overwritten( responseContainer[ 0 ] );
				}

				responseContainer = overwritten = undefined;
			} );

			// Delegate to script
			return "script";
		}
	} );




	// Support: Safari 8+
	// In Safari 8 documents created via document.implementation.createHTMLDocument
	// collapse sibling forms: the second one becomes a child of the first one.
	// Because of that, this security measure has to be disabled in Safari 8.
	// https://bugs.webkit.org/show_bug.cgi?id=137337
	support.createHTMLDocument = ( function() {
		var body = document.implementation.createHTMLDocument( "" ).body;
		body.innerHTML = "<form></form><form></form>";
		return body.childNodes.length === 2;
	} )();


	// Argument "data" should be string of html
	// context (optional): If specified, the fragment will be created in this context,
	// defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	jQuery.parseHTML = function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		context = context || ( support.createHTMLDocument ?
			document.implementation.createHTMLDocument( "" ) :
			document );

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[ 1 ] ) ];
		}

		parsed = buildFragment( [ data ], context, scripts );

		if ( scripts && scripts.length ) {
			jQuery( scripts ).remove();
		}

		return jQuery.merge( [], parsed.childNodes );
	};


	// Keep a copy of the old load method
	var _load = jQuery.fn.load;

	/**
	 * Load a url into a page
	 */
	jQuery.fn.load = function( url, params, callback ) {
		if ( typeof url !== "string" && _load ) {
			return _load.apply( this, arguments );
		}

		var selector, type, response,
			self = this,
			off = url.indexOf( " " );

		if ( off > -1 ) {
			selector = jQuery.trim( url.slice( off ) );
			url = url.slice( 0, off );
		}

		// If it's a function
		if ( jQuery.isFunction( params ) ) {

			// We assume that it's the callback
			callback = params;
			params = undefined;

		// Otherwise, build a param string
		} else if ( params && typeof params === "object" ) {
			type = "POST";
		}

		// If we have elements to modify, make the request
		if ( self.length > 0 ) {
			jQuery.ajax( {
				url: url,

				// If "type" variable is undefined, then "GET" method will be used.
				// Make value of this field explicit since
				// user can override it through ajaxSetup method
				type: type || "GET",
				dataType: "html",
				data: params
			} ).done( function( responseText ) {

				// Save response for use in complete callback
				response = arguments;

				self.html( selector ?

					// If a selector was specified, locate the right elements in a dummy div
					// Exclude scripts to avoid IE 'Permission Denied' errors
					jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

					// Otherwise use the full result
					responseText );

			// If the request succeeds, this function gets "data", "status", "jqXHR"
			// but they are ignored because response was set above.
			// If it fails, this function gets "jqXHR", "status", "error"
			} ).always( callback && function( jqXHR, status ) {
				self.each( function() {
					callback.apply( self, response || [ jqXHR.responseText, status, jqXHR ] );
				} );
			} );
		}

		return this;
	};




	// Attach a bunch of functions for handling common AJAX events
	jQuery.each( [
		"ajaxStart",
		"ajaxStop",
		"ajaxComplete",
		"ajaxError",
		"ajaxSuccess",
		"ajaxSend"
	], function( i, type ) {
		jQuery.fn[ type ] = function( fn ) {
			return this.on( type, fn );
		};
	} );




	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep( jQuery.timers, function( fn ) {
			return elem === fn.elem;
		} ).length;
	};




	/**
	 * Gets a window from an element
	 */
	function getWindow( elem ) {
		return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
	}

	jQuery.offset = {
		setOffset: function( elem, options, i ) {
			var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
				position = jQuery.css( elem, "position" ),
				curElem = jQuery( elem ),
				props = {};

			// Set position first, in-case top/left are set even on static elem
			if ( position === "static" ) {
				elem.style.position = "relative";
			}

			curOffset = curElem.offset();
			curCSSTop = jQuery.css( elem, "top" );
			curCSSLeft = jQuery.css( elem, "left" );
			calculatePosition = ( position === "absolute" || position === "fixed" ) &&
				( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

			// Need to be able to calculate position if either
			// top or left is auto and position is either absolute or fixed
			if ( calculatePosition ) {
				curPosition = curElem.position();
				curTop = curPosition.top;
				curLeft = curPosition.left;

			} else {
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}

			if ( jQuery.isFunction( options ) ) {

				// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
				options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
			}

			if ( options.top != null ) {
				props.top = ( options.top - curOffset.top ) + curTop;
			}
			if ( options.left != null ) {
				props.left = ( options.left - curOffset.left ) + curLeft;
			}

			if ( "using" in options ) {
				options.using.call( elem, props );

			} else {
				curElem.css( props );
			}
		}
	};

	jQuery.fn.extend( {
		offset: function( options ) {
			if ( arguments.length ) {
				return options === undefined ?
					this :
					this.each( function( i ) {
						jQuery.offset.setOffset( this, options, i );
					} );
			}

			var docElem, win,
				elem = this[ 0 ],
				box = { top: 0, left: 0 },
				doc = elem && elem.ownerDocument;

			if ( !doc ) {
				return;
			}

			docElem = doc.documentElement;

			// Make sure it's not a disconnected DOM node
			if ( !jQuery.contains( docElem, elem ) ) {
				return box;
			}

			box = elem.getBoundingClientRect();
			win = getWindow( doc );
			return {
				top: box.top + win.pageYOffset - docElem.clientTop,
				left: box.left + win.pageXOffset - docElem.clientLeft
			};
		},

		position: function() {
			if ( !this[ 0 ] ) {
				return;
			}

			var offsetParent, offset,
				elem = this[ 0 ],
				parentOffset = { top: 0, left: 0 };

			// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
			// because it is its only offset parent
			if ( jQuery.css( elem, "position" ) === "fixed" ) {

				// Assume getBoundingClientRect is there when computed position is fixed
				offset = elem.getBoundingClientRect();

			} else {

				// Get *real* offsetParent
				offsetParent = this.offsetParent();

				// Get correct offsets
				offset = this.offset();
				if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
					parentOffset = offsetParent.offset();
				}

				// Add offsetParent borders
				parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
			}

			// Subtract parent offsets and element margins
			return {
				top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
				left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
			};
		},

		// This method will return documentElement in the following cases:
		// 1) For the element inside the iframe without offsetParent, this method will return
		//    documentElement of the parent window
		// 2) For the hidden or detached element
		// 3) For body or html element, i.e. in case of the html node - it will return itself
		//
		// but those exceptions were never presented as a real life use-cases
		// and might be considered as more preferable results.
		//
		// This logic, however, is not guaranteed and can change at any point in the future
		offsetParent: function() {
			return this.map( function() {
				var offsetParent = this.offsetParent;

				while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || documentElement;
			} );
		}
	} );

	// Create scrollLeft and scrollTop methods
	jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
		var top = "pageYOffset" === prop;

		jQuery.fn[ method ] = function( val ) {
			return access( this, function( elem, method, val ) {
				var win = getWindow( elem );

				if ( val === undefined ) {
					return win ? win[ prop ] : elem[ method ];
				}

				if ( win ) {
					win.scrollTo(
						!top ? val : win.pageXOffset,
						top ? val : win.pageYOffset
					);

				} else {
					elem[ method ] = val;
				}
			}, method, val, arguments.length );
		};
	} );

	// Support: Safari<7-8+, Chrome<37-44+
	// Add the top/left cssHooks using jQuery.fn.position
	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
	// getComputedStyle returns percent when specified for top/left/bottom/right;
	// rather than make the css module depend on the offset module, just check for it here
	jQuery.each( [ "top", "left" ], function( i, prop ) {
		jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
			function( elem, computed ) {
				if ( computed ) {
					computed = curCSS( elem, prop );

					// If curCSS returns percentage, fallback to offset
					return rnumnonpx.test( computed ) ?
						jQuery( elem ).position()[ prop ] + "px" :
						computed;
				}
			}
		);
	} );


	// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
	jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
		jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
			function( defaultExtra, funcName ) {

			// Margin is only for outerHeight, outerWidth
			jQuery.fn[ funcName ] = function( margin, value ) {
				var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
					extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

				return access( this, function( elem, type, value ) {
					var doc;

					if ( jQuery.isWindow( elem ) ) {

						// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
						// isn't a whole lot we can do. See pull request at this URL for discussion:
						// https://github.com/jquery/jquery/pull/764
						return elem.document.documentElement[ "client" + name ];
					}

					// Get document width or height
					if ( elem.nodeType === 9 ) {
						doc = elem.documentElement;

						// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
						// whichever is greatest
						return Math.max(
							elem.body[ "scroll" + name ], doc[ "scroll" + name ],
							elem.body[ "offset" + name ], doc[ "offset" + name ],
							doc[ "client" + name ]
						);
					}

					return value === undefined ?

						// Get width or height on the element, requesting but not forcing parseFloat
						jQuery.css( elem, type, extra ) :

						// Set width or height on the element
						jQuery.style( elem, type, value, extra );
				}, type, chainable ? margin : undefined, chainable, null );
			};
		} );
	} );


	jQuery.fn.extend( {

		bind: function( types, data, fn ) {
			return this.on( types, null, data, fn );
		},
		unbind: function( types, fn ) {
			return this.off( types, null, fn );
		},

		delegate: function( selector, types, data, fn ) {
			return this.on( types, selector, data, fn );
		},
		undelegate: function( selector, types, fn ) {

			// ( namespace ) or ( selector, types [, fn] )
			return arguments.length === 1 ?
				this.off( selector, "**" ) :
				this.off( types, selector || "**", fn );
		},
		size: function() {
			return this.length;
		}
	} );

	jQuery.fn.andSelf = jQuery.fn.addBack;




	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.

	// Note that for maximum portability, libraries that are not jQuery should
	// declare themselves as anonymous modules, and avoid setting a global if an
	// AMD loader is present. jQuery is a special case. For more information, see
	// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

	if ( true ) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return jQuery;
		}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}



	var

		// Map over jQuery in case of overwrite
		_jQuery = window.jQuery,

		// Map over the $ in case of overwrite
		_$ = window.$;

	jQuery.noConflict = function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	};

	// Expose jQuery and $ identifiers, even in AMD
	// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
	// and CommonJS for browser emulators (#13566)
	if ( !noGlobal ) {
		window.jQuery = window.$ = jQuery;
	}

	return jQuery;
	}));


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * jQuery MiniColors: A tiny color picker built on jQuery
	 *
	 * Copyright: Cory LaViska for A Beautiful Site, LLC: http://www.abeautifulsite.net/
	 *
	 * Contribute: https://github.com/claviska/jquery-minicolors
	 *
	 * @license: http://opensource.org/licenses/MIT
	 *
	 */
	(function (factory) {
	    /* jshint ignore:start */
	    if (true) {
	        // AMD. Register as an anonymous module.
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        // Node/CommonJS
	        module.exports = factory(require('jquery'));
	    } else {
	        // Browser globals
	        factory(jQuery);
	    }
	    /* jshint ignore:end */
	}(function ($) {

	    // Defaults
	    $.minicolors = {
	        defaults: {
	            animationSpeed: 50,
	            animationEasing: 'swing',
	            change: null,
	            changeDelay: 0,
	            control: 'hue',
	            dataUris: true,
	            defaultValue: '',
	            hide: null,
	            hideSpeed: 100,
	            inline: false,
	            letterCase: 'lowercase',
	            opacity: false,
	            position: 'bottom left',
	            show: null,
	            showSpeed: 100,
	            theme: 'default'
	        }
	    };

	    // Public methods
	    $.extend($.fn, {
	        minicolors: function(method, data) {

	            switch(method) {

	                // Destroy the control
	                case 'destroy':
	                    $(this).each( function() {
	                        destroy($(this));
	                    });
	                    return $(this);

	                // Hide the color picker
	                case 'hide':
	                    hide();
	                    return $(this);

	                // Get/set opacity
	                case 'opacity':
	                    // Getter
	                    if( data === undefined ) {
	                        // Getter
	                        return $(this).attr('data-opacity');
	                    } else {
	                        // Setter
	                        $(this).each( function() {
	                            updateFromInput($(this).attr('data-opacity', data));
	                        });
	                    }
	                    return $(this);

	                // Get an RGB(A) object based on the current color/opacity
	                case 'rgbObject':
	                    return rgbObject($(this), method === 'rgbaObject');

	                // Get an RGB(A) string based on the current color/opacity
	                case 'rgbString':
	                case 'rgbaString':
	                    return rgbString($(this), method === 'rgbaString');

	                // Get/set settings on the fly
	                case 'settings':
	                    if( data === undefined ) {
	                        return $(this).data('minicolors-settings');
	                    } else {
	                        // Setter
	                        $(this).each( function() {
	                            var settings = $(this).data('minicolors-settings') || {};
	                            destroy($(this));
	                            $(this).minicolors($.extend(true, settings, data));
	                        });
	                    }
	                    return $(this);

	                // Show the color picker
	                case 'show':
	                    show( $(this).eq(0) );
	                    return $(this);

	                // Get/set the hex color value
	                case 'value':
	                    if( data === undefined ) {
	                        // Getter
	                        return $(this).val();
	                    } else {
	                        // Setter
	                        $(this).each( function() {
	                            updateFromInput($(this).val(data));
	                        });
	                    }
	                    return $(this);

	                // Initializes the control
	                default:
	                    if( method !== 'create' ) data = method;
	                    $(this).each( function() {
	                        init($(this), data);
	                    });
	                    return $(this);

	            }

	        }
	    });

	    // Initialize input elements
	    function init(input, settings) {

	        var minicolors = $('<div class="minicolors" />'),
	            defaults = $.minicolors.defaults;

	        // Do nothing if already initialized
	        if( input.data('minicolors-initialized') ) return;

	        // Handle settings
	        settings = $.extend(true, {}, defaults, settings);

	        // The wrapper
	        minicolors
	            .addClass('minicolors-theme-' + settings.theme)
	            .toggleClass('minicolors-with-opacity', settings.opacity)
	            .toggleClass('minicolors-no-data-uris', settings.dataUris !== true);

	        // Custom positioning
	        if( settings.position !== undefined ) {
	            $.each(settings.position.split(' '), function() {
	                minicolors.addClass('minicolors-position-' + this);
	            });
	        }

	        // The input
	        input
	            .addClass('minicolors-input')
	            .data('minicolors-initialized', false)
	            .data('minicolors-settings', settings)
	            .prop('size', 7)
	            .wrap(minicolors)
	            .after(
	                '<div class="minicolors-panel minicolors-slider-' + settings.control + '">' +
	                    '<div class="minicolors-slider minicolors-sprite">' +
	                        '<div class="minicolors-picker"></div>' +
	                    '</div>' +
	                    '<div class="minicolors-opacity-slider minicolors-sprite">' +
	                        '<div class="minicolors-picker"></div>' +
	                    '</div>' +
	                    '<div class="minicolors-grid minicolors-sprite">' +
	                        '<div class="minicolors-grid-inner"></div>' +
	                        '<div class="minicolors-picker"><div></div></div>' +
	                    '</div>' +
	                '</div>'
	            );

	        // The swatch
	        if( !settings.inline ) {
	            input.after('<span class="minicolors-swatch minicolors-sprite"><span class="minicolors-swatch-color"></span></span>');
	            input.next('.minicolors-swatch').on('click', function(event) {
	                event.preventDefault();
	                input.focus();
	            });
	        }

	        // Prevent text selection in IE
	        input.parent().find('.minicolors-panel').on('selectstart', function() { return false; }).end();

	        // Inline controls
	        if( settings.inline ) input.parent().addClass('minicolors-inline');

	        updateFromInput(input, false);

	        input.data('minicolors-initialized', true);

	    }

	    // Returns the input back to its original state
	    function destroy(input) {

	        var minicolors = input.parent();

	        // Revert the input element
	        input
	            .removeData('minicolors-initialized')
	            .removeData('minicolors-settings')
	            .removeProp('size')
	            .removeClass('minicolors-input');

	        // Remove the wrap and destroy whatever remains
	        minicolors.before(input).remove();

	    }

	    // Shows the specified dropdown panel
	    function show(input) {

	        var minicolors = input.parent(),
	            panel = minicolors.find('.minicolors-panel'),
	            settings = input.data('minicolors-settings');

	        // Do nothing if uninitialized, disabled, inline, or already open
	        if( !input.data('minicolors-initialized') ||
	            input.prop('disabled') ||
	            minicolors.hasClass('minicolors-inline') ||
	            minicolors.hasClass('minicolors-focus')
	        ) return;

	        hide();

	        minicolors.addClass('minicolors-focus');
	        panel
	            .stop(true, true)
	            .fadeIn(settings.showSpeed, function() {
	                if( settings.show ) settings.show.call(input.get(0));
	            });

	    }

	    // Hides all dropdown panels
	    function hide() {

	        $('.minicolors-focus').each( function() {

	            var minicolors = $(this),
	                input = minicolors.find('.minicolors-input'),
	                panel = minicolors.find('.minicolors-panel'),
	                settings = input.data('minicolors-settings');

	            panel.fadeOut(settings.hideSpeed, function() {
	                if( settings.hide ) settings.hide.call(input.get(0));
	                minicolors.removeClass('minicolors-focus');
	            });

	        });
	    }

	    // Moves the selected picker
	    function move(target, event, animate) {

	        var input = target.parents('.minicolors').find('.minicolors-input'),
	            settings = input.data('minicolors-settings'),
	            picker = target.find('[class$=-picker]'),
	            offsetX = target.offset().left,
	            offsetY = target.offset().top,
	            x = Math.round(event.pageX - offsetX),
	            y = Math.round(event.pageY - offsetY),
	            duration = animate ? settings.animationSpeed : 0,
	            wx, wy, r, phi;

	        // Touch support
	        if( event.originalEvent.changedTouches ) {
	            x = event.originalEvent.changedTouches[0].pageX - offsetX;
	            y = event.originalEvent.changedTouches[0].pageY - offsetY;
	        }

	        // Constrain picker to its container
	        if( x < 0 ) x = 0;
	        if( y < 0 ) y = 0;
	        if( x > target.width() ) x = target.width();
	        if( y > target.height() ) y = target.height();

	        // Constrain color wheel values to the wheel
	        if( target.parent().is('.minicolors-slider-wheel') && picker.parent().is('.minicolors-grid') ) {
	            wx = 75 - x;
	            wy = 75 - y;
	            r = Math.sqrt(wx * wx + wy * wy);
	            phi = Math.atan2(wy, wx);
	            if( phi < 0 ) phi += Math.PI * 2;
	            if( r > 75 ) {
	                r = 75;
	                x = 75 - (75 * Math.cos(phi));
	                y = 75 - (75 * Math.sin(phi));
	            }
	            x = Math.round(x);
	            y = Math.round(y);
	        }

	        // Move the picker
	        if( target.is('.minicolors-grid') ) {
	            picker
	                .stop(true)
	                .animate({
	                    top: y + 'px',
	                    left: x + 'px'
	                }, duration, settings.animationEasing, function() {
	                    updateFromControl(input, target);
	                });
	        } else {
	            picker
	                .stop(true)
	                .animate({
	                    top: y + 'px'
	                }, duration, settings.animationEasing, function() {
	                    updateFromControl(input, target);
	                });
	        }

	    }

	    // Sets the input based on the color picker values
	    function updateFromControl(input, target) {

	        function getCoords(picker, container) {

	            var left, top;
	            if( !picker.length || !container ) return null;
	            left = picker.offset().left;
	            top = picker.offset().top;

	            return {
	                x: left - container.offset().left + (picker.outerWidth() / 2),
	                y: top - container.offset().top + (picker.outerHeight() / 2)
	            };

	        }

	        var hue, saturation, brightness, x, y, r, phi,

	            hex = input.val(),
	            opacity = input.attr('data-opacity'),

	            // Helpful references
	            minicolors = input.parent(),
	            settings = input.data('minicolors-settings'),
	            swatch = minicolors.find('.minicolors-swatch'),

	            // Panel objects
	            grid = minicolors.find('.minicolors-grid'),
	            slider = minicolors.find('.minicolors-slider'),
	            opacitySlider = minicolors.find('.minicolors-opacity-slider'),

	            // Picker objects
	            gridPicker = grid.find('[class$=-picker]'),
	            sliderPicker = slider.find('[class$=-picker]'),
	            opacityPicker = opacitySlider.find('[class$=-picker]'),

	            // Picker positions
	            gridPos = getCoords(gridPicker, grid),
	            sliderPos = getCoords(sliderPicker, slider),
	            opacityPos = getCoords(opacityPicker, opacitySlider);

	        // Handle colors
	        if( target.is('.minicolors-grid, .minicolors-slider') ) {

	            // Determine HSB values
	            switch(settings.control) {

	                case 'wheel':
	                    // Calculate hue, saturation, and brightness
	                    x = (grid.width() / 2) - gridPos.x;
	                    y = (grid.height() / 2) - gridPos.y;
	                    r = Math.sqrt(x * x + y * y);
	                    phi = Math.atan2(y, x);
	                    if( phi < 0 ) phi += Math.PI * 2;
	                    if( r > 75 ) {
	                        r = 75;
	                        gridPos.x = 69 - (75 * Math.cos(phi));
	                        gridPos.y = 69 - (75 * Math.sin(phi));
	                    }
	                    saturation = keepWithin(r / 0.75, 0, 100);
	                    hue = keepWithin(phi * 180 / Math.PI, 0, 360);
	                    brightness = keepWithin(100 - Math.floor(sliderPos.y * (100 / slider.height())), 0, 100);
	                    hex = hsb2hex({
	                        h: hue,
	                        s: saturation,
	                        b: brightness
	                    });

	                    // Update UI
	                    slider.css('backgroundColor', hsb2hex({ h: hue, s: saturation, b: 100 }));
	                    break;

	                case 'saturation':
	                    // Calculate hue, saturation, and brightness
	                    hue = keepWithin(parseInt(gridPos.x * (360 / grid.width()), 10), 0, 360);
	                    saturation = keepWithin(100 - Math.floor(sliderPos.y * (100 / slider.height())), 0, 100);
	                    brightness = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
	                    hex = hsb2hex({
	                        h: hue,
	                        s: saturation,
	                        b: brightness
	                    });

	                    // Update UI
	                    slider.css('backgroundColor', hsb2hex({ h: hue, s: 100, b: brightness }));
	                    minicolors.find('.minicolors-grid-inner').css('opacity', saturation / 100);
	                    break;

	                case 'brightness':
	                    // Calculate hue, saturation, and brightness
	                    hue = keepWithin(parseInt(gridPos.x * (360 / grid.width()), 10), 0, 360);
	                    saturation = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
	                    brightness = keepWithin(100 - Math.floor(sliderPos.y * (100 / slider.height())), 0, 100);
	                    hex = hsb2hex({
	                        h: hue,
	                        s: saturation,
	                        b: brightness
	                    });

	                    // Update UI
	                    slider.css('backgroundColor', hsb2hex({ h: hue, s: saturation, b: 100 }));
	                    minicolors.find('.minicolors-grid-inner').css('opacity', 1 - (brightness / 100));
	                    break;

	                default:
	                    // Calculate hue, saturation, and brightness
	                    hue = keepWithin(360 - parseInt(sliderPos.y * (360 / slider.height()), 10), 0, 360);
	                    saturation = keepWithin(Math.floor(gridPos.x * (100 / grid.width())), 0, 100);
	                    brightness = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
	                    hex = hsb2hex({
	                        h: hue,
	                        s: saturation,
	                        b: brightness
	                    });

	                    // Update UI
	                    grid.css('backgroundColor', hsb2hex({ h: hue, s: 100, b: 100 }));
	                    break;

	            }

	            // Adjust case
	            input.val( convertCase(hex, settings.letterCase) );

	        }

	        // Handle opacity
	        if( target.is('.minicolors-opacity-slider') ) {
	            if( settings.opacity ) {
	                opacity = parseFloat(1 - (opacityPos.y / opacitySlider.height())).toFixed(2);
	            } else {
	                opacity = 1;
	            }
	            if( settings.opacity ) input.attr('data-opacity', opacity);
	        }

	        // Set swatch color
	        swatch.find('SPAN').css({
	            backgroundColor: hex,
	            opacity: opacity
	        });

	        // Handle change event
	        doChange(input, hex, opacity);

	    }

	    // Sets the color picker values from the input
	    function updateFromInput(input, preserveInputValue) {

	        var hex,
	            hsb,
	            opacity,
	            x, y, r, phi,

	            // Helpful references
	            minicolors = input.parent(),
	            settings = input.data('minicolors-settings'),
	            swatch = minicolors.find('.minicolors-swatch'),

	            // Panel objects
	            grid = minicolors.find('.minicolors-grid'),
	            slider = minicolors.find('.minicolors-slider'),
	            opacitySlider = minicolors.find('.minicolors-opacity-slider'),

	            // Picker objects
	            gridPicker = grid.find('[class$=-picker]'),
	            sliderPicker = slider.find('[class$=-picker]'),
	            opacityPicker = opacitySlider.find('[class$=-picker]');

	        // Determine hex/HSB values
	        hex = convertCase(parseHex(input.val(), true), settings.letterCase);
	        if( !hex ){
	            hex = convertCase(parseHex(settings.defaultValue, true), settings.letterCase);
	        }
	        hsb = hex2hsb(hex);

	        // Update input value
	        if( !preserveInputValue ) input.val(hex);

	        // Determine opacity value
	        if( settings.opacity ) {
	            // Get from data-opacity attribute and keep within 0-1 range
	            opacity = input.attr('data-opacity') === '' ? 1 : keepWithin(parseFloat(input.attr('data-opacity')).toFixed(2), 0, 1);
	            if( isNaN(opacity) ) opacity = 1;
	            input.attr('data-opacity', opacity);
	            swatch.find('SPAN').css('opacity', opacity);

	            // Set opacity picker position
	            y = keepWithin(opacitySlider.height() - (opacitySlider.height() * opacity), 0, opacitySlider.height());
	            opacityPicker.css('top', y + 'px');
	        }

	        // Update swatch
	        swatch.find('SPAN').css('backgroundColor', hex);

	        // Determine picker locations
	        switch(settings.control) {

	            case 'wheel':
	                // Set grid position
	                r = keepWithin(Math.ceil(hsb.s * 0.75), 0, grid.height() / 2);
	                phi = hsb.h * Math.PI / 180;
	                x = keepWithin(75 - Math.cos(phi) * r, 0, grid.width());
	                y = keepWithin(75 - Math.sin(phi) * r, 0, grid.height());
	                gridPicker.css({
	                    top: y + 'px',
	                    left: x + 'px'
	                });

	                // Set slider position
	                y = 150 - (hsb.b / (100 / grid.height()));
	                if( hex === '' ) y = 0;
	                sliderPicker.css('top', y + 'px');

	                // Update panel color
	                slider.css('backgroundColor', hsb2hex({ h: hsb.h, s: hsb.s, b: 100 }));
	                break;

	            case 'saturation':
	                // Set grid position
	                x = keepWithin((5 * hsb.h) / 12, 0, 150);
	                y = keepWithin(grid.height() - Math.ceil(hsb.b / (100 / grid.height())), 0, grid.height());
	                gridPicker.css({
	                    top: y + 'px',
	                    left: x + 'px'
	                });

	                // Set slider position
	                y = keepWithin(slider.height() - (hsb.s * (slider.height() / 100)), 0, slider.height());
	                sliderPicker.css('top', y + 'px');

	                // Update UI
	                slider.css('backgroundColor', hsb2hex({ h: hsb.h, s: 100, b: hsb.b }));
	                minicolors.find('.minicolors-grid-inner').css('opacity', hsb.s / 100);
	                break;

	            case 'brightness':
	                // Set grid position
	                x = keepWithin((5 * hsb.h) / 12, 0, 150);
	                y = keepWithin(grid.height() - Math.ceil(hsb.s / (100 / grid.height())), 0, grid.height());
	                gridPicker.css({
	                    top: y + 'px',
	                    left: x + 'px'
	                });

	                // Set slider position
	                y = keepWithin(slider.height() - (hsb.b * (slider.height() / 100)), 0, slider.height());
	                sliderPicker.css('top', y + 'px');

	                // Update UI
	                slider.css('backgroundColor', hsb2hex({ h: hsb.h, s: hsb.s, b: 100 }));
	                minicolors.find('.minicolors-grid-inner').css('opacity', 1 - (hsb.b / 100));
	                break;

	            default:
	                // Set grid position
	                x = keepWithin(Math.ceil(hsb.s / (100 / grid.width())), 0, grid.width());
	                y = keepWithin(grid.height() - Math.ceil(hsb.b / (100 / grid.height())), 0, grid.height());
	                gridPicker.css({
	                    top: y + 'px',
	                    left: x + 'px'
	                });

	                // Set slider position
	                y = keepWithin(slider.height() - (hsb.h / (360 / slider.height())), 0, slider.height());
	                sliderPicker.css('top', y + 'px');

	                // Update panel color
	                grid.css('backgroundColor', hsb2hex({ h: hsb.h, s: 100, b: 100 }));
	                break;

	        }

	        // Fire change event, but only if minicolors is fully initialized
	        if( input.data('minicolors-initialized') ) {
	            doChange(input, hex, opacity);
	        }

	    }

	    // Runs the change and changeDelay callbacks
	    function doChange(input, hex, opacity) {

	        var settings = input.data('minicolors-settings'),
	            lastChange = input.data('minicolors-lastChange');

	        // Only run if it actually changed
	        if( !lastChange || lastChange.hex !== hex || lastChange.opacity !== opacity ) {

	            // Remember last-changed value
	            input.data('minicolors-lastChange', {
	                hex: hex,
	                opacity: opacity
	            });

	            // Fire change event
	            if( settings.change ) {
	                if( settings.changeDelay ) {
	                    // Call after a delay
	                    clearTimeout(input.data('minicolors-changeTimeout'));
	                    input.data('minicolors-changeTimeout', setTimeout( function() {
	                        settings.change.call(input.get(0), hex, opacity);
	                    }, settings.changeDelay));
	                } else {
	                    // Call immediately
	                    settings.change.call(input.get(0), hex, opacity);
	                }
	            }
	            input.trigger('change').trigger('input');
	        }

	    }

	    // Generates an RGB(A) object based on the input's value
	    function rgbObject(input) {
	        var hex = parseHex($(input).val(), true),
	            rgb = hex2rgb(hex),
	            opacity = $(input).attr('data-opacity');
	        if( !rgb ) return null;
	        if( opacity !== undefined ) $.extend(rgb, { a: parseFloat(opacity) });
	        return rgb;
	    }

	    // Genearates an RGB(A) string based on the input's value
	    function rgbString(input, alpha) {
	        var hex = parseHex($(input).val(), true),
	            rgb = hex2rgb(hex),
	            opacity = $(input).attr('data-opacity');
	        if( !rgb ) return null;
	        if( opacity === undefined ) opacity = 1;
	        if( alpha ) {
	            return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + parseFloat(opacity) + ')';
	        } else {
	            return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
	        }
	    }

	    // Converts to the letter case specified in settings
	    function convertCase(string, letterCase) {
	        return letterCase === 'uppercase' ? string.toUpperCase() : string.toLowerCase();
	    }

	    // Parses a string and returns a valid hex string when possible
	    function parseHex(string, expand) {
	        string = string.replace(/[^A-F0-9]/ig, '');
	        if( string.length !== 3 && string.length !== 6 ) return '';
	        if( string.length === 3 && expand ) {
	            string = string[0] + string[0] + string[1] + string[1] + string[2] + string[2];
	        }
	        return '#' + string;
	    }

	    // Keeps value within min and max
	    function keepWithin(value, min, max) {
	        if( value < min ) value = min;
	        if( value > max ) value = max;
	        return value;
	    }

	    // Converts an HSB object to an RGB object
	    function hsb2rgb(hsb) {
	        var rgb = {};
	        var h = Math.round(hsb.h);
	        var s = Math.round(hsb.s * 255 / 100);
	        var v = Math.round(hsb.b * 255 / 100);
	        if(s === 0) {
	            rgb.r = rgb.g = rgb.b = v;
	        } else {
	            var t1 = v;
	            var t2 = (255 - s) * v / 255;
	            var t3 = (t1 - t2) * (h % 60) / 60;
	            if( h === 360 ) h = 0;
	            if( h < 60 ) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3; }
	            else if( h < 120 ) {rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3; }
	            else if( h < 180 ) {rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3; }
	            else if( h < 240 ) {rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3; }
	            else if( h < 300 ) {rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3; }
	            else if( h < 360 ) {rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3; }
	            else { rgb.r = 0; rgb.g = 0; rgb.b = 0; }
	        }
	        return {
	            r: Math.round(rgb.r),
	            g: Math.round(rgb.g),
	            b: Math.round(rgb.b)
	        };
	    }

	    // Converts an RGB object to a hex string
	    function rgb2hex(rgb) {
	        var hex = [
	            rgb.r.toString(16),
	            rgb.g.toString(16),
	            rgb.b.toString(16)
	        ];
	        $.each(hex, function(nr, val) {
	            if (val.length === 1) hex[nr] = '0' + val;
	        });
	        return '#' + hex.join('');
	    }

	    // Converts an HSB object to a hex string
	    function hsb2hex(hsb) {
	        return rgb2hex(hsb2rgb(hsb));
	    }

	    // Converts a hex string to an HSB object
	    function hex2hsb(hex) {
	        var hsb = rgb2hsb(hex2rgb(hex));
	        if( hsb.s === 0 ) hsb.h = 360;
	        return hsb;
	    }

	    // Converts an RGB object to an HSB object
	    function rgb2hsb(rgb) {
	        var hsb = { h: 0, s: 0, b: 0 };
	        var min = Math.min(rgb.r, rgb.g, rgb.b);
	        var max = Math.max(rgb.r, rgb.g, rgb.b);
	        var delta = max - min;
	        hsb.b = max;
	        hsb.s = max !== 0 ? 255 * delta / max : 0;
	        if( hsb.s !== 0 ) {
	            if( rgb.r === max ) {
	                hsb.h = (rgb.g - rgb.b) / delta;
	            } else if( rgb.g === max ) {
	                hsb.h = 2 + (rgb.b - rgb.r) / delta;
	            } else {
	                hsb.h = 4 + (rgb.r - rgb.g) / delta;
	            }
	        } else {
	            hsb.h = -1;
	        }
	        hsb.h *= 60;
	        if( hsb.h < 0 ) {
	            hsb.h += 360;
	        }
	        hsb.s *= 100/255;
	        hsb.b *= 100/255;
	        return hsb;
	    }

	    // Converts a hex string to an RGB object
	    function hex2rgb(hex) {
	        hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
	        return {
	            /* jshint ignore:start */
	            r: hex >> 16,
	            g: (hex & 0x00FF00) >> 8,
	            b: (hex & 0x0000FF)
	            /* jshint ignore:end */
	        };
	    }

	    // Handle events
	    $(document)
	        // Hide on clicks outside of the control
	        .on('mousedown.minicolors touchstart.minicolors', function(event) {
	            if( !$(event.target).parents().add(event.target).hasClass('minicolors') ) {
	                hide();
	            }
	        })
	        // Start moving
	        .on('mousedown.minicolors touchstart.minicolors', '.minicolors-grid, .minicolors-slider, .minicolors-opacity-slider', function(event) {
	            var target = $(this);
	            event.preventDefault();
	            $(document).data('minicolors-target', target);
	            move(target, event, true);
	        })
	        // Move pickers
	        .on('mousemove.minicolors touchmove.minicolors', function(event) {
	            var target = $(document).data('minicolors-target');
	            if( target ) move(target, event);
	        })
	        // Stop moving
	        .on('mouseup.minicolors touchend.minicolors', function() {
	            $(this).removeData('minicolors-target');
	        })
	        // Show panel when swatch is clicked
	        .on('mousedown.minicolors touchstart.minicolors', '.minicolors-swatch', function(event) {
	            var input = $(this).parent().find('.minicolors-input');
	            event.preventDefault();
	            show(input);
	        })
	        // Show on focus
	        .on('focus.minicolors', '.minicolors-input', function() {
	            var input = $(this);
	            if( !input.data('minicolors-initialized') ) return;
	            show(input);
	        })
	        // Fix hex on blur
	        .on('blur.minicolors', '.minicolors-input', function() {
	            var input = $(this),
	                settings = input.data('minicolors-settings');
	            if( !input.data('minicolors-initialized') ) return;

	            // Parse Hex
	            input.val(parseHex(input.val(), true));

	            // Is it blank?
	            if( input.val() === '' ) input.val(parseHex(settings.defaultValue, true));

	            // Adjust case
	            input.val( convertCase(input.val(), settings.letterCase) );

	        })
	        // Handle keypresses
	        .on('keydown.minicolors', '.minicolors-input', function(event) {
	            var input = $(this);
	            if( !input.data('minicolors-initialized') ) return;
	            switch(event.keyCode) {
	                case 9: // tab
	                    hide();
	                    break;
	                case 13: // enter
	                case 27: // esc
	                    hide();
	                    input.blur();
	                    break;
	            }
	        })
	        // Update on keyup
	        .on('keyup.minicolors', '.minicolors-input', function() {
	            var input = $(this);
	            if( !input.data('minicolors-initialized') ) return;
	            updateFromInput(input, true);
	        })
	        // Update on paste
	        .on('paste.minicolors', '.minicolors-input', function() {
	            var input = $(this);
	            if( !input.data('minicolors-initialized') ) return;
	            setTimeout( function() {
	                updateFromInput(input, true);
	            }, 1);
	        });

	}));

/***/ },
/* 10 */
/***/ function(module, exports) {

	;(function(window){
	/*! modernizr 3.3.1 (Custom Build) | MIT *
	 * http://modernizr.com/download/?-borderradius-es5date-setclasses !*/
	!function(e,n,t){function r(e,n){return typeof e===n}function o(){var e,n,t,o,s,i,a;for(var l in g)if(g.hasOwnProperty(l)){if(e=[],n=g[l],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(t=0;t<n.options.aliases.length;t++)e.push(n.options.aliases[t].toLowerCase());for(o=r(n.fn,"function")?n.fn():n.fn,s=0;s<e.length;s++)i=e[s],a=i.split("."),1===a.length?Modernizr[a[0]]=o:(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=o),w.push((o?"":"no-")+a.join("-"))}}function s(e){var n=S.className,t=Modernizr._config.classPrefix||"";if(_&&(n=n.baseVal),Modernizr._config.enableJSClass){var r=new RegExp("(^|\\s)"+t+"no-js(\\s|$)");n=n.replace(r,"$1"+t+"js$2")}Modernizr._config.enableClasses&&(n+=" "+t+e.join(" "+t),_?S.className.baseVal=n:S.className=n)}function i(e,n){return!!~(""+e).indexOf(n)}function a(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):_?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}function l(){var e=n.body;return e||(e=a(_?"svg":"body"),e.fake=!0),e}function f(e,t,r,o){var s,i,f,u,d="modernizr",p=a("div"),c=l();if(parseInt(r,10))for(;r--;)f=a("div"),f.id=o?o[r]:d+(r+1),p.appendChild(f);return s=a("style"),s.type="text/css",s.id="s"+d,(c.fake?c:p).appendChild(s),c.appendChild(p),s.styleSheet?s.styleSheet.cssText=e:s.appendChild(n.createTextNode(e)),p.id=d,c.fake&&(c.style.background="",c.style.overflow="hidden",u=S.style.overflow,S.style.overflow="hidden",S.appendChild(c)),i=t(p,e),c.fake?(c.parentNode.removeChild(c),S.style.overflow=u,S.offsetHeight):p.parentNode.removeChild(p),!!i}function u(e){return e.replace(/([A-Z])/g,function(e,n){return"-"+n.toLowerCase()}).replace(/^ms-/,"-ms-")}function d(n,r){var o=n.length;if("CSS"in e&&"supports"in e.CSS){for(;o--;)if(e.CSS.supports(u(n[o]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var s=[];o--;)s.push("("+u(n[o])+":"+r+")");return s=s.join(" or "),f("@supports ("+s+") { #modernizr { position: absolute; } }",function(e){return"absolute"==getComputedStyle(e,null).position})}return t}function p(e){return e.replace(/([a-z])-([a-z])/g,function(e,n,t){return n+t.toUpperCase()}).replace(/^-/,"")}function c(e,n,o,s){function l(){u&&(delete N.style,delete N.modElem)}if(s=r(s,"undefined")?!1:s,!r(o,"undefined")){var f=d(e,o);if(!r(f,"undefined"))return f}for(var u,c,m,y,h,v=["modernizr","tspan"];!N.style;)u=!0,N.modElem=a(v.shift()),N.style=N.modElem.style;for(m=e.length,c=0;m>c;c++)if(y=e[c],h=N.style[y],i(y,"-")&&(y=p(y)),N.style[y]!==t){if(s||r(o,"undefined"))return l(),"pfx"==n?y:!0;try{N.style[y]=o}catch(g){}if(N.style[y]!=h)return l(),"pfx"==n?y:!0}return l(),!1}function m(e,n){return function(){return e.apply(n,arguments)}}function y(e,n,t){var o;for(var s in e)if(e[s]in n)return t===!1?e[s]:(o=n[e[s]],r(o,"function")?m(o,t||n):o);return!1}function h(e,n,t,o,s){var i=e.charAt(0).toUpperCase()+e.slice(1),a=(e+" "+b.join(i+" ")+i).split(" ");return r(n,"string")||r(n,"undefined")?c(a,n,o,s):(a=(e+" "+P.join(i+" ")+i).split(" "),y(a,n,t))}function v(e,n,r){return h(e,t,t,n,r)}var g=[],C={_version:"3.3.1",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var t=this;setTimeout(function(){n(t[e])},0)},addTest:function(e,n,t){g.push({name:e,fn:n,options:t})},addAsyncTest:function(e){g.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=C,Modernizr=new Modernizr;var w=[],S=n.documentElement,_="svg"===S.nodeName.toLowerCase(),x="Moz O ms Webkit",b=C._config.usePrefixes?x.split(" "):[];C._cssomPrefixes=b;var E={elem:a("modernizr")};Modernizr._q.push(function(){delete E.elem});var N={style:E.elem.style};Modernizr._q.unshift(function(){delete N.style});var P=C._config.usePrefixes?x.toLowerCase().split(" "):[];C._domPrefixes=P,C.testAllProps=h,C.testAllProps=v,Modernizr.addTest("borderradius",v("borderRadius","0px",!0)),Modernizr.addTest("es5date",function(){var e="2013-04-12T06:06:37.307Z",n=!1;try{n=!!Date.parse(e)}catch(t){}return!!(Date.now&&Date.prototype&&Date.prototype.toISOString&&Date.prototype.toJSON&&n)}),o(),s(w),delete C.addTest,delete C.addAsyncTest;for(var T=0;T<Modernizr._q.length;T++)Modernizr._q[T]();e.Modernizr=Modernizr}(window,document);
	module.exports = window.Modernizr;
	})(window);

/***/ },
/* 11 */
/***/ function(module, exports) {

	var TARGET = 'dev';

	var BASE_URI = location.protocol + '//p3k.org/rss';
	var ROXY_URI = location.protocol + '//p3k-services.appspot.com/roxy';
	var FERRIS_URI = location.protocol + '//p3k-services.appspot.com/ferris?callback=?&group=rssbox';

	switch (TARGET) {
	  case 'mixed':
	  BASE_URI = 'http://localhost:8000';
	  break;

	  case 'dev':
	  BASE_URI = 'http://localhost:8000';
	  ROXY_URI = 'http://localhost:8001/roxy';
	  FERRIS_URI = 'http://localhost:8001/ferris?callback=?&group=rssbox';
	  break;
	}

	module.exports = {
	  baseUri: BASE_URI,
	  roxyUri: ROXY_URI,
	  ferrisUri: FERRIS_URI
	};


/***/ }
/******/ ]);