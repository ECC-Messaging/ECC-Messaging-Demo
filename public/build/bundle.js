
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function (crypto) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _mergeNamespaces(n, m) {
        m.forEach(function (e) {
            e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
                if (k !== 'default' && !(k in n)) {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        });
        return Object.freeze(n);
    }

    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    function noop() { }
    function assign$1(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
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
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    class ModSet {
      constructor(p) {
        this.p = p;
      }
      random() {
        return this.mod(BigInt('0x'+crypto__default["default"].randomBytes(64).toString('hex')))
      }
      mod(n) {
        return (n % this.p + this.p) % this.p
      }
      add(a, b) {
        return this.mod(a + b)
      }
      subtract(a, b) {
        return this.mod(a - b)
      }
      multiply(a, b)  {
        return this.mod(a * b) 
      }
      divide(c, a) {
        const ap = this.power(a, this.p - 2n);
        return this.mod(this.multiply(c, ap))
      }
      squareRoots(k) {
        this.p1 = this.p1 || (this.p - 1n) / 2n;
        if (this.power(k, this.p1) !== 1n) {
          throw 'no integer square root'
        }
        this.p2 = this.p2 || (this.p + 1n) / 4n;
        const root = this.power(k, this.p2);
        const negativeRoot = this.p - root;

        return [root, negativeRoot]
      }
      power(a, b) {
        let x = 1n;
        while (b > 0n) {
          if (a === 0n) {
            return 0n
          }
          if (b % 2n === 1n) {
            x = this.multiply(x, a);
          }
          b = b / 2n;
          a = this.multiply(a, a);
        }

        return x
      }
    }

    var modset = ModSet;

    class ModPoint {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
      static fromJSON(object) {
        return new ModPoint(BigInt('0x'+object.x), BigInt('0x'+object.y))
      }
      static fromString(string) {
        return ModPoint.fromJSON(JSON.parse(string))
      }
      static fromSec1(sec1, curve) {
        const mode = sec1.substr(0, 2);
        const x = BigInt('0x'+sec1.substr(2, 64));
        let y = BigInt('0x'+(sec1.substr(66, 130) || 0));
        
        const compressed = (mode === '03' || mode === '02');
        if (compressed) {
          if (!curve) {
            throw 'no curve provided to recover y point with'
          }
          y = curve.xToY(x, mode === '03');
        }
        
        const point = new ModPoint(x, y);
        if (
          (mode === '04' && sec1.length !== 130) ||
          (compressed && sec1.length !== 66) ||
          (mode !== '04' && mode !== '03' && mode !== '02')
        ) {
          throw 'invalid address' + (mode === '03' || mode === '02') ? ' compressed addresses not yet supported' : ''
        }
        return point
      }
      get sec1Compressed() {
        return this._sec1Compressed || (this._sec1Compressed = 
          `${
        this.y % 2n === 1n ? '03' : '02'
      }${
        this.x.toString(16).padStart(64, '0')
      }`
        )
      }
      get sec1Uncompressed() {
        return this._sec1Uncompressed || (this._sec1Uncompressed = 
          `04${
        this.x.toString(16).padStart(64, '0')
      }${
        this.y.toString(16).padStart(64, '0')
      }`
        )
      }
      toJSON() {
        return { x: this.x.toString(16), y: this.y.toString(16) }
      }
      toString() {
        return JSON.stringify(this.toJSON())
      }
    }
    var modpoint = ModPoint;

    class ModCurve {
      constructor(a, b, n, p, g, preprocessing = {}) {
        this.a = a;
        this.b = b;
        this.n = n;
        this.p = p;
        this.g = g;
        this.modSet = new modset(p);
        this.postProcessings = preprocessing;
      }
     
      add(p1, p2) {
        if (p1 === p2) {
          return this.double(p1)
        }
        const ys = this.modSet.subtract(p2.y, p1.y);
        const xs = this.modSet.subtract(p2.x, p1.x);
        const s = this.modSet.divide(ys, xs);
        const x3 = this.modSet.subtract(this.modSet.subtract(this.modSet.multiply(s,s),p1.x),p2.x);
        const y3 = this.modSet.subtract(this.modSet.multiply(s, this.modSet.subtract(p1.x, x3)),p1.y);
        const p3 = new modpoint(this.modSet.mod(x3), this.modSet.mod(y3));
        return p3
      }
      subtract(a, b) {
        b = new modpoint(b.x, this.modSet.multiply(b.y, -1n));
        const c = this.add(a, b);
        return c
      }
      double(p) {
        const sn = p.x ** 2n * 3n + this.a;
        const sd = 2n * p.y;
        const s = this.modSet.divide(sn,sd);
        const x3 = this.modSet.mod((s ** 2n - p.x * 2n));
        const y3 = this.modSet.mod(s * (p.x - x3) - p.y);
        const p3 = new modpoint(x3, y3);
        return p3
      }
      multiply(p, s)  {
        let p_ = p;

        if (s === 1n) {
          return p_
        }

        let binaryS = s.toString(2);
        const binarySLength = binaryS.length - 1;

        this.postProcessings[p] = this.postProcessings[p] || {};
        const postProcessings = this.postProcessings[p];
        const addings = [];
        let n = p;
        for (var i = binarySLength; i >= 0; i --) {
          const char = binaryS[i];
          if (char === '1') {
            addings.push(n);
          }
          const nStr = n.x.toString();
          n = (postProcessings[nStr] || (postProcessings[nStr] = this.double(n)));
        }

        p_ = addings[0];
        addings.shift();
        while (addings[0]) {
          p_ = this.add(p_, addings[0]);
          addings.shift();
        }

        return p_
      }
      xToY(x, parity) {
        const y2 = this.modSet.add(this.modSet.power(x, 3n), this.b);
        const y = this.modSet.squareRoots(y2);
        if (parity === true) {
          return y[1]
        }
        else if (parity === false) {
          return y[0]
        }
        return y
      }
      verify(point) {
        const verificationPoint = this.modSet.subtract(
          this.modSet.add(this.modSet.power(point.x, 3n), this.b),
          this.modSet.power(point.y, 2n)
        );
        return verificationPoint === 0n
      }
      // inverse(p) {
      //   // a^p^n−2
      //   return this.multiply(this.multiply(p, this.p), this.n.minus(2))
      // }
    }
    var curve = ModCurve;

    var src = {
      ModSet: modset,
      ModPoint: modpoint,
      Curve: curve, 
    };

    var ecc_math$1 = /*#__PURE__*/_mergeNamespaces({
        __proto__: null,
        'default': src
    }, [src]);

    /*! js-cookie v3.0.1 | MIT */

    var js_cookie = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    }(commonjsGlobal, (function () {
      /* eslint-disable no-var */
      function assign (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            target[key] = source[key];
          }
        }
        return target
      }
      /* eslint-enable no-var */

      /* eslint-disable no-var */
      var defaultConverter = {
        read: function (value) {
          if (value[0] === '"') {
            value = value.slice(1, -1);
          }
          return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
        },
        write: function (value) {
          return encodeURIComponent(value).replace(
            /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
            decodeURIComponent
          )
        }
      };
      /* eslint-enable no-var */

      /* eslint-disable no-var */

      function init (converter, defaultAttributes) {
        function set (key, value, attributes) {
          if (typeof document === 'undefined') {
            return
          }

          attributes = assign({}, defaultAttributes, attributes);

          if (typeof attributes.expires === 'number') {
            attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
          }
          if (attributes.expires) {
            attributes.expires = attributes.expires.toUTCString();
          }

          key = encodeURIComponent(key)
            .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
            .replace(/[()]/g, escape);

          var stringifiedAttributes = '';
          for (var attributeName in attributes) {
            if (!attributes[attributeName]) {
              continue
            }

            stringifiedAttributes += '; ' + attributeName;

            if (attributes[attributeName] === true) {
              continue
            }

            // Considers RFC 6265 section 5.2:
            // ...
            // 3.  If the remaining unparsed-attributes contains a %x3B (";")
            //     character:
            // Consume the characters of the unparsed-attributes up to,
            // not including, the first %x3B (";") character.
            // ...
            stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
          }

          return (document.cookie =
            key + '=' + converter.write(value, key) + stringifiedAttributes)
        }

        function get (key) {
          if (typeof document === 'undefined' || (arguments.length && !key)) {
            return
          }

          // To prevent the for loop in the first place assign an empty array
          // in case there are no cookies at all.
          var cookies = document.cookie ? document.cookie.split('; ') : [];
          var jar = {};
          for (var i = 0; i < cookies.length; i++) {
            var parts = cookies[i].split('=');
            var value = parts.slice(1).join('=');

            try {
              var foundKey = decodeURIComponent(parts[0]);
              jar[foundKey] = converter.read(value, foundKey);

              if (key === foundKey) {
                break
              }
            } catch (e) {}
          }

          return key ? jar[key] : jar
        }

        return Object.create(
          {
            set: set,
            get: get,
            remove: function (key, attributes) {
              set(
                key,
                '',
                assign({}, attributes, {
                  expires: -1
                })
              );
            },
            withAttributes: function (attributes) {
              return init(this.converter, assign({}, this.attributes, attributes))
            },
            withConverter: function (converter) {
              return init(assign({}, this.converter, converter), this.attributes)
            }
          },
          {
            attributes: { value: Object.freeze(defaultAttributes) },
            converter: { value: Object.freeze(converter) }
          }
        )
      }

      var api = init(defaultConverter, { path: '/' });
      /* eslint-enable no-var */

      return api;

    })));
    });

    var ECC = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ECCInstance = void 0;
    const js_cookie_1 = __importDefault(js_cookie);
    class ECCInstance {
        C;
        G;
        name;
        privateKey;
        publicKey;
        sharedKey;
        constructor(C, G, name) {
            this.C = C;
            this.G = G;
            this.name = name;
            this.loadPublicKey();
        }
        generatePrivateKey() {
            this.privateKey = 378;
            //ALTERNATE OPTION
            // localStorage.setItem("lastname", "Smith");
            // console.log(localStorage.getItem("lastname"));
            if (js_cookie_1.default.get("privateKey_" + this.name) == undefined) {
                js_cookie_1.default.set("privateKey_" + this.name, this.privateKey, { expires: 365 });
            }
        }
        loadPublicKey() {
            if (js_cookie_1.default.get("privateKey_" + this.name) == undefined) {
                this.generatePrivateKey();
            }
            else {
                this.privateKey = +js_cookie_1.default.get("privateKey_" + this.name);
            }
            this.publicKey = this.C.multiply(this.G, this.privateKey);
        }
        generateSharedKey(publicKey) {
            this.sharedKey = this.C.multiply(publicKey, this.privateKey);
        }
        getPublicKey() {
            return this.publicKey;
        }
        getSharedKey() {
            return this.sharedKey;
        }
        getName() {
            return this.name;
        }
        getPrivateKey() {
            return this.privateKey;
        }
        clearKeys() {
            js_cookie_1.default.remove("privateKey_" + this.name);
        }
    }
    exports.ECCInstance = ECCInstance;

    });

    /*! MIT License. Copyright 2015-2018 Richard Moore <me@ricmoo.com>. See LICENSE.txt. */

    var aesJs = createCommonjsModule(function (module, exports) {
    (function(root) {

        function checkInt(value) {
            return (parseInt(value) === value);
        }

        function checkInts(arrayish) {
            if (!checkInt(arrayish.length)) { return false; }

            for (var i = 0; i < arrayish.length; i++) {
                if (!checkInt(arrayish[i]) || arrayish[i] < 0 || arrayish[i] > 255) {
                    return false;
                }
            }

            return true;
        }

        function coerceArray(arg, copy) {

            // ArrayBuffer view
            if (arg.buffer && arg.name === 'Uint8Array') {

                if (copy) {
                    if (arg.slice) {
                        arg = arg.slice();
                    } else {
                        arg = Array.prototype.slice.call(arg);
                    }
                }

                return arg;
            }

            // It's an array; check it is a valid representation of a byte
            if (Array.isArray(arg)) {
                if (!checkInts(arg)) {
                    throw new Error('Array contains invalid value: ' + arg);
                }

                return new Uint8Array(arg);
            }

            // Something else, but behaves like an array (maybe a Buffer? Arguments?)
            if (checkInt(arg.length) && checkInts(arg)) {
                return new Uint8Array(arg);
            }

            throw new Error('unsupported array-like object');
        }

        function createArray(length) {
            return new Uint8Array(length);
        }

        function copyArray(sourceArray, targetArray, targetStart, sourceStart, sourceEnd) {
            if (sourceStart != null || sourceEnd != null) {
                if (sourceArray.slice) {
                    sourceArray = sourceArray.slice(sourceStart, sourceEnd);
                } else {
                    sourceArray = Array.prototype.slice.call(sourceArray, sourceStart, sourceEnd);
                }
            }
            targetArray.set(sourceArray, targetStart);
        }



        var convertUtf8 = (function() {
            function toBytes(text) {
                var result = [], i = 0;
                text = encodeURI(text);
                while (i < text.length) {
                    var c = text.charCodeAt(i++);

                    // if it is a % sign, encode the following 2 bytes as a hex value
                    if (c === 37) {
                        result.push(parseInt(text.substr(i, 2), 16));
                        i += 2;

                    // otherwise, just the actual byte
                    } else {
                        result.push(c);
                    }
                }

                return coerceArray(result);
            }

            function fromBytes(bytes) {
                var result = [], i = 0;

                while (i < bytes.length) {
                    var c = bytes[i];

                    if (c < 128) {
                        result.push(String.fromCharCode(c));
                        i++;
                    } else if (c > 191 && c < 224) {
                        result.push(String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)));
                        i += 2;
                    } else {
                        result.push(String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)));
                        i += 3;
                    }
                }

                return result.join('');
            }

            return {
                toBytes: toBytes,
                fromBytes: fromBytes,
            }
        })();

        var convertHex = (function() {
            function toBytes(text) {
                var result = [];
                for (var i = 0; i < text.length; i += 2) {
                    result.push(parseInt(text.substr(i, 2), 16));
                }

                return result;
            }

            // http://ixti.net/development/javascript/2011/11/11/base64-encodedecode-of-utf8-in-browser-with-js.html
            var Hex = '0123456789abcdef';

            function fromBytes(bytes) {
                    var result = [];
                    for (var i = 0; i < bytes.length; i++) {
                        var v = bytes[i];
                        result.push(Hex[(v & 0xf0) >> 4] + Hex[v & 0x0f]);
                    }
                    return result.join('');
            }

            return {
                toBytes: toBytes,
                fromBytes: fromBytes,
            }
        })();


        // Number of rounds by keysize
        var numberOfRounds = {16: 10, 24: 12, 32: 14};

        // Round constant words
        var rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91];

        // S-box and Inverse S-box (S is for Substitution)
        var S = [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16];
        var Si =[0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb, 0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb, 0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e, 0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25, 0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92, 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84, 0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06, 0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b, 0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73, 0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e, 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b, 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4, 0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f, 0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef, 0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61, 0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d];

        // Transformations for encryption
        var T1 = [0xc66363a5, 0xf87c7c84, 0xee777799, 0xf67b7b8d, 0xfff2f20d, 0xd66b6bbd, 0xde6f6fb1, 0x91c5c554, 0x60303050, 0x02010103, 0xce6767a9, 0x562b2b7d, 0xe7fefe19, 0xb5d7d762, 0x4dababe6, 0xec76769a, 0x8fcaca45, 0x1f82829d, 0x89c9c940, 0xfa7d7d87, 0xeffafa15, 0xb25959eb, 0x8e4747c9, 0xfbf0f00b, 0x41adadec, 0xb3d4d467, 0x5fa2a2fd, 0x45afafea, 0x239c9cbf, 0x53a4a4f7, 0xe4727296, 0x9bc0c05b, 0x75b7b7c2, 0xe1fdfd1c, 0x3d9393ae, 0x4c26266a, 0x6c36365a, 0x7e3f3f41, 0xf5f7f702, 0x83cccc4f, 0x6834345c, 0x51a5a5f4, 0xd1e5e534, 0xf9f1f108, 0xe2717193, 0xabd8d873, 0x62313153, 0x2a15153f, 0x0804040c, 0x95c7c752, 0x46232365, 0x9dc3c35e, 0x30181828, 0x379696a1, 0x0a05050f, 0x2f9a9ab5, 0x0e070709, 0x24121236, 0x1b80809b, 0xdfe2e23d, 0xcdebeb26, 0x4e272769, 0x7fb2b2cd, 0xea75759f, 0x1209091b, 0x1d83839e, 0x582c2c74, 0x341a1a2e, 0x361b1b2d, 0xdc6e6eb2, 0xb45a5aee, 0x5ba0a0fb, 0xa45252f6, 0x763b3b4d, 0xb7d6d661, 0x7db3b3ce, 0x5229297b, 0xdde3e33e, 0x5e2f2f71, 0x13848497, 0xa65353f5, 0xb9d1d168, 0x00000000, 0xc1eded2c, 0x40202060, 0xe3fcfc1f, 0x79b1b1c8, 0xb65b5bed, 0xd46a6abe, 0x8dcbcb46, 0x67bebed9, 0x7239394b, 0x944a4ade, 0x984c4cd4, 0xb05858e8, 0x85cfcf4a, 0xbbd0d06b, 0xc5efef2a, 0x4faaaae5, 0xedfbfb16, 0x864343c5, 0x9a4d4dd7, 0x66333355, 0x11858594, 0x8a4545cf, 0xe9f9f910, 0x04020206, 0xfe7f7f81, 0xa05050f0, 0x783c3c44, 0x259f9fba, 0x4ba8a8e3, 0xa25151f3, 0x5da3a3fe, 0x804040c0, 0x058f8f8a, 0x3f9292ad, 0x219d9dbc, 0x70383848, 0xf1f5f504, 0x63bcbcdf, 0x77b6b6c1, 0xafdada75, 0x42212163, 0x20101030, 0xe5ffff1a, 0xfdf3f30e, 0xbfd2d26d, 0x81cdcd4c, 0x180c0c14, 0x26131335, 0xc3ecec2f, 0xbe5f5fe1, 0x359797a2, 0x884444cc, 0x2e171739, 0x93c4c457, 0x55a7a7f2, 0xfc7e7e82, 0x7a3d3d47, 0xc86464ac, 0xba5d5de7, 0x3219192b, 0xe6737395, 0xc06060a0, 0x19818198, 0x9e4f4fd1, 0xa3dcdc7f, 0x44222266, 0x542a2a7e, 0x3b9090ab, 0x0b888883, 0x8c4646ca, 0xc7eeee29, 0x6bb8b8d3, 0x2814143c, 0xa7dede79, 0xbc5e5ee2, 0x160b0b1d, 0xaddbdb76, 0xdbe0e03b, 0x64323256, 0x743a3a4e, 0x140a0a1e, 0x924949db, 0x0c06060a, 0x4824246c, 0xb85c5ce4, 0x9fc2c25d, 0xbdd3d36e, 0x43acacef, 0xc46262a6, 0x399191a8, 0x319595a4, 0xd3e4e437, 0xf279798b, 0xd5e7e732, 0x8bc8c843, 0x6e373759, 0xda6d6db7, 0x018d8d8c, 0xb1d5d564, 0x9c4e4ed2, 0x49a9a9e0, 0xd86c6cb4, 0xac5656fa, 0xf3f4f407, 0xcfeaea25, 0xca6565af, 0xf47a7a8e, 0x47aeaee9, 0x10080818, 0x6fbabad5, 0xf0787888, 0x4a25256f, 0x5c2e2e72, 0x381c1c24, 0x57a6a6f1, 0x73b4b4c7, 0x97c6c651, 0xcbe8e823, 0xa1dddd7c, 0xe874749c, 0x3e1f1f21, 0x964b4bdd, 0x61bdbddc, 0x0d8b8b86, 0x0f8a8a85, 0xe0707090, 0x7c3e3e42, 0x71b5b5c4, 0xcc6666aa, 0x904848d8, 0x06030305, 0xf7f6f601, 0x1c0e0e12, 0xc26161a3, 0x6a35355f, 0xae5757f9, 0x69b9b9d0, 0x17868691, 0x99c1c158, 0x3a1d1d27, 0x279e9eb9, 0xd9e1e138, 0xebf8f813, 0x2b9898b3, 0x22111133, 0xd26969bb, 0xa9d9d970, 0x078e8e89, 0x339494a7, 0x2d9b9bb6, 0x3c1e1e22, 0x15878792, 0xc9e9e920, 0x87cece49, 0xaa5555ff, 0x50282878, 0xa5dfdf7a, 0x038c8c8f, 0x59a1a1f8, 0x09898980, 0x1a0d0d17, 0x65bfbfda, 0xd7e6e631, 0x844242c6, 0xd06868b8, 0x824141c3, 0x299999b0, 0x5a2d2d77, 0x1e0f0f11, 0x7bb0b0cb, 0xa85454fc, 0x6dbbbbd6, 0x2c16163a];
        var T2 = [0xa5c66363, 0x84f87c7c, 0x99ee7777, 0x8df67b7b, 0x0dfff2f2, 0xbdd66b6b, 0xb1de6f6f, 0x5491c5c5, 0x50603030, 0x03020101, 0xa9ce6767, 0x7d562b2b, 0x19e7fefe, 0x62b5d7d7, 0xe64dabab, 0x9aec7676, 0x458fcaca, 0x9d1f8282, 0x4089c9c9, 0x87fa7d7d, 0x15effafa, 0xebb25959, 0xc98e4747, 0x0bfbf0f0, 0xec41adad, 0x67b3d4d4, 0xfd5fa2a2, 0xea45afaf, 0xbf239c9c, 0xf753a4a4, 0x96e47272, 0x5b9bc0c0, 0xc275b7b7, 0x1ce1fdfd, 0xae3d9393, 0x6a4c2626, 0x5a6c3636, 0x417e3f3f, 0x02f5f7f7, 0x4f83cccc, 0x5c683434, 0xf451a5a5, 0x34d1e5e5, 0x08f9f1f1, 0x93e27171, 0x73abd8d8, 0x53623131, 0x3f2a1515, 0x0c080404, 0x5295c7c7, 0x65462323, 0x5e9dc3c3, 0x28301818, 0xa1379696, 0x0f0a0505, 0xb52f9a9a, 0x090e0707, 0x36241212, 0x9b1b8080, 0x3ddfe2e2, 0x26cdebeb, 0x694e2727, 0xcd7fb2b2, 0x9fea7575, 0x1b120909, 0x9e1d8383, 0x74582c2c, 0x2e341a1a, 0x2d361b1b, 0xb2dc6e6e, 0xeeb45a5a, 0xfb5ba0a0, 0xf6a45252, 0x4d763b3b, 0x61b7d6d6, 0xce7db3b3, 0x7b522929, 0x3edde3e3, 0x715e2f2f, 0x97138484, 0xf5a65353, 0x68b9d1d1, 0x00000000, 0x2cc1eded, 0x60402020, 0x1fe3fcfc, 0xc879b1b1, 0xedb65b5b, 0xbed46a6a, 0x468dcbcb, 0xd967bebe, 0x4b723939, 0xde944a4a, 0xd4984c4c, 0xe8b05858, 0x4a85cfcf, 0x6bbbd0d0, 0x2ac5efef, 0xe54faaaa, 0x16edfbfb, 0xc5864343, 0xd79a4d4d, 0x55663333, 0x94118585, 0xcf8a4545, 0x10e9f9f9, 0x06040202, 0x81fe7f7f, 0xf0a05050, 0x44783c3c, 0xba259f9f, 0xe34ba8a8, 0xf3a25151, 0xfe5da3a3, 0xc0804040, 0x8a058f8f, 0xad3f9292, 0xbc219d9d, 0x48703838, 0x04f1f5f5, 0xdf63bcbc, 0xc177b6b6, 0x75afdada, 0x63422121, 0x30201010, 0x1ae5ffff, 0x0efdf3f3, 0x6dbfd2d2, 0x4c81cdcd, 0x14180c0c, 0x35261313, 0x2fc3ecec, 0xe1be5f5f, 0xa2359797, 0xcc884444, 0x392e1717, 0x5793c4c4, 0xf255a7a7, 0x82fc7e7e, 0x477a3d3d, 0xacc86464, 0xe7ba5d5d, 0x2b321919, 0x95e67373, 0xa0c06060, 0x98198181, 0xd19e4f4f, 0x7fa3dcdc, 0x66442222, 0x7e542a2a, 0xab3b9090, 0x830b8888, 0xca8c4646, 0x29c7eeee, 0xd36bb8b8, 0x3c281414, 0x79a7dede, 0xe2bc5e5e, 0x1d160b0b, 0x76addbdb, 0x3bdbe0e0, 0x56643232, 0x4e743a3a, 0x1e140a0a, 0xdb924949, 0x0a0c0606, 0x6c482424, 0xe4b85c5c, 0x5d9fc2c2, 0x6ebdd3d3, 0xef43acac, 0xa6c46262, 0xa8399191, 0xa4319595, 0x37d3e4e4, 0x8bf27979, 0x32d5e7e7, 0x438bc8c8, 0x596e3737, 0xb7da6d6d, 0x8c018d8d, 0x64b1d5d5, 0xd29c4e4e, 0xe049a9a9, 0xb4d86c6c, 0xfaac5656, 0x07f3f4f4, 0x25cfeaea, 0xafca6565, 0x8ef47a7a, 0xe947aeae, 0x18100808, 0xd56fbaba, 0x88f07878, 0x6f4a2525, 0x725c2e2e, 0x24381c1c, 0xf157a6a6, 0xc773b4b4, 0x5197c6c6, 0x23cbe8e8, 0x7ca1dddd, 0x9ce87474, 0x213e1f1f, 0xdd964b4b, 0xdc61bdbd, 0x860d8b8b, 0x850f8a8a, 0x90e07070, 0x427c3e3e, 0xc471b5b5, 0xaacc6666, 0xd8904848, 0x05060303, 0x01f7f6f6, 0x121c0e0e, 0xa3c26161, 0x5f6a3535, 0xf9ae5757, 0xd069b9b9, 0x91178686, 0x5899c1c1, 0x273a1d1d, 0xb9279e9e, 0x38d9e1e1, 0x13ebf8f8, 0xb32b9898, 0x33221111, 0xbbd26969, 0x70a9d9d9, 0x89078e8e, 0xa7339494, 0xb62d9b9b, 0x223c1e1e, 0x92158787, 0x20c9e9e9, 0x4987cece, 0xffaa5555, 0x78502828, 0x7aa5dfdf, 0x8f038c8c, 0xf859a1a1, 0x80098989, 0x171a0d0d, 0xda65bfbf, 0x31d7e6e6, 0xc6844242, 0xb8d06868, 0xc3824141, 0xb0299999, 0x775a2d2d, 0x111e0f0f, 0xcb7bb0b0, 0xfca85454, 0xd66dbbbb, 0x3a2c1616];
        var T3 = [0x63a5c663, 0x7c84f87c, 0x7799ee77, 0x7b8df67b, 0xf20dfff2, 0x6bbdd66b, 0x6fb1de6f, 0xc55491c5, 0x30506030, 0x01030201, 0x67a9ce67, 0x2b7d562b, 0xfe19e7fe, 0xd762b5d7, 0xabe64dab, 0x769aec76, 0xca458fca, 0x829d1f82, 0xc94089c9, 0x7d87fa7d, 0xfa15effa, 0x59ebb259, 0x47c98e47, 0xf00bfbf0, 0xadec41ad, 0xd467b3d4, 0xa2fd5fa2, 0xafea45af, 0x9cbf239c, 0xa4f753a4, 0x7296e472, 0xc05b9bc0, 0xb7c275b7, 0xfd1ce1fd, 0x93ae3d93, 0x266a4c26, 0x365a6c36, 0x3f417e3f, 0xf702f5f7, 0xcc4f83cc, 0x345c6834, 0xa5f451a5, 0xe534d1e5, 0xf108f9f1, 0x7193e271, 0xd873abd8, 0x31536231, 0x153f2a15, 0x040c0804, 0xc75295c7, 0x23654623, 0xc35e9dc3, 0x18283018, 0x96a13796, 0x050f0a05, 0x9ab52f9a, 0x07090e07, 0x12362412, 0x809b1b80, 0xe23ddfe2, 0xeb26cdeb, 0x27694e27, 0xb2cd7fb2, 0x759fea75, 0x091b1209, 0x839e1d83, 0x2c74582c, 0x1a2e341a, 0x1b2d361b, 0x6eb2dc6e, 0x5aeeb45a, 0xa0fb5ba0, 0x52f6a452, 0x3b4d763b, 0xd661b7d6, 0xb3ce7db3, 0x297b5229, 0xe33edde3, 0x2f715e2f, 0x84971384, 0x53f5a653, 0xd168b9d1, 0x00000000, 0xed2cc1ed, 0x20604020, 0xfc1fe3fc, 0xb1c879b1, 0x5bedb65b, 0x6abed46a, 0xcb468dcb, 0xbed967be, 0x394b7239, 0x4ade944a, 0x4cd4984c, 0x58e8b058, 0xcf4a85cf, 0xd06bbbd0, 0xef2ac5ef, 0xaae54faa, 0xfb16edfb, 0x43c58643, 0x4dd79a4d, 0x33556633, 0x85941185, 0x45cf8a45, 0xf910e9f9, 0x02060402, 0x7f81fe7f, 0x50f0a050, 0x3c44783c, 0x9fba259f, 0xa8e34ba8, 0x51f3a251, 0xa3fe5da3, 0x40c08040, 0x8f8a058f, 0x92ad3f92, 0x9dbc219d, 0x38487038, 0xf504f1f5, 0xbcdf63bc, 0xb6c177b6, 0xda75afda, 0x21634221, 0x10302010, 0xff1ae5ff, 0xf30efdf3, 0xd26dbfd2, 0xcd4c81cd, 0x0c14180c, 0x13352613, 0xec2fc3ec, 0x5fe1be5f, 0x97a23597, 0x44cc8844, 0x17392e17, 0xc45793c4, 0xa7f255a7, 0x7e82fc7e, 0x3d477a3d, 0x64acc864, 0x5de7ba5d, 0x192b3219, 0x7395e673, 0x60a0c060, 0x81981981, 0x4fd19e4f, 0xdc7fa3dc, 0x22664422, 0x2a7e542a, 0x90ab3b90, 0x88830b88, 0x46ca8c46, 0xee29c7ee, 0xb8d36bb8, 0x143c2814, 0xde79a7de, 0x5ee2bc5e, 0x0b1d160b, 0xdb76addb, 0xe03bdbe0, 0x32566432, 0x3a4e743a, 0x0a1e140a, 0x49db9249, 0x060a0c06, 0x246c4824, 0x5ce4b85c, 0xc25d9fc2, 0xd36ebdd3, 0xacef43ac, 0x62a6c462, 0x91a83991, 0x95a43195, 0xe437d3e4, 0x798bf279, 0xe732d5e7, 0xc8438bc8, 0x37596e37, 0x6db7da6d, 0x8d8c018d, 0xd564b1d5, 0x4ed29c4e, 0xa9e049a9, 0x6cb4d86c, 0x56faac56, 0xf407f3f4, 0xea25cfea, 0x65afca65, 0x7a8ef47a, 0xaee947ae, 0x08181008, 0xbad56fba, 0x7888f078, 0x256f4a25, 0x2e725c2e, 0x1c24381c, 0xa6f157a6, 0xb4c773b4, 0xc65197c6, 0xe823cbe8, 0xdd7ca1dd, 0x749ce874, 0x1f213e1f, 0x4bdd964b, 0xbddc61bd, 0x8b860d8b, 0x8a850f8a, 0x7090e070, 0x3e427c3e, 0xb5c471b5, 0x66aacc66, 0x48d89048, 0x03050603, 0xf601f7f6, 0x0e121c0e, 0x61a3c261, 0x355f6a35, 0x57f9ae57, 0xb9d069b9, 0x86911786, 0xc15899c1, 0x1d273a1d, 0x9eb9279e, 0xe138d9e1, 0xf813ebf8, 0x98b32b98, 0x11332211, 0x69bbd269, 0xd970a9d9, 0x8e89078e, 0x94a73394, 0x9bb62d9b, 0x1e223c1e, 0x87921587, 0xe920c9e9, 0xce4987ce, 0x55ffaa55, 0x28785028, 0xdf7aa5df, 0x8c8f038c, 0xa1f859a1, 0x89800989, 0x0d171a0d, 0xbfda65bf, 0xe631d7e6, 0x42c68442, 0x68b8d068, 0x41c38241, 0x99b02999, 0x2d775a2d, 0x0f111e0f, 0xb0cb7bb0, 0x54fca854, 0xbbd66dbb, 0x163a2c16];
        var T4 = [0x6363a5c6, 0x7c7c84f8, 0x777799ee, 0x7b7b8df6, 0xf2f20dff, 0x6b6bbdd6, 0x6f6fb1de, 0xc5c55491, 0x30305060, 0x01010302, 0x6767a9ce, 0x2b2b7d56, 0xfefe19e7, 0xd7d762b5, 0xababe64d, 0x76769aec, 0xcaca458f, 0x82829d1f, 0xc9c94089, 0x7d7d87fa, 0xfafa15ef, 0x5959ebb2, 0x4747c98e, 0xf0f00bfb, 0xadadec41, 0xd4d467b3, 0xa2a2fd5f, 0xafafea45, 0x9c9cbf23, 0xa4a4f753, 0x727296e4, 0xc0c05b9b, 0xb7b7c275, 0xfdfd1ce1, 0x9393ae3d, 0x26266a4c, 0x36365a6c, 0x3f3f417e, 0xf7f702f5, 0xcccc4f83, 0x34345c68, 0xa5a5f451, 0xe5e534d1, 0xf1f108f9, 0x717193e2, 0xd8d873ab, 0x31315362, 0x15153f2a, 0x04040c08, 0xc7c75295, 0x23236546, 0xc3c35e9d, 0x18182830, 0x9696a137, 0x05050f0a, 0x9a9ab52f, 0x0707090e, 0x12123624, 0x80809b1b, 0xe2e23ddf, 0xebeb26cd, 0x2727694e, 0xb2b2cd7f, 0x75759fea, 0x09091b12, 0x83839e1d, 0x2c2c7458, 0x1a1a2e34, 0x1b1b2d36, 0x6e6eb2dc, 0x5a5aeeb4, 0xa0a0fb5b, 0x5252f6a4, 0x3b3b4d76, 0xd6d661b7, 0xb3b3ce7d, 0x29297b52, 0xe3e33edd, 0x2f2f715e, 0x84849713, 0x5353f5a6, 0xd1d168b9, 0x00000000, 0xeded2cc1, 0x20206040, 0xfcfc1fe3, 0xb1b1c879, 0x5b5bedb6, 0x6a6abed4, 0xcbcb468d, 0xbebed967, 0x39394b72, 0x4a4ade94, 0x4c4cd498, 0x5858e8b0, 0xcfcf4a85, 0xd0d06bbb, 0xefef2ac5, 0xaaaae54f, 0xfbfb16ed, 0x4343c586, 0x4d4dd79a, 0x33335566, 0x85859411, 0x4545cf8a, 0xf9f910e9, 0x02020604, 0x7f7f81fe, 0x5050f0a0, 0x3c3c4478, 0x9f9fba25, 0xa8a8e34b, 0x5151f3a2, 0xa3a3fe5d, 0x4040c080, 0x8f8f8a05, 0x9292ad3f, 0x9d9dbc21, 0x38384870, 0xf5f504f1, 0xbcbcdf63, 0xb6b6c177, 0xdada75af, 0x21216342, 0x10103020, 0xffff1ae5, 0xf3f30efd, 0xd2d26dbf, 0xcdcd4c81, 0x0c0c1418, 0x13133526, 0xecec2fc3, 0x5f5fe1be, 0x9797a235, 0x4444cc88, 0x1717392e, 0xc4c45793, 0xa7a7f255, 0x7e7e82fc, 0x3d3d477a, 0x6464acc8, 0x5d5de7ba, 0x19192b32, 0x737395e6, 0x6060a0c0, 0x81819819, 0x4f4fd19e, 0xdcdc7fa3, 0x22226644, 0x2a2a7e54, 0x9090ab3b, 0x8888830b, 0x4646ca8c, 0xeeee29c7, 0xb8b8d36b, 0x14143c28, 0xdede79a7, 0x5e5ee2bc, 0x0b0b1d16, 0xdbdb76ad, 0xe0e03bdb, 0x32325664, 0x3a3a4e74, 0x0a0a1e14, 0x4949db92, 0x06060a0c, 0x24246c48, 0x5c5ce4b8, 0xc2c25d9f, 0xd3d36ebd, 0xacacef43, 0x6262a6c4, 0x9191a839, 0x9595a431, 0xe4e437d3, 0x79798bf2, 0xe7e732d5, 0xc8c8438b, 0x3737596e, 0x6d6db7da, 0x8d8d8c01, 0xd5d564b1, 0x4e4ed29c, 0xa9a9e049, 0x6c6cb4d8, 0x5656faac, 0xf4f407f3, 0xeaea25cf, 0x6565afca, 0x7a7a8ef4, 0xaeaee947, 0x08081810, 0xbabad56f, 0x787888f0, 0x25256f4a, 0x2e2e725c, 0x1c1c2438, 0xa6a6f157, 0xb4b4c773, 0xc6c65197, 0xe8e823cb, 0xdddd7ca1, 0x74749ce8, 0x1f1f213e, 0x4b4bdd96, 0xbdbddc61, 0x8b8b860d, 0x8a8a850f, 0x707090e0, 0x3e3e427c, 0xb5b5c471, 0x6666aacc, 0x4848d890, 0x03030506, 0xf6f601f7, 0x0e0e121c, 0x6161a3c2, 0x35355f6a, 0x5757f9ae, 0xb9b9d069, 0x86869117, 0xc1c15899, 0x1d1d273a, 0x9e9eb927, 0xe1e138d9, 0xf8f813eb, 0x9898b32b, 0x11113322, 0x6969bbd2, 0xd9d970a9, 0x8e8e8907, 0x9494a733, 0x9b9bb62d, 0x1e1e223c, 0x87879215, 0xe9e920c9, 0xcece4987, 0x5555ffaa, 0x28287850, 0xdfdf7aa5, 0x8c8c8f03, 0xa1a1f859, 0x89898009, 0x0d0d171a, 0xbfbfda65, 0xe6e631d7, 0x4242c684, 0x6868b8d0, 0x4141c382, 0x9999b029, 0x2d2d775a, 0x0f0f111e, 0xb0b0cb7b, 0x5454fca8, 0xbbbbd66d, 0x16163a2c];

        // Transformations for decryption
        var T5 = [0x51f4a750, 0x7e416553, 0x1a17a4c3, 0x3a275e96, 0x3bab6bcb, 0x1f9d45f1, 0xacfa58ab, 0x4be30393, 0x2030fa55, 0xad766df6, 0x88cc7691, 0xf5024c25, 0x4fe5d7fc, 0xc52acbd7, 0x26354480, 0xb562a38f, 0xdeb15a49, 0x25ba1b67, 0x45ea0e98, 0x5dfec0e1, 0xc32f7502, 0x814cf012, 0x8d4697a3, 0x6bd3f9c6, 0x038f5fe7, 0x15929c95, 0xbf6d7aeb, 0x955259da, 0xd4be832d, 0x587421d3, 0x49e06929, 0x8ec9c844, 0x75c2896a, 0xf48e7978, 0x99583e6b, 0x27b971dd, 0xbee14fb6, 0xf088ad17, 0xc920ac66, 0x7dce3ab4, 0x63df4a18, 0xe51a3182, 0x97513360, 0x62537f45, 0xb16477e0, 0xbb6bae84, 0xfe81a01c, 0xf9082b94, 0x70486858, 0x8f45fd19, 0x94de6c87, 0x527bf8b7, 0xab73d323, 0x724b02e2, 0xe31f8f57, 0x6655ab2a, 0xb2eb2807, 0x2fb5c203, 0x86c57b9a, 0xd33708a5, 0x302887f2, 0x23bfa5b2, 0x02036aba, 0xed16825c, 0x8acf1c2b, 0xa779b492, 0xf307f2f0, 0x4e69e2a1, 0x65daf4cd, 0x0605bed5, 0xd134621f, 0xc4a6fe8a, 0x342e539d, 0xa2f355a0, 0x058ae132, 0xa4f6eb75, 0x0b83ec39, 0x4060efaa, 0x5e719f06, 0xbd6e1051, 0x3e218af9, 0x96dd063d, 0xdd3e05ae, 0x4de6bd46, 0x91548db5, 0x71c45d05, 0x0406d46f, 0x605015ff, 0x1998fb24, 0xd6bde997, 0x894043cc, 0x67d99e77, 0xb0e842bd, 0x07898b88, 0xe7195b38, 0x79c8eedb, 0xa17c0a47, 0x7c420fe9, 0xf8841ec9, 0x00000000, 0x09808683, 0x322bed48, 0x1e1170ac, 0x6c5a724e, 0xfd0efffb, 0x0f853856, 0x3daed51e, 0x362d3927, 0x0a0fd964, 0x685ca621, 0x9b5b54d1, 0x24362e3a, 0x0c0a67b1, 0x9357e70f, 0xb4ee96d2, 0x1b9b919e, 0x80c0c54f, 0x61dc20a2, 0x5a774b69, 0x1c121a16, 0xe293ba0a, 0xc0a02ae5, 0x3c22e043, 0x121b171d, 0x0e090d0b, 0xf28bc7ad, 0x2db6a8b9, 0x141ea9c8, 0x57f11985, 0xaf75074c, 0xee99ddbb, 0xa37f60fd, 0xf701269f, 0x5c72f5bc, 0x44663bc5, 0x5bfb7e34, 0x8b432976, 0xcb23c6dc, 0xb6edfc68, 0xb8e4f163, 0xd731dcca, 0x42638510, 0x13972240, 0x84c61120, 0x854a247d, 0xd2bb3df8, 0xaef93211, 0xc729a16d, 0x1d9e2f4b, 0xdcb230f3, 0x0d8652ec, 0x77c1e3d0, 0x2bb3166c, 0xa970b999, 0x119448fa, 0x47e96422, 0xa8fc8cc4, 0xa0f03f1a, 0x567d2cd8, 0x223390ef, 0x87494ec7, 0xd938d1c1, 0x8ccaa2fe, 0x98d40b36, 0xa6f581cf, 0xa57ade28, 0xdab78e26, 0x3fadbfa4, 0x2c3a9de4, 0x5078920d, 0x6a5fcc9b, 0x547e4662, 0xf68d13c2, 0x90d8b8e8, 0x2e39f75e, 0x82c3aff5, 0x9f5d80be, 0x69d0937c, 0x6fd52da9, 0xcf2512b3, 0xc8ac993b, 0x10187da7, 0xe89c636e, 0xdb3bbb7b, 0xcd267809, 0x6e5918f4, 0xec9ab701, 0x834f9aa8, 0xe6956e65, 0xaaffe67e, 0x21bccf08, 0xef15e8e6, 0xbae79bd9, 0x4a6f36ce, 0xea9f09d4, 0x29b07cd6, 0x31a4b2af, 0x2a3f2331, 0xc6a59430, 0x35a266c0, 0x744ebc37, 0xfc82caa6, 0xe090d0b0, 0x33a7d815, 0xf104984a, 0x41ecdaf7, 0x7fcd500e, 0x1791f62f, 0x764dd68d, 0x43efb04d, 0xccaa4d54, 0xe49604df, 0x9ed1b5e3, 0x4c6a881b, 0xc12c1fb8, 0x4665517f, 0x9d5eea04, 0x018c355d, 0xfa877473, 0xfb0b412e, 0xb3671d5a, 0x92dbd252, 0xe9105633, 0x6dd64713, 0x9ad7618c, 0x37a10c7a, 0x59f8148e, 0xeb133c89, 0xcea927ee, 0xb761c935, 0xe11ce5ed, 0x7a47b13c, 0x9cd2df59, 0x55f2733f, 0x1814ce79, 0x73c737bf, 0x53f7cdea, 0x5ffdaa5b, 0xdf3d6f14, 0x7844db86, 0xcaaff381, 0xb968c43e, 0x3824342c, 0xc2a3405f, 0x161dc372, 0xbce2250c, 0x283c498b, 0xff0d9541, 0x39a80171, 0x080cb3de, 0xd8b4e49c, 0x6456c190, 0x7bcb8461, 0xd532b670, 0x486c5c74, 0xd0b85742];
        var T6 = [0x5051f4a7, 0x537e4165, 0xc31a17a4, 0x963a275e, 0xcb3bab6b, 0xf11f9d45, 0xabacfa58, 0x934be303, 0x552030fa, 0xf6ad766d, 0x9188cc76, 0x25f5024c, 0xfc4fe5d7, 0xd7c52acb, 0x80263544, 0x8fb562a3, 0x49deb15a, 0x6725ba1b, 0x9845ea0e, 0xe15dfec0, 0x02c32f75, 0x12814cf0, 0xa38d4697, 0xc66bd3f9, 0xe7038f5f, 0x9515929c, 0xebbf6d7a, 0xda955259, 0x2dd4be83, 0xd3587421, 0x2949e069, 0x448ec9c8, 0x6a75c289, 0x78f48e79, 0x6b99583e, 0xdd27b971, 0xb6bee14f, 0x17f088ad, 0x66c920ac, 0xb47dce3a, 0x1863df4a, 0x82e51a31, 0x60975133, 0x4562537f, 0xe0b16477, 0x84bb6bae, 0x1cfe81a0, 0x94f9082b, 0x58704868, 0x198f45fd, 0x8794de6c, 0xb7527bf8, 0x23ab73d3, 0xe2724b02, 0x57e31f8f, 0x2a6655ab, 0x07b2eb28, 0x032fb5c2, 0x9a86c57b, 0xa5d33708, 0xf2302887, 0xb223bfa5, 0xba02036a, 0x5ced1682, 0x2b8acf1c, 0x92a779b4, 0xf0f307f2, 0xa14e69e2, 0xcd65daf4, 0xd50605be, 0x1fd13462, 0x8ac4a6fe, 0x9d342e53, 0xa0a2f355, 0x32058ae1, 0x75a4f6eb, 0x390b83ec, 0xaa4060ef, 0x065e719f, 0x51bd6e10, 0xf93e218a, 0x3d96dd06, 0xaedd3e05, 0x464de6bd, 0xb591548d, 0x0571c45d, 0x6f0406d4, 0xff605015, 0x241998fb, 0x97d6bde9, 0xcc894043, 0x7767d99e, 0xbdb0e842, 0x8807898b, 0x38e7195b, 0xdb79c8ee, 0x47a17c0a, 0xe97c420f, 0xc9f8841e, 0x00000000, 0x83098086, 0x48322bed, 0xac1e1170, 0x4e6c5a72, 0xfbfd0eff, 0x560f8538, 0x1e3daed5, 0x27362d39, 0x640a0fd9, 0x21685ca6, 0xd19b5b54, 0x3a24362e, 0xb10c0a67, 0x0f9357e7, 0xd2b4ee96, 0x9e1b9b91, 0x4f80c0c5, 0xa261dc20, 0x695a774b, 0x161c121a, 0x0ae293ba, 0xe5c0a02a, 0x433c22e0, 0x1d121b17, 0x0b0e090d, 0xadf28bc7, 0xb92db6a8, 0xc8141ea9, 0x8557f119, 0x4caf7507, 0xbbee99dd, 0xfda37f60, 0x9ff70126, 0xbc5c72f5, 0xc544663b, 0x345bfb7e, 0x768b4329, 0xdccb23c6, 0x68b6edfc, 0x63b8e4f1, 0xcad731dc, 0x10426385, 0x40139722, 0x2084c611, 0x7d854a24, 0xf8d2bb3d, 0x11aef932, 0x6dc729a1, 0x4b1d9e2f, 0xf3dcb230, 0xec0d8652, 0xd077c1e3, 0x6c2bb316, 0x99a970b9, 0xfa119448, 0x2247e964, 0xc4a8fc8c, 0x1aa0f03f, 0xd8567d2c, 0xef223390, 0xc787494e, 0xc1d938d1, 0xfe8ccaa2, 0x3698d40b, 0xcfa6f581, 0x28a57ade, 0x26dab78e, 0xa43fadbf, 0xe42c3a9d, 0x0d507892, 0x9b6a5fcc, 0x62547e46, 0xc2f68d13, 0xe890d8b8, 0x5e2e39f7, 0xf582c3af, 0xbe9f5d80, 0x7c69d093, 0xa96fd52d, 0xb3cf2512, 0x3bc8ac99, 0xa710187d, 0x6ee89c63, 0x7bdb3bbb, 0x09cd2678, 0xf46e5918, 0x01ec9ab7, 0xa8834f9a, 0x65e6956e, 0x7eaaffe6, 0x0821bccf, 0xe6ef15e8, 0xd9bae79b, 0xce4a6f36, 0xd4ea9f09, 0xd629b07c, 0xaf31a4b2, 0x312a3f23, 0x30c6a594, 0xc035a266, 0x37744ebc, 0xa6fc82ca, 0xb0e090d0, 0x1533a7d8, 0x4af10498, 0xf741ecda, 0x0e7fcd50, 0x2f1791f6, 0x8d764dd6, 0x4d43efb0, 0x54ccaa4d, 0xdfe49604, 0xe39ed1b5, 0x1b4c6a88, 0xb8c12c1f, 0x7f466551, 0x049d5eea, 0x5d018c35, 0x73fa8774, 0x2efb0b41, 0x5ab3671d, 0x5292dbd2, 0x33e91056, 0x136dd647, 0x8c9ad761, 0x7a37a10c, 0x8e59f814, 0x89eb133c, 0xeecea927, 0x35b761c9, 0xede11ce5, 0x3c7a47b1, 0x599cd2df, 0x3f55f273, 0x791814ce, 0xbf73c737, 0xea53f7cd, 0x5b5ffdaa, 0x14df3d6f, 0x867844db, 0x81caaff3, 0x3eb968c4, 0x2c382434, 0x5fc2a340, 0x72161dc3, 0x0cbce225, 0x8b283c49, 0x41ff0d95, 0x7139a801, 0xde080cb3, 0x9cd8b4e4, 0x906456c1, 0x617bcb84, 0x70d532b6, 0x74486c5c, 0x42d0b857];
        var T7 = [0xa75051f4, 0x65537e41, 0xa4c31a17, 0x5e963a27, 0x6bcb3bab, 0x45f11f9d, 0x58abacfa, 0x03934be3, 0xfa552030, 0x6df6ad76, 0x769188cc, 0x4c25f502, 0xd7fc4fe5, 0xcbd7c52a, 0x44802635, 0xa38fb562, 0x5a49deb1, 0x1b6725ba, 0x0e9845ea, 0xc0e15dfe, 0x7502c32f, 0xf012814c, 0x97a38d46, 0xf9c66bd3, 0x5fe7038f, 0x9c951592, 0x7aebbf6d, 0x59da9552, 0x832dd4be, 0x21d35874, 0x692949e0, 0xc8448ec9, 0x896a75c2, 0x7978f48e, 0x3e6b9958, 0x71dd27b9, 0x4fb6bee1, 0xad17f088, 0xac66c920, 0x3ab47dce, 0x4a1863df, 0x3182e51a, 0x33609751, 0x7f456253, 0x77e0b164, 0xae84bb6b, 0xa01cfe81, 0x2b94f908, 0x68587048, 0xfd198f45, 0x6c8794de, 0xf8b7527b, 0xd323ab73, 0x02e2724b, 0x8f57e31f, 0xab2a6655, 0x2807b2eb, 0xc2032fb5, 0x7b9a86c5, 0x08a5d337, 0x87f23028, 0xa5b223bf, 0x6aba0203, 0x825ced16, 0x1c2b8acf, 0xb492a779, 0xf2f0f307, 0xe2a14e69, 0xf4cd65da, 0xbed50605, 0x621fd134, 0xfe8ac4a6, 0x539d342e, 0x55a0a2f3, 0xe132058a, 0xeb75a4f6, 0xec390b83, 0xefaa4060, 0x9f065e71, 0x1051bd6e, 0x8af93e21, 0x063d96dd, 0x05aedd3e, 0xbd464de6, 0x8db59154, 0x5d0571c4, 0xd46f0406, 0x15ff6050, 0xfb241998, 0xe997d6bd, 0x43cc8940, 0x9e7767d9, 0x42bdb0e8, 0x8b880789, 0x5b38e719, 0xeedb79c8, 0x0a47a17c, 0x0fe97c42, 0x1ec9f884, 0x00000000, 0x86830980, 0xed48322b, 0x70ac1e11, 0x724e6c5a, 0xfffbfd0e, 0x38560f85, 0xd51e3dae, 0x3927362d, 0xd9640a0f, 0xa621685c, 0x54d19b5b, 0x2e3a2436, 0x67b10c0a, 0xe70f9357, 0x96d2b4ee, 0x919e1b9b, 0xc54f80c0, 0x20a261dc, 0x4b695a77, 0x1a161c12, 0xba0ae293, 0x2ae5c0a0, 0xe0433c22, 0x171d121b, 0x0d0b0e09, 0xc7adf28b, 0xa8b92db6, 0xa9c8141e, 0x198557f1, 0x074caf75, 0xddbbee99, 0x60fda37f, 0x269ff701, 0xf5bc5c72, 0x3bc54466, 0x7e345bfb, 0x29768b43, 0xc6dccb23, 0xfc68b6ed, 0xf163b8e4, 0xdccad731, 0x85104263, 0x22401397, 0x112084c6, 0x247d854a, 0x3df8d2bb, 0x3211aef9, 0xa16dc729, 0x2f4b1d9e, 0x30f3dcb2, 0x52ec0d86, 0xe3d077c1, 0x166c2bb3, 0xb999a970, 0x48fa1194, 0x642247e9, 0x8cc4a8fc, 0x3f1aa0f0, 0x2cd8567d, 0x90ef2233, 0x4ec78749, 0xd1c1d938, 0xa2fe8cca, 0x0b3698d4, 0x81cfa6f5, 0xde28a57a, 0x8e26dab7, 0xbfa43fad, 0x9de42c3a, 0x920d5078, 0xcc9b6a5f, 0x4662547e, 0x13c2f68d, 0xb8e890d8, 0xf75e2e39, 0xaff582c3, 0x80be9f5d, 0x937c69d0, 0x2da96fd5, 0x12b3cf25, 0x993bc8ac, 0x7da71018, 0x636ee89c, 0xbb7bdb3b, 0x7809cd26, 0x18f46e59, 0xb701ec9a, 0x9aa8834f, 0x6e65e695, 0xe67eaaff, 0xcf0821bc, 0xe8e6ef15, 0x9bd9bae7, 0x36ce4a6f, 0x09d4ea9f, 0x7cd629b0, 0xb2af31a4, 0x23312a3f, 0x9430c6a5, 0x66c035a2, 0xbc37744e, 0xcaa6fc82, 0xd0b0e090, 0xd81533a7, 0x984af104, 0xdaf741ec, 0x500e7fcd, 0xf62f1791, 0xd68d764d, 0xb04d43ef, 0x4d54ccaa, 0x04dfe496, 0xb5e39ed1, 0x881b4c6a, 0x1fb8c12c, 0x517f4665, 0xea049d5e, 0x355d018c, 0x7473fa87, 0x412efb0b, 0x1d5ab367, 0xd25292db, 0x5633e910, 0x47136dd6, 0x618c9ad7, 0x0c7a37a1, 0x148e59f8, 0x3c89eb13, 0x27eecea9, 0xc935b761, 0xe5ede11c, 0xb13c7a47, 0xdf599cd2, 0x733f55f2, 0xce791814, 0x37bf73c7, 0xcdea53f7, 0xaa5b5ffd, 0x6f14df3d, 0xdb867844, 0xf381caaf, 0xc43eb968, 0x342c3824, 0x405fc2a3, 0xc372161d, 0x250cbce2, 0x498b283c, 0x9541ff0d, 0x017139a8, 0xb3de080c, 0xe49cd8b4, 0xc1906456, 0x84617bcb, 0xb670d532, 0x5c74486c, 0x5742d0b8];
        var T8 = [0xf4a75051, 0x4165537e, 0x17a4c31a, 0x275e963a, 0xab6bcb3b, 0x9d45f11f, 0xfa58abac, 0xe303934b, 0x30fa5520, 0x766df6ad, 0xcc769188, 0x024c25f5, 0xe5d7fc4f, 0x2acbd7c5, 0x35448026, 0x62a38fb5, 0xb15a49de, 0xba1b6725, 0xea0e9845, 0xfec0e15d, 0x2f7502c3, 0x4cf01281, 0x4697a38d, 0xd3f9c66b, 0x8f5fe703, 0x929c9515, 0x6d7aebbf, 0x5259da95, 0xbe832dd4, 0x7421d358, 0xe0692949, 0xc9c8448e, 0xc2896a75, 0x8e7978f4, 0x583e6b99, 0xb971dd27, 0xe14fb6be, 0x88ad17f0, 0x20ac66c9, 0xce3ab47d, 0xdf4a1863, 0x1a3182e5, 0x51336097, 0x537f4562, 0x6477e0b1, 0x6bae84bb, 0x81a01cfe, 0x082b94f9, 0x48685870, 0x45fd198f, 0xde6c8794, 0x7bf8b752, 0x73d323ab, 0x4b02e272, 0x1f8f57e3, 0x55ab2a66, 0xeb2807b2, 0xb5c2032f, 0xc57b9a86, 0x3708a5d3, 0x2887f230, 0xbfa5b223, 0x036aba02, 0x16825ced, 0xcf1c2b8a, 0x79b492a7, 0x07f2f0f3, 0x69e2a14e, 0xdaf4cd65, 0x05bed506, 0x34621fd1, 0xa6fe8ac4, 0x2e539d34, 0xf355a0a2, 0x8ae13205, 0xf6eb75a4, 0x83ec390b, 0x60efaa40, 0x719f065e, 0x6e1051bd, 0x218af93e, 0xdd063d96, 0x3e05aedd, 0xe6bd464d, 0x548db591, 0xc45d0571, 0x06d46f04, 0x5015ff60, 0x98fb2419, 0xbde997d6, 0x4043cc89, 0xd99e7767, 0xe842bdb0, 0x898b8807, 0x195b38e7, 0xc8eedb79, 0x7c0a47a1, 0x420fe97c, 0x841ec9f8, 0x00000000, 0x80868309, 0x2bed4832, 0x1170ac1e, 0x5a724e6c, 0x0efffbfd, 0x8538560f, 0xaed51e3d, 0x2d392736, 0x0fd9640a, 0x5ca62168, 0x5b54d19b, 0x362e3a24, 0x0a67b10c, 0x57e70f93, 0xee96d2b4, 0x9b919e1b, 0xc0c54f80, 0xdc20a261, 0x774b695a, 0x121a161c, 0x93ba0ae2, 0xa02ae5c0, 0x22e0433c, 0x1b171d12, 0x090d0b0e, 0x8bc7adf2, 0xb6a8b92d, 0x1ea9c814, 0xf1198557, 0x75074caf, 0x99ddbbee, 0x7f60fda3, 0x01269ff7, 0x72f5bc5c, 0x663bc544, 0xfb7e345b, 0x4329768b, 0x23c6dccb, 0xedfc68b6, 0xe4f163b8, 0x31dccad7, 0x63851042, 0x97224013, 0xc6112084, 0x4a247d85, 0xbb3df8d2, 0xf93211ae, 0x29a16dc7, 0x9e2f4b1d, 0xb230f3dc, 0x8652ec0d, 0xc1e3d077, 0xb3166c2b, 0x70b999a9, 0x9448fa11, 0xe9642247, 0xfc8cc4a8, 0xf03f1aa0, 0x7d2cd856, 0x3390ef22, 0x494ec787, 0x38d1c1d9, 0xcaa2fe8c, 0xd40b3698, 0xf581cfa6, 0x7ade28a5, 0xb78e26da, 0xadbfa43f, 0x3a9de42c, 0x78920d50, 0x5fcc9b6a, 0x7e466254, 0x8d13c2f6, 0xd8b8e890, 0x39f75e2e, 0xc3aff582, 0x5d80be9f, 0xd0937c69, 0xd52da96f, 0x2512b3cf, 0xac993bc8, 0x187da710, 0x9c636ee8, 0x3bbb7bdb, 0x267809cd, 0x5918f46e, 0x9ab701ec, 0x4f9aa883, 0x956e65e6, 0xffe67eaa, 0xbccf0821, 0x15e8e6ef, 0xe79bd9ba, 0x6f36ce4a, 0x9f09d4ea, 0xb07cd629, 0xa4b2af31, 0x3f23312a, 0xa59430c6, 0xa266c035, 0x4ebc3774, 0x82caa6fc, 0x90d0b0e0, 0xa7d81533, 0x04984af1, 0xecdaf741, 0xcd500e7f, 0x91f62f17, 0x4dd68d76, 0xefb04d43, 0xaa4d54cc, 0x9604dfe4, 0xd1b5e39e, 0x6a881b4c, 0x2c1fb8c1, 0x65517f46, 0x5eea049d, 0x8c355d01, 0x877473fa, 0x0b412efb, 0x671d5ab3, 0xdbd25292, 0x105633e9, 0xd647136d, 0xd7618c9a, 0xa10c7a37, 0xf8148e59, 0x133c89eb, 0xa927eece, 0x61c935b7, 0x1ce5ede1, 0x47b13c7a, 0xd2df599c, 0xf2733f55, 0x14ce7918, 0xc737bf73, 0xf7cdea53, 0xfdaa5b5f, 0x3d6f14df, 0x44db8678, 0xaff381ca, 0x68c43eb9, 0x24342c38, 0xa3405fc2, 0x1dc37216, 0xe2250cbc, 0x3c498b28, 0x0d9541ff, 0xa8017139, 0x0cb3de08, 0xb4e49cd8, 0x56c19064, 0xcb84617b, 0x32b670d5, 0x6c5c7448, 0xb85742d0];

        // Transformations for decryption key expansion
        var U1 = [0x00000000, 0x0e090d0b, 0x1c121a16, 0x121b171d, 0x3824342c, 0x362d3927, 0x24362e3a, 0x2a3f2331, 0x70486858, 0x7e416553, 0x6c5a724e, 0x62537f45, 0x486c5c74, 0x4665517f, 0x547e4662, 0x5a774b69, 0xe090d0b0, 0xee99ddbb, 0xfc82caa6, 0xf28bc7ad, 0xd8b4e49c, 0xd6bde997, 0xc4a6fe8a, 0xcaaff381, 0x90d8b8e8, 0x9ed1b5e3, 0x8ccaa2fe, 0x82c3aff5, 0xa8fc8cc4, 0xa6f581cf, 0xb4ee96d2, 0xbae79bd9, 0xdb3bbb7b, 0xd532b670, 0xc729a16d, 0xc920ac66, 0xe31f8f57, 0xed16825c, 0xff0d9541, 0xf104984a, 0xab73d323, 0xa57ade28, 0xb761c935, 0xb968c43e, 0x9357e70f, 0x9d5eea04, 0x8f45fd19, 0x814cf012, 0x3bab6bcb, 0x35a266c0, 0x27b971dd, 0x29b07cd6, 0x038f5fe7, 0x0d8652ec, 0x1f9d45f1, 0x119448fa, 0x4be30393, 0x45ea0e98, 0x57f11985, 0x59f8148e, 0x73c737bf, 0x7dce3ab4, 0x6fd52da9, 0x61dc20a2, 0xad766df6, 0xa37f60fd, 0xb16477e0, 0xbf6d7aeb, 0x955259da, 0x9b5b54d1, 0x894043cc, 0x87494ec7, 0xdd3e05ae, 0xd33708a5, 0xc12c1fb8, 0xcf2512b3, 0xe51a3182, 0xeb133c89, 0xf9082b94, 0xf701269f, 0x4de6bd46, 0x43efb04d, 0x51f4a750, 0x5ffdaa5b, 0x75c2896a, 0x7bcb8461, 0x69d0937c, 0x67d99e77, 0x3daed51e, 0x33a7d815, 0x21bccf08, 0x2fb5c203, 0x058ae132, 0x0b83ec39, 0x1998fb24, 0x1791f62f, 0x764dd68d, 0x7844db86, 0x6a5fcc9b, 0x6456c190, 0x4e69e2a1, 0x4060efaa, 0x527bf8b7, 0x5c72f5bc, 0x0605bed5, 0x080cb3de, 0x1a17a4c3, 0x141ea9c8, 0x3e218af9, 0x302887f2, 0x223390ef, 0x2c3a9de4, 0x96dd063d, 0x98d40b36, 0x8acf1c2b, 0x84c61120, 0xaef93211, 0xa0f03f1a, 0xb2eb2807, 0xbce2250c, 0xe6956e65, 0xe89c636e, 0xfa877473, 0xf48e7978, 0xdeb15a49, 0xd0b85742, 0xc2a3405f, 0xccaa4d54, 0x41ecdaf7, 0x4fe5d7fc, 0x5dfec0e1, 0x53f7cdea, 0x79c8eedb, 0x77c1e3d0, 0x65daf4cd, 0x6bd3f9c6, 0x31a4b2af, 0x3fadbfa4, 0x2db6a8b9, 0x23bfa5b2, 0x09808683, 0x07898b88, 0x15929c95, 0x1b9b919e, 0xa17c0a47, 0xaf75074c, 0xbd6e1051, 0xb3671d5a, 0x99583e6b, 0x97513360, 0x854a247d, 0x8b432976, 0xd134621f, 0xdf3d6f14, 0xcd267809, 0xc32f7502, 0xe9105633, 0xe7195b38, 0xf5024c25, 0xfb0b412e, 0x9ad7618c, 0x94de6c87, 0x86c57b9a, 0x88cc7691, 0xa2f355a0, 0xacfa58ab, 0xbee14fb6, 0xb0e842bd, 0xea9f09d4, 0xe49604df, 0xf68d13c2, 0xf8841ec9, 0xd2bb3df8, 0xdcb230f3, 0xcea927ee, 0xc0a02ae5, 0x7a47b13c, 0x744ebc37, 0x6655ab2a, 0x685ca621, 0x42638510, 0x4c6a881b, 0x5e719f06, 0x5078920d, 0x0a0fd964, 0x0406d46f, 0x161dc372, 0x1814ce79, 0x322bed48, 0x3c22e043, 0x2e39f75e, 0x2030fa55, 0xec9ab701, 0xe293ba0a, 0xf088ad17, 0xfe81a01c, 0xd4be832d, 0xdab78e26, 0xc8ac993b, 0xc6a59430, 0x9cd2df59, 0x92dbd252, 0x80c0c54f, 0x8ec9c844, 0xa4f6eb75, 0xaaffe67e, 0xb8e4f163, 0xb6edfc68, 0x0c0a67b1, 0x02036aba, 0x10187da7, 0x1e1170ac, 0x342e539d, 0x3a275e96, 0x283c498b, 0x26354480, 0x7c420fe9, 0x724b02e2, 0x605015ff, 0x6e5918f4, 0x44663bc5, 0x4a6f36ce, 0x587421d3, 0x567d2cd8, 0x37a10c7a, 0x39a80171, 0x2bb3166c, 0x25ba1b67, 0x0f853856, 0x018c355d, 0x13972240, 0x1d9e2f4b, 0x47e96422, 0x49e06929, 0x5bfb7e34, 0x55f2733f, 0x7fcd500e, 0x71c45d05, 0x63df4a18, 0x6dd64713, 0xd731dcca, 0xd938d1c1, 0xcb23c6dc, 0xc52acbd7, 0xef15e8e6, 0xe11ce5ed, 0xf307f2f0, 0xfd0efffb, 0xa779b492, 0xa970b999, 0xbb6bae84, 0xb562a38f, 0x9f5d80be, 0x91548db5, 0x834f9aa8, 0x8d4697a3];
        var U2 = [0x00000000, 0x0b0e090d, 0x161c121a, 0x1d121b17, 0x2c382434, 0x27362d39, 0x3a24362e, 0x312a3f23, 0x58704868, 0x537e4165, 0x4e6c5a72, 0x4562537f, 0x74486c5c, 0x7f466551, 0x62547e46, 0x695a774b, 0xb0e090d0, 0xbbee99dd, 0xa6fc82ca, 0xadf28bc7, 0x9cd8b4e4, 0x97d6bde9, 0x8ac4a6fe, 0x81caaff3, 0xe890d8b8, 0xe39ed1b5, 0xfe8ccaa2, 0xf582c3af, 0xc4a8fc8c, 0xcfa6f581, 0xd2b4ee96, 0xd9bae79b, 0x7bdb3bbb, 0x70d532b6, 0x6dc729a1, 0x66c920ac, 0x57e31f8f, 0x5ced1682, 0x41ff0d95, 0x4af10498, 0x23ab73d3, 0x28a57ade, 0x35b761c9, 0x3eb968c4, 0x0f9357e7, 0x049d5eea, 0x198f45fd, 0x12814cf0, 0xcb3bab6b, 0xc035a266, 0xdd27b971, 0xd629b07c, 0xe7038f5f, 0xec0d8652, 0xf11f9d45, 0xfa119448, 0x934be303, 0x9845ea0e, 0x8557f119, 0x8e59f814, 0xbf73c737, 0xb47dce3a, 0xa96fd52d, 0xa261dc20, 0xf6ad766d, 0xfda37f60, 0xe0b16477, 0xebbf6d7a, 0xda955259, 0xd19b5b54, 0xcc894043, 0xc787494e, 0xaedd3e05, 0xa5d33708, 0xb8c12c1f, 0xb3cf2512, 0x82e51a31, 0x89eb133c, 0x94f9082b, 0x9ff70126, 0x464de6bd, 0x4d43efb0, 0x5051f4a7, 0x5b5ffdaa, 0x6a75c289, 0x617bcb84, 0x7c69d093, 0x7767d99e, 0x1e3daed5, 0x1533a7d8, 0x0821bccf, 0x032fb5c2, 0x32058ae1, 0x390b83ec, 0x241998fb, 0x2f1791f6, 0x8d764dd6, 0x867844db, 0x9b6a5fcc, 0x906456c1, 0xa14e69e2, 0xaa4060ef, 0xb7527bf8, 0xbc5c72f5, 0xd50605be, 0xde080cb3, 0xc31a17a4, 0xc8141ea9, 0xf93e218a, 0xf2302887, 0xef223390, 0xe42c3a9d, 0x3d96dd06, 0x3698d40b, 0x2b8acf1c, 0x2084c611, 0x11aef932, 0x1aa0f03f, 0x07b2eb28, 0x0cbce225, 0x65e6956e, 0x6ee89c63, 0x73fa8774, 0x78f48e79, 0x49deb15a, 0x42d0b857, 0x5fc2a340, 0x54ccaa4d, 0xf741ecda, 0xfc4fe5d7, 0xe15dfec0, 0xea53f7cd, 0xdb79c8ee, 0xd077c1e3, 0xcd65daf4, 0xc66bd3f9, 0xaf31a4b2, 0xa43fadbf, 0xb92db6a8, 0xb223bfa5, 0x83098086, 0x8807898b, 0x9515929c, 0x9e1b9b91, 0x47a17c0a, 0x4caf7507, 0x51bd6e10, 0x5ab3671d, 0x6b99583e, 0x60975133, 0x7d854a24, 0x768b4329, 0x1fd13462, 0x14df3d6f, 0x09cd2678, 0x02c32f75, 0x33e91056, 0x38e7195b, 0x25f5024c, 0x2efb0b41, 0x8c9ad761, 0x8794de6c, 0x9a86c57b, 0x9188cc76, 0xa0a2f355, 0xabacfa58, 0xb6bee14f, 0xbdb0e842, 0xd4ea9f09, 0xdfe49604, 0xc2f68d13, 0xc9f8841e, 0xf8d2bb3d, 0xf3dcb230, 0xeecea927, 0xe5c0a02a, 0x3c7a47b1, 0x37744ebc, 0x2a6655ab, 0x21685ca6, 0x10426385, 0x1b4c6a88, 0x065e719f, 0x0d507892, 0x640a0fd9, 0x6f0406d4, 0x72161dc3, 0x791814ce, 0x48322bed, 0x433c22e0, 0x5e2e39f7, 0x552030fa, 0x01ec9ab7, 0x0ae293ba, 0x17f088ad, 0x1cfe81a0, 0x2dd4be83, 0x26dab78e, 0x3bc8ac99, 0x30c6a594, 0x599cd2df, 0x5292dbd2, 0x4f80c0c5, 0x448ec9c8, 0x75a4f6eb, 0x7eaaffe6, 0x63b8e4f1, 0x68b6edfc, 0xb10c0a67, 0xba02036a, 0xa710187d, 0xac1e1170, 0x9d342e53, 0x963a275e, 0x8b283c49, 0x80263544, 0xe97c420f, 0xe2724b02, 0xff605015, 0xf46e5918, 0xc544663b, 0xce4a6f36, 0xd3587421, 0xd8567d2c, 0x7a37a10c, 0x7139a801, 0x6c2bb316, 0x6725ba1b, 0x560f8538, 0x5d018c35, 0x40139722, 0x4b1d9e2f, 0x2247e964, 0x2949e069, 0x345bfb7e, 0x3f55f273, 0x0e7fcd50, 0x0571c45d, 0x1863df4a, 0x136dd647, 0xcad731dc, 0xc1d938d1, 0xdccb23c6, 0xd7c52acb, 0xe6ef15e8, 0xede11ce5, 0xf0f307f2, 0xfbfd0eff, 0x92a779b4, 0x99a970b9, 0x84bb6bae, 0x8fb562a3, 0xbe9f5d80, 0xb591548d, 0xa8834f9a, 0xa38d4697];
        var U3 = [0x00000000, 0x0d0b0e09, 0x1a161c12, 0x171d121b, 0x342c3824, 0x3927362d, 0x2e3a2436, 0x23312a3f, 0x68587048, 0x65537e41, 0x724e6c5a, 0x7f456253, 0x5c74486c, 0x517f4665, 0x4662547e, 0x4b695a77, 0xd0b0e090, 0xddbbee99, 0xcaa6fc82, 0xc7adf28b, 0xe49cd8b4, 0xe997d6bd, 0xfe8ac4a6, 0xf381caaf, 0xb8e890d8, 0xb5e39ed1, 0xa2fe8cca, 0xaff582c3, 0x8cc4a8fc, 0x81cfa6f5, 0x96d2b4ee, 0x9bd9bae7, 0xbb7bdb3b, 0xb670d532, 0xa16dc729, 0xac66c920, 0x8f57e31f, 0x825ced16, 0x9541ff0d, 0x984af104, 0xd323ab73, 0xde28a57a, 0xc935b761, 0xc43eb968, 0xe70f9357, 0xea049d5e, 0xfd198f45, 0xf012814c, 0x6bcb3bab, 0x66c035a2, 0x71dd27b9, 0x7cd629b0, 0x5fe7038f, 0x52ec0d86, 0x45f11f9d, 0x48fa1194, 0x03934be3, 0x0e9845ea, 0x198557f1, 0x148e59f8, 0x37bf73c7, 0x3ab47dce, 0x2da96fd5, 0x20a261dc, 0x6df6ad76, 0x60fda37f, 0x77e0b164, 0x7aebbf6d, 0x59da9552, 0x54d19b5b, 0x43cc8940, 0x4ec78749, 0x05aedd3e, 0x08a5d337, 0x1fb8c12c, 0x12b3cf25, 0x3182e51a, 0x3c89eb13, 0x2b94f908, 0x269ff701, 0xbd464de6, 0xb04d43ef, 0xa75051f4, 0xaa5b5ffd, 0x896a75c2, 0x84617bcb, 0x937c69d0, 0x9e7767d9, 0xd51e3dae, 0xd81533a7, 0xcf0821bc, 0xc2032fb5, 0xe132058a, 0xec390b83, 0xfb241998, 0xf62f1791, 0xd68d764d, 0xdb867844, 0xcc9b6a5f, 0xc1906456, 0xe2a14e69, 0xefaa4060, 0xf8b7527b, 0xf5bc5c72, 0xbed50605, 0xb3de080c, 0xa4c31a17, 0xa9c8141e, 0x8af93e21, 0x87f23028, 0x90ef2233, 0x9de42c3a, 0x063d96dd, 0x0b3698d4, 0x1c2b8acf, 0x112084c6, 0x3211aef9, 0x3f1aa0f0, 0x2807b2eb, 0x250cbce2, 0x6e65e695, 0x636ee89c, 0x7473fa87, 0x7978f48e, 0x5a49deb1, 0x5742d0b8, 0x405fc2a3, 0x4d54ccaa, 0xdaf741ec, 0xd7fc4fe5, 0xc0e15dfe, 0xcdea53f7, 0xeedb79c8, 0xe3d077c1, 0xf4cd65da, 0xf9c66bd3, 0xb2af31a4, 0xbfa43fad, 0xa8b92db6, 0xa5b223bf, 0x86830980, 0x8b880789, 0x9c951592, 0x919e1b9b, 0x0a47a17c, 0x074caf75, 0x1051bd6e, 0x1d5ab367, 0x3e6b9958, 0x33609751, 0x247d854a, 0x29768b43, 0x621fd134, 0x6f14df3d, 0x7809cd26, 0x7502c32f, 0x5633e910, 0x5b38e719, 0x4c25f502, 0x412efb0b, 0x618c9ad7, 0x6c8794de, 0x7b9a86c5, 0x769188cc, 0x55a0a2f3, 0x58abacfa, 0x4fb6bee1, 0x42bdb0e8, 0x09d4ea9f, 0x04dfe496, 0x13c2f68d, 0x1ec9f884, 0x3df8d2bb, 0x30f3dcb2, 0x27eecea9, 0x2ae5c0a0, 0xb13c7a47, 0xbc37744e, 0xab2a6655, 0xa621685c, 0x85104263, 0x881b4c6a, 0x9f065e71, 0x920d5078, 0xd9640a0f, 0xd46f0406, 0xc372161d, 0xce791814, 0xed48322b, 0xe0433c22, 0xf75e2e39, 0xfa552030, 0xb701ec9a, 0xba0ae293, 0xad17f088, 0xa01cfe81, 0x832dd4be, 0x8e26dab7, 0x993bc8ac, 0x9430c6a5, 0xdf599cd2, 0xd25292db, 0xc54f80c0, 0xc8448ec9, 0xeb75a4f6, 0xe67eaaff, 0xf163b8e4, 0xfc68b6ed, 0x67b10c0a, 0x6aba0203, 0x7da71018, 0x70ac1e11, 0x539d342e, 0x5e963a27, 0x498b283c, 0x44802635, 0x0fe97c42, 0x02e2724b, 0x15ff6050, 0x18f46e59, 0x3bc54466, 0x36ce4a6f, 0x21d35874, 0x2cd8567d, 0x0c7a37a1, 0x017139a8, 0x166c2bb3, 0x1b6725ba, 0x38560f85, 0x355d018c, 0x22401397, 0x2f4b1d9e, 0x642247e9, 0x692949e0, 0x7e345bfb, 0x733f55f2, 0x500e7fcd, 0x5d0571c4, 0x4a1863df, 0x47136dd6, 0xdccad731, 0xd1c1d938, 0xc6dccb23, 0xcbd7c52a, 0xe8e6ef15, 0xe5ede11c, 0xf2f0f307, 0xfffbfd0e, 0xb492a779, 0xb999a970, 0xae84bb6b, 0xa38fb562, 0x80be9f5d, 0x8db59154, 0x9aa8834f, 0x97a38d46];
        var U4 = [0x00000000, 0x090d0b0e, 0x121a161c, 0x1b171d12, 0x24342c38, 0x2d392736, 0x362e3a24, 0x3f23312a, 0x48685870, 0x4165537e, 0x5a724e6c, 0x537f4562, 0x6c5c7448, 0x65517f46, 0x7e466254, 0x774b695a, 0x90d0b0e0, 0x99ddbbee, 0x82caa6fc, 0x8bc7adf2, 0xb4e49cd8, 0xbde997d6, 0xa6fe8ac4, 0xaff381ca, 0xd8b8e890, 0xd1b5e39e, 0xcaa2fe8c, 0xc3aff582, 0xfc8cc4a8, 0xf581cfa6, 0xee96d2b4, 0xe79bd9ba, 0x3bbb7bdb, 0x32b670d5, 0x29a16dc7, 0x20ac66c9, 0x1f8f57e3, 0x16825ced, 0x0d9541ff, 0x04984af1, 0x73d323ab, 0x7ade28a5, 0x61c935b7, 0x68c43eb9, 0x57e70f93, 0x5eea049d, 0x45fd198f, 0x4cf01281, 0xab6bcb3b, 0xa266c035, 0xb971dd27, 0xb07cd629, 0x8f5fe703, 0x8652ec0d, 0x9d45f11f, 0x9448fa11, 0xe303934b, 0xea0e9845, 0xf1198557, 0xf8148e59, 0xc737bf73, 0xce3ab47d, 0xd52da96f, 0xdc20a261, 0x766df6ad, 0x7f60fda3, 0x6477e0b1, 0x6d7aebbf, 0x5259da95, 0x5b54d19b, 0x4043cc89, 0x494ec787, 0x3e05aedd, 0x3708a5d3, 0x2c1fb8c1, 0x2512b3cf, 0x1a3182e5, 0x133c89eb, 0x082b94f9, 0x01269ff7, 0xe6bd464d, 0xefb04d43, 0xf4a75051, 0xfdaa5b5f, 0xc2896a75, 0xcb84617b, 0xd0937c69, 0xd99e7767, 0xaed51e3d, 0xa7d81533, 0xbccf0821, 0xb5c2032f, 0x8ae13205, 0x83ec390b, 0x98fb2419, 0x91f62f17, 0x4dd68d76, 0x44db8678, 0x5fcc9b6a, 0x56c19064, 0x69e2a14e, 0x60efaa40, 0x7bf8b752, 0x72f5bc5c, 0x05bed506, 0x0cb3de08, 0x17a4c31a, 0x1ea9c814, 0x218af93e, 0x2887f230, 0x3390ef22, 0x3a9de42c, 0xdd063d96, 0xd40b3698, 0xcf1c2b8a, 0xc6112084, 0xf93211ae, 0xf03f1aa0, 0xeb2807b2, 0xe2250cbc, 0x956e65e6, 0x9c636ee8, 0x877473fa, 0x8e7978f4, 0xb15a49de, 0xb85742d0, 0xa3405fc2, 0xaa4d54cc, 0xecdaf741, 0xe5d7fc4f, 0xfec0e15d, 0xf7cdea53, 0xc8eedb79, 0xc1e3d077, 0xdaf4cd65, 0xd3f9c66b, 0xa4b2af31, 0xadbfa43f, 0xb6a8b92d, 0xbfa5b223, 0x80868309, 0x898b8807, 0x929c9515, 0x9b919e1b, 0x7c0a47a1, 0x75074caf, 0x6e1051bd, 0x671d5ab3, 0x583e6b99, 0x51336097, 0x4a247d85, 0x4329768b, 0x34621fd1, 0x3d6f14df, 0x267809cd, 0x2f7502c3, 0x105633e9, 0x195b38e7, 0x024c25f5, 0x0b412efb, 0xd7618c9a, 0xde6c8794, 0xc57b9a86, 0xcc769188, 0xf355a0a2, 0xfa58abac, 0xe14fb6be, 0xe842bdb0, 0x9f09d4ea, 0x9604dfe4, 0x8d13c2f6, 0x841ec9f8, 0xbb3df8d2, 0xb230f3dc, 0xa927eece, 0xa02ae5c0, 0x47b13c7a, 0x4ebc3774, 0x55ab2a66, 0x5ca62168, 0x63851042, 0x6a881b4c, 0x719f065e, 0x78920d50, 0x0fd9640a, 0x06d46f04, 0x1dc37216, 0x14ce7918, 0x2bed4832, 0x22e0433c, 0x39f75e2e, 0x30fa5520, 0x9ab701ec, 0x93ba0ae2, 0x88ad17f0, 0x81a01cfe, 0xbe832dd4, 0xb78e26da, 0xac993bc8, 0xa59430c6, 0xd2df599c, 0xdbd25292, 0xc0c54f80, 0xc9c8448e, 0xf6eb75a4, 0xffe67eaa, 0xe4f163b8, 0xedfc68b6, 0x0a67b10c, 0x036aba02, 0x187da710, 0x1170ac1e, 0x2e539d34, 0x275e963a, 0x3c498b28, 0x35448026, 0x420fe97c, 0x4b02e272, 0x5015ff60, 0x5918f46e, 0x663bc544, 0x6f36ce4a, 0x7421d358, 0x7d2cd856, 0xa10c7a37, 0xa8017139, 0xb3166c2b, 0xba1b6725, 0x8538560f, 0x8c355d01, 0x97224013, 0x9e2f4b1d, 0xe9642247, 0xe0692949, 0xfb7e345b, 0xf2733f55, 0xcd500e7f, 0xc45d0571, 0xdf4a1863, 0xd647136d, 0x31dccad7, 0x38d1c1d9, 0x23c6dccb, 0x2acbd7c5, 0x15e8e6ef, 0x1ce5ede1, 0x07f2f0f3, 0x0efffbfd, 0x79b492a7, 0x70b999a9, 0x6bae84bb, 0x62a38fb5, 0x5d80be9f, 0x548db591, 0x4f9aa883, 0x4697a38d];

        function convertToInt32(bytes) {
            var result = [];
            for (var i = 0; i < bytes.length; i += 4) {
                result.push(
                    (bytes[i    ] << 24) |
                    (bytes[i + 1] << 16) |
                    (bytes[i + 2] <<  8) |
                     bytes[i + 3]
                );
            }
            return result;
        }

        var AES = function(key) {
            if (!(this instanceof AES)) {
                throw Error('AES must be instanitated with `new`');
            }

            Object.defineProperty(this, 'key', {
                value: coerceArray(key, true)
            });

            this._prepare();
        };


        AES.prototype._prepare = function() {

            var rounds = numberOfRounds[this.key.length];
            if (rounds == null) {
                throw new Error('invalid key size (must be 16, 24 or 32 bytes)');
            }

            // encryption round keys
            this._Ke = [];

            // decryption round keys
            this._Kd = [];

            for (var i = 0; i <= rounds; i++) {
                this._Ke.push([0, 0, 0, 0]);
                this._Kd.push([0, 0, 0, 0]);
            }

            var roundKeyCount = (rounds + 1) * 4;
            var KC = this.key.length / 4;

            // convert the key into ints
            var tk = convertToInt32(this.key);

            // copy values into round key arrays
            var index;
            for (var i = 0; i < KC; i++) {
                index = i >> 2;
                this._Ke[index][i % 4] = tk[i];
                this._Kd[rounds - index][i % 4] = tk[i];
            }

            // key expansion (fips-197 section 5.2)
            var rconpointer = 0;
            var t = KC, tt;
            while (t < roundKeyCount) {
                tt = tk[KC - 1];
                tk[0] ^= ((S[(tt >> 16) & 0xFF] << 24) ^
                          (S[(tt >>  8) & 0xFF] << 16) ^
                          (S[ tt        & 0xFF] <<  8) ^
                           S[(tt >> 24) & 0xFF]        ^
                          (rcon[rconpointer] << 24));
                rconpointer += 1;

                // key expansion (for non-256 bit)
                if (KC != 8) {
                    for (var i = 1; i < KC; i++) {
                        tk[i] ^= tk[i - 1];
                    }

                // key expansion for 256-bit keys is "slightly different" (fips-197)
                } else {
                    for (var i = 1; i < (KC / 2); i++) {
                        tk[i] ^= tk[i - 1];
                    }
                    tt = tk[(KC / 2) - 1];

                    tk[KC / 2] ^= (S[ tt        & 0xFF]        ^
                                  (S[(tt >>  8) & 0xFF] <<  8) ^
                                  (S[(tt >> 16) & 0xFF] << 16) ^
                                  (S[(tt >> 24) & 0xFF] << 24));

                    for (var i = (KC / 2) + 1; i < KC; i++) {
                        tk[i] ^= tk[i - 1];
                    }
                }

                // copy values into round key arrays
                var i = 0, r, c;
                while (i < KC && t < roundKeyCount) {
                    r = t >> 2;
                    c = t % 4;
                    this._Ke[r][c] = tk[i];
                    this._Kd[rounds - r][c] = tk[i++];
                    t++;
                }
            }

            // inverse-cipher-ify the decryption round key (fips-197 section 5.3)
            for (var r = 1; r < rounds; r++) {
                for (var c = 0; c < 4; c++) {
                    tt = this._Kd[r][c];
                    this._Kd[r][c] = (U1[(tt >> 24) & 0xFF] ^
                                      U2[(tt >> 16) & 0xFF] ^
                                      U3[(tt >>  8) & 0xFF] ^
                                      U4[ tt        & 0xFF]);
                }
            }
        };

        AES.prototype.encrypt = function(plaintext) {
            if (plaintext.length != 16) {
                throw new Error('invalid plaintext size (must be 16 bytes)');
            }

            var rounds = this._Ke.length - 1;
            var a = [0, 0, 0, 0];

            // convert plaintext to (ints ^ key)
            var t = convertToInt32(plaintext);
            for (var i = 0; i < 4; i++) {
                t[i] ^= this._Ke[0][i];
            }

            // apply round transforms
            for (var r = 1; r < rounds; r++) {
                for (var i = 0; i < 4; i++) {
                    a[i] = (T1[(t[ i         ] >> 24) & 0xff] ^
                            T2[(t[(i + 1) % 4] >> 16) & 0xff] ^
                            T3[(t[(i + 2) % 4] >>  8) & 0xff] ^
                            T4[ t[(i + 3) % 4]        & 0xff] ^
                            this._Ke[r][i]);
                }
                t = a.slice();
            }

            // the last round is special
            var result = createArray(16), tt;
            for (var i = 0; i < 4; i++) {
                tt = this._Ke[rounds][i];
                result[4 * i    ] = (S[(t[ i         ] >> 24) & 0xff] ^ (tt >> 24)) & 0xff;
                result[4 * i + 1] = (S[(t[(i + 1) % 4] >> 16) & 0xff] ^ (tt >> 16)) & 0xff;
                result[4 * i + 2] = (S[(t[(i + 2) % 4] >>  8) & 0xff] ^ (tt >>  8)) & 0xff;
                result[4 * i + 3] = (S[ t[(i + 3) % 4]        & 0xff] ^  tt       ) & 0xff;
            }

            return result;
        };

        AES.prototype.decrypt = function(ciphertext) {
            if (ciphertext.length != 16) {
                throw new Error('invalid ciphertext size (must be 16 bytes)');
            }

            var rounds = this._Kd.length - 1;
            var a = [0, 0, 0, 0];

            // convert plaintext to (ints ^ key)
            var t = convertToInt32(ciphertext);
            for (var i = 0; i < 4; i++) {
                t[i] ^= this._Kd[0][i];
            }

            // apply round transforms
            for (var r = 1; r < rounds; r++) {
                for (var i = 0; i < 4; i++) {
                    a[i] = (T5[(t[ i          ] >> 24) & 0xff] ^
                            T6[(t[(i + 3) % 4] >> 16) & 0xff] ^
                            T7[(t[(i + 2) % 4] >>  8) & 0xff] ^
                            T8[ t[(i + 1) % 4]        & 0xff] ^
                            this._Kd[r][i]);
                }
                t = a.slice();
            }

            // the last round is special
            var result = createArray(16), tt;
            for (var i = 0; i < 4; i++) {
                tt = this._Kd[rounds][i];
                result[4 * i    ] = (Si[(t[ i         ] >> 24) & 0xff] ^ (tt >> 24)) & 0xff;
                result[4 * i + 1] = (Si[(t[(i + 3) % 4] >> 16) & 0xff] ^ (tt >> 16)) & 0xff;
                result[4 * i + 2] = (Si[(t[(i + 2) % 4] >>  8) & 0xff] ^ (tt >>  8)) & 0xff;
                result[4 * i + 3] = (Si[ t[(i + 1) % 4]        & 0xff] ^  tt       ) & 0xff;
            }

            return result;
        };


        /**
         *  Mode Of Operation - Electonic Codebook (ECB)
         */
        var ModeOfOperationECB = function(key) {
            if (!(this instanceof ModeOfOperationECB)) {
                throw Error('AES must be instanitated with `new`');
            }

            this.description = "Electronic Code Block";
            this.name = "ecb";

            this._aes = new AES(key);
        };

        ModeOfOperationECB.prototype.encrypt = function(plaintext) {
            plaintext = coerceArray(plaintext);

            if ((plaintext.length % 16) !== 0) {
                throw new Error('invalid plaintext size (must be multiple of 16 bytes)');
            }

            var ciphertext = createArray(plaintext.length);
            var block = createArray(16);

            for (var i = 0; i < plaintext.length; i += 16) {
                copyArray(plaintext, block, 0, i, i + 16);
                block = this._aes.encrypt(block);
                copyArray(block, ciphertext, i);
            }

            return ciphertext;
        };

        ModeOfOperationECB.prototype.decrypt = function(ciphertext) {
            ciphertext = coerceArray(ciphertext);

            if ((ciphertext.length % 16) !== 0) {
                throw new Error('invalid ciphertext size (must be multiple of 16 bytes)');
            }

            var plaintext = createArray(ciphertext.length);
            var block = createArray(16);

            for (var i = 0; i < ciphertext.length; i += 16) {
                copyArray(ciphertext, block, 0, i, i + 16);
                block = this._aes.decrypt(block);
                copyArray(block, plaintext, i);
            }

            return plaintext;
        };


        /**
         *  Mode Of Operation - Cipher Block Chaining (CBC)
         */
        var ModeOfOperationCBC = function(key, iv) {
            if (!(this instanceof ModeOfOperationCBC)) {
                throw Error('AES must be instanitated with `new`');
            }

            this.description = "Cipher Block Chaining";
            this.name = "cbc";

            if (!iv) {
                iv = createArray(16);

            } else if (iv.length != 16) {
                throw new Error('invalid initialation vector size (must be 16 bytes)');
            }

            this._lastCipherblock = coerceArray(iv, true);

            this._aes = new AES(key);
        };

        ModeOfOperationCBC.prototype.encrypt = function(plaintext) {
            plaintext = coerceArray(plaintext);

            if ((plaintext.length % 16) !== 0) {
                throw new Error('invalid plaintext size (must be multiple of 16 bytes)');
            }

            var ciphertext = createArray(plaintext.length);
            var block = createArray(16);

            for (var i = 0; i < plaintext.length; i += 16) {
                copyArray(plaintext, block, 0, i, i + 16);

                for (var j = 0; j < 16; j++) {
                    block[j] ^= this._lastCipherblock[j];
                }

                this._lastCipherblock = this._aes.encrypt(block);
                copyArray(this._lastCipherblock, ciphertext, i);
            }

            return ciphertext;
        };

        ModeOfOperationCBC.prototype.decrypt = function(ciphertext) {
            ciphertext = coerceArray(ciphertext);

            if ((ciphertext.length % 16) !== 0) {
                throw new Error('invalid ciphertext size (must be multiple of 16 bytes)');
            }

            var plaintext = createArray(ciphertext.length);
            var block = createArray(16);

            for (var i = 0; i < ciphertext.length; i += 16) {
                copyArray(ciphertext, block, 0, i, i + 16);
                block = this._aes.decrypt(block);

                for (var j = 0; j < 16; j++) {
                    plaintext[i + j] = block[j] ^ this._lastCipherblock[j];
                }

                copyArray(ciphertext, this._lastCipherblock, 0, i, i + 16);
            }

            return plaintext;
        };


        /**
         *  Mode Of Operation - Cipher Feedback (CFB)
         */
        var ModeOfOperationCFB = function(key, iv, segmentSize) {
            if (!(this instanceof ModeOfOperationCFB)) {
                throw Error('AES must be instanitated with `new`');
            }

            this.description = "Cipher Feedback";
            this.name = "cfb";

            if (!iv) {
                iv = createArray(16);

            } else if (iv.length != 16) {
                throw new Error('invalid initialation vector size (must be 16 size)');
            }

            if (!segmentSize) { segmentSize = 1; }

            this.segmentSize = segmentSize;

            this._shiftRegister = coerceArray(iv, true);

            this._aes = new AES(key);
        };

        ModeOfOperationCFB.prototype.encrypt = function(plaintext) {
            if ((plaintext.length % this.segmentSize) != 0) {
                throw new Error('invalid plaintext size (must be segmentSize bytes)');
            }

            var encrypted = coerceArray(plaintext, true);

            var xorSegment;
            for (var i = 0; i < encrypted.length; i += this.segmentSize) {
                xorSegment = this._aes.encrypt(this._shiftRegister);
                for (var j = 0; j < this.segmentSize; j++) {
                    encrypted[i + j] ^= xorSegment[j];
                }

                // Shift the register
                copyArray(this._shiftRegister, this._shiftRegister, 0, this.segmentSize);
                copyArray(encrypted, this._shiftRegister, 16 - this.segmentSize, i, i + this.segmentSize);
            }

            return encrypted;
        };

        ModeOfOperationCFB.prototype.decrypt = function(ciphertext) {
            if ((ciphertext.length % this.segmentSize) != 0) {
                throw new Error('invalid ciphertext size (must be segmentSize bytes)');
            }

            var plaintext = coerceArray(ciphertext, true);

            var xorSegment;
            for (var i = 0; i < plaintext.length; i += this.segmentSize) {
                xorSegment = this._aes.encrypt(this._shiftRegister);

                for (var j = 0; j < this.segmentSize; j++) {
                    plaintext[i + j] ^= xorSegment[j];
                }

                // Shift the register
                copyArray(this._shiftRegister, this._shiftRegister, 0, this.segmentSize);
                copyArray(ciphertext, this._shiftRegister, 16 - this.segmentSize, i, i + this.segmentSize);
            }

            return plaintext;
        };

        /**
         *  Mode Of Operation - Output Feedback (OFB)
         */
        var ModeOfOperationOFB = function(key, iv) {
            if (!(this instanceof ModeOfOperationOFB)) {
                throw Error('AES must be instanitated with `new`');
            }

            this.description = "Output Feedback";
            this.name = "ofb";

            if (!iv) {
                iv = createArray(16);

            } else if (iv.length != 16) {
                throw new Error('invalid initialation vector size (must be 16 bytes)');
            }

            this._lastPrecipher = coerceArray(iv, true);
            this._lastPrecipherIndex = 16;

            this._aes = new AES(key);
        };

        ModeOfOperationOFB.prototype.encrypt = function(plaintext) {
            var encrypted = coerceArray(plaintext, true);

            for (var i = 0; i < encrypted.length; i++) {
                if (this._lastPrecipherIndex === 16) {
                    this._lastPrecipher = this._aes.encrypt(this._lastPrecipher);
                    this._lastPrecipherIndex = 0;
                }
                encrypted[i] ^= this._lastPrecipher[this._lastPrecipherIndex++];
            }

            return encrypted;
        };

        // Decryption is symetric
        ModeOfOperationOFB.prototype.decrypt = ModeOfOperationOFB.prototype.encrypt;


        /**
         *  Counter object for CTR common mode of operation
         */
        var Counter = function(initialValue) {
            if (!(this instanceof Counter)) {
                throw Error('Counter must be instanitated with `new`');
            }

            // We allow 0, but anything false-ish uses the default 1
            if (initialValue !== 0 && !initialValue) { initialValue = 1; }

            if (typeof(initialValue) === 'number') {
                this._counter = createArray(16);
                this.setValue(initialValue);

            } else {
                this.setBytes(initialValue);
            }
        };

        Counter.prototype.setValue = function(value) {
            if (typeof(value) !== 'number' || parseInt(value) != value) {
                throw new Error('invalid counter value (must be an integer)');
            }

            // We cannot safely handle numbers beyond the safe range for integers
            if (value > Number.MAX_SAFE_INTEGER) {
                throw new Error('integer value out of safe range');
            }

            for (var index = 15; index >= 0; --index) {
                this._counter[index] = value % 256;
                value = parseInt(value / 256);
            }
        };

        Counter.prototype.setBytes = function(bytes) {
            bytes = coerceArray(bytes, true);

            if (bytes.length != 16) {
                throw new Error('invalid counter bytes size (must be 16 bytes)');
            }

            this._counter = bytes;
        };

        Counter.prototype.increment = function() {
            for (var i = 15; i >= 0; i--) {
                if (this._counter[i] === 255) {
                    this._counter[i] = 0;
                } else {
                    this._counter[i]++;
                    break;
                }
            }
        };


        /**
         *  Mode Of Operation - Counter (CTR)
         */
        var ModeOfOperationCTR = function(key, counter) {
            if (!(this instanceof ModeOfOperationCTR)) {
                throw Error('AES must be instanitated with `new`');
            }

            this.description = "Counter";
            this.name = "ctr";

            if (!(counter instanceof Counter)) {
                counter = new Counter(counter);
            }

            this._counter = counter;

            this._remainingCounter = null;
            this._remainingCounterIndex = 16;

            this._aes = new AES(key);
        };

        ModeOfOperationCTR.prototype.encrypt = function(plaintext) {
            var encrypted = coerceArray(plaintext, true);

            for (var i = 0; i < encrypted.length; i++) {
                if (this._remainingCounterIndex === 16) {
                    this._remainingCounter = this._aes.encrypt(this._counter._counter);
                    this._remainingCounterIndex = 0;
                    this._counter.increment();
                }
                encrypted[i] ^= this._remainingCounter[this._remainingCounterIndex++];
            }

            return encrypted;
        };

        // Decryption is symetric
        ModeOfOperationCTR.prototype.decrypt = ModeOfOperationCTR.prototype.encrypt;


        ///////////////////////
        // Padding

        // See:https://tools.ietf.org/html/rfc2315
        function pkcs7pad(data) {
            data = coerceArray(data, true);
            var padder = 16 - (data.length % 16);
            var result = createArray(data.length + padder);
            copyArray(data, result);
            for (var i = data.length; i < result.length; i++) {
                result[i] = padder;
            }
            return result;
        }

        function pkcs7strip(data) {
            data = coerceArray(data, true);
            if (data.length < 16) { throw new Error('PKCS#7 invalid length'); }

            var padder = data[data.length - 1];
            if (padder > 16) { throw new Error('PKCS#7 padding byte out of range'); }

            var length = data.length - padder;
            for (var i = 0; i < padder; i++) {
                if (data[length + i] !== padder) {
                    throw new Error('PKCS#7 invalid padding byte');
                }
            }

            var result = createArray(length);
            copyArray(data, result, 0, 0, length);
            return result;
        }

        ///////////////////////
        // Exporting


        // The block cipher
        var aesjs = {
            AES: AES,
            Counter: Counter,

            ModeOfOperation: {
                ecb: ModeOfOperationECB,
                cbc: ModeOfOperationCBC,
                cfb: ModeOfOperationCFB,
                ofb: ModeOfOperationOFB,
                ctr: ModeOfOperationCTR
            },

            utils: {
                hex: convertHex,
                utf8: convertUtf8
            },

            padding: {
                pkcs7: {
                    pad: pkcs7pad,
                    strip: pkcs7strip
                }
            },

            _arrayTest: {
                coerceArray: coerceArray,
                createArray: createArray,
                copyArray: copyArray,
            }
        };


        // node.js
        {
            module.exports = aesjs;

        // RequireJS/AMD
        // http://www.requirejs.org/docs/api.html
        // https://github.com/amdjs/amdjs-api/wiki/AMD
        }


    })();
    });

    const SIGNIFICANT_BITS = 7n,
      CONTINUE = 1n << SIGNIFICANT_BITS,
      REST_MASK = CONTINUE - 1n;

    function encode(value) {
      let out = { length: Infinity };
      out.length = encodeInto(value, out);
      return Uint8Array.from(out);
    }

    function encodeInto(value, byteArray, offset = 0) {
      value = BigInt(value);

      if (value < 0) {
        value = -value;
        --value;
        value <<= 1n;
        value |= 1n;
      } else {
        value <<= 1n;
      }

      while (value >= CONTINUE && offset < byteArray.length) {
        byteArray[offset] = Number((value & REST_MASK) | CONTINUE);
        value >>= SIGNIFICANT_BITS;
        --value;
        ++offset;
      }

      if (offset >= byteArray.length) {
        throw new Error('insufficient space');
      }

      byteArray[offset] = Number(value);
      ++offset;

      return offset;
    }

    function decode(byteArray, offset = 0) {
      return decodeWithOffset(byteArray, offset).value;
    }

    function decodeWithOffset(byteArray, startingOffset = 0) {
      let finalOffset = startingOffset;
      while (finalOffset < byteArray.length - 1 && (byteArray[finalOffset] & 0x80) === 0x80) {
        ++finalOffset;
      }

      let value = -1n;
      for (let offset = finalOffset; offset >= startingOffset; --offset) {
        ++value;
        value <<= SIGNIFICANT_BITS;
        value |= BigInt(byteArray[offset]) & REST_MASK;
      }

      if ((value & 1n) === 1n) {
        value >>= 1n;
        ++value;
        value = -value;
      } else {
        value >>= 1n;
      }

      return {
        value,
        followingOffset: finalOffset + 1,
      };
    }

    var bigintSerialiser = {
      encode,
      encodeInto,
      decode,
      decodeWithOffset,
    };

    var encryptDecrypt = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decrypt = exports.encrypt = void 0;

    let { encodeInto } = bigintSerialiser;
    function encrypt(key, plaintext) {
        let textBytes = aesJs.utils.utf8.toBytes(plaintext);
        let keyBytes = new Uint8Array(100); // [ 0, 0, 0, 0, 0 ]
        encodeInto(key, keyBytes); // 4
        let aesCtr = new aesJs.ModeOfOperation.ctr(keyBytes.slice(0, 32), new aesJs.Counter(5));
        let encryptedBytes = aesCtr.encrypt(textBytes);
        let encryptedHex = aesJs.utils.hex.fromBytes(encryptedBytes);
        return encryptedHex;
    }
    exports.encrypt = encrypt;
    function decrypt(key, ciphertext) {
        var ciphertextBytes = aesJs.utils.hex.toBytes(ciphertext);
        let keyBytes = new Uint8Array(100); // [ 0, 0, 0, 0, 0 ]
        encodeInto(key, keyBytes); // 4
        let aesCtr = new aesJs.ModeOfOperation.ctr(keyBytes.slice(0, 32), new aesJs.Counter(5));
        var decryptedBytes = aesCtr.decrypt(ciphertextBytes);
        // Convert our bytes back into text
        var decryptedText = aesJs.utils.utf8.fromBytes(decryptedBytes);
        return decryptedText;
    }
    exports.decrypt = decrypt;

    });

    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };

    const ecc_math = __importStar(src);

    const ed = __importStar(encryptDecrypt);
    function initializePublicEnv() {
        //Setup Curve secp256k1
        let g = new ecc_math.ModPoint(0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n, 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n);
        let secp256k1 = new ecc_math.Curve(0n, 7n, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n, 2n ** 256n - 2n ** 32n - 977n, g);
        return [secp256k1, g];
    }
    class ECCM {
        ECC;
        constructor(id) {
            let [C, g] = initializePublicEnv();
            this.ECC = new ECC.ECCInstance(C, g, id);
        }
        generateSharedKey(recipientPubKey) {
            this.ECC.generateSharedKey(recipientPubKey);
        }
        encrypt(plaintext) {
            const KEY = this.ECC.getSharedKey()["x"];
            return ed.encrypt(KEY, plaintext);
        }
        decrypt(ciphertext) {
            const KEY = this.ECC.getSharedKey()["x"];
            return ed.decrypt(KEY, ciphertext);
        }
        decryptWKey(key, ciphertext) {
            return ed.decrypt(key, ciphertext);
        }
    }
    var _default = ECCM;

    /*! js-cookie v3.0.1 | MIT */
    /* eslint-disable no-var */
    function assign (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          target[key] = source[key];
        }
      }
      return target
    }
    /* eslint-enable no-var */

    /* eslint-disable no-var */
    var defaultConverter = {
      read: function (value) {
        if (value[0] === '"') {
          value = value.slice(1, -1);
        }
        return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
      },
      write: function (value) {
        return encodeURIComponent(value).replace(
          /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
          decodeURIComponent
        )
      }
    };
    /* eslint-enable no-var */

    /* eslint-disable no-var */

    function init (converter, defaultAttributes) {
      function set (key, value, attributes) {
        if (typeof document === 'undefined') {
          return
        }

        attributes = assign({}, defaultAttributes, attributes);

        if (typeof attributes.expires === 'number') {
          attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
        }
        if (attributes.expires) {
          attributes.expires = attributes.expires.toUTCString();
        }

        key = encodeURIComponent(key)
          .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
          .replace(/[()]/g, escape);

        var stringifiedAttributes = '';
        for (var attributeName in attributes) {
          if (!attributes[attributeName]) {
            continue
          }

          stringifiedAttributes += '; ' + attributeName;

          if (attributes[attributeName] === true) {
            continue
          }

          // Considers RFC 6265 section 5.2:
          // ...
          // 3.  If the remaining unparsed-attributes contains a %x3B (";")
          //     character:
          // Consume the characters of the unparsed-attributes up to,
          // not including, the first %x3B (";") character.
          // ...
          stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
        }

        return (document.cookie =
          key + '=' + converter.write(value, key) + stringifiedAttributes)
      }

      function get (key) {
        if (typeof document === 'undefined' || (arguments.length && !key)) {
          return
        }

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all.
        var cookies = document.cookie ? document.cookie.split('; ') : [];
        var jar = {};
        for (var i = 0; i < cookies.length; i++) {
          var parts = cookies[i].split('=');
          var value = parts.slice(1).join('=');

          try {
            var foundKey = decodeURIComponent(parts[0]);
            jar[foundKey] = converter.read(value, foundKey);

            if (key === foundKey) {
              break
            }
          } catch (e) {}
        }

        return key ? jar[key] : jar
      }

      return Object.create(
        {
          set: set,
          get: get,
          remove: function (key, attributes) {
            set(
              key,
              '',
              assign({}, attributes, {
                expires: -1
              })
            );
          },
          withAttributes: function (attributes) {
            return init(this.converter, assign({}, this.attributes, attributes))
          },
          withConverter: function (converter) {
            return init(assign({}, this.converter, converter), this.attributes)
          }
        },
        {
          attributes: { value: Object.freeze(defaultAttributes) },
          converter: { value: Object.freeze(converter) }
        }
      )
    }

    var api = init(defaultConverter, { path: '/' });

    var SECONDS_A_MINUTE = 60;
    var SECONDS_A_HOUR = SECONDS_A_MINUTE * 60;
    var SECONDS_A_DAY = SECONDS_A_HOUR * 24;
    var SECONDS_A_WEEK = SECONDS_A_DAY * 7;
    var MILLISECONDS_A_SECOND = 1e3;
    var MILLISECONDS_A_MINUTE = SECONDS_A_MINUTE * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_HOUR = SECONDS_A_HOUR * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_DAY = SECONDS_A_DAY * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_WEEK = SECONDS_A_WEEK * MILLISECONDS_A_SECOND; // English locales

    var MS = 'millisecond';
    var S = 'second';
    var MIN = 'minute';
    var H = 'hour';
    var D = 'day';
    var W = 'week';
    var M = 'month';
    var Q = 'quarter';
    var Y = 'year';
    var DATE = 'date';
    var FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ';
    var INVALID_DATE_STRING = 'Invalid Date'; // regex

    var REGEX_PARSE = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/;
    var REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;

    // English [en]
    // We don't need weekdaysShort, weekdaysMin, monthsShort in en.js locale
    var en = {
      name: 'en',
      weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
      months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
    };

    var padStart = function padStart(string, length, pad) {
      var s = String(string);
      if (!s || s.length >= length) return string;
      return "" + Array(length + 1 - s.length).join(pad) + string;
    };

    var padZoneStr = function padZoneStr(instance) {
      var negMinutes = -instance.utcOffset();
      var minutes = Math.abs(negMinutes);
      var hourOffset = Math.floor(minutes / 60);
      var minuteOffset = minutes % 60;
      return "" + (negMinutes <= 0 ? '+' : '-') + padStart(hourOffset, 2, '0') + ":" + padStart(minuteOffset, 2, '0');
    };

    var monthDiff = function monthDiff(a, b) {
      // function from moment.js in order to keep the same result
      if (a.date() < b.date()) return -monthDiff(b, a);
      var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month());
      var anchor = a.clone().add(wholeMonthDiff, M);
      var c = b - anchor < 0;
      var anchor2 = a.clone().add(wholeMonthDiff + (c ? -1 : 1), M);
      return +(-(wholeMonthDiff + (b - anchor) / (c ? anchor - anchor2 : anchor2 - anchor)) || 0);
    };

    var absFloor = function absFloor(n) {
      return n < 0 ? Math.ceil(n) || 0 : Math.floor(n);
    };

    var prettyUnit = function prettyUnit(u) {
      var special = {
        M: M,
        y: Y,
        w: W,
        d: D,
        D: DATE,
        h: H,
        m: MIN,
        s: S,
        ms: MS,
        Q: Q
      };
      return special[u] || String(u || '').toLowerCase().replace(/s$/, '');
    };

    var isUndefined = function isUndefined(s) {
      return s === undefined;
    };

    var U = {
      s: padStart,
      z: padZoneStr,
      m: monthDiff,
      a: absFloor,
      p: prettyUnit,
      u: isUndefined
    };

    var L = 'en'; // global locale

    var Ls = {}; // global loaded locale

    Ls[L] = en;

    var isDayjs = function isDayjs(d) {
      return d instanceof Dayjs;
    }; // eslint-disable-line no-use-before-define


    var parseLocale = function parseLocale(preset, object, isLocal) {
      var l;
      if (!preset) return L;

      if (typeof preset === 'string') {
        var presetLower = preset.toLowerCase();

        if (Ls[presetLower]) {
          l = presetLower;
        }

        if (object) {
          Ls[presetLower] = object;
          l = presetLower;
        }

        var presetSplit = preset.split('-');

        if (!l && presetSplit.length > 1) {
          return parseLocale(presetSplit[0]);
        }
      } else {
        var name = preset.name;
        Ls[name] = preset;
        l = name;
      }

      if (!isLocal && l) L = l;
      return l || !isLocal && L;
    };

    var dayjs = function dayjs(date, c) {
      if (isDayjs(date)) {
        return date.clone();
      } // eslint-disable-next-line no-nested-ternary


      var cfg = typeof c === 'object' ? c : {};
      cfg.date = date;
      cfg.args = arguments; // eslint-disable-line prefer-rest-params

      return new Dayjs(cfg); // eslint-disable-line no-use-before-define
    };

    var wrapper = function wrapper(date, instance) {
      return dayjs(date, {
        locale: instance.$L,
        utc: instance.$u,
        x: instance.$x,
        $offset: instance.$offset // todo: refactor; do not use this.$offset in you code

      });
    };

    var Utils = U; // for plugin use

    Utils.l = parseLocale;
    Utils.i = isDayjs;
    Utils.w = wrapper;

    var parseDate = function parseDate(cfg) {
      var date = cfg.date,
          utc = cfg.utc;
      if (date === null) return new Date(NaN); // null is invalid

      if (Utils.u(date)) return new Date(); // today

      if (date instanceof Date) return new Date(date);

      if (typeof date === 'string' && !/Z$/i.test(date)) {
        var d = date.match(REGEX_PARSE);

        if (d) {
          var m = d[2] - 1 || 0;
          var ms = (d[7] || '0').substring(0, 3);

          if (utc) {
            return new Date(Date.UTC(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms));
          }

          return new Date(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms);
        }
      }

      return new Date(date); // everything else
    };

    var Dayjs = /*#__PURE__*/function () {
      function Dayjs(cfg) {
        this.$L = parseLocale(cfg.locale, null, true);
        this.parse(cfg); // for plugin
      }

      var _proto = Dayjs.prototype;

      _proto.parse = function parse(cfg) {
        this.$d = parseDate(cfg);
        this.$x = cfg.x || {};
        this.init();
      };

      _proto.init = function init() {
        var $d = this.$d;
        this.$y = $d.getFullYear();
        this.$M = $d.getMonth();
        this.$D = $d.getDate();
        this.$W = $d.getDay();
        this.$H = $d.getHours();
        this.$m = $d.getMinutes();
        this.$s = $d.getSeconds();
        this.$ms = $d.getMilliseconds();
      } // eslint-disable-next-line class-methods-use-this
      ;

      _proto.$utils = function $utils() {
        return Utils;
      };

      _proto.isValid = function isValid() {
        return !(this.$d.toString() === INVALID_DATE_STRING);
      };

      _proto.isSame = function isSame(that, units) {
        var other = dayjs(that);
        return this.startOf(units) <= other && other <= this.endOf(units);
      };

      _proto.isAfter = function isAfter(that, units) {
        return dayjs(that) < this.startOf(units);
      };

      _proto.isBefore = function isBefore(that, units) {
        return this.endOf(units) < dayjs(that);
      };

      _proto.$g = function $g(input, get, set) {
        if (Utils.u(input)) return this[get];
        return this.set(set, input);
      };

      _proto.unix = function unix() {
        return Math.floor(this.valueOf() / 1000);
      };

      _proto.valueOf = function valueOf() {
        // timezone(hour) * 60 * 60 * 1000 => ms
        return this.$d.getTime();
      };

      _proto.startOf = function startOf(units, _startOf) {
        var _this = this;

        // startOf -> endOf
        var isStartOf = !Utils.u(_startOf) ? _startOf : true;
        var unit = Utils.p(units);

        var instanceFactory = function instanceFactory(d, m) {
          var ins = Utils.w(_this.$u ? Date.UTC(_this.$y, m, d) : new Date(_this.$y, m, d), _this);
          return isStartOf ? ins : ins.endOf(D);
        };

        var instanceFactorySet = function instanceFactorySet(method, slice) {
          var argumentStart = [0, 0, 0, 0];
          var argumentEnd = [23, 59, 59, 999];
          return Utils.w(_this.toDate()[method].apply( // eslint-disable-line prefer-spread
          _this.toDate('s'), (isStartOf ? argumentStart : argumentEnd).slice(slice)), _this);
        };

        var $W = this.$W,
            $M = this.$M,
            $D = this.$D;
        var utcPad = "set" + (this.$u ? 'UTC' : '');

        switch (unit) {
          case Y:
            return isStartOf ? instanceFactory(1, 0) : instanceFactory(31, 11);

          case M:
            return isStartOf ? instanceFactory(1, $M) : instanceFactory(0, $M + 1);

          case W:
            {
              var weekStart = this.$locale().weekStart || 0;
              var gap = ($W < weekStart ? $W + 7 : $W) - weekStart;
              return instanceFactory(isStartOf ? $D - gap : $D + (6 - gap), $M);
            }

          case D:
          case DATE:
            return instanceFactorySet(utcPad + "Hours", 0);

          case H:
            return instanceFactorySet(utcPad + "Minutes", 1);

          case MIN:
            return instanceFactorySet(utcPad + "Seconds", 2);

          case S:
            return instanceFactorySet(utcPad + "Milliseconds", 3);

          default:
            return this.clone();
        }
      };

      _proto.endOf = function endOf(arg) {
        return this.startOf(arg, false);
      };

      _proto.$set = function $set(units, _int) {
        var _C$D$C$DATE$C$M$C$Y$C;

        // private set
        var unit = Utils.p(units);
        var utcPad = "set" + (this.$u ? 'UTC' : '');
        var name = (_C$D$C$DATE$C$M$C$Y$C = {}, _C$D$C$DATE$C$M$C$Y$C[D] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[DATE] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[M] = utcPad + "Month", _C$D$C$DATE$C$M$C$Y$C[Y] = utcPad + "FullYear", _C$D$C$DATE$C$M$C$Y$C[H] = utcPad + "Hours", _C$D$C$DATE$C$M$C$Y$C[MIN] = utcPad + "Minutes", _C$D$C$DATE$C$M$C$Y$C[S] = utcPad + "Seconds", _C$D$C$DATE$C$M$C$Y$C[MS] = utcPad + "Milliseconds", _C$D$C$DATE$C$M$C$Y$C)[unit];
        var arg = unit === D ? this.$D + (_int - this.$W) : _int;

        if (unit === M || unit === Y) {
          // clone is for badMutable plugin
          var date = this.clone().set(DATE, 1);
          date.$d[name](arg);
          date.init();
          this.$d = date.set(DATE, Math.min(this.$D, date.daysInMonth())).$d;
        } else if (name) this.$d[name](arg);

        this.init();
        return this;
      };

      _proto.set = function set(string, _int2) {
        return this.clone().$set(string, _int2);
      };

      _proto.get = function get(unit) {
        return this[Utils.p(unit)]();
      };

      _proto.add = function add(number, units) {
        var _this2 = this,
            _C$MIN$C$H$C$S$unit;

        number = Number(number); // eslint-disable-line no-param-reassign

        var unit = Utils.p(units);

        var instanceFactorySet = function instanceFactorySet(n) {
          var d = dayjs(_this2);
          return Utils.w(d.date(d.date() + Math.round(n * number)), _this2);
        };

        if (unit === M) {
          return this.set(M, this.$M + number);
        }

        if (unit === Y) {
          return this.set(Y, this.$y + number);
        }

        if (unit === D) {
          return instanceFactorySet(1);
        }

        if (unit === W) {
          return instanceFactorySet(7);
        }

        var step = (_C$MIN$C$H$C$S$unit = {}, _C$MIN$C$H$C$S$unit[MIN] = MILLISECONDS_A_MINUTE, _C$MIN$C$H$C$S$unit[H] = MILLISECONDS_A_HOUR, _C$MIN$C$H$C$S$unit[S] = MILLISECONDS_A_SECOND, _C$MIN$C$H$C$S$unit)[unit] || 1; // ms

        var nextTimeStamp = this.$d.getTime() + number * step;
        return Utils.w(nextTimeStamp, this);
      };

      _proto.subtract = function subtract(number, string) {
        return this.add(number * -1, string);
      };

      _proto.format = function format(formatStr) {
        var _this3 = this;

        var locale = this.$locale();
        if (!this.isValid()) return locale.invalidDate || INVALID_DATE_STRING;
        var str = formatStr || FORMAT_DEFAULT;
        var zoneStr = Utils.z(this);
        var $H = this.$H,
            $m = this.$m,
            $M = this.$M;
        var weekdays = locale.weekdays,
            months = locale.months,
            meridiem = locale.meridiem;

        var getShort = function getShort(arr, index, full, length) {
          return arr && (arr[index] || arr(_this3, str)) || full[index].slice(0, length);
        };

        var get$H = function get$H(num) {
          return Utils.s($H % 12 || 12, num, '0');
        };

        var meridiemFunc = meridiem || function (hour, minute, isLowercase) {
          var m = hour < 12 ? 'AM' : 'PM';
          return isLowercase ? m.toLowerCase() : m;
        };

        var matches = {
          YY: String(this.$y).slice(-2),
          YYYY: this.$y,
          M: $M + 1,
          MM: Utils.s($M + 1, 2, '0'),
          MMM: getShort(locale.monthsShort, $M, months, 3),
          MMMM: getShort(months, $M),
          D: this.$D,
          DD: Utils.s(this.$D, 2, '0'),
          d: String(this.$W),
          dd: getShort(locale.weekdaysMin, this.$W, weekdays, 2),
          ddd: getShort(locale.weekdaysShort, this.$W, weekdays, 3),
          dddd: weekdays[this.$W],
          H: String($H),
          HH: Utils.s($H, 2, '0'),
          h: get$H(1),
          hh: get$H(2),
          a: meridiemFunc($H, $m, true),
          A: meridiemFunc($H, $m, false),
          m: String($m),
          mm: Utils.s($m, 2, '0'),
          s: String(this.$s),
          ss: Utils.s(this.$s, 2, '0'),
          SSS: Utils.s(this.$ms, 3, '0'),
          Z: zoneStr // 'ZZ' logic below

        };
        return str.replace(REGEX_FORMAT, function (match, $1) {
          return $1 || matches[match] || zoneStr.replace(':', '');
        }); // 'ZZ'
      };

      _proto.utcOffset = function utcOffset() {
        // Because a bug at FF24, we're rounding the timezone offset around 15 minutes
        // https://github.com/moment/moment/pull/1871
        return -Math.round(this.$d.getTimezoneOffset() / 15) * 15;
      };

      _proto.diff = function diff(input, units, _float) {
        var _C$Y$C$M$C$Q$C$W$C$D$;

        var unit = Utils.p(units);
        var that = dayjs(input);
        var zoneDelta = (that.utcOffset() - this.utcOffset()) * MILLISECONDS_A_MINUTE;
        var diff = this - that;
        var result = Utils.m(this, that);
        result = (_C$Y$C$M$C$Q$C$W$C$D$ = {}, _C$Y$C$M$C$Q$C$W$C$D$[Y] = result / 12, _C$Y$C$M$C$Q$C$W$C$D$[M] = result, _C$Y$C$M$C$Q$C$W$C$D$[Q] = result / 3, _C$Y$C$M$C$Q$C$W$C$D$[W] = (diff - zoneDelta) / MILLISECONDS_A_WEEK, _C$Y$C$M$C$Q$C$W$C$D$[D] = (diff - zoneDelta) / MILLISECONDS_A_DAY, _C$Y$C$M$C$Q$C$W$C$D$[H] = diff / MILLISECONDS_A_HOUR, _C$Y$C$M$C$Q$C$W$C$D$[MIN] = diff / MILLISECONDS_A_MINUTE, _C$Y$C$M$C$Q$C$W$C$D$[S] = diff / MILLISECONDS_A_SECOND, _C$Y$C$M$C$Q$C$W$C$D$)[unit] || diff; // milliseconds

        return _float ? result : Utils.a(result);
      };

      _proto.daysInMonth = function daysInMonth() {
        return this.endOf(M).$D;
      };

      _proto.$locale = function $locale() {
        // get locale object
        return Ls[this.$L];
      };

      _proto.locale = function locale(preset, object) {
        if (!preset) return this.$L;
        var that = this.clone();
        var nextLocaleName = parseLocale(preset, object, true);
        if (nextLocaleName) that.$L = nextLocaleName;
        return that;
      };

      _proto.clone = function clone() {
        return Utils.w(this.$d, this);
      };

      _proto.toDate = function toDate() {
        return new Date(this.valueOf());
      };

      _proto.toJSON = function toJSON() {
        return this.isValid() ? this.toISOString() : null;
      };

      _proto.toISOString = function toISOString() {
        // ie 8 return
        // new Dayjs(this.valueOf() + this.$d.getTimezoneOffset() * 60000)
        // .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        return this.$d.toISOString();
      };

      _proto.toString = function toString() {
        return this.$d.toUTCString();
      };

      return Dayjs;
    }();

    var proto = Dayjs.prototype;
    dayjs.prototype = proto;
    [['$ms', MS], ['$s', S], ['$m', MIN], ['$H', H], ['$W', D], ['$M', M], ['$y', Y], ['$D', DATE]].forEach(function (g) {
      proto[g[1]] = function (input) {
        return this.$g(input, g[0], g[1]);
      };
    });

    dayjs.extend = function (plugin, option) {
      if (!plugin.$i) {
        // install plugin only once
        plugin(option, Dayjs, dayjs);
        plugin.$i = true;
      }

      return dayjs;
    };

    dayjs.locale = parseLocale;
    dayjs.isDayjs = isDayjs;

    dayjs.unix = function (timestamp) {
      return dayjs(timestamp * 1e3);
    };

    dayjs.en = Ls[L];
    dayjs.Ls = Ls;
    dayjs.p = {};

    var relativeTime = (function (o, c, d) {
      o = o || {};
      var proto = c.prototype;
      var relObj = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
      };
      d.en.relativeTime = relObj;

      proto.fromToBase = function (input, withoutSuffix, instance, isFrom, postFormat) {
        var loc = instance.$locale().relativeTime || relObj;
        var T = o.thresholds || [{
          l: 's',
          r: 44,
          d: S
        }, {
          l: 'm',
          r: 89
        }, {
          l: 'mm',
          r: 44,
          d: MIN
        }, {
          l: 'h',
          r: 89
        }, {
          l: 'hh',
          r: 21,
          d: H
        }, {
          l: 'd',
          r: 35
        }, {
          l: 'dd',
          r: 25,
          d: D
        }, {
          l: 'M',
          r: 45
        }, {
          l: 'MM',
          r: 10,
          d: M
        }, {
          l: 'y',
          r: 17
        }, {
          l: 'yy',
          d: Y
        }];
        var Tl = T.length;
        var result;
        var out;
        var isFuture;

        for (var i = 0; i < Tl; i += 1) {
          var t = T[i];

          if (t.d) {
            result = isFrom ? d(input).diff(instance, t.d, true) : instance.diff(input, t.d, true);
          }

          var abs = (o.rounding || Math.round)(Math.abs(result));
          isFuture = result > 0;

          if (abs <= t.r || !t.r) {
            if (abs <= 1 && i > 0) t = T[i - 1]; // 1 minutes -> a minute, 0 seconds -> 0 second

            var format = loc[t.l];

            if (postFormat) {
              abs = postFormat("" + abs);
            }

            if (typeof format === 'string') {
              out = format.replace('%d', abs);
            } else {
              out = format(abs, withoutSuffix, t.l, isFuture);
            }

            break;
          }
        }

        if (withoutSuffix) return out;
        var pastOrFuture = isFuture ? loc.future : loc.past;

        if (typeof pastOrFuture === 'function') {
          return pastOrFuture(out);
        }

        return pastOrFuture.replace('%s', out);
      };

      function fromTo(input, withoutSuffix, instance, isFrom) {
        return proto.fromToBase(input, withoutSuffix, instance, isFrom);
      }

      proto.to = function (input, withoutSuffix) {
        return fromTo(input, withoutSuffix, this, true);
      };

      proto.from = function (input, withoutSuffix) {
        return fromTo(input, withoutSuffix, this);
      };

      var makeNow = function makeNow(thisDay) {
        return thisDay.$u ? d.utc() : d();
      };

      proto.toNow = function (withoutSuffix) {
        return this.to(makeNow(this), withoutSuffix);
      };

      proto.fromNow = function (withoutSuffix) {
        return this.from(makeNow(this), withoutSuffix);
      };
    });

    dayjs.extend(relativeTime);

    /* node_modules\svelte-time\src\Time.svelte generated by Svelte v3.47.0 */
    const file$4 = "node_modules\\svelte-time\\src\\Time.svelte";

    function create_fragment$4(ctx) {
    	let time;
    	let t;

    	let time_levels = [
    		/*$$restProps*/ ctx[3],
    		{ title: /*title*/ ctx[2] },
    		{ datetime: /*timestamp*/ ctx[1] }
    	];

    	let time_data = {};

    	for (let i = 0; i < time_levels.length; i += 1) {
    		time_data = assign$1(time_data, time_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			time = element("time");
    			t = text(/*formatted*/ ctx[0]);
    			set_attributes(time, time_data);
    			add_location(time, file$4, 60, 0, 1479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, time, anchor);
    			append_dev(time, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*formatted*/ 1) set_data_dev(t, /*formatted*/ ctx[0]);

    			set_attributes(time, time_data = get_spread_update(time_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				dirty & /*title*/ 4 && { title: /*title*/ ctx[2] },
    				dirty & /*timestamp*/ 2 && { datetime: /*timestamp*/ ctx[1] }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(time);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let title;
    	const omit_props_names = ["timestamp","format","relative","live","formatted"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Time', slots, []);
    	let { timestamp = new Date().toISOString() } = $$props;
    	let { format = "MMM DD, YYYY" } = $$props;
    	let { relative = false } = $$props;
    	let { live = false } = $$props;
    	let { formatted = "" } = $$props;
    	let interval = undefined;
    	const DEFAULT_INTERVAL = 60 * 1000;

    	onMount(() => {
    		if (relative && live !== false) {
    			interval = setInterval(
    				() => {
    					$$invalidate(0, formatted = dayjs(timestamp).from());
    				},
    				Math.abs(typeof live === "number" ? live : DEFAULT_INTERVAL)
    			);
    		}

    		return () => {
    			if (typeof interval === "number") {
    				clearInterval(interval);
    			}
    		};
    	});

    	$$self.$$set = $$new_props => {
    		$$props = assign$1(assign$1({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('timestamp' in $$new_props) $$invalidate(1, timestamp = $$new_props.timestamp);
    		if ('format' in $$new_props) $$invalidate(4, format = $$new_props.format);
    		if ('relative' in $$new_props) $$invalidate(5, relative = $$new_props.relative);
    		if ('live' in $$new_props) $$invalidate(6, live = $$new_props.live);
    		if ('formatted' in $$new_props) $$invalidate(0, formatted = $$new_props.formatted);
    	};

    	$$self.$capture_state = () => ({
    		timestamp,
    		format,
    		relative,
    		live,
    		formatted,
    		dayjs,
    		onMount,
    		interval,
    		DEFAULT_INTERVAL,
    		title
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('timestamp' in $$props) $$invalidate(1, timestamp = $$new_props.timestamp);
    		if ('format' in $$props) $$invalidate(4, format = $$new_props.format);
    		if ('relative' in $$props) $$invalidate(5, relative = $$new_props.relative);
    		if ('live' in $$props) $$invalidate(6, live = $$new_props.live);
    		if ('formatted' in $$props) $$invalidate(0, formatted = $$new_props.formatted);
    		if ('interval' in $$props) interval = $$new_props.interval;
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*relative, timestamp, format*/ 50) {
    			$$invalidate(0, formatted = relative
    			? dayjs(timestamp).from()
    			: dayjs(timestamp).format(format));
    		}

    		if ($$self.$$.dirty & /*relative, timestamp*/ 34) {
    			$$invalidate(2, title = relative ? timestamp : undefined);
    		}
    	};

    	return [formatted, timestamp, title, $$restProps, format, relative, live];
    }

    class Time extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			timestamp: 1,
    			format: 4,
    			relative: 5,
    			live: 6,
    			formatted: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Time",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get timestamp() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timestamp(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get format() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get relative() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set relative(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get live() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set live(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatted() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatted(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Post.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1$2 } = globals;
    const file$3 = "src\\components\\Post.svelte";

    // (1:0) <script lang="ts">import Cookies from "js-cookie";  import Time from "svelte-time";  import ECCM from 'ecc-messaging-scheme-package';  import * as ecc_math from "simple-js-ec-math";  export let message;  export let time;  export let postOwnerID;  export let usersObject;  const uuid = Cookies.get("uuid_ecc");  let postEncrypted = true;  async function decryptMessage() {      const user = usersObject[uuid];      if (usersObject !== undefined && user !== undefined) {          if (uuid === postOwnerID) {              const jsonK = usersObject[postOwnerID].shared;              let key = new ecc_math.ModPoint(eval(jsonK.x), eval(jsonK.y));              const uuidECC = new ECCM("");              postEncrypted = false;              return uuidECC.decryptWKey(key['x'], message);          }
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script lang=\\\"ts\\\">import Cookies from \\\"js-cookie\\\";  import Time from \\\"svelte-time\\\";  import ECCM from 'ecc-messaging-scheme-package';  import * as ecc_math from \\\"simple-js-ec-math\\\";  export let message;  export let time;  export let postOwnerID;  export let usersObject;  const uuid = Cookies.get(\\\"uuid_ecc\\\");  let postEncrypted = true;  async function decryptMessage() {      const user = usersObject[uuid];      if (usersObject !== undefined && user !== undefined) {          if (uuid === postOwnerID) {              const jsonK = usersObject[postOwnerID].shared;              let key = new ecc_math.ModPoint(eval(jsonK.x), eval(jsonK.y));              const uuidECC = new ECCM(\\\"\\\");              postEncrypted = false;              return uuidECC.decryptWKey(key['x'], message);          }",
    		ctx
    	});

    	return block;
    }

    // (60:49)          <div class="horizontal-flex">             <h4>{decryptedMessage}
    function create_then_block$1(ctx) {
    	let div0;
    	let h4;
    	let t0_value = /*decryptedMessage*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let p;
    	let t3;
    	let t4;
    	let t5;
    	let time_1;
    	let current;
    	let if_block = /*postEncrypted*/ ctx[2] && create_if_block$1(ctx);

    	time_1 = new Time({
    			props: {
    				timestamp: /*time*/ ctx[0],
    				format: "MMMM D, YYYY @ h:mm a"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			p = element("p");
    			t3 = text("User ");
    			t4 = text(/*postOwnerID*/ ctx[1]);
    			t5 = space();
    			create_component(time_1.$$.fragment);
    			add_location(h4, file$3, 61, 12, 2161);
    			attr_dev(div0, "class", "horizontal-flex svelte-b6kbm8");
    			add_location(div0, file$3, 60, 8, 2119);
    			add_location(p, file$3, 67, 12, 2382);
    			attr_dev(div1, "class", "horizontal-flex svelte-b6kbm8");
    			add_location(div1, file$3, 66, 8, 2340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(div1, t5);
    			mount_component(time_1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*postEncrypted*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*postOwnerID*/ 2) set_data_dev(t4, /*postOwnerID*/ ctx[1]);
    			const time_1_changes = {};
    			if (dirty & /*time*/ 1) time_1_changes.timestamp = /*time*/ ctx[0];
    			time_1.$set(time_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(time_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(time_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			destroy_component(time_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(60:49)          <div class=\\\"horizontal-flex\\\">             <h4>{decryptedMessage}",
    		ctx
    	});

    	return block;
    }

    // (63:12) {#if postEncrypted}
    function create_if_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Request Access";
    			add_location(button, file$3, 63, 16, 2237);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*requestAccess*/ ctx[3], { once: true }, false, false);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(63:12) {#if postEncrypted}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script lang="ts">import Cookies from "js-cookie";  import Time from "svelte-time";  import ECCM from 'ecc-messaging-scheme-package';  import * as ecc_math from "simple-js-ec-math";  export let message;  export let time;  export let postOwnerID;  export let usersObject;  const uuid = Cookies.get("uuid_ecc");  let postEncrypted = true;  async function decryptMessage() {      const user = usersObject[uuid];      if (usersObject !== undefined && user !== undefined) {          if (uuid === postOwnerID) {              const jsonK = usersObject[postOwnerID].shared;              let key = new ecc_math.ModPoint(eval(jsonK.x), eval(jsonK.y));              const uuidECC = new ECCM("");              postEncrypted = false;              return uuidECC.decryptWKey(key['x'], message);          }
    function create_pending_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(1:0) <script lang=\\\"ts\\\">import Cookies from \\\"js-cookie\\\";  import Time from \\\"svelte-time\\\";  import ECCM from 'ecc-messaging-scheme-package';  import * as ecc_math from \\\"simple-js-ec-math\\\";  export let message;  export let time;  export let postOwnerID;  export let usersObject;  const uuid = Cookies.get(\\\"uuid_ecc\\\");  let postEncrypted = true;  async function decryptMessage() {      const user = usersObject[uuid];      if (usersObject !== undefined && user !== undefined) {          if (uuid === postOwnerID) {              const jsonK = usersObject[postOwnerID].shared;              let key = new ecc_math.ModPoint(eval(jsonK.x), eval(jsonK.y));              const uuidECC = new ECCM(\\\"\\\");              postEncrypted = false;              return uuidECC.decryptWKey(key['x'], message);          }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let blockquote;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 9,
    		blocks: [,,,]
    	};

    	handle_promise(/*decryptPromise*/ ctx[4], info);

    	const block = {
    		c: function create() {
    			blockquote = element("blockquote");
    			info.block.c();
    			add_location(blockquote, file$3, 58, 0, 2048);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$2("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, blockquote, anchor);
    			info.block.m(blockquote, info.anchor = null);
    			info.mount = () => blockquote;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(blockquote);
    			info.block.d();
    			info.token = null;
    			info = null;
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Post', slots, []);
    	let { message } = $$props;
    	let { time } = $$props;
    	let { postOwnerID } = $$props;
    	let { usersObject } = $$props;
    	const uuid = api.get("uuid_ecc");
    	let postEncrypted = true;

    	async function decryptMessage() {
    		const user = usersObject[uuid];

    		if (usersObject !== undefined && user !== undefined) {
    			if (uuid === postOwnerID) {
    				const jsonK = usersObject[postOwnerID].shared;
    				let key = new src.ModPoint(eval(jsonK.x), eval(jsonK.y));
    				const uuidECC = new _default("");
    				$$invalidate(2, postEncrypted = false);
    				return uuidECC.decryptWKey(key['x'], message);
    			} else if (user.friends.includes(postOwnerID)) {
    				const jsonK = usersObject[postOwnerID].shared;
    				let key = new src.ModPoint(eval(jsonK.x), eval(jsonK.y));
    				const uuidECC = new _default("");
    				$$invalidate(2, postEncrypted = false);
    				return uuidECC.decryptWKey(key['x'], message);
    			}

    			return "Unable to decrypt this message, request access from post owner to view.";
    		}
    	}

    	async function requestAccess() {
    		const user = usersObject[uuid];

    		if (usersObject !== undefined && user !== undefined) {
    			const res = await fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/users`, {
    				method: 'PUT',
    				body: JSON.stringify({ [uuid]: { friends: [postOwnerID] } }),
    				headers: { 'Content-Type': 'application/json' }
    			});

    			if (res.ok) {
    				location.reload(true);
    			} else {
    				throw new Error("Whoops, could not request friend access.");
    			}
    		}
    	}

    	let decryptPromise = decryptMessage();
    	const writable_props = ['message', 'time', 'postOwnerID', 'usersObject'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(5, message = $$props.message);
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    		if ('postOwnerID' in $$props) $$invalidate(1, postOwnerID = $$props.postOwnerID);
    		if ('usersObject' in $$props) $$invalidate(6, usersObject = $$props.usersObject);
    	};

    	$$self.$capture_state = () => ({
    		Cookies: api,
    		Time,
    		ECCM: _default,
    		ecc_math: ecc_math$1,
    		message,
    		time,
    		postOwnerID,
    		usersObject,
    		uuid,
    		postEncrypted,
    		decryptMessage,
    		requestAccess,
    		decryptPromise
    	});

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(5, message = $$props.message);
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    		if ('postOwnerID' in $$props) $$invalidate(1, postOwnerID = $$props.postOwnerID);
    		if ('usersObject' in $$props) $$invalidate(6, usersObject = $$props.usersObject);
    		if ('postEncrypted' in $$props) $$invalidate(2, postEncrypted = $$props.postEncrypted);
    		if ('decryptPromise' in $$props) $$invalidate(4, decryptPromise = $$props.decryptPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		time,
    		postOwnerID,
    		postEncrypted,
    		requestAccess,
    		decryptPromise,
    		message,
    		usersObject
    	];
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			message: 5,
    			time: 0,
    			postOwnerID: 1,
    			usersObject: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[5] === undefined && !('message' in props)) {
    			console.warn("<Post> was created without expected prop 'message'");
    		}

    		if (/*time*/ ctx[0] === undefined && !('time' in props)) {
    			console.warn("<Post> was created without expected prop 'time'");
    		}

    		if (/*postOwnerID*/ ctx[1] === undefined && !('postOwnerID' in props)) {
    			console.warn("<Post> was created without expected prop 'postOwnerID'");
    		}

    		if (/*usersObject*/ ctx[6] === undefined && !('usersObject' in props)) {
    			console.warn("<Post> was created without expected prop 'usersObject'");
    		}
    	}

    	get message() {
    		throw new Error_1$2("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error_1$2("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time() {
    		throw new Error_1$2("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error_1$2("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get postOwnerID() {
    		throw new Error_1$2("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set postOwnerID(value) {
    		throw new Error_1$2("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get usersObject() {
    		throw new Error_1$2("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set usersObject(value) {
    		throw new Error_1$2("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
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
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function asyncable(getter, setter = () => {}, stores = []) {
    	let resolve;
    	const initial = new Promise((res) => (resolve = res));

    	const derived$ = derived(stores, (values) => values);

    	const store$ = writable(initial, (set) => {
    		return derived$.subscribe(async (values = []) => {
    			let value = getter(...values);
    			if (value === undefined) return;
    			value = Promise.resolve(value);
    			set(value);
    			resolve(value);
    		});
    	});

    	async function set(newValue, oldValue) {
    		if (newValue === oldValue) return;
    		store$.set(Promise.resolve(newValue));
    		try {
    			await setter(newValue, oldValue);
    		} catch (err) {
    			store$.set(Promise.resolve(oldValue));
    			throw err;
    		}
    	}

    	return {
    		subscribe: store$.subscribe,
    		async update(reducer) {
    			if (!setter) return;
    			let oldValue;
    			let newValue;
    			try {
    				oldValue = await get_store_value(store$);
    				newValue = await reducer(shallowCopy(oldValue));
    			} finally {
    				await set(newValue, oldValue);
    			}
    		},
    		async set(newValue) {
    			if (!setter) return;
    			let oldValue;
    			try {
    				oldValue = await get_store_value(store$);
    				newValue = await newValue;
    			} finally {
    				await set(newValue, oldValue);
    			}
    		},
    		get() {
    			return get_store_value(store$);
    		},
    	};
    }

    function shallowCopy(value) {
    	if (typeof value !== 'object' || value === null) return value;
    	return Array.isArray(value) ? [...value] : { ...value };
    }

    const users = asyncable(fetchUsers, null);
    async function fetchUsers() {
        const res = await fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/users`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();
        return json;
    }
    const serverKey = asyncable(fetchKeys, null);
    async function fetchKeys() {
        const res = await fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/serverkey`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        let json = await res.json();
        let point = new src.ModPoint(eval(json.x), eval(json.y));
        return point;
    }

    /* src\components\NewPost.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1$1 } = globals;
    const file$2 = "src\\components\\NewPost.svelte";

    function create_fragment$2(ctx) {
    	let input;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Post Message";
    			attr_dev(input, "placeholder", "enter your message");
    			set_style(input, "height", "50px");
    			set_style(input, "width", "588px");
    			add_location(input, file$2, 36, 0, 1179);
    			add_location(button, file$2, 37, 0, 1278);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*message*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(button, "click", /*handlePost*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*message*/ 1 && input.value !== /*message*/ ctx[0]) {
    				set_input_value(input, /*message*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NewPost', slots, []);
    	let { posts } = $$props;
    	let message = '';

    	async function updateBasket(message, uuid) {
    		const post = {
    			message,
    			timestamp: Date.now(),
    			ownerID: uuid
    		};

    		const res = await fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/messages`, {
    			method: 'PUT',
    			body: JSON.stringify({ posts: [post] }),
    			headers: { 'Content-Type': 'application/json' }
    		});

    		if (res.ok) {
    			posts.reverse();
    			$$invalidate(2, posts = [...posts, post]);
    		} else {
    			throw new Error("Whoops, something went wrong with your post!");
    		}
    	}

    	async function handlePost() {
    		const uuid = api.get("uuid_ecc");
    		const key = await serverKey.get();
    		const uuidECC = new _default(uuid);
    		uuidECC.ECC.loadPublicKey();
    		uuidECC.generateSharedKey(key);
    		uuidECC.ECC.generateSharedKey(key);
    		const encryptedMessage = uuidECC.encrypt(message);
    		await updateBasket(encryptedMessage, uuid);
    	}

    	const writable_props = ['posts'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NewPost> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		message = this.value;
    		$$invalidate(0, message);
    	}

    	$$self.$$set = $$props => {
    		if ('posts' in $$props) $$invalidate(2, posts = $$props.posts);
    	};

    	$$self.$capture_state = () => ({
    		ECCM: _default,
    		serverKey,
    		Cookies: api,
    		posts,
    		message,
    		updateBasket,
    		handlePost
    	});

    	$$self.$inject_state = $$props => {
    		if ('posts' in $$props) $$invalidate(2, posts = $$props.posts);
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, handlePost, posts, input_input_handler];
    }

    class NewPost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal, { posts: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewPost",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*posts*/ ctx[2] === undefined && !('posts' in props)) {
    			console.warn("<NewPost> was created without expected prop 'posts'");
    		}
    	}

    	get posts() {
    		throw new Error_1$1("<NewPost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set posts(value) {
    		throw new Error_1$1("<NewPost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Spinner.svelte generated by Svelte v3.47.0 */

    const file$1 = "src\\components\\Spinner.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-hp4gv8");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$1, 26, 2, 632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Spinner', slots, []);
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ['size', 'color', 'unit'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Spinner> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Spinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spinner",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<Spinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Spinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Spinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Spinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Spinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Spinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (72:2) {:else}
    function create_else_block(ctx) {
    	let newpost;
    	let updating_posts;
    	let t;
    	let previous_key = /*posts*/ ctx[0];
    	let key_block_anchor;
    	let current;

    	function newpost_posts_binding(value) {
    		/*newpost_posts_binding*/ ctx[7](value);
    	}

    	let newpost_props = {};

    	if (/*posts*/ ctx[0] !== void 0) {
    		newpost_props.posts = /*posts*/ ctx[0];
    	}

    	newpost = new NewPost({ props: newpost_props, $$inline: true });
    	binding_callbacks.push(() => bind(newpost, 'posts', newpost_posts_binding));
    	let key_block = create_key_block_1(ctx);

    	const block = {
    		c: function create() {
    			create_component(newpost.$$.fragment);
    			t = space();
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(newpost, target, anchor);
    			insert_dev(target, t, anchor);
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const newpost_changes = {};

    			if (!updating_posts && dirty & /*posts*/ 1) {
    				updating_posts = true;
    				newpost_changes.posts = /*posts*/ ctx[0];
    				add_flush_callback(() => updating_posts = false);
    			}

    			newpost.$set(newpost_changes);

    			if (dirty & /*posts*/ 1 && safe_not_equal(previous_key, previous_key = /*posts*/ ctx[0])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block_1(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newpost.$$.fragment, local);
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newpost.$$.fragment, local);
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(newpost, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(72:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (66:2) {#if cookieID === undefined}
    function create_if_block(ctx) {
    	let h5;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "Login to post";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Sign in";
    			add_location(h5, file, 66, 3, 2087);
    			attr_dev(input, "placeholder", "enter your username");
    			set_style(input, "height", "50px");
    			set_style(input, "width", "588px");
    			add_location(input, file, 67, 3, 2113);
    			add_location(button, file, 68, 3, 2213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*uuid*/ ctx[1]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button, "click", /*handleLogin*/ ctx[5], { once: true }, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*uuid*/ 2 && input.value !== /*uuid*/ ctx[1]) {
    				set_input_value(input, /*uuid*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:2) {#if cookieID === undefined}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[13] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file, 81, 5, 2558);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(81:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (77:4) {:then}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*posts*/ ctx[0].reverse();
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
    			if (dirty & /*posts, usersObject*/ 9) {
    				each_value = /*posts*/ ctx[0].reverse();
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
    		id: create_then_block.name,
    		type: "then",
    		source: "(77:4) {:then}",
    		ctx
    	});

    	return block;
    }

    // (78:5) {#each posts.reverse() as post}
    function create_each_block(ctx) {
    	let post;
    	let current;

    	post = new Post({
    			props: {
    				message: /*post*/ ctx[10].message,
    				time: /*post*/ ctx[10].timestamp,
    				postOwnerID: /*post*/ ctx[10].ownerID,
    				usersObject: /*usersObject*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(post.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(post, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const post_changes = {};
    			if (dirty & /*posts*/ 1) post_changes.message = /*post*/ ctx[10].message;
    			if (dirty & /*posts*/ 1) post_changes.time = /*post*/ ctx[10].timestamp;
    			if (dirty & /*posts*/ 1) post_changes.postOwnerID = /*post*/ ctx[10].ownerID;
    			if (dirty & /*usersObject*/ 8) post_changes.usersObject = /*usersObject*/ ctx[3];
    			post.$set(post_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(post.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(post.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(post, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(78:5) {#each posts.reverse() as post}",
    		ctx
    	});

    	return block;
    }

    // (75:20)       <Spinner/>     {:then}
    function create_pending_block(ctx) {
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(75:20)       <Spinner/>     {:then}",
    		ctx
    	});

    	return block;
    }

    // (74:3) {#key posts}
    function create_key_block_1(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		error: 13,
    		blocks: [,,,]
    	};

    	handle_promise(/*promise*/ ctx[4], info);

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
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
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
    		id: create_key_block_1.name,
    		type: "key",
    		source: "(74:3) {#key posts}",
    		ctx
    	});

    	return block;
    }

    // (65:1) {#key cookieID}
    function create_key_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*cookieID*/ ctx[2] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(65:1) {#key cookieID}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let previous_key = /*cookieID*/ ctx[2];
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			key_block.c();
    			add_location(main, file, 63, 0, 2029);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			key_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cookieID*/ 4 && safe_not_equal(previous_key, previous_key = /*cookieID*/ ctx[2])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(main, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			key_block.d(detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let posts = [];
    	let uuid;
    	let cookieID = api.get("uuid_ecc");
    	let usersObject;

    	async function getBasket() {
    		$$invalidate(3, usersObject = await users.get());

    		const res = await fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/messages`, {
    			method: 'GET',
    			headers: { 'Content-Type': 'application/json' }
    		});

    		const json = await res.json();

    		if (res.ok) {
    			setTimeout(
    				() => {
    					$$invalidate(0, posts = json.posts);
    					return true;
    				},
    				0 * Math.random()
    			);
    		} else {
    			throw new Error("whoops");
    		}
    	}

    	let promise = getBasket();

    	async function generateSharedKeyWithUser() {
    		const key = await serverKey.get();
    		const uuidECC = new _default(uuid);
    		uuidECC.generateSharedKey(key);
    		return uuidECC;
    	}

    	async function handleLogin() {
    		if (api.get("uuid_ecc") === undefined) {
    			let eccInstance = await generateSharedKeyWithUser();
    			let key = eccInstance.ECC.getSharedKey();

    			const res = await fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/users`, {
    				method: 'PUT',
    				body: JSON.stringify({
    					[uuid]: {
    						shared: { x: `${key['x']}n`, y: `${key['y']}n` },
    						friends: []
    					}
    				}),
    				headers: { 'Content-Type': 'application/json' }
    			});

    			if (res.ok) {
    				$$invalidate(2, cookieID = uuid);
    				api.set("uuid_ecc", uuid, { expires: 365 });
    			} else {
    				throw new Error("Whoops, could not login!");
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		uuid = this.value;
    		$$invalidate(1, uuid);
    	}

    	function newpost_posts_binding(value) {
    		posts = value;
    		$$invalidate(0, posts);
    	}

    	$$self.$capture_state = () => ({
    		ECCM: _default,
    		Post,
    		NewPost,
    		Spinner,
    		Cookies: api,
    		serverKey,
    		users,
    		posts,
    		uuid,
    		cookieID,
    		usersObject,
    		getBasket,
    		promise,
    		generateSharedKeyWithUser,
    		handleLogin
    	});

    	$$self.$inject_state = $$props => {
    		if ('posts' in $$props) $$invalidate(0, posts = $$props.posts);
    		if ('uuid' in $$props) $$invalidate(1, uuid = $$props.uuid);
    		if ('cookieID' in $$props) $$invalidate(2, cookieID = $$props.cookieID);
    		if ('usersObject' in $$props) $$invalidate(3, usersObject = $$props.usersObject);
    		if ('promise' in $$props) $$invalidate(4, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		posts,
    		uuid,
    		cookieID,
    		usersObject,
    		promise,
    		handleLogin,
    		input_input_handler,
    		newpost_posts_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})(crypto);
//# sourceMappingURL=bundle.js.map
