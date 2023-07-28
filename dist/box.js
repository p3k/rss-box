(function () {
	'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

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
	} (ready$1));

	var readyExports = ready$1.exports;
	var ready = /*@__PURE__*/getDefaultExportFromCjs(readyExports);

	/** @returns {void} */
	function noop() {}

	// Adapted from https://github.com/then/is-promise/blob/master/index.js
	// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
	/**
	 * @param {any} value
	 * @returns {value is PromiseLike<any>}
	 */
	function is_promise(value) {
		return (
			!!value &&
			(typeof value === 'object' || typeof value === 'function') &&
			typeof (/** @type {any} */ (value).then) === 'function'
		);
	}

	/** @returns {void} */
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

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @returns {void} */
	function validate_store(store, name) {
		if (store != null && typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {string} style_sheet_id
	 * @param {string} styles
	 * @returns {void}
	 */
	function append_styles(target, style_sheet_id, styles) {
		const append_styles_to = get_root_for_style(target);
		if (!append_styles_to.getElementById(style_sheet_id)) {
			const style = element('style');
			style.id = style_sheet_id;
			style.textContent = styles;
			append_stylesheet(append_styles_to, style);
		}
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, important ? 'important' : '');
		}
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}
	/** */
	class HtmlTag {
		/**
		 * @private
		 * @default false
		 */
		is_svg = false;
		/** parent for creating node */
		e = undefined;
		/** html tag nodes */
		n = undefined;
		/** target */
		t = undefined;
		/** anchor */
		a = undefined;
		constructor(is_svg = false) {
			this.is_svg = is_svg;
			this.e = this.n = null;
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		c(html) {
			this.h(html);
		}

		/**
		 * @param {string} html
		 * @param {HTMLElement | SVGElement} target
		 * @param {HTMLElement | SVGElement} anchor
		 * @returns {void}
		 */
		m(html, target, anchor = null) {
			if (!this.e) {
				if (this.is_svg)
					this.e = svg_element(/** @type {keyof SVGElementTagNameMap} */ (target.nodeName));
				/** #7364  target for <template> may be provided as #document-fragment(11) */ else
					this.e = element(
						/** @type {keyof HTMLElementTagNameMap} */ (
							target.nodeType === 11 ? 'TEMPLATE' : target.nodeName
						)
					);
				this.t =
					target.tagName !== 'TEMPLATE'
						? target
						: /** @type {HTMLTemplateElement} */ (target).content;
				this.c(html);
			}
			this.i(anchor);
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		h(html) {
			this.e.innerHTML = html;
			this.n = Array.from(
				this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes
			);
		}

		/**
		 * @returns {void} */
		i(anchor) {
			for (let i = 0; i < this.n.length; i += 1) {
				insert(this.t, this.n[i], anchor);
			}
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		p(html) {
			this.d();
			this.h(html);
			this.i(this.a);
		}

		/**
		 * @returns {void} */
		d() {
			this.n.forEach(detach);
		}
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
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
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
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

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @param {import('./private.js').PromiseInfo<T>} info
	 * @returns {boolean}
	 */
	function handle_promise(promise, info) {
		const token = (info.token = {});
		/**
		 * @param {import('./private.js').FragmentFactory} type
		 * @param {0 | 1 | 2} index
		 * @param {number} [key]
		 * @param {any} [value]
		 * @returns {void}
		 */
		function update(type, index, key, value) {
			if (info.token !== token) return;
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
				} else {
					info.block.d(1);
				}
				block.c();
				transition_in(block, 1);
				block.m(info.mount(), info.anchor);
				needs_flush = true;
			}
			info.block = block;
			if (info.blocks) info.blocks[index] = block;
			if (needs_flush) {
				flush();
			}
		}
		if (is_promise(promise)) {
			const current_component = get_current_component();
			promise.then(
				(value) => {
					set_current_component(current_component);
					update(info.then, 1, info.value, value);
					set_current_component(null);
				},
				(error) => {
					set_current_component(current_component);
					update(info.catch, 2, info.error, error);
					set_current_component(null);
					if (!info.hasCatch) {
						throw error;
					}
				}
			);
			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}
			info.resolved = /** @type {T} */ (promise);
		}
	}

	/** @returns {void} */
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

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	/** @returns {void} */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
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
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
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
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.1.1';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	const subscriber_queue = [];

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
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

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
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

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* src/lib/LinkIcon.svelte generated by Svelte v4.1.1 */
	const file$3 = "src/lib/LinkIcon.svelte";

	function add_css$3(target) {
		append_styles(target, "svelte-mfbc6b", "svg.svelte-mfbc6b{width:1.2em;height:1.2em}polygon.svelte-mfbc6b{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0ljb24uc3ZlbHRlIiwic291cmNlcyI6WyJMaW5rSWNvbi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxLjJlbTtcbiAgICBoZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgcG9seWdvbiB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICAgIGZpbGwtcnVsZTogZXZlbm9kZDtcbiAgICBjbGlwLXJ1bGU6IGV2ZW5vZGQ7XG4gIH1cbjwvc3R5bGU+XG5cbjwhLS0gU291cmNlOiBodHRwczovL2NvbW1vbnMud2lraW1lZGlhLm9yZy93aWtpL0ZpbGU6VmlzdWFsRWRpdG9yXy1fSWNvbl8tX0V4dGVybmFsLWxpbmsuc3ZnIC0tPlxuPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMiAxMicgcHJlc2VydmVBc3BlY3RSYXRpbz0neE1pbllNaW4nPlxuICA8Zz5cbiAgICA8cG9seWdvbiBwb2ludHM9JzIsMiA1LDIgNSwzIDMsMyAzLDkgOSw5IDksNyAxMCw3IDEwLDEwIDIsMTAnLz5cbiAgICA8cG9seWdvbiBwb2ludHM9JzYuMjExLDIgMTAsMiAxMCw1Ljc4OSA4LjU3OSw0LjM2OCA2LjQ0Nyw2LjUgNS41LDUuNTUzIDcuNjMyLDMuNDIxJy8+XG4gIDwvZz5cbjwvc3ZnPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNFLGlCQUFJLENBQ0YsS0FBSyxDQUFFLEtBQUssQ0FDWixNQUFNLENBQUUsS0FDVixDQUVBLHFCQUFRLENBQ04sSUFBSSxDQUFFLFlBQVksQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQ0FDbEIsU0FBUyxDQUFFLE9BQ2IifQ== */");
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
				if (detaching) {
					detach_dev(svg);
				}
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

	/* src/lib/RssIcon.svelte generated by Svelte v4.1.1 */
	const file$2 = "src/lib/RssIcon.svelte";

	function add_css$2(target) {
		append_styles(target, "svelte-ibnekz", "svg.svelte-ibnekz{width:1em;height:1em}path.svelte-ibnekz{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnNzSWNvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIlJzc0ljb24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgc3ZnIHtcbiAgICB3aWR0aDogMWVtO1xuICAgIGhlaWdodDogMWVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG48IS0tIFNvdXJjZTogaHR0cHM6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9GaWxlOlJzc19mb250X2F3ZXNvbWUuc3ZnIC0tPlxuPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgLTI1NiAxNzkyIDE3OTInIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPGcgdHJhbnNmb3JtPSdtYXRyaXgoMSwwLDAsLTEsMjEyLjYxMDE3LDEzNDYuMTY5NSknPlxuICAgIDxwYXRoIGQ9J00gMzg0LDE5MiBRIDM4NCwxMTIgMzI4LDU2IDI3MiwwIDE5MiwwIDExMiwwIDU2LDU2IDAsMTEyIDAsMTkyIHEgMCw4MCA1NiwxMzYgNTYsNTYgMTM2LDU2IDgwLDAgMTM2LC01NiA1NiwtNTYgNTYsLTEzNiB6IE0gODk2LDY5IFEgODk4LDQxIDg3OSwyMSA4NjEsMCA4MzIsMCBIIDY5NyBRIDY3MiwwIDY1NCwxNi41IDYzNiwzMyA2MzQsNTggNjEyLDI4NyA0NDkuNSw0NDkuNSAyODcsNjEyIDU4LDYzNCAzMyw2MzYgMTYuNSw2NTQgMCw2NzIgMCw2OTcgdiAxMzUgcSAwLDI5IDIxLDQ3IDE3LDE3IDQzLDE3IGggNSBRIDIyOSw4ODMgMzc1LDgxNS41IDUyMSw3NDggNjM0LDYzNCA3NDgsNTIxIDgxNS41LDM3NSA4ODMsMjI5IDg5Niw2OSB6IG0gNTEyLC0yIFEgMTQxMCw0MCAxMzkwLDIwIDEzNzIsMCAxMzQ0LDAgSCAxMjAxIFEgMTE3NSwwIDExNTYuNSwxNy41IDExMzgsMzUgMTEzNyw2MCAxMTI1LDI3NSAxMDM2LDQ2OC41IDk0Nyw2NjIgODA0LjUsODA0LjUgNjYyLDk0NyA0NjguNSwxMDM2IDI3NSwxMTI1IDYwLDExMzggMzUsMTEzOSAxNy41LDExNTcuNSAwLDExNzYgMCwxMjAxIHYgMTQzIHEgMCwyOCAyMCw0NiAxOCwxOCA0NCwxOCBoIDMgUSAzMjksMTM5NSA1NjguNSwxMjg4IDgwOCwxMTgxIDk5NCw5OTQgMTE4MSw4MDggMTI4OCw1NjguNSAxMzk1LDMyOSAxNDA4LDY3IHonLz5cbiAgPC9nPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0UsaUJBQUksQ0FDRixLQUFLLENBQUUsR0FBRyxDQUNWLE1BQU0sQ0FBRSxHQUNWLENBRUEsa0JBQUssQ0FDSCxJQUFJLENBQUUsWUFDUiJ9 */");
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
				if (detaching) {
					detach_dev(svg);
				}
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

	/* src/lib/PaperclipIcon.svelte generated by Svelte v4.1.1 */
	const file$1 = "src/lib/PaperclipIcon.svelte";

	function add_css$1(target) {
		append_styles(target, "svelte-1bdkb67", "svg.svelte-1bdkb67{width:1.2em;height:1.2em}path.svelte-1bdkb67{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFwZXJjbGlwSWNvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIlBhcGVyY2xpcEljb24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgc3ZnIHtcbiAgICB3aWR0aDogMS4yZW07XG4gICAgaGVpZ2h0OiAxLjJlbTtcbiAgfVxuXG4gIHBhdGgge1xuICAgIGZpbGw6IGN1cnJlbnRDb2xvcjtcbiAgfVxuPC9zdHlsZT5cblxuPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpBbnR1X2FwcGxpY2F0aW9uLXJ0Zi5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDE2IDE2JyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSd4TWluWU1pbic+XG4gIDxwYXRoIGQ9J200MDkgNTMxbC01LjI0NCA2LjczM2MtLjk4MyAxLjI2Mi0uNzA4IDMuNTExLjU1IDQuNDk3IDEuMjU5Ljk4NiAzLjUuNzEgNC40ODQtLjU1Mmw1LjI0NC02LjczMy42NTUtLjg0MmMuNjU2LS44NDIuNDcyLTIuMzQxLS4zNjctMi45OTgtLjgzOS0uNjU4LTIuMzM0LS40NzMtMi45ODkuMzY4bC0uNjU2Ljg0Mi0zLjkzMyA1LjA1LS42NTYuODQyYy0uMzI4LjQyMS0uMjM2IDEuMTcuMTgzIDEuNDk5LjQyLjMyOSAxLjE2Ny4yMzcgMS40OTUtLjE4NGw0LjU4OS01Ljg5MS44MzkuNjU4LTQuNTg5IDUuODkxYy0uNjU2Ljg0Mi0yLjE1IDEuMDI2LTIuOTg5LjM2OC0uODM5LS42NTgtMS4wMjMtMi4xNTctLjM2Ny0yLjk5OGwuNjU2LS44NDIgNC41ODktNS44OTFjLjk4My0xLjI2MiAzLjIyNS0xLjUzOCA0LjQ4NC0uNTUyIDEuMjU5Ljk4NiAxLjUzNCAzLjIzNS41NTEgNC40OTdsLS42NTYuODQyLTUuMjQ0IDYuNzMzYy0xLjMxMSAxLjY4My00LjMgMi4wNTEtNS45NzguNzM2LTEuNjc4LTEuMzE1LTIuMDQ1LTQuMzEzLS43MzQtNS45OTdsNS4yNDQtNi43MzMuODM5LjY1OCcgdHJhbnNmb3JtPSdtYXRyaXgoLjg0NzgyIDAgMCAuODQ1MjEtMzM4Ljg1LTQ0NS42OCknIHN0cm9rZT0nbm9uZScvPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0Usa0JBQUksQ0FDRixLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUNWLENBRUEsbUJBQUssQ0FDSCxJQUFJLENBQUUsWUFDUiJ9 */");
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
				if (detaching) {
					detach_dev(svg);
				}
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

	/* src/Box.svelte generated by Svelte v4.1.1 */
	const file = "src/Box.svelte";

	function add_css(target) {
		append_styles(target, "svelte-1rjx8bp", ".rssbox.svelte-1rjx8bp.svelte-1rjx8bp{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon.svelte-1rjx8bp.svelte-1rjx8bp{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar.svelte-1rjx8bp.svelte-1rjx8bp{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date.svelte-1rjx8bp.svelte-1rjx8bp{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content.svelte-1rjx8bp.svelte-1rjx8bp{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content.svelte-1rjx8bp aside.svelte-1rjx8bp{clear:both;float:right}.rssbox-content.svelte-1rjx8bp aside a.svelte-1rjx8bp{display:block;margin-left:0.5em}.rssbox-image.svelte-1rjx8bp.svelte-1rjx8bp{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold.svelte-1rjx8bp.svelte-1rjx8bp{font-weight:bold}.rssbox-enclosure.svelte-1rjx8bp.svelte-1rjx8bp,.rssbox-source.svelte-1rjx8bp.svelte-1rjx8bp{display:block;width:1em}.rssbox-form.svelte-1rjx8bp.svelte-1rjx8bp{margin-bottom:0.8em}.rssbox-form.svelte-1rjx8bp input.svelte-1rjx8bp{padding:0.5em;background-color:#fff}.rssbox-promo.svelte-1rjx8bp.svelte-1rjx8bp{text-align:right;font-size:0.7em;letter-spacing:0.01em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94LnN2ZWx0ZSIsInNvdXJjZXMiOlsiQm94LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSBcInN2ZWx0ZVwiO1xuICBpbXBvcnQgeyB1cmxzIH0gZnJvbSBcIi4vdXJsc1wiO1xuXG4gIGltcG9ydCBMaW5rSWNvbiBmcm9tIFwiLi9saWIvTGlua0ljb24uc3ZlbHRlXCI7XG4gIGltcG9ydCBSc3NJY29uIGZyb20gXCIuL2xpYi9Sc3NJY29uLnN2ZWx0ZVwiO1xuICBpbXBvcnQgUGFwZXJjbGlwSWNvbiBmcm9tIFwiLi9saWIvUGFwZXJjbGlwSWNvbi5zdmVsdGVcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGZlZWQ7XG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRpY0lkID0gXCJyc3Nib3gtc3RhdGljLXN0eWxlc2hlZXRcIjtcbiAgICBjb25zdCBkeW5hbWljSWQgPSBcInJzc2JveC1keW5hbWljLXN0eWxlc2hlZXRcIjtcblxuICAgIGxldCBzdGF0aWNDc3MgPSB3aW5kb3dbc3RhdGljSWRdO1xuICAgIGxldCBkeW5hbWljQ3NzID0gd2luZG93W2R5bmFtaWNJZF07XG5cbiAgICBpZiAoIXN0YXRpY0Nzcykge1xuICAgICAgc3RhdGljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICBzdGF0aWNDc3MuaWQgPSBzdGF0aWNJZDtcbiAgICAgIHN0YXRpY0Nzcy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcbiAgICAgIHN0YXRpY0Nzcy5ocmVmID0gYCR7dXJscy5hcHB9L2Fzc2V0cy9ib3guY3NzYDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3RhdGljQ3NzKTtcbiAgICB9XG5cbiAgICBpZiAoIWR5bmFtaWNDc3MpIHtcbiAgICAgIGR5bmFtaWNDc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICBkeW5hbWljQ3NzLmlkID0gZHluYW1pY0lkO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChkeW5hbWljQ3NzKTtcbiAgICB9XG5cbiAgICBjb25maWcuc3Vic2NyaWJlKHN0YXRlID0+IHtcbiAgICAgIGNvbnN0IGNvbG9yID0gc3RhdGUubGlua0NvbG9yO1xuXG4gICAgICBpZiAoIWNvbG9yKSByZXR1cm47XG5cbiAgICAgIGxldCBydWxlID1cbiAgICAgICAgYC5yc3Nib3hbZGF0YS1saW5rLWNvbG9yPVwiJHsgY29sb3IgfVwiXSBhIHtcbiAgICAgICAgICBjb2xvcjogJHsgY29sb3IgfTtcbiAgICAgICAgfWA7XG5cbiAgICAgIGlmIChkeW5hbWljQ3NzLmlubmVySFRNTC5pbmRleE9mKHJ1bGUpIDwgMCkgZHluYW1pY0Nzcy5pbm5lckhUTUwgKz0gcnVsZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24ga2IoYnl0ZXMpIHtcbiAgICByZXR1cm4gKGJ5dGVzIC8gMTAwMCkudG9GaXhlZCgyKSArIFwiXFx1MjAwYWtCXCI7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkKGRhdGEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5taW4oMTAwLCBpbWFnZS53aWR0aCk7XG4gICAgICAgIGNvbnN0IGZhY3RvciA9IGltYWdlLndpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCAvIGltYWdlLndpZHRoIDogMTtcblxuICAgICAgICBmdWxmaWxsKHtcbiAgICAgICAgICB3aWR0aDogKGltYWdlLndpZHRoICogZmFjdG9yKSArIFwicHhcIixcbiAgICAgICAgICBoZWlnaHQ6IChpbWFnZS5oZWlnaHQgKiBmYWN0b3IpICsgXCJweFwiXG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgaW1hZ2Uuc3JjID0gZGF0YS5zb3VyY2U7XG4gICAgfSk7XG4gIH1cblxuICAkOiBoZWlnaHQgPSAkY29uZmlnLmhlaWdodCAmJiAkY29uZmlnLmhlaWdodCA+IC0xID8gJGNvbmZpZy5oZWlnaHQgKyBcInB4XCIgOiBcIjEwMCVcIjtcbiAgJDogd2lkdGggPSAkY29uZmlnLndpZHRoID8gJGNvbmZpZy53aWR0aCArIFwicHhcIiA6IFwiMTAwJVwiO1xuICAkOiBpdGVtVGl0bGVDbGFzcyA9ICEkY29uZmlnLmNvbXBhY3QgPyBcImJvbGRcIiA6IFwiXCI7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAucnNzYm94IHtcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICMwMDA7XG4gICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiAwO1xuICAgIC1tb3otYm9yZGVyLXJhZGl1czogMDtcbiAgfVxuXG4gIC5yc3Nib3gtaWNvbiB7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICAgIHdpZHRoOiAxZW07XG4gICAgbWFyZ2luLWxlZnQ6IDAuNWVtO1xuICB9XG5cbiAgLnJzc2JveC10aXRsZWJhciB7XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgY29sb3I6ICMwMDA7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2FkZDhlNjtcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzAwMDtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4wMWVtO1xuICB9XG5cbiAgLnJzc2JveC1kYXRlIHtcbiAgICBtYXJnaW4tdG9wOiAwLjJlbTtcbiAgICBmb250LXNpemU6IDAuOGVtO1xuICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIH1cblxuICAucnNzYm94LWNvbnRlbnQge1xuICAgIGhlaWdodDogYXV0bztcbiAgICBwYWRkaW5nOiAwLjVlbTtcbiAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICAgIGNsZWFyOiBib3RoO1xuICAgIC1tcy1vdmVyZmxvdy1zdHlsZTogLW1zLWF1dG9oaWRpbmctc2Nyb2xsYmFyO1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IGFzaWRlIHtcbiAgICBjbGVhcjogYm90aDtcbiAgICBmbG9hdDogcmlnaHQ7XG4gIH1cblxuICAucnNzYm94LWNvbnRlbnQgYXNpZGUgYSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgbWFyZ2luLWxlZnQ6IDAuNWVtO1xuICB9XG5cbiAgLnJzc2JveC1pbWFnZSB7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICAgIG1hcmdpbjogMCAwIDAuNWVtIDAuNWVtO1xuICAgIGJhY2tncm91bmQtcG9zaXRpb246IGxlZnQgY2VudGVyO1xuICAgIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XG4gICAgYmFja2dyb3VuZC1zaXplOiBjb250YWluO1xuICB9XG5cbiAgLnJzc2JveC1pdGVtLXRpdGxlLmJvbGQge1xuICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICB9XG5cbiAgLnJzc2JveC1lbmNsb3N1cmUsIC5yc3Nib3gtc291cmNlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICB3aWR0aDogMWVtO1xuICB9XG5cbiAgLnJzc2JveC1mb3JtIHtcbiAgICBtYXJnaW4tYm90dG9tOiAwLjhlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZm9ybSBpbnB1dCB7XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgfVxuXG4gIC5yc3Nib3gtcHJvbW8ge1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgIGZvbnQtc2l6ZTogMC43ZW07XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBkYXRhLWxpbmstY29sb3I9J3sgJGNvbmZpZy5saW5rQ29sb3IgfScgY2xhc3M9J3Jzc2JveCByc3NCb3gnIHN0eWxlPSdtYXgtd2lkdGg6IHsgd2lkdGggfTsgYm9yZGVyLWNvbG9yOiB7ICRjb25maWcuZnJhbWVDb2xvciB9OyBib3JkZXItcmFkaXVzOiB7ICRjb25maWcucmFkaXVzIH1weDsgZm9udDogeyAkY29uZmlnLmZvbnRGYWNlIH07IGZsb2F0OiB7ICRjb25maWcuYWxpZ24gfTsnPlxuICB7ICNpZiAhJGNvbmZpZy5oZWFkbGVzcyB9XG4gICAgPGRpdiBjbGFzcz0ncnNzYm94LXRpdGxlYmFyJyBzdHlsZT0nY29sb3I6IHsgJGNvbmZpZy50aXRsZUJhclRleHRDb2xvciB9OyBiYWNrZ3JvdW5kLWNvbG9yOiB7ICRjb25maWcudGl0bGVCYXJDb2xvciB9OyBib3JkZXItYm90dG9tLWNvbG9yOiB7ICRjb25maWcuZnJhbWVDb2xvciB9Oyc+XG4gICAgICB7ICNpZiAkY29uZmlnLnNob3dYbWxCdXR0b24gfVxuICAgICAgICA8ZGl2IGNsYXNzPSdyc3Nib3gtaWNvbic+XG4gICAgICAgICAgPGEgaHJlZj0neyAkY29uZmlnLnVybCB9JyB0aXRsZT0neyAkZmVlZC5mb3JtYXQgfSB7ICRmZWVkLnZlcnNpb24gfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfSc+XG4gICAgICAgICAgICA8UnNzSWNvbi8+XG4gICAgICAgICAgPC9hPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIHsgL2lmIH1cbiAgICAgIDxkaXY+XG4gICAgICAgIDxhIGhyZWY9J3sgJGZlZWQubGluayB9JyBzdHlsZT0nY29sb3I6IHsgJGNvbmZpZy50aXRsZUJhclRleHRDb2xvciB9Oyc+XG4gICAgICAgICAgeyAkZmVlZC50aXRsZSB9XG4gICAgICAgIDwvYT5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWRhdGUnPlxuICAgICAgICB7IGZlZWQuZm9ybWF0RGF0ZSgkZmVlZC5kYXRlKSB9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgeyAvaWYgfVxuXG4gIDxkaXYgY2xhc3M9J3Jzc2JveC1jb250ZW50IHJzc0JveENvbnRlbnQnIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiB7ICRjb25maWcuYm94RmlsbENvbG9yIH07IGhlaWdodDogeyBoZWlnaHQgfTsnPlxuICAgIHsgI2lmICRmZWVkLmltYWdlICYmICEkY29uZmlnLmNvbXBhY3QgfVxuICAgICAgeyAjYXdhaXQgbG9hZCgkZmVlZC5pbWFnZSkgdGhlbiBpbWFnZSB9XG4gICAgICAgIDxhIGhyZWY9J3sgJGZlZWQuaW1hZ2UubGluayB9JyB0aXRsZT0neyAkZmVlZC5pbWFnZS50aXRsZSB9Jz5cbiAgICAgICAgICA8ZGl2IGFsdD0neyAkZmVlZC5pbWFnZS5kZXNjcmlwdGlvbiB9JyBjbGFzcz0ncnNzYm94LWltYWdlJyBzdHlsZT0nYmFja2dyb3VuZC1pbWFnZTogdXJsKHsgJGZlZWQuaW1hZ2Uuc291cmNlIH0pOyB3aWR0aDogeyBpbWFnZS53aWR0aCB9OyBoZWlnaHQ6IHsgaW1hZ2UuaGVpZ2h0IH07Jz48L2Rpdj5cbiAgICAgICAgPC9hPlxuICAgICAgeyAvYXdhaXQgfVxuICAgIHsgL2lmIH1cblxuICAgIHsgI2VhY2ggJGZlZWQuaXRlbXMgYXMgaXRlbSwgaW5kZXggfVxuICAgICAgeyAjaWYgaW5kZXggPCAkY29uZmlnLm1heEl0ZW1zIH1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWl0ZW0tY29udGVudCByc3NCb3hJdGVtQ29udGVudCcgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGV4dENvbG9yIH0nPlxuICAgICAgICAgIHsgI2lmIGl0ZW0udGl0bGUgfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWl0ZW0tdGl0bGUgeyBpdGVtVGl0bGVDbGFzcyB9Jz5cbiAgICAgICAgICAgICAgeyAjaWYgaXRlbS5saW5rIH1cbiAgICAgICAgICAgICAgICA8YSBocmVmPSd7IGl0ZW0ubGluayB9Jz5cbiAgICAgICAgICAgICAgICAgIHtAaHRtbCBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIHsgOmVsc2UgfVxuICAgICAgICAgICAgICAgIHtAaHRtbCBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgICAgeyAvaWYgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgeyAvaWYgfVxuXG4gICAgICAgICAgeyAjaWYgISRjb25maWcuY29tcGFjdCB9XG4gICAgICAgICAgICA8YXNpZGU+XG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0uc291cmNlIH1cbiAgICAgICAgICAgICAgICA8YSBocmVmPSd7IGl0ZW0uc291cmNlLnVybCB9JyB0aXRsZT0neyBpdGVtLnNvdXJjZS50aXRsZSB9JyBjbGFzcz0ncnNzYm94LXNvdXJjZSc+XG4gICAgICAgICAgICAgICAgICB7ICNpZiBpdGVtLnNvdXJjZS51cmwuZW5kc1dpdGgoXCIueG1sXCIpIH1cbiAgICAgICAgICAgICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICAgICAgICAgICAgeyA6ZWxzZSB9XG4gICAgICAgICAgICAgICAgICAgIDxMaW5rSWNvbi8+XG4gICAgICAgICAgICAgICAgICB7IC9pZiB9XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICB7IC9pZiB9XG5cbiAgICAgICAgICAgICAgeyAjaWYgaXRlbS5lbmNsb3N1cmVzIH1cbiAgICAgICAgICAgICAgICB7ICNlYWNoIGl0ZW0uZW5jbG9zdXJlcyBhcyBlbmNsb3N1cmUgfVxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0neyBlbmNsb3N1cmUudXJsIH0nIHRpdGxlPSd7IGtiKGVuY2xvc3VyZS5sZW5ndGgpIH0geyBlbmNsb3N1cmUudHlwZSB9JyBjbGFzcz0ncnNzYm94LWVuY2xvc3VyZSc+XG4gICAgICAgICAgICAgICAgICAgIDxQYXBlcmNsaXBJY29uLz5cbiAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICB7IC9lYWNoIH1cbiAgICAgICAgICAgICAgeyAvaWYgfVxuICAgICAgICAgICAgPC9hc2lkZT5cbiAgICAgICAgICAgIHtAaHRtbCBpdGVtLmRlc2NyaXB0aW9uIH1cbiAgICAgICAgICB7IC9pZiB9XG4gICAgICAgIDwvZGl2PlxuICAgICAgeyAvaWYgfVxuICAgIHsgL2VhY2ggfVxuXG4gICAgeyAjaWYgJGZlZWQuaW5wdXQgfVxuICAgICAgPGZvcm0gY2xhc3M9J3Jzc2JveC1mb3JtJyBtZXRob2Q9J2dldCcgYWN0aW9uPSd7ICRmZWVkLmlucHV0LmxpbmsgfSc+XG4gICAgICAgIDxpbnB1dCB0eXBlPSd0ZXh0JyBuYW1lPSd7ICRmZWVkLmlucHV0Lm5hbWUgfScgcGxhY2Vob2xkZXI9J0VudGVyIHNlYXJjaCAmYW1wOyBoaXQgcmV0dXJu4oCmJyBkYXRhLXBsYWNlaG9sZGVyPSd7ICRmZWVkLmlucHV0LmRlc2NyaXB0aW9uIH0nPlxuICAgICAgPC9mb3JtPlxuICAgIHsgL2lmIH1cbiAgICA8ZGl2IGNsYXNzPSdyc3Nib3gtcHJvbW8gcnNzQm94UHJvbW8nPlxuICAgICAgPGEgaHJlZj0neyB1cmxzLmFwcCB9JyBzdHlsZT0nY29sb3I6IHsgJGNvbmZpZy50ZXh0Q29sb3IgfSc+UlNTIEJveCBieSBwM2sub3JnPC9hPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJFRSxxQ0FBUSxDQUNOLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUN0QixXQUFXLENBQUUsVUFBVSxDQUN2QixRQUFRLENBQUUsTUFBTSxDQUNoQixhQUFhLENBQUUsQ0FBQyxDQUNoQixrQkFBa0IsQ0FBRSxDQUN0QixDQUVBLDBDQUFhLENBQ1gsS0FBSyxDQUFFLEtBQUssQ0FDWixLQUFLLENBQUUsR0FBRyxDQUNWLFdBQVcsQ0FBRSxLQUNmLENBRUEsOENBQWlCLENBQ2YsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsSUFBSSxDQUNYLGdCQUFnQixDQUFFLE9BQU8sQ0FDekIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUM3QixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFDbEIsQ0FFQSwwQ0FBYSxDQUNYLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxNQUNmLENBRUEsNkNBQWdCLENBQ2QsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsS0FBSyxDQUNkLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLGdCQUFnQixDQUFFLElBQUksQ0FDdEIsS0FBSyxDQUFFLElBQUksQ0FDWCxrQkFBa0IsQ0FBRSx3QkFDdEIsQ0FFQSw4QkFBZSxDQUFDLG9CQUFNLENBQ3BCLEtBQUssQ0FBRSxJQUFJLENBQ1gsS0FBSyxDQUFFLEtBQ1QsQ0FFQSw4QkFBZSxDQUFDLEtBQUssQ0FBQyxnQkFBRSxDQUN0QixPQUFPLENBQUUsS0FBSyxDQUNkLFdBQVcsQ0FBRSxLQUNmLENBRUEsMkNBQWMsQ0FDWixLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ3ZCLG1CQUFtQixDQUFFLElBQUksQ0FBQyxNQUFNLENBQ2hDLGlCQUFpQixDQUFFLFNBQVMsQ0FDNUIsZUFBZSxDQUFFLE9BQ25CLENBRUEsa0JBQWtCLG1DQUFNLENBQ3RCLFdBQVcsQ0FBRSxJQUNmLENBRUEsK0NBQWlCLENBQUUsNENBQWUsQ0FDaEMsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsR0FDVCxDQUVBLDBDQUFhLENBQ1gsYUFBYSxDQUFFLEtBQ2pCLENBRUEsMkJBQVksQ0FBQyxvQkFBTSxDQUNqQixPQUFPLENBQUUsS0FBSyxDQUNkLGdCQUFnQixDQUFFLElBQ3BCLENBRUEsMkNBQWMsQ0FDWixVQUFVLENBQUUsS0FBSyxDQUNqQixTQUFTLENBQUUsS0FBSyxDQUNoQixjQUFjLENBQUUsTUFDbEIifQ== */");
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
				add_location(a, file, 170, 8, 4072);
				add_location(div0, file, 169, 6, 4058);
				attr_dev(div1, "class", "rssbox-date svelte-1rjx8bp");
				add_location(div1, file, 174, 6, 4202);
				attr_dev(div2, "class", "rssbox-titlebar svelte-1rjx8bp");
				set_style(div2, "color", /*$config*/ ctx[2].titleBarTextColor);
				set_style(div2, "background-color", /*$config*/ ctx[2].titleBarColor);
				set_style(div2, "border-bottom-color", /*$config*/ ctx[2].frameColor);
				add_location(div2, file, 161, 4, 3624);
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
				if (detaching) {
					detach_dev(div2);
				}

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
				add_location(a, file, 164, 10, 3870);
				attr_dev(div, "class", "rssbox-icon svelte-1rjx8bp");
				add_location(div, file, 163, 8, 3834);
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
				if (detaching) {
					detach_dev(div);
				}

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
				if (detaching) {
					detach_dev(await_block_anchor);
				}

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
				add_location(div, file, 184, 10, 4590);
				attr_dev(a, "href", a_href_value = /*$feed*/ ctx[6].image.link);
				attr_dev(a, "title", a_title_value = /*$feed*/ ctx[6].image.title);
				attr_dev(a, "class", "svelte-1rjx8bp");
				add_location(a, file, 183, 8, 4518);
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
				if (detaching) {
					detach_dev(a);
				}
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
				add_location(div, file, 191, 8, 4893);
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
				if (detaching) {
					detach_dev(div);
				}

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
				add_location(div, file, 193, 12, 5023);
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
				if (detaching) {
					detach_dev(div);
				}

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
				html_tag = new HtmlTag(false);
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
				if (detaching) {
					detach_dev(html_anchor);
					html_tag.d();
				}
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
				add_location(a, file, 195, 16, 5122);
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
				if (detaching) {
					detach_dev(a);
				}
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
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				attr_dev(aside, "class", "svelte-1rjx8bp");
				add_location(aside, file, 205, 12, 5373);
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
				if (detaching) {
					detach_dev(aside);
					detach_dev(t1);
					detach_dev(html_anchor);
					html_tag.d();
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
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
			if (dirty & /*$feed*/ 64) show_if = null;
			if (show_if == null) show_if = !!/*item*/ ctx[7].source.url.endsWith(".xml");
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
				add_location(a, file, 207, 16, 5431);
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
				if (detaching) {
					detach_dev(a);
				}

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
		let each_value_1 = ensure_array_like_dev(/*item*/ ctx[7].enclosures);
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
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*$feed, kb*/ 64) {
					each_value_1 = ensure_array_like_dev(/*item*/ ctx[7].enclosures);
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
				if (detaching) {
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
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
				add_location(a, file, 218, 18, 5845);
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
				if (detaching) {
					detach_dev(a);
				}

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
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
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
				add_location(input, file, 232, 8, 6288);
				attr_dev(form, "class", "rssbox-form svelte-1rjx8bp");
				attr_dev(form, "method", "get");
				attr_dev(form, "action", form_action_value = /*$feed*/ ctx[6].input.link);
				add_location(form, file, 231, 6, 6210);
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
				if (detaching) {
					detach_dev(form);
				}
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
		let each_value = ensure_array_like_dev(/*$feed*/ ctx[6].items);
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
				add_location(a, file, 236, 6, 6503);
				attr_dev(div0, "class", "rssbox-promo rssBoxPromo svelte-1rjx8bp");
				add_location(div0, file, 235, 4, 6458);
				attr_dev(div1, "class", "rssbox-content rssBoxContent svelte-1rjx8bp");
				set_style(div1, "background-color", /*$config*/ ctx[2].boxFillColor);
				set_style(div1, "height", /*height*/ ctx[5]);
				add_location(div1, file, 180, 2, 4305);
				attr_dev(div2, "data-link-color", div2_data_link_color_value = /*$config*/ ctx[2].linkColor);
				attr_dev(div2, "class", "rssbox rssBox svelte-1rjx8bp");
				set_style(div2, "max-width", /*width*/ ctx[4]);
				set_style(div2, "border-color", /*$config*/ ctx[2].frameColor);
				set_style(div2, "border-radius", /*$config*/ ctx[2].radius + "px");
				set_style(div2, "font", /*$config*/ ctx[2].fontFace);
				set_style(div2, "float", /*$config*/ ctx[2].align);
				add_location(div2, file, 159, 0, 3365);
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
					if (each_blocks[i]) {
						each_blocks[i].m(div1, null);
					}
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
					each_value = ensure_array_like_dev(/*$feed*/ ctx[6].items);
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
				if (detaching) {
					detach_dev(div2);
				}

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
				staticCss.href = `${urls.app}/assets/box.css`;
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

		$$self.$$.on_mount.push(function () {
			if (feed === undefined && !('feed' in $$props || $$self.$$.bound[$$self.$$.props['feed']])) {
				console.warn("<Box> was created without expected prop 'feed'");
			}

			if (config === undefined && !('config' in $$props || $$self.$$.bound[$$self.$$.props['config']])) {
				console.warn("<Box> was created without expected prop 'config'");
			}
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
			itemTitleClass,
			width,
			height,
			$config,
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
