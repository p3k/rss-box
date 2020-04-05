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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
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
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
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
            throw new Error(`Function called outside component initialization`);
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
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
                                info.blocks[i] = null;
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

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
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

    const urls = {};

    const baseUrl = 'http://localhost';

    const urls$1 = {
      app: baseUrl + ':8000',
      proxy: baseUrl + ':8001/roxy',
      referrers: baseUrl + ':8001/ferris?group=rssbox',
      feed: 'https://blog.p3k.org/stories.xml'
    };

    Object.keys(urls).forEach(key => {
      if (key in urls$1) urls$1[key] = urls[key];
    });

    const defaultError = {
      loading: false,
      compact: false,
      maxItems: 3,
      format: 'Error',
      version: '❌',
      title: 'RSS Box Error',
      description:
        'This output was automatically generated to report an error that occurred during a request to the RSS Box Viewer.',
      image: '',
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
      error.link = urls$1.app + '?url=' + url;
      error.items[1].description = message;
      error.items[2].description = `Most likely, this might have happened because of a non-existent or invalid RSS feed URL. <a href="https://validator.w3.org/feed/check.cgi?url=${url}">Please check</a> and possibly correct your input, then try again.`;
      return error;
    }

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

          if (!doc || getChildElement('parsererror', doc.documentElement)) throw error;

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

    var version = "20.01.06";
    var description = "RSS Box Viewer";

    var statusCodes = {"100":"Continue","101":"Switching Protocols","102":"Processing","103":"Early Hints","200":"OK","201":"Created","202":"Accepted","203":"Non-Authoritative Information","204":"No Content","205":"Reset Content","206":"Partial Content","207":"Multi-Status","208":"Already Reported","226":"IM Used","300":"Multiple Choices","301":"Moved Permanently","302":"Found","303":"See Other","304":"Not Modified","305":"Use Proxy","307":"Temporary Redirect","308":"Permanent Redirect","400":"Bad Request","401":"Unauthorized","402":"Payment Required","403":"Forbidden","404":"Not Found","405":"Method Not Allowed","406":"Not Acceptable","407":"Proxy Authentication Required","408":"Request Timeout","409":"Conflict","410":"Gone","411":"Length Required","412":"Precondition Failed","413":"Payload Too Large","414":"URI Too Long","415":"Unsupported Media Type","416":"Range Not Satisfiable","417":"Expectation Failed","418":"I'm a Teapot","421":"Misdirected Request","422":"Unprocessable Entity","423":"Locked","424":"Failed Dependency","425":"Unordered Collection","426":"Upgrade Required","428":"Precondition Required","429":"Too Many Requests","431":"Request Header Fields Too Large","451":"Unavailable For Legal Reasons","500":"Internal Server Error","501":"Not Implemented","502":"Bad Gateway","503":"Service Unavailable","504":"Gateway Timeout","505":"HTTP Version Not Supported","506":"Variant Also Negotiates","507":"Insufficient Storage","508":"Loop Detected","509":"Bandwidth Limit Exceeded","510":"Not Extended","511":"Network Authentication Required"};

    const ObjectStore = defaultState => {
      const { subscribe, update } = writable(defaultState);

      const _update = newState =>
        update(state => {
          Object.keys(newState).forEach(key => {
            if (key in state === false) return;
            state[key] = newState[key];
            // See https://svelte.dev/tutorial/updating-arrays-and-objects
            state = state;
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
          'application/rss+xml',
          'application/rdf+xml',
          'application/atom+xml',
          'application/xml;q=0.9',
          'text/xml;q=0.8'
        ].join()
      });

      fetch(urls$1.proxy + '?url=' + encodeURIComponent(url), { headers, referrerPolicy: 'no-referrer' })
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

      fetch(urls$1.referrers)
        .then(res => res.json())
        .then(data => {
          const hosts = data.reduce((accu, item) => {
            if (item.url.startsWith('http') && !item.url.startsWith(urls$1.app)) {
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

      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      const day = date
        .getDate()
        .toString()
        .padStart(2, '0');

      const hours = date
        .getHours()
        .toString()
        .padStart(2, '0');

      const minutes = date
        .getMinutes()
        .toString()
        .padStart(2, '0');

      return `${date.getFullYear()}-${month}-${day}, ${hours}:${minutes}h`;
    };

    const ConfigStore = () => {
      const store = ObjectStore({
        align: 'initial',
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
        url: '',
        width: ''
      });

      return store;
    };

    const FeedStore = () => {
      const store = ObjectStore({
        date: new Date(),
        description: '',
        format: '',
        image: '',
        input: '',
        items: [],
        link: '',
        loading: false,
        title: '',
        version: ''
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

    /* components/Changes.html generated by Svelte v3.16.7 */

    const file = "components/Changes.html";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-1kws27u-style";
    	style.textContent = "h3.svelte-1kws27u{display:inline-block}h3+p.svelte-1kws27u,summary+.svelte-1kws27u{margin-top:0}summary.svelte-1kws27u{outline:none}li+li.svelte-1kws27u{margin-top:0.5em}small.svelte-1kws27u{display:inline-block;margin-right:0.5em;color:#bbb}code.svelte-1kws27u{background-color:#ffc;font-size:0.8em;font-weight:200}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhbmdlcy5odG1sIiwic291cmNlcyI6WyJDaGFuZ2VzLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBoMyB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgaDMgKyBwLCBzdW1tYXJ5ICsgKiB7XG4gICAgbWFyZ2luLXRvcDogMDtcbiAgfVxuXG4gIHN1bW1hcnkge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICBsaSArIGxpIHtcbiAgICBtYXJnaW4tdG9wOiAwLjVlbTtcbiAgfVxuXG4gIHNtYWxsIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgbWFyZ2luLXJpZ2h0OiAwLjVlbTtcbiAgICBjb2xvcjogI2JiYjtcbiAgfVxuXG4gIGNvZGUge1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmM7XG4gICAgZm9udC1zaXplOiAwLjhlbTtcbiAgICBmb250LXdlaWdodDogMjAwO1xuICB9XG48L3N0eWxlPlxuXG48ZGV0YWlscz5cbiAgPHN1bW1hcnk+XG4gICAgPGgzPkNoYW5nZSBMb2c8L2gzPlxuICA8L3N1bW1hcnk+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMjAtMDEtMDY8L3NtYWxsPlxuICAgIE5vdCBzdXJlIGhvdyBpdCByZWFsbHkgaGFwcGVuZWQgYnV0IEkgZ290IHByZXR0eSBtdWNoIGltbWVyc2VkIGludG8gd29ya2luZyBvbiB0aGlzIHByb2plY3QgZHVyaW5nIHRoZSBob2xpZGF5IHNlYXNvbuKApiBTbyBub3cgd2UgZ290OlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+QmV0dGVyIGNhY2hpbmcgc3VwcG9ydCBmb3IgZmVlZHMgYW5kIHJlZmVycmVyczwvbGk+XG4gICAgPGxpPlJTUyBpY29uIG5leHQgdG8gcmVmZXJyZXIgZGlyZWN0bHkgbGlua2luZyBpdHMgZmVlZCBVUkwgKGlmIGF2YWlsYWJsZSkgdG8gdGhpcyBhcHA8L2xpPlxuICAgIDxsaT5VcGdyYWRlIHRvIFN2ZWx0ZSAzICh3aGljaCB3YXMgcmF0aGVyIHRlZGlvdXMpIPCfmLA8L2xpPlxuICAgIDxsaT5SZS1lc3RhYmxpc2hlZCBzdXBwb3J0IGZvciBvbGRlciBicm93c2VycyAobG9va2luZyBhdCB5b3UsIEludGVybmV0IEV4cGxvcmVyIDExKSDwn5G0PC9saT5cbiAgICA8bGk+TXVsdGlwbGUgc21hbGwgZml4ZXMgYW5kIGltcHJvdmVtZW50cywgdGFrZSBhIGxvb2sgYXQgdGhlIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9wM2svcnNzLWJveC9jb21taXRzL21hc3Rlcic+Y29tbWl0IGxvZzwvYT4gZm9yIGRldGFpbHM8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDE5LTEyLTE1PC9zbWFsbD5cbiAgICBVcGdyYWRlZCB0aGUgSlNPTlAgcHJveHkgdG8gUHl0aG9uIDMuNyBhbmQgc2xpZ2h0bHkgcmV0b3VjaGVkIHRoZSBjb25maWd1cmF0aW9uIGZvcm0uIEEgbWVycnkgZW5kaW5nIGZvciAyMDE5IGFuZCBhIGhhcHB5IG5ldyB5ZWFyIPCfjokgPGVtPkl04oCZcyBoaW5kc2lnaHQhPGVtPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTgtMDEtMTk8L3NtYWxsPlxuICAgIE1vcmUgdGhhbiAxNSB5ZWFycyAoYW5kIHN0aWxsIGNvdW50aW5n4oCmKSBhZnRlciBpdHMgaW5jZXB0aW9uIHRoaXMgbGl0dGxlIHNlcnZpY2UgaXMgc3RpbGwgbGl2ZSBhbmQga2lja2luZyEgVGhlIGJlc3QgcGFydCBvZiB0aGlzIGhvYmJ5IHByb2plY3TigJlzIGxvbmctcnVubmluZyB0cmFpdDogdGhpcyB5ZWFyIGJyaW5ncyBhIGNvbXBsZXRlIHJld3JpdGUgYW5kIG92ZXJoYXVsIHdpdGggYW4gZXh0ZW5zaXZlIGxpc3Qgb2YgdXBkYXRlcyDigJMgYW5kIG9ubHkgc21hbGwgY2hhbmdlcyBpbiBmdW5jdGlvbmFsaXR5OlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+QWRkZWQgYmFzaWMgc3VwcG9ydCBmb3IgQXRvbSAxLjAgZmVlZHMg8J+UpTwvbGk+XG4gICAgPGxpPkFkZGVkIHN1cHBvcnQgZm9yIG11bHRpcGxlIGVuY2xvc3VyZXMgKFJTUyAwLjkzKTwvbGk+XG4gICAgPGxpPlJlcGxhY2VkIHZhbHVlIG9mIC0xIGZvciBhdXRvbWF0aWMgY29udGVudCBoZWlnaHQgd2l0aCDigJxlbXB0eeKAnSB2YWx1ZTwvbGk+XG4gICAgPGxpPkFkZGVkIHN1cHBvcnQgZm9yIOKAnGVtcHR54oCdIHZhbHVlIHRvIGJveCB3aWR0aCAobm93IGNhbGxlZCDigJ1tYXguIHdpZHRo4oCdKTwvbGk+XG4gICAgPGxpPlJlZHVjZWQgdG90YWwgc2l6ZSBvZiBlbWJlZGRlZCBkb3dubG9hZCBieSBtb3JlIHRoYW4gNjAlIOKaoTwvbGk+XG4gICAgPGxpPkluY3JlYXNlZCBwZXJmb3JtYW5jZSBvZiBsb2FkaW5nIGFuZCByZW5kZXJpbmcgYm94ZXM8L2xpPlxuICAgIDxsaT5JbXBsZW1lbnRlZCByZXNwb25zaXZlIENTUyBmb3IgYm90aCwgYm94ZXMgYW5kIGNvbmZpZ3VyYXRpb24gYXBwPC9saT5cbiAgICA8bGk+UmVwbGFjZWQgYml0bWFwIGljb25zIHdpdGggc2NhbGFibGUgdmVjdG9yIGdyYXBoaWNzPC9saT5cbiAgICA8bGk+Q29tcGxldGVseSByZXdyb3RlIHRoZSBhcHAgY29kZSB1c2luZyA8YSBocmVmPSdodHRwczovL3N2ZWx0ZS50ZWNobm9sb2d5Jz5TdmVsdGU8L2E+IGFuZCA8YSBocmVmPSdodHRwczovL21pbmNzcy5jb20vJz5taW4uY3NzPC9hPjwvbGk+XG4gICAgPGxpPlJlcGxhY2VkIHJlbWFpbmluZyBqUXVlcnkgY29kZSB3aXRoIHZhbmlsbGEgSmF2YVNjcmlwdDwvbGk+XG4gICAgPGxpPk1pZ3JhdGVkIGJ1aWxkIHNjcmlwdHMgdG8gUm9sbHVwIGFuZCBZYXJuPC9saT5cbiAgICA8bGk+QWRkZWQgc3VwcG9ydCBmb3IgbWlzc2luZyBicm93c2VyIGZlYXR1cmVzIHZpYSA8YSBocmVmPSdodHRwczovL3BvbHlmaWxscy5pbyc+cG9seWZpbGxzLmlvPC9hPjwvbGk+XG4gICAgPGxpPkRpc2NvbnRpbnVlZCBzdXBwb3J0IGZvciBvbGRlciBicm93c2VycyAoTVNJRSAmbHQ7IDExKTwvbGk+XG4gICAgPGxpPkJ1bXBlZCBtYWpvciB2ZXJzaW9uIHRvIDE4IChha2EgdGhlIHllYXIpLCBnZXR0aW5nIHJpZCBvZiBzZW1hbnRpYyB2ZXJzaW9uaW5nIGR1ZSB0byBsYWNrIG9mIHNlbWFudGljcyDwn5CxPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxNi0wMy0xMjwvc21hbGw+XG4gICAgQ29tcGxldGVseSByZXdyb3RlIGJ1aWxkIGVudmlyb25tZW50IHVzaW5nIFdlYlBhY2suIFN3aXRjaGVkIHRoZSA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vcDNrL3Jzcy1ib3gnPnNvdXJjZSByZXBvc2l0b3J5PC9hPiBmcm9tIFNWTiB0byBHaXQsIGhvc3RlZCBhdCBHaXRodWIuIFRoaXMgZGVzZXJ2ZXMgYSBuZXcgbWFqb3IgdmVyc2lvbiBudW1iZXIhXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0xMi0zMDwvc21hbGw+XG4gICAgQWRkZWQgc2ltcGxlIGNvZGUgdG8gbW9kaWZ5IHRoZSB3aWR0aCBhdHRyaWJ1dGUgb2YgaWZyYW1lLCBvYmplY3QgYW5kIGVtYmVkIGVsZW1lbnRzIHRvIG1ha2UgdGhlbSBmaXQgaW4gdGhlIGJveC4gQWxzbzogYnVtcGVkIHZlcnNpb24uIDxpPkEgaGFwcHkgbmV3IHllYXIgMjAxMywgZXZlcmJvZHkhPC9pPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMTAtMjY8L3NtYWxsPlxuICAgIEFkZGVkIHNlY3Rpb24gYWJvdXQgQ3JlYXRpdmUgQ29tbW9ucyBMaWNlbnNlLCBiZWxvdy4gSW4gb3RoZXIgd29yZHM6IHlvdSBjYW4gbm93IGxlZ2FsbHkgcnVuIG15IGNvZGUgb24geW91ciBvd24gc2VydmVyLiAoWW91IGV2ZW4gY291bGQgcmVtb3ZlIHRoZSB0aW55IHJlZmVyZW5jZSB0byB0aGlzIHBhZ2UgaW4gdGhlIGZvb3RlciBvZiB0aGUgYm94LikgSG93ZXZlciwgSSB3b3VsZCBsaWtlIHRvIGFzayB5b3UgZm9yIHR3byB0aGluZ3MgaWYgeW91IHdhbnQgdG8gZG8gc286XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIFVzZSB5b3VyIG93biA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vcDNrL2pzb24zayc+SlNPTlAgcHJveHk8L2E+IOKAkyBlc3BlY2lhbGx5LCB3aGVuIHlvdSBleHBlY3QgYSBoaWdoIGxvYWQgb24geW91ciBzZXJ2ZXIuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBQbGVhc2Ugc3VwcG9ydCB0aGUgc2VydmljZSB3aXRoIGEgPGEgaHJlZj0naHR0cDovL2ZsYXR0ci5jb20vdGhpbmcvNjgxODgxL0phdmFTY3JpcHQtUlNTLUJveC1WaWV3ZXInPmRvbmF0aW9uPC9hPi5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA4LTAxPC9zbWFsbD5cbiAgICBBZGRlZCB0d28gbmV3LCBleHBlcmltZW50YWwgZmVhdHVyZXMg4oCTIGFuZCB0aHVzLCBpbmNyZWFzZWQgdmVyc2lvbiB0byAzLjM6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIFRoZSBoZWlnaHQgb2YgdGhlIGlubmVyIGJveCBjb250ZW50IGNhbiBub3cgYmUgZGVmaW5lZCBieSBhIHBpeGVsIHZhbHVlLiBJZiB0aGUgaGVpZ2h0IGlzIGxlc3MgdGhhbiB0aGUgc3BhY2UgbmVlZGVkIGJ5IHRoZSBkZXNpcmVkIGFtb3VudCBvZiBpdGVtcyB5b3UgY2FuIHZlcnRpY2FsbHkgc2Nyb2xsIHRoZSBjb250ZW50LiBBIHZhbHVlIG9mIDxjb2RlPi0xPC9jb2RlPiBlbmFibGVzIHRoZSBkZWZhdWx0IGJlaGF2aW9yIGFuZCBhdXRvbWF0aWNhbGx5IHNldHMgdGhlIGhlaWdodCBhY2NvcmRpbmcgdG8gdGhlIGRpc3BsYXlpbmcgaXRlbXMuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBUaGUgc28tY2FsbGVkIOKAnGhlYWRsZXNz4oCdIG1vZGUgcmVtb3ZlcyB0aGUgdGl0bGViYXIgYW5kIHRoZSBmcmFtZSBmcm9tIHRoZSBib3guIFRoaXMgd2F5IHRoZSBib3ggY2FuIGJlIHVzZWQgbW9yZSBmbGV4aWJseSBpbiBzcGVjaWFsIHNpdHVhdGlvbnMuIEhvd2V2ZXIsIHRoaXMgZmVhdHVyZSBzb21laG93IHVuZGVybWluZXMgYW4gUlNTIGZlZWTigJlzIGF1dGhvcml0eSBzbyBJIGNvdW50IG9uIHlvdXIgZmFpcm5lc3MgdG8gZ2l2ZSBjcmVkaXQgd2hlcmUgY3JlZGl0IGlzIGR1ZSFcbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA3LTE2PC9zbWFsbD5cbiAgICBTbGlnaHRseSBtb2RpZmllZCBvdXRwdXQgb2YgdGhlIEhUTUwgY29kZSB0byBiZSB1c2FibGUgd2l0aCBib3RoLCB1bnNlY3VyZWQgYW5kIHNlY3VyZWQgKEhUVFBTKSB3ZWIgc2VydmVycy4gWW91IGNhbiB1cGRhdGUgYWxyZWFkeSBlbWJlZGRlZCBjb2RlIGVhc2lseSBieSByZW1vdmluZyB0aGUgPGNvZGU+aHR0cDo8L2NvZGU+IHBhcnQgZnJvbSB0aGUgPGNvZGU+c3JjPC9jb2RlPiBhdHRyaWJ1dGUgb2YgdGhlIDxjb2RlPiZsdDtzY3JpcHQmZ3Q7PC9jb2RlPiBlbGVtZW50OiA8Y29kZT4mbHQ7c2NyaXB0IHNyYz0naHR0cDovL3Azay5vcmcvcnNz4oCmJyZndDs8L2NvZGU+IGJlY29tZXMgPGNvZGU+Jmx0O3NjcmlwdCBzcmM9Jy8vcDNrLm9yZy9yc3PigKYnJmd0OzwvY29kZT4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNy0xMzwvc21hbGw+XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEZpeGVkIElFIGJ1ZyAo4oCcaW5uZXJIVE1MIGlzIG51bGwgb3Igbm90IGFuIG9iamVjdOKAnSkgY2F1c2VkIGJ5IHVzaW5nIGpRdWVyeeKAmXMgaHRtbCgpIG1ldGhvZCBpbnN0ZWFkIG9mIHRleHQoKSB3aGVuIHBhcnNpbmcgYSA8Y29kZT4mbHQ7Y29udGVudDplbmNvZGVkJmd0OzwvY29kZT4gZWxlbWVudC5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIENoYW5nZWQgcHJpb3JpdHkgb2YgZWxlbWVudHM6IG9ubHkgY2hlY2sgZm9yIDxjb2RlPiZsdDtjb250ZW50OmVuY29kZWQmZ3Q7PC9jb2RlPiBpZiAgICAgPGNvZGU+Jmx0O2Rlc2NyaXB0aW9uJmd0OzwvY29kZT4gaXMgbm90IGF2YWlsYWJsZS5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA2LTA0PC9zbWFsbD5cbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgSW1wbGVtZW50ZWQgc21hbGwgcm91dGluZSB0byByZXNpemUgaW1hZ2VzIGNvbnRhaW5lZCBpbiB0aGUgZmVlZCBjb250ZW50IHRvIGZpdCBpbiB0aGUgYm94LlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgc3VwcG9ydCBmb3IgbmV3IEhUTUw1IGZvcm0gaW5wdXQgdHlwZXMgYW5kIHRoZWlyIHZhbGlkYXRpb24uXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNS0zMTwvc21hbGw+XG4gICAgR29uZSAmYmV0YTtldGEhIOKAkyB3aXRoIHRocmVlIHRpbnkgYWRkaXRvbnM6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIDxjb2RlPiZsdDtub3NjcmlwdCZndDs8L2NvZGU+IGVsZW1lbnQgZm9yIGJyb3dzZXJzIHByb3ZpZGluZyBubyBKYXZhU2NyaXB0IGVuZ2luZS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIG9wdGlvbiB0byBjYWxsIHRoZSBjb25maWd1cmF0b3Igd2l0aCBhIFVSTCBpbiB0aGUgcXVlcnkgc3RyaW5nLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgYSBsaW5rIHRvIHRoZSBXM0MgZmVlZCB2YWxpZGF0b3IgdG8gdGhlIGNvbnRlbnRzIG9mIGEgYm94IGRpc3BsYXlpbmcgYW4gUlNTIGVycm9yLlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDUtMTk8L3NtYWxsPlxuICAgIEFwb2xvZ2llcyBmb3IgdGhlIFJTUyBCb3hlcyBub3Qgc2hvd2luZyB1cCBvbiB5b3VyIHBhZ2VzIGR1cmluZyB0aGUgbGFzdCBmZXcgZGF5cy4gSSBtYWRlIGEgc3R1cGlkIG1pc3Rha2UgdGhhdCBjYXVzZWQgb25seSB0aGUgc2V0dXAgcGFnZSB0byByZW5kZXIgY29ycmVjdGx5IOKAkyBhbmQgSSBkaWQgbm90IGNoZWNrIGFueSBlbWJlZGRlZCBzY3JpcHQuIDxpPkJ1bW1lciE8L2k+XG4gIDwvcD5cbiAgPHA+XG4gICAgQXQgbGVhc3Qgbm93IGV2ZXJ5dGhpbmcgc2hvdWxkIGJlIGJhY2sgdG8gbm9ybWFsLiAoSSBob3BlIHRoaXMgaW5jaWRlbnQgZGlkIG5vdCBzYWJvdGFnZSB0aGUgRmxhdHRyIGJ1dHRvbiBJIGFkZGVkIGluIHRoZSBtZWFudGltZeKApiA8aT53aW5rLCB3aW5rITwvaT4pXG4gIDwvcD5cbiAgPHA+QW55d2F5LCB0aGFua3MgZm9yIHlvdXIgdW5kZXJzdGFuZGluZy48L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDUtMTY8L3NtYWxsPlxuICAgIEkgdGhpbmsgSSBkaWQgbm90IG1lbnRpb24sIHlldCwgdGhhdCB0aGUgY3VycmVudCBpbmNhcm5hdGlvbiBvZiB0aGUgY29kZSBpcyB0b3RhbGx5IGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSB2ZXJzaW9uIGFzIG9mIDIwMDkuIEVhY2ggaXMgdXNpbmcgdGhlaXIgb3duIGNvZGViYXNlLCB0aGUgbGVnYWN5IGNvZGUgd2FzIG5vdCBtb2RpZmllZCBhdCBhbGwgYW5kIHRodXMsIGl0IGlzIG5vdCBhZmZlY3RlZCBieSBhbnkgcmVjZW50IGNoYW5nZXMuIFlvdSBjYW4gY2hlY2sgd2hpY2ggdmVyc2lvbiB5b3UgYXJlIHVzaW5nIGJ5IGxvb2tpbmcgYXQgdGhlIHNjcmlwdCBVUkwuIElmIGl0IGNvbnRhaW5zIHRoZSBzdHJpbmcg4oCccHJveHkucuKAnSB5b3UgZ2V0IHRoZSDigJxjbGFzc2lj4oCdIFJTUyBCb3ggcmVuZGVyaW5nLiBUaGUgbW9kZXJuaXplZCB2ZXJzaW9uIGNhbGxzIOKAnGluZGV4Lmpz4oCdLiBOZXZlcnRoZWxlc3MsIHlvdSBjYW5ub3Qgc2V0dXAgYm94ZXMgd2l0aCB0aGUgb2xkIFVSTCBhbnltb3JlLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDUtMDk8L3NtYWxsPlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBzdXBwb3J0IGZvciA8Y29kZT4mbHQ7Y29udGVudDplbmNvZGVkJmd0OzwvY29kZT4gZWxlbWVudC5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEltcGxlbWVudGVkIE1lbWNhY2hlIHVzYWdlIGluIEFwcEVuZ2luZSBjb2RlLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQmVhdXRpZmllZCB0aGlzIHBhZ2UgYnkgdXNpbmcgdGhlIDxhIGhyZWY9J2h0dHA6Ly93d3cuZ29vZ2xlLmNvbS93ZWJmb250cy9zcGVjaW1lbi9Ecm9pZCtTZXJpZic+R29vZ2xl4oCZcyBEcm9pZCBTZXJpZiBmb250PC9hPi5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA0LTI2PC9zbWFsbD5cbiAgICBBbWF6aW5nISBBIG5ldyB2ZXJzaW9uISBBZnRlciBtb3JlIHRoYW4gdHdvIHllYXJzIGhpYXR1cyBJIGNvbXBsZXRlbHkgcmV3cm90ZSB0aGUgY29kZWJhc2UgYW5kIGZyYW1ld29yazpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgUmVtb3ZlZCBkZXBlbmRlbmN5IHRvIFJlYm9sIHVzaW5nIGEgc21hbGwgSlNPTlAgcHJveHkgYXQgR29vZ2xl4oCZcyBBcHBFbmdpbmUuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBSZXdyb3RlIFhNTCBwYXJzaW5nLCByZXBsYWNpbmcgbmF0aXZlIG1ldGhvZHMgd2l0aCBqUXVlcnkgb25lcy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIENsZWFuZWQgdXAgSFRNTCBvdXRwdXQgZm9yIHRoZSBSU1MgQm94LCByZXBsYWNpbmcgdGFibGVzIHdpdGggZGl2cy4gPGk+Tm90ZTogWW91IG1pZ2h0IG5lZWQgdG8gYWRkIDxjb2RlPjxhIGhyZWY9J2h0dHA6Ly9jb2Rpbmcuc21hc2hpbmdtYWdhemluZS5jb20vMjAxMC8xMS8wMi90aGUtaW1wb3J0YW50LWNzcy1kZWNsYXJhdGlvbi1ob3ctYW5kLXdoZW4tdG8tdXNlLWl0Lyc+IWltcG9ydGFudDwvYT48L2NvZGU+IHRvIHlvdXIgY3VzdG9tIFJTUyBCb3ggc3R5bGVzaGVldCBkZWZpbml0aW9ucy48L2k+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBSZXBsYWNlZCBmdWdseSBjb2xvcnBpY2tlciBpbiBjb25maWd1cmF0b3Igd2l0aCB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL2NsYXZpc2thL2pxdWVyeS1taW5pQ29sb3JzLyc+TWluaUNvbG9ycyBqUXVlcnkgcGx1Z2luPC9hPi5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGxpbmsgY29sb3Igc2V0dGluZyBhbmQgc3R5bGUgYXR0cmlidXRlcyBmb3IgY29ycmVjdGx5IGFwcGx5aW5nIGNvbG9yIHNldHRpbmdzLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgY29ybmVyIHJhZGl1cyBzZXR0aW5nLiA8aT5Ob3RlOiBkb2VzIG5vdCB3b3JrIGluIElFOCBhbmQgZWFybGllciB2ZXJzaW9ucy48L2k+XG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBmb250IHNpemUgdG8gdGhlIGZvbnQgZmFjZSBzZXR0aW5nLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUmVtb3ZlZCBhbGlnbiBzZXR0aW5nIGZyb20gY29uZmlndXJhdG9yIChzdGlsbCB3b3JrcyBpbiBzY3JpcHQgdGFncyBnZW5lcmF0ZWQgd2l0aCBlYXJsaWVyIHZlcnNpb25zKS5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA5LTEyLTEzPC9zbWFsbD5cbiAgICBTd2l0Y2hlZCBvdXRwdXQgb2YgdGhpcyBwYWdlIHRvIEhUTUw1IGFuZCBtYWRlIHNvbWUgYWRhcHRhdGlvbnMgaW4gdGhlIEhUTUwgY29kZSBhbmQgQ1NTIHN0eWxlc2hlZXQuIFVwZGF0ZWQgdmVyc2lvbiBzdHJpbmcgdG8gMi4xLCBmaW5hbGx5IVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDktMDktMjg8L3NtYWxsPlxuICAgIFNvbWUgbWlub3IgY2hhbmdlcyBhZnRlciBhIHdoaWxlOlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+UmVmYWN0b3JlZCBkYXRlIHBhcnNpbmcgdG8gc2hvdyBhY3R1YWwgYnVpbGQgZGF0ZXMgbW9yZSByZWxpYWJseTwvbGk+XG4gICAgPGxpPlJlZmFjdG9yZWQgY2FjaGluZyByb3V0aW5lIChvbmx5IGluIG9ubGluZSB2ZXJzaW9uKTwvbGk+XG4gICAgPGxpPlVwZGF0ZWQgdmVyc2lvbiBzdHJpbmcgdG8gMi4xYiwgYXBwcm9hY2hpbmcgYW5vdGhlciBmaW5hbCB2ZXJzaW9uLjwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDgtMDItMTk8L3NtYWxsPlxuICAgIFNlZW1zIHRoZXJlIHdlcmUgc29tZSBjaGFuZ2VzIGluIHRoZSBhaXIgYXMgSSBkaWQgbm90IHBsYW4gYW5vdGhlciB1cGRhdGUgYnV0IGhlcmUgY29tZXMgdmVyc2lvbiAyLjEgYnJpbmdpbmcgdG8geW91OlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBGdWxsIGNsaWVudC1zaWRlIHByb2Nlc3NpbmcgKG9ubHkgdGhlIHJhdyBmZWVkIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIpLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgVXNlci1mcmllbmRsaWVyIGludGVyZmFjZSB3aXRoIGNvbG9yIHBpY2tlcnMsIHN0YXR1cyBhbmQgZXJyb3IgZGlzcGxheSBhcyB3ZWxsIGFzIGluc3RhbnQgZmVlZGJhY2sgb24gYW55IGNoYW5nZSBpbiBzZXR1cC5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFuZCBmaW5hbGx5IChkcnVtcm9sbCEpIFVuaWNvZGUgc3VwcG9ydCBhdCBsZWFzdCBhdCB0aGlzIGluc3RhbGxhdGlvbiBvZiB0aGUgdmlld2VyLiAoSWUuIHRoZSBkb3dubG9hZGVkIHZlcnNpb24gc3RpbGwgd2lsbCBvdXRwdXQgQVNDSUkgb25seS4pXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOC0wMi0wMzwvc21hbGw+XG4gICAgTWFkZSBzb21lIG1vcmUgaW1wcm92ZW1lbnRzIGVzcGVjaWFsbHkgcmVnYXJkaW5nIHRoZSBlcnJvciBoYW5kbGluZyBhbmQgb3V0cHV0LiBGcm9tIG5vdyBvbiBpdCBzaG91bGQgYmUgbXVjaCBjbGVhcmVyIHdoYXTigJlzIHdyb25nIHdpdGggYSB2ZXJ5IFJTUyBCb3guIFNpbmNlIHRoZXJl4oCZcyBub3cgYSBsb3QgbW9yZSBvZiBjbGllbnQtc2lkZSBKYXZhU2NyaXB0IGNvZGUgaW52b2x2ZWQgSSB0ZXN0ZWQgdGhlIHNjcmlwdCBpbiBmb3VyIG1ham9yIGJyb3dzZXJzIHRoYXQgYXJlIGF2YWlsYWJsZSB0byBtZTogSW50ZXJuZXQgRXhwbG9yZXIgNywgRmlyZWZveCAyLjAsIE9wZXJhIDkuMjUgYW5kIFNhZmFyaSAzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDgtMDItMDE8L3NtYWxsPlxuICAgIENvbXBsZXRlbHkgcmV2aXNlZCBzZXJ2ZXItIGFuZCBjbGllbnQtc2lkZSBjb2RlLiBYTUwgcmVuZGVyaW5nIGlzIG5vdyBkb25lIGluIHRoZSBicm93c2VyIHdoaWNoIHNwZWVkcyB1cCB0aGluZ3MgYW5kIGRlY3JlYXNlcyB0aGUgbG9hZCBvbiB0aGUgc2VydmVyLiBGdXJ0aGVybW9yZSwgdGhlIGxpc3Qgb2YgcmVmZXJyZXJzIGlzIG5vdyBsb2FkZWQgb24gZGVtYW5kIHZpYSBBSkFYIGFuZCB0aHVzIG5vdCByZW5kZXJlZCB3aXRoIGV2ZXJ5IHJlcXVlc3QuIEZpbmFsbHksIEkgcmV0b3VjaGVkIHRoZSBzZXR1cCBmb3JtIGludGVyZmFjZSBhbmQgY2xlYW5lZCB1cCBib3RoIEhUTUwgYW5kIENTUy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTEyLTIwPC9zbWFsbD5cbiAgICBJIGFtIHZlcnkgZ2xhZCB0aGF0IG15IG9sZCBsaXR0bGUgc2NyaXB0IGlzIGdhaW5pbmcgZXZlbiBtb3JlIGF0dGVudGlvbiBhZnRlciBhbGwgdGhlc2UgeWVhcnPigKYgICAgPGk+VGhhbmsgeW91IHZlcnkgbXVjaCBpbmRlZWQhPC9pPiBTaW5jZSB0aGVyZSBhcmUgY29taW5nIGluIG1vcmUgYW5kIG1vcmUgb2YgdGhlIHNhbWUgcmVxdWVzdHMgYW5kIEkgYW0gcmVhbGx5IG5vdCBhYmxlIHRvIGhhbmRsZSB0aGVtIChhcG9sb2dpZXMhKSwgaGVyZSBpcyBzb21lIGFkdmljZSBmb3IgZXZlcnlvbmU6XG4gIDwvcD5cbiAgPG9sPlxuICAgIDxsaT5cbiAgICAgIDxhIGhyZWY9J2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ2FzY2FkaW5nX1N0eWxlX1NoZWV0cyc+VXNlIGNhc2NhZGluZyBzdHlsZSBzaGVldHM8L2E+IChDU1MpIHRvIGNoYW5nZSBmb250IHNpemVzIChhbmQgdG8gZ2VuZXJhbGx5IGRlZmluZSB5b3VyIGxheW91dCkuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICA8YSBocmVmPSdodHRwOi8vd3d3LnNpdGVwb2ludC5jb20vYXJ0aWNsZS9iZXdhcmUtb3BlbmluZy1saW5rcy1uZXctd2luZG93Jz5CZXdhcmUgb2Ygb3BlbmluZyBsaW5rcyBpbiBhIG5ldyB3aW5kb3cuPC9hPiBJdOKAmXMgb2ZmZW5zaXZlIHRvIHlvdXIgcmVhZGVycy5cbiAgICA8L2xpPlxuICA8L29sPlxuICA8cD5cbiAgICA8aT5BIGhhcHB5IGVuZCBmb3IgMjAwNiE8L2k+XG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNi0xMzwvc21hbGw+XG4gICAgRGlkIHNvbWUgbWlub3IgYnVnIGZpeGluZyBhZ2FpbiAoYW1vbmdzdCBvdGhlcnMgcmVwbGFjaW5nIHNpbmdsZSBxdW90ZXMgd2l0aCAmYXBvczsgYW5kIG5vdCAmcXVvdDsgZW50aXRpZXMpLiBGdXJ0aGVybW9yZSAoYW5kIGZpbmFsbHkpLCBJIHJlbW92ZWQgdGhlIOKAnFJD4oCdIChhcyBpbiDigJxSZWxlYXNlIENhbmRpZGF0ZeKAnSkgZnJvbSB0aGUgZG9jdW1lbnQgdGl0bGXigKZcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA2LTEyPC9zbWFsbD5cbiAgICBHYXJ5IGluZm9ybWVkIG1lIHRoYXQgbG9uZ2VyIGZlZWQgVVJMcyBjYXVzZSB0cm91YmxlIGFuZCB0aGUgZmVlZCBib3ggd2lsbCBub3QgYmUgZGlzcGxheWVkLiBUaGF04oCZcyBpbiBmYWN0IGEgYnVnLCBidXQgdW5mb3J0dW5hdGVseSBvbmUgdGhhdCBjYW5ub3QgYmUgZml4ZWQgc28gZWFzaWx5LiBNeSBzdWdnZXN0aW9uIGlzIHRvIHNob3J0ZW4gc3VjaCBVUkxzIGF0IG9uZSBvZiB0aGUgd2Vic2l0ZXMgYXJvdW5kIHRoYXQgcHJvdmlkZSBzdWNoIGEgc2VydmljZSwgZS5nLiA8YSBocmVmPSdodHRwOi8vdGlueXVybC5jb20nPnRpbnl1cmwuY29tPC9hPi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTIzPC9zbWFsbD5cbiAgICBTd2l0Y2hlZCB0aGUgPGEgaHJlZj0naHR0cHM6Ly9wM2sub3JnL3NvdXJjZS9yc3MtYm94Lyc+c291cmNlIHJlcG9zaXRvcnk8L2E+IGZyb20gQ1ZTIHRvIFN1YnZlcnNpb24gKFNWTikuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNC0yMDwvc21hbGw+XG4gICAgQW5kcmV3IFBhbSBicm91Z2h0IHVwIGEgc2VyaW91cyBpc3N1ZSB0aGF0IHByb2JhYmx5IG1pZ2h0IGhhdmUgYWZmZWN0ZWQgc29tZSBtb3JlIHBlb3BsZSBhbHJlYWR5OiB0aGUgdmlld2VyIGRvZXMgbm90IHN1cHBvcnQgVVRGLTggKG9yIFVuaWNvZGUsIHJlc3AuKSBVbmZvcnR1bmF0ZWx5LCB0aGlzIGlzIOKAnGJ1aWx0LWlu4oCdIGludG8gdGhlIHVuZGVybHlpbmcgc2NyaXB0aW5nIGxhbmd1YWdlIChha2EgUmVib2wpLiBJ4oCZbSBzb3JyeSB0byBjYW5jZWwgdGhvc2UgdGlja2V0c+KApiA6KFxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMTM8L3NtYWxsPlxuICAgIEZpeGVkIGEgYnVnIHJlcG9ydGVkIGJ5IE1hbmRvIEdvbWV6IHRoYXQgY2F1c2VkIGZlZWRzIHVzaW5nIHRoZSAmbHQ7Z3VpZCZndDsgZWxlbWVudCBiZWluZyBkaXNwbGF5ZWQgd2l0aG91dCBpdGVtIGxpbmtz4oCmIERvbuKAmXQgZm9yZ2V0IHRvIGNoZWNrIG91dCBNYW5kb+KAmXMgZXhjZWxsZW50IHdlYnNpdGUgPGEgaHJlZj0naHR0cDovL3d3dy5tYW5kb2x1eC5jb20vJz5tYW5kb2x1eDwvYT4hXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNC0xMjwvc21hbGw+XG4gICAgT2J2aW91c2x5IFNhbSBSdWJ5IGNoYW5nZWQgaGlzIGZlZWQgZm9ybWF0IGZyb20gc2NyaXB0aW5nTmV3cyB0byBBdG9tOyB3aGljaCByZW5kZXJzIG15IGV4YW1wbGUgbGluayBhYm92ZSBwcmV0dHkgdXNlbGVzc+KApiBTbyBmYXIgSSBkb27igJl0IGtub3cgYWJvdXQgYW55IG90aGVyIHNjcmlwdGluZ05ld3MgZmVlZCwgZG8geW91P1xuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDItMjA8L3NtYWxsPlxuICAgIEkgaG9wZSBub2JvZHkgbWluZHMgdGhlIGxpdHRsZSBsaW5lIEkgYWRkZWQgYXQgdGhlIGJvdHRvbSBvZiBlYWNoIFJTUyBib3jigKYgT2YgY291cnNlLCBpdOKAmXMgbm90IHRvdGFsbHkgYWx0cnVpc3RpYywgYnV0IHByb2JhYmx5IHNvbWUgcGVvcGxlIHdpbGwgZmluZCBpdCBpbmZvcm1hdGl2ZS4gSG93ZXZlciwgaWYgeW91IHdhbnQgdG8gcHJldmVudCBpdCBmcm9tIGJlaW5nIGRpc3BsYXllZCBzaW1wbHkgYWRkIDxjb2RlPi5yc3Nib3gtcHJvbW8geyd7J31kaXNwbGF5OiBub25lO3snfSd9PC9jb2RlPiB0byB5b3VyIHN0eWxlc2hlZXQuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wMS0xMTwvc21hbGw+XG4gICAgTmV3IHNlcnZlciwgbmV3IHRyb3VibGVzOiBJIG1vdmVkIHRoZSB2aWV3ZXIgdG8gYSBuZXdseSBzZXR1cCBVYnVudHUgbWFjaGluZS4gT2YgY291cnNlLCBJIGZvcmdvdCB0byBzZXQgc29tZSBwZXJtaXNzaW9uIGZsYWdzIGFuZCBvd25lcnMsIHRodXMsIHByZXZlbnRpbmcgdGhlIHNjcmlwdCBmcm9tIHdvcmtpbmcuIEhvd2V2ZXIsIEkgdGhpbmsgZXZlcnl0aGluZyBpcyBmaXhlZCBhbmQgd29ya2luZyBhZ2Fpbi5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA1LTExLTE2PC9zbWFsbD5cbiAgICBKdXN0IHRlc3RpbmcgR29vZ2xl4oCZcyBBZFNlbnNlIGZvciBhIHdoaWxlLiBTaW5jZSB0aGlzIHBhZ2UgZ2VuZXJhdGVzIG1vc3Qgb2YgbXkgdHJhZmZpYyBJIHdhbnRlZCB0byBzZWUgbXlzZWxmIHdoYXQgYSBiYW5uZXIgY2FuIGRvIGhlcmUuIEhvcGUgeW91IGRvbuKAmXQgbWluZC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTEyLTE2PC9zbWFsbD5cbiAgICBCdWdmaXg6IFNvbWV0aW1lcyB0aGUgbG9nZmlsZSB3aGljaCBpcyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBsaXN0IG9mIHNpdGVzIHVzaW5nIHRoaXMgc2NyaXB0IGdldHMgY29ycnVwdGVkLiBUaGlzIGFmZmVjdGVkIHRoZSB3aG9sZSBzZXR1cCBwYWdlIHRvIHJldHVybiBhbiBlcnJvciBhbmQgdGh1cywgaXQgbmVlZGVkIHRvIGJlIGNhdWdodC4gKFlvdSB3aWxsIHNlZSBhIOKAnGN1cnJlbnRseSBvdXQgb2Ygb3JkZXLigJ0gbWVzc2FnZSB0aGVuLilcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTA0LTI2PC9zbWFsbD5cbiAgICBMYXN0IGVmZm9ydHMgdG8gb2ZmaWNpYWxseSByZWxlYXNlIHRoZSA8YSBocmVmPSdodHRwczovL3Azay5vcmcvc291cmNlL3Jzcy1ib3gnPmNvZGU8L2E+IHRvIHRoZSBvcGVuIHNvdXJjZSBjb21tdW5pdHkuIFRoZXJlIGhhdmUgYmVlbiBzb21lIGJ1Z3MgaW4gdGhlIChpbWFnZSkgcmVuZGVyaW5nIGZyYW1ld29yayB3aGljaCBJIGZpeGVkIHNvICAgIGZhci4gSSBub3cgaW5jbHVkZSBhIGR5bmFtaWNhbGx5IHJlbmRlcmVkIGxpc3Qgb2Ygc2l0ZXMgdXNpbmcgKG9yIHBvaW50aW5nIHRvKSB0aGlzIHNjcmlwdCB0byBnaXZlIHNvbWUgZXhhbXBsZXMgZm9yIHRoZSBjdXJpb3VzIGF0IGhlYXJ0IChtZSBpbmNsdWRlZCkuIEZpbmFsbHksIHRoZXJl4oCZcyBhIDxhIGhyZWY9J2h0dHBzOi8vcDNrLm9yZy9zb3VyY2UvcnNzLWJveC9icmFuY2hlcy8yLjAvUkVBRE1FJz5SRUFETUU8L2E+IGZpbGUgd2l0aCBhIHNob3J0IGluc3RhbGxhdGlvbiBndWlkZSB0byBtYWtlIHRoZSBzY3JpcHQgcnVuIG9uIHlvdXIgb3duIHNlcnZlci5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTAxLTI4PC9zbWFsbD5cbiAgICBXaGVuIHNvbWV0aGluZyBnb2VzIHdyb25nIChtb3N0IG9mIHRoZSB0aW1lIHRoaXMgbWlnaHQgYmUgYSB3cm9uZyBVUkwsIGllLiBhIDQwNCBhcyByZXN1bHQpIGFuICAgIDxhIGhyZWY9Jy4vP3VybD1lcnJvcic+4oCcZXJyb3LigJ0gYm94PC9hPiB3aWxsIGJlIGRpc3BsYXllZCB0byBzaWduYWwgdGhlIGZhaWx1cmUuIEluY3JlYXNlZCB2ZXJzaW9uIHVwIHRvIDEuMCBhbmQgbGFiZWxlZCBpdCBhcyByZWxlYXNlIGNhbmRpZGF0ZVxuICAgIChSQykuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNC0wMS0yNjwvc21hbGw+XG4gICAgUmV0b3VjaGVkIHRoZSBjb2RlIGluIGEgdmVyeSBsYXN0IGVmZm9ydCB0byBtYWtlIHRoZSBzY3JpcHQgcnVubmluZyBzdGFuZC1hbG9uZSAod2l0aCBSZWJvbCBidXQgICAgPGk+d2l0aG91dDwvaT4gUEhQLCB0aGF0IGlzKS4gRXZlcnl0aGluZyBuZWVkZWQgaXMgbm93IGluIDxkZWw+Q1ZTPC9kZWw+IFNWTiBzbyBldmVyeWJvZHkgY2FuIGRvd25sb2FkIGZyb20gdGhlcmUuIFBvdGVudGlhbGx5LCBhIGZldyBtaW5vciBidWcgZml4ZXMgbWlnaHQgZm9sbG93IHNob3J0LXRlcm0uIFVoLCBhbmQgdGhlIEhUTUwgY29kZSBpcyA8YSBocmVmPSdodHRwOi8vdmFsaWRhdG9yLnczLm9yZy9jaGVjaz91cmk9aHR0cCUzQSUyRiUyRnAzay5vcmclMkZyc3MlMkYnPnZhbGlkIFhIVE1MIDEuMDwvYT4gbm93LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMTItMTI8L3NtYWxsPlxuICAgIFRoZSBtaXJyb3IgYXQgPGRlbD5odHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzLzwvZGVsPiBpcyBub3Qgd29ya2luZyBmb3IgcXVpdGUgYSBsb25nIHRpbWUuIEkgdHJpZWQgdG8gY29udGFjdCBBZGFtIEN1cnJ5IGJ1dCBzbyBmYXIgd2l0aG91dCBzdWNjZXNzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMDMtMzA8L3NtYWxsPlxuICAgIE1vdmVkIHRvIG5ldyBzZXJ2ZXIgd2l0aCBuZXcgZG9tYWluIDxkZWw+Zm9yZXZlci5wM2sub3JnPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDMtMDMtMjU8L3NtYWxsPlxuICAgIFVwZGF0ZWQgUmVib2wgdG8gPGEgaHJlZj0naHR0cDovL3d3dy5yZWJvbC5jb20vbmV3czMzMTAuaHRtbCc+dmVyc2lvbiAyLjUuNTwvYT4uIEVuZCBvZiBSZWJvbOKAmXMg4oCcRE5TIHpvbWJpZXPigJ0gaW4gdGhlIHByb2Nlc3MgbGlzdC5cbiAgICA8aT5GaW5hbGx5LjwvaT5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAyLTAyLTE5PC9zbWFsbD5cbiAgICBBZGRlZCBhIHZlcnkgbmljZSBxdW90ZSBmcm9tIDxhIGhyZWY9J2h0dHA6Ly93d3cub3VycGxhLm5ldC9jZ2ktYmluL3Bpa2llLmNnaT9BYmJlTm9ybWFsJz5BYmJlIE5vcm1hbDwvYT4gb24gdG9wIHJpZ2h0IG9mIHRoaXMgZG9jdW1lbnQuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0xMS0xNzwvc21hbGw+XG4gICAgSWYgeW91IHdhbnQgYSBtb3JlIGNvbXBhY3QgdmlldyBvZiB0aGUgUlNTIGJveCB5b3UgY2FuIGdldCBpdCBub3cgdXNpbmcgdGhlIGNvcnJlc3BvbmRpbmcgY2hlY2tib3guIElmIGl0IGlzIGVuYWJsZWQgdGhlIGRlc2NyaXB0aW9ucyBvZiBlYWNoIGl0ZW0gd2lsbCBub3QgYmUgZGlzcGxheWVkICYjODIxMTsgZ2l2ZW4gdGhhdCB0aGUgaXRlbSB0aXRsZSBpcyBkZWZpbmVkIChvdGhlcndpc2UgdGhlcmUgd291bGQgbm90IGJlIG11Y2ggdG8gc2VlKS4gQWRkaXRpb25hbGx5LCB0aGUgY2hhbm5lbCBpbWFnZSAoaWYgZGVmaW5lZCkgd2lsbCBub3QgYmUgZGlzcGxheWVkLiBUaGFua3MgJiMxMDY7JiMxMTU7JiMxMjE7JiMxMDE7JiMxMTE7JiM2NDsmIzk5OyYjMTExOyYjMTA5OyYjMTEyOyYjMTE3OyYjMTE1OyYjMTAxOyYjMTE0OyYjMTE4OyYjMTAxOyYjNDY7JiM5OTsmIzExMTsmIzEwOTsgZm9yIHRoZSBzdWdnZXN0aW9ucyFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTIxPC9zbWFsbD5cbiAgICBTaW5jZSB0b2RheSB0aGUgPGNvZGU+dGV4dGlucHV0PC9jb2RlPiB0YWcgaXMgc3VwcG9ydGVkLiBJdCBjcmVhdGVzIGFuIGFwcHJvcHJpYXRlIGZvcm0gYXQgdGhlIGVuZCBvZiB0aGUgYm94LiBNb3Jlb3ZlciwgdHdvIGJ1Z3Mgd2VyZSBmaXhlZDogb25lIGNhdXNlZCB1bm5lY2Vzc2FyeSBpbmZvcm1hdGlvbiBpbiB0aGUgcXVlcnkgc3RyaW5nIG9mIHRoZSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCB0YWcuIFRoZSBvdGhlciBhZmZlY3RlZCB0aGUgZGlzcGxheSBvZiB0aGUgZGF0ZeKAmXMgdGltZSB6b25lLiBUaW1lIHpvbmVzIG5vdyBhcmUgZ2VuZXJhbGx5IGRpc3BsYXllZCBpbiBHTVQgZXhjZXB0IHdoZXJlIGFub3RoZXIgdGltZSB6b25lIGFjcm9ueW0gaXMgZGVmaW5lZC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTA0PC9zbWFsbD5cbiAgICBBZGRlZCBpY29ucyBmb3IgZW5jbG9zdXJlIGFuZCBzb3VyY2U7IGFkZGVkIFhNTCBidXR0b24gY2hlY2tib3ggdG8gZW5hYmxlIG91dHB1dCBvZiB0aGUgcXVhc2ktc3RhbmRhcmQgb3JhbmdlIGJ1dHRvbiBsaW5raW5nIHRvIHRoZSBYTUwgc291cmNlIChpZGVhYnkgJiM5NzsmIzEwMDsmIzk3OyYjMTA5OyYjNjQ7JiM5OTsmIzExNzsmIzExNDsmIzExNDsmIzEyMTsmIzQ2OyYjOTk7JiMxMTE7JiMxMDk7KS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA5LTAzPC9zbWFsbD5cbiAgICBJdOKAmXMgbm93IHBvc3NpYmxlIHRvIHJlZmluZSB0aGUgc3R5bGUgb2YgdGhlIHdob2xlIGJveCB1c2luZyB0aGUgbmV3bHkgaW1wbGVtZW50ZWQgY3NzIGNsYXNzZXMgPGNvZGU+cnNzYm94LXRpdGxlPC9jb2RlPiwgPGNvZGU+cnNzYm94LWNvbnRlbnQ8L2NvZGU+LCA8Y29kZT5yc3Nib3gtaXRlbS10aXRsZTwvY29kZT4gYW5kIDxjb2RlPnJzc2JveC10dGVtLWNvbnRlbnQ8L2NvZGU+IChpZGVhIGJ5ICYjMTE0OyYjMTAwOyYjOTc7JiMxMTg7JiMxMDU7JiMxMDE7JiMxMTU7JiM2NDsmIzExMTsmIzExNDsmIzEwNTsmIzEwMTsmIzExMDsmIzExNjsmIzExMjsmIzk3OyYjOTk7JiMxMDU7JiMxMDI7JiMxMDU7JiM5OTsmIzQ2OyYjOTk7JiMxMTE7JiMxMDk7KS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTI0PC9zbWFsbD5cbiAgICBBZGRlZCBhIGZvcm0gaW5wdXQgZm9yIGxpbWl0aW5nIHRoZSBpdGVtIGRpc3BsYXkuIFRoZSBudW1iZXIgZGV0ZXJtaW5lcyBob3cgbWFueSBpdGVtcyB3aWxsIGJlIHNob3duIGluIHRoZSBib3ggKHNldmVuIGlzIHRoZSBkZWZhdWx0IHZhbHVlKS4gR29vZCBmb3Igb2Z0ZW4gdXBkYXRlZCBjaGFubmVscy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTE1PC9zbWFsbD5cbiAgICBEZXRlY3RlZCBhIHN0cmFuZ2UgYnVnIHRoYXQgcHJldmVudGVkIHRoZSB2aWV3ZXIgYXQgPGEgaHJlZj0naHR0cDovL3B1Ymxpc2guY3VycnkuY29tL3Jzcy8nPmN1cnJ5LmNvbTwvYT4gbG9hZGluZyBodHRwOi8vcDNrLm9yZy9yc3MueG1sIHdoaWxlIGh0dHA6Ly93d3cucDNrLm9yZy9yc3MueG1sIHdhcyBubyBwcm9ibGVtIGF0IGFsbC4gVXBncmFkaW5nIHRoZSBSZWJvbCBpbnN0YWxsYXRpb24gdG8gdGhlIGN1cnJlbnQgdmVyc2lvbiBzb2x2ZWQgdGhlcHJvYmxlbSwgaG93ZXZlciB0aGUgY2F1c2UgcmVtYWlucyB1bmNsZWFy4oCmXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wOC0wODwvc21hbGw+XG4gICAgRml4ZWQgYSBzbWFsbCBidWcgdGhhdCBjb3JydXB0ZWQgY2hhbm5lbCBVUkxzIGNvbnRhaW5pbmcgYSBxdWVyeSAoYXMgcmVwb3J0ZWQgYnkgJiMxMDc7JiMxMDU7JiMxMDc7JiM5NzsmIzY0OyYjMTE1OyYjMTA4OyYjMTExOyYjMTA4OyYjMTAxOyYjMTA0OyYjMTE2OyYjNDY7JiMxMDE7JiMxMDE7KS4gQ29uZmlndXJlZCBzZXJ2ZXIgcmVkaXJlY3QgZnJvbSA8ZGVsPmh0dHA6Ly9waWVma2UuaGVsbWEuYXQvcnNzPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMDU8L3NtYWxsPlxuICAgIFRoYW5rcyB0byA8YSBocmVmPSdodHRwOi8vd3d3LmN1cnJ5LmNvbS8yMDAxLzA3LzMxI2Nvb2xSc3NTZXJ2aWNlJz5BZGFtIEN1cnJ5PC9hPiwgdGhlIHZpZXdlciBpcyBub3cgbWlycm9yZWQgYXQgPGRlbD5odHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzPC9kZWw+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDctMzA8L3NtYWxsPlxuICAgIEFkZGVkIGxpbmsgdG8gc291cmNlIGNvZGU7IGFkZGVkIGV4YW1wbGUgbGlua3MgZm9yIGFsbCBzdXBwb3J0ZWQgZm9ybWF0cy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA1LTMwPC9zbWFsbD5cbiAgICBGaXhlZCBhIGxpdHRsZSBidWcgcmVwb3J0ZWQgYnkgJiMxMDI7JiMxMTQ7JiMxMDE7JiMxMDA7JiMxMDU7JiM2NDsmIzEwMTsmIzEwOTsmIzk3OyYjMTA1OyYjMTA4OyYjNDY7JiMxMDE7JiMxMDE7IHRoYXQgY2F1c2VkIGRpYWNyaXRpYyBjaGFyYWN0ZXJzIHRvIGJlIGRpc3BsYXllZCBhcyBlbnRpdHkgY29kZXMuXG4gIDwvcD5cbjwvZGV0YWlscz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxFQUFFLGVBQUMsQ0FBQyxBQUNGLE9BQU8sQ0FBRSxZQUFZLEFBQ3ZCLENBQUMsQUFFRCxFQUFFLENBQUcsZ0JBQUMsQ0FBRSxPQUFPLENBQUcsZUFBRSxDQUFDLEFBQ25CLFVBQVUsQ0FBRSxDQUFDLEFBQ2YsQ0FBQyxBQUVELE9BQU8sZUFBQyxDQUFDLEFBQ1AsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsRUFBRSxDQUFHLEVBQUUsZUFBQyxDQUFDLEFBQ1AsVUFBVSxDQUFFLEtBQUssQUFDbkIsQ0FBQyxBQUVELEtBQUssZUFBQyxDQUFDLEFBQ0wsT0FBTyxDQUFFLFlBQVksQ0FDckIsWUFBWSxDQUFFLEtBQUssQ0FDbkIsS0FBSyxDQUFFLElBQUksQUFDYixDQUFDLEFBRUQsSUFBSSxlQUFDLENBQUMsQUFDSixnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUFHLEFBQ2xCLENBQUMifQ== */";
    	append_dev(document.head, style);
    }

    function create_fragment(ctx) {
    	let details;
    	let summary;
    	let h3;
    	let t1;
    	let p0;
    	let small0;
    	let t3;
    	let t4;
    	let ul0;
    	let li0;
    	let t6;
    	let li1;
    	let t8;
    	let li2;
    	let t10;
    	let li3;
    	let t12;
    	let li4;
    	let t13;
    	let a0;
    	let t15;
    	let t16;
    	let p1;
    	let small1;
    	let t18;
    	let em1;
    	let t19;
    	let em0;
    	let t20;
    	let p2;
    	let small2;
    	let t22;
    	let t23;
    	let ul1;
    	let li5;
    	let t25;
    	let li6;
    	let t27;
    	let li7;
    	let t29;
    	let li8;
    	let t31;
    	let li9;
    	let t33;
    	let li10;
    	let t35;
    	let li11;
    	let t37;
    	let li12;
    	let t39;
    	let li13;
    	let t40;
    	let a1;
    	let t42;
    	let a2;
    	let t44;
    	let li14;
    	let t46;
    	let li15;
    	let t48;
    	let li16;
    	let t49;
    	let a3;
    	let t51;
    	let li17;
    	let t53;
    	let li18;
    	let t55;
    	let p3;
    	let small3;
    	let t57;
    	let a4;
    	let t59;
    	let t60;
    	let p4;
    	let small4;
    	let t62;
    	let i0;
    	let t64;
    	let p5;
    	let small5;
    	let t66;
    	let t67;
    	let ul2;
    	let li19;
    	let t68;
    	let a5;
    	let t70;
    	let t71;
    	let li20;
    	let t72;
    	let a6;
    	let t74;
    	let t75;
    	let p6;
    	let small6;
    	let t77;
    	let t78;
    	let ul3;
    	let li21;
    	let t79;
    	let code0;
    	let t81;
    	let t82;
    	let li22;
    	let t84;
    	let p7;
    	let small7;
    	let t86;
    	let code1;
    	let t88;
    	let code2;
    	let t90;
    	let code3;
    	let t92;
    	let code4;
    	let t94;
    	let code5;
    	let t96;
    	let t97;
    	let p8;
    	let small8;
    	let t99;
    	let ul4;
    	let li23;
    	let t100;
    	let code6;
    	let t102;
    	let t103;
    	let li24;
    	let t104;
    	let code7;
    	let t106;
    	let code8;
    	let t108;
    	let t109;
    	let p9;
    	let small9;
    	let t111;
    	let ul5;
    	let li25;
    	let t113;
    	let li26;
    	let t115;
    	let p10;
    	let small10;
    	let t117;
    	let t118;
    	let ul6;
    	let li27;
    	let t119;
    	let code9;
    	let t121;
    	let t122;
    	let li28;
    	let t124;
    	let li29;
    	let t126;
    	let p11;
    	let small11;
    	let t128;
    	let i1;
    	let t130;
    	let p12;
    	let t131;
    	let i2;
    	let t133;
    	let t134;
    	let p13;
    	let t136;
    	let p14;
    	let small12;
    	let t138;
    	let t139;
    	let p15;
    	let small13;
    	let t141;
    	let ul7;
    	let li30;
    	let t142;
    	let code10;
    	let t144;
    	let t145;
    	let li31;
    	let t147;
    	let li32;
    	let t148;
    	let a7;
    	let t150;
    	let t151;
    	let p16;
    	let small14;
    	let t153;
    	let t154;
    	let ul8;
    	let li33;
    	let t156;
    	let li34;
    	let t158;
    	let li35;
    	let t159;
    	let i3;
    	let t160;
    	let code11;
    	let a8;
    	let t162;
    	let t163;
    	let li36;
    	let t164;
    	let a9;
    	let t166;
    	let t167;
    	let li37;
    	let t169;
    	let li38;
    	let t170;
    	let i4;
    	let t172;
    	let li39;
    	let t174;
    	let li40;
    	let t176;
    	let p17;
    	let small15;
    	let t178;
    	let t179;
    	let p18;
    	let small16;
    	let t181;
    	let t182;
    	let ul9;
    	let li41;
    	let t184;
    	let li42;
    	let t186;
    	let li43;
    	let t188;
    	let p19;
    	let small17;
    	let t190;
    	let t191;
    	let ul10;
    	let li44;
    	let t193;
    	let li45;
    	let t195;
    	let li46;
    	let t197;
    	let p20;
    	let small18;
    	let t199;
    	let t200;
    	let p21;
    	let small19;
    	let t202;
    	let t203;
    	let p22;
    	let small20;
    	let t205;
    	let i5;
    	let t207;
    	let t208;
    	let ol;
    	let li47;
    	let a10;
    	let t210;
    	let t211;
    	let li48;
    	let a11;
    	let t213;
    	let t214;
    	let p23;
    	let i6;
    	let t216;
    	let p24;
    	let small21;
    	let t218;
    	let t219;
    	let p25;
    	let small22;
    	let t221;
    	let a12;
    	let t223;
    	let t224;
    	let p26;
    	let small23;
    	let t226;
    	let a13;
    	let t228;
    	let t229;
    	let p27;
    	let small24;
    	let t231;
    	let t232;
    	let p28;
    	let small25;
    	let t234;
    	let a14;
    	let t236;
    	let t237;
    	let p29;
    	let small26;
    	let t239;
    	let t240;
    	let p30;
    	let small27;
    	let t242;
    	let code12;
    	let t247;
    	let t248;
    	let p31;
    	let small28;
    	let t250;
    	let t251;
    	let p32;
    	let small29;
    	let t253;
    	let t254;
    	let p33;
    	let small30;
    	let t256;
    	let t257;
    	let p34;
    	let small31;
    	let t259;
    	let a15;
    	let t261;
    	let a16;
    	let t263;
    	let t264;
    	let p35;
    	let small32;
    	let t266;
    	let a17;
    	let t268;
    	let t269;
    	let p36;
    	let small33;
    	let t271;
    	let i7;
    	let t273;
    	let del0;
    	let t275;
    	let a18;
    	let t277;
    	let t278;
    	let p37;
    	let small34;
    	let t280;
    	let del1;
    	let t282;
    	let t283;
    	let p38;
    	let small35;
    	let t285;
    	let del2;
    	let t287;
    	let t288;
    	let p39;
    	let small36;
    	let t290;
    	let a19;
    	let t292;
    	let i8;
    	let t294;
    	let p40;
    	let small37;
    	let t296;
    	let a20;
    	let t298;
    	let t299;
    	let p41;
    	let small38;
    	let t301;
    	let t302;
    	let p42;
    	let small39;
    	let t304;
    	let code13;
    	let t306;
    	let t307;
    	let p43;
    	let small40;
    	let t309;
    	let t310;
    	let p44;
    	let small41;
    	let t312;
    	let code14;
    	let t314;
    	let code15;
    	let t316;
    	let code16;
    	let t318;
    	let code17;
    	let t320;
    	let t321;
    	let p45;
    	let small42;
    	let t323;
    	let t324;
    	let p46;
    	let small43;
    	let t326;
    	let a21;
    	let t328;
    	let t329;
    	let p47;
    	let small44;
    	let t331;
    	let del3;
    	let t333;
    	let t334;
    	let p48;
    	let small45;
    	let t336;
    	let a22;
    	let t338;
    	let del4;
    	let t340;
    	let t341;
    	let p49;
    	let small46;
    	let t343;
    	let t344;
    	let p50;
    	let small47;
    	let t346;

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			h3 = element("h3");
    			h3.textContent = "Change Log";
    			t1 = space();
    			p0 = element("p");
    			small0 = element("small");
    			small0.textContent = "2020-01-06";
    			t3 = text("\n    Not sure how it really happened but I got pretty much immersed into working on this project during the holiday season… So now we got:");
    			t4 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Better caching support for feeds and referrers";
    			t6 = space();
    			li1 = element("li");
    			li1.textContent = "RSS icon next to referrer directly linking its feed URL (if available) to this app";
    			t8 = space();
    			li2 = element("li");
    			li2.textContent = "Upgrade to Svelte 3 (which was rather tedious) 😰";
    			t10 = space();
    			li3 = element("li");
    			li3.textContent = "Re-established support for older browsers (looking at you, Internet Explorer 11) 👴";
    			t12 = space();
    			li4 = element("li");
    			t13 = text("Multiple small fixes and improvements, take a look at the ");
    			a0 = element("a");
    			a0.textContent = "commit log";
    			t15 = text(" for details");
    			t16 = space();
    			p1 = element("p");
    			small1 = element("small");
    			small1.textContent = "2019-12-15";
    			t18 = text("\n    Upgraded the JSONP proxy to Python 3.7 and slightly retouched the configuration form. A merry ending for 2019 and a happy new year 🎉 ");
    			em1 = element("em");
    			t19 = text("It’s hindsight!");
    			em0 = element("em");
    			t20 = space();
    			p2 = element("p");
    			small2 = element("small");
    			small2.textContent = "2018-01-19";
    			t22 = text("\n    More than 15 years (and still counting…) after its inception this little service is still live and kicking! The best part of this hobby project’s long-running trait: this year brings a complete rewrite and overhaul with an extensive list of updates – and only small changes in functionality:");
    			t23 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			li5.textContent = "Added basic support for Atom 1.0 feeds 🔥";
    			t25 = space();
    			li6 = element("li");
    			li6.textContent = "Added support for multiple enclosures (RSS 0.93)";
    			t27 = space();
    			li7 = element("li");
    			li7.textContent = "Replaced value of -1 for automatic content height with “empty” value";
    			t29 = space();
    			li8 = element("li");
    			li8.textContent = "Added support for “empty” value to box width (now called ”max. width”)";
    			t31 = space();
    			li9 = element("li");
    			li9.textContent = "Reduced total size of embedded download by more than 60% ⚡";
    			t33 = space();
    			li10 = element("li");
    			li10.textContent = "Increased performance of loading and rendering boxes";
    			t35 = space();
    			li11 = element("li");
    			li11.textContent = "Implemented responsive CSS for both, boxes and configuration app";
    			t37 = space();
    			li12 = element("li");
    			li12.textContent = "Replaced bitmap icons with scalable vector graphics";
    			t39 = space();
    			li13 = element("li");
    			t40 = text("Completely rewrote the app code using ");
    			a1 = element("a");
    			a1.textContent = "Svelte";
    			t42 = text(" and ");
    			a2 = element("a");
    			a2.textContent = "min.css";
    			t44 = space();
    			li14 = element("li");
    			li14.textContent = "Replaced remaining jQuery code with vanilla JavaScript";
    			t46 = space();
    			li15 = element("li");
    			li15.textContent = "Migrated build scripts to Rollup and Yarn";
    			t48 = space();
    			li16 = element("li");
    			t49 = text("Added support for missing browser features via ");
    			a3 = element("a");
    			a3.textContent = "polyfills.io";
    			t51 = space();
    			li17 = element("li");
    			li17.textContent = "Discontinued support for older browsers (MSIE < 11)";
    			t53 = space();
    			li18 = element("li");
    			li18.textContent = "Bumped major version to 18 (aka the year), getting rid of semantic versioning due to lack of semantics 🐱";
    			t55 = space();
    			p3 = element("p");
    			small3 = element("small");
    			small3.textContent = "2016-03-12";
    			t57 = text("\n    Completely rewrote build environment using WebPack. Switched the ");
    			a4 = element("a");
    			a4.textContent = "source repository";
    			t59 = text(" from SVN to Git, hosted at Github. This deserves a new major version number!");
    			t60 = space();
    			p4 = element("p");
    			small4 = element("small");
    			small4.textContent = "2012-12-30";
    			t62 = text("\n    Added simple code to modify the width attribute of iframe, object and embed elements to make them fit in the box. Also: bumped version. ");
    			i0 = element("i");
    			i0.textContent = "A happy new year 2013, everbody!";
    			t64 = space();
    			p5 = element("p");
    			small5 = element("small");
    			small5.textContent = "2012-10-26";
    			t66 = text("\n    Added section about Creative Commons License, below. In other words: you can now legally run my code on your own server. (You even could remove the tiny reference to this page in the footer of the box.) However, I would like to ask you for two things if you want to do so:");
    			t67 = space();
    			ul2 = element("ul");
    			li19 = element("li");
    			t68 = text("Use your own ");
    			a5 = element("a");
    			a5.textContent = "JSONP proxy";
    			t70 = text(" – especially, when you expect a high load on your server.");
    			t71 = space();
    			li20 = element("li");
    			t72 = text("Please support the service with a ");
    			a6 = element("a");
    			a6.textContent = "donation";
    			t74 = text(".");
    			t75 = space();
    			p6 = element("p");
    			small6 = element("small");
    			small6.textContent = "2012-08-01";
    			t77 = text("\n    Added two new, experimental features – and thus, increased version to 3.3:");
    			t78 = space();
    			ul3 = element("ul");
    			li21 = element("li");
    			t79 = text("The height of the inner box content can now be defined by a pixel value. If the height is less than the space needed by the desired amount of items you can vertically scroll the content. A value of ");
    			code0 = element("code");
    			code0.textContent = "-1";
    			t81 = text(" enables the default behavior and automatically sets the height according to the displaying items.");
    			t82 = space();
    			li22 = element("li");
    			li22.textContent = "The so-called “headless” mode removes the titlebar and the frame from the box. This way the box can be used more flexibly in special situations. However, this feature somehow undermines an RSS feed’s authority so I count on your fairness to give credit where credit is due!";
    			t84 = space();
    			p7 = element("p");
    			small7 = element("small");
    			small7.textContent = "2012-07-16";
    			t86 = text("\n    Slightly modified output of the HTML code to be usable with both, unsecured and secured (HTTPS) web servers. You can update already embedded code easily by removing the ");
    			code1 = element("code");
    			code1.textContent = "http:";
    			t88 = text(" part from the ");
    			code2 = element("code");
    			code2.textContent = "src";
    			t90 = text(" attribute of the ");
    			code3 = element("code");
    			code3.textContent = "<script>";
    			t92 = text(" element: ");
    			code4 = element("code");
    			code4.textContent = "<script src='http://p3k.org/rss…'>";
    			t94 = text(" becomes ");
    			code5 = element("code");
    			code5.textContent = "<script src='//p3k.org/rss…'>";
    			t96 = text(".");
    			t97 = space();
    			p8 = element("p");
    			small8 = element("small");
    			small8.textContent = "2012-07-13";
    			t99 = space();
    			ul4 = element("ul");
    			li23 = element("li");
    			t100 = text("Fixed IE bug (“innerHTML is null or not an object”) caused by using jQuery’s html() method instead of text() when parsing a ");
    			code6 = element("code");
    			code6.textContent = "<content:encoded>";
    			t102 = text(" element.");
    			t103 = space();
    			li24 = element("li");
    			t104 = text("Changed priority of elements: only check for ");
    			code7 = element("code");
    			code7.textContent = "<content:encoded>";
    			t106 = text(" if     ");
    			code8 = element("code");
    			code8.textContent = "<description>";
    			t108 = text(" is not available.");
    			t109 = space();
    			p9 = element("p");
    			small9 = element("small");
    			small9.textContent = "2012-06-04";
    			t111 = space();
    			ul5 = element("ul");
    			li25 = element("li");
    			li25.textContent = "Implemented small routine to resize images contained in the feed content to fit in the box.";
    			t113 = space();
    			li26 = element("li");
    			li26.textContent = "Added support for new HTML5 form input types and their validation.";
    			t115 = space();
    			p10 = element("p");
    			small10 = element("small");
    			small10.textContent = "2012-05-31";
    			t117 = text("\n    Gone βeta! – with three tiny additons:");
    			t118 = space();
    			ul6 = element("ul");
    			li27 = element("li");
    			t119 = text("Added ");
    			code9 = element("code");
    			code9.textContent = "<noscript>";
    			t121 = text(" element for browsers providing no JavaScript engine.");
    			t122 = space();
    			li28 = element("li");
    			li28.textContent = "Added option to call the configurator with a URL in the query string.";
    			t124 = space();
    			li29 = element("li");
    			li29.textContent = "Added a link to the W3C feed validator to the contents of a box displaying an RSS error.";
    			t126 = space();
    			p11 = element("p");
    			small11 = element("small");
    			small11.textContent = "2012-05-19";
    			t128 = text("\n    Apologies for the RSS Boxes not showing up on your pages during the last few days. I made a stupid mistake that caused only the setup page to render correctly – and I did not check any embedded script. ");
    			i1 = element("i");
    			i1.textContent = "Bummer!";
    			t130 = space();
    			p12 = element("p");
    			t131 = text("At least now everything should be back to normal. (I hope this incident did not sabotage the Flattr button I added in the meantime… ");
    			i2 = element("i");
    			i2.textContent = "wink, wink!";
    			t133 = text(")");
    			t134 = space();
    			p13 = element("p");
    			p13.textContent = "Anyway, thanks for your understanding.";
    			t136 = space();
    			p14 = element("p");
    			small12 = element("small");
    			small12.textContent = "2012-05-16";
    			t138 = text("\n    I think I did not mention, yet, that the current incarnation of the code is totally disconnected from the version as of 2009. Each is using their own codebase, the legacy code was not modified at all and thus, it is not affected by any recent changes. You can check which version you are using by looking at the script URL. If it contains the string “proxy.r” you get the “classic” RSS Box rendering. The modernized version calls “index.js”. Nevertheless, you cannot setup boxes with the old URL anymore.");
    			t139 = space();
    			p15 = element("p");
    			small13 = element("small");
    			small13.textContent = "2012-05-09";
    			t141 = space();
    			ul7 = element("ul");
    			li30 = element("li");
    			t142 = text("Added support for ");
    			code10 = element("code");
    			code10.textContent = "<content:encoded>";
    			t144 = text(" element.");
    			t145 = space();
    			li31 = element("li");
    			li31.textContent = "Implemented Memcache usage in AppEngine code.";
    			t147 = space();
    			li32 = element("li");
    			t148 = text("Beautified this page by using the ");
    			a7 = element("a");
    			a7.textContent = "Google’s Droid Serif font";
    			t150 = text(".");
    			t151 = space();
    			p16 = element("p");
    			small14 = element("small");
    			small14.textContent = "2012-04-26";
    			t153 = text("\n    Amazing! A new version! After more than two years hiatus I completely rewrote the codebase and framework:");
    			t154 = space();
    			ul8 = element("ul");
    			li33 = element("li");
    			li33.textContent = "Removed dependency to Rebol using a small JSONP proxy at Google’s AppEngine.";
    			t156 = space();
    			li34 = element("li");
    			li34.textContent = "Rewrote XML parsing, replacing native methods with jQuery ones.";
    			t158 = space();
    			li35 = element("li");
    			t159 = text("Cleaned up HTML output for the RSS Box, replacing tables with divs. ");
    			i3 = element("i");
    			t160 = text("Note: You might need to add ");
    			code11 = element("code");
    			a8 = element("a");
    			a8.textContent = "!important";
    			t162 = text(" to your custom RSS Box stylesheet definitions.");
    			t163 = space();
    			li36 = element("li");
    			t164 = text("Replaced fugly colorpicker in configurator with the ");
    			a9 = element("a");
    			a9.textContent = "MiniColors jQuery plugin";
    			t166 = text(".");
    			t167 = space();
    			li37 = element("li");
    			li37.textContent = "Added link color setting and style attributes for correctly applying color settings.";
    			t169 = space();
    			li38 = element("li");
    			t170 = text("Added corner radius setting. ");
    			i4 = element("i");
    			i4.textContent = "Note: does not work in IE8 and earlier versions.";
    			t172 = space();
    			li39 = element("li");
    			li39.textContent = "Added font size to the font face setting.";
    			t174 = space();
    			li40 = element("li");
    			li40.textContent = "Removed align setting from configurator (still works in script tags generated with earlier versions).";
    			t176 = space();
    			p17 = element("p");
    			small15 = element("small");
    			small15.textContent = "2009-12-13";
    			t178 = text("\n    Switched output of this page to HTML5 and made some adaptations in the HTML code and CSS stylesheet. Updated version string to 2.1, finally!");
    			t179 = space();
    			p18 = element("p");
    			small16 = element("small");
    			small16.textContent = "2009-09-28";
    			t181 = text("\n    Some minor changes after a while:");
    			t182 = space();
    			ul9 = element("ul");
    			li41 = element("li");
    			li41.textContent = "Refactored date parsing to show actual build dates more reliably";
    			t184 = space();
    			li42 = element("li");
    			li42.textContent = "Refactored caching routine (only in online version)";
    			t186 = space();
    			li43 = element("li");
    			li43.textContent = "Updated version string to 2.1b, approaching another final version.";
    			t188 = space();
    			p19 = element("p");
    			small17 = element("small");
    			small17.textContent = "2008-02-19";
    			t190 = text("\n    Seems there were some changes in the air as I did not plan another update but here comes version 2.1 bringing to you:");
    			t191 = space();
    			ul10 = element("ul");
    			li44 = element("li");
    			li44.textContent = "Full client-side processing (only the raw feed data is fetched from the server).";
    			t193 = space();
    			li45 = element("li");
    			li45.textContent = "User-friendlier interface with color pickers, status and error display as well as instant feedback on any change in setup.";
    			t195 = space();
    			li46 = element("li");
    			li46.textContent = "And finally (drumroll!) Unicode support at least at this installation of the viewer. (Ie. the downloaded version still will output ASCII only.)";
    			t197 = space();
    			p20 = element("p");
    			small18 = element("small");
    			small18.textContent = "2008-02-03";
    			t199 = text("\n    Made some more improvements especially regarding the error handling and output. From now on it should be much clearer what’s wrong with a very RSS Box. Since there’s now a lot more of client-side JavaScript code involved I tested the script in four major browsers that are available to me: Internet Explorer 7, Firefox 2.0, Opera 9.25 and Safari 3.");
    			t200 = space();
    			p21 = element("p");
    			small19 = element("small");
    			small19.textContent = "2008-02-01";
    			t202 = text("\n    Completely revised server- and client-side code. XML rendering is now done in the browser which speeds up things and decreases the load on the server. Furthermore, the list of referrers is now loaded on demand via AJAX and thus not rendered with every request. Finally, I retouched the setup form interface and cleaned up both HTML and CSS.");
    			t203 = space();
    			p22 = element("p");
    			small20 = element("small");
    			small20.textContent = "2006-12-20";
    			t205 = text("\n    I am very glad that my old little script is gaining even more attention after all these years…    ");
    			i5 = element("i");
    			i5.textContent = "Thank you very much indeed!";
    			t207 = text(" Since there are coming in more and more of the same requests and I am really not able to handle them (apologies!), here is some advice for everyone:");
    			t208 = space();
    			ol = element("ol");
    			li47 = element("li");
    			a10 = element("a");
    			a10.textContent = "Use cascading style sheets";
    			t210 = text(" (CSS) to change font sizes (and to generally define your layout).");
    			t211 = space();
    			li48 = element("li");
    			a11 = element("a");
    			a11.textContent = "Beware of opening links in a new window.";
    			t213 = text(" It’s offensive to your readers.");
    			t214 = space();
    			p23 = element("p");
    			i6 = element("i");
    			i6.textContent = "A happy end for 2006!";
    			t216 = space();
    			p24 = element("p");
    			small21 = element("small");
    			small21.textContent = "2006-06-13";
    			t218 = text("\n    Did some minor bug fixing again (amongst others replacing single quotes with ' and not \" entities). Furthermore (and finally), I removed the “RC” (as in “Release Candidate”) from the document title…");
    			t219 = space();
    			p25 = element("p");
    			small22 = element("small");
    			small22.textContent = "2006-06-12";
    			t221 = text("\n    Gary informed me that longer feed URLs cause trouble and the feed box will not be displayed. That’s in fact a bug, but unfortunately one that cannot be fixed so easily. My suggestion is to shorten such URLs at one of the websites around that provide such a service, e.g. ");
    			a12 = element("a");
    			a12.textContent = "tinyurl.com";
    			t223 = text(".");
    			t224 = space();
    			p26 = element("p");
    			small23 = element("small");
    			small23.textContent = "2006-04-23";
    			t226 = text("\n    Switched the ");
    			a13 = element("a");
    			a13.textContent = "source repository";
    			t228 = text(" from CVS to Subversion (SVN).");
    			t229 = space();
    			p27 = element("p");
    			small24 = element("small");
    			small24.textContent = "2006-04-20";
    			t231 = text("\n    Andrew Pam brought up a serious issue that probably might have affected some more people already: the viewer does not support UTF-8 (or Unicode, resp.) Unfortunately, this is “built-in” into the underlying scripting language (aka Rebol). I’m sorry to cancel those tickets… :(");
    			t232 = space();
    			p28 = element("p");
    			small25 = element("small");
    			small25.textContent = "2006-04-13";
    			t234 = text("\n    Fixed a bug reported by Mando Gomez that caused feeds using the <guid> element being displayed without item links… Don’t forget to check out Mando’s excellent website ");
    			a14 = element("a");
    			a14.textContent = "mandolux";
    			t236 = text("!");
    			t237 = space();
    			p29 = element("p");
    			small26 = element("small");
    			small26.textContent = "2006-04-12";
    			t239 = text("\n    Obviously Sam Ruby changed his feed format from scriptingNews to Atom; which renders my example link above pretty useless… So far I don’t know about any other scriptingNews feed, do you?");
    			t240 = space();
    			p30 = element("p");
    			small27 = element("small");
    			small27.textContent = "2006-02-20";
    			t242 = text("\n    I hope nobody minds the little line I added at the bottom of each RSS box… Of course, it’s not totally altruistic, but probably some people will find it informative. However, if you want to prevent it from being displayed simply add ");
    			code12 = element("code");
    			code12.textContent = `.rssbox-promo ${"{"}display: none;${"}"}`;
    			t247 = text(" to your stylesheet.");
    			t248 = space();
    			p31 = element("p");
    			small28 = element("small");
    			small28.textContent = "2006-01-11";
    			t250 = text("\n    New server, new troubles: I moved the viewer to a newly setup Ubuntu machine. Of course, I forgot to set some permission flags and owners, thus, preventing the script from working. However, I think everything is fixed and working again.");
    			t251 = space();
    			p32 = element("p");
    			small29 = element("small");
    			small29.textContent = "2005-11-16";
    			t253 = text("\n    Just testing Google’s AdSense for a while. Since this page generates most of my traffic I wanted to see myself what a banner can do here. Hope you don’t mind.");
    			t254 = space();
    			p33 = element("p");
    			small30 = element("small");
    			small30.textContent = "2004-12-16";
    			t256 = text("\n    Bugfix: Sometimes the logfile which is used to generate the list of sites using this script gets corrupted. This affected the whole setup page to return an error and thus, it needed to be caught. (You will see a “currently out of order” message then.)");
    			t257 = space();
    			p34 = element("p");
    			small31 = element("small");
    			small31.textContent = "2004-04-26";
    			t259 = text("\n    Last efforts to officially release the ");
    			a15 = element("a");
    			a15.textContent = "code";
    			t261 = text(" to the open source community. There have been some bugs in the (image) rendering framework which I fixed so    far. I now include a dynamically rendered list of sites using (or pointing to) this script to give some examples for the curious at heart (me included). Finally, there’s a ");
    			a16 = element("a");
    			a16.textContent = "README";
    			t263 = text(" file with a short installation guide to make the script run on your own server.");
    			t264 = space();
    			p35 = element("p");
    			small32 = element("small");
    			small32.textContent = "2004-01-28";
    			t266 = text("\n    When something goes wrong (most of the time this might be a wrong URL, ie. a 404 as result) an    ");
    			a17 = element("a");
    			a17.textContent = "“error” box";
    			t268 = text(" will be displayed to signal the failure. Increased version up to 1.0 and labeled it as release candidate\n    (RC).");
    			t269 = space();
    			p36 = element("p");
    			small33 = element("small");
    			small33.textContent = "2004-01-26";
    			t271 = text("\n    Retouched the code in a very last effort to make the script running stand-alone (with Rebol but    ");
    			i7 = element("i");
    			i7.textContent = "without";
    			t273 = text(" PHP, that is). Everything needed is now in ");
    			del0 = element("del");
    			del0.textContent = "CVS";
    			t275 = text(" SVN so everybody can download from there. Potentially, a few minor bug fixes might follow short-term. Uh, and the HTML code is ");
    			a18 = element("a");
    			a18.textContent = "valid XHTML 1.0";
    			t277 = text(" now.");
    			t278 = space();
    			p37 = element("p");
    			small34 = element("small");
    			small34.textContent = "2003-12-12";
    			t280 = text("\n    The mirror at ");
    			del1 = element("del");
    			del1.textContent = "http://publish.curry.com/rss/";
    			t282 = text(" is not working for quite a long time. I tried to contact Adam Curry but so far without success.");
    			t283 = space();
    			p38 = element("p");
    			small35 = element("small");
    			small35.textContent = "2003-03-30";
    			t285 = text("\n    Moved to new server with new domain ");
    			del2 = element("del");
    			del2.textContent = "forever.p3k.org";
    			t287 = text(".");
    			t288 = space();
    			p39 = element("p");
    			small36 = element("small");
    			small36.textContent = "2003-03-25";
    			t290 = text("\n    Updated Rebol to ");
    			a19 = element("a");
    			a19.textContent = "version 2.5.5";
    			t292 = text(". End of Rebol’s “DNS zombies” in the process list.\n    ");
    			i8 = element("i");
    			i8.textContent = "Finally.";
    			t294 = space();
    			p40 = element("p");
    			small37 = element("small");
    			small37.textContent = "2002-02-19";
    			t296 = text("\n    Added a very nice quote from ");
    			a20 = element("a");
    			a20.textContent = "Abbe Normal";
    			t298 = text(" on top right of this document.");
    			t299 = space();
    			p41 = element("p");
    			small38 = element("small");
    			small38.textContent = "2001-11-17";
    			t301 = text("\n    If you want a more compact view of the RSS box you can get it now using the corresponding checkbox. If it is enabled the descriptions of each item will not be displayed – given that the item title is defined (otherwise there would not be much to see). Additionally, the channel image (if defined) will not be displayed. Thanks jsyeo@compuserve.com for the suggestions!");
    			t302 = space();
    			p42 = element("p");
    			small39 = element("small");
    			small39.textContent = "2001-09-21";
    			t304 = text("\n    Since today the ");
    			code13 = element("code");
    			code13.textContent = "textinput";
    			t306 = text(" tag is supported. It creates an appropriate form at the end of the box. Moreover, two bugs were fixed: one caused unnecessary information in the query string of the generated JavaScript tag. The other affected the display of the date’s time zone. Time zones now are generally displayed in GMT except where another time zone acronym is defined.");
    			t307 = space();
    			p43 = element("p");
    			small40 = element("small");
    			small40.textContent = "2001-09-04";
    			t309 = text("\n    Added icons for enclosure and source; added XML button checkbox to enable output of the quasi-standard orange button linking to the XML source (ideaby adam@curry.com).");
    			t310 = space();
    			p44 = element("p");
    			small41 = element("small");
    			small41.textContent = "2001-09-03";
    			t312 = text("\n    It’s now possible to refine the style of the whole box using the newly implemented css classes ");
    			code14 = element("code");
    			code14.textContent = "rssbox-title";
    			t314 = text(", ");
    			code15 = element("code");
    			code15.textContent = "rssbox-content";
    			t316 = text(", ");
    			code16 = element("code");
    			code16.textContent = "rssbox-item-title";
    			t318 = text(" and ");
    			code17 = element("code");
    			code17.textContent = "rssbox-ttem-content";
    			t320 = text(" (idea by rdavies@orientpacific.com).");
    			t321 = space();
    			p45 = element("p");
    			small42 = element("small");
    			small42.textContent = "2001-08-24";
    			t323 = text("\n    Added a form input for limiting the item display. The number determines how many items will be shown in the box (seven is the default value). Good for often updated channels.");
    			t324 = space();
    			p46 = element("p");
    			small43 = element("small");
    			small43.textContent = "2001-08-15";
    			t326 = text("\n    Detected a strange bug that prevented the viewer at ");
    			a21 = element("a");
    			a21.textContent = "curry.com";
    			t328 = text(" loading http://p3k.org/rss.xml while http://www.p3k.org/rss.xml was no problem at all. Upgrading the Rebol installation to the current version solved theproblem, however the cause remains unclear…");
    			t329 = space();
    			p47 = element("p");
    			small44 = element("small");
    			small44.textContent = "2001-08-08";
    			t331 = text("\n    Fixed a small bug that corrupted channel URLs containing a query (as reported by kika@sloleht.ee). Configured server redirect from ");
    			del3 = element("del");
    			del3.textContent = "http://piefke.helma.at/rss";
    			t333 = text(".");
    			t334 = space();
    			p48 = element("p");
    			small45 = element("small");
    			small45.textContent = "2001-08-05";
    			t336 = text("\n    Thanks to ");
    			a22 = element("a");
    			a22.textContent = "Adam Curry";
    			t338 = text(", the viewer is now mirrored at ");
    			del4 = element("del");
    			del4.textContent = "http://publish.curry.com/rss";
    			t340 = text(".");
    			t341 = space();
    			p49 = element("p");
    			small46 = element("small");
    			small46.textContent = "2001-07-30";
    			t343 = text("\n    Added link to source code; added example links for all supported formats.");
    			t344 = space();
    			p50 = element("p");
    			small47 = element("small");
    			small47.textContent = "2001-05-30";
    			t346 = text("\n    Fixed a little bug reported by fredi@email.ee that caused diacritic characters to be displayed as entity codes.");
    			attr_dev(h3, "class", "svelte-1kws27u");
    			add_location(h3, file, 32, 4, 376);
    			attr_dev(summary, "class", "svelte-1kws27u");
    			add_location(summary, file, 31, 2, 362);
    			attr_dev(small0, "class", "svelte-1kws27u");
    			add_location(small0, file, 36, 4, 420);
    			attr_dev(p0, "class", "svelte-1kws27u");
    			add_location(p0, file, 35, 2, 412);
    			attr_dev(li0, "class", "svelte-1kws27u");
    			add_location(li0, file, 40, 4, 602);
    			attr_dev(li1, "class", "svelte-1kws27u");
    			add_location(li1, file, 41, 4, 662);
    			attr_dev(li2, "class", "svelte-1kws27u");
    			add_location(li2, file, 42, 4, 758);
    			attr_dev(li3, "class", "svelte-1kws27u");
    			add_location(li3, file, 43, 4, 821);
    			attr_dev(a0, "href", "https://github.com/p3k/rss-box/commits/master");
    			attr_dev(a0, "class", "svelte-1kws27u");
    			add_location(a0, file, 44, 66, 980);
    			attr_dev(li4, "class", "svelte-1kws27u");
    			add_location(li4, file, 44, 4, 918);
    			attr_dev(ul0, "class", "svelte-1kws27u");
    			add_location(ul0, file, 39, 2, 593);
    			attr_dev(small1, "class", "svelte-1kws27u");
    			add_location(small1, file, 48, 4, 1087);
    			attr_dev(em0, "class", "svelte-1kws27u");
    			add_location(em0, file, 49, 157, 1270);
    			attr_dev(em1, "class", "svelte-1kws27u");
    			add_location(em1, file, 49, 138, 1251);
    			attr_dev(p1, "class", "svelte-1kws27u");
    			add_location(p1, file, 47, 2, 1079);
    			attr_dev(small2, "class", "svelte-1kws27u");
    			add_location(small2, file, 53, 4, 1293);
    			attr_dev(p2, "class", "svelte-1kws27u");
    			add_location(p2, file, 52, 2, 1285);
    			attr_dev(li5, "class", "svelte-1kws27u");
    			add_location(li5, file, 57, 4, 1633);
    			attr_dev(li6, "class", "svelte-1kws27u");
    			add_location(li6, file, 58, 4, 1688);
    			attr_dev(li7, "class", "svelte-1kws27u");
    			add_location(li7, file, 59, 4, 1750);
    			attr_dev(li8, "class", "svelte-1kws27u");
    			add_location(li8, file, 60, 4, 1832);
    			attr_dev(li9, "class", "svelte-1kws27u");
    			add_location(li9, file, 61, 4, 1916);
    			attr_dev(li10, "class", "svelte-1kws27u");
    			add_location(li10, file, 62, 4, 1988);
    			attr_dev(li11, "class", "svelte-1kws27u");
    			add_location(li11, file, 63, 4, 2054);
    			attr_dev(li12, "class", "svelte-1kws27u");
    			add_location(li12, file, 64, 4, 2132);
    			attr_dev(a1, "href", "https://svelte.technology");
    			attr_dev(a1, "class", "svelte-1kws27u");
    			add_location(a1, file, 65, 46, 2239);
    			attr_dev(a2, "href", "https://mincss.com/");
    			attr_dev(a2, "class", "svelte-1kws27u");
    			add_location(a2, file, 65, 97, 2290);
    			attr_dev(li13, "class", "svelte-1kws27u");
    			add_location(li13, file, 65, 4, 2197);
    			attr_dev(li14, "class", "svelte-1kws27u");
    			add_location(li14, file, 66, 4, 2341);
    			attr_dev(li15, "class", "svelte-1kws27u");
    			add_location(li15, file, 67, 4, 2409);
    			attr_dev(a3, "href", "https://polyfills.io");
    			attr_dev(a3, "class", "svelte-1kws27u");
    			add_location(a3, file, 68, 55, 2515);
    			attr_dev(li16, "class", "svelte-1kws27u");
    			add_location(li16, file, 68, 4, 2464);
    			attr_dev(li17, "class", "svelte-1kws27u");
    			add_location(li17, file, 69, 4, 2572);
    			attr_dev(li18, "class", "svelte-1kws27u");
    			add_location(li18, file, 70, 4, 2640);
    			attr_dev(ul1, "class", "svelte-1kws27u");
    			add_location(ul1, file, 56, 2, 1624);
    			attr_dev(small3, "class", "svelte-1kws27u");
    			add_location(small3, file, 74, 4, 2774);
    			attr_dev(a4, "href", "https://github.com/p3k/rss-box");
    			attr_dev(a4, "class", "svelte-1kws27u");
    			add_location(a4, file, 75, 69, 2869);
    			attr_dev(p3, "class", "svelte-1kws27u");
    			add_location(p3, file, 73, 2, 2766);
    			attr_dev(small4, "class", "svelte-1kws27u");
    			add_location(small4, file, 79, 4, 3027);
    			attr_dev(i0, "class", "svelte-1kws27u");
    			add_location(i0, file, 80, 140, 3193);
    			attr_dev(p4, "class", "svelte-1kws27u");
    			add_location(p4, file, 78, 2, 3019);
    			attr_dev(small5, "class", "svelte-1kws27u");
    			add_location(small5, file, 84, 4, 3251);
    			attr_dev(p5, "class", "svelte-1kws27u");
    			add_location(p5, file, 83, 2, 3243);
    			attr_dev(a5, "href", "https://github.com/p3k/json3k");
    			attr_dev(a5, "class", "svelte-1kws27u");
    			add_location(a5, file, 89, 19, 3596);
    			attr_dev(li19, "class", "svelte-1kws27u");
    			add_location(li19, file, 88, 4, 3572);
    			attr_dev(a6, "href", "http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer");
    			attr_dev(a6, "class", "svelte-1kws27u");
    			add_location(a6, file, 92, 40, 3769);
    			attr_dev(li20, "class", "svelte-1kws27u");
    			add_location(li20, file, 91, 4, 3724);
    			attr_dev(ul2, "class", "svelte-1kws27u");
    			add_location(ul2, file, 87, 2, 3563);
    			attr_dev(small6, "class", "svelte-1kws27u");
    			add_location(small6, file, 97, 4, 3879);
    			attr_dev(p6, "class", "svelte-1kws27u");
    			add_location(p6, file, 96, 2, 3871);
    			attr_dev(code0, "class", "svelte-1kws27u");
    			add_location(code0, file, 102, 204, 4211);
    			attr_dev(li21, "class", "svelte-1kws27u");
    			add_location(li21, file, 101, 4, 4002);
    			attr_dev(li22, "class", "svelte-1kws27u");
    			add_location(li22, file, 104, 4, 4339);
    			attr_dev(ul3, "class", "svelte-1kws27u");
    			add_location(ul3, file, 100, 2, 3993);
    			attr_dev(small7, "class", "svelte-1kws27u");
    			add_location(small7, file, 110, 4, 4653);
    			attr_dev(code1, "class", "svelte-1kws27u");
    			add_location(code1, file, 111, 173, 4852);
    			attr_dev(code2, "class", "svelte-1kws27u");
    			add_location(code2, file, 111, 206, 4885);
    			attr_dev(code3, "class", "svelte-1kws27u");
    			add_location(code3, file, 111, 240, 4919);
    			attr_dev(code4, "class", "svelte-1kws27u");
    			add_location(code4, file, 111, 277, 4956);
    			attr_dev(code5, "class", "svelte-1kws27u");
    			add_location(code5, file, 111, 339, 5018);
    			attr_dev(p7, "class", "svelte-1kws27u");
    			add_location(p7, file, 109, 2, 4645);
    			attr_dev(small8, "class", "svelte-1kws27u");
    			add_location(small8, file, 115, 4, 5086);
    			attr_dev(p8, "class", "svelte-1kws27u");
    			add_location(p8, file, 114, 2, 5078);
    			attr_dev(code6, "class", "svelte-1kws27u");
    			add_location(code6, file, 119, 130, 5265);
    			attr_dev(li23, "class", "svelte-1kws27u");
    			add_location(li23, file, 118, 4, 5130);
    			attr_dev(code7, "class", "svelte-1kws27u");
    			add_location(code7, file, 122, 51, 5381);
    			attr_dev(code8, "class", "svelte-1kws27u");
    			add_location(code8, file, 122, 95, 5425);
    			attr_dev(li24, "class", "svelte-1kws27u");
    			add_location(li24, file, 121, 4, 5325);
    			attr_dev(ul4, "class", "svelte-1kws27u");
    			add_location(ul4, file, 117, 2, 5121);
    			attr_dev(small9, "class", "svelte-1kws27u");
    			add_location(small9, file, 127, 4, 5505);
    			attr_dev(p9, "class", "svelte-1kws27u");
    			add_location(p9, file, 126, 2, 5497);
    			attr_dev(li25, "class", "svelte-1kws27u");
    			add_location(li25, file, 130, 4, 5549);
    			attr_dev(li26, "class", "svelte-1kws27u");
    			add_location(li26, file, 133, 4, 5666);
    			attr_dev(ul5, "class", "svelte-1kws27u");
    			add_location(ul5, file, 129, 2, 5540);
    			attr_dev(small10, "class", "svelte-1kws27u");
    			add_location(small10, file, 139, 4, 5773);
    			attr_dev(p10, "class", "svelte-1kws27u");
    			add_location(p10, file, 138, 2, 5765);
    			attr_dev(code9, "class", "svelte-1kws27u");
    			add_location(code9, file, 144, 12, 5882);
    			attr_dev(li27, "class", "svelte-1kws27u");
    			add_location(li27, file, 143, 4, 5865);
    			attr_dev(li28, "class", "svelte-1kws27u");
    			add_location(li28, file, 146, 4, 5979);
    			attr_dev(li29, "class", "svelte-1kws27u");
    			add_location(li29, file, 149, 4, 6074);
    			attr_dev(ul6, "class", "svelte-1kws27u");
    			add_location(ul6, file, 142, 2, 5856);
    			attr_dev(small11, "class", "svelte-1kws27u");
    			add_location(small11, file, 155, 4, 6203);
    			attr_dev(i1, "class", "svelte-1kws27u");
    			add_location(i1, file, 156, 206, 6435);
    			attr_dev(p11, "class", "svelte-1kws27u");
    			add_location(p11, file, 154, 2, 6195);
    			attr_dev(i2, "class", "svelte-1kws27u");
    			add_location(i2, file, 159, 136, 6599);
    			attr_dev(p12, "class", "svelte-1kws27u");
    			add_location(p12, file, 158, 2, 6459);
    			attr_dev(p13, "class", "svelte-1kws27u");
    			add_location(p13, file, 161, 2, 6628);
    			attr_dev(small12, "class", "svelte-1kws27u");
    			add_location(small12, file, 164, 4, 6685);
    			attr_dev(p14, "class", "svelte-1kws27u");
    			add_location(p14, file, 163, 2, 6677);
    			attr_dev(small13, "class", "svelte-1kws27u");
    			add_location(small13, file, 169, 4, 7238);
    			attr_dev(p15, "class", "svelte-1kws27u");
    			add_location(p15, file, 168, 2, 7230);
    			attr_dev(code10, "class", "svelte-1kws27u");
    			add_location(code10, file, 173, 24, 7311);
    			attr_dev(li30, "class", "svelte-1kws27u");
    			add_location(li30, file, 172, 4, 7282);
    			attr_dev(li31, "class", "svelte-1kws27u");
    			add_location(li31, file, 175, 4, 7371);
    			attr_dev(a7, "href", "http://www.google.com/webfonts/specimen/Droid+Serif");
    			attr_dev(a7, "class", "svelte-1kws27u");
    			add_location(a7, file, 179, 40, 7487);
    			attr_dev(li32, "class", "svelte-1kws27u");
    			add_location(li32, file, 178, 4, 7442);
    			attr_dev(ul7, "class", "svelte-1kws27u");
    			add_location(ul7, file, 171, 2, 7273);
    			attr_dev(small14, "class", "svelte-1kws27u");
    			add_location(small14, file, 184, 4, 7609);
    			attr_dev(p16, "class", "svelte-1kws27u");
    			add_location(p16, file, 183, 2, 7601);
    			attr_dev(li33, "class", "svelte-1kws27u");
    			add_location(li33, file, 188, 4, 7763);
    			attr_dev(li34, "class", "svelte-1kws27u");
    			add_location(li34, file, 191, 4, 7865);
    			attr_dev(a8, "href", "http://coding.smashingmagazine.com/2010/11/02/the-important-css-declaration-how-and-when-to-use-it/");
    			attr_dev(a8, "class", "svelte-1kws27u");
    			add_location(a8, file, 195, 111, 8070);
    			attr_dev(code11, "class", "svelte-1kws27u");
    			add_location(code11, file, 195, 105, 8064);
    			attr_dev(i3, "class", "svelte-1kws27u");
    			add_location(i3, file, 195, 74, 8033);
    			attr_dev(li35, "class", "svelte-1kws27u");
    			add_location(li35, file, 194, 4, 7954);
    			attr_dev(a9, "href", "https://github.com/claviska/jquery-miniColors/");
    			attr_dev(a9, "class", "svelte-1kws27u");
    			add_location(a9, file, 198, 58, 8330);
    			attr_dev(li36, "class", "svelte-1kws27u");
    			add_location(li36, file, 197, 4, 8267);
    			attr_dev(li37, "class", "svelte-1kws27u");
    			add_location(li37, file, 200, 4, 8431);
    			attr_dev(i4, "class", "svelte-1kws27u");
    			add_location(i4, file, 204, 35, 8581);
    			attr_dev(li38, "class", "svelte-1kws27u");
    			add_location(li38, file, 203, 4, 8541);
    			attr_dev(li39, "class", "svelte-1kws27u");
    			add_location(li39, file, 206, 4, 8651);
    			attr_dev(li40, "class", "svelte-1kws27u");
    			add_location(li40, file, 209, 4, 8718);
    			attr_dev(ul8, "class", "svelte-1kws27u");
    			add_location(ul8, file, 187, 2, 7754);
    			attr_dev(small15, "class", "svelte-1kws27u");
    			add_location(small15, file, 215, 4, 8860);
    			attr_dev(p17, "class", "svelte-1kws27u");
    			add_location(p17, file, 214, 2, 8852);
    			attr_dev(small16, "class", "svelte-1kws27u");
    			add_location(small16, file, 220, 4, 9049);
    			attr_dev(p18, "class", "svelte-1kws27u");
    			add_location(p18, file, 219, 2, 9041);
    			attr_dev(li41, "class", "svelte-1kws27u");
    			add_location(li41, file, 224, 4, 9131);
    			attr_dev(li42, "class", "svelte-1kws27u");
    			add_location(li42, file, 225, 4, 9209);
    			attr_dev(li43, "class", "svelte-1kws27u");
    			add_location(li43, file, 226, 4, 9274);
    			attr_dev(ul9, "class", "svelte-1kws27u");
    			add_location(ul9, file, 223, 2, 9122);
    			attr_dev(small17, "class", "svelte-1kws27u");
    			add_location(small17, file, 230, 4, 9369);
    			attr_dev(p19, "class", "svelte-1kws27u");
    			add_location(p19, file, 229, 2, 9361);
    			attr_dev(li44, "class", "svelte-1kws27u");
    			add_location(li44, file, 234, 4, 9535);
    			attr_dev(li45, "class", "svelte-1kws27u");
    			add_location(li45, file, 237, 4, 9641);
    			attr_dev(li46, "class", "svelte-1kws27u");
    			add_location(li46, file, 240, 4, 9789);
    			attr_dev(ul10, "class", "svelte-1kws27u");
    			add_location(ul10, file, 233, 2, 9526);
    			attr_dev(small18, "class", "svelte-1kws27u");
    			add_location(small18, file, 246, 4, 9973);
    			attr_dev(p20, "class", "svelte-1kws27u");
    			add_location(p20, file, 245, 2, 9965);
    			attr_dev(small19, "class", "svelte-1kws27u");
    			add_location(small19, file, 251, 4, 10370);
    			attr_dev(p21, "class", "svelte-1kws27u");
    			add_location(p21, file, 250, 2, 10362);
    			attr_dev(small20, "class", "svelte-1kws27u");
    			add_location(small20, file, 256, 4, 10759);
    			attr_dev(i5, "class", "svelte-1kws27u");
    			add_location(i5, file, 257, 102, 10887);
    			attr_dev(p22, "class", "svelte-1kws27u");
    			add_location(p22, file, 255, 2, 10751);
    			attr_dev(a10, "href", "http://en.wikipedia.org/wiki/Cascading_Style_Sheets");
    			attr_dev(a10, "class", "svelte-1kws27u");
    			add_location(a10, file, 261, 6, 11100);
    			attr_dev(li47, "class", "svelte-1kws27u");
    			add_location(li47, file, 260, 4, 11089);
    			attr_dev(a11, "href", "http://www.sitepoint.com/article/beware-opening-links-new-window");
    			attr_dev(a11, "class", "svelte-1kws27u");
    			add_location(a11, file, 264, 6, 11284);
    			attr_dev(li48, "class", "svelte-1kws27u");
    			add_location(li48, file, 263, 4, 11273);
    			attr_dev(ol, "class", "svelte-1kws27u");
    			add_location(ol, file, 259, 2, 11080);
    			attr_dev(i6, "class", "svelte-1kws27u");
    			add_location(i6, file, 268, 4, 11464);
    			attr_dev(p23, "class", "svelte-1kws27u");
    			add_location(p23, file, 267, 2, 11456);
    			attr_dev(small21, "class", "svelte-1kws27u");
    			add_location(small21, file, 272, 4, 11511);
    			attr_dev(p24, "class", "svelte-1kws27u");
    			add_location(p24, file, 271, 2, 11503);
    			attr_dev(small22, "class", "svelte-1kws27u");
    			add_location(small22, file, 277, 4, 11768);
    			attr_dev(a12, "href", "http://tinyurl.com");
    			attr_dev(a12, "class", "svelte-1kws27u");
    			add_location(a12, file, 278, 275, 12069);
    			attr_dev(p25, "class", "svelte-1kws27u");
    			add_location(p25, file, 276, 2, 11760);
    			attr_dev(small23, "class", "svelte-1kws27u");
    			add_location(small23, file, 282, 4, 12133);
    			attr_dev(a13, "href", "https://p3k.org/source/rss-box/");
    			attr_dev(a13, "class", "svelte-1kws27u");
    			add_location(a13, file, 283, 17, 12176);
    			attr_dev(p26, "class", "svelte-1kws27u");
    			add_location(p26, file, 281, 2, 12125);
    			attr_dev(small24, "class", "svelte-1kws27u");
    			add_location(small24, file, 287, 4, 12288);
    			attr_dev(p27, "class", "svelte-1kws27u");
    			add_location(p27, file, 286, 2, 12280);
    			attr_dev(small25, "class", "svelte-1kws27u");
    			add_location(small25, file, 292, 4, 12612);
    			attr_dev(a14, "href", "http://www.mandolux.com/");
    			attr_dev(a14, "class", "svelte-1kws27u");
    			add_location(a14, file, 293, 177, 12815);
    			attr_dev(p28, "class", "svelte-1kws27u");
    			add_location(p28, file, 291, 2, 12604);
    			attr_dev(small26, "class", "svelte-1kws27u");
    			add_location(small26, file, 297, 4, 12882);
    			attr_dev(p29, "class", "svelte-1kws27u");
    			add_location(p29, file, 296, 2, 12874);
    			attr_dev(small27, "class", "svelte-1kws27u");
    			add_location(small27, file, 302, 4, 13117);
    			attr_dev(code12, "class", "svelte-1kws27u");
    			add_location(code12, file, 303, 237, 13380);
    			attr_dev(p30, "class", "svelte-1kws27u");
    			add_location(p30, file, 301, 2, 13109);
    			attr_dev(small28, "class", "svelte-1kws27u");
    			add_location(small28, file, 307, 4, 13470);
    			attr_dev(p31, "class", "svelte-1kws27u");
    			add_location(p31, file, 306, 2, 13462);
    			attr_dev(small29, "class", "svelte-1kws27u");
    			add_location(small29, file, 312, 4, 13755);
    			attr_dev(p32, "class", "svelte-1kws27u");
    			add_location(p32, file, 311, 2, 13747);
    			attr_dev(small30, "class", "svelte-1kws27u");
    			add_location(small30, file, 317, 4, 13962);
    			attr_dev(p33, "class", "svelte-1kws27u");
    			add_location(p33, file, 316, 2, 13954);
    			attr_dev(small31, "class", "svelte-1kws27u");
    			add_location(small31, file, 322, 4, 14262);
    			attr_dev(a15, "href", "https://p3k.org/source/rss-box");
    			attr_dev(a15, "class", "svelte-1kws27u");
    			add_location(a15, file, 323, 43, 14331);
    			attr_dev(a16, "href", "https://p3k.org/source/rss-box/branches/2.0/README");
    			attr_dev(a16, "class", "svelte-1kws27u");
    			add_location(a16, file, 323, 376, 14664);
    			attr_dev(p34, "class", "svelte-1kws27u");
    			add_location(p34, file, 321, 2, 14254);
    			attr_dev(small32, "class", "svelte-1kws27u");
    			add_location(small32, file, 327, 4, 14834);
    			attr_dev(a17, "href", "./?url=error");
    			attr_dev(a17, "class", "svelte-1kws27u");
    			add_location(a17, file, 328, 102, 14962);
    			attr_dev(p35, "class", "svelte-1kws27u");
    			add_location(p35, file, 326, 2, 14826);
    			attr_dev(small33, "class", "svelte-1kws27u");
    			add_location(small33, file, 333, 4, 15134);
    			attr_dev(i7, "class", "svelte-1kws27u");
    			add_location(i7, file, 334, 103, 15263);
    			attr_dev(del0, "class", "svelte-1kws27u");
    			add_location(del0, file, 334, 161, 15321);
    			attr_dev(a18, "href", "http://validator.w3.org/check?uri=http%3A%2F%2Fp3k.org%2Frss%2F");
    			attr_dev(a18, "class", "svelte-1kws27u");
    			add_location(a18, file, 334, 303, 15463);
    			attr_dev(p36, "class", "svelte-1kws27u");
    			add_location(p36, file, 332, 2, 15126);
    			attr_dev(small34, "class", "svelte-1kws27u");
    			add_location(small34, file, 338, 4, 15580);
    			attr_dev(del1, "class", "svelte-1kws27u");
    			add_location(del1, file, 339, 18, 15624);
    			attr_dev(p37, "class", "svelte-1kws27u");
    			add_location(p37, file, 337, 2, 15572);
    			attr_dev(small35, "class", "svelte-1kws27u");
    			add_location(small35, file, 343, 4, 15779);
    			attr_dev(del2, "class", "svelte-1kws27u");
    			add_location(del2, file, 344, 40, 15845);
    			attr_dev(p38, "class", "svelte-1kws27u");
    			add_location(p38, file, 342, 2, 15771);
    			attr_dev(small36, "class", "svelte-1kws27u");
    			add_location(small36, file, 348, 4, 15891);
    			attr_dev(a19, "href", "http://www.rebol.com/news3310.html");
    			attr_dev(a19, "class", "svelte-1kws27u");
    			add_location(a19, file, 349, 21, 15938);
    			attr_dev(i8, "class", "svelte-1kws27u");
    			add_location(i8, file, 350, 4, 16056);
    			attr_dev(p39, "class", "svelte-1kws27u");
    			add_location(p39, file, 347, 2, 15883);
    			attr_dev(small37, "class", "svelte-1kws27u");
    			add_location(small37, file, 354, 4, 16090);
    			attr_dev(a20, "href", "http://www.ourpla.net/cgi-bin/pikie.cgi?AbbeNormal");
    			attr_dev(a20, "class", "svelte-1kws27u");
    			add_location(a20, file, 355, 33, 16149);
    			attr_dev(p40, "class", "svelte-1kws27u");
    			add_location(p40, file, 353, 2, 16082);
    			attr_dev(small38, "class", "svelte-1kws27u");
    			add_location(small38, file, 359, 4, 16275);
    			attr_dev(p41, "class", "svelte-1kws27u");
    			add_location(p41, file, 358, 2, 16267);
    			attr_dev(small39, "class", "svelte-1kws27u");
    			add_location(small39, file, 364, 4, 16794);
    			attr_dev(code13, "class", "svelte-1kws27u");
    			add_location(code13, file, 365, 20, 16840);
    			attr_dev(p42, "class", "svelte-1kws27u");
    			add_location(p42, file, 363, 2, 16786);
    			attr_dev(small40, "class", "svelte-1kws27u");
    			add_location(small40, file, 369, 4, 17225);
    			attr_dev(p43, "class", "svelte-1kws27u");
    			add_location(p43, file, 368, 2, 17217);
    			attr_dev(small41, "class", "svelte-1kws27u");
    			add_location(small41, file, 374, 4, 17505);
    			attr_dev(code14, "class", "svelte-1kws27u");
    			add_location(code14, file, 375, 99, 17630);
    			attr_dev(code15, "class", "svelte-1kws27u");
    			add_location(code15, file, 375, 126, 17657);
    			attr_dev(code16, "class", "svelte-1kws27u");
    			add_location(code16, file, 375, 155, 17686);
    			attr_dev(code17, "class", "svelte-1kws27u");
    			add_location(code17, file, 375, 190, 17721);
    			attr_dev(p44, "class", "svelte-1kws27u");
    			add_location(p44, file, 373, 2, 17497);
    			attr_dev(small42, "class", "svelte-1kws27u");
    			add_location(small42, file, 379, 4, 17927);
    			attr_dev(p45, "class", "svelte-1kws27u");
    			add_location(p45, file, 378, 2, 17919);
    			attr_dev(small43, "class", "svelte-1kws27u");
    			add_location(small43, file, 384, 4, 18150);
    			attr_dev(a21, "href", "http://publish.curry.com/rss/");
    			attr_dev(a21, "class", "svelte-1kws27u");
    			add_location(a21, file, 385, 56, 18232);
    			attr_dev(p46, "class", "svelte-1kws27u");
    			add_location(p46, file, 383, 2, 18142);
    			attr_dev(small44, "class", "svelte-1kws27u");
    			add_location(small44, file, 389, 4, 18501);
    			attr_dev(del3, "class", "svelte-1kws27u");
    			add_location(del3, file, 390, 207, 18734);
    			attr_dev(p47, "class", "svelte-1kws27u");
    			add_location(p47, file, 388, 2, 18493);
    			attr_dev(small45, "class", "svelte-1kws27u");
    			add_location(small45, file, 394, 4, 18791);
    			attr_dev(a22, "href", "http://www.curry.com/2001/07/31#coolRssService");
    			attr_dev(a22, "class", "svelte-1kws27u");
    			add_location(a22, file, 395, 14, 18831);
    			attr_dev(del4, "class", "svelte-1kws27u");
    			add_location(del4, file, 395, 117, 18934);
    			attr_dev(p48, "class", "svelte-1kws27u");
    			add_location(p48, file, 393, 2, 18783);
    			attr_dev(small46, "class", "svelte-1kws27u");
    			add_location(small46, file, 399, 4, 18993);
    			attr_dev(p49, "class", "svelte-1kws27u");
    			add_location(p49, file, 398, 2, 18985);
    			attr_dev(small47, "class", "svelte-1kws27u");
    			add_location(small47, file, 404, 4, 19115);
    			attr_dev(p50, "class", "svelte-1kws27u");
    			add_location(p50, file, 403, 2, 19107);
    			attr_dev(details, "class", "svelte-1kws27u");
    			add_location(details, file, 30, 0, 350);
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
    			append_dev(details, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t6);
    			append_dev(ul0, li1);
    			append_dev(ul0, t8);
    			append_dev(ul0, li2);
    			append_dev(ul0, t10);
    			append_dev(ul0, li3);
    			append_dev(ul0, t12);
    			append_dev(ul0, li4);
    			append_dev(li4, t13);
    			append_dev(li4, a0);
    			append_dev(li4, t15);
    			append_dev(details, t16);
    			append_dev(details, p1);
    			append_dev(p1, small1);
    			append_dev(p1, t18);
    			append_dev(p1, em1);
    			append_dev(em1, t19);
    			append_dev(em1, em0);
    			append_dev(details, t20);
    			append_dev(details, p2);
    			append_dev(p2, small2);
    			append_dev(p2, t22);
    			append_dev(details, t23);
    			append_dev(details, ul1);
    			append_dev(ul1, li5);
    			append_dev(ul1, t25);
    			append_dev(ul1, li6);
    			append_dev(ul1, t27);
    			append_dev(ul1, li7);
    			append_dev(ul1, t29);
    			append_dev(ul1, li8);
    			append_dev(ul1, t31);
    			append_dev(ul1, li9);
    			append_dev(ul1, t33);
    			append_dev(ul1, li10);
    			append_dev(ul1, t35);
    			append_dev(ul1, li11);
    			append_dev(ul1, t37);
    			append_dev(ul1, li12);
    			append_dev(ul1, t39);
    			append_dev(ul1, li13);
    			append_dev(li13, t40);
    			append_dev(li13, a1);
    			append_dev(li13, t42);
    			append_dev(li13, a2);
    			append_dev(ul1, t44);
    			append_dev(ul1, li14);
    			append_dev(ul1, t46);
    			append_dev(ul1, li15);
    			append_dev(ul1, t48);
    			append_dev(ul1, li16);
    			append_dev(li16, t49);
    			append_dev(li16, a3);
    			append_dev(ul1, t51);
    			append_dev(ul1, li17);
    			append_dev(ul1, t53);
    			append_dev(ul1, li18);
    			append_dev(details, t55);
    			append_dev(details, p3);
    			append_dev(p3, small3);
    			append_dev(p3, t57);
    			append_dev(p3, a4);
    			append_dev(p3, t59);
    			append_dev(details, t60);
    			append_dev(details, p4);
    			append_dev(p4, small4);
    			append_dev(p4, t62);
    			append_dev(p4, i0);
    			append_dev(details, t64);
    			append_dev(details, p5);
    			append_dev(p5, small5);
    			append_dev(p5, t66);
    			append_dev(details, t67);
    			append_dev(details, ul2);
    			append_dev(ul2, li19);
    			append_dev(li19, t68);
    			append_dev(li19, a5);
    			append_dev(li19, t70);
    			append_dev(ul2, t71);
    			append_dev(ul2, li20);
    			append_dev(li20, t72);
    			append_dev(li20, a6);
    			append_dev(li20, t74);
    			append_dev(details, t75);
    			append_dev(details, p6);
    			append_dev(p6, small6);
    			append_dev(p6, t77);
    			append_dev(details, t78);
    			append_dev(details, ul3);
    			append_dev(ul3, li21);
    			append_dev(li21, t79);
    			append_dev(li21, code0);
    			append_dev(li21, t81);
    			append_dev(ul3, t82);
    			append_dev(ul3, li22);
    			append_dev(details, t84);
    			append_dev(details, p7);
    			append_dev(p7, small7);
    			append_dev(p7, t86);
    			append_dev(p7, code1);
    			append_dev(p7, t88);
    			append_dev(p7, code2);
    			append_dev(p7, t90);
    			append_dev(p7, code3);
    			append_dev(p7, t92);
    			append_dev(p7, code4);
    			append_dev(p7, t94);
    			append_dev(p7, code5);
    			append_dev(p7, t96);
    			append_dev(details, t97);
    			append_dev(details, p8);
    			append_dev(p8, small8);
    			append_dev(details, t99);
    			append_dev(details, ul4);
    			append_dev(ul4, li23);
    			append_dev(li23, t100);
    			append_dev(li23, code6);
    			append_dev(li23, t102);
    			append_dev(ul4, t103);
    			append_dev(ul4, li24);
    			append_dev(li24, t104);
    			append_dev(li24, code7);
    			append_dev(li24, t106);
    			append_dev(li24, code8);
    			append_dev(li24, t108);
    			append_dev(details, t109);
    			append_dev(details, p9);
    			append_dev(p9, small9);
    			append_dev(details, t111);
    			append_dev(details, ul5);
    			append_dev(ul5, li25);
    			append_dev(ul5, t113);
    			append_dev(ul5, li26);
    			append_dev(details, t115);
    			append_dev(details, p10);
    			append_dev(p10, small10);
    			append_dev(p10, t117);
    			append_dev(details, t118);
    			append_dev(details, ul6);
    			append_dev(ul6, li27);
    			append_dev(li27, t119);
    			append_dev(li27, code9);
    			append_dev(li27, t121);
    			append_dev(ul6, t122);
    			append_dev(ul6, li28);
    			append_dev(ul6, t124);
    			append_dev(ul6, li29);
    			append_dev(details, t126);
    			append_dev(details, p11);
    			append_dev(p11, small11);
    			append_dev(p11, t128);
    			append_dev(p11, i1);
    			append_dev(details, t130);
    			append_dev(details, p12);
    			append_dev(p12, t131);
    			append_dev(p12, i2);
    			append_dev(p12, t133);
    			append_dev(details, t134);
    			append_dev(details, p13);
    			append_dev(details, t136);
    			append_dev(details, p14);
    			append_dev(p14, small12);
    			append_dev(p14, t138);
    			append_dev(details, t139);
    			append_dev(details, p15);
    			append_dev(p15, small13);
    			append_dev(details, t141);
    			append_dev(details, ul7);
    			append_dev(ul7, li30);
    			append_dev(li30, t142);
    			append_dev(li30, code10);
    			append_dev(li30, t144);
    			append_dev(ul7, t145);
    			append_dev(ul7, li31);
    			append_dev(ul7, t147);
    			append_dev(ul7, li32);
    			append_dev(li32, t148);
    			append_dev(li32, a7);
    			append_dev(li32, t150);
    			append_dev(details, t151);
    			append_dev(details, p16);
    			append_dev(p16, small14);
    			append_dev(p16, t153);
    			append_dev(details, t154);
    			append_dev(details, ul8);
    			append_dev(ul8, li33);
    			append_dev(ul8, t156);
    			append_dev(ul8, li34);
    			append_dev(ul8, t158);
    			append_dev(ul8, li35);
    			append_dev(li35, t159);
    			append_dev(li35, i3);
    			append_dev(i3, t160);
    			append_dev(i3, code11);
    			append_dev(code11, a8);
    			append_dev(i3, t162);
    			append_dev(ul8, t163);
    			append_dev(ul8, li36);
    			append_dev(li36, t164);
    			append_dev(li36, a9);
    			append_dev(li36, t166);
    			append_dev(ul8, t167);
    			append_dev(ul8, li37);
    			append_dev(ul8, t169);
    			append_dev(ul8, li38);
    			append_dev(li38, t170);
    			append_dev(li38, i4);
    			append_dev(ul8, t172);
    			append_dev(ul8, li39);
    			append_dev(ul8, t174);
    			append_dev(ul8, li40);
    			append_dev(details, t176);
    			append_dev(details, p17);
    			append_dev(p17, small15);
    			append_dev(p17, t178);
    			append_dev(details, t179);
    			append_dev(details, p18);
    			append_dev(p18, small16);
    			append_dev(p18, t181);
    			append_dev(details, t182);
    			append_dev(details, ul9);
    			append_dev(ul9, li41);
    			append_dev(ul9, t184);
    			append_dev(ul9, li42);
    			append_dev(ul9, t186);
    			append_dev(ul9, li43);
    			append_dev(details, t188);
    			append_dev(details, p19);
    			append_dev(p19, small17);
    			append_dev(p19, t190);
    			append_dev(details, t191);
    			append_dev(details, ul10);
    			append_dev(ul10, li44);
    			append_dev(ul10, t193);
    			append_dev(ul10, li45);
    			append_dev(ul10, t195);
    			append_dev(ul10, li46);
    			append_dev(details, t197);
    			append_dev(details, p20);
    			append_dev(p20, small18);
    			append_dev(p20, t199);
    			append_dev(details, t200);
    			append_dev(details, p21);
    			append_dev(p21, small19);
    			append_dev(p21, t202);
    			append_dev(details, t203);
    			append_dev(details, p22);
    			append_dev(p22, small20);
    			append_dev(p22, t205);
    			append_dev(p22, i5);
    			append_dev(p22, t207);
    			append_dev(details, t208);
    			append_dev(details, ol);
    			append_dev(ol, li47);
    			append_dev(li47, a10);
    			append_dev(li47, t210);
    			append_dev(ol, t211);
    			append_dev(ol, li48);
    			append_dev(li48, a11);
    			append_dev(li48, t213);
    			append_dev(details, t214);
    			append_dev(details, p23);
    			append_dev(p23, i6);
    			append_dev(details, t216);
    			append_dev(details, p24);
    			append_dev(p24, small21);
    			append_dev(p24, t218);
    			append_dev(details, t219);
    			append_dev(details, p25);
    			append_dev(p25, small22);
    			append_dev(p25, t221);
    			append_dev(p25, a12);
    			append_dev(p25, t223);
    			append_dev(details, t224);
    			append_dev(details, p26);
    			append_dev(p26, small23);
    			append_dev(p26, t226);
    			append_dev(p26, a13);
    			append_dev(p26, t228);
    			append_dev(details, t229);
    			append_dev(details, p27);
    			append_dev(p27, small24);
    			append_dev(p27, t231);
    			append_dev(details, t232);
    			append_dev(details, p28);
    			append_dev(p28, small25);
    			append_dev(p28, t234);
    			append_dev(p28, a14);
    			append_dev(p28, t236);
    			append_dev(details, t237);
    			append_dev(details, p29);
    			append_dev(p29, small26);
    			append_dev(p29, t239);
    			append_dev(details, t240);
    			append_dev(details, p30);
    			append_dev(p30, small27);
    			append_dev(p30, t242);
    			append_dev(p30, code12);
    			append_dev(p30, t247);
    			append_dev(details, t248);
    			append_dev(details, p31);
    			append_dev(p31, small28);
    			append_dev(p31, t250);
    			append_dev(details, t251);
    			append_dev(details, p32);
    			append_dev(p32, small29);
    			append_dev(p32, t253);
    			append_dev(details, t254);
    			append_dev(details, p33);
    			append_dev(p33, small30);
    			append_dev(p33, t256);
    			append_dev(details, t257);
    			append_dev(details, p34);
    			append_dev(p34, small31);
    			append_dev(p34, t259);
    			append_dev(p34, a15);
    			append_dev(p34, t261);
    			append_dev(p34, a16);
    			append_dev(p34, t263);
    			append_dev(details, t264);
    			append_dev(details, p35);
    			append_dev(p35, small32);
    			append_dev(p35, t266);
    			append_dev(p35, a17);
    			append_dev(p35, t268);
    			append_dev(details, t269);
    			append_dev(details, p36);
    			append_dev(p36, small33);
    			append_dev(p36, t271);
    			append_dev(p36, i7);
    			append_dev(p36, t273);
    			append_dev(p36, del0);
    			append_dev(p36, t275);
    			append_dev(p36, a18);
    			append_dev(p36, t277);
    			append_dev(details, t278);
    			append_dev(details, p37);
    			append_dev(p37, small34);
    			append_dev(p37, t280);
    			append_dev(p37, del1);
    			append_dev(p37, t282);
    			append_dev(details, t283);
    			append_dev(details, p38);
    			append_dev(p38, small35);
    			append_dev(p38, t285);
    			append_dev(p38, del2);
    			append_dev(p38, t287);
    			append_dev(details, t288);
    			append_dev(details, p39);
    			append_dev(p39, small36);
    			append_dev(p39, t290);
    			append_dev(p39, a19);
    			append_dev(p39, t292);
    			append_dev(p39, i8);
    			append_dev(details, t294);
    			append_dev(details, p40);
    			append_dev(p40, small37);
    			append_dev(p40, t296);
    			append_dev(p40, a20);
    			append_dev(p40, t298);
    			append_dev(details, t299);
    			append_dev(details, p41);
    			append_dev(p41, small38);
    			append_dev(p41, t301);
    			append_dev(details, t302);
    			append_dev(details, p42);
    			append_dev(p42, small39);
    			append_dev(p42, t304);
    			append_dev(p42, code13);
    			append_dev(p42, t306);
    			append_dev(details, t307);
    			append_dev(details, p43);
    			append_dev(p43, small40);
    			append_dev(p43, t309);
    			append_dev(details, t310);
    			append_dev(details, p44);
    			append_dev(p44, small41);
    			append_dev(p44, t312);
    			append_dev(p44, code14);
    			append_dev(p44, t314);
    			append_dev(p44, code15);
    			append_dev(p44, t316);
    			append_dev(p44, code16);
    			append_dev(p44, t318);
    			append_dev(p44, code17);
    			append_dev(p44, t320);
    			append_dev(details, t321);
    			append_dev(details, p45);
    			append_dev(p45, small42);
    			append_dev(p45, t323);
    			append_dev(details, t324);
    			append_dev(details, p46);
    			append_dev(p46, small43);
    			append_dev(p46, t326);
    			append_dev(p46, a21);
    			append_dev(p46, t328);
    			append_dev(details, t329);
    			append_dev(details, p47);
    			append_dev(p47, small44);
    			append_dev(p47, t331);
    			append_dev(p47, del3);
    			append_dev(p47, t333);
    			append_dev(details, t334);
    			append_dev(details, p48);
    			append_dev(p48, small45);
    			append_dev(p48, t336);
    			append_dev(p48, a22);
    			append_dev(p48, t338);
    			append_dev(p48, del4);
    			append_dev(p48, t340);
    			append_dev(details, t341);
    			append_dev(details, p49);
    			append_dev(p49, small46);
    			append_dev(p49, t343);
    			append_dev(details, t344);
    			append_dev(details, p50);
    			append_dev(p50, small47);
    			append_dev(p50, t346);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Changes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1kws27u-style")) add_css();
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Changes",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* components/Github.html generated by Svelte v3.16.7 */

    const file$1 = "components/Github.html";

    function create_fragment$1(ctx) {
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
    			add_location(a, file$1, 7, 0, 201);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self) {
    	const script = document.createElement("script");
    	script.async = script.defer = true;
    	script.src = "https://buttons.github.io/buttons.js";
    	document.head.appendChild(script);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [];
    }

    class Github extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Github",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* components/About.html generated by Svelte v3.16.7 */

    const { document: document_1 } = globals;
    const file$2 = "components/About.html";

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-8mn5ku-style";
    	style.textContent = "h3.svelte-8mn5ku{display:inline-block}h3+p.svelte-8mn5ku{margin-top:0}small.svelte-8mn5ku{color:#bbb}.warning.svelte-8mn5ku{border-color:#e44;background:#fdd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJvdXQuaHRtbCIsInNvdXJjZXMiOlsiQWJvdXQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBhcHAgfSBmcm9tICcuLi9zcmMvc3RvcmVzJztcbiAgaW1wb3J0IENoYW5nZXMgZnJvbSAnLi9DaGFuZ2VzLmh0bWwnO1xuICBpbXBvcnQgR2l0aHViIGZyb20gJy4vR2l0aHViLmh0bWwnO1xuXG4gIC8vIFN0b3JlcyBjb21pbmcgaW4gdmlhIHByb3BzXG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuXG4gIGZ1bmN0aW9uIGdvdG8oKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25maWcuc2V0KHsgdXJsOiBldmVudC50YXJnZXQuaHJlZiB9KTtcbiAgfVxuXG4gIGFwcC5zdWJzY3JpYmUoc3RhdGUgPT4gZG9jdW1lbnQudGl0bGUgPSBzdGF0ZS5kZXNjcmlwdGlvbik7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICBoMyB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICB9XG5cbiAgaDMgKyBwIHtcbiAgICBtYXJnaW4tdG9wOiAwO1xuICB9XG5cbiAgc21hbGwge1xuICAgIGNvbG9yOiAjYmJiO1xuICB9XG5cbiAgLndhcm5pbmcge1xuICAgIGJvcmRlci1jb2xvcjogI2U0NDtcbiAgICBiYWNrZ3JvdW5kOiAjZmRkO1xuICB9XG48L3N0eWxlPlxuXG48ZGl2PlxuICA8c21hbGw+PGk+4oCcSmF2YVNjcmlwdCBSU1MgVmlld2VyIHB1dHMgbGl0dGxlIG9yIGxvbmcgY3VzdG9taXphYmxlIFJTUyBib3hlcyBhbnl3aGVyZSB5b3UgcHV0IEhUTUw7IGJ1aWxkIHlvdXIgb3duIHNsYXNoYm94IGhlbGwgb3IgaGVhdmVuLCBpdOKAmXMgZmVlZGFyaWZpYyHigJ0g4oCUIDxhIGhyZWY9J2h0dHA6Ly9vdXJwbGEubmV0L2NnaS9waWtpZSc+QWJiZSBOb3JtYWw8L2E+PC9pPjwvc21hbGw+XG48L2Rpdj5cblxuPGgyPnsgJGFwcC5kZXNjcmlwdGlvbiB9IHsgJGFwcC52ZXJzaW9uIH08L2gyPlxuXG48cCBjbGFzcz0nbXNnIHdhcm5pbmcnPlxuICA8c3Ryb25nPlJlZHVjZWQgYXZhaWxhYmlsaXR5IGR1ZSB0byB0ZW1wb3JhcnkgdmlvbGF0aW9uIG9mIHF1b3RhIGxpbWl0Ljwvc3Ryb25nPiBZb3Ugc2hvdWxkIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9wM2svanNvbjNrJz5pbnN0YWxsIHlvdXIgb3duIEpTT05QIHByb3h5PC9hPi4gWW91IGNhbiBhbHdheXMgc3VwcG9ydCB0aGUgcHJvamVjdCB3aXRoIHlvdXIgPGEgaHJlZj0naHR0cDovL2ZsYXR0ci5jb20vdGhpbmcvNjgxODgxL0phdmFTY3JpcHQtUlNTLUJveC1WaWV3ZXInPmRvbmF0aW9uPC9hPi5cbjwvcD5cblxuPHA+XG4gIFRoaXMgdmlld2VyIGNhbiBkaXNwbGF5IDxhIGhyZWY9J2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUlNTJz5SU1M8L2E+IGZlZWRzIG9mIHZlcnNpb24gPGEgaHJlZj0naHR0cDovL2N5YmVyLmxhdy5oYXJ2YXJkLmVkdS9yc3MvZXhhbXBsZXMvc2FtcGxlUnNzMDkxLnhtbCcgb246Y2xpY2s9eyBnb3RvIH0+MC45MTwvYT4sIDxhIGhyZWY9J2h0dHA6Ly9jeWJlci5sYXcuaGFydmFyZC5lZHUvcnNzL2V4YW1wbGVzL3NhbXBsZVJzczA5Mi54bWwnIG9uOmNsaWNrPXsgZ290byB9PjAuOTI8L2E+LCA8YSBocmVmPSdodHRwOi8vcnNzLm9yZi5hdC9mbTQueG1sJyBvbjpjbGljaz17IGdvdG8gfT4xLjA8L2E+IGFuZCA8YSBocmVmPSdodHRwOi8vYmxvZy5wM2sub3JnL3N0b3JpZXMueG1sJyBvbjpjbGljaz17IGdvdG8gfT4yLjA8L2E+IGFzIHdlbGwgYXMgZXZlbiB0aGUgZ29vZCBvbGQgbGVnYWN5IGZvcm1hdCA8YSBocmVmPSdodHRwOi8vZXNzYXlzZnJvbWV4b2R1cy5zY3JpcHRpbmcuY29tL3htbC9zY3JpcHRpbmdOZXdzMi54bWwnIG9uOmNsaWNrPXsgZ290byB9PlNjcmlwdGluZyBOZXdzIDI8L2E+LiBUaGVyZSBpcyBhbHNvIGJhc2ljIHN1cHBvcnQgZm9yIDxhIGhyZWY9J2h0dHBzOi8vd3d3LnRoZXJlZ2lzdGVyLmNvLnVrL2hlYWRsaW5lcy5hdG9tJyBvbjpjbGljaz17IGdvdG8gfT5BdG9tIDEuMDwvYT4uXG48L3A+XG5cbjxwPlxuICBJdCBwcm92aWRlcyBhIHNpbXBsZSB3YXkgdG8gZW1iZWQgc3VjaCBSU1MgYm94ZXMgaW4gYW55IDxhIGhyZWY9J2h0dHA6Ly92YWxpZGF0b3IudzMub3JnLyc+dmFsaWQgSFRNTCBkb2N1bWVudDwvYT4gdmlhIGFuIGF1dG9tYWdpY2FsbHkgZ2VuZXJhdGVkIEphdmFTY3JpcHQgdGFnIOKAlCA8aT5mb3IgZnJlZSE8L2k+XG48L3A+XG5cbjxwPlxuICBKdXN0IGVudGVyIHRoZSBVUkwgb2YgYW55IGNvbXBhdGlibGUgUlNTIGZlZWQsIG1vZGlmeSB0aGUgbGF5b3V0IHNldHRpbmdzIGFzIHlvdSBsaWtlIGFuZCBwdXNoIHRoZSBSZWxvYWQgYnV0dG9uLiBXaGVuIGZpbmlzaGVkLCBjb3B5IHRoZSBIVE1MIGNvZGUgaW50byB5b3VyIG93biB3ZWIgcGFnZSDigJMgYW5kIHZvaWzDoCFcbjwvcD5cblxuPHA+XG4gIFRoZSBjb2RlIGJlaGluZCB0aGlzIGlzIHdyaXR0ZW4gaW4gSmF2YVNjcmlwdCBhbmQgcnVucyBjb21wbGV0ZWx5IGluIHlvdXIgYnJvd3NlciouIFlvdSBjYW4gZ2V0IHRoZSBzb3VyY2UgY29kZSB0b2dldGhlciB3aXRoIGFsbCB0aGUgb3RoZXIgbmVjZXNzYXJ5IGZpbGVzIGZyb20gdGhlIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9wM2svcnNzLWJveCc+R2l0aHViIHJlcG9zaXRvcnk8L2E+LlxuPC9wPlxuXG48cD5cbiAgPHNtYWxsPiogQSBwcm94eSBzZXJ2ZXIgaXMgbmVlZGVkIGZvciBjcm9zcy1vcmlnaW4gcmVxdWVzdHMuPC9zbWFsbD5cbjwvcD5cblxuPHA+XG4gIDxHaXRodWIvPlxuPC9wPlxuXG48Q2hhbmdlcy8+XG5cbjxoMz5GdXR1cmUgRGV2ZWxvcG1lbnQ8L2gzPlxuXG48cD5cbiAgSSBoYXZlIGNlYXNlZCBhY3RpdmVseSBkZXZlbG9waW5nIHRoaXMgdmlld2VyIGJ1dCBzb21ldGltZXMgSSBnZXQgZW50aHVzaWFzdGljIGFuZCBmaWRkbGUgYXJvdW5kIHdpdGggdGhlIGNvZGUuIE9mIGNvdXJzZSBpdCB3aWxsIGJlIGF2YWlsYWJsZSBoZXJlIGFzIGlzLlxuPC9wPlxuPHA+XG4gIEZvciBxdWVzdGlvbnMgYW5kIGNvbW1lbnRzIGZlZWwgZnJlZSB0byBjb250YWN0IG1lIChUb2JpKSB2aWEgZS1tYWlsOiA8YSBocmVmPSdtYWlsdG86JiMxMDk7JiM5NzsmIzEwNTsmIzEwODsmIzQzOyYjMTE0OyYjMTE1OyYjMTE1OyYjNjQ7JiMxMTI7JiM1MTsmIzEwNzsmIzQ2OyYjMTExOyYjMTE0OyYjMTAzOyc+JiMxMDk7JiM5NzsmIzEwNTsmIzEwODsmIzQzOyYjMTE0OyYjMTE1OyYjMTE1OyYjNjQ7JiMxMTI7JiM1MTsmIzEwNzsmIzQ2OyYjMTExOyYjMTE0OyYjMTAzOzwvYT4uXG48L3A+XG5cbjxoMz5MaWNlbnNlPC9oMz5cblxuPHA+XG4gIDxzcGFuIHhtbG5zOmRjdD0naHR0cDovL3B1cmwub3JnL2RjL3Rlcm1zLycgcHJvcGVydHk9J2RjdDp0aXRsZSc+SmF2YVNjcmlwdCBSU1MgQm94IFZpZXdlcjwvc3Bhbj4gYnlcbiAgPGEgeG1sbnM6Y2M9J2h0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIycgaHJlZj0naHR0cDovL3Azay5vcmcvcnNzJyBwcm9wZXJ0eT0nY2M6YXR0cmlidXRpb25OYW1lJyByZWw9J2NjOmF0dHJpYnV0aW9uVVJMJz5Ub2JpIFNjaMOkZmVyPC9hPiBpcyBsaWNlbnNlZCB1bmRlciBhIDxhIHJlbD0nbGljZW5zZScgaHJlZj0naHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL2F0L2RlZWQuZW5fVVMnPkNyZWF0aXZlIENvbW1vbnMgQXR0cmlidXRpb24tU2hhcmVBbGlrZSAzLjAgQXVzdHJpYSBMaWNlbnNlPC9hPi5cbjwvcD5cbjxwPlxuICBCYXNlZCBvbiBhIHdvcmsgYXQgPGEgeG1sbnM6ZGN0PSdodHRwOi8vcHVybC5vcmcvZGMvdGVybXMvJyBocmVmPSdodHRwczovL3Azay5vcmcvc291cmNlL3N2bi9yc3MtYm94L3RydW5rLycgcmVsPSdkY3Q6c291cmNlJz5odHRwczovL3Azay5vcmcvc291cmNlL3N2bi9yc3MtYm94L3RydW5rLzwvYT4uXG48L3A+XG48cD5cbiAgPGEgcmVsPSdsaWNlbnNlJyBocmVmPSdodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvYXQvZGVlZC5lbl9VUyc+XG4gICAgPGltZyBhbHQ9J0NyZWF0aXZlIENvbW1vbnMgTGljZW5zZScgc3R5bGU9J2JvcmRlci13aWR0aDowJyBzcmM9J2h0dHBzOi8vaS5jcmVhdGl2ZWNvbW1vbnMub3JnL2wvYnktc2EvMy4wL2F0Lzg4eDMxLnBuZyc+XG4gIDwvYT5cbjwvcD5cblxuPHNtYWxsPlRoYW5rIHlvdSwgPGEgaHJlZj0naHR0cHM6Ly9wM2sub3JnLyc+cDNrLm9yZzwvYT4hPC9zbWFsbD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpQkUsRUFBRSxjQUFDLENBQUMsQUFDRixPQUFPLENBQUUsWUFBWSxBQUN2QixDQUFDLEFBRUQsRUFBRSxDQUFHLENBQUMsY0FBQyxDQUFDLEFBQ04sVUFBVSxDQUFFLENBQUMsQUFDZixDQUFDLEFBRUQsS0FBSyxjQUFDLENBQUMsQUFDTCxLQUFLLENBQUUsSUFBSSxBQUNiLENBQUMsQUFFRCxRQUFRLGNBQUMsQ0FBQyxBQUNSLFlBQVksQ0FBRSxJQUFJLENBQ2xCLFVBQVUsQ0FBRSxJQUFJLEFBQ2xCLENBQUMifQ== */";
    	append_dev(document_1.head, style);
    }

    function create_fragment$2(ctx) {
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
    	let t43;
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
    	let dispose;
    	const github = new Github({ $$inline: true });
    	const changes = new Changes({ $$inline: true });

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
    			strong.textContent = "Reduced availability due to temporary violation of quota limit.";
    			t8 = text(" You should ");
    			a1 = element("a");
    			a1.textContent = "install your own JSONP proxy";
    			t10 = text(". You can always support the project with your ");
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
    			add_location(a0, file$2, 36, 161, 705);
    			add_location(i0, file$2, 36, 9, 553);
    			attr_dev(small0, "class", "svelte-8mn5ku");
    			add_location(small0, file$2, 36, 2, 546);
    			add_location(div, file$2, 35, 0, 538);
    			add_location(h2, file$2, 39, 0, 779);
    			add_location(strong, file$2, 42, 2, 853);
    			attr_dev(a1, "href", "https://github.com/p3k/json3k");
    			add_location(a1, file$2, 42, 94, 945);
    			attr_dev(a2, "href", "http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer");
    			add_location(a2, file$2, 42, 213, 1064);
    			attr_dev(p0, "class", "msg warning svelte-8mn5ku");
    			add_location(p0, file$2, 41, 0, 827);
    			attr_dev(a3, "href", "http://en.wikipedia.org/wiki/RSS");
    			add_location(a3, file$2, 46, 26, 1181);
    			attr_dev(a4, "href", "http://cyber.law.harvard.edu/rss/examples/sampleRss091.xml");
    			add_location(a4, file$2, 46, 94, 1249);
    			attr_dev(a5, "href", "http://cyber.law.harvard.edu/rss/examples/sampleRss092.xml");
    			add_location(a5, file$2, 46, 191, 1346);
    			attr_dev(a6, "href", "http://rss.orf.at/fm4.xml");
    			add_location(a6, file$2, 46, 288, 1443);
    			attr_dev(a7, "href", "http://blog.p3k.org/stories.xml");
    			add_location(a7, file$2, 46, 354, 1509);
    			attr_dev(a8, "href", "http://essaysfromexodus.scripting.com/xml/scriptingNews2.xml");
    			add_location(a8, file$2, 46, 465, 1620);
    			attr_dev(a9, "href", "https://www.theregister.co.uk/headlines.atom");
    			add_location(a9, file$2, 46, 608, 1763);
    			attr_dev(p1, "class", "svelte-8mn5ku");
    			add_location(p1, file$2, 45, 0, 1151);
    			attr_dev(a10, "href", "http://validator.w3.org/");
    			add_location(a10, file$2, 50, 58, 1918);
    			add_location(i1, file$2, 50, 165, 2025);
    			attr_dev(p2, "class", "svelte-8mn5ku");
    			add_location(p2, file$2, 49, 0, 1856);
    			attr_dev(p3, "class", "svelte-8mn5ku");
    			add_location(p3, file$2, 53, 0, 2048);
    			attr_dev(a11, "href", "https://github.com/p3k/rss-box");
    			add_location(a11, file$2, 58, 167, 2415);
    			attr_dev(p4, "class", "svelte-8mn5ku");
    			add_location(p4, file$2, 57, 0, 2244);
    			attr_dev(small1, "class", "svelte-8mn5ku");
    			add_location(small1, file$2, 62, 2, 2491);
    			attr_dev(p5, "class", "svelte-8mn5ku");
    			add_location(p5, file$2, 61, 0, 2485);
    			attr_dev(p6, "class", "svelte-8mn5ku");
    			add_location(p6, file$2, 65, 0, 2566);
    			attr_dev(h30, "class", "svelte-8mn5ku");
    			add_location(h30, file$2, 71, 0, 2600);
    			attr_dev(p7, "class", "svelte-8mn5ku");
    			add_location(p7, file$2, 73, 0, 2629);
    			attr_dev(a12, "href", "mailto:mail+rss@p3k.org");
    			add_location(a12, file$2, 77, 72, 2871);
    			attr_dev(p8, "class", "svelte-8mn5ku");
    			add_location(p8, file$2, 76, 0, 2795);
    			attr_dev(h31, "class", "svelte-8mn5ku");
    			add_location(h31, file$2, 80, 0, 3083);
    			attr_dev(span, "xmlns:dct", "http://purl.org/dc/terms/");
    			attr_dev(span, "property", "dct:title");
    			add_location(span, file$2, 83, 2, 3107);
    			attr_dev(a13, "xmlns:cc", "http://creativecommons.org/ns#");
    			attr_dev(a13, "href", "http://p3k.org/rss");
    			attr_dev(a13, "property", "cc:attributionName");
    			attr_dev(a13, "rel", "cc:attributionURL");
    			add_location(a13, file$2, 84, 2, 3210);
    			attr_dev(a14, "rel", "license");
    			attr_dev(a14, "href", "http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US");
    			add_location(a14, file$2, 84, 164, 3372);
    			attr_dev(p9, "class", "svelte-8mn5ku");
    			add_location(p9, file$2, 82, 0, 3101);
    			attr_dev(a15, "xmlns:dct", "http://purl.org/dc/terms/");
    			attr_dev(a15, "href", "https://p3k.org/source/svn/rss-box/trunk/");
    			attr_dev(a15, "rel", "dct:source");
    			add_location(a15, file$2, 87, 21, 3551);
    			attr_dev(p10, "class", "svelte-8mn5ku");
    			add_location(p10, file$2, 86, 0, 3526);
    			attr_dev(img, "alt", "Creative Commons License");
    			set_style(img, "border-width", "0");
    			if (img.src !== (img_src_value = "https://i.creativecommons.org/l/by-sa/3.0/at/88x31.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$2, 91, 4, 3805);
    			attr_dev(a16, "rel", "license");
    			attr_dev(a16, "href", "http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US");
    			add_location(a16, file$2, 90, 2, 3716);
    			attr_dev(p11, "class", "svelte-8mn5ku");
    			add_location(p11, file$2, 89, 0, 3710);
    			attr_dev(a17, "href", "https://p3k.org/");
    			add_location(a17, file$2, 95, 18, 3957);
    			attr_dev(small2, "class", "svelte-8mn5ku");
    			add_location(small2, file$2, 95, 0, 3939);

    			dispose = [
    				listen_dev(a4, "click", /*goto*/ ctx[1], false, false, false),
    				listen_dev(a5, "click", /*goto*/ ctx[1], false, false, false),
    				listen_dev(a6, "click", /*goto*/ ctx[1], false, false, false),
    				listen_dev(a7, "click", /*goto*/ ctx[1], false, false, false),
    				listen_dev(a8, "click", /*goto*/ ctx[1], false, false, false),
    				listen_dev(a9, "click", /*goto*/ ctx[1], false, false, false)
    			];
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
    			run_all(dispose);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app, "app");
    	component_subscribe($$self, app, $$value => $$invalidate(0, $app = $$value));
    	let { config } = $$props;

    	function goto() {
    		event.preventDefault();
    		config.set({ url: event.target.href });
    	}

    	app.subscribe(state => document.title = state.description);
    	const writable_props = ["config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("config" in $$props) $$invalidate(2, config = $$props.config);
    	};

    	$$self.$capture_state = () => {
    		return { config, $app };
    	};

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(2, config = $$props.config);
    		if ("$app" in $$props) app.set($app = $$props.$app);
    	};

    	return [$app, goto, config];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document_1.getElementById("svelte-8mn5ku-style")) add_css$1();
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { config: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*config*/ ctx[2] === undefined && !("config" in props)) {
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

    /* components/Ad.html generated by Svelte v3.16.7 */

    const { document: document_1$1 } = globals;
    const file$3 = "components/Ad.html";

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-d7o9dc-style";
    	style.textContent = "ins.svelte-d7o9dc{overflow:hidden;margin-bottom:1em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWQuaHRtbCIsInNvdXJjZXMiOlsiQWQuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICAod2luZG93LmFkc2J5Z29vZ2xlID0gd2luZG93LmFkc2J5Z29vZ2xlIHx8IFtdKS5wdXNoKHt9KTtcblxuICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgc2NyaXB0LnNyYyA9ICdodHRwczovL3BhZ2VhZDIuZ29vZ2xlc3luZGljYXRpb24uY29tL3BhZ2VhZC9qcy9hZHNieWdvb2dsZS5qcyc7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIGlucyB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBtYXJnaW4tYm90dG9tOiAxZW07XG4gIH1cbjwvc3R5bGU+XG5cbjxpbnMgY2xhc3M9J2Fkc2J5Z29vZ2xlJ1xuICAgICBzdHlsZT0nZGlzcGxheTpibG9jaydcbiAgICAgZGF0YS1hZC1jbGllbnQ9J2NhLXB1Yi0zOTY1MDI4MDQzMTUzMTM4J1xuICAgICBkYXRhLWFkLXNsb3Q9JzYzNzAyNTc0NTEnXG4gICAgIGRhdGEtYWQtZm9ybWF0PSdhdXRvJ1xuICAgICBkYXRhLWZ1bGwtd2lkdGgtcmVzcG9uc2l2ZT0ndHJ1ZSc+PC9pbnM+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUUsR0FBRyxjQUFDLENBQUMsQUFDSCxRQUFRLENBQUUsTUFBTSxDQUNoQixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDIn0= */";
    	append_dev(document_1$1.head, style);
    }

    function create_fragment$3(ctx) {
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
    			add_location(ins, file$3, 16, 0, 349);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self) {
    	(window.adsbygoogle = window.adsbygoogle || []).push({});
    	const script = document.createElement("script");
    	script.async = true;
    	script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    	document.head.appendChild(script);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [];
    }

    class Ad extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document_1$1.getElementById("svelte-d7o9dc-style")) add_css$2();
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ad",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* components/LinkIcon.html generated by Svelte v3.16.7 */

    const file$4 = "components/LinkIcon.html";

    function add_css$3() {
    	var style = element("style");
    	style.id = "svelte-mfbc6b-style";
    	style.textContent = "svg.svelte-mfbc6b{width:1.2em;height:1.2em}polygon.svelte-mfbc6b{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0ljb24uaHRtbCIsInNvdXJjZXMiOlsiTGlua0ljb24uaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBjb25zdCBuYW1lc3BhY2UgPSAnc3ZnJztcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIHN2ZyB7XG4gICAgd2lkdGg6IDEuMmVtO1xuICAgIGhlaWdodDogMS4yZW07XG4gIH1cblxuICBwb2x5Z29uIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gICAgZmlsbC1ydWxlOiBldmVub2RkO1xuICAgIGNsaXAtcnVsZTogZXZlbm9kZDtcbiAgfVxuPC9zdHlsZT5cblxuPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpWaXN1YWxFZGl0b3JfLV9JY29uXy1fRXh0ZXJuYWwtbGluay5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDEyIDEyJyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSd4TWluWU1pbic+XG4gIDxnPlxuICAgIDxwb2x5Z29uIHBvaW50cz0nMiwyIDUsMiA1LDMgMywzIDMsOSA5LDkgOSw3IDEwLDcgMTAsMTAgMiwxMCcvPlxuICAgIDxwb2x5Z29uIHBvaW50cz0nNi4yMTEsMiAxMCwyIDEwLDUuNzg5IDguNTc5LDQuMzY4IDYuNDQ3LDYuNSA1LjUsNS41NTMgNy42MzIsMy40MjEnLz5cbiAgPC9nPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0UsR0FBRyxjQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUFLLEFBQ2YsQ0FBQyxBQUVELE9BQU8sY0FBQyxDQUFDLEFBQ1AsSUFBSSxDQUFFLFlBQVksQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQUFDcEIsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function create_fragment$4(ctx) {
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
    			add_location(polygon0, file$4, 20, 4, 402);
    			attr_dev(polygon1, "points", "6.211,2 10,2 10,5.789 8.579,4.368 6.447,6.5 5.5,5.553 7.632,3.421");
    			attr_dev(polygon1, "class", "svelte-mfbc6b");
    			add_location(polygon1, file$4, 21, 4, 470);
    			add_location(g, file$4, 19, 2, 394);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 12 12");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
    			attr_dev(svg, "class", "svelte-mfbc6b");
    			add_location(svg, file$4, 18, 0, 300);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class LinkIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-mfbc6b-style")) add_css$3();
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LinkIcon",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* components/RssIcon.html generated by Svelte v3.16.7 */

    const file$5 = "components/RssIcon.html";

    function add_css$4() {
    	var style = element("style");
    	style.id = "svelte-ibnekz-style";
    	style.textContent = "svg.svelte-ibnekz{width:1em;height:1em}path.svelte-ibnekz{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnNzSWNvbi5odG1sIiwic291cmNlcyI6WyJSc3NJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgY29uc3QgbmFtZXNwYWNlID0gJ3N2Zyc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxZW07XG4gICAgaGVpZ2h0OiAxZW07XG4gIH1cblxuICBwYXRoIHtcbiAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gIH1cbjwvc3R5bGU+XG5cbjwhLS0gU291cmNlOiBodHRwczovL2NvbW1vbnMud2lraW1lZGlhLm9yZy93aWtpL0ZpbGU6UnNzX2ZvbnRfYXdlc29tZS5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAtMjU2IDE3OTIgMTc5MicgcHJlc2VydmVBc3BlY3RSYXRpbz0neE1pbllNaW4nPlxuICA8ZyB0cmFuc2Zvcm09J21hdHJpeCgxLDAsMCwtMSwyMTIuNjEwMTcsMTM0Ni4xNjk1KSc+XG4gICAgPHBhdGggZD0nTSAzODQsMTkyIFEgMzg0LDExMiAzMjgsNTYgMjcyLDAgMTkyLDAgMTEyLDAgNTYsNTYgMCwxMTIgMCwxOTIgcSAwLDgwIDU2LDEzNiA1Niw1NiAxMzYsNTYgODAsMCAxMzYsLTU2IDU2LC01NiA1NiwtMTM2IHogTSA4OTYsNjkgUSA4OTgsNDEgODc5LDIxIDg2MSwwIDgzMiwwIEggNjk3IFEgNjcyLDAgNjU0LDE2LjUgNjM2LDMzIDYzNCw1OCA2MTIsMjg3IDQ0OS41LDQ0OS41IDI4Nyw2MTIgNTgsNjM0IDMzLDYzNiAxNi41LDY1NCAwLDY3MiAwLDY5NyB2IDEzNSBxIDAsMjkgMjEsNDcgMTcsMTcgNDMsMTcgaCA1IFEgMjI5LDg4MyAzNzUsODE1LjUgNTIxLDc0OCA2MzQsNjM0IDc0OCw1MjEgODE1LjUsMzc1IDg4MywyMjkgODk2LDY5IHogbSA1MTIsLTIgUSAxNDEwLDQwIDEzOTAsMjAgMTM3MiwwIDEzNDQsMCBIIDEyMDEgUSAxMTc1LDAgMTE1Ni41LDE3LjUgMTEzOCwzNSAxMTM3LDYwIDExMjUsMjc1IDEwMzYsNDY4LjUgOTQ3LDY2MiA4MDQuNSw4MDQuNSA2NjIsOTQ3IDQ2OC41LDEwMzYgMjc1LDExMjUgNjAsMTEzOCAzNSwxMTM5IDE3LjUsMTE1Ny41IDAsMTE3NiAwLDEyMDEgdiAxNDMgcSAwLDI4IDIwLDQ2IDE4LDE4IDQ0LDE4IGggMyBRIDMyOSwxMzk1IDU2OC41LDEyODggODA4LDExODEgOTk0LDk5NCAxMTgxLDgwOCAxMjg4LDU2OC41IDEzOTUsMzI5IDE0MDgsNjcgeicvPlxuICA8L2c+XG48L3N2Zz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLRSxHQUFHLGNBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEdBQUcsQUFDYixDQUFDLEFBRUQsSUFBSSxjQUFDLENBQUMsQUFDSixJQUFJLENBQUUsWUFBWSxBQUNwQixDQUFDIn0= */";
    	append_dev(document.head, style);
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
    			add_location(path, file$5, 18, 4, 384);
    			attr_dev(g, "transform", "matrix(1,0,0,-1,212.61017,1346.1695)");
    			add_location(g, file$5, 17, 2, 327);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 -256 1792 1792");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
    			attr_dev(svg, "class", "svelte-ibnekz");
    			add_location(svg, file$5, 16, 0, 226);
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

    class RssIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-ibnekz-style")) add_css$4();
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RssIcon",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* components/PaperclipIcon.html generated by Svelte v3.16.7 */

    const file$6 = "components/PaperclipIcon.html";

    function add_css$5() {
    	var style = element("style");
    	style.id = "svelte-1bdkb67-style";
    	style.textContent = "svg.svelte-1bdkb67{width:1.2em;height:1.2em}path.svelte-1bdkb67{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFwZXJjbGlwSWNvbi5odG1sIiwic291cmNlcyI6WyJQYXBlcmNsaXBJY29uLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgY29uc3QgbmFtZXNwYWNlID0gJ3N2Zyc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxLjJlbTtcbiAgICBoZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG48IS0tIFNvdXJjZTogaHR0cHM6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9GaWxlOkFudHVfYXBwbGljYXRpb24tcnRmLnN2ZyAtLT5cbjxzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB2aWV3Qm94PScwIDAgMTYgMTYnIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPHBhdGggZD0nbTQwOSA1MzFsLTUuMjQ0IDYuNzMzYy0uOTgzIDEuMjYyLS43MDggMy41MTEuNTUgNC40OTcgMS4yNTkuOTg2IDMuNS43MSA0LjQ4NC0uNTUybDUuMjQ0LTYuNzMzLjY1NS0uODQyYy42NTYtLjg0Mi40NzItMi4zNDEtLjM2Ny0yLjk5OC0uODM5LS42NTgtMi4zMzQtLjQ3My0yLjk4OS4zNjhsLS42NTYuODQyLTMuOTMzIDUuMDUtLjY1Ni44NDJjLS4zMjguNDIxLS4yMzYgMS4xNy4xODMgMS40OTkuNDIuMzI5IDEuMTY3LjIzNyAxLjQ5NS0uMTg0bDQuNTg5LTUuODkxLjgzOS42NTgtNC41ODkgNS44OTFjLS42NTYuODQyLTIuMTUgMS4wMjYtMi45ODkuMzY4LS44MzktLjY1OC0xLjAyMy0yLjE1Ny0uMzY3LTIuOTk4bC42NTYtLjg0MiA0LjU4OS01Ljg5MWMuOTgzLTEuMjYyIDMuMjI1LTEuNTM4IDQuNDg0LS41NTIgMS4yNTkuOTg2IDEuNTM0IDMuMjM1LjU1MSA0LjQ5N2wtLjY1Ni44NDItNS4yNDQgNi43MzNjLTEuMzExIDEuNjgzLTQuMyAyLjA1MS01Ljk3OC43MzYtMS42NzgtMS4zMTUtMi4wNDUtNC4zMTMtLjczNC01Ljk5N2w1LjI0NC02LjczMy44MzkuNjU4JyB0cmFuc2Zvcm09J21hdHJpeCguODQ3ODIgMCAwIC44NDUyMS0zMzguODUtNDQ1LjY4KScgc3Ryb2tlPSdub25lJy8+XG48L3N2Zz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLRSxHQUFHLGVBQUMsQ0FBQyxBQUNILEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLEtBQUssQUFDZixDQUFDLEFBRUQsSUFBSSxlQUFDLENBQUMsQUFDSixJQUFJLENBQUUsWUFBWSxBQUNwQixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    function create_fragment$6(ctx) {
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
    			add_location(path, file$6, 17, 2, 328);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin");
    			attr_dev(svg, "class", "svelte-1bdkb67");
    			add_location(svg, file$6, 16, 0, 234);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class PaperclipIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1bdkb67-style")) add_css$5();
    		init(this, options, null, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaperclipIcon",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* components/Box.html generated by Svelte v3.16.7 */

    const { document: document_1$2 } = globals;
    const file$7 = "components/Box.html";

    function add_css$6() {
    	var style = element("style");
    	style.id = "svelte-1rjx8bp-style";
    	style.textContent = ".rssbox.svelte-1rjx8bp.svelte-1rjx8bp{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon.svelte-1rjx8bp.svelte-1rjx8bp{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar.svelte-1rjx8bp.svelte-1rjx8bp{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date.svelte-1rjx8bp.svelte-1rjx8bp{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content.svelte-1rjx8bp.svelte-1rjx8bp{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content.svelte-1rjx8bp aside.svelte-1rjx8bp{clear:both;float:right}.rssbox-content.svelte-1rjx8bp aside a.svelte-1rjx8bp{display:block;margin-left:0.5em}.rssbox-image.svelte-1rjx8bp.svelte-1rjx8bp{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold.svelte-1rjx8bp.svelte-1rjx8bp{font-weight:bold}.rssbox-enclosure.svelte-1rjx8bp.svelte-1rjx8bp,.rssbox-source.svelte-1rjx8bp.svelte-1rjx8bp{display:block;width:1em}.rssbox-form.svelte-1rjx8bp.svelte-1rjx8bp{margin-bottom:0.8em}.rssbox-form.svelte-1rjx8bp input.svelte-1rjx8bp{padding:0.5em;background-color:#fff}.rssbox-promo.svelte-1rjx8bp.svelte-1rjx8bp{text-align:right;font-size:0.7em;letter-spacing:0.01em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94Lmh0bWwiLCJzb3VyY2VzIjpbIkJveC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuICBpbXBvcnQgeyB1cmxzIH0gZnJvbSAnLi4vc3JjL3VybHMnO1xuXG4gIGltcG9ydCBMaW5rSWNvbiBmcm9tICcuL0xpbmtJY29uLmh0bWwnO1xuICBpbXBvcnQgUnNzSWNvbiBmcm9tICcuL1Jzc0ljb24uaHRtbCc7XG4gIGltcG9ydCBQYXBlcmNsaXBJY29uIGZyb20gJy4vUGFwZXJjbGlwSWNvbi5odG1sJztcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGZlZWQ7XG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRpY0lkID0gJ3Jzc2JveC1zdGF0aWMtc3R5bGVzaGVldCc7XG4gICAgY29uc3QgZHluYW1pY0lkID0gJ3Jzc2JveC1keW5hbWljLXN0eWxlc2hlZXQnO1xuXG4gICAgbGV0IHN0YXRpY0NzcyA9IHdpbmRvd1tzdGF0aWNJZF07XG4gICAgbGV0IGR5bmFtaWNDc3MgPSB3aW5kb3dbZHluYW1pY0lkXTtcblxuICAgIGlmICghc3RhdGljQ3NzKSB7XG4gICAgICBzdGF0aWNDc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgICBzdGF0aWNDc3MuaWQgPSBzdGF0aWNJZDtcbiAgICAgIHN0YXRpY0Nzcy5yZWwgPSAnc3R5bGVzaGVldCc7XG4gICAgICBzdGF0aWNDc3MuaHJlZiA9IHVybHMuYXBwICsgJy9ib3guY3NzJztcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3RhdGljQ3NzKTtcbiAgICB9XG5cbiAgICBpZiAoIWR5bmFtaWNDc3MpIHtcbiAgICAgIGR5bmFtaWNDc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgZHluYW1pY0Nzcy5pZCA9IGR5bmFtaWNJZDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZHluYW1pY0Nzcyk7XG4gICAgfVxuXG4gICAgY29uZmlnLnN1YnNjcmliZShzdGF0ZSA9PiB7XG4gICAgICBjb25zdCBjb2xvciA9IHN0YXRlLmxpbmtDb2xvcjtcblxuICAgICAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gICAgICBsZXQgcnVsZSA9XG4gICAgICAgIGAucnNzYm94W2RhdGEtbGluay1jb2xvcj1cIiR7IGNvbG9yIH1cIl0gYSB7XG4gICAgICAgICAgY29sb3I6ICR7IGNvbG9yIH07XG4gICAgICAgIH1gO1xuXG4gICAgICBpZiAoZHluYW1pY0Nzcy5pbm5lckhUTUwuaW5kZXhPZihydWxlKSA8IDApIGR5bmFtaWNDc3MuaW5uZXJIVE1MICs9IHJ1bGU7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGtiKGJ5dGVzKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIDEwMDApLnRvRml4ZWQoMikgKyAnXFx1MjAwYWtCJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWQoZGF0YSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgbWF4V2lkdGggPSBNYXRoLm1pbigxMDAsIGltYWdlLndpZHRoKTtcbiAgICAgICAgY29uc3QgZmFjdG9yID0gaW1hZ2Uud2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIC8gaW1hZ2Uud2lkdGggOiAxO1xuXG4gICAgICAgIGZ1bGZpbGwoe1xuICAgICAgICAgIHdpZHRoOiAoaW1hZ2Uud2lkdGggKiBmYWN0b3IpICsgJ3B4JyxcbiAgICAgICAgICBoZWlnaHQ6IChpbWFnZS5oZWlnaHQgKiBmYWN0b3IpICsgJ3B4J1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGltYWdlLnNyYyA9IGRhdGEuc291cmNlO1xuICAgIH0pO1xuICB9XG5cbiAgJDogaGVpZ2h0ID0gJGNvbmZpZy5oZWlnaHQgJiYgJGNvbmZpZy5oZWlnaHQgPiAtMSA/ICRjb25maWcuaGVpZ2h0ICsgJ3B4JyA6ICcxMDAlJztcbiAgJDogd2lkdGggPSAkY29uZmlnLndpZHRoID8gJGNvbmZpZy53aWR0aCArICdweCcgOiAnMTAwJSc7XG4gICQ6IGl0ZW1UaXRsZUNsYXNzID0gISRjb25maWcuY29tcGFjdCA/ICdib2xkJyA6ICcnO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLnJzc2JveCB7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjMDAwO1xuICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDA7XG4gIH1cblxuICAucnNzYm94LWljb24ge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICB3aWR0aDogMWVtO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtdGl0bGViYXIge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGNvbG9yOiAjMDAwO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNhZGQ4ZTY7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICMwMDA7XG4gICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZGF0ZSB7XG4gICAgbWFyZ2luLXRvcDogMC4yZW07XG4gICAgZm9udC1zaXplOiAwLjhlbTtcbiAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IHtcbiAgICBoZWlnaHQ6IGF1dG87XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgICBjbGVhcjogYm90aDtcbiAgICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgfVxuXG4gIC5yc3Nib3gtY29udGVudCBhc2lkZSB7XG4gICAgY2xlYXI6IGJvdGg7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IGFzaWRlIGEge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG1hcmdpbi1sZWZ0OiAwLjVlbTtcbiAgfVxuXG4gIC5yc3Nib3gtaW1hZ2Uge1xuICAgIGZsb2F0OiByaWdodDtcbiAgICBtYXJnaW46IDAgMCAwLjVlbSAwLjVlbTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBsZWZ0IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcbiAgfVxuXG4gIC5yc3Nib3gtaXRlbS10aXRsZS5ib2xkIHtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxuXG4gIC5yc3Nib3gtZW5jbG9zdXJlLCAucnNzYm94LXNvdXJjZSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDFlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZm9ybSB7XG4gICAgbWFyZ2luLWJvdHRvbTogMC44ZW07XG4gIH1cblxuICAucnNzYm94LWZvcm0gaW5wdXQge1xuICAgIHBhZGRpbmc6IDAuNWVtO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIH1cblxuICAucnNzYm94LXByb21vIHtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjAxZW07XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgZGF0YS1saW5rLWNvbG9yPSd7ICRjb25maWcubGlua0NvbG9yIH0nIGNsYXNzPSdyc3Nib3ggcnNzQm94JyBzdHlsZT0nbWF4LXdpZHRoOiB7IHdpZHRoIH07IGJvcmRlci1jb2xvcjogeyAkY29uZmlnLmZyYW1lQ29sb3IgfTsgYm9yZGVyLXJhZGl1czogeyAkY29uZmlnLnJhZGl1cyB9cHg7IGZvbnQ6IHsgJGNvbmZpZy5mb250RmFjZSB9OyBmbG9hdDogeyAkY29uZmlnLmFsaWduIH07Jz5cbiAgeyAjaWYgISRjb25maWcuaGVhZGxlc3MgfVxuICAgIDxkaXYgY2xhc3M9J3Jzc2JveC10aXRsZWJhcicgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfTsgYmFja2dyb3VuZC1jb2xvcjogeyAkY29uZmlnLnRpdGxlQmFyQ29sb3IgfTsgYm9yZGVyLWJvdHRvbS1jb2xvcjogeyAkY29uZmlnLmZyYW1lQ29sb3IgfTsnPlxuICAgICAgeyAjaWYgJGNvbmZpZy5zaG93WG1sQnV0dG9uIH1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWljb24nPlxuICAgICAgICAgIDxhIGhyZWY9J3sgJGNvbmZpZy51cmwgfScgdGl0bGU9J3sgJGZlZWQuZm9ybWF0IH0geyAkZmVlZC52ZXJzaW9uIH0nIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRpdGxlQmFyVGV4dENvbG9yIH0nPlxuICAgICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgPC9kaXY+XG4gICAgICB7IC9pZiB9XG4gICAgICA8ZGl2PlxuICAgICAgICA8YSBocmVmPSd7ICRmZWVkLmxpbmsgfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfTsnPlxuICAgICAgICAgIHsgJGZlZWQudGl0bGUgfVxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1kYXRlJz5cbiAgICAgICAgeyBmZWVkLmZvcm1hdERhdGUoJGZlZWQuZGF0ZSkgfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIHsgL2lmIH1cblxuICA8ZGl2IGNsYXNzPSdyc3Nib3gtY29udGVudCByc3NCb3hDb250ZW50JyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjogeyAkY29uZmlnLmJveEZpbGxDb2xvciB9OyBoZWlnaHQ6IHsgaGVpZ2h0IH07Jz5cbiAgICB7ICNpZiAkZmVlZC5pbWFnZSAmJiAhJGNvbmZpZy5jb21wYWN0IH1cbiAgICAgIHsgI2F3YWl0IGxvYWQoJGZlZWQuaW1hZ2UpIHRoZW4gaW1hZ2UgfVxuICAgICAgICA8YSBocmVmPSd7ICRmZWVkLmltYWdlLmxpbmsgfScgdGl0bGU9J3sgJGZlZWQuaW1hZ2UudGl0bGUgfSc+XG4gICAgICAgICAgPGRpdiBhbHQ9J3sgJGZlZWQuaW1hZ2UuZGVzY3JpcHRpb24gfScgY2xhc3M9J3Jzc2JveC1pbWFnZScgc3R5bGU9J2JhY2tncm91bmQtaW1hZ2U6IHVybCh7ICRmZWVkLmltYWdlLnNvdXJjZSB9KTsgd2lkdGg6IHsgaW1hZ2Uud2lkdGggfTsgaGVpZ2h0OiB7IGltYWdlLmhlaWdodCB9Oyc+PC9kaXY+XG4gICAgICAgIDwvYT5cbiAgICAgIHsgL2F3YWl0IH1cbiAgICB7IC9pZiB9XG5cbiAgICB7ICNlYWNoICRmZWVkLml0ZW1zIGFzIGl0ZW0sIGluZGV4IH1cbiAgICAgIHsgI2lmIGluZGV4IDwgJGNvbmZpZy5tYXhJdGVtcyB9XG4gICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLWNvbnRlbnQgcnNzQm94SXRlbUNvbnRlbnQnIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRleHRDb2xvciB9Jz5cbiAgICAgICAgICB7ICNpZiBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1pdGVtLXRpdGxlIHsgaXRlbVRpdGxlQ2xhc3MgfSc+XG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0ubGluayB9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0neyBpdGVtLmxpbmsgfSc+XG4gICAgICAgICAgICAgICAgICB7QGh0bWwgaXRlbS50aXRsZSB9XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICAgICAgICB7QGh0bWwgaXRlbS50aXRsZSB9XG4gICAgICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHsgL2lmIH1cblxuICAgICAgICAgIHsgI2lmICEkY29uZmlnLmNvbXBhY3QgfVxuICAgICAgICAgICAgPGFzaWRlPlxuICAgICAgICAgICAgICB7ICNpZiBpdGVtLnNvdXJjZSB9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj0neyBpdGVtLnNvdXJjZS51cmwgfScgdGl0bGU9J3sgaXRlbS5zb3VyY2UudGl0bGUgfScgY2xhc3M9J3Jzc2JveC1zb3VyY2UnPlxuICAgICAgICAgICAgICAgICAgeyAjaWYgaXRlbS5zb3VyY2UudXJsLmVuZHNXaXRoKCcueG1sJykgfVxuICAgICAgICAgICAgICAgICAgICA8UnNzSWNvbi8+XG4gICAgICAgICAgICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICAgICAgICAgICAgPExpbmtJY29uLz5cbiAgICAgICAgICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIHsgL2lmIH1cblxuICAgICAgICAgICAgICB7ICNpZiBpdGVtLmVuY2xvc3VyZXMgfVxuICAgICAgICAgICAgICAgIHsgI2VhY2ggaXRlbS5lbmNsb3N1cmVzIGFzIGVuY2xvc3VyZSB9XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPSd7IGVuY2xvc3VyZS51cmwgfScgdGl0bGU9J3sga2IoZW5jbG9zdXJlLmxlbmd0aCkgfSB7IGVuY2xvc3VyZS50eXBlIH0nIGNsYXNzPSdyc3Nib3gtZW5jbG9zdXJlJz5cbiAgICAgICAgICAgICAgICAgICAgPFBhcGVyY2xpcEljb24vPlxuICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIHsgL2VhY2ggfVxuICAgICAgICAgICAgICB7IC9pZiB9XG4gICAgICAgICAgICA8L2FzaWRlPlxuICAgICAgICAgICAge0BodG1sIGl0ZW0uZGVzY3JpcHRpb24gfVxuICAgICAgICAgIHsgL2lmIH1cbiAgICAgICAgPC9kaXY+XG4gICAgICB7IC9pZiB9XG4gICAgeyAvZWFjaCB9XG5cbiAgICB7ICNpZiAkZmVlZC5pbnB1dCB9XG4gICAgICA8Zm9ybSBjbGFzcz0ncnNzYm94LWZvcm0nIG1ldGhvZD0nZ2V0JyBhY3Rpb249J3sgJGZlZWQuaW5wdXQubGluayB9Jz5cbiAgICAgICAgPGlucHV0IHR5cGU9J3RleHQnIG5hbWU9J3sgJGZlZWQuaW5wdXQubmFtZSB9JyBwbGFjZWhvbGRlcj0nRW50ZXIgc2VhcmNoICZhbXA7IGhpdCByZXR1cm7igKYnIGRhdGEtcGxhY2Vob2xkZXI9J3sgJGZlZWQuaW5wdXQuZGVzY3JpcHRpb24gfSc+XG4gICAgICA8L2Zvcm0+XG4gICAgeyAvaWYgfVxuICAgIDxkaXYgY2xhc3M9J3Jzc2JveC1wcm9tbyByc3NCb3hQcm9tbyc+XG4gICAgICA8YSBocmVmPSd7IHVybHMuYXBwIH0nIHN0eWxlPSdjb2xvcjogeyAkY29uZmlnLnRleHRDb2xvciB9Jz5SU1MgQm94IGJ5IHAzay5vcmc8L2E+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBMkVFLE9BQU8sOEJBQUMsQ0FBQyxBQUNQLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUN0QixXQUFXLENBQUUsVUFBVSxDQUN2QixRQUFRLENBQUUsTUFBTSxDQUNoQixhQUFhLENBQUUsQ0FBQyxDQUNoQixrQkFBa0IsQ0FBRSxDQUFDLEFBQ3ZCLENBQUMsQUFFRCxZQUFZLDhCQUFDLENBQUMsQUFDWixLQUFLLENBQUUsS0FBSyxDQUNaLEtBQUssQ0FBRSxHQUFHLENBQ1YsV0FBVyxDQUFFLEtBQUssQUFDcEIsQ0FBQyxBQUVELGdCQUFnQiw4QkFBQyxDQUFDLEFBQ2hCLE9BQU8sQ0FBRSxLQUFLLENBQ2QsS0FBSyxDQUFFLElBQUksQ0FDWCxnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLGFBQWEsQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDN0IsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQUFDeEIsQ0FBQyxBQUVELFlBQVksOEJBQUMsQ0FBQyxBQUNaLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxNQUFNLEFBQ3JCLENBQUMsQUFFRCxlQUFlLDhCQUFDLENBQUMsQUFDZixNQUFNLENBQUUsSUFBSSxDQUNaLE9BQU8sQ0FBRSxLQUFLLENBQ2QsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsZ0JBQWdCLENBQUUsSUFBSSxDQUN0QixLQUFLLENBQUUsSUFBSSxDQUNYLGtCQUFrQixDQUFFLHdCQUF3QixBQUM5QyxDQUFDLEFBRUQsOEJBQWUsQ0FBQyxLQUFLLGVBQUMsQ0FBQyxBQUNyQixLQUFLLENBQUUsSUFBSSxDQUNYLEtBQUssQ0FBRSxLQUFLLEFBQ2QsQ0FBQyxBQUVELDhCQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsZUFBQyxDQUFDLEFBQ3ZCLE9BQU8sQ0FBRSxLQUFLLENBQ2QsV0FBVyxDQUFFLEtBQUssQUFDcEIsQ0FBQyxBQUVELGFBQWEsOEJBQUMsQ0FBQyxBQUNiLEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FDdkIsbUJBQW1CLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FDaEMsaUJBQWlCLENBQUUsU0FBUyxDQUM1QixlQUFlLENBQUUsT0FBTyxBQUMxQixDQUFDLEFBRUQsa0JBQWtCLEtBQUssOEJBQUMsQ0FBQyxBQUN2QixXQUFXLENBQUUsSUFBSSxBQUNuQixDQUFDLEFBRUQsK0NBQWlCLENBQUUsY0FBYyw4QkFBQyxDQUFDLEFBQ2pDLE9BQU8sQ0FBRSxLQUFLLENBQ2QsS0FBSyxDQUFFLEdBQUcsQUFDWixDQUFDLEFBRUQsWUFBWSw4QkFBQyxDQUFDLEFBQ1osYUFBYSxDQUFFLEtBQUssQUFDdEIsQ0FBQyxBQUVELDJCQUFZLENBQUMsS0FBSyxlQUFDLENBQUMsQUFDbEIsT0FBTyxDQUFFLEtBQUssQ0FDZCxnQkFBZ0IsQ0FBRSxJQUFJLEFBQ3hCLENBQUMsQUFFRCxhQUFhLDhCQUFDLENBQUMsQUFDYixVQUFVLENBQUUsS0FBSyxDQUNqQixTQUFTLENBQUUsS0FBSyxDQUNoQixjQUFjLENBQUUsTUFBTSxBQUN4QixDQUFDIn0= */";
    	append_dev(document_1$2.head, style);
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
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
    	let if_block = /*$config*/ ctx[3].showXmlButton && create_if_block_10(ctx);

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
    			set_style(a, "color", /*$config*/ ctx[3].titleBarTextColor);
    			add_location(a, file$7, 170, 8, 4052);
    			add_location(div0, file$7, 169, 6, 4038);
    			attr_dev(div1, "class", "rssbox-date svelte-1rjx8bp");
    			add_location(div1, file$7, 174, 6, 4182);
    			attr_dev(div2, "class", "rssbox-titlebar svelte-1rjx8bp");
    			set_style(div2, "color", /*$config*/ ctx[3].titleBarTextColor);
    			set_style(div2, "background-color", /*$config*/ ctx[3].titleBarColor);
    			set_style(div2, "border-bottom-color", /*$config*/ ctx[3].frameColor);
    			add_location(div2, file$7, 161, 4, 3604);
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
    			if (/*$config*/ ctx[3].showXmlButton) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
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

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(a, "color", /*$config*/ ctx[3].titleBarTextColor);
    			}

    			if ((!current || dirty & /*feed, $feed*/ 65) && t3_value !== (t3_value = /*feed*/ ctx[0].formatDate(/*$feed*/ ctx[6].date) + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "color", /*$config*/ ctx[3].titleBarTextColor);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "background-color", /*$config*/ ctx[3].titleBarColor);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "border-bottom-color", /*$config*/ ctx[3].frameColor);
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
    	let a_href_value;
    	let a_title_value;
    	let current;
    	const rssicon = new RssIcon({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			create_component(rssicon.$$.fragment);
    			attr_dev(a, "href", a_href_value = /*$config*/ ctx[3].url);
    			attr_dev(a, "title", a_title_value = "" + (/*$feed*/ ctx[6].format + " " + /*$feed*/ ctx[6].version));
    			set_style(a, "color", /*$config*/ ctx[3].titleBarTextColor);
    			add_location(a, file$7, 164, 10, 3850);
    			attr_dev(div, "class", "rssbox-icon svelte-1rjx8bp");
    			add_location(div, file$7, 163, 8, 3814);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			mount_component(rssicon, a, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$config*/ 8 && a_href_value !== (a_href_value = /*$config*/ ctx[3].url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (!current || dirty & /*$feed*/ 64 && a_title_value !== (a_title_value = "" + (/*$feed*/ ctx[6].format + " " + /*$feed*/ ctx[6].version))) {
    				attr_dev(a, "title", a_title_value);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(a, "color", /*$config*/ ctx[3].titleBarTextColor);
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
    				const child_ctx = ctx.slice();
    				child_ctx[13] = info.resolved;
    				info.block.p(child_ctx, dirty);
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
    			add_location(div, file$7, 184, 10, 4570);
    			attr_dev(a, "href", a_href_value = /*$feed*/ ctx[6].image.link);
    			attr_dev(a, "title", a_title_value = /*$feed*/ ctx[6].image.title);
    			attr_dev(a, "class", "svelte-1rjx8bp");
    			add_location(a, file$7, 183, 8, 4498);
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
    	let if_block1 = !/*$config*/ ctx[3].compact && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "rssbox-item-content rssBoxItemContent");
    			set_style(div, "color", /*$config*/ ctx[3].textColor);
    			add_location(div, file$7, 191, 8, 4873);
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

    			if (!/*$config*/ ctx[3].compact) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
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

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div, "color", /*$config*/ ctx[3].textColor);
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
    			attr_dev(div, "class", div_class_value = "rssbox-item-title " + /*itemTitleClass*/ ctx[5] + " svelte-1rjx8bp");
    			add_location(div, file$7, 193, 12, 5003);
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

    			if (dirty & /*itemTitleClass*/ 32 && div_class_value !== (div_class_value = "rssbox-item-title " + /*itemTitleClass*/ ctx[5] + " svelte-1rjx8bp")) {
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

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(raw_value, null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$feed*/ 64 && raw_value !== (raw_value = /*item*/ ctx[7].title + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
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
    			add_location(a, file$7, 195, 16, 5102);
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
    			attr_dev(aside, "class", "svelte-1rjx8bp");
    			add_location(aside, file$7, 205, 12, 5353);
    			html_tag = new HtmlTag(raw_value, null);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			if (if_block0) if_block0.m(aside, null);
    			append_dev(aside, t0);
    			if (if_block1) if_block1.m(aside, null);
    			insert_dev(target, t1, anchor);
    			html_tag.m(target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*item*/ ctx[7].source) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
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
    					transition_in(if_block1, 1);
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
    			add_location(a, file$7, 207, 16, 5411);
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
    	let current;
    	const linkicon = new LinkIcon({ $$inline: true });

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

    // (209:18) { #if item.source.url.endsWith('.xml') }
    function create_if_block_5(ctx) {
    	let current;
    	const rssicon = new RssIcon({ $$inline: true });

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
    		source: "(209:18) { #if item.source.url.endsWith('.xml') }",
    		ctx
    	});

    	return block;
    }

    // (217:14) { #if item.enclosures }
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*item*/ ctx[7].enclosures;
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
    	let t;
    	let a_href_value;
    	let a_title_value;
    	let current;
    	const paperclipicon = new PaperclipIcon({ $$inline: true });

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(paperclipicon.$$.fragment);
    			t = space();
    			attr_dev(a, "href", a_href_value = /*enclosure*/ ctx[10].url);
    			attr_dev(a, "title", a_title_value = "" + (kb(/*enclosure*/ ctx[10].length) + " " + /*enclosure*/ ctx[10].type));
    			attr_dev(a, "class", "rssbox-enclosure svelte-1rjx8bp");
    			add_location(a, file$7, 218, 18, 5825);
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
    	let if_block = /*index*/ ctx[9] < /*$config*/ ctx[3].maxItems && create_if_block_1(ctx);

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
    			if (/*index*/ ctx[9] < /*$config*/ ctx[3].maxItems) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
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
    			add_location(input, file$7, 232, 8, 6268);
    			attr_dev(form, "class", "rssbox-form svelte-1rjx8bp");
    			attr_dev(form, "method", "get");
    			attr_dev(form, "action", form_action_value = /*$feed*/ ctx[6].input.link);
    			add_location(form, file$7, 231, 6, 6190);
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

    function create_fragment$7(ctx) {
    	let div2;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let a;
    	let t4;
    	let a_href_value;
    	let div2_data_link_color_value;
    	let current;
    	let if_block0 = !/*$config*/ ctx[3].headless && create_if_block_9(ctx);
    	let if_block1 = /*$feed*/ ctx[6].image && !/*$config*/ ctx[3].compact && create_if_block_8(ctx);
    	let each_value = /*$feed*/ ctx[6].items;
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
    			attr_dev(a, "href", a_href_value = urls$1.app);
    			set_style(a, "color", /*$config*/ ctx[3].textColor);
    			attr_dev(a, "class", "svelte-1rjx8bp");
    			add_location(a, file$7, 236, 6, 6483);
    			attr_dev(div0, "class", "rssbox-promo rssBoxPromo svelte-1rjx8bp");
    			add_location(div0, file$7, 235, 4, 6438);
    			attr_dev(div1, "class", "rssbox-content rssBoxContent svelte-1rjx8bp");
    			set_style(div1, "background-color", /*$config*/ ctx[3].boxFillColor);
    			set_style(div1, "height", /*height*/ ctx[2]);
    			add_location(div1, file$7, 180, 2, 4285);
    			attr_dev(div2, "data-link-color", div2_data_link_color_value = /*$config*/ ctx[3].linkColor);
    			attr_dev(div2, "class", "rssbox rssBox svelte-1rjx8bp");
    			set_style(div2, "max-width", /*width*/ ctx[4]);
    			set_style(div2, "border-color", /*$config*/ ctx[3].frameColor);
    			set_style(div2, "border-radius", /*$config*/ ctx[3].radius + "px");
    			set_style(div2, "font", /*$config*/ ctx[3].fontFace);
    			set_style(div2, "float", /*$config*/ ctx[3].align);
    			add_location(div2, file$7, 159, 0, 3345);
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
    			if (!/*$config*/ ctx[3].headless) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
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

    			if (/*$feed*/ ctx[6].image && !/*$config*/ ctx[3].compact) {
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

    			if (dirty & /*$config, $feed, kb, itemTitleClass*/ 104) {
    				each_value = /*$feed*/ ctx[6].items;
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

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(a, "color", /*$config*/ ctx[3].textColor);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div1, "background-color", /*$config*/ ctx[3].boxFillColor);
    			}

    			if (!current || dirty & /*height*/ 4) {
    				set_style(div1, "height", /*height*/ ctx[2]);
    			}

    			if (!current || dirty & /*$config*/ 8 && div2_data_link_color_value !== (div2_data_link_color_value = /*$config*/ ctx[3].linkColor)) {
    				attr_dev(div2, "data-link-color", div2_data_link_color_value);
    			}

    			if (!current || dirty & /*width*/ 16) {
    				set_style(div2, "max-width", /*width*/ ctx[4]);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "border-color", /*$config*/ ctx[3].frameColor);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "border-radius", /*$config*/ ctx[3].radius + "px");
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "font", /*$config*/ ctx[3].fontFace);
    			}

    			if (!current || dirty & /*$config*/ 8) {
    				set_style(div2, "float", /*$config*/ ctx[3].align);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function kb(bytes) {
    	return (bytes / 1000).toFixed(2) + " kB";
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
    	let $config,
    		$$unsubscribe_config = noop,
    		$$subscribe_config = () => ($$unsubscribe_config(), $$unsubscribe_config = subscribe(config, $$value => $$invalidate(3, $config = $$value)), config);

    	let $feed,
    		$$unsubscribe_feed = noop,
    		$$subscribe_feed = () => ($$unsubscribe_feed(), $$unsubscribe_feed = subscribe(feed, $$value => $$invalidate(6, $feed = $$value)), feed);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_config());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_feed());
    	let { feed } = $$props;
    	validate_store(feed, "feed");
    	$$subscribe_feed();
    	let { config } = $$props;
    	validate_store(config, "config");
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
    			staticCss.href = urls$1.app + "/box.css";
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

    	const writable_props = ["feed", "config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("feed" in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ("config" in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
    	};

    	$$self.$capture_state = () => {
    		return {
    			feed,
    			config,
    			height,
    			$config,
    			width,
    			itemTitleClass,
    			$feed
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("feed" in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ("config" in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("$config" in $$props) config.set($config = $$props.$config);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    		if ("itemTitleClass" in $$props) $$invalidate(5, itemTitleClass = $$props.itemTitleClass);
    		if ("$feed" in $$props) feed.set($feed = $$props.$feed);
    	};

    	let height;
    	let width;
    	let itemTitleClass;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$config*/ 8) {
    			 $$invalidate(2, height = $config.height && $config.height > -1
    			? $config.height + "px"
    			: "100%");
    		}

    		if ($$self.$$.dirty & /*$config*/ 8) {
    			 $$invalidate(4, width = $config.width ? $config.width + "px" : "100%");
    		}

    		if ($$self.$$.dirty & /*$config*/ 8) {
    			 $$invalidate(5, itemTitleClass = !$config.compact ? "bold" : "");
    		}
    	};

    	return [feed, config, height, $config, width, itemTitleClass, $feed];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document_1$2.getElementById("svelte-1rjx8bp-style")) add_css$6();
    		init(this, options, instance$3, create_fragment$7, safe_not_equal, { feed: 0, config: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*feed*/ ctx[0] === undefined && !("feed" in props)) {
    			console.warn("<Box> was created without expected prop 'feed'");
    		}

    		if (/*config*/ ctx[1] === undefined && !("config" in props)) {
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

    /* components/Referrers.html generated by Svelte v3.16.7 */

    const { document: document_1$3 } = globals;
    const file$8 = "components/Referrers.html";

    function add_css$7() {
    	var style = element("style");
    	style.id = "svelte-oo3062-style";
    	style.textContent = "details.svelte-oo3062{line-height:1.2em}code.svelte-oo3062{margin-right:0.3em;color:#bbb;font-size:0.7em;white-space:pre}summary.svelte-oo3062{outline:none}.referrer.svelte-oo3062{white-space:nowrap}.feedLink.svelte-oo3062{position:relative;top:2px;color:#ffa600}.feedLink[disabled].svelte-oo3062{pointer-events:none}.feedLink.svelte-oo3062 svg{pointer-events:none}.feedLink[disabled].svelte-oo3062 svg{color:#ddd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVmZXJyZXJzLmh0bWwiLCJzb3VyY2VzIjpbIlJlZmVycmVycy5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuICBpbXBvcnQgeyByZWZlcnJlcnMgfSBmcm9tICcuLi9zcmMvc3RvcmVzJztcbiAgaW1wb3J0IHsgdXJscyB9IGZyb20gJy4uL3NyYy91cmxzJztcblxuICBpbXBvcnQgUnNzSWNvbiBmcm9tICcuL1Jzc0ljb24uaHRtbCc7XG5cbiAgLy8gU3RvcmVzIGNvbWluZyBpbiB2aWEgcHJvcHNcbiAgZXhwb3J0IGxldCBjb25maWc7XG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgaWYgKCdvcGVuJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJykgPT09IGZhbHNlKSB7XG4gICAgICBsb2FkKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBmb3JtYXQoZmxvYXQpIHtcbiAgICBpZiAoZmxvYXQgPCAwLjAxKSByZXR1cm4gJzwgMC4wMSc7XG4gICAgcmV0dXJuIGZsb2F0LnRvRml4ZWQoMikucGFkU3RhcnQoNik7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQudGFyZ2V0Lm9wZW4gJiYgIWxvYWRlZCkgbG9hZCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICByZWZlcnJlcnMuZmV0Y2goKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUZlZWRMaW5rKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IHJlZmVycmVyID0gJHJlZmVycmVyc1tldmVudC50YXJnZXQuZGF0YXNldC5pbmRleF07XG4gICAgY29uc3QgZGF0YSA9IHJlZmVycmVyLm1ldGFkYXRhO1xuXG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmZlZWRVcmxzKSByZXR1cm47XG5cbiAgICBsZXQgZmVlZFVybCA9IGV2ZW50LnRhcmdldC5ocmVmO1xuICAgIGxldCBpbmRleCA9IGRhdGEuZmVlZFVybHMuaW5kZXhPZihmZWVkVXJsKSArIDE7XG5cbiAgICBpZiAoaW5kZXggPj0gZGF0YS5mZWVkVXJscy5sZW5ndGgpIGluZGV4ID0gMDtcblxuICAgIGZlZWRVcmwgPSBkYXRhLmZlZWRVcmxzW2luZGV4XTtcblxuICAgIGlmIChldmVudC50YXJnZXQuaHJlZiA9PT0gZmVlZFVybCkgcmV0dXJuO1xuXG4gICAgZXZlbnQudGFyZ2V0LmhyZWYgPSBmZWVkVXJsO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tGZWVkTGluayhldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAoZXZlbnQubWV0YUtleSkge1xuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCB0aGUgZmVlZFVybHMgYXJyYXkgdG8gYWxsb3cgYWNjZXNzaW5nIG11bHRpcGxlIGZlZWQgdXJscyB2aWEgb25lIGljb25cbiAgICAgIHVwZGF0ZUZlZWRMaW5rKGV2ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXBkYXRlIHRoZSBjb25maWcgc3RvcmUgd2l0aCB0aGUgZmVlZCB1cmwgdG8gbG9hZCB0aGUgY29ycmVzcG9uZGluZyByc3MgYm94XG4gICAgICAkY29uZmlnLnVybCA9IGV2ZW50LnRhcmdldC5ocmVmO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEZlZWRMaW5rRGlzYWJsZWRTdGF0ZShpbmRleCkge1xuICAgIGNvbnN0IHJlZmVycmVyID0gJHJlZmVycmVyc1tpbmRleF07XG4gICAgY29uc3QgZGF0YSA9IHJlZmVycmVyLm1ldGFkYXRhO1xuXG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmZlZWRVcmxzKSByZXR1cm4gJ2Rpc2FibGVkJztcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgZGV0YWlscyB7XG4gICAgbGluZS1oZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgY29kZSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAwLjNlbTtcbiAgICBjb2xvcjogI2JiYjtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gIH1cblxuICBzdW1tYXJ5IHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG5cbiAgLnJlZmVycmVyIHtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLmZlZWRMaW5rIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgdG9wOiAycHg7XG4gICAgY29sb3I6ICNmZmE2MDA7XG4gIH1cblxuICAuZmVlZExpbmtbZGlzYWJsZWRdIHtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuXG4gIC5mZWVkTGluayA6Z2xvYmFsKHN2Zykge1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB9XG5cbiAgLmZlZWRMaW5rW2Rpc2FibGVkXSA6Z2xvYmFsKHN2Zykge1xuICAgIGNvbG9yOiAjZGRkO1xuICB9XG48L3N0eWxlPlxuXG48ZGV0YWlscyBvbjp0b2dnbGU9eyBsb2FkIH0+XG4gIDxzdW1tYXJ5Pjwvc3VtbWFyeT5cbiAgeyAjaWYgJHJlZmVycmVycy5sZW5ndGggfVxuICAgIHsgI2VhY2ggJHJlZmVycmVycyBhcyByZWZlcnJlciwgaW5kZXggfVxuICAgICAgPGRpdiBjbGFzcz0ncmVmZXJyZXInPlxuICAgICAgICA8Y29kZT57IGZvcm1hdChyZWZlcnJlci5wZXJjZW50YWdlKSB9PC9jb2RlPlxuICAgICAgICA8YSBocmVmPScuJ1xuICAgICAgICAgICAgY2xhc3M9J2ZlZWRMaW5rJ1xuICAgICAgICAgICAgZGlzYWJsZWQ9eyBnZXRGZWVkTGlua0Rpc2FibGVkU3RhdGUoaW5kZXgpIH1cbiAgICAgICAgICAgIGRhdGEtaW5kZXg9eyBpbmRleCB9XG4gICAgICAgICAgICBvbjptb3VzZW92ZXJ8b25jZT17IHVwZGF0ZUZlZWRMaW5rIH1cbiAgICAgICAgICAgIG9uOmNsaWNrPXsgY2xpY2tGZWVkTGluayB9PlxuICAgICAgICAgIDxSc3NJY29uLz5cbiAgICAgICAgPC9hPlxuICAgICAgICA8YSBocmVmPSd7IHJlZmVycmVyLnVybCB9Jz57IHJlZmVycmVyLmhvc3QgfTwvYT5cbiAgICAgIDwvZGl2PlxuICAgIHsgL2VhY2ggfVxuICB7IDplbHNlIH1cbiAgICBMb2FkaW5n4oCmXG4gIHsgL2lmIH1cbjwvZGV0YWlscz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFzRUUsT0FBTyxjQUFDLENBQUMsQUFDUCxXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsSUFBSSxjQUFDLENBQUMsQUFDSixZQUFZLENBQUUsS0FBSyxDQUNuQixLQUFLLENBQUUsSUFBSSxDQUNYLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUFHLEFBQ2xCLENBQUMsQUFFRCxPQUFPLGNBQUMsQ0FBQyxBQUNQLE9BQU8sQ0FBRSxJQUFJLEFBQ2YsQ0FBQyxBQUVELFNBQVMsY0FBQyxDQUFDLEFBQ1QsV0FBVyxDQUFFLE1BQU0sQUFDckIsQ0FBQyxBQUVELFNBQVMsY0FBQyxDQUFDLEFBQ1QsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLEdBQUcsQ0FDUixLQUFLLENBQUUsT0FBTyxBQUNoQixDQUFDLEFBRUQsU0FBUyxDQUFDLFFBQVEsQ0FBQyxjQUFDLENBQUMsQUFDbkIsY0FBYyxDQUFFLElBQUksQUFDdEIsQ0FBQyxBQUVELHVCQUFTLENBQUMsQUFBUSxHQUFHLEFBQUUsQ0FBQyxBQUN0QixjQUFjLENBQUUsSUFBSSxBQUN0QixDQUFDLEFBRUQsU0FBUyxDQUFDLFFBQVEsZUFBQyxDQUFDLEFBQVEsR0FBRyxBQUFFLENBQUMsQUFDaEMsS0FBSyxDQUFFLElBQUksQUFDYixDQUFDIn0= */";
    	append_dev(document_1$3.head, style);
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (126:2) { :else }
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
    		source: "(126:2) { :else }",
    		ctx
    	});

    	return block;
    }

    // (111:2) { #if $referrers.length }
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$referrers*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			if (dirty & /*$referrers, getFeedLinkDisabledState, updateFeedLink, clickFeedLink, format*/ 30) {
    				each_value = /*$referrers*/ ctx[1];
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
    		source: "(111:2) { #if $referrers.length }",
    		ctx
    	});

    	return block;
    }

    // (112:4) { #each $referrers as referrer, index }
    function create_each_block$1(ctx) {
    	let div;
    	let code;
    	let t0_value = format(/*referrer*/ ctx[6].percentage) + "";
    	let t0;
    	let t1;
    	let a0;
    	let a0_disabled_value;
    	let a0_data_index_value;
    	let t2;
    	let a1;
    	let t3_value = /*referrer*/ ctx[6].host + "";
    	let t3;
    	let a1_href_value;
    	let t4;
    	let current;
    	let dispose;
    	const rssicon = new RssIcon({ $$inline: true });

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
    			add_location(code, file$8, 113, 8, 2234);
    			attr_dev(a0, "href", ".");
    			attr_dev(a0, "class", "feedLink svelte-oo3062");
    			attr_dev(a0, "disabled", a0_disabled_value = /*getFeedLinkDisabledState*/ ctx[4](/*index*/ ctx[8]));
    			attr_dev(a0, "data-index", a0_data_index_value = /*index*/ ctx[8]);
    			add_location(a0, file$8, 114, 8, 2287);
    			attr_dev(a1, "href", a1_href_value = /*referrer*/ ctx[6].url);
    			add_location(a1, file$8, 122, 8, 2549);
    			attr_dev(div, "class", "referrer svelte-oo3062");
    			add_location(div, file$8, 112, 6, 2203);

    			dispose = [
    				listen_dev(a0, "mouseover", /*updateFeedLink*/ ctx[2], { once: true }, false, false),
    				listen_dev(a0, "click", /*clickFeedLink*/ ctx[3], false, false, false)
    			];
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
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$referrers*/ 2) && t0_value !== (t0_value = format(/*referrer*/ ctx[6].percentage) + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$referrers*/ 2) && t3_value !== (t3_value = /*referrer*/ ctx[6].host + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*$referrers*/ 2 && a1_href_value !== (a1_href_value = /*referrer*/ ctx[6].url)) {
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
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(112:4) { #each $referrers as referrer, index }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let details;
    	let summary;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
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
    			add_location(summary, file$8, 109, 2, 2105);
    			attr_dev(details, "class", "svelte-oo3062");
    			add_location(details, file$8, 108, 0, 2074);
    			dispose = listen_dev(details, "toggle", load$1, false, false, false);
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
    			dispose();
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

    function format(float) {
    	if (float < 0.01) return "< 0.01";
    	return float.toFixed(2).padStart(6);
    }

    function load$1() {
    	referrers.fetch();
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $referrers;

    	let $config,
    		$$unsubscribe_config = noop,
    		$$subscribe_config = () => ($$unsubscribe_config(), $$unsubscribe_config = subscribe(config, $$value => $$invalidate(5, $config = $$value)), config);

    	validate_store(referrers, "referrers");
    	component_subscribe($$self, referrers, $$value => $$invalidate(1, $referrers = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_config());
    	let { config } = $$props;
    	validate_store(config, "config");
    	$$subscribe_config();

    	onMount(() => {
    		if ("open" in document.createElement("details") === false) {
    			load$1();
    		}
    	});

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
    			updateFeedLink(event);
    		} else {
    			set_store_value(config, $config.url = event.target.href, $config);
    		}
    	}

    	function getFeedLinkDisabledState(index) {
    		const referrer = $referrers[index];
    		const data = referrer.metadata;
    		if (!data || !data.feedUrls) return "disabled";
    	}

    	const writable_props = ["config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Referrers> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("config" in $$props) $$subscribe_config($$invalidate(0, config = $$props.config));
    	};

    	$$self.$capture_state = () => {
    		return { config, $referrers, $config };
    	};

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$subscribe_config($$invalidate(0, config = $$props.config));
    		if ("$referrers" in $$props) referrers.set($referrers = $$props.$referrers);
    		if ("$config" in $$props) config.set($config = $$props.$config);
    	};

    	return [config, $referrers, updateFeedLink, clickFeedLink, getFeedLinkDisabledState];
    }

    class Referrers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document_1$3.getElementById("svelte-oo3062-style")) add_css$7();
    		init(this, options, instance$4, create_fragment$8, safe_not_equal, { config: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Referrers",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*config*/ ctx[0] === undefined && !("config" in props)) {
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

    /* components/Configurator.html generated by Svelte v3.16.7 */

    const { Object: Object_1, document: document_1$4 } = globals;
    const file$9 = "components/Configurator.html";

    function add_css$8() {
    	var style = element("style");
    	style.id = "svelte-xxczsb-style";
    	style.textContent = "table.svelte-xxczsb.svelte-xxczsb{overflow:auto}tr.svelte-xxczsb td.svelte-xxczsb:first-child{color:#bbb;text-align:right;white-space:nowrap}summary.svelte-xxczsb.svelte-xxczsb{outline:none}input[type='color'].svelte-xxczsb.svelte-xxczsb{width:108px;height:30px;padding:1px 3px}button.svelte-xxczsb.svelte-xxczsb{width:100px}.top.svelte-xxczsb.svelte-xxczsb{vertical-align:top}.source.svelte-xxczsb.svelte-xxczsb{line-height:1em}[name=url].svelte-xxczsb.svelte-xxczsb,[name=fontFace].svelte-xxczsb.svelte-xxczsb,[name=code].svelte-xxczsb.svelte-xxczsb{width:90%}[type=color].svelte-xxczsb.svelte-xxczsb,[type=number].svelte-xxczsb.svelte-xxczsb{width:7em}[name=code].svelte-xxczsb.svelte-xxczsb{color:#bbb;height:10em;overflow:hidden;resize:vertical}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlndXJhdG9yLmh0bWwiLCJzb3VyY2VzIjpbIkNvbmZpZ3VyYXRvci5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIlxuPHNjcmlwdD5cbiAgaW1wb3J0IHsgdXJscyB9IGZyb20gJy4uL3NyYy91cmxzJztcblxuICBpbXBvcnQgUmVmZXJyZXJzIGZyb20gJy4vUmVmZXJyZXJzLmh0bWwnO1xuXG4gIC8vIFN0b3JlcyBjb21pbmcgaW4gdmlhIHByb3BzXG4gIGV4cG9ydCBsZXQgZmVlZDtcbiAgZXhwb3J0IGxldCBjb25maWc7XG5cbiAgZnVuY3Rpb24gdmFsaWRhdGUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghZXZlbnQudGFyZ2V0LmNoZWNrVmFsaWRpdHkoKSkgZXZlbnQudGFyZ2V0LnJlcG9ydFZhbGlkaXR5KCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUoZXZlbnQpIHtcbiAgICBpZiAoIXZhbGlkYXRlKGV2ZW50KSkgcmV0dXJuO1xuICAgIGNvbnN0IG5hbWUgPSBldmVudC50YXJnZXQubmFtZTtcbiAgICBjb25zdCB0eXBlID0gZXZlbnQudGFyZ2V0LnR5cGU7XG4gICAgY29uc3QgdmFsdWUgPSBldmVudC50YXJnZXRbdHlwZSA9PT0gJ2NoZWNrYm94JyA/ICdjaGVja2VkJyA6ICd2YWx1ZSddO1xuICAgIGNvbmZpZy5zZXQoeyBbbmFtZV06IHZhbHVlIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVsb2FkKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAvLyBUaGUgYXBw4oCZcyBzdWJjcmlwdGlvbiBvbmx5IHRyaWdnZXJzIGEgZmV0Y2ggd2hlbiB0aGUgdXJsIGhhcyBjaGFuZ2VkXG4gICAgY29uZmlnLnNldCh7IHVybDogbnVsbCB9KTtcbiAgICBjb25maWcuc2V0KHsgdXJsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwidXJsXCJdJykudmFsdWUgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb3B5KGV2ZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIGV2ZW50LnRhcmdldC5zZWxlY3QoKTtcbiAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHsgfVxuICB9XG5cbiAgZnVuY3Rpb24gbGFiZWwoZXZlbnQpIHtcbiAgICBjb25zdCBzaWJsaW5nID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIGxldCBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICBpZiAoIWlucHV0KSBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3Rvcignc3VtbWFyeScpO1xuICAgIGlmICghaW5wdXQpIGlucHV0ID0gc2libGluZy5xdWVyeVNlbGVjdG9yKCd0ZXh0YXJlYScpO1xuICAgIGlmICghaW5wdXQpIHJldHVybjtcbiAgICBpZiAoaW5wdXQuY2xpY2spIGlucHV0LmNsaWNrKCk7XG4gICAgaWYgKGlucHV0LnNlbGVjdCkgaW5wdXQuc2VsZWN0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRRdWVyeSgpIHtcbiAgICBjb25zdCBxdWVyeSA9IFtdO1xuXG4gICAgT2JqZWN0LmtleXMoJGNvbmZpZykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJGNvbmZpZ1trZXldO1xuICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHZhbHVlID0gJyc7XG4gICAgICBxdWVyeS5wdXNoKGtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHF1ZXJ5LmpvaW4oJyYnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvZGUoKSB7XG4gICAgY29uc3QgcXVlcnkgPSBnZXRRdWVyeSgpLnJlcGxhY2UoLyYvZywgJyZhbXA7Jyk7XG4gICAgLy8gTmVlZCB0byBiZSBjYXJlZnVsIHdpdGggdGhlIHNjcmlwdC1lbmQtdGFnIHRvIHByZXZlbnQgdGVtcGxhdGUgZXJyb3JcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9pc3N1ZXMvMzg0MFxuICAgIHJldHVybiBgPHNjcmlwdCBhc3luYyBkZWZlciBzcmM9JyR7IHVybHMuYXBwIH0vbWFpbi5qcz8keyBxdWVyeSB9Jz4keyAnPCcgfS9zY3JpcHQ+YDtcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgdGFibGUge1xuICAgIG92ZXJmbG93OiBhdXRvO1xuICB9XG5cbiAgdHIgdGQ6Zmlyc3QtY2hpbGQge1xuICAgIGNvbG9yOiAjYmJiO1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICBzdW1tYXJ5IHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG5cbiAgaW5wdXRbdHlwZT0nY29sb3InXSB7XG4gICAgd2lkdGg6IDEwOHB4O1xuICAgIGhlaWdodDogMzBweDtcbiAgICBwYWRkaW5nOiAxcHggM3B4O1xuICB9XG5cbiAgYnV0dG9uIHtcbiAgICB3aWR0aDogMTAwcHg7XG4gIH1cblxuICAudG9wIHtcbiAgICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xuICB9XG5cbiAgLnNvdXJjZSB7XG4gICAgbGluZS1oZWlnaHQ6IDFlbTtcbiAgfVxuXG4gIFtuYW1lPXVybF0sIFtuYW1lPWZvbnRGYWNlXSwgW25hbWU9Y29kZV0ge1xuICAgIHdpZHRoOiA5MCU7XG4gIH1cblxuICBbdHlwZT1jb2xvcl0sIFt0eXBlPW51bWJlcl0ge1xuICAgIHdpZHRoOiA3ZW07XG4gIH1cblxuICBbbmFtZT1jb2RlXSB7XG4gICAgY29sb3I6ICNiYmI7XG4gICAgaGVpZ2h0OiAxMGVtO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgcmVzaXplOiB2ZXJ0aWNhbDtcbiAgfVxuPC9zdHlsZT5cblxuPGZvcm0+XG4gIDx0YWJsZSBjbGFzcz0ndGFibGUnPlxuICAgIDxjb2xncm91cD5cbiAgICAgIDxjb2wgd2lkdGg9JyonPlxuICAgICAgPGNvbCB3aWR0aD0nOTAlJz5cbiAgICA8L2NvbGdyb3VwPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5GZWVkIFVSTDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0ndXJsJyB2YWx1ZT17ICRjb25maWcudXJsIH0gbmFtZT0ndXJsJyByZXF1aXJlZCBvbjpjaGFuZ2U9eyByZWxvYWQgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbD5UaXRsZTwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPnsgJGZlZWQudGl0bGUgfTwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQgY2xhc3M9J3RvcCc+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz17IGxhYmVsIH0+RGVzY3JpcHRpb248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGRldGFpbHM+XG4gICAgICAgICAgPHN1bW1hcnk+PC9zdW1tYXJ5PlxuICAgICAgICAgIHsgJGZlZWQuZGVzY3JpcHRpb24gfVxuICAgICAgICA8L2RldGFpbHM+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWw+TGFzdCBidWlsZDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPnsgZmVlZC5mb3JtYXREYXRlKCRmZWVkLmRhdGUpIH08L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWw+U291cmNlPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQgY2xhc3M9J3NvdXJjZSc+XG4gICAgICAgIHsgI2lmICRmZWVkLmxvYWRpbmcgfVxuICAgICAgICAgIExvYWRpbmcuLi5cbiAgICAgICAgeyA6ZWxzZSB9XG4gICAgICAgICAgPGEgaHJlZj0neyAkY29uZmlnLnVybCB9Jz57ICRmZWVkLmZvcm1hdCB9IHsgJGZlZWQudmVyc2lvbiB9PC9hPlxuICAgICAgICB7IC9pZiB9XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9eyBsYWJlbCB9Pk1heC4gaXRlbXM8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J251bWJlcicgbmFtZT0nbWF4SXRlbXMnIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5tYXhJdGVtcyB9JyBtaW49MSBtYXg9OTkgcmVxdWlyZWQgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz17IGxhYmVsIH0+TWF4LiB3aWR0aDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nbnVtYmVyJyBuYW1lPSd3aWR0aCcgYmluZDp2YWx1ZT0neyAkY29uZmlnLndpZHRoIH0nIG1pbj0xMDAgbWF4PTk5OTkgb246Y2hhbmdlPXsgdmFsaWRhdGUgfSBwbGFjZWhvbGRlcj0nc3BhcmUnPlxuICAgICAgICA8c21hbGw+cHg8L3NtYWxsPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5Db250ZW50IGhlaWdodDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nbnVtYmVyJyBuYW1lPSdoZWlnaHQnIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5oZWlnaHQgfScgbWluPTEwMCBtYXg9OTk5OSBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9IHBsYWNlaG9sZGVyPSdzcGFyZSc+XG4gICAgICAgIDxzbWFsbD5weDwvc21hbGw+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9eyBsYWJlbCB9PkNvcm5lciByYWRpdXM8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J251bWJlcicgbmFtZT0ncmFkaXVzJyBiaW5kOnZhbHVlPSd7ICRjb25maWcucmFkaXVzIH0nIG1pbj0wIG1heD0yMCByZXF1aXJlZCBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgICA8c21hbGw+cHg8L3NtYWxsPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5YTUwgYnV0dG9uPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nc2hvd1htbEJ1dHRvbicgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLnNob3dYbWxCdXR0b24gfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz17IGxhYmVsIH0+Q29tcGFjdCB2aWV3PC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nY29tcGFjdCcgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLmNvbXBhY3QgfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz17IGxhYmVsIH0+SGVhZGxlc3M8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NoZWNrYm94JyBuYW1lPSdoZWFkbGVzcycgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLmhlYWRsZXNzIH0nIG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9eyBsYWJlbCB9PkZyYW1lIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0nZnJhbWVDb2xvcicgYmluZDp2YWx1ZT0neyAkY29uZmlnLmZyYW1lQ29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9eyBsYWJlbCB9PlRpdGxlYmFyIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0ndGl0bGVCYXJDb2xvcicgYmluZDp2YWx1ZT0neyAkY29uZmlnLnRpdGxlQmFyQ29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9eyBsYWJlbCB9PlRpdGxlIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0ndGl0bGVCYXJUZXh0Q29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy50aXRsZUJhclRleHRDb2xvciB9JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBvbjpjbGljaz17IGxhYmVsIH0+Qm94IGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0nYm94RmlsbENvbG9yJyBiaW5kOnZhbHVlPSd7ICRjb25maWcuYm94RmlsbENvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5UZXh0IGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0ndGV4dENvbG9yJyBiaW5kOnZhbHVlPSd7ICRjb25maWcudGV4dENvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5MaW5rIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgbmFtZT0nbGlua0NvbG9yJyBiaW5kOnZhbHVlPSd7ICRjb25maWcubGlua0NvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5Gb250IGZhY2U8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IG5hbWU9J2ZvbnRGYWNlJyBiaW5kOnZhbHVlPSd7ICRjb25maWcuZm9udEZhY2UgfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfSBwYXR0ZXJuPSdbXFxkLl0rKD86cHR8cHh8ZW18JSkrXFxzK1tcXHNcXHdcXC0sXSsnIHBsYWNlaG9sZGVyPSdlLmcuIDEwcHQgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+PC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgeyAjaWYgJGZlZWQubG9hZGluZyB9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz0nYnRuIGJ0bi1zbSBidG4tYycgZGlzYWJsZWQ+TG9hZGluZy4uLjwvYnV0dG9uPlxuICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPSdidG4gYnRuLXNtIGJ0bi1iJyBvbjpjbGljaz17IHJlbG9hZCB9PlJlbG9hZDwvYnV0dG9uPlxuICAgICAgICB7IC9pZiB9XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyIHN0eWxlPSd2ZXJ0aWNhbC1hbGlnbjogdG9wJz5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIG9uOmNsaWNrPXsgbGFiZWwgfT5cbiAgICAgICAgICBIVE1MIGNvZGU8YnI+XG4gICAgICAgICAgKGNvcHkmYW1wO3Bhc3RhKVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPHRleHRhcmVhIG5hbWU9J2NvZGUnIGNvbHM9JzEwJyByb3dzPSczJyByZWFkb25seSBvbjpjbGljaz17IGNvcHkgfT57IGNvZGUoJGNvbmZpZykgfTwvdGV4dGFyZWE+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgb246Y2xpY2s9eyBsYWJlbCB9IHRpdGxlPSdzaW5jZSBtaWRuaWdodCAoR01UKSc+XG4gICAgICAgICAgUmVmZXJyZXJzXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8UmVmZXJyZXJzIHsgY29uZmlnIH0vPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICA8L3RhYmxlPlxuPC9mb3JtPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW9FRSxLQUFLLDRCQUFDLENBQUMsQUFDTCxRQUFRLENBQUUsSUFBSSxBQUNoQixDQUFDLEFBRUQsZ0JBQUUsQ0FBQyxnQkFBRSxZQUFZLEFBQUMsQ0FBQyxBQUNqQixLQUFLLENBQUUsSUFBSSxDQUNYLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFdBQVcsQ0FBRSxNQUFNLEFBQ3JCLENBQUMsQUFFRCxPQUFPLDRCQUFDLENBQUMsQUFDUCxPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBQyxDQUFDLEFBQ25CLEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsR0FBRyxDQUFDLEdBQUcsQUFDbEIsQ0FBQyxBQUVELE1BQU0sNEJBQUMsQ0FBQyxBQUNOLEtBQUssQ0FBRSxLQUFLLEFBQ2QsQ0FBQyxBQUVELElBQUksNEJBQUMsQ0FBQyxBQUNKLGNBQWMsQ0FBRSxHQUFHLEFBQ3JCLENBQUMsQUFFRCxPQUFPLDRCQUFDLENBQUMsQUFDUCxXQUFXLENBQUUsR0FBRyxBQUNsQixDQUFDLEFBRUQsQ0FBQyxJQUFJLENBQUMsR0FBRyw2QkFBQyxDQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsNkJBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsNEJBQUMsQ0FBQyxBQUN4QyxLQUFLLENBQUUsR0FBRyxBQUNaLENBQUMsQUFFRCxDQUFDLElBQUksQ0FBQyxLQUFLLDZCQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLDRCQUFDLENBQUMsQUFDM0IsS0FBSyxDQUFFLEdBQUcsQUFDWixDQUFDLEFBRUQsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDRCQUFDLENBQUMsQUFDWCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osUUFBUSxDQUFFLE1BQU0sQ0FDaEIsTUFBTSxDQUFFLFFBQVEsQUFDbEIsQ0FBQyJ9 */";
    	append_dev(document_1$4.head, style);
    }

    // (161:8) { :else }
    function create_else_block_1$1(ctx) {
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
    			add_location(a, file$9, 161, 10, 3404);
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
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(161:8) { :else }",
    		ctx
    	});

    	return block;
    }

    // (159:8) { #if $feed.loading }
    function create_if_block_1$1(ctx) {
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(159:8) { #if $feed.loading }",
    		ctx
    	});

    	return block;
    }

    // (286:8) { :else }
    function create_else_block$2(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Reload";
    			attr_dev(button, "class", "btn btn-sm btn-b svelte-xxczsb");
    			add_location(button, file$9, 286, 10, 7239);
    			dispose = listen_dev(button, "click", /*reload*/ ctx[4], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(286:8) { :else }",
    		ctx
    	});

    	return block;
    }

    // (284:8) { #if $feed.loading }
    function create_if_block$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Loading...";
    			attr_dev(button, "class", "btn btn-sm btn-c svelte-xxczsb");
    			button.disabled = true;
    			add_location(button, file$9, 284, 10, 7149);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(284:8) { #if $feed.loading }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
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
    	let label1;
    	let t6;
    	let td3;
    	let t7_value = /*$feed*/ ctx[3].title + "";
    	let t7;
    	let t8;
    	let tr2;
    	let td4;
    	let label2;
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
    	let label3;
    	let t15;
    	let td7;
    	let t16_value = /*feed*/ ctx[0].formatDate(/*$feed*/ ctx[3].date) + "";
    	let t16;
    	let t17;
    	let tr4;
    	let td8;
    	let label4;
    	let t19;
    	let td9;
    	let t20;
    	let tr5;
    	let td10;
    	let label5;
    	let t22;
    	let td11;
    	let input1;
    	let input1_updating = false;
    	let t23;
    	let tr6;
    	let td12;
    	let label6;
    	let t25;
    	let td13;
    	let input2;
    	let input2_updating = false;
    	let t26;
    	let small0;
    	let t28;
    	let tr7;
    	let td14;
    	let label7;
    	let t30;
    	let td15;
    	let input3;
    	let input3_updating = false;
    	let t31;
    	let small1;
    	let t33;
    	let tr8;
    	let td16;
    	let label8;
    	let t35;
    	let td17;
    	let input4;
    	let input4_updating = false;
    	let t36;
    	let small2;
    	let t38;
    	let tr9;
    	let td18;
    	let label9;
    	let t40;
    	let td19;
    	let input5;
    	let t41;
    	let tr10;
    	let td20;
    	let label10;
    	let t43;
    	let td21;
    	let input6;
    	let t44;
    	let tr11;
    	let td22;
    	let label11;
    	let t46;
    	let td23;
    	let input7;
    	let t47;
    	let tr12;
    	let td24;
    	let label12;
    	let t49;
    	let td25;
    	let input8;
    	let t50;
    	let tr13;
    	let td26;
    	let label13;
    	let t52;
    	let td27;
    	let input9;
    	let t53;
    	let tr14;
    	let td28;
    	let label14;
    	let t55;
    	let td29;
    	let input10;
    	let t56;
    	let tr15;
    	let td30;
    	let label15;
    	let t58;
    	let td31;
    	let input11;
    	let t59;
    	let tr16;
    	let td32;
    	let label16;
    	let t61;
    	let td33;
    	let input12;
    	let t62;
    	let tr17;
    	let td34;
    	let label17;
    	let t64;
    	let td35;
    	let input13;
    	let t65;
    	let tr18;
    	let td36;
    	let label18;
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
    	let label19;
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
    	let label20;
    	let t76;
    	let td43;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$feed*/ ctx[3].loading) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function input1_input_handler() {
    		input1_updating = true;
    		/*input1_input_handler*/ ctx[8].call(input1);
    	}

    	function input2_input_handler() {
    		input2_updating = true;
    		/*input2_input_handler*/ ctx[9].call(input2);
    	}

    	function input3_input_handler() {
    		input3_updating = true;
    		/*input3_input_handler*/ ctx[10].call(input3);
    	}

    	function input4_input_handler() {
    		input4_updating = true;
    		/*input4_input_handler*/ ctx[11].call(input4);
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*$feed*/ ctx[3].loading) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const referrers = new Referrers({
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
    			label1 = element("label");
    			label1.textContent = "Title";
    			t6 = space();
    			td3 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			label2 = element("label");
    			label2.textContent = "Description";
    			t10 = space();
    			td5 = element("td");
    			details = element("details");
    			summary = element("summary");
    			t11 = space();
    			t12 = text(t12_value);
    			t13 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			label3 = element("label");
    			label3.textContent = "Last build";
    			t15 = space();
    			td7 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			tr4 = element("tr");
    			td8 = element("td");
    			label4 = element("label");
    			label4.textContent = "Source";
    			t19 = space();
    			td9 = element("td");
    			if_block0.c();
    			t20 = space();
    			tr5 = element("tr");
    			td10 = element("td");
    			label5 = element("label");
    			label5.textContent = "Max. items";
    			t22 = space();
    			td11 = element("td");
    			input1 = element("input");
    			t23 = space();
    			tr6 = element("tr");
    			td12 = element("td");
    			label6 = element("label");
    			label6.textContent = "Max. width";
    			t25 = space();
    			td13 = element("td");
    			input2 = element("input");
    			t26 = space();
    			small0 = element("small");
    			small0.textContent = "px";
    			t28 = space();
    			tr7 = element("tr");
    			td14 = element("td");
    			label7 = element("label");
    			label7.textContent = "Content height";
    			t30 = space();
    			td15 = element("td");
    			input3 = element("input");
    			t31 = space();
    			small1 = element("small");
    			small1.textContent = "px";
    			t33 = space();
    			tr8 = element("tr");
    			td16 = element("td");
    			label8 = element("label");
    			label8.textContent = "Corner radius";
    			t35 = space();
    			td17 = element("td");
    			input4 = element("input");
    			t36 = space();
    			small2 = element("small");
    			small2.textContent = "px";
    			t38 = space();
    			tr9 = element("tr");
    			td18 = element("td");
    			label9 = element("label");
    			label9.textContent = "XML button";
    			t40 = space();
    			td19 = element("td");
    			input5 = element("input");
    			t41 = space();
    			tr10 = element("tr");
    			td20 = element("td");
    			label10 = element("label");
    			label10.textContent = "Compact view";
    			t43 = space();
    			td21 = element("td");
    			input6 = element("input");
    			t44 = space();
    			tr11 = element("tr");
    			td22 = element("td");
    			label11 = element("label");
    			label11.textContent = "Headless";
    			t46 = space();
    			td23 = element("td");
    			input7 = element("input");
    			t47 = space();
    			tr12 = element("tr");
    			td24 = element("td");
    			label12 = element("label");
    			label12.textContent = "Frame color";
    			t49 = space();
    			td25 = element("td");
    			input8 = element("input");
    			t50 = space();
    			tr13 = element("tr");
    			td26 = element("td");
    			label13 = element("label");
    			label13.textContent = "Titlebar color";
    			t52 = space();
    			td27 = element("td");
    			input9 = element("input");
    			t53 = space();
    			tr14 = element("tr");
    			td28 = element("td");
    			label14 = element("label");
    			label14.textContent = "Title color";
    			t55 = space();
    			td29 = element("td");
    			input10 = element("input");
    			t56 = space();
    			tr15 = element("tr");
    			td30 = element("td");
    			label15 = element("label");
    			label15.textContent = "Box color";
    			t58 = space();
    			td31 = element("td");
    			input11 = element("input");
    			t59 = space();
    			tr16 = element("tr");
    			td32 = element("td");
    			label16 = element("label");
    			label16.textContent = "Text color";
    			t61 = space();
    			td33 = element("td");
    			input12 = element("input");
    			t62 = space();
    			tr17 = element("tr");
    			td34 = element("td");
    			label17 = element("label");
    			label17.textContent = "Link color";
    			t64 = space();
    			td35 = element("td");
    			input13 = element("input");
    			t65 = space();
    			tr18 = element("tr");
    			td36 = element("td");
    			label18 = element("label");
    			label18.textContent = "Font face";
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
    			label19 = element("label");
    			t71 = text("HTML code");
    			br = element("br");
    			t72 = text("\n          (copy&pasta)");
    			t73 = space();
    			td41 = element("td");
    			textarea = element("textarea");
    			t74 = space();
    			tr21 = element("tr");
    			td42 = element("td");
    			label20 = element("label");
    			label20.textContent = "Referrers";
    			t76 = space();
    			td43 = element("td");
    			create_component(referrers.$$.fragment);
    			attr_dev(col0, "width", "*");
    			add_location(col0, file$9, 119, 6, 2520);
    			attr_dev(col1, "width", "90%");
    			add_location(col1, file$9, 120, 6, 2542);
    			add_location(colgroup, file$9, 118, 4, 2503);
    			add_location(label0, file$9, 124, 8, 2604);
    			attr_dev(td0, "class", "svelte-xxczsb");
    			add_location(td0, file$9, 123, 6, 2591);
    			attr_dev(input0, "type", "url");
    			input0.value = input0_value_value = /*$config*/ ctx[2].url;
    			attr_dev(input0, "name", "url");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-xxczsb");
    			add_location(input0, file$9, 127, 8, 2678);
    			attr_dev(td1, "class", "svelte-xxczsb");
    			add_location(td1, file$9, 126, 6, 2665);
    			attr_dev(tr0, "class", "svelte-xxczsb");
    			add_location(tr0, file$9, 122, 4, 2580);
    			add_location(label1, file$9, 132, 8, 2810);
    			attr_dev(td2, "class", "svelte-xxczsb");
    			add_location(td2, file$9, 131, 6, 2797);
    			attr_dev(td3, "class", "svelte-xxczsb");
    			add_location(td3, file$9, 134, 6, 2849);
    			attr_dev(tr1, "class", "svelte-xxczsb");
    			add_location(tr1, file$9, 130, 4, 2786);
    			add_location(label2, file$9, 138, 8, 2924);
    			attr_dev(td4, "class", "top svelte-xxczsb");
    			add_location(td4, file$9, 137, 6, 2899);
    			attr_dev(summary, "class", "svelte-xxczsb");
    			add_location(summary, file$9, 142, 10, 3021);
    			add_location(details, file$9, 141, 8, 3001);
    			attr_dev(td5, "class", "svelte-xxczsb");
    			add_location(td5, file$9, 140, 6, 2988);
    			attr_dev(tr2, "class", "svelte-xxczsb");
    			add_location(tr2, file$9, 136, 4, 2888);
    			add_location(label3, file$9, 149, 8, 3142);
    			attr_dev(td6, "class", "svelte-xxczsb");
    			add_location(td6, file$9, 148, 6, 3129);
    			attr_dev(td7, "class", "svelte-xxczsb");
    			add_location(td7, file$9, 151, 6, 3186);
    			attr_dev(tr3, "class", "svelte-xxczsb");
    			add_location(tr3, file$9, 147, 4, 3118);
    			add_location(label4, file$9, 155, 8, 3265);
    			attr_dev(td8, "class", "svelte-xxczsb");
    			add_location(td8, file$9, 154, 6, 3252);
    			attr_dev(td9, "class", "source svelte-xxczsb");
    			add_location(td9, file$9, 157, 6, 3305);
    			attr_dev(tr4, "class", "svelte-xxczsb");
    			add_location(tr4, file$9, 153, 4, 3241);
    			add_location(label5, file$9, 167, 8, 3535);
    			attr_dev(td10, "class", "svelte-xxczsb");
    			add_location(td10, file$9, 166, 6, 3522);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "maxItems");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "99");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-xxczsb");
    			add_location(input1, file$9, 170, 8, 3611);
    			attr_dev(td11, "class", "svelte-xxczsb");
    			add_location(td11, file$9, 169, 6, 3598);
    			attr_dev(tr5, "class", "svelte-xxczsb");
    			add_location(tr5, file$9, 165, 4, 3511);
    			add_location(label6, file$9, 175, 8, 3778);
    			attr_dev(td12, "class", "svelte-xxczsb");
    			add_location(td12, file$9, 174, 6, 3765);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "name", "width");
    			attr_dev(input2, "min", "100");
    			attr_dev(input2, "max", "9999");
    			attr_dev(input2, "placeholder", "spare");
    			attr_dev(input2, "class", "svelte-xxczsb");
    			add_location(input2, file$9, 178, 8, 3854);
    			add_location(small0, file$9, 179, 8, 3988);
    			attr_dev(td13, "class", "svelte-xxczsb");
    			add_location(td13, file$9, 177, 6, 3841);
    			attr_dev(tr6, "class", "svelte-xxczsb");
    			add_location(tr6, file$9, 173, 4, 3754);
    			add_location(label7, file$9, 184, 8, 4056);
    			attr_dev(td14, "class", "svelte-xxczsb");
    			add_location(td14, file$9, 183, 6, 4043);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "name", "height");
    			attr_dev(input3, "min", "100");
    			attr_dev(input3, "max", "9999");
    			attr_dev(input3, "placeholder", "spare");
    			attr_dev(input3, "class", "svelte-xxczsb");
    			add_location(input3, file$9, 187, 8, 4136);
    			add_location(small1, file$9, 188, 8, 4272);
    			attr_dev(td15, "class", "svelte-xxczsb");
    			add_location(td15, file$9, 186, 6, 4123);
    			attr_dev(tr7, "class", "svelte-xxczsb");
    			add_location(tr7, file$9, 182, 4, 4032);
    			add_location(label8, file$9, 193, 8, 4340);
    			attr_dev(td16, "class", "svelte-xxczsb");
    			add_location(td16, file$9, 192, 6, 4327);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "name", "radius");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "20");
    			input4.required = true;
    			attr_dev(input4, "class", "svelte-xxczsb");
    			add_location(input4, file$9, 196, 8, 4419);
    			add_location(small2, file$9, 197, 8, 4540);
    			attr_dev(td17, "class", "svelte-xxczsb");
    			add_location(td17, file$9, 195, 6, 4406);
    			attr_dev(tr8, "class", "svelte-xxczsb");
    			add_location(tr8, file$9, 191, 4, 4316);
    			add_location(label9, file$9, 202, 8, 4608);
    			attr_dev(td18, "class", "svelte-xxczsb");
    			add_location(td18, file$9, 201, 6, 4595);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "name", "showXmlButton");
    			input5.__value = "1";
    			input5.value = input5.__value;
    			add_location(input5, file$9, 205, 8, 4684);
    			attr_dev(td19, "class", "svelte-xxczsb");
    			add_location(td19, file$9, 204, 6, 4671);
    			attr_dev(tr9, "class", "svelte-xxczsb");
    			add_location(tr9, file$9, 200, 4, 4584);
    			add_location(label10, file$9, 210, 8, 4853);
    			attr_dev(td20, "class", "svelte-xxczsb");
    			add_location(td20, file$9, 209, 6, 4840);
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "name", "compact");
    			input6.__value = "1";
    			input6.value = input6.__value;
    			add_location(input6, file$9, 213, 8, 4931);
    			attr_dev(td21, "class", "svelte-xxczsb");
    			add_location(td21, file$9, 212, 6, 4918);
    			attr_dev(tr10, "class", "svelte-xxczsb");
    			add_location(tr10, file$9, 208, 4, 4829);
    			add_location(label11, file$9, 218, 8, 5088);
    			attr_dev(td22, "class", "svelte-xxczsb");
    			add_location(td22, file$9, 217, 6, 5075);
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "name", "headless");
    			input7.__value = "1";
    			input7.value = input7.__value;
    			add_location(input7, file$9, 221, 8, 5162);
    			attr_dev(td23, "class", "svelte-xxczsb");
    			add_location(td23, file$9, 220, 6, 5149);
    			attr_dev(tr11, "class", "svelte-xxczsb");
    			add_location(tr11, file$9, 216, 4, 5064);
    			add_location(label12, file$9, 226, 8, 5321);
    			attr_dev(td24, "class", "svelte-xxczsb");
    			add_location(td24, file$9, 225, 6, 5308);
    			attr_dev(input8, "type", "color");
    			attr_dev(input8, "name", "frameColor");
    			attr_dev(input8, "size", "6");
    			attr_dev(input8, "maxlength", "7");
    			attr_dev(input8, "class", "svelte-xxczsb");
    			add_location(input8, file$9, 229, 8, 5398);
    			attr_dev(td25, "class", "svelte-xxczsb");
    			add_location(td25, file$9, 228, 6, 5385);
    			attr_dev(tr12, "class", "svelte-xxczsb");
    			add_location(tr12, file$9, 224, 4, 5297);
    			add_location(label13, file$9, 234, 8, 5565);
    			attr_dev(td26, "class", "svelte-xxczsb");
    			add_location(td26, file$9, 233, 6, 5552);
    			attr_dev(input9, "type", "color");
    			attr_dev(input9, "name", "titleBarColor");
    			attr_dev(input9, "size", "6");
    			attr_dev(input9, "maxlength", "7");
    			attr_dev(input9, "class", "svelte-xxczsb");
    			add_location(input9, file$9, 237, 8, 5645);
    			attr_dev(td27, "class", "svelte-xxczsb");
    			add_location(td27, file$9, 236, 6, 5632);
    			attr_dev(tr13, "class", "svelte-xxczsb");
    			add_location(tr13, file$9, 232, 4, 5541);
    			add_location(label14, file$9, 242, 8, 5818);
    			attr_dev(td28, "class", "svelte-xxczsb");
    			add_location(td28, file$9, 241, 6, 5805);
    			attr_dev(input10, "type", "color");
    			attr_dev(input10, "name", "titleBarTextColor");
    			attr_dev(input10, "size", "6");
    			attr_dev(input10, "maxlength", "7");
    			attr_dev(input10, "class", "svelte-xxczsb");
    			add_location(input10, file$9, 245, 8, 5895);
    			attr_dev(td29, "class", "svelte-xxczsb");
    			add_location(td29, file$9, 244, 6, 5882);
    			attr_dev(tr14, "class", "svelte-xxczsb");
    			add_location(tr14, file$9, 240, 4, 5794);
    			add_location(label15, file$9, 250, 8, 6076);
    			attr_dev(td30, "class", "svelte-xxczsb");
    			add_location(td30, file$9, 249, 6, 6063);
    			attr_dev(input11, "type", "color");
    			attr_dev(input11, "name", "boxFillColor");
    			attr_dev(input11, "size", "6");
    			attr_dev(input11, "maxlength", "7");
    			attr_dev(input11, "class", "svelte-xxczsb");
    			add_location(input11, file$9, 253, 8, 6151);
    			attr_dev(td31, "class", "svelte-xxczsb");
    			add_location(td31, file$9, 252, 6, 6138);
    			attr_dev(tr15, "class", "svelte-xxczsb");
    			add_location(tr15, file$9, 248, 4, 6052);
    			add_location(label16, file$9, 258, 8, 6322);
    			attr_dev(td32, "class", "svelte-xxczsb");
    			add_location(td32, file$9, 257, 6, 6309);
    			attr_dev(input12, "type", "color");
    			attr_dev(input12, "name", "textColor");
    			attr_dev(input12, "size", "6");
    			attr_dev(input12, "maxlength", "7");
    			attr_dev(input12, "class", "svelte-xxczsb");
    			add_location(input12, file$9, 261, 8, 6398);
    			attr_dev(td33, "class", "svelte-xxczsb");
    			add_location(td33, file$9, 260, 6, 6385);
    			attr_dev(tr16, "class", "svelte-xxczsb");
    			add_location(tr16, file$9, 256, 4, 6298);
    			add_location(label17, file$9, 266, 8, 6563);
    			attr_dev(td34, "class", "svelte-xxczsb");
    			add_location(td34, file$9, 265, 6, 6550);
    			attr_dev(input13, "type", "color");
    			attr_dev(input13, "name", "linkColor");
    			attr_dev(input13, "size", "6");
    			attr_dev(input13, "maxlength", "7");
    			attr_dev(input13, "class", "svelte-xxczsb");
    			add_location(input13, file$9, 269, 8, 6639);
    			attr_dev(td35, "class", "svelte-xxczsb");
    			add_location(td35, file$9, 268, 6, 6626);
    			attr_dev(tr17, "class", "svelte-xxczsb");
    			add_location(tr17, file$9, 264, 4, 6539);
    			add_location(label18, file$9, 274, 8, 6804);
    			attr_dev(td36, "class", "svelte-xxczsb");
    			add_location(td36, file$9, 273, 6, 6791);
    			attr_dev(input14, "name", "fontFace");
    			attr_dev(input14, "pattern", "[\\d.]+(?:pt|px|em|%)+\\s+[\\s\\w\\-,]+");
    			attr_dev(input14, "placeholder", "e.g. 10pt Helvetica, sans-serif");
    			attr_dev(input14, "class", "svelte-xxczsb");
    			add_location(input14, file$9, 277, 8, 6879);
    			attr_dev(td37, "class", "svelte-xxczsb");
    			add_location(td37, file$9, 276, 6, 6866);
    			attr_dev(tr18, "class", "svelte-xxczsb");
    			add_location(tr18, file$9, 272, 4, 6780);
    			attr_dev(td38, "class", "svelte-xxczsb");
    			add_location(td38, file$9, 281, 6, 7088);
    			attr_dev(td39, "class", "svelte-xxczsb");
    			add_location(td39, file$9, 282, 6, 7104);
    			attr_dev(tr19, "class", "svelte-xxczsb");
    			add_location(tr19, file$9, 280, 4, 7077);
    			add_location(br, file$9, 293, 19, 7448);
    			add_location(label19, file$9, 292, 8, 7402);
    			attr_dev(td40, "class", "svelte-xxczsb");
    			add_location(td40, file$9, 291, 6, 7389);
    			attr_dev(textarea, "name", "code");
    			attr_dev(textarea, "cols", "10");
    			attr_dev(textarea, "rows", "3");
    			textarea.readOnly = true;
    			textarea.value = textarea_value_value = /*code*/ ctx[5](/*$config*/ ctx[2]);
    			attr_dev(textarea, "class", "svelte-xxczsb");
    			add_location(textarea, file$9, 298, 8, 7528);
    			attr_dev(td41, "class", "svelte-xxczsb");
    			add_location(td41, file$9, 297, 6, 7515);
    			set_style(tr20, "vertical-align", "top");
    			attr_dev(tr20, "class", "svelte-xxczsb");
    			add_location(tr20, file$9, 290, 4, 7350);
    			attr_dev(label20, "title", "since midnight (GMT)");
    			add_location(label20, file$9, 303, 8, 7687);
    			attr_dev(td42, "class", "top svelte-xxczsb");
    			add_location(td42, file$9, 302, 6, 7662);
    			attr_dev(td43, "class", "top svelte-xxczsb");
    			add_location(td43, file$9, 307, 6, 7798);
    			attr_dev(tr21, "class", "svelte-xxczsb");
    			add_location(tr21, file$9, 301, 4, 7651);
    			attr_dev(table, "class", "table svelte-xxczsb");
    			add_location(table, file$9, 117, 2, 2477);
    			add_location(form, file$9, 116, 0, 2468);

    			dispose = [
    				listen_dev(label0, "click", label, false, false, false),
    				listen_dev(input0, "change", /*reload*/ ctx[4], false, false, false),
    				listen_dev(label2, "click", label, false, false, false),
    				listen_dev(label5, "click", label, false, false, false),
    				listen_dev(input1, "input", input1_input_handler),
    				listen_dev(input1, "change", validate, false, false, false),
    				listen_dev(label6, "click", label, false, false, false),
    				listen_dev(input2, "input", input2_input_handler),
    				listen_dev(input2, "change", validate, false, false, false),
    				listen_dev(label7, "click", label, false, false, false),
    				listen_dev(input3, "input", input3_input_handler),
    				listen_dev(input3, "change", validate, false, false, false),
    				listen_dev(label8, "click", label, false, false, false),
    				listen_dev(input4, "input", input4_input_handler),
    				listen_dev(input4, "change", validate, false, false, false),
    				listen_dev(label9, "click", label, false, false, false),
    				listen_dev(input5, "change", /*input5_change_handler*/ ctx[12]),
    				listen_dev(input5, "change", validate, false, false, false),
    				listen_dev(label10, "click", label, false, false, false),
    				listen_dev(input6, "change", /*input6_change_handler*/ ctx[13]),
    				listen_dev(input6, "change", validate, false, false, false),
    				listen_dev(label11, "click", label, false, false, false),
    				listen_dev(input7, "change", /*input7_change_handler*/ ctx[14]),
    				listen_dev(input7, "change", validate, false, false, false),
    				listen_dev(label12, "click", label, false, false, false),
    				listen_dev(input8, "input", /*input8_input_handler*/ ctx[15]),
    				listen_dev(input8, "change", validate, false, false, false),
    				listen_dev(label13, "click", label, false, false, false),
    				listen_dev(input9, "input", /*input9_input_handler*/ ctx[16]),
    				listen_dev(input9, "change", validate, false, false, false),
    				listen_dev(label14, "click", label, false, false, false),
    				listen_dev(input10, "input", /*input10_input_handler*/ ctx[17]),
    				listen_dev(input10, "change", validate, false, false, false),
    				listen_dev(label15, "click", label, false, false, false),
    				listen_dev(input11, "input", /*input11_input_handler*/ ctx[18]),
    				listen_dev(input11, "change", validate, false, false, false),
    				listen_dev(label16, "click", label, false, false, false),
    				listen_dev(input12, "input", /*input12_input_handler*/ ctx[19]),
    				listen_dev(input12, "change", validate, false, false, false),
    				listen_dev(label17, "click", label, false, false, false),
    				listen_dev(input13, "input", /*input13_input_handler*/ ctx[20]),
    				listen_dev(input13, "change", validate, false, false, false),
    				listen_dev(label18, "click", label, false, false, false),
    				listen_dev(input14, "input", /*input14_input_handler*/ ctx[21]),
    				listen_dev(input14, "change", validate, false, false, false),
    				listen_dev(label19, "click", label, false, false, false),
    				listen_dev(textarea, "click", copy, false, false, false),
    				listen_dev(label20, "click", label, false, false, false)
    			];
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
    			append_dev(td2, label1);
    			append_dev(tr1, t6);
    			append_dev(tr1, td3);
    			append_dev(td3, t7);
    			append_dev(table, t8);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, label2);
    			append_dev(tr2, t10);
    			append_dev(tr2, td5);
    			append_dev(td5, details);
    			append_dev(details, summary);
    			append_dev(details, t11);
    			append_dev(details, t12);
    			append_dev(table, t13);
    			append_dev(table, tr3);
    			append_dev(tr3, td6);
    			append_dev(td6, label3);
    			append_dev(tr3, t15);
    			append_dev(tr3, td7);
    			append_dev(td7, t16);
    			append_dev(table, t17);
    			append_dev(table, tr4);
    			append_dev(tr4, td8);
    			append_dev(td8, label4);
    			append_dev(tr4, t19);
    			append_dev(tr4, td9);
    			if_block0.m(td9, null);
    			append_dev(table, t20);
    			append_dev(table, tr5);
    			append_dev(tr5, td10);
    			append_dev(td10, label5);
    			append_dev(tr5, t22);
    			append_dev(tr5, td11);
    			append_dev(td11, input1);
    			set_input_value(input1, /*$config*/ ctx[2].maxItems);
    			append_dev(table, t23);
    			append_dev(table, tr6);
    			append_dev(tr6, td12);
    			append_dev(td12, label6);
    			append_dev(tr6, t25);
    			append_dev(tr6, td13);
    			append_dev(td13, input2);
    			set_input_value(input2, /*$config*/ ctx[2].width);
    			append_dev(td13, t26);
    			append_dev(td13, small0);
    			append_dev(table, t28);
    			append_dev(table, tr7);
    			append_dev(tr7, td14);
    			append_dev(td14, label7);
    			append_dev(tr7, t30);
    			append_dev(tr7, td15);
    			append_dev(td15, input3);
    			set_input_value(input3, /*$config*/ ctx[2].height);
    			append_dev(td15, t31);
    			append_dev(td15, small1);
    			append_dev(table, t33);
    			append_dev(table, tr8);
    			append_dev(tr8, td16);
    			append_dev(td16, label8);
    			append_dev(tr8, t35);
    			append_dev(tr8, td17);
    			append_dev(td17, input4);
    			set_input_value(input4, /*$config*/ ctx[2].radius);
    			append_dev(td17, t36);
    			append_dev(td17, small2);
    			append_dev(table, t38);
    			append_dev(table, tr9);
    			append_dev(tr9, td18);
    			append_dev(td18, label9);
    			append_dev(tr9, t40);
    			append_dev(tr9, td19);
    			append_dev(td19, input5);
    			input5.checked = /*$config*/ ctx[2].showXmlButton;
    			append_dev(table, t41);
    			append_dev(table, tr10);
    			append_dev(tr10, td20);
    			append_dev(td20, label10);
    			append_dev(tr10, t43);
    			append_dev(tr10, td21);
    			append_dev(td21, input6);
    			input6.checked = /*$config*/ ctx[2].compact;
    			append_dev(table, t44);
    			append_dev(table, tr11);
    			append_dev(tr11, td22);
    			append_dev(td22, label11);
    			append_dev(tr11, t46);
    			append_dev(tr11, td23);
    			append_dev(td23, input7);
    			input7.checked = /*$config*/ ctx[2].headless;
    			append_dev(table, t47);
    			append_dev(table, tr12);
    			append_dev(tr12, td24);
    			append_dev(td24, label12);
    			append_dev(tr12, t49);
    			append_dev(tr12, td25);
    			append_dev(td25, input8);
    			set_input_value(input8, /*$config*/ ctx[2].frameColor);
    			append_dev(table, t50);
    			append_dev(table, tr13);
    			append_dev(tr13, td26);
    			append_dev(td26, label13);
    			append_dev(tr13, t52);
    			append_dev(tr13, td27);
    			append_dev(td27, input9);
    			set_input_value(input9, /*$config*/ ctx[2].titleBarColor);
    			append_dev(table, t53);
    			append_dev(table, tr14);
    			append_dev(tr14, td28);
    			append_dev(td28, label14);
    			append_dev(tr14, t55);
    			append_dev(tr14, td29);
    			append_dev(td29, input10);
    			set_input_value(input10, /*$config*/ ctx[2].titleBarTextColor);
    			append_dev(table, t56);
    			append_dev(table, tr15);
    			append_dev(tr15, td30);
    			append_dev(td30, label15);
    			append_dev(tr15, t58);
    			append_dev(tr15, td31);
    			append_dev(td31, input11);
    			set_input_value(input11, /*$config*/ ctx[2].boxFillColor);
    			append_dev(table, t59);
    			append_dev(table, tr16);
    			append_dev(tr16, td32);
    			append_dev(td32, label16);
    			append_dev(tr16, t61);
    			append_dev(tr16, td33);
    			append_dev(td33, input12);
    			set_input_value(input12, /*$config*/ ctx[2].textColor);
    			append_dev(table, t62);
    			append_dev(table, tr17);
    			append_dev(tr17, td34);
    			append_dev(td34, label17);
    			append_dev(tr17, t64);
    			append_dev(tr17, td35);
    			append_dev(td35, input13);
    			set_input_value(input13, /*$config*/ ctx[2].linkColor);
    			append_dev(table, t65);
    			append_dev(table, tr18);
    			append_dev(tr18, td36);
    			append_dev(td36, label18);
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
    			append_dev(td40, label19);
    			append_dev(label19, t71);
    			append_dev(label19, br);
    			append_dev(label19, t72);
    			append_dev(tr20, t73);
    			append_dev(tr20, td41);
    			append_dev(td41, textarea);
    			append_dev(table, t74);
    			append_dev(table, tr21);
    			append_dev(tr21, td42);
    			append_dev(td42, label20);
    			append_dev(tr21, t76);
    			append_dev(tr21, td43);
    			mount_component(referrers, td43, null);
    			current = true;
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

    			if (!input1_updating && dirty & /*$config*/ 4) {
    				set_input_value(input1, /*$config*/ ctx[2].maxItems);
    			}

    			input1_updating = false;

    			if (!input2_updating && dirty & /*$config*/ 4) {
    				set_input_value(input2, /*$config*/ ctx[2].width);
    			}

    			input2_updating = false;

    			if (!input3_updating && dirty & /*$config*/ 4) {
    				set_input_value(input3, /*$config*/ ctx[2].height);
    			}

    			input3_updating = false;

    			if (!input4_updating && dirty & /*$config*/ 4) {
    				set_input_value(input4, /*$config*/ ctx[2].radius);
    			}

    			input4_updating = false;

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
    			run_all(dispose);
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

    function label(event) {
    	const sibling = event.target.parentNode.nextElementSibling;
    	let input = sibling.querySelector("input");
    	if (!input) input = sibling.querySelector("summary");
    	if (!input) input = sibling.querySelector("textarea");
    	if (!input) return;
    	if (input.click) input.click();
    	if (input.select) input.select();
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $config,
    		$$unsubscribe_config = noop,
    		$$subscribe_config = () => ($$unsubscribe_config(), $$unsubscribe_config = subscribe(config, $$value => $$invalidate(2, $config = $$value)), config);

    	let $feed,
    		$$unsubscribe_feed = noop,
    		$$subscribe_feed = () => ($$unsubscribe_feed(), $$unsubscribe_feed = subscribe(feed, $$value => $$invalidate(3, $feed = $$value)), feed);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_config());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_feed());
    	let { feed } = $$props;
    	validate_store(feed, "feed");
    	$$subscribe_feed();
    	let { config } = $$props;
    	validate_store(config, "config");
    	$$subscribe_config();

    	function update(event) {
    		if (!validate(event)) return;
    		const name = event.target.name;
    		const type = event.target.type;
    		const value = event.target[type === "checkbox" ? "checked" : "value"];
    		config.set({ [name]: value });
    	}

    	function reload(event) {
    		event.preventDefault();
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
    		return `<script async defer src='${urls$1.app}/main.js?${query}'>${"<"}/script>`;
    	}

    	const writable_props = ["feed", "config"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Configurator> was created with unknown prop '${key}'`);
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

    	$$self.$set = $$props => {
    		if ("feed" in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ("config" in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
    	};

    	$$self.$capture_state = () => {
    		return { feed, config, $config, $feed };
    	};

    	$$self.$inject_state = $$props => {
    		if ("feed" in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ("config" in $$props) $$subscribe_config($$invalidate(1, config = $$props.config));
    		if ("$config" in $$props) config.set($config = $$props.$config);
    		if ("$feed" in $$props) feed.set($feed = $$props.$feed);
    	};

    	return [
    		feed,
    		config,
    		$config,
    		$feed,
    		reload,
    		code,
    		update,
    		getQuery,
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
    		if (!document_1$4.getElementById("svelte-xxczsb-style")) add_css$8();
    		init(this, options, instance$5, create_fragment$9, safe_not_equal, { feed: 0, config: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Configurator",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*feed*/ ctx[0] === undefined && !("feed" in props)) {
    			console.warn("<Configurator> was created without expected prop 'feed'");
    		}

    		if (/*config*/ ctx[1] === undefined && !("config" in props)) {
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

    /* components/App.html generated by Svelte v3.16.7 */
    const file$a = "components/App.html";

    function add_css$9() {
    	var style = element("style");
    	style.id = "svelte-1d2f360-style";
    	style.textContent = ".loading.svelte-1d2f360{opacity:0;transition-property:opacity;transition-duration:3s;transition-timing-function:ease-out;pointer-events:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLmh0bWwiLCJzb3VyY2VzIjpbIkFwcC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCBBYm91dCBmcm9tICcuL0Fib3V0Lmh0bWwnO1xuICBpbXBvcnQgQWQgZnJvbSAnLi9BZC5odG1sJztcbiAgaW1wb3J0IEJveCBmcm9tICcuL0JveC5odG1sJztcbiAgaW1wb3J0IENvbmZpZ3VyYXRvciBmcm9tICcuL0NvbmZpZ3VyYXRvci5odG1sJztcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGZlZWQ7XG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLmxvYWRpbmcge1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNpdGlvbi1wcm9wZXJ0eTogb3BhY2l0eTtcbiAgICB0cmFuc2l0aW9uLWR1cmF0aW9uOiAzcztcbiAgICB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbjogZWFzZS1vdXQ7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9J3Jvdyc+XG4gIDxkaXYgY2xhc3M9J2NvbCBjMicgY2xhc3M6bG9hZGluZz17ICRmZWVkLmxvYWRpbmcgfT5cbiAgICA8Qm94IHsgZmVlZCB9IHsgY29uZmlnIH0vPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz0nY29sIGM1Jz5cbiAgICA8Q29uZmlndXJhdG9yIHsgZmVlZCB9IHsgY29uZmlnIH0vPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz0nY29sIGM1Jz5cbiAgICA8QWQvPlxuICAgIDxBYm91dCB7IGNvbmZpZyB9Lz5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFZRSxRQUFRLGVBQUMsQ0FBQyxBQUNSLE9BQU8sQ0FBRSxDQUFDLENBQ1YsbUJBQW1CLENBQUUsT0FBTyxDQUM1QixtQkFBbUIsQ0FBRSxFQUFFLENBQ3ZCLDBCQUEwQixDQUFFLFFBQVEsQ0FDcEMsY0FBYyxDQUFFLElBQUksQUFDdEIsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function create_fragment$a(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let current;

    	const box = new Box({
    			props: {
    				feed: /*feed*/ ctx[0],
    				config: /*config*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const configurator = new Configurator({
    			props: {
    				feed: /*feed*/ ctx[0],
    				config: /*config*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const ad = new Ad({ $$inline: true });

    	const about = new About({
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
    			add_location(div0, file$a, 22, 2, 443);
    			attr_dev(div1, "class", "col c5");
    			add_location(div1, file$a, 25, 2, 538);
    			attr_dev(div2, "class", "col c5");
    			add_location(div2, file$a, 28, 2, 610);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$a, 21, 0, 423);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $feed,
    		$$unsubscribe_feed = noop,
    		$$subscribe_feed = () => ($$unsubscribe_feed(), $$unsubscribe_feed = subscribe(feed, $$value => $$invalidate(2, $feed = $$value)), feed);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_feed());
    	let { feed } = $$props;
    	validate_store(feed, "feed");
    	$$subscribe_feed();
    	let { config } = $$props;
    	const writable_props = ["feed", "config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("feed" in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    	};

    	$$self.$capture_state = () => {
    		return { feed, config, $feed };
    	};

    	$$self.$inject_state = $$props => {
    		if ("feed" in $$props) $$subscribe_feed($$invalidate(0, feed = $$props.feed));
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    		if ("$feed" in $$props) feed.set($feed = $$props.$feed);
    	};

    	return [feed, config, $feed];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1d2f360-style")) add_css$9();
    		init(this, options, instance$6, create_fragment$a, safe_not_equal, { feed: 0, config: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*feed*/ ctx[0] === undefined && !("feed" in props)) {
    			console.warn("<App> was created without expected prop 'feed'");
    		}

    		if (/*config*/ ctx[1] === undefined && !("config" in props)) {
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
      target: document.querySelector('main'),
      props: { feed, config }
    });

    const query = location.search;
    let url;

    config.subscribe(state => {
      if (url === state.url) return;
      url = state.url;
      feed.fetch(url, feed);
    });

    if (query && query.startsWith('?url=')) {
      const parts = query.substr(5).split('&');
      config.set({ url: decodeURIComponent(parts[0]) });
    } else {
      config.set({ url: urls$1.feed });
    }

}());
//# sourceMappingURL=app.js.map
