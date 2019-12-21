(function () {
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

function createSvgElement(name) {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
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

function isPromise(value) {
	return value && typeof value.then === 'function';
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
  const DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/';
  const RDF_NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  const ISO_DATE_PATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

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

  const getChildElement = function(name, parent, namespace) {
    if (!name || !parent) return null;
    let method = 'getElementsByTagName';
    if (namespace) method += 'NS';
    return parent[method](name, namespace)[0];
  };

  const getText = function(node) {
    if (!node) return '';
    if (node.length) node = node[0];
    return node.textContent;
  };

  const error = Error('Malformed RSS syntax');

  const parseRss = function(root, type) {
    const rss = { items: [] };
    const channel = getChildElement('channel', root);

    if (!channel) throw error;

    rss.format = 'RSS';
    rss.version = type === 'rdf:RDF' ? '1.0' : root.getAttribute('version');
    rss.title = getText(getChildElement('title', channel));
    rss.description = getText(getChildElement('description', channel));
    rss.link = getText(getChildElement('link', channel));

    const image = getChildElement('image', channel);

    rss.image = image
      ? {
          source: getText(getChildElement('url', image)) || image.getAttributeNS(RDF_NAMESPACE, 'resource'),
          title: getText(getChildElement('title', image)),
          link: getText(getChildElement('link', image)),
          width: getText(getChildElement('width', image)),
          height: getText(getChildElement('height', image)),
          description: getText(getChildElement('description', image))
        }
      : '';

    if (type === 'rdf:RDF') {
      const date = channel.getElementsByTagNameNS(DC_NAMESPACE, 'date');
      rss.date = getDate(getText(date));
      rss.rights = getText(channel.getElementsByTagNameNS(DC_NAMESPACE, 'creator'));

      const textInput = getChildElement('textinput', root);

      rss.input = textInput
        ? {
            link: getText(getChildElement('link', textInput)),
            description: getText(getChildElement('description', textInput)),
            name: getText(getChildElement('name', textInput)),
            title: getText(getChildElement('title', textInput))
          }
        : '';
    } else {
      rss.date = getDate(
        getText(getChildElement('lastBuildDate', channel)) || getText(getChildElement('pubDate', channel))
      );
      rss.rights = getText(getChildElement('copyright', channel));
    }

    // Create a native Array from HTMLCollection
    const items = Array.apply(null, root.getElementsByTagName('item'));

    items.forEach(node => {
      const item = {
        title: getText(getChildElement('title', node)),
        description: getText(getChildElement('description', node)),
        link: getText(getChildElement('link', node)) || getText(getChildElement('guid', node))
      };

      if (!item.description) {
        let content = getText(getChildElement('encoded', node, 'content'));
        if (content) {
          item.description = content;
        } else {
          content = getText(getChildElement('encoded', node));
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

  const parseAtom = function(root) {
    const rss = { items: [] };

    rss.format = 'Atom';
    rss.version = '1.0';
    rss.title = getText(getChildElement('title', root));
    rss.description = getText(getChildElement('subtitle', root));
    rss.image = '';

    const link = getChildElement('link:not([self])', root);
    if (link) rss.link = link.getAttribute('href');

    rss.date = getDate(getChildElement('updated', root));

    const entries = Array.apply(null, root.getElementsByTagName('entry'));

    entries.forEach(node => {
      const item = {
        title: getText(getChildElement('title', node)),
        description: getText(getChildElement('summary', node))
      };

      const link = getChildElement('link', node);
      if (link) item.link = link.getAttribute('href');

      rss.items.push(item);
    });

    return rss;
  };

  const parseScriptingNews = function(root) {
    const rss = { items: [] };
    const channel = getChildElement('header', root);

    if (!channel) throw error;

    rss.format = 'Scripting News';
    rss.version = getText(getChildElement('scriptingNewsVersion', channel));
    rss.title = getText(getChildElement('channelTitle', channel));
    rss.description = getText(getChildElement('channelDescription', channel));
    rss.link = getText(getChildElement('channelLink', channel));

    rss.date = getDate(
      getText(getChildElement('lastBuildDate', channel)) || getText(getChildElement('pubDate', channel))
    );

    const imageUrl = getChildElement('imageUrl', channel);

    if (imageUrl) {
      rss.image = {
        source: getText(imageUrl),
        title: getText(getChildElement('imageTitle', channel)),
        link: getText(getChildElement('imageLink', channel)),
        width: getText(getChildElement('imageWidth', channel)),
        height: getText(getChildElement('imageHeight', channel)),
        description: getText(getChildElement('imageCaption', channel))
      };
    }

    const items = Array.apply(null, root.getElementsByTagName('item'));

    items.forEach(node => {
      const item = { title: '' };

      item.description = getText(getChildElement('text', node)).replace(/\n/g, ' ');

      const link = getChildElement('link', node);

      if (link) {
        const text = getText(getChildElement('linetext', link))
          .replace(/\n/g, ' ')
          .trim();
        if (text) {
          item.description = item.description.replace(
            new RegExp(text),
            '<a href="' + getText(getChildElement('url', node)) + '">' + text + '</a>'
          );
        }
        item.link = getText(getChildElement('url', link));
      }

      addItemExtensions(node, item);
      rss.items.push(item);
    });

    return rss;
  };

  const addItemExtensions = function(node, item) {
    const source = getChildElement('source', node);
    // Create a native Array from HTMLCollection
    const enclosures = Array.apply(null, node.getElementsByTagName('enclosure'));
    const category = getChildElement('category', node);

    if (source) {
      item.source = {
        url: source.getAttribute('url'),
        title: source.textContent
      };
    }

    item.enclosures = enclosures.map(enclosure => {
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
      const root = doc.documentElement;
      const type = root.nodeName;

      switch (type) {
        case 'feed':
          return parseAtom(root);

        case 'scriptingNews':
          return parseScriptingNews(root);

        default:
          return parseRss(root, type);
      }
    }
  };
}

const mode = 'dev';
const stage = 'https://20191215t133215-dot-p3k-services.appspot.com';

const urls$1 = (settings => settings[mode] || {})({
  stage: {
    app: 'https://p3k.org/rss-stage',
    proxy: stage + '/roxy',
    referrers: stage + '/ferris?group=test'
  },

  mixed: {
    app: 'http://localhost:8000',
    proxy: stage + '/roxy',
    referrers: stage + '/ferris?group=rssbox'
  },

  prod: {
    app: 'https://p3k.org/rss',
    proxy: 'https://p3k-services.appspot.com/roxy',
    referrers: 'https://p3k-services.appspot.com/ferris?group=rssbox',
    default: 'https://blog.p3k.org/stories.xml'
  }
});

//urls.default = urls.app + '/test/sampleRssAtom.xml';
//urls.default = 'http://www.wienerzeitung.at/_export/rss/nachrichten/schlagzeilen/index.rss';

const keys = [
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

const baseUrl = 'http://localhost';

const urls$$1 = {
  app: baseUrl + ':8000',
  proxy: baseUrl + ':8080/roxy',
  referrers: baseUrl + ':8080/ferris?group=rssbox',
  default: 'https://blog.p3k.org/stories.xml'
};

for (let key in urls$$1) {
  if (key in urls$1) urls$$1[key] = urls$1[key];
}

const defaultError = {
  loading: false,
  compact: false,
  maxItems: 3,
  format: 'Error',
  version: '❌',
  title: 'RSS Box Error',
  description:
    'This output was automatically generated to report an error that occurred during a request to the  RSS Box Viewer.',
  items: [
    {
      title: 'Oops, something went wrong…',
      description: 'An error occurred while processing the request to the RSS Box Viewer.'
    },
    {
      title: 'The following error message was returned:',
      description: 'Unknown error'
    },
    { title: '' }
  ]
};

function error(url, message) {
  const error = Object.assign({}, defaultError);
  error.link = urls$$1.app + '?url=' + url;
  error.items[1].description = message;
  error.items[2].description = `Most likely, this might have happened because of a non-existent or invalid RSS feed URL. <a href="https://validator.w3.org/feed/check.cgi?url=${url}">Please check</a> and possibly correct your input, then try again.`;
  return error;
}

class RssStore extends Store {
  constructor() {
    const settings = {
      date: new Date(),
      description: '',
      format: '',
      image: '',
      input: '',
      items: [],
      title: '',
      version: ''
    };

    super(settings);

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

    this.observe('url', this.fetch, { init: false });
  }

  fetch() {
    const url = this.get('url');
    if (!url) return;

    this.set({ loading: true });

    fetch(urls$$1.proxy + '?url=' + encodeURIComponent(url))
      .then(res => {
        if (!res.ok) throw Error(res.statusText);

        res
          .text()
          .then(json => {
            const parser = RssParser();
            const data = JSON.parse(json);
            if (data.headers['X-Roxy-Error']) throw Error(data.headers['X-Roxy-Error']);
            const rss = parser.parse(data.content);
            if (!rss.date) rss.date = new Date(data.headers.date);
            rss.loading = false;
            this.set(rss);
          })
          .catch(message => {
            this.set(error(url, message));
            console.error(message);
          });
      })
      .catch(message => {
        this.set(error(url, message));
        console.error(message);
      });
  }
}

var version = "19.12.15";
var description = "RSS Box Viewer";

/* components/Changes.html generated by Svelte v1.50.0 */
function encapsulateStyles$1(node) {
	setAttribute(node, "svelte-2837112113", "");
}

function add_css$1() {
	var style = createElement("style");
	style.id = 'svelte-2837112113-style';
	style.textContent = "h3[svelte-2837112113]{display:inline-block}h3+p[svelte-2837112113],summary+[svelte-2837112113]{margin-top:0}summary[svelte-2837112113]{outline:none}li+li[svelte-2837112113]{margin-top:0.5em}small[svelte-2837112113]{display:inline-block;margin-right:0.5em;color:#bbb}code[svelte-2837112113]{background-color:#ffc;font-size:0.8em;font-weight:200}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhbmdlcy5odG1sIiwic291cmNlcyI6WyJDaGFuZ2VzLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPGRldGFpbHM+XG4gIDxzdW1tYXJ5PlxuICAgIDxoMz5DaGFuZ2UgTG9nPC9oMz5cbiAgPC9zdW1tYXJ5PlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDE5LTEyLTE1PC9zbWFsbD5cbiAgICBVcGdyYWRlZCB0aGUgSlNPTlAgcHJveHkgdG8gUHl0aG9uIDMuNyBhbmQgc2xpZ2h0bHkgcmV0b3VjaGVkIHRoZSBjb25maWd1cmF0aW9uIGZvcm0uIEEgbWVycnkgZW5kaW5nIGZvciAyMDE5IGFuZCBhIGhhcHB5IG5ldyB5ZWFyIPCfjokgPGVtPkl04oCZcyBoaW5kc2lnaHQhPGVtPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTgtMDEtMTk8L3NtYWxsPlxuICAgIE1vcmUgdGhhbiAxNSB5ZWFycyAoYW5kIHN0aWxsIGNvdW50aW5n4oCmKSBhZnRlciBpdHMgaW5jZXB0aW9uIHRoaXMgbGl0dGxlIHNlcnZpY2UgaXMgc3RpbGwgbGl2ZSBhbmQga2lja2luZyEgVGhlIGJlc3QgcGFydCBvZiB0aGlzIGhvYmJ5IHByb2plY3TigJlzIGxvbmctcnVubmluZyB0cmFpdDogdGhpcyB5ZWFyIGJyaW5ncyBhIGNvbXBsZXRlIHJld3JpdGUgYW5kIG92ZXJoYXVsIHdpdGggYW4gZXh0ZW5zaXZlIGxpc3Qgb2YgdXBkYXRlcyDigJMgYW5kIG9ubHkgc21hbGwgY2hhbmdlcyBpbiBmdW5jdGlvbmFsaXR5OlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+QWRkZWQgYmFzaWMgc3VwcG9ydCBmb3IgQXRvbSAxLjAgZmVlZHMg8J+UpTwvbGk+XG4gICAgPGxpPkFkZGVkIHN1cHBvcnQgZm9yIG11bHRpcGxlIGVuY2xvc3VyZXMgKFJTUyAwLjkzKTwvbGk+XG4gICAgPGxpPlJlcGxhY2VkIHZhbHVlIG9mIC0xIGZvciBhdXRvbWF0aWMgY29udGVudCBoZWlnaHQgd2l0aCDigJxlbXB0eeKAnSB2YWx1ZTwvbGk+XG4gICAgPGxpPkFkZGVkIHN1cHBvcnQgZm9yIOKAnGVtcHR54oCdIHZhbHVlIHRvIGJveCB3aWR0aCAobm93IGNhbGxlZCDigJ1tYXguIHdpZHRo4oCdKTwvbGk+XG4gICAgPGxpPlJlZHVjZWQgdG90YWwgc2l6ZSBvZiBlbWJlZGRlZCBkb3dubG9hZCBieSBtb3JlIHRoYW4gNjAlIOKaoTwvbGk+XG4gICAgPGxpPkluY3JlYXNlZCBwZXJmb3JtYW5jZSBvZiBsb2FkaW5nIGFuZCByZW5kZXJpbmcgYm94ZXM8L2xpPlxuICAgIDxsaT5JbXBsZW1lbnRlZCByZXNwb25zaXZlIENTUyBmb3IgYm90aCwgYm94ZXMgYW5kIGNvbmZpZ3VyYXRpb24gYXBwPC9saT5cbiAgICA8bGk+UmVwbGFjZWQgYml0bWFwIGljb25zIHdpdGggc2NhbGFibGUgdmVjdG9yIGdyYXBoaWNzPC9saT5cbiAgICA8bGk+Q29tcGxldGVseSByZXdyb3RlIHRoZSBhcHAgY29kZSB1c2luZyA8YSBocmVmPSdodHRwczovL3N2ZWx0ZS50ZWNobm9sb2d5Jz5TdmVsdGU8L2E+IGFuZCA8YSBocmVmPSdodHRwczovL21pbmNzcy5jb20vJz5taW4uY3NzPC9hPjwvbGk+XG4gICAgPGxpPlJlcGxhY2VkIHJlbWFpbmluZyBqUXVlcnkgY29kZSB3aXRoIHZhbmlsbGEgSmF2YVNjcmlwdDwvbGk+XG4gICAgPGxpPk1pZ3JhdGVkIGJ1aWxkIHNjcmlwdHMgdG8gUm9sbHVwIGFuZCBZYXJuPC9saT5cbiAgICA8bGk+QWRkZWQgc3VwcG9ydCBmb3IgbWlzc2luZyBicm93c2VyIGZlYXR1cmVzIHZpYSA8YSBocmVmPSdodHRwczovL3BvbHlmaWxscy5pbyc+cG9seWZpbGxzLmlvPC9hPjwvbGk+XG4gICAgPGxpPkRpc2NvbnRpbnVlZCBzdXBwb3J0IGZvciBvbGRlciBicm93c2VycyAoTVNJRSAmbHQ7IDExKTwvbGk+XG4gICAgPGxpPkJ1bXBlZCBtYWpvciB2ZXJzaW9uIHRvIDE4IChha2EgdGhlIHllYXIpLCBnZXR0aW5nIHJpZCBvZiBzZW1hbnRpYyB2ZXJzaW9uaW5nIGR1ZSB0byBsYWNrIG9mIHNlbWFudGljcyDwn5CxPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxNi0wMy0xMjwvc21hbGw+XG4gICAgQ29tcGxldGVseSByZXdyb3RlIGJ1aWxkIGVudmlyb25tZW50IHVzaW5nIFdlYlBhY2suIFN3aXRjaGVkIHRoZSA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vcDNrL3Jzcy1ib3gnPnNvdXJjZSByZXBvc2l0b3J5PC9hPiBmcm9tIFNWTiB0byBHaXQsIGhvc3RlZCBhdCBHaXRodWIuIFRoaXMgZGVzZXJ2ZXMgYSBuZXcgbWFqb3IgdmVyc2lvbiBudW1iZXIhXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0xMi0zMDwvc21hbGw+XG4gICAgQWRkZWQgc2ltcGxlIGNvZGUgdG8gbW9kaWZ5IHRoZSB3aWR0aCBhdHRyaWJ1dGUgb2YgaWZyYW1lLCBvYmplY3QgYW5kIGVtYmVkIGVsZW1lbnRzIHRvIG1ha2UgdGhlbSBmaXQgaW4gdGhlIGJveC4gQWxzbzogYnVtcGVkIHZlcnNpb24uIDxpPkEgaGFwcHkgbmV3IHllYXIgMjAxMywgZXZlcmJvZHkhPC9pPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMTAtMjY8L3NtYWxsPlxuICAgIEFkZGVkIHNlY3Rpb24gYWJvdXQgQ3JlYXRpdmUgQ29tbW9ucyBMaWNlbnNlLCBiZWxvdy4gSW4gb3RoZXIgd29yZHM6IHlvdSBjYW4gbm93IGxlZ2FsbHkgcnVuIG15IGNvZGUgb24geW91ciBvd24gc2VydmVyLiAoWW91IGV2ZW4gY291bGQgcmVtb3ZlIHRoZSB0aW55IHJlZmVyZW5jZSB0byB0aGlzIHBhZ2UgaW4gdGhlIGZvb3RlciBvZiB0aGUgYm94LikgSG93ZXZlciwgSSB3b3VsZCBsaWtlIHRvIGFzayB5b3UgZm9yIHR3byB0aGluZ3MgaWYgeW91IHdhbnQgdG8gZG8gc286XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIFVzZSB5b3VyIG93biA8YSBocmVmPScvL2dpdGh1Yi5jb20vcDNrL2pzb24zayc+SlNPTlAgcHJveHk8L2E+IOKAkyBlc3BlY2lhbGx5LCB3aGVuIHlvdSBleHBlY3QgYSBoaWdoIGxvYWQgb24geW91ciBzZXJ2ZXIuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBQbGVhc2Ugc3VwcG9ydCB0aGUgc2VydmljZSB3aXRoIGEgPGEgaHJlZj0naHR0cDovL2ZsYXR0ci5jb20vdGhpbmcvNjgxODgxL0phdmFTY3JpcHQtUlNTLUJveC1WaWV3ZXInPmRvbmF0aW9uPC9hPi5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA4LTAxPC9zbWFsbD5cbiAgICBBZGRlZCB0d28gbmV3LCBleHBlcmltZW50YWwgZmVhdHVyZXMg4oCTIGFuZCB0aHVzLCBpbmNyZWFzZWQgdmVyc2lvbiB0byAzLjM6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIFRoZSBoZWlnaHQgb2YgdGhlIGlubmVyIGJveCBjb250ZW50IGNhbiBub3cgYmUgZGVmaW5lZCBieSBhIHBpeGVsIHZhbHVlLiBJZiB0aGUgaGVpZ2h0IGlzIGxlc3MgdGhhbiB0aGUgc3BhY2UgbmVlZGVkIGJ5IHRoZSBkZXNpcmVkIGFtb3VudCBvZiBpdGVtcyB5b3UgY2FuIHZlcnRpY2FsbHkgc2Nyb2xsIHRoZSBjb250ZW50LiBBIHZhbHVlIG9mIDxjb2RlPi0xPC9jb2RlPiBlbmFibGVzIHRoZSBkZWZhdWx0IGJlaGF2aW9yIGFuZCBhdXRvbWF0aWNhbGx5IHNldHMgdGhlIGhlaWdodCBhY2NvcmRpbmcgdG8gdGhlIGRpc3BsYXlpbmcgaXRlbXMuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBUaGUgc28tY2FsbGVkIOKAnGhlYWRsZXNz4oCdIG1vZGUgcmVtb3ZlcyB0aGUgdGl0bGViYXIgYW5kIHRoZSBmcmFtZSBmcm9tIHRoZSBib3guIFRoaXMgd2F5IHRoZSBib3ggY2FuIGJlIHVzZWQgbW9yZSBmbGV4aWJseSBpbiBzcGVjaWFsIHNpdHVhdGlvbnMuIEhvd2V2ZXIsIHRoaXMgZmVhdHVyZSBzb21laG93IHVuZGVybWluZXMgYW4gUlNTIGZlZWTigJlzIGF1dGhvcml0eSBzbyBJIGNvdW50IG9uIHlvdXIgZmFpcm5lc3MgdG8gZ2l2ZSBjcmVkaXQgd2hlcmUgY3JlZGl0IGlzIGR1ZSFcbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA3LTE2PC9zbWFsbD5cbiAgICBTbGlnaHRseSBtb2RpZmllZCBvdXRwdXQgb2YgdGhlIEhUTUwgY29kZSB0byBiZSB1c2FibGUgd2l0aCBib3RoLCB1bnNlY3VyZWQgYW5kIHNlY3VyZWQgKEhUVFBTKSB3ZWIgc2VydmVycy4gWW91IGNhbiB1cGRhdGUgYWxyZWFkeSBlbWJlZGRlZCBjb2RlIGVhc2lseSBieSByZW1vdmluZyB0aGUgPGNvZGU+aHR0cDo8L2NvZGU+IHBhcnQgZnJvbSB0aGUgPGNvZGU+c3JjPC9jb2RlPiBhdHRyaWJ1dGUgb2YgdGhlIDxjb2RlPiZhbXA7bHQ7c2NyaXB0JmFtcDtndDs8L2NvZGU+IGVsZW1lbnQ6IDxjb2RlPiZhbXA7bHQ7c2NyaXB0IHNyYz0naHR0cDovL3Azay5vcmcvcnNz4oCmJyZhbXA7Z3Q7PC9jb2RlPiBiZWNvbWVzIDxjb2RlPiZhbXA7bHQ7c2NyaXB0IHNyYz0nLy9wM2sub3JnL3Jzc+KApicmYW1wO2d0OzwvY29kZT4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNy0xMzwvc21hbGw+XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEZpeGVkIElFIGJ1ZyAo4oCcaW5uZXJIVE1MIGlzIG51bGwgb3Igbm90IGFuIG9iamVjdOKAnSkgY2F1c2VkIGJ5IHVzaW5nIGpRdWVyeeKAmXMgaHRtbCgpIG1ldGhvZCBpbnN0ZWFkIG9mIHRleHQoKSB3aGVuIHBhcnNpbmcgYSA8Y29kZT4mYW1wO2x0O2NvbnRlbnQ6ZW5jb2RlZCZhbXA7Z3Q7PC9jb2RlPiBlbGVtZW50LlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQ2hhbmdlZCBwcmlvcml0eSBvZiBlbGVtZW50czogb25seSBjaGVjayBmb3IgPGNvZGU+JmFtcDtsdDtjb250ZW50OmVuY29kZWQmYW1wO2d0OzwvY29kZT4gaWYgICAgIDxjb2RlPiZhbXA7bHQ7ZGVzY3JpcHRpb24mYW1wO2d0OzwvY29kZT4gaXMgbm90IGF2YWlsYWJsZS5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA2LTA0PC9zbWFsbD5cbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgSW1wbGVtZW50ZWQgc21hbGwgcm91dGluZSB0byByZXNpemUgaW1hZ2VzIGNvbnRhaW5lZCBpbiB0aGUgZmVlZCBjb250ZW50IHRvIGZpdCBpbiB0aGUgYm94LlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgc3VwcG9ydCBmb3IgbmV3IEhUTUw1IGZvcm0gaW5wdXQgdHlwZXMgYW5kIHRoZWlyIHZhbGlkYXRpb24uXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0zMTwvc21hbGw+XG4gICAgR29uZSAmYmV0YTtldGEhIOKAkyB3aXRoIHRocmVlIHRpbnkgYWRkaXRvbnM6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIDxjb2RlPiZhbXA7bHQ7bm9zY3JpcHQmYW1wO2d0OzwvY29kZT4gZWxlbWVudCBmb3IgYnJvd3NlcnMgcHJvdmlkaW5nIG5vIEphdmFTY3JpcHQgZW5naW5lLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgb3B0aW9uIHRvIGNhbGwgdGhlIGNvbmZpZ3VyYXRvciB3aXRoIGEgVVJMIGluIHRoZSBxdWVyeSBzdHJpbmcuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBhIGxpbmsgdG8gdGhlIFczQyBmZWVkIHZhbGlkYXRvciB0byB0aGUgY29udGVudHMgb2YgYSBib3ggZGlzcGxheWluZyBhbiBSU1MgZXJyb3IuXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0xOTwvc21hbGw+XG4gICAgQXBvbG9naWVzIGZvciB0aGUgUlNTIEJveGVzIG5vdCBzaG93aW5nIHVwIG9uIHlvdXIgcGFnZXMgZHVyaW5nIHRoZSBsYXN0IGZldyBkYXlzLiBJIG1hZGUgYSBzdHVwaWQgbWlzdGFrZSB0aGF0IGNhdXNlZCBvbmx5IHRoZSBzZXR1cCBwYWdlIHRvIHJlbmRlciBjb3JyZWN0bHkg4oCTIGFuZCBJIGRpZCBub3QgY2hlY2sgYW55IGVtYmVkZGVkIHNjcmlwdC4gPGk+QnVtbWVyITwvaT5cbiAgPC9wPlxuICA8cD5cbiAgICBBdCBsZWFzdCBub3cgZXZlcnl0aGluZyBzaG91bGQgYmUgYmFjayB0byBub3JtYWwuIChJIGhvcGUgdGhpcyBpbmNpZGVudCBkaWQgbm90IHNhYm90YWdlIHRoZSBGbGF0dHIgYnV0dG9uIEkgYWRkZWQgaW4gdGhlIG1lYW50aW1l4oCmIDxpPndpbmssIHdpbmshPC9pPilcbiAgPC9wPlxuICA8cD5Bbnl3YXksIHRoYW5rcyBmb3IgeW91ciB1bmRlcnN0YW5kaW5nLjwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0xNjwvc21hbGw+XG4gICAgSSB0aGluayBJIGRpZCBub3QgbWVudGlvbiwgeWV0LCB0aGF0IHRoZSBjdXJyZW50IGluY2FybmF0aW9uIG9mIHRoZSBjb2RlIGlzIHRvdGFsbHkgZGlzY29ubmVjdGVkIGZyb20gdGhlIHZlcnNpb24gYXMgb2YgMjAwOS4gRWFjaCBpcyB1c2luZyB0aGVpciBvd24gY29kZWJhc2UsIHRoZSBsZWdhY3kgY29kZSB3YXMgbm90IG1vZGlmaWVkIGF0IGFsbCBhbmQgdGh1cywgaXQgaXMgbm90IGFmZmVjdGVkIGJ5IGFueSByZWNlbnQgY2hhbmdlcy4gWW91IGNhbiBjaGVjayB3aGljaCB2ZXJzaW9uIHlvdSBhcmUgdXNpbmcgYnkgbG9va2luZyBhdCB0aGUgc2NyaXB0IFVSTC4gSWYgaXQgY29udGFpbnMgdGhlIHN0cmluZyDigJxwcm94eS5y4oCdIHlvdSBnZXQgdGhlIOKAnGNsYXNzaWPigJ0gUlNTIEJveCByZW5kZXJpbmcuIFRoZSBtb2Rlcm5pemVkIHZlcnNpb24gY2FsbHMg4oCcaW5kZXguanPigJ0uIE5ldmVydGhlbGVzcywgeW91IGNhbm5vdCBzZXR1cCBib3hlcyB3aXRoIHRoZSBvbGQgVVJMIGFueW1vcmUuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0wOTwvc21hbGw+XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIHN1cHBvcnQgZm9yIDxjb2RlPiZhbXA7bHQ7Y29udGVudDplbmNvZGVkJmFtcDtndDs8L2NvZGU+IGVsZW1lbnQuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBJbXBsZW1lbnRlZCBNZW1jYWNoZSB1c2FnZSBpbiBBcHBFbmdpbmUgY29kZS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEJlYXV0aWZpZWQgdGhpcyBwYWdlIGJ5IHVzaW5nIHRoZSA8YSBocmVmPSdodHRwOi8vd3d3Lmdvb2dsZS5jb20vd2ViZm9udHMvc3BlY2ltZW4vRHJvaWQrU2VyaWYnPkdvb2dsZeKAmXMgRHJvaWQgU2VyaWYgZm9udDwvYT4uXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNC0yNjwvc21hbGw+XG4gICAgQW1hemluZyEgQSBuZXcgdmVyc2lvbiEgQWZ0ZXIgbW9yZSB0aGFuIHR3byB5ZWFycyBoaWF0dXMgSSBjb21wbGV0ZWx5IHJld3JvdGUgdGhlIGNvZGViYXNlIGFuZCBmcmFtZXdvcms6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIFJlbW92ZWQgZGVwZW5kZW5jeSB0byBSZWJvbCB1c2luZyBhIHNtYWxsIEpTT05QIHByb3h5IGF0IEdvb2dsZeKAmXMgQXBwRW5naW5lLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUmV3cm90ZSBYTUwgcGFyc2luZywgcmVwbGFjaW5nIG5hdGl2ZSBtZXRob2RzIHdpdGggalF1ZXJ5IG9uZXMuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBDbGVhbmVkIHVwIEhUTUwgb3V0cHV0IGZvciB0aGUgUlNTIEJveCwgcmVwbGFjaW5nIHRhYmxlcyB3aXRoIGRpdnMuIDxpPk5vdGU6IFlvdSBtaWdodCBuZWVkIHRvIGFkZCA8Y29kZT48YSBocmVmPSdodHRwOi8vY29kaW5nLnNtYXNoaW5nbWFnYXppbmUuY29tLzIwMTAvMTEvMDIvdGhlLWltcG9ydGFudC1jc3MtZGVjbGFyYXRpb24taG93LWFuZC13aGVuLXRvLXVzZS1pdC8nPiFpbXBvcnRhbnQ8L2E+PC9jb2RlPiB0byB5b3VyIGN1c3RvbSBSU1MgQm94IHN0eWxlc2hlZXQgZGVmaW5pdGlvbnMuPC9pPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUmVwbGFjZWQgZnVnbHkgY29sb3JwaWNrZXIgaW4gY29uZmlndXJhdG9yIHdpdGggdGhlIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9jbGF2aXNrYS9qcXVlcnktbWluaUNvbG9ycy8nPk1pbmlDb2xvcnMgalF1ZXJ5IHBsdWdpbjwvYT4uXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBsaW5rIGNvbG9yIHNldHRpbmcgYW5kIHN0eWxlIGF0dHJpYnV0ZXMgZm9yIGNvcnJlY3RseSBhcHBseWluZyBjb2xvciBzZXR0aW5ncy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGNvcm5lciByYWRpdXMgc2V0dGluZy4gPGk+Tm90ZTogZG9lcyBub3Qgd29yayBpbiBJRTggYW5kIGVhcmxpZXIgdmVyc2lvbnMuPC9pPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgZm9udCBzaXplIHRvIHRoZSBmb250IGZhY2Ugc2V0dGluZy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFJlbW92ZWQgYWxpZ24gc2V0dGluZyBmcm9tIGNvbmZpZ3VyYXRvciAoc3RpbGwgd29ya3MgaW4gc2NyaXB0IHRhZ3MgZ2VuZXJhdGVkIHdpdGggZWFybGllciB2ZXJzaW9ucykuXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOS0xMi0xMzwvc21hbGw+XG4gICAgU3dpdGNoZWQgb3V0cHV0IG9mIHRoaXMgcGFnZSB0byBIVE1MNSBhbmQgbWFkZSBzb21lIGFkYXB0YXRpb25zIGluIHRoZSBIVE1MIGNvZGUgYW5kIENTUyBzdHlsZXNoZWV0LiBVcGRhdGVkIHZlcnNpb24gc3RyaW5nIHRvIDIuMSwgZmluYWxseSFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA5LTA5LTI4PC9zbWFsbD5cbiAgICBTb21lIG1pbm9yIGNoYW5nZXMgYWZ0ZXIgYSB3aGlsZTpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlJlZmFjdG9yZWQgZGF0ZSBwYXJzaW5nIHRvIHNob3cgYWN0dWFsIGJ1aWxkIGRhdGVzIG1vcmUgcmVsaWFibHk8L2xpPlxuICAgIDxsaT5SZWZhY3RvcmVkIGNhY2hpbmcgcm91dGluZSAob25seSBpbiBvbmxpbmUgdmVyc2lvbik8L2xpPlxuICAgIDxsaT5VcGRhdGVkIHZlcnNpb24gc3RyaW5nIHRvIDIuMWIsIGFwcHJvYWNoaW5nIGFub3RoZXIgZmluYWwgdmVyc2lvbi48L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA4LTAyLTE5PC9zbWFsbD5cbiAgICBTZWVtcyB0aGVyZSB3ZXJlIHNvbWUgY2hhbmdlcyBpbiB0aGUgYWlyIGFzIEkgZGlkIG5vdCBwbGFuIGFub3RoZXIgdXBkYXRlIGJ1dCBoZXJlIGNvbWVzIHZlcnNpb24gMi4xIGJyaW5naW5nIHRvIHlvdTpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgRnVsbCBjbGllbnQtc2lkZSBwcm9jZXNzaW5nIChvbmx5IHRoZSByYXcgZmVlZCBkYXRhIGlzIGZldGNoZWQgZnJvbSB0aGUgc2VydmVyKS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFVzZXItZnJpZW5kbGllciBpbnRlcmZhY2Ugd2l0aCBjb2xvciBwaWNrZXJzLCBzdGF0dXMgYW5kIGVycm9yIGRpc3BsYXkgYXMgd2VsbCBhcyBpbnN0YW50IGZlZWRiYWNrIG9uIGFueSBjaGFuZ2UgaW4gc2V0dXAuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBbmQgZmluYWxseSAoZHJ1bXJvbGwhKSBVbmljb2RlIHN1cHBvcnQgYXQgbGVhc3QgYXQgdGhpcyBpbnN0YWxsYXRpb24gb2YgdGhlIHZpZXdlci4gKEllLiB0aGUgZG93bmxvYWRlZCB2ZXJzaW9uIHN0aWxsIHdpbGwgb3V0cHV0IEFTQ0lJIG9ubHkuKVxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDgtMDItMDM8L3NtYWxsPlxuICAgIE1hZGUgc29tZSBtb3JlIGltcHJvdmVtZW50cyBlc3BlY2lhbGx5IHJlZ2FyZGluZyB0aGUgZXJyb3IgaGFuZGxpbmcgYW5kIG91dHB1dC4gRnJvbSBub3cgb24gaXQgc2hvdWxkIGJlIG11Y2ggY2xlYXJlciB3aGF04oCZcyB3cm9uZyB3aXRoIGEgdmVyeSBSU1MgQm94LiBTaW5jZSB0aGVyZeKAmXMgbm93IGEgbG90IG1vcmUgb2YgY2xpZW50LXNpZGUgSmF2YVNjcmlwdCBjb2RlIGludm9sdmVkIEkgdGVzdGVkIHRoZSBzY3JpcHQgaW4gZm91ciBtYWpvciBicm93c2VycyB0aGF0IGFyZSBhdmFpbGFibGUgdG8gbWU6IEludGVybmV0IEV4cGxvcmVyIDcsIEZpcmVmb3ggMi4wLCBPcGVyYSA5LjI1IGFuZCBTYWZhcmkgMy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA4LTAyLTAxPC9zbWFsbD5cbiAgICBDb21wbGV0ZWx5IHJldmlzZWQgc2VydmVyLSBhbmQgY2xpZW50LXNpZGUgY29kZS4gWE1MIHJlbmRlcmluZyBpcyBub3cgZG9uZSBpbiB0aGUgYnJvd3NlciB3aGljaCBzcGVlZHMgdXAgdGhpbmdzIGFuZCBkZWNyZWFzZXMgdGhlIGxvYWQgb24gdGhlIHNlcnZlci4gRnVydGhlcm1vcmUsIHRoZSBsaXN0IG9mIHJlZmVycmVycyBpcyBub3cgbG9hZGVkIG9uIGRlbWFuZCB2aWEgQUpBWCBhbmQgdGh1cyBub3QgcmVuZGVyZWQgd2l0aCBldmVyeSByZXF1ZXN0LiBGaW5hbGx5LCBJIHJldG91Y2hlZCB0aGUgc2V0dXAgZm9ybSBpbnRlcmZhY2UgYW5kIGNsZWFuZWQgdXAgYm90aCBIVE1MIGFuZCBDU1MuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0xMi0yMDwvc21hbGw+XG4gICAgSSBhbSB2ZXJ5IGdsYWQgdGhhdCBteSBvbGQgbGl0dGxlIHNjcmlwdCBpcyBnYWluaW5nIGV2ZW4gbW9yZSBhdHRlbnRpb24gYWZ0ZXIgYWxsIHRoZXNlIHllYXJz4oCmICAgIDxpPlRoYW5rIHlvdSB2ZXJ5IG11Y2ggaW5kZWVkITwvaT4gU2luY2UgdGhlcmUgYXJlIGNvbWluZyBpbiBtb3JlIGFuZCBtb3JlIG9mIHRoZSBzYW1lIHJlcXVlc3RzIGFuZCBJIGFtIHJlYWxseSBub3QgYWJsZSB0byBoYW5kbGUgdGhlbSAoYXBvbG9naWVzISksIGhlcmUgaXMgc29tZSBhZHZpY2UgZm9yIGV2ZXJ5b25lOlxuICA8L3A+XG4gIDxvbD5cbiAgICA8bGk+XG4gICAgICA8YSBocmVmPSdodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Nhc2NhZGluZ19TdHlsZV9TaGVldHMnPlVzZSBjYXNjYWRpbmcgc3R5bGUgc2hlZXRzPC9hPiAoQ1NTKSB0byBjaGFuZ2UgZm9udCBzaXplcyAoYW5kIHRvIGdlbmVyYWxseSBkZWZpbmUgeW91ciBsYXlvdXQpLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgPGEgaHJlZj0naHR0cDovL3d3dy5zaXRlcG9pbnQuY29tL2FydGljbGUvYmV3YXJlLW9wZW5pbmctbGlua3MtbmV3LXdpbmRvdyc+QmV3YXJlIG9mIG9wZW5pbmcgbGlua3MgaW4gYSBuZXcgd2luZG93LjwvYT4gSXTigJlzIG9mZmVuc2l2ZSB0byB5b3VyIHJlYWRlcnMuXG4gICAgPC9saT5cbiAgPC9vbD5cbiAgPHA+XG4gICAgPGk+QSBoYXBweSBlbmQgZm9yIDIwMDYhPC9pPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDYtMTM8L3NtYWxsPlxuICAgIERpZCBzb21lIG1pbm9yIGJ1ZyBmaXhpbmcgYWdhaW4gKGFtb25nc3Qgb3RoZXJzIHJlcGxhY2luZyBzaW5nbGUgcXVvdGVzIHdpdGggJmFtcDthcG9zOyBhbmQgbm90ICZhbXA7cXVvdDsgZW50aXRpZXMpLiBGdXJ0aGVybW9yZSAoYW5kIGZpbmFsbHkpLCBJIHJlbW92ZWQgdGhlIOKAnFJD4oCdIChhcyBpbiDigJxSZWxlYXNlIENhbmRpZGF0ZeKAnSkgZnJvbSB0aGUgZG9jdW1lbnQgdGl0bGXigKZcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA2LTEyPC9zbWFsbD5cbiAgICBHYXJ5IGluZm9ybWVkIG1lIHRoYXQgbG9uZ2VyIGZlZWQgVVJMcyBjYXVzZSB0cm91YmxlIGFuZCB0aGUgZmVlZCBib3ggd2lsbCBub3QgYmUgZGlzcGxheWVkLiBUaGF04oCZcyBpbiBmYWN0IGEgYnVnLCBidXQgdW5mb3J0dW5hdGVseSBvbmUgdGhhdCBjYW5ub3QgYmUgZml4ZWQgc28gZWFzaWx5LiBNeSBzdWdnZXN0aW9uIGlzIHRvIHNob3J0ZW4gc3VjaCBVUkxzIGF0IG9uZSBvZiB0aGUgd2Vic2l0ZXMgYXJvdW5kIHRoYXQgcHJvdmlkZSBzdWNoIGEgc2VydmljZSwgZS5nLiA8YSBocmVmPSdodHRwOi8vdGlueXVybC5jb20nPnRpbnl1cmwuY29tPC9hPi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTIzPC9zbWFsbD5cbiAgICBTd2l0Y2hlZCB0aGUgPGEgaHJlZj0nLy9wM2sub3JnL3NvdXJjZS9yc3MtYm94Lyc+c291cmNlIHJlcG9zaXRvcnk8L2E+IGZyb20gQ1ZTIHRvIFN1YnZlcnNpb24gKFNWTikuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNC0yMDwvc21hbGw+XG4gICAgQW5kcmV3IFBhbSBicm91Z2h0IHVwIGEgc2VyaW91cyBpc3N1ZSB0aGF0IHByb2JhYmx5IG1pZ2h0IGhhdmUgYWZmZWN0ZWQgc29tZSBtb3JlIHBlb3BsZSBhbHJlYWR5OiB0aGUgdmlld2VyIGRvZXMgbm90IHN1cHBvcnQgVVRGLTggKG9yIFVuaWNvZGUsIHJlc3AuKSBVbmZvcnR1bmF0ZWx5LCB0aGlzIGlzIOKAnGJ1aWx0LWlu4oCdIGludG8gdGhlIHVuZGVybHlpbmcgc2NyaXB0aW5nIGxhbmd1YWdlIChha2EgUmVib2wpLiBJ4oCZbSBzb3JyeSB0byBjYW5jZWwgdGhvc2UgdGlja2V0c+KApiA6KFxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMTM8L3NtYWxsPlxuICAgIEZpeGVkIGEgYnVnIHJlcG9ydGVkIGJ5IE1hbmRvIEdvbWV6IHRoYXQgY2F1c2VkIGZlZWRzIHVzaW5nIHRoZSAmYW1wO2x0O2d1aWQmYW1wO2d0OyBlbGVtZW50IGJlaW5nIGRpc3BsYXllZCB3aXRob3V0IGl0ZW0gbGlua3PigKYgRG9u4oCZdCBmb3JnZXQgdG8gY2hlY2sgb3V0IE1hbmRv4oCZcyBleGNlbGxlbnQgd2Vic2l0ZSA8YSBocmVmPSdodHRwOi8vd3d3Lm1hbmRvbHV4LmNvbS8nPm1hbmRvbHV4PC9hPiFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTEyPC9zbWFsbD5cbiAgICBPYnZpb3VzbHkgU2FtIFJ1YnkgY2hhbmdlZCBoaXMgZmVlZCBmb3JtYXQgZnJvbSBzY3JpcHRpbmdOZXdzIHRvIEF0b207IHdoaWNoIHJlbmRlcnMgbXkgZXhhbXBsZSBsaW5rIGFib3ZlIHByZXR0eSB1c2VsZXNz4oCmIFNvIGZhciBJIGRvbuKAmXQga25vdyBhYm91dCBhbnkgb3RoZXIgc2NyaXB0aW5nTmV3cyBmZWVkLCBkbyB5b3U/XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wMi0yMDwvc21hbGw+XG4gICAgSSBob3BlIG5vYm9keSBtaW5kcyB0aGUgbGl0dGxlIGxpbmUgSSBhZGRlZCBhdCB0aGUgYm90dG9tIG9mIGVhY2ggUlNTIGJveOKApiBPZiBjb3Vyc2UsIGl04oCZcyBub3QgdG90YWxseSBhbHRydWlzdGljLCBidXQgcHJvYmFibHkgc29tZSBwZW9wbGUgd2lsbCBmaW5kIGl0IGluZm9ybWF0aXZlLiBIb3dldmVyLCBpZiB5b3Ugd2FudCB0byBwcmV2ZW50IGl0IGZyb20gYmVpbmcgZGlzcGxheWVkIHNpbXBseSBhZGQgPGNvZGU+LnJzc2JveC1wcm9tbyB7ZGlzcGxheTogbm9uZTt9PC9jb2RlPiB0byB5b3VyIHN0eWxlc2hlZXQuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wMS0xMTwvc21hbGw+XG4gICAgTmV3IHNlcnZlciwgbmV3IHRyb3VibGVzOiBJIG1vdmVkIHRoZSB2aWV3ZXIgdG8gYSBuZXdseSBzZXR1cCBVYnVudHUgbWFjaGluZS4gT2YgY291cnNlLCBJIGZvcmdvdCB0byBzZXQgc29tZSBwZXJtaXNzaW9uIGZsYWdzIGFuZCBvd25lcnMsIHRodXMsIHByZXZlbnRpbmcgdGhlIHNjcmlwdCBmcm9tIHdvcmtpbmcuIEhvd2V2ZXIsIEkgdGhpbmsgZXZlcnl0aGluZyBpcyBmaXhlZCBhbmQgd29ya2luZyBhZ2Fpbi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA1LTExLTE2PC9zbWFsbD5cbiAgICBKdXN0IHRlc3RpbmcgR29vZ2xl4oCZcyBBZFNlbnNlIGZvciBhIHdoaWxlLiBTaW5jZSB0aGlzIHBhZ2UgZ2VuZXJhdGVzIG1vc3Qgb2YgbXkgdHJhZmZpYyBJIHdhbnRlZCB0byBzZWUgbXlzZWxmIHdoYXQgYSBiYW5uZXIgY2FuIGRvIGhlcmUuIEhvcGUgeW91IGRvbuKAmXQgbWluZC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTEyLTE2PC9zbWFsbD5cbiAgICBCdWdmaXg6IFNvbWV0aW1lcyB0aGUgbG9nZmlsZSB3aGljaCBpcyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBsaXN0IG9mIHNpdGVzIHVzaW5nIHRoaXMgc2NyaXB0IGdldHMgY29ycnVwdGVkLiBUaGlzIGFmZmVjdGVkIHRoZSB3aG9sZSBzZXR1cCBwYWdlIHRvIHJldHVybiBhbiBlcnJvciBhbmQgdGh1cywgaXQgbmVlZGVkIHRvIGJlIGNhdWdodC4gKFlvdSB3aWxsIHNlZSBhIOKAnGN1cnJlbnRseSBvdXQgb2Ygb3JkZXLigJ0gbWVzc2FnZSB0aGVuLilcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTA0LTI2PC9zbWFsbD5cbiAgICBMYXN0IGVmZm9ydHMgdG8gb2ZmaWNpYWxseSByZWxlYXNlIHRoZSA8YSBocmVmPScvL3Azay5vcmcvc291cmNlL3Jzcy1ib3gnPmNvZGU8L2E+IHRvIHRoZSBvcGVuIHNvdXJjZSBjb21tdW5pdHkuIFRoZXJlIGhhdmUgYmVlbiBzb21lIGJ1Z3MgaW4gdGhlIChpbWFnZSkgcmVuZGVyaW5nIGZyYW1ld29yayB3aGljaCBJIGZpeGVkIHNvICAgIGZhci4gSSBub3cgaW5jbHVkZSBhIGR5bmFtaWNhbGx5IHJlbmRlcmVkIGxpc3Qgb2Ygc2l0ZXMgdXNpbmcgKG9yIHBvaW50aW5nIHRvKSB0aGlzIHNjcmlwdCB0byBnaXZlIHNvbWUgZXhhbXBsZXMgZm9yIHRoZSBjdXJpb3VzIGF0IGhlYXJ0IChtZSBpbmNsdWRlZCkuIEZpbmFsbHksIHRoZXJl4oCZcyBhIDxhIGhyZWY9Jy8vcDNrLm9yZy9zb3VyY2UvcnNzLWJveC9icmFuY2hlcy8yLjAvUkVBRE1FJz5SRUFETUU8L2E+IGZpbGUgd2l0aCBhIHNob3J0IGluc3RhbGxhdGlvbiBndWlkZSB0byBtYWtlIHRoZSBzY3JpcHQgcnVuIG9uIHlvdXIgb3duIHNlcnZlci5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTAxLTI4PC9zbWFsbD5cbiAgICBXaGVuIHNvbWV0aGluZyBnb2VzIHdyb25nIChtb3N0IG9mIHRoZSB0aW1lIHRoaXMgbWlnaHQgYmUgYSB3cm9uZyBVUkwsIGllLiBhIDQwNCBhcyByZXN1bHQpIGFuICAgIDxhIGhyZWY9Jy4vP3VybD1lcnJvcic+4oCcZXJyb3LigJ0gYm94PC9hPiB3aWxsIGJlIGRpc3BsYXllZCB0byBzaWduYWwgdGhlIGZhaWx1cmUuIEluY3JlYXNlZCB2ZXJzaW9uIHVwIHRvIDEuMCBhbmQgbGFiZWxlZCBpdCBhcyByZWxlYXNlIGNhbmRpZGF0ZVxuICAgIChSQykuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNC0wMS0yNjwvc21hbGw+XG4gICAgUmV0b3VjaGVkIHRoZSBjb2RlIGluIGEgdmVyeSBsYXN0IGVmZm9ydCB0byBtYWtlIHRoZSBzY3JpcHQgcnVubmluZyBzdGFuZC1hbG9uZSAod2l0aCBSZWJvbCBidXQgICAgPGk+d2l0aG91dDwvaT4gUEhQLCB0aGF0IGlzKS4gRXZlcnl0aGluZyBuZWVkZWQgaXMgbm93IGluIDxkZWw+Q1ZTPC9kZWw+IFNWTiBzbyBldmVyeWJvZHkgY2FuIGRvd25sb2FkIGZyb20gdGhlcmUuIFBvdGVudGlhbGx5LCBhIGZldyBtaW5vciBidWcgZml4ZXMgbWlnaHQgZm9sbG93IHNob3J0LXRlcm0uIFVoLCBhbmQgdGhlIEhUTUwgY29kZSBpcyA8YSBocmVmPSdodHRwOi8vdmFsaWRhdG9yLnczLm9yZy9jaGVjaz91cmk9aHR0cCUzQSUyRiUyRnAzay5vcmclMkZyc3MlMkYnPnZhbGlkIFhIVE1MIDEuMDwvYT4gbm93LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMTItMTI8L3NtYWxsPlxuICAgIFRoZSBtaXJyb3IgYXQgPGRlbD5odHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzLzwvZGVsPiBpcyBub3Qgd29ya2luZyBmb3IgcXVpdGUgYSBsb25nIHRpbWUuIEkgdHJpZWQgdG8gY29udGFjdCBBZGFtIEN1cnJ5IGJ1dCBzbyBmYXIgd2l0aG91dCBzdWNjZXNzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMDMtMzA8L3NtYWxsPlxuICAgIE1vdmVkIHRvIG5ldyBzZXJ2ZXIgd2l0aCBuZXcgZG9tYWluIDxkZWw+Zm9yZXZlci5wM2sub3JnPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMDMtMjU8L3NtYWxsPlxuICAgIFVwZGF0ZWQgUmVib2wgdG8gPGEgaHJlZj0naHR0cDovL3d3dy5yZWJvbC5jb20vbmV3czMzMTAuaHRtbCc+dmVyc2lvbiAyLjUuNTwvYT4uIEVuZCBvZiBSZWJvbOKAmXMg4oCcRE5TIHpvbWJpZXPigJ0gaW4gdGhlIHByb2Nlc3MgbGlzdC5cbiAgICA8aT5GaW5hbGx5LjwvaT5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAyLTAyLTE5PC9zbWFsbD5cbiAgICBBZGRlZCBhIHZlcnkgbmljZSBxdW90ZSBmcm9tIDxhIGhyZWY9J2h0dHA6Ly93d3cub3VycGxhLm5ldC9jZ2ktYmluL3Bpa2llLmNnaT9BYmJlTm9ybWFsJz5BYmJlIE5vcm1hbDwvYT4gb24gdG9wIHJpZ2h0IG9mIHRoaXMgZG9jdW1lbnQuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0xMS0xNzwvc21hbGw+XG4gICAgSWYgeW91IHdhbnQgYSBtb3JlIGNvbXBhY3QgdmlldyBvZiB0aGUgUlNTIGJveCB5b3UgY2FuIGdldCBpdCBub3cgdXNpbmcgdGhlIGNvcnJlc3BvbmRpbmcgY2hlY2tib3guIElmIGl0IGlzIGVuYWJsZWQgdGhlIGRlc2NyaXB0aW9ucyBvZiBlYWNoIGl0ZW0gd2lsbCBub3QgYmUgZGlzcGxheWVkICYjODIxMTsgZ2l2ZW4gdGhhdCB0aGUgaXRlbSB0aXRsZSBpcyBkZWZpbmVkIChvdGhlcndpc2UgdGhlcmUgd291bGQgbm90IGJlIG11Y2ggdG8gc2VlKS4gQWRkaXRpb25hbGx5LCB0aGUgY2hhbm5lbCBpbWFnZSAoaWYgZGVmaW5lZCkgd2lsbCBub3QgYmUgZGlzcGxheWVkLiBUaGFua3MgJiMxMDY7JiMxMTU7JiMxMjE7JiMxMDE7JiMxMTE7JiM2NDsmIzk5OyYjMTExOyYjMTA5OyYjMTEyOyYjMTE3OyYjMTE1OyYjMTAxOyYjMTE0OyYjMTE4OyYjMTAxOyYjNDY7JiM5OTsmIzExMTsmIzEwOTsgZm9yIHRoZSBzdWdnZXN0aW9ucyFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTIxPC9zbWFsbD5cbiAgICBTaW5jZSB0b2RheSB0aGUgPGNvZGU+dGV4dGlucHV0PC9jb2RlPiB0YWcgaXMgc3VwcG9ydGVkLiBJdCBjcmVhdGVzIGFuIGFwcHJvcHJpYXRlIGZvcm0gYXQgdGhlIGVuZCBvZiB0aGUgYm94LiBNb3Jlb3ZlciwgdHdvIGJ1Z3Mgd2VyZSBmaXhlZDogb25lIGNhdXNlZCB1bm5lY2Vzc2FyeSBpbmZvcm1hdGlvbiBpbiB0aGUgcXVlcnkgc3RyaW5nIG9mIHRoZSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCB0YWcuIFRoZSBvdGhlciBhZmZlY3RlZCB0aGUgZGlzcGxheSBvZiB0aGUgZGF0ZeKAmXMgdGltZSB6b25lLiBUaW1lIHpvbmVzIG5vdyBhcmUgZ2VuZXJhbGx5IGRpc3BsYXllZCBpbiBHTVQgZXhjZXB0IHdoZXJlIGFub3RoZXIgdGltZSB6b25lIGFjcm9ueW0gaXMgZGVmaW5lZC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTA0PC9zbWFsbD5cbiAgICBBZGRlZCBpY29ucyBmb3IgZW5jbG9zdXJlIGFuZCBzb3VyY2U7IGFkZGVkIFhNTCBidXR0b24gY2hlY2tib3ggdG8gZW5hYmxlIG91dHB1dCBvZiB0aGUgcXVhc2ktc3RhbmRhcmQgb3JhbmdlIGJ1dHRvbiBsaW5raW5nIHRvIHRoZSBYTUwgc291cmNlIChpZGVhYnkgJiM5NzsmIzEwMDsmIzk3OyYjMTA5OyYjNjQ7JiM5OTsmIzExNzsmIzExNDsmIzExNDsmIzEyMTsmIzQ2OyYjOTk7JiMxMTE7JiMxMDk7KS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTAzPC9zbWFsbD5cbiAgICBJdOKAmXMgbm93IHBvc3NpYmxlIHRvIHJlZmluZSB0aGUgc3R5bGUgb2YgdGhlIHdob2xlIGJveCB1c2luZyB0aGUgbmV3bHkgaW1wbGVtZW50ZWQgY3NzIGNsYXNzZXMgPGNvZGU+cnNzYm94LXRpdGxlPC9jb2RlPiwgPGNvZGU+cnNzYm94LWNvbnRlbnQ8L2NvZGU+LCA8Y29kZT5yc3Nib3gtaXRlbS10aXRsZTwvY29kZT4gYW5kIDxjb2RlPnJzc2JveC10dGVtLWNvbnRlbnQ8L2NvZGU+IChpZGVhIGJ5ICYjMTE0OyYjMTAwOyYjOTc7JiMxMTg7JiMxMDU7JiMxMDE7JiMxMTU7JiM2NDsmIzExMTsmIzExNDsmIzEwNTsmIzEwMTsmIzExMDsmIzExNjsmIzExMjsmIzk3OyYjOTk7JiMxMDU7JiMxMDI7JiMxMDU7JiM5OTsmIzQ2OyYjOTk7JiMxMTE7JiMxMDk7KS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTI0PC9zbWFsbD5cbiAgICBBZGRlZCBhIGZvcm0gaW5wdXQgZm9yIGxpbWl0aW5nIHRoZSBpdGVtIGRpc3BsYXkuIFRoZSBudW1iZXIgZGV0ZXJtaW5lcyBob3cgbWFueSBpdGVtcyB3aWxsIGJlIHNob3duIGluIHRoZSBib3ggKHNldmVuIGlzIHRoZSBkZWZhdWx0IHZhbHVlKS4gR29vZCBmb3Igb2Z0ZW4gdXBkYXRlZCBjaGFubmVscy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTE1PC9zbWFsbD5cbiAgICBEZXRlY3RlZCBhIHN0cmFuZ2UgYnVnIHRoYXQgcHJldmVudGVkIHRoZSB2aWV3ZXIgYXQgPGEgaHJlZj0naHR0cDovL3B1Ymxpc2guY3VycnkuY29tL3Jzcy8nPmN1cnJ5LmNvbTwvYT4gbG9hZGluZyBodHRwOi8vcDNrLm9yZy9yc3MueG1sIHdoaWxlIGh0dHA6Ly93d3cucDNrLm9yZy9yc3MueG1sIHdhcyBubyBwcm9ibGVtIGF0IGFsbC4gVXBncmFkaW5nIHRoZSBSZWJvbCBpbnN0YWxsYXRpb24gdG8gdGhlIGN1cnJlbnQgdmVyc2lvbiBzb2x2ZWQgdGhlcHJvYmxlbSwgaG93ZXZlciB0aGUgY2F1c2UgcmVtYWlucyB1bmNsZWFy4oCmXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wOC0wODwvc21hbGw+XG4gICAgRml4ZWQgYSBzbWFsbCBidWcgdGhhdCBjb3JydXB0ZWQgY2hhbm5lbCBVUkxzIGNvbnRhaW5pbmcgYSBxdWVyeSAoYXMgcmVwb3J0ZWQgYnkgJiMxMDc7JiMxMDU7JiMxMDc7JiM5NzsmIzY0OyYjMTE1OyYjMTA4OyYjMTExOyYjMTA4OyYjMTAxOyYjMTA0OyYjMTE2OyYjNDY7JiMxMDE7JiMxMDE7KS4gQ29uZmlndXJlZCBzZXJ2ZXIgcmVkaXJlY3QgZnJvbSA8ZGVsPmh0dHA6Ly9waWVma2UuaGVsbWEuYXQvcnNzPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMDU8L3NtYWxsPlxuICAgIFRoYW5rcyB0byA8YSBocmVmPSdodHRwOi8vd3d3LmN1cnJ5LmNvbS8yMDAxLzA3LzMxI2Nvb2xSc3NTZXJ2aWNlJz5BZGFtIEN1cnJ5PC9hPiwgdGhlIHZpZXdlciBpcyBub3cgbWlycm9yZWQgYXQgPGRlbD5odHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDctMzA8L3NtYWxsPlxuICAgIEFkZGVkIGxpbmsgdG8gc291cmNlIGNvZGU7IGFkZGVkIGV4YW1wbGUgbGlua3MgZm9yIGFsbCBzdXBwb3J0ZWQgZm9ybWF0cy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA1LTMwPC9zbWFsbD5cbiAgICBGaXhlZCBhIGxpdHRsZSBidWcgcmVwb3J0ZWQgYnkgJiMxMDI7JiMxMTQ7JiMxMDE7JiMxMDA7JiMxMDU7JiM2NDsmIzEwMTsmIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDY7JiMxMDE7JiMxMDE7IHRoYXQgY2F1c2VkIGRpYWNyaXRpYyBjaGFyYWN0ZXJzIHRvIGJlIGRpc3BsYXllZCBhcyBlbnRpdHkgY29kZXMuXG4gIDwvcD5cbjwvZGV0YWlscz5cblxuPHN0eWxlPlxuICBoMyB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgaDMgKyBwLCBzdW1tYXJ5ICsgKiB7XG4gICAgbWFyZ2luLXRvcDogMDtcbiAgfVxuXG4gIHN1bW1hcnkge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICBsaSArIGxpIHtcbiAgICBtYXJnaW4tdG9wOiAwLjVlbTtcbiAgfVxuXG4gIHNtYWxsIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgbWFyZ2luLXJpZ2h0OiAwLjVlbTtcbiAgICBjb2xvcjogI2JiYjtcbiAgfVxuXG4gIGNvZGUge1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmM7XG4gICAgZm9udC1zaXplOiAwLjhlbTtcbiAgICBmb250LXdlaWdodDogMjAwO1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWdYRSxFQUFFLG1CQUFDLENBQUMsQUFDRixPQUFPLENBQUUsWUFBWSxBQUN2QixDQUFDLEFBRUQsRUFBRSxDQUFHLG9CQUFDLENBQUUsT0FBTyxDQUFHLG1CQUFFLENBQUMsQUFDbkIsVUFBVSxDQUFFLENBQUMsQUFDZixDQUFDLEFBRUQsT0FBTyxtQkFBQyxDQUFDLEFBQ1AsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsRUFBRSxDQUFHLEVBQUUsbUJBQUMsQ0FBQyxBQUNQLFVBQVUsQ0FBRSxLQUFLLEFBQ25CLENBQUMsQUFFRCxLQUFLLG1CQUFDLENBQUMsQUFDTCxPQUFPLENBQUUsWUFBWSxDQUNyQixZQUFZLENBQUUsS0FBSyxDQUNuQixLQUFLLENBQUUsSUFBSSxBQUNiLENBQUMsQUFFRCxJQUFJLG1CQUFDLENBQUMsQUFDSixnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUFHLEFBQ2xCLENBQUMifQ== */";
	appendNode(style, document.head);
}

function create_main_fragment$2(state, component) {
	var details;

	return {
		c: function create() {
			details = createElement("details");
			details.innerHTML = "<summary svelte-2837112113><h3 svelte-2837112113>Change Log</h3></summary>\n\n  <p svelte-2837112113><small svelte-2837112113>2019-12-15</small>\n    Upgraded the JSONP proxy to Python 3.7 and slightly retouched the configuration form. A merry ending for 2019 and a happy new year 🎉 <em svelte-2837112113>It’s hindsight!<em svelte-2837112113></em></em></p>\n\n  <p svelte-2837112113><small svelte-2837112113>2018-01-19</small>\n    More than 15 years (and still counting…) after its inception this little service is still live and kicking! The best part of this hobby project’s long-running trait: this year brings a complete rewrite and overhaul with an extensive list of updates – and only small changes in functionality:</p>\n  <ul svelte-2837112113><li svelte-2837112113>Added basic support for Atom 1.0 feeds 🔥</li>\n    <li svelte-2837112113>Added support for multiple enclosures (RSS 0.93)</li>\n    <li svelte-2837112113>Replaced value of -1 for automatic content height with “empty” value</li>\n    <li svelte-2837112113>Added support for “empty” value to box width (now called ”max. width”)</li>\n    <li svelte-2837112113>Reduced total size of embedded download by more than 60% ⚡</li>\n    <li svelte-2837112113>Increased performance of loading and rendering boxes</li>\n    <li svelte-2837112113>Implemented responsive CSS for both, boxes and configuration app</li>\n    <li svelte-2837112113>Replaced bitmap icons with scalable vector graphics</li>\n    <li svelte-2837112113>Completely rewrote the app code using <a svelte-2837112113 href=\"https://svelte.technology\">Svelte</a> and <a svelte-2837112113 href=\"https://mincss.com/\">min.css</a></li>\n    <li svelte-2837112113>Replaced remaining jQuery code with vanilla JavaScript</li>\n    <li svelte-2837112113>Migrated build scripts to Rollup and Yarn</li>\n    <li svelte-2837112113>Added support for missing browser features via <a svelte-2837112113 href=\"https://polyfills.io\">polyfills.io</a></li>\n    <li svelte-2837112113>Discontinued support for older browsers (MSIE < 11)</li>\n    <li svelte-2837112113>Bumped major version to 18 (aka the year), getting rid of semantic versioning due to lack of semantics 🐱</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2016-03-12</small>\n    Completely rewrote build environment using WebPack. Switched the <a svelte-2837112113 href=\"https://github.com/p3k/rss-box\">source repository</a> from SVN to Git, hosted at Github. This deserves a new major version number!</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-12-30</small>\n    Added simple code to modify the width attribute of iframe, object and embed elements to make them fit in the box. Also: bumped version. <i svelte-2837112113>A happy new year 2013, everbody!</i></p>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-10-26</small>\n    Added section about Creative Commons License, below. In other words: you can now legally run my code on your own server. (You even could remove the tiny reference to this page in the footer of the box.) However, I would like to ask you for two things if you want to do so:</p>\n  <ul svelte-2837112113><li svelte-2837112113>Use your own <a svelte-2837112113 href=\"//github.com/p3k/json3k\">JSONP proxy</a> – especially, when you expect a high load on your server.</li>\n    <li svelte-2837112113>Please support the service with a <a svelte-2837112113 href=\"http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer\">donation</a>.</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-08-01</small>\n    Added two new, experimental features – and thus, increased version to 3.3:</p>\n  <ul svelte-2837112113><li svelte-2837112113>The height of the inner box content can now be defined by a pixel value. If the height is less than the space needed by the desired amount of items you can vertically scroll the content. A value of <code svelte-2837112113>-1</code> enables the default behavior and automatically sets the height according to the displaying items.</li>\n    <li svelte-2837112113>The so-called “headless” mode removes the titlebar and the frame from the box. This way the box can be used more flexibly in special situations. However, this feature somehow undermines an RSS feed’s authority so I count on your fairness to give credit where credit is due!</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-07-16</small>\n    Slightly modified output of the HTML code to be usable with both, unsecured and secured (HTTPS) web servers. You can update already embedded code easily by removing the <code svelte-2837112113>http:</code> part from the <code svelte-2837112113>src</code> attribute of the <code svelte-2837112113>&lt;script&gt;</code> element: <code svelte-2837112113>&lt;script src='http://p3k.org/rss…'&gt;</code> becomes <code svelte-2837112113>&lt;script src='//p3k.org/rss…'&gt;</code>.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-07-13</small></p>\n  <ul svelte-2837112113><li svelte-2837112113>Fixed IE bug (“innerHTML is null or not an object”) caused by using jQuery’s html() method instead of text() when parsing a <code svelte-2837112113>&lt;content:encoded&gt;</code> element.</li>\n    <li svelte-2837112113>Changed priority of elements: only check for <code svelte-2837112113>&lt;content:encoded&gt;</code> if     <code svelte-2837112113>&lt;description&gt;</code> is not available.</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-06-04</small></p>\n  <ul svelte-2837112113><li svelte-2837112113>Implemented small routine to resize images contained in the feed content to fit in the box.</li>\n    <li svelte-2837112113>Added support for new HTML5 form input types and their validation.</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-05-31</small>\n    Gone βeta! – with three tiny additons:</p>\n  <ul svelte-2837112113><li svelte-2837112113>Added <code svelte-2837112113>&lt;noscript&gt;</code> element for browsers providing no JavaScript engine.</li>\n    <li svelte-2837112113>Added option to call the configurator with a URL in the query string.</li>\n    <li svelte-2837112113>Added a link to the W3C feed validator to the contents of a box displaying an RSS error.</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-05-19</small>\n    Apologies for the RSS Boxes not showing up on your pages during the last few days. I made a stupid mistake that caused only the setup page to render correctly – and I did not check any embedded script. <i svelte-2837112113>Bummer!</i></p>\n  <p svelte-2837112113>At least now everything should be back to normal. (I hope this incident did not sabotage the Flattr button I added in the meantime… <i svelte-2837112113>wink, wink!</i>)</p>\n  <p svelte-2837112113>Anyway, thanks for your understanding.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-05-16</small>\n    I think I did not mention, yet, that the current incarnation of the code is totally disconnected from the version as of 2009. Each is using their own codebase, the legacy code was not modified at all and thus, it is not affected by any recent changes. You can check which version you are using by looking at the script URL. If it contains the string “proxy.r” you get the “classic” RSS Box rendering. The modernized version calls “index.js”. Nevertheless, you cannot setup boxes with the old URL anymore.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-05-09</small></p>\n  <ul svelte-2837112113><li svelte-2837112113>Added support for <code svelte-2837112113>&lt;content:encoded&gt;</code> element.</li>\n    <li svelte-2837112113>Implemented Memcache usage in AppEngine code.</li>\n    <li svelte-2837112113>Beautified this page by using the <a svelte-2837112113 href=\"http://www.google.com/webfonts/specimen/Droid+Serif\">Google’s Droid Serif font</a>.</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2012-04-26</small>\n    Amazing! A new version! After more than two years hiatus I completely rewrote the codebase and framework:</p>\n  <ul svelte-2837112113><li svelte-2837112113>Removed dependency to Rebol using a small JSONP proxy at Google’s AppEngine.</li>\n    <li svelte-2837112113>Rewrote XML parsing, replacing native methods with jQuery ones.</li>\n    <li svelte-2837112113>Cleaned up HTML output for the RSS Box, replacing tables with divs. <i svelte-2837112113>Note: You might need to add <code svelte-2837112113><a svelte-2837112113 href=\"http://coding.smashingmagazine.com/2010/11/02/the-important-css-declaration-how-and-when-to-use-it/\">!important</a></code> to your custom RSS Box stylesheet definitions.</i></li>\n    <li svelte-2837112113>Replaced fugly colorpicker in configurator with the <a svelte-2837112113 href=\"https://github.com/claviska/jquery-miniColors/\">MiniColors jQuery plugin</a>.</li>\n    <li svelte-2837112113>Added link color setting and style attributes for correctly applying color settings.</li>\n    <li svelte-2837112113>Added corner radius setting. <i svelte-2837112113>Note: does not work in IE8 and earlier versions.</i></li>\n    <li svelte-2837112113>Added font size to the font face setting.</li>\n    <li svelte-2837112113>Removed align setting from configurator (still works in script tags generated with earlier versions).</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2009-12-13</small>\n    Switched output of this page to HTML5 and made some adaptations in the HTML code and CSS stylesheet. Updated version string to 2.1, finally!</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2009-09-28</small>\n    Some minor changes after a while:</p>\n  <ul svelte-2837112113><li svelte-2837112113>Refactored date parsing to show actual build dates more reliably</li>\n    <li svelte-2837112113>Refactored caching routine (only in online version)</li>\n    <li svelte-2837112113>Updated version string to 2.1b, approaching another final version.</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2008-02-19</small>\n    Seems there were some changes in the air as I did not plan another update but here comes version 2.1 bringing to you:</p>\n  <ul svelte-2837112113><li svelte-2837112113>Full client-side processing (only the raw feed data is fetched from the server).</li>\n    <li svelte-2837112113>User-friendlier interface with color pickers, status and error display as well as instant feedback on any change in setup.</li>\n    <li svelte-2837112113>And finally (drumroll!) Unicode support at least at this installation of the viewer. (Ie. the downloaded version still will output ASCII only.)</li>\n  </ul>\n\n  <p svelte-2837112113><small svelte-2837112113>2008-02-03</small>\n    Made some more improvements especially regarding the error handling and output. From now on it should be much clearer what’s wrong with a very RSS Box. Since there’s now a lot more of client-side JavaScript code involved I tested the script in four major browsers that are available to me: Internet Explorer 7, Firefox 2.0, Opera 9.25 and Safari 3.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2008-02-01</small>\n    Completely revised server- and client-side code. XML rendering is now done in the browser which speeds up things and decreases the load on the server. Furthermore, the list of referrers is now loaded on demand via AJAX and thus not rendered with every request. Finally, I retouched the setup form interface and cleaned up both HTML and CSS.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-12-20</small>\n    I am very glad that my old little script is gaining even more attention after all these years…    <i svelte-2837112113>Thank you very much indeed!</i> Since there are coming in more and more of the same requests and I am really not able to handle them (apologies!), here is some advice for everyone:</p>\n  <ol svelte-2837112113><li svelte-2837112113><a svelte-2837112113 href=\"http://en.wikipedia.org/wiki/Cascading_Style_Sheets\">Use cascading style sheets</a> (CSS) to change font sizes (and to generally define your layout).</li>\n    <li svelte-2837112113><a svelte-2837112113 href=\"http://www.sitepoint.com/article/beware-opening-links-new-window\">Beware of opening links in a new window.</a> It’s offensive to your readers.</li>\n  </ol>\n  <p svelte-2837112113><i svelte-2837112113>A happy end for 2006!</i></p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-06-13</small>\n    Did some minor bug fixing again (amongst others replacing single quotes with &apos; and not &quot; entities). Furthermore (and finally), I removed the “RC” (as in “Release Candidate”) from the document title…</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-06-12</small>\n    Gary informed me that longer feed URLs cause trouble and the feed box will not be displayed. That’s in fact a bug, but unfortunately one that cannot be fixed so easily. My suggestion is to shorten such URLs at one of the websites around that provide such a service, e.g. <a svelte-2837112113 href=\"http://tinyurl.com\">tinyurl.com</a>.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-04-23</small>\n    Switched the <a svelte-2837112113 href=\"//p3k.org/source/rss-box/\">source repository</a> from CVS to Subversion (SVN).</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-04-20</small>\n    Andrew Pam brought up a serious issue that probably might have affected some more people already: the viewer does not support UTF-8 (or Unicode, resp.) Unfortunately, this is “built-in” into the underlying scripting language (aka Rebol). I’m sorry to cancel those tickets… :(</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-04-13</small>\n    Fixed a bug reported by Mando Gomez that caused feeds using the &lt;guid&gt; element being displayed without item links… Don’t forget to check out Mando’s excellent website <a svelte-2837112113 href=\"http://www.mandolux.com/\">mandolux</a>!</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-04-12</small>\n    Obviously Sam Ruby changed his feed format from scriptingNews to Atom; which renders my example link above pretty useless… So far I don’t know about any other scriptingNews feed, do you?</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-02-20</small>\n    I hope nobody minds the little line I added at the bottom of each RSS box… Of course, it’s not totally altruistic, but probably some people will find it informative. However, if you want to prevent it from being displayed simply add <code svelte-2837112113>.rssbox-promo {display: none;}</code> to your stylesheet.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2006-01-11</small>\n    New server, new troubles: I moved the viewer to a newly setup Ubuntu machine. Of course, I forgot to set some permission flags and owners, thus, preventing the script from working. However, I think everything is fixed and working again.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2005-11-16</small>\n    Just testing Google’s AdSense for a while. Since this page generates most of my traffic I wanted to see myself what a banner can do here. Hope you don’t mind.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2004-12-16</small>\n    Bugfix: Sometimes the logfile which is used to generate the list of sites using this script gets corrupted. This affected the whole setup page to return an error and thus, it needed to be caught. (You will see a “currently out of order” message then.)</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2004-04-26</small>\n    Last efforts to officially release the <a svelte-2837112113 href=\"//p3k.org/source/rss-box\">code</a> to the open source community. There have been some bugs in the (image) rendering framework which I fixed so    far. I now include a dynamically rendered list of sites using (or pointing to) this script to give some examples for the curious at heart (me included). Finally, there’s a <a svelte-2837112113 href=\"//p3k.org/source/rss-box/branches/2.0/README\">README</a> file with a short installation guide to make the script run on your own server.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2004-01-28</small>\n    When something goes wrong (most of the time this might be a wrong URL, ie. a 404 as result) an    <a svelte-2837112113 href=\"./?url=error\">“error” box</a> will be displayed to signal the failure. Increased version up to 1.0 and labeled it as release candidate\n    (RC).</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2004-01-26</small>\n    Retouched the code in a very last effort to make the script running stand-alone (with Rebol but    <i svelte-2837112113>without</i> PHP, that is). Everything needed is now in <del svelte-2837112113>CVS</del> SVN so everybody can download from there. Potentially, a few minor bug fixes might follow short-term. Uh, and the HTML code is <a svelte-2837112113 href=\"http://validator.w3.org/check?uri=http%3A%2F%2Fp3k.org%2Frss%2F\">valid XHTML 1.0</a> now.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2003-12-12</small>\n    The mirror at <del svelte-2837112113>http://publish.curry.com/rss/</del> is not working for quite a long time. I tried to contact Adam Curry but so far without success.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2003-03-30</small>\n    Moved to new server with new domain <del svelte-2837112113>forever.p3k.org</del>.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2003-03-25</small>\n    Updated Rebol to <a svelte-2837112113 href=\"http://www.rebol.com/news3310.html\">version 2.5.5</a>. End of Rebol’s “DNS zombies” in the process list.\n    <i svelte-2837112113>Finally.</i></p>\n\n  <p svelte-2837112113><small svelte-2837112113>2002-02-19</small>\n    Added a very nice quote from <a svelte-2837112113 href=\"http://www.ourpla.net/cgi-bin/pikie.cgi?AbbeNormal\">Abbe Normal</a> on top right of this document.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-11-17</small>\n    If you want a more compact view of the RSS box you can get it now using the corresponding checkbox. If it is enabled the descriptions of each item will not be displayed – given that the item title is defined (otherwise there would not be much to see). Additionally, the channel image (if defined) will not be displayed. Thanks jsyeo@compuserve.com for the suggestions!</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-09-21</small>\n    Since today the <code svelte-2837112113>textinput</code> tag is supported. It creates an appropriate form at the end of the box. Moreover, two bugs were fixed: one caused unnecessary information in the query string of the generated JavaScript tag. The other affected the display of the date’s time zone. Time zones now are generally displayed in GMT except where another time zone acronym is defined.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-09-04</small>\n    Added icons for enclosure and source; added XML button checkbox to enable output of the quasi-standard orange button linking to the XML source (ideaby adam@curry.com).</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-09-03</small>\n    It’s now possible to refine the style of the whole box using the newly implemented css classes <code svelte-2837112113>rssbox-title</code>, <code svelte-2837112113>rssbox-content</code>, <code svelte-2837112113>rssbox-item-title</code> and <code svelte-2837112113>rssbox-ttem-content</code> (idea by rdavies@orientpacific.com).</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-08-24</small>\n    Added a form input for limiting the item display. The number determines how many items will be shown in the box (seven is the default value). Good for often updated channels.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-08-15</small>\n    Detected a strange bug that prevented the viewer at <a svelte-2837112113 href=\"http://publish.curry.com/rss/\">curry.com</a> loading http://p3k.org/rss.xml while http://www.p3k.org/rss.xml was no problem at all. Upgrading the Rebol installation to the current version solved theproblem, however the cause remains unclear…</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-08-08</small>\n    Fixed a small bug that corrupted channel URLs containing a query (as reported by kika@sloleht.ee). Configured server redirect from <del svelte-2837112113>http://piefke.helma.at/rss</del>.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-08-05</small>\n    Thanks to <a svelte-2837112113 href=\"http://www.curry.com/2001/07/31#coolRssService\">Adam Curry</a>, the viewer is now mirrored at <del svelte-2837112113>http://publish.curry.com/rss</del>.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-07-30</small>\n    Added link to source code; added example links for all supported formats.</p>\n\n  <p svelte-2837112113><small svelte-2837112113>2001-05-30</small>\n    Fixed a little bug reported by fredi@email.ee that caused diacritic characters to be displayed as entity codes.</p>";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$1(details);
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

	if (!document.getElementById("svelte-2837112113-style")) add_css$1();

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

/* components/Github.html generated by Svelte v1.50.0 */
const script = document.createElement('script');
script.async = script.defer = true;
script.src = 'https://buttons.github.io/buttons.js';
document.head.appendChild(script);

function create_main_fragment$3(state, component) {
	var a;

	return {
		c: function create() {
			a = createElement("a");
			a.textContent = "Github";
			this.h();
		},

		h: function hydrate() {
			a.className = "github-button";
			a.href = "https://github.com/p3k/rss-box";
			a.dataset.size = "large";
			a.dataset.showCount = "true";
			setAttribute(a, "aria-label", "Star p3k/rss-box on GitHub");
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

function Github(options) {
	this._debugName = '<Github>';
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

assign(Github.prototype, protoDev);

Github.prototype._checkReadOnly = function _checkReadOnly(newState) {
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

function encapsulateStyles(node) {
	setAttribute(node, "svelte-5151739", "");
}

function add_css() {
	var style = createElement("style");
	style.id = 'svelte-5151739-style';
	style.textContent = "h3[svelte-5151739]{display:inline-block}h3+p[svelte-5151739]{margin-top:0}small[svelte-5151739]{color:#bbb}.warning[svelte-5151739]{border-color:#e44;background:#fdd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJvdXQuaHRtbCIsInNvdXJjZXMiOlsiQWJvdXQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8ZGl2PlxuICA8c21hbGw+PGk+4oCcSmF2YVNjcmlwdCBSU1MgVmlld2VyIHB1dHMgbGl0dGxlIG9yIGxvbmcgY3VzdG9taXphYmxlIFJTUyBib3hlcyBhbnl3aGVyZSB5b3UgcHV0IEhUTUw7IGJ1aWxkIHlvdXIgb3duIHNsYXNoYm94IGhlbGwgb3IgaGVhdmVuLCBpdOKAmXMgZmVlZGFyaWZpYyHigJ0g4oCUIDxhIGhyZWY9J2h0dHA6Ly9vdXJwbGEubmV0L2NnaS9waWtpZSc+QWJiZSBOb3JtYWw8L2E+PC9pPjwvc21hbGw+XG48L2Rpdj5cblxuPGgyPnt7ICRhcHBEZXNjcmlwdGlvbiB9fSB7eyAkYXBwVmVyc2lvbiB9fTwvaDI+XG5cbjxwIGNsYXNzPSdtc2cgd2FybmluZyc+XG4gIDxzdHJvbmc+UmVkdWNlZCBhdmFpbGFiaWxpdHkgZHVlIHRvIHRlbXBvcmFyeSB2aW9sYXRpb24gb2YgcXVvdGEgbGltaXQuPC9zdHJvbmc+IFlvdSBzaG91bGQgPGEgaHJlZj0nLy9naXRodWIuY29tL3Azay9qc29uM2snPmluc3RhbGwgeW91ciBvd24gSlNPTlAgcHJveHk8L2E+LiBZb3UgY2FuIGFsd2F5cyBzdXBwb3J0IHRoZSBwcm9qZWN0IHdpdGggeW91ciA8YSBocmVmPSdodHRwOi8vZmxhdHRyLmNvbS90aGluZy82ODE4ODEvSmF2YVNjcmlwdC1SU1MtQm94LVZpZXdlcic+ZG9uYXRpb248L2E+LlxuPC9wPlxuXG48cD5cbiAgVGhpcyB2aWV3ZXIgY2FuIGRpc3BsYXkgPGEgaHJlZj0naHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SU1MnPlJTUzwvYT4gZmVlZHMgb2YgdmVyc2lvbiA8YSBocmVmPSdodHRwOi8vY3liZXIubGF3LmhhcnZhcmQuZWR1L3Jzcy9leGFtcGxlcy9zYW1wbGVSc3MwOTEueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPjAuOTE8L2E+LCA8YSBocmVmPSdodHRwOi8vY3liZXIubGF3LmhhcnZhcmQuZWR1L3Jzcy9leGFtcGxlcy9zYW1wbGVSc3MwOTIueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPjAuOTI8L2E+LCA8YSBocmVmPSdodHRwOi8vcnNzLm9yZi5hdC9mbTQueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPjEuMDwvYT4gYW5kIDxhIGhyZWY9J2h0dHA6Ly9ibG9nLnAzay5vcmcvc3Rvcmllcy54bWwnIG9uOmNsaWNrPSdnb3RvKGV2ZW50KSc+Mi4wPC9hPiBhcyB3ZWxsIGFzIGV2ZW4gdGhlIGdvb2Qgb2xkIGxlZ2FjeSBmb3JtYXQgPGEgaHJlZj0naHR0cDovL2Vzc2F5c2Zyb21leG9kdXMuc2NyaXB0aW5nLmNvbS94bWwvc2NyaXB0aW5nTmV3czIueG1sJyBvbjpjbGljaz0nZ290byhldmVudCknPlNjcmlwdGluZyBOZXdzIDI8L2E+LiBUaGVyZSBpcyBhbHNvIGJhc2ljIHN1cHBvcnQgZm9yIDxhIGhyZWY9J2h0dHBzOi8vd3d3LnRoZXJlZ2lzdGVyLmNvLnVrL2hlYWRsaW5lcy5hdG9tJyBvbjpjbGljaz0nZ290byhldmVudCknPkF0b20gMS4wPC9hPi5cbjwvcD5cblxuPHA+XG4gIEl0IHByb3ZpZGVzIGEgc2ltcGxlIHdheSB0byBlbWJlZCBzdWNoIFJTUyBib3hlcyBpbiBhbnkgPGEgaHJlZj0naHR0cDovL3ZhbGlkYXRvci53My5vcmcvJz52YWxpZCBIVE1MIGRvY3VtZW50PC9hPiB2aWEgYW4gYXV0b21hZ2ljYWxseSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCB0YWcg4oCUIDxpPmZvciBmcmVlITwvaT5cbjwvcD5cblxuPHA+XG4gIEp1c3QgZW50ZXIgdGhlIFVSTCBvZiBhbnkgY29tcGF0aWJsZSBSU1MgZmVlZCwgbW9kaWZ5IHRoZSBsYXlvdXQgc2V0dGluZ3MgYXMgeW91IGxpa2UgYW5kIHB1c2ggdGhlIFJlbG9hZCBidXR0b24uIFdoZW4gZmluaXNoZWQsIGNvcHkgdGhlIEhUTUwgY29kZSBpbnRvIHlvdXIgb3duIHdlYiBwYWdlIOKAkyBhbmQgdm9pbMOgIVxuPC9wPlxuXG48cD5cbiAgVGhlIGNvZGUgYmVoaW5kIHRoaXMgaXMgd3JpdHRlbiBpbiBKYXZhU2NyaXB0IGFuZCBydW5zIGNvbXBsZXRlbHkgaW4geW91ciBicm93c2VyKi4gWW91IGNhbiBnZXQgdGhlIHNvdXJjZSBjb2RlIHRvZ2V0aGVyIHdpdGggYWxsIHRoZSBvdGhlciBuZWNlc3NhcnkgZmlsZXMgZnJvbSB0aGUgPGEgaHJlZj0nLy9naXRodWIuY29tL3Azay9yc3MtYm94Jz5HaXRodWIgcmVwb3NpdG9yeTwvYT4uXG48L3A+XG5cbjxwPlxuICA8c21hbGw+KiBBIHByb3h5IHNlcnZlciBpcyBuZWVkZWQgZm9yIGNyb3NzLW9yaWdpbiByZXF1ZXN0cy48L3NtYWxsPlxuPC9wPlxuXG48cD5cbiAgPEdpdGh1Yi8+XG48L3A+XG5cbjxDaGFuZ2VzLz5cblxuPGgzPkZ1dHVyZSBEZXZlbG9wbWVudDwvaDM+XG5cbjxwPlxuICBJIGhhdmUgY2Vhc2VkIGFjdGl2ZWx5IGRldmVsb3BpbmcgdGhpcyB2aWV3ZXIgYnV0IHNvbWV0aW1lcyBJIGdldCBlbnRodXNpYXN0aWMgYW5kIGZpZGRsZSBhcm91bmQgd2l0aCB0aGUgY29kZS4gT2YgY291cnNlIGl0IHdpbGwgYmUgYXZhaWxhYmxlIGhlcmUgYXMgaXMuXG48L3A+XG48cD5cbiAgRm9yIHF1ZXN0aW9ucyBhbmQgY29tbWVudHMgZmVlbCBmcmVlIHRvIGNvbnRhY3QgbWUgKFRvYmkpIHZpYSBlLW1haWw6IDxhIGhyZWY9J21haWx0bzomIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDM7JiMxMTQ7JiMxMTU7JiMxMTU7JiM2NDsmIzExMjsmIzUxOyYjMTA3OyYjNDY7JiMxMTE7JiMxMTQ7JiMxMDM7Jz4mIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDM7JiMxMTQ7JiMxMTU7JiMxMTU7JiM2NDsmIzExMjsmIzUxOyYjMTA3OyYjNDY7JiMxMTE7JiMxMTQ7JiMxMDM7PC9hPi5cbjwvcD5cblxuPGgzPkxpY2Vuc2U8L2gzPlxuXG48cD5cbiAgPHNwYW4geG1sbnM6ZGN0PVwiaHR0cDovL3B1cmwub3JnL2RjL3Rlcm1zL1wiIHByb3BlcnR5PVwiZGN0OnRpdGxlXCI+SmF2YVNjcmlwdCBSU1MgQm94IFZpZXdlcjwvc3Bhbj4gYnlcbiAgPGEgeG1sbnM6Y2M9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyNcIiBocmVmPVwiaHR0cDovL3Azay5vcmcvcnNzXCIgcHJvcGVydHk9XCJjYzphdHRyaWJ1dGlvbk5hbWVcIiByZWw9XCJjYzphdHRyaWJ1dGlvblVSTFwiPlRvYmkgU2Now6RmZXI8L2E+IGlzIGxpY2Vuc2VkIHVuZGVyIGEgPGEgcmVsPVwibGljZW5zZVwiIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvYXQvZGVlZC5lbl9VU1wiPkNyZWF0aXZlIENvbW1vbnMgQXR0cmlidXRpb24tU2hhcmVBbGlrZSAzLjAgQXVzdHJpYSBMaWNlbnNlPC9hPi5cbjwvcD5cbjxwPlxuICBCYXNlZCBvbiBhIHdvcmsgYXQgPGEgeG1sbnM6ZGN0PVwiaHR0cDovL3B1cmwub3JnL2RjL3Rlcm1zL1wiIGhyZWY9XCJodHRwczovL3Azay5vcmcvc291cmNlL3N2bi9yc3MtYm94L3RydW5rL1wiIHJlbD1cImRjdDpzb3VyY2VcIj5odHRwczovL3Azay5vcmcvc291cmNlL3N2bi9yc3MtYm94L3RydW5rLzwvYT4uXG48L3A+XG48cD5cbiAgPGEgcmVsPVwibGljZW5zZVwiIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvYXQvZGVlZC5lbl9VU1wiPlxuICAgIDxpbWcgYWx0PVwiQ3JlYXRpdmUgQ29tbW9ucyBMaWNlbnNlXCIgc3R5bGU9XCJib3JkZXItd2lkdGg6MFwiIHNyYz1cIi8vaS5jcmVhdGl2ZWNvbW1vbnMub3JnL2wvYnktc2EvMy4wL2F0Lzg4eDMxLnBuZ1wiIC8+XG4gIDwvYT5cbjwvcD5cblxuPHNtYWxsPlRoYW5rIHlvdSwgPGEgaHJlZj0nLy9wM2sub3JnLyc+cDNrLm9yZzwvYT4hPC9zbWFsbD5cblxuPHN0eWxlPlxuICBoMyB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgaDMgKyBwIHtcbiAgICBtYXJnaW4tdG9wOiAwO1xuICB9XG5cbiAgc21hbGwge1xuICAgIGNvbG9yOiAjYmJiO1xuICB9XG5cbiAgLndhcm5pbmcge1xuICAgIGJvcmRlci1jb2xvcjogI2U0NDtcbiAgICBiYWNrZ3JvdW5kOiAjZmRkO1xuICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICBpbXBvcnQgQ2hhbmdlcyBmcm9tICcuL0NoYW5nZXMuaHRtbCc7XG4gIGltcG9ydCBHaXRodWIgZnJvbSAnLi9HaXRodWIuaHRtbCc7XG5cbiAgZXhwb3J0IGRlZmF1bHQge1xuICAgIG9uY3JlYXRlKCkge1xuICAgICAgdGhpcy5zdG9yZS5vYnNlcnZlKCdhcHBEZXNjcmlwdGlvbicsIGRlc2NyaXB0aW9uID0+IHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBkZXNjcmlwdGlvbjtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRzOiB7XG4gICAgICBDaGFuZ2VzLFxuICAgICAgR2l0aHViXG4gICAgfSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgIGdvdG8oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zdG9yZS5zZXQoeyB1cmw6IGV2ZW50LnRhcmdldC5ocmVmIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuPC9zY3JpcHQ+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBK0RFLEVBQUUsZ0JBQUMsQ0FBQyxBQUNGLE9BQU8sQ0FBRSxZQUFZLEFBQ3ZCLENBQUMsQUFFRCxFQUFFLENBQUcsQ0FBQyxnQkFBQyxDQUFDLEFBQ04sVUFBVSxDQUFFLENBQUMsQUFDZixDQUFDLEFBRUQsS0FBSyxnQkFBQyxDQUFDLEFBQ0wsS0FBSyxDQUFFLElBQUksQUFDYixDQUFDLEFBRUQsUUFBUSxnQkFBQyxDQUFDLEFBQ1IsWUFBWSxDQUFFLElBQUksQ0FDbEIsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$1(state, component) {
	var div, text_3, h2, text_4, text_5, text_6, text_7, p, text_14, p_1, text_15, a_3, text_17, a_4, text_19, a_5, text_21, a_6, text_23, a_7, text_25, a_8, text_27, a_9, text_29, text_30, p_2, text_36, p_3, text_38, p_4, text_42, p_5, text_45, p_6, text_47, text_48, h3, text_50, p_7, text_52, p_8, text_56, h3_1, text_58, p_9, text_65, p_10, text_69, p_11, text_72, small_2;

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

	function click_handler_5(event) {
		component.goto(event);
	}

	var github = new Github({
		root: component.root
	});

	var changes = new Changes({
		root: component.root
	});

	return {
		c: function create() {
			div = createElement("div");
			div.innerHTML = "<small svelte-5151739><i>“JavaScript RSS Viewer puts little or long customizable RSS boxes anywhere you put HTML; build your own slashbox hell or heaven, it’s feedarific!” — <a href=\"http://ourpla.net/cgi/pikie\">Abbe Normal</a></i></small>";
			text_3 = createText("\n\n");
			h2 = createElement("h2");
			text_4 = createText(state.$appDescription);
			text_5 = createText(" ");
			text_6 = createText(state.$appVersion);
			text_7 = createText("\n\n");
			p = createElement("p");
			p.innerHTML = "<strong>Reduced availability due to temporary violation of quota limit.</strong> You should <a href=\"//github.com/p3k/json3k\">install your own JSONP proxy</a>. You can always support the project with your <a href=\"http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer\">donation</a>.";
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
			text_27 = createText(". There is also basic support for ");
			a_9 = createElement("a");
			a_9.textContent = "Atom 1.0";
			text_29 = createText(".");
			text_30 = createText("\n\n");
			p_2 = createElement("p");
			p_2.innerHTML = "It provides a simple way to embed such RSS boxes in any <a href=\"http://validator.w3.org/\">valid HTML document</a> via an automagically generated JavaScript tag — <i>for free!</i>";
			text_36 = createText("\n\n");
			p_3 = createElement("p");
			p_3.textContent = "Just enter the URL of any compatible RSS feed, modify the layout settings as you like and push the Reload button. When finished, copy the HTML code into your own web page – and voilà!";
			text_38 = createText("\n\n");
			p_4 = createElement("p");
			p_4.innerHTML = "The code behind this is written in JavaScript and runs completely in your browser*. You can get the source code together with all the other necessary files from the <a href=\"//github.com/p3k/rss-box\">Github repository</a>.";
			text_42 = createText("\n\n");
			p_5 = createElement("p");
			p_5.innerHTML = "<small svelte-5151739>* A proxy server is needed for cross-origin requests.</small>";
			text_45 = createText("\n\n");
			p_6 = createElement("p");
			github._fragment.c();
			text_47 = createText("\n\n");
			changes._fragment.c();
			text_48 = createText("\n\n");
			h3 = createElement("h3");
			h3.textContent = "Future Development";
			text_50 = createText("\n\n");
			p_7 = createElement("p");
			p_7.textContent = "I have ceased actively developing this viewer but sometimes I get enthusiastic and fiddle around with the code. Of course it will be available here as is.";
			text_52 = createText("\n");
			p_8 = createElement("p");
			p_8.innerHTML = "For questions and comments feel free to contact me (Tobi) via e-mail: <a href=\"mailto:mail+rss@p3k.org\">mail+rss@p3k.org</a>.";
			text_56 = createText("\n\n");
			h3_1 = createElement("h3");
			h3_1.textContent = "License";
			text_58 = createText("\n\n");
			p_9 = createElement("p");
			p_9.innerHTML = "<span xmlns:dct=\"http://purl.org/dc/terms/\" property=\"dct:title\">JavaScript RSS Box Viewer</span> by\n  <a xmlns:cc=\"http://creativecommons.org/ns#\" href=\"http://p3k.org/rss\" property=\"cc:attributionName\" rel=\"cc:attributionURL\">Tobi Schäfer</a> is licensed under a <a rel=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US\">Creative Commons Attribution-ShareAlike 3.0 Austria License</a>.";
			text_65 = createText("\n");
			p_10 = createElement("p");
			p_10.innerHTML = "Based on a work at <a xmlns:dct=\"http://purl.org/dc/terms/\" href=\"https://p3k.org/source/svn/rss-box/trunk/\" rel=\"dct:source\">https://p3k.org/source/svn/rss-box/trunk/</a>.";
			text_69 = createText("\n");
			p_11 = createElement("p");
			p_11.innerHTML = "<a rel=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US\"><img alt=\"Creative Commons License\" style=\"border-width:0\" src=\"//i.creativecommons.org/l/by-sa/3.0/at/88x31.png\"></a>";
			text_72 = createText("\n\n");
			small_2 = createElement("small");
			small_2.innerHTML = "Thank you, <a href=\"//p3k.org/\">p3k.org</a>!";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles(p);
			p.className = "msg warning";
			encapsulateStyles(p_1);
			a_3.href = "http://en.wikipedia.org/wiki/RSS";
			a_4.href = "http://cyber.law.harvard.edu/rss/examples/sampleRss091.xml";
			addListener(a_4, "click", click_handler);
			a_5.href = "http://cyber.law.harvard.edu/rss/examples/sampleRss092.xml";
			addListener(a_5, "click", click_handler_1);
			a_6.href = "http://rss.orf.at/fm4.xml";
			addListener(a_6, "click", click_handler_2);
			a_7.href = "http://blog.p3k.org/stories.xml";
			addListener(a_7, "click", click_handler_3);
			a_8.href = "http://essaysfromexodus.scripting.com/xml/scriptingNews2.xml";
			addListener(a_8, "click", click_handler_4);
			a_9.href = "https://www.theregister.co.uk/headlines.atom";
			addListener(a_9, "click", click_handler_5);
			encapsulateStyles(p_2);
			encapsulateStyles(p_3);
			encapsulateStyles(p_4);
			encapsulateStyles(p_5);
			encapsulateStyles(p_6);
			encapsulateStyles(h3);
			encapsulateStyles(p_7);
			encapsulateStyles(p_8);
			encapsulateStyles(h3_1);
			encapsulateStyles(p_9);
			encapsulateStyles(p_10);
			encapsulateStyles(p_11);
			encapsulateStyles(small_2);
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
			appendNode(a_9, p_1);
			appendNode(text_29, p_1);
			insertNode(text_30, target, anchor);
			insertNode(p_2, target, anchor);
			insertNode(text_36, target, anchor);
			insertNode(p_3, target, anchor);
			insertNode(text_38, target, anchor);
			insertNode(p_4, target, anchor);
			insertNode(text_42, target, anchor);
			insertNode(p_5, target, anchor);
			insertNode(text_45, target, anchor);
			insertNode(p_6, target, anchor);
			github._mount(p_6, null);
			insertNode(text_47, target, anchor);
			changes._mount(target, anchor);
			insertNode(text_48, target, anchor);
			insertNode(h3, target, anchor);
			insertNode(text_50, target, anchor);
			insertNode(p_7, target, anchor);
			insertNode(text_52, target, anchor);
			insertNode(p_8, target, anchor);
			insertNode(text_56, target, anchor);
			insertNode(h3_1, target, anchor);
			insertNode(text_58, target, anchor);
			insertNode(p_9, target, anchor);
			insertNode(text_65, target, anchor);
			insertNode(p_10, target, anchor);
			insertNode(text_69, target, anchor);
			insertNode(p_11, target, anchor);
			insertNode(text_72, target, anchor);
			insertNode(small_2, target, anchor);
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
			detachNode(text_30);
			detachNode(p_2);
			detachNode(text_36);
			detachNode(p_3);
			detachNode(text_38);
			detachNode(p_4);
			detachNode(text_42);
			detachNode(p_5);
			detachNode(text_45);
			detachNode(p_6);
			detachNode(text_47);
			changes._unmount();
			detachNode(text_48);
			detachNode(h3);
			detachNode(text_50);
			detachNode(p_7);
			detachNode(text_52);
			detachNode(p_8);
			detachNode(text_56);
			detachNode(h3_1);
			detachNode(text_58);
			detachNode(p_9);
			detachNode(text_65);
			detachNode(p_10);
			detachNode(text_69);
			detachNode(p_11);
			detachNode(text_72);
			detachNode(small_2);
		},

		d: function destroy$$1() {
			removeListener(a_4, "click", click_handler);
			removeListener(a_5, "click", click_handler_1);
			removeListener(a_6, "click", click_handler_2);
			removeListener(a_7, "click", click_handler_3);
			removeListener(a_8, "click", click_handler_4);
			removeListener(a_9, "click", click_handler_5);
			github.destroy(false);
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

	if (!document.getElementById("svelte-5151739-style")) add_css();

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
(window.adsbygoogle = window.adsbygoogle || []).push({});

const script$1 = document.createElement('script');
script$1.async = true;
script$1.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
document.head.appendChild(script$1);

function encapsulateStyles$2(node) {
	setAttribute(node, "svelte-286980571", "");
}

function add_css$2() {
	var style = createElement("style");
	style.id = 'svelte-286980571-style';
	style.textContent = "ins[svelte-286980571]{overflow:hidden;margin-bottom:1em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWQuaHRtbCIsInNvdXJjZXMiOlsiQWQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8aW5zIGNsYXNzPVwiYWRzYnlnb29nbGVcIiBzdHlsZT1cImRpc3BsYXk6YmxvY2tcIiBkYXRhLWFkLWNsaWVudD1cImNhLXB1Yi0zOTY1MDI4MDQzMTUzMTM4XCIgZGF0YS1hZC1zbG90PVwiNjM3MDI1NzQ1MVwiIGRhdGEtYWQtZm9ybWF0PVwiYXV0b1wiPjwvaW5zPlxuXG48c2NyaXB0PlxuICAod2luZG93LmFkc2J5Z29vZ2xlID0gd2luZG93LmFkc2J5Z29vZ2xlIHx8IFtdKS5wdXNoKHt9KTtcblxuICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgc2NyaXB0LnNyYyA9ICcvL3BhZ2VhZDIuZ29vZ2xlc3luZGljYXRpb24uY29tL3BhZ2VhZC9qcy9hZHNieWdvb2dsZS5qcyc7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIGlucyB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBtYXJnaW4tYm90dG9tOiAxZW07XG4gIH1cbjwvc3R5bGU+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBWUUsR0FBRyxrQkFBQyxDQUFDLEFBQ0gsUUFBUSxDQUFFLE1BQU0sQ0FDaEIsYUFBYSxDQUFFLEdBQUcsQUFDcEIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$4(state, component) {
	var ins;

	return {
		c: function create() {
			ins = createElement("ins");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$2(ins);
			ins.className = "adsbygoogle";
			setStyle(ins, "display", "block");
			ins.dataset.adClient = "ca-pub-3965028043153138";
			ins.dataset.adSlot = "6370257451";
			ins.dataset.adFormat = "auto";
		},

		m: function mount(target, anchor) {
			insertNode(ins, target, anchor);
		},

		p: noop,

		u: function unmount() {
			detachNode(ins);
		},

		d: noop
	};
}

function Ad(options) {
	this._debugName = '<Ad>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	if (!document.getElementById("svelte-286980571-style")) add_css$2();

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

/* components/LinkIcon.html generated by Svelte v1.50.0 */
function encapsulateStyles$4(node) {
	setAttribute(node, "svelte-940045756", "");
}

function add_css$4() {
	var style = createElement("style");
	style.id = 'svelte-940045756-style';
	style.textContent = "svg[svelte-940045756]{width:1.2em;height:1.2em}polygon[svelte-940045756]{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0ljb24uaHRtbCIsInNvdXJjZXMiOlsiTGlua0ljb24uaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8IS0tIFNvdXJjZTogaHR0cHM6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9GaWxlOlZpc3VhbEVkaXRvcl8tX0ljb25fLV9FeHRlcm5hbC1saW5rLnN2ZyAtLT5cblxuPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMiAxMicgcHJlc2VydmVBc3BlY3RSYXRpbz0neE1pbllNaW4nPlxuICA8Zz5cbiAgICA8cG9seWdvbiBwb2ludHM9JzIsMiA1LDIgNSwzIDMsMyAzLDkgOSw5IDksNyAxMCw3IDEwLDEwIDIsMTAnLz5cbiAgICA8cG9seWdvbiBwb2ludHM9JzYuMjExLDIgMTAsMiAxMCw1Ljc4OSA4LjU3OSw0LjM2OCA2LjQ0Nyw2LjUgNS41LDUuNTUzIDcuNjMyLDMuNDIxJy8+XG4gIDwvZz5cbjwvc3ZnPlxuXG48c3R5bGU+XG4gIHN2ZyB7XG4gICAgd2lkdGg6IDEuMmVtO1xuICAgIGhlaWdodDogMS4yZW07XG4gIH1cblxuICBwb2x5Z29uIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gICAgZmlsbC1ydWxlOiBldmVub2RkO1xuICAgIGNsaXAtcnVsZTogZXZlbm9kZDtcbiAgfVxuPC9zdHlsZT5cblxuPHNjcmlwdD5cbiAgZXhwb3J0IGRlZmF1bHQge1xuICAgIG5hbWVzcGFjZTogJ3N2ZydcbiAgfTtcbjwvc2NyaXB0PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVFLEdBQUcsa0JBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLEtBQUssQUFDZixDQUFDLEFBRUQsT0FBTyxrQkFBQyxDQUFDLEFBQ1AsSUFBSSxDQUFFLFlBQVksQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQUFDcEIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$6(state, component) {
	var svg, g, polygon, polygon_1;

	return {
		c: function create() {
			svg = createSvgElement("svg");
			g = createSvgElement("g");
			polygon = createSvgElement("polygon");
			polygon_1 = createSvgElement("polygon");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$4(svg);
			encapsulateStyles$4(polygon);
			setAttribute(polygon, "points", "2,2 5,2 5,3 3,3 3,9 9,9 9,7 10,7 10,10 2,10");
			encapsulateStyles$4(polygon_1);
			setAttribute(polygon_1, "points", "6.211,2 10,2 10,5.789 8.579,4.368 6.447,6.5 5.5,5.553 7.632,3.421");
			setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
			setAttribute(svg, "viewBox", "0 0 12 12");
			setAttribute(svg, "preserveAspectRatio", "xMinYMin");
		},

		m: function mount(target, anchor) {
			insertNode(svg, target, anchor);
			appendNode(g, svg);
			appendNode(polygon, g);
			appendNode(polygon_1, g);
		},

		p: noop,

		u: function unmount() {
			detachNode(svg);
		},

		d: noop
	};
}

function LinkIcon(options) {
	this._debugName = '<LinkIcon>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	if (!document.getElementById("svelte-940045756-style")) add_css$4();

	this._fragment = create_main_fragment$6(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(LinkIcon.prototype, protoDev);

LinkIcon.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/RssIcon.html generated by Svelte v1.50.0 */
function encapsulateStyles$5(node) {
	setAttribute(node, "svelte-2589761347", "");
}

function add_css$5() {
	var style = createElement("style");
	style.id = 'svelte-2589761347-style';
	style.textContent = "svg[svelte-2589761347]{width:1em;height:1em}path[svelte-2589761347]{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnNzSWNvbi5odG1sIiwic291cmNlcyI6WyJSc3NJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpSc3NfZm9udF9hd2Vzb21lLnN2ZyAtLT5cblxuPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgLTI1NiAxNzkyIDE3OTInIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPGcgdHJhbnNmb3JtPSdtYXRyaXgoMSwwLDAsLTEsMjEyLjYxMDE3LDEzNDYuMTY5NSknPlxuICAgIDxwYXRoIGQ9J00gMzg0LDE5MiBRIDM4NCwxMTIgMzI4LDU2IDI3MiwwIDE5MiwwIDExMiwwIDU2LDU2IDAsMTEyIDAsMTkyIHEgMCw4MCA1NiwxMzYgNTYsNTYgMTM2LDU2IDgwLDAgMTM2LC01NiA1NiwtNTYgNTYsLTEzNiB6IE0gODk2LDY5IFEgODk4LDQxIDg3OSwyMSA4NjEsMCA4MzIsMCBIIDY5NyBRIDY3MiwwIDY1NCwxNi41IDYzNiwzMyA2MzQsNTggNjEyLDI4NyA0NDkuNSw0NDkuNSAyODcsNjEyIDU4LDYzNCAzMyw2MzYgMTYuNSw2NTQgMCw2NzIgMCw2OTcgdiAxMzUgcSAwLDI5IDIxLDQ3IDE3LDE3IDQzLDE3IGggNSBRIDIyOSw4ODMgMzc1LDgxNS41IDUyMSw3NDggNjM0LDYzNCA3NDgsNTIxIDgxNS41LDM3NSA4ODMsMjI5IDg5Niw2OSB6IG0gNTEyLC0yIFEgMTQxMCw0MCAxMzkwLDIwIDEzNzIsMCAxMzQ0LDAgSCAxMjAxIFEgMTE3NSwwIDExNTYuNSwxNy41IDExMzgsMzUgMTEzNyw2MCAxMTI1LDI3NSAxMDM2LDQ2OC41IDk0Nyw2NjIgODA0LjUsODA0LjUgNjYyLDk0NyA0NjguNSwxMDM2IDI3NSwxMTI1IDYwLDExMzggMzUsMTEzOSAxNy41LDExNTcuNSAwLDExNzYgMCwxMjAxIHYgMTQzIHEgMCwyOCAyMCw0NiAxOCwxOCA0NCwxOCBoIDMgUSAzMjksMTM5NSA1NjguNSwxMjg4IDgwOCwxMTgxIDk5NCw5OTQgMTE4MSw4MDggMTI4OCw1NjguNSAxMzk1LDMyOSAxNDA4LDY3IHonLz5cbiAgPC9nPlxuPC9zdmc+XG5cbjxzdHlsZT5cbiAgc3ZnIHtcbiAgICB3aWR0aDogMWVtO1xuICAgIGhlaWdodDogMWVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG5cbjxzY3JpcHQ+XG4gIGV4cG9ydCBkZWZhdWx0IHtcbiAgICBuYW1lc3BhY2U6ICdzdmcnXG4gIH1cbjwvc2NyaXB0PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNFLEdBQUcsbUJBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEdBQUcsQUFDYixDQUFDLEFBRUQsSUFBSSxtQkFBQyxDQUFDLEFBQ0osSUFBSSxDQUFFLFlBQVksQUFDcEIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$7(state, component) {
	var svg, g, path;

	return {
		c: function create() {
			svg = createSvgElement("svg");
			g = createSvgElement("g");
			path = createSvgElement("path");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$5(svg);
			encapsulateStyles$5(path);
			setAttribute(path, "d", "M 384,192 Q 384,112 328,56 272,0 192,0 112,0 56,56 0,112 0,192 q 0,80 56,136 56,56 136,56 80,0 136,-56 56,-56 56,-136 z M 896,69 Q 898,41 879,21 861,0 832,0 H 697 Q 672,0 654,16.5 636,33 634,58 612,287 449.5,449.5 287,612 58,634 33,636 16.5,654 0,672 0,697 v 135 q 0,29 21,47 17,17 43,17 h 5 Q 229,883 375,815.5 521,748 634,634 748,521 815.5,375 883,229 896,69 z m 512,-2 Q 1410,40 1390,20 1372,0 1344,0 H 1201 Q 1175,0 1156.5,17.5 1138,35 1137,60 1125,275 1036,468.5 947,662 804.5,804.5 662,947 468.5,1036 275,1125 60,1138 35,1139 17.5,1157.5 0,1176 0,1201 v 143 q 0,28 20,46 18,18 44,18 h 3 Q 329,1395 568.5,1288 808,1181 994,994 1181,808 1288,568.5 1395,329 1408,67 z");
			setAttribute(g, "transform", "matrix(1,0,0,-1,212.61017,1346.1695)");
			setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
			setAttribute(svg, "viewBox", "0 -256 1792 1792");
			setAttribute(svg, "preserveAspectRatio", "xMinYMin");
		},

		m: function mount(target, anchor) {
			insertNode(svg, target, anchor);
			appendNode(g, svg);
			appendNode(path, g);
		},

		p: noop,

		u: function unmount() {
			detachNode(svg);
		},

		d: noop
	};
}

function RssIcon(options) {
	this._debugName = '<RssIcon>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	if (!document.getElementById("svelte-2589761347-style")) add_css$5();

	this._fragment = create_main_fragment$7(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(RssIcon.prototype, protoDev);

RssIcon.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/PaperclipIcon.html generated by Svelte v1.50.0 */
function encapsulateStyles$6(node) {
	setAttribute(node, "svelte-2967622608", "");
}

function add_css$6() {
	var style = createElement("style");
	style.id = 'svelte-2967622608-style';
	style.textContent = "svg[svelte-2967622608]{width:1.2em;height:1.2em}path[svelte-2967622608]{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFwZXJjbGlwSWNvbi5odG1sIiwic291cmNlcyI6WyJQYXBlcmNsaXBJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpBbnR1X2FwcGxpY2F0aW9uLXJ0Zi5zdmcgLS0+XG5cbjxzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB2aWV3Qm94PScwIDAgMTYgMTYnIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPHBhdGggZD0nbTQwOSA1MzFsLTUuMjQ0IDYuNzMzYy0uOTgzIDEuMjYyLS43MDggMy41MTEuNTUgNC40OTcgMS4yNTkuOTg2IDMuNS43MSA0LjQ4NC0uNTUybDUuMjQ0LTYuNzMzLjY1NS0uODQyYy42NTYtLjg0Mi40NzItMi4zNDEtLjM2Ny0yLjk5OC0uODM5LS42NTgtMi4zMzQtLjQ3My0yLjk4OS4zNjhsLS42NTYuODQyLTMuOTMzIDUuMDUtLjY1Ni44NDJjLS4zMjguNDIxLS4yMzYgMS4xNy4xODMgMS40OTkuNDIuMzI5IDEuMTY3LjIzNyAxLjQ5NS0uMTg0bDQuNTg5LTUuODkxLjgzOS42NTgtNC41ODkgNS44OTFjLS42NTYuODQyLTIuMTUgMS4wMjYtMi45ODkuMzY4LS44MzktLjY1OC0xLjAyMy0yLjE1Ny0uMzY3LTIuOTk4bC42NTYtLjg0MiA0LjU4OS01Ljg5MWMuOTgzLTEuMjYyIDMuMjI1LTEuNTM4IDQuNDg0LS41NTIgMS4yNTkuOTg2IDEuNTM0IDMuMjM1LjU1MSA0LjQ5N2wtLjY1Ni44NDItNS4yNDQgNi43MzNjLTEuMzExIDEuNjgzLTQuMyAyLjA1MS01Ljk3OC43MzYtMS42NzgtMS4zMTUtMi4wNDUtNC4zMTMtLjczNC01Ljk5N2w1LjI0NC02LjczMy44MzkuNjU4JyB0cmFuc2Zvcm09J21hdHJpeCguODQ3ODIgMCAwIC44NDUyMS0zMzguODUtNDQ1LjY4KScgc3Ryb2tlPSdub25lJy8+XG48L3N2Zz5cblxuPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxLjJlbTtcbiAgICBoZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICBleHBvcnQgZGVmYXVsdCB7XG4gICAgbmFtZXNwYWNlOiAnc3ZnJ1xuICB9XG48L3NjcmlwdD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFPRSxHQUFHLG1CQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUFLLEFBQ2YsQ0FBQyxBQUVELElBQUksbUJBQUMsQ0FBQyxBQUNKLElBQUksQ0FBRSxZQUFZLEFBQ3BCLENBQUMifQ== */";
	appendNode(style, document.head);
}

function create_main_fragment$8(state, component) {
	var svg, path;

	return {
		c: function create() {
			svg = createSvgElement("svg");
			path = createSvgElement("path");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$6(svg);
			encapsulateStyles$6(path);
			setAttribute(path, "d", "m409 531l-5.244 6.733c-.983 1.262-.708 3.511.55 4.497 1.259.986 3.5.71 4.484-.552l5.244-6.733.655-.842c.656-.842.472-2.341-.367-2.998-.839-.658-2.334-.473-2.989.368l-.656.842-3.933 5.05-.656.842c-.328.421-.236 1.17.183 1.499.42.329 1.167.237 1.495-.184l4.589-5.891.839.658-4.589 5.891c-.656.842-2.15 1.026-2.989.368-.839-.658-1.023-2.157-.367-2.998l.656-.842 4.589-5.891c.983-1.262 3.225-1.538 4.484-.552 1.259.986 1.534 3.235.551 4.497l-.656.842-5.244 6.733c-1.311 1.683-4.3 2.051-5.978.736-1.678-1.315-2.045-4.313-.734-5.997l5.244-6.733.839.658");
			setAttribute(path, "transform", "matrix(.84782 0 0 .84521-338.85-445.68)");
			setAttribute(path, "stroke", "none");
			setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
			setAttribute(svg, "viewBox", "0 0 16 16");
			setAttribute(svg, "preserveAspectRatio", "xMinYMin");
		},

		m: function mount(target, anchor) {
			insertNode(svg, target, anchor);
			appendNode(path, svg);
		},

		p: noop,

		u: function unmount() {
			detachNode(svg);
		},

		d: noop
	};
}

function PaperclipIcon(options) {
	this._debugName = '<PaperclipIcon>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign({}, options.data);

	if (!document.getElementById("svelte-2967622608-style")) add_css$6();

	this._fragment = create_main_fragment$8(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
	}
}

assign(PaperclipIcon.prototype, protoDev);

PaperclipIcon.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/Box.html generated by Svelte v1.50.0 */
function height($height) {
	return $height && $height > -1 ? $height + 'px' : '100%';
}

function width($width) {
	return $width ? $width + 'px' : '100%';
}

function itemTitleClass($compact) {
	return !$compact ? 'bold' : '';
}

function kb(bytes) {
  return (bytes / 1000).toFixed(2) + '\u200akB';
}

function appUrl(dummy = null) {
  return urls$$1.app;
}

function load(data) {
  return new Promise(fulfill => {
    const image = new Image();

    image.onload = () => {
      const maxWidth = Math.min(100, image.width);
      const factor = image.width > maxWidth ? maxWidth / image.width : 1;

      fulfill({
        width: (image.width * factor) + 'px',
        height: (image.height * factor) + 'px'
      });
    };

    image.src = data.source;
  });
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
    staticCss.href = urls$$1.app + '/box.css';
    document.head.appendChild(staticCss);
  }

  if (!dynamicCss) {
    dynamicCss = document.createElement('style');
    dynamicCss.id = dynamicId;
    document.head.appendChild(dynamicCss);
  }

  this.store.observe('linkColor', color => {
    if (!color) return;

    let rule =
      `.rssbox[data-link-color="${color}"] a {
        color: ${color};
      }`;

    if (dynamicCss.innerHTML.indexOf(rule) < 0) dynamicCss.innerHTML += rule;
  });
}

function encapsulateStyles$3(node) {
	setAttribute(node, "svelte-1374782793", "");
}

function add_css$3() {
	var style = createElement("style");
	style.id = 'svelte-1374782793-style';
	style.textContent = ".rssbox[svelte-1374782793]{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon[svelte-1374782793]{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar[svelte-1374782793]{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date[svelte-1374782793]{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content[svelte-1374782793]{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content[svelte-1374782793] aside[svelte-1374782793]{clear:both;float:right}.rssbox-content[svelte-1374782793] aside a[svelte-1374782793]{display:block;margin-left:0.5em}.rssbox-image[svelte-1374782793]{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold[svelte-1374782793]{font-weight:bold}.rssbox-enclosure[svelte-1374782793],.rssbox-source[svelte-1374782793]{display:block;width:1em}.rssbox-form[svelte-1374782793]{margin-bottom:0.8em}.rssbox-form[svelte-1374782793] input[svelte-1374782793]{padding:0.5em;background-color:#fff}.rssbox-promo[svelte-1374782793]{text-align:right;font-size:0.7em;letter-spacing:0.01em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94Lmh0bWwiLCJzb3VyY2VzIjpbIkJveC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxkaXYgZGF0YS1saW5rLWNvbG9yPSd7eyAkbGlua0NvbG9yIH19JyBjbGFzcz0ncnNzYm94IHJzc0JveCcgc3R5bGU9J21heC13aWR0aDoge3sgd2lkdGggfX07IGJvcmRlci1jb2xvcjoge3sgJGZyYW1lQ29sb3IgfX07IGJvcmRlci1yYWRpdXM6IHt7ICRyYWRpdXMgfX1weDsgZm9udDoge3sgJGZvbnRGYWNlIH19OyBmbG9hdDoge3sgJGFsaWduIH19Oyc+XG4gIHt7ICNpZiAhJGhlYWRsZXNzIH19XG4gICAgPGRpdiBjbGFzcz0ncnNzYm94LXRpdGxlYmFyJyBzdHlsZT0nY29sb3I6IHt7ICR0aXRsZUJhclRleHRDb2xvciB9fTsgYmFja2dyb3VuZC1jb2xvcjoge3sgJHRpdGxlQmFyQ29sb3IgfX07IGJvcmRlci1ib3R0b20tY29sb3I6IHt7ICRmcmFtZUNvbG9yIH19Oyc+XG4gICAgICB7eyAjaWYgJHNob3dYbWxCdXR0b24gfX1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWljb24nPlxuICAgICAgICAgIDxhIGhyZWY9J3t7ICR1cmwgfX0nIHRpdGxlPSd7eyAkZm9ybWF0IH19IHt7ICR2ZXJzaW9uIH19JyBzdHlsZT0nY29sb3I6IHt7ICR0aXRsZUJhclRleHRDb2xvciB9fSc+XG4gICAgICAgICAgICA8UnNzSWNvbi8+XG4gICAgICAgICAgPC9hPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIHt7IC9pZiB9fVxuICAgICAgPGRpdj5cbiAgICAgICAgPGEgaHJlZj0ne3sgJGxpbmsgfX0nIHN0eWxlPSdjb2xvcjoge3sgJHRpdGxlQmFyVGV4dENvbG9yIH19Oyc+XG4gICAgICAgICAge3sgJHRpdGxlIH19XG4gICAgICAgIDwvYT5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWRhdGUnPlxuICAgICAgICB7eyAkZm9ybWF0dGVkRGF0ZSB9fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIHt7IC9pZiB9fVxuXG4gIDxkaXYgY2xhc3M9J3Jzc2JveC1jb250ZW50IHJzc0JveENvbnRlbnQnIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiB7eyAkYm94RmlsbENvbG9yIH19OyBoZWlnaHQ6IHt7IGhlaWdodCB9fTsnPlxuICAgIHt7ICNpZiAkaW1hZ2UgJiYgISRjb21wYWN0IH19XG4gICAgICB7eyAjYXdhaXQgbG9hZCgkaW1hZ2UpIH19XG4gICAgICB7eyB0aGVuIGltYWdlIH19XG4gICAgICAgIDxhIGhyZWY9J3t7ICRpbWFnZS5saW5rIH19JyB0aXRsZT0ne3sgJGltYWdlLnRpdGxlIH19Jz5cbiAgICAgICAgICA8ZGl2IGFsdD0ne3sgJGltYWdlLmRlc2NyaXB0aW9uIH19JyBjbGFzcz0ncnNzYm94LWltYWdlJyBzdHlsZT0nYmFja2dyb3VuZC1pbWFnZTogdXJsKHt7ICRpbWFnZS5zb3VyY2UgfX0pOyB3aWR0aDoge3sgaW1hZ2Uud2lkdGggfX07IGhlaWdodDoge3sgaW1hZ2UuaGVpZ2h0IH19Oyc+PC9kaXY+XG4gICAgICAgIDwvYT5cbiAgICAgIHt7IC9hd2FpdCB9fVxuICAgIHt7IC9pZiB9fVxuXG4gICAge3sgI2VhY2ggJGl0ZW1zIGFzIGl0ZW0sIGluZGV4IH19XG4gICAgICB7eyAjaWYgaW5kZXggPCAkbWF4SXRlbXMgfX1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWl0ZW0tY29udGVudCByc3NCb3hJdGVtQ29udGVudCcgc3R5bGU9J2NvbG9yOiB7eyAkdGV4dENvbG9yIH19Jz5cbiAgICAgICAgICB7eyAjaWYgaXRlbS50aXRsZSB9fVxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWl0ZW0tdGl0bGUge3sgaXRlbVRpdGxlQ2xhc3MgfX0nPlxuICAgICAgICAgICAgICB7eyAjaWYgaXRlbS5saW5rIH19XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0ne3sgaXRlbS5saW5rIH19Jz5cbiAgICAgICAgICAgICAgICAgIHt7eyBpdGVtLnRpdGxlIH19fVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAge3sgZWxzZSB9fVxuICAgICAgICAgICAgICAgIHt7eyBpdGVtLnRpdGxlIH19fVxuICAgICAgICAgICAgICB7eyAvaWYgfX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHt7IC9pZiB9fVxuXG4gICAgICAgICAge3sgI2lmICEkY29tcGFjdCB9fVxuICAgICAgICAgICAgPGFzaWRlPlxuICAgICAgICAgICAgICB7eyAjaWYgaXRlbS5zb3VyY2UgfX1cbiAgICAgICAgICAgICAgICA8YSBocmVmPSd7eyBpdGVtLnNvdXJjZS51cmwgfX0nIHRpdGxlPSd7eyBpdGVtLnNvdXJjZS50aXRsZSB9fScgY2xhc3M9J3Jzc2JveC1zb3VyY2UnPlxuICAgICAgICAgICAgICAgICAge3sgI2lmIGl0ZW0uc291cmNlLnVybC5lbmRzV2l0aCgnLnhtbCcpIH19XG4gICAgICAgICAgICAgICAgICAgIDxSc3NJY29uLz5cbiAgICAgICAgICAgICAgICAgIHt7IGVsc2UgfX1cbiAgICAgICAgICAgICAgICAgICAgPExpbmtJY29uLz5cbiAgICAgICAgICAgICAgICAgIHt7IC9pZiB9fVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAge3sgL2lmIH19XG5cbiAgICAgICAgICAgICAge3sgI2lmIGl0ZW0uZW5jbG9zdXJlcyB9fVxuICAgICAgICAgICAgICAgIHt7ICNlYWNoIGl0ZW0uZW5jbG9zdXJlcyBhcyBlbmNsb3N1cmUgfX1cbiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9J3t7IGVuY2xvc3VyZS51cmwgfX0nIHRpdGxlPSd7eyBrYihlbmNsb3N1cmUubGVuZ3RoKSB9fSB7eyBlbmNsb3N1cmUudHlwZSB9fScgY2xhc3M9J3Jzc2JveC1lbmNsb3N1cmUnPlxuICAgICAgICAgICAgICAgICAgICA8UGFwZXJjbGlwSWNvbi8+XG4gICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAge3sgL2VhY2ggfX1cbiAgICAgICAgICAgICAge3sgL2lmIH19XG4gICAgICAgICAgICA8L2FzaWRlPlxuICAgICAgICAgICAge3t7IGl0ZW0uZGVzY3JpcHRpb24gfX19XG4gICAgICAgICAge3sgL2lmIH19XG4gICAgICAgIDwvZGl2PlxuICAgICAge3sgL2lmIH19XG4gICAge3sgL2VhY2ggfX1cblxuICAgIHt7ICNpZiAkaW5wdXQgfX1cbiAgICAgIDxmb3JtIGNsYXNzPSdyc3Nib3gtZm9ybScgbWV0aG9kPSdnZXQnIGFjdGlvbj0ne3sgJGlucHV0LmxpbmsgfX0nPlxuICAgICAgICA8aW5wdXQgdHlwZT0ndGV4dCcgbmFtZT0ne3sgJGlucHV0Lm5hbWUgfX0nIHBsYWNlaG9sZGVyPSdFbnRlciBzZWFyY2ggJmFtcDsgaGl0IHJldHVybuKApicgZGF0YS1wbGFjZWhvbGRlcj0ne3sgJGlucHV0LmRlc2NyaXB0aW9uIH19Jz5cbiAgICAgICAgPCEtLSBpbnB1dCB0eXBlPSdzdWJtaXQnIHZhbHVlPSd7eyAkaW5wdXQudGl0bGUgfX0nIC0tPlxuICAgICAgPC9mb3JtPlxuICAgIHt7IC9pZiB9fVxuICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1wcm9tbyByc3NCb3hQcm9tbyc+XG4gICAgICA8YSBocmVmPSd7eyBhcHBVcmwoKSB9fScgc3R5bGU9J2NvbG9yOiB7eyAkdGV4dENvbG9yIH19Jz5SU1MgQm94IGJ5IHAzay5vcmc8L2E+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLnJzc2JveCB7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjMDAwO1xuICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDA7XG4gIH1cblxuICAucnNzYm94LWljb24ge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICB3aWR0aDogMWVtO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtdGl0bGViYXIge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGNvbG9yOiAjMDAwO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNhZGQ4ZTY7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICMwMDA7XG4gICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZGF0ZSB7XG4gICAgbWFyZ2luLXRvcDogMC4yZW07XG4gICAgZm9udC1zaXplOiAwLjhlbTtcbiAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IHtcbiAgICBoZWlnaHQ6IGF1dG87XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgICBjbGVhcjogYm90aDtcbiAgICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgfVxuXG4gIC5yc3Nib3gtY29udGVudCBhc2lkZSB7XG4gICAgY2xlYXI6IGJvdGg7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IGFzaWRlIGEge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtaW1hZ2Uge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICBtYXJnaW46IDAgMCAwLjVlbSAwLjVlbTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBsZWZ0IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcbiAgfVxuXG4gIC5yc3Nib3gtaXRlbS10aXRsZS5ib2xkIHtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxuXG4gIC5yc3Nib3gtZW5jbG9zdXJlLCAucnNzYm94LXNvdXJjZSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZm9ybSB7XG4gICAgbWFyZ2luLWJvdHRvbTogMC44ZW07XG4gIH1cblxuICAucnNzYm94LWZvcm0gaW5wdXQge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIH1cblxuICAucnNzYm94LXByb21vIHtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjAxZW07XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7IHVybHMgfSBmcm9tICcuLi9zcmMvc2V0dGluZ3MnO1xuICBpbXBvcnQgTGlua0ljb24gZnJvbSAnLi9MaW5rSWNvbi5odG1sJztcbiAgaW1wb3J0IFJzc0ljb24gZnJvbSAnLi9Sc3NJY29uLmh0bWwnO1xuICBpbXBvcnQgUGFwZXJjbGlwSWNvbiBmcm9tICcuL1BhcGVyY2xpcEljb24uaHRtbCc7XG5cbiAgZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgIExpbmtJY29uLFxuICAgICAgUGFwZXJjbGlwSWNvbixcbiAgICAgIFJzc0ljb25cbiAgICB9LFxuXG4gICAgb25jcmVhdGUoKSB7XG4gICAgICBjb25zdCBzdGF0aWNJZCA9ICdyc3Nib3gtc3RhdGljLXN0eWxlc2hlZXQnO1xuICAgICAgY29uc3QgZHluYW1pY0lkID0gJ3Jzc2JveC1keW5hbWljLXN0eWxlc2hlZXQnO1xuXG4gICAgICBsZXQgc3RhdGljQ3NzID0gd2luZG93W3N0YXRpY0lkXTtcbiAgICAgIGxldCBkeW5hbWljQ3NzID0gd2luZG93W2R5bmFtaWNJZF07XG5cbiAgICAgIGlmICghc3RhdGljQ3NzKSB7XG4gICAgICAgIHN0YXRpY0NzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICAgICAgc3RhdGljQ3NzLmlkID0gc3RhdGljSWQ7XG4gICAgICAgIHN0YXRpY0Nzcy5yZWwgPSAnc3R5bGVzaGVldCc7XG4gICAgICAgIHN0YXRpY0Nzcy5ocmVmID0gdXJscy5hcHAgKyAnL2JveC5jc3MnO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0YXRpY0Nzcyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZHluYW1pY0Nzcykge1xuICAgICAgICBkeW5hbWljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgZHluYW1pY0Nzcy5pZCA9IGR5bmFtaWNJZDtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChkeW5hbWljQ3NzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdG9yZS5vYnNlcnZlKCdsaW5rQ29sb3InLCBjb2xvciA9PiB7XG4gICAgICAgIGlmICghY29sb3IpIHJldHVybjtcblxuICAgICAgICBsZXQgcnVsZSA9XG4gICAgICAgICAgYC5yc3Nib3hbZGF0YS1saW5rLWNvbG9yPVwiJHtjb2xvcn1cIl0gYSB7XG4gICAgICAgICAgICBjb2xvcjogJHtjb2xvcn07XG4gICAgICAgICAgfWA7XG5cbiAgICAgICAgaWYgKGR5bmFtaWNDc3MuaW5uZXJIVE1MLmluZGV4T2YocnVsZSkgPCAwKSBkeW5hbWljQ3NzLmlubmVySFRNTCArPSBydWxlO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGhlbHBlcnM6IHtcbiAgICAgIGtiKGJ5dGVzKSB7XG4gICAgICAgIHJldHVybiAoYnl0ZXMgLyAxMDAwKS50b0ZpeGVkKDIpICsgJ1xcdTIwMGFrQic7XG4gICAgICB9LFxuXG4gICAgICAvLyBXaXRob3V0IHRoZSBkdW1teSBhcmd1bWVudCBTdmVsdGUgY29tcGxhaW5zIGFib3V0IHRoaXMgbm90IGJlaW5nIGEgcHVyZSBmdW5jdGlvblxuICAgICAgYXBwVXJsKGR1bW15ID0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdXJscy5hcHA7XG4gICAgICB9LFxuXG4gICAgICBsb2FkKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXhXaWR0aCA9IE1hdGgubWluKDEwMCwgaW1hZ2Uud2lkdGgpO1xuICAgICAgICAgICAgY29uc3QgZmFjdG9yID0gaW1hZ2Uud2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIC8gaW1hZ2Uud2lkdGggOiAxO1xuXG4gICAgICAgICAgICBmdWxmaWxsKHtcbiAgICAgICAgICAgICAgd2lkdGg6IChpbWFnZS53aWR0aCAqIGZhY3RvcikgKyAncHgnLFxuICAgICAgICAgICAgICBoZWlnaHQ6IChpbWFnZS5oZWlnaHQgKiBmYWN0b3IpICsgJ3B4J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGltYWdlLnNyYyA9IGRhdGEuc291cmNlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgIGhlaWdodDogJGhlaWdodCA9PiAkaGVpZ2h0ICYmICRoZWlnaHQgPiAtMSA/ICRoZWlnaHQgKyAncHgnIDogJzEwMCUnLFxuICAgICAgd2lkdGg6ICR3aWR0aCA9PiAkd2lkdGggPyAkd2lkdGggKyAncHgnIDogJzEwMCUnLFxuICAgICAgaXRlbVRpdGxlQ2xhc3M6ICRjb21wYWN0ID0+ICEkY29tcGFjdCA/ICdib2xkJyA6ICcnXG4gICAgfVxuICB9O1xuPC9zY3JpcHQ+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBcUZFLE9BQU8sbUJBQUMsQ0FBQyxBQUNQLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUN0QixXQUFXLENBQUUsVUFBVSxDQUN2QixRQUFRLENBQUUsTUFBTSxDQUNoQixhQUFhLENBQUUsQ0FBQyxDQUNoQixrQkFBa0IsQ0FBRSxDQUFDLEFBQ3ZCLENBQUMsQUFFRCxZQUFZLG1CQUFDLENBQUMsQUFDWixLQUFLLENBQUUsS0FBSyxDQUNaLEtBQUssQ0FBRSxHQUFHLENBQ1YsV0FBVyxDQUFFLEtBQUssQUFDcEIsQ0FBQyxBQUVELGdCQUFnQixtQkFBQyxDQUFDLEFBQ2hCLE9BQU8sQ0FBRSxLQUFLLENBQ2QsS0FBSyxDQUFFLElBQUksQ0FDWCxnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLGFBQWEsQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDN0IsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQUFDeEIsQ0FBQyxBQUVELFlBQVksbUJBQUMsQ0FBQyxBQUNaLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxNQUFNLEFBQ3JCLENBQUMsQUFFRCxlQUFlLG1CQUFDLENBQUMsQUFDZixNQUFNLENBQUUsSUFBSSxDQUNaLE9BQU8sQ0FBRSxLQUFLLENBQ2QsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsZ0JBQWdCLENBQUUsSUFBSSxDQUN0QixLQUFLLENBQUUsSUFBSSxDQUNYLGtCQUFrQixDQUFFLHdCQUF3QixBQUM5QyxDQUFDLEFBRUQsa0NBQWUsQ0FBQyxLQUFLLG1CQUFDLENBQUMsQUFDckIsS0FBSyxDQUFFLElBQUksQ0FDWCxLQUFLLENBQUUsS0FBSyxBQUNkLENBQUMsQUFFRCxrQ0FBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLG1CQUFDLENBQUMsQUFDdkIsT0FBTyxDQUFFLEtBQUssQ0FDZCxXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsYUFBYSxtQkFBQyxDQUFDLEFBQ2IsS0FBSyxDQUFFLEtBQUssQ0FDWixNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUN2QixtQkFBbUIsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUNoQyxpQkFBaUIsQ0FBRSxTQUFTLENBQzVCLGVBQWUsQ0FBRSxPQUFPLEFBQzFCLENBQUMsQUFFRCxrQkFBa0IsS0FBSyxtQkFBQyxDQUFDLEFBQ3ZCLFdBQVcsQ0FBRSxJQUFJLEFBQ25CLENBQUMsQUFFRCxvQ0FBaUIsQ0FBRSxjQUFjLG1CQUFDLENBQUMsQUFDakMsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsR0FBRyxBQUNaLENBQUMsQUFFRCxZQUFZLG1CQUFDLENBQUMsQUFDWixhQUFhLENBQUUsS0FBSyxBQUN0QixDQUFDLEFBRUQsK0JBQVksQ0FBQyxLQUFLLG1CQUFDLENBQUMsQUFDbEIsT0FBTyxDQUFFLEtBQUssQ0FDZCxnQkFBZ0IsQ0FBRSxJQUFJLEFBQ3hCLENBQUMsQUFFRCxhQUFhLG1CQUFDLENBQUMsQUFDYixVQUFVLENBQUUsS0FBSyxDQUNqQixTQUFTLENBQUUsS0FBSyxDQUNoQixjQUFjLENBQUUsTUFBTSxBQUN4QixDQUFDIn0= */";
	appendNode(style, document.head);
}

function create_main_fragment$5(state, component) {
	var div, text, div_1, text_1, text_2, text_3, div_2, a, a_href_value;

	var if_block = (!state.$headless) && create_if_block(state, component);

	var if_block_1 = (state.$image && !state.$compact) && create_if_block_2(state, component);

	var $items = state.$items;

	var each_blocks = [];

	for (var i = 0; i < $items.length; i += 1) {
		each_blocks[i] = create_each_block(state, $items, $items[i], i, component);
	}

	var if_block_2 = (state.$input) && create_if_block_12(state, component);

	return {
		c: function create() {
			div = createElement("div");
			if (if_block) if_block.c();
			text = createText("\n\n  ");
			div_1 = createElement("div");
			if (if_block_1) if_block_1.c();
			text_1 = createText("\n\n    ");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			text_2 = createText("\n\n    ");
			if (if_block_2) if_block_2.c();
			text_3 = createText("\n    ");
			div_2 = createElement("div");
			a = createElement("a");
			a.textContent = "RSS Box by p3k.org";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			encapsulateStyles$3(div_1);
			encapsulateStyles$3(div_2);
			a.href = a_href_value = appUrl();
			setStyle(a, "color", state.$textColor);
			div_2.className = "rssbox-promo rssBoxPromo";
			div_1.className = "rssbox-content rssBoxContent";
			setStyle(div_1, "background-color", state.$boxFillColor);
			setStyle(div_1, "height", state.height);
			div.dataset.linkColor = state.$linkColor;
			div.className = "rssbox rssBox";
			setStyle(div, "max-width", state.width);
			setStyle(div, "border-color", state.$frameColor);
			setStyle(div, "border-radius", "" + state.$radius + "px");
			setStyle(div, "font", state.$fontFace);
			setStyle(div, "float", state.$align);
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
			appendNode(a, div_2);
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

			if (state.$image && !state.$compact) {
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

			if (changed.$maxItems || changed.$textColor || changed.$items || changed.itemTitleClass || changed.$compact) {
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
				if (if_block_2) {
					if_block_2.p(changed, state);
				} else {
					if_block_2 = create_if_block_12(state, component);
					if_block_2.c();
					if_block_2.m(div_1, text_3);
				}
			} else if (if_block_2) {
				if_block_2.u();
				if_block_2.d();
				if_block_2 = null;
			}

			if (changed.$textColor) {
				setStyle(a, "color", state.$textColor);
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

			if (changed.width) {
				setStyle(div, "max-width", state.width);
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

			if (changed.$align) {
				setStyle(div, "float", state.$align);
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

// (4:6) {{ #if $showXmlButton }}
function create_if_block_1(state, component) {
	var div, a, a_title_value;

	var rssicon = new RssIcon({
		root: component.root
	});

	return {
		c: function create() {
			div = createElement("div");
			a = createElement("a");
			rssicon._fragment.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			a.href = state.$url;
			a.title = a_title_value = "" + state.$format + " " + state.$version;
			setStyle(a, "color", state.$titleBarTextColor);
			div.className = "rssbox-icon";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(a, div);
			rssicon._mount(a, null);
		},

		p: function update(changed, state) {
			if (changed.$url) {
				a.href = state.$url;
			}

			if ((changed.$format || changed.$version) && a_title_value !== (a_title_value = "" + state.$format + " " + state.$version)) {
				a.title = a_title_value;
			}

			if (changed.$titleBarTextColor) {
				setStyle(a, "color", state.$titleBarTextColor);
			}
		},

		u: function unmount() {
			detachNode(div);
		},

		d: function destroy$$1() {
			rssicon.destroy(false);
		}
	};
}

// (2:2) {{ #if !$headless }}
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

// (24:31)        {{ then image }}
function create_pending_block(state, _, component) {

	return {
		c: noop,

		m: noop,

		p: noop,

		u: noop,

		d: noop
	};
}

// (25:6) {{ then image }}
function create_then_block(state, image, component) {
	var a, div, div_alt_value, a_href_value, a_title_value;

	return {
		c: function create() {
			a = createElement("a");
			div = createElement("div");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			setAttribute(div, "alt", div_alt_value = state.$image.description);
			div.className = "rssbox-image";
			setStyle(div, "background-image", "url(" + state.$image.source + ")");
			setStyle(div, "width", image.width);
			setStyle(div, "height", image.height);
			a.href = a_href_value = state.$image.link;
			a.title = a_title_value = state.$image.title;
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
			appendNode(div, a);
		},

		p: function update(changed, state, image) {
			if ((changed.$image) && div_alt_value !== (div_alt_value = state.$image.description)) {
				setAttribute(div, "alt", div_alt_value);
			}

			if (changed.$image) {
				setStyle(div, "background-image", "url(" + state.$image.source + ")");
				setStyle(div, "width", image.width);
				setStyle(div, "height", image.height);
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

// (1:0) <div data-link-color='{{ $linkColor }}
function create_catch_block(state, __1, component) {

	return {
		c: noop,

		m: noop,

		p: noop,

		u: noop,

		d: noop
	};
}

// (23:4) {{ #if $image && !$compact }}
function create_if_block_2(state, component) {
	var await_block_anchor, await_block_1, await_block_type, await_token, promise, resolved;

	function replace_await_block(token, type, value, state) {
		if (token !== await_token) return;

		var old_block = await_block_1;
		await_block_1 = (await_block_type = type)(state, resolved = value, component);

		if (old_block) {
			old_block.u();
			old_block.d();
			await_block_1.c();
			await_block_1.m(await_block_anchor.parentNode, await_block_anchor);
		}
	}

	function handle_promise(promise, state) {
		var token = await_token = {};

		if (isPromise(promise)) {
			promise.then(function(value) {
				replace_await_block(token, create_then_block, value, state);
			}, function (error) {
				replace_await_block(token, create_catch_block, error, state);
			});

			// if we previously had a then/catch block, destroy it
			if (await_block_type !== create_pending_block) {
				replace_await_block(token, create_pending_block, null, state);
				return true;
			}
		} else {
			resolved = promise;
			if (await_block_type !== create_then_block) {
				replace_await_block(token, create_then_block, resolved, state);
				return true;
			}
		}
	}

	handle_promise(promise = load(state.$image), state);

	return {
		c: function create() {
			await_block_anchor = createComment();

			await_block_1.c();
		},

		m: function mount(target, anchor) {
			insertNode(await_block_anchor, target, anchor);

			await_block_1.m(target, anchor);
		},

		p: function update(changed, state) {
			if (('$image' in changed) && promise !== (promise = load(state.$image)) && handle_promise(promise, state)) {
				// nothing
			} else {
				await_block_1.p(changed, state, resolved);
			}
		},

		u: function unmount() {
			detachNode(await_block_anchor);

			await_block_1.u();
		},

		d: function destroy$$1() {
			await_token = null;
			await_block_1.d();
		}
	};
}

// (32:4) {{ #each $items as item, index }}
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

// (37:14) {{ #if item.link }}
function create_if_block_5(state, $items, item, index, component) {
	var a, raw_value = item.title, a_href_value;

	return {
		c: function create() {
			a = createElement("a");
			this.h();
		},

		h: function hydrate() {
			a.href = a_href_value = item.link;
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
			a.innerHTML = raw_value;
		},

		p: function update(changed, state, $items, item, index) {
			if ((changed.$items) && raw_value !== (raw_value = item.title)) {
				a.innerHTML = raw_value;
			}

			if ((changed.$items) && a_href_value !== (a_href_value = item.link)) {
				a.href = a_href_value;
			}
		},

		u: function unmount() {
			a.innerHTML = '';

			detachNode(a);
		},

		d: noop
	};
}

// (41:14) {{ else }}
function create_if_block_6(state, $items, item, index, component) {
	var raw_value = item.title, raw_before, raw_after;

	return {
		c: function create() {
			raw_before = createElement('noscript');
			raw_after = createElement('noscript');
		},

		m: function mount(target, anchor) {
			insertNode(raw_before, target, anchor);
			raw_before.insertAdjacentHTML("afterend", raw_value);
			insertNode(raw_after, target, anchor);
		},

		p: function update(changed, state, $items, item, index) {
			if ((changed.$items) && raw_value !== (raw_value = item.title)) {
				detachBetween(raw_before, raw_after);
				raw_before.insertAdjacentHTML("afterend", raw_value);
			}
		},

		u: function unmount() {
			detachBetween(raw_before, raw_after);

			detachNode(raw_before);
			detachNode(raw_after);
		},

		d: noop
	};
}

// (35:10) {{ #if item.title }}
function create_if_block_4(state, $items, item, index, component) {
	var div, div_class_value;

	var current_block_type = select_block_type(state, $items, item, index);
	var if_block = current_block_type(state, $items, item, index, component);

	return {
		c: function create() {
			div = createElement("div");
			if_block.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			div.className = div_class_value = "rssbox-item-title " + state.itemTitleClass;
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			if_block.m(div, null);
		},

		p: function update(changed, state, $items, item, index) {
			if (current_block_type === (current_block_type = select_block_type(state, $items, item, index)) && if_block) {
				if_block.p(changed, state, $items, item, index);
			} else {
				if_block.u();
				if_block.d();
				if_block = current_block_type(state, $items, item, index, component);
				if_block.c();
				if_block.m(div, null);
			}

			if ((changed.itemTitleClass) && div_class_value !== (div_class_value = "rssbox-item-title " + state.itemTitleClass)) {
				div.className = div_class_value;
			}
		},

		u: function unmount() {
			detachNode(div);
			if_block.u();
		},

		d: function destroy$$1() {
			if_block.d();
		}
	};
}

// (51:18) {{ #if item.source.url.endsWith('.xml') }}
function create_if_block_9(state, $items, item, index, component) {

	var rssicon = new RssIcon({
		root: component.root
	});

	return {
		c: function create() {
			rssicon._fragment.c();
		},

		m: function mount(target, anchor) {
			rssicon._mount(target, anchor);
		},

		u: function unmount() {
			rssicon._unmount();
		},

		d: function destroy$$1() {
			rssicon.destroy(false);
		}
	};
}

// (53:18) {{ else }}
function create_if_block_10(state, $items, item, index, component) {

	var linkicon = new LinkIcon({
		root: component.root
	});

	return {
		c: function create() {
			linkicon._fragment.c();
		},

		m: function mount(target, anchor) {
			linkicon._mount(target, anchor);
		},

		u: function unmount() {
			linkicon._unmount();
		},

		d: function destroy$$1() {
			linkicon.destroy(false);
		}
	};
}

// (49:14) {{ #if item.source }}
function create_if_block_8(state, $items, item, index, component) {
	var a, a_href_value, a_title_value;

	var current_block_type = select_block_type_1(state, $items, item, index);
	var if_block = current_block_type(state, $items, item, index, component);

	return {
		c: function create() {
			a = createElement("a");
			if_block.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(a);
			a.href = a_href_value = item.source.url;
			a.title = a_title_value = item.source.title;
			a.className = "rssbox-source";
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
			if_block.m(a, null);
		},

		p: function update(changed, state, $items, item, index) {
			if (current_block_type !== (current_block_type = select_block_type_1(state, $items, item, index))) {
				if_block.u();
				if_block.d();
				if_block = current_block_type(state, $items, item, index, component);
				if_block.c();
				if_block.m(a, null);
			}

			if ((changed.$items) && a_href_value !== (a_href_value = item.source.url)) {
				a.href = a_href_value;
			}

			if ((changed.$items) && a_title_value !== (a_title_value = item.source.title)) {
				a.title = a_title_value;
			}
		},

		u: function unmount() {
			detachNode(a);
			if_block.u();
		},

		d: function destroy$$1() {
			if_block.d();
		}
	};
}

// (60:16) {{ #each item.enclosures as enclosure }}
function create_each_block_1(state, $items, item, index, enclosures, enclosure, enclosure_index, component) {
	var a, a_href_value, a_title_value;

	var paperclipicon = new PaperclipIcon({
		root: component.root
	});

	return {
		c: function create() {
			a = createElement("a");
			paperclipicon._fragment.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(a);
			a.href = a_href_value = enclosure.url;
			a.title = a_title_value = "" + kb(enclosure.length) + " " + enclosure.type;
			a.className = "rssbox-enclosure";
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
			paperclipicon._mount(a, null);
		},

		p: function update(changed, state, $items, item, index, enclosures, enclosure, enclosure_index) {
			if ((changed.$items) && a_href_value !== (a_href_value = enclosure.url)) {
				a.href = a_href_value;
			}

			if ((changed.$items) && a_title_value !== (a_title_value = "" + kb(enclosure.length) + " " + enclosure.type)) {
				a.title = a_title_value;
			}
		},

		u: function unmount() {
			detachNode(a);
		},

		d: function destroy$$1() {
			paperclipicon.destroy(false);
		}
	};
}

// (59:14) {{ #if item.enclosures }}
function create_if_block_11(state, $items, item, index, component) {
	var each_anchor;

	var enclosures = item.enclosures;

	var each_blocks = [];

	for (var i = 0; i < enclosures.length; i += 1) {
		each_blocks[i] = create_each_block_1(state, $items, item, index, enclosures, enclosures[i], i, component);
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

		p: function update(changed, state, $items, item, index) {
			var enclosures = item.enclosures;

			if (changed.$items) {
				for (var i = 0; i < enclosures.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].p(changed, state, $items, item, index, enclosures, enclosures[i], i);
					} else {
						each_blocks[i] = create_each_block_1(state, $items, item, index, enclosures, enclosures[i], i, component);
						each_blocks[i].c();
						each_blocks[i].m(each_anchor.parentNode, each_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].u();
					each_blocks[i].d();
				}
				each_blocks.length = enclosures.length;
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

// (47:10) {{ #if !$compact }}
function create_if_block_7(state, $items, item, index, component) {
	var aside, text, text_2, raw_value = item.description, raw_before, raw_after;

	var if_block = (item.source) && create_if_block_8(state, $items, item, index, component);

	var if_block_1 = (item.enclosures) && create_if_block_11(state, $items, item, index, component);

	return {
		c: function create() {
			aside = createElement("aside");
			if (if_block) if_block.c();
			text = createText("\n\n              ");
			if (if_block_1) if_block_1.c();
			text_2 = createText("\n            ");
			raw_before = createElement('noscript');
			raw_after = createElement('noscript');
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(aside);
		},

		m: function mount(target, anchor) {
			insertNode(aside, target, anchor);
			if (if_block) if_block.m(aside, null);
			appendNode(text, aside);
			if (if_block_1) if_block_1.m(aside, null);
			insertNode(text_2, target, anchor);
			insertNode(raw_before, target, anchor);
			raw_before.insertAdjacentHTML("afterend", raw_value);
			insertNode(raw_after, target, anchor);
		},

		p: function update(changed, state, $items, item, index) {
			if (item.source) {
				if (if_block) {
					if_block.p(changed, state, $items, item, index);
				} else {
					if_block = create_if_block_8(state, $items, item, index, component);
					if_block.c();
					if_block.m(aside, text);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}

			if (item.enclosures) {
				if (if_block_1) {
					if_block_1.p(changed, state, $items, item, index);
				} else {
					if_block_1 = create_if_block_11(state, $items, item, index, component);
					if_block_1.c();
					if_block_1.m(aside, null);
				}
			} else if (if_block_1) {
				if_block_1.u();
				if_block_1.d();
				if_block_1 = null;
			}

			if ((changed.$items) && raw_value !== (raw_value = item.description)) {
				detachBetween(raw_before, raw_after);
				raw_before.insertAdjacentHTML("afterend", raw_value);
			}
		},

		u: function unmount() {
			detachBetween(raw_before, raw_after);

			detachNode(aside);
			if (if_block) if_block.u();
			if (if_block_1) if_block_1.u();
			detachNode(text_2);
			detachNode(raw_before);
			detachNode(raw_after);
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
			if (if_block_1) if_block_1.d();
		}
	};
}

// (33:6) {{ #if index < $maxItems }}
function create_if_block_3(state, $items, item, index, component) {
	var div, text;

	var if_block = (item.title) && create_if_block_4(state, $items, item, index, component);

	var if_block_1 = (!state.$compact) && create_if_block_7(state, $items, item, index, component);

	return {
		c: function create() {
			div = createElement("div");
			if (if_block) if_block.c();
			text = createText("\n\n          ");
			if (if_block_1) if_block_1.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(div);
			div.className = "rssbox-item-content rssBoxItemContent";
			setStyle(div, "color", state.$textColor);
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			if (if_block) if_block.m(div, null);
			appendNode(text, div);
			if (if_block_1) if_block_1.m(div, null);
		},

		p: function update(changed, state, $items, item, index) {
			if (item.title) {
				if (if_block) {
					if_block.p(changed, state, $items, item, index);
				} else {
					if_block = create_if_block_4(state, $items, item, index, component);
					if_block.c();
					if_block.m(div, text);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}

			if (!state.$compact) {
				if (if_block_1) {
					if_block_1.p(changed, state, $items, item, index);
				} else {
					if_block_1 = create_if_block_7(state, $items, item, index, component);
					if_block_1.c();
					if_block_1.m(div, null);
				}
			} else if (if_block_1) {
				if_block_1.u();
				if_block_1.d();
				if_block_1 = null;
			}

			if (changed.$textColor) {
				setStyle(div, "color", state.$textColor);
			}
		},

		u: function unmount() {
			detachNode(div);
			if (if_block) if_block.u();
			if (if_block_1) if_block_1.u();
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
			if (if_block_1) if_block_1.d();
		}
	};
}

// (73:4) {{ #if $input }}
function create_if_block_12(state, component) {
	var form, input, input_name_value, input_data_placeholder_value, form_action_value;

	return {
		c: function create() {
			form = createElement("form");
			input = createElement("input");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$3(form);
			encapsulateStyles$3(input);
			input.type = "text";
			input.name = input_name_value = state.$input.name;
			input.placeholder = "Enter search & hit return…";
			input.dataset.placeholder = input_data_placeholder_value = state.$input.description;
			form.className = "rssbox-form";
			form.method = "get";
			form.action = form_action_value = state.$input.link;
		},

		m: function mount(target, anchor) {
			insertNode(form, target, anchor);
			appendNode(input, form);
		},

		p: function update(changed, state) {
			if ((changed.$input) && input_name_value !== (input_name_value = state.$input.name)) {
				input.name = input_name_value;
			}

			if ((changed.$input) && input_data_placeholder_value !== (input_data_placeholder_value = state.$input.description)) {
				input.dataset.placeholder = input_data_placeholder_value;
			}

			if ((changed.$input) && form_action_value !== (form_action_value = state.$input.link)) {
				form.action = form_action_value;
			}
		},

		u: function unmount() {
			detachNode(form);
		},

		d: noop
	};
}

function select_block_type(state, $items, item, index) {
	if (item.link) return create_if_block_5;
	return create_if_block_6;
}

function select_block_type_1(state, $items, item, index) {
	if (item.source.url.endsWith('.xml')) return create_if_block_9;
	return create_if_block_10;
}

function Box(options) {
	this._debugName = '<Box>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(this.store._init(["height","width","compact","linkColor","frameColor","radius","fontFace","align","headless","titleBarTextColor","titleBarColor","showXmlButton","url","format","version","link","title","formattedDate","boxFillColor","image","items","maxItems","textColor","input"]), options.data);
	this.store._add(this, ["height","width","compact","linkColor","frameColor","radius","fontFace","align","headless","titleBarTextColor","titleBarColor","showXmlButton","url","format","version","link","title","formattedDate","boxFillColor","image","items","maxItems","textColor","input"]);
	this._recompute({ $height: 1, $width: 1, $compact: 1 }, this._state);
	if (!('$height' in this._state)) console.warn("<Box> was created without expected data property '$height'");
	if (!('$width' in this._state)) console.warn("<Box> was created without expected data property '$width'");
	if (!('$compact' in this._state)) console.warn("<Box> was created without expected data property '$compact'");
	if (!('$linkColor' in this._state)) console.warn("<Box> was created without expected data property '$linkColor'");
	if (!('width' in this._state)) console.warn("<Box> was created without expected data property 'width'");
	if (!('$frameColor' in this._state)) console.warn("<Box> was created without expected data property '$frameColor'");
	if (!('$radius' in this._state)) console.warn("<Box> was created without expected data property '$radius'");
	if (!('$fontFace' in this._state)) console.warn("<Box> was created without expected data property '$fontFace'");
	if (!('$align' in this._state)) console.warn("<Box> was created without expected data property '$align'");
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
	if (!('itemTitleClass' in this._state)) console.warn("<Box> was created without expected data property 'itemTitleClass'");
	if (!('$input' in this._state)) console.warn("<Box> was created without expected data property '$input'");

	this._handlers.destroy = [removeFromStore];

	if (!document.getElementById("svelte-1374782793-style")) add_css$3();

	var _oncreate = oncreate$1.bind(this);

	if (!options.root) {
		this._oncreate = [_oncreate];
		this._beforecreate = [];
		this._aftercreate = [];
	} else {
	 	this.root._oncreate.push(_oncreate);
	 }

	this._fragment = create_main_fragment$5(this._state, this);

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

assign(Box.prototype, protoDev);

Box.prototype._checkReadOnly = function _checkReadOnly(newState) {
	if ('height' in newState && !this._updatingReadonlyProperty) throw new Error("<Box>: Cannot set read-only property 'height'");
	if ('width' in newState && !this._updatingReadonlyProperty) throw new Error("<Box>: Cannot set read-only property 'width'");
	if ('itemTitleClass' in newState && !this._updatingReadonlyProperty) throw new Error("<Box>: Cannot set read-only property 'itemTitleClass'");
};

Box.prototype._recompute = function _recompute(changed, state) {
	if (changed.$height) {
		if (differs(state.height, (state.height = height(state.$height)))) changed.height = true;
	}

	if (changed.$width) {
		if (differs(state.width, (state.width = width(state.$width)))) changed.width = true;
	}

	if (changed.$compact) {
		if (differs(state.itemTitleClass, (state.itemTitleClass = itemTitleClass(state.$compact)))) changed.itemTitleClass = true;
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

  load() {
    fetch(urls$$1.referrers).then(res => {
      res.json().then(data => this.display(data));
    });
  },

  display(data) {
    const hosts = data.reduce((accu, item) => {
      if (item.url.startsWith('http') && !item.url.startsWith(urls$$1.app)) {
        const url = item.url.replace(/^([^.]*)www\./, '$1');
        const host = url.split('/')[2];
        let data = accu[host];

        if (!data) {
          data = { host, url, hits: item.hits, total: 0 };
          accu[host] = data;
          accu.push(data);
        } else if (item.hits > data.hits) {
          data.url = item.url;
          data.hits = item.hits;
        }

        data.total += item.hits;
      }
      return accu;
    }, []);

    const total = hosts.reduce((accu, item) => accu += item.total, 0);

    const referrers = hosts.map(item => {
      item.percentage = item.total / total * 100;
      return item;
    });

    referrers.sort((a, b) => b.percentage - a.percentage);

    this.set({ referrers });
    loaded = true;
  }
};

function oncreate$2() {
  if ('open' in document.createElement('details') === false) {
    this.load();
  }
}

function encapsulateStyles$8(node) {
	setAttribute(node, "svelte-957126438", "");
}

function add_css$8() {
	var style = createElement("style");
	style.id = 'svelte-957126438-style';
	style.textContent = "details[svelte-957126438]{line-height:1.2em}code[svelte-957126438]{margin-right:0.5em;color:#bbb;font-size:0.7em;white-space:pre}summary[svelte-957126438]{outline:none}.referrer[svelte-957126438]{white-space:nowrap}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVmZXJyZXJzLmh0bWwiLCJzb3VyY2VzIjpbIlJlZmVycmVycy5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxkZXRhaWxzIG9uOnRvZ2dsZT0ndXBkYXRlKGV2ZW50KSc+XG4gIDxzdW1tYXJ5Pjwvc3VtbWFyeT5cbiAge3sgI2lmIHJlZmVycmVycy5sZW5ndGggfX1cbiAgICB7eyAjZWFjaCByZWZlcnJlcnMgYXMgcmVmZXJyZXIgfX1cbiAgICAgIDxkaXYgY2xhc3M9J3JlZmVycmVyJz5cbiAgICAgICAgPGNvZGU+e3sgZm9ybWF0KHJlZmVycmVyLnBlcmNlbnRhZ2UpIH19PC9jb2RlPlxuICAgICAgICA8YSBocmVmPSd7eyByZWZlcnJlci51cmwgfX0nPnt7IHJlZmVycmVyLmhvc3QgfX08L2E+XG4gICAgICA8L2Rpdj5cbiAgICB7eyAvZWFjaCB9fVxuICB7eyBlbHNlIH19XG4gICAgTG9hZGluZ+KAplxuICB7eyAvaWYgfX1cbjwvZGV0YWlscz5cblxuPHN0eWxlPlxuICBkZXRhaWxzIHtcbiAgICBsaW5lLWhlaWdodDogMS4yZW07XG4gIH1cblxuICBjb2RlIHtcbiAgICBtYXJnaW4tcmlnaHQ6IDAuNWVtO1xuICAgIGNvbG9yOiAjYmJiO1xuICAgIGZvbnQtc2l6ZTogMC43ZW07XG4gICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgfVxuXG4gIHN1bW1hcnkge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICAucmVmZXJyZXIge1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7IHVybHMgfSBmcm9tICcuLi9zcmMvc2V0dGluZ3MnO1xuXG4gIGxldCBsb2FkZWQgPSBmYWxzZTtcblxuICBleHBvcnQgZGVmYXVsdCB7XG4gICAgb25jcmVhdGUoKSB7XG4gICAgICBpZiAoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5sb2FkKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGRhdGEoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWZlcnJlcnM6IFtdXG4gICAgICB9XG4gICAgfSxcblxuICAgIGhlbHBlcnM6IHtcbiAgICAgIGZvcm1hdDogZmxvYXQgPT4ge1xuICAgICAgICBpZiAoZmxvYXQgPCAwLjAxKSByZXR1cm4gJzwgMC4wMSc7XG4gICAgICAgIHJldHVybiBmbG9hdC50b0ZpeGVkKDIpLnBhZFN0YXJ0KDYpXG4gICAgICB9XG4gICAgfSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgIHVwZGF0ZShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0Lm9wZW4gJiYgIWxvYWRlZCkgdGhpcy5sb2FkKCk7XG4gICAgICB9LFxuXG4gICAgICBsb2FkKCkge1xuICAgICAgICBmZXRjaCh1cmxzLnJlZmVycmVycykudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJlcy5qc29uKCkudGhlbihkYXRhID0+IHRoaXMuZGlzcGxheShkYXRhKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgZGlzcGxheShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGhvc3RzID0gZGF0YS5yZWR1Y2UoKGFjY3UsIGl0ZW0pID0+IHtcbiAgICAgICAgICBpZiAoaXRlbS51cmwuc3RhcnRzV2l0aCgnaHR0cCcpICYmICFpdGVtLnVybC5zdGFydHNXaXRoKHVybHMuYXBwKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gaXRlbS51cmwucmVwbGFjZSgvXihbXi5dKil3d3dcXC4vLCAnJDEnKTtcbiAgICAgICAgICAgIGNvbnN0IGhvc3QgPSB1cmwuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgIGxldCBkYXRhID0gYWNjdVtob3N0XTtcblxuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgIGRhdGEgPSB7IGhvc3QsIHVybCwgaGl0czogaXRlbS5oaXRzLCB0b3RhbDogMCB9O1xuICAgICAgICAgICAgICBhY2N1W2hvc3RdID0gZGF0YTtcbiAgICAgICAgICAgICAgYWNjdS5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLmhpdHMgPiBkYXRhLmhpdHMpIHtcbiAgICAgICAgICAgICAgZGF0YS51cmwgPSBpdGVtLnVybDtcbiAgICAgICAgICAgICAgZGF0YS5oaXRzID0gaXRlbS5oaXRzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhLnRvdGFsICs9IGl0ZW0uaGl0cztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFjY3U7XG4gICAgICAgIH0sIFtdKTtcblxuICAgICAgICBjb25zdCB0b3RhbCA9IGhvc3RzLnJlZHVjZSgoYWNjdSwgaXRlbSkgPT4gYWNjdSArPSBpdGVtLnRvdGFsLCAwKTtcblxuICAgICAgICBjb25zdCByZWZlcnJlcnMgPSBob3N0cy5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgaXRlbS5wZXJjZW50YWdlID0gaXRlbS50b3RhbCAvIHRvdGFsICogMTAwO1xuICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWZlcnJlcnMuc29ydCgoYSwgYikgPT4gYi5wZXJjZW50YWdlIC0gYS5wZXJjZW50YWdlKTtcblxuICAgICAgICB0aGlzLnNldCh7IHJlZmVycmVycyB9KTtcbiAgICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbjwvc2NyaXB0PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWVFLE9BQU8sa0JBQUMsQ0FBQyxBQUNQLFdBQVcsQ0FBRSxLQUFLLEFBQ3BCLENBQUMsQUFFRCxJQUFJLGtCQUFDLENBQUMsQUFDSixZQUFZLENBQUUsS0FBSyxDQUNuQixLQUFLLENBQUUsSUFBSSxDQUNYLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUFHLEFBQ2xCLENBQUMsQUFFRCxPQUFPLGtCQUFDLENBQUMsQUFDUCxPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxTQUFTLGtCQUFDLENBQUMsQUFDVCxXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDIn0= */";
	appendNode(style, document.head);
}

function create_main_fragment$10(state, component) {
	var details, summary, text;

	var current_block_type = select_block_type$2(state);
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
			encapsulateStyles$8(details);
			encapsulateStyles$8(summary);
			addListener(details, "toggle", toggle_handler);
		},

		m: function mount(target, anchor) {
			insertNode(details, target, anchor);
			appendNode(summary, details);
			appendNode(text, details);
			if_block.m(details, null);
		},

		p: function update(changed, state) {
			if (current_block_type === (current_block_type = select_block_type$2(state)) && if_block) {
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
			encapsulateStyles$8(div);
			encapsulateStyles$8(code);
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
function create_if_block$2(state, component) {
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
function create_if_block_1$2(state, component) {
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

function select_block_type$2(state) {
	if (state.referrers.length) return create_if_block$2;
	return create_if_block_1$2;
}

function Referrers(options) {
	this._debugName = '<Referrers>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(data(), options.data);
	if (!('referrers' in this._state)) console.warn("<Referrers> was created without expected data property 'referrers'");

	if (!document.getElementById("svelte-957126438-style")) add_css$8();

	var _oncreate = oncreate$2.bind(this);

	if (!options.root) {
		this._oncreate = [_oncreate];
	} else {
	 	this.root._oncreate.push(_oncreate);
	 }

	this._fragment = create_main_fragment$10(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);

		callAll(this._oncreate);
	}
}

assign(Referrers.prototype, methods$2, protoDev);

Referrers.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

/* components/Configurator.html generated by Svelte v1.50.0 */
var methods$1 = {
  update(event) {
    event.preventDefault();
    if (!event.target.checkValidity()) return event.target.reportValidity();
    const name = event.target.name;
    const type = event.target.type;
    const value = event.target[type === 'checkbox' ? 'checked' : 'value'];
    this.store.set({ [name]: value });
  },

  reload(event) {
    event.preventDefault();
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

function encapsulateStyles$7(node) {
	setAttribute(node, "svelte-3994292734", "");
}

function add_css$7() {
	var style = createElement("style");
	style.id = 'svelte-3994292734-style';
	style.textContent = "table[svelte-3994292734]{overflow:auto}tr[svelte-3994292734] td[svelte-3994292734]:first-child{color:#bbb;text-align:right;white-space:nowrap}summary[svelte-3994292734]{outline:none}input[type='color'][svelte-3994292734]{width:108px;height:30px;padding:1px 3px}.top[svelte-3994292734]{vertical-align:top}.source[svelte-3994292734]{line-height:1em}[name=url][svelte-3994292734],[name=fontFace][svelte-3994292734],[name=code][svelte-3994292734]{width:90%}[type=color][svelte-3994292734],[type=number][svelte-3994292734]{width:7em}[name=code][svelte-3994292734]{color:#bbb;height:10em;overflow:hidden;resize:vertical}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlndXJhdG9yLmh0bWwiLCJzb3VyY2VzIjpbIkNvbmZpZ3VyYXRvci5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxmb3JtIG9uOnN1Ym1pdD0ndXBkYXRlKGV2ZW50KSc+XG4gIDx0YWJsZSBjbGFzcz0ndGFibGUnPlxuICAgIDxjb2xncm91cD5cbiAgICAgIDxjb2wgd2lkdGg9JyonPlxuICAgICAgPGNvbCB3aWR0aD0nOTAlJz5cbiAgICA8L2NvbGdyb3VwPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkZlZWQgVVJMPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSd1cmwnIG5hbWU9J3VybCcgdmFsdWU9J3t7ICR1cmwgfX0nIHJlcXVpcmVkIG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWw+VGl0bGU8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD57eyAkdGl0bGUgfX08L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+RGVzY3JpcHRpb248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGRldGFpbHM+XG4gICAgICAgICAgPHN1bW1hcnk+PC9zdW1tYXJ5PlxuICAgICAgICAgIHt7ICRkZXNjcmlwdGlvbiB9fVxuICAgICAgICA8L2RldGFpbHM+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWw+TGFzdCBidWlsZDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPnt7ICRmb3JtYXR0ZWREYXRlIH19PC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsPlNvdXJjZTwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkIGNsYXNzPSdzb3VyY2UnPlxuICAgICAgICB7eyAjaWYgJGxvYWRpbmcgfX1cbiAgICAgICAgICBMb2FkaW5nLi4uXG4gICAgICAgIHt7IGVsc2UgfX1cbiAgICAgICAgICA8YSBocmVmPSd7eyAkdXJsIH19Jz57eyAkZm9ybWF0IH19IHt7ICR2ZXJzaW9uIH19PC9hPlxuICAgICAgICB7eyAvaWYgfX1cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5NYXguIGl0ZW1zPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIG5hbWU9J21heEl0ZW1zJyB2YWx1ZT0ne3sgJG1heEl0ZW1zIH19JyBtaW49MSBtYXg9OTkgcmVxdWlyZWQgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5NYXguIHdpZHRoPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIG5hbWU9J3dpZHRoJyB2YWx1ZT0ne3sgJHdpZHRoIH19JyBtaW49MTAwIG1heD05OTk5IG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KScgcGxhY2Vob2xkZXI9J3NwYXJlJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5Db250ZW50IGhlaWdodDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nbnVtYmVyJyBuYW1lPSdoZWlnaHQnIHZhbHVlPSd7eyAkaGVpZ2h0IH19JyBtaW49MTAwIG1heD05OTk5IG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KScgcGxhY2Vob2xkZXI9J3NwYXJlJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5Db3JuZXIgcmFkaXVzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIG5hbWU9J3JhZGl1cycgdmFsdWU9J3t7ICRyYWRpdXMgfX0nIG1pbj0wIG1heD0yMCByZXF1aXJlZCBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgICA8c21hbGw+cHg8L3NtYWxsPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPlhNTCBidXR0b248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NoZWNrYm94JyBuYW1lPSdzaG93WG1sQnV0dG9uJyB2YWx1ZT0nMScgY2hlY2tlZD0ne3sgJHNob3dYbWxCdXR0b24gfX0nIG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+Q29tcGFjdCB2aWV3PC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nY29tcGFjdCcgdmFsdWU9JzEnIGNoZWNrZWQ9J3t7ICRjb21wYWN0IH19JyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkhlYWRsZXNzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0naGVhZGxlc3MnIHZhbHVlPScxJyBjaGVja2VkPSd7eyAkaGVhZGxlc3MgfX0nIG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+RnJhbWUgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBuYW1lPSdmcmFtZUNvbG9yJyB2YWx1ZT0ne3sgJGZyYW1lQ29sb3IgfX0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPlRpdGxlYmFyIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0ndGl0bGVCYXJDb2xvcicgdmFsdWU9J3t7ICR0aXRsZUJhckNvbG9yIH19JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5UaXRsZSBjb2xvcjwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY29sb3InIG5hbWU9J3RpdGxlQmFyVGV4dENvbG9yJyB2YWx1ZT0ne3sgJHRpdGxlQmFyVGV4dENvbG9yIH19JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5Cb3ggY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBuYW1lPSdib3hGaWxsQ29sb3InIHZhbHVlPSd7eyAkYm94RmlsbENvbG9yIH19JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPSd1cGRhdGUoZXZlbnQpJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz0nbGFiZWwoZXZlbnQpJz5UZXh0IGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0ndGV4dENvbG9yJyB2YWx1ZT0ne3sgJHRleHRDb2xvciB9fScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KSc+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+TGluayBjb2xvcjwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY29sb3InIG5hbWU9J2xpbmtDb2xvcicgdmFsdWU9J3t7ICRsaW5rQ29sb3IgfX0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9J3VwZGF0ZShldmVudCknPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPSdsYWJlbChldmVudCknPkZvbnQgZmFjZTwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgbmFtZT0nZm9udEZhY2UnIHZhbHVlPSd7eyAkZm9udEZhY2UgfX0nIG9uOmNoYW5nZT0ndXBkYXRlKGV2ZW50KScgcGF0dGVybj0nW1xcZC5dKyg/OnB0fHB4fGVtfCUpK1xccytbXFxzXFx3XFwtLF0rJyBwbGFjZWhvbGRlcj0nZS5nLiAxMHB0IEhlbHZldGljYSwgc2Fucy1zZXJpZic+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPjwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIHt7ICNpZiAkbG9hZGluZyB9fVxuICAgICAgICAgIDxidXR0b24gY2xhc3M9J2J0biBidG4tc20gYnRuLWMnIGRpc2FibGVkPkxvYWRpbmcuLi48L2J1dHRvbj5cbiAgICAgICAge3sgZWxzZSB9fVxuICAgICAgICAgIDxidXR0b24gY2xhc3M9J2J0biBidG4tc20gYnRuLWInIHR5cGU9J2J1dHRvbicgb246Y2xpY2s9J3JlbG9hZChldmVudCknPlJlbG9hZDwvYnV0dG9uPlxuICAgICAgICB7eyAvaWYgfX1cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHIgc3R5bGU9J3ZlcnRpY2FsLWFsaWduOiB0b3AnPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KSc+XG4gICAgICAgICAgSFRNTCBjb2RlPGJyPlxuICAgICAgICAgIChjb3B5JmFtcDtwYXN0YSlcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDx0ZXh0YXJlYSBuYW1lPSdjb2RlJyBjb2xzPScxMCcgcm93cz0nMycgcmVhZG9ubHkgb246Y2xpY2s9J2NvcHkoZXZlbnQpJz57eyAkY29kZSB9fTwvdGV4dGFyZWE+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9J2xhYmVsKGV2ZW50KScgdGl0bGU9J3NpbmNlIG1pZG5pZ2h0IChHTVQpJz5cbiAgICAgICAgICBSZWZlcnJlcnNcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQgY2xhc3M9J3RvcCc+XG4gICAgICAgIDxSZWZlcnJlcnMvPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICA8L3RhYmxlPlxuPC9mb3JtPlxuXG48c3R5bGU+XG4gIHRhYmxlIHtcbiAgICBvdmVyZmxvdzogYXV0bztcbiAgfVxuXG4gIHRyIHRkOmZpcnN0LWNoaWxkIHtcbiAgICBjb2xvcjogI2JiYjtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgc3VtbWFyeSB7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIGlucHV0W3R5cGU9J2NvbG9yJ10ge1xuICAgIHdpZHRoOiAxMDhweDtcbiAgICBoZWlnaHQ6IDMwcHg7XG4gICAgcGFkZGluZzogMXB4IDNweDtcbiAgfVxuXG4gIC50b3Age1xuICAgIHZlcnRpY2FsLWFsaWduOiB0b3A7XG4gIH1cblxuICAuc291cmNlIHtcbiAgICBsaW5lLWhlaWdodDogMWVtO1xuICB9XG5cbiAgW25hbWU9dXJsXSwgW25hbWU9Zm9udEZhY2VdLCBbbmFtZT1jb2RlXSB7XG4gICAgd2lkdGg6IDkwJTtcbiAgfVxuXG4gIFt0eXBlPWNvbG9yXSwgW3R5cGU9bnVtYmVyXSB7XG4gICAgd2lkdGg6IDdlbTtcbiAgfVxuXG4gIFtuYW1lPWNvZGVdIHtcbiAgICBjb2xvcjogI2JiYjtcbiAgICBoZWlnaHQ6IDEwZW07XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICByZXNpemU6IHZlcnRpY2FsO1xuICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICBpbXBvcnQgUmVmZXJyZXJzIGZyb20gJy4vUmVmZXJyZXJzLmh0bWwnO1xuXG4gIGV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICBSZWZlcnJlcnNcbiAgICB9LFxuXG4gICAgbWV0aG9kczoge1xuICAgICAgdXBkYXRlKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghZXZlbnQudGFyZ2V0LmNoZWNrVmFsaWRpdHkoKSkgcmV0dXJuIGV2ZW50LnRhcmdldC5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICBjb25zdCBuYW1lID0gZXZlbnQudGFyZ2V0Lm5hbWU7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBldmVudC50YXJnZXQudHlwZTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBldmVudC50YXJnZXRbdHlwZSA9PT0gJ2NoZWNrYm94JyA/ICdjaGVja2VkJyA6ICd2YWx1ZSddO1xuICAgICAgICB0aGlzLnN0b3JlLnNldCh7IFtuYW1lXTogdmFsdWUgfSk7XG4gICAgICB9LFxuXG4gICAgICByZWxvYWQoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgdXJsID0gdGhpcy5zdG9yZS5nZXQoJ3VybCcpO1xuICAgICAgICB0aGlzLnN0b3JlLnNldCh7IHVybDogbnVsbCB9KTtcbiAgICAgICAgdGhpcy5zdG9yZS5zZXQoeyB1cmwgfSk7XG4gICAgICB9LFxuXG4gICAgICBjb3B5KGV2ZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXZlbnQudGFyZ2V0LnNlbGVjdCgpO1xuICAgICAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgIH0sXG5cbiAgICAgIGxhYmVsKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHNpYmxpbmcgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICAgIGxldCBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgaWYgKCFpbnB1dCkgaW5wdXQgPSBzaWJsaW5nLnF1ZXJ5U2VsZWN0b3IoJ3N1bW1hcnknKTtcbiAgICAgICAgaWYgKCFpbnB1dCkgaW5wdXQgPSBzaWJsaW5nLnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhJyk7XG4gICAgICAgIGlmICghaW5wdXQpIHJldHVybjtcbiAgICAgICAgaWYgKGlucHV0LmNsaWNrKSBpbnB1dC5jbGljaygpO1xuICAgICAgICBpZiAoaW5wdXQuc2VsZWN0KSBpbnB1dC5zZWxlY3QoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbjwvc2NyaXB0PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXVNRSxLQUFLLG1CQUFDLENBQUMsQUFDTCxRQUFRLENBQUUsSUFBSSxBQUNoQixDQUFDLEFBRUQscUJBQUUsQ0FBQyxxQkFBRSxZQUFZLEFBQUMsQ0FBQyxBQUNqQixLQUFLLENBQUUsSUFBSSxDQUNYLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFdBQVcsQ0FBRSxNQUFNLEFBQ3JCLENBQUMsQUFFRCxPQUFPLG1CQUFDLENBQUMsQUFDUCxPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBQyxDQUFDLEFBQ25CLEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsR0FBRyxDQUFDLEdBQUcsQUFDbEIsQ0FBQyxBQUVELElBQUksbUJBQUMsQ0FBQyxBQUNKLGNBQWMsQ0FBRSxHQUFHLEFBQ3JCLENBQUMsQUFFRCxPQUFPLG1CQUFDLENBQUMsQUFDUCxXQUFXLENBQUUsR0FBRyxBQUNsQixDQUFDLEFBRUQsQ0FBQyxJQUFJLENBQUMsR0FBRyxvQkFBQyxDQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsb0JBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQUMsQ0FBQyxBQUN4QyxLQUFLLENBQUUsR0FBRyxBQUNaLENBQUMsQUFFRCxDQUFDLElBQUksQ0FBQyxLQUFLLG9CQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFDLENBQUMsQUFDM0IsS0FBSyxDQUFFLEdBQUcsQUFDWixDQUFDLEFBRUQsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFDLENBQUMsQUFDWCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osUUFBUSxDQUFFLE1BQU0sQ0FDaEIsTUFBTSxDQUFFLFFBQVEsQUFDbEIsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment$9(state, component) {
	var form, table, colgroup, text_2, tr, td, label, text_5, td_1, input, text_8, tr_1, td_2, text_11, td_3, text_12, text_14, tr_2, td_4, label_2, text_17, td_5, details, summary, text_18, text_19, text_23, tr_3, td_6, text_26, td_7, text_27, text_29, tr_4, td_8, text_32, td_9, text_35, tr_5, td_10, label_5, text_38, td_11, input_1, text_41, tr_6, td_12, label_6, text_44, td_13, input_2, text_45, small, text_49, tr_7, td_14, label_7, text_52, td_15, input_3, text_53, small_1, text_57, tr_8, td_16, label_8, text_60, td_17, input_4, text_61, small_2, text_65, tr_9, td_18, label_9, text_68, td_19, input_5, text_71, tr_10, td_20, label_10, text_74, td_21, input_6, text_77, tr_11, td_22, label_11, text_80, td_23, input_7, text_83, tr_12, td_24, label_12, text_86, td_25, input_8, text_89, tr_13, td_26, label_13, text_92, td_27, input_9, text_95, tr_14, td_28, label_14, text_98, td_29, input_10, text_101, tr_15, td_30, label_15, text_104, td_31, input_11, text_107, tr_16, td_32, label_16, text_110, td_33, input_12, text_113, tr_17, td_34, label_17, text_116, td_35, input_13, text_119, tr_18, td_36, label_18, text_122, td_37, input_14, text_125, tr_19, td_38, text_126, td_39, text_129, tr_20, td_40, label_19, text_133, td_41, textarea, text_136, tr_21, td_42, label_20, text_139, td_43;

	function click_handler(event) {
		component.label(event);
	}

	function change_handler(event) {
		component.update(event);
	}

	function click_handler_1(event) {
		component.label(event);
	}

	var current_block_type = select_block_type$1(state);
	var if_block = current_block_type(state, component);

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

	var current_block_type_1 = select_block_type_1$1(state);
	var if_block_1 = current_block_type_1(state, component);

	function click_handler_16(event) {
		component.label(event);
	}

	function click_handler_17(event) {
		component.copy(event);
	}

	function click_handler_18(event) {
		component.label(event);
	}

	var referrers = new Referrers({
		root: component.root
	});

	function submit_handler(event) {
		component.update(event);
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
			if_block.c();
			text_35 = createText("\n    ");
			tr_5 = createElement("tr");
			td_10 = createElement("td");
			label_5 = createElement("label");
			label_5.textContent = "Max. items";
			text_38 = createText("\n      ");
			td_11 = createElement("td");
			input_1 = createElement("input");
			text_41 = createText("\n    ");
			tr_6 = createElement("tr");
			td_12 = createElement("td");
			label_6 = createElement("label");
			label_6.textContent = "Max. width";
			text_44 = createText("\n      ");
			td_13 = createElement("td");
			input_2 = createElement("input");
			text_45 = createText("\n        ");
			small = createElement("small");
			small.textContent = "px";
			text_49 = createText("\n    ");
			tr_7 = createElement("tr");
			td_14 = createElement("td");
			label_7 = createElement("label");
			label_7.textContent = "Content height";
			text_52 = createText("\n      ");
			td_15 = createElement("td");
			input_3 = createElement("input");
			text_53 = createText("\n        ");
			small_1 = createElement("small");
			small_1.textContent = "px";
			text_57 = createText("\n    ");
			tr_8 = createElement("tr");
			td_16 = createElement("td");
			label_8 = createElement("label");
			label_8.textContent = "Corner radius";
			text_60 = createText("\n      ");
			td_17 = createElement("td");
			input_4 = createElement("input");
			text_61 = createText("\n        ");
			small_2 = createElement("small");
			small_2.textContent = "px";
			text_65 = createText("\n    ");
			tr_9 = createElement("tr");
			td_18 = createElement("td");
			label_9 = createElement("label");
			label_9.textContent = "XML button";
			text_68 = createText("\n      ");
			td_19 = createElement("td");
			input_5 = createElement("input");
			text_71 = createText("\n    ");
			tr_10 = createElement("tr");
			td_20 = createElement("td");
			label_10 = createElement("label");
			label_10.textContent = "Compact view";
			text_74 = createText("\n      ");
			td_21 = createElement("td");
			input_6 = createElement("input");
			text_77 = createText("\n    ");
			tr_11 = createElement("tr");
			td_22 = createElement("td");
			label_11 = createElement("label");
			label_11.textContent = "Headless";
			text_80 = createText("\n      ");
			td_23 = createElement("td");
			input_7 = createElement("input");
			text_83 = createText("\n    ");
			tr_12 = createElement("tr");
			td_24 = createElement("td");
			label_12 = createElement("label");
			label_12.textContent = "Frame color";
			text_86 = createText("\n      ");
			td_25 = createElement("td");
			input_8 = createElement("input");
			text_89 = createText("\n    ");
			tr_13 = createElement("tr");
			td_26 = createElement("td");
			label_13 = createElement("label");
			label_13.textContent = "Titlebar color";
			text_92 = createText("\n      ");
			td_27 = createElement("td");
			input_9 = createElement("input");
			text_95 = createText("\n    ");
			tr_14 = createElement("tr");
			td_28 = createElement("td");
			label_14 = createElement("label");
			label_14.textContent = "Title color";
			text_98 = createText("\n      ");
			td_29 = createElement("td");
			input_10 = createElement("input");
			text_101 = createText("\n    ");
			tr_15 = createElement("tr");
			td_30 = createElement("td");
			label_15 = createElement("label");
			label_15.textContent = "Box color";
			text_104 = createText("\n      ");
			td_31 = createElement("td");
			input_11 = createElement("input");
			text_107 = createText("\n    ");
			tr_16 = createElement("tr");
			td_32 = createElement("td");
			label_16 = createElement("label");
			label_16.textContent = "Text color";
			text_110 = createText("\n      ");
			td_33 = createElement("td");
			input_12 = createElement("input");
			text_113 = createText("\n    ");
			tr_17 = createElement("tr");
			td_34 = createElement("td");
			label_17 = createElement("label");
			label_17.textContent = "Link color";
			text_116 = createText("\n      ");
			td_35 = createElement("td");
			input_13 = createElement("input");
			text_119 = createText("\n    ");
			tr_18 = createElement("tr");
			td_36 = createElement("td");
			label_18 = createElement("label");
			label_18.textContent = "Font face";
			text_122 = createText("\n      ");
			td_37 = createElement("td");
			input_14 = createElement("input");
			text_125 = createText("\n    ");
			tr_19 = createElement("tr");
			td_38 = createElement("td");
			text_126 = createText("\n      ");
			td_39 = createElement("td");
			if_block_1.c();
			text_129 = createText("\n    ");
			tr_20 = createElement("tr");
			td_40 = createElement("td");
			label_19 = createElement("label");
			label_19.innerHTML = "HTML code<br>\n          (copy&pasta)";
			text_133 = createText("\n      ");
			td_41 = createElement("td");
			textarea = createElement("textarea");
			text_136 = createText("\n    ");
			tr_21 = createElement("tr");
			td_42 = createElement("td");
			label_20 = createElement("label");
			label_20.textContent = "Referrers";
			text_139 = createText("\n      ");
			td_43 = createElement("td");
			referrers._fragment.c();
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles$7(table);
			encapsulateStyles$7(tr);
			encapsulateStyles$7(td);
			addListener(label, "click", click_handler);
			encapsulateStyles$7(td_1);
			encapsulateStyles$7(input);
			input.type = "url";
			input.name = "url";
			input.value = state.$url;
			input.required = true;
			addListener(input, "change", change_handler);
			encapsulateStyles$7(tr_1);
			encapsulateStyles$7(td_2);
			encapsulateStyles$7(td_3);
			encapsulateStyles$7(tr_2);
			encapsulateStyles$7(td_4);
			addListener(label_2, "click", click_handler_1);
			td_4.className = "top";
			encapsulateStyles$7(td_5);
			encapsulateStyles$7(summary);
			encapsulateStyles$7(tr_3);
			encapsulateStyles$7(td_6);
			encapsulateStyles$7(td_7);
			encapsulateStyles$7(tr_4);
			encapsulateStyles$7(td_8);
			encapsulateStyles$7(td_9);
			td_9.className = "source";
			encapsulateStyles$7(tr_5);
			encapsulateStyles$7(td_10);
			addListener(label_5, "click", click_handler_2);
			encapsulateStyles$7(td_11);
			encapsulateStyles$7(input_1);
			input_1.type = "number";
			input_1.name = "maxItems";
			input_1.value = state.$maxItems;
			input_1.min = "1";
			input_1.max = "99";
			input_1.required = true;
			addListener(input_1, "change", change_handler_1);
			encapsulateStyles$7(tr_6);
			encapsulateStyles$7(td_12);
			addListener(label_6, "click", click_handler_3);
			encapsulateStyles$7(td_13);
			encapsulateStyles$7(input_2);
			input_2.type = "number";
			input_2.name = "width";
			input_2.value = state.$width;
			input_2.min = "100";
			input_2.max = "9999";
			input_2.placeholder = "spare";
			addListener(input_2, "change", change_handler_2);
			encapsulateStyles$7(tr_7);
			encapsulateStyles$7(td_14);
			addListener(label_7, "click", click_handler_4);
			encapsulateStyles$7(td_15);
			encapsulateStyles$7(input_3);
			input_3.type = "number";
			input_3.name = "height";
			input_3.value = state.$height;
			input_3.min = "100";
			input_3.max = "9999";
			input_3.placeholder = "spare";
			addListener(input_3, "change", change_handler_3);
			encapsulateStyles$7(tr_8);
			encapsulateStyles$7(td_16);
			addListener(label_8, "click", click_handler_5);
			encapsulateStyles$7(td_17);
			encapsulateStyles$7(input_4);
			input_4.type = "number";
			input_4.name = "radius";
			input_4.value = state.$radius;
			input_4.min = "0";
			input_4.max = "20";
			input_4.required = true;
			addListener(input_4, "change", change_handler_4);
			encapsulateStyles$7(tr_9);
			encapsulateStyles$7(td_18);
			addListener(label_9, "click", click_handler_6);
			encapsulateStyles$7(td_19);
			input_5.type = "checkbox";
			input_5.name = "showXmlButton";
			input_5.value = "1";
			input_5.checked = state.$showXmlButton;
			addListener(input_5, "change", change_handler_5);
			encapsulateStyles$7(tr_10);
			encapsulateStyles$7(td_20);
			addListener(label_10, "click", click_handler_7);
			encapsulateStyles$7(td_21);
			input_6.type = "checkbox";
			input_6.name = "compact";
			input_6.value = "1";
			input_6.checked = state.$compact;
			addListener(input_6, "change", change_handler_6);
			encapsulateStyles$7(tr_11);
			encapsulateStyles$7(td_22);
			addListener(label_11, "click", click_handler_8);
			encapsulateStyles$7(td_23);
			input_7.type = "checkbox";
			input_7.name = "headless";
			input_7.value = "1";
			input_7.checked = state.$headless;
			addListener(input_7, "change", change_handler_7);
			encapsulateStyles$7(tr_12);
			encapsulateStyles$7(td_24);
			addListener(label_12, "click", click_handler_9);
			encapsulateStyles$7(td_25);
			encapsulateStyles$7(input_8);
			input_8.type = "color";
			input_8.name = "frameColor";
			input_8.value = state.$frameColor;
			input_8.size = "6";
			input_8.maxLength = "7";
			addListener(input_8, "change", change_handler_8);
			encapsulateStyles$7(tr_13);
			encapsulateStyles$7(td_26);
			addListener(label_13, "click", click_handler_10);
			encapsulateStyles$7(td_27);
			encapsulateStyles$7(input_9);
			input_9.type = "color";
			input_9.name = "titleBarColor";
			input_9.value = state.$titleBarColor;
			input_9.size = "6";
			input_9.maxLength = "7";
			addListener(input_9, "change", change_handler_9);
			encapsulateStyles$7(tr_14);
			encapsulateStyles$7(td_28);
			addListener(label_14, "click", click_handler_11);
			encapsulateStyles$7(td_29);
			encapsulateStyles$7(input_10);
			input_10.type = "color";
			input_10.name = "titleBarTextColor";
			input_10.value = state.$titleBarTextColor;
			input_10.size = "6";
			input_10.maxLength = "7";
			addListener(input_10, "change", change_handler_10);
			encapsulateStyles$7(tr_15);
			encapsulateStyles$7(td_30);
			addListener(label_15, "click", click_handler_12);
			encapsulateStyles$7(td_31);
			encapsulateStyles$7(input_11);
			input_11.type = "color";
			input_11.name = "boxFillColor";
			input_11.value = state.$boxFillColor;
			input_11.size = "6";
			input_11.maxLength = "7";
			addListener(input_11, "change", change_handler_11);
			encapsulateStyles$7(tr_16);
			encapsulateStyles$7(td_32);
			addListener(label_16, "click", click_handler_13);
			encapsulateStyles$7(td_33);
			encapsulateStyles$7(input_12);
			input_12.type = "color";
			input_12.name = "textColor";
			input_12.value = state.$textColor;
			input_12.size = "6";
			input_12.maxLength = "7";
			addListener(input_12, "change", change_handler_12);
			encapsulateStyles$7(tr_17);
			encapsulateStyles$7(td_34);
			addListener(label_17, "click", click_handler_14);
			encapsulateStyles$7(td_35);
			encapsulateStyles$7(input_13);
			input_13.type = "color";
			input_13.name = "linkColor";
			input_13.value = state.$linkColor;
			input_13.size = "6";
			input_13.maxLength = "7";
			addListener(input_13, "change", change_handler_13);
			encapsulateStyles$7(tr_18);
			encapsulateStyles$7(td_36);
			addListener(label_18, "click", click_handler_15);
			encapsulateStyles$7(td_37);
			encapsulateStyles$7(input_14);
			input_14.name = "fontFace";
			input_14.value = state.$fontFace;
			input_14.pattern = "[\\d.]+(?:pt|px|em|%)+\\s+[\\s\\w\\-,]+";
			input_14.placeholder = "e.g. 10pt Helvetica, sans-serif";
			addListener(input_14, "change", change_handler_14);
			encapsulateStyles$7(tr_19);
			encapsulateStyles$7(td_38);
			encapsulateStyles$7(td_39);
			encapsulateStyles$7(tr_20);
			encapsulateStyles$7(td_40);
			addListener(label_19, "click", click_handler_16);
			encapsulateStyles$7(td_41);
			encapsulateStyles$7(textarea);
			textarea.name = "code";
			textarea.cols = "10";
			textarea.rows = "3";
			textarea.readOnly = true;
			textarea.value = state.$code;
			addListener(textarea, "click", click_handler_17);
			setStyle(tr_20, "vertical-align", "top");
			encapsulateStyles$7(tr_21);
			encapsulateStyles$7(td_42);
			label_20.title = "since midnight (GMT)";
			addListener(label_20, "click", click_handler_18);
			td_42.className = "top";
			encapsulateStyles$7(td_43);
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
			if_block.m(td_9, null);
			appendNode(text_35, table);
			appendNode(tr_5, table);
			appendNode(td_10, tr_5);
			appendNode(label_5, td_10);
			appendNode(text_38, tr_5);
			appendNode(td_11, tr_5);
			appendNode(input_1, td_11);
			appendNode(text_41, table);
			appendNode(tr_6, table);
			appendNode(td_12, tr_6);
			appendNode(label_6, td_12);
			appendNode(text_44, tr_6);
			appendNode(td_13, tr_6);
			appendNode(input_2, td_13);
			appendNode(text_45, td_13);
			appendNode(small, td_13);
			appendNode(text_49, table);
			appendNode(tr_7, table);
			appendNode(td_14, tr_7);
			appendNode(label_7, td_14);
			appendNode(text_52, tr_7);
			appendNode(td_15, tr_7);
			appendNode(input_3, td_15);
			appendNode(text_53, td_15);
			appendNode(small_1, td_15);
			appendNode(text_57, table);
			appendNode(tr_8, table);
			appendNode(td_16, tr_8);
			appendNode(label_8, td_16);
			appendNode(text_60, tr_8);
			appendNode(td_17, tr_8);
			appendNode(input_4, td_17);
			appendNode(text_61, td_17);
			appendNode(small_2, td_17);
			appendNode(text_65, table);
			appendNode(tr_9, table);
			appendNode(td_18, tr_9);
			appendNode(label_9, td_18);
			appendNode(text_68, tr_9);
			appendNode(td_19, tr_9);
			appendNode(input_5, td_19);
			appendNode(text_71, table);
			appendNode(tr_10, table);
			appendNode(td_20, tr_10);
			appendNode(label_10, td_20);
			appendNode(text_74, tr_10);
			appendNode(td_21, tr_10);
			appendNode(input_6, td_21);
			appendNode(text_77, table);
			appendNode(tr_11, table);
			appendNode(td_22, tr_11);
			appendNode(label_11, td_22);
			appendNode(text_80, tr_11);
			appendNode(td_23, tr_11);
			appendNode(input_7, td_23);
			appendNode(text_83, table);
			appendNode(tr_12, table);
			appendNode(td_24, tr_12);
			appendNode(label_12, td_24);
			appendNode(text_86, tr_12);
			appendNode(td_25, tr_12);
			appendNode(input_8, td_25);
			appendNode(text_89, table);
			appendNode(tr_13, table);
			appendNode(td_26, tr_13);
			appendNode(label_13, td_26);
			appendNode(text_92, tr_13);
			appendNode(td_27, tr_13);
			appendNode(input_9, td_27);
			appendNode(text_95, table);
			appendNode(tr_14, table);
			appendNode(td_28, tr_14);
			appendNode(label_14, td_28);
			appendNode(text_98, tr_14);
			appendNode(td_29, tr_14);
			appendNode(input_10, td_29);
			appendNode(text_101, table);
			appendNode(tr_15, table);
			appendNode(td_30, tr_15);
			appendNode(label_15, td_30);
			appendNode(text_104, tr_15);
			appendNode(td_31, tr_15);
			appendNode(input_11, td_31);
			appendNode(text_107, table);
			appendNode(tr_16, table);
			appendNode(td_32, tr_16);
			appendNode(label_16, td_32);
			appendNode(text_110, tr_16);
			appendNode(td_33, tr_16);
			appendNode(input_12, td_33);
			appendNode(text_113, table);
			appendNode(tr_17, table);
			appendNode(td_34, tr_17);
			appendNode(label_17, td_34);
			appendNode(text_116, tr_17);
			appendNode(td_35, tr_17);
			appendNode(input_13, td_35);
			appendNode(text_119, table);
			appendNode(tr_18, table);
			appendNode(td_36, tr_18);
			appendNode(label_18, td_36);
			appendNode(text_122, tr_18);
			appendNode(td_37, tr_18);
			appendNode(input_14, td_37);
			appendNode(text_125, table);
			appendNode(tr_19, table);
			appendNode(td_38, tr_19);
			appendNode(text_126, tr_19);
			appendNode(td_39, tr_19);
			if_block_1.m(td_39, null);
			appendNode(text_129, table);
			appendNode(tr_20, table);
			appendNode(td_40, tr_20);
			appendNode(label_19, td_40);
			appendNode(text_133, tr_20);
			appendNode(td_41, tr_20);
			appendNode(textarea, td_41);
			appendNode(text_136, table);
			appendNode(tr_21, table);
			appendNode(td_42, tr_21);
			appendNode(label_20, td_42);
			appendNode(text_139, tr_21);
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

			if (current_block_type === (current_block_type = select_block_type$1(state)) && if_block) {
				if_block.p(changed, state);
			} else {
				if_block.u();
				if_block.d();
				if_block = current_block_type(state, component);
				if_block.c();
				if_block.m(td_9, null);
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

			if (changed.$compact) {
				input_6.checked = state.$compact;
			}

			if (changed.$headless) {
				input_7.checked = state.$headless;
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

			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1$1(state))) {
				if_block_1.u();
				if_block_1.d();
				if_block_1 = current_block_type_1(state, component);
				if_block_1.c();
				if_block_1.m(td_39, null);
			}

			if (changed.$code) {
				textarea.value = state.$code;
			}
		},

		u: function unmount() {
			detachNode(form);
			if_block.u();
			if_block_1.u();
		},

		d: function destroy$$1() {
			removeListener(label, "click", click_handler);
			removeListener(input, "change", change_handler);
			removeListener(label_2, "click", click_handler_1);
			if_block.d();
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
			if_block_1.d();
			removeListener(label_19, "click", click_handler_16);
			removeListener(textarea, "click", click_handler_17);
			removeListener(label_20, "click", click_handler_18);
			referrers.destroy(false);
			removeListener(form, "submit", submit_handler);
		}
	};
}

// (43:8) {{ #if $loading }}
function create_if_block$1(state, component) {
	var text;

	return {
		c: function create() {
			text = createText("Loading...");
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

// (45:8) {{ else }}
function create_if_block_1$1(state, component) {
	var a, text, text_1, text_2;

	return {
		c: function create() {
			a = createElement("a");
			text = createText(state.$format);
			text_1 = createText(" ");
			text_2 = createText(state.$version);
			this.h();
		},

		h: function hydrate() {
			a.href = state.$url;
		},

		m: function mount(target, anchor) {
			insertNode(a, target, anchor);
			appendNode(text, a);
			appendNode(text_1, a);
			appendNode(text_2, a);
		},

		p: function update(changed, state) {
			if (changed.$format) {
				text.data = state.$format;
			}

			if (changed.$version) {
				text_2.data = state.$version;
			}

			if (changed.$url) {
				a.href = state.$url;
			}
		},

		u: function unmount() {
			detachNode(a);
		},

		d: noop
	};
}

// (168:8) {{ #if $loading }}
function create_if_block_2$1(state, component) {
	var button;

	return {
		c: function create() {
			button = createElement("button");
			button.textContent = "Loading...";
			this.h();
		},

		h: function hydrate() {
			button.className = "btn btn-sm btn-c";
			button.disabled = true;
		},

		m: function mount(target, anchor) {
			insertNode(button, target, anchor);
		},

		u: function unmount() {
			detachNode(button);
		},

		d: noop
	};
}

// (170:8) {{ else }}
function create_if_block_3$1(state, component) {
	var button;

	function click_handler(event) {
		component.reload(event);
	}

	return {
		c: function create() {
			button = createElement("button");
			button.textContent = "Reload";
			this.h();
		},

		h: function hydrate() {
			button.className = "btn btn-sm btn-b";
			button.type = "button";
			addListener(button, "click", click_handler);
		},

		m: function mount(target, anchor) {
			insertNode(button, target, anchor);
		},

		u: function unmount() {
			detachNode(button);
		},

		d: function destroy$$1() {
			removeListener(button, "click", click_handler);
		}
	};
}

function select_block_type$1(state) {
	if (state.$loading) return create_if_block$1;
	return create_if_block_1$1;
}

function select_block_type_1$1(state) {
	if (state.$loading) return create_if_block_2$1;
	return create_if_block_3$1;
}

function Configurator(options) {
	this._debugName = '<Configurator>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init(this, options);
	this._state = assign(this.store._init(["url","title","description","formattedDate","loading","format","version","maxItems","width","height","radius","showXmlButton","compact","headless","frameColor","titleBarColor","titleBarTextColor","boxFillColor","textColor","linkColor","fontFace","code"]), options.data);
	this.store._add(this, ["url","title","description","formattedDate","loading","format","version","maxItems","width","height","radius","showXmlButton","compact","headless","frameColor","titleBarColor","titleBarTextColor","boxFillColor","textColor","linkColor","fontFace","code"]);
	if (!('$url' in this._state)) console.warn("<Configurator> was created without expected data property '$url'");
	if (!('$title' in this._state)) console.warn("<Configurator> was created without expected data property '$title'");
	if (!('$description' in this._state)) console.warn("<Configurator> was created without expected data property '$description'");
	if (!('$formattedDate' in this._state)) console.warn("<Configurator> was created without expected data property '$formattedDate'");
	if (!('$loading' in this._state)) console.warn("<Configurator> was created without expected data property '$loading'");
	if (!('$format' in this._state)) console.warn("<Configurator> was created without expected data property '$format'");
	if (!('$version' in this._state)) console.warn("<Configurator> was created without expected data property '$version'");
	if (!('$maxItems' in this._state)) console.warn("<Configurator> was created without expected data property '$maxItems'");
	if (!('$width' in this._state)) console.warn("<Configurator> was created without expected data property '$width'");
	if (!('$height' in this._state)) console.warn("<Configurator> was created without expected data property '$height'");
	if (!('$radius' in this._state)) console.warn("<Configurator> was created without expected data property '$radius'");
	if (!('$showXmlButton' in this._state)) console.warn("<Configurator> was created without expected data property '$showXmlButton'");
	if (!('$compact' in this._state)) console.warn("<Configurator> was created without expected data property '$compact'");
	if (!('$headless' in this._state)) console.warn("<Configurator> was created without expected data property '$headless'");
	if (!('$frameColor' in this._state)) console.warn("<Configurator> was created without expected data property '$frameColor'");
	if (!('$titleBarColor' in this._state)) console.warn("<Configurator> was created without expected data property '$titleBarColor'");
	if (!('$titleBarTextColor' in this._state)) console.warn("<Configurator> was created without expected data property '$titleBarTextColor'");
	if (!('$boxFillColor' in this._state)) console.warn("<Configurator> was created without expected data property '$boxFillColor'");
	if (!('$textColor' in this._state)) console.warn("<Configurator> was created without expected data property '$textColor'");
	if (!('$linkColor' in this._state)) console.warn("<Configurator> was created without expected data property '$linkColor'");
	if (!('$fontFace' in this._state)) console.warn("<Configurator> was created without expected data property '$fontFace'");
	if (!('$code' in this._state)) console.warn("<Configurator> was created without expected data property '$code'");

	this._handlers.destroy = [removeFromStore];

	if (!document.getElementById("svelte-3994292734-style")) add_css$7();

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment$9(this._state, this);

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
function create_main_fragment(state, component) {
	var div, div_1, text_1, div_2, text_3, div_3, text_4;

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
			div = createElement("div");
			div_1 = createElement("div");
			box._fragment.c();
			text_1 = createText("\n  ");
			div_2 = createElement("div");
			configurator._fragment.c();
			text_3 = createText("\n  ");
			div_3 = createElement("div");
			ad._fragment.c();
			text_4 = createText("\n    ");
			about._fragment.c();
			this.h();
		},

		h: function hydrate() {
			div_1.className = "col c2";
			div_2.className = "col c5";
			div_3.className = "col c5";
			div.className = "row";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(div_1, div);
			box._mount(div_1, null);
			appendNode(text_1, div);
			appendNode(div_2, div);
			configurator._mount(div_2, null);
			appendNode(text_3, div);
			appendNode(div_3, div);
			ad._mount(div_3, null);
			appendNode(text_4, div_3);
			about._mount(div_3, null);
		},

		p: noop,

		u: function unmount() {
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

var polyfill = callback => {
  const features = ['fetch', 'Object.assign', 'Promise', 'String.prototype.padStart'];

  const script = document.createElement('script');
  script.src = 'https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join();
  script.defer = script.async = true;
  script.onload = callback;
  document.head.appendChild(script);
};

polyfill(() => {
  const getQuery = () => {
    const query = [];

    keys.forEach(key => {
      const value = store.get(key);
      if (!value) return;
      query.push(key + '=' + encodeURIComponent(value));
    });

    return query.join('&');
  };

  const store = new RssStore();

  store.compute('code', keys, () => {
    const query = getQuery().replace(/&/g, '&amp;');
    return `<script async defer src='${urls$$1.app}/main.js?${query}'></script>`;
  });

  new App({
    target: document.querySelector('main'),
    store
  });

  const query = location.search;
  let url;

  if (query && query.startsWith('?url=')) {
    const parts = query.substr(5).split('&');
    url = parts[0];
  }

  store.set({
    align: 'initial',
    appDescription: description,
    appVersion: version,
    boxFillColor: '#ffead2',
    compact: false,
    fontFace: '10pt sans-serif',
    frameColor: '#b3a28e',
    headless: false,
    height: '',
    linkColor: '#2c7395',
    maxItems: 7,
    radius: 5,
    showXmlButton: true,
    textColor: '#95412b',
    titleBarColor: '#90a8b3',
    titleBarTextColor: '#ffead2',
    url: url || urls$$1.default,
    width: ''
  });

  // For debugging
  //window.store = store;
});

}());
//# sourceMappingURL=app.js.map
