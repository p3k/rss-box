(function () {
    'use strict';

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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    const app = readable({ description, version });
    const config = ConfigStore();
    const feed = FeedStore();
    const referrers = writable([]);

    referrers.fetch = fetchReferrers.bind(referrers);

    // For debugging
    //window.stores = { app, config, feed, referrers };

    /* src/components/Changes.html generated by Svelte v3.40.0 */

    const file$a = "src/components/Changes.html";

    function add_css$9(target) {
    	append_styles(target, "svelte-y33bja", "h3.svelte-y33bja.svelte-y33bja{display:inline-block}summary.svelte-y33bja+.svelte-y33bja{margin-top:0}summary.svelte-y33bja.svelte-y33bja{outline:none}li.svelte-y33bja+li.svelte-y33bja{margin-top:0.5em}small.svelte-y33bja.svelte-y33bja{display:inline-block;margin-right:0.5em;color:#bbb}code.svelte-y33bja.svelte-y33bja{background-color:#ffc;font-size:0.8em;font-weight:200}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhbmdlcy5odG1sIiwic291cmNlcyI6WyJDaGFuZ2VzLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBoMyB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgc3VtbWFyeSArICoge1xuICAgIG1hcmdpbi10b3A6IDA7XG4gIH1cblxuICBzdW1tYXJ5IHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG5cbiAgbGkgKyBsaSB7XG4gICAgbWFyZ2luLXRvcDogMC41ZW07XG4gIH1cblxuICBzbWFsbCB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgIG1hcmdpbi1yaWdodDogMC41ZW07XG4gICAgY29sb3I6ICNiYmI7XG4gIH1cblxuICBjb2RlIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZjO1xuICAgIGZvbnQtc2l6ZTogMC44ZW07XG4gICAgZm9udC13ZWlnaHQ6IDIwMDtcbiAgfVxuPC9zdHlsZT5cblxuPGRldGFpbHM+XG4gIDxzdW1tYXJ5PlxuICAgIDxoMz5DaGFuZ2UgTG9nPC9oMz5cbiAgPC9zdW1tYXJ5PlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDIzLTA3LTIyPC9zbWFsbD5cbiAgICBSZXBsYWNlZCBZYXJuIHdpdGggTlBNLCB1cGRhdGVkIGFsbCBkZXBlbmRlbmNpZXMgYW5kIG1hZGUgc3VyZSwgSFRNTCB2aWRlb3MgYXJlIG5pY2VseSBkaXNwbGF5ZWQgaW4gdGhlIFJTUyBib3guXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAyMS0xMi0xMTwvc21hbGw+XG4gICAgRGVwZW5kZW5jeSB1cGRhdGVzIGFuZCBjb3NtZXRpY3MuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAyMS0wNS0xNjwvc21hbGw+XG4gICAgSnVzdCBzb21lIG1pbm9yIGRlcGVuZGVuY3kgdXBkYXRlcyBhbmQgYTExeSBmaXhlcy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDIwLTExLTIwPC9zbWFsbD5cbiAgICBCZWNhdXNlIDxhIGhyZWY9XCJodHRwczovL2Nsb3VkLmdvb2dsZS5jb20vYXBwZW5naW5lL1wiPkJpZyBHIGlzIG1vbmV0aXppbmc8L2E+IChpZiBub3QgZnVsbHkgYWJhbmRvbmluZykgb25lIHByb2plY3Qgc2VydmluZyB0aGUgY29tbW9uIGdvb2QgYWZ0ZXIgYW5vdGhlciwgSSByZXdyb3RlIHRoZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3Azay9qc29uM2tcIj5KU09OUCBzZXJ2aWNlcyBmb3IgbW9kX3dzZ2k8L2E+IHRvIHJ1biBvbiBteSBvd24gc2VydmVyIGZyb20gbm93IG9uLiBOb3QgbXVjaCBuZXdzIG9uIHRoZSBmcm9udC1lbmQgc2lkZSwganVzdCB0aGUgdXN1YWwgZGVwZW5kZW5jeSB1cGdyYWRlIGFuZCBzb21lIG1pbm9yIGZpeGVzLiBJIGhvcGUgZXZlcnl0aGluZyB3b3JrcyBhcyBpdCBzaG91bGQgYmUgYW5kIHdpc2ggZXZlcnlvbmUgYWxsIHRoZSBiZXN0LCBlc3BlY2lhbGx5IHRvIHRob3NlIHdobyBuZWVkIGl0IG1vc3QgaW4gdGhlc2UgcGFuZGVtaWMgdGltZXMuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAyMC0wMS0wNjwvc21hbGw+XG4gICAgTm90IHN1cmUgaG93IGl0IHJlYWxseSBoYXBwZW5lZCBidXQgSSBnb3QgcHJldHR5IG11Y2ggaW1tZXJzZWQgaW50byB3b3JraW5nIG9uIHRoaXMgcHJvamVjdCBkdXJpbmcgdGhlIGhvbGlkYXkgc2Vhc29u4oCmIFNvIG5vdyB3ZSBnb3Q6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5CZXR0ZXIgY2FjaGluZyBzdXBwb3J0IGZvciBmZWVkcyBhbmQgcmVmZXJyZXJzPC9saT5cbiAgICA8bGk+UlNTIGljb24gbmV4dCB0byByZWZlcnJlciBkaXJlY3RseSBsaW5raW5nIGl0cyBmZWVkIFVSTCAoaWYgYXZhaWxhYmxlKSB0byB0aGlzIGFwcDwvbGk+XG4gICAgPGxpPlVwZ3JhZGUgdG8gU3ZlbHRlIDMgKHdoaWNoIHdhcyByYXRoZXIgdGVkaW91cykg8J+YsDwvbGk+XG4gICAgPGxpPlJlLWVzdGFibGlzaGVkIHN1cHBvcnQgZm9yIG9sZGVyIGJyb3dzZXJzIChsb29raW5nIGF0IHlvdSwgSW50ZXJuZXQgRXhwbG9yZXIgMTEpIPCfkbQ8L2xpPlxuICAgIDxsaT5NdWx0aXBsZSBzbWFsbCBmaXhlcyBhbmQgaW1wcm92ZW1lbnRzLCB0YWtlIGEgbG9vayBhdCB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3Azay9yc3MtYm94L2NvbW1pdHMvbWFzdGVyJz5jb21taXQgbG9nPC9hPiBmb3IgZGV0YWlsczwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTktMTItMTU8L3NtYWxsPlxuICAgIFVwZ3JhZGVkIHRoZSBKU09OUCBwcm94eSB0byBQeXRob24gMy43IGFuZCBzbGlnaHRseSByZXRvdWNoZWQgdGhlIGNvbmZpZ3VyYXRpb24gZm9ybS4gQSBtZXJyeSBlbmRpbmcgZm9yIDIwMTkgYW5kIGEgaGFwcHkgbmV3IHllYXIg8J+OiSA8ZW0+SXTigJlzIGhpbmRzaWdodCE8ZW0+XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxOC0wMS0xOTwvc21hbGw+XG4gICAgTW9yZSB0aGFuIDE1IHllYXJzIChhbmQgc3RpbGwgY291bnRpbmfigKYpIGFmdGVyIGl0cyBpbmNlcHRpb24gdGhpcyBsaXR0bGUgc2VydmljZSBpcyBzdGlsbCBsaXZlIGFuZCBraWNraW5nISBUaGUgYmVzdCBwYXJ0IG9mIHRoaXMgaG9iYnkgcHJvamVjdOKAmXMgbG9uZy1ydW5uaW5nIHRyYWl0OiB0aGlzIHllYXIgYnJpbmdzIGEgY29tcGxldGUgcmV3cml0ZSBhbmQgb3ZlcmhhdWwgd2l0aCBhbiBleHRlbnNpdmUgbGlzdCBvZiB1cGRhdGVzIOKAkyBhbmQgb25seSBzbWFsbCBjaGFuZ2VzIGluIGZ1bmN0aW9uYWxpdHk6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5BZGRlZCBiYXNpYyBzdXBwb3J0IGZvciBBdG9tIDEuMCBmZWVkcyDwn5SlPC9saT5cbiAgICA8bGk+QWRkZWQgc3VwcG9ydCBmb3IgbXVsdGlwbGUgZW5jbG9zdXJlcyAoUlNTIDAuOTMpPC9saT5cbiAgICA8bGk+UmVwbGFjZWQgdmFsdWUgb2YgLTEgZm9yIGF1dG9tYXRpYyBjb250ZW50IGhlaWdodCB3aXRoIOKAnGVtcHR54oCdIHZhbHVlPC9saT5cbiAgICA8bGk+QWRkZWQgc3VwcG9ydCBmb3Ig4oCcZW1wdHnigJ0gdmFsdWUgdG8gYm94IHdpZHRoIChub3cgY2FsbGVkIOKAnW1heC4gd2lkdGjigJ0pPC9saT5cbiAgICA8bGk+UmVkdWNlZCB0b3RhbCBzaXplIG9mIGVtYmVkZGVkIGRvd25sb2FkIGJ5IG1vcmUgdGhhbiA2MCUg4pqhPC9saT5cbiAgICA8bGk+SW5jcmVhc2VkIHBlcmZvcm1hbmNlIG9mIGxvYWRpbmcgYW5kIHJlbmRlcmluZyBib3hlczwvbGk+XG4gICAgPGxpPkltcGxlbWVudGVkIHJlc3BvbnNpdmUgQ1NTIGZvciBib3RoLCBib3hlcyBhbmQgY29uZmlndXJhdGlvbiBhcHA8L2xpPlxuICAgIDxsaT5SZXBsYWNlZCBiaXRtYXAgaWNvbnMgd2l0aCBzY2FsYWJsZSB2ZWN0b3IgZ3JhcGhpY3M8L2xpPlxuICAgIDxsaT5Db21wbGV0ZWx5IHJld3JvdGUgdGhlIGFwcCBjb2RlIHVzaW5nIDxhIGhyZWY9J2h0dHBzOi8vc3ZlbHRlLnRlY2hub2xvZ3knPlN2ZWx0ZTwvYT4gYW5kIDxhIGhyZWY9J2h0dHBzOi8vbWluY3NzLmNvbS8nPm1pbi5jc3M8L2E+PC9saT5cbiAgICA8bGk+UmVwbGFjZWQgcmVtYWluaW5nIGpRdWVyeSBjb2RlIHdpdGggdmFuaWxsYSBKYXZhU2NyaXB0PC9saT5cbiAgICA8bGk+TWlncmF0ZWQgYnVpbGQgc2NyaXB0cyB0byBSb2xsdXAgYW5kIFlhcm48L2xpPlxuICAgIDxsaT5BZGRlZCBzdXBwb3J0IGZvciBtaXNzaW5nIGJyb3dzZXIgZmVhdHVyZXMgdmlhIDxhIGhyZWY9J2h0dHBzOi8vcG9seWZpbGxzLmlvJz5wb2x5ZmlsbHMuaW88L2E+PC9saT5cbiAgICA8bGk+RGlzY29udGludWVkIHN1cHBvcnQgZm9yIG9sZGVyIGJyb3dzZXJzIChNU0lFICZsdDsgMTEpPC9saT5cbiAgICA8bGk+QnVtcGVkIG1ham9yIHZlcnNpb24gdG8gMTggKGFrYSB0aGUgeWVhciksIGdldHRpbmcgcmlkIG9mIHNlbWFudGljIHZlcnNpb25pbmcgZHVlIHRvIGxhY2sgb2Ygc2VtYW50aWNzIPCfkLE8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDE2LTAzLTEyPC9zbWFsbD5cbiAgICBDb21wbGV0ZWx5IHJld3JvdGUgYnVpbGQgZW52aXJvbm1lbnQgdXNpbmcgV2ViUGFjay4gU3dpdGNoZWQgdGhlIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9wM2svcnNzLWJveCc+c291cmNlIHJlcG9zaXRvcnk8L2E+IGZyb20gU1ZOIHRvIEdpdCwgaG9zdGVkIGF0IEdpdGh1Yi4gVGhpcyBkZXNlcnZlcyBhIG5ldyBtYWpvciB2ZXJzaW9uIG51bWJlciFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTEyLTMwPC9zbWFsbD5cbiAgICBBZGRlZCBzaW1wbGUgY29kZSB0byBtb2RpZnkgdGhlIHdpZHRoIGF0dHJpYnV0ZSBvZiBpZnJhbWUsIG9iamVjdCBhbmQgZW1iZWQgZWxlbWVudHMgdG8gbWFrZSB0aGVtIGZpdCBpbiB0aGUgYm94LiBBbHNvOiBidW1wZWQgdmVyc2lvbi4gPGk+QSBoYXBweSBuZXcgeWVhciAyMDEzLCBldmVyYm9keSE8L2k+XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0xMC0yNjwvc21hbGw+XG4gICAgQWRkZWQgc2VjdGlvbiBhYm91dCBDcmVhdGl2ZSBDb21tb25zIExpY2Vuc2UsIGJlbG93LiBJbiBvdGhlciB3b3JkczogeW91IGNhbiBub3cgbGVnYWxseSBydW4gbXkgY29kZSBvbiB5b3VyIG93biBzZXJ2ZXIuIChZb3UgZXZlbiBjb3VsZCByZW1vdmUgdGhlIHRpbnkgcmVmZXJlbmNlIHRvIHRoaXMgcGFnZSBpbiB0aGUgZm9vdGVyIG9mIHRoZSBib3guKSBIb3dldmVyLCBJIHdvdWxkIGxpa2UgdG8gYXNrIHlvdSBmb3IgdHdvIHRoaW5ncyBpZiB5b3Ugd2FudCB0byBkbyBzbzpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgVXNlIHlvdXIgb3duIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9wM2svanNvbjNrJz5KU09OUCBwcm94eTwvYT4g4oCTIGVzcGVjaWFsbHksIHdoZW4geW91IGV4cGVjdCBhIGhpZ2ggbG9hZCBvbiB5b3VyIHNlcnZlci5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFBsZWFzZSBzdXBwb3J0IHRoZSBzZXJ2aWNlIHdpdGggYSA8YSBocmVmPSdodHRwOi8vZmxhdHRyLmNvbS90aGluZy82ODE4ODEvSmF2YVNjcmlwdC1SU1MtQm94LVZpZXdlcic+ZG9uYXRpb248L2E+LlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDgtMDE8L3NtYWxsPlxuICAgIEFkZGVkIHR3byBuZXcsIGV4cGVyaW1lbnRhbCBmZWF0dXJlcyDigJMgYW5kIHRodXMsIGluY3JlYXNlZCB2ZXJzaW9uIHRvIDMuMzpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgVGhlIGhlaWdodCBvZiB0aGUgaW5uZXIgYm94IGNvbnRlbnQgY2FuIG5vdyBiZSBkZWZpbmVkIGJ5IGEgcGl4ZWwgdmFsdWUuIElmIHRoZSBoZWlnaHQgaXMgbGVzcyB0aGFuIHRoZSBzcGFjZSBuZWVkZWQgYnkgdGhlIGRlc2lyZWQgYW1vdW50IG9mIGl0ZW1zIHlvdSBjYW4gdmVydGljYWxseSBzY3JvbGwgdGhlIGNvbnRlbnQuIEEgdmFsdWUgb2YgPGNvZGU+LTE8L2NvZGU+IGVuYWJsZXMgdGhlIGRlZmF1bHQgYmVoYXZpb3IgYW5kIGF1dG9tYXRpY2FsbHkgc2V0cyB0aGUgaGVpZ2h0IGFjY29yZGluZyB0byB0aGUgZGlzcGxheWluZyBpdGVtcy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFRoZSBzby1jYWxsZWQg4oCcaGVhZGxlc3PigJ0gbW9kZSByZW1vdmVzIHRoZSB0aXRsZWJhciBhbmQgdGhlIGZyYW1lIGZyb20gdGhlIGJveC4gVGhpcyB3YXkgdGhlIGJveCBjYW4gYmUgdXNlZCBtb3JlIGZsZXhpYmx5IGluIHNwZWNpYWwgc2l0dWF0aW9ucy4gSG93ZXZlciwgdGhpcyBmZWF0dXJlIHNvbWVob3cgdW5kZXJtaW5lcyBhbiBSU1MgZmVlZOKAmXMgYXV0aG9yaXR5IHNvIEkgY291bnQgb24geW91ciBmYWlybmVzcyB0byBnaXZlIGNyZWRpdCB3aGVyZSBjcmVkaXQgaXMgZHVlIVxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDctMTY8L3NtYWxsPlxuICAgIFNsaWdodGx5IG1vZGlmaWVkIG91dHB1dCBvZiB0aGUgSFRNTCBjb2RlIHRvIGJlIHVzYWJsZSB3aXRoIGJvdGgsIHVuc2VjdXJlZCBhbmQgc2VjdXJlZCAoSFRUUFMpIHdlYiBzZXJ2ZXJzLiBZb3UgY2FuIHVwZGF0ZSBhbHJlYWR5IGVtYmVkZGVkIGNvZGUgZWFzaWx5IGJ5IHJlbW92aW5nIHRoZSA8Y29kZT5odHRwOjwvY29kZT4gcGFydCBmcm9tIHRoZSA8Y29kZT5zcmM8L2NvZGU+IGF0dHJpYnV0ZSBvZiB0aGUgPGNvZGU+Jmx0O3NjcmlwdCZndDs8L2NvZGU+IGVsZW1lbnQ6IDxjb2RlPiZsdDtzY3JpcHQgc3JjPSdodHRwOi8vcDNrLm9yZy9yc3PigKYnJmd0OzwvY29kZT4gYmVjb21lcyA8Y29kZT4mbHQ7c2NyaXB0IHNyYz0nLy9wM2sub3JnL3Jzc+KApicmZ3Q7PC9jb2RlPi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA3LTEzPC9zbWFsbD5cbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgRml4ZWQgSUUgYnVnICjigJxpbm5lckhUTUwgaXMgbnVsbCBvciBub3QgYW4gb2JqZWN04oCdKSBjYXVzZWQgYnkgdXNpbmcgalF1ZXJ54oCZcyBodG1sKCkgbWV0aG9kIGluc3RlYWQgb2YgdGV4dCgpIHdoZW4gcGFyc2luZyBhIDxjb2RlPiZsdDtjb250ZW50OmVuY29kZWQmZ3Q7PC9jb2RlPiBlbGVtZW50LlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQ2hhbmdlZCBwcmlvcml0eSBvZiBlbGVtZW50czogb25seSBjaGVjayBmb3IgPGNvZGU+Jmx0O2NvbnRlbnQ6ZW5jb2RlZCZndDs8L2NvZGU+IGlmICAgICA8Y29kZT4mbHQ7ZGVzY3JpcHRpb24mZ3Q7PC9jb2RlPiBpcyBub3QgYXZhaWxhYmxlLlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDYtMDQ8L3NtYWxsPlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBJbXBsZW1lbnRlZCBzbWFsbCByb3V0aW5lIHRvIHJlc2l6ZSBpbWFnZXMgY29udGFpbmVkIGluIHRoZSBmZWVkIGNvbnRlbnQgdG8gZml0IGluIHRoZSBib3guXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBzdXBwb3J0IGZvciBuZXcgSFRNTDUgZm9ybSBpbnB1dCB0eXBlcyBhbmQgdGhlaXIgdmFsaWRhdGlvbi5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTMxPC9zbWFsbD5cbiAgICBHb25lICZiZXRhO2V0YSEg4oCTIHdpdGggdGhyZWUgdGlueSBhZGRpdG9uczpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgPGNvZGU+Jmx0O25vc2NyaXB0Jmd0OzwvY29kZT4gZWxlbWVudCBmb3IgYnJvd3NlcnMgcHJvdmlkaW5nIG5vIEphdmFTY3JpcHQgZW5naW5lLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgb3B0aW9uIHRvIGNhbGwgdGhlIGNvbmZpZ3VyYXRvciB3aXRoIGEgVVJMIGluIHRoZSBxdWVyeSBzdHJpbmcuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBhIGxpbmsgdG8gdGhlIFczQyBmZWVkIHZhbGlkYXRvciB0byB0aGUgY29udGVudHMgb2YgYSBib3ggZGlzcGxheWluZyBhbiBSU1MgZXJyb3IuXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0xOTwvc21hbGw+XG4gICAgQXBvbG9naWVzIGZvciB0aGUgUlNTIEJveGVzIG5vdCBzaG93aW5nIHVwIG9uIHlvdXIgcGFnZXMgZHVyaW5nIHRoZSBsYXN0IGZldyBkYXlzLiBJIG1hZGUgYSBzdHVwaWQgbWlzdGFrZSB0aGF0IGNhdXNlZCBvbmx5IHRoZSBzZXR1cCBwYWdlIHRvIHJlbmRlciBjb3JyZWN0bHkg4oCTIGFuZCBJIGRpZCBub3QgY2hlY2sgYW55IGVtYmVkZGVkIHNjcmlwdC4gPGk+QnVtbWVyITwvaT5cbiAgPC9wPlxuICA8cD5cbiAgICBBdCBsZWFzdCBub3cgZXZlcnl0aGluZyBzaG91bGQgYmUgYmFjayB0byBub3JtYWwuIChJIGhvcGUgdGhpcyBpbmNpZGVudCBkaWQgbm90IHNhYm90YWdlIHRoZSBGbGF0dHIgYnV0dG9uIEkgYWRkZWQgaW4gdGhlIG1lYW50aW1l4oCmIDxpPndpbmssIHdpbmshPC9pPilcbiAgPC9wPlxuICA8cD5Bbnl3YXksIHRoYW5rcyBmb3IgeW91ciB1bmRlcnN0YW5kaW5nLjwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0xNjwvc21hbGw+XG4gICAgSSB0aGluayBJIGRpZCBub3QgbWVudGlvbiwgeWV0LCB0aGF0IHRoZSBjdXJyZW50IGluY2FybmF0aW9uIG9mIHRoZSBjb2RlIGlzIHRvdGFsbHkgZGlzY29ubmVjdGVkIGZyb20gdGhlIHZlcnNpb24gYXMgb2YgMjAwOS4gRWFjaCBpcyB1c2luZyB0aGVpciBvd24gY29kZWJhc2UsIHRoZSBsZWdhY3kgY29kZSB3YXMgbm90IG1vZGlmaWVkIGF0IGFsbCBhbmQgdGh1cywgaXQgaXMgbm90IGFmZmVjdGVkIGJ5IGFueSByZWNlbnQgY2hhbmdlcy4gWW91IGNhbiBjaGVjayB3aGljaCB2ZXJzaW9uIHlvdSBhcmUgdXNpbmcgYnkgbG9va2luZyBhdCB0aGUgc2NyaXB0IFVSTC4gSWYgaXQgY29udGFpbnMgdGhlIHN0cmluZyDigJxwcm94eS5y4oCdIHlvdSBnZXQgdGhlIOKAnGNsYXNzaWPigJ0gUlNTIEJveCByZW5kZXJpbmcuIFRoZSBtb2Rlcm5pemVkIHZlcnNpb24gY2FsbHMg4oCcaW5kZXguanPigJ0uIE5ldmVydGhlbGVzcywgeW91IGNhbm5vdCBzZXR1cCBib3hlcyB3aXRoIHRoZSBvbGQgVVJMIGFueW1vcmUuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0wOTwvc21hbGw+XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIHN1cHBvcnQgZm9yIDxjb2RlPiZsdDtjb250ZW50OmVuY29kZWQmZ3Q7PC9jb2RlPiBlbGVtZW50LlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgSW1wbGVtZW50ZWQgTWVtY2FjaGUgdXNhZ2UgaW4gQXBwRW5naW5lIGNvZGUuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBCZWF1dGlmaWVkIHRoaXMgcGFnZSBieSB1c2luZyB0aGUgPGEgaHJlZj0naHR0cDovL3d3dy5nb29nbGUuY29tL3dlYmZvbnRzL3NwZWNpbWVuL0Ryb2lkK1NlcmlmJz5Hb29nbGXigJlzIERyb2lkIFNlcmlmIGZvbnQ8L2E+LlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDQtMjY8L3NtYWxsPlxuICAgIEFtYXppbmchIEEgbmV3IHZlcnNpb24hIEFmdGVyIG1vcmUgdGhhbiB0d28geWVhcnMgaGlhdHVzIEkgY29tcGxldGVseSByZXdyb3RlIHRoZSBjb2RlYmFzZSBhbmQgZnJhbWV3b3JrOlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBSZW1vdmVkIGRlcGVuZGVuY3kgdG8gUmVib2wgdXNpbmcgYSBzbWFsbCBKU09OUCBwcm94eSBhdCBHb29nbGXigJlzIEFwcEVuZ2luZS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFJld3JvdGUgWE1MIHBhcnNpbmcsIHJlcGxhY2luZyBuYXRpdmUgbWV0aG9kcyB3aXRoIGpRdWVyeSBvbmVzLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQ2xlYW5lZCB1cCBIVE1MIG91dHB1dCBmb3IgdGhlIFJTUyBCb3gsIHJlcGxhY2luZyB0YWJsZXMgd2l0aCBkaXZzLiA8aT5Ob3RlOiBZb3UgbWlnaHQgbmVlZCB0byBhZGQgPGNvZGU+PGEgaHJlZj0naHR0cDovL2NvZGluZy5zbWFzaGluZ21hZ2F6aW5lLmNvbS8yMDEwLzExLzAyL3RoZS1pbXBvcnRhbnQtY3NzLWRlY2xhcmF0aW9uLWhvdy1hbmQtd2hlbi10by11c2UtaXQvJz4haW1wb3J0YW50PC9hPjwvY29kZT4gdG8geW91ciBjdXN0b20gUlNTIEJveCBzdHlsZXNoZWV0IGRlZmluaXRpb25zLjwvaT5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFJlcGxhY2VkIGZ1Z2x5IGNvbG9ycGlja2VyIGluIGNvbmZpZ3VyYXRvciB3aXRoIHRoZSA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vY2xhdmlza2EvanF1ZXJ5LW1pbmlDb2xvcnMvJz5NaW5pQ29sb3JzIGpRdWVyeSBwbHVnaW48L2E+LlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgbGluayBjb2xvciBzZXR0aW5nIGFuZCBzdHlsZSBhdHRyaWJ1dGVzIGZvciBjb3JyZWN0bHkgYXBwbHlpbmcgY29sb3Igc2V0dGluZ3MuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBjb3JuZXIgcmFkaXVzIHNldHRpbmcuIDxpPk5vdGU6IGRvZXMgbm90IHdvcmsgaW4gSUU4IGFuZCBlYXJsaWVyIHZlcnNpb25zLjwvaT5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGZvbnQgc2l6ZSB0byB0aGUgZm9udCBmYWNlIHNldHRpbmcuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBSZW1vdmVkIGFsaWduIHNldHRpbmcgZnJvbSBjb25maWd1cmF0b3IgKHN0aWxsIHdvcmtzIGluIHNjcmlwdCB0YWdzIGdlbmVyYXRlZCB3aXRoIGVhcmxpZXIgdmVyc2lvbnMpLlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDktMTItMTM8L3NtYWxsPlxuICAgIFN3aXRjaGVkIG91dHB1dCBvZiB0aGlzIHBhZ2UgdG8gSFRNTDUgYW5kIG1hZGUgc29tZSBhZGFwdGF0aW9ucyBpbiB0aGUgSFRNTCBjb2RlIGFuZCBDU1Mgc3R5bGVzaGVldC4gVXBkYXRlZCB2ZXJzaW9uIHN0cmluZyB0byAyLjEsIGZpbmFsbHkhXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOS0wOS0yODwvc21hbGw+XG4gICAgU29tZSBtaW5vciBjaGFuZ2VzIGFmdGVyIGEgd2hpbGU6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5SZWZhY3RvcmVkIGRhdGUgcGFyc2luZyB0byBzaG93IGFjdHVhbCBidWlsZCBkYXRlcyBtb3JlIHJlbGlhYmx5PC9saT5cbiAgICA8bGk+UmVmYWN0b3JlZCBjYWNoaW5nIHJvdXRpbmUgKG9ubHkgaW4gb25saW5lIHZlcnNpb24pPC9saT5cbiAgICA8bGk+VXBkYXRlZCB2ZXJzaW9uIHN0cmluZyB0byAyLjFiLCBhcHByb2FjaGluZyBhbm90aGVyIGZpbmFsIHZlcnNpb24uPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOC0wMi0xOTwvc21hbGw+XG4gICAgU2VlbXMgdGhlcmUgd2VyZSBzb21lIGNoYW5nZXMgaW4gdGhlIGFpciBhcyBJIGRpZCBub3QgcGxhbiBhbm90aGVyIHVwZGF0ZSBidXQgaGVyZSBjb21lcyB2ZXJzaW9uIDIuMSBicmluZ2luZyB0byB5b3U6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEZ1bGwgY2xpZW50LXNpZGUgcHJvY2Vzc2luZyAob25seSB0aGUgcmF3IGZlZWQgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlcikuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBVc2VyLWZyaWVuZGxpZXIgaW50ZXJmYWNlIHdpdGggY29sb3IgcGlja2Vycywgc3RhdHVzIGFuZCBlcnJvciBkaXNwbGF5IGFzIHdlbGwgYXMgaW5zdGFudCBmZWVkYmFjayBvbiBhbnkgY2hhbmdlIGluIHNldHVwLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQW5kIGZpbmFsbHkgKGRydW1yb2xsISkgVW5pY29kZSBzdXBwb3J0IGF0IGxlYXN0IGF0IHRoaXMgaW5zdGFsbGF0aW9uIG9mIHRoZSB2aWV3ZXIuIChJZS4gdGhlIGRvd25sb2FkZWQgdmVyc2lvbiBzdGlsbCB3aWxsIG91dHB1dCBBU0NJSSBvbmx5LilcbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA4LTAyLTAzPC9zbWFsbD5cbiAgICBNYWRlIHNvbWUgbW9yZSBpbXByb3ZlbWVudHMgZXNwZWNpYWxseSByZWdhcmRpbmcgdGhlIGVycm9yIGhhbmRsaW5nIGFuZCBvdXRwdXQuIEZyb20gbm93IG9uIGl0IHNob3VsZCBiZSBtdWNoIGNsZWFyZXIgd2hhdOKAmXMgd3Jvbmcgd2l0aCBhIHZlcnkgUlNTIEJveC4gU2luY2UgdGhlcmXigJlzIG5vdyBhIGxvdCBtb3JlIG9mIGNsaWVudC1zaWRlIEphdmFTY3JpcHQgY29kZSBpbnZvbHZlZCBJIHRlc3RlZCB0aGUgc2NyaXB0IGluIGZvdXIgbWFqb3IgYnJvd3NlcnMgdGhhdCBhcmUgYXZhaWxhYmxlIHRvIG1lOiBJbnRlcm5ldCBFeHBsb3JlciA3LCBGaXJlZm94IDIuMCwgT3BlcmEgOS4yNSBhbmQgU2FmYXJpIDMuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOC0wMi0wMTwvc21hbGw+XG4gICAgQ29tcGxldGVseSByZXZpc2VkIHNlcnZlci0gYW5kIGNsaWVudC1zaWRlIGNvZGUuIFhNTCByZW5kZXJpbmcgaXMgbm93IGRvbmUgaW4gdGhlIGJyb3dzZXIgd2hpY2ggc3BlZWRzIHVwIHRoaW5ncyBhbmQgZGVjcmVhc2VzIHRoZSBsb2FkIG9uIHRoZSBzZXJ2ZXIuIEZ1cnRoZXJtb3JlLCB0aGUgbGlzdCBvZiByZWZlcnJlcnMgaXMgbm93IGxvYWRlZCBvbiBkZW1hbmQgdmlhIEFKQVggYW5kIHRodXMgbm90IHJlbmRlcmVkIHdpdGggZXZlcnkgcmVxdWVzdC4gRmluYWxseSwgSSByZXRvdWNoZWQgdGhlIHNldHVwIGZvcm0gaW50ZXJmYWNlIGFuZCBjbGVhbmVkIHVwIGJvdGggSFRNTCBhbmQgQ1NTLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMTItMjA8L3NtYWxsPlxuICAgIEkgYW0gdmVyeSBnbGFkIHRoYXQgbXkgb2xkIGxpdHRsZSBzY3JpcHQgaXMgZ2FpbmluZyBldmVuIG1vcmUgYXR0ZW50aW9uIGFmdGVyIGFsbCB0aGVzZSB5ZWFyc+KApiAgICA8aT5UaGFuayB5b3UgdmVyeSBtdWNoIGluZGVlZCE8L2k+IFNpbmNlIHRoZXJlIGFyZSBjb21pbmcgaW4gbW9yZSBhbmQgbW9yZSBvZiB0aGUgc2FtZSByZXF1ZXN0cyBhbmQgSSBhbSByZWFsbHkgbm90IGFibGUgdG8gaGFuZGxlIHRoZW0gKGFwb2xvZ2llcyEpLCBoZXJlIGlzIHNvbWUgYWR2aWNlIGZvciBldmVyeW9uZTpcbiAgPC9wPlxuICA8b2w+XG4gICAgPGxpPlxuICAgICAgPGEgaHJlZj0naHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DYXNjYWRpbmdfU3R5bGVfU2hlZXRzJz5Vc2UgY2FzY2FkaW5nIHN0eWxlIHNoZWV0czwvYT4gKENTUykgdG8gY2hhbmdlIGZvbnQgc2l6ZXMgKGFuZCB0byBnZW5lcmFsbHkgZGVmaW5lIHlvdXIgbGF5b3V0KS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIDxhIGhyZWY9J2h0dHA6Ly93d3cuc2l0ZXBvaW50LmNvbS9hcnRpY2xlL2Jld2FyZS1vcGVuaW5nLWxpbmtzLW5ldy13aW5kb3cnPkJld2FyZSBvZiBvcGVuaW5nIGxpbmtzIGluIGEgbmV3IHdpbmRvdy48L2E+IEl04oCZcyBvZmZlbnNpdmUgdG8geW91ciByZWFkZXJzLlxuICAgIDwvbGk+XG4gIDwvb2w+XG4gIDxwPlxuICAgIDxpPkEgaGFwcHkgZW5kIGZvciAyMDA2ITwvaT5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA2LTEzPC9zbWFsbD5cbiAgICBEaWQgc29tZSBtaW5vciBidWcgZml4aW5nIGFnYWluIChhbW9uZ3N0IG90aGVycyByZXBsYWNpbmcgc2luZ2xlIHF1b3RlcyB3aXRoICZhcG9zOyBhbmQgbm90ICZxdW90OyBlbnRpdGllcykuIEZ1cnRoZXJtb3JlIChhbmQgZmluYWxseSksIEkgcmVtb3ZlZCB0aGUg4oCcUkPigJ0gKGFzIGluIOKAnFJlbGVhc2UgQ2FuZGlkYXRl4oCdKSBmcm9tIHRoZSBkb2N1bWVudCB0aXRsZeKAplxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDYtMTI8L3NtYWxsPlxuICAgIEdhcnkgaW5mb3JtZWQgbWUgdGhhdCBsb25nZXIgZmVlZCBVUkxzIGNhdXNlIHRyb3VibGUgYW5kIHRoZSBmZWVkIGJveCB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQuIFRoYXTigJlzIGluIGZhY3QgYSBidWcsIGJ1dCB1bmZvcnR1bmF0ZWx5IG9uZSB0aGF0IGNhbm5vdCBiZSBmaXhlZCBzbyBlYXNpbHkuIE15IHN1Z2dlc3Rpb24gaXMgdG8gc2hvcnRlbiBzdWNoIFVSTHMgYXQgb25lIG9mIHRoZSB3ZWJzaXRlcyBhcm91bmQgdGhhdCBwcm92aWRlIHN1Y2ggYSBzZXJ2aWNlLCBlLmcuIDxhIGhyZWY9J2h0dHA6Ly90aW55dXJsLmNvbSc+dGlueXVybC5jb208L2E+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMjM8L3NtYWxsPlxuICAgIFN3aXRjaGVkIHRoZSA8YSBocmVmPSdodHRwczovL3Azay5vcmcvc291cmNlL3Jzcy1ib3gvJz5zb3VyY2UgcmVwb3NpdG9yeTwvYT4gZnJvbSBDVlMgdG8gU3VidmVyc2lvbiAoU1ZOKS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTIwPC9zbWFsbD5cbiAgICBBbmRyZXcgUGFtIGJyb3VnaHQgdXAgYSBzZXJpb3VzIGlzc3VlIHRoYXQgcHJvYmFibHkgbWlnaHQgaGF2ZSBhZmZlY3RlZCBzb21lIG1vcmUgcGVvcGxlIGFscmVhZHk6IHRoZSB2aWV3ZXIgZG9lcyBub3Qgc3VwcG9ydCBVVEYtOCAob3IgVW5pY29kZSwgcmVzcC4pIFVuZm9ydHVuYXRlbHksIHRoaXMgaXMg4oCcYnVpbHQtaW7igJ0gaW50byB0aGUgdW5kZXJseWluZyBzY3JpcHRpbmcgbGFuZ3VhZ2UgKGFrYSBSZWJvbCkuIEnigJltIHNvcnJ5IHRvIGNhbmNlbCB0aG9zZSB0aWNrZXRz4oCmIDooXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNC0xMzwvc21hbGw+XG4gICAgRml4ZWQgYSBidWcgcmVwb3J0ZWQgYnkgTWFuZG8gR29tZXogdGhhdCBjYXVzZWQgZmVlZHMgdXNpbmcgdGhlICZsdDtndWlkJmd0OyBlbGVtZW50IGJlaW5nIGRpc3BsYXllZCB3aXRob3V0IGl0ZW0gbGlua3PigKYgRG9u4oCZdCBmb3JnZXQgdG8gY2hlY2sgb3V0IE1hbmRv4oCZcyBleGNlbGxlbnQgd2Vic2l0ZSA8YSBocmVmPSdodHRwOi8vd3d3Lm1hbmRvbHV4LmNvbS8nPm1hbmRvbHV4PC9hPiFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTEyPC9zbWFsbD5cbiAgICBPYnZpb3VzbHkgU2FtIFJ1YnkgY2hhbmdlZCBoaXMgZmVlZCBmb3JtYXQgZnJvbSBzY3JpcHRpbmdOZXdzIHRvIEF0b207IHdoaWNoIHJlbmRlcnMgbXkgZXhhbXBsZSBsaW5rIGFib3ZlIHByZXR0eSB1c2VsZXNz4oCmIFNvIGZhciBJIGRvbuKAmXQga25vdyBhYm91dCBhbnkgb3RoZXIgc2NyaXB0aW5nTmV3cyBmZWVkLCBkbyB5b3U/XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wMi0yMDwvc21hbGw+XG4gICAgSSBob3BlIG5vYm9keSBtaW5kcyB0aGUgbGl0dGxlIGxpbmUgSSBhZGRlZCBhdCB0aGUgYm90dG9tIG9mIGVhY2ggUlNTIGJveOKApiBPZiBjb3Vyc2UsIGl04oCZcyBub3QgdG90YWxseSBhbHRydWlzdGljLCBidXQgcHJvYmFibHkgc29tZSBwZW9wbGUgd2lsbCBmaW5kIGl0IGluZm9ybWF0aXZlLiBIb3dldmVyLCBpZiB5b3Ugd2FudCB0byBwcmV2ZW50IGl0IGZyb20gYmVpbmcgZGlzcGxheWVkIHNpbXBseSBhZGQgPGNvZGU+LnJzc2JveC1wcm9tbyB7XCJ7XCJ9ZGlzcGxheTogbm9uZTt7XCJ9XCJ9PC9jb2RlPiB0byB5b3VyIHN0eWxlc2hlZXQuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wMS0xMTwvc21hbGw+XG4gICAgTmV3IHNlcnZlciwgbmV3IHRyb3VibGVzOiBJIG1vdmVkIHRoZSB2aWV3ZXIgdG8gYSBuZXdseSBzZXR1cCBVYnVudHUgbWFjaGluZS4gT2YgY291cnNlLCBJIGZvcmdvdCB0byBzZXQgc29tZSBwZXJtaXNzaW9uIGZsYWdzIGFuZCBvd25lcnMsIHRodXMsIHByZXZlbnRpbmcgdGhlIHNjcmlwdCBmcm9tIHdvcmtpbmcuIEhvd2V2ZXIsIEkgdGhpbmsgZXZlcnl0aGluZyBpcyBmaXhlZCBhbmQgd29ya2luZyBhZ2Fpbi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA1LTExLTE2PC9zbWFsbD5cbiAgICBKdXN0IHRlc3RpbmcgR29vZ2xl4oCZcyBBZFNlbnNlIGZvciBhIHdoaWxlLiBTaW5jZSB0aGlzIHBhZ2UgZ2VuZXJhdGVzIG1vc3Qgb2YgbXkgdHJhZmZpYyBJIHdhbnRlZCB0byBzZWUgbXlzZWxmIHdoYXQgYSBiYW5uZXIgY2FuIGRvIGhlcmUuIEhvcGUgeW91IGRvbuKAmXQgbWluZC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTEyLTE2PC9zbWFsbD5cbiAgICBCdWdmaXg6IFNvbWV0aW1lcyB0aGUgbG9nZmlsZSB3aGljaCBpcyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBsaXN0IG9mIHNpdGVzIHVzaW5nIHRoaXMgc2NyaXB0IGdldHMgY29ycnVwdGVkLiBUaGlzIGFmZmVjdGVkIHRoZSB3aG9sZSBzZXR1cCBwYWdlIHRvIHJldHVybiBhbiBlcnJvciBhbmQgdGh1cywgaXQgbmVlZGVkIHRvIGJlIGNhdWdodC4gKFlvdSB3aWxsIHNlZSBhIOKAnGN1cnJlbnRseSBvdXQgb2Ygb3JkZXLigJ0gbWVzc2FnZSB0aGVuLilcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTA0LTI2PC9zbWFsbD5cbiAgICBMYXN0IGVmZm9ydHMgdG8gb2ZmaWNpYWxseSByZWxlYXNlIHRoZSA8YSBocmVmPSdodHRwczovL3Azay5vcmcvc291cmNlL3Jzcy1ib3gnPmNvZGU8L2E+IHRvIHRoZSBvcGVuIHNvdXJjZSBjb21tdW5pdHkuIFRoZXJlIGhhdmUgYmVlbiBzb21lIGJ1Z3MgaW4gdGhlIChpbWFnZSkgcmVuZGVyaW5nIGZyYW1ld29yayB3aGljaCBJIGZpeGVkIHNvICAgIGZhci4gSSBub3cgaW5jbHVkZSBhIGR5bmFtaWNhbGx5IHJlbmRlcmVkIGxpc3Qgb2Ygc2l0ZXMgdXNpbmcgKG9yIHBvaW50aW5nIHRvKSB0aGlzIHNjcmlwdCB0byBnaXZlIHNvbWUgZXhhbXBsZXMgZm9yIHRoZSBjdXJpb3VzIGF0IGhlYXJ0IChtZSBpbmNsdWRlZCkuIEZpbmFsbHksIHRoZXJl4oCZcyBhIDxhIGhyZWY9J2h0dHBzOi8vcDNrLm9yZy9zb3VyY2UvcnNzLWJveC9icmFuY2hlcy8yLjAvUkVBRE1FJz5SRUFETUU8L2E+IGZpbGUgd2l0aCBhIHNob3J0IGluc3RhbGxhdGlvbiBndWlkZSB0byBtYWtlIHRoZSBzY3JpcHQgcnVuIG9uIHlvdXIgb3duIHNlcnZlci5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTAxLTI4PC9zbWFsbD5cbiAgICBXaGVuIHNvbWV0aGluZyBnb2VzIHdyb25nIChtb3N0IG9mIHRoZSB0aW1lIHRoaXMgbWlnaHQgYmUgYSB3cm9uZyBVUkwsIGllLiBhIDQwNCBhcyByZXN1bHQpIGFuICAgIDxhIGhyZWY9Jy4vP3VybD1lcnJvcic+4oCcZXJyb3LigJ0gYm94PC9hPiB3aWxsIGJlIGRpc3BsYXllZCB0byBzaWduYWwgdGhlIGZhaWx1cmUuIEluY3JlYXNlZCB2ZXJzaW9uIHVwIHRvIDEuMCBhbmQgbGFiZWxlZCBpdCBhcyByZWxlYXNlIGNhbmRpZGF0ZVxuICAgIChSQykuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNC0wMS0yNjwvc21hbGw+XG4gICAgUmV0b3VjaGVkIHRoZSBjb2RlIGluIGEgdmVyeSBsYXN0IGVmZm9ydCB0byBtYWtlIHRoZSBzY3JpcHQgcnVubmluZyBzdGFuZC1hbG9uZSAod2l0aCBSZWJvbCBidXQgICAgPGk+d2l0aG91dDwvaT4gUEhQLCB0aGF0IGlzKS4gRXZlcnl0aGluZyBuZWVkZWQgaXMgbm93IGluIDxkZWw+Q1ZTPC9kZWw+IFNWTiBzbyBldmVyeWJvZHkgY2FuIGRvd25sb2FkIGZyb20gdGhlcmUuIFBvdGVudGlhbGx5LCBhIGZldyBtaW5vciBidWcgZml4ZXMgbWlnaHQgZm9sbG93IHNob3J0LXRlcm0uIFVoLCBhbmQgdGhlIEhUTUwgY29kZSBpcyA8YSBocmVmPSdodHRwOi8vdmFsaWRhdG9yLnczLm9yZy9jaGVjaz91cmk9aHR0cCUzQSUyRiUyRnAzay5vcmclMkZyc3MlMkYnPnZhbGlkIFhIVE1MIDEuMDwvYT4gbm93LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMTItMTI8L3NtYWxsPlxuICAgIFRoZSBtaXJyb3IgYXQgPGRlbD5odHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzLzwvZGVsPiBpcyBub3Qgd29ya2luZyBmb3IgcXVpdGUgYSBsb25nIHRpbWUuIEkgdHJpZWQgdG8gY29udGFjdCBBZGFtIEN1cnJ5IGJ1dCBzbyBmYXIgd2l0aG91dCBzdWNjZXNzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMDMtMzA8L3NtYWxsPlxuICAgIE1vdmVkIHRvIG5ldyBzZXJ2ZXIgd2l0aCBuZXcgZG9tYWluIDxkZWw+Zm9yZXZlci5wM2sub3JnPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMDMtMjU8L3NtYWxsPlxuICAgIFVwZGF0ZWQgUmVib2wgdG8gPGEgaHJlZj0naHR0cDovL3d3dy5yZWJvbC5jb20vbmV3czMzMTAuaHRtbCc+dmVyc2lvbiAyLjUuNTwvYT4uIEVuZCBvZiBSZWJvbOKAmXMg4oCcRE5TIHpvbWJpZXPigJ0gaW4gdGhlIHByb2Nlc3MgbGlzdC5cbiAgICA8aT5GaW5hbGx5LjwvaT5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAyLTAyLTE5PC9zbWFsbD5cbiAgICBBZGRlZCBhIHZlcnkgbmljZSBxdW90ZSBmcm9tIDxhIGhyZWY9J2h0dHA6Ly93d3cub3VycGxhLm5ldC9jZ2ktYmluL3Bpa2llLmNnaT9BYmJlTm9ybWFsJz5BYmJlIE5vcm1hbDwvYT4gb24gdG9wIHJpZ2h0IG9mIHRoaXMgZG9jdW1lbnQuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0xMS0xNzwvc21hbGw+XG4gICAgSWYgeW91IHdhbnQgYSBtb3JlIGNvbXBhY3QgdmlldyBvZiB0aGUgUlNTIGJveCB5b3UgY2FuIGdldCBpdCBub3cgdXNpbmcgdGhlIGNvcnJlc3BvbmRpbmcgY2hlY2tib3guIElmIGl0IGlzIGVuYWJsZWQgdGhlIGRlc2NyaXB0aW9ucyBvZiBlYWNoIGl0ZW0gd2lsbCBub3QgYmUgZGlzcGxheWVkICYjODIxMTsgZ2l2ZW4gdGhhdCB0aGUgaXRlbSB0aXRsZSBpcyBkZWZpbmVkIChvdGhlcndpc2UgdGhlcmUgd291bGQgbm90IGJlIG11Y2ggdG8gc2VlKS4gQWRkaXRpb25hbGx5LCB0aGUgY2hhbm5lbCBpbWFnZSAoaWYgZGVmaW5lZCkgd2lsbCBub3QgYmUgZGlzcGxheWVkLiBUaGFua3MgJiMxMDY7JiMxMTU7JiMxMjE7JiMxMDE7JiMxMTE7JiM2NDsmIzk5OyYjMTExOyYjMTA5OyYjMTEyOyYjMTE3OyYjMTE1OyYjMTAxOyYjMTE0OyYjMTE4OyYjMTAxOyYjNDY7JiM5OTsmIzExMTsmIzEwOTsgZm9yIHRoZSBzdWdnZXN0aW9ucyFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTIxPC9zbWFsbD5cbiAgICBTaW5jZSB0b2RheSB0aGUgPGNvZGU+dGV4dGlucHV0PC9jb2RlPiB0YWcgaXMgc3VwcG9ydGVkLiBJdCBjcmVhdGVzIGFuIGFwcHJvcHJpYXRlIGZvcm0gYXQgdGhlIGVuZCBvZiB0aGUgYm94LiBNb3Jlb3ZlciwgdHdvIGJ1Z3Mgd2VyZSBmaXhlZDogb25lIGNhdXNlZCB1bm5lY2Vzc2FyeSBpbmZvcm1hdGlvbiBpbiB0aGUgcXVlcnkgc3RyaW5nIG9mIHRoZSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCB0YWcuIFRoZSBvdGhlciBhZmZlY3RlZCB0aGUgZGlzcGxheSBvZiB0aGUgZGF0ZeKAmXMgdGltZSB6b25lLiBUaW1lIHpvbmVzIG5vdyBhcmUgZ2VuZXJhbGx5IGRpc3BsYXllZCBpbiBHTVQgZXhjZXB0IHdoZXJlIGFub3RoZXIgdGltZSB6b25lIGFjcm9ueW0gaXMgZGVmaW5lZC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTA0PC9zbWFsbD5cbiAgICBBZGRlZCBpY29ucyBmb3IgZW5jbG9zdXJlIGFuZCBzb3VyY2U7IGFkZGVkIFhNTCBidXR0b24gY2hlY2tib3ggdG8gZW5hYmxlIG91dHB1dCBvZiB0aGUgcXVhc2ktc3RhbmRhcmQgb3JhbmdlIGJ1dHRvbiBsaW5raW5nIHRvIHRoZSBYTUwgc291cmNlIChpZGVhYnkgJiM5NzsmIzEwMDsmIzk3OyYjMTA5OyYjNjQ7JiM5OTsmIzExNzsmIzExNDsmIzExNDsmIzEyMTsmIzQ2OyYjOTk7JiMxMTE7JiMxMDk7KS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTAzPC9zbWFsbD5cbiAgICBJdOKAmXMgbm93IHBvc3NpYmxlIHRvIHJlZmluZSB0aGUgc3R5bGUgb2YgdGhlIHdob2xlIGJveCB1c2luZyB0aGUgbmV3bHkgaW1wbGVtZW50ZWQgY3NzIGNsYXNzZXMgPGNvZGU+cnNzYm94LXRpdGxlPC9jb2RlPiwgPGNvZGU+cnNzYm94LWNvbnRlbnQ8L2NvZGU+LCA8Y29kZT5yc3Nib3gtaXRlbS10aXRsZTwvY29kZT4gYW5kIDxjb2RlPnJzc2JveC10dGVtLWNvbnRlbnQ8L2NvZGU+IChpZGVhIGJ5ICYjMTE0OyYjMTAwOyYjOTc7JiMxMTg7JiMxMDU7JiMxMDE7JiMxMTU7JiM2NDsmIzExMTsmIzExNDsmIzEwNTsmIzEwMTsmIzExMDsmIzExNjsmIzExMjsmIzk3OyYjOTk7JiMxMDU7JiMxMDI7JiMxMDU7JiM5OTsmIzQ2OyYjOTk7JiMxMTE7JiMxMDk7KS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTI0PC9zbWFsbD5cbiAgICBBZGRlZCBhIGZvcm0gaW5wdXQgZm9yIGxpbWl0aW5nIHRoZSBpdGVtIGRpc3BsYXkuIFRoZSBudW1iZXIgZGV0ZXJtaW5lcyBob3cgbWFueSBpdGVtcyB3aWxsIGJlIHNob3duIGluIHRoZSBib3ggKHNldmVuIGlzIHRoZSBkZWZhdWx0IHZhbHVlKS4gR29vZCBmb3Igb2Z0ZW4gdXBkYXRlZCBjaGFubmVscy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTE1PC9zbWFsbD5cbiAgICBEZXRlY3RlZCBhIHN0cmFuZ2UgYnVnIHRoYXQgcHJldmVudGVkIHRoZSB2aWV3ZXIgYXQgPGEgaHJlZj0naHR0cDovL3B1Ymxpc2guY3VycnkuY29tL3Jzcy8nPmN1cnJ5LmNvbTwvYT4gbG9hZGluZyBodHRwOi8vcDNrLm9yZy9yc3MueG1sIHdoaWxlIGh0dHA6Ly93d3cucDNrLm9yZy9yc3MueG1sIHdhcyBubyBwcm9ibGVtIGF0IGFsbC4gVXBncmFkaW5nIHRoZSBSZWJvbCBpbnN0YWxsYXRpb24gdG8gdGhlIGN1cnJlbnQgdmVyc2lvbiBzb2x2ZWQgdGhlcHJvYmxlbSwgaG93ZXZlciB0aGUgY2F1c2UgcmVtYWlucyB1bmNsZWFy4oCmXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wOC0wODwvc21hbGw+XG4gICAgRml4ZWQgYSBzbWFsbCBidWcgdGhhdCBjb3JydXB0ZWQgY2hhbm5lbCBVUkxzIGNvbnRhaW5pbmcgYSBxdWVyeSAoYXMgcmVwb3J0ZWQgYnkgJiMxMDc7JiMxMDU7JiMxMDc7JiM5NzsmIzY0OyYjMTE1OyYjMTA4OyYjMTExOyYjMTA4OyYjMTAxOyYjMTA0OyYjMTE2OyYjNDY7JiMxMDE7JiMxMDE7KS4gQ29uZmlndXJlZCBzZXJ2ZXIgcmVkaXJlY3QgZnJvbSA8ZGVsPmh0dHA6Ly9waWVma2UuaGVsbWEuYXQvcnNzPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMDU8L3NtYWxsPlxuICAgIFRoYW5rcyB0byA8YSBocmVmPSdodHRwOi8vd3d3LmN1cnJ5LmNvbS8yMDAxLzA3LzMxI2Nvb2xSc3NTZXJ2aWNlJz5BZGFtIEN1cnJ5PC9hPiwgdGhlIHZpZXdlciBpcyBub3cgbWlycm9yZWQgYXQgPGRlbD5odHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDctMzA8L3NtYWxsPlxuICAgIEFkZGVkIGxpbmsgdG8gc291cmNlIGNvZGU7IGFkZGVkIGV4YW1wbGUgbGlua3MgZm9yIGFsbCBzdXBwb3J0ZWQgZm9ybWF0cy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA1LTMwPC9zbWFsbD5cbiAgICBGaXhlZCBhIGxpdHRsZSBidWcgcmVwb3J0ZWQgYnkgJiMxMDI7JiMxMTQ7JiMxMDE7JiMxMDA7JiMxMDU7JiM2NDsmIzEwMTsmIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDY7JiMxMDE7JiMxMDE7IHRoYXQgY2F1c2VkIGRpYWNyaXRpYyBjaGFyYWN0ZXJzIHRvIGJlIGRpc3BsYXllZCBhcyBlbnRpdHkgY29kZXMuXG4gIDwvcD5cbjwvZGV0YWlscz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxFQUFFLDRCQUFDLENBQUMsQUFDRixPQUFPLENBQUUsWUFBWSxBQUN2QixDQUFDLEFBRUQscUJBQU8sQ0FBRyxjQUFFLENBQUMsQUFDWCxVQUFVLENBQUUsQ0FBQyxBQUNmLENBQUMsQUFFRCxPQUFPLDRCQUFDLENBQUMsQUFDUCxPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxnQkFBRSxDQUFHLEVBQUUsY0FBQyxDQUFDLEFBQ1AsVUFBVSxDQUFFLEtBQUssQUFDbkIsQ0FBQyxBQUVELEtBQUssNEJBQUMsQ0FBQyxBQUNMLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLFlBQVksQ0FBRSxLQUFLLENBQ25CLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyxBQUVELElBQUksNEJBQUMsQ0FBQyxBQUNKLGdCQUFnQixDQUFFLElBQUksQ0FDdEIsU0FBUyxDQUFFLEtBQUssQ0FDaEIsV0FBVyxDQUFFLEdBQUcsQUFDbEIsQ0FBQyJ9 */");
    }

    function create_fragment$a(ctx) {
    	let details;
    	let summary;
    	let h3;
    	let t1;
    	let p0;
    	let small0;
    	let t3;
    	let t4;
    	let p1;
    	let small1;
    	let t6;
    	let t7;
    	let p2;
    	let small2;
    	let t9;
    	let t10;
    	let p3;
    	let small3;
    	let t12;
    	let a0;
    	let t14;
    	let a1;
    	let t16;
    	let t17;
    	let p4;
    	let small4;
    	let t19;
    	let t20;
    	let ul0;
    	let li0;
    	let t22;
    	let li1;
    	let t24;
    	let li2;
    	let t26;
    	let li3;
    	let t28;
    	let li4;
    	let t29;
    	let a2;
    	let t31;
    	let t32;
    	let p5;
    	let small5;
    	let t34;
    	let em1;
    	let t35;
    	let em0;
    	let t36;
    	let p6;
    	let small6;
    	let t38;
    	let t39;
    	let ul1;
    	let li5;
    	let t41;
    	let li6;
    	let t43;
    	let li7;
    	let t45;
    	let li8;
    	let t47;
    	let li9;
    	let t49;
    	let li10;
    	let t51;
    	let li11;
    	let t53;
    	let li12;
    	let t55;
    	let li13;
    	let t56;
    	let a3;
    	let t58;
    	let a4;
    	let t60;
    	let li14;
    	let t62;
    	let li15;
    	let t64;
    	let li16;
    	let t65;
    	let a5;
    	let t67;
    	let li17;
    	let t69;
    	let li18;
    	let t71;
    	let p7;
    	let small7;
    	let t73;
    	let a6;
    	let t75;
    	let t76;
    	let p8;
    	let small8;
    	let t78;
    	let i0;
    	let t80;
    	let p9;
    	let small9;
    	let t82;
    	let t83;
    	let ul2;
    	let li19;
    	let t84;
    	let a7;
    	let t86;
    	let t87;
    	let li20;
    	let t88;
    	let a8;
    	let t90;
    	let t91;
    	let p10;
    	let small10;
    	let t93;
    	let t94;
    	let ul3;
    	let li21;
    	let t95;
    	let code0;
    	let t97;
    	let t98;
    	let li22;
    	let t100;
    	let p11;
    	let small11;
    	let t102;
    	let code1;
    	let t104;
    	let code2;
    	let t106;
    	let code3;
    	let t108;
    	let code4;
    	let t110;
    	let code5;
    	let t112;
    	let t113;
    	let p12;
    	let small12;
    	let t115;
    	let ul4;
    	let li23;
    	let t116;
    	let code6;
    	let t118;
    	let t119;
    	let li24;
    	let t120;
    	let code7;
    	let t122;
    	let code8;
    	let t124;
    	let t125;
    	let p13;
    	let small13;
    	let t127;
    	let ul5;
    	let li25;
    	let t129;
    	let li26;
    	let t131;
    	let p14;
    	let small14;
    	let t133;
    	let t134;
    	let ul6;
    	let li27;
    	let t135;
    	let code9;
    	let t137;
    	let t138;
    	let li28;
    	let t140;
    	let li29;
    	let t142;
    	let p15;
    	let small15;
    	let t144;
    	let i1;
    	let t146;
    	let p16;
    	let t147;
    	let i2;
    	let t149;
    	let t150;
    	let p17;
    	let t152;
    	let p18;
    	let small16;
    	let t154;
    	let t155;
    	let p19;
    	let small17;
    	let t157;
    	let ul7;
    	let li30;
    	let t158;
    	let code10;
    	let t160;
    	let t161;
    	let li31;
    	let t163;
    	let li32;
    	let t164;
    	let a9;
    	let t166;
    	let t167;
    	let p20;
    	let small18;
    	let t169;
    	let t170;
    	let ul8;
    	let li33;
    	let t172;
    	let li34;
    	let t174;
    	let li35;
    	let t175;
    	let i3;
    	let t176;
    	let code11;
    	let a10;
    	let t178;
    	let t179;
    	let li36;
    	let t180;
    	let a11;
    	let t182;
    	let t183;
    	let li37;
    	let t185;
    	let li38;
    	let t186;
    	let i4;
    	let t188;
    	let li39;
    	let t190;
    	let li40;
    	let t192;
    	let p21;
    	let small19;
    	let t194;
    	let t195;
    	let p22;
    	let small20;
    	let t197;
    	let t198;
    	let ul9;
    	let li41;
    	let t200;
    	let li42;
    	let t202;
    	let li43;
    	let t204;
    	let p23;
    	let small21;
    	let t206;
    	let t207;
    	let ul10;
    	let li44;
    	let t209;
    	let li45;
    	let t211;
    	let li46;
    	let t213;
    	let p24;
    	let small22;
    	let t215;
    	let t216;
    	let p25;
    	let small23;
    	let t218;
    	let t219;
    	let p26;
    	let small24;
    	let t221;
    	let i5;
    	let t223;
    	let t224;
    	let ol;
    	let li47;
    	let a12;
    	let t226;
    	let t227;
    	let li48;
    	let a13;
    	let t229;
    	let t230;
    	let p27;
    	let i6;
    	let t232;
    	let p28;
    	let small25;
    	let t234;
    	let t235;
    	let p29;
    	let small26;
    	let t237;
    	let a14;
    	let t239;
    	let t240;
    	let p30;
    	let small27;
    	let t242;
    	let a15;
    	let t244;
    	let t245;
    	let p31;
    	let small28;
    	let t247;
    	let t248;
    	let p32;
    	let small29;
    	let t250;
    	let a16;
    	let t252;
    	let t253;
    	let p33;
    	let small30;
    	let t255;
    	let t256;
    	let p34;
    	let small31;
    	let t258;
    	let code12;
    	let t263;
    	let t264;
    	let p35;
    	let small32;
    	let t266;
    	let t267;
    	let p36;
    	let small33;
    	let t269;
    	let t270;
    	let p37;
    	let small34;
    	let t272;
    	let t273;
    	let p38;
    	let small35;
    	let t275;
    	let a17;
    	let t277;
    	let a18;
    	let t279;
    	let t280;
    	let p39;
    	let small36;
    	let t282;
    	let a19;
    	let t284;
    	let t285;
    	let p40;
    	let small37;
    	let t287;
    	let i7;
    	let t289;
    	let del0;
    	let t291;
    	let a20;
    	let t293;
    	let t294;
    	let p41;
    	let small38;
    	let t296;
    	let del1;
    	let t298;
    	let t299;
    	let p42;
    	let small39;
    	let t301;
    	let del2;
    	let t303;
    	let t304;
    	let p43;
    	let small40;
    	let t306;
    	let a21;
    	let t308;
    	let i8;
    	let t310;
    	let p44;
    	let small41;
    	let t312;
    	let a22;
    	let t314;
    	let t315;
    	let p45;
    	let small42;
    	let t317;
    	let t318;
    	let p46;
    	let small43;
    	let t320;
    	let code13;
    	let t322;
    	let t323;
    	let p47;
    	let small44;
    	let t325;
    	let t326;
    	let p48;
    	let small45;
    	let t328;
    	let code14;
    	let t330;
    	let code15;
    	let t332;
    	let code16;
    	let t334;
    	let code17;
    	let t336;
    	let t337;
    	let p49;
    	let small46;
    	let t339;
    	let t340;
    	let p50;
    	let small47;
    	let t342;
    	let a23;
    	let t344;
    	let t345;
    	let p51;
    	let small48;
    	let t347;
    	let del3;
    	let t349;
    	let t350;
    	let p52;
    	let small49;
    	let t352;
    	let a24;
    	let t354;
    	let del4;
    	let t356;
    	let t357;
    	let p53;
    	let small50;
    	let t359;
    	let t360;
    	let p54;
    	let small51;
    	let t362;

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			h3 = element("h3");
    			h3.textContent = "Change Log";
    			t1 = space();
    			p0 = element("p");
    			small0 = element("small");
    			small0.textContent = "2023-07-22";
    			t3 = text("\n    Replaced Yarn with NPM, updated all dependencies and made sure, HTML videos are nicely displayed in the RSS box.");
    			t4 = space();
    			p1 = element("p");
    			small1 = element("small");
    			small1.textContent = "2021-12-11";
    			t6 = text("\n    Dependency updates and cosmetics.");
    			t7 = space();
    			p2 = element("p");
    			small2 = element("small");
    			small2.textContent = "2021-05-16";
    			t9 = text("\n    Just some minor dependency updates and a11y fixes.");
    			t10 = space();
    			p3 = element("p");
    			small3 = element("small");
    			small3.textContent = "2020-11-20";
    			t12 = text("\n    Because ");
    			a0 = element("a");
    			a0.textContent = "Big G is monetizing";
    			t14 = text(" (if not fully abandoning) one project serving the common good after another, I rewrote the ");
    			a1 = element("a");
    			a1.textContent = "JSONP services for mod_wsgi";
    			t16 = text(" to run on my own server from now on. Not much news on the front-end side, just the usual dependency upgrade and some minor fixes. I hope everything works as it should be and wish everyone all the best, especially to those who need it most in these pandemic times.");
    			t17 = space();
    			p4 = element("p");
    			small4 = element("small");
    			small4.textContent = "2020-01-06";
    			t19 = text("\n    Not sure how it really happened but I got pretty much immersed into working on this project during the holiday season… So now we got:");
    			t20 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Better caching support for feeds and referrers";
    			t22 = space();
    			li1 = element("li");
    			li1.textContent = "RSS icon next to referrer directly linking its feed URL (if available) to this app";
    			t24 = space();
    			li2 = element("li");
    			li2.textContent = "Upgrade to Svelte 3 (which was rather tedious) 😰";
    			t26 = space();
    			li3 = element("li");
    			li3.textContent = "Re-established support for older browsers (looking at you, Internet Explorer 11) 👴";
    			t28 = space();
    			li4 = element("li");
    			t29 = text("Multiple small fixes and improvements, take a look at the ");
    			a2 = element("a");
    			a2.textContent = "commit log";
    			t31 = text(" for details");
    			t32 = space();
    			p5 = element("p");
    			small5 = element("small");
    			small5.textContent = "2019-12-15";
    			t34 = text("\n    Upgraded the JSONP proxy to Python 3.7 and slightly retouched the configuration form. A merry ending for 2019 and a happy new year 🎉 ");
    			em1 = element("em");
    			t35 = text("It’s hindsight!");
    			em0 = element("em");
    			t36 = space();
    			p6 = element("p");
    			small6 = element("small");
    			small6.textContent = "2018-01-19";
    			t38 = text("\n    More than 15 years (and still counting…) after its inception this little service is still live and kicking! The best part of this hobby project’s long-running trait: this year brings a complete rewrite and overhaul with an extensive list of updates – and only small changes in functionality:");
    			t39 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			li5.textContent = "Added basic support for Atom 1.0 feeds 🔥";
    			t41 = space();
    			li6 = element("li");
    			li6.textContent = "Added support for multiple enclosures (RSS 0.93)";
    			t43 = space();
    			li7 = element("li");
    			li7.textContent = "Replaced value of -1 for automatic content height with “empty” value";
    			t45 = space();
    			li8 = element("li");
    			li8.textContent = "Added support for “empty” value to box width (now called ”max. width”)";
    			t47 = space();
    			li9 = element("li");
    			li9.textContent = "Reduced total size of embedded download by more than 60% ⚡";
    			t49 = space();
    			li10 = element("li");
    			li10.textContent = "Increased performance of loading and rendering boxes";
    			t51 = space();
    			li11 = element("li");
    			li11.textContent = "Implemented responsive CSS for both, boxes and configuration app";
    			t53 = space();
    			li12 = element("li");
    			li12.textContent = "Replaced bitmap icons with scalable vector graphics";
    			t55 = space();
    			li13 = element("li");
    			t56 = text("Completely rewrote the app code using ");
    			a3 = element("a");
    			a3.textContent = "Svelte";
    			t58 = text(" and ");
    			a4 = element("a");
    			a4.textContent = "min.css";
    			t60 = space();
    			li14 = element("li");
    			li14.textContent = "Replaced remaining jQuery code with vanilla JavaScript";
    			t62 = space();
    			li15 = element("li");
    			li15.textContent = "Migrated build scripts to Rollup and Yarn";
    			t64 = space();
    			li16 = element("li");
    			t65 = text("Added support for missing browser features via ");
    			a5 = element("a");
    			a5.textContent = "polyfills.io";
    			t67 = space();
    			li17 = element("li");
    			li17.textContent = "Discontinued support for older browsers (MSIE < 11)";
    			t69 = space();
    			li18 = element("li");
    			li18.textContent = "Bumped major version to 18 (aka the year), getting rid of semantic versioning due to lack of semantics 🐱";
    			t71 = space();
    			p7 = element("p");
    			small7 = element("small");
    			small7.textContent = "2016-03-12";
    			t73 = text("\n    Completely rewrote build environment using WebPack. Switched the ");
    			a6 = element("a");
    			a6.textContent = "source repository";
    			t75 = text(" from SVN to Git, hosted at Github. This deserves a new major version number!");
    			t76 = space();
    			p8 = element("p");
    			small8 = element("small");
    			small8.textContent = "2012-12-30";
    			t78 = text("\n    Added simple code to modify the width attribute of iframe, object and embed elements to make them fit in the box. Also: bumped version. ");
    			i0 = element("i");
    			i0.textContent = "A happy new year 2013, everbody!";
    			t80 = space();
    			p9 = element("p");
    			small9 = element("small");
    			small9.textContent = "2012-10-26";
    			t82 = text("\n    Added section about Creative Commons License, below. In other words: you can now legally run my code on your own server. (You even could remove the tiny reference to this page in the footer of the box.) However, I would like to ask you for two things if you want to do so:");
    			t83 = space();
    			ul2 = element("ul");
    			li19 = element("li");
    			t84 = text("Use your own ");
    			a7 = element("a");
    			a7.textContent = "JSONP proxy";
    			t86 = text(" – especially, when you expect a high load on your server.");
    			t87 = space();
    			li20 = element("li");
    			t88 = text("Please support the service with a ");
    			a8 = element("a");
    			a8.textContent = "donation";
    			t90 = text(".");
    			t91 = space();
    			p10 = element("p");
    			small10 = element("small");
    			small10.textContent = "2012-08-01";
    			t93 = text("\n    Added two new, experimental features – and thus, increased version to 3.3:");
    			t94 = space();
    			ul3 = element("ul");
    			li21 = element("li");
    			t95 = text("The height of the inner box content can now be defined by a pixel value. If the height is less than the space needed by the desired amount of items you can vertically scroll the content. A value of ");
    			code0 = element("code");
    			code0.textContent = "-1";
    			t97 = text(" enables the default behavior and automatically sets the height according to the displaying items.");
    			t98 = space();
    			li22 = element("li");
    			li22.textContent = "The so-called “headless” mode removes the titlebar and the frame from the box. This way the box can be used more flexibly in special situations. However, this feature somehow undermines an RSS feed’s authority so I count on your fairness to give credit where credit is due!";
    			t100 = space();
    			p11 = element("p");
    			small11 = element("small");
    			small11.textContent = "2012-07-16";
    			t102 = text("\n    Slightly modified output of the HTML code to be usable with both, unsecured and secured (HTTPS) web servers. You can update already embedded code easily by removing the ");
    			code1 = element("code");
    			code1.textContent = "http:";
    			t104 = text(" part from the ");
    			code2 = element("code");
    			code2.textContent = "src";
    			t106 = text(" attribute of the ");
    			code3 = element("code");
    			code3.textContent = "<script>";
    			t108 = text(" element: ");
    			code4 = element("code");
    			code4.textContent = "<script src='http://p3k.org/rss…'>";
    			t110 = text(" becomes ");
    			code5 = element("code");
    			code5.textContent = "<script src='//p3k.org/rss…'>";
    			t112 = text(".");
    			t113 = space();
    			p12 = element("p");
    			small12 = element("small");
    			small12.textContent = "2012-07-13";
    			t115 = space();
    			ul4 = element("ul");
    			li23 = element("li");
    			t116 = text("Fixed IE bug (“innerHTML is null or not an object”) caused by using jQuery’s html() method instead of text() when parsing a ");
    			code6 = element("code");
    			code6.textContent = "<content:encoded>";
    			t118 = text(" element.");
    			t119 = space();
    			li24 = element("li");
    			t120 = text("Changed priority of elements: only check for ");
    			code7 = element("code");
    			code7.textContent = "<content:encoded>";
    			t122 = text(" if     ");
    			code8 = element("code");
    			code8.textContent = "<description>";
    			t124 = text(" is not available.");
    			t125 = space();
    			p13 = element("p");
    			small13 = element("small");
    			small13.textContent = "2012-06-04";
    			t127 = space();
    			ul5 = element("ul");
    			li25 = element("li");
    			li25.textContent = "Implemented small routine to resize images contained in the feed content to fit in the box.";
    			t129 = space();
    			li26 = element("li");
    			li26.textContent = "Added support for new HTML5 form input types and their validation.";
    			t131 = space();
    			p14 = element("p");
    			small14 = element("small");
    			small14.textContent = "2012-05-31";
    			t133 = text("\n    Gone βeta! – with three tiny additons:");
    			t134 = space();
    			ul6 = element("ul");
    			li27 = element("li");
    			t135 = text("Added ");
    			code9 = element("code");
    			code9.textContent = "<noscript>";
    			t137 = text(" element for browsers providing no JavaScript engine.");
    			t138 = space();
    			li28 = element("li");
    			li28.textContent = "Added option to call the configurator with a URL in the query string.";
    			t140 = space();
    			li29 = element("li");
    			li29.textContent = "Added a link to the W3C feed validator to the contents of a box displaying an RSS error.";
    			t142 = space();
    			p15 = element("p");
    			small15 = element("small");
    			small15.textContent = "2012-05-19";
    			t144 = text("\n    Apologies for the RSS Boxes not showing up on your pages during the last few days. I made a stupid mistake that caused only the setup page to render correctly – and I did not check any embedded script. ");
    			i1 = element("i");
    			i1.textContent = "Bummer!";
    			t146 = space();
    			p16 = element("p");
    			t147 = text("At least now everything should be back to normal. (I hope this incident did not sabotage the Flattr button I added in the meantime… ");
    			i2 = element("i");
    			i2.textContent = "wink, wink!";
    			t149 = text(")");
    			t150 = space();
    			p17 = element("p");
    			p17.textContent = "Anyway, thanks for your understanding.";
    			t152 = space();
    			p18 = element("p");
    			small16 = element("small");
    			small16.textContent = "2012-05-16";
    			t154 = text("\n    I think I did not mention, yet, that the current incarnation of the code is totally disconnected from the version as of 2009. Each is using their own codebase, the legacy code was not modified at all and thus, it is not affected by any recent changes. You can check which version you are using by looking at the script URL. If it contains the string “proxy.r” you get the “classic” RSS Box rendering. The modernized version calls “index.js”. Nevertheless, you cannot setup boxes with the old URL anymore.");
    			t155 = space();
    			p19 = element("p");
    			small17 = element("small");
    			small17.textContent = "2012-05-09";
    			t157 = space();
    			ul7 = element("ul");
    			li30 = element("li");
    			t158 = text("Added support for ");
    			code10 = element("code");
    			code10.textContent = "<content:encoded>";
    			t160 = text(" element.");
    			t161 = space();
    			li31 = element("li");
    			li31.textContent = "Implemented Memcache usage in AppEngine code.";
    			t163 = space();
    			li32 = element("li");
    			t164 = text("Beautified this page by using the ");
    			a9 = element("a");
    			a9.textContent = "Google’s Droid Serif font";
    			t166 = text(".");
    			t167 = space();
    			p20 = element("p");
    			small18 = element("small");
    			small18.textContent = "2012-04-26";
    			t169 = text("\n    Amazing! A new version! After more than two years hiatus I completely rewrote the codebase and framework:");
    			t170 = space();
    			ul8 = element("ul");
    			li33 = element("li");
    			li33.textContent = "Removed dependency to Rebol using a small JSONP proxy at Google’s AppEngine.";
    			t172 = space();
    			li34 = element("li");
    			li34.textContent = "Rewrote XML parsing, replacing native methods with jQuery ones.";
    			t174 = space();
    			li35 = element("li");
    			t175 = text("Cleaned up HTML output for the RSS Box, replacing tables with divs. ");
    			i3 = element("i");
    			t176 = text("Note: You might need to add ");
    			code11 = element("code");
    			a10 = element("a");
    			a10.textContent = "!important";
    			t178 = text(" to your custom RSS Box stylesheet definitions.");
    			t179 = space();
    			li36 = element("li");
    			t180 = text("Replaced fugly colorpicker in configurator with the ");
    			a11 = element("a");
    			a11.textContent = "MiniColors jQuery plugin";
    			t182 = text(".");
    			t183 = space();
    			li37 = element("li");
    			li37.textContent = "Added link color setting and style attributes for correctly applying color settings.";
    			t185 = space();
    			li38 = element("li");
    			t186 = text("Added corner radius setting. ");
    			i4 = element("i");
    			i4.textContent = "Note: does not work in IE8 and earlier versions.";
    			t188 = space();
    			li39 = element("li");
    			li39.textContent = "Added font size to the font face setting.";
    			t190 = space();
    			li40 = element("li");
    			li40.textContent = "Removed align setting from configurator (still works in script tags generated with earlier versions).";
    			t192 = space();
    			p21 = element("p");
    			small19 = element("small");
    			small19.textContent = "2009-12-13";
    			t194 = text("\n    Switched output of this page to HTML5 and made some adaptations in the HTML code and CSS stylesheet. Updated version string to 2.1, finally!");
    			t195 = space();
    			p22 = element("p");
    			small20 = element("small");
    			small20.textContent = "2009-09-28";
    			t197 = text("\n    Some minor changes after a while:");
    			t198 = space();
    			ul9 = element("ul");
    			li41 = element("li");
    			li41.textContent = "Refactored date parsing to show actual build dates more reliably";
    			t200 = space();
    			li42 = element("li");
    			li42.textContent = "Refactored caching routine (only in online version)";
    			t202 = space();
    			li43 = element("li");
    			li43.textContent = "Updated version string to 2.1b, approaching another final version.";
    			t204 = space();
    			p23 = element("p");
    			small21 = element("small");
    			small21.textContent = "2008-02-19";
    			t206 = text("\n    Seems there were some changes in the air as I did not plan another update but here comes version 2.1 bringing to you:");
    			t207 = space();
    			ul10 = element("ul");
    			li44 = element("li");
    			li44.textContent = "Full client-side processing (only the raw feed data is fetched from the server).";
    			t209 = space();
    			li45 = element("li");
    			li45.textContent = "User-friendlier interface with color pickers, status and error display as well as instant feedback on any change in setup.";
    			t211 = space();
    			li46 = element("li");
    			li46.textContent = "And finally (drumroll!) Unicode support at least at this installation of the viewer. (Ie. the downloaded version still will output ASCII only.)";
    			t213 = space();
    			p24 = element("p");
    			small22 = element("small");
    			small22.textContent = "2008-02-03";
    			t215 = text("\n    Made some more improvements especially regarding the error handling and output. From now on it should be much clearer what’s wrong with a very RSS Box. Since there’s now a lot more of client-side JavaScript code involved I tested the script in four major browsers that are available to me: Internet Explorer 7, Firefox 2.0, Opera 9.25 and Safari 3.");
    			t216 = space();
    			p25 = element("p");
    			small23 = element("small");
    			small23.textContent = "2008-02-01";
    			t218 = text("\n    Completely revised server- and client-side code. XML rendering is now done in the browser which speeds up things and decreases the load on the server. Furthermore, the list of referrers is now loaded on demand via AJAX and thus not rendered with every request. Finally, I retouched the setup form interface and cleaned up both HTML and CSS.");
    			t219 = space();
    			p26 = element("p");
    			small24 = element("small");
    			small24.textContent = "2006-12-20";
    			t221 = text("\n    I am very glad that my old little script is gaining even more attention after all these years…    ");
    			i5 = element("i");
    			i5.textContent = "Thank you very much indeed!";
    			t223 = text(" Since there are coming in more and more of the same requests and I am really not able to handle them (apologies!), here is some advice for everyone:");
    			t224 = space();
    			ol = element("ol");
    			li47 = element("li");
    			a12 = element("a");
    			a12.textContent = "Use cascading style sheets";
    			t226 = text(" (CSS) to change font sizes (and to generally define your layout).");
    			t227 = space();
    			li48 = element("li");
    			a13 = element("a");
    			a13.textContent = "Beware of opening links in a new window.";
    			t229 = text(" It’s offensive to your readers.");
    			t230 = space();
    			p27 = element("p");
    			i6 = element("i");
    			i6.textContent = "A happy end for 2006!";
    			t232 = space();
    			p28 = element("p");
    			small25 = element("small");
    			small25.textContent = "2006-06-13";
    			t234 = text("\n    Did some minor bug fixing again (amongst others replacing single quotes with ' and not \" entities). Furthermore (and finally), I removed the “RC” (as in “Release Candidate”) from the document title…");
    			t235 = space();
    			p29 = element("p");
    			small26 = element("small");
    			small26.textContent = "2006-06-12";
    			t237 = text("\n    Gary informed me that longer feed URLs cause trouble and the feed box will not be displayed. That’s in fact a bug, but unfortunately one that cannot be fixed so easily. My suggestion is to shorten such URLs at one of the websites around that provide such a service, e.g. ");
    			a14 = element("a");
    			a14.textContent = "tinyurl.com";
    			t239 = text(".");
    			t240 = space();
    			p30 = element("p");
    			small27 = element("small");
    			small27.textContent = "2006-04-23";
    			t242 = text("\n    Switched the ");
    			a15 = element("a");
    			a15.textContent = "source repository";
    			t244 = text(" from CVS to Subversion (SVN).");
    			t245 = space();
    			p31 = element("p");
    			small28 = element("small");
    			small28.textContent = "2006-04-20";
    			t247 = text("\n    Andrew Pam brought up a serious issue that probably might have affected some more people already: the viewer does not support UTF-8 (or Unicode, resp.) Unfortunately, this is “built-in” into the underlying scripting language (aka Rebol). I’m sorry to cancel those tickets… :(");
    			t248 = space();
    			p32 = element("p");
    			small29 = element("small");
    			small29.textContent = "2006-04-13";
    			t250 = text("\n    Fixed a bug reported by Mando Gomez that caused feeds using the <guid> element being displayed without item links… Don’t forget to check out Mando’s excellent website ");
    			a16 = element("a");
    			a16.textContent = "mandolux";
    			t252 = text("!");
    			t253 = space();
    			p33 = element("p");
    			small30 = element("small");
    			small30.textContent = "2006-04-12";
    			t255 = text("\n    Obviously Sam Ruby changed his feed format from scriptingNews to Atom; which renders my example link above pretty useless… So far I don’t know about any other scriptingNews feed, do you?");
    			t256 = space();
    			p34 = element("p");
    			small31 = element("small");
    			small31.textContent = "2006-02-20";
    			t258 = text("\n    I hope nobody minds the little line I added at the bottom of each RSS box… Of course, it’s not totally altruistic, but probably some people will find it informative. However, if you want to prevent it from being displayed simply add ");
    			code12 = element("code");
    			code12.textContent = `.rssbox-promo ${"{"}display: none;${"}"}`;
    			t263 = text(" to your stylesheet.");
    			t264 = space();
    			p35 = element("p");
    			small32 = element("small");
    			small32.textContent = "2006-01-11";
    			t266 = text("\n    New server, new troubles: I moved the viewer to a newly setup Ubuntu machine. Of course, I forgot to set some permission flags and owners, thus, preventing the script from working. However, I think everything is fixed and working again.");
    			t267 = space();
    			p36 = element("p");
    			small33 = element("small");
    			small33.textContent = "2005-11-16";
    			t269 = text("\n    Just testing Google’s AdSense for a while. Since this page generates most of my traffic I wanted to see myself what a banner can do here. Hope you don’t mind.");
    			t270 = space();
    			p37 = element("p");
    			small34 = element("small");
    			small34.textContent = "2004-12-16";
    			t272 = text("\n    Bugfix: Sometimes the logfile which is used to generate the list of sites using this script gets corrupted. This affected the whole setup page to return an error and thus, it needed to be caught. (You will see a “currently out of order” message then.)");
    			t273 = space();
    			p38 = element("p");
    			small35 = element("small");
    			small35.textContent = "2004-04-26";
    			t275 = text("\n    Last efforts to officially release the ");
    			a17 = element("a");
    			a17.textContent = "code";
    			t277 = text(" to the open source community. There have been some bugs in the (image) rendering framework which I fixed so    far. I now include a dynamically rendered list of sites using (or pointing to) this script to give some examples for the curious at heart (me included). Finally, there’s a ");
    			a18 = element("a");
    			a18.textContent = "README";
    			t279 = text(" file with a short installation guide to make the script run on your own server.");
    			t280 = space();
    			p39 = element("p");
    			small36 = element("small");
    			small36.textContent = "2004-01-28";
    			t282 = text("\n    When something goes wrong (most of the time this might be a wrong URL, ie. a 404 as result) an    ");
    			a19 = element("a");
    			a19.textContent = "“error” box";
    			t284 = text(" will be displayed to signal the failure. Increased version up to 1.0 and labeled it as release candidate\n    (RC).");
    			t285 = space();
    			p40 = element("p");
    			small37 = element("small");
    			small37.textContent = "2004-01-26";
    			t287 = text("\n    Retouched the code in a very last effort to make the script running stand-alone (with Rebol but    ");
    			i7 = element("i");
    			i7.textContent = "without";
    			t289 = text(" PHP, that is). Everything needed is now in ");
    			del0 = element("del");
    			del0.textContent = "CVS";
    			t291 = text(" SVN so everybody can download from there. Potentially, a few minor bug fixes might follow short-term. Uh, and the HTML code is ");
    			a20 = element("a");
    			a20.textContent = "valid XHTML 1.0";
    			t293 = text(" now.");
    			t294 = space();
    			p41 = element("p");
    			small38 = element("small");
    			small38.textContent = "2003-12-12";
    			t296 = text("\n    The mirror at ");
    			del1 = element("del");
    			del1.textContent = "http://publish.curry.com/rss/";
    			t298 = text(" is not working for quite a long time. I tried to contact Adam Curry but so far without success.");
    			t299 = space();
    			p42 = element("p");
    			small39 = element("small");
    			small39.textContent = "2003-03-30";
    			t301 = text("\n    Moved to new server with new domain ");
    			del2 = element("del");
    			del2.textContent = "forever.p3k.org";
    			t303 = text(".");
    			t304 = space();
    			p43 = element("p");
    			small40 = element("small");
    			small40.textContent = "2003-03-25";
    			t306 = text("\n    Updated Rebol to ");
    			a21 = element("a");
    			a21.textContent = "version 2.5.5";
    			t308 = text(". End of Rebol’s “DNS zombies” in the process list.\n    ");
    			i8 = element("i");
    			i8.textContent = "Finally.";
    			t310 = space();
    			p44 = element("p");
    			small41 = element("small");
    			small41.textContent = "2002-02-19";
    			t312 = text("\n    Added a very nice quote from ");
    			a22 = element("a");
    			a22.textContent = "Abbe Normal";
    			t314 = text(" on top right of this document.");
    			t315 = space();
    			p45 = element("p");
    			small42 = element("small");
    			small42.textContent = "2001-11-17";
    			t317 = text("\n    If you want a more compact view of the RSS box you can get it now using the corresponding checkbox. If it is enabled the descriptions of each item will not be displayed – given that the item title is defined (otherwise there would not be much to see). Additionally, the channel image (if defined) will not be displayed. Thanks jsyeo@compuserve.com for the suggestions!");
    			t318 = space();
    			p46 = element("p");
    			small43 = element("small");
    			small43.textContent = "2001-09-21";
    			t320 = text("\n    Since today the ");
    			code13 = element("code");
    			code13.textContent = "textinput";
    			t322 = text(" tag is supported. It creates an appropriate form at the end of the box. Moreover, two bugs were fixed: one caused unnecessary information in the query string of the generated JavaScript tag. The other affected the display of the date’s time zone. Time zones now are generally displayed in GMT except where another time zone acronym is defined.");
    			t323 = space();
    			p47 = element("p");
    			small44 = element("small");
    			small44.textContent = "2001-09-04";
    			t325 = text("\n    Added icons for enclosure and source; added XML button checkbox to enable output of the quasi-standard orange button linking to the XML source (ideaby adam@curry.com).");
    			t326 = space();
    			p48 = element("p");
    			small45 = element("small");
    			small45.textContent = "2001-09-03";
    			t328 = text("\n    It’s now possible to refine the style of the whole box using the newly implemented css classes ");
    			code14 = element("code");
    			code14.textContent = "rssbox-title";
    			t330 = text(", ");
    			code15 = element("code");
    			code15.textContent = "rssbox-content";
    			t332 = text(", ");
    			code16 = element("code");
    			code16.textContent = "rssbox-item-title";
    			t334 = text(" and ");
    			code17 = element("code");
    			code17.textContent = "rssbox-ttem-content";
    			t336 = text(" (idea by rdavies@orientpacific.com).");
    			t337 = space();
    			p49 = element("p");
    			small46 = element("small");
    			small46.textContent = "2001-08-24";
    			t339 = text("\n    Added a form input for limiting the item display. The number determines how many items will be shown in the box (seven is the default value). Good for often updated channels.");
    			t340 = space();
    			p50 = element("p");
    			small47 = element("small");
    			small47.textContent = "2001-08-15";
    			t342 = text("\n    Detected a strange bug that prevented the viewer at ");
    			a23 = element("a");
    			a23.textContent = "curry.com";
    			t344 = text(" loading http://p3k.org/rss.xml while http://www.p3k.org/rss.xml was no problem at all. Upgrading the Rebol installation to the current version solved theproblem, however the cause remains unclear…");
    			t345 = space();
    			p51 = element("p");
    			small48 = element("small");
    			small48.textContent = "2001-08-08";
    			t347 = text("\n    Fixed a small bug that corrupted channel URLs containing a query (as reported by kika@sloleht.ee). Configured server redirect from ");
    			del3 = element("del");
    			del3.textContent = "http://piefke.helma.at/rss";
    			t349 = text(".");
    			t350 = space();
    			p52 = element("p");
    			small49 = element("small");
    			small49.textContent = "2001-08-05";
    			t352 = text("\n    Thanks to ");
    			a24 = element("a");
    			a24.textContent = "Adam Curry";
    			t354 = text(", the viewer is now mirrored at ");
    			del4 = element("del");
    			del4.textContent = "http://publish.curry.com/rss";
    			t356 = text(".");
    			t357 = space();
    			p53 = element("p");
    			small50 = element("small");
    			small50.textContent = "2001-07-30";
    			t359 = text("\n    Added link to source code; added example links for all supported formats.");
    			t360 = space();
    			p54 = element("p");
    			small51 = element("small");
    			small51.textContent = "2001-05-30";
    			t362 = text("\n    Fixed a little bug reported by fredi@email.ee that caused diacritic characters to be displayed as entity codes.");
    			attr_dev(h3, "class", "svelte-y33bja");
    			add_location(h3, file$a, 32, 4, 368);
    			attr_dev(summary, "class", "svelte-y33bja");
    			add_location(summary, file$a, 31, 2, 354);
    			attr_dev(small0, "class", "svelte-y33bja");
    			add_location(small0, file$a, 36, 4, 412);
    			attr_dev(p0, "class", "svelte-y33bja");
    			add_location(p0, file$a, 35, 2, 404);
    			attr_dev(small1, "class", "svelte-y33bja");
    			add_location(small1, file$a, 41, 4, 573);
    			add_location(p1, file$a, 40, 2, 565);
    			attr_dev(small2, "class", "svelte-y33bja");
    			add_location(small2, file$a, 46, 4, 655);
    			add_location(p2, file$a, 45, 2, 647);
    			attr_dev(small3, "class", "svelte-y33bja");
    			add_location(small3, file$a, 51, 4, 754);
    			attr_dev(a0, "href", "https://cloud.google.com/appengine/");
    			add_location(a0, file$a, 52, 12, 792);
    			attr_dev(a1, "href", "https://github.com/p3k/json3k");
    			add_location(a1, file$a, 52, 173, 953);
    			add_location(p3, file$a, 50, 2, 746);
    			attr_dev(small4, "class", "svelte-y33bja");
    			add_location(small4, file$a, 56, 4, 1307);
    			add_location(p4, file$a, 55, 2, 1299);
    			attr_dev(li0, "class", "svelte-y33bja");
    			add_location(li0, file$a, 60, 4, 1489);
    			attr_dev(li1, "class", "svelte-y33bja");
    			add_location(li1, file$a, 61, 4, 1549);
    			attr_dev(li2, "class", "svelte-y33bja");
    			add_location(li2, file$a, 62, 4, 1645);
    			attr_dev(li3, "class", "svelte-y33bja");
    			add_location(li3, file$a, 63, 4, 1708);
    			attr_dev(a2, "href", "https://github.com/p3k/rss-box/commits/master");
    			add_location(a2, file$a, 64, 66, 1867);
    			attr_dev(li4, "class", "svelte-y33bja");
    			add_location(li4, file$a, 64, 4, 1805);
    			add_location(ul0, file$a, 59, 2, 1480);
    			attr_dev(small5, "class", "svelte-y33bja");
    			add_location(small5, file$a, 68, 4, 1974);
    			add_location(em0, file$a, 69, 157, 2157);
    			add_location(em1, file$a, 69, 138, 2138);
    			add_location(p5, file$a, 67, 2, 1966);
    			attr_dev(small6, "class", "svelte-y33bja");
    			add_location(small6, file$a, 73, 4, 2180);
    			add_location(p6, file$a, 72, 2, 2172);
    			attr_dev(li5, "class", "svelte-y33bja");
    			add_location(li5, file$a, 77, 4, 2520);
    			attr_dev(li6, "class", "svelte-y33bja");
    			add_location(li6, file$a, 78, 4, 2575);
    			attr_dev(li7, "class", "svelte-y33bja");
    			add_location(li7, file$a, 79, 4, 2637);
    			attr_dev(li8, "class", "svelte-y33bja");
    			add_location(li8, file$a, 80, 4, 2719);
    			attr_dev(li9, "class", "svelte-y33bja");
    			add_location(li9, file$a, 81, 4, 2803);
    			attr_dev(li10, "class", "svelte-y33bja");
    			add_location(li10, file$a, 82, 4, 2875);
    			attr_dev(li11, "class", "svelte-y33bja");
    			add_location(li11, file$a, 83, 4, 2941);
    			attr_dev(li12, "class", "svelte-y33bja");
    			add_location(li12, file$a, 84, 4, 3019);
    			attr_dev(a3, "href", "https://svelte.technology");
    			add_location(a3, file$a, 85, 46, 3126);
    			attr_dev(a4, "href", "https://mincss.com/");
    			add_location(a4, file$a, 85, 97, 3177);
    			attr_dev(li13, "class", "svelte-y33bja");
    			add_location(li13, file$a, 85, 4, 3084);
    			attr_dev(li14, "class", "svelte-y33bja");
    			add_location(li14, file$a, 86, 4, 3228);
    			attr_dev(li15, "class", "svelte-y33bja");
    			add_location(li15, file$a, 87, 4, 3296);
    			attr_dev(a5, "href", "https://polyfills.io");
    			add_location(a5, file$a, 88, 55, 3402);
    			attr_dev(li16, "class", "svelte-y33bja");
    			add_location(li16, file$a, 88, 4, 3351);
    			attr_dev(li17, "class", "svelte-y33bja");
    			add_location(li17, file$a, 89, 4, 3459);
    			attr_dev(li18, "class", "svelte-y33bja");
    			add_location(li18, file$a, 90, 4, 3527);
    			add_location(ul1, file$a, 76, 2, 2511);
    			attr_dev(small7, "class", "svelte-y33bja");
    			add_location(small7, file$a, 94, 4, 3661);
    			attr_dev(a6, "href", "https://github.com/p3k/rss-box");
    			add_location(a6, file$a, 95, 69, 3756);
    			add_location(p7, file$a, 93, 2, 3653);
    			attr_dev(small8, "class", "svelte-y33bja");
    			add_location(small8, file$a, 99, 4, 3914);
    			add_location(i0, file$a, 100, 140, 4080);
    			add_location(p8, file$a, 98, 2, 3906);
    			attr_dev(small9, "class", "svelte-y33bja");
    			add_location(small9, file$a, 104, 4, 4138);
    			add_location(p9, file$a, 103, 2, 4130);
    			attr_dev(a7, "href", "https://github.com/p3k/json3k");
    			add_location(a7, file$a, 109, 19, 4483);
    			attr_dev(li19, "class", "svelte-y33bja");
    			add_location(li19, file$a, 108, 4, 4459);
    			attr_dev(a8, "href", "http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer");
    			add_location(a8, file$a, 112, 40, 4656);
    			attr_dev(li20, "class", "svelte-y33bja");
    			add_location(li20, file$a, 111, 4, 4611);
    			add_location(ul2, file$a, 107, 2, 4450);
    			attr_dev(small10, "class", "svelte-y33bja");
    			add_location(small10, file$a, 117, 4, 4766);
    			add_location(p10, file$a, 116, 2, 4758);
    			attr_dev(code0, "class", "svelte-y33bja");
    			add_location(code0, file$a, 122, 204, 5098);
    			attr_dev(li21, "class", "svelte-y33bja");
    			add_location(li21, file$a, 121, 4, 4889);
    			attr_dev(li22, "class", "svelte-y33bja");
    			add_location(li22, file$a, 124, 4, 5226);
    			add_location(ul3, file$a, 120, 2, 4880);
    			attr_dev(small11, "class", "svelte-y33bja");
    			add_location(small11, file$a, 130, 4, 5540);
    			attr_dev(code1, "class", "svelte-y33bja");
    			add_location(code1, file$a, 131, 173, 5739);
    			attr_dev(code2, "class", "svelte-y33bja");
    			add_location(code2, file$a, 131, 206, 5772);
    			attr_dev(code3, "class", "svelte-y33bja");
    			add_location(code3, file$a, 131, 240, 5806);
    			attr_dev(code4, "class", "svelte-y33bja");
    			add_location(code4, file$a, 131, 277, 5843);
    			attr_dev(code5, "class", "svelte-y33bja");
    			add_location(code5, file$a, 131, 339, 5905);
    			add_location(p11, file$a, 129, 2, 5532);
    			attr_dev(small12, "class", "svelte-y33bja");
    			add_location(small12, file$a, 135, 4, 5973);
    			add_location(p12, file$a, 134, 2, 5965);
    			attr_dev(code6, "class", "svelte-y33bja");
    			add_location(code6, file$a, 139, 130, 6152);
    			attr_dev(li23, "class", "svelte-y33bja");
    			add_location(li23, file$a, 138, 4, 6017);
    			attr_dev(code7, "class", "svelte-y33bja");
    			add_location(code7, file$a, 142, 51, 6268);
    			attr_dev(code8, "class", "svelte-y33bja");
    			add_location(code8, file$a, 142, 95, 6312);
    			attr_dev(li24, "class", "svelte-y33bja");
    			add_location(li24, file$a, 141, 4, 6212);
    			add_location(ul4, file$a, 137, 2, 6008);
    			attr_dev(small13, "class", "svelte-y33bja");
    			add_location(small13, file$a, 147, 4, 6392);
    			add_location(p13, file$a, 146, 2, 6384);
    			attr_dev(li25, "class", "svelte-y33bja");
    			add_location(li25, file$a, 150, 4, 6436);
    			attr_dev(li26, "class", "svelte-y33bja");
    			add_location(li26, file$a, 153, 4, 6553);
    			add_location(ul5, file$a, 149, 2, 6427);
    			attr_dev(small14, "class", "svelte-y33bja");
    			add_location(small14, file$a, 159, 4, 6660);
    			add_location(p14, file$a, 158, 2, 6652);
    			attr_dev(code9, "class", "svelte-y33bja");
    			add_location(code9, file$a, 164, 12, 6769);
    			attr_dev(li27, "class", "svelte-y33bja");
    			add_location(li27, file$a, 163, 4, 6752);
    			attr_dev(li28, "class", "svelte-y33bja");
    			add_location(li28, file$a, 166, 4, 6866);
    			attr_dev(li29, "class", "svelte-y33bja");
    			add_location(li29, file$a, 169, 4, 6961);
    			add_location(ul6, file$a, 162, 2, 6743);
    			attr_dev(small15, "class", "svelte-y33bja");
    			add_location(small15, file$a, 175, 4, 7090);
    			add_location(i1, file$a, 176, 206, 7322);
    			add_location(p15, file$a, 174, 2, 7082);
    			add_location(i2, file$a, 179, 136, 7486);
    			add_location(p16, file$a, 178, 2, 7346);
    			add_location(p17, file$a, 181, 2, 7515);
    			attr_dev(small16, "class", "svelte-y33bja");
    			add_location(small16, file$a, 184, 4, 7572);
    			add_location(p18, file$a, 183, 2, 7564);
    			attr_dev(small17, "class", "svelte-y33bja");
    			add_location(small17, file$a, 189, 4, 8125);
    			add_location(p19, file$a, 188, 2, 8117);
    			attr_dev(code10, "class", "svelte-y33bja");
    			add_location(code10, file$a, 193, 24, 8198);
    			attr_dev(li30, "class", "svelte-y33bja");
    			add_location(li30, file$a, 192, 4, 8169);
    			attr_dev(li31, "class", "svelte-y33bja");
    			add_location(li31, file$a, 195, 4, 8258);
    			attr_dev(a9, "href", "http://www.google.com/webfonts/specimen/Droid+Serif");
    			add_location(a9, file$a, 199, 40, 8374);
    			attr_dev(li32, "class", "svelte-y33bja");
    			add_location(li32, file$a, 198, 4, 8329);
    			add_location(ul7, file$a, 191, 2, 8160);
    			attr_dev(small18, "class", "svelte-y33bja");
    			add_location(small18, file$a, 204, 4, 8496);
    			add_location(p20, file$a, 203, 2, 8488);
    			attr_dev(li33, "class", "svelte-y33bja");
    			add_location(li33, file$a, 208, 4, 8650);
    			attr_dev(li34, "class", "svelte-y33bja");
    			add_location(li34, file$a, 211, 4, 8752);
    			attr_dev(a10, "href", "http://coding.smashingmagazine.com/2010/11/02/the-important-css-declaration-how-and-when-to-use-it/");
    			add_location(a10, file$a, 215, 111, 8957);
    			attr_dev(code11, "class", "svelte-y33bja");
    			add_location(code11, file$a, 215, 105, 8951);
    			add_location(i3, file$a, 215, 74, 8920);
    			attr_dev(li35, "class", "svelte-y33bja");
    			add_location(li35, file$a, 214, 4, 8841);
    			attr_dev(a11, "href", "https://github.com/claviska/jquery-miniColors/");
    			add_location(a11, file$a, 218, 58, 9217);
    			attr_dev(li36, "class", "svelte-y33bja");
    			add_location(li36, file$a, 217, 4, 9154);
    			attr_dev(li37, "class", "svelte-y33bja");
    			add_location(li37, file$a, 220, 4, 9318);
    			add_location(i4, file$a, 224, 35, 9468);
    			attr_dev(li38, "class", "svelte-y33bja");
    			add_location(li38, file$a, 223, 4, 9428);
    			attr_dev(li39, "class", "svelte-y33bja");
    			add_location(li39, file$a, 226, 4, 9538);
    			attr_dev(li40, "class", "svelte-y33bja");
    			add_location(li40, file$a, 229, 4, 9605);
    			add_location(ul8, file$a, 207, 2, 8641);
    			attr_dev(small19, "class", "svelte-y33bja");
    			add_location(small19, file$a, 235, 4, 9747);
    			add_location(p21, file$a, 234, 2, 9739);
    			attr_dev(small20, "class", "svelte-y33bja");
    			add_location(small20, file$a, 240, 4, 9936);
    			add_location(p22, file$a, 239, 2, 9928);
    			attr_dev(li41, "class", "svelte-y33bja");
    			add_location(li41, file$a, 244, 4, 10018);
    			attr_dev(li42, "class", "svelte-y33bja");
    			add_location(li42, file$a, 245, 4, 10096);
    			attr_dev(li43, "class", "svelte-y33bja");
    			add_location(li43, file$a, 246, 4, 10161);
    			add_location(ul9, file$a, 243, 2, 10009);
    			attr_dev(small21, "class", "svelte-y33bja");
    			add_location(small21, file$a, 250, 4, 10256);
    			add_location(p23, file$a, 249, 2, 10248);
    			attr_dev(li44, "class", "svelte-y33bja");
    			add_location(li44, file$a, 254, 4, 10422);
    			attr_dev(li45, "class", "svelte-y33bja");
    			add_location(li45, file$a, 257, 4, 10528);
    			attr_dev(li46, "class", "svelte-y33bja");
    			add_location(li46, file$a, 260, 4, 10676);
    			add_location(ul10, file$a, 253, 2, 10413);
    			attr_dev(small22, "class", "svelte-y33bja");
    			add_location(small22, file$a, 266, 4, 10860);
    			add_location(p24, file$a, 265, 2, 10852);
    			attr_dev(small23, "class", "svelte-y33bja");
    			add_location(small23, file$a, 271, 4, 11257);
    			add_location(p25, file$a, 270, 2, 11249);
    			attr_dev(small24, "class", "svelte-y33bja");
    			add_location(small24, file$a, 276, 4, 11646);
    			add_location(i5, file$a, 277, 102, 11774);
    			add_location(p26, file$a, 275, 2, 11638);
    			attr_dev(a12, "href", "http://en.wikipedia.org/wiki/Cascading_Style_Sheets");
    			add_location(a12, file$a, 281, 6, 11987);
    			attr_dev(li47, "class", "svelte-y33bja");
    			add_location(li47, file$a, 280, 4, 11976);
    			attr_dev(a13, "href", "http://www.sitepoint.com/article/beware-opening-links-new-window");
    			add_location(a13, file$a, 284, 6, 12171);
    			attr_dev(li48, "class", "svelte-y33bja");
    			add_location(li48, file$a, 283, 4, 12160);
    			add_location(ol, file$a, 279, 2, 11967);
    			add_location(i6, file$a, 288, 4, 12351);
    			add_location(p27, file$a, 287, 2, 12343);
    			attr_dev(small25, "class", "svelte-y33bja");
    			add_location(small25, file$a, 292, 4, 12398);
    			add_location(p28, file$a, 291, 2, 12390);
    			attr_dev(small26, "class", "svelte-y33bja");
    			add_location(small26, file$a, 297, 4, 12655);
    			attr_dev(a14, "href", "http://tinyurl.com");
    			add_location(a14, file$a, 298, 275, 12956);
    			add_location(p29, file$a, 296, 2, 12647);
    			attr_dev(small27, "class", "svelte-y33bja");
    			add_location(small27, file$a, 302, 4, 13020);
    			attr_dev(a15, "href", "https://p3k.org/source/rss-box/");
    			add_location(a15, file$a, 303, 17, 13063);
    			add_location(p30, file$a, 301, 2, 13012);
    			attr_dev(small28, "class", "svelte-y33bja");
    			add_location(small28, file$a, 307, 4, 13175);
    			add_location(p31, file$a, 306, 2, 13167);
    			attr_dev(small29, "class", "svelte-y33bja");
    			add_location(small29, file$a, 312, 4, 13499);
    			attr_dev(a16, "href", "http://www.mandolux.com/");
    			add_location(a16, file$a, 313, 177, 13702);
    			add_location(p32, file$a, 311, 2, 13491);
    			attr_dev(small30, "class", "svelte-y33bja");
    			add_location(small30, file$a, 317, 4, 13769);
    			add_location(p33, file$a, 316, 2, 13761);
    			attr_dev(small31, "class", "svelte-y33bja");
    			add_location(small31, file$a, 322, 4, 14004);
    			attr_dev(code12, "class", "svelte-y33bja");
    			add_location(code12, file$a, 323, 237, 14267);
    			add_location(p34, file$a, 321, 2, 13996);
    			attr_dev(small32, "class", "svelte-y33bja");
    			add_location(small32, file$a, 327, 4, 14357);
    			add_location(p35, file$a, 326, 2, 14349);
    			attr_dev(small33, "class", "svelte-y33bja");
    			add_location(small33, file$a, 332, 4, 14642);
    			add_location(p36, file$a, 331, 2, 14634);
    			attr_dev(small34, "class", "svelte-y33bja");
    			add_location(small34, file$a, 337, 4, 14849);
    			add_location(p37, file$a, 336, 2, 14841);
    			attr_dev(small35, "class", "svelte-y33bja");
    			add_location(small35, file$a, 342, 4, 15149);
    			attr_dev(a17, "href", "https://p3k.org/source/rss-box");
    			add_location(a17, file$a, 343, 43, 15218);
    			attr_dev(a18, "href", "https://p3k.org/source/rss-box/branches/2.0/README");
    			add_location(a18, file$a, 343, 376, 15551);
    			add_location(p38, file$a, 341, 2, 15141);
    			attr_dev(small36, "class", "svelte-y33bja");
    			add_location(small36, file$a, 347, 4, 15721);
    			attr_dev(a19, "href", "./?url=error");
    			add_location(a19, file$a, 348, 102, 15849);
    			add_location(p39, file$a, 346, 2, 15713);
    			attr_dev(small37, "class", "svelte-y33bja");
    			add_location(small37, file$a, 353, 4, 16021);
    			add_location(i7, file$a, 354, 103, 16150);
    			add_location(del0, file$a, 354, 161, 16208);
    			attr_dev(a20, "href", "http://validator.w3.org/check?uri=http%3A%2F%2Fp3k.org%2Frss%2F");
    			add_location(a20, file$a, 354, 303, 16350);
    			add_location(p40, file$a, 352, 2, 16013);
    			attr_dev(small38, "class", "svelte-y33bja");
    			add_location(small38, file$a, 358, 4, 16467);
    			add_location(del1, file$a, 359, 18, 16511);
    			add_location(p41, file$a, 357, 2, 16459);
    			attr_dev(small39, "class", "svelte-y33bja");
    			add_location(small39, file$a, 363, 4, 16666);
    			add_location(del2, file$a, 364, 40, 16732);
    			add_location(p42, file$a, 362, 2, 16658);
    			attr_dev(small40, "class", "svelte-y33bja");
    			add_location(small40, file$a, 368, 4, 16778);
    			attr_dev(a21, "href", "http://www.rebol.com/news3310.html");
    			add_location(a21, file$a, 369, 21, 16825);
    			add_location(i8, file$a, 370, 4, 16943);
    			add_location(p43, file$a, 367, 2, 16770);
    			attr_dev(small41, "class", "svelte-y33bja");
    			add_location(small41, file$a, 374, 4, 16977);
    			attr_dev(a22, "href", "http://www.ourpla.net/cgi-bin/pikie.cgi?AbbeNormal");
    			add_location(a22, file$a, 375, 33, 17036);
    			add_location(p44, file$a, 373, 2, 16969);
    			attr_dev(small42, "class", "svelte-y33bja");
    			add_location(small42, file$a, 379, 4, 17162);
    			add_location(p45, file$a, 378, 2, 17154);
    			attr_dev(small43, "class", "svelte-y33bja");
    			add_location(small43, file$a, 384, 4, 17681);
    			attr_dev(code13, "class", "svelte-y33bja");
    			add_location(code13, file$a, 385, 20, 17727);
    			add_location(p46, file$a, 383, 2, 17673);
    			attr_dev(small44, "class", "svelte-y33bja");
    			add_location(small44, file$a, 389, 4, 18112);
    			add_location(p47, file$a, 388, 2, 18104);
    			attr_dev(small45, "class", "svelte-y33bja");
    			add_location(small45, file$a, 394, 4, 18392);
    			attr_dev(code14, "class", "svelte-y33bja");
    			add_location(code14, file$a, 395, 99, 18517);
    			attr_dev(code15, "class", "svelte-y33bja");
    			add_location(code15, file$a, 395, 126, 18544);
    			attr_dev(code16, "class", "svelte-y33bja");
    			add_location(code16, file$a, 395, 155, 18573);
    			attr_dev(code17, "class", "svelte-y33bja");
    			add_location(code17, file$a, 395, 190, 18608);
    			add_location(p48, file$a, 393, 2, 18384);
    			attr_dev(small46, "class", "svelte-y33bja");
    			add_location(small46, file$a, 399, 4, 18814);
    			add_location(p49, file$a, 398, 2, 18806);
    			attr_dev(small47, "class", "svelte-y33bja");
    			add_location(small47, file$a, 404, 4, 19037);
    			attr_dev(a23, "href", "http://publish.curry.com/rss/");
    			add_location(a23, file$a, 405, 56, 19119);
    			add_location(p50, file$a, 403, 2, 19029);
    			attr_dev(small48, "class", "svelte-y33bja");
    			add_location(small48, file$a, 409, 4, 19388);
    			add_location(del3, file$a, 410, 207, 19621);
    			add_location(p51, file$a, 408, 2, 19380);
    			attr_dev(small49, "class", "svelte-y33bja");
    			add_location(small49, file$a, 414, 4, 19678);
    			attr_dev(a24, "href", "http://www.curry.com/2001/07/31#coolRssService");
    			add_location(a24, file$a, 415, 14, 19718);
    			add_location(del4, file$a, 415, 117, 19821);
    			add_location(p52, file$a, 413, 2, 19670);
    			attr_dev(small50, "class", "svelte-y33bja");
    			add_location(small50, file$a, 419, 4, 19880);
    			add_location(p53, file$a, 418, 2, 19872);
    			attr_dev(small51, "class", "svelte-y33bja");
    			add_location(small51, file$a, 424, 4, 20002);
    			add_location(p54, file$a, 423, 2, 19994);
    			add_location(details, file$a, 30, 0, 342);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, h3);
    			append_dev(details, t1);
    			append_dev(details, p0);
    			append_dev(p0, small0);
    			append_dev(p0, t3);
    			append_dev(details, t4);
    			append_dev(details, p1);
    			append_dev(p1, small1);
    			append_dev(p1, t6);
    			append_dev(details, t7);
    			append_dev(details, p2);
    			append_dev(p2, small2);
    			append_dev(p2, t9);
    			append_dev(details, t10);
    			append_dev(details, p3);
    			append_dev(p3, small3);
    			append_dev(p3, t12);
    			append_dev(p3, a0);
    			append_dev(p3, t14);
    			append_dev(p3, a1);
    			append_dev(p3, t16);
    			append_dev(details, t17);
    			append_dev(details, p4);
    			append_dev(p4, small4);
    			append_dev(p4, t19);
    			append_dev(details, t20);
    			append_dev(details, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t22);
    			append_dev(ul0, li1);
    			append_dev(ul0, t24);
    			append_dev(ul0, li2);
    			append_dev(ul0, t26);
    			append_dev(ul0, li3);
    			append_dev(ul0, t28);
    			append_dev(ul0, li4);
    			append_dev(li4, t29);
    			append_dev(li4, a2);
    			append_dev(li4, t31);
    			append_dev(details, t32);
    			append_dev(details, p5);
    			append_dev(p5, small5);
    			append_dev(p5, t34);
    			append_dev(p5, em1);
    			append_dev(em1, t35);
    			append_dev(em1, em0);
    			append_dev(details, t36);
    			append_dev(details, p6);
    			append_dev(p6, small6);
    			append_dev(p6, t38);
    			append_dev(details, t39);
    			append_dev(details, ul1);
    			append_dev(ul1, li5);
    			append_dev(ul1, t41);
    			append_dev(ul1, li6);
    			append_dev(ul1, t43);
    			append_dev(ul1, li7);
    			append_dev(ul1, t45);
    			append_dev(ul1, li8);
    			append_dev(ul1, t47);
    			append_dev(ul1, li9);
    			append_dev(ul1, t49);
    			append_dev(ul1, li10);
    			append_dev(ul1, t51);
    			append_dev(ul1, li11);
    			append_dev(ul1, t53);
    			append_dev(ul1, li12);
    			append_dev(ul1, t55);
    			append_dev(ul1, li13);
    			append_dev(li13, t56);
    			append_dev(li13, a3);
    			append_dev(li13, t58);
    			append_dev(li13, a4);
    			append_dev(ul1, t60);
    			append_dev(ul1, li14);
    			append_dev(ul1, t62);
    			append_dev(ul1, li15);
    			append_dev(ul1, t64);
    			append_dev(ul1, li16);
    			append_dev(li16, t65);
    			append_dev(li16, a5);
    			append_dev(ul1, t67);
    			append_dev(ul1, li17);
    			append_dev(ul1, t69);
    			append_dev(ul1, li18);
    			append_dev(details, t71);
    			append_dev(details, p7);
    			append_dev(p7, small7);
    			append_dev(p7, t73);
    			append_dev(p7, a6);
    			append_dev(p7, t75);
    			append_dev(details, t76);
    			append_dev(details, p8);
    			append_dev(p8, small8);
    			append_dev(p8, t78);
    			append_dev(p8, i0);
    			append_dev(details, t80);
    			append_dev(details, p9);
    			append_dev(p9, small9);
    			append_dev(p9, t82);
    			append_dev(details, t83);
    			append_dev(details, ul2);
    			append_dev(ul2, li19);
    			append_dev(li19, t84);
    			append_dev(li19, a7);
    			append_dev(li19, t86);
    			append_dev(ul2, t87);
    			append_dev(ul2, li20);
    			append_dev(li20, t88);
    			append_dev(li20, a8);
    			append_dev(li20, t90);
    			append_dev(details, t91);
    			append_dev(details, p10);
    			append_dev(p10, small10);
    			append_dev(p10, t93);
    			append_dev(details, t94);
    			append_dev(details, ul3);
    			append_dev(ul3, li21);
    			append_dev(li21, t95);
    			append_dev(li21, code0);
    			append_dev(li21, t97);
    			append_dev(ul3, t98);
    			append_dev(ul3, li22);
    			append_dev(details, t100);
    			append_dev(details, p11);
    			append_dev(p11, small11);
    			append_dev(p11, t102);
    			append_dev(p11, code1);
    			append_dev(p11, t104);
    			append_dev(p11, code2);
    			append_dev(p11, t106);
    			append_dev(p11, code3);
    			append_dev(p11, t108);
    			append_dev(p11, code4);
    			append_dev(p11, t110);
    			append_dev(p11, code5);
    			append_dev(p11, t112);
    			append_dev(details, t113);
    			append_dev(details, p12);
    			append_dev(p12, small12);
    			append_dev(details, t115);
    			append_dev(details, ul4);
    			append_dev(ul4, li23);
    			append_dev(li23, t116);
    			append_dev(li23, code6);
    			append_dev(li23, t118);
    			append_dev(ul4, t119);
    			append_dev(ul4, li24);
    			append_dev(li24, t120);
    			append_dev(li24, code7);
    			append_dev(li24, t122);
    			append_dev(li24, code8);
    			append_dev(li24, t124);
    			append_dev(details, t125);
    			append_dev(details, p13);
    			append_dev(p13, small13);
    			append_dev(details, t127);
    			append_dev(details, ul5);
    			append_dev(ul5, li25);
    			append_dev(ul5, t129);
    			append_dev(ul5, li26);
    			append_dev(details, t131);
    			append_dev(details, p14);
    			append_dev(p14, small14);
    			append_dev(p14, t133);
    			append_dev(details, t134);
    			append_dev(details, ul6);
    			append_dev(ul6, li27);
    			append_dev(li27, t135);
    			append_dev(li27, code9);
    			append_dev(li27, t137);
    			append_dev(ul6, t138);
    			append_dev(ul6, li28);
    			append_dev(ul6, t140);
    			append_dev(ul6, li29);
    			append_dev(details, t142);
    			append_dev(details, p15);
    			append_dev(p15, small15);
    			append_dev(p15, t144);
    			append_dev(p15, i1);
    			append_dev(details, t146);
    			append_dev(details, p16);
    			append_dev(p16, t147);
    			append_dev(p16, i2);
    			append_dev(p16, t149);
    			append_dev(details, t150);
    			append_dev(details, p17);
    			append_dev(details, t152);
    			append_dev(details, p18);
    			append_dev(p18, small16);
    			append_dev(p18, t154);
    			append_dev(details, t155);
    			append_dev(details, p19);
    			append_dev(p19, small17);
    			append_dev(details, t157);
    			append_dev(details, ul7);
    			append_dev(ul7, li30);
    			append_dev(li30, t158);
    			append_dev(li30, code10);
    			append_dev(li30, t160);
    			append_dev(ul7, t161);
    			append_dev(ul7, li31);
    			append_dev(ul7, t163);
    			append_dev(ul7, li32);
    			append_dev(li32, t164);
    			append_dev(li32, a9);
    			append_dev(li32, t166);
    			append_dev(details, t167);
    			append_dev(details, p20);
    			append_dev(p20, small18);
    			append_dev(p20, t169);
    			append_dev(details, t170);
    			append_dev(details, ul8);
    			append_dev(ul8, li33);
    			append_dev(ul8, t172);
    			append_dev(ul8, li34);
    			append_dev(ul8, t174);
    			append_dev(ul8, li35);
    			append_dev(li35, t175);
    			append_dev(li35, i3);
    			append_dev(i3, t176);
    			append_dev(i3, code11);
    			append_dev(code11, a10);
    			append_dev(i3, t178);
    			append_dev(ul8, t179);
    			append_dev(ul8, li36);
    			append_dev(li36, t180);
    			append_dev(li36, a11);
    			append_dev(li36, t182);
    			append_dev(ul8, t183);
    			append_dev(ul8, li37);
    			append_dev(ul8, t185);
    			append_dev(ul8, li38);
    			append_dev(li38, t186);
    			append_dev(li38, i4);
    			append_dev(ul8, t188);
    			append_dev(ul8, li39);
    			append_dev(ul8, t190);
    			append_dev(ul8, li40);
    			append_dev(details, t192);
    			append_dev(details, p21);
    			append_dev(p21, small19);
    			append_dev(p21, t194);
    			append_dev(details, t195);
    			append_dev(details, p22);
    			append_dev(p22, small20);
    			append_dev(p22, t197);
    			append_dev(details, t198);
    			append_dev(details, ul9);
    			append_dev(ul9, li41);
    			append_dev(ul9, t200);
    			append_dev(ul9, li42);
    			append_dev(ul9, t202);
    			append_dev(ul9, li43);
    			append_dev(details, t204);
    			append_dev(details, p23);
    			append_dev(p23, small21);
    			append_dev(p23, t206);
    			append_dev(details, t207);
    			append_dev(details, ul10);
    			append_dev(ul10, li44);
    			append_dev(ul10, t209);
    			append_dev(ul10, li45);
    			append_dev(ul10, t211);
    			append_dev(ul10, li46);
    			append_dev(details, t213);
    			append_dev(details, p24);
    			append_dev(p24, small22);
    			append_dev(p24, t215);
    			append_dev(details, t216);
    			append_dev(details, p25);
    			append_dev(p25, small23);
    			append_dev(p25, t218);
    			append_dev(details, t219);
    			append_dev(details, p26);
    			append_dev(p26, small24);
    			append_dev(p26, t221);
    			append_dev(p26, i5);
    			append_dev(p26, t223);
    			append_dev(details, t224);
    			append_dev(details, ol);
    			append_dev(ol, li47);
    			append_dev(li47, a12);
    			append_dev(li47, t226);
    			append_dev(ol, t227);
    			append_dev(ol, li48);
    			append_dev(li48, a13);
    			append_dev(li48, t229);
    			append_dev(details, t230);
    			append_dev(details, p27);
    			append_dev(p27, i6);
    			append_dev(details, t232);
    			append_dev(details, p28);
    			append_dev(p28, small25);
    			append_dev(p28, t234);
    			append_dev(details, t235);
    			append_dev(details, p29);
    			append_dev(p29, small26);
    			append_dev(p29, t237);
    			append_dev(p29, a14);
    			append_dev(p29, t239);
    			append_dev(details, t240);
    			append_dev(details, p30);
    			append_dev(p30, small27);
    			append_dev(p30, t242);
    			append_dev(p30, a15);
    			append_dev(p30, t244);
    			append_dev(details, t245);
    			append_dev(details, p31);
    			append_dev(p31, small28);
    			append_dev(p31, t247);
    			append_dev(details, t248);
    			append_dev(details, p32);
    			append_dev(p32, small29);
    			append_dev(p32, t250);
    			append_dev(p32, a16);
    			append_dev(p32, t252);
    			append_dev(details, t253);
    			append_dev(details, p33);
    			append_dev(p33, small30);
    			append_dev(p33, t255);
    			append_dev(details, t256);
    			append_dev(details, p34);
    			append_dev(p34, small31);
    			append_dev(p34, t258);
    			append_dev(p34, code12);
    			append_dev(p34, t263);
    			append_dev(details, t264);
    			append_dev(details, p35);
    			append_dev(p35, small32);
    			append_dev(p35, t266);
    			append_dev(details, t267);
    			append_dev(details, p36);
    			append_dev(p36, small33);
    			append_dev(p36, t269);
    			append_dev(details, t270);
    			append_dev(details, p37);
    			append_dev(p37, small34);
    			append_dev(p37, t272);
    			append_dev(details, t273);
    			append_dev(details, p38);
    			append_dev(p38, small35);
    			append_dev(p38, t275);
    			append_dev(p38, a17);
    			append_dev(p38, t277);
    			append_dev(p38, a18);
    			append_dev(p38, t279);
    			append_dev(details, t280);
    			append_dev(details, p39);
    			append_dev(p39, small36);
    			append_dev(p39, t282);
    			append_dev(p39, a19);
    			append_dev(p39, t284);
    			append_dev(details, t285);
    			append_dev(details, p40);
    			append_dev(p40, small37);
    			append_dev(p40, t287);
    			append_dev(p40, i7);
    			append_dev(p40, t289);
    			append_dev(p40, del0);
    			append_dev(p40, t291);
    			append_dev(p40, a20);
    			append_dev(p40, t293);
    			append_dev(details, t294);
    			append_dev(details, p41);
    			append_dev(p41, small38);
    			append_dev(p41, t296);
    			append_dev(p41, del1);
    			append_dev(p41, t298);
    			append_dev(details, t299);
    			append_dev(details, p42);
    			append_dev(p42, small39);
    			append_dev(p42, t301);
    			append_dev(p42, del2);
    			append_dev(p42, t303);
    			append_dev(details, t304);
    			append_dev(details, p43);
    			append_dev(p43, small40);
    			append_dev(p43, t306);
    			append_dev(p43, a21);
    			append_dev(p43, t308);
    			append_dev(p43, i8);
    			append_dev(details, t310);
    			append_dev(details, p44);
    			append_dev(p44, small41);
    			append_dev(p44, t312);
    			append_dev(p44, a22);
    			append_dev(p44, t314);
    			append_dev(details, t315);
    			append_dev(details, p45);
    			append_dev(p45, small42);
    			append_dev(p45, t317);
    			append_dev(details, t318);
    			append_dev(details, p46);
    			append_dev(p46, small43);
    			append_dev(p46, t320);
    			append_dev(p46, code13);
    			append_dev(p46, t322);
    			append_dev(details, t323);
    			append_dev(details, p47);
    			append_dev(p47, small44);
    			append_dev(p47, t325);
    			append_dev(details, t326);
    			append_dev(details, p48);
    			append_dev(p48, small45);
    			append_dev(p48, t328);
    			append_dev(p48, code14);
    			append_dev(p48, t330);
    			append_dev(p48, code15);
    			append_dev(p48, t332);
    			append_dev(p48, code16);
    			append_dev(p48, t334);
    			append_dev(p48, code17);
    			append_dev(p48, t336);
    			append_dev(details, t337);
    			append_dev(details, p49);
    			append_dev(p49, small46);
    			append_dev(p49, t339);
    			append_dev(details, t340);
    			append_dev(details, p50);
    			append_dev(p50, small47);
    			append_dev(p50, t342);
    			append_dev(p50, a23);
    			append_dev(p50, t344);
    			append_dev(details, t345);
    			append_dev(details, p51);
    			append_dev(p51, small48);
    			append_dev(p51, t347);
    			append_dev(p51, del3);
    			append_dev(p51, t349);
    			append_dev(details, t350);
    			append_dev(details, p52);
    			append_dev(p52, small49);
    			append_dev(p52, t352);
    			append_dev(p52, a24);
    			append_dev(p52, t354);
    			append_dev(p52, del4);
    			append_dev(p52, t356);
    			append_dev(details, t357);
    			append_dev(details, p53);
    			append_dev(p53, small50);
    			append_dev(p53, t359);
    			append_dev(details, t360);
    			append_dev(details, p54);
    			append_dev(p54, small51);
    			append_dev(p54, t362);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Changes', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Changes> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Changes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {}, add_css$9);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Changes",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/Github.html generated by Svelte v3.40.0 */

    const file$9 = "src/components/Github.html";

    function create_fragment$9(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Github";
    			attr_dev(a, "class", "github-button");
    			attr_dev(a, "href", "https://github.com/p3k/rss-box");
    			attr_dev(a, "data-size", "large");
    			attr_dev(a, "data-show-count", "true");
    			attr_dev(a, "aria-label", "Star p3k/rss-box on GitHub");
    			add_location(a, file$9, 7, 0, 201);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Github', slots, []);
    	const script = document.createElement("script");
    	script.async = script.defer = true;
    	script.src = "https://buttons.github.io/buttons.js";
    	document.head.appendChild(script);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Github> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ script });
    	return [];
    }

    class Github extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Github",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/About.html generated by Svelte v3.40.0 */
    const file$8 = "src/components/About.html";

    function add_css$8(target) {
    	append_styles(target, "svelte-8mn5ku", "h3.svelte-8mn5ku.svelte-8mn5ku{display:inline-block}h3.svelte-8mn5ku+p.svelte-8mn5ku{margin-top:0}small.svelte-8mn5ku.svelte-8mn5ku{color:#bbb}.warning.svelte-8mn5ku.svelte-8mn5ku{border-color:#e44;background:#fdd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJvdXQuaHRtbCIsInNvdXJjZXMiOlsiQWJvdXQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBhcHAgfSBmcm9tIFwiLi4vc3RvcmVzXCI7XG4gIGltcG9ydCBDaGFuZ2VzIGZyb20gXCIuL0NoYW5nZXMuaHRtbFwiO1xuICBpbXBvcnQgR2l0aHViIGZyb20gXCIuL0dpdGh1Yi5odG1sXCI7XG5cbiAgLy8gU3RvcmVzIGNvbWluZyBpbiB2aWEgcHJvcHNcbiAgZXhwb3J0IGxldCBjb25maWc7XG5cbiAgZnVuY3Rpb24gZ290bygpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbmZpZy5zZXQoeyB1cmw6IGV2ZW50LnRhcmdldC5ocmVmIH0pO1xuICB9XG5cbiAgYXBwLnN1YnNjcmliZShzdGF0ZSA9PiBkb2N1bWVudC50aXRsZSA9IHN0YXRlLmRlc2NyaXB0aW9uKTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIGgzIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIH1cblxuICBoMyArIHAge1xuICAgIG1hcmdpbi10b3A6IDA7XG4gIH1cblxuICBzbWFsbCB7XG4gICAgY29sb3I6ICNiYmI7XG4gIH1cblxuICAud2FybmluZyB7XG4gICAgYm9yZGVyLWNvbG9yOiAjZTQ0O1xuICAgIGJhY2tncm91bmQ6ICNmZGQ7XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXY+XG4gIDxzbWFsbD48aT7igJxKYXZhU2NyaXB0IFJTUyBWaWV3ZXIgcHV0cyBsaXR0bGUgb3IgbG9uZyBjdXN0b21pemFibGUgUlNTIGJveGVzIGFueXdoZXJlIHlvdSBwdXQgSFRNTDsgYnVpbGQgeW91ciBvd24gc2xhc2hib3ggaGVsbCBvciBoZWF2ZW4sIGl04oCZcyBmZWVkYXJpZmljIeKAnSDigJQgPGEgaHJlZj0naHR0cDovL291cnBsYS5uZXQvY2dpL3Bpa2llJz5BYmJlIE5vcm1hbDwvYT48L2k+PC9zbWFsbD5cbjwvZGl2PlxuXG48aDI+eyAkYXBwLmRlc2NyaXB0aW9uIH0geyAkYXBwLnZlcnNpb24gfTwvaDI+XG5cbjxwIGNsYXNzPSdtc2cgd2FybmluZyc+XG4gIDxzdHJvbmc+VGhpcyBpcyBhIG5vbi1wcm9maXQgcHJvamVjdCBydW5uaW5nIG9uIGEgcHJpdmF0ZSBzZXJ2ZXIuPC9zdHJvbmc+IElmIHlvdSBsaWtlIHVzaW5nIGl0IHlvdSBzaG91bGQgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3Azay9yc3MtYm94L2Jsb2IvbWFpbi9JTlNUQUxMLm1kJz5ob3N0IGFuIGluc3RhbGxhdGlvbiBvbiB5b3VyIG93biBzZXJ2ZXI8L2E+IGFuZC9vciBzdXBwb3J0IHRoZSBwcm9qZWN0IHdpdGggeW91ciA8YSBocmVmPSdodHRwOi8vZmxhdHRyLmNvbS90aGluZy82ODE4ODEvSmF2YVNjcmlwdC1SU1MtQm94LVZpZXdlcic+ZG9uYXRpb248L2E+LlxuPC9wPlxuXG48cD5cbiAgVGhpcyB2aWV3ZXIgY2FuIGRpc3BsYXkgPGEgaHJlZj0naHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SU1MnPlJTUzwvYT4gZmVlZHMgb2YgdmVyc2lvbiA8YSBocmVmPSdodHRwOi8vY3liZXIubGF3LmhhcnZhcmQuZWR1L3Jzcy9leGFtcGxlcy9zYW1wbGVSc3MwOTEueG1sJyBvbjpjbGljaz17IGdvdG8gfT4wLjkxPC9hPiwgPGEgaHJlZj0naHR0cDovL2N5YmVyLmxhdy5oYXJ2YXJkLmVkdS9yc3MvZXhhbXBsZXMvc2FtcGxlUnNzMDkyLnhtbCcgb246Y2xpY2s9eyBnb3RvIH0+MC45MjwvYT4sIDxhIGhyZWY9J2h0dHA6Ly9yc3Mub3JmLmF0L2ZtNC54bWwnIG9uOmNsaWNrPXsgZ290byB9PjEuMDwvYT4gYW5kIDxhIGhyZWY9J2h0dHA6Ly9ibG9nLnAzay5vcmcvc3Rvcmllcy54bWwnIG9uOmNsaWNrPXsgZ290byB9PjIuMDwvYT4gYXMgd2VsbCBhcyBldmVuIHRoZSBnb29kIG9sZCBsZWdhY3kgZm9ybWF0IDxhIGhyZWY9J2h0dHA6Ly9lc3NheXNmcm9tZXhvZHVzLnNjcmlwdGluZy5jb20veG1sL3NjcmlwdGluZ05ld3MyLnhtbCcgb246Y2xpY2s9eyBnb3RvIH0+U2NyaXB0aW5nIE5ld3MgMjwvYT4uIFRoZXJlIGlzIGFsc28gYmFzaWMgc3VwcG9ydCBmb3IgPGEgaHJlZj0naHR0cHM6Ly93d3cudGhlcmVnaXN0ZXIuY28udWsvaGVhZGxpbmVzLmF0b20nIG9uOmNsaWNrPXsgZ290byB9PkF0b20gMS4wPC9hPi5cbjwvcD5cblxuPHA+XG4gIEl0IHByb3ZpZGVzIGEgc2ltcGxlIHdheSB0byBlbWJlZCBzdWNoIFJTUyBib3hlcyBpbiBhbnkgPGEgaHJlZj0naHR0cDovL3ZhbGlkYXRvci53My5vcmcvJz52YWxpZCBIVE1MIGRvY3VtZW50PC9hPiB2aWEgYW4gYXV0b21hZ2ljYWxseSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCB0YWcg4oCUIDxpPmZvciBmcmVlITwvaT5cbjwvcD5cblxuPHA+XG4gIEp1c3QgZW50ZXIgdGhlIFVSTCBvZiBhbnkgY29tcGF0aWJsZSBSU1MgZmVlZCwgbW9kaWZ5IHRoZSBsYXlvdXQgc2V0dGluZ3MgYXMgeW91IGxpa2UgYW5kIHB1c2ggdGhlIFJlbG9hZCBidXR0b24uIFdoZW4gZmluaXNoZWQsIGNvcHkgdGhlIEhUTUwgY29kZSBpbnRvIHlvdXIgb3duIHdlYiBwYWdlIOKAkyBhbmQgdm9pbMOgIVxuPC9wPlxuXG48cD5cbiAgVGhlIGNvZGUgYmVoaW5kIHRoaXMgaXMgd3JpdHRlbiBpbiBKYXZhU2NyaXB0IGFuZCBydW5zIGNvbXBsZXRlbHkgaW4geW91ciBicm93c2VyKi4gWW91IGNhbiBnZXQgdGhlIHNvdXJjZSBjb2RlIHRvZ2V0aGVyIHdpdGggYWxsIHRoZSBvdGhlciBuZWNlc3NhcnkgZmlsZXMgZnJvbSB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3Azay9yc3MtYm94Jz5HaXRodWIgcmVwb3NpdG9yeTwvYT4uXG48L3A+XG5cbjxwPlxuICA8c21hbGw+KiBBIHByb3h5IHNlcnZlciBpcyBuZWVkZWQgZm9yIGNyb3NzLW9yaWdpbiByZXF1ZXN0cy48L3NtYWxsPlxuPC9wPlxuXG48cD5cbiAgPEdpdGh1Yi8+XG48L3A+XG5cbjxDaGFuZ2VzLz5cblxuPGgzPkZ1dHVyZSBEZXZlbG9wbWVudDwvaDM+XG5cbjxwPlxuICBJIGhhdmUgY2Vhc2VkIGFjdGl2ZWx5IGRldmVsb3BpbmcgdGhpcyB2aWV3ZXIgYnV0IHNvbWV0aW1lcyBJIGdldCBlbnRodXNpYXN0aWMgYW5kIGZpZGRsZSBhcm91bmQgd2l0aCB0aGUgY29kZS4gT2YgY291cnNlIGl0IHdpbGwgYmUgYXZhaWxhYmxlIGhlcmUgYXMgaXMuXG48L3A+XG48cD5cbiAgRm9yIHF1ZXN0aW9ucyBhbmQgY29tbWVudHMgZmVlbCBmcmVlIHRvIGNvbnRhY3QgbWUgKFRvYmkpIHZpYSBlLW1haWw6IDxhIGhyZWY9J21haWx0bzomIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDM7JiMxMTQ7JiMxMTU7JiMxMTU7JiM2NDsmIzExMjsmIzUxOyYjMTA3OyYjNDY7JiMxMTE7JiMxMTQ7JiMxMDM7Jz4mIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDM7JiMxMTQ7JiMxMTU7JiMxMTU7JiM2NDsmIzExMjsmIzUxOyYjMTA3OyYjNDY7JiMxMTE7JiMxMTQ7JiMxMDM7PC9hPi5cbjwvcD5cblxuPGgzPkxpY2Vuc2U8L2gzPlxuXG48cD5cbiAgPHNwYW4geG1sbnM6ZGN0PSdodHRwOi8vcHVybC5vcmcvZGMvdGVybXMvJyBwcm9wZXJ0eT0nZGN0OnRpdGxlJz5KYXZhU2NyaXB0IFJTUyBCb3ggVmlld2VyPC9zcGFuPiBieVxuICA8YSB4bWxuczpjYz0naHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjJyBocmVmPSdodHRwOi8vcDNrLm9yZy9yc3MnIHByb3BlcnR5PSdjYzphdHRyaWJ1dGlvbk5hbWUnIHJlbD0nY2M6YXR0cmlidXRpb25VUkwnPlRvYmkgU2Now6RmZXI8L2E+IGlzIGxpY2Vuc2VkIHVuZGVyIGEgPGEgcmVsPSdsaWNlbnNlJyBocmVmPSdodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvYXQvZGVlZC5lbl9VUyc+Q3JlYXRpdmUgQ29tbW9ucyBBdHRyaWJ1dGlvbi1TaGFyZUFsaWtlIDMuMCBBdXN0cmlhIExpY2Vuc2U8L2E+LlxuPC9wPlxuPHA+XG4gIEJhc2VkIG9uIGEgd29yayBhdCA8YSB4bWxuczpkY3Q9J2h0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy8nIGhyZWY9J2h0dHBzOi8vcDNrLm9yZy9zb3VyY2Uvc3ZuL3Jzcy1ib3gvdHJ1bmsvJyByZWw9J2RjdDpzb3VyY2UnPmh0dHBzOi8vcDNrLm9yZy9zb3VyY2Uvc3ZuL3Jzcy1ib3gvdHJ1bmsvPC9hPi5cbjwvcD5cbjxwPlxuICA8YSByZWw9J2xpY2Vuc2UnIGhyZWY9J2h0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzMuMC9hdC9kZWVkLmVuX1VTJz5cbiAgICA8aW1nIGFsdD0nQ3JlYXRpdmUgQ29tbW9ucyBMaWNlbnNlJyBzdHlsZT0nYm9yZGVyLXdpZHRoOjAnIHNyYz0naHR0cHM6Ly9pLmNyZWF0aXZlY29tbW9ucy5vcmcvbC9ieS1zYS8zLjAvYXQvODh4MzEucG5nJz5cbiAgPC9hPlxuPC9wPlxuXG48c21hbGw+VGhhbmsgeW91LCA8YSBocmVmPSdodHRwczovL3Azay5vcmcvJz5wM2sub3JnPC9hPiE8L3NtYWxsPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWlCRSxFQUFFLDRCQUFDLENBQUMsQUFDRixPQUFPLENBQUUsWUFBWSxBQUN2QixDQUFDLEFBRUQsZ0JBQUUsQ0FBRyxDQUFDLGNBQUMsQ0FBQyxBQUNOLFVBQVUsQ0FBRSxDQUFDLEFBQ2YsQ0FBQyxBQUVELEtBQUssNEJBQUMsQ0FBQyxBQUNMLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyxBQUVELFFBQVEsNEJBQUMsQ0FBQyxBQUNSLFlBQVksQ0FBRSxJQUFJLENBQ2xCLFVBQVUsQ0FBRSxJQUFJLEFBQ2xCLENBQUMifQ== */");
    }

    function create_fragment$8(ctx) {
    	let div;
    	let small0;
    	let i0;
    	let t0;
    	let a0;
    	let t2;
    	let h2;
    	let t3_value = /*$app*/ ctx[0].description + "";
    	let t3;
    	let t4;
    	let t5_value = /*$app*/ ctx[0].version + "";
    	let t5;
    	let t6;
    	let p0;
    	let strong;
    	let t8;
    	let a1;
    	let t10;
    	let a2;
    	let t12;
    	let t13;
    	let p1;
    	let t14;
    	let a3;
    	let t16;
    	let a4;
    	let t18;
    	let a5;
    	let t20;
    	let a6;
    	let t22;
    	let a7;
    	let t24;
    	let a8;
    	let t26;
    	let a9;
    	let t28;
    	let t29;
    	let p2;
    	let t30;
    	let a10;
    	let t32;
    	let i1;
    	let t34;
    	let p3;
    	let t36;
    	let p4;
    	let t37;
    	let a11;
    	let t39;
    	let t40;
    	let p5;
    	let small1;
    	let t42;
    	let p6;
    	let github;
    	let t43;
    	let changes;
    	let t44;
    	let h30;
    	let t46;
    	let p7;
    	let t48;
    	let p8;
    	let t49;
    	let a12;
    	let t51;
    	let t52;
    	let h31;
    	let t54;
    	let p9;
    	let span;
    	let t56;
    	let a13;
    	let t58;
    	let a14;
    	let t60;
    	let t61;
    	let p10;
    	let t62;
    	let a15;
    	let t64;
    	let t65;
    	let p11;
    	let a16;
    	let img;
    	let img_src_value;
    	let t66;
    	let small2;
    	let t67;
    	let a17;
    	let t69;
    	let current;
    	let mounted;
    	let dispose;
    	github = new Github({ $$inline: true });
    	changes = new Changes({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			small0 = element("small");
    			i0 = element("i");
    			t0 = text("“JavaScript RSS Viewer puts little or long customizable RSS boxes anywhere you put HTML; build your own slashbox hell or heaven, it’s feedarific!” — ");
    			a0 = element("a");
    			a0.textContent = "Abbe Normal";
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			p0 = element("p");
    			strong = element("strong");
    			strong.textContent = "This is a non-profit project running on a private server.";
    			t8 = text(" If you like using it you should ");
    			a1 = element("a");
    			a1.textContent = "host an installation on your own server";
    			t10 = text(" and/or support the project with your ");
    			a2 = element("a");
    			a2.textContent = "donation";
    			t12 = text(".");
    			t13 = space();
    			p1 = element("p");
    			t14 = text("This viewer can display ");
    			a3 = element("a");
    			a3.textContent = "RSS";
    			t16 = text(" feeds of version ");
    			a4 = element("a");
    			a4.textContent = "0.91";
    			t18 = text(", ");
    			a5 = element("a");
    			a5.textContent = "0.92";
    			t20 = text(", ");
    			a6 = element("a");
    			a6.textContent = "1.0";
    			t22 = text(" and ");
    			a7 = element("a");
    			a7.textContent = "2.0";
    			t24 = text(" as well as even the good old legacy format ");
    			a8 = element("a");
    			a8.textContent = "Scripting News 2";
    			t26 = text(". There is also basic support for ");
    			a9 = element("a");
    			a9.textContent = "Atom 1.0";
    			t28 = text(".");
    			t29 = space();
    			p2 = element("p");
    			t30 = text("It provides a simple way to embed such RSS boxes in any ");
    			a10 = element("a");
    			a10.textContent = "valid HTML document";
    			t32 = text(" via an automagically generated JavaScript tag — ");
    			i1 = element("i");
    			i1.textContent = "for free!";
    			t34 = space();
    			p3 = element("p");
    			p3.textContent = "Just enter the URL of any compatible RSS feed, modify the layout settings as you like and push the Reload button. When finished, copy the HTML code into your own web page – and voilà!";
    			t36 = space();
    			p4 = element("p");
    			t37 = text("The code behind this is written in JavaScript and runs completely in your browser*. You can get the source code together with all the other necessary files from the ");
    			a11 = element("a");
    			a11.textContent = "Github repository";
    			t39 = text(".");
    			t40 = space();
    			p5 = element("p");
    			small1 = element("small");
    			small1.textContent = "* A proxy server is needed for cross-origin requests.";
    			t42 = space();
    			p6 = element("p");
    			create_component(github.$$.fragment);
    			t43 = space();
    			create_component(changes.$$.fragment);
    			t44 = space();
    			h30 = element("h3");
    			h30.textContent = "Future Development";
    			t46 = space();
    			p7 = element("p");
    			p7.textContent = "I have ceased actively developing this viewer but sometimes I get enthusiastic and fiddle around with the code. Of course it will be available here as is.";
    			t48 = space();
    			p8 = element("p");
    			t49 = text("For questions and comments feel free to contact me (Tobi) via e-mail: ");
    			a12 = element("a");
    			a12.textContent = "mail+rss@p3k.org";
    			t51 = text(".");
    			t52 = space();
    			h31 = element("h3");
    			h31.textContent = "License";
    			t54 = space();
    			p9 = element("p");
    			span = element("span");
    			span.textContent = "JavaScript RSS Box Viewer";
    			t56 = text(" by\n  ");
    			a13 = element("a");
    			a13.textContent = "Tobi Schäfer";
    			t58 = text(" is licensed under a ");
    			a14 = element("a");
    			a14.textContent = "Creative Commons Attribution-ShareAlike 3.0 Austria License";
    			t60 = text(".");
    			t61 = space();
    			p10 = element("p");
    			t62 = text("Based on a work at ");
    			a15 = element("a");
    			a15.textContent = "https://p3k.org/source/svn/rss-box/trunk/";
    			t64 = text(".");
    			t65 = space();
    			p11 = element("p");
    			a16 = element("a");
    			img = element("img");
    			t66 = space();
    			small2 = element("small");
    			t67 = text("Thank you, ");
    			a17 = element("a");
    			a17.textContent = "p3k.org";
    			t69 = text("!");
    			attr_dev(a0, "href", "http://ourpla.net/cgi/pikie");
    			add_location(a0, file$8, 36, 161, 701);
    			add_location(i0, file$8, 36, 9, 549);
    			attr_dev(small0, "class", "svelte-8mn5ku");
    			add_location(small0, file$8, 36, 2, 542);
    			add_location(div, file$8, 35, 0, 534);
    			add_location(h2, file$8, 39, 0, 775);
    			add_location(strong, file$8, 42, 2, 849);
    			attr_dev(a1, "href", "https://github.com/p3k/rss-box/blob/main/INSTALL.md");
    			add_location(a1, file$8, 42, 109, 956);
    			attr_dev(a2, "href", "http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer");
    			add_location(a2, file$8, 42, 252, 1099);
    			attr_dev(p0, "class", "msg warning svelte-8mn5ku");
    			add_location(p0, file$8, 41, 0, 823);
    			attr_dev(a3, "href", "http://en.wikipedia.org/wiki/RSS");
    			add_location(a3, file$8, 46, 26, 1216);
    			attr_dev(a4, "href", "http://cyber.law.harvard.edu/rss/examples/sampleRss091.xml");
    			add_location(a4, file$8, 46, 94, 1284);
    			attr_dev(a5, "href", "http://cyber.law.harvard.edu/rss/examples/sampleRss092.xml");
    			add_location(a5, file$8, 46, 191, 1381);
    			attr_dev(a6, "href", "http://rss.orf.at/fm4.xml");
    			add_location(a6, file$8, 46, 288, 1478);
    			attr_dev(a7, "href", "http://blog.p3k.org/stories.xml");
    			add_location(a7, file$8, 46, 354, 1544);
    			attr_dev(a8, "href", "http://essaysfromexodus.scripting.com/xml/scriptingNews2.xml");
    			add_location(a8, file$8, 46, 465, 1655);
    			attr_dev(a9, "href", "https://www.theregister.co.uk/headlines.atom");
    			add_location(a9, file$8, 46, 608, 1798);
    			add_location(p1, file$8, 45, 0, 1186);
    			attr_dev(a10, "href", "http://validator.w3.org/");
    			add_location(a10, file$8, 50, 58, 1953);
    			add_location(i1, file$8, 50, 165, 2060);
    			add_location(p2, file$8, 49, 0, 1891);
    			add_location(p3, file$8, 53, 0, 2083);
    			attr_dev(a11, "href", "https://github.com/p3k/rss-box");
    			add_location(a11, file$8, 58, 167, 2450);
    			add_location(p4, file$8, 57, 0, 2279);
    			attr_dev(small1, "class", "svelte-8mn5ku");
    			add_location(small1, file$8, 62, 2, 2526);
    			add_location(p5, file$8, 61, 0, 2520);
    			add_location(p6, file$8, 65, 0, 2601);
    			attr_dev(h30, "class", "svelte-8mn5ku");
    			add_location(h30, file$8, 71, 0, 2635);
    			attr_dev(p7, "class", "svelte-8mn5ku");
    			add_location(p7, file$8, 73, 0, 2664);
    			attr_dev(a12, "href", "mailto:mail+rss@p3k.org");
    			add_location(a12, file$8, 77, 72, 2906);
    			add_location(p8, file$8, 76, 0, 2830);
    			attr_dev(h31, "class", "svelte-8mn5ku");
    			add_location(h31, file$8, 80, 0, 3118);
    			attr_dev(span, "xmlns:dct", "http://purl.org/dc/terms/");
    			attr_dev(span, "property", "dct:title");
    			add_location(span, file$8, 83, 2, 3142);
    			attr_dev(a13, "xmlns:cc", "http://creativecommons.org/ns#");
    			attr_dev(a13, "href", "http://p3k.org/rss");
    			attr_dev(a13, "property", "cc:attributionName");
    			attr_dev(a13, "rel", "cc:attributionURL");
    			add_location(a13, file$8, 84, 2, 3245);
    			attr_dev(a14, "rel", "license");
    			attr_dev(a14, "href", "http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US");
    			add_location(a14, file$8, 84, 164, 3407);
    			attr_dev(p9, "class", "svelte-8mn5ku");
    			add_location(p9, file$8, 82, 0, 3136);
    			attr_dev(a15, "xmlns:dct", "http://purl.org/dc/terms/");
    			attr_dev(a15, "href", "https://p3k.org/source/svn/rss-box/trunk/");
    			attr_dev(a15, "rel", "dct:source");
    			add_location(a15, file$8, 87, 21, 3586);
    			add_location(p10, file$8, 86, 0, 3561);
    			attr_dev(img, "alt", "Creative Commons License");
    			set_style(img, "border-width", "0");
    			if (!src_url_equal(img.src, img_src_value = "https://i.creativecommons.org/l/by-sa/3.0/at/88x31.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$8, 91, 4, 3840);
    			attr_dev(a16, "rel", "license");
    			attr_dev(a16, "href", "http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US");
    			add_location(a16, file$8, 90, 2, 3751);
    			add_location(p11, file$8, 89, 0, 3745);
    			attr_dev(a17, "href", "https://p3k.org/");
    			add_location(a17, file$8, 95, 18, 3992);
    			attr_dev(small2, "class", "svelte-8mn5ku");
    			add_location(small2, file$8, 95, 0, 3974);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, small0);
    			append_dev(small0, i0);
    			append_dev(i0, t0);
    			append_dev(i0, a0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			append_dev(h2, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, strong);
    			append_dev(p0, t8);
    			append_dev(p0, a1);
    			append_dev(p0, t10);
    			append_dev(p0, a2);
    			append_dev(p0, t12);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t14);
    			append_dev(p1, a3);
    			append_dev(p1, t16);
    			append_dev(p1, a4);
    			append_dev(p1, t18);
    			append_dev(p1, a5);
    			append_dev(p1, t20);
    			append_dev(p1, a6);
    			append_dev(p1, t22);
    			append_dev(p1, a7);
    			append_dev(p1, t24);
    			append_dev(p1, a8);
    			append_dev(p1, t26);
    			append_dev(p1, a9);
    			append_dev(p1, t28);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t30);
    			append_dev(p2, a10);
    			append_dev(p2, t32);
    			append_dev(p2, i1);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t37);
    			append_dev(p4, a11);
    			append_dev(p4, t39);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, small1);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, p6, anchor);
    			mount_component(github, p6, null);
    			insert_dev(target, t43, anchor);
    			mount_component(changes, target, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t46, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t48, anchor);
    			insert_dev(target, p8, anchor);
    			append_dev(p8, t49);
    			append_dev(p8, a12);
    			append_dev(p8, t51);
    			insert_dev(target, t52, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t54, anchor);
    			insert_dev(target, p9, anchor);
    			append_dev(p9, span);
    			append_dev(p9, t56);
    			append_dev(p9, a13);
    			append_dev(p9, t58);
    			append_dev(p9, a14);
    			append_dev(p9, t60);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, p10, anchor);
    			append_dev(p10, t62);
    			append_dev(p10, a15);
    			append_dev(p10, t64);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, p11, anchor);
    			append_dev(p11, a16);
    			append_dev(a16, img);
    			insert_dev(target, t66, anchor);
    			insert_dev(target, small2, anchor);
    			append_dev(small2, t67);
    			append_dev(small2, a17);
    			append_dev(small2, t69);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a4, "click", /*goto*/ ctx[1], false, false, false),
    					listen_dev(a5, "click", /*goto*/ ctx[1], false, false, false),
    					listen_dev(a6, "click", /*goto*/ ctx[1], false, false, false),
    					listen_dev(a7, "click", /*goto*/ ctx[1], false, false, false),
    					listen_dev(a8, "click", /*goto*/ ctx[1], false, false, false),
    					listen_dev(a9, "click", /*goto*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$app*/ 1) && t3_value !== (t3_value = /*$app*/ ctx[0].description + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*$app*/ 1) && t5_value !== (t5_value = /*$app*/ ctx[0].version + "")) set_data_dev(t5, t5_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(github.$$.fragment, local);
    			transition_in(changes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(github.$$.fragment, local);
    			transition_out(changes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t36);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(p6);
    			destroy_component(github);
    			if (detaching) detach_dev(t43);
    			destroy_component(changes, detaching);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t46);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t48);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t52);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t54);
    			if (detaching) detach_dev(p9);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t66);
    			if (detaching) detach_dev(small2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app, 'app');
    	component_subscribe($$self, app, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	let { config } = $$props;

    	function goto() {
    		event.preventDefault();
    		config.set({ url: event.target.href });
    	}

    	app.subscribe(state => document.title = state.description);
    	const writable_props = ['config'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('config' in $$props) $$invalidate(2, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({ app, Changes, Github, config, goto, $app });

    	$$self.$inject_state = $$props => {
    		if ('config' in $$props) $$invalidate(2, config = $$props.config);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$app, goto, config];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { config: 2 }, add_css$8);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[2] === undefined && !('config' in props)) {
    			console.warn("<About> was created without expected prop 'config'");
    		}
    	}

    	get config() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Ad.html generated by Svelte v3.40.0 */

    const file$7 = "src/components/Ad.html";

    function add_css$7(target) {
    	append_styles(target, "svelte-d7o9dc", "ins.svelte-d7o9dc{overflow:hidden;margin-bottom:1em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWQuaHRtbCIsInNvdXJjZXMiOlsiQWQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICAod2luZG93LmFkc2J5Z29vZ2xlID0gd2luZG93LmFkc2J5Z29vZ2xlIHx8IFtdKS5wdXNoKHt9KTtcblxuICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICBzY3JpcHQuc3JjID0gXCJodHRwczovL3BhZ2VhZDIuZ29vZ2xlc3luZGljYXRpb24uY29tL3BhZ2VhZC9qcy9hZHNieWdvb2dsZS5qc1wiO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICBpbnMge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgbWFyZ2luLWJvdHRvbTogMWVtO1xuICB9XG48L3N0eWxlPlxuXG48aW5zIGNsYXNzPSdhZHNieWdvb2dsZSdcbiAgICAgc3R5bGU9J2Rpc3BsYXk6YmxvY2snXG4gICAgIGRhdGEtYWQtY2xpZW50PSdjYS1wdWItMzk2NTAyODA0MzE1MzEzOCdcbiAgICAgZGF0YS1hZC1zbG90PSc2MzcwMjU3NDUxJ1xuICAgICBkYXRhLWFkLWZvcm1hdD0nYXV0bydcbiAgICAgZGF0YS1mdWxsLXdpZHRoLXJlc3BvbnNpdmU9J3RydWUnPjwvaW5zPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVFLEdBQUcsY0FBQyxDQUFDLEFBQ0gsUUFBUSxDQUFFLE1BQU0sQ0FDaEIsYUFBYSxDQUFFLEdBQUcsQUFDcEIsQ0FBQyJ9 */");
    }

    function create_fragment$7(ctx) {
    	let ins;

    	const block = {
    		c: function create() {
    			ins = element("ins");
    			attr_dev(ins, "class", "adsbygoogle svelte-d7o9dc");
    			set_style(ins, "display", "block");
    			attr_dev(ins, "data-ad-client", "ca-pub-3965028043153138");
    			attr_dev(ins, "data-ad-slot", "6370257451");
    			attr_dev(ins, "data-ad-format", "auto");
    			attr_dev(ins, "data-full-width-responsive", "true");
    			add_location(ins, file$7, 16, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ins, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ins);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ad', slots, []);
    	(window.adsbygoogle = window.adsbygoogle || []).push({});
    	const script = document.createElement("script");
    	script.async = true;
    	script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    	document.head.appendChild(script);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ad> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ script });
    	return [];
    }

    class Ad extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, add_css$7);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ad",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/LinkIcon.html generated by Svelte v3.40.0 */

    const file$6 = "src/components/LinkIcon.html";

    function add_css$6(target) {
    	append_styles(target, "svelte-mfbc6b", "svg.svelte-mfbc6b{width:1.2em;height:1.2em}polygon.svelte-mfbc6b{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0ljb24uaHRtbCIsInNvdXJjZXMiOlsiTGlua0ljb24uaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c3R5bGU+XG4gIHN2ZyB7XG4gICAgd2lkdGg6IDEuMmVtO1xuICAgIGhlaWdodDogMS4yZW07XG4gIH1cblxuICBwb2x5Z29uIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gICAgZmlsbC1ydWxlOiBldmVub2RkO1xuICAgIGNsaXAtcnVsZTogZXZlbm9kZDtcbiAgfVxuPC9zdHlsZT5cblxuPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpWaXN1YWxFZGl0b3JfLV9JY29uXy1fRXh0ZXJuYWwtbGluay5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDEyIDEyJyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSd4TWluWU1pbic+XG4gIDxnPlxuICAgIDxwb2x5Z29uIHBvaW50cz0nMiwyIDUsMiA1LDMgMywzIDMsOSA5LDkgOSw3IDEwLDcgMTAsMTAgMiwxMCcvPlxuICAgIDxwb2x5Z29uIHBvaW50cz0nNi4yMTEsMiAxMCwyIDEwLDUuNzg5IDguNTc5LDQuMzY4IDYuNDQ3LDYuNSA1LjUsNS41NTMgNy42MzIsMy40MjEnLz5cbiAgPC9nPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0UsR0FBRyxjQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUFLLEFBQ2YsQ0FBQyxBQUVELE9BQU8sY0FBQyxDQUFDLEFBQ1AsSUFBSSxDQUFFLFlBQVksQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQUFDcEIsQ0FBQyJ9 */");
    }

    function create_fragment$6(ctx) {
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
    			add_location(polygon0, file$6, 16, 4, 355);
    			attr_dev(polygon1, "points", "6.211,2 10,2 10,5.789 8.579,4.368 6.447,6.5 5.5,5.553 7.632,3.421");
    			attr_dev(polygon1, "class", "svelte-mfbc6b");
    			add_location(polygon1, file$6, 17, 4, 423);
    			add_location(g, file$6, 15, 2, 347);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 12 12");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
    			attr_dev(svg, "class", "svelte-mfbc6b");
    			add_location(svg, file$6, 14, 0, 253);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, add_css$6);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LinkIcon",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/RssIcon.html generated by Svelte v3.40.0 */

    const file$5 = "src/components/RssIcon.html";

    function add_css$5(target) {
    	append_styles(target, "svelte-ibnekz", "svg.svelte-ibnekz{width:1em;height:1em}path.svelte-ibnekz{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnNzSWNvbi5odG1sIiwic291cmNlcyI6WyJSc3NJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxZW07XG4gICAgaGVpZ2h0OiAxZW07XG4gIH1cblxuICBwYXRoIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gIH1cbjwvc3R5bGU+XG5cbjwhLS0gU291cmNlOiBodHRwczovL2NvbW1vbnMud2lraW1lZGlhLm9yZy93aWtpL0ZpbGU6UnNzX2ZvbnRfYXdlc29tZS5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAtMjU2IDE3OTIgMTc5MicgcHJlc2VydmVBc3BlY3RSYXRpbz0neE1pbllNaW4nPlxuICA8ZyB0cmFuc2Zvcm09J21hdHJpeCgxLDAsMCwtMSwyMTIuNjEwMTcsMTM0Ni4xNjk1KSc+XG4gICAgPHBhdGggZD0nTSAzODQsMTkyIFEgMzg0LDExMiAzMjgsNTYgMjcyLDAgMTkyLDAgMTEyLDAgNTYsNTYgMCwxMTIgMCwxOTIgcSAwLDgwIDU2LDEzNiA1Niw1NiAxMzYsNTYgODAsMCAxMzYsLTU2IDU2LC01NiA1NiwtMTM2IHogTSA4OTYsNjkgUSA4OTgsNDEgODc5LDIxIDg2MSwwIDgzMiwwIEggNjk3IFEgNjcyLDAgNjU0LDE2LjUgNjM2LDMzIDYzNCw1OCA2MTIsMjg3IDQ0OS41LDQ0OS41IDI4Nyw2MTIgNTgsNjM0IDMzLDYzNiAxNi41LDY1NCAwLDY3MiAwLDY5NyB2IDEzNSBxIDAsMjkgMjEsNDcgMTcsMTcgNDMsMTcgaCA1IFEgMjI5LDg4MyAzNzUsODE1LjUgNTIxLDc0OCA2MzQsNjM0IDc0OCw1MjEgODE1LjUsMzc1IDg4MywyMjkgODk2LDY5IHogbSA1MTIsLTIgUSAxNDEwLDQwIDEzOTAsMjAgMTM3MiwwIDEzNDQsMCBIIDEyMDEgUSAxMTc1LDAgMTE1Ni41LDE3LjUgMTEzOCwzNSAxMTM3LDYwIDExMjUsMjc1IDEwMzYsNDY4LjUgOTQ3LDY2MiA4MDQuNSw4MDQuNSA2NjIsOTQ3IDQ2OC41LDEwMzYgMjc1LDExMjUgNjAsMTEzOCAzNSwxMTM5IDE3LjUsMTE1Ny41IDAsMTE3NiAwLDEyMDEgdiAxNDMgcSAwLDI4IDIwLDQ2IDE4LDE4IDQ0LDE4IGggMyBRIDMyOSwxMzk1IDU2OC41LDEyODggODA4LDExODEgOTk0LDk5NCAxMTgxLDgwOCAxMjg4LDU2OC41IDEzOTUsMzI5IDE0MDgsNjcgeicvPlxuICA8L2c+XG48L3N2Zz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxHQUFHLGNBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEdBQUcsQUFDYixDQUFDLEFBRUQsSUFBSSxjQUFDLENBQUMsQUFDSixJQUFJLENBQUUsWUFBWSxBQUNwQixDQUFDIn0= */");
    }

    function create_fragment$5(ctx) {
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
    			add_location(path, file$5, 14, 4, 337);
    			attr_dev(g, "transform", "matrix(1,0,0,-1,212.61017,1346.1695)");
    			add_location(g, file$5, 13, 2, 280);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 -256 1792 1792");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
    			attr_dev(svg, "class", "svelte-ibnekz");
    			add_location(svg, file$5, 12, 0, 179);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, add_css$5);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RssIcon",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/PaperclipIcon.html generated by Svelte v3.40.0 */

    const file$4 = "src/components/PaperclipIcon.html";

    function add_css$4(target) {
    	append_styles(target, "svelte-1bdkb67", "svg.svelte-1bdkb67{width:1.2em;height:1.2em}path.svelte-1bdkb67{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFwZXJjbGlwSWNvbi5odG1sIiwic291cmNlcyI6WyJQYXBlcmNsaXBJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxLjJlbTtcbiAgICBoZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG48IS0tIFNvdXJjZTogaHR0cHM6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9GaWxlOkFudHVfYXBwbGljYXRpb24tcnRmLnN2ZyAtLT5cbjxzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB2aWV3Qm94PScwIDAgMTYgMTYnIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPHBhdGggZD0nbTQwOSA1MzFsLTUuMjQ0IDYuNzMzYy0uOTgzIDEuMjYyLS43MDggMy41MTEuNTUgNC40OTcgMS4yNTkuOTg2IDMuNS43MSA0LjQ4NC0uNTUybDUuMjQ0LTYuNzMzLjY1NS0uODQyYy42NTYtLjg0Mi40NzItMi4zNDEtLjM2Ny0yLjk5OC0uODM5LS42NTgtMi4zMzQtLjQ3My0yLjk4OS4zNjhsLS42NTYuODQyLTMuOTMzIDUuMDUtLjY1Ni44NDJjLS4zMjguNDIxLS4yMzYgMS4xNy4xODMgMS40OTkuNDIuMzI5IDEuMTY3LjIzNyAxLjQ5NS0uMTg0bDQuNTg5LTUuODkxLjgzOS42NTgtNC41ODkgNS44OTFjLS42NTYuODQyLTIuMTUgMS4wMjYtMi45ODkuMzY4LS44MzktLjY1OC0xLjAyMy0yLjE1Ny0uMzY3LTIuOTk4bC42NTYtLjg0MiA0LjU4OS01Ljg5MWMuOTgzLTEuMjYyIDMuMjI1LTEuNTM4IDQuNDg0LS41NTIgMS4yNTkuOTg2IDEuNTM0IDMuMjM1LjU1MSA0LjQ5N2wtLjY1Ni44NDItNS4yNDQgNi43MzNjLTEuMzExIDEuNjgzLTQuMyAyLjA1MS01Ljk3OC43MzYtMS42NzgtMS4zMTUtMi4wNDUtNC4zMTMtLjczNC01Ljk5N2w1LjI0NC02LjczMy44MzkuNjU4JyB0cmFuc2Zvcm09J21hdHJpeCguODQ3ODIgMCAwIC44NDUyMS0zMzguODUtNDQ1LjY4KScgc3Ryb2tlPSdub25lJy8+XG48L3N2Zz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxHQUFHLGVBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLEtBQUssQUFDZixDQUFDLEFBRUQsSUFBSSxlQUFDLENBQUMsQUFDSixJQUFJLENBQUUsWUFBWSxBQUNwQixDQUFDIn0= */");
    }

    function create_fragment$4(ctx) {
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
    			add_location(path, file$4, 13, 2, 281);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
    			attr_dev(svg, "class", "svelte-1bdkb67");
    			add_location(svg, file$4, 12, 0, 187);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, add_css$4);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaperclipIcon",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Box.html generated by Svelte v3.40.0 */
    const file$3 = "src/components/Box.html";

    function add_css$3(target) {
    	append_styles(target, "svelte-1rjx8bp", ".rssbox.svelte-1rjx8bp.svelte-1rjx8bp{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon.svelte-1rjx8bp.svelte-1rjx8bp{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar.svelte-1rjx8bp.svelte-1rjx8bp{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date.svelte-1rjx8bp.svelte-1rjx8bp{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content.svelte-1rjx8bp.svelte-1rjx8bp{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content.svelte-1rjx8bp aside.svelte-1rjx8bp{clear:both;float:right}.rssbox-content.svelte-1rjx8bp aside a.svelte-1rjx8bp{display:block;margin-left:0.5em}.rssbox-image.svelte-1rjx8bp.svelte-1rjx8bp{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold.svelte-1rjx8bp.svelte-1rjx8bp{font-weight:bold}.rssbox-enclosure.svelte-1rjx8bp.svelte-1rjx8bp,.rssbox-source.svelte-1rjx8bp.svelte-1rjx8bp{display:block;width:1em}.rssbox-form.svelte-1rjx8bp.svelte-1rjx8bp{margin-bottom:0.8em}.rssbox-form.svelte-1rjx8bp input.svelte-1rjx8bp{padding:0.5em;background-color:#fff}.rssbox-promo.svelte-1rjx8bp.svelte-1rjx8bp{text-align:right;font-size:0.7em;letter-spacing:0.01em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94Lmh0bWwiLCJzb3VyY2VzIjpbIkJveC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tIFwic3ZlbHRlXCI7XG4gIGltcG9ydCB7IHVybHMgfSBmcm9tIFwiLi4vdXJsc1wiO1xuXG4gIGltcG9ydCBMaW5rSWNvbiBmcm9tIFwiLi9MaW5rSWNvbi5odG1sXCI7XG4gIGltcG9ydCBSc3NJY29uIGZyb20gXCIuL1Jzc0ljb24uaHRtbFwiO1xuICBpbXBvcnQgUGFwZXJjbGlwSWNvbiBmcm9tIFwiLi9QYXBlcmNsaXBJY29uLmh0bWxcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGZlZWQ7XG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRpY0lkID0gXCJyc3Nib3gtc3RhdGljLXN0eWxlc2hlZXRcIjtcbiAgICBjb25zdCBkeW5hbWljSWQgPSBcInJzc2JveC1keW5hbWljLXN0eWxlc2hlZXRcIjtcblxuICAgIGxldCBzdGF0aWNDc3MgPSB3aW5kb3dbc3RhdGljSWRdO1xuICAgIGxldCBkeW5hbWljQ3NzID0gd2luZG93W2R5bmFtaWNJZF07XG5cbiAgICBpZiAoIXN0YXRpY0Nzcykge1xuICAgICAgc3RhdGljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICBzdGF0aWNDc3MuaWQgPSBzdGF0aWNJZDtcbiAgICAgIHN0YXRpY0Nzcy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcbiAgICAgIHN0YXRpY0Nzcy5ocmVmID0gdXJscy5hcHAgKyBcIi9ib3guY3NzXCI7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0YXRpY0Nzcyk7XG4gICAgfVxuXG4gICAgaWYgKCFkeW5hbWljQ3NzKSB7XG4gICAgICBkeW5hbWljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgZHluYW1pY0Nzcy5pZCA9IGR5bmFtaWNJZDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZHluYW1pY0Nzcyk7XG4gICAgfVxuXG4gICAgY29uZmlnLnN1YnNjcmliZShzdGF0ZSA9PiB7XG4gICAgICBjb25zdCBjb2xvciA9IHN0YXRlLmxpbmtDb2xvcjtcblxuICAgICAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gICAgICBsZXQgcnVsZSA9XG4gICAgICAgIGAucnNzYm94W2RhdGEtbGluay1jb2xvcj1cIiR7IGNvbG9yIH1cIl0gYSB7XG4gICAgICAgICAgY29sb3I6ICR7IGNvbG9yIH07XG4gICAgICAgIH1gO1xuXG4gICAgICBpZiAoZHluYW1pY0Nzcy5pbm5lckhUTUwuaW5kZXhPZihydWxlKSA8IDApIGR5bmFtaWNDc3MuaW5uZXJIVE1MICs9IHJ1bGU7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGtiKGJ5dGVzKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIDEwMDApLnRvRml4ZWQoMikgKyBcIlxcdTIwMGFrQlwiO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZChkYXRhKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXhXaWR0aCA9IE1hdGgubWluKDEwMCwgaW1hZ2Uud2lkdGgpO1xuICAgICAgICBjb25zdCBmYWN0b3IgPSBpbWFnZS53aWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggLyBpbWFnZS53aWR0aCA6IDE7XG5cbiAgICAgICAgZnVsZmlsbCh7XG4gICAgICAgICAgd2lkdGg6IChpbWFnZS53aWR0aCAqIGZhY3RvcikgKyBcInB4XCIsXG4gICAgICAgICAgaGVpZ2h0OiAoaW1hZ2UuaGVpZ2h0ICogZmFjdG9yKSArIFwicHhcIlxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGltYWdlLnNyYyA9IGRhdGEuc291cmNlO1xuICAgIH0pO1xuICB9XG5cbiAgJDogaGVpZ2h0ID0gJGNvbmZpZy5oZWlnaHQgJiYgJGNvbmZpZy5oZWlnaHQgPiAtMSA/ICRjb25maWcuaGVpZ2h0ICsgXCJweFwiIDogXCIxMDAlXCI7XG4gICQ6IHdpZHRoID0gJGNvbmZpZy53aWR0aCA/ICRjb25maWcud2lkdGggKyBcInB4XCIgOiBcIjEwMCVcIjtcbiAgJDogaXRlbVRpdGxlQ2xhc3MgPSAhJGNvbmZpZy5jb21wYWN0ID8gXCJib2xkXCIgOiBcIlwiO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLnJzc2JveCB7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjMDAwO1xuICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDA7XG4gIH1cblxuICAucnNzYm94LWljb24ge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICB3aWR0aDogMWVtO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtdGl0bGViYXIge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGNvbG9yOiAjMDAwO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNhZGQ4ZTY7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICMwMDA7XG4gICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZGF0ZSB7XG4gICAgbWFyZ2luLXRvcDogMC4yZW07XG4gICAgZm9udC1zaXplOiAwLjhlbTtcbiAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IHtcbiAgICBoZWlnaHQ6IGF1dG87XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgICBjbGVhcjogYm90aDtcbiAgICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgfVxuXG4gIC5yc3Nib3gtY29udGVudCBhc2lkZSB7XG4gICAgY2xlYXI6IGJvdGg7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IGFzaWRlIGEge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtaW1hZ2Uge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICBtYXJnaW46IDAgMCAwLjVlbSAwLjVlbTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBsZWZ0IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcbiAgfVxuXG4gIC5yc3Nib3gtaXRlbS10aXRsZS5ib2xkIHtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxuXG4gIC5yc3Nib3gtZW5jbG9zdXJlLCAucnNzYm94LXNvdXJjZSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZm9ybSB7XG4gICAgbWFyZ2luLWJvdHRvbTogMC44ZW07XG4gIH1cblxuICAucnNzYm94LWZvcm0gaW5wdXQge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIH1cblxuICAucnNzYm94LXByb21vIHtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjAxZW07XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgZGF0YS1saW5rLWNvbG9yPSd7ICRjb25maWcubGlua0NvbG9yIH0nIGNsYXNzPSdyc3Nib3ggcnNzQm94JyBzdHlsZT0nbWF4LXdpZHRoOiB7IHdpZHRoIH07IGJvcmRlci1jb2xvcjogeyAkY29uZmlnLmZyYW1lQ29sb3IgfTsgYm9yZGVyLXJhZGl1czogeyAkY29uZmlnLnJhZGl1cyB9cHg7IGZvbnQ6IHsgJGNvbmZpZy5mb250RmFjZSB9OyBmbG9hdDogeyAkY29uZmlnLmFsaWduIH07Jz5cbiAgeyAjaWYgISRjb25maWcuaGVhZGxlc3MgfVxuICAgIDxkaXYgY2xhc3M9J3Jzc2JveC10aXRsZWJhcicgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfTsgYmFja2dyb3VuZC1jb2xvcjogeyAkY29uZmlnLnRpdGxlQmFyQ29sb3IgfTsgYm9yZGVyLWJvdHRvbS1jb2xvcjogeyAkY29uZmlnLmZyYW1lQ29sb3IgfTsnPlxuICAgICAgeyAjaWYgJGNvbmZpZy5zaG93WG1sQnV0dG9uIH1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWljb24nPlxuICAgICAgICAgIDxhIGhyZWY9J3sgJGNvbmZpZy51cmwgfScgdGl0bGU9J3sgJGZlZWQuZm9ybWF0IH0geyAkZmVlZC52ZXJzaW9uIH0nIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRpdGxlQmFyVGV4dENvbG9yIH0nPlxuICAgICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgPC9kaXY+XG4gICAgICB7IC9pZiB9XG4gICAgICA8ZGl2PlxuICAgICAgICA8YSBocmVmPSd7ICRmZWVkLmxpbmsgfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfTsnPlxuICAgICAgICAgIHsgJGZlZWQudGl0bGUgfVxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1kYXRlJz5cbiAgICAgICAgeyBmZWVkLmZvcm1hdERhdGUoJGZlZWQuZGF0ZSkgfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIHsgL2lmIH1cblxuICA8ZGl2IGNsYXNzPSdyc3Nib3gtY29udGVudCByc3NCb3hDb250ZW50JyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjogeyAkY29uZmlnLmJveEZpbGxDb2xvciB9OyBoZWlnaHQ6IHsgaGVpZ2h0IH07Jz5cbiAgICB7ICNpZiAkZmVlZC5pbWFnZSAmJiAhJGNvbmZpZy5jb21wYWN0IH1cbiAgICAgIHsgI2F3YWl0IGxvYWQoJGZlZWQuaW1hZ2UpIHRoZW4gaW1hZ2UgfVxuICAgICAgICA8YSBocmVmPSd7ICRmZWVkLmltYWdlLmxpbmsgfScgdGl0bGU9J3sgJGZlZWQuaW1hZ2UudGl0bGUgfSc+XG4gICAgICAgICAgPGRpdiBhbHQ9J3sgJGZlZWQuaW1hZ2UuZGVzY3JpcHRpb24gfScgY2xhc3M9J3Jzc2JveC1pbWFnZScgc3R5bGU9J2JhY2tncm91bmQtaW1hZ2U6IHVybCh7ICRmZWVkLmltYWdlLnNvdXJjZSB9KTsgd2lkdGg6IHsgaW1hZ2Uud2lkdGggfTsgaGVpZ2h0OiB7IGltYWdlLmhlaWdodCB9Oyc+PC9kaXY+XG4gICAgICAgIDwvYT5cbiAgICAgIHsgL2F3YWl0IH1cbiAgICB7IC9pZiB9XG5cbiAgICB7ICNlYWNoICRmZWVkLml0ZW1zIGFzIGl0ZW0sIGluZGV4IH1cbiAgICAgIHsgI2lmIGluZGV4IDwgJGNvbmZpZy5tYXhJdGVtcyB9XG4gICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLWNvbnRlbnQgcnNzQm94SXRlbUNvbnRlbnQnIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRleHRDb2xvciB9Jz5cbiAgICAgICAgICB7ICNpZiBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLXRpdGxlIHsgaXRlbVRpdGxlQ2xhc3MgfSc+XG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0ubGluayB9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0neyBpdGVtLmxpbmsgfSc+XG4gICAgICAgICAgICAgICAgICB7QGh0bWwgaXRlbS50aXRsZSB9XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICAgICAgICB7QGh0bWwgaXRlbS50aXRsZSB9XG4gICAgICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHsgL2lmIH1cblxuICAgICAgICAgIHsgI2lmICEkY29uZmlnLmNvbXBhY3QgfVxuICAgICAgICAgICAgPGFzaWRlPlxuICAgICAgICAgICAgICB7ICNpZiBpdGVtLnNvdXJjZSB9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0neyBpdGVtLnNvdXJjZS51cmwgfScgdGl0bGU9J3sgaXRlbS5zb3VyY2UudGl0bGUgfScgY2xhc3M9J3Jzc2JveC1zb3VyY2UnPlxuICAgICAgICAgICAgICAgICAgeyAjaWYgaXRlbS5zb3VyY2UudXJsLmVuZHNXaXRoKFwiLnhtbFwiKSB9XG4gICAgICAgICAgICAgICAgICAgIDxSc3NJY29uLz5cbiAgICAgICAgICAgICAgICAgIHsgOmVsc2UgfVxuICAgICAgICAgICAgICAgICAgICA8TGlua0ljb24vPlxuICAgICAgICAgICAgICAgICAgeyAvaWYgfVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgeyAvaWYgfVxuXG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0uZW5jbG9zdXJlcyB9XG4gICAgICAgICAgICAgICAgeyAjZWFjaCBpdGVtLmVuY2xvc3VyZXMgYXMgZW5jbG9zdXJlIH1cbiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9J3sgZW5jbG9zdXJlLnVybCB9JyB0aXRsZT0neyBrYihlbmNsb3N1cmUubGVuZ3RoKSB9IHsgZW5jbG9zdXJlLnR5cGUgfScgY2xhc3M9J3Jzc2JveC1lbmNsb3N1cmUnPlxuICAgICAgICAgICAgICAgICAgICA8UGFwZXJjbGlwSWNvbi8+XG4gICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgeyAvZWFjaCB9XG4gICAgICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgICAgIDwvYXNpZGU+XG4gICAgICAgICAgICB7QGh0bWwgaXRlbS5kZXNjcmlwdGlvbiB9XG4gICAgICAgICAgeyAvaWYgfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIHsgL2lmIH1cbiAgICB7IC9lYWNoIH1cblxuICAgIHsgI2lmICRmZWVkLmlucHV0IH1cbiAgICAgIDxmb3JtIGNsYXNzPSdyc3Nib3gtZm9ybScgbWV0aG9kPSdnZXQnIGFjdGlvbj0neyAkZmVlZC5pbnB1dC5saW5rIH0nPlxuICAgICAgICA8aW5wdXQgdHlwZT0ndGV4dCcgbmFtZT0neyAkZmVlZC5pbnB1dC5uYW1lIH0nIHBsYWNlaG9sZGVyPSdFbnRlciBzZWFyY2ggJmFtcDsgaGl0IHJldHVybuKApicgZGF0YS1wbGFjZWhvbGRlcj0neyAkZmVlZC5pbnB1dC5kZXNjcmlwdGlvbiB9Jz5cbiAgICAgIDwvZm9ybT5cbiAgICB7IC9pZiB9XG4gICAgPGRpdiBjbGFzcz0ncnNzYm94LXByb21vIHJzc0JveFByb21vJz5cbiAgICAgIDxhIGhyZWY9J3sgdXJscy5hcHAgfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGV4dENvbG9yIH0nPlJTUyBCb3ggYnkgcDNrLm9yZzwvYT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEyRUUsT0FBTyw4QkFBQyxDQUFDLEFBQ1AsVUFBVSxDQUFFLFVBQVUsQ0FDdEIsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3RCLFdBQVcsQ0FBRSxVQUFVLENBQ3ZCLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLGFBQWEsQ0FBRSxDQUFDLENBQ2hCLGtCQUFrQixDQUFFLENBQUMsQUFDdkIsQ0FBQyxBQUVELFlBQVksOEJBQUMsQ0FBQyxBQUNaLEtBQUssQ0FBRSxLQUFLLENBQ1osS0FBSyxDQUFFLEdBQUcsQ0FDVixXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsZ0JBQWdCLDhCQUFDLENBQUMsQUFDaEIsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsSUFBSSxDQUNYLGdCQUFnQixDQUFFLE9BQU8sQ0FDekIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUM3QixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFBTSxBQUN4QixDQUFDLEFBRUQsWUFBWSw4QkFBQyxDQUFDLEFBQ1osVUFBVSxDQUFFLEtBQUssQ0FDakIsU0FBUyxDQUFFLEtBQUssQ0FDaEIsV0FBVyxDQUFFLE1BQU0sQUFDckIsQ0FBQyxBQUVELGVBQWUsOEJBQUMsQ0FBQyxBQUNmLE1BQU0sQ0FBRSxJQUFJLENBQ1osT0FBTyxDQUFFLEtBQUssQ0FDZCxVQUFVLENBQUUsTUFBTSxDQUNsQixVQUFVLENBQUUsSUFBSSxDQUNoQixnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsa0JBQWtCLENBQUUsd0JBQXdCLEFBQzlDLENBQUMsQUFFRCw4QkFBZSxDQUFDLEtBQUssZUFBQyxDQUFDLEFBQ3JCLEtBQUssQ0FBRSxJQUFJLENBQ1gsS0FBSyxDQUFFLEtBQUssQUFDZCxDQUFDLEFBRUQsOEJBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFDLENBQUMsQUFDdkIsT0FBTyxDQUFFLEtBQUssQ0FDZCxXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsYUFBYSw4QkFBQyxDQUFDLEFBQ2IsS0FBSyxDQUFFLEtBQUssQ0FDWixNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUN2QixtQkFBbUIsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUNoQyxpQkFBaUIsQ0FBRSxTQUFTLENBQzVCLGVBQWUsQ0FBRSxPQUFPLEFBQzFCLENBQUMsQUFFRCxrQkFBa0IsS0FBSyw4QkFBQyxDQUFDLEFBQ3ZCLFdBQVcsQ0FBRSxJQUFJLEFBQ25CLENBQUMsQUFFRCwrQ0FBaUIsQ0FBRSxjQUFjLDhCQUFDLENBQUMsQUFDakMsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsR0FBRyxBQUNaLENBQUMsQUFFRCxZQUFZLDhCQUFDLENBQUMsQUFDWixhQUFhLENBQUUsS0FBSyxBQUN0QixDQUFDLEFBRUQsMkJBQVksQ0FBQyxLQUFLLGVBQUMsQ0FBQyxBQUNsQixPQUFPLENBQUUsS0FBSyxDQUNkLGdCQUFnQixDQUFFLElBQUksQUFDeEIsQ0FBQyxBQUVELGFBQWEsOEJBQUMsQ0FBQyxBQUNiLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLGNBQWMsQ0FBRSxNQUFNLEFBQ3hCLENBQUMifQ== */");
    }

    function get_each_context$1(ctx, list, i) {
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
    			add_location(a, file$3, 170, 8, 4048);
    			add_location(div0, file$3, 169, 6, 4034);
    			attr_dev(div1, "class", "rssbox-date svelte-1rjx8bp");
    			add_location(div1, file$3, 174, 6, 4178);
    			attr_dev(div2, "class", "rssbox-titlebar svelte-1rjx8bp");
    			set_style(div2, "color", /*$config*/ ctx[2].titleBarTextColor);
    			set_style(div2, "background-color", /*$config*/ ctx[2].titleBarColor);
    			set_style(div2, "border-bottom-color", /*$config*/ ctx[2].frameColor);
    			add_location(div2, file$3, 161, 4, 3600);
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
    			add_location(a, file$3, 164, 10, 3846);
    			attr_dev(div, "class", "rssbox-icon svelte-1rjx8bp");
    			add_location(div, file$3, 163, 8, 3810);
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
    			add_location(div, file$3, 184, 10, 4566);
    			attr_dev(a, "href", a_href_value = /*$feed*/ ctx[6].image.link);
    			attr_dev(a, "title", a_title_value = /*$feed*/ ctx[6].image.title);
    			attr_dev(a, "class", "svelte-1rjx8bp");
    			add_location(a, file$3, 183, 8, 4494);
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
    function create_if_block_1$1(ctx) {
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
    			add_location(div, file$3, 191, 8, 4869);
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
    		id: create_if_block_1$1.name,
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
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "rssbox-item-title " + /*itemTitleClass*/ ctx[3] + " svelte-1rjx8bp");
    			add_location(div, file$3, 193, 12, 4999);
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
    function create_else_block_1$1(ctx) {
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
    		id: create_else_block_1$1.name,
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
    			add_location(a, file$3, 195, 16, 5098);
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
    			add_location(aside, file$3, 205, 12, 5349);
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
    	const if_block_creators = [create_if_block_5, create_else_block$2];
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
    			add_location(a, file$3, 207, 16, 5407);
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
    function create_else_block$2(ctx) {
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
    		id: create_else_block$2.name,
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
    			add_location(a, file$3, 218, 18, 5821);
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
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*index*/ ctx[9] < /*$config*/ ctx[2].maxItems && create_if_block_1$1(ctx);

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
    					if_block = create_if_block_1$1(ctx);
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(190:4) { #each $feed.items as item, index }",
    		ctx
    	});

    	return block;
    }

    // (231:4) { #if $feed.input }
    function create_if_block$2(ctx) {
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
    			add_location(input, file$3, 232, 8, 6264);
    			attr_dev(form, "class", "rssbox-form svelte-1rjx8bp");
    			attr_dev(form, "method", "get");
    			attr_dev(form, "action", form_action_value = /*$feed*/ ctx[6].input.link);
    			add_location(form, file$3, 231, 6, 6186);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(231:4) { #if $feed.input }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
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
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block2 = /*$feed*/ ctx[6].input && create_if_block$2(ctx);

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
    			add_location(a, file$3, 236, 6, 6479);
    			attr_dev(div0, "class", "rssbox-promo rssBoxPromo svelte-1rjx8bp");
    			add_location(div0, file$3, 235, 4, 6434);
    			attr_dev(div1, "class", "rssbox-content rssBoxContent svelte-1rjx8bp");
    			set_style(div1, "background-color", /*$config*/ ctx[2].boxFillColor);
    			set_style(div1, "height", /*height*/ ctx[5]);
    			add_location(div1, file$3, 180, 2, 4281);
    			attr_dev(div2, "data-link-color", div2_data_link_color_value = /*$config*/ ctx[2].linkColor);
    			attr_dev(div2, "class", "rssbox rssBox svelte-1rjx8bp");
    			set_style(div2, "max-width", /*width*/ ctx[4]);
    			set_style(div2, "border-color", /*$config*/ ctx[2].frameColor);
    			set_style(div2, "border-radius", /*$config*/ ctx[2].radius + "px");
    			set_style(div2, "font", /*$config*/ ctx[2].fontFace);
    			set_style(div2, "float", /*$config*/ ctx[2].align);
    			add_location(div2, file$3, 159, 0, 3341);
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
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    					if_block2 = create_if_block$2(ctx);
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
    		id: create_fragment$3.name,
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

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { feed: 0, config: 1 }, add_css$3);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$3.name
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

    /* src/components/Referrers.html generated by Svelte v3.40.0 */
    const file$2 = "src/components/Referrers.html";

    function add_css$2(target) {
    	append_styles(target, "svelte-oo3062", "details.svelte-oo3062{line-height:1.2em}code.svelte-oo3062{margin-right:0.3em;color:#bbb;font-size:0.7em;white-space:pre}summary.svelte-oo3062{outline:none}.referrer.svelte-oo3062{white-space:nowrap}.feedLink.svelte-oo3062{position:relative;top:2px;color:#ffa600}.feedLink[disabled].svelte-oo3062{pointer-events:none}.feedLink.svelte-oo3062 svg{pointer-events:none}.feedLink[disabled].svelte-oo3062 svg{color:#ddd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVmZXJyZXJzLmh0bWwiLCJzb3VyY2VzIjpbIlJlZmVycmVycy5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tIFwic3ZlbHRlXCI7XG4gIGltcG9ydCB7IHJlZmVycmVycyB9IGZyb20gXCIuLi9zdG9yZXNcIjtcblxuICBpbXBvcnQgUnNzSWNvbiBmcm9tIFwiLi9Sc3NJY29uLmh0bWxcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGNvbmZpZztcblxuICBvbk1vdW50KCgpID0+IHtcbiAgICBpZiAoXCJvcGVuXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRldGFpbHNcIikgPT09IGZhbHNlKSB7XG4gICAgICBsb2FkKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBmb3JtYXQoZmxvYXQpIHtcbiAgICBpZiAoZmxvYXQgPCAwLjAxKSByZXR1cm4gXCI8IDAuMDFcIjtcbiAgICByZXR1cm4gZmxvYXQudG9GaXhlZCgyKS5wYWRTdGFydCg2KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgcmVmZXJyZXJzLmZldGNoKCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVGZWVkTGluayhldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBjb25zdCByZWZlcnJlciA9ICRyZWZlcnJlcnNbZXZlbnQudGFyZ2V0LmRhdGFzZXQuaW5kZXhdO1xuICAgIGNvbnN0IGRhdGEgPSByZWZlcnJlci5tZXRhZGF0YTtcblxuICAgIGlmICghZGF0YSB8fCAhZGF0YS5mZWVkVXJscykgcmV0dXJuO1xuXG4gICAgbGV0IGZlZWRVcmwgPSBldmVudC50YXJnZXQuaHJlZjtcbiAgICBsZXQgaW5kZXggPSBkYXRhLmZlZWRVcmxzLmluZGV4T2YoZmVlZFVybCkgKyAxO1xuXG4gICAgaWYgKGluZGV4ID49IGRhdGEuZmVlZFVybHMubGVuZ3RoKSBpbmRleCA9IDA7XG5cbiAgICBmZWVkVXJsID0gZGF0YS5mZWVkVXJsc1tpbmRleF07XG5cbiAgICBpZiAoZXZlbnQudGFyZ2V0LmhyZWYgPT09IGZlZWRVcmwpIHJldHVybjtcblxuICAgIGV2ZW50LnRhcmdldC5ocmVmID0gZmVlZFVybDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrRmVlZExpbmsoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkpIHtcbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggdGhlIGZlZWRVcmxzIGFycmF5IHRvIGFsbG93IGFjY2Vzc2luZyBtdWx0aXBsZSBmZWVkIHVybHMgdmlhIG9uZSBpY29uXG4gICAgICB1cGRhdGVGZWVkTGluayhldmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgY29uZmlnIHN0b3JlIHdpdGggdGhlIGZlZWQgdXJsIHRvIGxvYWQgdGhlIGNvcnJlc3BvbmRpbmcgcnNzIGJveFxuICAgICAgJGNvbmZpZy51cmwgPSBldmVudC50YXJnZXQuaHJlZjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRGZWVkTGlua0Rpc2FibGVkU3RhdGUoaW5kZXgpIHtcbiAgICBjb25zdCByZWZlcnJlciA9ICRyZWZlcnJlcnNbaW5kZXhdO1xuICAgIGNvbnN0IGRhdGEgPSByZWZlcnJlci5tZXRhZGF0YTtcblxuICAgIGlmICghZGF0YSB8fCAhZGF0YS5mZWVkVXJscykgcmV0dXJuIFwiZGlzYWJsZWRcIjtcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgZGV0YWlscyB7XG4gICAgbGluZS1oZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgY29kZSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAwLjNlbTtcbiAgICBjb2xvcjogI2JiYjtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gIH1cblxuICBzdW1tYXJ5IHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG5cbiAgLnJlZmVycmVyIHtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLmZlZWRMaW5rIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgdG9wOiAycHg7XG4gICAgY29sb3I6ICNmZmE2MDA7XG4gIH1cblxuICAuZmVlZExpbmtbZGlzYWJsZWRdIHtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuXG4gIC5mZWVkTGluayA6Z2xvYmFsKHN2Zykge1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB9XG5cbiAgLmZlZWRMaW5rW2Rpc2FibGVkXSA6Z2xvYmFsKHN2Zykge1xuICAgIGNvbG9yOiAjZGRkO1xuICB9XG48L3N0eWxlPlxuXG48ZGV0YWlscyBpZD1cInJlZmVycmVyc1wiIG9uOnRvZ2dsZT17IGxvYWQgfT5cbiAgPHN1bW1hcnk+PC9zdW1tYXJ5PlxuICB7ICNpZiAkcmVmZXJyZXJzLmxlbmd0aCB9XG4gICAgeyAjZWFjaCAkcmVmZXJyZXJzIGFzIHJlZmVycmVyLCBpbmRleCB9XG4gICAgICA8ZGl2IGNsYXNzPSdyZWZlcnJlcic+XG4gICAgICAgIDxjb2RlPnsgZm9ybWF0KHJlZmVycmVyLnBlcmNlbnRhZ2UpIH08L2NvZGU+XG4gICAgICAgIDwhLS0gc3ZlbHRlLWlnbm9yZSBhMTF5LW1vdXNlLWV2ZW50cy1oYXZlLWtleS1ldmVudHMgLS0+XG4gICAgICAgIDxhIGhyZWY9Jy4nXG4gICAgICAgICAgICBjbGFzcz0nZmVlZExpbmsnXG4gICAgICAgICAgICBkaXNhYmxlZD17IGdldEZlZWRMaW5rRGlzYWJsZWRTdGF0ZShpbmRleCkgfVxuICAgICAgICAgICAgZGF0YS1pbmRleD17IGluZGV4IH1cbiAgICAgICAgICAgIG9uOm1vdXNlb3ZlcnxvbmNlPXsgdXBkYXRlRmVlZExpbmsgfVxuICAgICAgICAgICAgb246Y2xpY2s9eyBjbGlja0ZlZWRMaW5rIH0+XG4gICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICA8L2E+XG4gICAgICAgIDxhIGhyZWY9J3sgcmVmZXJyZXIudXJsIH0nPnsgcmVmZXJyZXIuaG9zdCB9PC9hPlxuICAgICAgPC9kaXY+XG4gICAgeyAvZWFjaCB9XG4gIHsgOmVsc2UgfVxuICAgIExvYWRpbmfigKZcbiAgeyAvaWYgfVxuPC9kZXRhaWxzPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWlFRSxPQUFPLGNBQUMsQ0FBQyxBQUNQLFdBQVcsQ0FBRSxLQUFLLEFBQ3BCLENBQUMsQUFFRCxJQUFJLGNBQUMsQ0FBQyxBQUNKLFlBQVksQ0FBRSxLQUFLLENBQ25CLEtBQUssQ0FBRSxJQUFJLENBQ1gsU0FBUyxDQUFFLEtBQUssQ0FDaEIsV0FBVyxDQUFFLEdBQUcsQUFDbEIsQ0FBQyxBQUVELE9BQU8sY0FBQyxDQUFDLEFBQ1AsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsU0FBUyxjQUFDLENBQUMsQUFDVCxXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBRUQsU0FBUyxjQUFDLENBQUMsQUFDVCxRQUFRLENBQUUsUUFBUSxDQUNsQixHQUFHLENBQUUsR0FBRyxDQUNSLEtBQUssQ0FBRSxPQUFPLEFBQ2hCLENBQUMsQUFFRCxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQUMsQ0FBQyxBQUNuQixjQUFjLENBQUUsSUFBSSxBQUN0QixDQUFDLEFBRUQsdUJBQVMsQ0FBQyxBQUFRLEdBQUcsQUFBRSxDQUFDLEFBQ3RCLGNBQWMsQ0FBRSxJQUFJLEFBQ3RCLENBQUMsQUFFRCxTQUFTLENBQUMsUUFBUSxlQUFDLENBQUMsQUFBUSxHQUFHLEFBQUUsQ0FBQyxBQUNoQyxLQUFLLENBQUUsSUFBSSxBQUNiLENBQUMifQ== */");
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (122:2) { :else }
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading…");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(122:2) { :else }",
    		ctx
    	});

    	return block;
    }

    // (106:2) { #if $referrers.length }
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$referrers*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			if (dirty & /*$referrers, getFeedLinkDisabledState, updateFeedLink, clickFeedLink, format*/ 58) {
    				each_value = /*$referrers*/ ctx[1];
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(106:2) { #if $referrers.length }",
    		ctx
    	});

    	return block;
    }

    // (107:4) { #each $referrers as referrer, index }
    function create_each_block(ctx) {
    	let div;
    	let code;
    	let t0_value = format(/*referrer*/ ctx[7].percentage) + "";
    	let t0;
    	let t1;
    	let a0;
    	let rssicon;
    	let t2;
    	let a1;
    	let t3_value = /*referrer*/ ctx[7].host + "";
    	let t3;
    	let a1_href_value;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	rssicon = new RssIcon({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			code = element("code");
    			t0 = text(t0_value);
    			t1 = space();
    			a0 = element("a");
    			create_component(rssicon.$$.fragment);
    			t2 = space();
    			a1 = element("a");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(code, "class", "svelte-oo3062");
    			add_location(code, file$2, 108, 8, 2129);
    			attr_dev(a0, "href", ".");
    			attr_dev(a0, "class", "feedLink svelte-oo3062");
    			attr_dev(a0, "disabled", /*getFeedLinkDisabledState*/ ctx[5](/*index*/ ctx[9]));
    			attr_dev(a0, "data-index", /*index*/ ctx[9]);
    			add_location(a0, file$2, 110, 8, 2247);
    			attr_dev(a1, "href", a1_href_value = /*referrer*/ ctx[7].url);
    			add_location(a1, file$2, 118, 8, 2509);
    			attr_dev(div, "class", "referrer svelte-oo3062");
    			add_location(div, file$2, 107, 6, 2098);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, code);
    			append_dev(code, t0);
    			append_dev(div, t1);
    			append_dev(div, a0);
    			mount_component(rssicon, a0, null);
    			append_dev(div, t2);
    			append_dev(div, a1);
    			append_dev(a1, t3);
    			append_dev(div, t4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "mouseover", /*updateFeedLink*/ ctx[3], { once: true }, false, false),
    					listen_dev(a0, "click", /*clickFeedLink*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$referrers*/ 2) && t0_value !== (t0_value = format(/*referrer*/ ctx[7].percentage) + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$referrers*/ 2) && t3_value !== (t3_value = /*referrer*/ ctx[7].host + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*$referrers*/ 2 && a1_href_value !== (a1_href_value = /*referrer*/ ctx[7].url)) {
    				attr_dev(a1, "href", a1_href_value);
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(107:4) { #each $referrers as referrer, index }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let details;
    	let summary;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$referrers*/ ctx[1].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			t = space();
    			if_block.c();
    			attr_dev(summary, "class", "svelte-oo3062");
    			add_location(summary, file$2, 104, 2, 2000);
    			attr_dev(details, "id", "referrers");
    			attr_dev(details, "class", "svelte-oo3062");
    			add_location(details, file$2, 103, 0, 1954);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(details, t);
    			if_blocks[current_block_type_index].m(details, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(details, "toggle", /*load*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(details, null);
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
    			if (detaching) detach_dev(details);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
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

    function format(float) {
    	if (float < 0.01) return "< 0.01";
    	return float.toFixed(2).padStart(6);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $referrers;

    	let $config,
    		$$unsubscribe_config = noop,
    		$$subscribe_config = () => ($$unsubscribe_config(), $$unsubscribe_config = subscribe(config, $$value => $$invalidate(6, $config = $$value)), config);

    	validate_store(referrers, 'referrers');
    	component_subscribe($$self, referrers, $$value => $$invalidate(1, $referrers = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_config());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Referrers', slots, []);
    	let { config } = $$props;
    	validate_store(config, 'config');
    	$$subscribe_config();

    	onMount(() => {
    		if ("open" in document.createElement("details") === false) {
    			load();
    		}
    	});

    	function load() {
    		referrers.fetch();
    	}

    	function updateFeedLink(event) {
    		event.preventDefault();
    		const referrer = $referrers[event.target.dataset.index];
    		const data = referrer.metadata;
    		if (!data || !data.feedUrls) return;
    		let feedUrl = event.target.href;
    		let index = data.feedUrls.indexOf(feedUrl) + 1;
    		if (index >= data.feedUrls.length) index = 0;
    		feedUrl = data.feedUrls[index];
    		if (event.target.href === feedUrl) return;
    		event.target.href = feedUrl;
    	}

    	function clickFeedLink(event) {
    		event.preventDefault();

    		if (event.metaKey) {
    			// Cycle through the feedUrls array to allow accessing multiple feed urls via one icon
    			updateFeedLink(event);
    		} else {
    			// Update the config store with the feed url to load the corresponding rss box
    			set_store_value(config, $config.url = event.target.href, $config);
    		}
    	}

    	function getFeedLinkDisabledState(index) {
    		const referrer = $referrers[index];
    		const data = referrer.metadata;
    		if (!data || !data.feedUrls) return "disabled";
    	}

    	const writable_props = ['config'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Referrers> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('config' in $$props) $$subscribe_config($$invalidate(0, config = $$props.config));
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		referrers,
    		RssIcon,
    		config,
    		format,
    		load,
    		updateFeedLink,
    		clickFeedLink,
    		getFeedLinkDisabledState,
    		$referrers,
    		$config
    	});

    	$$self.$inject_state = $$props => {
    		if ('config' in $$props) $$subscribe_config($$invalidate(0, config = $$props.config));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		config,
    		$referrers,
    		load,
    		updateFeedLink,
    		clickFeedLink,
    		getFeedLinkDisabledState
    	];
    }

    class Referrers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { config: 0 }, add_css$2);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Referrers",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[0] === undefined && !('config' in props)) {
    			console.warn("<Referrers> was created without expected prop 'config'");
    		}
    	}

    	get config() {
    		throw new Error("<Referrers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Referrers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Configurator.html generated by Svelte v3.40.0 */

    const { Object: Object_1 } = globals;
    const file$1 = "src/components/Configurator.html";

    function add_css$1(target) {
    	append_styles(target, "svelte-uicuex", "table.svelte-uicuex.svelte-uicuex{overflow:auto}tr.svelte-uicuex td.svelte-uicuex:first-child{color:#bbb;text-align:right;white-space:nowrap}summary.svelte-uicuex.svelte-uicuex{outline:none}button.svelte-uicuex.svelte-uicuex{width:7em;height:2.5em;padding:initial;box-sizing:border-box}.top.svelte-uicuex.svelte-uicuex{vertical-align:top}.source.svelte-uicuex.svelte-uicuex{line-height:1em}[name=url].svelte-uicuex.svelte-uicuex,[name=fontFace].svelte-uicuex.svelte-uicuex,[name=code].svelte-uicuex.svelte-uicuex{width:90%;height:2.5em;box-sizing:border-box}[type=color].svelte-uicuex.svelte-uicuex,[type=number].svelte-uicuex.svelte-uicuex{width:7em;height:2.5em;box-sizing:border-box}input[type='color'].svelte-uicuex.svelte-uicuex{padding:3px}[name=code].svelte-uicuex.svelte-uicuex{color:#bbb;height:10em;overflow:hidden;resize:vertical}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlndXJhdG9yLmh0bWwiLCJzb3VyY2VzIjpbIkNvbmZpZ3VyYXRvci5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIlxuPHNjcmlwdD5cbiAgaW1wb3J0IHsgdXJscyB9IGZyb20gXCIuLi91cmxzXCI7XG5cbiAgaW1wb3J0IFJlZmVycmVycyBmcm9tIFwiLi9SZWZlcnJlcnMuaHRtbFwiO1xuXG4gIC8vIFN0b3JlcyBjb21pbmcgaW4gdmlhIHByb3BzXG4gIGV4cG9ydCBsZXQgZmVlZDtcbiAgZXhwb3J0IGxldCBjb25maWc7XG5cbiAgZnVuY3Rpb24gdmFsaWRhdGUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghZXZlbnQudGFyZ2V0LmNoZWNrVmFsaWRpdHkoKSkgZXZlbnQudGFyZ2V0LnJlcG9ydFZhbGlkaXR5KCk7XG4gIH1cblxuICBmdW5jdGlvbiByZWxvYWQoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vIFRoZSBhcHDigJlzIHN1YmNyaXB0aW9uIG9ubHkgdHJpZ2dlcnMgYSBmZXRjaCB3aGVuIHRoZSB1cmwgaGFzIGNoYW5nZWRcbiAgICBjb25maWcuc2V0KHsgdXJsOiBudWxsIH0pO1xuICAgIGNvbmZpZy5zZXQoeyB1cmw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFtuYW1lPVxcXCJ1cmxcXFwiXVwiKS52YWx1ZSB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHkoZXZlbnQpIHtcbiAgICB0cnkge1xuICAgICAgZXZlbnQudGFyZ2V0LnNlbGVjdCgpO1xuICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJjb3B5XCIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB2b2lkIGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGFiZWwoZXZlbnQpIHtcbiAgICBjb25zdCBzaWJsaW5nID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIGxldCBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3RvcihcImlucHV0XCIpO1xuICAgIGlmICghaW5wdXQpIGlucHV0ID0gc2libGluZy5xdWVyeVNlbGVjdG9yKFwic3VtbWFyeVwiKTtcbiAgICBpZiAoIWlucHV0KSBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3RvcihcInRleHRhcmVhXCIpO1xuICAgIGlmICghaW5wdXQpIHJldHVybjtcbiAgICBpZiAoaW5wdXQuY2xpY2spIGlucHV0LmNsaWNrKCk7XG4gICAgaWYgKGlucHV0LnNlbGVjdCkgaW5wdXQuc2VsZWN0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRRdWVyeSgpIHtcbiAgICBjb25zdCBxdWVyeSA9IFtdO1xuXG4gICAgT2JqZWN0LmtleXMoJGNvbmZpZykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJGNvbmZpZ1trZXldO1xuICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHZhbHVlID0gXCJcIjtcbiAgICAgIHF1ZXJ5LnB1c2goa2V5ICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBxdWVyeS5qb2luKFwiJlwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvZGUoKSB7XG4gICAgY29uc3QgcXVlcnkgPSBnZXRRdWVyeSgpLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKTtcbiAgICAvLyBOZWVkIHRvIGJlIGNhcmVmdWwgd2l0aCB0aGUgc2NyaXB0LWVuZC10YWcgdG8gcHJldmVudCB0ZW1wbGF0ZSBlcnJvclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8zODQwXG4gICAgcmV0dXJuIGA8c2NyaXB0IGFzeW5jIGRlZmVyIHNyYz0nJHsgdXJscy5hcHAgfS9tYWluLmpzPyR7IHF1ZXJ5IH0nPiR7IFwiPFwiIH0vc2NyaXB0PmA7XG4gIH1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIHRhYmxlIHtcbiAgICBvdmVyZmxvdzogYXV0bztcbiAgfVxuXG4gIHRyIHRkOmZpcnN0LWNoaWxkIHtcbiAgICBjb2xvcjogI2JiYjtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgc3VtbWFyeSB7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIGJ1dHRvbiB7XG4gICAgd2lkdGg6IDdlbTtcbiAgICBoZWlnaHQ6IDIuNWVtO1xuICAgIHBhZGRpbmc6IGluaXRpYWw7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgfVxuXG4gIC50b3Age1xuICAgIHZlcnRpY2FsLWFsaWduOiB0b3A7XG4gIH1cblxuICAuc291cmNlIHtcbiAgICBsaW5lLWhlaWdodDogMWVtO1xuICB9XG5cbiAgW25hbWU9dXJsXSwgW25hbWU9Zm9udEZhY2VdLCBbbmFtZT1jb2RlXSB7XG4gICAgd2lkdGg6IDkwJTtcbiAgICBoZWlnaHQ6IDIuNWVtO1xuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIH1cblxuICBbdHlwZT1jb2xvcl0sIFt0eXBlPW51bWJlcl0ge1xuICAgIHdpZHRoOiA3ZW07XG4gICAgaGVpZ2h0OiAyLjVlbTtcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICB9XG5cbiAgaW5wdXRbdHlwZT0nY29sb3InXSB7XG4gICAgcGFkZGluZzogM3B4O1xuICB9XG5cbiAgW25hbWU9Y29kZV0ge1xuICAgIGNvbG9yOiAjYmJiO1xuICAgIGhlaWdodDogMTBlbTtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHJlc2l6ZTogdmVydGljYWw7XG4gIH1cbjwvc3R5bGU+XG5cbjxmb3JtPlxuICA8dGFibGUgY2xhc3M9J3RhYmxlJz5cbiAgICA8Y29sZ3JvdXA+XG4gICAgICA8Y29sIHdpZHRoPScqJz5cbiAgICAgIDxjb2wgd2lkdGg9JzkwJSc+XG4gICAgPC9jb2xncm91cD5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3VybCc+RmVlZCBVUkw8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J3VybCcgdmFsdWU9eyAkY29uZmlnLnVybCB9IGlkPSd1cmwnIG5hbWU9J3VybCcgcmVxdWlyZWQgb246Y2hhbmdlPXsgcmVsb2FkIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlRpdGxlPC90ZD5cbiAgICAgIDx0ZD57ICRmZWVkLnRpdGxlIH08L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgZm9yPSdkZXNjcmlwdGlvbicgb246Y2xpY2s9eyBjbGlja0xhYmVsIH0+RGVzY3JpcHRpb248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGRldGFpbHMgaWQ9J2Rlc2NyaXB0aW9uJz5cbiAgICAgICAgICA8c3VtbWFyeT48L3N1bW1hcnk+XG4gICAgICAgICAgeyAkZmVlZC5kZXNjcmlwdGlvbiB9XG4gICAgICAgIDwvZGV0YWlscz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+TGFzdCBidWlsZDwvdGQ+XG4gICAgICA8dGQ+eyBmZWVkLmZvcm1hdERhdGUoJGZlZWQuZGF0ZSkgfTwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+U291cmNlPC90ZD5cbiAgICAgIDx0ZCBjbGFzcz0nc291cmNlJz5cbiAgICAgICAgeyAjaWYgJGZlZWQubG9hZGluZyB9XG4gICAgICAgICAgTG9hZGluZy4uLlxuICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICA8YSBocmVmPSd7ICRjb25maWcudXJsIH0nPnsgJGZlZWQuZm9ybWF0IH0geyAkZmVlZC52ZXJzaW9uIH08L2E+XG4gICAgICAgIHsgL2lmIH1cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J21heEl0ZW1zJz5NYXguIGl0ZW1zPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIGlkPSdtYXhJdGVtcycgbmFtZT0nbWF4SXRlbXMnIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5tYXhJdGVtcyB9JyBtaW49MSBtYXg9OTkgcmVxdWlyZWQgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3dpZHRoJz5NYXguIHdpZHRoPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIGlkPSd3aWR0aCcgbmFtZT0nd2lkdGgnIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy53aWR0aCB9JyBtaW49MTAwIG1heD05OTk5IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0gcGxhY2Vob2xkZXI9J3NwYXJlJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J2hlaWdodCc+Q29udGVudCBoZWlnaHQ8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J251bWJlcicgaWQ9J2hlaWdodCcgbmFtZT0naGVpZ2h0JyBiaW5kOnZhbHVlPSd7ICRjb25maWcuaGVpZ2h0IH0nIG1pbj0xMDAgbWF4PTk5OTkgb246Y2hhbmdlPXsgdmFsaWRhdGUgfSBwbGFjZWhvbGRlcj0nc3BhcmUnPlxuICAgICAgICA8c21hbGw+cHg8L3NtYWxsPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0ncmFkaXVzJz5Db3JuZXIgcmFkaXVzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIGlkPSdyYWRpdXMnIG5hbWU9J3JhZGl1cycgYmluZDp2YWx1ZT0neyAkY29uZmlnLnJhZGl1cyB9JyBtaW49MCBtYXg9MjAgcmVxdWlyZWQgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3Nob3dYbWxCdXR0b24nPlJTUyBidXR0b248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NoZWNrYm94JyBpZD0nc2hvd1htbEJ1dHRvbicgbmFtZT0nc2hvd1htbEJ1dHRvbicgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLnNob3dYbWxCdXR0b24gfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J2NvbXBhY3QnPkNvbXBhY3QgdmlldzwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdjb21wYWN0JyBuYW1lPSdjb21wYWN0JyB2YWx1ZT0nMScgYmluZDpjaGVja2VkPSd7ICRjb25maWcuY29tcGFjdCB9JyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0naGVhZGxlc3MnPkhlYWRsZXNzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2hlYWRsZXNzJyBuYW1lPSdoZWFkbGVzcycgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLmhlYWRsZXNzIH0nIG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSdmcmFtZUNvbG9yJz5GcmFtZSBjb2xvcjwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY29sb3InIGlkPSdmcmFtZUNvbG9yJyBuYW1lPSdmcmFtZUNvbG9yJyBiaW5kOnZhbHVlPSd7ICRjb25maWcuZnJhbWVDb2xvciB9JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3RpdGxlQmFyQ29sb3InPlRpdGxlYmFyIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgaWQ9J3RpdGxlQmFyQ29sb3InIG5hbWU9J3RpdGxlQmFyQ29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy50aXRsZUJhckNvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0ndGl0bGVCYXJUZXh0Q29sb3InPlRpdGxlIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgaWQ9J3RpdGxlQmFyVGV4dENvbG9yJyBuYW1lPSd0aXRsZUJhclRleHRDb2xvcicgYmluZDp2YWx1ZT0neyAkY29uZmlnLnRpdGxlQmFyVGV4dENvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0nYm94RmlsbENvbG9yJz5Cb3ggY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBpZD0nYm94RmlsbENvbG9yJyBuYW1lPSdib3hGaWxsQ29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5ib3hGaWxsQ29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSd0ZXh0Q29sb3InPlRleHQgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBpZD0ndGV4dENvbG9yJyBuYW1lPSd0ZXh0Q29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy50ZXh0Q29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSdsaW5rQ29sb3InPkxpbmsgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBpZD0nbGlua0NvbG9yJyBuYW1lPSdsaW5rQ29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5saW5rQ29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSdmb250RmFjZSc+Rm9udCBmYWNlPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCBpZD0nZm9udEZhY2UnIG5hbWU9J2ZvbnRGYWNlJyBiaW5kOnZhbHVlPSd7ICRjb25maWcuZm9udEZhY2UgfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfSBwYXR0ZXJuPSdbXFxkLl0rKD86cHR8cHh8ZW18JSkrXFxzK1tcXHNcXHdcXC0sXSsnIHBsYWNlaG9sZGVyPSdlLmcuIDEwcHQgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+PC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgeyAjaWYgJGZlZWQubG9hZGluZyB9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz0nYnRuIGJ0bi1zbSBidG4tYycgZGlzYWJsZWQ+TG9hZGluZy4uLjwvYnV0dG9uPlxuICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPSdidG4gYnRuLXNtIGJ0bi1iJyBvbjpjbGljaz17IHJlbG9hZCB9PlJlbG9hZDwvYnV0dG9uPlxuICAgICAgICB7IC9pZiB9XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyIHN0eWxlPSd2ZXJ0aWNhbC1hbGlnbjogdG9wJz5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0nY29kZSc+XG4gICAgICAgICAgSFRNTCBjb2RlPGJyPlxuICAgICAgICAgIChjb3B5JmFtcDtwYXN0YSlcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDx0ZXh0YXJlYSBpZD0nY29kZScgbmFtZT0nY29kZScgY29scz0nMTAnIHJvd3M9JzMnIHJlYWRvbmx5IG9uOmNsaWNrPXsgY29weSB9PnsgY29kZSgkY29uZmlnKSB9PC90ZXh0YXJlYT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQgY2xhc3M9J3RvcCc+XG4gICAgICAgIDxsYWJlbCBmb3I9J3JlZmVycmVycycgb246Y2xpY2s9eyBjbGlja0xhYmVsIH0gdGl0bGU9J3NpbmNlIG1pZG5pZ2h0IChHTVQpJz5cbiAgICAgICAgICBSZWZlcnJlcnNcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQgY2xhc3M9J3RvcCc+XG4gICAgICAgIDxSZWZlcnJlcnMgeyBjb25maWcgfS8+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gIDwvdGFibGU+XG48L2Zvcm0+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBOERFLEtBQUssNEJBQUMsQ0FBQyxBQUNMLFFBQVEsQ0FBRSxJQUFJLEFBQ2hCLENBQUMsQUFFRCxnQkFBRSxDQUFDLGdCQUFFLFlBQVksQUFBQyxDQUFDLEFBQ2pCLEtBQUssQ0FBRSxJQUFJLENBQ1gsVUFBVSxDQUFFLEtBQUssQ0FDakIsV0FBVyxDQUFFLE1BQU0sQUFDckIsQ0FBQyxBQUVELE9BQU8sNEJBQUMsQ0FBQyxBQUNQLE9BQU8sQ0FBRSxJQUFJLEFBQ2YsQ0FBQyxBQUVELE1BQU0sNEJBQUMsQ0FBQyxBQUNOLEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEtBQUssQ0FDYixPQUFPLENBQUUsT0FBTyxDQUNoQixVQUFVLENBQUUsVUFBVSxBQUN4QixDQUFDLEFBRUQsSUFBSSw0QkFBQyxDQUFDLEFBQ0osY0FBYyxDQUFFLEdBQUcsQUFDckIsQ0FBQyxBQUVELE9BQU8sNEJBQUMsQ0FBQyxBQUNQLFdBQVcsQ0FBRSxHQUFHLEFBQ2xCLENBQUMsQUFFRCxDQUFDLElBQUksQ0FBQyxHQUFHLDZCQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSw2QkFBQyxDQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBQyxDQUFDLEFBQ3hDLEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEtBQUssQ0FDYixVQUFVLENBQUUsVUFBVSxBQUN4QixDQUFDLEFBRUQsQ0FBQyxJQUFJLENBQUMsS0FBSyw2QkFBQyxDQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyw0QkFBQyxDQUFDLEFBQzNCLEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEtBQUssQ0FDYixVQUFVLENBQUUsVUFBVSxBQUN4QixDQUFDLEFBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsNEJBQUMsQ0FBQyxBQUNuQixPQUFPLENBQUUsR0FBRyxBQUNkLENBQUMsQUFFRCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsNEJBQUMsQ0FBQyxBQUNYLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixRQUFRLENBQUUsTUFBTSxDQUNoQixNQUFNLENBQUUsUUFBUSxBQUNsQixDQUFDIn0= */");
    }

    // (154:8) { :else }
    function create_else_block_1(ctx) {
    	let a;
    	let t0_value = /*$feed*/ ctx[3].format + "";
    	let t0;
    	let t1;
    	let t2_value = /*$feed*/ ctx[3].version + "";
    	let t2;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(a, "href", a_href_value = /*$config*/ ctx[2].url);
    			add_location(a, file$1, 154, 10, 3249);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$feed*/ 8 && t0_value !== (t0_value = /*$feed*/ ctx[3].format + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$feed*/ 8 && t2_value !== (t2_value = /*$feed*/ ctx[3].version + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$config*/ 4 && a_href_value !== (a_href_value = /*$config*/ ctx[2].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(154:8) { :else }",
    		ctx
    	});

    	return block;
    }

    // (152:8) { #if $feed.loading }
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(152:8) { #if $feed.loading }",
    		ctx
    	});

    	return block;
    }

    // (279:8) { :else }
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Reload";
    			attr_dev(button, "class", "btn btn-sm btn-b svelte-uicuex");
    			add_location(button, file$1, 279, 10, 7262);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*reload*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(279:8) { :else }",
    		ctx
    	});

    	return block;
    }

    // (277:8) { #if $feed.loading }
    function create_if_block(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Loading...";
    			attr_dev(button, "class", "btn btn-sm btn-c svelte-uicuex");
    			button.disabled = true;
    			add_location(button, file$1, 277, 10, 7172);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(277:8) { #if $feed.loading }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let form;
    	let table;
    	let colgroup;
    	let col0;
    	let t0;
    	let col1;
    	let t1;
    	let tr0;
    	let td0;
    	let label0;
    	let t3;
    	let td1;
    	let input0;
    	let input0_value_value;
    	let t4;
    	let tr1;
    	let td2;
    	let t6;
    	let td3;
    	let t7_value = /*$feed*/ ctx[3].title + "";
    	let t7;
    	let t8;
    	let tr2;
    	let td4;
    	let label1;
    	let t10;
    	let td5;
    	let details;
    	let summary;
    	let t11;
    	let t12_value = /*$feed*/ ctx[3].description + "";
    	let t12;
    	let t13;
    	let tr3;
    	let td6;
    	let t15;
    	let td7;
    	let t16_value = /*feed*/ ctx[0].formatDate(/*$feed*/ ctx[3].date) + "";
    	let t16;
    	let t17;
    	let tr4;
    	let td8;
    	let t19;
    	let td9;
    	let t20;
    	let tr5;
    	let td10;
    	let label2;
    	let t22;
    	let td11;
    	let input1;
    	let t23;
    	let tr6;
    	let td12;
    	let label3;
    	let t25;
    	let td13;
    	let input2;
    	let t26;
    	let small0;
    	let t28;
    	let tr7;
    	let td14;
    	let label4;
    	let t30;
    	let td15;
    	let input3;
    	let t31;
    	let small1;
    	let t33;
    	let tr8;
    	let td16;
    	let label5;
    	let t35;
    	let td17;
    	let input4;
    	let t36;
    	let small2;
    	let t38;
    	let tr9;
    	let td18;
    	let label6;
    	let t40;
    	let td19;
    	let input5;
    	let t41;
    	let tr10;
    	let td20;
    	let label7;
    	let t43;
    	let td21;
    	let input6;
    	let t44;
    	let tr11;
    	let td22;
    	let label8;
    	let t46;
    	let td23;
    	let input7;
    	let t47;
    	let tr12;
    	let td24;
    	let label9;
    	let t49;
    	let td25;
    	let input8;
    	let t50;
    	let tr13;
    	let td26;
    	let label10;
    	let t52;
    	let td27;
    	let input9;
    	let t53;
    	let tr14;
    	let td28;
    	let label11;
    	let t55;
    	let td29;
    	let input10;
    	let t56;
    	let tr15;
    	let td30;
    	let label12;
    	let t58;
    	let td31;
    	let input11;
    	let t59;
    	let tr16;
    	let td32;
    	let label13;
    	let t61;
    	let td33;
    	let input12;
    	let t62;
    	let tr17;
    	let td34;
    	let label14;
    	let t64;
    	let td35;
    	let input13;
    	let t65;
    	let tr18;
    	let td36;
    	let label15;
    	let t67;
    	let td37;
    	let input14;
    	let t68;
    	let tr19;
    	let td38;
    	let t69;
    	let td39;
    	let t70;
    	let tr20;
    	let td40;
    	let label16;
    	let t71;
    	let br;
    	let t72;
    	let t73;
    	let td41;
    	let textarea;
    	let textarea_value_value;
    	let t74;
    	let tr21;
    	let td42;
    	let label17;
    	let t76;
    	let td43;
    	let referrers;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$feed*/ ctx[3].loading) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$feed*/ ctx[3].loading) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	referrers = new Referrers({
    			props: { config: /*config*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			form = element("form");
    			table = element("table");
    			colgroup = element("colgroup");
    			col0 = element("col");
    			t0 = space();
    			col1 = element("col");
    			t1 = space();
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			label0.textContent = "Feed URL";
    			t3 = space();
    			td1 = element("td");
    			input0 = element("input");
    			t4 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			td2.textContent = "Title";
    			t6 = space();
    			td3 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			label1 = element("label");
    			label1.textContent = "Description";
    			t10 = space();
    			td5 = element("td");
    			details = element("details");
    			summary = element("summary");
    			t11 = space();
    			t12 = text(t12_value);
    			t13 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "Last build";
    			t15 = space();
    			td7 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			tr4 = element("tr");
    			td8 = element("td");
    			td8.textContent = "Source";
    			t19 = space();
    			td9 = element("td");
    			if_block0.c();
    			t20 = space();
    			tr5 = element("tr");
    			td10 = element("td");
    			label2 = element("label");
    			label2.textContent = "Max. items";
    			t22 = space();
    			td11 = element("td");
    			input1 = element("input");
    			t23 = space();
    			tr6 = element("tr");
    			td12 = element("td");
    			label3 = element("label");
    			label3.textContent = "Max. width";
    			t25 = space();
    			td13 = element("td");
    			input2 = element("input");
    			t26 = space();
    			small0 = element("small");
    			small0.textContent = "px";
    			t28 = space();
    			tr7 = element("tr");
    			td14 = element("td");
    			label4 = element("label");
    			label4.textContent = "Content height";
    			t30 = space();
    			td15 = element("td");
    			input3 = element("input");
    			t31 = space();
    			small1 = element("small");
    			small1.textContent = "px";
    			t33 = space();
    			tr8 = element("tr");
    			td16 = element("td");
    			label5 = element("label");
    			label5.textContent = "Corner radius";
    			t35 = space();
    			td17 = element("td");
    			input4 = element("input");
    			t36 = space();
    			small2 = element("small");
    			small2.textContent = "px";
    			t38 = space();
    			tr9 = element("tr");
    			td18 = element("td");
    			label6 = element("label");
    			label6.textContent = "RSS button";
    			t40 = space();
    			td19 = element("td");
    			input5 = element("input");
    			t41 = space();
    			tr10 = element("tr");
    			td20 = element("td");
    			label7 = element("label");
    			label7.textContent = "Compact view";
    			t43 = space();
    			td21 = element("td");
    			input6 = element("input");
    			t44 = space();
    			tr11 = element("tr");
    			td22 = element("td");
    			label8 = element("label");
    			label8.textContent = "Headless";
    			t46 = space();
    			td23 = element("td");
    			input7 = element("input");
    			t47 = space();
    			tr12 = element("tr");
    			td24 = element("td");
    			label9 = element("label");
    			label9.textContent = "Frame color";
    			t49 = space();
    			td25 = element("td");
    			input8 = element("input");
    			t50 = space();
    			tr13 = element("tr");
    			td26 = element("td");
    			label10 = element("label");
    			label10.textContent = "Titlebar color";
    			t52 = space();
    			td27 = element("td");
    			input9 = element("input");
    			t53 = space();
    			tr14 = element("tr");
    			td28 = element("td");
    			label11 = element("label");
    			label11.textContent = "Title color";
    			t55 = space();
    			td29 = element("td");
    			input10 = element("input");
    			t56 = space();
    			tr15 = element("tr");
    			td30 = element("td");
    			label12 = element("label");
    			label12.textContent = "Box color";
    			t58 = space();
    			td31 = element("td");
    			input11 = element("input");
    			t59 = space();
    			tr16 = element("tr");
    			td32 = element("td");
    			label13 = element("label");
    			label13.textContent = "Text color";
    			t61 = space();
    			td33 = element("td");
    			input12 = element("input");
    			t62 = space();
    			tr17 = element("tr");
    			td34 = element("td");
    			label14 = element("label");
    			label14.textContent = "Link color";
    			t64 = space();
    			td35 = element("td");
    			input13 = element("input");
    			t65 = space();
    			tr18 = element("tr");
    			td36 = element("td");
    			label15 = element("label");
    			label15.textContent = "Font face";
    			t67 = space();
    			td37 = element("td");
    			input14 = element("input");
    			t68 = space();
    			tr19 = element("tr");
    			td38 = element("td");
    			t69 = space();
    			td39 = element("td");
    			if_block1.c();
    			t70 = space();
    			tr20 = element("tr");
    			td40 = element("td");
    			label16 = element("label");
    			t71 = text("HTML code");
    			br = element("br");
    			t72 = text("\n          (copy&pasta)");
    			t73 = space();
    			td41 = element("td");
    			textarea = element("textarea");
    			t74 = space();
    			tr21 = element("tr");
    			td42 = element("td");
    			label17 = element("label");
    			label17.textContent = "Referrers";
    			t76 = space();
    			td43 = element("td");
    			create_component(referrers.$$.fragment);
    			attr_dev(col0, "width", "*");
    			add_location(col0, file$1, 118, 6, 2418);
    			attr_dev(col1, "width", "90%");
    			add_location(col1, file$1, 119, 6, 2440);
    			add_location(colgroup, file$1, 117, 4, 2401);
    			attr_dev(label0, "for", "url");
    			add_location(label0, file$1, 123, 8, 2502);
    			attr_dev(td0, "class", "svelte-uicuex");
    			add_location(td0, file$1, 122, 6, 2489);
    			attr_dev(input0, "type", "url");
    			input0.value = input0_value_value = /*$config*/ ctx[2].url;
    			attr_dev(input0, "id", "url");
    			attr_dev(input0, "name", "url");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-uicuex");
    			add_location(input0, file$1, 126, 8, 2567);
    			attr_dev(td1, "class", "svelte-uicuex");
    			add_location(td1, file$1, 125, 6, 2554);
    			attr_dev(tr0, "class", "svelte-uicuex");
    			add_location(tr0, file$1, 121, 4, 2478);
    			attr_dev(td2, "class", "svelte-uicuex");
    			add_location(td2, file$1, 130, 6, 2695);
    			attr_dev(td3, "class", "svelte-uicuex");
    			add_location(td3, file$1, 131, 6, 2716);
    			attr_dev(tr1, "class", "svelte-uicuex");
    			add_location(tr1, file$1, 129, 4, 2684);
    			attr_dev(label1, "for", "description");
    			add_location(label1, file$1, 135, 8, 2791);
    			attr_dev(td4, "class", "top svelte-uicuex");
    			add_location(td4, file$1, 134, 6, 2766);
    			attr_dev(summary, "class", "svelte-uicuex");
    			add_location(summary, file$1, 139, 10, 2928);
    			attr_dev(details, "id", "description");
    			add_location(details, file$1, 138, 8, 2891);
    			attr_dev(td5, "class", "svelte-uicuex");
    			add_location(td5, file$1, 137, 6, 2878);
    			attr_dev(tr2, "class", "svelte-uicuex");
    			add_location(tr2, file$1, 133, 4, 2755);
    			attr_dev(td6, "class", "svelte-uicuex");
    			add_location(td6, file$1, 145, 6, 3036);
    			attr_dev(td7, "class", "svelte-uicuex");
    			add_location(td7, file$1, 146, 6, 3062);
    			attr_dev(tr3, "class", "svelte-uicuex");
    			add_location(tr3, file$1, 144, 4, 3025);
    			attr_dev(td8, "class", "svelte-uicuex");
    			add_location(td8, file$1, 149, 6, 3128);
    			attr_dev(td9, "class", "source svelte-uicuex");
    			add_location(td9, file$1, 150, 6, 3150);
    			attr_dev(tr4, "class", "svelte-uicuex");
    			add_location(tr4, file$1, 148, 4, 3117);
    			attr_dev(label2, "for", "maxItems");
    			add_location(label2, file$1, 160, 8, 3380);
    			attr_dev(td10, "class", "svelte-uicuex");
    			add_location(td10, file$1, 159, 6, 3367);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "maxItems");
    			attr_dev(input1, "name", "maxItems");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "99");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-uicuex");
    			add_location(input1, file$1, 163, 8, 3452);
    			attr_dev(td11, "class", "svelte-uicuex");
    			add_location(td11, file$1, 162, 6, 3439);
    			attr_dev(tr5, "class", "svelte-uicuex");
    			add_location(tr5, file$1, 158, 4, 3356);
    			attr_dev(label3, "for", "width");
    			add_location(label3, file$1, 168, 8, 3633);
    			attr_dev(td12, "class", "svelte-uicuex");
    			add_location(td12, file$1, 167, 6, 3620);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "id", "width");
    			attr_dev(input2, "name", "width");
    			attr_dev(input2, "min", "100");
    			attr_dev(input2, "max", "9999");
    			attr_dev(input2, "placeholder", "spare");
    			attr_dev(input2, "class", "svelte-uicuex");
    			add_location(input2, file$1, 171, 8, 3702);
    			add_location(small0, file$1, 172, 8, 3847);
    			attr_dev(td13, "class", "svelte-uicuex");
    			add_location(td13, file$1, 170, 6, 3689);
    			attr_dev(tr6, "class", "svelte-uicuex");
    			add_location(tr6, file$1, 166, 4, 3609);
    			attr_dev(label4, "for", "height");
    			add_location(label4, file$1, 177, 8, 3915);
    			attr_dev(td14, "class", "svelte-uicuex");
    			add_location(td14, file$1, 176, 6, 3902);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "id", "height");
    			attr_dev(input3, "name", "height");
    			attr_dev(input3, "min", "100");
    			attr_dev(input3, "max", "9999");
    			attr_dev(input3, "placeholder", "spare");
    			attr_dev(input3, "class", "svelte-uicuex");
    			add_location(input3, file$1, 180, 8, 3989);
    			add_location(small1, file$1, 181, 8, 4137);
    			attr_dev(td15, "class", "svelte-uicuex");
    			add_location(td15, file$1, 179, 6, 3976);
    			attr_dev(tr7, "class", "svelte-uicuex");
    			add_location(tr7, file$1, 175, 4, 3891);
    			attr_dev(label5, "for", "radius");
    			add_location(label5, file$1, 186, 8, 4205);
    			attr_dev(td16, "class", "svelte-uicuex");
    			add_location(td16, file$1, 185, 6, 4192);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "id", "radius");
    			attr_dev(input4, "name", "radius");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "20");
    			input4.required = true;
    			attr_dev(input4, "class", "svelte-uicuex");
    			add_location(input4, file$1, 189, 8, 4278);
    			add_location(small2, file$1, 190, 8, 4411);
    			attr_dev(td17, "class", "svelte-uicuex");
    			add_location(td17, file$1, 188, 6, 4265);
    			attr_dev(tr8, "class", "svelte-uicuex");
    			add_location(tr8, file$1, 184, 4, 4181);
    			attr_dev(label6, "for", "showXmlButton");
    			add_location(label6, file$1, 195, 8, 4479);
    			attr_dev(td18, "class", "svelte-uicuex");
    			add_location(td18, file$1, 194, 6, 4466);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "id", "showXmlButton");
    			attr_dev(input5, "name", "showXmlButton");
    			input5.__value = "1";
    			input5.value = input5.__value;
    			add_location(input5, file$1, 198, 8, 4556);
    			attr_dev(td19, "class", "svelte-uicuex");
    			add_location(td19, file$1, 197, 6, 4543);
    			attr_dev(tr9, "class", "svelte-uicuex");
    			add_location(tr9, file$1, 193, 4, 4455);
    			attr_dev(label7, "for", "compact");
    			add_location(label7, file$1, 203, 8, 4744);
    			attr_dev(td20, "class", "svelte-uicuex");
    			add_location(td20, file$1, 202, 6, 4731);
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "id", "compact");
    			attr_dev(input6, "name", "compact");
    			input6.__value = "1";
    			input6.value = input6.__value;
    			add_location(input6, file$1, 206, 8, 4817);
    			attr_dev(td21, "class", "svelte-uicuex");
    			add_location(td21, file$1, 205, 6, 4804);
    			attr_dev(tr10, "class", "svelte-uicuex");
    			add_location(tr10, file$1, 201, 4, 4720);
    			attr_dev(label8, "for", "headless");
    			add_location(label8, file$1, 211, 8, 4987);
    			attr_dev(td22, "class", "svelte-uicuex");
    			add_location(td22, file$1, 210, 6, 4974);
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "id", "headless");
    			attr_dev(input7, "name", "headless");
    			input7.__value = "1";
    			input7.value = input7.__value;
    			add_location(input7, file$1, 214, 8, 5057);
    			attr_dev(td23, "class", "svelte-uicuex");
    			add_location(td23, file$1, 213, 6, 5044);
    			attr_dev(tr11, "class", "svelte-uicuex");
    			add_location(tr11, file$1, 209, 4, 4963);
    			attr_dev(label9, "for", "frameColor");
    			add_location(label9, file$1, 219, 8, 5230);
    			attr_dev(td24, "class", "svelte-uicuex");
    			add_location(td24, file$1, 218, 6, 5217);
    			attr_dev(input8, "type", "color");
    			attr_dev(input8, "id", "frameColor");
    			attr_dev(input8, "name", "frameColor");
    			attr_dev(input8, "size", "6");
    			attr_dev(input8, "maxlength", "7");
    			attr_dev(input8, "class", "svelte-uicuex");
    			add_location(input8, file$1, 222, 8, 5305);
    			attr_dev(td25, "class", "svelte-uicuex");
    			add_location(td25, file$1, 221, 6, 5292);
    			attr_dev(tr12, "class", "svelte-uicuex");
    			add_location(tr12, file$1, 217, 4, 5206);
    			attr_dev(label10, "for", "titleBarColor");
    			add_location(label10, file$1, 227, 8, 5488);
    			attr_dev(td26, "class", "svelte-uicuex");
    			add_location(td26, file$1, 226, 6, 5475);
    			attr_dev(input9, "type", "color");
    			attr_dev(input9, "id", "titleBarColor");
    			attr_dev(input9, "name", "titleBarColor");
    			attr_dev(input9, "size", "6");
    			attr_dev(input9, "maxlength", "7");
    			attr_dev(input9, "class", "svelte-uicuex");
    			add_location(input9, file$1, 230, 8, 5569);
    			attr_dev(td27, "class", "svelte-uicuex");
    			add_location(td27, file$1, 229, 6, 5556);
    			attr_dev(tr13, "class", "svelte-uicuex");
    			add_location(tr13, file$1, 225, 4, 5464);
    			attr_dev(label11, "for", "titleBarTextColor");
    			add_location(label11, file$1, 235, 8, 5761);
    			attr_dev(td28, "class", "svelte-uicuex");
    			add_location(td28, file$1, 234, 6, 5748);
    			attr_dev(input10, "type", "color");
    			attr_dev(input10, "id", "titleBarTextColor");
    			attr_dev(input10, "name", "titleBarTextColor");
    			attr_dev(input10, "size", "6");
    			attr_dev(input10, "maxlength", "7");
    			attr_dev(input10, "class", "svelte-uicuex");
    			add_location(input10, file$1, 238, 8, 5843);
    			attr_dev(td29, "class", "svelte-uicuex");
    			add_location(td29, file$1, 237, 6, 5830);
    			attr_dev(tr14, "class", "svelte-uicuex");
    			add_location(tr14, file$1, 233, 4, 5737);
    			attr_dev(label12, "for", "boxFillColor");
    			add_location(label12, file$1, 243, 8, 6047);
    			attr_dev(td30, "class", "svelte-uicuex");
    			add_location(td30, file$1, 242, 6, 6034);
    			attr_dev(input11, "type", "color");
    			attr_dev(input11, "id", "boxFillColor");
    			attr_dev(input11, "name", "boxFillColor");
    			attr_dev(input11, "size", "6");
    			attr_dev(input11, "maxlength", "7");
    			attr_dev(input11, "class", "svelte-uicuex");
    			add_location(input11, file$1, 246, 8, 6122);
    			attr_dev(td31, "class", "svelte-uicuex");
    			add_location(td31, file$1, 245, 6, 6109);
    			attr_dev(tr15, "class", "svelte-uicuex");
    			add_location(tr15, file$1, 241, 4, 6023);
    			attr_dev(label13, "for", "textColor");
    			add_location(label13, file$1, 251, 8, 6311);
    			attr_dev(td32, "class", "svelte-uicuex");
    			add_location(td32, file$1, 250, 6, 6298);
    			attr_dev(input12, "type", "color");
    			attr_dev(input12, "id", "textColor");
    			attr_dev(input12, "name", "textColor");
    			attr_dev(input12, "size", "6");
    			attr_dev(input12, "maxlength", "7");
    			attr_dev(input12, "class", "svelte-uicuex");
    			add_location(input12, file$1, 254, 8, 6384);
    			attr_dev(td33, "class", "svelte-uicuex");
    			add_location(td33, file$1, 253, 6, 6371);
    			attr_dev(tr16, "class", "svelte-uicuex");
    			add_location(tr16, file$1, 249, 4, 6287);
    			attr_dev(label14, "for", "linkColor");
    			add_location(label14, file$1, 259, 8, 6564);
    			attr_dev(td34, "class", "svelte-uicuex");
    			add_location(td34, file$1, 258, 6, 6551);
    			attr_dev(input13, "type", "color");
    			attr_dev(input13, "id", "linkColor");
    			attr_dev(input13, "name", "linkColor");
    			attr_dev(input13, "size", "6");
    			attr_dev(input13, "maxlength", "7");
    			attr_dev(input13, "class", "svelte-uicuex");
    			add_location(input13, file$1, 262, 8, 6637);
    			attr_dev(td35, "class", "svelte-uicuex");
    			add_location(td35, file$1, 261, 6, 6624);
    			attr_dev(tr17, "class", "svelte-uicuex");
    			add_location(tr17, file$1, 257, 4, 6540);
    			attr_dev(label15, "for", "fontFace");
    			add_location(label15, file$1, 267, 8, 6817);
    			attr_dev(td36, "class", "svelte-uicuex");
    			add_location(td36, file$1, 266, 6, 6804);
    			attr_dev(input14, "id", "fontFace");
    			attr_dev(input14, "name", "fontFace");
    			attr_dev(input14, "pattern", "[\\d.]+(?:pt|px|em|%)+\\s+[\\s\\w\\-,]+");
    			attr_dev(input14, "placeholder", "e.g. 10pt Helvetica, sans-serif");
    			attr_dev(input14, "class", "svelte-uicuex");
    			add_location(input14, file$1, 270, 8, 6888);
    			attr_dev(td37, "class", "svelte-uicuex");
    			add_location(td37, file$1, 269, 6, 6875);
    			attr_dev(tr18, "class", "svelte-uicuex");
    			add_location(tr18, file$1, 265, 4, 6793);
    			attr_dev(td38, "class", "svelte-uicuex");
    			add_location(td38, file$1, 274, 6, 7111);
    			attr_dev(td39, "class", "svelte-uicuex");
    			add_location(td39, file$1, 275, 6, 7127);
    			attr_dev(tr19, "class", "svelte-uicuex");
    			add_location(tr19, file$1, 273, 4, 7100);
    			add_location(br, file$1, 286, 19, 7463);
    			attr_dev(label16, "for", "code");
    			add_location(label16, file$1, 285, 8, 7425);
    			attr_dev(td40, "class", "svelte-uicuex");
    			add_location(td40, file$1, 284, 6, 7412);
    			attr_dev(textarea, "id", "code");
    			attr_dev(textarea, "name", "code");
    			attr_dev(textarea, "cols", "10");
    			attr_dev(textarea, "rows", "3");
    			textarea.readOnly = true;
    			textarea.value = textarea_value_value = /*code*/ ctx[5](/*$config*/ ctx[2]);
    			attr_dev(textarea, "class", "svelte-uicuex");
    			add_location(textarea, file$1, 291, 8, 7543);
    			attr_dev(td41, "class", "svelte-uicuex");
    			add_location(td41, file$1, 290, 6, 7530);
    			set_style(tr20, "vertical-align", "top");
    			attr_dev(tr20, "class", "svelte-uicuex");
    			add_location(tr20, file$1, 283, 4, 7373);
    			attr_dev(label17, "for", "referrers");
    			attr_dev(label17, "title", "since midnight (GMT)");
    			add_location(label17, file$1, 296, 8, 7712);
    			attr_dev(td42, "class", "top svelte-uicuex");
    			add_location(td42, file$1, 295, 6, 7687);
    			attr_dev(td43, "class", "top svelte-uicuex");
    			add_location(td43, file$1, 300, 6, 7844);
    			attr_dev(tr21, "class", "svelte-uicuex");
    			add_location(tr21, file$1, 294, 4, 7676);
    			attr_dev(table, "class", "table svelte-uicuex");
    			add_location(table, file$1, 116, 2, 2375);
    			add_location(form, file$1, 115, 0, 2366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, table);
    			append_dev(table, colgroup);
    			append_dev(colgroup, col0);
    			append_dev(colgroup, t0);
    			append_dev(colgroup, col1);
    			append_dev(table, t1);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(tr0, t3);
    			append_dev(tr0, td1);
    			append_dev(td1, input0);
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(tr1, t6);
    			append_dev(tr1, td3);
    			append_dev(td3, t7);
    			append_dev(table, t8);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, label1);
    			append_dev(tr2, t10);
    			append_dev(tr2, td5);
    			append_dev(td5, details);
    			append_dev(details, summary);
    			append_dev(details, t11);
    			append_dev(details, t12);
    			append_dev(table, t13);
    			append_dev(table, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t15);
    			append_dev(tr3, td7);
    			append_dev(td7, t16);
    			append_dev(table, t17);
    			append_dev(table, tr4);
    			append_dev(tr4, td8);
    			append_dev(tr4, t19);
    			append_dev(tr4, td9);
    			if_block0.m(td9, null);
    			append_dev(table, t20);
    			append_dev(table, tr5);
    			append_dev(tr5, td10);
    			append_dev(td10, label2);
    			append_dev(tr5, t22);
    			append_dev(tr5, td11);
    			append_dev(td11, input1);
    			set_input_value(input1, /*$config*/ ctx[2].maxItems);
    			append_dev(table, t23);
    			append_dev(table, tr6);
    			append_dev(tr6, td12);
    			append_dev(td12, label3);
    			append_dev(tr6, t25);
    			append_dev(tr6, td13);
    			append_dev(td13, input2);
    			set_input_value(input2, /*$config*/ ctx[2].width);
    			append_dev(td13, t26);
    			append_dev(td13, small0);
    			append_dev(table, t28);
    			append_dev(table, tr7);
    			append_dev(tr7, td14);
    			append_dev(td14, label4);
    			append_dev(tr7, t30);
    			append_dev(tr7, td15);
    			append_dev(td15, input3);
    			set_input_value(input3, /*$config*/ ctx[2].height);
    			append_dev(td15, t31);
    			append_dev(td15, small1);
    			append_dev(table, t33);
    			append_dev(table, tr8);
    			append_dev(tr8, td16);
    			append_dev(td16, label5);
    			append_dev(tr8, t35);
    			append_dev(tr8, td17);
    			append_dev(td17, input4);
    			set_input_value(input4, /*$config*/ ctx[2].radius);
    			append_dev(td17, t36);
    			append_dev(td17, small2);
    			append_dev(table, t38);
    			append_dev(table, tr9);
    			append_dev(tr9, td18);
    			append_dev(td18, label6);
    			append_dev(tr9, t40);
    			append_dev(tr9, td19);
    			append_dev(td19, input5);
    			input5.checked = /*$config*/ ctx[2].showXmlButton;
    			append_dev(table, t41);
    			append_dev(table, tr10);
    			append_dev(tr10, td20);
    			append_dev(td20, label7);
    			append_dev(tr10, t43);
    			append_dev(tr10, td21);
    			append_dev(td21, input6);
    			input6.checked = /*$config*/ ctx[2].compact;
    			append_dev(table, t44);
    			append_dev(table, tr11);
    			append_dev(tr11, td22);
    			append_dev(td22, label8);
    			append_dev(tr11, t46);
    			append_dev(tr11, td23);
    			append_dev(td23, input7);
    			input7.checked = /*$config*/ ctx[2].headless;
    			append_dev(table, t47);
    			append_dev(table, tr12);
    			append_dev(tr12, td24);
    			append_dev(td24, label9);
    			append_dev(tr12, t49);
    			append_dev(tr12, td25);
    			append_dev(td25, input8);
    			set_input_value(input8, /*$config*/ ctx[2].frameColor);
    			append_dev(table, t50);
    			append_dev(table, tr13);
    			append_dev(tr13, td26);
    			append_dev(td26, label10);
    			append_dev(tr13, t52);
    			append_dev(tr13, td27);
    			append_dev(td27, input9);
    			set_input_value(input9, /*$config*/ ctx[2].titleBarColor);
    			append_dev(table, t53);
    			append_dev(table, tr14);
    			append_dev(tr14, td28);
    			append_dev(td28, label11);
    			append_dev(tr14, t55);
    			append_dev(tr14, td29);
    			append_dev(td29, input10);
    			set_input_value(input10, /*$config*/ ctx[2].titleBarTextColor);
    			append_dev(table, t56);
    			append_dev(table, tr15);
    			append_dev(tr15, td30);
    			append_dev(td30, label12);
    			append_dev(tr15, t58);
    			append_dev(tr15, td31);
    			append_dev(td31, input11);
    			set_input_value(input11, /*$config*/ ctx[2].boxFillColor);
    			append_dev(table, t59);
    			append_dev(table, tr16);
    			append_dev(tr16, td32);
    			append_dev(td32, label13);
    			append_dev(tr16, t61);
    			append_dev(tr16, td33);
    			append_dev(td33, input12);
    			set_input_value(input12, /*$config*/ ctx[2].textColor);
    			append_dev(table, t62);
    			append_dev(table, tr17);
    			append_dev(tr17, td34);
    			append_dev(td34, label14);
    			append_dev(tr17, t64);
    			append_dev(tr17, td35);
    			append_dev(td35, input13);
    			set_input_value(input13, /*$config*/ ctx[2].linkColor);
    			append_dev(table, t65);
    			append_dev(table, tr18);
    			append_dev(tr18, td36);
    			append_dev(td36, label15);
    			append_dev(tr18, t67);
    			append_dev(tr18, td37);
    			append_dev(td37, input14);
    			set_input_value(input14, /*$config*/ ctx[2].fontFace);
    			append_dev(table, t68);
    			append_dev(table, tr19);
    			append_dev(tr19, td38);
    			append_dev(tr19, t69);
    			append_dev(tr19, td39);
    			if_block1.m(td39, null);
    			append_dev(table, t70);
    			append_dev(table, tr20);
    			append_dev(tr20, td40);
    			append_dev(td40, label16);
    			append_dev(label16, t71);
    			append_dev(label16, br);
    			append_dev(label16, t72);
    			append_dev(tr20, t73);
    			append_dev(tr20, td41);
    			append_dev(td41, textarea);
    			append_dev(table, t74);
    			append_dev(table, tr21);
    			append_dev(tr21, td42);
    			append_dev(td42, label17);
    			append_dev(tr21, t76);
    			append_dev(tr21, td43);
    			mount_component(referrers, td43, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*reload*/ ctx[4], false, false, false),
    					listen_dev(label1, "click", clickLabel, false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input1, "change", validate, false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input2, "change", validate, false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen_dev(input3, "change", validate, false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[9]),
    					listen_dev(input4, "change", validate, false, false, false),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[10]),
    					listen_dev(input5, "change", validate, false, false, false),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[11]),
    					listen_dev(input6, "change", validate, false, false, false),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[12]),
    					listen_dev(input7, "change", validate, false, false, false),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[13]),
    					listen_dev(input8, "change", validate, false, false, false),
    					listen_dev(input9, "input", /*input9_input_handler*/ ctx[14]),
    					listen_dev(input9, "change", validate, false, false, false),
    					listen_dev(input10, "input", /*input10_input_handler*/ ctx[15]),
    					listen_dev(input10, "change", validate, false, false, false),
    					listen_dev(input11, "input", /*input11_input_handler*/ ctx[16]),
    					listen_dev(input11, "change", validate, false, false, false),
    					listen_dev(input12, "input", /*input12_input_handler*/ ctx[17]),
    					listen_dev(input12, "change", validate, false, false, false),
    					listen_dev(input13, "input", /*input13_input_handler*/ ctx[18]),
    					listen_dev(input13, "change", validate, false, false, false),
    					listen_dev(input14, "input", /*input14_input_handler*/ ctx[19]),
    					listen_dev(input14, "change", validate, false, false, false),
    					listen_dev(textarea, "click", copy, false, false, false),
    					listen_dev(label17, "click", clickLabel, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$config*/ 4 && input0_value_value !== (input0_value_value = /*$config*/ ctx[2].url)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if ((!current || dirty & /*$feed*/ 8) && t7_value !== (t7_value = /*$feed*/ ctx[3].title + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*$feed*/ 8) && t12_value !== (t12_value = /*$feed*/ ctx[3].description + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty & /*feed, $feed*/ 9) && t16_value !== (t16_value = /*feed*/ ctx[0].formatDate(/*$feed*/ ctx[3].date) + "")) set_data_dev(t16, t16_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(td9, null);
    				}
    			}

    			if (dirty & /*$config*/ 4 && to_number(input1.value) !== /*$config*/ ctx[2].maxItems) {
    				set_input_value(input1, /*$config*/ ctx[2].maxItems);
    			}

    			if (dirty & /*$config*/ 4 && to_number(input2.value) !== /*$config*/ ctx[2].width) {
    				set_input_value(input2, /*$config*/ ctx[2].width);
    			}

    			if (dirty & /*$config*/ 4 && to_number(input3.value) !== /*$config*/ ctx[2].height) {
    				set_input_value(input3, /*$config*/ ctx[2].height);
    			}

    			if (dirty & /*$config*/ 4 && to_number(input4.value) !== /*$config*/ ctx[2].radius) {
    				set_input_value(input4, /*$config*/ ctx[2].radius);
    			}

    			if (dirty & /*$config*/ 4) {
    				input5.checked = /*$config*/ ctx[2].showXmlButton;
    			}

    			if (dirty & /*$config*/ 4) {
    				input6.checked = /*$config*/ ctx[2].compact;
    			}

    			if (dirty & /*$config*/ 4) {
    				input7.checked = /*$config*/ ctx[2].headless;
    			}

    			if (dirty & /*$config*/ 4) {
    				set_input_value(input8, /*$config*/ ctx[2].frameColor);
    			}

    			if (dirty & /*$config*/ 4) {
    				set_input_value(input9, /*$config*/ ctx[2].titleBarColor);
    			}

    			if (dirty & /*$config*/ 4) {
    				set_input_value(input10, /*$config*/ ctx[2].titleBarTextColor);
    			}

    			if (dirty & /*$config*/ 4) {
    				set_input_value(input11, /*$config*/ ctx[2].boxFillColor);
    			}

    			if (dirty & /*$config*/ 4) {
    				set_input_value(input12, /*$config*/ ctx[2].textColor);
    			}

    			if (dirty & /*$config*/ 4) {
    				set_input_value(input13, /*$config*/ ctx[2].linkColor);
    			}

    			if (dirty & /*$config*/ 4 && input14.value !== /*$config*/ ctx[2].fontFace) {
    				set_input_value(input14, /*$config*/ ctx[2].fontFace);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(td39, null);
    				}
    			}

    			if (!current || dirty & /*$config*/ 4 && textarea_value_value !== (textarea_value_value = /*code*/ ctx[5](/*$config*/ ctx[2]))) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}

    			const referrers_changes = {};
    			if (dirty & /*config*/ 2) referrers_changes.config = /*config*/ ctx[1];
    			referrers.$set(referrers_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(referrers.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(referrers.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if_block0.d();
    			if_block1.d();
    			destroy_component(referrers);
    			mounted = false;
    			run_all(dispose);
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

    function validate(event) {
    	event.preventDefault();
    	if (!event.target.checkValidity()) event.target.reportValidity();
    }

    function copy(event) {
    	try {
    		event.target.select();
    		document.execCommand("copy");
    	} catch(error) {
    	}
    }

    function clickLabel(event) {
    	const sibling = event.target.parentNode.nextElementSibling;
    	let input = sibling.querySelector("input");
    	if (!input) input = sibling.querySelector("summary");
    	if (!input) input = sibling.querySelector("textarea");
    	if (!input) return;
    	if (input.click) input.click();
    	if (input.select) input.select();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $config,
    		$$unsubscribe_config = noop,
    		$$subscribe_config = () => ($$unsubscribe_config(), $$unsubscribe_config = subscribe(config, $$value => $$invalidate(2, $config = $$value)), config);

    	let $feed,
    		$$unsubscribe_feed = noop,
    		$$subscribe_feed = () => ($$unsubscribe_feed(), $$unsubscribe_feed = subscribe(feed, $$value => $$invalidate(3, $feed = $$value)), feed);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_config());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_feed());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Configurator', slots, []);
    	let { feed } = $$props;
    	validate_store(feed, 'feed');
    	$$subscribe_feed();
    	let { config } = $$props;
    	validate_store(config, 'config');
    	$$subscribe_config();

    	function reload(event) {
    		event.preventDefault();

    		// The app’s subcription only triggers a fetch when the url has changed
    		config.set({ url: null });

    		config.set({
    			url: document.querySelector("input[name=\"url\"]").value
    		});
    	}

    	function getQuery() {
    		const query = [];

    		Object.keys($config).forEach(key => {
    			let value = $config[key];
    			if (value === null || value === undefined) value = "";
    			query.push(key + "=" + encodeURIComponent(value));
    		});

    		return query.join("&");
    	}

    	function code() {
    		const query = getQuery().replace(/&/g, "&amp;");

    		// Need to be careful with the script-end-tag to prevent template error
    		// See https://github.com/sveltejs/svelte/issues/3840
    		return `<script async defer src='${urls.app}/main.js?${query}'>${"<"}/script>`;
    	}

    	const writable_props = ['feed', 'config'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Configurator> was created with unknown prop '${key}'`);
    	});

    	function input1_input_handler() {
    		$config.maxItems = to_number(this.value);
    		config.set($config);
    	}

    	function input2_input_handler() {
    		$config.width = to_number(this.value);
    		config.set($config);
    	}

    	function input3_input_handler() {
    		$config.height = to_number(this.value);
    		config.set($config);
    	}

    	function input4_input_handler() {
    		$config.radius = to_number(this.value);
    		config.set($config);
    	}

    	function input5_change_handler() {
    		$config.showXmlButton = this.checked;
    		config.set($config);
    	}

    	function input6_change_handler() {
    		$config.compact = this.checked;
    		config.set($config);
    	}

    	function input7_change_handler() {
    		$config.headless = this.checked;
    		config.set($config);
    	}

    	function input8_input_handler() {
    		$config.frameColor = this.value;
    		config.set($config);
    	}

    	function input9_input_handler() {
    		$config.titleBarColor = this.value;
    		config.set($config);
    	}

    	function input10_input_handler() {
    		$config.titleBarTextColor = this.value;
    		config.set($config);
    	}

    	function input11_input_handler() {
    		$config.boxFillColor = this.value;
    		config.set($config);
    	}

    	function input12_input_handler() {
    		$config.textColor = this.value;
    		config.set($config);
    	}

    	function input13_input_handler() {
    		$config.linkColor = this.value;
    		config.set($config);
    	}

    	function input14_input_handler() {
    		$config.fontFace = this.value;
    		config.set($config);
    	}

    	$$self.$$set = $$props => {
    		if ('feed' in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ('config' in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
    	};

    	$$self.$capture_state = () => ({
    		urls,
    		Referrers,
    		feed,
    		config,
    		validate,
    		reload,
    		copy,
    		clickLabel,
    		getQuery,
    		code,
    		$config,
    		$feed
    	});

    	$$self.$inject_state = $$props => {
    		if ('feed' in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ('config' in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		feed,
    		config,
    		$config,
    		$feed,
    		reload,
    		code,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_input_handler,
    		input9_input_handler,
    		input10_input_handler,
    		input11_input_handler,
    		input12_input_handler,
    		input13_input_handler,
    		input14_input_handler
    	];
    }

    class Configurator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { feed: 0, config: 1 }, add_css$1);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Configurator",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*feed*/ ctx[0] === undefined && !('feed' in props)) {
    			console.warn("<Configurator> was created without expected prop 'feed'");
    		}

    		if (/*config*/ ctx[1] === undefined && !('config' in props)) {
    			console.warn("<Configurator> was created without expected prop 'config'");
    		}
    	}

    	get feed() {
    		throw new Error("<Configurator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feed(value) {
    		throw new Error("<Configurator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<Configurator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Configurator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/App.html generated by Svelte v3.40.0 */
    const file = "src/components/App.html";

    function add_css(target) {
    	append_styles(target, "svelte-1d2f360", ".loading.svelte-1d2f360{opacity:0;transition-property:opacity;transition-duration:3s;transition-timing-function:ease-out;pointer-events:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLmh0bWwiLCJzb3VyY2VzIjpbIkFwcC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCBBYm91dCBmcm9tIFwiLi9BYm91dC5odG1sXCI7XG4gIGltcG9ydCBBZCBmcm9tIFwiLi9BZC5odG1sXCI7XG4gIGltcG9ydCBCb3ggZnJvbSBcIi4vQm94Lmh0bWxcIjtcbiAgaW1wb3J0IENvbmZpZ3VyYXRvciBmcm9tIFwiLi9Db25maWd1cmF0b3IuaHRtbFwiO1xuXG4gIC8vIFN0b3JlcyBjb21pbmcgaW4gdmlhIHByb3BzXG4gIGV4cG9ydCBsZXQgZmVlZDtcbiAgZXhwb3J0IGxldCBjb25maWc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAubG9hZGluZyB7XG4gICAgb3BhY2l0eTogMDtcbiAgICB0cmFuc2l0aW9uLXByb3BlcnR5OiBvcGFjaXR5O1xuICAgIHRyYW5zaXRpb24tZHVyYXRpb246IDNzO1xuICAgIHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBlYXNlLW91dDtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz0ncm93Jz5cbiAgPGRpdiBjbGFzcz0nY29sIGMyJyBjbGFzczpsb2FkaW5nPXsgJGZlZWQubG9hZGluZyB9PlxuICAgIDxCb3ggeyBmZWVkIH0geyBjb25maWcgfS8+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPSdjb2wgYzUnPlxuICAgIDxDb25maWd1cmF0b3IgeyBmZWVkIH0geyBjb25maWcgfS8+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPSdjb2wgYzUnPlxuICAgIDxBZC8+XG4gICAgPEFib3V0IHsgY29uZmlnIH0vPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVlFLFFBQVEsZUFBQyxDQUFDLEFBQ1IsT0FBTyxDQUFFLENBQUMsQ0FDVixtQkFBbUIsQ0FBRSxPQUFPLENBQzVCLG1CQUFtQixDQUFFLEVBQUUsQ0FDdkIsMEJBQTBCLENBQUUsUUFBUSxDQUNwQyxjQUFjLENBQUUsSUFBSSxBQUN0QixDQUFDIn0= */");
    }

    function create_fragment(ctx) {
    	let div3;
    	let div0;
    	let box;
    	let t0;
    	let div1;
    	let configurator;
    	let t1;
    	let div2;
    	let ad;
    	let t2;
    	let about;
    	let current;

    	box = new Box({
    			props: {
    				feed: /*feed*/ ctx[0],
    				config: /*config*/ ctx[1]
    			},
    			$$inline: true
    		});

    	configurator = new Configurator({
    			props: {
    				feed: /*feed*/ ctx[0],
    				config: /*config*/ ctx[1]
    			},
    			$$inline: true
    		});

    	ad = new Ad({ $$inline: true });

    	about = new About({
    			props: { config: /*config*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			create_component(box.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(configurator.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(ad.$$.fragment);
    			t2 = space();
    			create_component(about.$$.fragment);
    			attr_dev(div0, "class", "col c2 svelte-1d2f360");
    			toggle_class(div0, "loading", /*$feed*/ ctx[2].loading);
    			add_location(div0, file, 22, 2, 443);
    			attr_dev(div1, "class", "col c5");
    			add_location(div1, file, 25, 2, 538);
    			attr_dev(div2, "class", "col c5");
    			add_location(div2, file, 28, 2, 610);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file, 21, 0, 423);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(box, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(configurator, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(ad, div2, null);
    			append_dev(div2, t2);
    			mount_component(about, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const box_changes = {};
    			if (dirty & /*feed*/ 1) box_changes.feed = /*feed*/ ctx[0];
    			if (dirty & /*config*/ 2) box_changes.config = /*config*/ ctx[1];
    			box.$set(box_changes);

    			if (dirty & /*$feed*/ 4) {
    				toggle_class(div0, "loading", /*$feed*/ ctx[2].loading);
    			}

    			const configurator_changes = {};
    			if (dirty & /*feed*/ 1) configurator_changes.feed = /*feed*/ ctx[0];
    			if (dirty & /*config*/ 2) configurator_changes.config = /*config*/ ctx[1];
    			configurator.$set(configurator_changes);
    			const about_changes = {};
    			if (dirty & /*config*/ 2) about_changes.config = /*config*/ ctx[1];
    			about.$set(about_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			transition_in(configurator.$$.fragment, local);
    			transition_in(ad.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			transition_out(configurator.$$.fragment, local);
    			transition_out(ad.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(box);
    			destroy_component(configurator);
    			destroy_component(ad);
    			destroy_component(about);
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

    function instance($$self, $$props, $$invalidate) {
    	let $feed,
    		$$unsubscribe_feed = noop,
    		$$subscribe_feed = () => ($$unsubscribe_feed(), $$unsubscribe_feed = subscribe(feed, $$value => $$invalidate(2, $feed = $$value)), feed);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_feed());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { feed } = $$props;
    	validate_store(feed, 'feed');
    	$$subscribe_feed();
    	let { config } = $$props;
    	const writable_props = ['feed', 'config'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('feed' in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ('config' in $$props) $$invalidate(1, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		About,
    		Ad,
    		Box,
    		Configurator,
    		feed,
    		config,
    		$feed
    	});

    	$$self.$inject_state = $$props => {
    		if ('feed' in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ('config' in $$props) $$invalidate(1, config = $$props.config);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [feed, config, $feed];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { feed: 0, config: 1 }, add_css);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*feed*/ ctx[0] === undefined && !('feed' in props)) {
    			console.warn("<App> was created without expected prop 'feed'");
    		}

    		if (/*config*/ ctx[1] === undefined && !('config' in props)) {
    			console.warn("<App> was created without expected prop 'config'");
    		}
    	}

    	get feed() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feed(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    void new App({
      target: document.querySelector("main"),
      props: { feed, config }
    });

    const query = location.search;
    let url;

    config.subscribe(state => {
      if (url === state.url) return;
      url = state.url;
      feed.fetch(url, feed);
    });

    if (query && query.startsWith("?url=")) {
      const parts = query.substr(5).split("&");
      config.set({ url: decodeURIComponent(parts[0]) });
    } else {
      config.set({ url: urls.feed });
    }

})();
//# sourceMappingURL=app.js.map
