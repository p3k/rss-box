(function () {
  'use strict';

  var ready$1 = {exports: {}};

  /*!
    * domready (c) Dustin Diaz 2014 - License MIT
    */

  (function (module) {
  !function (name, definition) {

    module.exports = definition();

  }('domready', function () {

    var fns = [], listener
      , doc = document
      , hack = doc.documentElement.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState);


    if (!loaded)
    doc.addEventListener(domContentLoaded, listener = function () {
      doc.removeEventListener(domContentLoaded, listener);
      loaded = 1;
      while (listener = fns.shift()) listener();
    });

    return function (fn) {
      loaded ? setTimeout(fn, 0) : fns.push(fn);
    }

  });
  }(ready$1));

  var ready = ready$1.exports;

  function noop() { }
  function is_promise(value) {
      return value && typeof value === 'object' && typeof value.then === 'function';
  }
  function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
          loc: { file, line, column, char }
      };
  }
  function run(fn) {
      return fn();
  }
  function blank_object() {
      return Object.create(null);
  }
  function run_all(fns) {
      fns.forEach(run);
  }
  function is_function(thing) {
      return typeof thing === 'function';
  }
  function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }
  function is_empty(obj) {
      return Object.keys(obj).length === 0;
  }
  function validate_store(store, name) {
      if (store != null && typeof store.subscribe !== 'function') {
          throw new Error(`'${name}' is not a store with a 'subscribe' method`);
      }
  }
  function subscribe(store, ...callbacks) {
      if (store == null) {
          return noop;
      }
      const unsub = store.subscribe(...callbacks);
      return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  function append(target, node) {
      target.appendChild(node);
  }
  function append_styles(target, style_sheet_id, styles) {
      var _a;
      const append_styles_to = get_root_for_styles(target);
      if (!((_a = append_styles_to) === null || _a === void 0 ? void 0 : _a.getElementById(style_sheet_id))) {
          const style = element('style');
          style.id = style_sheet_id;
          style.textContent = styles;
          append_stylesheet(append_styles_to, style);
      }
  }
  function get_root_for_node(node) {
      if (!node)
          return document;
      return (node.getRootNode ? node.getRootNode() : node.ownerDocument); // check for getRootNode because IE is still supported
  }
  function get_root_for_styles(node) {
      const root = get_root_for_node(node);
      return root.host ? root : root;
  }
  function append_stylesheet(node, style) {
      append(node.head || node, style);
  }
  function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
  }
  function detach(node) {
      node.parentNode.removeChild(node);
  }
  function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
          if (iterations[i])
              iterations[i].d(detaching);
      }
  }
  function element(name) {
      return document.createElement(name);
  }
  function svg_element(name) {
      return document.createElementNS('http://www.w3.org/2000/svg', name);
  }
  function text(data) {
      return document.createTextNode(data);
  }
  function space() {
      return text(' ');
  }
  function empty() {
      return text('');
  }
  function attr(node, attribute, value) {
      if (value == null)
          node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
          node.setAttribute(attribute, value);
  }
  function children(element) {
      return Array.from(element.childNodes);
  }
  function set_style(node, key, value, important) {
      node.style.setProperty(key, value, important ? 'important' : '');
  }
  function custom_event(type, detail, bubbles = false) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, bubbles, false, detail);
      return e;
  }
  class HtmlTag {
      constructor() {
          this.e = this.n = null;
      }
      c(html) {
          this.h(html);
      }
      m(html, target, anchor = null) {
          if (!this.e) {
              this.e = element(target.nodeName);
              this.t = target;
              this.c(html);
          }
          this.i(anchor);
      }
      h(html) {
          this.e.innerHTML = html;
          this.n = Array.from(this.e.childNodes);
      }
      i(anchor) {
          for (let i = 0; i < this.n.length; i += 1) {
              insert(this.t, this.n[i], anchor);
          }
      }
      p(html) {
          this.d();
          this.h(html);
          this.i(this.a);
      }
      d() {
          this.n.forEach(detach);
      }
  }

  let current_component;
  function set_current_component(component) {
      current_component = component;
  }
  function get_current_component() {
      if (!current_component)
          throw new Error('Function called outside component initialization');
      return current_component;
  }
  function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
  }

  const dirty_components = [];
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];
  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  function schedule_update() {
      if (!update_scheduled) {
          update_scheduled = true;
          resolved_promise.then(flush);
      }
  }
  function add_render_callback(fn) {
      render_callbacks.push(fn);
  }
  let flushing = false;
  const seen_callbacks = new Set();
  function flush() {
      if (flushing)
          return;
      flushing = true;
      do {
          // first, call beforeUpdate functions
          // and update components
          for (let i = 0; i < dirty_components.length; i += 1) {
              const component = dirty_components[i];
              set_current_component(component);
              update(component.$$);
          }
          set_current_component(null);
          dirty_components.length = 0;
          while (binding_callbacks.length)
              binding_callbacks.pop()();
          // then, once components are updated, call
          // afterUpdate functions. This may cause
          // subsequent updates...
          for (let i = 0; i < render_callbacks.length; i += 1) {
              const callback = render_callbacks[i];
              if (!seen_callbacks.has(callback)) {
                  // ...so guard against infinite loops
                  seen_callbacks.add(callback);
                  callback();
              }
          }
          render_callbacks.length = 0;
      } while (dirty_components.length);
      while (flush_callbacks.length) {
          flush_callbacks.pop()();
      }
      update_scheduled = false;
      flushing = false;
      seen_callbacks.clear();
  }
  function update($$) {
      if ($$.fragment !== null) {
          $$.update();
          run_all($$.before_update);
          const dirty = $$.dirty;
          $$.dirty = [-1];
          $$.fragment && $$.fragment.p($$.ctx, dirty);
          $$.after_update.forEach(add_render_callback);
      }
  }
  const outroing = new Set();
  let outros;
  function group_outros() {
      outros = {
          r: 0,
          c: [],
          p: outros // parent group
      };
  }
  function check_outros() {
      if (!outros.r) {
          run_all(outros.c);
      }
      outros = outros.p;
  }
  function transition_in(block, local) {
      if (block && block.i) {
          outroing.delete(block);
          block.i(local);
      }
  }
  function transition_out(block, local, detach, callback) {
      if (block && block.o) {
          if (outroing.has(block))
              return;
          outroing.add(block);
          outros.c.push(() => {
              outroing.delete(block);
              if (callback) {
                  if (detach)
                      block.d(1);
                  callback();
              }
          });
          block.o(local);
      }
  }

  function handle_promise(promise, info) {
      const token = info.token = {};
      function update(type, index, key, value) {
          if (info.token !== token)
              return;
          info.resolved = value;
          let child_ctx = info.ctx;
          if (key !== undefined) {
              child_ctx = child_ctx.slice();
              child_ctx[key] = value;
          }
          const block = type && (info.current = type)(child_ctx);
          let needs_flush = false;
          if (info.block) {
              if (info.blocks) {
                  info.blocks.forEach((block, i) => {
                      if (i !== index && block) {
                          group_outros();
                          transition_out(block, 1, 1, () => {
                              if (info.blocks[i] === block) {
                                  info.blocks[i] = null;
                              }
                          });
                          check_outros();
                      }
                  });
              }
              else {
                  info.block.d(1);
              }
              block.c();
              transition_in(block, 1);
              block.m(info.mount(), info.anchor);
              needs_flush = true;
          }
          info.block = block;
          if (info.blocks)
              info.blocks[index] = block;
          if (needs_flush) {
              flush();
          }
      }
      if (is_promise(promise)) {
          const current_component = get_current_component();
          promise.then(value => {
              set_current_component(current_component);
              update(info.then, 1, info.value, value);
              set_current_component(null);
          }, error => {
              set_current_component(current_component);
              update(info.catch, 2, info.error, error);
              set_current_component(null);
              if (!info.hasCatch) {
                  throw error;
              }
          });
          // if we previously had a then/catch block, destroy it
          if (info.current !== info.pending) {
              update(info.pending, 0);
              return true;
          }
      }
      else {
          if (info.current !== info.then) {
              update(info.then, 1, info.value, promise);
              return true;
          }
          info.resolved = promise;
      }
  }
  function update_await_block_branch(info, ctx, dirty) {
      const child_ctx = ctx.slice();
      const { resolved } = info;
      if (info.current === info.then) {
          child_ctx[info.value] = resolved;
      }
      if (info.current === info.catch) {
          child_ctx[info.error] = resolved;
      }
      info.block.p(child_ctx, dirty);
  }
  function create_component(block) {
      block && block.c();
  }
  function mount_component(component, target, anchor, customElement) {
      const { fragment, on_mount, on_destroy, after_update } = component.$$;
      fragment && fragment.m(target, anchor);
      if (!customElement) {
          // onMount happens before the initial afterUpdate
          add_render_callback(() => {
              const new_on_destroy = on_mount.map(run).filter(is_function);
              if (on_destroy) {
                  on_destroy.push(...new_on_destroy);
              }
              else {
                  // Edge case - component was destroyed immediately,
                  // most likely as a result of a binding initialising
                  run_all(new_on_destroy);
              }
              component.$$.on_mount = [];
          });
      }
      after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
      const $$ = component.$$;
      if ($$.fragment !== null) {
          run_all($$.on_destroy);
          $$.fragment && $$.fragment.d(detaching);
          // TODO null out other refs, including component.$$ (but need to
          // preserve final state?)
          $$.on_destroy = $$.fragment = null;
          $$.ctx = [];
      }
  }
  function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
          dirty_components.push(component);
          schedule_update();
          component.$$.dirty.fill(0);
      }
      component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
  }
  function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
      const parent_component = current_component;
      set_current_component(component);
      const $$ = component.$$ = {
          fragment: null,
          ctx: null,
          // state
          props,
          update: noop,
          not_equal,
          bound: blank_object(),
          // lifecycle
          on_mount: [],
          on_destroy: [],
          on_disconnect: [],
          before_update: [],
          after_update: [],
          context: new Map(parent_component ? parent_component.$$.context : options.context || []),
          // everything else
          callbacks: blank_object(),
          dirty,
          skip_bound: false,
          root: options.target || parent_component.$$.root
      };
      append_styles && append_styles($$.root);
      let ready = false;
      $$.ctx = instance
          ? instance(component, options.props || {}, (i, ret, ...rest) => {
              const value = rest.length ? rest[0] : ret;
              if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                  if (!$$.skip_bound && $$.bound[i])
                      $$.bound[i](value);
                  if (ready)
                      make_dirty(component, i);
              }
              return ret;
          })
          : [];
      $$.update();
      ready = true;
      run_all($$.before_update);
      // `false` as a special case of no DOM component
      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
      if (options.target) {
          if (options.hydrate) {
              const nodes = children(options.target);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.l(nodes);
              nodes.forEach(detach);
          }
          else {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.c();
          }
          if (options.intro)
              transition_in(component.$$.fragment);
          mount_component(component, options.target, options.anchor, options.customElement);
          flush();
      }
      set_current_component(parent_component);
  }
  /**
   * Base class for Svelte components. Used when dev=false.
   */
  class SvelteComponent {
      $destroy() {
          destroy_component(this, 1);
          this.$destroy = noop;
      }
      $on(type, callback) {
          const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
          callbacks.push(callback);
          return () => {
              const index = callbacks.indexOf(callback);
              if (index !== -1)
                  callbacks.splice(index, 1);
          };
      }
      $set($$props) {
          if (this.$$set && !is_empty($$props)) {
              this.$$.skip_bound = true;
              this.$$set($$props);
              this.$$.skip_bound = false;
          }
      }
  }

  function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({ version: '3.40.0' }, detail), true));
  }
  function append_dev(target, node) {
      dispatch_dev('SvelteDOMInsert', { target, node });
      append(target, node);
  }
  function insert_dev(target, node, anchor) {
      dispatch_dev('SvelteDOMInsert', { target, node, anchor });
      insert(target, node, anchor);
  }
  function detach_dev(node) {
      dispatch_dev('SvelteDOMRemove', { node });
      detach(node);
  }
  function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null)
          dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
      else
          dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
  }
  function set_data_dev(text, data) {
      data = '' + data;
      if (text.wholeText === data)
          return;
      dispatch_dev('SvelteDOMSetData', { node: text, data });
      text.data = data;
  }
  function validate_each_argument(arg) {
      if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
          let msg = '{#each} only iterates over array-like objects.';
          if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
              msg += ' You can use a spread to convert this iterable into an array.';
          }
          throw new Error(msg);
      }
  }
  function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
          if (!~keys.indexOf(slot_key)) {
              console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
          }
      }
  }
  /**
   * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
   */
  class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
          if (!options || (!options.target && !options.$$inline)) {
              throw new Error("'target' is a required option");
          }
          super();
      }
      $destroy() {
          super.$destroy();
          this.$destroy = () => {
              console.warn('Component was already destroyed'); // eslint-disable-line no-console
          };
      }
      $capture_state() { }
      $inject_state() { }
  }

  const subscriber_queue = [];
  /**
   * Creates a `Readable` store that allows reading by subscription.
   * @param value initial value
   * @param {StartStopNotifier}start start and stop notifications for subscriptions
   */
  function readable(value, start) {
      return {
          subscribe: writable(value, start).subscribe
      };
  }
  /**
   * Create a `Writable` store that allows both updating and reading by subscription.
   * @param {*=}value initial value
   * @param {StartStopNotifier=}start start and stop notifications for subscriptions
   */
  function writable(value, start = noop) {
      let stop;
      const subscribers = [];
      function set(new_value) {
          if (safe_not_equal(value, new_value)) {
              value = new_value;
              if (stop) { // store is ready
                  const run_queue = !subscriber_queue.length;
                  for (let i = 0; i < subscribers.length; i += 1) {
                      const s = subscribers[i];
                      s[1]();
                      subscriber_queue.push(s, value);
                  }
                  if (run_queue) {
                      for (let i = 0; i < subscriber_queue.length; i += 2) {
                          subscriber_queue[i][0](subscriber_queue[i + 1]);
                      }
                      subscriber_queue.length = 0;
                  }
              }
          }
      }
      function update(fn) {
          set(fn(value));
      }
      function subscribe(run, invalidate = noop) {
          const subscriber = [run, invalidate];
          subscribers.push(subscriber);
          if (subscribers.length === 1) {
              stop = start(set) || noop;
          }
          run(value);
          return () => {
              const index = subscribers.indexOf(subscriber);
              if (index !== -1) {
                  subscribers.splice(index, 1);
              }
              if (subscribers.length === 0) {
                  stop();
                  stop = null;
              }
          };
      }
      return { set, update, subscribe };
  }

  const urls$1 = {};

  const baseUrl = "http://localhost";

  const urls = {
    app: baseUrl + ":8000",
    proxy: baseUrl + ":8000/roxy",
    referrers: baseUrl + ":8000/ferris?group=rss-box",
    feed: "https://blog.p3k.org/stories.xml"
  };

  Object.keys(urls$1).forEach(key => {
    if (key in urls) urls[key] = urls$1[key];
  });

  const defaultError = {
    loading: false,
    compact: false,
    maxItems: 3,
    format: "Error",
    version: "⚡",
    title: "RSS Box Error",
    description:
      "This output was automatically generated to report an error that occurred during a request to the RSS Box Viewer.",
    image: "",
    items: [
      {
        title: "Oops, something went wrong…",
        description: "An error occurred while processing the request to the RSS Box Viewer."
      },
      {
        title: "The following error message was returned:",
        description: "Unknown error"
      },
      { title: "" }
    ]
  };

  function error(url, message) {
    const error = Object.assign({}, defaultError);
    error.link = urls.app + "?url=" + url;
    error.items[1].description = message;
    error.items[2].description = `
    Most likely, this might have happened because of a non-existent or invalid RSS feed URL.
    <a href="https://validator.w3.org/feed/check.cgi?url=${url}">Please check</a> and
    possibly correct your input, then try again.
  `;
    return error;
  }

  function RssParser() {
    const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/";
    const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    const ISO_DATE_PATTERN = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/;

    const getDocument = function(xml) {
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

    const getChildElement = function(name, parent, namespace) {
      if (!name || !parent) return null;
      let method = "getElementsByTagName";
      if (namespace) method += "NS";
      return parent[method](name, namespace)[0];
    };

    const getText = function(node) {
      if (!node) return "";
      if (node.length) node = node[0];
      return node.textContent;
    };

    const error = Error("Malformed RSS syntax");

    const parseRss = function(root, type) {
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
          source: getText(getChildElement("url", image)) || image.getAttributeNS(RDF_NAMESPACE, "resource"),
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
        rss.rights = getText(channel.getElementsByTagNameNS(DC_NAMESPACE, "creator"));

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
          getText(getChildElement("lastBuildDate", channel)) || getText(getChildElement("pubDate", channel))
        );
        rss.rights = getText(getChildElement("copyright", channel));
      }

      // Create a native Array from HTMLCollection
      const items = Array.apply(null, root.getElementsByTagName("item"));

      items.forEach(node => {
        const item = {
          title: getText(getChildElement("title", node)),
          description: getText(getChildElement("description", node)),
          link: getText(getChildElement("link", node)) || getText(getChildElement("guid", node))
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

    const parseAtom = function(root) {
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

    const parseScriptingNews = function(root) {
      const rss = { items: [] };
      const channel = getChildElement("header", root);

      if (!channel) throw error;

      rss.format = "Scripting News";
      rss.version = getText(getChildElement("scriptingNewsVersion", channel));
      rss.title = getText(getChildElement("channelTitle", channel));
      rss.description = getText(getChildElement("channelDescription", channel));
      rss.link = getText(getChildElement("channelLink", channel));

      rss.date = getDate(
        getText(getChildElement("lastBuildDate", channel)) || getText(getChildElement("pubDate", channel))
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

        item.description = getText(getChildElement("text", node)).replace(/\n/g, " ");

        const link = getChildElement("link", node);

        if (link) {
          const text = getText(getChildElement("linetext", link))
            .replace(/\n/g, " ")
            .trim();
          if (text) {
            item.description = item.description.replace(
              new RegExp(text),
              "<a href=\"" + getText(getChildElement("url", node)) + "\">" + text + "</a>"
            );
          }
          item.link = getText(getChildElement("url", link));
        }

        addItemExtensions(node, item);
        rss.items.push(item);
      });

      return rss;
    };

    const addItemExtensions = function(node, item) {
      const source = getChildElement("source", node);
      // Create a native Array from HTMLCollection
      const enclosures = Array.apply(null, node.getElementsByTagName("enclosure"));
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

    const getDate = function(str) {
      let millis = Date.parse(str);

      if (isNaN(millis)) {
        millis = Date.parse(String(str).replace(ISO_DATE_PATTERN, "$1/$2/$3 $4"));
        if (isNaN(millis)) millis = Date.now();
      }

      return new Date(millis);
    };

    return {
      parse: function(xml) {
        const doc = getDocument(xml);

        if (!doc || getChildElement("parsererror", doc.documentElement)) throw error;

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

  var version = "21.12.11";
  var description = "RSS Box Viewer";

  var statusCodes = {
    "100": "Continue",
    "101": "Switching Protocols",
    "102": "Processing",
    "103": "Early Hints",
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "203": "Non-Authoritative Information",
    "204": "No Content",
    "205": "Reset Content",
    "206": "Partial Content",
    "207": "Multi-Status",
    "208": "Already Reported",
    "226": "IM Used",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "305": "Use Proxy",
    "307": "Temporary Redirect",
    "308": "Permanent Redirect",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Payload Too Large",
    "414": "URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Range Not Satisfiable",
    "417": "Expectation Failed",
    "418": "I'm a Teapot",
    "421": "Misdirected Request",
    "422": "Unprocessable Entity",
    "423": "Locked",
    "424": "Failed Dependency",
    "425": "Too Early",
    "426": "Upgrade Required",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "431": "Request Header Fields Too Large",
    "451": "Unavailable For Legal Reasons",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "509": "Bandwidth Limit Exceeded",
    "510": "Not Extended",
    "511": "Network Authentication Required"
  };

  const ObjectStore = defaultState => {
    const { subscribe, update } = writable(defaultState);

    const _update = newState =>
      update(state => {
        Object.keys(newState).forEach(key => {
          if (key in state === false) return;
          state[key] = newState[key];
          // See https://svelte.dev/tutorial/updating-arrays-and-objects
          state = state; // eslint-disable-line no-self-assign
        });

        return state;
      });

    return {
      subscribe,
      update: _update,
      set: _update
    };
  };

  function fetchFeed(url) {
    if (!url) return;

    const store = this;

    store.set({ loading: true });

    const headers = new Headers({
      Accept: [
        "application/rss+xml",
        "application/rdf+xml",
        "application/atom+xml",
        "application/xml;q=0.9",
        "text/xml;q=0.8"
      ].join()
    });

    fetch(urls.proxy + "?url=" + encodeURIComponent(url), { headers, referrerPolicy: "no-referrer" })
      .then(res => {
        if (res.status > 399) throw Error(statusCodes[res.status]);
        return res.json();
      })
      .then(data => {
        const parser = RssParser();
        const rss = parser.parse(data.content);

        if (!rss.date) rss.date = new Date(data.headers.date);

        store.set({ ...rss, loading: false });
      })
      .catch(message => {
        store.set(error(url, message));
        console.error(message);
      });
  }

  function fetchReferrers() {
    const store = this;

    fetch(urls.referrers)
      .then(res => res.json())
      .then(data => {
        const hosts = data.reduce((accu, item) => {
          if (
            item.url.startsWith("http") &&
            !item.url.startsWith(urls.app) &&
            item.url.indexOf("atari-embeds.googleusercontent.com") < 0
          ) {
            const url = item.url.replace(/^([^.]*)www\./, "$1");
            const host = url.split("/")[2];
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
            data.metadata = item.metadata || { feedUrls: [] };
          }
          return accu;
        }, []);

        const total = hosts.reduce((accu, item) => accu += item.total, 0);

        const referrers = hosts.map(item => {
          item.percentage = (item.total / total) * 100;
          return item;
        });

        referrers.sort((a, b) => b.percentage - a.percentage);
        store.set(referrers);
      });
  }

  const formatDate = date => {
    if (!date) return;

    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const day = date
      .getDate()
      .toString()
      .padStart(2, "0");

    const hours = date
      .getHours()
      .toString()
      .padStart(2, "0");

    const minutes = date
      .getMinutes()
      .toString()
      .padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}, ${hours}:${minutes}h`;
  };

  const ConfigStore = () => {
    const store = ObjectStore({
      align: "initial",
      boxFillColor: "#ffead2",
      compact: false,
      fontFace: "10pt sans-serif",
      frameColor: "#b3a28e",
      headless: false,
      height: "",
      linkColor: "#2c7395",
      maxItems: 7,
      radius: 5,
      showXmlButton: true,
      textColor: "#95412b",
      titleBarColor: "#90a8b3",
      titleBarTextColor: "#ffead2",
      url: "",
      width: ""
    });

    return store;
  };

  const FeedStore = () => {
    const store = ObjectStore({
      date: new Date(),
      description: "",
      format: "",
      image: "",
      input: "",
      items: [],
      link: "",
      loading: false,
      title: "",
      version: ""
    });

    store.fetch = fetchFeed.bind(store);
    store.formatDate = formatDate.bind(store);
    return store;
  };

  readable({ description, version });
  FeedStore();
  const referrers = writable([]);

  referrers.fetch = fetchReferrers.bind(referrers);

  // For debugging
  //window.stores = { app, config, feed, referrers };

  // Retrieve native objects without any extensions (e.g. by PrototypeJS)
  function getNativeObject(native) {
    var iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    var retrieved = iframe.contentWindow[native];
    document.body.removeChild(iframe);
    return retrieved;
  }

  /* src/components/LinkIcon.html generated by Svelte v3.40.0 */

  const file$3 = "src/components/LinkIcon.html";

  function add_css$3(target) {
  	append_styles(target, "svelte-mfbc6b", "svg.svelte-mfbc6b{width:1.2em;height:1.2em}polygon.svelte-mfbc6b{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0ljb24uaHRtbCIsInNvdXJjZXMiOlsiTGlua0ljb24uaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c3R5bGU+XG4gIHN2ZyB7XG4gICAgd2lkdGg6IDEuMmVtO1xuICAgIGhlaWdodDogMS4yZW07XG4gIH1cblxuICBwb2x5Z29uIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gICAgZmlsbC1ydWxlOiBldmVub2RkO1xuICAgIGNsaXAtcnVsZTogZXZlbm9kZDtcbiAgfVxuPC9zdHlsZT5cblxuPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpWaXN1YWxFZGl0b3JfLV9JY29uXy1fRXh0ZXJuYWwtbGluay5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDEyIDEyJyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSd4TWluWU1pbic+XG4gIDxnPlxuICAgIDxwb2x5Z29uIHBvaW50cz0nMiwyIDUsMiA1LDMgMywzIDMsOSA5LDkgOSw3IDEwLDcgMTAsMTAgMiwxMCcvPlxuICAgIDxwb2x5Z29uIHBvaW50cz0nNi4yMTEsMiAxMCwyIDEwLDUuNzg5IDguNTc5LDQuMzY4IDYuNDQ3LDYuNSA1LjUsNS41NTMgNy42MzIsMy40MjEnLz5cbiAgPC9nPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0UsR0FBRyxjQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUFLLEFBQ2YsQ0FBQyxBQUVELE9BQU8sY0FBQyxDQUFDLEFBQ1AsSUFBSSxDQUFFLFlBQVksQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQUFDcEIsQ0FBQyJ9 */");
  }

  function create_fragment$3(ctx) {
  	let svg;
  	let g;
  	let polygon0;
  	let polygon1;

  	const block = {
  		c: function create() {
  			svg = svg_element("svg");
  			g = svg_element("g");
  			polygon0 = svg_element("polygon");
  			polygon1 = svg_element("polygon");
  			attr_dev(polygon0, "points", "2,2 5,2 5,3 3,3 3,9 9,9 9,7 10,7 10,10 2,10");
  			attr_dev(polygon0, "class", "svelte-mfbc6b");
  			add_location(polygon0, file$3, 16, 4, 355);
  			attr_dev(polygon1, "points", "6.211,2 10,2 10,5.789 8.579,4.368 6.447,6.5 5.5,5.553 7.632,3.421");
  			attr_dev(polygon1, "class", "svelte-mfbc6b");
  			add_location(polygon1, file$3, 17, 4, 423);
  			add_location(g, file$3, 15, 2, 347);
  			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
  			attr_dev(svg, "viewBox", "0 0 12 12");
  			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
  			attr_dev(svg, "class", "svelte-mfbc6b");
  			add_location(svg, file$3, 14, 0, 253);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, svg, anchor);
  			append_dev(svg, g);
  			append_dev(g, polygon0);
  			append_dev(g, polygon1);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(svg);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$3.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$3($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('LinkIcon', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LinkIcon> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class LinkIcon extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, add_css$3);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "LinkIcon",
  			options,
  			id: create_fragment$3.name
  		});
  	}
  }

  /* src/components/RssIcon.html generated by Svelte v3.40.0 */

  const file$2 = "src/components/RssIcon.html";

  function add_css$2(target) {
  	append_styles(target, "svelte-ibnekz", "svg.svelte-ibnekz{width:1em;height:1em}path.svelte-ibnekz{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnNzSWNvbi5odG1sIiwic291cmNlcyI6WyJSc3NJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxZW07XG4gICAgaGVpZ2h0OiAxZW07XG4gIH1cblxuICBwYXRoIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gIH1cbjwvc3R5bGU+XG5cbjwhLS0gU291cmNlOiBodHRwczovL2NvbW1vbnMud2lraW1lZGlhLm9yZy93aWtpL0ZpbGU6UnNzX2ZvbnRfYXdlc29tZS5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAtMjU2IDE3OTIgMTc5MicgcHJlc2VydmVBc3BlY3RSYXRpbz0neE1pbllNaW4nPlxuICA8ZyB0cmFuc2Zvcm09J21hdHJpeCgxLDAsMCwtMSwyMTIuNjEwMTcsMTM0Ni4xNjk1KSc+XG4gICAgPHBhdGggZD0nTSAzODQsMTkyIFEgMzg0LDExMiAzMjgsNTYgMjcyLDAgMTkyLDAgMTEyLDAgNTYsNTYgMCwxMTIgMCwxOTIgcSAwLDgwIDU2LDEzNiA1Niw1NiAxMzYsNTYgODAsMCAxMzYsLTU2IDU2LC01NiA1NiwtMTM2IHogTSA4OTYsNjkgUSA4OTgsNDEgODc5LDIxIDg2MSwwIDgzMiwwIEggNjk3IFEgNjcyLDAgNjU0LDE2LjUgNjM2LDMzIDYzNCw1OCA2MTIsMjg3IDQ0OS41LDQ0OS41IDI4Nyw2MTIgNTgsNjM0IDMzLDYzNiAxNi41LDY1NCAwLDY3MiAwLDY5NyB2IDEzNSBxIDAsMjkgMjEsNDcgMTcsMTcgNDMsMTcgaCA1IFEgMjI5LDg4MyAzNzUsODE1LjUgNTIxLDc0OCA2MzQsNjM0IDc0OCw1MjEgODE1LjUsMzc1IDg4MywyMjkgODk2LDY5IHogbSA1MTIsLTIgUSAxNDEwLDQwIDEzOTAsMjAgMTM3MiwwIDEzNDQsMCBIIDEyMDEgUSAxMTc1LDAgMTE1Ni41LDE3LjUgMTEzOCwzNSAxMTM3LDYwIDExMjUsMjc1IDEwMzYsNDY4LjUgOTQ3LDY2MiA4MDQuNSw4MDQuNSA2NjIsOTQ3IDQ2OC41LDEwMzYgMjc1LDExMjUgNjAsMTEzOCAzNSwxMTM5IDE3LjUsMTE1Ny41IDAsMTE3NiAwLDEyMDEgdiAxNDMgcSAwLDI4IDIwLDQ2IDE4LDE4IDQ0LDE4IGggMyBRIDMyOSwxMzk1IDU2OC41LDEyODggODA4LDExODEgOTk0LDk5NCAxMTgxLDgwOCAxMjg4LDU2OC41IDEzOTUsMzI5IDE0MDgsNjcgeicvPlxuICA8L2c+XG48L3N2Zz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxHQUFHLGNBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEdBQUcsQUFDYixDQUFDLEFBRUQsSUFBSSxjQUFDLENBQUMsQUFDSixJQUFJLENBQUUsWUFBWSxBQUNwQixDQUFDIn0= */");
  }

  function create_fragment$2(ctx) {
  	let svg;
  	let g;
  	let path;

  	const block = {
  		c: function create() {
  			svg = svg_element("svg");
  			g = svg_element("g");
  			path = svg_element("path");
  			attr_dev(path, "d", "M 384,192 Q 384,112 328,56 272,0 192,0 112,0 56,56 0,112 0,192 q 0,80 56,136 56,56 136,56 80,0 136,-56 56,-56 56,-136 z M 896,69 Q 898,41 879,21 861,0 832,0 H 697 Q 672,0 654,16.5 636,33 634,58 612,287 449.5,449.5 287,612 58,634 33,636 16.5,654 0,672 0,697 v 135 q 0,29 21,47 17,17 43,17 h 5 Q 229,883 375,815.5 521,748 634,634 748,521 815.5,375 883,229 896,69 z m 512,-2 Q 1410,40 1390,20 1372,0 1344,0 H 1201 Q 1175,0 1156.5,17.5 1138,35 1137,60 1125,275 1036,468.5 947,662 804.5,804.5 662,947 468.5,1036 275,1125 60,1138 35,1139 17.5,1157.5 0,1176 0,1201 v 143 q 0,28 20,46 18,18 44,18 h 3 Q 329,1395 568.5,1288 808,1181 994,994 1181,808 1288,568.5 1395,329 1408,67 z");
  			attr_dev(path, "class", "svelte-ibnekz");
  			add_location(path, file$2, 14, 4, 337);
  			attr_dev(g, "transform", "matrix(1,0,0,-1,212.61017,1346.1695)");
  			add_location(g, file$2, 13, 2, 280);
  			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
  			attr_dev(svg, "viewBox", "0 -256 1792 1792");
  			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
  			attr_dev(svg, "class", "svelte-ibnekz");
  			add_location(svg, file$2, 12, 0, 179);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, svg, anchor);
  			append_dev(svg, g);
  			append_dev(g, path);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(svg);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$2.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$2($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('RssIcon', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RssIcon> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class RssIcon extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, add_css$2);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "RssIcon",
  			options,
  			id: create_fragment$2.name
  		});
  	}
  }

  /* src/components/PaperclipIcon.html generated by Svelte v3.40.0 */

  const file$1 = "src/components/PaperclipIcon.html";

  function add_css$1(target) {
  	append_styles(target, "svelte-1bdkb67", "svg.svelte-1bdkb67{width:1.2em;height:1.2em}path.svelte-1bdkb67{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFwZXJjbGlwSWNvbi5odG1sIiwic291cmNlcyI6WyJQYXBlcmNsaXBJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxLjJlbTtcbiAgICBoZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG48IS0tIFNvdXJjZTogaHR0cHM6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9GaWxlOkFudHVfYXBwbGljYXRpb24tcnRmLnN2ZyAtLT5cbjxzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB2aWV3Qm94PScwIDAgMTYgMTYnIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPHBhdGggZD0nbTQwOSA1MzFsLTUuMjQ0IDYuNzMzYy0uOTgzIDEuMjYyLS43MDggMy41MTEuNTUgNC40OTcgMS4yNTkuOTg2IDMuNS43MSA0LjQ4NC0uNTUybDUuMjQ0LTYuNzMzLjY1NS0uODQyYy42NTYtLjg0Mi40NzItMi4zNDEtLjM2Ny0yLjk5OC0uODM5LS42NTgtMi4zMzQtLjQ3My0yLjk4OS4zNjhsLS42NTYuODQyLTMuOTMzIDUuMDUtLjY1Ni44NDJjLS4zMjguNDIxLS4yMzYgMS4xNy4xODMgMS40OTkuNDIuMzI5IDEuMTY3LjIzNyAxLjQ5NS0uMTg0bDQuNTg5LTUuODkxLjgzOS42NTgtNC41ODkgNS44OTFjLS42NTYuODQyLTIuMTUgMS4wMjYtMi45ODkuMzY4LS44MzktLjY1OC0xLjAyMy0yLjE1Ny0uMzY3LTIuOTk4bC42NTYtLjg0MiA0LjU4OS01Ljg5MWMuOTgzLTEuMjYyIDMuMjI1LTEuNTM4IDQuNDg0LS41NTIgMS4yNTkuOTg2IDEuNTM0IDMuMjM1LjU1MSA0LjQ5N2wtLjY1Ni44NDItNS4yNDQgNi43MzNjLTEuMzExIDEuNjgzLTQuMyAyLjA1MS01Ljk3OC43MzYtMS42NzgtMS4zMTUtMi4wNDUtNC4zMTMtLjczNC01Ljk5N2w1LjI0NC02LjczMy44MzkuNjU4JyB0cmFuc2Zvcm09J21hdHJpeCguODQ3ODIgMCAwIC44NDUyMS0zMzguODUtNDQ1LjY4KScgc3Ryb2tlPSdub25lJy8+XG48L3N2Zz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxHQUFHLGVBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLEtBQUssQUFDZixDQUFDLEFBRUQsSUFBSSxlQUFDLENBQUMsQUFDSixJQUFJLENBQUUsWUFBWSxBQUNwQixDQUFDIn0= */");
  }

  function create_fragment$1(ctx) {
  	let svg;
  	let path;

  	const block = {
  		c: function create() {
  			svg = svg_element("svg");
  			path = svg_element("path");
  			attr_dev(path, "d", "m409 531l-5.244 6.733c-.983 1.262-.708 3.511.55 4.497 1.259.986 3.5.71 4.484-.552l5.244-6.733.655-.842c.656-.842.472-2.341-.367-2.998-.839-.658-2.334-.473-2.989.368l-.656.842-3.933 5.05-.656.842c-.328.421-.236 1.17.183 1.499.42.329 1.167.237 1.495-.184l4.589-5.891.839.658-4.589 5.891c-.656.842-2.15 1.026-2.989.368-.839-.658-1.023-2.157-.367-2.998l.656-.842 4.589-5.891c.983-1.262 3.225-1.538 4.484-.552 1.259.986 1.534 3.235.551 4.497l-.656.842-5.244 6.733c-1.311 1.683-4.3 2.051-5.978.736-1.678-1.315-2.045-4.313-.734-5.997l5.244-6.733.839.658");
  			attr_dev(path, "transform", "matrix(.84782 0 0 .84521-338.85-445.68)");
  			attr_dev(path, "stroke", "none");
  			attr_dev(path, "class", "svelte-1bdkb67");
  			add_location(path, file$1, 13, 2, 281);
  			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
  			attr_dev(svg, "viewBox", "0 0 16 16");
  			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
  			attr_dev(svg, "class", "svelte-1bdkb67");
  			add_location(svg, file$1, 12, 0, 187);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, svg, anchor);
  			append_dev(svg, path);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(svg);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$1.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$1($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('PaperclipIcon', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PaperclipIcon> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class PaperclipIcon extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, add_css$1);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "PaperclipIcon",
  			options,
  			id: create_fragment$1.name
  		});
  	}
  }

  /* src/components/Box.html generated by Svelte v3.40.0 */
  const file = "src/components/Box.html";

  function add_css(target) {
  	append_styles(target, "svelte-1rjx8bp", ".rssbox.svelte-1rjx8bp.svelte-1rjx8bp{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon.svelte-1rjx8bp.svelte-1rjx8bp{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar.svelte-1rjx8bp.svelte-1rjx8bp{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date.svelte-1rjx8bp.svelte-1rjx8bp{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content.svelte-1rjx8bp.svelte-1rjx8bp{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content.svelte-1rjx8bp aside.svelte-1rjx8bp{clear:both;float:right}.rssbox-content.svelte-1rjx8bp aside a.svelte-1rjx8bp{display:block;margin-left:0.5em}.rssbox-image.svelte-1rjx8bp.svelte-1rjx8bp{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold.svelte-1rjx8bp.svelte-1rjx8bp{font-weight:bold}.rssbox-enclosure.svelte-1rjx8bp.svelte-1rjx8bp,.rssbox-source.svelte-1rjx8bp.svelte-1rjx8bp{display:block;width:1em}.rssbox-form.svelte-1rjx8bp.svelte-1rjx8bp{margin-bottom:0.8em}.rssbox-form.svelte-1rjx8bp input.svelte-1rjx8bp{padding:0.5em;background-color:#fff}.rssbox-promo.svelte-1rjx8bp.svelte-1rjx8bp{text-align:right;font-size:0.7em;letter-spacing:0.01em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94Lmh0bWwiLCJzb3VyY2VzIjpbIkJveC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tIFwic3ZlbHRlXCI7XG4gIGltcG9ydCB7IHVybHMgfSBmcm9tIFwiLi4vdXJsc1wiO1xuXG4gIGltcG9ydCBMaW5rSWNvbiBmcm9tIFwiLi9MaW5rSWNvbi5odG1sXCI7XG4gIGltcG9ydCBSc3NJY29uIGZyb20gXCIuL1Jzc0ljb24uaHRtbFwiO1xuICBpbXBvcnQgUGFwZXJjbGlwSWNvbiBmcm9tIFwiLi9QYXBlcmNsaXBJY29uLmh0bWxcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGZlZWQ7XG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRpY0lkID0gXCJyc3Nib3gtc3RhdGljLXN0eWxlc2hlZXRcIjtcbiAgICBjb25zdCBkeW5hbWljSWQgPSBcInJzc2JveC1keW5hbWljLXN0eWxlc2hlZXRcIjtcblxuICAgIGxldCBzdGF0aWNDc3MgPSB3aW5kb3dbc3RhdGljSWRdO1xuICAgIGxldCBkeW5hbWljQ3NzID0gd2luZG93W2R5bmFtaWNJZF07XG5cbiAgICBpZiAoIXN0YXRpY0Nzcykge1xuICAgICAgc3RhdGljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICBzdGF0aWNDc3MuaWQgPSBzdGF0aWNJZDtcbiAgICAgIHN0YXRpY0Nzcy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcbiAgICAgIHN0YXRpY0Nzcy5ocmVmID0gdXJscy5hcHAgKyBcIi9ib3guY3NzXCI7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0YXRpY0Nzcyk7XG4gICAgfVxuXG4gICAgaWYgKCFkeW5hbWljQ3NzKSB7XG4gICAgICBkeW5hbWljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgZHluYW1pY0Nzcy5pZCA9IGR5bmFtaWNJZDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZHluYW1pY0Nzcyk7XG4gICAgfVxuXG4gICAgY29uZmlnLnN1YnNjcmliZShzdGF0ZSA9PiB7XG4gICAgICBjb25zdCBjb2xvciA9IHN0YXRlLmxpbmtDb2xvcjtcblxuICAgICAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gICAgICBsZXQgcnVsZSA9XG4gICAgICAgIGAucnNzYm94W2RhdGEtbGluay1jb2xvcj1cIiR7IGNvbG9yIH1cIl0gYSB7XG4gICAgICAgICAgY29sb3I6ICR7IGNvbG9yIH07XG4gICAgICAgIH1gO1xuXG4gICAgICBpZiAoZHluYW1pY0Nzcy5pbm5lckhUTUwuaW5kZXhPZihydWxlKSA8IDApIGR5bmFtaWNDc3MuaW5uZXJIVE1MICs9IHJ1bGU7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGtiKGJ5dGVzKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIDEwMDApLnRvRml4ZWQoMikgKyBcIlxcdTIwMGFrQlwiO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZChkYXRhKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXhXaWR0aCA9IE1hdGgubWluKDEwMCwgaW1hZ2Uud2lkdGgpO1xuICAgICAgICBjb25zdCBmYWN0b3IgPSBpbWFnZS53aWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggLyBpbWFnZS53aWR0aCA6IDE7XG5cbiAgICAgICAgZnVsZmlsbCh7XG4gICAgICAgICAgd2lkdGg6IChpbWFnZS53aWR0aCAqIGZhY3RvcikgKyBcInB4XCIsXG4gICAgICAgICAgaGVpZ2h0OiAoaW1hZ2UuaGVpZ2h0ICogZmFjdG9yKSArIFwicHhcIlxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGltYWdlLnNyYyA9IGRhdGEuc291cmNlO1xuICAgIH0pO1xuICB9XG5cbiAgJDogaGVpZ2h0ID0gJGNvbmZpZy5oZWlnaHQgJiYgJGNvbmZpZy5oZWlnaHQgPiAtMSA/ICRjb25maWcuaGVpZ2h0ICsgXCJweFwiIDogXCIxMDAlXCI7XG4gICQ6IHdpZHRoID0gJGNvbmZpZy53aWR0aCA/ICRjb25maWcud2lkdGggKyBcInB4XCIgOiBcIjEwMCVcIjtcbiAgJDogaXRlbVRpdGxlQ2xhc3MgPSAhJGNvbmZpZy5jb21wYWN0ID8gXCJib2xkXCIgOiBcIlwiO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLnJzc2JveCB7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjMDAwO1xuICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDA7XG4gIH1cblxuICAucnNzYm94LWljb24ge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICB3aWR0aDogMWVtO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtdGl0bGViYXIge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGNvbG9yOiAjMDAwO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNhZGQ4ZTY7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICMwMDA7XG4gICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZGF0ZSB7XG4gICAgbWFyZ2luLXRvcDogMC4yZW07XG4gICAgZm9udC1zaXplOiAwLjhlbTtcbiAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IHtcbiAgICBoZWlnaHQ6IGF1dG87XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgICBjbGVhcjogYm90aDtcbiAgICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgfVxuXG4gIC5yc3Nib3gtY29udGVudCBhc2lkZSB7XG4gICAgY2xlYXI6IGJvdGg7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IGFzaWRlIGEge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtaW1hZ2Uge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICBtYXJnaW46IDAgMCAwLjVlbSAwLjVlbTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBsZWZ0IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcbiAgfVxuXG4gIC5yc3Nib3gtaXRlbS10aXRsZS5ib2xkIHtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxuXG4gIC5yc3Nib3gtZW5jbG9zdXJlLCAucnNzYm94LXNvdXJjZSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZm9ybSB7XG4gICAgbWFyZ2luLWJvdHRvbTogMC44ZW07XG4gIH1cblxuICAucnNzYm94LWZvcm0gaW5wdXQge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIH1cblxuICAucnNzYm94LXByb21vIHtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjAxZW07XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgZGF0YS1saW5rLWNvbG9yPSd7ICRjb25maWcubGlua0NvbG9yIH0nIGNsYXNzPSdyc3Nib3ggcnNzQm94JyBzdHlsZT0nbWF4LXdpZHRoOiB7IHdpZHRoIH07IGJvcmRlci1jb2xvcjogeyAkY29uZmlnLmZyYW1lQ29sb3IgfTsgYm9yZGVyLXJhZGl1czogeyAkY29uZmlnLnJhZGl1cyB9cHg7IGZvbnQ6IHsgJGNvbmZpZy5mb250RmFjZSB9OyBmbG9hdDogeyAkY29uZmlnLmFsaWduIH07Jz5cbiAgeyAjaWYgISRjb25maWcuaGVhZGxlc3MgfVxuICAgIDxkaXYgY2xhc3M9J3Jzc2JveC10aXRsZWJhcicgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfTsgYmFja2dyb3VuZC1jb2xvcjogeyAkY29uZmlnLnRpdGxlQmFyQ29sb3IgfTsgYm9yZGVyLWJvdHRvbS1jb2xvcjogeyAkY29uZmlnLmZyYW1lQ29sb3IgfTsnPlxuICAgICAgeyAjaWYgJGNvbmZpZy5zaG93WG1sQnV0dG9uIH1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWljb24nPlxuICAgICAgICAgIDxhIGhyZWY9J3sgJGNvbmZpZy51cmwgfScgdGl0bGU9J3sgJGZlZWQuZm9ybWF0IH0geyAkZmVlZC52ZXJzaW9uIH0nIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRpdGxlQmFyVGV4dENvbG9yIH0nPlxuICAgICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgPC9kaXY+XG4gICAgICB7IC9pZiB9XG4gICAgICA8ZGl2PlxuICAgICAgICA8YSBocmVmPSd7ICRmZWVkLmxpbmsgfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfTsnPlxuICAgICAgICAgIHsgJGZlZWQudGl0bGUgfVxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1kYXRlJz5cbiAgICAgICAgeyBmZWVkLmZvcm1hdERhdGUoJGZlZWQuZGF0ZSkgfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIHsgL2lmIH1cblxuICA8ZGl2IGNsYXNzPSdyc3Nib3gtY29udGVudCByc3NCb3hDb250ZW50JyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjogeyAkY29uZmlnLmJveEZpbGxDb2xvciB9OyBoZWlnaHQ6IHsgaGVpZ2h0IH07Jz5cbiAgICB7ICNpZiAkZmVlZC5pbWFnZSAmJiAhJGNvbmZpZy5jb21wYWN0IH1cbiAgICAgIHsgI2F3YWl0IGxvYWQoJGZlZWQuaW1hZ2UpIHRoZW4gaW1hZ2UgfVxuICAgICAgICA8YSBocmVmPSd7ICRmZWVkLmltYWdlLmxpbmsgfScgdGl0bGU9J3sgJGZlZWQuaW1hZ2UudGl0bGUgfSc+XG4gICAgICAgICAgPGRpdiBhbHQ9J3sgJGZlZWQuaW1hZ2UuZGVzY3JpcHRpb24gfScgY2xhc3M9J3Jzc2JveC1pbWFnZScgc3R5bGU9J2JhY2tncm91bmQtaW1hZ2U6IHVybCh7ICRmZWVkLmltYWdlLnNvdXJjZSB9KTsgd2lkdGg6IHsgaW1hZ2Uud2lkdGggfTsgaGVpZ2h0OiB7IGltYWdlLmhlaWdodCB9Oyc+PC9kaXY+XG4gICAgICAgIDwvYT5cbiAgICAgIHsgL2F3YWl0IH1cbiAgICB7IC9pZiB9XG5cbiAgICB7ICNlYWNoICRmZWVkLml0ZW1zIGFzIGl0ZW0sIGluZGV4IH1cbiAgICAgIHsgI2lmIGluZGV4IDwgJGNvbmZpZy5tYXhJdGVtcyB9XG4gICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLWNvbnRlbnQgcnNzQm94SXRlbUNvbnRlbnQnIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRleHRDb2xvciB9Jz5cbiAgICAgICAgICB7ICNpZiBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLXRpdGxlIHsgaXRlbVRpdGxlQ2xhc3MgfSc+XG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0ubGluayB9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0neyBpdGVtLmxpbmsgfSc+XG4gICAgICAgICAgICAgICAgICB7QGh0bWwgaXRlbS50aXRsZSB9XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICAgICAgICB7QGh0bWwgaXRlbS50aXRsZSB9XG4gICAgICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHsgL2lmIH1cblxuICAgICAgICAgIHsgI2lmICEkY29uZmlnLmNvbXBhY3QgfVxuICAgICAgICAgICAgPGFzaWRlPlxuICAgICAgICAgICAgICB7ICNpZiBpdGVtLnNvdXJjZSB9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0neyBpdGVtLnNvdXJjZS51cmwgfScgdGl0bGU9J3sgaXRlbS5zb3VyY2UudGl0bGUgfScgY2xhc3M9J3Jzc2JveC1zb3VyY2UnPlxuICAgICAgICAgICAgICAgICAgeyAjaWYgaXRlbS5zb3VyY2UudXJsLmVuZHNXaXRoKFwiLnhtbFwiKSB9XG4gICAgICAgICAgICAgICAgICAgIDxSc3NJY29uLz5cbiAgICAgICAgICAgICAgICAgIHsgOmVsc2UgfVxuICAgICAgICAgICAgICAgICAgICA8TGlua0ljb24vPlxuICAgICAgICAgICAgICAgICAgeyAvaWYgfVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgeyAvaWYgfVxuXG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0uZW5jbG9zdXJlcyB9XG4gICAgICAgICAgICAgICAgeyAjZWFjaCBpdGVtLmVuY2xvc3VyZXMgYXMgZW5jbG9zdXJlIH1cbiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9J3sgZW5jbG9zdXJlLnVybCB9JyB0aXRsZT0neyBrYihlbmNsb3N1cmUubGVuZ3RoKSB9IHsgZW5jbG9zdXJlLnR5cGUgfScgY2xhc3M9J3Jzc2JveC1lbmNsb3N1cmUnPlxuICAgICAgICAgICAgICAgICAgICA8UGFwZXJjbGlwSWNvbi8+XG4gICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgeyAvZWFjaCB9XG4gICAgICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgICAgIDwvYXNpZGU+XG4gICAgICAgICAgICB7QGh0bWwgaXRlbS5kZXNjcmlwdGlvbiB9XG4gICAgICAgICAgeyAvaWYgfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIHsgL2lmIH1cbiAgICB7IC9lYWNoIH1cblxuICAgIHsgI2lmICRmZWVkLmlucHV0IH1cbiAgICAgIDxmb3JtIGNsYXNzPSdyc3Nib3gtZm9ybScgbWV0aG9kPSdnZXQnIGFjdGlvbj0neyAkZmVlZC5pbnB1dC5saW5rIH0nPlxuICAgICAgICA8aW5wdXQgdHlwZT0ndGV4dCcgbmFtZT0neyAkZmVlZC5pbnB1dC5uYW1lIH0nIHBsYWNlaG9sZGVyPSdFbnRlciBzZWFyY2ggJmFtcDsgaGl0IHJldHVybuKApicgZGF0YS1wbGFjZWhvbGRlcj0neyAkZmVlZC5pbnB1dC5kZXNjcmlwdGlvbiB9Jz5cbiAgICAgIDwvZm9ybT5cbiAgICB7IC9pZiB9XG4gICAgPGRpdiBjbGFzcz0ncnNzYm94LXByb21vIHJzc0JveFByb21vJz5cbiAgICAgIDxhIGhyZWY9J3sgdXJscy5hcHAgfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGV4dENvbG9yIH0nPlJTUyBCb3ggYnkgcDNrLm9yZzwvYT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEyRUUsT0FBTyw4QkFBQyxDQUFDLEFBQ1AsVUFBVSxDQUFFLFVBQVUsQ0FDdEIsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3RCLFdBQVcsQ0FBRSxVQUFVLENBQ3ZCLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLGFBQWEsQ0FBRSxDQUFDLENBQ2hCLGtCQUFrQixDQUFFLENBQUMsQUFDdkIsQ0FBQyxBQUVELFlBQVksOEJBQUMsQ0FBQyxBQUNaLEtBQUssQ0FBRSxLQUFLLENBQ1osS0FBSyxDQUFFLEdBQUcsQ0FDVixXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsZ0JBQWdCLDhCQUFDLENBQUMsQUFDaEIsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsSUFBSSxDQUNYLGdCQUFnQixDQUFFLE9BQU8sQ0FDekIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUM3QixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFBTSxBQUN4QixDQUFDLEFBRUQsWUFBWSw4QkFBQyxDQUFDLEFBQ1osVUFBVSxDQUFFLEtBQUssQ0FDakIsU0FBUyxDQUFFLEtBQUssQ0FDaEIsV0FBVyxDQUFFLE1BQU0sQUFDckIsQ0FBQyxBQUVELGVBQWUsOEJBQUMsQ0FBQyxBQUNmLE1BQU0sQ0FBRSxJQUFJLENBQ1osT0FBTyxDQUFFLEtBQUssQ0FDZCxVQUFVLENBQUUsTUFBTSxDQUNsQixVQUFVLENBQUUsSUFBSSxDQUNoQixnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsa0JBQWtCLENBQUUsd0JBQXdCLEFBQzlDLENBQUMsQUFFRCw4QkFBZSxDQUFDLEtBQUssZUFBQyxDQUFDLEFBQ3JCLEtBQUssQ0FBRSxJQUFJLENBQ1gsS0FBSyxDQUFFLEtBQUssQUFDZCxDQUFDLEFBRUQsOEJBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFDLENBQUMsQUFDdkIsT0FBTyxDQUFFLEtBQUssQ0FDZCxXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsYUFBYSw4QkFBQyxDQUFDLEFBQ2IsS0FBSyxDQUFFLEtBQUssQ0FDWixNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUN2QixtQkFBbUIsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUNoQyxpQkFBaUIsQ0FBRSxTQUFTLENBQzVCLGVBQWUsQ0FBRSxPQUFPLEFBQzFCLENBQUMsQUFFRCxrQkFBa0IsS0FBSyw4QkFBQyxDQUFDLEFBQ3ZCLFdBQVcsQ0FBRSxJQUFJLEFBQ25CLENBQUMsQUFFRCwrQ0FBaUIsQ0FBRSxjQUFjLDhCQUFDLENBQUMsQUFDakMsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsR0FBRyxBQUNaLENBQUMsQUFFRCxZQUFZLDhCQUFDLENBQUMsQUFDWixhQUFhLENBQUUsS0FBSyxBQUN0QixDQUFDLEFBRUQsMkJBQVksQ0FBQyxLQUFLLGVBQUMsQ0FBQyxBQUNsQixPQUFPLENBQUUsS0FBSyxDQUNkLGdCQUFnQixDQUFFLElBQUksQUFDeEIsQ0FBQyxBQUVELGFBQWEsOEJBQUMsQ0FBQyxBQUNiLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLGNBQWMsQ0FBRSxNQUFNLEFBQ3hCLENBQUMifQ== */");
  }

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[7] = list[i];
  	child_ctx[9] = i;
  	return child_ctx;
  }

  function get_each_context_1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[10] = list[i];
  	return child_ctx;
  }

  // (161:2) { #if !$config.headless }
  function create_if_block_9(ctx) {
  	let div2;
  	let t0;
  	let div0;
  	let a;
  	let t1_value = /*$feed*/ ctx[6].title + "";
  	let t1;
  	let a_href_value;
  	let t2;
  	let div1;
  	let t3_value = /*feed*/ ctx[0].formatDate(/*$feed*/ ctx[6].date) + "";
  	let t3;
  	let current;
  	let if_block = /*$config*/ ctx[2].showXmlButton && create_if_block_10(ctx);

  	const block = {
  		c: function create() {
  			div2 = element("div");
  			if (if_block) if_block.c();
  			t0 = space();
  			div0 = element("div");
  			a = element("a");
  			t1 = text(t1_value);
  			t2 = space();
  			div1 = element("div");
  			t3 = text(t3_value);
  			attr_dev(a, "href", a_href_value = /*$feed*/ ctx[6].link);
  			set_style(a, "color", /*$config*/ ctx[2].titleBarTextColor);
  			add_location(a, file, 170, 8, 4048);
  			add_location(div0, file, 169, 6, 4034);
  			attr_dev(div1, "class", "rssbox-date svelte-1rjx8bp");
  			add_location(div1, file, 174, 6, 4178);
  			attr_dev(div2, "class", "rssbox-titlebar svelte-1rjx8bp");
  			set_style(div2, "color", /*$config*/ ctx[2].titleBarTextColor);
  			set_style(div2, "background-color", /*$config*/ ctx[2].titleBarColor);
  			set_style(div2, "border-bottom-color", /*$config*/ ctx[2].frameColor);
  			add_location(div2, file, 161, 4, 3600);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div2, anchor);
  			if (if_block) if_block.m(div2, null);
  			append_dev(div2, t0);
  			append_dev(div2, div0);
  			append_dev(div0, a);
  			append_dev(a, t1);
  			append_dev(div2, t2);
  			append_dev(div2, div1);
  			append_dev(div1, t3);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (/*$config*/ ctx[2].showXmlButton) {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty & /*$config*/ 4) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block_10(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(div2, t0);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}

  			if ((!current || dirty & /*$feed*/ 64) && t1_value !== (t1_value = /*$feed*/ ctx[6].title + "")) set_data_dev(t1, t1_value);

  			if (!current || dirty & /*$feed*/ 64 && a_href_value !== (a_href_value = /*$feed*/ ctx[6].link)) {
  				attr_dev(a, "href", a_href_value);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(a, "color", /*$config*/ ctx[2].titleBarTextColor);
  			}

  			if ((!current || dirty & /*feed, $feed*/ 65) && t3_value !== (t3_value = /*feed*/ ctx[0].formatDate(/*$feed*/ ctx[6].date) + "")) set_data_dev(t3, t3_value);

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "color", /*$config*/ ctx[2].titleBarTextColor);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "background-color", /*$config*/ ctx[2].titleBarColor);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "border-bottom-color", /*$config*/ ctx[2].frameColor);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div2);
  			if (if_block) if_block.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_9.name,
  		type: "if",
  		source: "(161:2) { #if !$config.headless }",
  		ctx
  	});

  	return block;
  }

  // (163:6) { #if $config.showXmlButton }
  function create_if_block_10(ctx) {
  	let div;
  	let a;
  	let rssicon;
  	let a_href_value;
  	let a_title_value;
  	let current;
  	rssicon = new RssIcon({ $$inline: true });

  	const block = {
  		c: function create() {
  			div = element("div");
  			a = element("a");
  			create_component(rssicon.$$.fragment);
  			attr_dev(a, "href", a_href_value = /*$config*/ ctx[2].url);
  			attr_dev(a, "title", a_title_value = "" + (/*$feed*/ ctx[6].format + " " + /*$feed*/ ctx[6].version));
  			set_style(a, "color", /*$config*/ ctx[2].titleBarTextColor);
  			add_location(a, file, 164, 10, 3846);
  			attr_dev(div, "class", "rssbox-icon svelte-1rjx8bp");
  			add_location(div, file, 163, 8, 3810);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, a);
  			mount_component(rssicon, a, null);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (!current || dirty & /*$config*/ 4 && a_href_value !== (a_href_value = /*$config*/ ctx[2].url)) {
  				attr_dev(a, "href", a_href_value);
  			}

  			if (!current || dirty & /*$feed*/ 64 && a_title_value !== (a_title_value = "" + (/*$feed*/ ctx[6].format + " " + /*$feed*/ ctx[6].version))) {
  				attr_dev(a, "title", a_title_value);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(a, "color", /*$config*/ ctx[2].titleBarTextColor);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(rssicon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(rssicon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			destroy_component(rssicon);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_10.name,
  		type: "if",
  		source: "(163:6) { #if $config.showXmlButton }",
  		ctx
  	});

  	return block;
  }

  // (182:4) { #if $feed.image && !$config.compact }
  function create_if_block_8(ctx) {
  	let await_block_anchor;
  	let promise;

  	let info = {
  		ctx,
  		current: null,
  		token: null,
  		hasCatch: false,
  		pending: create_pending_block,
  		then: create_then_block,
  		catch: create_catch_block,
  		value: 13
  	};

  	handle_promise(promise = load(/*$feed*/ ctx[6].image), info);

  	const block = {
  		c: function create() {
  			await_block_anchor = empty();
  			info.block.c();
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, await_block_anchor, anchor);
  			info.block.m(target, info.anchor = anchor);
  			info.mount = () => await_block_anchor.parentNode;
  			info.anchor = await_block_anchor;
  		},
  		p: function update(new_ctx, dirty) {
  			ctx = new_ctx;
  			info.ctx = ctx;

  			if (dirty & /*$feed*/ 64 && promise !== (promise = load(/*$feed*/ ctx[6].image)) && handle_promise(promise, info)) ; else {
  				update_await_block_branch(info, ctx, dirty);
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(await_block_anchor);
  			info.block.d(detaching);
  			info.token = null;
  			info = null;
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_8.name,
  		type: "if",
  		source: "(182:4) { #if $feed.image && !$config.compact }",
  		ctx
  	});

  	return block;
  }

  // (1:0) <script>   import { onMount }
  function create_catch_block(ctx) {
  	const block = { c: noop, m: noop, p: noop, d: noop };

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_catch_block.name,
  		type: "catch",
  		source: "(1:0) <script>   import { onMount }",
  		ctx
  	});

  	return block;
  }

  // (183:45)          <a href='{ $feed.image.link }
  function create_then_block(ctx) {
  	let a;
  	let div;
  	let div_alt_value;
  	let a_href_value;
  	let a_title_value;

  	const block = {
  		c: function create() {
  			a = element("a");
  			div = element("div");
  			attr_dev(div, "alt", div_alt_value = /*$feed*/ ctx[6].image.description);
  			attr_dev(div, "class", "rssbox-image svelte-1rjx8bp");
  			set_style(div, "background-image", "url(" + /*$feed*/ ctx[6].image.source + ")");
  			set_style(div, "width", /*image*/ ctx[13].width);
  			set_style(div, "height", /*image*/ ctx[13].height);
  			add_location(div, file, 184, 10, 4566);
  			attr_dev(a, "href", a_href_value = /*$feed*/ ctx[6].image.link);
  			attr_dev(a, "title", a_title_value = /*$feed*/ ctx[6].image.title);
  			attr_dev(a, "class", "svelte-1rjx8bp");
  			add_location(a, file, 183, 8, 4494);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, a, anchor);
  			append_dev(a, div);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*$feed*/ 64 && div_alt_value !== (div_alt_value = /*$feed*/ ctx[6].image.description)) {
  				attr_dev(div, "alt", div_alt_value);
  			}

  			if (dirty & /*$feed*/ 64) {
  				set_style(div, "background-image", "url(" + /*$feed*/ ctx[6].image.source + ")");
  			}

  			if (dirty & /*$feed*/ 64) {
  				set_style(div, "width", /*image*/ ctx[13].width);
  			}

  			if (dirty & /*$feed*/ 64) {
  				set_style(div, "height", /*image*/ ctx[13].height);
  			}

  			if (dirty & /*$feed*/ 64 && a_href_value !== (a_href_value = /*$feed*/ ctx[6].image.link)) {
  				attr_dev(a, "href", a_href_value);
  			}

  			if (dirty & /*$feed*/ 64 && a_title_value !== (a_title_value = /*$feed*/ ctx[6].image.title)) {
  				attr_dev(a, "title", a_title_value);
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(a);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_then_block.name,
  		type: "then",
  		source: "(183:45)          <a href='{ $feed.image.link }",
  		ctx
  	});

  	return block;
  }

  // (1:0) <script>   import { onMount }
  function create_pending_block(ctx) {
  	const block = { c: noop, m: noop, p: noop, d: noop };

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_pending_block.name,
  		type: "pending",
  		source: "(1:0) <script>   import { onMount }",
  		ctx
  	});

  	return block;
  }

  // (191:6) { #if index < $config.maxItems }
  function create_if_block_1(ctx) {
  	let div;
  	let t;
  	let current;
  	let if_block0 = /*item*/ ctx[7].title && create_if_block_6(ctx);
  	let if_block1 = !/*$config*/ ctx[2].compact && create_if_block_2(ctx);

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (if_block0) if_block0.c();
  			t = space();
  			if (if_block1) if_block1.c();
  			attr_dev(div, "class", "rssbox-item-content rssBoxItemContent");
  			set_style(div, "color", /*$config*/ ctx[2].textColor);
  			add_location(div, file, 191, 8, 4869);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			if (if_block0) if_block0.m(div, null);
  			append_dev(div, t);
  			if (if_block1) if_block1.m(div, null);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (/*item*/ ctx[7].title) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);
  				} else {
  					if_block0 = create_if_block_6(ctx);
  					if_block0.c();
  					if_block0.m(div, t);
  				}
  			} else if (if_block0) {
  				if_block0.d(1);
  				if_block0 = null;
  			}

  			if (!/*$config*/ ctx[2].compact) {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);

  					if (dirty & /*$config*/ 4) {
  						transition_in(if_block1, 1);
  					}
  				} else {
  					if_block1 = create_if_block_2(ctx);
  					if_block1.c();
  					transition_in(if_block1, 1);
  					if_block1.m(div, null);
  				}
  			} else if (if_block1) {
  				group_outros();

  				transition_out(if_block1, 1, 1, () => {
  					if_block1 = null;
  				});

  				check_outros();
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div, "color", /*$config*/ ctx[2].textColor);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block1);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block1);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1.name,
  		type: "if",
  		source: "(191:6) { #if index < $config.maxItems }",
  		ctx
  	});

  	return block;
  }

  // (193:10) { #if item.title }
  function create_if_block_6(ctx) {
  	let div;
  	let div_class_value;

  	function select_block_type(ctx, dirty) {
  		if (/*item*/ ctx[7].link) return create_if_block_7;
  		return create_else_block_1;
  	}

  	let current_block_type = select_block_type(ctx);
  	let if_block = current_block_type(ctx);

  	const block = {
  		c: function create() {
  			div = element("div");
  			if_block.c();
  			attr_dev(div, "class", div_class_value = "rssbox-item-title " + /*itemTitleClass*/ ctx[3] + " svelte-1rjx8bp");
  			add_location(div, file, 193, 12, 4999);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			if_block.m(div, null);
  		},
  		p: function update(ctx, dirty) {
  			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
  				if_block.p(ctx, dirty);
  			} else {
  				if_block.d(1);
  				if_block = current_block_type(ctx);

  				if (if_block) {
  					if_block.c();
  					if_block.m(div, null);
  				}
  			}

  			if (dirty & /*itemTitleClass*/ 8 && div_class_value !== (div_class_value = "rssbox-item-title " + /*itemTitleClass*/ ctx[3] + " svelte-1rjx8bp")) {
  				attr_dev(div, "class", div_class_value);
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if_block.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_6.name,
  		type: "if",
  		source: "(193:10) { #if item.title }",
  		ctx
  	});

  	return block;
  }

  // (199:14) { :else }
  function create_else_block_1(ctx) {
  	let html_tag;
  	let raw_value = /*item*/ ctx[7].title + "";
  	let html_anchor;

  	const block = {
  		c: function create() {
  			html_tag = new HtmlTag();
  			html_anchor = empty();
  			html_tag.a = html_anchor;
  		},
  		m: function mount(target, anchor) {
  			html_tag.m(raw_value, target, anchor);
  			insert_dev(target, html_anchor, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*$feed*/ 64 && raw_value !== (raw_value = /*item*/ ctx[7].title + "")) html_tag.p(raw_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(html_anchor);
  			if (detaching) html_tag.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block_1.name,
  		type: "else",
  		source: "(199:14) { :else }",
  		ctx
  	});

  	return block;
  }

  // (195:14) { #if item.link }
  function create_if_block_7(ctx) {
  	let a;
  	let raw_value = /*item*/ ctx[7].title + "";
  	let a_href_value;

  	const block = {
  		c: function create() {
  			a = element("a");
  			attr_dev(a, "href", a_href_value = /*item*/ ctx[7].link);
  			attr_dev(a, "class", "svelte-1rjx8bp");
  			add_location(a, file, 195, 16, 5098);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, a, anchor);
  			a.innerHTML = raw_value;
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*$feed*/ 64 && raw_value !== (raw_value = /*item*/ ctx[7].title + "")) a.innerHTML = raw_value;
  			if (dirty & /*$feed*/ 64 && a_href_value !== (a_href_value = /*item*/ ctx[7].link)) {
  				attr_dev(a, "href", a_href_value);
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(a);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_7.name,
  		type: "if",
  		source: "(195:14) { #if item.link }",
  		ctx
  	});

  	return block;
  }

  // (205:10) { #if !$config.compact }
  function create_if_block_2(ctx) {
  	let aside;
  	let t0;
  	let t1;
  	let html_tag;
  	let raw_value = /*item*/ ctx[7].description + "";
  	let html_anchor;
  	let current;
  	let if_block0 = /*item*/ ctx[7].source && create_if_block_4(ctx);
  	let if_block1 = /*item*/ ctx[7].enclosures && create_if_block_3(ctx);

  	const block = {
  		c: function create() {
  			aside = element("aside");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			if (if_block1) if_block1.c();
  			t1 = space();
  			html_tag = new HtmlTag();
  			html_anchor = empty();
  			attr_dev(aside, "class", "svelte-1rjx8bp");
  			add_location(aside, file, 205, 12, 5349);
  			html_tag.a = html_anchor;
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, aside, anchor);
  			if (if_block0) if_block0.m(aside, null);
  			append_dev(aside, t0);
  			if (if_block1) if_block1.m(aside, null);
  			insert_dev(target, t1, anchor);
  			html_tag.m(raw_value, target, anchor);
  			insert_dev(target, html_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (/*item*/ ctx[7].source) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);

  					if (dirty & /*$feed*/ 64) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_4(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(aside, t0);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (/*item*/ ctx[7].enclosures) {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);

  					if (dirty & /*$feed*/ 64) {
  						transition_in(if_block1, 1);
  					}
  				} else {
  					if_block1 = create_if_block_3(ctx);
  					if_block1.c();
  					transition_in(if_block1, 1);
  					if_block1.m(aside, null);
  				}
  			} else if (if_block1) {
  				group_outros();

  				transition_out(if_block1, 1, 1, () => {
  					if_block1 = null;
  				});

  				check_outros();
  			}

  			if ((!current || dirty & /*$feed*/ 64) && raw_value !== (raw_value = /*item*/ ctx[7].description + "")) html_tag.p(raw_value);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block0);
  			transition_in(if_block1);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block0);
  			transition_out(if_block1);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(aside);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			if (detaching) detach_dev(t1);
  			if (detaching) detach_dev(html_anchor);
  			if (detaching) html_tag.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2.name,
  		type: "if",
  		source: "(205:10) { #if !$config.compact }",
  		ctx
  	});

  	return block;
  }

  // (207:14) { #if item.source }
  function create_if_block_4(ctx) {
  	let a;
  	let show_if;
  	let current_block_type_index;
  	let if_block;
  	let a_href_value;
  	let a_title_value;
  	let current;
  	const if_block_creators = [create_if_block_5, create_else_block];
  	const if_blocks = [];

  	function select_block_type_1(ctx, dirty) {
  		if (dirty & /*$feed*/ 64) show_if = !!/*item*/ ctx[7].source.url.endsWith(".xml");
  		if (show_if) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type_1(ctx, -1);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			a = element("a");
  			if_block.c();
  			attr_dev(a, "href", a_href_value = /*item*/ ctx[7].source.url);
  			attr_dev(a, "title", a_title_value = /*item*/ ctx[7].source.title);
  			attr_dev(a, "class", "rssbox-source svelte-1rjx8bp");
  			add_location(a, file, 207, 16, 5407);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, a, anchor);
  			if_blocks[current_block_type_index].m(a, null);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type_1(ctx, dirty);

  			if (current_block_type_index !== previous_block_index) {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				}

  				transition_in(if_block, 1);
  				if_block.m(a, null);
  			}

  			if (!current || dirty & /*$feed*/ 64 && a_href_value !== (a_href_value = /*item*/ ctx[7].source.url)) {
  				attr_dev(a, "href", a_href_value);
  			}

  			if (!current || dirty & /*$feed*/ 64 && a_title_value !== (a_title_value = /*item*/ ctx[7].source.title)) {
  				attr_dev(a, "title", a_title_value);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(a);
  			if_blocks[current_block_type_index].d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_4.name,
  		type: "if",
  		source: "(207:14) { #if item.source }",
  		ctx
  	});

  	return block;
  }

  // (211:18) { :else }
  function create_else_block(ctx) {
  	let linkicon;
  	let current;
  	linkicon = new LinkIcon({ $$inline: true });

  	const block = {
  		c: function create() {
  			create_component(linkicon.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(linkicon, target, anchor);
  			current = true;
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(linkicon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(linkicon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(linkicon, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block.name,
  		type: "else",
  		source: "(211:18) { :else }",
  		ctx
  	});

  	return block;
  }

  // (209:18) { #if item.source.url.endsWith(".xml") }
  function create_if_block_5(ctx) {
  	let rssicon;
  	let current;
  	rssicon = new RssIcon({ $$inline: true });

  	const block = {
  		c: function create() {
  			create_component(rssicon.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(rssicon, target, anchor);
  			current = true;
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(rssicon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(rssicon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(rssicon, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_5.name,
  		type: "if",
  		source: "(209:18) { #if item.source.url.endsWith(\\\".xml\\\") }",
  		ctx
  	});

  	return block;
  }

  // (217:14) { #if item.enclosures }
  function create_if_block_3(ctx) {
  	let each_1_anchor;
  	let current;
  	let each_value_1 = /*item*/ ctx[7].enclosures;
  	validate_each_argument(each_value_1);
  	let each_blocks = [];

  	for (let i = 0; i < each_value_1.length; i += 1) {
  		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	const block = {
  		c: function create() {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			each_1_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(target, anchor);
  			}

  			insert_dev(target, each_1_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*$feed, kb*/ 64) {
  				each_value_1 = /*item*/ ctx[7].enclosures;
  				validate_each_argument(each_value_1);
  				let i;

  				for (i = 0; i < each_value_1.length; i += 1) {
  					const child_ctx = get_each_context_1(ctx, each_value_1, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block_1(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
  					}
  				}

  				group_outros();

  				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;

  			for (let i = 0; i < each_value_1.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_each(each_blocks, detaching);
  			if (detaching) detach_dev(each_1_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_3.name,
  		type: "if",
  		source: "(217:14) { #if item.enclosures }",
  		ctx
  	});

  	return block;
  }

  // (218:16) { #each item.enclosures as enclosure }
  function create_each_block_1(ctx) {
  	let a;
  	let paperclipicon;
  	let t;
  	let a_href_value;
  	let a_title_value;
  	let current;
  	paperclipicon = new PaperclipIcon({ $$inline: true });

  	const block = {
  		c: function create() {
  			a = element("a");
  			create_component(paperclipicon.$$.fragment);
  			t = space();
  			attr_dev(a, "href", a_href_value = /*enclosure*/ ctx[10].url);
  			attr_dev(a, "title", a_title_value = "" + (kb(/*enclosure*/ ctx[10].length) + " " + /*enclosure*/ ctx[10].type));
  			attr_dev(a, "class", "rssbox-enclosure svelte-1rjx8bp");
  			add_location(a, file, 218, 18, 5821);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, a, anchor);
  			mount_component(paperclipicon, a, null);
  			append_dev(a, t);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (!current || dirty & /*$feed*/ 64 && a_href_value !== (a_href_value = /*enclosure*/ ctx[10].url)) {
  				attr_dev(a, "href", a_href_value);
  			}

  			if (!current || dirty & /*$feed*/ 64 && a_title_value !== (a_title_value = "" + (kb(/*enclosure*/ ctx[10].length) + " " + /*enclosure*/ ctx[10].type))) {
  				attr_dev(a, "title", a_title_value);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(paperclipicon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(paperclipicon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(a);
  			destroy_component(paperclipicon);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block_1.name,
  		type: "each",
  		source: "(218:16) { #each item.enclosures as enclosure }",
  		ctx
  	});

  	return block;
  }

  // (190:4) { #each $feed.items as item, index }
  function create_each_block(ctx) {
  	let if_block_anchor;
  	let current;
  	let if_block = /*index*/ ctx[9] < /*$config*/ ctx[2].maxItems && create_if_block_1(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (/*index*/ ctx[9] < /*$config*/ ctx[2].maxItems) {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty & /*$config*/ 4) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block_1(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block.name,
  		type: "each",
  		source: "(190:4) { #each $feed.items as item, index }",
  		ctx
  	});

  	return block;
  }

  // (231:4) { #if $feed.input }
  function create_if_block(ctx) {
  	let form;
  	let input;
  	let input_name_value;
  	let input_data_placeholder_value;
  	let form_action_value;

  	const block = {
  		c: function create() {
  			form = element("form");
  			input = element("input");
  			attr_dev(input, "type", "text");
  			attr_dev(input, "name", input_name_value = /*$feed*/ ctx[6].input.name);
  			attr_dev(input, "placeholder", "Enter search & hit return…");
  			attr_dev(input, "data-placeholder", input_data_placeholder_value = /*$feed*/ ctx[6].input.description);
  			attr_dev(input, "class", "svelte-1rjx8bp");
  			add_location(input, file, 232, 8, 6264);
  			attr_dev(form, "class", "rssbox-form svelte-1rjx8bp");
  			attr_dev(form, "method", "get");
  			attr_dev(form, "action", form_action_value = /*$feed*/ ctx[6].input.link);
  			add_location(form, file, 231, 6, 6186);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, form, anchor);
  			append_dev(form, input);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*$feed*/ 64 && input_name_value !== (input_name_value = /*$feed*/ ctx[6].input.name)) {
  				attr_dev(input, "name", input_name_value);
  			}

  			if (dirty & /*$feed*/ 64 && input_data_placeholder_value !== (input_data_placeholder_value = /*$feed*/ ctx[6].input.description)) {
  				attr_dev(input, "data-placeholder", input_data_placeholder_value);
  			}

  			if (dirty & /*$feed*/ 64 && form_action_value !== (form_action_value = /*$feed*/ ctx[6].input.link)) {
  				attr_dev(form, "action", form_action_value);
  			}
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(form);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block.name,
  		type: "if",
  		source: "(231:4) { #if $feed.input }",
  		ctx
  	});

  	return block;
  }

  function create_fragment(ctx) {
  	let div2;
  	let t0;
  	let div1;
  	let t1;
  	let t2;
  	let t3;
  	let div0;
  	let a;
  	let t4;
  	let div2_data_link_color_value;
  	let current;
  	let if_block0 = !/*$config*/ ctx[2].headless && create_if_block_9(ctx);
  	let if_block1 = /*$feed*/ ctx[6].image && !/*$config*/ ctx[2].compact && create_if_block_8(ctx);
  	let each_value = /*$feed*/ ctx[6].items;
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	let if_block2 = /*$feed*/ ctx[6].input && create_if_block(ctx);

  	const block = {
  		c: function create() {
  			div2 = element("div");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			div1 = element("div");
  			if (if_block1) if_block1.c();
  			t1 = space();

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			t2 = space();
  			if (if_block2) if_block2.c();
  			t3 = space();
  			div0 = element("div");
  			a = element("a");
  			t4 = text("RSS Box by p3k.org");
  			attr_dev(a, "href", urls.app);
  			set_style(a, "color", /*$config*/ ctx[2].textColor);
  			attr_dev(a, "class", "svelte-1rjx8bp");
  			add_location(a, file, 236, 6, 6479);
  			attr_dev(div0, "class", "rssbox-promo rssBoxPromo svelte-1rjx8bp");
  			add_location(div0, file, 235, 4, 6434);
  			attr_dev(div1, "class", "rssbox-content rssBoxContent svelte-1rjx8bp");
  			set_style(div1, "background-color", /*$config*/ ctx[2].boxFillColor);
  			set_style(div1, "height", /*height*/ ctx[5]);
  			add_location(div1, file, 180, 2, 4281);
  			attr_dev(div2, "data-link-color", div2_data_link_color_value = /*$config*/ ctx[2].linkColor);
  			attr_dev(div2, "class", "rssbox rssBox svelte-1rjx8bp");
  			set_style(div2, "max-width", /*width*/ ctx[4]);
  			set_style(div2, "border-color", /*$config*/ ctx[2].frameColor);
  			set_style(div2, "border-radius", /*$config*/ ctx[2].radius + "px");
  			set_style(div2, "font", /*$config*/ ctx[2].fontFace);
  			set_style(div2, "float", /*$config*/ ctx[2].align);
  			add_location(div2, file, 159, 0, 3341);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div2, anchor);
  			if (if_block0) if_block0.m(div2, null);
  			append_dev(div2, t0);
  			append_dev(div2, div1);
  			if (if_block1) if_block1.m(div1, null);
  			append_dev(div1, t1);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div1, null);
  			}

  			append_dev(div1, t2);
  			if (if_block2) if_block2.m(div1, null);
  			append_dev(div1, t3);
  			append_dev(div1, div0);
  			append_dev(div0, a);
  			append_dev(a, t4);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (!/*$config*/ ctx[2].headless) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);

  					if (dirty & /*$config*/ 4) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_9(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(div2, t0);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (/*$feed*/ ctx[6].image && !/*$config*/ ctx[2].compact) {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);
  				} else {
  					if_block1 = create_if_block_8(ctx);
  					if_block1.c();
  					if_block1.m(div1, t1);
  				}
  			} else if (if_block1) {
  				if_block1.d(1);
  				if_block1 = null;
  			}

  			if (dirty & /*$config, $feed, kb, itemTitleClass*/ 76) {
  				each_value = /*$feed*/ ctx[6].items;
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(div1, t2);
  					}
  				}

  				group_outros();

  				for (i = each_value.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}

  			if (/*$feed*/ ctx[6].input) {
  				if (if_block2) {
  					if_block2.p(ctx, dirty);
  				} else {
  					if_block2 = create_if_block(ctx);
  					if_block2.c();
  					if_block2.m(div1, t3);
  				}
  			} else if (if_block2) {
  				if_block2.d(1);
  				if_block2 = null;
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(a, "color", /*$config*/ ctx[2].textColor);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div1, "background-color", /*$config*/ ctx[2].boxFillColor);
  			}

  			if (!current || dirty & /*height*/ 32) {
  				set_style(div1, "height", /*height*/ ctx[5]);
  			}

  			if (!current || dirty & /*$config*/ 4 && div2_data_link_color_value !== (div2_data_link_color_value = /*$config*/ ctx[2].linkColor)) {
  				attr_dev(div2, "data-link-color", div2_data_link_color_value);
  			}

  			if (!current || dirty & /*width*/ 16) {
  				set_style(div2, "max-width", /*width*/ ctx[4]);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "border-color", /*$config*/ ctx[2].frameColor);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "border-radius", /*$config*/ ctx[2].radius + "px");
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "font", /*$config*/ ctx[2].fontFace);
  			}

  			if (!current || dirty & /*$config*/ 4) {
  				set_style(div2, "float", /*$config*/ ctx[2].align);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block0);

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block0);
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div2);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			destroy_each(each_blocks, detaching);
  			if (if_block2) if_block2.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function kb(bytes) {
  	return (bytes / 1000).toFixed(2) + "\u200akB";
  }

  function load(data) {
  	return new Promise(fulfill => {
  			const image = new Image();

  			image.onload = () => {
  				const maxWidth = Math.min(100, image.width);
  				const factor = image.width > maxWidth ? maxWidth / image.width : 1;

  				fulfill({
  					width: image.width * factor + "px",
  					height: image.height * factor + "px"
  				});
  			};

  			image.src = data.source;
  		});
  }

  function instance($$self, $$props, $$invalidate) {
  	let height;
  	let width;
  	let itemTitleClass;

  	let $config,
  		$$unsubscribe_config = noop,
  		$$subscribe_config = () => ($$unsubscribe_config(), $$unsubscribe_config = subscribe(config, $$value => $$invalidate(2, $config = $$value)), config);

  	let $feed,
  		$$unsubscribe_feed = noop,
  		$$subscribe_feed = () => ($$unsubscribe_feed(), $$unsubscribe_feed = subscribe(feed, $$value => $$invalidate(6, $feed = $$value)), feed);

  	$$self.$$.on_destroy.push(() => $$unsubscribe_config());
  	$$self.$$.on_destroy.push(() => $$unsubscribe_feed());
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Box', slots, []);
  	let { feed } = $$props;
  	validate_store(feed, 'feed');
  	$$subscribe_feed();
  	let { config } = $$props;
  	validate_store(config, 'config');
  	$$subscribe_config();

  	onMount(() => {
  		const staticId = "rssbox-static-stylesheet";
  		const dynamicId = "rssbox-dynamic-stylesheet";
  		let staticCss = window[staticId];
  		let dynamicCss = window[dynamicId];

  		if (!staticCss) {
  			staticCss = document.createElement("link");
  			staticCss.id = staticId;
  			staticCss.rel = "stylesheet";
  			staticCss.href = urls.app + "/box.css";
  			document.head.appendChild(staticCss);
  		}

  		if (!dynamicCss) {
  			dynamicCss = document.createElement("style");
  			dynamicCss.id = dynamicId;
  			document.head.appendChild(dynamicCss);
  		}

  		config.subscribe(state => {
  			const color = state.linkColor;
  			if (!color) return;

  			let rule = `.rssbox[data-link-color="${color}"] a {
          color: ${color};
        }`;

  			if (dynamicCss.innerHTML.indexOf(rule) < 0) dynamicCss.innerHTML += rule;
  		});
  	});

  	const writable_props = ['feed', 'config'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Box> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('feed' in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
  		if ('config' in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		urls,
  		LinkIcon,
  		RssIcon,
  		PaperclipIcon,
  		feed,
  		config,
  		kb,
  		load,
  		$config,
  		itemTitleClass,
  		width,
  		height,
  		$feed
  	});

  	$$self.$inject_state = $$props => {
  		if ('feed' in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
  		if ('config' in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
  		if ('itemTitleClass' in $$props) $$invalidate(3, itemTitleClass = $$props.itemTitleClass);
  		if ('width' in $$props) $$invalidate(4, width = $$props.width);
  		if ('height' in $$props) $$invalidate(5, height = $$props.height);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*$config*/ 4) {
  			$$invalidate(5, height = $config.height && $config.height > -1
  			? $config.height + "px"
  			: "100%");
  		}

  		if ($$self.$$.dirty & /*$config*/ 4) {
  			$$invalidate(4, width = $config.width ? $config.width + "px" : "100%");
  		}

  		if ($$self.$$.dirty & /*$config*/ 4) {
  			$$invalidate(3, itemTitleClass = !$config.compact ? "bold" : "");
  		}
  	};

  	return [feed, config, $config, itemTitleClass, width, height, $feed];
  }

  class Box extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance, create_fragment, safe_not_equal, { feed: 0, config: 1 }, add_css);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Box",
  			options,
  			id: create_fragment.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*feed*/ ctx[0] === undefined && !('feed' in props)) {
  			console.warn("<Box> was created without expected prop 'feed'");
  		}

  		if (/*config*/ ctx[1] === undefined && !('config' in props)) {
  			console.warn("<Box> was created without expected prop 'config'");
  		}
  	}

  	get feed() {
  		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set feed(value) {
  		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get config() {
  		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set config(value) {
  		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  // These are backwards-compatible settings
  const defaults = {
    align: "initial",
    boxFillColor: "#fff",
    compact: false,
    fontFace: "inherit",
    frameColor: "#000",
    headless: false,
    height: "",
    linkColor: "",
    maxItems: 7,
    radius: 0,
    showXmlButton: false,
    textColor: "#000",
    titleBarColor: "#add8e6",
    titleBarTextColor: "#000",
    width: "200"
  };

  const keys = [...Object.keys(defaults), "url"];

  ready(() => {
    const reduce = getNativeObject("Array").prototype.reduce;

    const getNativeValue = value => {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    };

    const parseQuery = query => {
      const parts = query.split("&");
      return reduce.call(
        parts,
        (data, pair) => {
          const [key, value] = pair.split("=");
          if (keys.indexOf(key) > -1) {
            data[key] = getNativeValue(decodeURIComponent(value));
          }
          return data;
        },
        {}
      );
    };

    // Earlier versions used protocol-less URLs like `//p3k.org/rss`
    const search = urls.app.replace(/^https?:/, "");
    const scripts = Array.apply(null, document.querySelectorAll("script[src*=\"" + search + "\"]"));
    const feedUrls = [];

    scripts.forEach(script => {
      const query = script.src.split("?")[1];

      if (!query) return;

      let data = parseQuery(query);

      if (!data.url) data.url = urls.feed;

      data = Object.assign({}, defaults, data);

      // Create new stores for each box to prevent multiple boxes getting the same data
      const feed = FeedStore();
      const config = ConfigStore();

      config.set(data);
      feed.fetch(data.url, feed);

      const parent = script.parentNode;
      const container = document.createElement("div");

      parent.insertBefore(container, script);

      void new Box({
        target: container,
        props: { feed, config }
      });

      // Only for IE11
      script.parentNode.removeChild(script);

      if (data.url !== urls.feed && feedUrls.indexOf(data.url) < 0) {
        feedUrls.push(data.url);
      }
    });

    if (location.href.indexOf(urls.app) < 0) {
      const metadata = JSON.stringify({ feedUrls });
      fetch(urls.referrers + "&url=" + encodeURIComponent(location.href) + "&metadata=" + encodeURIComponent(metadata));
    }
  });

})();
//# sourceMappingURL=box.js.map
