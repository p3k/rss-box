var app = (function () {
	'use strict';

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

	let src_url_equal_anchor;

	/**
	 * @param {string} element_src
	 * @param {string} url
	 * @returns {boolean}
	 */
	function src_url_equal(element_src, url) {
		if (element_src === url) return true;
		if (!src_url_equal_anchor) {
			src_url_equal_anchor = document.createElement('a');
		}
		// This is actually faster than doing URL(..).href
		src_url_equal_anchor.href = url;
		return element_src === src_url_equal_anchor.href;
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

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
	}

	function set_store_value(store, ret, value) {
		store.set(value);
		return ret;
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

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
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
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

	/** @returns {number} */
	function to_number(value) {
		return value === '' ? null : +value;
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
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
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
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
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
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
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
	 * @param {Element} node
	 * @param {string} property
	 * @param {any} [value]
	 * @returns {void}
	 */
	function prop_dev(node, property, value) {
		node[property] = value;
		dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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
	 * Creates a `Readable` store that allows reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#readable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function readable(value, start) {
		return {
			subscribe: writable(value, start).subscribe
		};
	}

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

	var version = "23.7.22";
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

	const app$1 = readable({ description, version });
	const config = ConfigStore();
	const feed = FeedStore();
	const referrers = writable([]);

	referrers.fetch = fetchReferrers.bind(referrers);

	// For debugging
	//window.stores = { app, config, feed, referrers };

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* src/lib/Changes.svelte generated by Svelte v4.1.1 */
	const file$a = "src/lib/Changes.svelte";

	function add_css$9(target) {
		append_styles(target, "svelte-y33bja", "h3.svelte-y33bja.svelte-y33bja{display:inline-block}summary.svelte-y33bja+.svelte-y33bja{margin-top:0}summary.svelte-y33bja.svelte-y33bja{outline:none}li.svelte-y33bja+li.svelte-y33bja{margin-top:0.5em}small.svelte-y33bja.svelte-y33bja{display:inline-block;margin-right:0.5em;color:#bbb}code.svelte-y33bja.svelte-y33bja{background-color:#ffc;font-size:0.8em;font-weight:200}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhbmdlcy5zdmVsdGUiLCJzb3VyY2VzIjpbIkNoYW5nZXMuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgaDMge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgfVxuXG4gIHN1bW1hcnkgKyAqIHtcbiAgICBtYXJnaW4tdG9wOiAwO1xuICB9XG5cbiAgc3VtbWFyeSB7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIGxpICsgbGkge1xuICAgIG1hcmdpbi10b3A6IDAuNWVtO1xuICB9XG5cbiAgc21hbGwge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICBtYXJnaW4tcmlnaHQ6IDAuNWVtO1xuICAgIGNvbG9yOiAjYmJiO1xuICB9XG5cbiAgY29kZSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmYztcbiAgICBmb250LXNpemU6IDAuOGVtO1xuICAgIGZvbnQtd2VpZ2h0OiAyMDA7XG4gIH1cbjwvc3R5bGU+XG5cbjxkZXRhaWxzPlxuICA8c3VtbWFyeT5cbiAgICA8aDM+Q2hhbmdlIExvZzwvaDM+XG4gIDwvc3VtbWFyeT5cblxuICA8cD5cbiAgICA8c21hbGw+MjAyMy0wNy0yMjwvc21hbGw+XG4gICAgUmVwbGFjZWQgWWFybiB3aXRoIE5QTSwgdXBkYXRlZCBhbGwgZGVwZW5kZW5jaWVzIOKAkyBleGNlcHQgZm9yIFN2ZWx0ZSwgd2hpY2ggSSBqdXN0IGNhbm5vdCBnZXQgdG8gd29yayB3aXRoIHZlcnNpb24gJmd0OzMuNDAuMCDwn6S3IOKAkyBhbmQgbWFkZSBzdXJlLCBIVE1MIHZpZGVvcyBhcmUgbmljZWx5IGRpc3BsYXllZCBpbiB0aGUgUlNTIGJveC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDIxLTEyLTExPC9zbWFsbD5cbiAgICBEZXBlbmRlbmN5IHVwZGF0ZXMgYW5kIGNvc21ldGljcy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDIxLTA1LTE2PC9zbWFsbD5cbiAgICBKdXN0IHNvbWUgbWlub3IgZGVwZW5kZW5jeSB1cGRhdGVzIGFuZCBhMTF5IGZpeGVzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMjAtMTEtMjA8L3NtYWxsPlxuICAgIEJlY2F1c2UgPGEgaHJlZj1cImh0dHBzOi8vY2xvdWQuZ29vZ2xlLmNvbS9hcHBlbmdpbmUvXCI+QmlnIEcgaXMgbW9uZXRpemluZzwvYT4gKGlmIG5vdCBmdWxseSBhYmFuZG9uaW5nKSBvbmUgcHJvamVjdCBzZXJ2aW5nIHRoZSBjb21tb24gZ29vZCBhZnRlciBhbm90aGVyLCBJIHJld3JvdGUgdGhlIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vcDNrL2pzb24za1wiPkpTT05QIHNlcnZpY2VzIGZvciBtb2Rfd3NnaTwvYT4gdG8gcnVuIG9uIG15IG93biBzZXJ2ZXIgZnJvbSBub3cgb24uIE5vdCBtdWNoIG5ld3Mgb24gdGhlIGZyb250LWVuZCBzaWRlLCBqdXN0IHRoZSB1c3VhbCBkZXBlbmRlbmN5IHVwZ3JhZGUgYW5kIHNvbWUgbWlub3IgZml4ZXMuIEkgaG9wZSBldmVyeXRoaW5nIHdvcmtzIGFzIGl0IHNob3VsZCBiZSBhbmQgd2lzaCBldmVyeW9uZSBhbGwgdGhlIGJlc3QsIGVzcGVjaWFsbHkgdG8gdGhvc2Ugd2hvIG5lZWQgaXQgbW9zdCBpbiB0aGVzZSBwYW5kZW1pYyB0aW1lcy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDIwLTAxLTA2PC9zbWFsbD5cbiAgICBOb3Qgc3VyZSBob3cgaXQgcmVhbGx5IGhhcHBlbmVkIGJ1dCBJIGdvdCBwcmV0dHkgbXVjaCBpbW1lcnNlZCBpbnRvIHdvcmtpbmcgb24gdGhpcyBwcm9qZWN0IGR1cmluZyB0aGUgaG9saWRheSBzZWFzb27igKYgU28gbm93IHdlIGdvdDpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPkJldHRlciBjYWNoaW5nIHN1cHBvcnQgZm9yIGZlZWRzIGFuZCByZWZlcnJlcnM8L2xpPlxuICAgIDxsaT5SU1MgaWNvbiBuZXh0IHRvIHJlZmVycmVyIGRpcmVjdGx5IGxpbmtpbmcgaXRzIGZlZWQgVVJMIChpZiBhdmFpbGFibGUpIHRvIHRoaXMgYXBwPC9saT5cbiAgICA8bGk+VXBncmFkZSB0byBTdmVsdGUgMyAod2hpY2ggd2FzIHJhdGhlciB0ZWRpb3VzKSDwn5iwPC9saT5cbiAgICA8bGk+UmUtZXN0YWJsaXNoZWQgc3VwcG9ydCBmb3Igb2xkZXIgYnJvd3NlcnMgKGxvb2tpbmcgYXQgeW91LCBJbnRlcm5ldCBFeHBsb3JlciAxMSkg8J+RtDwvbGk+XG4gICAgPGxpPk11bHRpcGxlIHNtYWxsIGZpeGVzIGFuZCBpbXByb3ZlbWVudHMsIHRha2UgYSBsb29rIGF0IHRoZSA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vcDNrL3Jzcy1ib3gvY29tbWl0cy9tYXN0ZXInPmNvbW1pdCBsb2c8L2E+IGZvciBkZXRhaWxzPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxOS0xMi0xNTwvc21hbGw+XG4gICAgVXBncmFkZWQgdGhlIEpTT05QIHByb3h5IHRvIFB5dGhvbiAzLjcgYW5kIHNsaWdodGx5IHJldG91Y2hlZCB0aGUgY29uZmlndXJhdGlvbiBmb3JtLiBBIG1lcnJ5IGVuZGluZyBmb3IgMjAxOSBhbmQgYSBoYXBweSBuZXcgeWVhciDwn46JIDxlbT5JdOKAmXMgaGluZHNpZ2h0ITxlbT5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDE4LTAxLTE5PC9zbWFsbD5cbiAgICBNb3JlIHRoYW4gMTUgeWVhcnMgKGFuZCBzdGlsbCBjb3VudGluZ+KApikgYWZ0ZXIgaXRzIGluY2VwdGlvbiB0aGlzIGxpdHRsZSBzZXJ2aWNlIGlzIHN0aWxsIGxpdmUgYW5kIGtpY2tpbmchIFRoZSBiZXN0IHBhcnQgb2YgdGhpcyBob2JieSBwcm9qZWN04oCZcyBsb25nLXJ1bm5pbmcgdHJhaXQ6IHRoaXMgeWVhciBicmluZ3MgYSBjb21wbGV0ZSByZXdyaXRlIGFuZCBvdmVyaGF1bCB3aXRoIGFuIGV4dGVuc2l2ZSBsaXN0IG9mIHVwZGF0ZXMg4oCTIGFuZCBvbmx5IHNtYWxsIGNoYW5nZXMgaW4gZnVuY3Rpb25hbGl0eTpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPkFkZGVkIGJhc2ljIHN1cHBvcnQgZm9yIEF0b20gMS4wIGZlZWRzIPCflKU8L2xpPlxuICAgIDxsaT5BZGRlZCBzdXBwb3J0IGZvciBtdWx0aXBsZSBlbmNsb3N1cmVzIChSU1MgMC45Myk8L2xpPlxuICAgIDxsaT5SZXBsYWNlZCB2YWx1ZSBvZiAtMSBmb3IgYXV0b21hdGljIGNvbnRlbnQgaGVpZ2h0IHdpdGgg4oCcZW1wdHnigJ0gdmFsdWU8L2xpPlxuICAgIDxsaT5BZGRlZCBzdXBwb3J0IGZvciDigJxlbXB0eeKAnSB2YWx1ZSB0byBib3ggd2lkdGggKG5vdyBjYWxsZWQg4oCdbWF4LiB3aWR0aOKAnSk8L2xpPlxuICAgIDxsaT5SZWR1Y2VkIHRvdGFsIHNpemUgb2YgZW1iZWRkZWQgZG93bmxvYWQgYnkgbW9yZSB0aGFuIDYwJSDimqE8L2xpPlxuICAgIDxsaT5JbmNyZWFzZWQgcGVyZm9ybWFuY2Ugb2YgbG9hZGluZyBhbmQgcmVuZGVyaW5nIGJveGVzPC9saT5cbiAgICA8bGk+SW1wbGVtZW50ZWQgcmVzcG9uc2l2ZSBDU1MgZm9yIGJvdGgsIGJveGVzIGFuZCBjb25maWd1cmF0aW9uIGFwcDwvbGk+XG4gICAgPGxpPlJlcGxhY2VkIGJpdG1hcCBpY29ucyB3aXRoIHNjYWxhYmxlIHZlY3RvciBncmFwaGljczwvbGk+XG4gICAgPGxpPkNvbXBsZXRlbHkgcmV3cm90ZSB0aGUgYXBwIGNvZGUgdXNpbmcgPGEgaHJlZj0naHR0cHM6Ly9zdmVsdGUudGVjaG5vbG9neSc+U3ZlbHRlPC9hPiBhbmQgPGEgaHJlZj0naHR0cHM6Ly9taW5jc3MuY29tLyc+bWluLmNzczwvYT48L2xpPlxuICAgIDxsaT5SZXBsYWNlZCByZW1haW5pbmcgalF1ZXJ5IGNvZGUgd2l0aCB2YW5pbGxhIEphdmFTY3JpcHQ8L2xpPlxuICAgIDxsaT5NaWdyYXRlZCBidWlsZCBzY3JpcHRzIHRvIFJvbGx1cCBhbmQgWWFybjwvbGk+XG4gICAgPGxpPkFkZGVkIHN1cHBvcnQgZm9yIG1pc3NpbmcgYnJvd3NlciBmZWF0dXJlcyB2aWEgPGEgaHJlZj0naHR0cHM6Ly9wb2x5ZmlsbHMuaW8nPnBvbHlmaWxscy5pbzwvYT48L2xpPlxuICAgIDxsaT5EaXNjb250aW51ZWQgc3VwcG9ydCBmb3Igb2xkZXIgYnJvd3NlcnMgKE1TSUUgJmx0OyAxMSk8L2xpPlxuICAgIDxsaT5CdW1wZWQgbWFqb3IgdmVyc2lvbiB0byAxOCAoYWthIHRoZSB5ZWFyKSwgZ2V0dGluZyByaWQgb2Ygc2VtYW50aWMgdmVyc2lvbmluZyBkdWUgdG8gbGFjayBvZiBzZW1hbnRpY3Mg8J+QsTwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTYtMDMtMTI8L3NtYWxsPlxuICAgIENvbXBsZXRlbHkgcmV3cm90ZSBidWlsZCBlbnZpcm9ubWVudCB1c2luZyBXZWJQYWNrLiBTd2l0Y2hlZCB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3Azay9yc3MtYm94Jz5zb3VyY2UgcmVwb3NpdG9yeTwvYT4gZnJvbSBTVk4gdG8gR2l0LCBob3N0ZWQgYXQgR2l0aHViLiBUaGlzIGRlc2VydmVzIGEgbmV3IG1ham9yIHZlcnNpb24gbnVtYmVyIVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMTItMzA8L3NtYWxsPlxuICAgIEFkZGVkIHNpbXBsZSBjb2RlIHRvIG1vZGlmeSB0aGUgd2lkdGggYXR0cmlidXRlIG9mIGlmcmFtZSwgb2JqZWN0IGFuZCBlbWJlZCBlbGVtZW50cyB0byBtYWtlIHRoZW0gZml0IGluIHRoZSBib3guIEFsc286IGJ1bXBlZCB2ZXJzaW9uLiA8aT5BIGhhcHB5IG5ldyB5ZWFyIDIwMTMsIGV2ZXJib2R5ITwvaT5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTEwLTI2PC9zbWFsbD5cbiAgICBBZGRlZCBzZWN0aW9uIGFib3V0IENyZWF0aXZlIENvbW1vbnMgTGljZW5zZSwgYmVsb3cuIEluIG90aGVyIHdvcmRzOiB5b3UgY2FuIG5vdyBsZWdhbGx5IHJ1biBteSBjb2RlIG9uIHlvdXIgb3duIHNlcnZlci4gKFlvdSBldmVuIGNvdWxkIHJlbW92ZSB0aGUgdGlueSByZWZlcmVuY2UgdG8gdGhpcyBwYWdlIGluIHRoZSBmb290ZXIgb2YgdGhlIGJveC4pIEhvd2V2ZXIsIEkgd291bGQgbGlrZSB0byBhc2sgeW91IGZvciB0d28gdGhpbmdzIGlmIHlvdSB3YW50IHRvIGRvIHNvOlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBVc2UgeW91ciBvd24gPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL3Azay9qc29uM2snPkpTT05QIHByb3h5PC9hPiDigJMgZXNwZWNpYWxseSwgd2hlbiB5b3UgZXhwZWN0IGEgaGlnaCBsb2FkIG9uIHlvdXIgc2VydmVyLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUGxlYXNlIHN1cHBvcnQgdGhlIHNlcnZpY2Ugd2l0aCBhIDxhIGhyZWY9J2h0dHA6Ly9mbGF0dHIuY29tL3RoaW5nLzY4MTg4MS9KYXZhU2NyaXB0LVJTUy1Cb3gtVmlld2VyJz5kb25hdGlvbjwvYT4uXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wOC0wMTwvc21hbGw+XG4gICAgQWRkZWQgdHdvIG5ldywgZXhwZXJpbWVudGFsIGZlYXR1cmVzIOKAkyBhbmQgdGh1cywgaW5jcmVhc2VkIHZlcnNpb24gdG8gMy4zOlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBUaGUgaGVpZ2h0IG9mIHRoZSBpbm5lciBib3ggY29udGVudCBjYW4gbm93IGJlIGRlZmluZWQgYnkgYSBwaXhlbCB2YWx1ZS4gSWYgdGhlIGhlaWdodCBpcyBsZXNzIHRoYW4gdGhlIHNwYWNlIG5lZWRlZCBieSB0aGUgZGVzaXJlZCBhbW91bnQgb2YgaXRlbXMgeW91IGNhbiB2ZXJ0aWNhbGx5IHNjcm9sbCB0aGUgY29udGVudC4gQSB2YWx1ZSBvZiA8Y29kZT4tMTwvY29kZT4gZW5hYmxlcyB0aGUgZGVmYXVsdCBiZWhhdmlvciBhbmQgYXV0b21hdGljYWxseSBzZXRzIHRoZSBoZWlnaHQgYWNjb3JkaW5nIHRvIHRoZSBkaXNwbGF5aW5nIGl0ZW1zLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgVGhlIHNvLWNhbGxlZCDigJxoZWFkbGVzc+KAnSBtb2RlIHJlbW92ZXMgdGhlIHRpdGxlYmFyIGFuZCB0aGUgZnJhbWUgZnJvbSB0aGUgYm94LiBUaGlzIHdheSB0aGUgYm94IGNhbiBiZSB1c2VkIG1vcmUgZmxleGlibHkgaW4gc3BlY2lhbCBzaXR1YXRpb25zLiBIb3dldmVyLCB0aGlzIGZlYXR1cmUgc29tZWhvdyB1bmRlcm1pbmVzIGFuIFJTUyBmZWVk4oCZcyBhdXRob3JpdHkgc28gSSBjb3VudCBvbiB5b3VyIGZhaXJuZXNzIHRvIGdpdmUgY3JlZGl0IHdoZXJlIGNyZWRpdCBpcyBkdWUhXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNy0xNjwvc21hbGw+XG4gICAgU2xpZ2h0bHkgbW9kaWZpZWQgb3V0cHV0IG9mIHRoZSBIVE1MIGNvZGUgdG8gYmUgdXNhYmxlIHdpdGggYm90aCwgdW5zZWN1cmVkIGFuZCBzZWN1cmVkIChIVFRQUykgd2ViIHNlcnZlcnMuIFlvdSBjYW4gdXBkYXRlIGFscmVhZHkgZW1iZWRkZWQgY29kZSBlYXNpbHkgYnkgcmVtb3ZpbmcgdGhlIDxjb2RlPmh0dHA6PC9jb2RlPiBwYXJ0IGZyb20gdGhlIDxjb2RlPnNyYzwvY29kZT4gYXR0cmlidXRlIG9mIHRoZSA8Y29kZT4mbHQ7c2NyaXB0Jmd0OzwvY29kZT4gZWxlbWVudDogPGNvZGU+Jmx0O3NjcmlwdCBzcmM9J2h0dHA6Ly9wM2sub3JnL3Jzc+KApicmZ3Q7PC9jb2RlPiBiZWNvbWVzIDxjb2RlPiZsdDtzY3JpcHQgc3JjPScvL3Azay5vcmcvcnNz4oCmJyZndDs8L2NvZGU+LlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDctMTM8L3NtYWxsPlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBGaXhlZCBJRSBidWcgKOKAnGlubmVySFRNTCBpcyBudWxsIG9yIG5vdCBhbiBvYmplY3TigJ0pIGNhdXNlZCBieSB1c2luZyBqUXVlcnnigJlzIGh0bWwoKSBtZXRob2QgaW5zdGVhZCBvZiB0ZXh0KCkgd2hlbiBwYXJzaW5nIGEgPGNvZGU+Jmx0O2NvbnRlbnQ6ZW5jb2RlZCZndDs8L2NvZGU+IGVsZW1lbnQuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBDaGFuZ2VkIHByaW9yaXR5IG9mIGVsZW1lbnRzOiBvbmx5IGNoZWNrIGZvciA8Y29kZT4mbHQ7Y29udGVudDplbmNvZGVkJmd0OzwvY29kZT4gaWYgICAgIDxjb2RlPiZsdDtkZXNjcmlwdGlvbiZndDs8L2NvZGU+IGlzIG5vdCBhdmFpbGFibGUuXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNi0wNDwvc21hbGw+XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIEltcGxlbWVudGVkIHNtYWxsIHJvdXRpbmUgdG8gcmVzaXplIGltYWdlcyBjb250YWluZWQgaW4gdGhlIGZlZWQgY29udGVudCB0byBmaXQgaW4gdGhlIGJveC5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIHN1cHBvcnQgZm9yIG5ldyBIVE1MNSBmb3JtIGlucHV0IHR5cGVzIGFuZCB0aGVpciB2YWxpZGF0aW9uLlxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMTItMDUtMzE8L3NtYWxsPlxuICAgIEdvbmUgJmJldGE7ZXRhISDigJMgd2l0aCB0aHJlZSB0aW55IGFkZGl0b25zOlxuICA8L3A+XG4gIDx1bD5cbiAgICA8bGk+XG4gICAgICBBZGRlZCA8Y29kZT4mbHQ7bm9zY3JpcHQmZ3Q7PC9jb2RlPiBlbGVtZW50IGZvciBicm93c2VycyBwcm92aWRpbmcgbm8gSmF2YVNjcmlwdCBlbmdpbmUuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBvcHRpb24gdG8gY2FsbCB0aGUgY29uZmlndXJhdG9yIHdpdGggYSBVUkwgaW4gdGhlIHF1ZXJ5IHN0cmluZy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGEgbGluayB0byB0aGUgVzNDIGZlZWQgdmFsaWRhdG9yIHRvIHRoZSBjb250ZW50cyBvZiBhIGJveCBkaXNwbGF5aW5nIGFuIFJTUyBlcnJvci5cbiAgICA8L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTE5PC9zbWFsbD5cbiAgICBBcG9sb2dpZXMgZm9yIHRoZSBSU1MgQm94ZXMgbm90IHNob3dpbmcgdXAgb24geW91ciBwYWdlcyBkdXJpbmcgdGhlIGxhc3QgZmV3IGRheXMuIEkgbWFkZSBhIHN0dXBpZCBtaXN0YWtlIHRoYXQgY2F1c2VkIG9ubHkgdGhlIHNldHVwIHBhZ2UgdG8gcmVuZGVyIGNvcnJlY3RseSDigJMgYW5kIEkgZGlkIG5vdCBjaGVjayBhbnkgZW1iZWRkZWQgc2NyaXB0LiA8aT5CdW1tZXIhPC9pPlxuICA8L3A+XG4gIDxwPlxuICAgIEF0IGxlYXN0IG5vdyBldmVyeXRoaW5nIHNob3VsZCBiZSBiYWNrIHRvIG5vcm1hbC4gKEkgaG9wZSB0aGlzIGluY2lkZW50IGRpZCBub3Qgc2Fib3RhZ2UgdGhlIEZsYXR0ciBidXR0b24gSSBhZGRlZCBpbiB0aGUgbWVhbnRpbWXigKYgPGk+d2luaywgd2luayE8L2k+KVxuICA8L3A+XG4gIDxwPkFueXdheSwgdGhhbmtzIGZvciB5b3VyIHVuZGVyc3RhbmRpbmcuPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTE2PC9zbWFsbD5cbiAgICBJIHRoaW5rIEkgZGlkIG5vdCBtZW50aW9uLCB5ZXQsIHRoYXQgdGhlIGN1cnJlbnQgaW5jYXJuYXRpb24gb2YgdGhlIGNvZGUgaXMgdG90YWxseSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgdmVyc2lvbiBhcyBvZiAyMDA5LiBFYWNoIGlzIHVzaW5nIHRoZWlyIG93biBjb2RlYmFzZSwgdGhlIGxlZ2FjeSBjb2RlIHdhcyBub3QgbW9kaWZpZWQgYXQgYWxsIGFuZCB0aHVzLCBpdCBpcyBub3QgYWZmZWN0ZWQgYnkgYW55IHJlY2VudCBjaGFuZ2VzLiBZb3UgY2FuIGNoZWNrIHdoaWNoIHZlcnNpb24geW91IGFyZSB1c2luZyBieSBsb29raW5nIGF0IHRoZSBzY3JpcHQgVVJMLiBJZiBpdCBjb250YWlucyB0aGUgc3RyaW5nIOKAnHByb3h5LnLigJ0geW91IGdldCB0aGUg4oCcY2xhc3NpY+KAnSBSU1MgQm94IHJlbmRlcmluZy4gVGhlIG1vZGVybml6ZWQgdmVyc2lvbiBjYWxscyDigJxpbmRleC5qc+KAnS4gTmV2ZXJ0aGVsZXNzLCB5b3UgY2Fubm90IHNldHVwIGJveGVzIHdpdGggdGhlIG9sZCBVUkwgYW55bW9yZS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDEyLTA1LTA5PC9zbWFsbD5cbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgc3VwcG9ydCBmb3IgPGNvZGU+Jmx0O2NvbnRlbnQ6ZW5jb2RlZCZndDs8L2NvZGU+IGVsZW1lbnQuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBJbXBsZW1lbnRlZCBNZW1jYWNoZSB1c2FnZSBpbiBBcHBFbmdpbmUgY29kZS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEJlYXV0aWZpZWQgdGhpcyBwYWdlIGJ5IHVzaW5nIHRoZSA8YSBocmVmPSdodHRwOi8vd3d3Lmdvb2dsZS5jb20vd2ViZm9udHMvc3BlY2ltZW4vRHJvaWQrU2VyaWYnPkdvb2dsZeKAmXMgRHJvaWQgU2VyaWYgZm9udDwvYT4uXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAxMi0wNC0yNjwvc21hbGw+XG4gICAgQW1hemluZyEgQSBuZXcgdmVyc2lvbiEgQWZ0ZXIgbW9yZSB0aGFuIHR3byB5ZWFycyBoaWF0dXMgSSBjb21wbGV0ZWx5IHJld3JvdGUgdGhlIGNvZGViYXNlIGFuZCBmcmFtZXdvcms6XG4gIDwvcD5cbiAgPHVsPlxuICAgIDxsaT5cbiAgICAgIFJlbW92ZWQgZGVwZW5kZW5jeSB0byBSZWJvbCB1c2luZyBhIHNtYWxsIEpTT05QIHByb3h5IGF0IEdvb2dsZeKAmXMgQXBwRW5naW5lLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUmV3cm90ZSBYTUwgcGFyc2luZywgcmVwbGFjaW5nIG5hdGl2ZSBtZXRob2RzIHdpdGggalF1ZXJ5IG9uZXMuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBDbGVhbmVkIHVwIEhUTUwgb3V0cHV0IGZvciB0aGUgUlNTIEJveCwgcmVwbGFjaW5nIHRhYmxlcyB3aXRoIGRpdnMuIDxpPk5vdGU6IFlvdSBtaWdodCBuZWVkIHRvIGFkZCA8Y29kZT48YSBocmVmPSdodHRwOi8vY29kaW5nLnNtYXNoaW5nbWFnYXppbmUuY29tLzIwMTAvMTEvMDIvdGhlLWltcG9ydGFudC1jc3MtZGVjbGFyYXRpb24taG93LWFuZC13aGVuLXRvLXVzZS1pdC8nPiFpbXBvcnRhbnQ8L2E+PC9jb2RlPiB0byB5b3VyIGN1c3RvbSBSU1MgQm94IHN0eWxlc2hlZXQgZGVmaW5pdGlvbnMuPC9pPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgUmVwbGFjZWQgZnVnbHkgY29sb3JwaWNrZXIgaW4gY29uZmlndXJhdG9yIHdpdGggdGhlIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9jbGF2aXNrYS9qcXVlcnktbWluaUNvbG9ycy8nPk1pbmlDb2xvcnMgalF1ZXJ5IHBsdWdpbjwvYT4uXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBZGRlZCBsaW5rIGNvbG9yIHNldHRpbmcgYW5kIHN0eWxlIGF0dHJpYnV0ZXMgZm9yIGNvcnJlY3RseSBhcHBseWluZyBjb2xvciBzZXR0aW5ncy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIEFkZGVkIGNvcm5lciByYWRpdXMgc2V0dGluZy4gPGk+Tm90ZTogZG9lcyBub3Qgd29yayBpbiBJRTggYW5kIGVhcmxpZXIgdmVyc2lvbnMuPC9pPlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgQWRkZWQgZm9udCBzaXplIHRvIHRoZSBmb250IGZhY2Ugc2V0dGluZy5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFJlbW92ZWQgYWxpZ24gc2V0dGluZyBmcm9tIGNvbmZpZ3VyYXRvciAoc3RpbGwgd29ya3MgaW4gc2NyaXB0IHRhZ3MgZ2VuZXJhdGVkIHdpdGggZWFybGllciB2ZXJzaW9ucykuXG4gICAgPC9saT5cbiAgPC91bD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwOS0xMi0xMzwvc21hbGw+XG4gICAgU3dpdGNoZWQgb3V0cHV0IG9mIHRoaXMgcGFnZSB0byBIVE1MNSBhbmQgbWFkZSBzb21lIGFkYXB0YXRpb25zIGluIHRoZSBIVE1MIGNvZGUgYW5kIENTUyBzdHlsZXNoZWV0LiBVcGRhdGVkIHZlcnNpb24gc3RyaW5nIHRvIDIuMSwgZmluYWxseSFcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA5LTA5LTI4PC9zbWFsbD5cbiAgICBTb21lIG1pbm9yIGNoYW5nZXMgYWZ0ZXIgYSB3aGlsZTpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlJlZmFjdG9yZWQgZGF0ZSBwYXJzaW5nIHRvIHNob3cgYWN0dWFsIGJ1aWxkIGRhdGVzIG1vcmUgcmVsaWFibHk8L2xpPlxuICAgIDxsaT5SZWZhY3RvcmVkIGNhY2hpbmcgcm91dGluZSAob25seSBpbiBvbmxpbmUgdmVyc2lvbik8L2xpPlxuICAgIDxsaT5VcGRhdGVkIHZlcnNpb24gc3RyaW5nIHRvIDIuMWIsIGFwcHJvYWNoaW5nIGFub3RoZXIgZmluYWwgdmVyc2lvbi48L2xpPlxuICA8L3VsPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA4LTAyLTE5PC9zbWFsbD5cbiAgICBTZWVtcyB0aGVyZSB3ZXJlIHNvbWUgY2hhbmdlcyBpbiB0aGUgYWlyIGFzIEkgZGlkIG5vdCBwbGFuIGFub3RoZXIgdXBkYXRlIGJ1dCBoZXJlIGNvbWVzIHZlcnNpb24gMi4xIGJyaW5naW5nIHRvIHlvdTpcbiAgPC9wPlxuICA8dWw+XG4gICAgPGxpPlxuICAgICAgRnVsbCBjbGllbnQtc2lkZSBwcm9jZXNzaW5nIChvbmx5IHRoZSByYXcgZmVlZCBkYXRhIGlzIGZldGNoZWQgZnJvbSB0aGUgc2VydmVyKS5cbiAgICA8L2xpPlxuICAgIDxsaT5cbiAgICAgIFVzZXItZnJpZW5kbGllciBpbnRlcmZhY2Ugd2l0aCBjb2xvciBwaWNrZXJzLCBzdGF0dXMgYW5kIGVycm9yIGRpc3BsYXkgYXMgd2VsbCBhcyBpbnN0YW50IGZlZWRiYWNrIG9uIGFueSBjaGFuZ2UgaW4gc2V0dXAuXG4gICAgPC9saT5cbiAgICA8bGk+XG4gICAgICBBbmQgZmluYWxseSAoZHJ1bXJvbGwhKSBVbmljb2RlIHN1cHBvcnQgYXQgbGVhc3QgYXQgdGhpcyBpbnN0YWxsYXRpb24gb2YgdGhlIHZpZXdlci4gKEllLiB0aGUgZG93bmxvYWRlZCB2ZXJzaW9uIHN0aWxsIHdpbGwgb3V0cHV0IEFTQ0lJIG9ubHkuKVxuICAgIDwvbGk+XG4gIDwvdWw+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDgtMDItMDM8L3NtYWxsPlxuICAgIE1hZGUgc29tZSBtb3JlIGltcHJvdmVtZW50cyBlc3BlY2lhbGx5IHJlZ2FyZGluZyB0aGUgZXJyb3IgaGFuZGxpbmcgYW5kIG91dHB1dC4gRnJvbSBub3cgb24gaXQgc2hvdWxkIGJlIG11Y2ggY2xlYXJlciB3aGF04oCZcyB3cm9uZyB3aXRoIGEgdmVyeSBSU1MgQm94LiBTaW5jZSB0aGVyZeKAmXMgbm93IGEgbG90IG1vcmUgb2YgY2xpZW50LXNpZGUgSmF2YVNjcmlwdCBjb2RlIGludm9sdmVkIEkgdGVzdGVkIHRoZSBzY3JpcHQgaW4gZm91ciBtYWpvciBicm93c2VycyB0aGF0IGFyZSBhdmFpbGFibGUgdG8gbWU6IEludGVybmV0IEV4cGxvcmVyIDcsIEZpcmVmb3ggMi4wLCBPcGVyYSA5LjI1IGFuZCBTYWZhcmkgMy5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA4LTAyLTAxPC9zbWFsbD5cbiAgICBDb21wbGV0ZWx5IHJldmlzZWQgc2VydmVyLSBhbmQgY2xpZW50LXNpZGUgY29kZS4gWE1MIHJlbmRlcmluZyBpcyBub3cgZG9uZSBpbiB0aGUgYnJvd3NlciB3aGljaCBzcGVlZHMgdXAgdGhpbmdzIGFuZCBkZWNyZWFzZXMgdGhlIGxvYWQgb24gdGhlIHNlcnZlci4gRnVydGhlcm1vcmUsIHRoZSBsaXN0IG9mIHJlZmVycmVycyBpcyBub3cgbG9hZGVkIG9uIGRlbWFuZCB2aWEgQUpBWCBhbmQgdGh1cyBub3QgcmVuZGVyZWQgd2l0aCBldmVyeSByZXF1ZXN0LiBGaW5hbGx5LCBJIHJldG91Y2hlZCB0aGUgc2V0dXAgZm9ybSBpbnRlcmZhY2UgYW5kIGNsZWFuZWQgdXAgYm90aCBIVE1MIGFuZCBDU1MuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0xMi0yMDwvc21hbGw+XG4gICAgSSBhbSB2ZXJ5IGdsYWQgdGhhdCBteSBvbGQgbGl0dGxlIHNjcmlwdCBpcyBnYWluaW5nIGV2ZW4gbW9yZSBhdHRlbnRpb24gYWZ0ZXIgYWxsIHRoZXNlIHllYXJz4oCmICAgIDxpPlRoYW5rIHlvdSB2ZXJ5IG11Y2ggaW5kZWVkITwvaT4gU2luY2UgdGhlcmUgYXJlIGNvbWluZyBpbiBtb3JlIGFuZCBtb3JlIG9mIHRoZSBzYW1lIHJlcXVlc3RzIGFuZCBJIGFtIHJlYWxseSBub3QgYWJsZSB0byBoYW5kbGUgdGhlbSAoYXBvbG9naWVzISksIGhlcmUgaXMgc29tZSBhZHZpY2UgZm9yIGV2ZXJ5b25lOlxuICA8L3A+XG4gIDxvbD5cbiAgICA8bGk+XG4gICAgICA8YSBocmVmPSdodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Nhc2NhZGluZ19TdHlsZV9TaGVldHMnPlVzZSBjYXNjYWRpbmcgc3R5bGUgc2hlZXRzPC9hPiAoQ1NTKSB0byBjaGFuZ2UgZm9udCBzaXplcyAoYW5kIHRvIGdlbmVyYWxseSBkZWZpbmUgeW91ciBsYXlvdXQpLlxuICAgIDwvbGk+XG4gICAgPGxpPlxuICAgICAgPGEgaHJlZj0naHR0cDovL3d3dy5zaXRlcG9pbnQuY29tL2FydGljbGUvYmV3YXJlLW9wZW5pbmctbGlua3MtbmV3LXdpbmRvdyc+QmV3YXJlIG9mIG9wZW5pbmcgbGlua3MgaW4gYSBuZXcgd2luZG93LjwvYT4gSXTigJlzIG9mZmVuc2l2ZSB0byB5b3VyIHJlYWRlcnMuXG4gICAgPC9saT5cbiAgPC9vbD5cbiAgPHA+XG4gICAgPGk+QSBoYXBweSBlbmQgZm9yIDIwMDYhPC9pPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDYtMTM8L3NtYWxsPlxuICAgIERpZCBzb21lIG1pbm9yIGJ1ZyBmaXhpbmcgYWdhaW4gKGFtb25nc3Qgb3RoZXJzIHJlcGxhY2luZyBzaW5nbGUgcXVvdGVzIHdpdGggJmFwb3M7IGFuZCBub3QgJnF1b3Q7IGVudGl0aWVzKS4gRnVydGhlcm1vcmUgKGFuZCBmaW5hbGx5KSwgSSByZW1vdmVkIHRoZSDigJxSQ+KAnSAoYXMgaW4g4oCcUmVsZWFzZSBDYW5kaWRhdGXigJ0pIGZyb20gdGhlIGRvY3VtZW50IHRpdGxl4oCmXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNi0xMjwvc21hbGw+XG4gICAgR2FyeSBpbmZvcm1lZCBtZSB0aGF0IGxvbmdlciBmZWVkIFVSTHMgY2F1c2UgdHJvdWJsZSBhbmQgdGhlIGZlZWQgYm94IHdpbGwgbm90IGJlIGRpc3BsYXllZC4gVGhhdOKAmXMgaW4gZmFjdCBhIGJ1ZywgYnV0IHVuZm9ydHVuYXRlbHkgb25lIHRoYXQgY2Fubm90IGJlIGZpeGVkIHNvIGVhc2lseS4gTXkgc3VnZ2VzdGlvbiBpcyB0byBzaG9ydGVuIHN1Y2ggVVJMcyBhdCBvbmUgb2YgdGhlIHdlYnNpdGVzIGFyb3VuZCB0aGF0IHByb3ZpZGUgc3VjaCBhIHNlcnZpY2UsIGUuZy4gPGEgaHJlZj0naHR0cDovL3Rpbnl1cmwuY29tJz50aW55dXJsLmNvbTwvYT4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwNi0wNC0yMzwvc21hbGw+XG4gICAgU3dpdGNoZWQgdGhlIDxhIGhyZWY9J2h0dHBzOi8vcDNrLm9yZy9zb3VyY2UvcnNzLWJveC8nPnNvdXJjZSByZXBvc2l0b3J5PC9hPiBmcm9tIENWUyB0byBTdWJ2ZXJzaW9uIChTVk4pLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMjA8L3NtYWxsPlxuICAgIEFuZHJldyBQYW0gYnJvdWdodCB1cCBhIHNlcmlvdXMgaXNzdWUgdGhhdCBwcm9iYWJseSBtaWdodCBoYXZlIGFmZmVjdGVkIHNvbWUgbW9yZSBwZW9wbGUgYWxyZWFkeTogdGhlIHZpZXdlciBkb2VzIG5vdCBzdXBwb3J0IFVURi04IChvciBVbmljb2RlLCByZXNwLikgVW5mb3J0dW5hdGVseSwgdGhpcyBpcyDigJxidWlsdC1pbuKAnSBpbnRvIHRoZSB1bmRlcmx5aW5nIHNjcmlwdGluZyBsYW5ndWFnZSAoYWthIFJlYm9sKS4gSeKAmW0gc29ycnkgdG8gY2FuY2VsIHRob3NlIHRpY2tldHPigKYgOihcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTA0LTEzPC9zbWFsbD5cbiAgICBGaXhlZCBhIGJ1ZyByZXBvcnRlZCBieSBNYW5kbyBHb21leiB0aGF0IGNhdXNlZCBmZWVkcyB1c2luZyB0aGUgJmx0O2d1aWQmZ3Q7IGVsZW1lbnQgYmVpbmcgZGlzcGxheWVkIHdpdGhvdXQgaXRlbSBsaW5rc+KApiBEb27igJl0IGZvcmdldCB0byBjaGVjayBvdXQgTWFuZG/igJlzIGV4Y2VsbGVudCB3ZWJzaXRlIDxhIGhyZWY9J2h0dHA6Ly93d3cubWFuZG9sdXguY29tLyc+bWFuZG9sdXg8L2E+IVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDYtMDQtMTI8L3NtYWxsPlxuICAgIE9idmlvdXNseSBTYW0gUnVieSBjaGFuZ2VkIGhpcyBmZWVkIGZvcm1hdCBmcm9tIHNjcmlwdGluZ05ld3MgdG8gQXRvbTsgd2hpY2ggcmVuZGVycyBteSBleGFtcGxlIGxpbmsgYWJvdmUgcHJldHR5IHVzZWxlc3PigKYgU28gZmFyIEkgZG9u4oCZdCBrbm93IGFib3V0IGFueSBvdGhlciBzY3JpcHRpbmdOZXdzIGZlZWQsIGRvIHlvdT9cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTAyLTIwPC9zbWFsbD5cbiAgICBJIGhvcGUgbm9ib2R5IG1pbmRzIHRoZSBsaXR0bGUgbGluZSBJIGFkZGVkIGF0IHRoZSBib3R0b20gb2YgZWFjaCBSU1MgYm944oCmIE9mIGNvdXJzZSwgaXTigJlzIG5vdCB0b3RhbGx5IGFsdHJ1aXN0aWMsIGJ1dCBwcm9iYWJseSBzb21lIHBlb3BsZSB3aWxsIGZpbmQgaXQgaW5mb3JtYXRpdmUuIEhvd2V2ZXIsIGlmIHlvdSB3YW50IHRvIHByZXZlbnQgaXQgZnJvbSBiZWluZyBkaXNwbGF5ZWQgc2ltcGx5IGFkZCA8Y29kZT4ucnNzYm94LXByb21vIHtcIntcIn1kaXNwbGF5OiBub25lO3tcIn1cIn08L2NvZGU+IHRvIHlvdXIgc3R5bGVzaGVldC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA2LTAxLTExPC9zbWFsbD5cbiAgICBOZXcgc2VydmVyLCBuZXcgdHJvdWJsZXM6IEkgbW92ZWQgdGhlIHZpZXdlciB0byBhIG5ld2x5IHNldHVwIFVidW50dSBtYWNoaW5lLiBPZiBjb3Vyc2UsIEkgZm9yZ290IHRvIHNldCBzb21lIHBlcm1pc3Npb24gZmxhZ3MgYW5kIG93bmVycywgdGh1cywgcHJldmVudGluZyB0aGUgc2NyaXB0IGZyb20gd29ya2luZy4gSG93ZXZlciwgSSB0aGluayBldmVyeXRoaW5nIGlzIGZpeGVkIGFuZCB3b3JraW5nIGFnYWluLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDUtMTEtMTY8L3NtYWxsPlxuICAgIEp1c3QgdGVzdGluZyBHb29nbGXigJlzIEFkU2Vuc2UgZm9yIGEgd2hpbGUuIFNpbmNlIHRoaXMgcGFnZSBnZW5lcmF0ZXMgbW9zdCBvZiBteSB0cmFmZmljIEkgd2FudGVkIHRvIHNlZSBteXNlbGYgd2hhdCBhIGJhbm5lciBjYW4gZG8gaGVyZS4gSG9wZSB5b3UgZG9u4oCZdCBtaW5kLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDQtMTItMTY8L3NtYWxsPlxuICAgIEJ1Z2ZpeDogU29tZXRpbWVzIHRoZSBsb2dmaWxlIHdoaWNoIGlzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGxpc3Qgb2Ygc2l0ZXMgdXNpbmcgdGhpcyBzY3JpcHQgZ2V0cyBjb3JydXB0ZWQuIFRoaXMgYWZmZWN0ZWQgdGhlIHdob2xlIHNldHVwIHBhZ2UgdG8gcmV0dXJuIGFuIGVycm9yIGFuZCB0aHVzLCBpdCBuZWVkZWQgdG8gYmUgY2F1Z2h0LiAoWW91IHdpbGwgc2VlIGEg4oCcY3VycmVudGx5IG91dCBvZiBvcmRlcuKAnSBtZXNzYWdlIHRoZW4uKVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDQtMDQtMjY8L3NtYWxsPlxuICAgIExhc3QgZWZmb3J0cyB0byBvZmZpY2lhbGx5IHJlbGVhc2UgdGhlIDxhIGhyZWY9J2h0dHBzOi8vcDNrLm9yZy9zb3VyY2UvcnNzLWJveCc+Y29kZTwvYT4gdG8gdGhlIG9wZW4gc291cmNlIGNvbW11bml0eS4gVGhlcmUgaGF2ZSBiZWVuIHNvbWUgYnVncyBpbiB0aGUgKGltYWdlKSByZW5kZXJpbmcgZnJhbWV3b3JrIHdoaWNoIEkgZml4ZWQgc28gICAgZmFyLiBJIG5vdyBpbmNsdWRlIGEgZHluYW1pY2FsbHkgcmVuZGVyZWQgbGlzdCBvZiBzaXRlcyB1c2luZyAob3IgcG9pbnRpbmcgdG8pIHRoaXMgc2NyaXB0IHRvIGdpdmUgc29tZSBleGFtcGxlcyBmb3IgdGhlIGN1cmlvdXMgYXQgaGVhcnQgKG1lIGluY2x1ZGVkKS4gRmluYWxseSwgdGhlcmXigJlzIGEgPGEgaHJlZj0naHR0cHM6Ly9wM2sub3JnL3NvdXJjZS9yc3MtYm94L2JyYW5jaGVzLzIuMC9SRUFETUUnPlJFQURNRTwvYT4gZmlsZSB3aXRoIGEgc2hvcnQgaW5zdGFsbGF0aW9uIGd1aWRlIHRvIG1ha2UgdGhlIHNjcmlwdCBydW4gb24geW91ciBvd24gc2VydmVyLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDQtMDEtMjg8L3NtYWxsPlxuICAgIFdoZW4gc29tZXRoaW5nIGdvZXMgd3JvbmcgKG1vc3Qgb2YgdGhlIHRpbWUgdGhpcyBtaWdodCBiZSBhIHdyb25nIFVSTCwgaWUuIGEgNDA0IGFzIHJlc3VsdCkgYW4gICAgPGEgaHJlZj0nLi8/dXJsPWVycm9yJz7igJxlcnJvcuKAnSBib3g8L2E+IHdpbGwgYmUgZGlzcGxheWVkIHRvIHNpZ25hbCB0aGUgZmFpbHVyZS4gSW5jcmVhc2VkIHZlcnNpb24gdXAgdG8gMS4wIGFuZCBsYWJlbGVkIGl0IGFzIHJlbGVhc2UgY2FuZGlkYXRlXG4gICAgKFJDKS5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDA0LTAxLTI2PC9zbWFsbD5cbiAgICBSZXRvdWNoZWQgdGhlIGNvZGUgaW4gYSB2ZXJ5IGxhc3QgZWZmb3J0IHRvIG1ha2UgdGhlIHNjcmlwdCBydW5uaW5nIHN0YW5kLWFsb25lICh3aXRoIFJlYm9sIGJ1dCAgICA8aT53aXRob3V0PC9pPiBQSFAsIHRoYXQgaXMpLiBFdmVyeXRoaW5nIG5lZWRlZCBpcyBub3cgaW4gPGRlbD5DVlM8L2RlbD4gU1ZOIHNvIGV2ZXJ5Ym9keSBjYW4gZG93bmxvYWQgZnJvbSB0aGVyZS4gUG90ZW50aWFsbHksIGEgZmV3IG1pbm9yIGJ1ZyBmaXhlcyBtaWdodCBmb2xsb3cgc2hvcnQtdGVybS4gVWgsIGFuZCB0aGUgSFRNTCBjb2RlIGlzIDxhIGhyZWY9J2h0dHA6Ly92YWxpZGF0b3IudzMub3JnL2NoZWNrP3VyaT1odHRwJTNBJTJGJTJGcDNrLm9yZyUyRnJzcyUyRic+dmFsaWQgWEhUTUwgMS4wPC9hPiBub3cuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMy0xMi0xMjwvc21hbGw+XG4gICAgVGhlIG1pcnJvciBhdCA8ZGVsPmh0dHA6Ly9wdWJsaXNoLmN1cnJ5LmNvbS9yc3MvPC9kZWw+IGlzIG5vdCB3b3JraW5nIGZvciBxdWl0ZSBhIGxvbmcgdGltZS4gSSB0cmllZCB0byBjb250YWN0IEFkYW0gQ3VycnkgYnV0IHNvIGZhciB3aXRob3V0IHN1Y2Nlc3MuXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMy0wMy0zMDwvc21hbGw+XG4gICAgTW92ZWQgdG8gbmV3IHNlcnZlciB3aXRoIG5ldyBkb21haW4gPGRlbD5mb3JldmVyLnAzay5vcmc8L2RlbD4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMy0wMy0yNTwvc21hbGw+XG4gICAgVXBkYXRlZCBSZWJvbCB0byA8YSBocmVmPSdodHRwOi8vd3d3LnJlYm9sLmNvbS9uZXdzMzMxMC5odG1sJz52ZXJzaW9uIDIuNS41PC9hPi4gRW5kIG9mIFJlYm9s4oCZcyDigJxETlMgem9tYmllc+KAnSBpbiB0aGUgcHJvY2VzcyBsaXN0LlxuICAgIDxpPkZpbmFsbHkuPC9pPlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDItMDItMTk8L3NtYWxsPlxuICAgIEFkZGVkIGEgdmVyeSBuaWNlIHF1b3RlIGZyb20gPGEgaHJlZj0naHR0cDovL3d3dy5vdXJwbGEubmV0L2NnaS1iaW4vcGlraWUuY2dpP0FiYmVOb3JtYWwnPkFiYmUgTm9ybWFsPC9hPiBvbiB0b3AgcmlnaHQgb2YgdGhpcyBkb2N1bWVudC5cbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTExLTE3PC9zbWFsbD5cbiAgICBJZiB5b3Ugd2FudCBhIG1vcmUgY29tcGFjdCB2aWV3IG9mIHRoZSBSU1MgYm94IHlvdSBjYW4gZ2V0IGl0IG5vdyB1c2luZyB0aGUgY29ycmVzcG9uZGluZyBjaGVja2JveC4gSWYgaXQgaXMgZW5hYmxlZCB0aGUgZGVzY3JpcHRpb25zIG9mIGVhY2ggaXRlbSB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQgJiM4MjExOyBnaXZlbiB0aGF0IHRoZSBpdGVtIHRpdGxlIGlzIGRlZmluZWQgKG90aGVyd2lzZSB0aGVyZSB3b3VsZCBub3QgYmUgbXVjaCB0byBzZWUpLiBBZGRpdGlvbmFsbHksIHRoZSBjaGFubmVsIGltYWdlIChpZiBkZWZpbmVkKSB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQuIFRoYW5rcyAmIzEwNjsmIzExNTsmIzEyMTsmIzEwMTsmIzExMTsmIzY0OyYjOTk7JiMxMTE7JiMxMDk7JiMxMTI7JiMxMTc7JiMxMTU7JiMxMDE7JiMxMTQ7JiMxMTg7JiMxMDE7JiM0NjsmIzk5OyYjMTExOyYjMTA5OyBmb3IgdGhlIHN1Z2dlc3Rpb25zIVxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDktMjE8L3NtYWxsPlxuICAgIFNpbmNlIHRvZGF5IHRoZSA8Y29kZT50ZXh0aW5wdXQ8L2NvZGU+IHRhZyBpcyBzdXBwb3J0ZWQuIEl0IGNyZWF0ZXMgYW4gYXBwcm9wcmlhdGUgZm9ybSBhdCB0aGUgZW5kIG9mIHRoZSBib3guIE1vcmVvdmVyLCB0d28gYnVncyB3ZXJlIGZpeGVkOiBvbmUgY2F1c2VkIHVubmVjZXNzYXJ5IGluZm9ybWF0aW9uIGluIHRoZSBxdWVyeSBzdHJpbmcgb2YgdGhlIGdlbmVyYXRlZCBKYXZhU2NyaXB0IHRhZy4gVGhlIG90aGVyIGFmZmVjdGVkIHRoZSBkaXNwbGF5IG9mIHRoZSBkYXRl4oCZcyB0aW1lIHpvbmUuIFRpbWUgem9uZXMgbm93IGFyZSBnZW5lcmFsbHkgZGlzcGxheWVkIGluIEdNVCBleGNlcHQgd2hlcmUgYW5vdGhlciB0aW1lIHpvbmUgYWNyb255bSBpcyBkZWZpbmVkLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDktMDQ8L3NtYWxsPlxuICAgIEFkZGVkIGljb25zIGZvciBlbmNsb3N1cmUgYW5kIHNvdXJjZTsgYWRkZWQgWE1MIGJ1dHRvbiBjaGVja2JveCB0byBlbmFibGUgb3V0cHV0IG9mIHRoZSBxdWFzaS1zdGFuZGFyZCBvcmFuZ2UgYnV0dG9uIGxpbmtpbmcgdG8gdGhlIFhNTCBzb3VyY2UgKGlkZWFieSAmIzk3OyYjMTAwOyYjOTc7JiMxMDk7JiM2NDsmIzk5OyYjMTE3OyYjMTE0OyYjMTE0OyYjMTIxOyYjNDY7JiM5OTsmIzExMTsmIzEwOTspLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDktMDM8L3NtYWxsPlxuICAgIEl04oCZcyBub3cgcG9zc2libGUgdG8gcmVmaW5lIHRoZSBzdHlsZSBvZiB0aGUgd2hvbGUgYm94IHVzaW5nIHRoZSBuZXdseSBpbXBsZW1lbnRlZCBjc3MgY2xhc3NlcyA8Y29kZT5yc3Nib3gtdGl0bGU8L2NvZGU+LCA8Y29kZT5yc3Nib3gtY29udGVudDwvY29kZT4sIDxjb2RlPnJzc2JveC1pdGVtLXRpdGxlPC9jb2RlPiBhbmQgPGNvZGU+cnNzYm94LXR0ZW0tY29udGVudDwvY29kZT4gKGlkZWEgYnkgJiMxMTQ7JiMxMDA7JiM5NzsmIzExODsmIzEwNTsmIzEwMTsmIzExNTsmIzY0OyYjMTExOyYjMTE0OyYjMTA1OyYjMTAxOyYjMTEwOyYjMTE2OyYjMTEyOyYjOTc7JiM5OTsmIzEwNTsmIzEwMjsmIzEwNTsmIzk5OyYjNDY7JiM5OTsmIzExMTsmIzEwOTspLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMjQ8L3NtYWxsPlxuICAgIEFkZGVkIGEgZm9ybSBpbnB1dCBmb3IgbGltaXRpbmcgdGhlIGl0ZW0gZGlzcGxheS4gVGhlIG51bWJlciBkZXRlcm1pbmVzIGhvdyBtYW55IGl0ZW1zIHdpbGwgYmUgc2hvd24gaW4gdGhlIGJveCAoc2V2ZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUpLiBHb29kIGZvciBvZnRlbiB1cGRhdGVkIGNoYW5uZWxzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDgtMTU8L3NtYWxsPlxuICAgIERldGVjdGVkIGEgc3RyYW5nZSBidWcgdGhhdCBwcmV2ZW50ZWQgdGhlIHZpZXdlciBhdCA8YSBocmVmPSdodHRwOi8vcHVibGlzaC5jdXJyeS5jb20vcnNzLyc+Y3VycnkuY29tPC9hPiBsb2FkaW5nIGh0dHA6Ly9wM2sub3JnL3Jzcy54bWwgd2hpbGUgaHR0cDovL3d3dy5wM2sub3JnL3Jzcy54bWwgd2FzIG5vIHByb2JsZW0gYXQgYWxsLiBVcGdyYWRpbmcgdGhlIFJlYm9sIGluc3RhbGxhdGlvbiB0byB0aGUgY3VycmVudCB2ZXJzaW9uIHNvbHZlZCB0aGVwcm9ibGVtLCBob3dldmVyIHRoZSBjYXVzZSByZW1haW5zIHVuY2xlYXLigKZcbiAgPC9wPlxuXG4gIDxwPlxuICAgIDxzbWFsbD4yMDAxLTA4LTA4PC9zbWFsbD5cbiAgICBGaXhlZCBhIHNtYWxsIGJ1ZyB0aGF0IGNvcnJ1cHRlZCBjaGFubmVsIFVSTHMgY29udGFpbmluZyBhIHF1ZXJ5IChhcyByZXBvcnRlZCBieSAmIzEwNzsmIzEwNTsmIzEwNzsmIzk3OyYjNjQ7JiMxMTU7JiMxMDg7JiMxMTE7JiMxMDg7JiMxMDE7JiMxMDQ7JiMxMTY7JiM0NjsmIzEwMTsmIzEwMTspLiBDb25maWd1cmVkIHNlcnZlciByZWRpcmVjdCBmcm9tIDxkZWw+aHR0cDovL3BpZWZrZS5oZWxtYS5hdC9yc3M8L2RlbD4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wOC0wNTwvc21hbGw+XG4gICAgVGhhbmtzIHRvIDxhIGhyZWY9J2h0dHA6Ly93d3cuY3VycnkuY29tLzIwMDEvMDcvMzEjY29vbFJzc1NlcnZpY2UnPkFkYW0gQ3Vycnk8L2E+LCB0aGUgdmlld2VyIGlzIG5vdyBtaXJyb3JlZCBhdCA8ZGVsPmh0dHA6Ly9wdWJsaXNoLmN1cnJ5LmNvbS9yc3M8L2RlbD4uXG4gIDwvcD5cblxuICA8cD5cbiAgICA8c21hbGw+MjAwMS0wNy0zMDwvc21hbGw+XG4gICAgQWRkZWQgbGluayB0byBzb3VyY2UgY29kZTsgYWRkZWQgZXhhbXBsZSBsaW5rcyBmb3IgYWxsIHN1cHBvcnRlZCBmb3JtYXRzLlxuICA8L3A+XG5cbiAgPHA+XG4gICAgPHNtYWxsPjIwMDEtMDUtMzA8L3NtYWxsPlxuICAgIEZpeGVkIGEgbGl0dGxlIGJ1ZyByZXBvcnRlZCBieSAmIzEwMjsmIzExNDsmIzEwMTsmIzEwMDsmIzEwNTsmIzY0OyYjMTAxOyYjMTA5OyYjOTc7JiMxMDU7JiMxMDg7JiM0NjsmIzEwMTsmIzEwMTsgdGhhdCBjYXVzZWQgZGlhY3JpdGljIGNoYXJhY3RlcnMgdG8gYmUgZGlzcGxheWVkIGFzIGVudGl0eSBjb2Rlcy5cbiAgPC9wPlxuPC9kZXRhaWxzPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNFLDhCQUFHLENBQ0QsT0FBTyxDQUFFLFlBQ1gsQ0FFQSxxQkFBTyxDQUFHLGNBQUUsQ0FDVixVQUFVLENBQUUsQ0FDZCxDQUVBLG1DQUFRLENBQ04sT0FBTyxDQUFFLElBQ1gsQ0FFQSxnQkFBRSxDQUFHLGdCQUFHLENBQ04sVUFBVSxDQUFFLEtBQ2QsQ0FFQSxpQ0FBTSxDQUNKLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLFlBQVksQ0FBRSxLQUFLLENBQ25CLEtBQUssQ0FBRSxJQUNULENBRUEsZ0NBQUssQ0FDSCxnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUNmIn0= */");
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
				t3 = text("\n    Replaced Yarn with NPM, updated all dependencies – except for Svelte, which I just cannot get to work with version >3.40.0 🤷 – and made sure, HTML videos are nicely displayed in the RSS box.");
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
				em0.innerHTML = ``;
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
				add_location(small1, file$a, 41, 4, 655);
				add_location(p1, file$a, 40, 2, 647);
				attr_dev(small2, "class", "svelte-y33bja");
				add_location(small2, file$a, 46, 4, 737);
				add_location(p2, file$a, 45, 2, 729);
				attr_dev(small3, "class", "svelte-y33bja");
				add_location(small3, file$a, 51, 4, 836);
				attr_dev(a0, "href", "https://cloud.google.com/appengine/");
				add_location(a0, file$a, 52, 12, 874);
				attr_dev(a1, "href", "https://github.com/p3k/json3k");
				add_location(a1, file$a, 52, 173, 1035);
				add_location(p3, file$a, 50, 2, 828);
				attr_dev(small4, "class", "svelte-y33bja");
				add_location(small4, file$a, 56, 4, 1389);
				add_location(p4, file$a, 55, 2, 1381);
				attr_dev(li0, "class", "svelte-y33bja");
				add_location(li0, file$a, 60, 4, 1571);
				attr_dev(li1, "class", "svelte-y33bja");
				add_location(li1, file$a, 61, 4, 1631);
				attr_dev(li2, "class", "svelte-y33bja");
				add_location(li2, file$a, 62, 4, 1727);
				attr_dev(li3, "class", "svelte-y33bja");
				add_location(li3, file$a, 63, 4, 1790);
				attr_dev(a2, "href", "https://github.com/p3k/rss-box/commits/master");
				add_location(a2, file$a, 64, 66, 1949);
				attr_dev(li4, "class", "svelte-y33bja");
				add_location(li4, file$a, 64, 4, 1887);
				add_location(ul0, file$a, 59, 2, 1562);
				attr_dev(small5, "class", "svelte-y33bja");
				add_location(small5, file$a, 68, 4, 2056);
				add_location(em0, file$a, 69, 157, 2239);
				add_location(em1, file$a, 69, 138, 2220);
				add_location(p5, file$a, 67, 2, 2048);
				attr_dev(small6, "class", "svelte-y33bja");
				add_location(small6, file$a, 73, 4, 2262);
				add_location(p6, file$a, 72, 2, 2254);
				attr_dev(li5, "class", "svelte-y33bja");
				add_location(li5, file$a, 77, 4, 2602);
				attr_dev(li6, "class", "svelte-y33bja");
				add_location(li6, file$a, 78, 4, 2657);
				attr_dev(li7, "class", "svelte-y33bja");
				add_location(li7, file$a, 79, 4, 2719);
				attr_dev(li8, "class", "svelte-y33bja");
				add_location(li8, file$a, 80, 4, 2801);
				attr_dev(li9, "class", "svelte-y33bja");
				add_location(li9, file$a, 81, 4, 2885);
				attr_dev(li10, "class", "svelte-y33bja");
				add_location(li10, file$a, 82, 4, 2957);
				attr_dev(li11, "class", "svelte-y33bja");
				add_location(li11, file$a, 83, 4, 3023);
				attr_dev(li12, "class", "svelte-y33bja");
				add_location(li12, file$a, 84, 4, 3101);
				attr_dev(a3, "href", "https://svelte.technology");
				add_location(a3, file$a, 85, 46, 3208);
				attr_dev(a4, "href", "https://mincss.com/");
				add_location(a4, file$a, 85, 97, 3259);
				attr_dev(li13, "class", "svelte-y33bja");
				add_location(li13, file$a, 85, 4, 3166);
				attr_dev(li14, "class", "svelte-y33bja");
				add_location(li14, file$a, 86, 4, 3310);
				attr_dev(li15, "class", "svelte-y33bja");
				add_location(li15, file$a, 87, 4, 3378);
				attr_dev(a5, "href", "https://polyfills.io");
				add_location(a5, file$a, 88, 55, 3484);
				attr_dev(li16, "class", "svelte-y33bja");
				add_location(li16, file$a, 88, 4, 3433);
				attr_dev(li17, "class", "svelte-y33bja");
				add_location(li17, file$a, 89, 4, 3541);
				attr_dev(li18, "class", "svelte-y33bja");
				add_location(li18, file$a, 90, 4, 3609);
				add_location(ul1, file$a, 76, 2, 2593);
				attr_dev(small7, "class", "svelte-y33bja");
				add_location(small7, file$a, 94, 4, 3743);
				attr_dev(a6, "href", "https://github.com/p3k/rss-box");
				add_location(a6, file$a, 95, 69, 3838);
				add_location(p7, file$a, 93, 2, 3735);
				attr_dev(small8, "class", "svelte-y33bja");
				add_location(small8, file$a, 99, 4, 3996);
				add_location(i0, file$a, 100, 140, 4162);
				add_location(p8, file$a, 98, 2, 3988);
				attr_dev(small9, "class", "svelte-y33bja");
				add_location(small9, file$a, 104, 4, 4220);
				add_location(p9, file$a, 103, 2, 4212);
				attr_dev(a7, "href", "https://github.com/p3k/json3k");
				add_location(a7, file$a, 109, 19, 4565);
				attr_dev(li19, "class", "svelte-y33bja");
				add_location(li19, file$a, 108, 4, 4541);
				attr_dev(a8, "href", "http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer");
				add_location(a8, file$a, 112, 40, 4738);
				attr_dev(li20, "class", "svelte-y33bja");
				add_location(li20, file$a, 111, 4, 4693);
				add_location(ul2, file$a, 107, 2, 4532);
				attr_dev(small10, "class", "svelte-y33bja");
				add_location(small10, file$a, 117, 4, 4848);
				add_location(p10, file$a, 116, 2, 4840);
				attr_dev(code0, "class", "svelte-y33bja");
				add_location(code0, file$a, 122, 204, 5180);
				attr_dev(li21, "class", "svelte-y33bja");
				add_location(li21, file$a, 121, 4, 4971);
				attr_dev(li22, "class", "svelte-y33bja");
				add_location(li22, file$a, 124, 4, 5308);
				add_location(ul3, file$a, 120, 2, 4962);
				attr_dev(small11, "class", "svelte-y33bja");
				add_location(small11, file$a, 130, 4, 5622);
				attr_dev(code1, "class", "svelte-y33bja");
				add_location(code1, file$a, 131, 173, 5821);
				attr_dev(code2, "class", "svelte-y33bja");
				add_location(code2, file$a, 131, 206, 5854);
				attr_dev(code3, "class", "svelte-y33bja");
				add_location(code3, file$a, 131, 240, 5888);
				attr_dev(code4, "class", "svelte-y33bja");
				add_location(code4, file$a, 131, 277, 5925);
				attr_dev(code5, "class", "svelte-y33bja");
				add_location(code5, file$a, 131, 339, 5987);
				add_location(p11, file$a, 129, 2, 5614);
				attr_dev(small12, "class", "svelte-y33bja");
				add_location(small12, file$a, 135, 4, 6055);
				add_location(p12, file$a, 134, 2, 6047);
				attr_dev(code6, "class", "svelte-y33bja");
				add_location(code6, file$a, 139, 130, 6234);
				attr_dev(li23, "class", "svelte-y33bja");
				add_location(li23, file$a, 138, 4, 6099);
				attr_dev(code7, "class", "svelte-y33bja");
				add_location(code7, file$a, 142, 51, 6350);
				attr_dev(code8, "class", "svelte-y33bja");
				add_location(code8, file$a, 142, 95, 6394);
				attr_dev(li24, "class", "svelte-y33bja");
				add_location(li24, file$a, 141, 4, 6294);
				add_location(ul4, file$a, 137, 2, 6090);
				attr_dev(small13, "class", "svelte-y33bja");
				add_location(small13, file$a, 147, 4, 6474);
				add_location(p13, file$a, 146, 2, 6466);
				attr_dev(li25, "class", "svelte-y33bja");
				add_location(li25, file$a, 150, 4, 6518);
				attr_dev(li26, "class", "svelte-y33bja");
				add_location(li26, file$a, 153, 4, 6635);
				add_location(ul5, file$a, 149, 2, 6509);
				attr_dev(small14, "class", "svelte-y33bja");
				add_location(small14, file$a, 159, 4, 6742);
				add_location(p14, file$a, 158, 2, 6734);
				attr_dev(code9, "class", "svelte-y33bja");
				add_location(code9, file$a, 164, 12, 6851);
				attr_dev(li27, "class", "svelte-y33bja");
				add_location(li27, file$a, 163, 4, 6834);
				attr_dev(li28, "class", "svelte-y33bja");
				add_location(li28, file$a, 166, 4, 6948);
				attr_dev(li29, "class", "svelte-y33bja");
				add_location(li29, file$a, 169, 4, 7043);
				add_location(ul6, file$a, 162, 2, 6825);
				attr_dev(small15, "class", "svelte-y33bja");
				add_location(small15, file$a, 175, 4, 7172);
				add_location(i1, file$a, 176, 206, 7404);
				add_location(p15, file$a, 174, 2, 7164);
				add_location(i2, file$a, 179, 136, 7568);
				add_location(p16, file$a, 178, 2, 7428);
				add_location(p17, file$a, 181, 2, 7597);
				attr_dev(small16, "class", "svelte-y33bja");
				add_location(small16, file$a, 184, 4, 7654);
				add_location(p18, file$a, 183, 2, 7646);
				attr_dev(small17, "class", "svelte-y33bja");
				add_location(small17, file$a, 189, 4, 8207);
				add_location(p19, file$a, 188, 2, 8199);
				attr_dev(code10, "class", "svelte-y33bja");
				add_location(code10, file$a, 193, 24, 8280);
				attr_dev(li30, "class", "svelte-y33bja");
				add_location(li30, file$a, 192, 4, 8251);
				attr_dev(li31, "class", "svelte-y33bja");
				add_location(li31, file$a, 195, 4, 8340);
				attr_dev(a9, "href", "http://www.google.com/webfonts/specimen/Droid+Serif");
				add_location(a9, file$a, 199, 40, 8456);
				attr_dev(li32, "class", "svelte-y33bja");
				add_location(li32, file$a, 198, 4, 8411);
				add_location(ul7, file$a, 191, 2, 8242);
				attr_dev(small18, "class", "svelte-y33bja");
				add_location(small18, file$a, 204, 4, 8578);
				add_location(p20, file$a, 203, 2, 8570);
				attr_dev(li33, "class", "svelte-y33bja");
				add_location(li33, file$a, 208, 4, 8732);
				attr_dev(li34, "class", "svelte-y33bja");
				add_location(li34, file$a, 211, 4, 8834);
				attr_dev(a10, "href", "http://coding.smashingmagazine.com/2010/11/02/the-important-css-declaration-how-and-when-to-use-it/");
				add_location(a10, file$a, 215, 111, 9039);
				attr_dev(code11, "class", "svelte-y33bja");
				add_location(code11, file$a, 215, 105, 9033);
				add_location(i3, file$a, 215, 74, 9002);
				attr_dev(li35, "class", "svelte-y33bja");
				add_location(li35, file$a, 214, 4, 8923);
				attr_dev(a11, "href", "https://github.com/claviska/jquery-miniColors/");
				add_location(a11, file$a, 218, 58, 9299);
				attr_dev(li36, "class", "svelte-y33bja");
				add_location(li36, file$a, 217, 4, 9236);
				attr_dev(li37, "class", "svelte-y33bja");
				add_location(li37, file$a, 220, 4, 9400);
				add_location(i4, file$a, 224, 35, 9550);
				attr_dev(li38, "class", "svelte-y33bja");
				add_location(li38, file$a, 223, 4, 9510);
				attr_dev(li39, "class", "svelte-y33bja");
				add_location(li39, file$a, 226, 4, 9620);
				attr_dev(li40, "class", "svelte-y33bja");
				add_location(li40, file$a, 229, 4, 9687);
				add_location(ul8, file$a, 207, 2, 8723);
				attr_dev(small19, "class", "svelte-y33bja");
				add_location(small19, file$a, 235, 4, 9829);
				add_location(p21, file$a, 234, 2, 9821);
				attr_dev(small20, "class", "svelte-y33bja");
				add_location(small20, file$a, 240, 4, 10018);
				add_location(p22, file$a, 239, 2, 10010);
				attr_dev(li41, "class", "svelte-y33bja");
				add_location(li41, file$a, 244, 4, 10100);
				attr_dev(li42, "class", "svelte-y33bja");
				add_location(li42, file$a, 245, 4, 10178);
				attr_dev(li43, "class", "svelte-y33bja");
				add_location(li43, file$a, 246, 4, 10243);
				add_location(ul9, file$a, 243, 2, 10091);
				attr_dev(small21, "class", "svelte-y33bja");
				add_location(small21, file$a, 250, 4, 10338);
				add_location(p23, file$a, 249, 2, 10330);
				attr_dev(li44, "class", "svelte-y33bja");
				add_location(li44, file$a, 254, 4, 10504);
				attr_dev(li45, "class", "svelte-y33bja");
				add_location(li45, file$a, 257, 4, 10610);
				attr_dev(li46, "class", "svelte-y33bja");
				add_location(li46, file$a, 260, 4, 10758);
				add_location(ul10, file$a, 253, 2, 10495);
				attr_dev(small22, "class", "svelte-y33bja");
				add_location(small22, file$a, 266, 4, 10942);
				add_location(p24, file$a, 265, 2, 10934);
				attr_dev(small23, "class", "svelte-y33bja");
				add_location(small23, file$a, 271, 4, 11339);
				add_location(p25, file$a, 270, 2, 11331);
				attr_dev(small24, "class", "svelte-y33bja");
				add_location(small24, file$a, 276, 4, 11728);
				add_location(i5, file$a, 277, 102, 11856);
				add_location(p26, file$a, 275, 2, 11720);
				attr_dev(a12, "href", "http://en.wikipedia.org/wiki/Cascading_Style_Sheets");
				add_location(a12, file$a, 281, 6, 12069);
				attr_dev(li47, "class", "svelte-y33bja");
				add_location(li47, file$a, 280, 4, 12058);
				attr_dev(a13, "href", "http://www.sitepoint.com/article/beware-opening-links-new-window");
				add_location(a13, file$a, 284, 6, 12253);
				attr_dev(li48, "class", "svelte-y33bja");
				add_location(li48, file$a, 283, 4, 12242);
				add_location(ol, file$a, 279, 2, 12049);
				add_location(i6, file$a, 288, 4, 12433);
				add_location(p27, file$a, 287, 2, 12425);
				attr_dev(small25, "class", "svelte-y33bja");
				add_location(small25, file$a, 292, 4, 12480);
				add_location(p28, file$a, 291, 2, 12472);
				attr_dev(small26, "class", "svelte-y33bja");
				add_location(small26, file$a, 297, 4, 12737);
				attr_dev(a14, "href", "http://tinyurl.com");
				add_location(a14, file$a, 298, 275, 13038);
				add_location(p29, file$a, 296, 2, 12729);
				attr_dev(small27, "class", "svelte-y33bja");
				add_location(small27, file$a, 302, 4, 13102);
				attr_dev(a15, "href", "https://p3k.org/source/rss-box/");
				add_location(a15, file$a, 303, 17, 13145);
				add_location(p30, file$a, 301, 2, 13094);
				attr_dev(small28, "class", "svelte-y33bja");
				add_location(small28, file$a, 307, 4, 13257);
				add_location(p31, file$a, 306, 2, 13249);
				attr_dev(small29, "class", "svelte-y33bja");
				add_location(small29, file$a, 312, 4, 13581);
				attr_dev(a16, "href", "http://www.mandolux.com/");
				add_location(a16, file$a, 313, 177, 13784);
				add_location(p32, file$a, 311, 2, 13573);
				attr_dev(small30, "class", "svelte-y33bja");
				add_location(small30, file$a, 317, 4, 13851);
				add_location(p33, file$a, 316, 2, 13843);
				attr_dev(small31, "class", "svelte-y33bja");
				add_location(small31, file$a, 322, 4, 14086);
				attr_dev(code12, "class", "svelte-y33bja");
				add_location(code12, file$a, 323, 237, 14349);
				add_location(p34, file$a, 321, 2, 14078);
				attr_dev(small32, "class", "svelte-y33bja");
				add_location(small32, file$a, 327, 4, 14439);
				add_location(p35, file$a, 326, 2, 14431);
				attr_dev(small33, "class", "svelte-y33bja");
				add_location(small33, file$a, 332, 4, 14724);
				add_location(p36, file$a, 331, 2, 14716);
				attr_dev(small34, "class", "svelte-y33bja");
				add_location(small34, file$a, 337, 4, 14931);
				add_location(p37, file$a, 336, 2, 14923);
				attr_dev(small35, "class", "svelte-y33bja");
				add_location(small35, file$a, 342, 4, 15231);
				attr_dev(a17, "href", "https://p3k.org/source/rss-box");
				add_location(a17, file$a, 343, 43, 15300);
				attr_dev(a18, "href", "https://p3k.org/source/rss-box/branches/2.0/README");
				add_location(a18, file$a, 343, 376, 15633);
				add_location(p38, file$a, 341, 2, 15223);
				attr_dev(small36, "class", "svelte-y33bja");
				add_location(small36, file$a, 347, 4, 15803);
				attr_dev(a19, "href", "./?url=error");
				add_location(a19, file$a, 348, 102, 15931);
				add_location(p39, file$a, 346, 2, 15795);
				attr_dev(small37, "class", "svelte-y33bja");
				add_location(small37, file$a, 353, 4, 16103);
				add_location(i7, file$a, 354, 103, 16232);
				add_location(del0, file$a, 354, 161, 16290);
				attr_dev(a20, "href", "http://validator.w3.org/check?uri=http%3A%2F%2Fp3k.org%2Frss%2F");
				add_location(a20, file$a, 354, 303, 16432);
				add_location(p40, file$a, 352, 2, 16095);
				attr_dev(small38, "class", "svelte-y33bja");
				add_location(small38, file$a, 358, 4, 16549);
				add_location(del1, file$a, 359, 18, 16593);
				add_location(p41, file$a, 357, 2, 16541);
				attr_dev(small39, "class", "svelte-y33bja");
				add_location(small39, file$a, 363, 4, 16748);
				add_location(del2, file$a, 364, 40, 16814);
				add_location(p42, file$a, 362, 2, 16740);
				attr_dev(small40, "class", "svelte-y33bja");
				add_location(small40, file$a, 368, 4, 16860);
				attr_dev(a21, "href", "http://www.rebol.com/news3310.html");
				add_location(a21, file$a, 369, 21, 16907);
				add_location(i8, file$a, 370, 4, 17025);
				add_location(p43, file$a, 367, 2, 16852);
				attr_dev(small41, "class", "svelte-y33bja");
				add_location(small41, file$a, 374, 4, 17059);
				attr_dev(a22, "href", "http://www.ourpla.net/cgi-bin/pikie.cgi?AbbeNormal");
				add_location(a22, file$a, 375, 33, 17118);
				add_location(p44, file$a, 373, 2, 17051);
				attr_dev(small42, "class", "svelte-y33bja");
				add_location(small42, file$a, 379, 4, 17244);
				add_location(p45, file$a, 378, 2, 17236);
				attr_dev(small43, "class", "svelte-y33bja");
				add_location(small43, file$a, 384, 4, 17763);
				attr_dev(code13, "class", "svelte-y33bja");
				add_location(code13, file$a, 385, 20, 17809);
				add_location(p46, file$a, 383, 2, 17755);
				attr_dev(small44, "class", "svelte-y33bja");
				add_location(small44, file$a, 389, 4, 18194);
				add_location(p47, file$a, 388, 2, 18186);
				attr_dev(small45, "class", "svelte-y33bja");
				add_location(small45, file$a, 394, 4, 18474);
				attr_dev(code14, "class", "svelte-y33bja");
				add_location(code14, file$a, 395, 99, 18599);
				attr_dev(code15, "class", "svelte-y33bja");
				add_location(code15, file$a, 395, 126, 18626);
				attr_dev(code16, "class", "svelte-y33bja");
				add_location(code16, file$a, 395, 155, 18655);
				attr_dev(code17, "class", "svelte-y33bja");
				add_location(code17, file$a, 395, 190, 18690);
				add_location(p48, file$a, 393, 2, 18466);
				attr_dev(small46, "class", "svelte-y33bja");
				add_location(small46, file$a, 399, 4, 18896);
				add_location(p49, file$a, 398, 2, 18888);
				attr_dev(small47, "class", "svelte-y33bja");
				add_location(small47, file$a, 404, 4, 19119);
				attr_dev(a23, "href", "http://publish.curry.com/rss/");
				add_location(a23, file$a, 405, 56, 19201);
				add_location(p50, file$a, 403, 2, 19111);
				attr_dev(small48, "class", "svelte-y33bja");
				add_location(small48, file$a, 409, 4, 19470);
				add_location(del3, file$a, 410, 207, 19703);
				add_location(p51, file$a, 408, 2, 19462);
				attr_dev(small49, "class", "svelte-y33bja");
				add_location(small49, file$a, 414, 4, 19760);
				attr_dev(a24, "href", "http://www.curry.com/2001/07/31#coolRssService");
				add_location(a24, file$a, 415, 14, 19800);
				add_location(del4, file$a, 415, 117, 19903);
				add_location(p52, file$a, 413, 2, 19752);
				attr_dev(small50, "class", "svelte-y33bja");
				add_location(small50, file$a, 419, 4, 19962);
				add_location(p53, file$a, 418, 2, 19954);
				attr_dev(small51, "class", "svelte-y33bja");
				add_location(small51, file$a, 424, 4, 20084);
				add_location(p54, file$a, 423, 2, 20076);
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
				if (detaching) {
					detach_dev(details);
				}
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

	/* src/lib/Github.svelte generated by Svelte v4.1.1 */
	const file$9 = "src/lib/Github.svelte";

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
				if (detaching) {
					detach_dev(a);
				}
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

	/* src/lib/About.svelte generated by Svelte v4.1.1 */
	const file$8 = "src/lib/About.svelte";

	function add_css$8(target) {
		append_styles(target, "svelte-8mn5ku", "h3.svelte-8mn5ku.svelte-8mn5ku{display:inline-block}h3.svelte-8mn5ku+p.svelte-8mn5ku{margin-top:0}small.svelte-8mn5ku.svelte-8mn5ku{color:#bbb}.warning.svelte-8mn5ku.svelte-8mn5ku{border-color:#e44;background:#fdd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJvdXQuc3ZlbHRlIiwic291cmNlcyI6WyJBYm91dC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgYXBwIH0gZnJvbSBcIi4uL3N0b3Jlc1wiO1xuICBpbXBvcnQgQ2hhbmdlcyBmcm9tIFwiLi9DaGFuZ2VzLnN2ZWx0ZVwiO1xuICBpbXBvcnQgR2l0aHViIGZyb20gXCIuL0dpdGh1Yi5zdmVsdGVcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGNvbmZpZztcblxuICBmdW5jdGlvbiBnb3RvKCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uZmlnLnNldCh7IHVybDogZXZlbnQudGFyZ2V0LmhyZWYgfSk7XG4gIH1cblxuICBhcHAuc3Vic2NyaWJlKHN0YXRlID0+IGRvY3VtZW50LnRpdGxlID0gc3RhdGUuZGVzY3JpcHRpb24pO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgaDMge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgfVxuXG4gIGgzICsgcCB7XG4gICAgbWFyZ2luLXRvcDogMDtcbiAgfVxuXG4gIHNtYWxsIHtcbiAgICBjb2xvcjogI2JiYjtcbiAgfVxuXG4gIC53YXJuaW5nIHtcbiAgICBib3JkZXItY29sb3I6ICNlNDQ7XG4gICAgYmFja2dyb3VuZDogI2ZkZDtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdj5cbiAgPHNtYWxsPjxpPuKAnEphdmFTY3JpcHQgUlNTIFZpZXdlciBwdXRzIGxpdHRsZSBvciBsb25nIGN1c3RvbWl6YWJsZSBSU1MgYm94ZXMgYW55d2hlcmUgeW91IHB1dCBIVE1MOyBidWlsZCB5b3VyIG93biBzbGFzaGJveCBoZWxsIG9yIGhlYXZlbiwgaXTigJlzIGZlZWRhcmlmaWMh4oCdIOKAlCA8YSBocmVmPSdodHRwOi8vb3VycGxhLm5ldC9jZ2kvcGlraWUnPkFiYmUgTm9ybWFsPC9hPjwvaT48L3NtYWxsPlxuPC9kaXY+XG5cbjxoMj57ICRhcHAuZGVzY3JpcHRpb24gfSB7ICRhcHAudmVyc2lvbiB9PC9oMj5cblxuPHAgY2xhc3M9J21zZyB3YXJuaW5nJz5cbiAgPHN0cm9uZz5UaGlzIGlzIGEgbm9uLXByb2ZpdCBwcm9qZWN0IHJ1bm5pbmcgb24gYSBwcml2YXRlIHNlcnZlci48L3N0cm9uZz4gSWYgeW91IGxpa2UgdXNpbmcgaXQgeW91IHNob3VsZCA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vcDNrL3Jzcy1ib3gvYmxvYi9tYWluL0lOU1RBTEwubWQnPmhvc3QgYW4gaW5zdGFsbGF0aW9uIG9uIHlvdXIgb3duIHNlcnZlcjwvYT4gYW5kL29yIHN1cHBvcnQgdGhlIHByb2plY3Qgd2l0aCB5b3VyIDxhIGhyZWY9J2h0dHA6Ly9mbGF0dHIuY29tL3RoaW5nLzY4MTg4MS9KYXZhU2NyaXB0LVJTUy1Cb3gtVmlld2VyJz5kb25hdGlvbjwvYT4uXG48L3A+XG5cbjxwPlxuICBUaGlzIHZpZXdlciBjYW4gZGlzcGxheSA8YSBocmVmPSdodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JTUyc+UlNTPC9hPiBmZWVkcyBvZiB2ZXJzaW9uIDxhIGhyZWY9J2h0dHA6Ly9jeWJlci5sYXcuaGFydmFyZC5lZHUvcnNzL2V4YW1wbGVzL3NhbXBsZVJzczA5MS54bWwnIG9uOmNsaWNrPXsgZ290byB9PjAuOTE8L2E+LCA8YSBocmVmPSdodHRwOi8vY3liZXIubGF3LmhhcnZhcmQuZWR1L3Jzcy9leGFtcGxlcy9zYW1wbGVSc3MwOTIueG1sJyBvbjpjbGljaz17IGdvdG8gfT4wLjkyPC9hPiwgPGEgaHJlZj0naHR0cDovL3Jzcy5vcmYuYXQvZm00LnhtbCcgb246Y2xpY2s9eyBnb3RvIH0+MS4wPC9hPiBhbmQgPGEgaHJlZj0naHR0cDovL2Jsb2cucDNrLm9yZy9zdG9yaWVzLnhtbCcgb246Y2xpY2s9eyBnb3RvIH0+Mi4wPC9hPiBhcyB3ZWxsIGFzIGV2ZW4gdGhlIGdvb2Qgb2xkIGxlZ2FjeSBmb3JtYXQgPGEgaHJlZj0naHR0cDovL2Vzc2F5c2Zyb21leG9kdXMuc2NyaXB0aW5nLmNvbS94bWwvc2NyaXB0aW5nTmV3czIueG1sJyBvbjpjbGljaz17IGdvdG8gfT5TY3JpcHRpbmcgTmV3cyAyPC9hPi4gVGhlcmUgaXMgYWxzbyBiYXNpYyBzdXBwb3J0IGZvciA8YSBocmVmPSdodHRwczovL3d3dy50aGVyZWdpc3Rlci5jby51ay9oZWFkbGluZXMuYXRvbScgb246Y2xpY2s9eyBnb3RvIH0+QXRvbSAxLjA8L2E+LlxuPC9wPlxuXG48cD5cbiAgSXQgcHJvdmlkZXMgYSBzaW1wbGUgd2F5IHRvIGVtYmVkIHN1Y2ggUlNTIGJveGVzIGluIGFueSA8YSBocmVmPSdodHRwOi8vdmFsaWRhdG9yLnczLm9yZy8nPnZhbGlkIEhUTUwgZG9jdW1lbnQ8L2E+IHZpYSBhbiBhdXRvbWFnaWNhbGx5IGdlbmVyYXRlZCBKYXZhU2NyaXB0IHRhZyDigJQgPGk+Zm9yIGZyZWUhPC9pPlxuPC9wPlxuXG48cD5cbiAgSnVzdCBlbnRlciB0aGUgVVJMIG9mIGFueSBjb21wYXRpYmxlIFJTUyBmZWVkLCBtb2RpZnkgdGhlIGxheW91dCBzZXR0aW5ncyBhcyB5b3UgbGlrZSBhbmQgcHVzaCB0aGUgUmVsb2FkIGJ1dHRvbi4gV2hlbiBmaW5pc2hlZCwgY29weSB0aGUgSFRNTCBjb2RlIGludG8geW91ciBvd24gd2ViIHBhZ2Ug4oCTIGFuZCB2b2lsw6AhXG48L3A+XG5cbjxwPlxuICBUaGUgY29kZSBiZWhpbmQgdGhpcyBpcyB3cml0dGVuIGluIEphdmFTY3JpcHQgYW5kIHJ1bnMgY29tcGxldGVseSBpbiB5b3VyIGJyb3dzZXIqLiBZb3UgY2FuIGdldCB0aGUgc291cmNlIGNvZGUgdG9nZXRoZXIgd2l0aCBhbGwgdGhlIG90aGVyIG5lY2Vzc2FyeSBmaWxlcyBmcm9tIHRoZSA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vcDNrL3Jzcy1ib3gnPkdpdGh1YiByZXBvc2l0b3J5PC9hPi5cbjwvcD5cblxuPHA+XG4gIDxzbWFsbD4qIEEgcHJveHkgc2VydmVyIGlzIG5lZWRlZCBmb3IgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzLjwvc21hbGw+XG48L3A+XG5cbjxwPlxuICA8R2l0aHViLz5cbjwvcD5cblxuPENoYW5nZXMvPlxuXG48aDM+RnV0dXJlIERldmVsb3BtZW50PC9oMz5cblxuPHA+XG4gIEkgaGF2ZSBjZWFzZWQgYWN0aXZlbHkgZGV2ZWxvcGluZyB0aGlzIHZpZXdlciBidXQgc29tZXRpbWVzIEkgZ2V0IGVudGh1c2lhc3RpYyBhbmQgZmlkZGxlIGFyb3VuZCB3aXRoIHRoZSBjb2RlLiBPZiBjb3Vyc2UgaXQgd2lsbCBiZSBhdmFpbGFibGUgaGVyZSBhcyBpcy5cbjwvcD5cbjxwPlxuICBGb3IgcXVlc3Rpb25zIGFuZCBjb21tZW50cyBmZWVsIGZyZWUgdG8gY29udGFjdCBtZSAoVG9iaSkgdmlhIGUtbWFpbDogPGEgaHJlZj0nbWFpbHRvOiYjMTA5OyYjOTc7JiMxMDU7JiMxMDg7JiM0MzsmIzExNDsmIzExNTsmIzExNTsmIzY0OyYjMTEyOyYjNTE7JiMxMDc7JiM0NjsmIzExMTsmIzExNDsmIzEwMzsnPiYjMTA5OyYjOTc7JiMxMDU7JiMxMDg7JiM0MzsmIzExNDsmIzExNTsmIzExNTsmIzY0OyYjMTEyOyYjNTE7JiMxMDc7JiM0NjsmIzExMTsmIzExNDsmIzEwMzs8L2E+LlxuPC9wPlxuXG48aDM+TGljZW5zZTwvaDM+XG5cbjxwPlxuICA8c3BhbiB4bWxuczpkY3Q9J2h0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy8nIHByb3BlcnR5PSdkY3Q6dGl0bGUnPkphdmFTY3JpcHQgUlNTIEJveCBWaWV3ZXI8L3NwYW4+IGJ5XG4gIDxhIHhtbG5zOmNjPSdodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMnIGhyZWY9J2h0dHA6Ly9wM2sub3JnL3JzcycgcHJvcGVydHk9J2NjOmF0dHJpYnV0aW9uTmFtZScgcmVsPSdjYzphdHRyaWJ1dGlvblVSTCc+VG9iaSBTY2jDpGZlcjwvYT4gaXMgbGljZW5zZWQgdW5kZXIgYSA8YSByZWw9J2xpY2Vuc2UnIGhyZWY9J2h0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzMuMC9hdC9kZWVkLmVuX1VTJz5DcmVhdGl2ZSBDb21tb25zIEF0dHJpYnV0aW9uLVNoYXJlQWxpa2UgMy4wIEF1c3RyaWEgTGljZW5zZTwvYT4uXG48L3A+XG48cD5cbiAgQmFzZWQgb24gYSB3b3JrIGF0IDxhIHhtbG5zOmRjdD0naHR0cDovL3B1cmwub3JnL2RjL3Rlcm1zLycgaHJlZj0naHR0cHM6Ly9wM2sub3JnL3NvdXJjZS9zdm4vcnNzLWJveC90cnVuay8nIHJlbD0nZGN0OnNvdXJjZSc+aHR0cHM6Ly9wM2sub3JnL3NvdXJjZS9zdm4vcnNzLWJveC90cnVuay88L2E+LlxuPC9wPlxuPHA+XG4gIDxhIHJlbD0nbGljZW5zZScgaHJlZj0naHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL2F0L2RlZWQuZW5fVVMnPlxuICAgIDxpbWcgYWx0PSdDcmVhdGl2ZSBDb21tb25zIExpY2Vuc2UnIHN0eWxlPSdib3JkZXItd2lkdGg6MCcgc3JjPSdodHRwczovL2kuY3JlYXRpdmVjb21tb25zLm9yZy9sL2J5LXNhLzMuMC9hdC84OHgzMS5wbmcnPlxuICA8L2E+XG48L3A+XG5cbjxzbWFsbD5UaGFuayB5b3UsIDxhIGhyZWY9J2h0dHBzOi8vcDNrLm9yZy8nPnAzay5vcmc8L2E+ITwvc21hbGw+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBaUJFLDhCQUFHLENBQ0QsT0FBTyxDQUFFLFlBQ1gsQ0FFQSxnQkFBRSxDQUFHLGVBQUUsQ0FDTCxVQUFVLENBQUUsQ0FDZCxDQUVBLGlDQUFNLENBQ0osS0FBSyxDQUFFLElBQ1QsQ0FFQSxvQ0FBUyxDQUNQLFlBQVksQ0FBRSxJQUFJLENBQ2xCLFVBQVUsQ0FBRSxJQUNkIn0= */");
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
				add_location(a0, file$8, 36, 161, 705);
				add_location(i0, file$8, 36, 9, 553);
				attr_dev(small0, "class", "svelte-8mn5ku");
				add_location(small0, file$8, 36, 2, 546);
				add_location(div, file$8, 35, 0, 538);
				add_location(h2, file$8, 39, 0, 779);
				add_location(strong, file$8, 42, 2, 853);
				attr_dev(a1, "href", "https://github.com/p3k/rss-box/blob/main/INSTALL.md");
				add_location(a1, file$8, 42, 109, 960);
				attr_dev(a2, "href", "http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer");
				add_location(a2, file$8, 42, 252, 1103);
				attr_dev(p0, "class", "msg warning svelte-8mn5ku");
				add_location(p0, file$8, 41, 0, 827);
				attr_dev(a3, "href", "http://en.wikipedia.org/wiki/RSS");
				add_location(a3, file$8, 46, 26, 1220);
				attr_dev(a4, "href", "http://cyber.law.harvard.edu/rss/examples/sampleRss091.xml");
				add_location(a4, file$8, 46, 94, 1288);
				attr_dev(a5, "href", "http://cyber.law.harvard.edu/rss/examples/sampleRss092.xml");
				add_location(a5, file$8, 46, 191, 1385);
				attr_dev(a6, "href", "http://rss.orf.at/fm4.xml");
				add_location(a6, file$8, 46, 288, 1482);
				attr_dev(a7, "href", "http://blog.p3k.org/stories.xml");
				add_location(a7, file$8, 46, 354, 1548);
				attr_dev(a8, "href", "http://essaysfromexodus.scripting.com/xml/scriptingNews2.xml");
				add_location(a8, file$8, 46, 465, 1659);
				attr_dev(a9, "href", "https://www.theregister.co.uk/headlines.atom");
				add_location(a9, file$8, 46, 608, 1802);
				add_location(p1, file$8, 45, 0, 1190);
				attr_dev(a10, "href", "http://validator.w3.org/");
				add_location(a10, file$8, 50, 58, 1957);
				add_location(i1, file$8, 50, 165, 2064);
				add_location(p2, file$8, 49, 0, 1895);
				add_location(p3, file$8, 53, 0, 2087);
				attr_dev(a11, "href", "https://github.com/p3k/rss-box");
				add_location(a11, file$8, 58, 167, 2454);
				add_location(p4, file$8, 57, 0, 2283);
				attr_dev(small1, "class", "svelte-8mn5ku");
				add_location(small1, file$8, 62, 2, 2530);
				add_location(p5, file$8, 61, 0, 2524);
				add_location(p6, file$8, 65, 0, 2605);
				attr_dev(h30, "class", "svelte-8mn5ku");
				add_location(h30, file$8, 71, 0, 2639);
				attr_dev(p7, "class", "svelte-8mn5ku");
				add_location(p7, file$8, 73, 0, 2668);
				attr_dev(a12, "href", "mailto:mail+rss@p3k.org");
				add_location(a12, file$8, 77, 72, 2910);
				add_location(p8, file$8, 76, 0, 2834);
				attr_dev(h31, "class", "svelte-8mn5ku");
				add_location(h31, file$8, 80, 0, 3122);
				attr_dev(span, "xmlns:dct", "http://purl.org/dc/terms/");
				attr_dev(span, "property", "dct:title");
				add_location(span, file$8, 83, 2, 3146);
				attr_dev(a13, "xmlns:cc", "http://creativecommons.org/ns#");
				attr_dev(a13, "href", "http://p3k.org/rss");
				attr_dev(a13, "property", "cc:attributionName");
				attr_dev(a13, "rel", "cc:attributionURL");
				add_location(a13, file$8, 84, 2, 3249);
				attr_dev(a14, "rel", "license");
				attr_dev(a14, "href", "http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US");
				add_location(a14, file$8, 84, 164, 3411);
				attr_dev(p9, "class", "svelte-8mn5ku");
				add_location(p9, file$8, 82, 0, 3140);
				attr_dev(a15, "xmlns:dct", "http://purl.org/dc/terms/");
				attr_dev(a15, "href", "https://p3k.org/source/svn/rss-box/trunk/");
				attr_dev(a15, "rel", "dct:source");
				add_location(a15, file$8, 87, 21, 3590);
				add_location(p10, file$8, 86, 0, 3565);
				attr_dev(img, "alt", "Creative Commons License");
				set_style(img, "border-width", "0");
				if (!src_url_equal(img.src, img_src_value = "https://i.creativecommons.org/l/by-sa/3.0/at/88x31.png")) attr_dev(img, "src", img_src_value);
				add_location(img, file$8, 91, 4, 3844);
				attr_dev(a16, "rel", "license");
				attr_dev(a16, "href", "http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US");
				add_location(a16, file$8, 90, 2, 3755);
				add_location(p11, file$8, 89, 0, 3749);
				attr_dev(a17, "href", "https://p3k.org/");
				add_location(a17, file$8, 95, 18, 3996);
				attr_dev(small2, "class", "svelte-8mn5ku");
				add_location(small2, file$8, 95, 0, 3978);
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
						listen_dev(a4, "click", /*goto*/ ctx[1], false, false, false, false),
						listen_dev(a5, "click", /*goto*/ ctx[1], false, false, false, false),
						listen_dev(a6, "click", /*goto*/ ctx[1], false, false, false, false),
						listen_dev(a7, "click", /*goto*/ ctx[1], false, false, false, false),
						listen_dev(a8, "click", /*goto*/ ctx[1], false, false, false, false),
						listen_dev(a9, "click", /*goto*/ ctx[1], false, false, false, false)
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
				if (detaching) {
					detach_dev(div);
					detach_dev(t2);
					detach_dev(h2);
					detach_dev(t6);
					detach_dev(p0);
					detach_dev(t13);
					detach_dev(p1);
					detach_dev(t29);
					detach_dev(p2);
					detach_dev(t34);
					detach_dev(p3);
					detach_dev(t36);
					detach_dev(p4);
					detach_dev(t40);
					detach_dev(p5);
					detach_dev(t42);
					detach_dev(p6);
					detach_dev(t43);
					detach_dev(t44);
					detach_dev(h30);
					detach_dev(t46);
					detach_dev(p7);
					detach_dev(t48);
					detach_dev(p8);
					detach_dev(t52);
					detach_dev(h31);
					detach_dev(t54);
					detach_dev(p9);
					detach_dev(t61);
					detach_dev(p10);
					detach_dev(t65);
					detach_dev(p11);
					detach_dev(t66);
					detach_dev(small2);
				}

				destroy_component(github);
				destroy_component(changes, detaching);
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
		validate_store(app$1, 'app');
		component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('About', slots, []);
		let { config } = $$props;

		function goto() {
			event.preventDefault();
			config.set({ url: event.target.href });
		}

		app$1.subscribe(state => document.title = state.description);

		$$self.$$.on_mount.push(function () {
			if (config === undefined && !('config' in $$props || $$self.$$.bound[$$self.$$.props['config']])) {
				console.warn("<About> was created without expected prop 'config'");
			}
		});

		const writable_props = ['config'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('config' in $$props) $$invalidate(2, config = $$props.config);
		};

		$$self.$capture_state = () => ({ app: app$1, Changes, Github, config, goto, $app });

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
		}

		get config() {
			throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set config(value) {
			throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/lib/Ad.svelte generated by Svelte v4.1.1 */
	const file$7 = "src/lib/Ad.svelte";

	function add_css$7(target) {
		append_styles(target, "svelte-d7o9dc", "ins.svelte-d7o9dc{overflow:hidden;margin-bottom:1em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWQuc3ZlbHRlIiwic291cmNlcyI6WyJBZC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgKHdpbmRvdy5hZHNieWdvb2dsZSA9IHdpbmRvdy5hZHNieWdvb2dsZSB8fCBbXSkucHVzaCh7fSk7XG5cbiAgY29uc3Qgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgc2NyaXB0LnNyYyA9IFwiaHR0cHM6Ly9wYWdlYWQyLmdvb2dsZXN5bmRpY2F0aW9uLmNvbS9wYWdlYWQvanMvYWRzYnlnb29nbGUuanNcIjtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgaW5zIHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIG1hcmdpbi1ib3R0b206IDFlbTtcbiAgfVxuPC9zdHlsZT5cblxuPGlucyBjbGFzcz0nYWRzYnlnb29nbGUnXG4gICAgIHN0eWxlPSdkaXNwbGF5OmJsb2NrJ1xuICAgICBkYXRhLWFkLWNsaWVudD0nY2EtcHViLTM5NjUwMjgwNDMxNTMxMzgnXG4gICAgIGRhdGEtYWQtc2xvdD0nNjM3MDI1NzQ1MSdcbiAgICAgZGF0YS1hZC1mb3JtYXQ9J2F1dG8nXG4gICAgIGRhdGEtZnVsbC13aWR0aC1yZXNwb25zaXZlPSd0cnVlJz48L2lucz5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVRSxpQkFBSSxDQUNGLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLGFBQWEsQ0FBRSxHQUNqQiJ9 */");
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
				if (detaching) {
					detach_dev(ins);
				}
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

	/* src/lib/LinkIcon.svelte generated by Svelte v4.1.1 */
	const file$6 = "src/lib/LinkIcon.svelte";

	function add_css$6(target) {
		append_styles(target, "svelte-mfbc6b", "svg.svelte-mfbc6b{width:1.2em;height:1.2em}polygon.svelte-mfbc6b{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0ljb24uc3ZlbHRlIiwic291cmNlcyI6WyJMaW5rSWNvbi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHN0eWxlPlxuICBzdmcge1xuICAgIHdpZHRoOiAxLjJlbTtcbiAgICBoZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgcG9seWdvbiB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICAgIGZpbGwtcnVsZTogZXZlbm9kZDtcbiAgICBjbGlwLXJ1bGU6IGV2ZW5vZGQ7XG4gIH1cbjwvc3R5bGU+XG5cbjwhLS0gU291cmNlOiBodHRwczovL2NvbW1vbnMud2lraW1lZGlhLm9yZy93aWtpL0ZpbGU6VmlzdWFsRWRpdG9yXy1fSWNvbl8tX0V4dGVybmFsLWxpbmsuc3ZnIC0tPlxuPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMiAxMicgcHJlc2VydmVBc3BlY3RSYXRpbz0neE1pbllNaW4nPlxuICA8Zz5cbiAgICA8cG9seWdvbiBwb2ludHM9JzIsMiA1LDIgNSwzIDMsMyAzLDkgOSw5IDksNyAxMCw3IDEwLDEwIDIsMTAnLz5cbiAgICA8cG9seWdvbiBwb2ludHM9JzYuMjExLDIgMTAsMiAxMCw1Ljc4OSA4LjU3OSw0LjM2OCA2LjQ0Nyw2LjUgNS41LDUuNTUzIDcuNjMyLDMuNDIxJy8+XG4gIDwvZz5cbjwvc3ZnPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNFLGlCQUFJLENBQ0YsS0FBSyxDQUFFLEtBQUssQ0FDWixNQUFNLENBQUUsS0FDVixDQUVBLHFCQUFRLENBQ04sSUFBSSxDQUFFLFlBQVksQ0FDbEIsU0FBUyxDQUFFLE9BQU8sQ0FDbEIsU0FBUyxDQUFFLE9BQ2IifQ== */");
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
				if (detaching) {
					detach_dev(svg);
				}
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

	/* src/lib/RssIcon.svelte generated by Svelte v4.1.1 */
	const file$5 = "src/lib/RssIcon.svelte";

	function add_css$5(target) {
		append_styles(target, "svelte-ibnekz", "svg.svelte-ibnekz{width:1em;height:1em}path.svelte-ibnekz{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnNzSWNvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIlJzc0ljb24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgc3ZnIHtcbiAgICB3aWR0aDogMWVtO1xuICAgIGhlaWdodDogMWVtO1xuICB9XG5cbiAgcGF0aCB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG48L3N0eWxlPlxuXG48IS0tIFNvdXJjZTogaHR0cHM6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9GaWxlOlJzc19mb250X2F3ZXNvbWUuc3ZnIC0tPlxuPHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgLTI1NiAxNzkyIDE3OTInIHByZXNlcnZlQXNwZWN0UmF0aW89J3hNaW5ZTWluJz5cbiAgPGcgdHJhbnNmb3JtPSdtYXRyaXgoMSwwLDAsLTEsMjEyLjYxMDE3LDEzNDYuMTY5NSknPlxuICAgIDxwYXRoIGQ9J00gMzg0LDE5MiBRIDM4NCwxMTIgMzI4LDU2IDI3MiwwIDE5MiwwIDExMiwwIDU2LDU2IDAsMTEyIDAsMTkyIHEgMCw4MCA1NiwxMzYgNTYsNTYgMTM2LDU2IDgwLDAgMTM2LC01NiA1NiwtNTYgNTYsLTEzNiB6IE0gODk2LDY5IFEgODk4LDQxIDg3OSwyMSA4NjEsMCA4MzIsMCBIIDY5NyBRIDY3MiwwIDY1NCwxNi41IDYzNiwzMyA2MzQsNTggNjEyLDI4NyA0NDkuNSw0NDkuNSAyODcsNjEyIDU4LDYzNCAzMyw2MzYgMTYuNSw2NTQgMCw2NzIgMCw2OTcgdiAxMzUgcSAwLDI5IDIxLDQ3IDE3LDE3IDQzLDE3IGggNSBRIDIyOSw4ODMgMzc1LDgxNS41IDUyMSw3NDggNjM0LDYzNCA3NDgsNTIxIDgxNS41LDM3NSA4ODMsMjI5IDg5Niw2OSB6IG0gNTEyLC0yIFEgMTQxMCw0MCAxMzkwLDIwIDEzNzIsMCAxMzQ0LDAgSCAxMjAxIFEgMTE3NSwwIDExNTYuNSwxNy41IDExMzgsMzUgMTEzNyw2MCAxMTI1LDI3NSAxMDM2LDQ2OC41IDk0Nyw2NjIgODA0LjUsODA0LjUgNjYyLDk0NyA0NjguNSwxMDM2IDI3NSwxMTI1IDYwLDExMzggMzUsMTEzOSAxNy41LDExNTcuNSAwLDExNzYgMCwxMjAxIHYgMTQzIHEgMCwyOCAyMCw0NiAxOCwxOCA0NCwxOCBoIDMgUSAzMjksMTM5NSA1NjguNSwxMjg4IDgwOCwxMTgxIDk5NCw5OTQgMTE4MSw4MDggMTI4OCw1NjguNSAxMzk1LDMyOSAxNDA4LDY3IHonLz5cbiAgPC9nPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0UsaUJBQUksQ0FDRixLQUFLLENBQUUsR0FBRyxDQUNWLE1BQU0sQ0FBRSxHQUNWLENBRUEsa0JBQUssQ0FDSCxJQUFJLENBQUUsWUFDUiJ9 */");
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
				if (detaching) {
					detach_dev(svg);
				}
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

	/* src/lib/PaperclipIcon.svelte generated by Svelte v4.1.1 */
	const file$4 = "src/lib/PaperclipIcon.svelte";

	function add_css$4(target) {
		append_styles(target, "svelte-1bdkb67", "svg.svelte-1bdkb67{width:1.2em;height:1.2em}path.svelte-1bdkb67{fill:currentColor}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFwZXJjbGlwSWNvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIlBhcGVyY2xpcEljb24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgc3ZnIHtcbiAgICB3aWR0aDogMS4yZW07XG4gICAgaGVpZ2h0OiAxLjJlbTtcbiAgfVxuXG4gIHBhdGgge1xuICAgIGZpbGw6IGN1cnJlbnRDb2xvcjtcbiAgfVxuPC9zdHlsZT5cblxuPCEtLSBTb3VyY2U6IGh0dHBzOi8vY29tbW9ucy53aWtpbWVkaWEub3JnL3dpa2kvRmlsZTpBbnR1X2FwcGxpY2F0aW9uLXJ0Zi5zdmcgLS0+XG48c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDE2IDE2JyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSd4TWluWU1pbic+XG4gIDxwYXRoIGQ9J200MDkgNTMxbC01LjI0NCA2LjczM2MtLjk4MyAxLjI2Mi0uNzA4IDMuNTExLjU1IDQuNDk3IDEuMjU5Ljk4NiAzLjUuNzEgNC40ODQtLjU1Mmw1LjI0NC02LjczMy42NTUtLjg0MmMuNjU2LS44NDIuNDcyLTIuMzQxLS4zNjctMi45OTgtLjgzOS0uNjU4LTIuMzM0LS40NzMtMi45ODkuMzY4bC0uNjU2Ljg0Mi0zLjkzMyA1LjA1LS42NTYuODQyYy0uMzI4LjQyMS0uMjM2IDEuMTcuMTgzIDEuNDk5LjQyLjMyOSAxLjE2Ny4yMzcgMS40OTUtLjE4NGw0LjU4OS01Ljg5MS44MzkuNjU4LTQuNTg5IDUuODkxYy0uNjU2Ljg0Mi0yLjE1IDEuMDI2LTIuOTg5LjM2OC0uODM5LS42NTgtMS4wMjMtMi4xNTctLjM2Ny0yLjk5OGwuNjU2LS44NDIgNC41ODktNS44OTFjLjk4My0xLjI2MiAzLjIyNS0xLjUzOCA0LjQ4NC0uNTUyIDEuMjU5Ljk4NiAxLjUzNCAzLjIzNS41NTEgNC40OTdsLS42NTYuODQyLTUuMjQ0IDYuNzMzYy0xLjMxMSAxLjY4My00LjMgMi4wNTEtNS45NzguNzM2LTEuNjc4LTEuMzE1LTIuMDQ1LTQuMzEzLS43MzQtNS45OTdsNS4yNDQtNi43MzMuODM5LjY1OCcgdHJhbnNmb3JtPSdtYXRyaXgoLjg0NzgyIDAgMCAuODQ1MjEtMzM4Ljg1LTQ0NS42OCknIHN0cm9rZT0nbm9uZScvPlxuPC9zdmc+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0Usa0JBQUksQ0FDRixLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUNWLENBRUEsbUJBQUssQ0FDSCxJQUFJLENBQUUsWUFDUiJ9 */");
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
				if (detaching) {
					detach_dev(svg);
				}
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

	/* src/Box.svelte generated by Svelte v4.1.1 */
	const file$3 = "src/Box.svelte";

	function add_css$3(target) {
		append_styles(target, "svelte-1rjx8bp", ".rssbox.svelte-1rjx8bp.svelte-1rjx8bp{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon.svelte-1rjx8bp.svelte-1rjx8bp{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar.svelte-1rjx8bp.svelte-1rjx8bp{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date.svelte-1rjx8bp.svelte-1rjx8bp{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content.svelte-1rjx8bp.svelte-1rjx8bp{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content.svelte-1rjx8bp aside.svelte-1rjx8bp{clear:both;float:right}.rssbox-content.svelte-1rjx8bp aside a.svelte-1rjx8bp{display:block;margin-left:0.5em}.rssbox-image.svelte-1rjx8bp.svelte-1rjx8bp{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold.svelte-1rjx8bp.svelte-1rjx8bp{font-weight:bold}.rssbox-enclosure.svelte-1rjx8bp.svelte-1rjx8bp,.rssbox-source.svelte-1rjx8bp.svelte-1rjx8bp{display:block;width:1em}.rssbox-form.svelte-1rjx8bp.svelte-1rjx8bp{margin-bottom:0.8em}.rssbox-form.svelte-1rjx8bp input.svelte-1rjx8bp{padding:0.5em;background-color:#fff}.rssbox-promo.svelte-1rjx8bp.svelte-1rjx8bp{text-align:right;font-size:0.7em;letter-spacing:0.01em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm94LnN2ZWx0ZSIsInNvdXJjZXMiOlsiQm94LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSBcInN2ZWx0ZVwiO1xuICBpbXBvcnQgeyB1cmxzIH0gZnJvbSBcIi4vdXJsc1wiO1xuXG4gIGltcG9ydCBMaW5rSWNvbiBmcm9tIFwiLi9saWIvTGlua0ljb24uc3ZlbHRlXCI7XG4gIGltcG9ydCBSc3NJY29uIGZyb20gXCIuL2xpYi9Sc3NJY29uLnN2ZWx0ZVwiO1xuICBpbXBvcnQgUGFwZXJjbGlwSWNvbiBmcm9tIFwiLi9saWIvUGFwZXJjbGlwSWNvbi5zdmVsdGVcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGZlZWQ7XG4gIGV4cG9ydCBsZXQgY29uZmlnO1xuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRpY0lkID0gXCJyc3Nib3gtc3RhdGljLXN0eWxlc2hlZXRcIjtcbiAgICBjb25zdCBkeW5hbWljSWQgPSBcInJzc2JveC1keW5hbWljLXN0eWxlc2hlZXRcIjtcblxuICAgIGxldCBzdGF0aWNDc3MgPSB3aW5kb3dbc3RhdGljSWRdO1xuICAgIGxldCBkeW5hbWljQ3NzID0gd2luZG93W2R5bmFtaWNJZF07XG5cbiAgICBpZiAoIXN0YXRpY0Nzcykge1xuICAgICAgc3RhdGljQ3NzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICBzdGF0aWNDc3MuaWQgPSBzdGF0aWNJZDtcbiAgICAgIHN0YXRpY0Nzcy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcbiAgICAgIHN0YXRpY0Nzcy5ocmVmID0gYCR7dXJscy5hcHB9L2Fzc2V0cy9ib3guY3NzYDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3RhdGljQ3NzKTtcbiAgICB9XG5cbiAgICBpZiAoIWR5bmFtaWNDc3MpIHtcbiAgICAgIGR5bmFtaWNDc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICBkeW5hbWljQ3NzLmlkID0gZHluYW1pY0lkO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChkeW5hbWljQ3NzKTtcbiAgICB9XG5cbiAgICBjb25maWcuc3Vic2NyaWJlKHN0YXRlID0+IHtcbiAgICAgIGNvbnN0IGNvbG9yID0gc3RhdGUubGlua0NvbG9yO1xuXG4gICAgICBpZiAoIWNvbG9yKSByZXR1cm47XG5cbiAgICAgIGxldCBydWxlID1cbiAgICAgICAgYC5yc3Nib3hbZGF0YS1saW5rLWNvbG9yPVwiJHsgY29sb3IgfVwiXSBhIHtcbiAgICAgICAgICBjb2xvcjogJHsgY29sb3IgfTtcbiAgICAgICAgfWA7XG5cbiAgICAgIGlmIChkeW5hbWljQ3NzLmlubmVySFRNTC5pbmRleE9mKHJ1bGUpIDwgMCkgZHluYW1pY0Nzcy5pbm5lckhUTUwgKz0gcnVsZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24ga2IoYnl0ZXMpIHtcbiAgICByZXR1cm4gKGJ5dGVzIC8gMTAwMCkudG9GaXhlZCgyKSArIFwiXFx1MjAwYWtCXCI7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkKGRhdGEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5taW4oMTAwLCBpbWFnZS53aWR0aCk7XG4gICAgICAgIGNvbnN0IGZhY3RvciA9IGltYWdlLndpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCAvIGltYWdlLndpZHRoIDogMTtcblxuICAgICAgICBmdWxmaWxsKHtcbiAgICAgICAgICB3aWR0aDogKGltYWdlLndpZHRoICogZmFjdG9yKSArIFwicHhcIixcbiAgICAgICAgICBoZWlnaHQ6IChpbWFnZS5oZWlnaHQgKiBmYWN0b3IpICsgXCJweFwiXG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgaW1hZ2Uuc3JjID0gZGF0YS5zb3VyY2U7XG4gICAgfSk7XG4gIH1cblxuICAkOiBoZWlnaHQgPSAkY29uZmlnLmhlaWdodCAmJiAkY29uZmlnLmhlaWdodCA+IC0xID8gJGNvbmZpZy5oZWlnaHQgKyBcInB4XCIgOiBcIjEwMCVcIjtcbiAgJDogd2lkdGggPSAkY29uZmlnLndpZHRoID8gJGNvbmZpZy53aWR0aCArIFwicHhcIiA6IFwiMTAwJVwiO1xuICAkOiBpdGVtVGl0bGVDbGFzcyA9ICEkY29uZmlnLmNvbXBhY3QgPyBcImJvbGRcIiA6IFwiXCI7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAucnNzYm94IHtcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICMwMDA7XG4gICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiAwO1xuICAgIC1tb3otYm9yZGVyLXJhZGl1czogMDtcbiAgfVxuXG4gIC5yc3Nib3gtaWNvbiB7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICAgIHdpZHRoOiAxZW07XG4gICAgbWFyZ2luLWxlZnQ6IDAuNWVtO1xuICB9XG5cbiAgLnJzc2JveC10aXRsZWJhciB7XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgY29sb3I6ICMwMDA7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2FkZDhlNjtcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzAwMDtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4wMWVtO1xuICB9XG5cbiAgLnJzc2JveC1kYXRlIHtcbiAgICBtYXJnaW4tdG9wOiAwLjJlbTtcbiAgICBmb250LXNpemU6IDAuOGVtO1xuICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIH1cblxuICAucnNzYm94LWNvbnRlbnQge1xuICAgIGhlaWdodDogYXV0bztcbiAgICBwYWRkaW5nOiAwLjVlbTtcbiAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICAgIGNsZWFyOiBib3RoO1xuICAgIC1tcy1vdmVyZmxvdy1zdHlsZTogLW1zLWF1dG9oaWRpbmctc2Nyb2xsYmFyO1xuICB9XG5cbiAgLnJzc2JveC1jb250ZW50IGFzaWRlIHtcbiAgICBjbGVhcjogYm90aDtcbiAgICBmbG9hdDogcmlnaHQ7XG4gIH1cblxuICAucnNzYm94LWNvbnRlbnQgYXNpZGUgYSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgbWFyZ2luLWxlZnQ6IDAuNWVtO1xuICB9XG5cbiAgLnJzc2JveC1pbWFnZSB7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICAgIG1hcmdpbjogMCAwIDAuNWVtIDAuNWVtO1xuICAgIGJhY2tncm91bmQtcG9zaXRpb246IGxlZnQgY2VudGVyO1xuICAgIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XG4gICAgYmFja2dyb3VuZC1zaXplOiBjb250YWluO1xuICB9XG5cbiAgLnJzc2JveC1pdGVtLXRpdGxlLmJvbGQge1xuICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICB9XG5cbiAgLnJzc2JveC1lbmNsb3N1cmUsIC5yc3Nib3gtc291cmNlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICB3aWR0aDogMWVtO1xuICB9XG5cbiAgLnJzc2JveC1mb3JtIHtcbiAgICBtYXJnaW4tYm90dG9tOiAwLjhlbTtcbiAgfVxuXG4gIC5yc3Nib3gtZm9ybSBpbnB1dCB7XG4gICAgcGFkZGluZzogMC41ZW07XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgfVxuXG4gIC5yc3Nib3gtcHJvbW8ge1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgIGZvbnQtc2l6ZTogMC43ZW07XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBkYXRhLWxpbmstY29sb3I9J3sgJGNvbmZpZy5saW5rQ29sb3IgfScgY2xhc3M9J3Jzc2JveCByc3NCb3gnIHN0eWxlPSdtYXgtd2lkdGg6IHsgd2lkdGggfTsgYm9yZGVyLWNvbG9yOiB7ICRjb25maWcuZnJhbWVDb2xvciB9OyBib3JkZXItcmFkaXVzOiB7ICRjb25maWcucmFkaXVzIH1weDsgZm9udDogeyAkY29uZmlnLmZvbnRGYWNlIH07IGZsb2F0OiB7ICRjb25maWcuYWxpZ24gfTsnPlxuICB7ICNpZiAhJGNvbmZpZy5oZWFkbGVzcyB9XG4gICAgPGRpdiBjbGFzcz0ncnNzYm94LXRpdGxlYmFyJyBzdHlsZT0nY29sb3I6IHsgJGNvbmZpZy50aXRsZUJhclRleHRDb2xvciB9OyBiYWNrZ3JvdW5kLWNvbG9yOiB7ICRjb25maWcudGl0bGVCYXJDb2xvciB9OyBib3JkZXItYm90dG9tLWNvbG9yOiB7ICRjb25maWcuZnJhbWVDb2xvciB9Oyc+XG4gICAgICB7ICNpZiAkY29uZmlnLnNob3dYbWxCdXR0b24gfVxuICAgICAgICA8ZGl2IGNsYXNzPSdyc3Nib3gtaWNvbic+XG4gICAgICAgICAgPGEgaHJlZj0neyAkY29uZmlnLnVybCB9JyB0aXRsZT0neyAkZmVlZC5mb3JtYXQgfSB7ICRmZWVkLnZlcnNpb24gfScgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGl0bGVCYXJUZXh0Q29sb3IgfSc+XG4gICAgICAgICAgICA8UnNzSWNvbi8+XG4gICAgICAgICAgPC9hPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIHsgL2lmIH1cbiAgICAgIDxkaXY+XG4gICAgICAgIDxhIGhyZWY9J3sgJGZlZWQubGluayB9JyBzdHlsZT0nY29sb3I6IHsgJGNvbmZpZy50aXRsZUJhclRleHRDb2xvciB9Oyc+XG4gICAgICAgICAgeyAkZmVlZC50aXRsZSB9XG4gICAgICAgIDwvYT5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWRhdGUnPlxuICAgICAgICB7IGZlZWQuZm9ybWF0RGF0ZSgkZmVlZC5kYXRlKSB9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgeyAvaWYgfVxuXG4gIDxkaXYgY2xhc3M9J3Jzc2JveC1jb250ZW50IHJzc0JveENvbnRlbnQnIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiB7ICRjb25maWcuYm94RmlsbENvbG9yIH07IGhlaWdodDogeyBoZWlnaHQgfTsnPlxuICAgIHsgI2lmICRmZWVkLmltYWdlICYmICEkY29uZmlnLmNvbXBhY3QgfVxuICAgICAgeyAjYXdhaXQgbG9hZCgkZmVlZC5pbWFnZSkgdGhlbiBpbWFnZSB9XG4gICAgICAgIDxhIGhyZWY9J3sgJGZlZWQuaW1hZ2UubGluayB9JyB0aXRsZT0neyAkZmVlZC5pbWFnZS50aXRsZSB9Jz5cbiAgICAgICAgICA8ZGl2IGFsdD0neyAkZmVlZC5pbWFnZS5kZXNjcmlwdGlvbiB9JyBjbGFzcz0ncnNzYm94LWltYWdlJyBzdHlsZT0nYmFja2dyb3VuZC1pbWFnZTogdXJsKHsgJGZlZWQuaW1hZ2Uuc291cmNlIH0pOyB3aWR0aDogeyBpbWFnZS53aWR0aCB9OyBoZWlnaHQ6IHsgaW1hZ2UuaGVpZ2h0IH07Jz48L2Rpdj5cbiAgICAgICAgPC9hPlxuICAgICAgeyAvYXdhaXQgfVxuICAgIHsgL2lmIH1cblxuICAgIHsgI2VhY2ggJGZlZWQuaXRlbXMgYXMgaXRlbSwgaW5kZXggfVxuICAgICAgeyAjaWYgaW5kZXggPCAkY29uZmlnLm1heEl0ZW1zIH1cbiAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWl0ZW0tY29udGVudCByc3NCb3hJdGVtQ29udGVudCcgc3R5bGU9J2NvbG9yOiB7ICRjb25maWcudGV4dENvbG9yIH0nPlxuICAgICAgICAgIHsgI2lmIGl0ZW0udGl0bGUgfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ncnNzYm94LWl0ZW0tdGl0bGUgeyBpdGVtVGl0bGVDbGFzcyB9Jz5cbiAgICAgICAgICAgICAgeyAjaWYgaXRlbS5saW5rIH1cbiAgICAgICAgICAgICAgICA8YSBocmVmPSd7IGl0ZW0ubGluayB9Jz5cbiAgICAgICAgICAgICAgICAgIHtAaHRtbCBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIHsgOmVsc2UgfVxuICAgICAgICAgICAgICAgIHtAaHRtbCBpdGVtLnRpdGxlIH1cbiAgICAgICAgICAgICAgeyAvaWYgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgeyAvaWYgfVxuXG4gICAgICAgICAgeyAjaWYgISRjb25maWcuY29tcGFjdCB9XG4gICAgICAgICAgICA8YXNpZGU+XG4gICAgICAgICAgICAgIHsgI2lmIGl0ZW0uc291cmNlIH1cbiAgICAgICAgICAgICAgICA8YSBocmVmPSd7IGl0ZW0uc291cmNlLnVybCB9JyB0aXRsZT0neyBpdGVtLnNvdXJjZS50aXRsZSB9JyBjbGFzcz0ncnNzYm94LXNvdXJjZSc+XG4gICAgICAgICAgICAgICAgICB7ICNpZiBpdGVtLnNvdXJjZS51cmwuZW5kc1dpdGgoXCIueG1sXCIpIH1cbiAgICAgICAgICAgICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICAgICAgICAgICAgeyA6ZWxzZSB9XG4gICAgICAgICAgICAgICAgICAgIDxMaW5rSWNvbi8+XG4gICAgICAgICAgICAgICAgICB7IC9pZiB9XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICB7IC9pZiB9XG5cbiAgICAgICAgICAgICAgeyAjaWYgaXRlbS5lbmNsb3N1cmVzIH1cbiAgICAgICAgICAgICAgICB7ICNlYWNoIGl0ZW0uZW5jbG9zdXJlcyBhcyBlbmNsb3N1cmUgfVxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0neyBlbmNsb3N1cmUudXJsIH0nIHRpdGxlPSd7IGtiKGVuY2xvc3VyZS5sZW5ndGgpIH0geyBlbmNsb3N1cmUudHlwZSB9JyBjbGFzcz0ncnNzYm94LWVuY2xvc3VyZSc+XG4gICAgICAgICAgICAgICAgICAgIDxQYXBlcmNsaXBJY29uLz5cbiAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICB7IC9lYWNoIH1cbiAgICAgICAgICAgICAgeyAvaWYgfVxuICAgICAgICAgICAgPC9hc2lkZT5cbiAgICAgICAgICAgIHtAaHRtbCBpdGVtLmRlc2NyaXB0aW9uIH1cbiAgICAgICAgICB7IC9pZiB9XG4gICAgICAgIDwvZGl2PlxuICAgICAgeyAvaWYgfVxuICAgIHsgL2VhY2ggfVxuXG4gICAgeyAjaWYgJGZlZWQuaW5wdXQgfVxuICAgICAgPGZvcm0gY2xhc3M9J3Jzc2JveC1mb3JtJyBtZXRob2Q9J2dldCcgYWN0aW9uPSd7ICRmZWVkLmlucHV0LmxpbmsgfSc+XG4gICAgICAgIDxpbnB1dCB0eXBlPSd0ZXh0JyBuYW1lPSd7ICRmZWVkLmlucHV0Lm5hbWUgfScgcGxhY2Vob2xkZXI9J0VudGVyIHNlYXJjaCAmYW1wOyBoaXQgcmV0dXJu4oCmJyBkYXRhLXBsYWNlaG9sZGVyPSd7ICRmZWVkLmlucHV0LmRlc2NyaXB0aW9uIH0nPlxuICAgICAgPC9mb3JtPlxuICAgIHsgL2lmIH1cbiAgICA8ZGl2IGNsYXNzPSdyc3Nib3gtcHJvbW8gcnNzQm94UHJvbW8nPlxuICAgICAgPGEgaHJlZj0neyB1cmxzLmFwcCB9JyBzdHlsZT0nY29sb3I6IHsgJGNvbmZpZy50ZXh0Q29sb3IgfSc+UlNTIEJveCBieSBwM2sub3JnPC9hPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJFRSxxQ0FBUSxDQUNOLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUN0QixXQUFXLENBQUUsVUFBVSxDQUN2QixRQUFRLENBQUUsTUFBTSxDQUNoQixhQUFhLENBQUUsQ0FBQyxDQUNoQixrQkFBa0IsQ0FBRSxDQUN0QixDQUVBLDBDQUFhLENBQ1gsS0FBSyxDQUFFLEtBQUssQ0FDWixLQUFLLENBQUUsR0FBRyxDQUNWLFdBQVcsQ0FBRSxLQUNmLENBRUEsOENBQWlCLENBQ2YsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsSUFBSSxDQUNYLGdCQUFnQixDQUFFLE9BQU8sQ0FDekIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUM3QixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFDbEIsQ0FFQSwwQ0FBYSxDQUNYLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxNQUNmLENBRUEsNkNBQWdCLENBQ2QsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsS0FBSyxDQUNkLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLGdCQUFnQixDQUFFLElBQUksQ0FDdEIsS0FBSyxDQUFFLElBQUksQ0FDWCxrQkFBa0IsQ0FBRSx3QkFDdEIsQ0FFQSw4QkFBZSxDQUFDLG9CQUFNLENBQ3BCLEtBQUssQ0FBRSxJQUFJLENBQ1gsS0FBSyxDQUFFLEtBQ1QsQ0FFQSw4QkFBZSxDQUFDLEtBQUssQ0FBQyxnQkFBRSxDQUN0QixPQUFPLENBQUUsS0FBSyxDQUNkLFdBQVcsQ0FBRSxLQUNmLENBRUEsMkNBQWMsQ0FDWixLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ3ZCLG1CQUFtQixDQUFFLElBQUksQ0FBQyxNQUFNLENBQ2hDLGlCQUFpQixDQUFFLFNBQVMsQ0FDNUIsZUFBZSxDQUFFLE9BQ25CLENBRUEsa0JBQWtCLG1DQUFNLENBQ3RCLFdBQVcsQ0FBRSxJQUNmLENBRUEsK0NBQWlCLENBQUUsNENBQWUsQ0FDaEMsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsR0FDVCxDQUVBLDBDQUFhLENBQ1gsYUFBYSxDQUFFLEtBQ2pCLENBRUEsMkJBQVksQ0FBQyxvQkFBTSxDQUNqQixPQUFPLENBQUUsS0FBSyxDQUNkLGdCQUFnQixDQUFFLElBQ3BCLENBRUEsMkNBQWMsQ0FDWixVQUFVLENBQUUsS0FBSyxDQUNqQixTQUFTLENBQUUsS0FBSyxDQUNoQixjQUFjLENBQUUsTUFDbEIifQ== */");
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
				add_location(a, file$3, 170, 8, 4072);
				add_location(div0, file$3, 169, 6, 4058);
				attr_dev(div1, "class", "rssbox-date svelte-1rjx8bp");
				add_location(div1, file$3, 174, 6, 4202);
				attr_dev(div2, "class", "rssbox-titlebar svelte-1rjx8bp");
				set_style(div2, "color", /*$config*/ ctx[2].titleBarTextColor);
				set_style(div2, "background-color", /*$config*/ ctx[2].titleBarColor);
				set_style(div2, "border-bottom-color", /*$config*/ ctx[2].frameColor);
				add_location(div2, file$3, 161, 4, 3624);
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
				add_location(a, file$3, 164, 10, 3870);
				attr_dev(div, "class", "rssbox-icon svelte-1rjx8bp");
				add_location(div, file$3, 163, 8, 3834);
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
				add_location(div, file$3, 184, 10, 4590);
				attr_dev(a, "href", a_href_value = /*$feed*/ ctx[6].image.link);
				attr_dev(a, "title", a_title_value = /*$feed*/ ctx[6].image.title);
				attr_dev(a, "class", "svelte-1rjx8bp");
				add_location(a, file$3, 183, 8, 4518);
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
				add_location(div, file$3, 191, 8, 4893);
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
				add_location(div, file$3, 193, 12, 5023);
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
	function create_else_block_1$1(ctx) {
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
				add_location(a, file$3, 195, 16, 5122);
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
				add_location(aside, file$3, 205, 12, 5373);
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
		const if_block_creators = [create_if_block_5, create_else_block$2];
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
				add_location(a, file$3, 207, 16, 5431);
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
				add_location(a, file$3, 218, 18, 5845);
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
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
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
				add_location(input, file$3, 232, 8, 6288);
				attr_dev(form, "class", "rssbox-form svelte-1rjx8bp");
				attr_dev(form, "method", "get");
				attr_dev(form, "action", form_action_value = /*$feed*/ ctx[6].input.link);
				add_location(form, file$3, 231, 6, 6210);
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
		let each_value = ensure_array_like_dev(/*$feed*/ ctx[6].items);
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
				add_location(a, file$3, 236, 6, 6503);
				attr_dev(div0, "class", "rssbox-promo rssBoxPromo svelte-1rjx8bp");
				add_location(div0, file$3, 235, 4, 6458);
				attr_dev(div1, "class", "rssbox-content rssBoxContent svelte-1rjx8bp");
				set_style(div1, "background-color", /*$config*/ ctx[2].boxFillColor);
				set_style(div1, "height", /*height*/ ctx[5]);
				add_location(div1, file$3, 180, 2, 4305);
				attr_dev(div2, "data-link-color", div2_data_link_color_value = /*$config*/ ctx[2].linkColor);
				attr_dev(div2, "class", "rssbox rssBox svelte-1rjx8bp");
				set_style(div2, "max-width", /*width*/ ctx[4]);
				set_style(div2, "border-color", /*$config*/ ctx[2].frameColor);
				set_style(div2, "border-radius", /*$config*/ ctx[2].radius + "px");
				set_style(div2, "font", /*$config*/ ctx[2].fontFace);
				set_style(div2, "float", /*$config*/ ctx[2].align);
				add_location(div2, file$3, 159, 0, 3365);
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
			init(this, options, instance$3, create_fragment$3, safe_not_equal, { feed: 0, config: 1 }, add_css$3);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Box",
				options,
				id: create_fragment$3.name
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

	/* src/lib/Referrers.svelte generated by Svelte v4.1.1 */
	const file$2 = "src/lib/Referrers.svelte";

	function add_css$2(target) {
		append_styles(target, "svelte-oo3062", "details.svelte-oo3062{line-height:1.2em}code.svelte-oo3062{margin-right:0.3em;color:#bbb;font-size:0.7em;white-space:pre}summary.svelte-oo3062{outline:none}.referrer.svelte-oo3062{white-space:nowrap}.feedLink.svelte-oo3062{position:relative;top:2px;color:#ffa600}.feedLink[disabled].svelte-oo3062{pointer-events:none}.feedLink.svelte-oo3062 svg{pointer-events:none}.feedLink[disabled].svelte-oo3062 svg{color:#ddd}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVmZXJyZXJzLnN2ZWx0ZSIsInNvdXJjZXMiOlsiUmVmZXJyZXJzLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSBcInN2ZWx0ZVwiO1xuICBpbXBvcnQgeyByZWZlcnJlcnMgfSBmcm9tIFwiLi4vc3RvcmVzXCI7XG5cbiAgaW1wb3J0IFJzc0ljb24gZnJvbSBcIi4vUnNzSWNvbi5zdmVsdGVcIjtcblxuICAvLyBTdG9yZXMgY29taW5nIGluIHZpYSBwcm9wc1xuICBleHBvcnQgbGV0IGNvbmZpZztcblxuICBvbk1vdW50KCgpID0+IHtcbiAgICBpZiAoXCJvcGVuXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRldGFpbHNcIikgPT09IGZhbHNlKSB7XG4gICAgICBsb2FkKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBmb3JtYXQoZmxvYXQpIHtcbiAgICBpZiAoZmxvYXQgPCAwLjAxKSByZXR1cm4gXCI8IDAuMDFcIjtcbiAgICByZXR1cm4gZmxvYXQudG9GaXhlZCgyKS5wYWRTdGFydCg2KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgcmVmZXJyZXJzLmZldGNoKCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVGZWVkTGluayhldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBjb25zdCByZWZlcnJlciA9ICRyZWZlcnJlcnNbZXZlbnQudGFyZ2V0LmRhdGFzZXQuaW5kZXhdO1xuICAgIGNvbnN0IGRhdGEgPSByZWZlcnJlci5tZXRhZGF0YTtcblxuICAgIGlmICghZGF0YSB8fCAhZGF0YS5mZWVkVXJscykgcmV0dXJuO1xuXG4gICAgbGV0IGZlZWRVcmwgPSBldmVudC50YXJnZXQuaHJlZjtcbiAgICBsZXQgaW5kZXggPSBkYXRhLmZlZWRVcmxzLmluZGV4T2YoZmVlZFVybCkgKyAxO1xuXG4gICAgaWYgKGluZGV4ID49IGRhdGEuZmVlZFVybHMubGVuZ3RoKSBpbmRleCA9IDA7XG5cbiAgICBmZWVkVXJsID0gZGF0YS5mZWVkVXJsc1tpbmRleF07XG5cbiAgICBpZiAoZXZlbnQudGFyZ2V0LmhyZWYgPT09IGZlZWRVcmwpIHJldHVybjtcblxuICAgIGV2ZW50LnRhcmdldC5ocmVmID0gZmVlZFVybDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrRmVlZExpbmsoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkpIHtcbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggdGhlIGZlZWRVcmxzIGFycmF5IHRvIGFsbG93IGFjY2Vzc2luZyBtdWx0aXBsZSBmZWVkIHVybHMgdmlhIG9uZSBpY29uXG4gICAgICB1cGRhdGVGZWVkTGluayhldmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgY29uZmlnIHN0b3JlIHdpdGggdGhlIGZlZWQgdXJsIHRvIGxvYWQgdGhlIGNvcnJlc3BvbmRpbmcgcnNzIGJveFxuICAgICAgJGNvbmZpZy51cmwgPSBldmVudC50YXJnZXQuaHJlZjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRGZWVkTGlua0Rpc2FibGVkU3RhdGUoaW5kZXgpIHtcbiAgICBjb25zdCByZWZlcnJlciA9ICRyZWZlcnJlcnNbaW5kZXhdO1xuICAgIGNvbnN0IGRhdGEgPSByZWZlcnJlci5tZXRhZGF0YTtcblxuICAgIGlmICghZGF0YSB8fCAhZGF0YS5mZWVkVXJscykgcmV0dXJuIFwiZGlzYWJsZWRcIjtcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgZGV0YWlscyB7XG4gICAgbGluZS1oZWlnaHQ6IDEuMmVtO1xuICB9XG5cbiAgY29kZSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAwLjNlbTtcbiAgICBjb2xvcjogI2JiYjtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gIH1cblxuICBzdW1tYXJ5IHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG5cbiAgLnJlZmVycmVyIHtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLmZlZWRMaW5rIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgdG9wOiAycHg7XG4gICAgY29sb3I6ICNmZmE2MDA7XG4gIH1cblxuICAuZmVlZExpbmtbZGlzYWJsZWRdIHtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuXG4gIC5mZWVkTGluayA6Z2xvYmFsKHN2Zykge1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB9XG5cbiAgLmZlZWRMaW5rW2Rpc2FibGVkXSA6Z2xvYmFsKHN2Zykge1xuICAgIGNvbG9yOiAjZGRkO1xuICB9XG48L3N0eWxlPlxuXG48ZGV0YWlscyBpZD1cInJlZmVycmVyc1wiIG9uOnRvZ2dsZT17IGxvYWQgfT5cbiAgPHN1bW1hcnk+PC9zdW1tYXJ5PlxuICB7ICNpZiAkcmVmZXJyZXJzLmxlbmd0aCB9XG4gICAgeyAjZWFjaCAkcmVmZXJyZXJzIGFzIHJlZmVycmVyLCBpbmRleCB9XG4gICAgICA8ZGl2IGNsYXNzPSdyZWZlcnJlcic+XG4gICAgICAgIDxjb2RlPnsgZm9ybWF0KHJlZmVycmVyLnBlcmNlbnRhZ2UpIH08L2NvZGU+XG4gICAgICAgIDwhLS0gc3ZlbHRlLWlnbm9yZSBhMTF5LW1vdXNlLWV2ZW50cy1oYXZlLWtleS1ldmVudHMgLS0+XG4gICAgICAgIDxhIGhyZWY9Jy4nXG4gICAgICAgICAgICBjbGFzcz0nZmVlZExpbmsnXG4gICAgICAgICAgICBkaXNhYmxlZD17IGdldEZlZWRMaW5rRGlzYWJsZWRTdGF0ZShpbmRleCkgfVxuICAgICAgICAgICAgZGF0YS1pbmRleD17IGluZGV4IH1cbiAgICAgICAgICAgIG9uOm1vdXNlb3ZlcnxvbmNlPXsgdXBkYXRlRmVlZExpbmsgfVxuICAgICAgICAgICAgb246Y2xpY2s9eyBjbGlja0ZlZWRMaW5rIH0+XG4gICAgICAgICAgPFJzc0ljb24vPlxuICAgICAgICA8L2E+XG4gICAgICAgIDxhIGhyZWY9J3sgcmVmZXJyZXIudXJsIH0nPnsgcmVmZXJyZXIuaG9zdCB9PC9hPlxuICAgICAgPC9kaXY+XG4gICAgeyAvZWFjaCB9XG4gIHsgOmVsc2UgfVxuICAgIExvYWRpbmfigKZcbiAgeyAvaWYgfVxuPC9kZXRhaWxzPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWlFRSxxQkFBUSxDQUNOLFdBQVcsQ0FBRSxLQUNmLENBRUEsa0JBQUssQ0FDSCxZQUFZLENBQUUsS0FBSyxDQUNuQixLQUFLLENBQUUsSUFBSSxDQUNYLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUNmLENBRUEscUJBQVEsQ0FDTixPQUFPLENBQUUsSUFDWCxDQUVBLHVCQUFVLENBQ1IsV0FBVyxDQUFFLE1BQ2YsQ0FFQSx1QkFBVSxDQUNSLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxHQUFHLENBQ1IsS0FBSyxDQUFFLE9BQ1QsQ0FFQSxTQUFTLENBQUMsUUFBUSxlQUFFLENBQ2xCLGNBQWMsQ0FBRSxJQUNsQixDQUVBLHVCQUFTLENBQVMsR0FBSyxDQUNyQixjQUFjLENBQUUsSUFDbEIsQ0FFQSxTQUFTLENBQUMsUUFBUSxlQUFDLENBQVMsR0FBSyxDQUMvQixLQUFLLENBQUUsSUFDVCJ9 */");
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
				if (detaching) {
					detach_dev(t);
				}
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
		let each_value = ensure_array_like_dev(/*$referrers*/ ctx[1]);
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
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*$referrers, getFeedLinkDisabledState, updateFeedLink, clickFeedLink, format*/ 58) {
					each_value = ensure_array_like_dev(/*$referrers*/ ctx[1]);
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
				if (detaching) {
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
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
				add_location(code, file$2, 108, 8, 2131);
				attr_dev(a0, "href", ".");
				attr_dev(a0, "class", "feedLink svelte-oo3062");
				attr_dev(a0, "disabled", /*getFeedLinkDisabledState*/ ctx[5](/*index*/ ctx[9]));
				attr_dev(a0, "data-index", /*index*/ ctx[9]);
				add_location(a0, file$2, 110, 8, 2249);
				attr_dev(a1, "href", a1_href_value = /*referrer*/ ctx[7].url);
				add_location(a1, file$2, 118, 8, 2511);
				attr_dev(div, "class", "referrer svelte-oo3062");
				add_location(div, file$2, 107, 6, 2100);
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
						listen_dev(a0, "mouseover", /*updateFeedLink*/ ctx[3], { once: true }, false, false, false),
						listen_dev(a0, "click", /*clickFeedLink*/ ctx[4], false, false, false, false)
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
				if (detaching) {
					detach_dev(div);
				}

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
				add_location(summary, file$2, 104, 2, 2002);
				attr_dev(details, "id", "referrers");
				attr_dev(details, "class", "svelte-oo3062");
				add_location(details, file$2, 103, 0, 1956);
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
					dispose = listen_dev(details, "toggle", /*load*/ ctx[2], false, false, false, false);
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
				if (detaching) {
					detach_dev(details);
				}

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

		$$self.$$.on_mount.push(function () {
			if (config === undefined && !('config' in $$props || $$self.$$.bound[$$self.$$.props['config']])) {
				console.warn("<Referrers> was created without expected prop 'config'");
			}
		});

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
		}

		get config() {
			throw new Error("<Referrers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set config(value) {
			throw new Error("<Referrers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/lib/Configurator.svelte generated by Svelte v4.1.1 */

	const { Object: Object_1 } = globals;
	const file$1 = "src/lib/Configurator.svelte";

	function add_css$1(target) {
		append_styles(target, "svelte-uicuex", "table.svelte-uicuex.svelte-uicuex{overflow:auto}tr.svelte-uicuex td.svelte-uicuex:first-child{color:#bbb;text-align:right;white-space:nowrap}summary.svelte-uicuex.svelte-uicuex{outline:none}button.svelte-uicuex.svelte-uicuex{width:7em;height:2.5em;padding:initial;box-sizing:border-box}.top.svelte-uicuex.svelte-uicuex{vertical-align:top}.source.svelte-uicuex.svelte-uicuex{line-height:1em}[name=url].svelte-uicuex.svelte-uicuex,[name=fontFace].svelte-uicuex.svelte-uicuex,[name=code].svelte-uicuex.svelte-uicuex{width:90%;height:2.5em;box-sizing:border-box}[type=color].svelte-uicuex.svelte-uicuex,[type=number].svelte-uicuex.svelte-uicuex{width:7em;height:2.5em;box-sizing:border-box}input[type='color'].svelte-uicuex.svelte-uicuex{padding:3px}[name=code].svelte-uicuex.svelte-uicuex{color:#bbb;height:10em;overflow:hidden;resize:vertical}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlndXJhdG9yLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQ29uZmlndXJhdG9yLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyJcbjxzY3JpcHQ+XG4gIGltcG9ydCB7IHVybHMgfSBmcm9tIFwiLi4vdXJsc1wiO1xuXG4gIGltcG9ydCBSZWZlcnJlcnMgZnJvbSBcIi4vUmVmZXJyZXJzLnN2ZWx0ZVwiO1xuXG4gIC8vIFN0b3JlcyBjb21pbmcgaW4gdmlhIHByb3BzXG4gIGV4cG9ydCBsZXQgZmVlZDtcbiAgZXhwb3J0IGxldCBjb25maWc7XG5cbiAgZnVuY3Rpb24gdmFsaWRhdGUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghZXZlbnQudGFyZ2V0LmNoZWNrVmFsaWRpdHkoKSkgZXZlbnQudGFyZ2V0LnJlcG9ydFZhbGlkaXR5KCk7XG4gIH1cblxuICBmdW5jdGlvbiByZWxvYWQoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vIFRoZSBhcHDigJlzIHN1YmNyaXB0aW9uIG9ubHkgdHJpZ2dlcnMgYSBmZXRjaCB3aGVuIHRoZSB1cmwgaGFzIGNoYW5nZWRcbiAgICBjb25maWcuc2V0KHsgdXJsOiBudWxsIH0pO1xuICAgIGNvbmZpZy5zZXQoeyB1cmw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFtuYW1lPVxcXCJ1cmxcXFwiXVwiKS52YWx1ZSB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHkoZXZlbnQpIHtcbiAgICB0cnkge1xuICAgICAgZXZlbnQudGFyZ2V0LnNlbGVjdCgpO1xuICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJjb3B5XCIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB2b2lkIGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGFiZWwoZXZlbnQpIHtcbiAgICBjb25zdCBzaWJsaW5nID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIGxldCBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3RvcihcImlucHV0XCIpO1xuICAgIGlmICghaW5wdXQpIGlucHV0ID0gc2libGluZy5xdWVyeVNlbGVjdG9yKFwic3VtbWFyeVwiKTtcbiAgICBpZiAoIWlucHV0KSBpbnB1dCA9IHNpYmxpbmcucXVlcnlTZWxlY3RvcihcInRleHRhcmVhXCIpO1xuICAgIGlmICghaW5wdXQpIHJldHVybjtcbiAgICBpZiAoaW5wdXQuY2xpY2spIGlucHV0LmNsaWNrKCk7XG4gICAgaWYgKGlucHV0LnNlbGVjdCkgaW5wdXQuc2VsZWN0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRRdWVyeSgpIHtcbiAgICBjb25zdCBxdWVyeSA9IFtdO1xuXG4gICAgT2JqZWN0LmtleXMoJGNvbmZpZykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJGNvbmZpZ1trZXldO1xuICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHZhbHVlID0gXCJcIjtcbiAgICAgIHF1ZXJ5LnB1c2goa2V5ICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBxdWVyeS5qb2luKFwiJlwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvZGUoKSB7XG4gICAgY29uc3QgcXVlcnkgPSBnZXRRdWVyeSgpLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKTtcbiAgICAvLyBOZWVkIHRvIGJlIGNhcmVmdWwgd2l0aCB0aGUgc2NyaXB0LWVuZC10YWcgdG8gcHJldmVudCB0ZW1wbGF0ZSBlcnJvclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8zODQwXG4gICAgcmV0dXJuIGA8c2NyaXB0IGFzeW5jIGRlZmVyIHNyYz0nJHsgdXJscy5hcHAgfS9tYWluLmpzPyR7IHF1ZXJ5IH0nPiR7IFwiPFwiIH0vc2NyaXB0PmA7XG4gIH1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIHRhYmxlIHtcbiAgICBvdmVyZmxvdzogYXV0bztcbiAgfVxuXG4gIHRyIHRkOmZpcnN0LWNoaWxkIHtcbiAgICBjb2xvcjogI2JiYjtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgc3VtbWFyeSB7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIGJ1dHRvbiB7XG4gICAgd2lkdGg6IDdlbTtcbiAgICBoZWlnaHQ6IDIuNWVtO1xuICAgIHBhZGRpbmc6IGluaXRpYWw7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgfVxuXG4gIC50b3Age1xuICAgIHZlcnRpY2FsLWFsaWduOiB0b3A7XG4gIH1cblxuICAuc291cmNlIHtcbiAgICBsaW5lLWhlaWdodDogMWVtO1xuICB9XG5cbiAgW25hbWU9dXJsXSwgW25hbWU9Zm9udEZhY2VdLCBbbmFtZT1jb2RlXSB7XG4gICAgd2lkdGg6IDkwJTtcbiAgICBoZWlnaHQ6IDIuNWVtO1xuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIH1cblxuICBbdHlwZT1jb2xvcl0sIFt0eXBlPW51bWJlcl0ge1xuICAgIHdpZHRoOiA3ZW07XG4gICAgaGVpZ2h0OiAyLjVlbTtcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICB9XG5cbiAgaW5wdXRbdHlwZT0nY29sb3InXSB7XG4gICAgcGFkZGluZzogM3B4O1xuICB9XG5cbiAgW25hbWU9Y29kZV0ge1xuICAgIGNvbG9yOiAjYmJiO1xuICAgIGhlaWdodDogMTBlbTtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHJlc2l6ZTogdmVydGljYWw7XG4gIH1cbjwvc3R5bGU+XG5cbjxmb3JtPlxuICA8dGFibGUgY2xhc3M9J3RhYmxlJz5cbiAgICA8Y29sZ3JvdXA+XG4gICAgICA8Y29sIHdpZHRoPScqJz5cbiAgICAgIDxjb2wgd2lkdGg9JzkwJSc+XG4gICAgPC9jb2xncm91cD5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3VybCc+RmVlZCBVUkw8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J3VybCcgdmFsdWU9eyAkY29uZmlnLnVybCB9IGlkPSd1cmwnIG5hbWU9J3VybCcgcmVxdWlyZWQgb246Y2hhbmdlPXsgcmVsb2FkIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlRpdGxlPC90ZD5cbiAgICAgIDx0ZD57ICRmZWVkLnRpdGxlIH08L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkIGNsYXNzPSd0b3AnPlxuICAgICAgICA8bGFiZWwgZm9yPSdkZXNjcmlwdGlvbicgb246Y2xpY2s9eyBjbGlja0xhYmVsIH0+RGVzY3JpcHRpb248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGRldGFpbHMgaWQ9J2Rlc2NyaXB0aW9uJz5cbiAgICAgICAgICA8c3VtbWFyeT48L3N1bW1hcnk+XG4gICAgICAgICAgeyAkZmVlZC5kZXNjcmlwdGlvbiB9XG4gICAgICAgIDwvZGV0YWlscz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+TGFzdCBidWlsZDwvdGQ+XG4gICAgICA8dGQ+eyBmZWVkLmZvcm1hdERhdGUoJGZlZWQuZGF0ZSkgfTwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+U291cmNlPC90ZD5cbiAgICAgIDx0ZCBjbGFzcz0nc291cmNlJz5cbiAgICAgICAgeyAjaWYgJGZlZWQubG9hZGluZyB9XG4gICAgICAgICAgTG9hZGluZy4uLlxuICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICA8YSBocmVmPSd7ICRjb25maWcudXJsIH0nPnsgJGZlZWQuZm9ybWF0IH0geyAkZmVlZC52ZXJzaW9uIH08L2E+XG4gICAgICAgIHsgL2lmIH1cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J21heEl0ZW1zJz5NYXguIGl0ZW1zPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIGlkPSdtYXhJdGVtcycgbmFtZT0nbWF4SXRlbXMnIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5tYXhJdGVtcyB9JyBtaW49MSBtYXg9OTkgcmVxdWlyZWQgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3dpZHRoJz5NYXguIHdpZHRoPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIGlkPSd3aWR0aCcgbmFtZT0nd2lkdGgnIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy53aWR0aCB9JyBtaW49MTAwIG1heD05OTk5IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0gcGxhY2Vob2xkZXI9J3NwYXJlJz5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J2hlaWdodCc+Q29udGVudCBoZWlnaHQ8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J251bWJlcicgaWQ9J2hlaWdodCcgbmFtZT0naGVpZ2h0JyBiaW5kOnZhbHVlPSd7ICRjb25maWcuaGVpZ2h0IH0nIG1pbj0xMDAgbWF4PTk5OTkgb246Y2hhbmdlPXsgdmFsaWRhdGUgfSBwbGFjZWhvbGRlcj0nc3BhcmUnPlxuICAgICAgICA8c21hbGw+cHg8L3NtYWxsPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0ncmFkaXVzJz5Db3JuZXIgcmFkaXVzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdudW1iZXInIGlkPSdyYWRpdXMnIG5hbWU9J3JhZGl1cycgYmluZDp2YWx1ZT0neyAkY29uZmlnLnJhZGl1cyB9JyBtaW49MCBtYXg9MjAgcmVxdWlyZWQgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgICAgPHNtYWxsPnB4PC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3Nob3dYbWxCdXR0b24nPlJTUyBidXR0b248L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NoZWNrYm94JyBpZD0nc2hvd1htbEJ1dHRvbicgbmFtZT0nc2hvd1htbEJ1dHRvbicgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLnNob3dYbWxCdXR0b24gfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J2NvbXBhY3QnPkNvbXBhY3QgdmlldzwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdjb21wYWN0JyBuYW1lPSdjb21wYWN0JyB2YWx1ZT0nMScgYmluZDpjaGVja2VkPSd7ICRjb25maWcuY29tcGFjdCB9JyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0naGVhZGxlc3MnPkhlYWRsZXNzPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2hlYWRsZXNzJyBuYW1lPSdoZWFkbGVzcycgdmFsdWU9JzEnIGJpbmQ6Y2hlY2tlZD0neyAkY29uZmlnLmhlYWRsZXNzIH0nIG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSdmcmFtZUNvbG9yJz5GcmFtZSBjb2xvcjwvbGFiZWw+XG4gICAgICA8L3RkPlxuICAgICAgPHRkPlxuICAgICAgICA8aW5wdXQgdHlwZT0nY29sb3InIGlkPSdmcmFtZUNvbG9yJyBuYW1lPSdmcmFtZUNvbG9yJyBiaW5kOnZhbHVlPSd7ICRjb25maWcuZnJhbWVDb2xvciB9JyBzaXplPTYgbWF4bGVuZ3RoPTcgb246Y2hhbmdlPXsgdmFsaWRhdGUgfT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG4gICAgICAgIDxsYWJlbCBmb3I9J3RpdGxlQmFyQ29sb3InPlRpdGxlYmFyIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgaWQ9J3RpdGxlQmFyQ29sb3InIG5hbWU9J3RpdGxlQmFyQ29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy50aXRsZUJhckNvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0ndGl0bGVCYXJUZXh0Q29sb3InPlRpdGxlIGNvbG9yPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCB0eXBlPSdjb2xvcicgaWQ9J3RpdGxlQmFyVGV4dENvbG9yJyBuYW1lPSd0aXRsZUJhclRleHRDb2xvcicgYmluZDp2YWx1ZT0neyAkY29uZmlnLnRpdGxlQmFyVGV4dENvbG9yIH0nIHNpemU9NiBtYXhsZW5ndGg9NyBvbjpjaGFuZ2U9eyB2YWxpZGF0ZSB9PlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0nYm94RmlsbENvbG9yJz5Cb3ggY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBpZD0nYm94RmlsbENvbG9yJyBuYW1lPSdib3hGaWxsQ29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5ib3hGaWxsQ29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSd0ZXh0Q29sb3InPlRleHQgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBpZD0ndGV4dENvbG9yJyBuYW1lPSd0ZXh0Q29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy50ZXh0Q29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSdsaW5rQ29sb3InPkxpbmsgY29sb3I8L2xhYmVsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGlucHV0IHR5cGU9J2NvbG9yJyBpZD0nbGlua0NvbG9yJyBuYW1lPSdsaW5rQ29sb3InIGJpbmQ6dmFsdWU9J3sgJGNvbmZpZy5saW5rQ29sb3IgfScgc2l6ZT02IG1heGxlbmd0aD03IG9uOmNoYW5nZT17IHZhbGlkYXRlIH0+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyPlxuICAgICAgPHRkPlxuICAgICAgICA8bGFiZWwgZm9yPSdmb250RmFjZSc+Rm9udCBmYWNlPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxpbnB1dCBpZD0nZm9udEZhY2UnIG5hbWU9J2ZvbnRGYWNlJyBiaW5kOnZhbHVlPSd7ICRjb25maWcuZm9udEZhY2UgfScgb246Y2hhbmdlPXsgdmFsaWRhdGUgfSBwYXR0ZXJuPSdbXFxkLl0rKD86cHR8cHh8ZW18JSkrXFxzK1tcXHNcXHdcXC0sXSsnIHBsYWNlaG9sZGVyPSdlLmcuIDEwcHQgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJz5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQ+PC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgeyAjaWYgJGZlZWQubG9hZGluZyB9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz0nYnRuIGJ0bi1zbSBidG4tYycgZGlzYWJsZWQ+TG9hZGluZy4uLjwvYnV0dG9uPlxuICAgICAgICB7IDplbHNlIH1cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPSdidG4gYnRuLXNtIGJ0bi1iJyBvbjpjbGljaz17IHJlbG9hZCB9PlJlbG9hZDwvYnV0dG9uPlxuICAgICAgICB7IC9pZiB9XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICAgPHRyIHN0eWxlPSd2ZXJ0aWNhbC1hbGlnbjogdG9wJz5cbiAgICAgIDx0ZD5cbiAgICAgICAgPGxhYmVsIGZvcj0nY29kZSc+XG4gICAgICAgICAgSFRNTCBjb2RlPGJyPlxuICAgICAgICAgIChjb3B5JmFtcDtwYXN0YSlcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDx0ZXh0YXJlYSBpZD0nY29kZScgbmFtZT0nY29kZScgY29scz0nMTAnIHJvd3M9JzMnIHJlYWRvbmx5IG9uOmNsaWNrPXsgY29weSB9PnsgY29kZSgkY29uZmlnKSB9PC90ZXh0YXJlYT5cbiAgICAgIDwvdGQ+XG4gICAgPC90cj5cbiAgICA8dHI+XG4gICAgICA8dGQgY2xhc3M9J3RvcCc+XG4gICAgICAgIDxsYWJlbCBmb3I9J3JlZmVycmVycycgb246Y2xpY2s9eyBjbGlja0xhYmVsIH0gdGl0bGU9J3NpbmNlIG1pZG5pZ2h0IChHTVQpJz5cbiAgICAgICAgICBSZWZlcnJlcnNcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQgY2xhc3M9J3RvcCc+XG4gICAgICAgIDxSZWZlcnJlcnMgeyBjb25maWcgfS8+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gIDwvdGFibGU+XG48L2Zvcm0+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBOERFLGlDQUFNLENBQ0osUUFBUSxDQUFFLElBQ1osQ0FFQSxnQkFBRSxDQUFDLGdCQUFFLFlBQWEsQ0FDaEIsS0FBSyxDQUFFLElBQUksQ0FDWCxVQUFVLENBQUUsS0FBSyxDQUNqQixXQUFXLENBQUUsTUFDZixDQUVBLG1DQUFRLENBQ04sT0FBTyxDQUFFLElBQ1gsQ0FFQSxrQ0FBTyxDQUNMLEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEtBQUssQ0FDYixPQUFPLENBQUUsT0FBTyxDQUNoQixVQUFVLENBQUUsVUFDZCxDQUVBLGdDQUFLLENBQ0gsY0FBYyxDQUFFLEdBQ2xCLENBRUEsbUNBQVEsQ0FDTixXQUFXLENBQUUsR0FDZixDQUVBLENBQUMsSUFBSSxDQUFDLEdBQUcsNkJBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxRQUFRLDZCQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSw2QkFBRSxDQUN2QyxLQUFLLENBQUUsR0FBRyxDQUNWLE1BQU0sQ0FBRSxLQUFLLENBQ2IsVUFBVSxDQUFFLFVBQ2QsQ0FFQSxDQUFDLElBQUksQ0FBQyxLQUFLLDZCQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSw2QkFBRSxDQUMxQixLQUFLLENBQUUsR0FBRyxDQUNWLE1BQU0sQ0FBRSxLQUFLLENBQ2IsVUFBVSxDQUFFLFVBQ2QsQ0FFQSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sNkJBQUUsQ0FDbEIsT0FBTyxDQUFFLEdBQ1gsQ0FFQSxDQUFDLElBQUksQ0FBQyxJQUFJLDZCQUFFLENBQ1YsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxDQUNaLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLE1BQU0sQ0FBRSxRQUNWIn0= */");
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
				add_location(a, file$1, 154, 10, 3251);
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
				if (detaching) {
					detach_dev(a);
				}
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
				if (detaching) {
					detach_dev(t);
				}
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
				add_location(button, file$1, 279, 10, 7264);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*reload*/ ctx[4], false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

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
				add_location(button, file$1, 277, 10, 7174);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}
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
				add_location(col0, file$1, 118, 6, 2420);
				attr_dev(col1, "width", "90%");
				add_location(col1, file$1, 119, 6, 2442);
				add_location(colgroup, file$1, 117, 4, 2403);
				attr_dev(label0, "for", "url");
				add_location(label0, file$1, 123, 8, 2504);
				attr_dev(td0, "class", "svelte-uicuex");
				add_location(td0, file$1, 122, 6, 2491);
				attr_dev(input0, "type", "url");
				input0.value = input0_value_value = /*$config*/ ctx[2].url;
				attr_dev(input0, "id", "url");
				attr_dev(input0, "name", "url");
				input0.required = true;
				attr_dev(input0, "class", "svelte-uicuex");
				add_location(input0, file$1, 126, 8, 2569);
				attr_dev(td1, "class", "svelte-uicuex");
				add_location(td1, file$1, 125, 6, 2556);
				attr_dev(tr0, "class", "svelte-uicuex");
				add_location(tr0, file$1, 121, 4, 2480);
				attr_dev(td2, "class", "svelte-uicuex");
				add_location(td2, file$1, 130, 6, 2697);
				attr_dev(td3, "class", "svelte-uicuex");
				add_location(td3, file$1, 131, 6, 2718);
				attr_dev(tr1, "class", "svelte-uicuex");
				add_location(tr1, file$1, 129, 4, 2686);
				attr_dev(label1, "for", "description");
				add_location(label1, file$1, 135, 8, 2793);
				attr_dev(td4, "class", "top svelte-uicuex");
				add_location(td4, file$1, 134, 6, 2768);
				attr_dev(summary, "class", "svelte-uicuex");
				add_location(summary, file$1, 139, 10, 2930);
				attr_dev(details, "id", "description");
				add_location(details, file$1, 138, 8, 2893);
				attr_dev(td5, "class", "svelte-uicuex");
				add_location(td5, file$1, 137, 6, 2880);
				attr_dev(tr2, "class", "svelte-uicuex");
				add_location(tr2, file$1, 133, 4, 2757);
				attr_dev(td6, "class", "svelte-uicuex");
				add_location(td6, file$1, 145, 6, 3038);
				attr_dev(td7, "class", "svelte-uicuex");
				add_location(td7, file$1, 146, 6, 3064);
				attr_dev(tr3, "class", "svelte-uicuex");
				add_location(tr3, file$1, 144, 4, 3027);
				attr_dev(td8, "class", "svelte-uicuex");
				add_location(td8, file$1, 149, 6, 3130);
				attr_dev(td9, "class", "source svelte-uicuex");
				add_location(td9, file$1, 150, 6, 3152);
				attr_dev(tr4, "class", "svelte-uicuex");
				add_location(tr4, file$1, 148, 4, 3119);
				attr_dev(label2, "for", "maxItems");
				add_location(label2, file$1, 160, 8, 3382);
				attr_dev(td10, "class", "svelte-uicuex");
				add_location(td10, file$1, 159, 6, 3369);
				attr_dev(input1, "type", "number");
				attr_dev(input1, "id", "maxItems");
				attr_dev(input1, "name", "maxItems");
				attr_dev(input1, "min", "1");
				attr_dev(input1, "max", "99");
				input1.required = true;
				attr_dev(input1, "class", "svelte-uicuex");
				add_location(input1, file$1, 163, 8, 3454);
				attr_dev(td11, "class", "svelte-uicuex");
				add_location(td11, file$1, 162, 6, 3441);
				attr_dev(tr5, "class", "svelte-uicuex");
				add_location(tr5, file$1, 158, 4, 3358);
				attr_dev(label3, "for", "width");
				add_location(label3, file$1, 168, 8, 3635);
				attr_dev(td12, "class", "svelte-uicuex");
				add_location(td12, file$1, 167, 6, 3622);
				attr_dev(input2, "type", "number");
				attr_dev(input2, "id", "width");
				attr_dev(input2, "name", "width");
				attr_dev(input2, "min", "100");
				attr_dev(input2, "max", "9999");
				attr_dev(input2, "placeholder", "spare");
				attr_dev(input2, "class", "svelte-uicuex");
				add_location(input2, file$1, 171, 8, 3704);
				add_location(small0, file$1, 172, 8, 3849);
				attr_dev(td13, "class", "svelte-uicuex");
				add_location(td13, file$1, 170, 6, 3691);
				attr_dev(tr6, "class", "svelte-uicuex");
				add_location(tr6, file$1, 166, 4, 3611);
				attr_dev(label4, "for", "height");
				add_location(label4, file$1, 177, 8, 3917);
				attr_dev(td14, "class", "svelte-uicuex");
				add_location(td14, file$1, 176, 6, 3904);
				attr_dev(input3, "type", "number");
				attr_dev(input3, "id", "height");
				attr_dev(input3, "name", "height");
				attr_dev(input3, "min", "100");
				attr_dev(input3, "max", "9999");
				attr_dev(input3, "placeholder", "spare");
				attr_dev(input3, "class", "svelte-uicuex");
				add_location(input3, file$1, 180, 8, 3991);
				add_location(small1, file$1, 181, 8, 4139);
				attr_dev(td15, "class", "svelte-uicuex");
				add_location(td15, file$1, 179, 6, 3978);
				attr_dev(tr7, "class", "svelte-uicuex");
				add_location(tr7, file$1, 175, 4, 3893);
				attr_dev(label5, "for", "radius");
				add_location(label5, file$1, 186, 8, 4207);
				attr_dev(td16, "class", "svelte-uicuex");
				add_location(td16, file$1, 185, 6, 4194);
				attr_dev(input4, "type", "number");
				attr_dev(input4, "id", "radius");
				attr_dev(input4, "name", "radius");
				attr_dev(input4, "min", "0");
				attr_dev(input4, "max", "20");
				input4.required = true;
				attr_dev(input4, "class", "svelte-uicuex");
				add_location(input4, file$1, 189, 8, 4280);
				add_location(small2, file$1, 190, 8, 4413);
				attr_dev(td17, "class", "svelte-uicuex");
				add_location(td17, file$1, 188, 6, 4267);
				attr_dev(tr8, "class", "svelte-uicuex");
				add_location(tr8, file$1, 184, 4, 4183);
				attr_dev(label6, "for", "showXmlButton");
				add_location(label6, file$1, 195, 8, 4481);
				attr_dev(td18, "class", "svelte-uicuex");
				add_location(td18, file$1, 194, 6, 4468);
				attr_dev(input5, "type", "checkbox");
				attr_dev(input5, "id", "showXmlButton");
				attr_dev(input5, "name", "showXmlButton");
				input5.__value = "1";
				set_input_value(input5, input5.__value);
				add_location(input5, file$1, 198, 8, 4558);
				attr_dev(td19, "class", "svelte-uicuex");
				add_location(td19, file$1, 197, 6, 4545);
				attr_dev(tr9, "class", "svelte-uicuex");
				add_location(tr9, file$1, 193, 4, 4457);
				attr_dev(label7, "for", "compact");
				add_location(label7, file$1, 203, 8, 4746);
				attr_dev(td20, "class", "svelte-uicuex");
				add_location(td20, file$1, 202, 6, 4733);
				attr_dev(input6, "type", "checkbox");
				attr_dev(input6, "id", "compact");
				attr_dev(input6, "name", "compact");
				input6.__value = "1";
				set_input_value(input6, input6.__value);
				add_location(input6, file$1, 206, 8, 4819);
				attr_dev(td21, "class", "svelte-uicuex");
				add_location(td21, file$1, 205, 6, 4806);
				attr_dev(tr10, "class", "svelte-uicuex");
				add_location(tr10, file$1, 201, 4, 4722);
				attr_dev(label8, "for", "headless");
				add_location(label8, file$1, 211, 8, 4989);
				attr_dev(td22, "class", "svelte-uicuex");
				add_location(td22, file$1, 210, 6, 4976);
				attr_dev(input7, "type", "checkbox");
				attr_dev(input7, "id", "headless");
				attr_dev(input7, "name", "headless");
				input7.__value = "1";
				set_input_value(input7, input7.__value);
				add_location(input7, file$1, 214, 8, 5059);
				attr_dev(td23, "class", "svelte-uicuex");
				add_location(td23, file$1, 213, 6, 5046);
				attr_dev(tr11, "class", "svelte-uicuex");
				add_location(tr11, file$1, 209, 4, 4965);
				attr_dev(label9, "for", "frameColor");
				add_location(label9, file$1, 219, 8, 5232);
				attr_dev(td24, "class", "svelte-uicuex");
				add_location(td24, file$1, 218, 6, 5219);
				attr_dev(input8, "type", "color");
				attr_dev(input8, "id", "frameColor");
				attr_dev(input8, "name", "frameColor");
				attr_dev(input8, "size", "6");
				attr_dev(input8, "maxlength", "7");
				attr_dev(input8, "class", "svelte-uicuex");
				add_location(input8, file$1, 222, 8, 5307);
				attr_dev(td25, "class", "svelte-uicuex");
				add_location(td25, file$1, 221, 6, 5294);
				attr_dev(tr12, "class", "svelte-uicuex");
				add_location(tr12, file$1, 217, 4, 5208);
				attr_dev(label10, "for", "titleBarColor");
				add_location(label10, file$1, 227, 8, 5490);
				attr_dev(td26, "class", "svelte-uicuex");
				add_location(td26, file$1, 226, 6, 5477);
				attr_dev(input9, "type", "color");
				attr_dev(input9, "id", "titleBarColor");
				attr_dev(input9, "name", "titleBarColor");
				attr_dev(input9, "size", "6");
				attr_dev(input9, "maxlength", "7");
				attr_dev(input9, "class", "svelte-uicuex");
				add_location(input9, file$1, 230, 8, 5571);
				attr_dev(td27, "class", "svelte-uicuex");
				add_location(td27, file$1, 229, 6, 5558);
				attr_dev(tr13, "class", "svelte-uicuex");
				add_location(tr13, file$1, 225, 4, 5466);
				attr_dev(label11, "for", "titleBarTextColor");
				add_location(label11, file$1, 235, 8, 5763);
				attr_dev(td28, "class", "svelte-uicuex");
				add_location(td28, file$1, 234, 6, 5750);
				attr_dev(input10, "type", "color");
				attr_dev(input10, "id", "titleBarTextColor");
				attr_dev(input10, "name", "titleBarTextColor");
				attr_dev(input10, "size", "6");
				attr_dev(input10, "maxlength", "7");
				attr_dev(input10, "class", "svelte-uicuex");
				add_location(input10, file$1, 238, 8, 5845);
				attr_dev(td29, "class", "svelte-uicuex");
				add_location(td29, file$1, 237, 6, 5832);
				attr_dev(tr14, "class", "svelte-uicuex");
				add_location(tr14, file$1, 233, 4, 5739);
				attr_dev(label12, "for", "boxFillColor");
				add_location(label12, file$1, 243, 8, 6049);
				attr_dev(td30, "class", "svelte-uicuex");
				add_location(td30, file$1, 242, 6, 6036);
				attr_dev(input11, "type", "color");
				attr_dev(input11, "id", "boxFillColor");
				attr_dev(input11, "name", "boxFillColor");
				attr_dev(input11, "size", "6");
				attr_dev(input11, "maxlength", "7");
				attr_dev(input11, "class", "svelte-uicuex");
				add_location(input11, file$1, 246, 8, 6124);
				attr_dev(td31, "class", "svelte-uicuex");
				add_location(td31, file$1, 245, 6, 6111);
				attr_dev(tr15, "class", "svelte-uicuex");
				add_location(tr15, file$1, 241, 4, 6025);
				attr_dev(label13, "for", "textColor");
				add_location(label13, file$1, 251, 8, 6313);
				attr_dev(td32, "class", "svelte-uicuex");
				add_location(td32, file$1, 250, 6, 6300);
				attr_dev(input12, "type", "color");
				attr_dev(input12, "id", "textColor");
				attr_dev(input12, "name", "textColor");
				attr_dev(input12, "size", "6");
				attr_dev(input12, "maxlength", "7");
				attr_dev(input12, "class", "svelte-uicuex");
				add_location(input12, file$1, 254, 8, 6386);
				attr_dev(td33, "class", "svelte-uicuex");
				add_location(td33, file$1, 253, 6, 6373);
				attr_dev(tr16, "class", "svelte-uicuex");
				add_location(tr16, file$1, 249, 4, 6289);
				attr_dev(label14, "for", "linkColor");
				add_location(label14, file$1, 259, 8, 6566);
				attr_dev(td34, "class", "svelte-uicuex");
				add_location(td34, file$1, 258, 6, 6553);
				attr_dev(input13, "type", "color");
				attr_dev(input13, "id", "linkColor");
				attr_dev(input13, "name", "linkColor");
				attr_dev(input13, "size", "6");
				attr_dev(input13, "maxlength", "7");
				attr_dev(input13, "class", "svelte-uicuex");
				add_location(input13, file$1, 262, 8, 6639);
				attr_dev(td35, "class", "svelte-uicuex");
				add_location(td35, file$1, 261, 6, 6626);
				attr_dev(tr17, "class", "svelte-uicuex");
				add_location(tr17, file$1, 257, 4, 6542);
				attr_dev(label15, "for", "fontFace");
				add_location(label15, file$1, 267, 8, 6819);
				attr_dev(td36, "class", "svelte-uicuex");
				add_location(td36, file$1, 266, 6, 6806);
				attr_dev(input14, "id", "fontFace");
				attr_dev(input14, "name", "fontFace");
				attr_dev(input14, "pattern", "[\\d.]+(?:pt|px|em|%)+\\s+[\\s\\w\\-,]+");
				attr_dev(input14, "placeholder", "e.g. 10pt Helvetica, sans-serif");
				attr_dev(input14, "class", "svelte-uicuex");
				add_location(input14, file$1, 270, 8, 6890);
				attr_dev(td37, "class", "svelte-uicuex");
				add_location(td37, file$1, 269, 6, 6877);
				attr_dev(tr18, "class", "svelte-uicuex");
				add_location(tr18, file$1, 265, 4, 6795);
				attr_dev(td38, "class", "svelte-uicuex");
				add_location(td38, file$1, 274, 6, 7113);
				attr_dev(td39, "class", "svelte-uicuex");
				add_location(td39, file$1, 275, 6, 7129);
				attr_dev(tr19, "class", "svelte-uicuex");
				add_location(tr19, file$1, 273, 4, 7102);
				add_location(br, file$1, 286, 19, 7465);
				attr_dev(label16, "for", "code");
				add_location(label16, file$1, 285, 8, 7427);
				attr_dev(td40, "class", "svelte-uicuex");
				add_location(td40, file$1, 284, 6, 7414);
				attr_dev(textarea, "id", "code");
				attr_dev(textarea, "name", "code");
				attr_dev(textarea, "cols", "10");
				attr_dev(textarea, "rows", "3");
				textarea.readOnly = true;
				textarea.value = textarea_value_value = /*code*/ ctx[5](/*$config*/ ctx[2]);
				attr_dev(textarea, "class", "svelte-uicuex");
				add_location(textarea, file$1, 291, 8, 7545);
				attr_dev(td41, "class", "svelte-uicuex");
				add_location(td41, file$1, 290, 6, 7532);
				set_style(tr20, "vertical-align", "top");
				attr_dev(tr20, "class", "svelte-uicuex");
				add_location(tr20, file$1, 283, 4, 7375);
				attr_dev(label17, "for", "referrers");
				attr_dev(label17, "title", "since midnight (GMT)");
				add_location(label17, file$1, 296, 8, 7714);
				attr_dev(td42, "class", "top svelte-uicuex");
				add_location(td42, file$1, 295, 6, 7689);
				attr_dev(td43, "class", "top svelte-uicuex");
				add_location(td43, file$1, 300, 6, 7846);
				attr_dev(tr21, "class", "svelte-uicuex");
				add_location(tr21, file$1, 294, 4, 7678);
				attr_dev(table, "class", "table svelte-uicuex");
				add_location(table, file$1, 116, 2, 2377);
				add_location(form, file$1, 115, 0, 2368);
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
						listen_dev(input0, "change", /*reload*/ ctx[4], false, false, false, false),
						listen_dev(label1, "click", clickLabel, false, false, false, false),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
						listen_dev(input1, "change", validate, false, false, false, false),
						listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
						listen_dev(input2, "change", validate, false, false, false, false),
						listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
						listen_dev(input3, "change", validate, false, false, false, false),
						listen_dev(input4, "input", /*input4_input_handler*/ ctx[9]),
						listen_dev(input4, "change", validate, false, false, false, false),
						listen_dev(input5, "change", /*input5_change_handler*/ ctx[10]),
						listen_dev(input5, "change", validate, false, false, false, false),
						listen_dev(input6, "change", /*input6_change_handler*/ ctx[11]),
						listen_dev(input6, "change", validate, false, false, false, false),
						listen_dev(input7, "change", /*input7_change_handler*/ ctx[12]),
						listen_dev(input7, "change", validate, false, false, false, false),
						listen_dev(input8, "input", /*input8_input_handler*/ ctx[13]),
						listen_dev(input8, "change", validate, false, false, false, false),
						listen_dev(input9, "input", /*input9_input_handler*/ ctx[14]),
						listen_dev(input9, "change", validate, false, false, false, false),
						listen_dev(input10, "input", /*input10_input_handler*/ ctx[15]),
						listen_dev(input10, "change", validate, false, false, false, false),
						listen_dev(input11, "input", /*input11_input_handler*/ ctx[16]),
						listen_dev(input11, "change", validate, false, false, false, false),
						listen_dev(input12, "input", /*input12_input_handler*/ ctx[17]),
						listen_dev(input12, "change", validate, false, false, false, false),
						listen_dev(input13, "input", /*input13_input_handler*/ ctx[18]),
						listen_dev(input13, "change", validate, false, false, false, false),
						listen_dev(input14, "input", /*input14_input_handler*/ ctx[19]),
						listen_dev(input14, "change", validate, false, false, false, false),
						listen_dev(textarea, "click", copy, false, false, false, false),
						listen_dev(label17, "click", clickLabel, false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (!current || dirty & /*$config*/ 4 && input0_value_value !== (input0_value_value = /*$config*/ ctx[2].url) && input0.value !== input0_value_value) {
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
				if (detaching) {
					detach_dev(form);
				}

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

		$$self.$$.on_mount.push(function () {
			if (feed === undefined && !('feed' in $$props || $$self.$$.bound[$$self.$$.props['feed']])) {
				console.warn("<Configurator> was created without expected prop 'feed'");
			}

			if (config === undefined && !('config' in $$props || $$self.$$.bound[$$self.$$.props['config']])) {
				console.warn("<Configurator> was created without expected prop 'config'");
			}
		});

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

	/* src/App.svelte generated by Svelte v4.1.1 */
	const file = "src/App.svelte";

	function add_css(target) {
		append_styles(target, "svelte-1d2f360", ".loading.svelte-1d2f360{opacity:0;transition-property:opacity;transition-duration:3s;transition-timing-function:ease-out;pointer-events:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgQWJvdXQgZnJvbSBcIi4vbGliL0Fib3V0LnN2ZWx0ZVwiO1xuICBpbXBvcnQgQWQgZnJvbSBcIi4vbGliL0FkLnN2ZWx0ZVwiO1xuICBpbXBvcnQgQm94IGZyb20gXCIuL0JveC5zdmVsdGVcIjtcbiAgaW1wb3J0IENvbmZpZ3VyYXRvciBmcm9tIFwiLi9saWIvQ29uZmlndXJhdG9yLnN2ZWx0ZVwiO1xuXG4gIC8vIFN0b3JlcyBjb21pbmcgaW4gdmlhIHByb3BzXG4gIGV4cG9ydCBsZXQgZmVlZDtcbiAgZXhwb3J0IGxldCBjb25maWc7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAubG9hZGluZyB7XG4gICAgb3BhY2l0eTogMDtcbiAgICB0cmFuc2l0aW9uLXByb3BlcnR5OiBvcGFjaXR5O1xuICAgIHRyYW5zaXRpb24tZHVyYXRpb246IDNzO1xuICAgIHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBlYXNlLW91dDtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz0ncm93Jz5cbiAgPGRpdiBjbGFzcz0nY29sIGMyJyBjbGFzczpsb2FkaW5nPXsgJGZlZWQubG9hZGluZyB9PlxuICAgIDxCb3ggeyBmZWVkIH0geyBjb25maWcgfS8+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPSdjb2wgYzUnPlxuICAgIDxDb25maWd1cmF0b3IgeyBmZWVkIH0geyBjb25maWcgfS8+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPSdjb2wgYzUnPlxuICAgIDxBZC8+XG4gICAgPEFib3V0IHsgY29uZmlnIH0vPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVlFLHVCQUFTLENBQ1AsT0FBTyxDQUFFLENBQUMsQ0FDVixtQkFBbUIsQ0FBRSxPQUFPLENBQzVCLG1CQUFtQixDQUFFLEVBQUUsQ0FDdkIsMEJBQTBCLENBQUUsUUFBUSxDQUNwQyxjQUFjLENBQUUsSUFDbEIifQ== */");
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
				add_location(div0, file, 22, 2, 463);
				attr_dev(div1, "class", "col c5");
				add_location(div1, file, 25, 2, 558);
				attr_dev(div2, "class", "col c5");
				add_location(div2, file, 28, 2, 630);
				attr_dev(div3, "class", "row");
				add_location(div3, file, 21, 0, 443);
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

				if (!current || dirty & /*$feed*/ 4) {
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
				if (detaching) {
					detach_dev(div3);
				}

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

		$$self.$$.on_mount.push(function () {
			if (feed === undefined && !('feed' in $$props || $$self.$$.bound[$$self.$$.props['feed']])) {
				console.warn("<App> was created without expected prop 'feed'");
			}

			if (config === undefined && !('config' in $$props || $$self.$$.bound[$$self.$$.props['config']])) {
				console.warn("<App> was created without expected prop 'config'");
			}
		});

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

	const app = new App({
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

	return app;

})();
//# sourceMappingURL=app.js.map
