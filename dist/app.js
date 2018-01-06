var app = (function () {
'use strict';

function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function detachBetween(before, after) {
	while (before.nextSibling && before.nextSibling !== after) {
		before.parentNode.removeChild(before.nextSibling);
	}
}

function destroyEach(iterations) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d();
	}
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function createComment() {
	return document.createComment('');
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) this._fragment.u();
	this._fragment.d();
	this._fragment = this._state = null;
}

function destroyDev(detach) {
	destroy.call(this, detach);
	this.destroy = function() {
		console.warn('Component was already destroyed');
	};
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function init(component, options) {
	component._observers = { pre: blankObject(), post: blankObject() };
	component._handlers = blankObject();
	component._bind = options._bind;

	component.options = options;
	component.root = options.root || component;
	component.store = component.root.store || options.store;
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function observeDev(key, callback, options) {
	var c = (key = '' + key).search(/[^\w]/);
	if (c > -1) {
		var message =
			'The first argument to component.observe(...) must be the name of a top-level property';
		if (c > 0)
			message += ", i.e. '" + key.slice(0, c) + "' rather than '" + key + "'";

		throw new Error(message);
	}

	return observe.call(this, key, callback, options);
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function onDev(eventName, handler) {
	if (eventName === 'teardown') {
		console.warn(
			"Use component.on('destroy', ...) instead of component.on('teardown', ...) which has been deprecated and will be unsupported in Svelte 2"
		);
		return this.on('destroy', handler);
	}

	return on.call(this, eventName, handler);
}

function set(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) return;
	this.root._lock = true;
	callAll(this.root._beforecreate);
	callAll(this.root._oncreate);
	callAll(this.root._aftercreate);
	this.root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
		this._fragment.p(changed, this._state);
		dispatchObservers(this, this._observers.post, changed, this._state, oldState);
	}
}

function setDev(newState) {
	if (typeof newState !== 'object') {
		throw new Error(
			this._debugName + '.set was called without an object of data key-values to update.'
		);
	}

	this._checkReadOnly(newState);
	set.call(this, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

function _mount(target, anchor) {
	this._fragment.m(target, anchor);
}

function _unmount() {
	if (this._fragment) this._fragment.u();
}

function removeFromStore() {
	this.store._remove(this);
}

var protoDev = {
	destroy: destroyDev,
	get: get,
	fire: fire,
	observe: observeDev,
	on: onDev,
	set: setDev,
	teardown: destroyDev,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount
};

function Store(state) {
	this._observers = { pre: blankObject(), post: blankObject() };
	this._changeHandlers = [];
	this._dependents = [];

	this._computed = blankObject();
	this._sortedComputedProperties = [];

	this._state = assign({}, state);
}

assign(Store.prototype, {
	_add: function(component, props) {
		this._dependents.push({
			component: component,
			props: props
		});
	},

	_init: function(props) {
		var state = {};
		for (var i = 0; i < props.length; i += 1) {
			var prop = props[i];
			state['$' + prop] = this._state[prop];
		}
		return state;
	},

	_remove: function(component) {
		var i = this._dependents.length;
		while (i--) {
			if (this._dependents[i].component === component) {
				this._dependents.splice(i, 1);
				return;
			}
		}
	},

	_sortComputedProperties: function() {
		var computed = this._computed;
		var sorted = this._sortedComputedProperties = [];
		var cycles;
		var visited = blankObject();

		function visit(key) {
			if (cycles[key]) {
				throw new Error('Cyclical dependency detected');
			}

			if (visited[key]) return;
			visited[key] = true;

			var c = computed[key];

			if (c) {
				cycles[key] = true;
				c.deps.forEach(visit);
				sorted.push(c);
			}
		}

		for (var key in this._computed) {
			cycles = blankObject();
			visit(key);
		}
	},

	compute: function(key, deps, fn) {
		var value;

		var c = {
			deps: deps,
			update: function(state, changed, dirty) {
				var values = deps.map(function(dep) {
					if (dep in changed) dirty = true;
					return state[dep];
				});

				if (dirty) {
					var newValue = fn.apply(null, values);
					if (differs(newValue, value)) {
						value = newValue;
						changed[key] = true;
						state[key] = value;
					}
				}
			}
		};

		c.update(this._state, {}, true);

		this._computed[key] = c;
		this._sortComputedProperties();
	},

	get: get,

	observe: observe,

	onchange: function(callback) {
		this._changeHandlers.push(callback);
		return {
			cancel: function() {
				var index = this._changeHandlers.indexOf(callback);
				if (~index) this._changeHandlers.splice(index, 1);
			}
		};
	},

	set: function(newState) {
		var oldState = this._state,
			changed = this._changed = {},
			dirty = false;

		for (var key in newState) {
			if (this._computed[key]) throw new Error("'" + key + "' is a read-only property");
			if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
		}
		if (!dirty) return;

		this._state = assign({}, oldState, newState);

		for (var i = 0; i < this._sortedComputedProperties.length; i += 1) {
			this._sortedComputedProperties[i].update(this._state, changed);
		}

		for (var i = 0; i < this._changeHandlers.length; i += 1) {
			this._changeHandlers[i](this._state, changed);
		}

		dispatchObservers(this, this._observers.pre, changed, this._state, oldState);

		var dependents = this._dependents.slice(); // guard against mutations
		for (var i = 0; i < dependents.length; i += 1) {
			var dependent = dependents[i];
			var componentState = {};
			dirty = false;

			for (var j = 0; j < dependent.props.length; j += 1) {
				var prop = dependent.props[j];
				if (prop in changed) {
					componentState['$' + prop] = this._state[prop];
					dirty = true;
				}
			}

			if (dirty) dependent.component.set(componentState);
		}

		dispatchObservers(this, this._observers.post, changed, this._state, oldState);
	}
});

function RssParser() {
  var DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/';
  var RDF_NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  var ISO_DATE_PATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

  var getDocument = function(xml) {
    if (!xml) return;

    var doc;

    if (document.implementation.createDocument) {
      var parser = new DOMParser();
      doc = parser.parseFromString(xml, 'application/xml');
    } else if (window.ActiveXObject) {
      doc = new window.ActiveXObject('Microsoft.XMLDOM');
      doc.async = 'false';
      doc.loadXML(xml);
    }

    return doc;
  };

  var getText = function(node) {
    if (!node) return '';
    if (node.length) node = node[0];
    return node.textContent;
  };

  var parseRss = function(root, type) {
    var rss = { items: [] };
    var channel = root.querySelector('channel');

    rss.format = 'RSS';
    rss.version = type === 'rdf:RDF' ? '1.0' : root.getAttribute('version');
    rss.title = getText(root.querySelector('channel > title'));
    rss.description = getText(root.querySelector('channel > description'));
    rss.link = getText(root.querySelector('channel > link'));

    var image = root.querySelector('image');

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
      var date = channel.getElementsByTagNameNS(DC_NAMESPACE, 'date');
      rss.date = getDate(getText(date) /* || data.headers.date*/); // TODO
      rss.rights = getText(channel.getElementsByTagNameNS(DC_NAMESPACE, 'creator'));

      var textInput = root.querySelector('textinput');

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

    root.querySelectorAll('item').forEach(function(node) {
      var item = {
        title: getText(node.querySelector('title')),
        description: getText(node.querySelector('description')),
        link: getText(node.querySelector('link')) || getText(node.querySelector('guid'))
      };

      if (!item.description) {
        var content = getText(node.querySelector('content\\:encoded'));
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

  var parseScriptingNews = function(root) {
    var rss = { items: [] };
    var channel = root.querySelector('header');

    rss.format = 'Scripting News';
    rss.version = getText(channel.querySelector('scriptingNewsVersion'));
    rss.title = getText(channel.querySelector('channelTitle'));
    rss.description = getText(channel.querySelector('channelDescription'));
    rss.link = getText(channel.querySelector('channelLink'));

    rss.date = getDate(getText(channel.querySelector('lastBuildDate')) || getText(channel.querySelector('pubDate')));

    var imageUrl = channel.querySelector('imageUrl');

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

    root.querySelectorAll('item').forEach(function(node) {
      var item = { title: '' };

      item.description = getText(node.querySelector('text')).replace(/\n/g, ' ');

      var link = node.querySelector('link');

      if (link) {
        var text = getText(link.querySelector('linetext'))
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

  var addItemExtensions = function(node, item) {
    var source = node.querySelector('source');
    var enclosure = node.querySelector('enclosure');
    var category = node.querySelector('category');

    if (source) {
      item.source = {
        link: source.getAttribute('url'),
        title: source.textContent
      };
    }

    if (enclosure) {
      item.enclosure = {
        link: enclosure.getAttribute('url'),
        length: enclosure.getAttribute('length'),
        type: enclosure.getAttribute('type')
      };
    }

    if (category) {
      item.category = {
        domain: category.getAttribute('domain') || '',
        content: category.textContent
      };
    }

    // TODO
    item.buttons = [];

    return item;
  };

  var getDate = function(str) {
    var millis = Date.parse(str);

    if (isNaN(millis)) {
      millis = Date.parse(String(str).replace(ISO_DATE_PATTERN, '$1/$2/$3 $4'));
      if (isNaN(millis)) millis = Date.now();
    }

    return new Date(millis);
  };

  return {
    parse: function(xml) {
      var doc = getDocument(xml);
      var root = doc.documentElement;
      var type = root.nodeName;

      return type === 'scriptingNews' ? parseScriptingNews(root) : parseRss(root, type);
    }
  };
}

const URLS$1 = {
  base: 'http://localhost:5000',
  roxy: 'http://localhost:8081/roxy'/*,
  ferris: 'http://localhost:8081/ferris?group=rssbox'*/
};

const KEYS = [
  'align',
  'boxFillColor',
  'compact',
  'fontFace',
  'frameColor',
  'headless',
  'height',
  'linkColor',
  'maxItems',
  'radius',
  'showXmlButton',
  'textColor',
  'titleBarColor',
  'titleBarTextColor',
  'url',
  'width'
];

const URLS$$1 = Object.assign(
  {
    base: '//p3k.org/rss',
    roxy: location.protocol + '//p3k-services.appspot.com/roxy',
    ferris: location.protocol + '//p3k-services.appspot.com/ferris?group=rssbox'
  },
  URLS$1
);

class RssStore extends Store {
  constructor(url) {
    const defaults$$1 = {
      date: new Date(),
      description: '',
      format: '',
      image: '',
      input: '',
      items: [],
      title: '',
      url: url || '',
      version: ''
    };

    super(defaults$$1);

    this.compute('formattedDate', ['date'], date => {
      if (!date) return;
      let month = (date.getMonth() + 1).toString().padStart(2, '0');
      let day = date
        .getDate()
        .toString()
        .padStart(2, '0');
      let hours = date
        .getHours()
        .toString()
        .padStart(2, '0');
      let minutes = date
        .getMinutes()
        .toString()
        .padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}, ${hours}:${minutes}h`;
    });

    this.observe('url', this.fetch);
  }

  fetch() {
    const url = this.get('url');
    if (!url) return;

    fetch(URLS$$1.roxy + '?url=' + encodeURIComponent(url)).then(res => {
      res.text().then(json => {
        const parser = RssParser();
        const xml = JSON.parse(json).content;
        const data = parser.parse(xml);
        this.set(data);
      });
    });
  }
}

var version = "18.1.0";
var description = "JavaScript RSS Box Viewer";

/* components/Changes.html generated by Svelte v1.50.0 */
function encapsulateStyles$2(node) {
	setAttribute(node, "svelte-3224456170", "");
}

function add_css$2() {
	var style = createElement("style");
	style.id = 'svelte-3224456170-style';
	style.textContent = "h3[svelte-3224456170]{display:inline-block}h3+p[svelte-3224456170],summary+[svelte-3224456170]{margin-top:0}summary[svelte-3224456170]{outline:none}li+li[svelte-3224456170]{margin-top:0.5em}small[svelte-3224456170]{color:#999}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhbmdlcy5odG1sIiwic291cmNlcyI6WyJDaGFuZ2VzLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPGRldGFpbHM+XG4gIDxzdW1tYXJ5PlxuICAgIDxoMz5DaGFuZ2UgTG9nPC9oMz5cbiAgPC9zdW1tYXJ5PlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDE2LTAzLTEyPC9zbWFsbD5cbiAgICBDb21wbGV0ZWx5IHJld3JvdGUgYnVpbGQgZW52aXJvbm1lbnQgdXNpbmcgV2ViUGFjay4gU3dpdGNoZWQgdGhlIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9wM2svcnNzLWJveCc+c291cmNlIHJlcG9zaXRvcnk8L2E+IGZyb20gU1ZOIHRvIEdpdCwgaG9zdGVkIGF0IEdpdGh1Yi4gVGhpcyBkZXNlcnZlcyBhIG5ldyBtYWpvciB2ZXJzaW9uIG51bWJlciFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTEyLTMwPC9zbWFsbD5cbiAgICBBZGRlZCBzaW1wbGUgY29kZSB0byBtb2RpZnkgdGhlIHdpZHRoIGF0dHJpYnV0ZSBvZiBpZnJhbWUsIG9iamVjdCBhbmQgZW1iZWQgZWxlbWVudHMgdG8gbWFrZSB0aGVtIGZpdCBpbiB0aGUgYm94LiBBbHNvOiBidW1wZWQgdmVyc2lvbi4gPGk+QSBoYXBweSBuZXcgeWVhciAyMDEzLCBldmVyYm9keSE8L2k+XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0xMC0yNjwvc21hbGw+XG4gICAgQWRkZWQgc2VjdGlvbiBhYm91dCBDcmVhdGl2ZSBDb21tb25zIExpY2Vuc2UsIGJlbG93LiBJbiBvdGhlciB3b3JkczogeW91IGNhbiBub3cgbGVnYWxseSBydW4gbXkgY29kZSBvbiB5b3VyIG93biBzZXJ2ZXIuIChZb3UgZXZlbiBjb3VsZCByZW1vdmUgdGhlIHRpbnkgcmVmZXJlbmNlIHRvIHRoaXMgcGFnZSBpbiB0aGUgZm9vdGVyIG9mIHRoZSBib3guKSBIb3dldmVyLCBJIHdvdWxkIGxpa2UgdG8gYXNrIHlvdSBmb3IgdHdvIHRoaW5ncyBpZiB5b3Ugd2FudCB0byBkbyBzbzpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgVXNlIHlvdXIgb3duIDxhIGhyZWY9Jy8vZ2l0aHViLmNvbS9wM2svanNvbjNrJz5KU09OUCBwcm94eTwvYT4g4oCTIGVzcGVjaWFsbHksIHdoZW4geW91IGV4cGVjdCBhIGhpZ2ggbG9hZCBvbiB5b3VyIHNlcnZlci5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFBsZWFzZSBzdXBwb3J0IHRoZSBzZXJ2aWNlIHdpdGggYSA8YSBocmVmPSdodHRwOi8vZmxhdHRyLmNvbS90aGluZy82ODE4ODEvSmF2YVNjcmlwdC1SU1MtQm94LVZpZXdlcic+ZG9uYXRpb248L2E+LlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDgtMDE8L3NtYWxsPlxuICAgIEFkZGVkIHR3byBuZXcsIGV4cGVyaW1lbnRhbCBmZWF0dXJlcyDigJMgYW5kIHRodXMsIGluY3JlYXNlZCB2ZXJzaW9uIHRvIDMuMzpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgVGhlIGhlaWdodCBvZiB0aGUgaW5uZXIgYm94IGNvbnRlbnQgY2FuIG5vdyBiZSBkZWZpbmVkIGJ5IGEgcGl4ZWwgdmFsdWUuIElmIHRoZSBoZWlnaHQgaXMgbGVzcyB0aGFuIHRoZSBzcGFjZSBuZWVkZWQgYnkgdGhlIGRlc2lyZWQgYW1vdW50IG9mIGl0ZW1zIHlvdSBjYW4gdmVydGljYWxseSBzY3JvbGwgdGhlIGNvbnRlbnQuIEEgdmFsdWUgb2YgPGNvZGU+LTE8L2NvZGU+IGVuYWJsZXMgdGhlIGRlZmF1bHQgYmVoYXZpb3IgYW5kIGF1dG9tYXRpY2FsbHkgc2V0cyB0aGUgaGVpZ2h0IGFjY29yZGluZyB0byB0aGUgZGlzcGxheWluZyBpdGVtcy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFRoZSBzby1jYWxsZWQg4oCcaGVhZGxlc3PigJ0gbW9kZSByZW1vdmVzIHRoZSB0aXRsZWJhciBhbmQgdGhlIGZyYW1lIGZyb20gdGhlIGJveC4gVGhpcyB3YXkgdGhlIGJveCBjYW4gYmUgdXNlZCBtb3JlIGZsZXhpYmx5IGluIHNwZWNpYWwgc2l0dWF0aW9ucy4gSG93ZXZlciwgdGhpcyBmZWF0dXJlIHNvbWVob3cgdW5kZXJtaW5lcyBhbiBSU1MgZmVlZOKAmXMgYXV0aG9yaXR5IHNvIEkgY291bnQgb24geW91ciBmYWlybmVzcyB0byBnaXZlIGNyZWRpdCB3aGVyZSBjcmVkaXQgaXMgZHVlIVxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDctMTY8L3NtYWxsPlxuICAgIFNsaWdodGx5IG1vZGlmaWVkIG91dHB1dCBvZiB0aGUgSFRNTCBjb2RlIHRvIGJlIHVzYWJsZSB3aXRoIGJvdGgsIHVuc2VjdXJlZCBhbmQgc2VjdXJlZCAoSFRUUFMpIHdlYiBzZXJ2ZXJzLiBZb3UgY2FuIHVwZGF0ZSBhbHJlYWR5IGVtYmVkZGVkIGNvZGUgZWFzaWx5IGJ5IHJlbW92aW5nIHRoZSA8Y29kZT5odHRwOjwvY29kZT4gcGFydCBmcm9tIHRoZSA8Y29kZT5zcmM8L2NvZGU+IGF0dHJpYnV0ZSBvZiB0aGUgPGNvZGU+JmFtcDtsdDtzY3JpcHQmYW1wO2d0OzwvY29kZT4gZWxlbWVudDogPGNvZGU+JmFtcDtsdDtzY3JpcHQgc3JjPSdodHRwOi8vcDNrLm9yZy9yc3PigKYnJmFtcDtndDs8L2NvZGU+IGJlY29tZXMgPGNvZGU+JmFtcDtsdDtzY3JpcHQgc3JjPScvL3Azay5vcmcvcnNz4oCmJyZhbXA7Z3Q7PC9jb2RlPi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA3LTEzPC9zbWFsbD5cbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgRml4ZWQgSUUgYnVnICjigJxpbm5lckhUTUwgaXMgbnVsbCBvciBub3QgYW4gb2JqZWN04oCdKSBjYXVzZWQgYnkgdXNpbmcgalF1ZXJ54oCZcyBodG1sKCkgbWV0aG9kIGluc3RlYWQgb2YgdGV4dCgpIHdoZW4gcGFyc2luZyBhIDxjb2RlPiZhbXA7bHQ7Y29udGVudDplbmNvZGVkJmFtcDtndDs8L2NvZGU+IGVsZW1lbnQuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBDaGFuZ2VkIHByaW9yaXR5IG9mIGVsZW1lbnRzOiBvbmx5IGNoZWNrIGZvciA8Y29kZT4mYW1wO2x0O2NvbnRlbnQ6ZW5jb2RlZCZhbXA7Z3Q7PC9jb2RlPiBpZiAgICAgPGNvZGU+JmFtcDtsdDtkZXNjcmlwdGlvbiZhbXA7Z3Q7PC9jb2RlPiBpcyBub3QgYXZhaWxhYmxlLlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDYtMDQ8L3NtYWxsPlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBJbXBsZW1lbnRlZCBzbWFsbCByb3V0aW5lIHRvIHJlc2l6ZSBpbWFnZXMgY29udGFpbmVkIGluIHRoZSBmZWVkIGNvbnRlbnQgdG8gZml0IGluIHRoZSBib3guXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBzdXBwb3J0IGZvciBuZXcgSFRNTDUgZm9ybSBpbnB1dCB0eXBlcyBhbmQgdGhlaXIgdmFsaWRhdGlvbi5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTMxPC9zbWFsbD5cbiAgICBHb25lICZiZXRhO2V0YSEg4oCTIHdpdGggdGhyZWUgdGlueSBhZGRpdG9uczpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgPGNvZGU+JmFtcDtsdDtub3NjcmlwdCZhbXA7Z3Q7PC9jb2RlPiBlbGVtZW50IGZvciBicm93c2VycyBwcm92aWRpbmcgbm8gSmF2YVNjcmlwdCBlbmdpbmUuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBvcHRpb24gdG8gY2FsbCB0aGUgY29uZmlndXJhdG9yIHdpdGggYSBVUkwgaW4gdGhlIHF1ZXJ5IHN0cmluZy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGEgbGluayB0byB0aGUgVzNDIGZlZWQgdmFsaWRhdG9yIHRvIHRoZSBjb250ZW50cyBvZiBhIGJveCBkaXNwbGF5aW5nIGFuIFJTUyBlcnJvci5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTE5PC9zbWFsbD5cbiAgICBBcG9sb2dpZXMgZm9yIHRoZSBSU1MgQm94ZXMgbm90IHNob3dpbmcgdXAgb24geW91ciBwYWdlcyBkdXJpbmcgdGhlIGxhc3QgZmV3IGRheXMuIEkgbWFkZSBhIHN0dXBpZCBtaXN0YWtlIHRoYXQgY2F1c2VkIG9ubHkgdGhlIHNldHVwIHBhZ2UgdG8gcmVuZGVyIGNvcnJlY3RseSDigJMgYW5kIEkgZGlkIG5vdCBjaGVjayBhbnkgZW1iZWRkZWQgc2NyaXB0LiA8aT5CdW1tZXIhPC9pPlxuICA8L3A+XG4gIDxwPlxuICAgIEF0IGxlYXN0IG5vdyBldmVyeXRoaW5nIHNob3VsZCBiZSBiYWNrIHRvIG5vcm1hbC4gKEkgaG9wZSB0aGlzIGluY2lkZW50IGRpZCBub3Qgc2Fib3RhZ2UgdGhlIEZsYXR0ciBidXR0b24gSSBhZGRlZCBpbiB0aGUgbWVhbnRpbWXigKYgPGk+d2luaywgd2luayE8L2k+KVxuICA8L3A+XG4gIDxwPkFueXdheSwgdGhhbmtzIGZvciB5b3VyIHVuZGVyc3RhbmRpbmcuPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTE2PC9zbWFsbD5cbiAgICBJIHRoaW5rIEkgZGlkIG5vdCBtZW50aW9uLCB5ZXQsIHRoYXQgdGhlIGN1cnJlbnQgaW5jYXJuYXRpb24gb2YgdGhlIGNvZGUgaXMgdG90YWxseSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgdmVyc2lvbiBhcyBvZiAyMDA5LiBFYWNoIGlzIHVzaW5nIHRoZWlyIG93biBjb2RlYmFzZSwgdGhlIGxlZ2FjeSBjb2RlIHdhcyBub3QgbW9kaWZpZWQgYXQgYWxsIGFuZCB0aHVzLCBpdCBpcyBub3QgYWZmZWN0ZWQgYnkgYW55IHJlY2VudCBjaGFuZ2VzLiBZb3UgY2FuIGNoZWNrIHdoaWNoIHZlcnNpb24geW91IGFyZSB1c2luZyBieSBsb29raW5nIGF0IHRoZSBzY3JpcHQgVVJMLiBJZiBpdCBjb250YWlucyB0aGUgc3RyaW5nIOKAnHByb3h5LnLigJ0geW91IGdldCB0aGUg4oCcY2xhc3NpY+KAnSBSU1MgQm94IHJlbmRlcmluZy4gVGhlIG1vZGVybml6ZWQgdmVyc2lvbiBjYWxscyDigJxpbmRleC5qc+KAnS4gTmV2ZXJ0aGVsZXNzLCB5b3UgY2Fubm90IHNldHVwIGJveGVzIHdpdGggdGhlIG9sZCBVUkwgYW55bW9yZS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTA5PC9zbWFsbD5cbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgc3VwcG9ydCBmb3IgPGNvZGU+JmFtcDtsdDtjb250ZW50OmVuY29kZWQmYW1wO2d0OzwvY29kZT4gZWxlbWVudC5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEltcGxlbWVudGVkIE1lbWNhY2hlIHVzYWdlIGluIEFwcEVuZ2luZSBjb2RlLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQmVhdXRpZmllZCB0aGlzIHBhZ2UgYnkgdXNpbmcgdGhlIDxhIGhyZWY9J2h0dHA6Ly93d3cuZ29vZ2xlLmNvbS93ZWJmb250cy9zcGVjaW1lbi9Ecm9pZCtTZXJpZic+R29vZ2xl4oCZcyBEcm9pZCBTZXJpZiBmb250PC9hPi5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA0LTI2PC9zbWFsbD5cbiAgICBBbWF6aW5nISBBIG5ldyB2ZXJzaW9uISBBZnRlciBtb3JlIHRoYW4gdHdvIHllYXJzIGhpYXR1cyBJIGNvbXBsZXRlbHkgcmV3cm90ZSB0aGUgY29kZWJhc2UgYW5kIGZyYW1ld29yazpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgUmVtb3ZlZCBkZXBlbmRlbmN5IHRvIFJlYm9sIHVzaW5nIGEgc21hbGwgSlNPTlAgcHJveHkgYXQgR29vZ2xl4oCZcyBBcHBFbmdpbmUuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBSZXdyb3RlIFhNTCBwYXJzaW5nLCByZXBsYWNpbmcgbmF0aXZlIG1ldGhvZHMgd2l0aCBqUXVlcnkgb25lcy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIENsZWFuZWQgdXAgSFRNTCBvdXRwdXQgZm9yIHRoZSBSU1MgQm94LCByZXBsYWNpbmcgdGFibGVzIHdpdGggZGl2cy4gPGk+Tm90ZTogWW91IG1pZ2h0IG5lZWQgdG8gYWRkIDxjb2RlPjxhIGhyZWY9J2h0dHA6Ly9jb2Rpbmcuc21hc2hpbmdtYWdhemluZS5jb20vMjAxMC8xMS8wMi90aGUtaW1wb3J0YW50LWNzcy1kZWNsYXJhdGlvbi1ob3ctYW5kLXdoZW4tdG8tdXNlLWl0Lyc+IWltcG9ydGFudDwvYT48L2NvZGU+IHRvIHlvdXIgY3VzdG9tIFJTUyBCb3ggc3R5bGVzaGVldCBkZWZpbml0aW9ucy48L2k+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBSZXBsYWNlZCBmdWdseSBjb2xvcnBpY2tlciBpbiBjb25maWd1cmF0b3Igd2l0aCB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL2NsYXZpc2thL2pxdWVyeS1taW5pQ29sb3JzLyc+TWluaUNvbG9ycyBqUXVlcnkgcGx1Z2luPC9hPi5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGxpbmsgY29sb3Igc2V0dGluZyBhbmQgc3R5bGUgYXR0cmlidXRlcyBmb3IgY29ycmVjdGx5IGFwcGx5aW5nIGNvbG9yIHNldHRpbmdzLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgY29ybmVyIHJhZGl1cyBzZXR0aW5nLiA8aT5Ob3RlOiBkb2VzIG5vdCB3b3JrIGluIElFOCBhbmQgZWFybGllciB2ZXJzaW9ucy48L2k+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBmb250IHNpemUgdG8gdGhlIGZvbnQgZmFjZSBzZXR0aW5nLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUmVtb3ZlZCBhbGlnbiBzZXR0aW5nIGZyb20gY29uZmlndXJhdG9yIChzdGlsbCB3b3JrcyBpbiBzY3JpcHQgdGFncyBnZW5lcmF0ZWQgd2l0aCBlYXJsaWVyIHZlcnNpb25zKS5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA5LTEyLTEzPC9zbWFsbD5cbiAgICBTd2l0Y2hlZCBvdXRwdXQgb2YgdGhpcyBwYWdlIHRvIEhUTUw1IGFuZCBtYWRlIHNvbWUgYWRhcHRhdGlvbnMgaW4gdGhlIEhUTUwgY29kZSBhbmQgQ1NTIHN0eWxlc2hlZXQuIFVwZGF0ZWQgdmVyc2lvbiBzdHJpbmcgdG8gMi4xLCBmaW5hbGx5IVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDktMDktMjg8L3NtYWxsPlxuICAgIFNvbWUgbWlub3IgY2hhbmdlcyBhZnRlciBhIHdoaWxlOlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+UmVmYWN0b3JlZCBkYXRlIHBhcnNpbmcgdG8gc2hvdyBhY3R1YWwgYnVpbGQgZGF0ZXMgbW9yZSByZWxpYWJseTwvbGk+XG4gICAgPGxpPlJlZmFjdG9yZWQgY2FjaGluZyByb3V0aW5lIChvbmx5IGluIG9ubGluZSB2ZXJzaW9uKTwvbGk+XG4gICAgPGxpPlVwZGF0ZWQgdmVyc2lvbiBzdHJpbmcgdG8gMi4xYiwgYXBwcm9hY2hpbmcgYW5vdGhlciBmaW5hbCB2ZXJzaW9uLjwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDgtMDItMTk8L3NtYWxsPlxuICAgIFNlZW1zIHRoZXJlIHdlcmUgc29tZSBjaGFuZ2VzIGluIHRoZSBhaXIgYXMgSSBkaWQgbm90IHBsYW4gYW5vdGhlciB1cGRhdGUgYnV0IGhlcmUgY29tZXMgdmVyc2lvbiAyLjEgYnJpbmdpbmcgdG8geW91OlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBGdWxsIGNsaWVudC1zaWRlIHByb2Nlc3NpbmcgKG9ubHkgdGhlIHJhdyBmZWVkIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIpLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgVXNlci1mcmllbmRsaWVyIGludGVyZmFjZSB3aXRoIGNvbG9yIHBpY2tlcnMsIHN0YXR1cyBhbmQgZXJyb3IgZGlzcGxheSBhcyB3ZWxsIGFzIGluc3RhbnQgZmVlZGJhY2sgb24gYW55IGNoYW5nZSBpbiBzZXR1cC5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFuZCBmaW5hbGx5IChkcnVtcm9sbCEpIFVuaWNvZGUgc3VwcG9ydCBhdCBsZWFzdCBhdCB0aGlzIGluc3RhbGxhdGlvbiBvZiB0aGUgdmlld2VyLiAoSWUuIHRoZSBkb3dubG9hZGVkIHZlcnNpb24gc3RpbGwgd2lsbCBvdXRwdXQgQVNDSUkgb25seS4pXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOC0wMi0wMzwvc21hbGw+XG4gICAgTWFkZSBzb21lIG1vcmUgaW1wcm92ZW1lbnRzIGVzcGVjaWFsbHkgcmVnYXJkaW5nIHRoZSBlcnJvciBoYW5kbGluZyBhbmQgb3V0cHV0LiBGcm9tIG5vdyBvbiBpdCBzaG91bGQgYmUgbXVjaCBjbGVhcmVyIHdoYXTigJlzIHdyb25nIHdpdGggYSB2ZXJ5IFJTUyBCb3guIFNpbmNlIHRoZXJl4oCZcyBub3cgYSBsb3QgbW9yZSBvZiBjbGllbnQtc2lkZSBKYXZhU2NyaXB0IGNvZGUgaW52b2x2ZWQgSSB0ZXN0ZWQgdGhlIHNjcmlwdCBpbiBmb3VyIG1ham9yIGJyb3dzZXJzIHRoYXQgYXJlIGF2YWlsYWJsZSB0byBtZTogSW50ZXJuZXQgRXhwbG9yZXIgNywgRmlyZWZveCAyLjAsIE9wZXJhIDkuMjUgYW5kIFNhZmFyaSAzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDgtMDItMDE8L3NtYWxsPlxuICAgIENvbXBsZXRlbHkgcmV2aXNlZCBzZXJ2ZXItIGFuZCBjbGllbnQtc2lkZSBjb2RlLiBYTUwgcmVuZGVyaW5nIGlzIG5vdyBkb25lIGluIHRoZSBicm93c2VyIHdoaWNoIHNwZWVkcyB1cCB0aGluZ3MgYW5kIGRlY3JlYXNlcyB0aGUgbG9hZCBvbiB0aGUgc2VydmVyLiBGdXJ0aGVybW9yZSwgdGhlIGxpc3Qgb2YgcmVmZXJyZXJzIGlzIG5vdyBsb2FkZWQgb24gZGVtYW5kIHZpYSBBSkFYIGFuZCB0aHVzIG5vdCByZW5kZXJlZCB3aXRoIGV2ZXJ5IHJlcXVlc3QuIEZpbmFsbHksIEkgcmV0b3VjaGVkIHRoZSBzZXR1cCBmb3JtIGludGVyZmFjZSBhbmQgY2xlYW5lZCB1cCBib3RoIEhUTUwgYW5kIENTUy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTEyLTIwPC9zbWFsbD5cbiAgICBJIGFtIHZlcnkgZ2xhZCB0aGF0IG15IG9sZCBsaXR0bGUgc2NyaXB0IGlzIGdhaW5pbmcgZXZlbiBtb3JlIGF0dGVudGlvbiBhZnRlciBhbGwgdGhlc2UgeWVhcnPigKYgICAgPGk+VGhhbmsgeW91IHZlcnkgbXVjaCBpbmRlZWQhPC9pPiBTaW5jZSB0aGVyZSBhcmUgY29taW5nIGluIG1vcmUgYW5kIG1vcmUgb2YgdGhlIHNhbWUgcmVxdWVzdHMgYW5kIEkgYW0gcmVhbGx5IG5vdCBhYmxlIHRvIGhhbmRsZSB0aGVtIChhcG9sb2dpZXMhKSwgaGVyZSBpcyBzb21lIGFkdmljZSBmb3IgZXZlcnlvbmU6XG4gIDwvcD5cbiAgPG9sPlxuICAgIDxsaT5cbiAgICAgIDxhIGhyZWY9J2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ2FzY2FkaW5nX1N0eWxlX1NoZWV0cyc+VXNlIGNhc2NhZGluZyBzdHlsZSBzaGVldHM8L2E+IChDU1MpIHRvIGNoYW5nZSBmb250IHNpemVzIChhbmQgdG8gZ2VuZXJhbGx5IGRlZmluZSB5b3VyIGxheW91dCkuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICA8YSBocmVmPSdodHRwOi8vd3d3LnNpdGVwb2ludC5jb20vYXJ0aWNsZS9iZXdhcmUtb3BlbmluZy1saW5rcy1uZXctd2luZG93Jz5CZXdhcmUgb2Ygb3BlbmluZyBsaW5rcyBpbiBhIG5ldyB3aW5kb3cuPC9hPiBJdOKAmXMgb2ZmZW5zaXZlIHRvIHlvdXIgcmVhZGVycy5cbiAgICA8L2xpPlxuICA8L29sPlxuICA8cD5cbiAgICA8aT5BIGhhcHB5IGVuZCBmb3IgMjAwNiE8L2k+XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNi0xMzwvc21hbGw+XG4gICAgRGlkIHNvbWUgbWlub3IgYnVnIGZpeGluZyBhZ2FpbiAoYW1vbmdzdCBvdGhlcnMgcmVwbGFjaW5nIHNpbmdsZSBxdW90ZXMgd2l0aCAmYW1wO2Fwb3M7IGFuZCBub3QgJmFtcDtxdW90OyBlbnRpdGllcykuIEZ1cnRoZXJtb3JlIChhbmQgZmluYWxseSksIEkgcmVtb3ZlZCB0aGUg4oCcUkPigJ0gKGFzIGluIOKAnFJlbGVhc2UgQ2FuZGlkYXRl4oCdKSBmcm9tIHRoZSBkb2N1bWVudCB0aXRsZeKAplxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDYtMTI8L3NtYWxsPlxuICAgIEdhcnkgaW5mb3JtZWQgbWUgdGhhdCBsb25nZXIgZmVlZCBVUkxzIGNhdXNlIHRyb3VibGUgYW5kIHRoZSBmZWVkIGJveCB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQuIFRoYXTigJlzIGluIGZhY3QgYSBidWcsIGJ1dCB1bmZvcnR1bmF0ZWx5IG9uZSB0aGF0IGNhbm5vdCBiZSBmaXhlZCBzbyBlYXNpbHkuIE15IHN1Z2dlc3Rpb24gaXMgdG8gc2hvcnRlbiBzdWNoIFVSTHMgYXQgb25lIG9mIHRoZSB3ZWJzaXRlcyBhcm91bmQgdGhhdCBwcm92aWRlIHN1Y2ggYSBzZXJ2aWNlLCBlLmcuIDxhIGhyZWY9J2h0dHA6Ly90aW55dXJsLmNvbSc+dGlueXVybC5jb208L2E+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMjM8L3NtYWxsPlxuICAgIFN3aXRjaGVkIHRoZSA8YSBocmVmPScvL3Azay5vcmcvc291cmNlL3Jzcy1ib3gvJz5zb3VyY2UgcmVwb3NpdG9yeTwvYT4gZnJvbSBDVlMgdG8gU3VidmVyc2lvbiAoU1ZOKS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTIwPC9zbWFsbD5cbiAgICBBbmRyZXcgUGFtIGJyb3VnaHQgdXAgYSBzZXJpb3VzIGlzc3VlIHRoYXQgcHJvYmFibHkgbWlnaHQgaGF2ZSBhZmZlY3RlZCBzb21lIG1vcmUgcGVvcGxlIGFscmVhZHk6IHRoZSB2aWV3ZXIgZG9lcyBub3Qgc3VwcG9ydCBVVEYtOCAob3IgVW5pY29kZSwgcmVzcC4pIFVuZm9ydHVuYXRlbHksIHRoaXMgaXMg4oCcYnVpbHQtaW7igJ0gaW50byB0aGUgdW5kZXJseWluZyBzY3JpcHRpbmcgbGFuZ3VhZ2UgKGFrYSBSZWJvbCkuIEnigJltIHNvcnJ5IHRvIGNhbmNlbCB0aG9zZSB0aWNrZXRz4oCmIDooXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNC0xMzwvc21hbGw+XG4gICAgRml4ZWQgYSBidWcgcmVwb3J0ZWQgYnkgTWFuZG8gR29tZXogdGhhdCBjYXVzZWQgZmVlZHMgdXNpbmcgdGhlICZhbXA7bHQ7Z3VpZCZhbXA7Z3Q7IGVsZW1lbnQgYmVpbmcgZGlzcGxheWVkIHdpdGhvdXQgaXRlbSBsaW5rc+KApiBEb27igJl0IGZvcmdldCB0byBjaGVjayBvdXQgTWFuZG/igJlzIGV4Y2VsbGVudCB3ZWJzaXRlIDxhIGhyZWY9J2h0dHA6Ly93d3cubWFuZG9sdXguY29tLyc+bWFuZG9sdXg8L2E+IVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMTI8L3NtYWxsPlxuICAgIE9idmlvdXNseSBTYW0gUnVieSBjaGFuZ2VkIGhpcyBmZWVkIGZvcm1hdCBmcm9tIHNjcmlwdGluZ05ld3MgdG8gQXRvbTsgd2hpY2ggcmVuZGVycyBteSBleGFtcGxlIGxpbmsgYWJvdmUgcHJldHR5IHVzZWxlc3PigKYgU28gZmFyIEkgZG9u4oCZdCBrbm93IGFib3V0IGFueSBvdGhlciBzY3JpcHRpbmdOZXdzIGZlZWQsIGRvIHlvdT9cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTAyLTIwPC9zbWFsbD5cbiAgICBJIGhvcGUgbm9ib2R5IG1pbmRzIHRoZSBsaXR0bGUgbGluZSBJIGFkZGVkIGF0IHRoZSBib3R0b20gb2YgZWFjaCBSU1MgYm944oCmIE9mIGNvdXJzZSwgaXTigJlzIG5vdCB0b3RhbGx5IGFsdHJ1aXN0aWMsIGJ1dCBwcm9iYWJseSBzb21lIHBlb3BsZSB3aWxsIGZpbmQgaXQgaW5mb3JtYXRpdmUuIEhvd2V2ZXIsIGlmIHlvdSB3YW50IHRvIHByZXZlbnQgaXQgZnJvbSBiZWluZyBkaXNwbGF5ZWQgc2ltcGx5IGFkZCA8Y29kZT4ucnNzYm94LXByb21vIHtkaXNwbGF5OiBub25lO308L2NvZGU+IHRvIHlvdXIgc3R5bGVzaGVldC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTAxLTExPC9zbWFsbD5cbiAgICBOZXcgc2VydmVyLCBuZXcgdHJvdWJsZXM6IEkgbW92ZWQgdGhlIHZpZXdlciB0byBhIG5ld2x5IHNldHVwIFVidW50dSBtYWNoaW5lLiBPZiBjb3Vyc2UsIEkgZm9yZ290IHRvIHNldCBzb21lIHBlcm1pc3Npb24gZmxhZ3MgYW5kIG93bmVycywgdGh1cywgcHJldmVudGluZyB0aGUgc2NyaXB0IGZyb20gd29ya2luZy4gSG93ZXZlciwgSSB0aGluayBldmVyeXRoaW5nIGlzIGZpeGVkIGFuZCB3b3JraW5nIGFnYWluLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDUtMTEtMTY8L3NtYWxsPlxuICAgIEp1c3QgdGVzdGluZyBHb29nbGXigJlzIEFkU2Vuc2UgZm9yIGEgd2hpbGUuIFNpbmNlIHRoaXMgcGFnZSBnZW5lcmF0ZXMgbW9zdCBvZiBteSB0cmFmZmljIEkgd2FudGVkIHRvIHNlZSBteXNlbGYgd2hhdCBhIGJhbm5lciBjYW4gZG8gaGVyZS4gSG9wZSB5b3UgZG9u4oCZdCBtaW5kLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDQtMTItMTY8L3NtYWxsPlxuICAgIEJ1Z2ZpeDogU29tZXRpbWVzIHRoZSBsb2dmaWxlIHdoaWNoIGlzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGxpc3Qgb2Ygc2l0ZXMgdXNpbmcgdGhpcyBzY3JpcHQgZ2V0cyBjb3JydXB0ZWQuIFRoaXMgYWZmZWN0ZWQgdGhlIHdob2xlIHNldHVwIHBhZ2UgdG8gcmV0dXJuIGFuIGVycm9yIGFuZCB0aHVzLCBpdCBuZWVkZWQgdG8gYmUgY2F1Z2h0LiAoWW91IHdpbGwgc2VlIGEg4oCcY3VycmVudGx5IG91dCBvZiBvcmRlcuKAnSBtZXNzYWdlIHRoZW4uKVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDQtMDQtMjY8L3NtYWxsPlxuICAgIExhc3QgZWZmb3J0cyB0byBvZmZpY2lhbGx5IHJlbGVhc2UgdGhlIDxhIGhyZWY9Jy8vcDNrLm9yZy9zb3VyY2UvcnNzLWJveCc+Y29kZTwvYT4gdG8gdGhlIG9wZW4gc291cmNlIGNvbW11bml0eS4gVGhlcmUgaGF2ZSBiZWVuIHNvbWUgYnVncyBpbiB0aGUgKGltYWdlKSByZW5kZXJpbmcgZnJhbWV3b3JrIHdoaWNoIEkgZml4ZWQgc28gICAgZmFyLiBJIG5vdyBpbmNsdWRlIGEgZHluYW1pY2FsbHkgcmVuZGVyZWQgbGlzdCBvZiBzaXRlcyB1c2luZyAob3IgcG9pbnRpbmcgdG8pIHRoaXMgc2NyaXB0IHRvIGdpdmUgc29tZSBleGFtcGxlcyBmb3IgdGhlIGN1cmlvdXMgYXQgaGVhcnQgKG1lIGluY2x1ZGVkKS4gRmluYWxseSwgdGhlcmXigJlzIGEgPGEgaHJlZj0nLy9wM2sub3JnL3NvdXJjZS9yc3MtYm94L2JyYW5jaGVzLzIuMC9SRUFETUUnPlJFQURNRTwvYT4gZmlsZSB3aXRoIGEgc2hvcnQgaW5zdGFsbGF0aW9uIGd1aWRlIHRvIG1ha2UgdGhlIHNjcmlwdCBydW4gb24geW91ciBvd24gc2VydmVyLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDQtMDEtMjg8L3NtYWxsPlxuICAgIFdoZW4gc29tZXRoaW5nIGdvZXMgd3JvbmcgKG1vc3Qgb2YgdGhlIHRpbWUgdGhpcyBtaWdodCBiZSBhIHdyb25nIFVSTCwgaWUuIGEgNDA0IGFzIHJlc3VsdCkgYW4gICAgPGEgaHJlZj0nLi8/dXJsPWVycm9yJz7igJxlcnJvcuKAnSBib3g8L2E+IHdpbGwgYmUgZGlzcGxheWVkIHRvIHNpZ25hbCB0aGUgZmFpbHVyZS4gSW5jcmVhc2VkIHZlcnNpb24gdXAgdG8gMS4wIGFuZCBsYWJlbGVkIGl0IGFzIHJlbGVhc2UgY2FuZGlkYXRlXG4gICAgKFJDKS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTAxLTI2PC9zbWFsbD5cbiAgICBSZXRvdWNoZWQgdGhlIGNvZGUgaW4gYSB2ZXJ5IGxhc3QgZWZmb3J0IHRvIG1ha2UgdGhlIHNjcmlwdCBydW5uaW5nIHN0YW5kLWFsb25lICh3aXRoIFJlYm9sIGJ1dCAgICA8aT53aXRob3V0PC9pPiBQSFAsIHRoYXQgaXMpLiBFdmVyeXRoaW5nIG5lZWRlZCBpcyBub3cgaW4gPGRlbD5DVlM8L2RlbD4gU1ZOIHNvIGV2ZXJ5Ym9keSBjYW4gZG93bmxvYWQgZnJvbSB0aGVyZS4gUG90ZW50aWFsbHksIGEgZmV3IG1pbm9yIGJ1ZyBmaXhlcyBtaWdodCBmb2xsb3cgc2hvcnQtdGVybS4gVWgsIGFuZCB0aGUgSFRNTCBjb2RlIGlzIDxhIGhyZWY9J2h0dHA6Ly92YWxpZGF0b3IudzMub3JnL2NoZWNrP3VyaT1odHRwJTNBJTJGJTJGcDNrLm9yZyUyRnJzcyUyRic+dmFsaWQgWEhUTUwgMS4wPC9hPiBub3cuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMy0xMi0xMjwvc21hbGw+XG4gICAgVGhlIG1pcnJvciBhdCA8ZGVsPmh0dHA6Ly9wdWJsaXNoLmN1cnJ5LmNvbS9yc3MvPC9kZWw+IGlzIG5vdCB3b3JraW5nIGZvciBxdWl0ZSBhIGxvbmcgdGltZS4gSSB0cmllZCB0byBjb250YWN0IEFkYW0gQ3VycnkgYnV0IHNvIGZhciB3aXRob3V0IHN1Y2Nlc3MuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMy0wMy0zMDwvc21hbGw+XG4gICAgTW92ZWQgdG8gbmV3IHNlcnZlciB3aXRoIG5ldyBkb21haW4gPGRlbD5mb3JldmVyLnAzay5vcmc8L2RlbD4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMy0wMy0yNTwvc21hbGw+XG4gICAgVXBkYXRlZCBSZWJvbCB0byA8YSBocmVmPSdodHRwOi8vd3d3LnJlYm9sLmNvbS9uZXdzMzMxMC5odG1sJz52ZXJzaW9uIDIuNS41PC9hPi4gRW5kIG9mIFJlYm9s4oCZcyDigJxETlMgem9tYmllc+KAnSBpbiB0aGUgcHJvY2VzcyBsaXN0LlxuICAgIDxpPkZpbmFsbHkuPC9pPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDItMDItMTk8L3NtYWxsPlxuICAgIEFkZGVkIGEgdmVyeSBuaWNlIHF1b3RlIGZyb20gPGEgaHJlZj0naHR0cDovL3d3dy5vdXJwbGEubmV0L2NnaS1iaW4vcGlraWUuY2dpP0FiYmVOb3JtYWwnPkFiYmUgTm9ybWFsPC9hPiBvbiB0b3AgcmlnaHQgb2YgdGhpcyBkb2N1bWVudC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTExLTE3PC9zbWFsbD5cbiAgICBJZiB5b3Ugd2FudCBhIG1vcmUgY29tcGFjdCB2aWV3IG9mIHRoZSBSU1MgYm94IHlvdSBjYW4gZ2V0IGl0IG5vdyB1c2luZyB0aGUgY29ycmVzcG9uZGluZyBjaGVja2JveC4gSWYgaXQgaXMgZW5hYmxlZCB0aGUgZGVzY3JpcHRpb25zIG9mIGVhY2ggaXRlbSB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQgJiM4MjExOyBnaXZlbiB0aGF0IHRoZSBpdGVtIHRpdGxlIGlzIGRlZmluZWQgKG90aGVyd2lzZSB0aGVyZSB3b3VsZCBub3QgYmUgbXVjaCB0byBzZWUpLiBBZGRpdGlvbmFsbHksIHRoZSBjaGFubmVsIGltYWdlIChpZiBkZWZpbmVkKSB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQuIFRoYW5rcyAmIzEwNjsmIzExNTsmIzEyMTsmIzEwMTsmIzExMTsmIzY0OyYjOTk7JiMxMTE7JiMxMDk7JiMxMTI7JiMxMTc7JiMxMTU7JiMxMDE7JiMxMTQ7JiMxMTg7JiMxMDE7JiM0NjsmIzk5OyYjMTExOyYjMTA5OyBmb3IgdGhlIHN1Z2dlc3Rpb25zIVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDktMjE8L3NtYWxsPlxuICAgIFNpbmNlIHRvZGF5IHRoZSA8Y29kZT50ZXh0aW5wdXQ8L2NvZGU+IHRhZyBpcyBzdXBwb3J0ZWQuIEl0IGNyZWF0ZXMgYW4gYXBwcm9wcmlhdGUgZm9ybSBhdCB0aGUgZW5kIG9mIHRoZSBib3guIE1vcmVvdmVyLCB0d28gYnVncyB3ZXJlIGZpeGVkOiBvbmUgY2F1c2VkIHVubmVjZXNzYXJ5IGluZm9ybWF0aW9uIGluIHRoZSBxdWVyeSBzdHJpbmcgb2YgdGhlIGdlbmVyYXRlZCBKYXZhU2NyaXB0IHRhZy4gVGhlIG90aGVyIGFmZmVjdGVkIHRoZSBkaXNwbGF5IG9mIHRoZSBkYXRl4oCZcyB0aW1lIHpvbmUuIFRpbWUgem9uZXMgbm93IGFyZSBnZW5lcmFsbHkgZGlzcGxheWVkIGluIEdNVCBleGNlcHQgd2hlcmUgYW5vdGhlciB0aW1lIHpvbmUgYWNyb255bSBpcyBkZWZpbmVkLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDktMDQ8L3NtYWxsPlxuICAgIEFkZGVkIGljb25zIGZvciBlbmNsb3N1cmUgYW5kIHNvdXJjZTsgYWRkZWQgWE1MIGJ1dHRvbiBjaGVja2JveCB0byBlbmFibGUgb3V0cHV0IG9mIHRoZSBxdWFzaS1zdGFuZGFyZCBvcmFuZ2UgYnV0dG9uIGxpbmtpbmcgdG8gdGhlIFhNTCBzb3VyY2UgKGlkZWFieSAmIzk3OyYjMTAwOyYjOTc7JiMxMDk7JiM2NDsmIzk5OyYjMTE3OyYjMTE0OyYjMTE0OyYjMTIxOyYjNDY7JiM5OTsmIzExMTsmIzEwOTspLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDktMDM8L3NtYWxsPlxuICAgIEl04oCZcyBub3cgcG9zc2libGUgdG8gcmVmaW5lIHRoZSBzdHlsZSBvZiB0aGUgd2hvbGUgYm94IHVzaW5nIHRoZSBuZXdseSBpbXBsZW1lbnRlZCBjc3MgY2xhc3NlcyA8Y29kZT5yc3Nib3gtdGl0bGU8L2NvZGU+LCA8Y29kZT5yc3Nib3gtY29udGVudDwvY29kZT4sIDxjb2RlPnJzc2JveC1pdGVtLXRpdGxlPC9jb2RlPiBhbmQgPGNvZGU+cnNzYm94LXR0ZW0tY29udGVudDwvY29kZT4gKGlkZWEgYnkgJiMxMTQ7JiMxMDA7JiM5NzsmIzExODsmIzEwNTsmIzEwMTsmIzExNTsmIzY0OyYjMTExOyYjMTE0OyYjMTA1OyYjMTAxOyYjMTEwOyYjMTE2OyYjMTEyOyYjOTc7JiM5OTsmIzEwNTsmIzEwMjsmIzEwNTsmIzk5OyYjNDY7JiM5OTsmIzExMTsmIzEwOTspLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMjQ8L3NtYWxsPlxuICAgIEFkZGVkIGEgZm9ybSBpbnB1dCBmb3IgbGltaXRpbmcgdGhlIGl0ZW0gZGlzcGxheS4gVGhlIG51bWJlciBkZXRlcm1pbmVzIGhvdyBtYW55IGl0ZW1zIHdpbGwgYmUgc2hvd24gaW4gdGhlIGJveCAoc2V2ZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUpLiBHb29kIGZvciBvZnRlbiB1cGRhdGVkIGNoYW5uZWxzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMTU8L3NtYWxsPlxuICAgIERldGVjdGVkIGEgc3RyYW5nZSBidWcgdGhhdCBwcmV2ZW50ZWQgdGhlIHZpZXdlciBhdCA8YSBocmVmPSdodHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzLyc+Y3VycnkuY29tPC9hPiBsb2FkaW5nIGh0dHA6Ly9wM2sub3JnL3Jzcy54bWwgd2hpbGUgaHR0cDovL3d3dy5wM2sub3JnL3Jzcy54bWwgd2FzIG5vIHByb2JsZW0gYXQgYWxsLiBVcGdyYWRpbmcgdGhlIFJlYm9sIGluc3RhbGxhdGlvbiB0byB0aGUgY3VycmVudCB2ZXJzaW9uIHNvbHZlZCB0aGVwcm9ibGVtLCBob3dldmVyIHRoZSBjYXVzZSByZW1haW5zIHVuY2xlYXLigKZcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTA4PC9zbWFsbD5cbiAgICBGaXhlZCBhIHNtYWxsIGJ1ZyB0aGF0IGNvcnJ1cHRlZCBjaGFubmVsIFVSTHMgY29udGFpbmluZyBhIHF1ZXJ5IChhcyByZXBvcnRlZCBieSAmIzEwNzsmIzEwNTsmIzEwNzsmIzk3OyYjNjQ7JiMxMTU7JiMxMDg7JiMxMTE7JiMxMDg7JiMxMDE7JiMxMDQ7JiMxMTY7JiM0NjsmIzEwMTsmIzEwMTspLiBDb25maWd1cmVkIHNlcnZlciByZWRpcmVjdCBmcm9tIDxkZWw+aHR0cDovL3BpZWZrZS5oZWxtYS5hdC9yc3M8L2RlbD4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wOC0wNTwvc21hbGw+XG4gICAgVGhhbmtzIHRvIDxhIGhyZWY9J2h0dHA6Ly93d3cuY3VycnkuY29tLzIwMDEvMDcvMzEjY29vbFJzc1NlcnZpY2UnPkFkYW0gQ3Vycnk8L2E+LCB0aGUgdmlld2VyIGlzIG5vdyBtaXJyb3JlZCBhdCA8ZGVsPmh0dHA6Ly9wdWJsaXNoLmN1cnJ5LmNvbS9yc3M8L2RlbD4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wNy0zMDwvc21hbGw+XG4gICAgQWRkZWQgbGluayB0byBzb3VyY2UgY29kZTsgYWRkZWQgZXhhbXBsZSBsaW5rcyBmb3IgYWxsIHN1cHBvcnRlZCBmb3JtYXRzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDUtMzA8L3NtYWxsPlxuICAgIEZpeGVkIGEgbGl0dGxlIGJ1ZyByZXBvcnRlZCBieSAmIzEwMjsmIzExNDsmIzEwMTsmIzEwMDsmIzEwNTsmIzY0OyYjMTAxOyYjMTA5OyYjOTc7JiMxMDU7JiMxMDg7JiM0NjsmIzEwMTsmIzEwMTsgdGhhdCBjYXVzZWQgZGlhY3JpdGljIGNoYXJhY3RlcnMgdG8gYmUgZGlzcGxheWVkIGFzIGVudGl0eSBjb2Rlcy5cbiAgPC9wPlxuPC9kZXRhaWxzPlxuXG48c3R5bGU+XG4gIGgzIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIH1cblxuICBoMyArIHAsIHN1bW1hcnkgKyAqIHtcbiAgICBtYXJnaW4tdG9wOiAwO1xuICB9XG5cbiAgc3VtbWFyeSB7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIGxpICsgbGkge1xuICAgIG1hcmdpbi10b3A6IDAuNWVtO1xuICB9XG5cbiAgc21hbGwge1xuICAgIGNvbG9yOiAjOTk5O1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXNWRSxFQUFFLG1CQUFDLENBQUMsQUFDRixPQUFPLENBQUUsWUFBWSxBQUN2QixDQUFDLEFBRUQsRUFBRSxDQUFHLG9CQUFDLENBQUUsT0FBTyxDQUFHLG1CQUFFLENBQUMsQUFDbkIsVUFBVSxDQUFFLENBQUMsQUFDZixDQUFDLEFBRUQsT0FBTyxtQkFBQyxDQUFDLEFBQ1AsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsRUFBRSxDQUFHLEVBQUUsbUJBQUMsQ0FBQyxBQUNQLFVBQVUsQ0FBRSxLQUFLLEFBQ25CLENBQUMsQUFFRCxLQUFLLG1CQUFDLENBQUMsQUFDTCxLQUFLLENBQUUsSUFBSSxBQUNiLENBQUMifQ== */";
	appendNode(style, document.head);
}

function create_main_fragment$2(state, component) {
	var details;

	return {
		c: function create() {
			details = createElement("details");
			details.innerHTML = "<summary svelte-3224456170><h3 svelte-3224456170>Change Log</h3></summary>\n\n  <p svelte-3224456170><small svelte-3224456170>2016-03-12</small>\n    Completely rewrote build environment using WebPack. Switched the <a svelte-3224456170 href=\"https://github.com/p3k/rss-box\">source repository</a> from SVN to Git, hosted at Github. This deserves a new major version number!</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-12-30</small>\n    Added simple code to modify the width attribute of iframe, object and embed elements to make them fit in the box. Also: bumped version. <i svelte-3224456170>A happy new year 2013, everbody!</i></p>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-10-26</small>\n    Added section about Creative Commons License, below. In other words: you can now legally run my code on your own server. (You even could remove the tiny reference to this page in the footer of the box.) However, I would like to ask you for two things if you want to do so:</p>\n  <ul svelte-3224456170><li svelte-3224456170>Use your own <a svelte-3224456170 href=\"//github.com/p3k/json3k\">JSONP proxy</a> – especially, when you expect a high load on your server.</li>\n    <li svelte-3224456170>Please support the service with a <a svelte-3224456170 href=\"http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer\">donation</a>.</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-08-01</small>\n    Added two new, experimental features – and thus, increased version to 3.3:</p>\n  <ul svelte-3224456170><li svelte-3224456170>The height of the inner box content can now be defined by a pixel value. If the height is less than the space needed by the desired amount of items you can vertically scroll the content. A value of <code svelte-3224456170>-1</code> enables the default behavior and automatically sets the height according to the displaying items.</li>\n    <li svelte-3224456170>The so-called “headless” mode removes the titlebar and the frame from the box. This way the box can be used more flexibly in special situations. However, this feature somehow undermines an RSS feed’s authority so I count on your fairness to give credit where credit is due!</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-07-16</small>\n    Slightly modified output of the HTML code to be usable with both, unsecured and secured (HTTPS) web servers. You can update already embedded code easily by removing the <code svelte-3224456170>http:</code> part from the <code svelte-3224456170>src</code> attribute of the <code svelte-3224456170>&lt;script&gt;</code> element: <code svelte-3224456170>&lt;script src='http://p3k.org/rss…'&gt;</code> becomes <code svelte-3224456170>&lt;script src='//p3k.org/rss…'&gt;</code>.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-07-13</small></p>\n  <ul svelte-3224456170><li svelte-3224456170>Fixed IE bug (“innerHTML is null or not an object”) caused by using jQuery’s html() method instead of text() when parsing a <code svelte-3224456170>&lt;content:encoded&gt;</code> element.</li>\n    <li svelte-3224456170>Changed priority of elements: only check for <code svelte-3224456170>&lt;content:encoded&gt;</code> if     <code svelte-3224456170>&lt;description&gt;</code> is not available.</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-06-04</small></p>\n  <ul svelte-3224456170><li svelte-3224456170>Implemented small routine to resize images contained in the feed content to fit in the box.</li>\n    <li svelte-3224456170>Added support for new HTML5 form input types and their validation.</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-05-31</small>\n    Gone βeta! – with three tiny additons:</p>\n  <ul svelte-3224456170><li svelte-3224456170>Added <code svelte-3224456170>&lt;noscript&gt;</code> element for browsers providing no JavaScript engine.</li>\n    <li svelte-3224456170>Added option to call the configurator with a URL in the query string.</li>\n    <li svelte-3224456170>Added a link to the W3C feed validator to the contents of a box displaying an RSS error.</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-05-19</small>\n    Apologies for the RSS Boxes not showing up on your pages during the last few days. I made a stupid mistake that caused only the setup page to render correctly – and I did not check any embedded script. <i svelte-3224456170>Bummer!</i></p>\n  <p svelte-3224456170>At least now everything should be back to normal. (I hope this incident did not sabotage the Flattr button I added in the meantime… <i svelte-3224456170>wink, wink!</i>)</p>\n  <p svelte-3224456170>Anyway, thanks for your understanding.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-05-16</small>\n    I think I did not mention, yet, that the current incarnation of the code is totally disconnected from the version as of 2009. Each is using their own codebase, the legacy code was not modified at all and thus, it is not affected by any recent changes. You can check which version you are using by looking at the script URL. If it contains the string “proxy.r” you get the “classic” RSS Box rendering. The modernized version calls “index.js”. Nevertheless, you cannot setup boxes with the old URL anymore.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-05-09</small></p>\n  <ul svelte-3224456170><li svelte-3224456170>Added support for <code svelte-3224456170>&lt;content:encoded&gt;</code> element.</li>\n    <li svelte-3224456170>Implemented Memcache usage in AppEngine code.</li>\n    <li svelte-3224456170>Beautified this page by using the <a svelte-3224456170 href=\"http://www.google.com/webfonts/specimen/Droid+Serif\">Google’s Droid Serif font</a>.</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2012-04-26</small>\n    Amazing! A new version! After more than two years hiatus I completely rewrote the codebase and framework:</p>\n  <ul svelte-3224456170><li svelte-3224456170>Removed dependency to Rebol using a small JSONP proxy at Google’s AppEngine.</li>\n    <li svelte-3224456170>Rewrote XML parsing, replacing native methods with jQuery ones.</li>\n    <li svelte-3224456170>Cleaned up HTML output for the RSS Box, replacing tables with divs. <i svelte-3224456170>Note: You might need to add <code svelte-3224456170><a svelte-3224456170 href=\"http://coding.smashingmagazine.com/2010/11/02/the-important-css-declaration-how-and-when-to-use-it/\">!important</a></code> to your custom RSS Box stylesheet definitions.</i></li>\n    <li svelte-3224456170>Replaced fugly colorpicker in configurator with the <a svelte-3224456170 href=\"https://github.com/claviska/jquery-miniColors/\">MiniColors jQuery plugin</a>.</li>\n    <li svelte-3224456170>Added link color setting and style attributes for correctly applying color settings.</li>\n    <li svelte-3224456170>Added corner radius setting. <i svelte-3224456170>Note: does not work in IE8 and earlier versions.</i></li>\n    <li svelte-3224456170>Added font size to the font face setting.</li>\n    <li svelte-3224456170>Removed align setting from configurator (still works in script tags generated with earlier versions).</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2009-12-13</small>\n    Switched output of this page to HTML5 and made some adaptations in the HTML code and CSS stylesheet. Updated version string to 2.1, finally!</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2009-09-28</small>\n    Some minor changes after a while:</p>\n  <ul svelte-3224456170><li svelte-3224456170>Refactored date parsing to show actual build dates more reliably</li>\n    <li svelte-3224456170>Refactored caching routine (only in online version)</li>\n    <li svelte-3224456170>Updated version string to 2.1b, approaching another final version.</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2008-02-19</small>\n    Seems there were some changes in the air as I did not plan another update but here comes version 2.1 bringing to you:</p>\n  <ul svelte-3224456170><li svelte-3224456170>Full client-side processing (only the raw feed data is fetched from the server).</li>\n    <li svelte-3224456170>User-friendlier interface with color pickers, status and error display as well as instant feedback on any change in setup.</li>\n    <li svelte-3224456170>And finally (drumroll!) Unicode support at least at this installation of the viewer. (Ie. the downloaded version still will output ASCII only.)</li>\n  </ul>\n\n  <p svelte-3224456170><small svelte-3224456170>2008-02-03</small>\n    Made some more improvements especially regarding the error handling and output. From now on it should be much clearer what’s wrong with a very RSS Box. Since there’s now a lot more of client-side JavaScript code involved I tested the script in four major browsers that are available to me: Internet Explorer 7, Firefox 2.0, Opera 9.25 and Safari 3.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2008-02-01</small>\n    Completely revised server- and client-side code. XML rendering is now done in the browser which speeds up things and decreases the load on the server. Furthermore, the list of referrers is now loaded on demand via AJAX and thus not rendered with every request. Finally, I retouched the setup form interface and cleaned up both HTML and CSS.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-12-20</small>\n    I am very glad that my old little script is gaining even more attention after all these years…    <i svelte-3224456170>Thank you very much indeed!</i> Since there are coming in more and more of the same requests and I am really not able to handle them (apologies!), here is some advice for everyone:</p>\n  <ol svelte-3224456170><li svelte-3224456170><a svelte-3224456170 href=\"http://en.wikipedia.org/wiki/Cascading_Style_Sheets\">Use cascading style sheets</a> (CSS) to change font sizes (and to generally define your layout).</li>\n    <li svelte-3224456170><a svelte-3224456170 href=\"http://www.sitepoint.com/article/beware-opening-links-new-window\">Beware of opening links in a new window.</a> It’s offensive to your readers.</li>\n  </ol>\n  <p svelte-3224456170><i svelte-3224456170>A happy end for 2006!</i></p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-06-13</small>\n    Did some minor bug fixing again (amongst others replacing single quotes with &apos; and not &quot; entities). Furthermore (and finally), I removed the “RC” (as in “Release Candidate”) from the document title…</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-06-12</small>\n    Gary informed me that longer feed URLs cause trouble and the feed box will not be displayed. That’s in fact a bug, but unfortunately one that cannot be fixed so easily. My suggestion is to shorten such URLs at one of the websites around that provide such a service, e.g. <a svelte-3224456170 href=\"http://tinyurl.com\">tinyurl.com</a>.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-04-23</small>\n    Switched the <a svelte-3224456170 href=\"//p3k.org/source/rss-box/\">source repository</a> from CVS to Subversion (SVN).</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-04-20</small>\n    Andrew Pam brought up a serious issue that probably might have affected some more people already: the viewer does not support UTF-8 (or Unicode, resp.) Unfortunately, this is “built-in” into the underlying scripting language (aka Rebol). I’m sorry to cancel those tickets… :(</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-04-13</small>\n    Fixed a bug reported by Mando Gomez that caused feeds using the &lt;guid&gt; element being displayed without item links… Don’t forget to check out Mando’s excellent website <a svelte-3224456170 href=\"http://www.mandolux.com/\">mandolux</a>!</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-04-12</small>\n    Obviously Sam Ruby changed his feed format from scriptingNews to Atom; which renders my example link above pretty useless… So far I don’t know about any other scriptingNews feed, do you?</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-02-20</small>\n    I hope nobody minds the little line I added at the bottom of each RSS box… Of course, it’s not totally altruistic, but probably some people will find it informative. However, if you want to prevent it from being displayed simply add <code svelte-3224456170>.rssbox-promo {display: none;}</code> to your stylesheet.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2006-01-11</small>\n    New server, new troubles: I moved the viewer to a newly setup Ubuntu machine. Of course, I forgot to set some permission flags and owners, thus, preventing the script from working. However, I think everything is fixed and working again.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2005-11-16</small>\n    Just testing Google’s AdSense for a while. Since this page generates most of my traffic I wanted to see myself what a banner can do here. Hope you don’t mind.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2004-12-16</small>\n    Bugfix: Sometimes the logfile which is used to generate the list of sites using this script gets corrupted. This affected the whole setup page to return an error and thus, it needed to be caught. (You will see a “currently out of order” message then.)</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2004-04-26</small>\n    Last efforts to officially release the <a svelte-3224456170 href=\"//p3k.org/source/rss-box\">code</a> to the open source community. There have been some bugs in the (image) rendering framework which I fixed so    far. I now include a dynamically rendered list of sites using (or pointing to) this script to give some examples for the curious at heart (me included). Finally, there’s a <a svelte-3224456170 href=\"//p3k.org/source/rss-box/branches/2.0/README\">README</a> file with a short installation guide to make the script run on your own server.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2004-01-28</small>\n    When something goes wrong (most of the time this might be a wrong URL, ie. a 404 as result) an    <a svelte-3224456170 href=\"./?url=error\">“error” box</a> will be displayed to signal the failure. Increased version up to 1.0 and labeled it as release candidate\n    (RC).</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2004-01-26</small>\n    Retouched the code in a very last effort to make the script running stand-alone (with Rebol but    <i svelte-3224456170>without</i> PHP, that is). Everything needed is now in <del svelte-3224456170>CVS</del> SVN so everybody can download from there. Potentially, a few minor bug fixes might follow short-term. Uh, and the HTML code is <a svelte-3224456170 href=\"http://validator.w3.org/check?uri=http%3A%2F%2Fp3k.org%2Frss%2F\">valid XHTML 1.0</a> now.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2003-12-12</small>\n    The mirror at <del svelte-3224456170>http://publish.curry.com/rss/</del> is not working for quite a long time. I tried to contact Adam Curry but so far without success.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2003-03-30</small>\n    Moved to new server with new domain <del svelte-3224456170>forever.p3k.org</del>.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2003-03-25</small>\n    Updated Rebol to <a svelte-3224456170 href=\"http://www.rebol.com/news3310.html\">version 2.5.5</a>. End of Rebol’s “DNS zombies” in the process list.\n    <i svelte-3224456170>Finally.</i></p>\n\n  <p svelte-3224456170><small svelte-3224456170>2002-02-19</small>\n    Added a very nice quote from <a svelte-3224456170 href=\"http://www.ourpla.net/cgi-bin/pikie.cgi?AbbeNormal\">Abbe Normal</a> on top right of this document.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-11-17</small>\n    If you want a more compact view of the RSS box you can get it now using the corresponding checkbox. If it is enabled the descriptions of each item will not be displayed – given that the item title is defined (otherwise there would not be much to see). Additionally, the channel image (if defined) will not be displayed. Thanks jsyeo@compuserve.com for the suggestions!</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-09-21</small>\n    Since today the <code svelte-3224456170>textinput</code> tag is supported. It creates an appropriate form at the end of the box. Moreover, two bugs were fixed: one caused unnecessary information in the query string of the generated JavaScript tag. The other affected the display of the date’s time zone. Time zones now are generally displayed in GMT except where another time zone acronym is defined.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-09-04</small>\n    Added icons for enclosure and source; added XML button checkbox to enable output of the quasi-standard orange button linking to the XML source (ideaby adam@curry.com).</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-09-03</small>\n    It’s now possible to refine the style of the whole box using the newly implemented css classes <code svelte-3224456170>rssbox-title</code>, <code svelte-3224456170>rssbox-content</code>, <code svelte-3224456170>rssbox-item-title</code> and <code svelte-3224456170>rssbox-ttem-content</code> (idea by rdavies@orientpacific.com).</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-08-24</small>\n    Added a form input for limiting the item display. The number determines how many items will be shown in the box (seven is the default value). Good for often updated channels.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-08-15</small>\n    Detected a strange bug that prevented the viewer at <a svelte-3224456170 href=\"http://publish.curry.com/rss/\">curry.com</a> loading http://p3k.org/rss.xml while http://www.p3k.org/rss.xml was no problem at all. Upgrading the Rebol installation to the current version solved theproblem, however the cause remains unclear…</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-08-08</small>\n    Fixed a small bug that corrupted channel URLs containing a query (as reported by kika@sloleht.ee). Configured server redirect from <del svelte-3224456170>http://piefke.helma.at/rss</del>.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-08-05</small>\n    Thanks to <a svelte-3224456170 href=\"http://www.curry.com/2001/07/31#coolRssService\">Adam Curry</a>, the viewer is now mirrored at <del svelte-3224456170>http://publish.curry.com/rss</del>.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-07-30</small>\n    Added link to source code; added example links for all supported formats.</p>\n\n  <p svelte-3224456170><small svelte-3224456170>2001-05-30</small>\n    Fixed a little bug reported by fredi@email.ee that caused diacritic characters to be displayed as entity codes.</p>";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$2(details);
		},

		m: function mount(target, anchor) {
			insertNode(details, target, anchor);
		},

		p: noop,

		u: function unmount() {
			detachNode(details);
		},

		d: noop
	};
}

function Changes(options) {
	this._debugName = '<Changes>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	if (!document.getElementById("svelte-3224456170-style")) add_css$2();

	this._fragment = create_main_fragment$2(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(Changes.prototype, protoDev);

Changes.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/Flattr.html generated by Svelte v1.50.0 */
(function() {
    var s = document.createElement('script'), t = document.getElementsByTagName('script')[0];
    s.type = 'text/javascript';
    s.async = true;
    s.src = '//api.flattr.com/js/0.6/load.js?mode=auto';
    t.parentNode.insertBefore(s, t);
})();

function create_main_fragment$3(state, component) {
	var a;

	return {
		c: function create() {
			a = createElement("a");
			this.h();
		},

		h: function hydrate() {
			a.className = "FlattrButton";
			setStyle(a, "display", "none");
			a.dataset.flattrButton = "compact";
			a.dataset.flattrPopout = "0";
			a.href = "//p3k.org/rss";
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
		},

		p: noop,

		u: function unmount() {
			detachNode(a);
		},

		d: noop
	};
}

function Flattr(options) {
	this._debugName = '<Flattr>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	this._fragment = create_main_fragment$3(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(Flattr.prototype, protoDev);

Flattr.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/About.html generated by Svelte v1.50.0 */
var methods = {
  goto(event) {
    event.preventDefault();
    this.store.set({ url: event.target.href });
  }
};

function oncreate() {
  this.store.observe('appDescription', description => {
    document.title = description;
  });
}

function encapsulateStyles$1(node) {
	setAttribute(node, "svelte-3919915778", "");
}

function add_css$1() {
	var style = createElement("style");
	style.id = 'svelte-3919915778-style';
	style.textContent = "h3[svelte-3919915778]{display:inline-block}h3+p[svelte-3919915778],summary+[svelte-3919915778]{margin-top:0}summary[svelte-3919915778]{outline:none}li+li[svelte-3919915778]{margin-top:0.5em}small[svelte-3919915778]{color:#999}.warning[svelte-3919915778]{border-color:#e44;background:#fdd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJvdXQuaHRtbCIsInNvdXJjZXMiOlsiQWJvdXQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8ZGl2PlxuICA8c21hbGw+PGk+4oCcSmF2YVNjcmlwdCBSU1MgVmlld2VyIHB1dHMgbGl0dGxlIG9yIGxvbmcgY3VzdG9taXphYmxlIFJTUyBib3hlcyBhbnl3aGVyZSB5b3UgcHV0IEhUTUw7IGJ1aWxkIHlvdXIgb3duIHNsYXNoYm94IGhlbGwgb3IgaGVhdmVuLCBpdOKAmXMgZmVlZGFyaWZpYyHigJ0g4oCUIDxhIGhyZWY9J2h0dHA6Ly9vdXJwbGEubmV0L2NnaS9waWtpZSc+QWJiZSBOb3JtYWw8L2E+PC9pPjwvc21hbGw+XG48L2Rpdj5cblxuPGgyPnt7ICRhcHBEZXNjcmlwdGlvbiB9fSB7eyAkYXBwVmVyc2lvbiB9fTwvaDI+XG5cbjxwIGNsYXNzPSdtc2cgd2FybmluZyc+XG4gIDxzdHJvbmc+UmVkdWNlZCBhdmFpbGFiaWxpdHkgZHVlIHRvIHRlbXBvcmFyeSB2aW9sYXRpb24gb2YgcXVvdGEgbGltaXQuPC9zdHJvbmc+IFlvdSBzaG91bGQgPGEgaHJlZj0nLy9naXRodWIuY29tL3Azay9qc29uM2snPmluc3RhbGwgeW91ciBvd24gSlNPTlAgcHJveHk8L2E+LiBZb3UgY2FuIGFsd2F5cyBzdXBwb3J0IHRoZSBwcm9qZWN0IHdpdGggeW91ciA8YSBocmVmPSdodHRwOi8vZmxhdHRyLmNvbS90aGluZy82ODE4ODEvSmF2YVNjcmlwdC1SU1MtQm94LVZpZXdlcic+ZG9uYXRpb248L2E+LlxuPC9wPlxuXG48cD5cbiAgVGhpcyB2aWV3ZXIgY2FuIGRpc3BsYXkgPGEgaHJlZj0naHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SU1MnPlJTUzwvYT4gZmVlZHMgb2YgdmVyc2lvbiA8YSBocmVmPSdodHRwOi8vY3liZXIubGF3LmhhcnZhcmQuZWR1L3Jzcy9leGFtcGxlcy9zYW1wbGVSc3MwOTEueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPjAuOTE8L2E+LCA8YSBocmVmPSdodHRwOi8vY3liZXIubGF3LmhhcnZhcmQuZWR1L3Jzcy9leGFtcGxlcy9zYW1wbGVSc3MwOTIueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPjAuOTI8L2E+LCA8YSBocmVmPSdodHRwOi8vcnNzLm9yZi5hdC9mbTQueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPjEuMDwvYT4gYW5kIDxhIGhyZWY9J2h0dHA6Ly9ibG9nLnAzay5vcmcvc3Rvcmllcy54bWwnIG9uOmNsaWNrPSdnb3RvKGV2ZW50KSc+Mi4wPC9hPiBhcyB3ZWxsIGFzIGV2ZW4gdGhlIGdvb2Qgb2xkIGxlZ2FjeSBmb3JtYXQgPGEgaHJlZj0naHR0cDovL2Vzc2F5c2Zyb21leG9kdXMuc2NyaXB0aW5nLmNvbS94bWwvc2NyaXB0aW5nTmV3czIueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPlNjcmlwdGluZyBOZXdzIDI8L2E+LiA8aT4oU29ycnksIG5vIDxhIGhyZWY9J2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQXRvbV8lMjhzdGFuZGFyZCUyOSc+QXRvbTwvYT4uKTwvaT5cbjwvcD5cblxuPHA+XG4gIEl0IHByb3ZpZGVzIGEgc2ltcGxlIHdheSB0byBlbWJlZCBzdWNoIFJTUyBib3hlcyBpbiBhbnkgPGEgaHJlZj0naHR0cDovL3ZhbGlkYXRvci53My5vcmcvJz52YWxpZCBIVE1MIGRvY3VtZW50PC9hPiB2aWEgYW4gYXV0b21hZ2ljYWxseSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCB0YWcg4oCUIDxpPmZvciBmcmVlITwvaT5cbjwvcD5cblxuPHA+XG4gIEp1c3QgZW50ZXIgdGhlIFVSTCBvZiBhbnkgY29tcGF0aWJsZSBSU1MgZmVlZCwgbW9kaWZ5IHRoZSBsYXlvdXQgc2V0dGluZ3MgYXMgeW91IGxpa2UgYW5kIHB1c2ggdGhlIFJlbG9hZCBidXR0b24uIFdoZW4gZmluaXNoZWQsIGNvcHkgdGhlIEhUTUwgY29kZSBpbnRvIHlvdXIgb3duIHdlYiBwYWdlIOKAkyBhbmQgdm9pbMOgIVxuPC9wPlxuXG48cD5cbiAgVGhlIGNvZGUgYmVoaW5kIHRoaXMgaXMgd3JpdHRlbiBpbiBKYXZhU2NyaXB0IGFuZCBydW5zIGNvbXBsZXRlbHkgaW4geW91ciBicm93c2VyKi4gWW91IGNhbiBnZXQgdGhlIHNvdXJjZSBjb2RlIHRvZ2V0aGVyIHdpdGggYWxsIHRoZSBvdGhlciBuZWNlc3NhcnkgZmlsZXMgZnJvbSB0aGUgPGEgaHJlZj0nLy9naXRodWIuY29tL3Azay9yc3MtYm94Jz5HaXRodWIgcmVwb3NpdG9yeTwvYT4uXG48L3A+XG5cbjxwPlxuICA8c21hbGw+KiBBIHByb3h5IHNlcnZlciBpcyBuZWVkZWQgZm9yIGNyb3NzLW9yaWdpbiByZXF1ZXN0cy48L3NtYWxsPlxuPC9wPlxuXG48cD5cbiAgPEZsYXR0ci8+XG48L3A+XG5cbjxDaGFuZ2VzLz5cblxuPGRldGFpbHM+XG4gIDxzdW1tYXJ5PlxuICAgIDxoMz5Lbm93biBMaW1pdGF0aW9uczwvaDM+XG4gIDwvc3VtbWFyeT5cbiAgPHVsPlxuICAgIDxsaT5ObyBzdXBwb3J0IGZvciBQSUNTIHJhdGluZzwvbGk+XG4gICAgPGxpPk5vIG11bHRpcGxlIGVuY2xvc3VyZXMgKFJTUyAwLjkzKTwvbGk+XG4gICAgPGxpPk5vIEF0b20gc3VwcG9ydDwvbGk+XG4gIDwvdWw+XG48L2RldGFpbHM+XG5cbjxoMz5GdXR1cmUgRGV2ZWxvcG1lbnQ8L2gzPlxuXG48cD5cbiAgSSBoYXZlIGNlYXNlZCBhY3RpdmVseSBkZXZlbG9waW5nIHRoaXMgdmlld2VyIGJ1dCBzb21ldGltZXMgSSBnZXQgZW50aHVzaWFzdGljIGFuZCBmaWRkbGUgYXJvdW5kIHdpdGggdGhlIGNvZGUuIE9mIGNvdXJzZSBpdCB3aWxsIGJlIGF2YWlsYWJsZSBoZXJlIGFzIGlzLlxuPC9wPlxuPHA+XG4gIEZvciBxdWVzdGlvbnMgYW5kIGNvbW1lbnRzIGZlZWwgZnJlZSB0byBjb250YWN0IG1lIChUb2JpKSB2aWEgZS1tYWlsOiA8YSBocmVmPSdtYWlsdG86JiMxMDk7JiM5NzsmIzEwNTsmIzEwODsmIzQzOyYjMTE0OyYjMTE1OyYjMTE1OyYjNjQ7JiMxMTI7JiM1MTsmIzEwNzsmIzQ2OyYjMTExOyYjMTE0OyYjMTAzOyc+JiMxMDk7JiM5NzsmIzEwNTsmIzEwODsmIzQzOyYjMTE0OyYjMTE1OyYjMTE1OyYjNjQ7JiMxMTI7JiM1MTsmIzEwNzsmIzQ2OyYjMTExOyYjMTE0OyYjMTAzOzwvYT4uXG48L3A+XG5cbjxoMz5MaWNlbnNlPC9oMz5cblxuPHA+XG4gIDxzcGFuIHhtbG5zOmRjdD1cImh0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy9cIiBwcm9wZXJ0eT1cImRjdDp0aXRsZVwiPkphdmFTY3JpcHQgUlNTIEJveCBWaWV3ZXI8L3NwYW4+IGJ5XG4gIDxhIHhtbG5zOmNjPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjXCIgaHJlZj1cImh0dHA6Ly9wM2sub3JnL3Jzc1wiIHByb3BlcnR5PVwiY2M6YXR0cmlidXRpb25OYW1lXCIgcmVsPVwiY2M6YXR0cmlidXRpb25VUkxcIj5Ub2JpIFNjaMOkZmVyPC9hPiBpcyBsaWNlbnNlZCB1bmRlciBhIDxhIHJlbD1cImxpY2Vuc2VcIiBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL2F0L2RlZWQuZW5fVVNcIj5DcmVhdGl2ZSBDb21tb25zIEF0dHJpYnV0aW9uLVNoYXJlQWxpa2UgMy4wIEF1c3RyaWEgTGljZW5zZTwvYT4uXG48L3A+XG48cD5cbiAgQmFzZWQgb24gYSB3b3JrIGF0IDxhIHhtbG5zOmRjdD1cImh0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy9cIiBocmVmPVwiaHR0cHM6Ly9wM2sub3JnL3NvdXJjZS9zdm4vcnNzLWJveC90cnVuay9cIiByZWw9XCJkY3Q6c291cmNlXCI+aHR0cHM6Ly9wM2sub3JnL3NvdXJjZS9zdm4vcnNzLWJveC90cnVuay88L2E+LlxuPC9wPlxuPHA+XG4gIDxhIHJlbD1cImxpY2Vuc2VcIiBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL2F0L2RlZWQuZW5fVVNcIj5cbiAgICA8aW1nIGFsdD1cIkNyZWF0aXZlIENvbW1vbnMgTGljZW5zZVwiIHN0eWxlPVwiYm9yZGVyLXdpZHRoOjBcIiBzcmM9XCIvL2kuY3JlYXRpdmVjb21tb25zLm9yZy9sL2J5LXNhLzMuMC9hdC84OHgzMS5wbmdcIiAvPlxuICA8L2E+XG48L3A+XG5cbjxwPlxuICA8aT5UaGFuayB5b3UsIDxhIGhyZWY9Jy8vcDNrLm9yZy8nPnAzayBvcmdhbmlzYXRpb248L2E+ITwvaT5cbjwvcD5cblxuPHN0eWxlPlxuICBoMyB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgaDMgKyBwLCBzdW1tYXJ5ICsgKiB7XG4gICAgbWFyZ2luLXRvcDogMDtcbiAgfVxuXG4gIHN1bW1hcnkge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICBsaSArIGxpIHtcbiAgICBtYXJnaW4tdG9wOiAwLjVlbTtcbiAgfVxuXG4gIHNtYWxsIHtcbiAgICBjb2xvcjogIzk5OTtcbiAgfVxuXG4gIC53YXJuaW5nIHtcbiAgICBib3JkZXItY29sb3I6ICNlNDQ7XG4gICAgYmFja2dyb3VuZDogI2ZkZDtcbiAgfVxuXG4gIC5ncmVhdCB7XG4gICAgYm9yZGVyLWNvbG9yOiAjMmQyO1xuICAgIGJhY2tncm91bmQ6ICNkZmQ7XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCBDaGFuZ2VzIGZyb20gJy4vQ2hhbmdlcy5odG1sJztcbiAgaW1wb3J0IEZsYXR0ciBmcm9tICcuL0ZsYXR0ci5odG1sJztcblxuICBleHBvcnQgZGVmYXVsdCB7XG4gICAgb25jcmVhdGUoKSB7XG4gICAgICB0aGlzLnN0b3JlLm9ic2VydmUoJ2FwcERlc2NyaXB0aW9uJywgZGVzY3JpcHRpb24gPT4ge1xuICAgICAgICBkb2N1bWVudC50aXRsZSA9IGRlc2NyaXB0aW9uO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgIENoYW5nZXMsXG4gICAgICBGbGF0dHJcbiAgICB9LFxuXG4gICAgbWV0aG9kczoge1xuICAgICAgZ290byhldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN0b3JlLnNldCh7IHVybDogZXZlbnQudGFyZ2V0LmhyZWYgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG48L3NjcmlwdD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE0RUUsRUFBRSxtQkFBQyxDQUFDLEFBQ0YsT0FBTyxDQUFFLFlBQVksQUFDdkIsQ0FBQyxBQUVELEVBQUUsQ0FBRyxvQkFBQyxDQUFFLE9BQU8sQ0FBRyxtQkFBRSxDQUFDLEFBQ25CLFVBQVUsQ0FBRSxDQUFDLEFBQ2YsQ0FBQyxBQUVELE9BQU8sbUJBQUMsQ0FBQyxBQUNQLE9BQU8sQ0FBRSxJQUFJLEFBQ2YsQ0FBQyxBQUVELEVBQUUsQ0FBRyxFQUFFLG1CQUFDLENBQUMsQUFDUCxVQUFVLENBQUUsS0FBSyxBQUNuQixDQUFDLEFBRUQsS0FBSyxtQkFBQyxDQUFDLEFBQ0wsS0FBSyxDQUFFLElBQUksQUFDYixDQUFDLEFBRUQsUUFBUSxtQkFBQyxDQUFDLEFBQ1IsWUFBWSxDQUFFLElBQUksQ0FDbEIsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$1(state, component) {
	var div, text_3, h2, text_4, text_5, text_6, text_7, p, text_14, p_1, text_15, a_3, text_17, a_4, text_19, a_5, text_21, a_6, text_23, a_7, text_25, a_8, text_27, i_1, text_32, p_2, text_38, p_3, text_40, p_4, text_44, p_5, text_47, p_6, text_49, text_50, details, text_58, h3_1, text_60, p_7, text_62, p_8, text_66, h3_2, text_68, p_9, text_75, p_10, text_79, p_11, text_82, p_12;

	function click_handler(event) {
		component.goto(event);
	}

	function click_handler_1(event) {
		component.goto(event);
	}

	function click_handler_2(event) {
		component.goto(event);
	}

	function click_handler_3(event) {
		component.goto(event);
	}

	function click_handler_4(event) {
		component.goto(event);
	}

	var flattr = new Flattr({
		root: component.root
	});

	var changes = new Changes({
		root: component.root
	});

	return {
		c: function create() {
			div = createElement("div");
			div.innerHTML = "<small svelte-3919915778><i svelte-3919915778>“JavaScript RSS Viewer puts little or long customizable RSS boxes anywhere you put HTML; build your own slashbox hell or heaven, it’s feedarific!” — <a svelte-3919915778 href=\"http://ourpla.net/cgi/pikie\">Abbe Normal</a></i></small>";
			text_3 = createText("\n\n");
			h2 = createElement("h2");
			text_4 = createText(state.$appDescription);
			text_5 = createText(" ");
			text_6 = createText(state.$appVersion);
			text_7 = createText("\n\n");
			p = createElement("p");
			p.innerHTML = "<strong svelte-3919915778>Reduced availability due to temporary violation of quota limit.</strong> You should <a svelte-3919915778 href=\"//github.com/p3k/json3k\">install your own JSONP proxy</a>. You can always support the project with your <a svelte-3919915778 href=\"http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer\">donation</a>.";
			text_14 = createText("\n\n");
			p_1 = createElement("p");
			text_15 = createText("This viewer can display ");
			a_3 = createElement("a");
			a_3.textContent = "RSS";
			text_17 = createText(" feeds of version ");
			a_4 = createElement("a");
			a_4.textContent = "0.91";
			text_19 = createText(", ");
			a_5 = createElement("a");
			a_5.textContent = "0.92";
			text_21 = createText(", ");
			a_6 = createElement("a");
			a_6.textContent = "1.0";
			text_23 = createText(" and ");
			a_7 = createElement("a");
			a_7.textContent = "2.0";
			text_25 = createText(" as well as even the good old legacy format ");
			a_8 = createElement("a");
			a_8.textContent = "Scripting News 2";
			text_27 = createText(". ");
			i_1 = createElement("i");
			i_1.innerHTML = "(Sorry, no <a svelte-3919915778 href=\"http://en.wikipedia.org/wiki/Atom_%28standard%29\">Atom</a>.)";
			text_32 = createText("\n\n");
			p_2 = createElement("p");
			p_2.innerHTML = "It provides a simple way to embed such RSS boxes in any <a svelte-3919915778 href=\"http://validator.w3.org/\">valid HTML document</a> via an automagically generated JavaScript tag — <i svelte-3919915778>for free!</i>";
			text_38 = createText("\n\n");
			p_3 = createElement("p");
			p_3.textContent = "Just enter the URL of any compatible RSS feed, modify the layout settings as you like and push the Reload button. When finished, copy the HTML code into your own web page – and voilà!";
			text_40 = createText("\n\n");
			p_4 = createElement("p");
			p_4.innerHTML = "The code behind this is written in JavaScript and runs completely in your browser*. You can get the source code together with all the other necessary files from the <a svelte-3919915778 href=\"//github.com/p3k/rss-box\">Github repository</a>.";
			text_44 = createText("\n\n");
			p_5 = createElement("p");
			p_5.innerHTML = "<small svelte-3919915778>* A proxy server is needed for cross-origin requests.</small>";
			text_47 = createText("\n\n");
			p_6 = createElement("p");
			flattr._fragment.c();
			text_49 = createText("\n\n");
			changes._fragment.c();
			text_50 = createText("\n\n");
			details = createElement("details");
			details.innerHTML = "<summary svelte-3919915778><h3 svelte-3919915778>Known Limitations</h3></summary>\n  <ul svelte-3919915778><li svelte-3919915778>No support for PICS rating</li>\n    <li svelte-3919915778>No multiple enclosures (RSS 0.93)</li>\n    <li svelte-3919915778>No Atom support</li>\n  </ul>";
			text_58 = createText("\n\n");
			h3_1 = createElement("h3");
			h3_1.textContent = "Future Development";
			text_60 = createText("\n\n");
			p_7 = createElement("p");
			p_7.textContent = "I have ceased actively developing this viewer but sometimes I get enthusiastic and fiddle around with the code. Of course it will be available here as is.";
			text_62 = createText("\n");
			p_8 = createElement("p");
			p_8.innerHTML = "For questions and comments feel free to contact me (Tobi) via e-mail: <a svelte-3919915778 href=\"mailto:mail+rss@p3k.org\">mail+rss@p3k.org</a>.";
			text_66 = createText("\n\n");
			h3_2 = createElement("h3");
			h3_2.textContent = "License";
			text_68 = createText("\n\n");
			p_9 = createElement("p");
			p_9.innerHTML = "<span svelte-3919915778 xmlns:dct=\"http://purl.org/dc/terms/\" property=\"dct:title\">JavaScript RSS Box Viewer</span> by\n  <a svelte-3919915778 xmlns:cc=\"http://creativecommons.org/ns#\" href=\"http://p3k.org/rss\" property=\"cc:attributionName\" rel=\"cc:attributionURL\">Tobi Schäfer</a> is licensed under a <a svelte-3919915778 rel=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US\">Creative Commons Attribution-ShareAlike 3.0 Austria License</a>.";
			text_75 = createText("\n");
			p_10 = createElement("p");
			p_10.innerHTML = "Based on a work at <a svelte-3919915778 xmlns:dct=\"http://purl.org/dc/terms/\" href=\"https://p3k.org/source/svn/rss-box/trunk/\" rel=\"dct:source\">https://p3k.org/source/svn/rss-box/trunk/</a>.";
			text_79 = createText("\n");
			p_11 = createElement("p");
			p_11.innerHTML = "<a svelte-3919915778 rel=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US\"><img svelte-3919915778 alt=\"Creative Commons License\" style=\"border-width:0\" src=\"//i.creativecommons.org/l/by-sa/3.0/at/88x31.png\"></a>";
			text_82 = createText("\n\n");
			p_12 = createElement("p");
			p_12.innerHTML = "<i svelte-3919915778>Thank you, <a svelte-3919915778 href=\"//p3k.org/\">p3k organisation</a>!</i>";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$1(div);
			encapsulateStyles$1(h2);
			encapsulateStyles$1(p);
			p.className = "msg warning";
			encapsulateStyles$1(p_1);
			encapsulateStyles$1(a_3);
			a_3.href = "http://en.wikipedia.org/wiki/RSS";
			encapsulateStyles$1(a_4);
			a_4.href = "http://cyber.law.harvard.edu/rss/examples/sampleRss091.xml";
			addListener(a_4, "click", click_handler);
			encapsulateStyles$1(a_5);
			a_5.href = "http://cyber.law.harvard.edu/rss/examples/sampleRss092.xml";
			addListener(a_5, "click", click_handler_1);
			encapsulateStyles$1(a_6);
			a_6.href = "http://rss.orf.at/fm4.xml";
			addListener(a_6, "click", click_handler_2);
			encapsulateStyles$1(a_7);
			a_7.href = "http://blog.p3k.org/stories.xml";
			addListener(a_7, "click", click_handler_3);
			encapsulateStyles$1(a_8);
			a_8.href = "http://essaysfromexodus.scripting.com/xml/scriptingNews2.xml";
			addListener(a_8, "click", click_handler_4);
			encapsulateStyles$1(i_1);
			encapsulateStyles$1(p_2);
			encapsulateStyles$1(p_3);
			encapsulateStyles$1(p_4);
			encapsulateStyles$1(p_5);
			encapsulateStyles$1(p_6);
			encapsulateStyles$1(details);
			encapsulateStyles$1(h3_1);
			encapsulateStyles$1(p_7);
			encapsulateStyles$1(p_8);
			encapsulateStyles$1(h3_2);
			encapsulateStyles$1(p_9);
			encapsulateStyles$1(p_10);
			encapsulateStyles$1(p_11);
			encapsulateStyles$1(p_12);
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			insertNode(text_3, target, anchor);
			insertNode(h2, target, anchor);
			appendNode(text_4, h2);
			appendNode(text_5, h2);
			appendNode(text_6, h2);
			insertNode(text_7, target, anchor);
			insertNode(p, target, anchor);
			insertNode(text_14, target, anchor);
			insertNode(p_1, target, anchor);
			appendNode(text_15, p_1);
			appendNode(a_3, p_1);
			appendNode(text_17, p_1);
			appendNode(a_4, p_1);
			appendNode(text_19, p_1);
			appendNode(a_5, p_1);
			appendNode(text_21, p_1);
			appendNode(a_6, p_1);
			appendNode(text_23, p_1);
			appendNode(a_7, p_1);
			appendNode(text_25, p_1);
			appendNode(a_8, p_1);
			appendNode(text_27, p_1);
			appendNode(i_1, p_1);
			insertNode(text_32, target, anchor);
			insertNode(p_2, target, anchor);
			insertNode(text_38, target, anchor);
			insertNode(p_3, target, anchor);
			insertNode(text_40, target, anchor);
			insertNode(p_4, target, anchor);
			insertNode(text_44, target, anchor);
			insertNode(p_5, target, anchor);
			insertNode(text_47, target, anchor);
			insertNode(p_6, target, anchor);
			flattr._mount(p_6, null);
			insertNode(text_49, target, anchor);
			changes._mount(target, anchor);
			insertNode(text_50, target, anchor);
			insertNode(details, target, anchor);
			insertNode(text_58, target, anchor);
			insertNode(h3_1, target, anchor);
			insertNode(text_60, target, anchor);
			insertNode(p_7, target, anchor);
			insertNode(text_62, target, anchor);
			insertNode(p_8, target, anchor);
			insertNode(text_66, target, anchor);
			insertNode(h3_2, target, anchor);
			insertNode(text_68, target, anchor);
			insertNode(p_9, target, anchor);
			insertNode(text_75, target, anchor);
			insertNode(p_10, target, anchor);
			insertNode(text_79, target, anchor);
			insertNode(p_11, target, anchor);
			insertNode(text_82, target, anchor);
			insertNode(p_12, target, anchor);
		},

		p: function update(changed, state) {
			if (changed.$appDescription) {
				text_4.data = state.$appDescription;
			}

			if (changed.$appVersion) {
				text_6.data = state.$appVersion;
			}
		},

		u: function unmount() {
			detachNode(div);
			detachNode(text_3);
			detachNode(h2);
			detachNode(text_7);
			detachNode(p);
			detachNode(text_14);
			detachNode(p_1);
			detachNode(text_32);
			detachNode(p_2);
			detachNode(text_38);
			detachNode(p_3);
			detachNode(text_40);
			detachNode(p_4);
			detachNode(text_44);
			detachNode(p_5);
			detachNode(text_47);
			detachNode(p_6);
			detachNode(text_49);
			changes._unmount();
			detachNode(text_50);
			detachNode(details);
			detachNode(text_58);
			detachNode(h3_1);
			detachNode(text_60);
			detachNode(p_7);
			detachNode(text_62);
			detachNode(p_8);
			detachNode(text_66);
			detachNode(h3_2);
			detachNode(text_68);
			detachNode(p_9);
			detachNode(text_75);
			detachNode(p_10);
			detachNode(text_79);
			detachNode(p_11);
			detachNode(text_82);
			detachNode(p_12);
		},

		d: function destroy$$1() {
			removeListener(a_4, "click", click_handler);
			removeListener(a_5, "click", click_handler_1);
			removeListener(a_6, "click", click_handler_2);
			removeListener(a_7, "click", click_handler_3);
			removeListener(a_8, "click", click_handler_4);
			flattr.destroy(false);
			changes.destroy(false);
		}
	};
}

function About(options) {
	this._debugName = '<About>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(this.store._init(["appDescription","appVersion"]), options.data);
	this.store._add(this, ["appDescription","appVersion"]);
	if (!('$appDescription' in this._state)) console.warn("<About> was created without expected data property '$appDescription'");
	if (!('$appVersion' in this._state)) console.warn("<About> was created without expected data property '$appVersion'");

	this._handlers.destroy = [removeFromStore];

	if (!document.getElementById("svelte-3919915778-style")) add_css$1();

	var _oncreate = oncreate.bind(this);

	if (!options.root) {
		this._oncreate = [_oncreate];
		this._beforecreate = [];
		this._aftercreate = [];
	} else {
	 	this.root._oncreate.push(_oncreate);
	 }

	this._fragment = create_main_fragment$1(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);

		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign(About.prototype, methods, protoDev);

About.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/Ad.html generated by Svelte v1.50.0 */
window.google_ad_client = 'pub-3965028043153138';
/* p3k.org, 468x60 */
window.google_ad_slot = '0254765893';
window.google_ad_width = 468;
window.google_ad_height = 60;

let script = document.createElement('script');
script.src = '//pagead2.googlesyndication.com/pagead/show_ads.js';
document.head.appendChild(script);

function create_main_fragment$4(state, component) {

	return {
		c: noop,

		m: noop,

		p: noop,

		u: noop,

		d: noop
	};
}

function Ad(options) {
	this._debugName = '<Ad>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	this._fragment = create_main_fragment$4(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(Ad.prototype, protoDev);

Ad.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/Box.html generated by Svelte v1.50.0 */
function height($height) {
	return $height > -1 ? $height + 'px' : '100%';
}

function oncreate$1() {
  const staticId = 'rssbox-static-stylesheet';
  const dynamicId = 'rssbox-dynamic-stylesheet';

  let staticCss = window[staticId];
  let dynamicCss = window[dynamicId];

  if (!staticCss) {
    staticCss = document.createElement('link');
    staticCss.id = staticId;
    staticCss.rel = 'stylesheet';
    staticCss.href = URLS$$1.base + '/box.css';
    document.head.append(staticCss);
  }

  if (!dynamicCss) {
    dynamicCss = document.createElement('style');
    dynamicCss.id = dynamicId;
    document.head.append(dynamicCss);
  }

  this.store.observe('compact', compact => {
    this.store.set({ fontWeight: compact ?  'initial' : 'bold' });
  });

  this.store.observe('linkColor', color => {
    if (!color) return;

    let rule =
      `.rssbox[data-link-color="${color}"] .rssbox-item-content a {
        color: ${color};
      }`;

    if (dynamicCss.innerHTML.indexOf(rule) < 0) dynamicCss.innerHTML += rule;
  });
}

function encapsulateStyles$3(node) {
	setAttribute(node, "svelte-3159601204", "");
}

function add_css$3() {
	var style = createElement("style");
	style.id = 'svelte-3159601204-style';
	style.textContent = ".rssbox[svelte-3159601204]{width:200px;border:1px solid #000;font:sans-serif;float:left;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon[svelte-3159601204],.rssbox-image[svelte-3159601204]{display:inline-block;float:right;margin:5px 0 5px 5px;background-position:left center;background-repeat:no-repeat}.rssbox-icon[svelte-3159601204]{height:16px;width:16px;margin:1px 4px;background-image:url(img/rss.png);background-size:16px 16px}.rssbox-titlebar[svelte-3159601204]{padding:5px 3px 5px 10px;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold}.rssbox-content[svelte-3159601204]{height:auto;padding:5px 10px;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both}.rssbox-date[svelte-3159601204]{margin-top:1px;font-size:80%}.rssbox-promo[svelte-3159601204]{margin:0 -5px -1px 0;text-align:right;font-size:7pt;letter-spacing:0.5px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94Lmh0bWwiLCJzb3VyY2VzIjpbIkJveC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxkaXYgZGF0YS1saW5rLWNvbG9yPSd7eyAkbGlua0NvbG9yIH19JyBjbGFzcz0ncnNzYm94IHJzc0JveCcgc3R5bGU9J3dpZHRoOiB7eyAkd2lkdGggfX1weDtcbiAgICBib3JkZXItY29sb3I6IHt7ICRmcmFtZUNvbG9yIH19O1xuICAgIGJvcmRlci1yYWRpdXM6IHt7ICRyYWRpdXMgfX1weDtcbiAgICBmb250OiB7eyAkZm9udEZhY2UgfX07Jz5cbiAge3sgI2lmICEkaGVhZGxlc3MgfX1cbiAgICA8ZGl2IGNsYXNzPSdyc3Nib3gtdGl0bGViYXInIHN0eWxlPSdjb2xvcjoge3sgJHRpdGxlQmFyVGV4dENvbG9yIH19O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB7eyAkdGl0bGVCYXJDb2xvciB9fTtcbiAgICAgICAgYm9yZGVyLWJvdHRvbS1jb2xvcjoge3sgJGZyYW1lQ29sb3IgfX07Jz5cbiAgICAgIHt7ICNpZiAkc2hvd1htbEJ1dHRvbiB9fVxuICAgICAgICA8ZGl2IHN0eWxlPSdmbG9hdDogcmlnaHQ7Jz5cbiAgICAgICAgICA8YSBocmVmPSd7eyAkdXJsIH19Jz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSdyc3Nib3gtaWNvbicgdGl0bGU9J3t7ICRmb3JtYXQgfX0ge3sgJHZlcnNpb24gfX0nPjwvc3Bhbj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgIDwvZGl2PlxuICAgICAge3sgL2lmIH19XG4gICAgICA8ZGl2PlxuICAgICAgICA8YSBocmVmPSd7eyAkbGluayB9fScgc3R5bGU9J2NvbG9yOiB7eyAkdGl0bGVCYXJUZXh0Q29sb3IgfX07Jz5cbiAgICAgICAgICB7eyAkdGl0bGUgfX1cbiAgICAgICAgPC9hPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPSdyc3Nib3gtZGF0ZSc+XG4gICAgICAgIHt7ICRmb3JtYXR0ZWREYXRlIH19XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAge3sgL2lmIH19XG4gIDxkaXYgY2xhc3M9J3Jzc2JveC1jb250ZW50IHJzc0JveENvbnRlbnQnIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiB7eyAkYm94RmlsbENvbG9yIH19O1xuICAgICAgaGVpZ2h0OiB7eyBoZWlnaHQgfX07Jz5cbiAgICB7eyAjaWYgJGltYWdlIH19XG4gICAgICA8YSBocmVmPSd7eyAkaW1hZ2UubGluayB9fScgdGl0bGU9J3t7ICRpbWFnZS50aXRsZSB9fSc+XG4gICAgICAgIDxzcGFuIGFsdD0ne3sgJGltYWdlLmRlc2NyaXB0aW9uIH19JyBjbGFzcz0ncnNzYm94LWltYWdlJ1xuICAgICAgICAgICAgc3R5bGU9J2JhY2tncm91bmQtaW1hZ2U6IHVybCh7eyAkaW1hZ2Uuc291cmNlIH19KTtcbiAgICAgICAgICAgIHdpZHRoOiB7eyAkaW1hZ2Uud2lkdGggfX1weDtcbiAgICAgICAgICAgIGhlaWdodDoge3sgJGltYWdlLmhlaWdodCB9fXB4Oyc+PC9zcGFuPlxuICAgICAgPC9hPlxuICAgIHt7IC9pZiB9fVxuICAgIHt7ICNlYWNoICRpdGVtcyBhcyBpdGVtLCBpbmRleCB9fVxuICAgICAge3sgI2lmIGluZGV4IDwgJG1heEl0ZW1zIH19XG4gICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLWNvbnRlbnQgcnNzQm94SXRlbUNvbnRlbnQnIHN0eWxlPSdjb2xvcjoge3sgJHRleHRDb2xvciB9fSc+XG4gICAgICAgICAgPGRpdiBzdHlsZT0nZm9udC13ZWlnaHQ6IHt7ICRmb250V2VpZ2h0IH19Oyc+XG4gICAgICAgICAgICA8YSBocmVmPSd7eyBpdGVtLmxpbmsgfX0nIHN0eWxlPSdjb2xvcjoge3sgJHRleHRDb2xvciB9fSc+XG4gICAgICAgICAgICAgIHt7IGl0ZW0udGl0bGUgfX1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7eyAjaWYgISRjb21wYWN0IH19XG4gICAgICAgICAgICB7e3sgaXRlbS5kZXNjcmlwdGlvbiB9fX1cbiAgICAgICAgICAgIHt7IGl0ZW0uYnV0dG9ucyB9fVxuICAgICAgICAgIHt7IC9pZiB9fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIHt7IC9pZiB9fVxuICAgIHt7IC9lYWNoIH19XG4gICAge3sgI2lmICRpbnB1dCB9fVxuICAgICAgVE9ET1xuICAgIHt7IC9pZiB9fVxuICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1wcm9tbyByc3NCb3hQcm9tbyc+XG4gICAgICA8YSBocmVmPSdodHRwOi8vcDNrLm9yZy9yc3MnPlJTUyBCb3ggYnkgcDNrLm9yZzwvYT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlPlxuICAucnNzYm94IHtcbiAgICB3aWR0aDogMjAwcHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgIzAwMDtcbiAgICBmb250OiBzYW5zLXNlcmlmO1xuICAgIGZsb2F0OiBsZWZ0O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDA7XG4gIH1cblxuICAucnNzYm94LWljb24sIC5yc3Nib3gtaW1hZ2Uge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICBmbG9hdDogcmlnaHQ7XG4gICAgbWFyZ2luOiA1cHggMCA1cHggNXB4O1xuICAgIGJhY2tncm91bmQtcG9zaXRpb246IGxlZnQgY2VudGVyO1xuICAgIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XG4gIH1cblxuICAucnNzYm94LWljb24ge1xuICAgIGhlaWdodDogMTZweDtcbiAgICB3aWR0aDogMTZweDtcbiAgICBtYXJnaW46IDFweCA0cHg7XG4gICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKGltZy9yc3MucG5nKTtcbiAgICBiYWNrZ3JvdW5kLXNpemU6IDE2cHggMTZweDtcbiAgfVxuXG4gIC5yc3Nib3gtdGl0bGViYXIge1xuICAgIHBhZGRpbmc6IDVweCAzcHggNXB4IDEwcHg7XG4gICAgY29sb3I6ICMwMDA7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2FkZDhlNjtcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzAwMDtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxuXG4gIC5yc3Nib3gtY29udGVudCB7XG4gICAgaGVpZ2h0OiBhdXRvO1xuICAgIHBhZGRpbmc6IDVweCAxMHB4O1xuICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gICAgY2xlYXI6IGJvdGg7XG4gIH1cblxuICAucnNzYm94LWl0ZW0gZm9ybSB7XG4gICAgbWFyZ2luLWJvdHRvbTogMC44ZW07XG4gIH1cblxuICAucnNzYm94LWRhdGUge1xuICAgIG1hcmdpbi10b3A6IDFweDtcbiAgICBmb250LXNpemU6IDgwJTtcbiAgfVxuXG4gIC5yc3Nib3gtcHJvbW8ge1xuICAgIG1hcmdpbjogMCAtNXB4IC0xcHggMDtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICBmb250LXNpemU6IDdwdDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC41cHg7XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7IFVSTFMgfSBmcm9tICcuLi9zcmMvc2V0dGluZ3MnO1xuXG4gIGV4cG9ydCBkZWZhdWx0IHtcbiAgICBvbmNyZWF0ZSgpIHtcbiAgICAgIGNvbnN0IHN0YXRpY0lkID0gJ3Jzc2JveC1zdGF0aWMtc3R5bGVzaGVldCc7XG4gICAgICBjb25zdCBkeW5hbWljSWQgPSAncnNzYm94LWR5bmFtaWMtc3R5bGVzaGVldCc7XG5cbiAgICAgIGxldCBzdGF0aWNDc3MgPSB3aW5kb3dbc3RhdGljSWRdO1xuICAgICAgbGV0IGR5bmFtaWNDc3MgPSB3aW5kb3dbZHluYW1pY0lkXTtcblxuICAgICAgaWYgKCFzdGF0aWNDc3MpIHtcbiAgICAgICAgc3RhdGljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgICAgICBzdGF0aWNDc3MuaWQgPSBzdGF0aWNJZDtcbiAgICAgICAgc3RhdGljQ3NzLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICAgICAgc3RhdGljQ3NzLmhyZWYgPSBVUkxTLmJhc2UgKyAnL2JveC5jc3MnO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZChzdGF0aWNDc3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWR5bmFtaWNDc3MpIHtcbiAgICAgICAgZHluYW1pY0NzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIGR5bmFtaWNDc3MuaWQgPSBkeW5hbWljSWQ7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kKGR5bmFtaWNDc3MpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0b3JlLm9ic2VydmUoJ2NvbXBhY3QnLCBjb21wYWN0ID0+IHtcbiAgICAgICAgdGhpcy5zdG9yZS5zZXQoeyBmb250V2VpZ2h0OiBjb21wYWN0ID8gICdpbml0aWFsJyA6ICdib2xkJyB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnN0b3JlLm9ic2VydmUoJ2xpbmtDb2xvcicsIGNvbG9yID0+IHtcbiAgICAgICAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gICAgICAgIGxldCBydWxlID1cbiAgICAgICAgICBgLnJzc2JveFtkYXRhLWxpbmstY29sb3I9XCIke2NvbG9yfVwiXSAucnNzYm94LWl0ZW0tY29udGVudCBhIHtcbiAgICAgICAgICAgIGNvbG9yOiAke2NvbG9yfTtcbiAgICAgICAgICB9YDtcblxuICAgICAgICBpZiAoZHluYW1pY0Nzcy5pbm5lckhUTUwuaW5kZXhPZihydWxlKSA8IDApIGR5bmFtaWNDc3MuaW5uZXJIVE1MICs9IHJ1bGU7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgIGhlaWdodDogJGhlaWdodCA9PiAkaGVpZ2h0ID4gLTEgPyAkaGVpZ2h0ICsgJ3B4JyA6ICcxMDAlJ1xuICAgIH1cbiAgfTtcbjwvc2NyaXB0PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTRERSxPQUFPLG1CQUFDLENBQUMsQUFDUCxLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsSUFBSSxDQUFFLFVBQVUsQ0FDaEIsS0FBSyxDQUFFLElBQUksQ0FDWCxRQUFRLENBQUUsTUFBTSxDQUNoQixhQUFhLENBQUUsQ0FBQyxDQUNoQixrQkFBa0IsQ0FBRSxDQUFDLEFBQ3ZCLENBQUMsQUFFRCwrQkFBWSxDQUFFLGFBQWEsbUJBQUMsQ0FBQyxBQUMzQixPQUFPLENBQUUsWUFBWSxDQUNyQixLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3JCLG1CQUFtQixDQUFFLElBQUksQ0FBQyxNQUFNLENBQ2hDLGlCQUFpQixDQUFFLFNBQVMsQUFDOUIsQ0FBQyxBQUVELFlBQVksbUJBQUMsQ0FBQyxBQUNaLE1BQU0sQ0FBRSxJQUFJLENBQ1osS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FDZixnQkFBZ0IsQ0FBRSxJQUFJLFdBQVcsQ0FBQyxDQUNsQyxlQUFlLENBQUUsSUFBSSxDQUFDLElBQUksQUFDNUIsQ0FBQyxBQUVELGdCQUFnQixtQkFBQyxDQUFDLEFBQ2hCLE9BQU8sQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ3pCLEtBQUssQ0FBRSxJQUFJLENBQ1gsZ0JBQWdCLENBQUUsT0FBTyxDQUN6QixhQUFhLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQzdCLFdBQVcsQ0FBRSxJQUFJLEFBQ25CLENBQUMsQUFFRCxlQUFlLG1CQUFDLENBQUMsQUFDZixNQUFNLENBQUUsSUFBSSxDQUNaLE9BQU8sQ0FBRSxHQUFHLENBQUMsSUFBSSxDQUNqQixVQUFVLENBQUUsTUFBTSxDQUNsQixVQUFVLENBQUUsSUFBSSxDQUNoQixnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyxBQU1ELFlBQVksbUJBQUMsQ0FBQyxBQUNaLFVBQVUsQ0FBRSxHQUFHLENBQ2YsU0FBUyxDQUFFLEdBQUcsQUFDaEIsQ0FBQyxBQUVELGFBQWEsbUJBQUMsQ0FBQyxBQUNiLE1BQU0sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3JCLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxHQUFHLENBQ2QsY0FBYyxDQUFFLEtBQUssQUFDdkIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$5(state, component) {
	var div, text, div_1, text_1, text_2, text_3, div_2;

	var if_block = (!state.$headless) && create_if_block(state, component);

	var if_block_1 = (state.$image) && create_if_block_2(state, component);

	var $items = state.$items;

	var each_blocks = [];

	for (var i = 0; i < $items.length; i += 1) {
		each_blocks[i] = create_each_block(state, $items, $items[i], i, component);
	}

	var if_block_2 = (state.$input) && create_if_block_5(state, component);

	return {
		c: function create() {
			div = createElement("div");
			if (if_block) if_block.c();
			text = createText("\n  ");
			div_1 = createElement("div");
			if (if_block_1) if_block_1.c();
			text_1 = createText("\n    ");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			text_2 = createText("\n    ");
			if (if_block_2) if_block_2.c();
			text_3 = createText("\n    ");
			div_2 = createElement("div");
			div_2.innerHTML = "<a href=\"http://p3k.org/rss\">RSS Box by p3k.org</a>";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			encapsulateStyles$3(div_1);
			encapsulateStyles$3(div_2);
			div_2.className = "rssbox-promo rssBoxPromo";
			div_1.className = "rssbox-content rssBoxContent";
			setStyle(div_1, "background-color", state.$boxFillColor);
			setStyle(div_1, "height", state.height);
			div.dataset.linkColor = state.$linkColor;
			div.className = "rssbox rssBox";
			setStyle(div, "width", "" + state.$width + "px");
			setStyle(div, "border-color", state.$frameColor);
			setStyle(div, "border-radius", "" + state.$radius + "px");
			setStyle(div, "font", state.$fontFace);
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			if (if_block) if_block.m(div, null);
			appendNode(text, div);
			appendNode(div_1, div);
			if (if_block_1) if_block_1.m(div_1, null);
			appendNode(text_1, div_1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div_1, null);
			}

			appendNode(text_2, div_1);
			if (if_block_2) if_block_2.m(div_1, null);
			appendNode(text_3, div_1);
			appendNode(div_2, div_1);
		},

		p: function update(changed, state) {
			if (!state.$headless) {
				if (if_block) {
					if_block.p(changed, state);
				} else {
					if_block = create_if_block(state, component);
					if_block.c();
					if_block.m(div, text);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}

			if (state.$image) {
				if (if_block_1) {
					if_block_1.p(changed, state);
				} else {
					if_block_1 = create_if_block_2(state, component);
					if_block_1.c();
					if_block_1.m(div_1, text_1);
				}
			} else if (if_block_1) {
				if_block_1.u();
				if_block_1.d();
				if_block_1 = null;
			}

			var $items = state.$items;

			if (changed.$maxItems || changed.$textColor || changed.$fontWeight || changed.$items || changed.$compact) {
				for (var i = 0; i < $items.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].p(changed, state, $items, $items[i], i);
					} else {
						each_blocks[i] = create_each_block(state, $items, $items[i], i, component);
						each_blocks[i].c();
						each_blocks[i].m(div_1, text_2);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].u();
					each_blocks[i].d();
				}
				each_blocks.length = $items.length;
			}

			if (state.$input) {
				if (!if_block_2) {
					if_block_2 = create_if_block_5(state, component);
					if_block_2.c();
					if_block_2.m(div_1, text_3);
				}
			} else if (if_block_2) {
				if_block_2.u();
				if_block_2.d();
				if_block_2 = null;
			}

			if (changed.$boxFillColor) {
				setStyle(div_1, "background-color", state.$boxFillColor);
			}

			if (changed.height) {
				setStyle(div_1, "height", state.height);
			}

			if (changed.$linkColor) {
				div.dataset.linkColor = state.$linkColor;
			}

			if (changed.$width) {
				setStyle(div, "width", "" + state.$width + "px");
			}

			if (changed.$frameColor) {
				setStyle(div, "border-color", state.$frameColor);
			}

			if (changed.$radius) {
				setStyle(div, "border-radius", "" + state.$radius + "px");
			}

			if (changed.$fontFace) {
				setStyle(div, "font", state.$fontFace);
			}
		},

		u: function unmount() {
			detachNode(div);
			if (if_block) if_block.u();
			if (if_block_1) if_block_1.u();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].u();
			}

			if (if_block_2) if_block_2.u();
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
			if (if_block_1) if_block_1.d();

			destroyEach(each_blocks);

			if (if_block_2) if_block_2.d();
		}
	};
}

// (9:6) {{ #if $showXmlButton }}
function create_if_block_1(state, component) {
	var div, a, span, span_title_value;

	return {
		c: function create() {
			div = createElement("div");
			a = createElement("a");
			span = createElement("span");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(span);
			span.className = "rssbox-icon";
			span.title = span_title_value = "" + state.$format + " " + state.$version;
			a.href = state.$url;
			setStyle(div, "float", "right");
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(a, div);
			appendNode(span, a);
		},

		p: function update(changed, state) {
			if ((changed.$format || changed.$version) && span_title_value !== (span_title_value = "" + state.$format + " " + state.$version)) {
				span.title = span_title_value;
			}

			if (changed.$url) {
				a.href = state.$url;
			}
		},

		u: function unmount() {
			detachNode(div);
		},

		d: noop
	};
}

// (5:2) {{ #if !$headless }}
function create_if_block(state, component) {
	var div, text, div_1, a, text_1, text_4, div_2, text_5;

	var if_block = (state.$showXmlButton) && create_if_block_1(state, component);

	return {
		c: function create() {
			div = createElement("div");
			if (if_block) if_block.c();
			text = createText("\n      ");
			div_1 = createElement("div");
			a = createElement("a");
			text_1 = createText(state.$title);
			text_4 = createText("\n      ");
			div_2 = createElement("div");
			text_5 = createText(state.$formattedDate);
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			a.href = state.$link;
			setStyle(a, "color", state.$titleBarTextColor);
			encapsulateStyles$3(div_2);
			div_2.className = "rssbox-date";
			div.className = "rssbox-titlebar";
			setStyle(div, "color", state.$titleBarTextColor);
			setStyle(div, "background-color", state.$titleBarColor);
			setStyle(div, "border-bottom-color", state.$frameColor);
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			if (if_block) if_block.m(div, null);
			appendNode(text, div);
			appendNode(div_1, div);
			appendNode(a, div_1);
			appendNode(text_1, a);
			appendNode(text_4, div);
			appendNode(div_2, div);
			appendNode(text_5, div_2);
		},

		p: function update(changed, state) {
			if (state.$showXmlButton) {
				if (if_block) {
					if_block.p(changed, state);
				} else {
					if_block = create_if_block_1(state, component);
					if_block.c();
					if_block.m(div, text);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}

			if (changed.$title) {
				text_1.data = state.$title;
			}

			if (changed.$link) {
				a.href = state.$link;
			}

			if (changed.$titleBarTextColor) {
				setStyle(a, "color", state.$titleBarTextColor);
			}

			if (changed.$formattedDate) {
				text_5.data = state.$formattedDate;
			}

			if (changed.$titleBarTextColor) {
				setStyle(div, "color", state.$titleBarTextColor);
			}

			if (changed.$titleBarColor) {
				setStyle(div, "background-color", state.$titleBarColor);
			}

			if (changed.$frameColor) {
				setStyle(div, "border-bottom-color", state.$frameColor);
			}
		},

		u: function unmount() {
			detachNode(div);
			if (if_block) if_block.u();
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
		}
	};
}

// (28:4) {{ #if $image }}
function create_if_block_2(state, component) {
	var a, span, span_alt_value, a_href_value, a_title_value;

	return {
		c: function create() {
			a = createElement("a");
			span = createElement("span");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(span);
			setAttribute(span, "alt", span_alt_value = state.$image.description);
			span.className = "rssbox-image";
			setStyle(span, "background-image", "url(" + state.$image.source + ")");
			setStyle(span, "width", "" + state.$image.width + "px");
			setStyle(span, "height", "" + state.$image.height + "px");
			a.href = a_href_value = state.$image.link;
			a.title = a_title_value = state.$image.title;
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
			appendNode(span, a);
		},

		p: function update(changed, state) {
			if ((changed.$image) && span_alt_value !== (span_alt_value = state.$image.description)) {
				setAttribute(span, "alt", span_alt_value);
			}

			if (changed.$image) {
				setStyle(span, "background-image", "url(" + state.$image.source + ")");
				setStyle(span, "width", "" + state.$image.width + "px");
				setStyle(span, "height", "" + state.$image.height + "px");
			}

			if ((changed.$image) && a_href_value !== (a_href_value = state.$image.link)) {
				a.href = a_href_value;
			}

			if ((changed.$image) && a_title_value !== (a_title_value = state.$image.title)) {
				a.title = a_title_value;
			}
		},

		u: function unmount() {
			detachNode(a);
		},

		d: noop
	};
}

// (36:4) {{ #each $items as item, index }}
function create_each_block(state, $items, item, index, component) {
	var if_block_anchor;

	var if_block = (index < state.$maxItems) && create_if_block_3(state, $items, item, index, component);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = createComment();
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insertNode(if_block_anchor, target, anchor);
		},

		p: function update(changed, state, $items, item, index) {
			if (index < state.$maxItems) {
				if (if_block) {
					if_block.p(changed, state, $items, item, index);
				} else {
					if_block = create_if_block_3(state, $items, item, index, component);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}
		},

		u: function unmount() {
			if (if_block) if_block.u();
			detachNode(if_block_anchor);
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
		}
	};
}

// (44:10) {{ #if !$compact }}
function create_if_block_4(state, $items, item, index, component) {
	var raw_value = item.description, raw_before, raw_after, text, text_1_value = item.buttons, text_1;

	return {
		c: function create() {
			raw_before = createElement('noscript');
			raw_after = createElement('noscript');
			text = createText("\n            ");
			text_1 = createText(text_1_value);
		},

		m: function mount(target, anchor) {
			insertNode(raw_before, target, anchor);
			raw_before.insertAdjacentHTML("afterend", raw_value);
			insertNode(raw_after, target, anchor);
			insertNode(text, target, anchor);
			insertNode(text_1, target, anchor);
		},

		p: function update(changed, state, $items, item, index) {
			if ((changed.$items) && raw_value !== (raw_value = item.description)) {
				detachBetween(raw_before, raw_after);
				raw_before.insertAdjacentHTML("afterend", raw_value);
			}

			if ((changed.$items) && text_1_value !== (text_1_value = item.buttons)) {
				text_1.data = text_1_value;
			}
		},

		u: function unmount() {
			detachBetween(raw_before, raw_after);

			detachNode(raw_before);
			detachNode(raw_after);
			detachNode(text);
			detachNode(text_1);
		},

		d: noop
	};
}

// (37:6) {{ #if index < $maxItems }}
function create_if_block_3(state, $items, item, index, component) {
	var div, div_1, a, text_value = item.title, text, a_href_value, text_3;

	var if_block = (!state.$compact) && create_if_block_4(state, $items, item, index, component);

	return {
		c: function create() {
			div = createElement("div");
			div_1 = createElement("div");
			a = createElement("a");
			text = createText(text_value);
			text_3 = createText("\n          ");
			if (if_block) if_block.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			a.href = a_href_value = item.link;
			setStyle(a, "color", state.$textColor);
			setStyle(div_1, "font-weight", state.$fontWeight);
			div.className = "rssbox-item-content rssBoxItemContent";
			setStyle(div, "color", state.$textColor);
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(div_1, div);
			appendNode(a, div_1);
			appendNode(text, a);
			appendNode(text_3, div);
			if (if_block) if_block.m(div, null);
		},

		p: function update(changed, state, $items, item, index) {
			if ((changed.$items) && text_value !== (text_value = item.title)) {
				text.data = text_value;
			}

			if ((changed.$items) && a_href_value !== (a_href_value = item.link)) {
				a.href = a_href_value;
			}

			if (changed.$textColor) {
				setStyle(a, "color", state.$textColor);
			}

			if (changed.$fontWeight) {
				setStyle(div_1, "font-weight", state.$fontWeight);
			}

			if (!state.$compact) {
				if (if_block) {
					if_block.p(changed, state, $items, item, index);
				} else {
					if_block = create_if_block_4(state, $items, item, index, component);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}

			if (changed.$textColor) {
				setStyle(div, "color", state.$textColor);
			}
		},

		u: function unmount() {
			detachNode(div);
			if (if_block) if_block.u();
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
		}
	};
}

// (51:4) {{ #if $input }}
function create_if_block_5(state, component) {
	var text;

	return {
		c: function create() {
			text = createText("TODO");
		},

		m: function mount(target, anchor) {
			insertNode(text, target, anchor);
		},

		u: function unmount() {
			detachNode(text);
		},

		d: noop
	};
}

function Box(options) {
	this._debugName = '<Box>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(this.store._init(["height","linkColor","width","frameColor","radius","fontFace","headless","titleBarTextColor","titleBarColor","showXmlButton","url","format","version","link","title","formattedDate","boxFillColor","image","items","maxItems","textColor","fontWeight","compact","input"]), options.data);
	this.store._add(this, ["height","linkColor","width","frameColor","radius","fontFace","headless","titleBarTextColor","titleBarColor","showXmlButton","url","format","version","link","title","formattedDate","boxFillColor","image","items","maxItems","textColor","fontWeight","compact","input"]);
	this._recompute({ $height: 1 }, this._state);
	if (!('$height' in this._state)) console.warn("<Box> was created without expected data property '$height'");
	if (!('$linkColor' in this._state)) console.warn("<Box> was created without expected data property '$linkColor'");
	if (!('$width' in this._state)) console.warn("<Box> was created without expected data property '$width'");
	if (!('$frameColor' in this._state)) console.warn("<Box> was created without expected data property '$frameColor'");
	if (!('$radius' in this._state)) console.warn("<Box> was created without expected data property '$radius'");
	if (!('$fontFace' in this._state)) console.warn("<Box> was created without expected data property '$fontFace'");
	if (!('$headless' in this._state)) console.warn("<Box> was created without expected data property '$headless'");
	if (!('$titleBarTextColor' in this._state)) console.warn("<Box> was created without expected data property '$titleBarTextColor'");
	if (!('$titleBarColor' in this._state)) console.warn("<Box> was created without expected data property '$titleBarColor'");
	if (!('$showXmlButton' in this._state)) console.warn("<Box> was created without expected data property '$showXmlButton'");
	if (!('$url' in this._state)) console.warn("<Box> was created without expected data property '$url'");
	if (!('$format' in this._state)) console.warn("<Box> was created without expected data property '$format'");
	if (!('$version' in this._state)) console.warn("<Box> was created without expected data property '$version'");
	if (!('$link' in this._state)) console.warn("<Box> was created without expected data property '$link'");
	if (!('$title' in this._state)) console.warn("<Box> was created without expected data property '$title'");
	if (!('$formattedDate' in this._state)) console.warn("<Box> was created without expected data property '$formattedDate'");
	if (!('$boxFillColor' in this._state)) console.warn("<Box> was created without expected data property '$boxFillColor'");
	if (!('height' in this._state)) console.warn("<Box> was created without expected data property 'height'");
	if (!('$image' in this._state)) console.warn("<Box> was created without expected data property '$image'");
	if (!('$items' in this._state)) console.warn("<Box> was created without expected data property '$items'");
	if (!('$maxItems' in this._state)) console.warn("<Box> was created without expected data property '$maxItems'");
	if (!('$textColor' in this._state)) console.warn("<Box> was created without expected data property '$textColor'");
	if (!('$fontWeight' in this._state)) console.warn("<Box> was created without expected data property '$fontWeight'");
	if (!('$compact' in this._state)) console.warn("<Box> was created without expected data property '$compact'");
	if (!('$input' in this._state)) console.warn("<Box> was created without expected data property '$input'");

	this._handlers.destroy = [removeFromStore];

	if (!document.getElementById("svelte-3159601204-style")) add_css$3();

	var _oncreate = oncreate$1.bind(this);

	if (!options.root) {
		this._oncreate = [_oncreate];
	} else {
	 	this.root._oncreate.push(_oncreate);
	 }

	this._fragment = create_main_fragment$5(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);

		callAll(this._oncreate);
	}
}

assign(Box.prototype, protoDev);

Box.prototype._checkReadOnly = function _checkReadOnly(newState) {
	if ('height' in newState && !this._updatingReadonlyProperty) throw new Error("<Box>: Cannot set read-only property 'height'");
};

Box.prototype._recompute = function _recompute(changed, state) {
	if (changed.$height) {
		if (differs(state.height, (state.height = height(state.$height)))) changed.height = true;
	}
};

/* components/Referrers.html generated by Svelte v1.50.0 */
let loaded = false;

function data() {
  return {
    referrers: []
  }
}

function format(float) {
  if (float < 0.01) return '< 0.01';
  return float.toFixed(2).padStart(6)
}

var methods$2 = {
  update(event) {
    if (event.target.open && !loaded) this.load();
  },

  async load() {
    const data = await fetch(URLS$$1.ferris).then(res => res.json());

    const hosts = data.reduce((accu, item) => {
      if (item.url.startsWith('http') && !item.url.startsWith(URLS$$1.base)) {
        const url = item.url.replace(/^([^.]*)www\./, '$1');
        const host = url.split('/')[2];

        let data = accu.get(host);

        if (!data) {
          data = { host, url, hits: item.hits, total: 0 };
          accu.set(host, data);
        } else if (item.hits > data.hits) {
          data.url = item.url;
          data.hits = item.hits;
        }

        data.total += item.hits;
        return accu;
      }
    }, new Map());

    const values = hosts.values();

    let referrers = Array.from(values);
    const total = referrers.reduce((accu, item) => accu += item.total, 0);

    referrers.sort((a, b) => b.hits - a.hits);
    referrers = referrers.map(item => {
      item.percentage = item.total / total * 100;
      return item;
    });

    this.set({ referrers });
    loaded = true;
  }
};

function encapsulateStyles$5(node) {
	setAttribute(node, "svelte-2686223601", "");
}

function add_css$5() {
	var style = createElement("style");
	style.id = 'svelte-2686223601-style';
	style.textContent = "details[svelte-2686223601]{line-height:1.4em}code[svelte-2686223601]{margin-right:0.5em;color:gray;font-size:0.7em;white-space:pre}summary[svelte-2686223601]{outline:none}.referrer[svelte-2686223601]{white-space:nowrap}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVmZXJyZXJzLmh0bWwiLCJzb3VyY2VzIjpbIlJlZmVycmVycy5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxkZXRhaWxzIG9uOnRvZ2dsZT0ndXBkYXRlKGV2ZW50KSc+XG4gIDxzdW1tYXJ5Pjwvc3VtbWFyeT5cbiAge3sgI2lmIHJlZmVycmVycy5sZW5ndGggfX1cbiAgICB7eyAjZWFjaCByZWZlcnJlcnMgYXMgcmVmZXJyZXIgfX1cbiAgICAgIDxkaXYgY2xhc3M9J3JlZmVycmVyJz5cbiAgICAgICAgPGNvZGU+e3sgZm9ybWF0KHJlZmVycmVyLnBlcmNlbnRhZ2UpIH19PC9jb2RlPlxuICAgICAgICA8YSBocmVmPSd7eyByZWZlcnJlci51cmwgfX0nPnt7IHJlZmVycmVyLmhvc3QgfX08L2E+XG4gICAgICA8L2Rpdj5cbiAgICB7eyAvZWFjaCB9fVxuICB7eyBlbHNlIH19XG4gICAgTG9hZGluZ+KAplxuICB7eyAvaWYgfX1cbjwvZGV0YWlscz5cblxuPHN0eWxlPlxuICBkZXRhaWxzIHtcbiAgICBsaW5lLWhlaWdodDogMS40ZW07XG4gIH1cblxuICBjb2RlIHtcbiAgICBtYXJnaW4tcmlnaHQ6IDAuNWVtO1xuICAgIGNvbG9yOiBncmF5O1xuICAgIGZvbnQtc2l6ZTogMC43ZW07XG4gICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgfVxuXG4gIHN1bW1hcnkge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICAucmVmZXJyZXIge1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7IFVSTFMgfSBmcm9tICcuLi9zcmMvc2V0dGluZ3MnO1xuXG4gIGxldCBsb2FkZWQgPSBmYWxzZTtcblxuICBleHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlZmVycmVyczogW11cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaGVscGVyczoge1xuICAgICAgZm9ybWF0OiBmbG9hdCA9PiB7XG4gICAgICAgIGlmIChmbG9hdCA8IDAuMDEpIHJldHVybiAnPCAwLjAxJztcbiAgICAgICAgcmV0dXJuIGZsb2F0LnRvRml4ZWQoMikucGFkU3RhcnQoNilcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbWV0aG9kczoge1xuICAgICAgdXBkYXRlKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC50YXJnZXQub3BlbiAmJiAhbG9hZGVkKSB0aGlzLmxvYWQoKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzeW5jIGxvYWQoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaChVUkxTLmZlcnJpcykudGhlbihyZXMgPT4gcmVzLmpzb24oKSk7XG5cbiAgICAgICAgY29uc3QgaG9zdHMgPSBkYXRhLnJlZHVjZSgoYWNjdSwgaXRlbSkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtLnVybC5zdGFydHNXaXRoKCdodHRwJykgJiYgIWl0ZW0udXJsLnN0YXJ0c1dpdGgoVVJMUy5iYXNlKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gaXRlbS51cmwucmVwbGFjZSgvXihbXi5dKil3d3dcXC4vLCAnJDEnKTtcbiAgICAgICAgICAgIGNvbnN0IGhvc3QgPSB1cmwuc3BsaXQoJy8nKVsyXTtcblxuICAgICAgICAgICAgbGV0IGRhdGEgPSBhY2N1LmdldChob3N0KTtcblxuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgIGRhdGEgPSB7IGhvc3QsIHVybCwgaGl0czogaXRlbS5oaXRzLCB0b3RhbDogMCB9O1xuICAgICAgICAgICAgICBhY2N1LnNldChob3N0LCBkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS5oaXRzID4gZGF0YS5oaXRzKSB7XG4gICAgICAgICAgICAgIGRhdGEudXJsID0gaXRlbS51cmw7XG4gICAgICAgICAgICAgIGRhdGEuaGl0cyA9IGl0ZW0uaGl0cztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGF0YS50b3RhbCArPSBpdGVtLmhpdHM7XG4gICAgICAgICAgICByZXR1cm4gYWNjdTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIG5ldyBNYXAoKSk7XG5cbiAgICAgICAgY29uc3QgdmFsdWVzID0gaG9zdHMudmFsdWVzKCk7XG5cbiAgICAgICAgbGV0IHJlZmVycmVycyA9IEFycmF5LmZyb20odmFsdWVzKTtcbiAgICAgICAgY29uc3QgdG90YWwgPSByZWZlcnJlcnMucmVkdWNlKChhY2N1LCBpdGVtKSA9PiBhY2N1ICs9IGl0ZW0udG90YWwsIDApO1xuXG4gICAgICAgIHJlZmVycmVycy5zb3J0KChhLCBiKSA9PiBiLmhpdHMgLSBhLmhpdHMpO1xuICAgICAgICByZWZlcnJlcnMgPSByZWZlcnJlcnMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgIGl0ZW0ucGVyY2VudGFnZSA9IGl0ZW0udG90YWwgLyB0b3RhbCAqIDEwMDtcbiAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5zZXQoeyByZWZlcnJlcnMgfSk7XG4gICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG48L3NjcmlwdD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFlRSxPQUFPLG1CQUFDLENBQUMsQUFDUCxXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsSUFBSSxtQkFBQyxDQUFDLEFBQ0osWUFBWSxDQUFFLEtBQUssQ0FDbkIsS0FBSyxDQUFFLElBQUksQ0FDWCxTQUFTLENBQUUsS0FBSyxDQUNoQixXQUFXLENBQUUsR0FBRyxBQUNsQixDQUFDLEFBRUQsT0FBTyxtQkFBQyxDQUFDLEFBQ1AsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsU0FBUyxtQkFBQyxDQUFDLEFBQ1QsV0FBVyxDQUFFLE1BQU0sQUFDckIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$7(state, component) {
	var details, summary, text;

	var current_block_type = select_block_type(state);
	var if_block = current_block_type(state, component);

	function toggle_handler(event) {
		component.update(event);
	}

	return {
		c: function create() {
			details = createElement("details");
			summary = createElement("summary");
			text = createText("\n  ");
			if_block.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$5(details);
			encapsulateStyles$5(summary);
			addListener(details, "toggle", toggle_handler);
		},

		m: function mount(target, anchor) {
			insertNode(details, target, anchor);
			appendNode(summary, details);
			appendNode(text, details);
			if_block.m(details, null);
		},

		p: function update(changed, state) {
			if (current_block_type === (current_block_type = select_block_type(state)) && if_block) {
				if_block.p(changed, state);
			} else {
				if_block.u();
				if_block.d();
				if_block = current_block_type(state, component);
				if_block.c();
				if_block.m(details, null);
			}
		},

		u: function unmount() {
			detachNode(details);
			if_block.u();
		},

		d: function destroy$$1() {
			if_block.d();
			removeListener(details, "toggle", toggle_handler);
		}
	};
}

// (4:4) {{ #each referrers as referrer }}
function create_each_block$1(state, referrers, referrer, referrer_index, component) {
	var div, code, text_value = format(referrer.percentage), text, text_1, a, text_2_value = referrer.host, text_2, a_href_value;

	return {
		c: function create() {
			div = createElement("div");
			code = createElement("code");
			text = createText(text_value);
			text_1 = createText("\n        ");
			a = createElement("a");
			text_2 = createText(text_2_value);
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$5(div);
			encapsulateStyles$5(code);
			a.href = a_href_value = referrer.url;
			div.className = "referrer";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(code, div);
			appendNode(text, code);
			appendNode(text_1, div);
			appendNode(a, div);
			appendNode(text_2, a);
		},

		p: function update(changed, state, referrers, referrer, referrer_index) {
			if ((changed.referrers) && text_value !== (text_value = format(referrer.percentage))) {
				text.data = text_value;
			}

			if ((changed.referrers) && text_2_value !== (text_2_value = referrer.host)) {
				text_2.data = text_2_value;
			}

			if ((changed.referrers) && a_href_value !== (a_href_value = referrer.url)) {
				a.href = a_href_value;
			}
		},

		u: function unmount() {
			detachNode(div);
		},

		d: noop
	};
}

// (3:2) {{ #if referrers.length }}
function create_if_block$1(state, component) {
	var each_anchor;

	var referrers = state.referrers;

	var each_blocks = [];

	for (var i = 0; i < referrers.length; i += 1) {
		each_blocks[i] = create_each_block$1(state, referrers, referrers[i], i, component);
	}

	return {
		c: function create() {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_anchor = createComment();
		},

		m: function mount(target, anchor) {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insertNode(each_anchor, target, anchor);
		},

		p: function update(changed, state) {
			var referrers = state.referrers;

			if (changed.referrers) {
				for (var i = 0; i < referrers.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].p(changed, state, referrers, referrers[i], i);
					} else {
						each_blocks[i] = create_each_block$1(state, referrers, referrers[i], i, component);
						each_blocks[i].c();
						each_blocks[i].m(each_anchor.parentNode, each_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].u();
					each_blocks[i].d();
				}
				each_blocks.length = referrers.length;
			}
		},

		u: function unmount() {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].u();
			}

			detachNode(each_anchor);
		},

		d: function destroy$$1() {
			destroyEach(each_blocks);
		}
	};
}

// (10:2) {{ else }}
function create_if_block_1$1(state, component) {
	var text;

	return {
		c: function create() {
			text = createText("Loading…");
		},

		m: function mount(target, anchor) {
			insertNode(text, target, anchor);
		},

		p: noop,

		u: function unmount() {
			detachNode(text);
		},

		d: noop
	};
}

function select_block_type(state) {
	if (state.referrers.length) return create_if_block$1;
	return create_if_block_1$1;
}

function Referrers(options) {
	this._debugName = '<Referrers>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(data(), options.data);
	if (!('referrers' in this._state)) console.warn("<Referrers> was created without expected data property 'referrers'");

	if (!document.getElementById("svelte-2686223601-style")) add_css$5();

	this._fragment = create_main_fragment$7(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(Referrers.prototype, methods$2, protoDev);

Referrers.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/Configurator.html generated by Svelte v1.50.0 */
var methods$1 = {
  update(event) {
    const name = event.target.name;
    const type = event.target.type;
    const value = event.target[type === 'checkbox' ? 'checked' : 'value'];
    this.store.set({ [name]: value });
  },

  reload(event) {
    const url = this.store.get('url');
    this.store.set({ url: null });
    this.store.set({ url });
  },

  copy(event) {
    try {
      event.target.select();
      document.execCommand('copy');
    } catch (error) { }
  },

  label(event) {
    const sibling = event.target.parentNode.nextElementSibling;
    let input = sibling.querySelector('input');
    if (!input) input = sibling.querySelector('summary');
    if (!input) input = sibling.querySelector('textarea');
    if (!input) return;
    if (input.click) input.click();
    if (input.select) input.select();
  }
};

function encapsulateStyles$4(node) {
	setAttribute(node, "svelte-293370740", "");
}

function add_css$4() {
	var style = createElement("style");
	style.id = 'svelte-293370740-style';
	style.textContent = "table[svelte-293370740]{overflow:scroll}tr[svelte-293370740] td[svelte-293370740]:first-child{color:#999;text-align:right;white-space:nowrap}summary[svelte-293370740]{outline:none}.top[svelte-293370740]{vertical-align:top}[name=url][svelte-293370740],[name=fontFace][svelte-293370740],[name=code][svelte-293370740]{width:90%}[type=color][svelte-293370740],[type=number][svelte-293370740]{width:50px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlndXJhdG9yLmh0bWwiLCJzb3VyY2VzIjpbIkNvbmZpZ3VyYXRvci5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxmb3JtIG9uOnN1Ym1pdD0nZXZlbnQucHJldmVudERlZmF1bHQoKSc+XG4gIDx0YWJsZSBjbGFzcz0ndGFibGUnPlxuICAgIDxjb2xncm91cD5cbiAgICAgIDxjb2wgd2lkdGg9JyonPlxuICAgICAgPGNvbCB3aWR0aD0nOTAlJz5cbiAgICA8L2NvbGdyb3VwPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkZlZWQgVVJMPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSd1cmwnIG5hbWU9J3VybCcgdmFsdWU9J3t7ICR1cmwgfX0nIHJlcXVpcmVkIG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWw+VGl0bGU8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD57eyAkdGl0bGUgfX08L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+RGVzY3JpcHRpb248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGRldGFpbHM+XG4gICAgICAgICAgPHN1bW1hcnk+PC9zdW1tYXJ5PlxuICAgICAgICAgIHt7ICRkZXNjcmlwdGlvbiB9fVxuICAgICAgICA8L2RldGFpbHM+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWw+TGFzdCBidWlsZDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPnt7ICRmb3JtYXR0ZWREYXRlIH19PC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsPlNvdXJjZTwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPjxhIGhyZWY9J3t7ICR1cmwgfX0nPnt7ICRmb3JtYXQgfX0ge3sgJHZlcnNpb24gfX08L2E+PC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPk1heC4gaXRlbXM8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J251bWJlcicgbmFtZT0nbWF4SXRlbXMnIHZhbHVlPSd7eyAkbWF4SXRlbXMgfX0nIG1pbj0xIG1heD05OSAgcmVxdWlyZWQgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5Cb3ggd2lkdGg8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J251bWJlcicgbmFtZT0nd2lkdGgnIHZhbHVlPSd7eyAkd2lkdGggfX0nIG1pbj0xMDAgbWF4PTk5OTkgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJyB0aXRsZT0nRXhwZXJpbWVudGFsIGZlYXR1cmUnPkNvbnRlbnQgaGVpZ2h0IOKaoO+4jzwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nbnVtYmVyJyBuYW1lPSdoZWlnaHQnIHZhbHVlPSd7eyAkaGVpZ2h0IH19JyBtaW49LTEgbWF4PTk5OTkgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5Db3JuZXIgcmFkaXVzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIG5hbWU9J3JhZGl1cycgdmFsdWU9J3t7ICRyYWRpdXMgfX0nIG1pbj0wIG1heD05OTkgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5YTUwgYnV0dG9uPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nc2hvd1htbEJ1dHRvbicgdmFsdWU9JzEnIGNoZWNrZWQ9J3t7ICRzaG93WG1sQnV0dG9uIH19JyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkhlYWRsZXNzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0naGVhZGxlc3MnIHZhbHVlPScxJyBjaGVja2VkPSd7eyAkaGVhZGxlc3MgfX0nIG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+Q29tcGFjdCB2aWV3PC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nY29tcGFjdCcgdmFsdWU9JzEnIGNoZWNrZWQ9J3t7ICRjb21wYWN0IH19JyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkZyYW1lIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0nZnJhbWVDb2xvcicgdmFsdWU9J3t7ICRmcmFtZUNvbG9yIH19JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5UaXRsZWJhciBjb2xvcjwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY29sb3InIG5hbWU9J3RpdGxlQmFyQ29sb3InIHZhbHVlPSd7eyAkdGl0bGVCYXJDb2xvciB9fScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+VGl0bGUgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBuYW1lPSd0aXRsZUJhclRleHRDb2xvcicgdmFsdWU9J3t7ICR0aXRsZUJhclRleHRDb2xvciB9fScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+Qm94IGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0nYm94RmlsbENvbG9yJyB2YWx1ZT0ne3sgJGJveEZpbGxDb2xvciB9fScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+VGV4dCBjb2xvcjwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY29sb3InIG5hbWU9J3RleHRDb2xvcicgdmFsdWU9J3t7ICR0ZXh0Q29sb3IgfX0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkxpbmsgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBuYW1lPSdsaW5rQ29sb3InIHZhbHVlPSd7eyAkbGlua0NvbG9yIH19JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5Gb250IGZhY2U8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IG5hbWU9J2ZvbnRGYWNlJyB2YWx1ZT0ne3sgJGZvbnRGYWNlIH19JyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD48L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPSdidG4gYnRuLXNtIGJ0bi1iJyBvbjpjbGljaz0ncmVsb2FkKGV2ZW50KSc+UmVsb2FkPC9idXR0b24+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+XG4gICAgICAgICAgSFRNTCBjb2RlPGJyPlxuICAgICAgICAgIChjb3B5JmFtcDtwYXN0YSlcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDx0ZXh0YXJlYSBuYW1lPSdjb2RlJyBjb2xzPScxMCcgcm93cz0nMycgcmVhZG9ubHkgb246Y2xpY2s9J2NvcHkoZXZlbnQpJz57eyAkY29kZSB9fTwvdGV4dGFyZWE+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+XG4gICAgICAgICAgUmVmZXJyZXJzPGJyPlxuICAgICAgICAgIChsYXN0IDI0IGhvdXJzKVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZCBjbGFzcz0ndG9wJz5cbiAgICAgICAgPFJlZmVycmVycy8+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gIDwvdGFibGU+XG48L2Zvcm0+XG5cbjxzdHlsZT5cbiAgdGFibGUge1xuICAgIG92ZXJmbG93OiBzY3JvbGw7XG4gIH1cblxuICB0ciB0ZDpmaXJzdC1jaGlsZCB7XG4gICAgY29sb3I6ICM5OTk7XG4gICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIHN1bW1hcnkge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICAudG9wIHtcbiAgICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xuICB9XG5cbiAgW25hbWU9dXJsXSwgW25hbWU9Zm9udEZhY2VdLCBbbmFtZT1jb2RlXSB7XG4gICAgd2lkdGg6IDkwJTtcbiAgfVxuXG4gIFt0eXBlPWNvbG9yXSwgW3R5cGU9bnVtYmVyXSB7XG4gICAgd2lkdGg6IDUwcHg7XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCBSZWZlcnJlcnMgZnJvbSAnLi9SZWZlcnJlcnMuaHRtbCc7XG5cbiAgZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgIFJlZmVycmVyc1xuICAgIH0sXG5cbiAgICBtZXRob2RzOiB7XG4gICAgICB1cGRhdGUoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGV2ZW50LnRhcmdldC5uYW1lO1xuICAgICAgICBjb25zdCB0eXBlID0gZXZlbnQudGFyZ2V0LnR5cGU7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZXZlbnQudGFyZ2V0W3R5cGUgPT09ICdjaGVja2JveCcgPyAnY2hlY2tlZCcgOiAndmFsdWUnXTtcbiAgICAgICAgdGhpcy5zdG9yZS5zZXQoeyBbbmFtZV06IHZhbHVlIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVsb2FkKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHVybCA9IHRoaXMuc3RvcmUuZ2V0KCd1cmwnKTtcbiAgICAgICAgdGhpcy5zdG9yZS5zZXQoeyB1cmw6IG51bGwgfSk7XG4gICAgICAgIHRoaXMuc3RvcmUuc2V0KHsgdXJsIH0pO1xuICAgICAgfSxcblxuICAgICAgY29weShldmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV2ZW50LnRhcmdldC5zZWxlY3QoKTtcbiAgICAgICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikgeyB9XG4gICAgICB9LFxuXG4gICAgICBsYWJlbChldmVudCkge1xuICAgICAgICBjb25zdCBzaWJsaW5nID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgICAgICBsZXQgaW5wdXQgPSBzaWJsaW5nLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgIGlmICghaW5wdXQpIGlucHV0ID0gc2libGluZy5xdWVyeVNlbGVjdG9yKCdzdW1tYXJ5Jyk7XG4gICAgICAgIGlmICghaW5wdXQpIGlucHV0ID0gc2libGluZy5xdWVyeVNlbGVjdG9yKCd0ZXh0YXJlYScpO1xuICAgICAgICBpZiAoIWlucHV0KSByZXR1cm47XG4gICAgICAgIGlmIChpbnB1dC5jbGljaykgaW5wdXQuY2xpY2soKTtcbiAgICAgICAgaWYgKGlucHV0LnNlbGVjdCkgaW5wdXQuc2VsZWN0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG48L3NjcmlwdD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4TEUsS0FBSyxrQkFBQyxDQUFDLEFBQ0wsUUFBUSxDQUFFLE1BQU0sQUFDbEIsQ0FBQyxBQUVELG9CQUFFLENBQUMsb0JBQUUsWUFBWSxBQUFDLENBQUMsQUFDakIsS0FBSyxDQUFFLElBQUksQ0FDWCxVQUFVLENBQUUsS0FBSyxDQUNqQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBRUQsT0FBTyxrQkFBQyxDQUFDLEFBQ1AsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsSUFBSSxrQkFBQyxDQUFDLEFBQ0osY0FBYyxDQUFFLEdBQUcsQUFDckIsQ0FBQyxBQUVELENBQUMsSUFBSSxDQUFDLEdBQUcsbUJBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxRQUFRLG1CQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFDLENBQUMsQUFDeEMsS0FBSyxDQUFFLEdBQUcsQUFDWixDQUFDLEFBRUQsQ0FBQyxJQUFJLENBQUMsS0FBSyxtQkFBQyxDQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBQyxDQUFDLEFBQzNCLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$6(state, component) {
	var form, table, colgroup, text_2, tr, td, label, text_5, td_1, input, text_8, tr_1, td_2, text_11, td_3, text_12, text_14, tr_2, td_4, label_2, text_17, td_5, details, summary, text_18, text_19, text_23, tr_3, td_6, text_26, td_7, text_27, text_29, tr_4, td_8, text_32, td_9, a, text_33, text_34, text_35, text_37, tr_5, td_10, label_5, text_40, td_11, input_1, text_43, tr_6, td_12, label_6, text_46, td_13, input_2, text_47, small, text_51, tr_7, td_14, label_7, text_54, td_15, input_3, text_55, small_1, text_59, tr_8, td_16, label_8, text_62, td_17, input_4, text_63, small_2, text_67, tr_9, td_18, label_9, text_70, td_19, input_5, text_73, tr_10, td_20, label_10, text_76, td_21, input_6, text_79, tr_11, td_22, label_11, text_82, td_23, input_7, text_85, tr_12, td_24, label_12, text_88, td_25, input_8, text_91, tr_13, td_26, label_13, text_94, td_27, input_9, text_97, tr_14, td_28, label_14, text_100, td_29, input_10, text_103, tr_15, td_30, label_15, text_106, td_31, input_11, text_109, tr_16, td_32, label_16, text_112, td_33, input_12, text_115, tr_17, td_34, label_17, text_118, td_35, input_13, text_121, tr_18, td_36, label_18, text_124, td_37, input_14, text_127, tr_19, td_38, text_128, td_39, button, text_132, tr_20, td_40, label_19, text_136, td_41, textarea, text_139, tr_21, td_42, label_20, text_143, td_43;

	function click_handler(event) {
		component.label(event);
	}

	function change_handler(event) {
		component.update(event);
	}

	function click_handler_1(event) {
		component.label(event);
	}

	function click_handler_2(event) {
		component.label(event);
	}

	function change_handler_1(event) {
		component.update(event);
	}

	function click_handler_3(event) {
		component.label(event);
	}

	function change_handler_2(event) {
		component.update(event);
	}

	function click_handler_4(event) {
		component.label(event);
	}

	function change_handler_3(event) {
		component.update(event);
	}

	function click_handler_5(event) {
		component.label(event);
	}

	function change_handler_4(event) {
		component.update(event);
	}

	function click_handler_6(event) {
		component.label(event);
	}

	function change_handler_5(event) {
		component.update(event);
	}

	function click_handler_7(event) {
		component.label(event);
	}

	function change_handler_6(event) {
		component.update(event);
	}

	function click_handler_8(event) {
		component.label(event);
	}

	function change_handler_7(event) {
		component.update(event);
	}

	function click_handler_9(event) {
		component.label(event);
	}

	function change_handler_8(event) {
		component.update(event);
	}

	function click_handler_10(event) {
		component.label(event);
	}

	function change_handler_9(event) {
		component.update(event);
	}

	function click_handler_11(event) {
		component.label(event);
	}

	function change_handler_10(event) {
		component.update(event);
	}

	function click_handler_12(event) {
		component.label(event);
	}

	function change_handler_11(event) {
		component.update(event);
	}

	function click_handler_13(event) {
		component.label(event);
	}

	function change_handler_12(event) {
		component.update(event);
	}

	function click_handler_14(event) {
		component.label(event);
	}

	function change_handler_13(event) {
		component.update(event);
	}

	function click_handler_15(event) {
		component.label(event);
	}

	function change_handler_14(event) {
		component.update(event);
	}

	function click_handler_16(event) {
		component.reload(event);
	}

	function click_handler_17(event) {
		component.label(event);
	}

	function click_handler_18(event) {
		component.copy(event);
	}

	function click_handler_19(event) {
		component.label(event);
	}

	var referrers = new Referrers({
		root: component.root
	});

	function submit_handler(event) {
		event.preventDefault();
	}

	return {
		c: function create() {
			form = createElement("form");
			table = createElement("table");
			colgroup = createElement("colgroup");
			colgroup.innerHTML = "<col width=\"*\">\n      <col width=\"90%\">";
			text_2 = createText("\n    ");
			tr = createElement("tr");
			td = createElement("td");
			label = createElement("label");
			label.textContent = "Feed URL";
			text_5 = createText("\n      ");
			td_1 = createElement("td");
			input = createElement("input");
			text_8 = createText("\n    ");
			tr_1 = createElement("tr");
			td_2 = createElement("td");
			td_2.innerHTML = "<label>Title</label>";
			text_11 = createText("\n      ");
			td_3 = createElement("td");
			text_12 = createText(state.$title);
			text_14 = createText("\n    ");
			tr_2 = createElement("tr");
			td_4 = createElement("td");
			label_2 = createElement("label");
			label_2.textContent = "Description";
			text_17 = createText("\n      ");
			td_5 = createElement("td");
			details = createElement("details");
			summary = createElement("summary");
			text_18 = createText("\n          ");
			text_19 = createText(state.$description);
			text_23 = createText("\n    ");
			tr_3 = createElement("tr");
			td_6 = createElement("td");
			td_6.innerHTML = "<label>Last build</label>";
			text_26 = createText("\n      ");
			td_7 = createElement("td");
			text_27 = createText(state.$formattedDate);
			text_29 = createText("\n    ");
			tr_4 = createElement("tr");
			td_8 = createElement("td");
			td_8.innerHTML = "<label>Source</label>";
			text_32 = createText("\n      ");
			td_9 = createElement("td");
			a = createElement("a");
			text_33 = createText(state.$format);
			text_34 = createText(" ");
			text_35 = createText(state.$version);
			text_37 = createText("\n    ");
			tr_5 = createElement("tr");
			td_10 = createElement("td");
			label_5 = createElement("label");
			label_5.textContent = "Max. items";
			text_40 = createText("\n      ");
			td_11 = createElement("td");
			input_1 = createElement("input");
			text_43 = createText("\n    ");
			tr_6 = createElement("tr");
			td_12 = createElement("td");
			label_6 = createElement("label");
			label_6.textContent = "Box width";
			text_46 = createText("\n      ");
			td_13 = createElement("td");
			input_2 = createElement("input");
			text_47 = createText("\n        ");
			small = createElement("small");
			small.textContent = "px";
			text_51 = createText("\n    ");
			tr_7 = createElement("tr");
			td_14 = createElement("td");
			label_7 = createElement("label");
			label_7.textContent = "Content height ⚠️";
			text_54 = createText("\n      ");
			td_15 = createElement("td");
			input_3 = createElement("input");
			text_55 = createText("\n        ");
			small_1 = createElement("small");
			small_1.textContent = "px";
			text_59 = createText("\n    ");
			tr_8 = createElement("tr");
			td_16 = createElement("td");
			label_8 = createElement("label");
			label_8.textContent = "Corner radius";
			text_62 = createText("\n      ");
			td_17 = createElement("td");
			input_4 = createElement("input");
			text_63 = createText("\n        ");
			small_2 = createElement("small");
			small_2.textContent = "px";
			text_67 = createText("\n    ");
			tr_9 = createElement("tr");
			td_18 = createElement("td");
			label_9 = createElement("label");
			label_9.textContent = "XML button";
			text_70 = createText("\n      ");
			td_19 = createElement("td");
			input_5 = createElement("input");
			text_73 = createText("\n    ");
			tr_10 = createElement("tr");
			td_20 = createElement("td");
			label_10 = createElement("label");
			label_10.textContent = "Headless";
			text_76 = createText("\n      ");
			td_21 = createElement("td");
			input_6 = createElement("input");
			text_79 = createText("\n    ");
			tr_11 = createElement("tr");
			td_22 = createElement("td");
			label_11 = createElement("label");
			label_11.textContent = "Compact view";
			text_82 = createText("\n      ");
			td_23 = createElement("td");
			input_7 = createElement("input");
			text_85 = createText("\n    ");
			tr_12 = createElement("tr");
			td_24 = createElement("td");
			label_12 = createElement("label");
			label_12.textContent = "Frame color";
			text_88 = createText("\n      ");
			td_25 = createElement("td");
			input_8 = createElement("input");
			text_91 = createText("\n    ");
			tr_13 = createElement("tr");
			td_26 = createElement("td");
			label_13 = createElement("label");
			label_13.textContent = "Titlebar color";
			text_94 = createText("\n      ");
			td_27 = createElement("td");
			input_9 = createElement("input");
			text_97 = createText("\n    ");
			tr_14 = createElement("tr");
			td_28 = createElement("td");
			label_14 = createElement("label");
			label_14.textContent = "Title color";
			text_100 = createText("\n      ");
			td_29 = createElement("td");
			input_10 = createElement("input");
			text_103 = createText("\n    ");
			tr_15 = createElement("tr");
			td_30 = createElement("td");
			label_15 = createElement("label");
			label_15.textContent = "Box color";
			text_106 = createText("\n      ");
			td_31 = createElement("td");
			input_11 = createElement("input");
			text_109 = createText("\n    ");
			tr_16 = createElement("tr");
			td_32 = createElement("td");
			label_16 = createElement("label");
			label_16.textContent = "Text color";
			text_112 = createText("\n      ");
			td_33 = createElement("td");
			input_12 = createElement("input");
			text_115 = createText("\n    ");
			tr_17 = createElement("tr");
			td_34 = createElement("td");
			label_17 = createElement("label");
			label_17.textContent = "Link color";
			text_118 = createText("\n      ");
			td_35 = createElement("td");
			input_13 = createElement("input");
			text_121 = createText("\n    ");
			tr_18 = createElement("tr");
			td_36 = createElement("td");
			label_18 = createElement("label");
			label_18.textContent = "Font face";
			text_124 = createText("\n      ");
			td_37 = createElement("td");
			input_14 = createElement("input");
			text_127 = createText("\n    ");
			tr_19 = createElement("tr");
			td_38 = createElement("td");
			text_128 = createText("\n      ");
			td_39 = createElement("td");
			button = createElement("button");
			button.textContent = "Reload";
			text_132 = createText("\n    ");
			tr_20 = createElement("tr");
			td_40 = createElement("td");
			label_19 = createElement("label");
			label_19.innerHTML = "HTML code<br>\n          (copy&pasta)";
			text_136 = createText("\n      ");
			td_41 = createElement("td");
			textarea = createElement("textarea");
			text_139 = createText("\n    ");
			tr_21 = createElement("tr");
			td_42 = createElement("td");
			label_20 = createElement("label");
			label_20.innerHTML = "Referrers<br>\n          (last 24 hours)";
			text_143 = createText("\n      ");
			td_43 = createElement("td");
			referrers._fragment.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$4(table);
			encapsulateStyles$4(tr);
			encapsulateStyles$4(td);
			addListener(label, "click", click_handler);
			encapsulateStyles$4(td_1);
			encapsulateStyles$4(input);
			input.type = "url";
			input.name = "url";
			input.value = state.$url;
			input.required = true;
			addListener(input, "change", change_handler);
			encapsulateStyles$4(tr_1);
			encapsulateStyles$4(td_2);
			encapsulateStyles$4(td_3);
			encapsulateStyles$4(tr_2);
			encapsulateStyles$4(td_4);
			addListener(label_2, "click", click_handler_1);
			td_4.className = "top";
			encapsulateStyles$4(td_5);
			encapsulateStyles$4(summary);
			encapsulateStyles$4(tr_3);
			encapsulateStyles$4(td_6);
			encapsulateStyles$4(td_7);
			encapsulateStyles$4(tr_4);
			encapsulateStyles$4(td_8);
			encapsulateStyles$4(td_9);
			a.href = state.$url;
			encapsulateStyles$4(tr_5);
			encapsulateStyles$4(td_10);
			addListener(label_5, "click", click_handler_2);
			encapsulateStyles$4(td_11);
			encapsulateStyles$4(input_1);
			input_1.type = "number";
			input_1.name = "maxItems";
			input_1.value = state.$maxItems;
			input_1.min = "1";
			input_1.max = "99";
			input_1.required = true;
			addListener(input_1, "change", change_handler_1);
			encapsulateStyles$4(tr_6);
			encapsulateStyles$4(td_12);
			addListener(label_6, "click", click_handler_3);
			encapsulateStyles$4(td_13);
			encapsulateStyles$4(input_2);
			input_2.type = "number";
			input_2.name = "width";
			input_2.value = state.$width;
			input_2.min = "100";
			input_2.max = "9999";
			addListener(input_2, "change", change_handler_2);
			encapsulateStyles$4(tr_7);
			encapsulateStyles$4(td_14);
			label_7.title = "Experimental feature";
			addListener(label_7, "click", click_handler_4);
			encapsulateStyles$4(td_15);
			encapsulateStyles$4(input_3);
			input_3.type = "number";
			input_3.name = "height";
			input_3.value = state.$height;
			input_3.min = "-1";
			input_3.max = "9999";
			addListener(input_3, "change", change_handler_3);
			encapsulateStyles$4(tr_8);
			encapsulateStyles$4(td_16);
			addListener(label_8, "click", click_handler_5);
			encapsulateStyles$4(td_17);
			encapsulateStyles$4(input_4);
			input_4.type = "number";
			input_4.name = "radius";
			input_4.value = state.$radius;
			input_4.min = "0";
			input_4.max = "999";
			addListener(input_4, "change", change_handler_4);
			encapsulateStyles$4(tr_9);
			encapsulateStyles$4(td_18);
			addListener(label_9, "click", click_handler_6);
			encapsulateStyles$4(td_19);
			input_5.type = "checkbox";
			input_5.name = "showXmlButton";
			input_5.value = "1";
			input_5.checked = state.$showXmlButton;
			addListener(input_5, "change", change_handler_5);
			encapsulateStyles$4(tr_10);
			encapsulateStyles$4(td_20);
			addListener(label_10, "click", click_handler_7);
			encapsulateStyles$4(td_21);
			input_6.type = "checkbox";
			input_6.name = "headless";
			input_6.value = "1";
			input_6.checked = state.$headless;
			addListener(input_6, "change", change_handler_6);
			encapsulateStyles$4(tr_11);
			encapsulateStyles$4(td_22);
			addListener(label_11, "click", click_handler_8);
			encapsulateStyles$4(td_23);
			input_7.type = "checkbox";
			input_7.name = "compact";
			input_7.value = "1";
			input_7.checked = state.$compact;
			addListener(input_7, "change", change_handler_7);
			encapsulateStyles$4(tr_12);
			encapsulateStyles$4(td_24);
			addListener(label_12, "click", click_handler_9);
			encapsulateStyles$4(td_25);
			encapsulateStyles$4(input_8);
			input_8.type = "color";
			input_8.name = "frameColor";
			input_8.value = state.$frameColor;
			input_8.size = "6";
			input_8.maxLength = "7";
			addListener(input_8, "change", change_handler_8);
			encapsulateStyles$4(tr_13);
			encapsulateStyles$4(td_26);
			addListener(label_13, "click", click_handler_10);
			encapsulateStyles$4(td_27);
			encapsulateStyles$4(input_9);
			input_9.type = "color";
			input_9.name = "titleBarColor";
			input_9.value = state.$titleBarColor;
			input_9.size = "6";
			input_9.maxLength = "7";
			addListener(input_9, "change", change_handler_9);
			encapsulateStyles$4(tr_14);
			encapsulateStyles$4(td_28);
			addListener(label_14, "click", click_handler_11);
			encapsulateStyles$4(td_29);
			encapsulateStyles$4(input_10);
			input_10.type = "color";
			input_10.name = "titleBarTextColor";
			input_10.value = state.$titleBarTextColor;
			input_10.size = "6";
			input_10.maxLength = "7";
			addListener(input_10, "change", change_handler_10);
			encapsulateStyles$4(tr_15);
			encapsulateStyles$4(td_30);
			addListener(label_15, "click", click_handler_12);
			encapsulateStyles$4(td_31);
			encapsulateStyles$4(input_11);
			input_11.type = "color";
			input_11.name = "boxFillColor";
			input_11.value = state.$boxFillColor;
			input_11.size = "6";
			input_11.maxLength = "7";
			addListener(input_11, "change", change_handler_11);
			encapsulateStyles$4(tr_16);
			encapsulateStyles$4(td_32);
			addListener(label_16, "click", click_handler_13);
			encapsulateStyles$4(td_33);
			encapsulateStyles$4(input_12);
			input_12.type = "color";
			input_12.name = "textColor";
			input_12.value = state.$textColor;
			input_12.size = "6";
			input_12.maxLength = "7";
			addListener(input_12, "change", change_handler_12);
			encapsulateStyles$4(tr_17);
			encapsulateStyles$4(td_34);
			addListener(label_17, "click", click_handler_14);
			encapsulateStyles$4(td_35);
			encapsulateStyles$4(input_13);
			input_13.type = "color";
			input_13.name = "linkColor";
			input_13.value = state.$linkColor;
			input_13.size = "6";
			input_13.maxLength = "7";
			addListener(input_13, "change", change_handler_13);
			encapsulateStyles$4(tr_18);
			encapsulateStyles$4(td_36);
			addListener(label_18, "click", click_handler_15);
			encapsulateStyles$4(td_37);
			encapsulateStyles$4(input_14);
			input_14.name = "fontFace";
			input_14.value = state.$fontFace;
			addListener(input_14, "change", change_handler_14);
			encapsulateStyles$4(tr_19);
			encapsulateStyles$4(td_38);
			encapsulateStyles$4(td_39);
			button.className = "btn btn-sm btn-b";
			addListener(button, "click", click_handler_16);
			encapsulateStyles$4(tr_20);
			encapsulateStyles$4(td_40);
			addListener(label_19, "click", click_handler_17);
			encapsulateStyles$4(td_41);
			encapsulateStyles$4(textarea);
			textarea.name = "code";
			textarea.cols = "10";
			textarea.rows = "3";
			textarea.readOnly = true;
			textarea.value = state.$code;
			addListener(textarea, "click", click_handler_18);
			encapsulateStyles$4(tr_21);
			encapsulateStyles$4(td_42);
			addListener(label_20, "click", click_handler_19);
			td_42.className = "top";
			encapsulateStyles$4(td_43);
			td_43.className = "top";
			table.className = "table";
			addListener(form, "submit", submit_handler);
		},

		m: function mount(target, anchor) {
			insertNode(form, target, anchor);
			appendNode(table, form);
			appendNode(colgroup, table);
			appendNode(text_2, table);
			appendNode(tr, table);
			appendNode(td, tr);
			appendNode(label, td);
			appendNode(text_5, tr);
			appendNode(td_1, tr);
			appendNode(input, td_1);
			appendNode(text_8, table);
			appendNode(tr_1, table);
			appendNode(td_2, tr_1);
			appendNode(text_11, tr_1);
			appendNode(td_3, tr_1);
			appendNode(text_12, td_3);
			appendNode(text_14, table);
			appendNode(tr_2, table);
			appendNode(td_4, tr_2);
			appendNode(label_2, td_4);
			appendNode(text_17, tr_2);
			appendNode(td_5, tr_2);
			appendNode(details, td_5);
			appendNode(summary, details);
			appendNode(text_18, details);
			appendNode(text_19, details);
			appendNode(text_23, table);
			appendNode(tr_3, table);
			appendNode(td_6, tr_3);
			appendNode(text_26, tr_3);
			appendNode(td_7, tr_3);
			appendNode(text_27, td_7);
			appendNode(text_29, table);
			appendNode(tr_4, table);
			appendNode(td_8, tr_4);
			appendNode(text_32, tr_4);
			appendNode(td_9, tr_4);
			appendNode(a, td_9);
			appendNode(text_33, a);
			appendNode(text_34, a);
			appendNode(text_35, a);
			appendNode(text_37, table);
			appendNode(tr_5, table);
			appendNode(td_10, tr_5);
			appendNode(label_5, td_10);
			appendNode(text_40, tr_5);
			appendNode(td_11, tr_5);
			appendNode(input_1, td_11);
			appendNode(text_43, table);
			appendNode(tr_6, table);
			appendNode(td_12, tr_6);
			appendNode(label_6, td_12);
			appendNode(text_46, tr_6);
			appendNode(td_13, tr_6);
			appendNode(input_2, td_13);
			appendNode(text_47, td_13);
			appendNode(small, td_13);
			appendNode(text_51, table);
			appendNode(tr_7, table);
			appendNode(td_14, tr_7);
			appendNode(label_7, td_14);
			appendNode(text_54, tr_7);
			appendNode(td_15, tr_7);
			appendNode(input_3, td_15);
			appendNode(text_55, td_15);
			appendNode(small_1, td_15);
			appendNode(text_59, table);
			appendNode(tr_8, table);
			appendNode(td_16, tr_8);
			appendNode(label_8, td_16);
			appendNode(text_62, tr_8);
			appendNode(td_17, tr_8);
			appendNode(input_4, td_17);
			appendNode(text_63, td_17);
			appendNode(small_2, td_17);
			appendNode(text_67, table);
			appendNode(tr_9, table);
			appendNode(td_18, tr_9);
			appendNode(label_9, td_18);
			appendNode(text_70, tr_9);
			appendNode(td_19, tr_9);
			appendNode(input_5, td_19);
			appendNode(text_73, table);
			appendNode(tr_10, table);
			appendNode(td_20, tr_10);
			appendNode(label_10, td_20);
			appendNode(text_76, tr_10);
			appendNode(td_21, tr_10);
			appendNode(input_6, td_21);
			appendNode(text_79, table);
			appendNode(tr_11, table);
			appendNode(td_22, tr_11);
			appendNode(label_11, td_22);
			appendNode(text_82, tr_11);
			appendNode(td_23, tr_11);
			appendNode(input_7, td_23);
			appendNode(text_85, table);
			appendNode(tr_12, table);
			appendNode(td_24, tr_12);
			appendNode(label_12, td_24);
			appendNode(text_88, tr_12);
			appendNode(td_25, tr_12);
			appendNode(input_8, td_25);
			appendNode(text_91, table);
			appendNode(tr_13, table);
			appendNode(td_26, tr_13);
			appendNode(label_13, td_26);
			appendNode(text_94, tr_13);
			appendNode(td_27, tr_13);
			appendNode(input_9, td_27);
			appendNode(text_97, table);
			appendNode(tr_14, table);
			appendNode(td_28, tr_14);
			appendNode(label_14, td_28);
			appendNode(text_100, tr_14);
			appendNode(td_29, tr_14);
			appendNode(input_10, td_29);
			appendNode(text_103, table);
			appendNode(tr_15, table);
			appendNode(td_30, tr_15);
			appendNode(label_15, td_30);
			appendNode(text_106, tr_15);
			appendNode(td_31, tr_15);
			appendNode(input_11, td_31);
			appendNode(text_109, table);
			appendNode(tr_16, table);
			appendNode(td_32, tr_16);
			appendNode(label_16, td_32);
			appendNode(text_112, tr_16);
			appendNode(td_33, tr_16);
			appendNode(input_12, td_33);
			appendNode(text_115, table);
			appendNode(tr_17, table);
			appendNode(td_34, tr_17);
			appendNode(label_17, td_34);
			appendNode(text_118, tr_17);
			appendNode(td_35, tr_17);
			appendNode(input_13, td_35);
			appendNode(text_121, table);
			appendNode(tr_18, table);
			appendNode(td_36, tr_18);
			appendNode(label_18, td_36);
			appendNode(text_124, tr_18);
			appendNode(td_37, tr_18);
			appendNode(input_14, td_37);
			appendNode(text_127, table);
			appendNode(tr_19, table);
			appendNode(td_38, tr_19);
			appendNode(text_128, tr_19);
			appendNode(td_39, tr_19);
			appendNode(button, td_39);
			appendNode(text_132, table);
			appendNode(tr_20, table);
			appendNode(td_40, tr_20);
			appendNode(label_19, td_40);
			appendNode(text_136, tr_20);
			appendNode(td_41, tr_20);
			appendNode(textarea, td_41);
			appendNode(text_139, table);
			appendNode(tr_21, table);
			appendNode(td_42, tr_21);
			appendNode(label_20, td_42);
			appendNode(text_143, tr_21);
			appendNode(td_43, tr_21);
			referrers._mount(td_43, null);
		},

		p: function update(changed, state) {
			if (changed.$url) {
				input.value = state.$url;
			}

			if (changed.$title) {
				text_12.data = state.$title;
			}

			if (changed.$description) {
				text_19.data = state.$description;
			}

			if (changed.$formattedDate) {
				text_27.data = state.$formattedDate;
			}

			if (changed.$format) {
				text_33.data = state.$format;
			}

			if (changed.$version) {
				text_35.data = state.$version;
			}

			if (changed.$url) {
				a.href = state.$url;
			}

			if (changed.$maxItems) {
				input_1.value = state.$maxItems;
			}

			if (changed.$width) {
				input_2.value = state.$width;
			}

			if (changed.$height) {
				input_3.value = state.$height;
			}

			if (changed.$radius) {
				input_4.value = state.$radius;
			}

			if (changed.$showXmlButton) {
				input_5.checked = state.$showXmlButton;
			}

			if (changed.$headless) {
				input_6.checked = state.$headless;
			}

			if (changed.$compact) {
				input_7.checked = state.$compact;
			}

			if (changed.$frameColor) {
				input_8.value = state.$frameColor;
			}

			if (changed.$titleBarColor) {
				input_9.value = state.$titleBarColor;
			}

			if (changed.$titleBarTextColor) {
				input_10.value = state.$titleBarTextColor;
			}

			if (changed.$boxFillColor) {
				input_11.value = state.$boxFillColor;
			}

			if (changed.$textColor) {
				input_12.value = state.$textColor;
			}

			if (changed.$linkColor) {
				input_13.value = state.$linkColor;
			}

			if (changed.$fontFace) {
				input_14.value = state.$fontFace;
			}

			if (changed.$code) {
				textarea.value = state.$code;
			}
		},

		u: function unmount() {
			detachNode(form);
		},

		d: function destroy$$1() {
			removeListener(label, "click", click_handler);
			removeListener(input, "change", change_handler);
			removeListener(label_2, "click", click_handler_1);
			removeListener(label_5, "click", click_handler_2);
			removeListener(input_1, "change", change_handler_1);
			removeListener(label_6, "click", click_handler_3);
			removeListener(input_2, "change", change_handler_2);
			removeListener(label_7, "click", click_handler_4);
			removeListener(input_3, "change", change_handler_3);
			removeListener(label_8, "click", click_handler_5);
			removeListener(input_4, "change", change_handler_4);
			removeListener(label_9, "click", click_handler_6);
			removeListener(input_5, "change", change_handler_5);
			removeListener(label_10, "click", click_handler_7);
			removeListener(input_6, "change", change_handler_6);
			removeListener(label_11, "click", click_handler_8);
			removeListener(input_7, "change", change_handler_7);
			removeListener(label_12, "click", click_handler_9);
			removeListener(input_8, "change", change_handler_8);
			removeListener(label_13, "click", click_handler_10);
			removeListener(input_9, "change", change_handler_9);
			removeListener(label_14, "click", click_handler_11);
			removeListener(input_10, "change", change_handler_10);
			removeListener(label_15, "click", click_handler_12);
			removeListener(input_11, "change", change_handler_11);
			removeListener(label_16, "click", click_handler_13);
			removeListener(input_12, "change", change_handler_12);
			removeListener(label_17, "click", click_handler_14);
			removeListener(input_13, "change", change_handler_13);
			removeListener(label_18, "click", click_handler_15);
			removeListener(input_14, "change", change_handler_14);
			removeListener(button, "click", click_handler_16);
			removeListener(label_19, "click", click_handler_17);
			removeListener(textarea, "click", click_handler_18);
			removeListener(label_20, "click", click_handler_19);
			referrers.destroy(false);
			removeListener(form, "submit", submit_handler);
		}
	};
}

function Configurator(options) {
	this._debugName = '<Configurator>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(this.store._init(["url","title","description","formattedDate","format","version","maxItems","width","height","radius","showXmlButton","headless","compact","frameColor","titleBarColor","titleBarTextColor","boxFillColor","textColor","linkColor","fontFace","code"]), options.data);
	this.store._add(this, ["url","title","description","formattedDate","format","version","maxItems","width","height","radius","showXmlButton","headless","compact","frameColor","titleBarColor","titleBarTextColor","boxFillColor","textColor","linkColor","fontFace","code"]);
	if (!('$url' in this._state)) console.warn("<Configurator> was created without expected data property '$url'");
	if (!('$title' in this._state)) console.warn("<Configurator> was created without expected data property '$title'");
	if (!('$description' in this._state)) console.warn("<Configurator> was created without expected data property '$description'");
	if (!('$formattedDate' in this._state)) console.warn("<Configurator> was created without expected data property '$formattedDate'");
	if (!('$format' in this._state)) console.warn("<Configurator> was created without expected data property '$format'");
	if (!('$version' in this._state)) console.warn("<Configurator> was created without expected data property '$version'");
	if (!('$maxItems' in this._state)) console.warn("<Configurator> was created without expected data property '$maxItems'");
	if (!('$width' in this._state)) console.warn("<Configurator> was created without expected data property '$width'");
	if (!('$height' in this._state)) console.warn("<Configurator> was created without expected data property '$height'");
	if (!('$radius' in this._state)) console.warn("<Configurator> was created without expected data property '$radius'");
	if (!('$showXmlButton' in this._state)) console.warn("<Configurator> was created without expected data property '$showXmlButton'");
	if (!('$headless' in this._state)) console.warn("<Configurator> was created without expected data property '$headless'");
	if (!('$compact' in this._state)) console.warn("<Configurator> was created without expected data property '$compact'");
	if (!('$frameColor' in this._state)) console.warn("<Configurator> was created without expected data property '$frameColor'");
	if (!('$titleBarColor' in this._state)) console.warn("<Configurator> was created without expected data property '$titleBarColor'");
	if (!('$titleBarTextColor' in this._state)) console.warn("<Configurator> was created without expected data property '$titleBarTextColor'");
	if (!('$boxFillColor' in this._state)) console.warn("<Configurator> was created without expected data property '$boxFillColor'");
	if (!('$textColor' in this._state)) console.warn("<Configurator> was created without expected data property '$textColor'");
	if (!('$linkColor' in this._state)) console.warn("<Configurator> was created without expected data property '$linkColor'");
	if (!('$fontFace' in this._state)) console.warn("<Configurator> was created without expected data property '$fontFace'");
	if (!('$code' in this._state)) console.warn("<Configurator> was created without expected data property '$code'");

	this._handlers.destroy = [removeFromStore];

	if (!document.getElementById("svelte-293370740-style")) add_css$4();

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment$6(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);

		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign(Configurator.prototype, methods$1, protoDev);

Configurator.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/App.html generated by Svelte v1.50.0 */
function encapsulateStyles(node) {
	setAttribute(node, "svelte-1654232010", "");
}

function add_css() {
	var style = createElement("style");
	style.id = 'svelte-1654232010-style';
	style.textContent = ".row[svelte-1654232010]{padding-left:1em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLmh0bWwiLCJzb3VyY2VzIjpbIkFwcC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxCb3gvPlxuXG48ZGl2IGNsYXNzPSdyb3cnPlxuICA8ZGl2IGNsYXNzPSdjb2wgYzYnPlxuICAgIDxDb25maWd1cmF0b3IvPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz0nY29sIGM2Jz5cbiAgICA8QWQvPlxuICAgIDxBYm91dC8+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLnJvdyB7XG4gICAgcGFkZGluZy1sZWZ0OiAxZW07XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCBBYm91dCBmcm9tICcuL0Fib3V0Lmh0bWwnO1xuICBpbXBvcnQgQWQgZnJvbSAnLi9BZC5odG1sJztcbiAgaW1wb3J0IEJveCBmcm9tICcuL0JveC5odG1sJztcbiAgaW1wb3J0IENvbmZpZ3VyYXRvciBmcm9tICcuL0NvbmZpZ3VyYXRvci5odG1sJztcblxuICBleHBvcnQgZGVmYXVsdCB7XG4gICAgY29tcG9uZW50czoge1xuICAgICAgQWJvdXQsXG4gICAgICBBZCxcbiAgICAgIEJveCxcbiAgICAgIENvbmZpZ3VyYXRvclxuICAgIH1cbiAgfTtcbjwvc2NyaXB0PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWFFLElBQUksbUJBQUMsQ0FBQyxBQUNKLFlBQVksQ0FBRSxHQUFHLEFBQ25CLENBQUMifQ== */";
	appendNode(style, document.head);
}

function create_main_fragment(state, component) {
	var text, div, div_1, text_2, div_2, text_3;

	var box = new Box({
		root: component.root
	});

	var configurator = new Configurator({
		root: component.root
	});

	var ad = new Ad({
		root: component.root
	});

	var about = new About({
		root: component.root
	});

	return {
		c: function create() {
			box._fragment.c();
			text = createText("\n\n");
			div = createElement("div");
			div_1 = createElement("div");
			configurator._fragment.c();
			text_2 = createText("\n  ");
			div_2 = createElement("div");
			ad._fragment.c();
			text_3 = createText("\n    ");
			about._fragment.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles(div);
			div_1.className = "col c6";
			div_2.className = "col c6";
			div.className = "row";
		},

		m: function mount(target, anchor) {
			box._mount(target, anchor);
			insertNode(text, target, anchor);
			insertNode(div, target, anchor);
			appendNode(div_1, div);
			configurator._mount(div_1, null);
			appendNode(text_2, div);
			appendNode(div_2, div);
			ad._mount(div_2, null);
			appendNode(text_3, div_2);
			about._mount(div_2, null);
		},

		p: noop,

		u: function unmount() {
			box._unmount();
			detachNode(text);
			detachNode(div);
		},

		d: function destroy$$1() {
			box.destroy(false);
			configurator.destroy(false);
			ad.destroy(false);
			about.destroy(false);
		}
	};
}

function App(options) {
	this._debugName = '<App>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	if (!document.getElementById("svelte-1654232010-style")) add_css();

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);

		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign(App.prototype, protoDev);

App.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

const getQuery = () => {
  const query = [];

  KEYS.forEach(key => {
    const value = store.get(key);
    if (!value) return;
    query.push(key + '=' + encodeURIComponent(value));
  });

  return query.join('&');
};

const store = new RssStore('https://blog.p3k.org/stories.xml');

store.compute('code', KEYS, () => {
  const query = getQuery().replace(/&/g, '&amp;');
  return `<script src='${URLS$$1.base}/main.js?${query}'></script>`;
});

const app = new App({
  target: document.querySelector('main'),
  store
});

store.set({
  appDescription: description,
  appVersion: version,
  boxFillColor: '#ffead2',
  compact: false,
  fontFace: '10pt sans-serif',
  frameColor: '#b3a28e',
  headless: false,
  height: -1,
  linkColor: '#2c7395',
  maxItems: 7,
  radius: 5,
  showXmlButton: true,
  textColor: '#95412b',
  titleBarColor: '#90a8b3',
  titleBarTextColor: '#ffead2',
  width: 200
});

// For debugging
//window.store = store;

return app;

}());
//# sourceMappingURL=app.js.map
