(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.acebaseclient = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],2:[function(require,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],3:[function(require,module,exports){

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};


},{}],4:[function(require,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(){
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})();

},{}],5:[function(require,module,exports){
(function (global){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
  || global.WebKitBlobBuilder
  || global.MSBlobBuilder
  || global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */

var blobSupportsArrayBufferView = blobSupported && (function() {
  try {
    var b = new Blob([new Uint8Array([1,2])]);
    return b.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  for (var i = 0; i < ary.length; i++) {
    var chunk = ary[i];
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer;

      // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer
      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      ary[i] = buf;
    }
  }
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  mapArrayBufferViews(ary);

  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }

  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

function BlobConstructor(ary, options) {
  mapArrayBufferViews(ary);
  return new Blob(ary, options || {});
};

module.exports = (function() {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

},{}],7:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],8:[function(require,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],9:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
  '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
  '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
  '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
  '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
  '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
  '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
  '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
  '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
  '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // Internet Explorer and Edge do not support colors.
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":10,"_process":179}],10:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * Active `debug` instances.
 */
exports.instances = [];

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  var prevTime;

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);
  debug.destroy = destroy;

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  exports.instances.push(debug);

  return debug;
}

function destroy () {
  var index = exports.instances.indexOf(this);
  if (index !== -1) {
    exports.instances.splice(index, 1);
    return true;
  } else {
    return false;
  }
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var i;
  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }

  for (i = 0; i < exports.instances.length; i++) {
    var instance = exports.instances[i];
    instance.enabled = exports.enabled(instance.namespace);
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  if (name[name.length - 1] === '*') {
    return true;
  }
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":27}],11:[function(require,module,exports){

module.exports = require('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = require('engine.io-parser');

},{"./socket":12,"engine.io-parser":20}],12:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var transports = require('./transports/index');
var Emitter = require('component-emitter');
var debug = require('debug')('engine.io-client:socket');
var index = require('indexof');
var parser = require('engine.io-parser');
var parseuri = require('parseuri');
var parseqs = require('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket (uri, opts) {
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' === typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.hostname = uri.host;
    opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  } else if (opts.host) {
    opts.hostname = parseuri(opts.host).host;
  }

  this.secure = null != opts.secure ? opts.secure
    : (global.location && 'https:' === location.protocol);

  if (opts.hostname && !opts.port) {
    // if no port is specified manually, use the protocol default
    opts.port = this.secure ? '443' : '80';
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port
      ? location.port
      : (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.transportOptions = opts.transportOptions || {};
  this.readyState = '';
  this.writeBuffer = [];
  this.prevBufferLen = 0;
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
    this.perMessageDeflate.threshold = 1024;
  }

  // SSL options for Node.js client
  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;
  this.forceNode = !!opts.forceNode;

  // other options for Node.js client
  var freeGlobal = typeof global === 'object' && global;
  if (freeGlobal.global === freeGlobal) {
    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
      this.extraHeaders = opts.extraHeaders;
    }

    if (opts.localAddress) {
      this.localAddress = opts.localAddress;
    }
  }

  // set on handshake
  this.id = null;
  this.upgrades = null;
  this.pingInterval = null;
  this.pingTimeout = null;

  // set on heartbeat
  this.pingIntervalTimer = null;
  this.pingTimeoutTimer = null;

  this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = require('./transport');
Socket.transports = require('./transports/index');
Socket.parser = require('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // per-transport options
  var options = this.transportOptions[name] || {};

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    query: query,
    socket: this,
    agent: options.agent || this.agent,
    hostname: options.hostname || this.hostname,
    port: options.port || this.port,
    secure: options.secure || this.secure,
    path: options.path || this.path,
    forceJSONP: options.forceJSONP || this.forceJSONP,
    jsonp: options.jsonp || this.jsonp,
    forceBase64: options.forceBase64 || this.forceBase64,
    enablesXDR: options.enablesXDR || this.enablesXDR,
    timestampRequests: options.timestampRequests || this.timestampRequests,
    timestampParam: options.timestampParam || this.timestampParam,
    policyPort: options.policyPort || this.policyPort,
    pfx: options.pfx || this.pfx,
    key: options.key || this.key,
    passphrase: options.passphrase || this.passphrase,
    cert: options.cert || this.cert,
    ca: options.ca || this.ca,
    ciphers: options.ciphers || this.ciphers,
    rejectUnauthorized: options.rejectUnauthorized || this.rejectUnauthorized,
    perMessageDeflate: options.perMessageDeflate || this.perMessageDeflate,
    extraHeaders: options.extraHeaders || this.extraHeaders,
    forceNode: options.forceNode || this.forceNode,
    localAddress: options.localAddress || this.localAddress,
    requestTimeout: options.requestTimeout || this.requestTimeout,
    protocols: options.protocols || void (0)
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
    transport = 'websocket';
  } else if (0 === this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function () {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function (transport) {
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function () {
    self.onDrain();
  })
  .on('packet', function (packet) {
    self.onPacket(packet);
  })
  .on('error', function (e) {
    self.onError(e);
  })
  .on('close', function () {
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 });
  var failed = false;
  var self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen () {
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' === msg.type && 'probe' === msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' === transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' === self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport () {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  // Handle any error that happens while probing
  function onerror (err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose () {
    onerror('transport closed');
  }

  // When the socket is closed while we're probing
  function onclose () {
    onerror('socket closed');
  }

  // When the socket is upgraded while we're probing
  function onupgrade (to) {
    if (transport && to.name !== transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  // Remove all listeners on the transport and on self
  function cleanup () {
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();
};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' === this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' === this.readyState || 'open' === this.readyState ||
      'closing' === this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(JSON.parse(packet.data));
        break;

      case 'pong':
        this.setPing();
        this.emit('pong');
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.onError(err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if ('closed' === this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' === self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api private
*/

Socket.prototype.ping = function () {
  var self = this;
  this.sendPacket('ping', function () {
    self.emit('ping');
  });
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function () {
  this.writeBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (0 === this.writeBuffer.length) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' !== this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @param {Object} options.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, options, fn) {
  this.sendPacket('message', msg, options, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Object} options.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, options, fn) {
  if ('function' === typeof data) {
    fn = data;
    data = undefined;
  }

  if ('function' === typeof options) {
    fn = options;
    options = null;
  }

  if ('closing' === this.readyState || 'closed' === this.readyState) {
    return;
  }

  options = options || {};
  options.compress = false !== options.compress;

  var packet = {
    type: type,
    data: data,
    options: options
  };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  if (fn) this.once('flush', fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.readyState = 'closing';

    var self = this;

    if (this.writeBuffer.length) {
      this.once('drain', function () {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  function close () {
    self.onClose('forced close');
    debug('socket closing - telling transport to close');
    self.transport.close();
  }

  function cleanupAndClose () {
    self.removeListener('upgrade', cleanupAndClose);
    self.removeListener('upgradeError', cleanupAndClose);
    close();
  }

  function waitForUpgrade () {
    // wait for upgrade to finish since we can't send packets while pausing a transport
    self.once('upgrade', cleanupAndClose);
    self.once('upgradeError', cleanupAndClose);
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);

    // clean buffers after, so users can still
    // grab the buffers on `close` event
    self.writeBuffer = [];
    self.prevBufferLen = 0;
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i < j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./transport":13,"./transports/index":14,"component-emitter":7,"debug":9,"engine.io-parser":20,"indexof":25,"parseqs":28,"parseuri":29}],13:[function(require,module,exports){
/**
 * Module dependencies.
 */

var parser = require('engine.io-parser');
var Emitter = require('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;
  this.forceNode = opts.forceNode;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;
  this.localAddress = opts.localAddress;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' === this.readyState || '' === this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function (packets) {
  if ('open' === this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function (data) {
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":7,"engine.io-parser":20}],14:[function(require,module,exports){
(function (global){
/**
 * Module dependencies
 */

var XMLHttpRequest = require('xmlhttprequest-ssl');
var XHR = require('./polling-xhr');
var JSONP = require('./polling-jsonp');
var websocket = require('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling (opts) {
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (global.location) {
    var isSSL = 'https:' === location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname !== location.hostname || port !== opts.port;
    xs = opts.secure !== isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling-jsonp":15,"./polling-xhr":16,"./websocket":18,"xmlhttprequest-ssl":19}],15:[function(require,module,exports){
(function (global){

/**
 * Module requirements.
 */

var Polling = require('./polling');
var inherit = require('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (global.document && global.addEventListener) {
    global.addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function (e) {
    self.onError('jsonp poll error', e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  if (insertAt) {
    insertAt.parentNode.insertBefore(script, insertAt);
  } else {
    (document.head || document.body).appendChild(script);
  }
  this.script = script;

  var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch (e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function () {
      if (self.iframe.readyState === 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":17,"component-inherit":8}],16:[function(require,module,exports){
(function (global){
/**
 * Module requirements.
 */

var XMLHttpRequest = require('xmlhttprequest-ssl');
var Polling = require('./polling');
var Emitter = require('component-emitter');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty () {}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR (opts) {
  Polling.call(this, opts);
  this.requestTimeout = opts.requestTimeout;
  this.extraHeaders = opts.extraHeaders;

  if (global.location) {
    var isSSL = 'https:' === location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = opts.hostname !== global.location.hostname ||
      port !== opts.port;
    this.xs = opts.secure !== isSSL;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function (opts) {
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  opts.requestTimeout = this.requestTimeout;

  // other options for Node.js client
  opts.extraHeaders = this.extraHeaders;

  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function (data, fn) {
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function (err) {
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function () {
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function (data) {
    self.onData(data);
  });
  req.on('error', function (err) {
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request (opts) {
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined !== opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;
  this.requestTimeout = opts.requestTimeout;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;

  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function () {
  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    try {
      if (this.extraHeaders) {
        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
        for (var i in this.extraHeaders) {
          if (this.extraHeaders.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.extraHeaders[i]);
          }
        }
      }
    } catch (e) {}

    if ('POST' === this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    try {
      xhr.setRequestHeader('Accept', '*/*');
    } catch (e) {}

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.requestTimeout) {
      xhr.timeout = this.requestTimeout;
    }

    if (this.hasXDR()) {
      xhr.onload = function () {
        self.onLoad();
      };
      xhr.onerror = function () {
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 2) {
          try {
            var contentType = xhr.getResponseHeader('Content-Type');
            if (self.supportsBinary && contentType === 'application/octet-stream') {
              xhr.responseType = 'arraybuffer';
            }
          } catch (e) {}
        }
        if (4 !== xhr.readyState) return;
        if (200 === xhr.status || 1223 === xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function () {
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function () {
      self.onError(e);
    }, 0);
    return;
  }

  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function () {
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function (data) {
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function (err) {
  this.emit('error', err);
  this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function (fromError) {
  if ('undefined' === typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch (e) {}
  }

  if (global.document) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function () {
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type');
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response || this.xhr.responseText;
    } else {
      data = this.xhr.responseText;
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function () {
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function () {
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

Request.requestsCount = 0;
Request.requests = {};

if (global.document) {
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler, false);
  }
}

function unloadHandler () {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":17,"component-emitter":7,"component-inherit":8,"debug":9,"xmlhttprequest-ssl":19}],17:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parseqs = require('parseqs');
var parser = require('engine.io-parser');
var inherit = require('component-inherit');
var yeast = require('yeast');
var debug = require('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function () {
  var XMLHttpRequest = require('xmlhttprequest-ssl');
  var xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling (opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function () {
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function (onPause) {
  var self = this;

  this.readyState = 'pausing';

  function pause () {
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function () {
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function () {
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function () {
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function (data) {
  var self = this;
  debug('polling got data %s', data);
  var callback = function (packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' === self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' === packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' !== this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' === this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function () {
  var self = this;

  function close () {
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' === this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function (packets) {
  var self = this;
  this.writable = false;
  var callbackfn = function () {
    self.writable = true;
    self.emit('drain');
  };

  parser.encodePayload(packets, this.supportsBinary, function (data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' === schema && Number(this.port) !== 443) ||
     ('http' === schema && Number(this.port) !== 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

},{"../transport":13,"component-inherit":8,"debug":9,"engine.io-parser":20,"parseqs":28,"xmlhttprequest-ssl":19,"yeast":39}],18:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parser = require('engine.io-parser');
var parseqs = require('parseqs');
var inherit = require('component-inherit');
var yeast = require('yeast');
var debug = require('debug')('engine.io-client:websocket');
var BrowserWebSocket = global.WebSocket || global.MozWebSocket;
var NodeWebSocket;
if (typeof window === 'undefined') {
  try {
    NodeWebSocket = require('ws');
  } catch (e) { }
}

/**
 * Get either the `WebSocket` or `MozWebSocket` globals
 * in the browser or try to resolve WebSocket-compatible
 * interface exposed by `ws` for Node-like environment.
 */

var WebSocket = BrowserWebSocket;
if (!WebSocket && typeof window === 'undefined') {
  WebSocket = NodeWebSocket;
}

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS (opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  this.perMessageDeflate = opts.perMessageDeflate;
  this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
  this.protocols = opts.protocols;
  if (!this.usingBrowserWebSocket) {
    WebSocket = NodeWebSocket;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var uri = this.uri();
  var protocols = this.protocols;
  var opts = {
    agent: this.agent,
    perMessageDeflate: this.perMessageDeflate
  };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }
  if (this.localAddress) {
    opts.localAddress = this.localAddress;
  }

  try {
    this.ws = this.usingBrowserWebSocket ? (protocols ? new WebSocket(uri, protocols) : new WebSocket(uri)) : new WebSocket(uri, protocols, opts);
  } catch (err) {
    return this.emit('error', err);
  }

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  if (this.ws.supports && this.ws.supports.binary) {
    this.supportsBinary = true;
    this.ws.binaryType = 'nodebuffer';
  } else {
    this.ws.binaryType = 'arraybuffer';
  }

  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function () {
  var self = this;

  this.ws.onopen = function () {
    self.onOpen();
  };
  this.ws.onclose = function () {
    self.onClose();
  };
  this.ws.onmessage = function (ev) {
    self.onData(ev.data);
  };
  this.ws.onerror = function (e) {
    self.onError('websocket error', e);
  };
};

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function (packets) {
  var self = this;
  this.writable = false;

  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  var total = packets.length;
  for (var i = 0, l = total; i < l; i++) {
    (function (packet) {
      parser.encodePacket(packet, self.supportsBinary, function (data) {
        if (!self.usingBrowserWebSocket) {
          // always create a new object (GH-437)
          var opts = {};
          if (packet.options) {
            opts.compress = packet.options.compress;
          }

          if (self.perMessageDeflate) {
            var len = 'string' === typeof data ? global.Buffer.byteLength(data) : data.length;
            if (len < self.perMessageDeflate.threshold) {
              opts.compress = false;
            }
          }
        }

        // Sometimes the websocket has already been closed but the browser didn't
        // have a chance of informing us about it yet, in that case send will
        // throw an error
        try {
          if (self.usingBrowserWebSocket) {
            // TypeError is thrown when passing the second argument on Safari
            self.ws.send(data);
          } else {
            self.ws.send(data, opts);
          }
        } catch (e) {
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
  }

  function done () {
    self.emit('flush');

    // fake drain
    // defer to next tick to allow Socket to clear writeBuffer
    setTimeout(function () {
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function () {
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function () {
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' === schema && Number(this.port) !== 443) ||
    ('ws' === schema && Number(this.port) !== 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function () {
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../transport":13,"component-inherit":8,"debug":9,"engine.io-parser":20,"parseqs":28,"ws":168,"yeast":39}],19:[function(require,module,exports){
(function (global){
// browser shim for xmlhttprequest module

var hasCORS = require('has-cors');

module.exports = function (opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new global[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
    } catch (e) { }
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"has-cors":24}],20:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var keys = require('./keys');
var hasBinary = require('has-binary2');
var sliceBuffer = require('arraybuffer.slice');
var after = require('after');
var utf8 = require('./utf8');

var base64encoder;
if (global && global.ArrayBuffer) {
  base64encoder = require('base64-arraybuffer');
}

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = require('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if (typeof supportsBinary === 'function') {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if (typeof utf8encode === 'function') {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (Blob && data instanceof global.Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // might be an object with { base64: true, data: dataAsBase64String }
  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data), { strict: false }) : String(packet.data);
  }

  return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    packet.data = fr.result;
    exports.encodePacket(packet, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (Blob && packet.data instanceof global.Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += global.btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  if (data === undefined) {
    return err;
  }
  // String data
  if (typeof data === 'string') {
    if (data.charAt(0) === 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      data = tryDecode(data);
      if (data === false) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

function tryDecode(data) {
  try {
    data = utf8.decode(data, { strict: false });
  } catch (e) {
    return false;
  }
  return data;
}

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!base64encoder) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary === 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, false, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data !== 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data === '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = '', n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (chr !== ':') {
      length += chr;
      continue;
    }

    if (length === '' || (length != (n = Number(length)))) {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    msg = data.substr(i + 1, n);

    if (length != msg.length) {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    if (msg.length) {
      packet = exports.decodePacket(msg, binaryType, false);

      if (err.type === packet.type && err.data === packet.data) {
        // parser error in individual packet - ignoring payload
        return callback(err, 0, 1);
      }

      var ret = callback(packet, i + n, l);
      if (false === ret) return;
    }

    // advance cursor
    i += n;
    length = '';
  }

  if (length !== '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] === 255) break;

      // 310 = char length of Number.MAX_VALUE
      if (msgLength.length > 310) {
        return callback(err, 0, 1);
      }

      msgLength += tailArray[i];
    }

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./keys":21,"./utf8":22,"after":1,"arraybuffer.slice":2,"base64-arraybuffer":4,"blob":5,"has-binary2":23}],21:[function(require,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],22:[function(require,module,exports){
(function (global){
/*! https://mths.be/utf8js v2.1.2 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint, strict) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			if (strict) {
				throw Error(
					'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
					' is not a scalar value'
				);
			}
			return false;
		}
		return true;
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint, strict) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			if (!checkScalarValue(codePoint, strict)) {
				codePoint = 0xFFFD;
			}
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string, opts) {
		opts = opts || {};
		var strict = false !== opts.strict;

		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint, strict);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol(strict) {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				return checkScalarValue(codePoint, strict) ? codePoint : 0xFFFD;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString, opts) {
		opts = opts || {};
		var strict = false !== opts.strict;

		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol(strict)) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.1.2',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],23:[function(require,module,exports){
(function (Buffer){
/* global Blob File */

/*
 * Module requirements.
 */

var isArray = require('isarray');

var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === 'function' ||
                        typeof Blob !== 'undefined' && toString.call(Blob) === '[object BlobConstructor]';
var withNativeFile = typeof File === 'function' ||
                        typeof File !== 'undefined' && toString.call(File) === '[object FileConstructor]';

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Supports Buffer, ArrayBuffer, Blob and File.
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary (obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  if (isArray(obj)) {
    for (var i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }
    return false;
  }

  if ((typeof Buffer === 'function' && Buffer.isBuffer && Buffer.isBuffer(obj)) ||
    (typeof ArrayBuffer === 'function' && obj instanceof ArrayBuffer) ||
    (withNativeBlob && obj instanceof Blob) ||
    (withNativeFile && obj instanceof File)
  ) {
    return true;
  }

  // see: https://github.com/Automattic/has-binary/pull/4
  if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }

  return false;
}

}).call(this,require("buffer").Buffer)
},{"buffer":169,"isarray":26}],24:[function(require,module,exports){

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = typeof XMLHttpRequest !== 'undefined' &&
    'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{}],25:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],26:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],27:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],28:[function(require,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],29:[function(require,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],30:[function(require,module,exports){

/**
 * Module dependencies.
 */

var url = require('./url');
var parser = require('socket.io-parser');
var Manager = require('./manager');
var debug = require('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup (uri, opts) {
  if (typeof uri === 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var path = parsed.path;
  var sameNamespace = cache[id] && path in cache[id].nsps;
  var newConnection = opts.forceNew || opts['force new connection'] ||
                      false === opts.multiplex || sameNamespace;

  var io;

  if (newConnection) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.query;
  }
  return io.socket(parsed.path, opts);
}

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = require('./manager');
exports.Socket = require('./socket');

},{"./manager":31,"./socket":33,"./url":34,"debug":9,"socket.io-parser":36}],31:[function(require,module,exports){

/**
 * Module dependencies.
 */

var eio = require('engine.io-client');
var Socket = require('./socket');
var Emitter = require('component-emitter');
var parser = require('socket.io-parser');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:manager');
var indexOf = require('indexof');
var Backoff = require('backo2');

/**
 * IE6+ hasOwnProperty
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager (uri, opts) {
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (uri && ('object' === typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connecting = [];
  this.lastPing = null;
  this.encoding = false;
  this.packetBuffer = [];
  var _parser = opts.parser || parser;
  this.encoder = new _parser.Encoder();
  this.decoder = new _parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function () {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
    }
  }
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function () {
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].id = this.generateId(nsp);
    }
  }
};

/**
 * generate `socket.id` for the given `nsp`
 *
 * @param {String} nsp
 * @return {String}
 * @api private
 */

Manager.prototype.generateId = function (nsp) {
  return (nsp === '/' ? '' : (nsp + '#')) + this.engine.id;
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function (v) {
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function (v) {
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function (v) {
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function (v) {
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function (v) {
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function (v) {
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function () {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};

/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function (fn, opts) {
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;

  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;

  // emit `open`
  var openSub = on(socket, 'open', function () {
    self.onopen();
    fn && fn();
  });

  // emit `connect_error`
  var errorSub = on(socket, 'error', function (data) {
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // emit `connect_timeout`
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);

    // set timer
    var timer = setTimeout(function () {
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);

    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);

  return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function () {
  debug('open');

  // clear old subs
  this.cleanup();

  // mark as open
  this.readyState = 'open';
  this.emit('open');

  // add new subs
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
};

/**
 * Called upon a ping.
 *
 * @api private
 */

Manager.prototype.onping = function () {
  this.lastPing = new Date();
  this.emitAll('ping');
};

/**
 * Called upon a packet.
 *
 * @api private
 */

Manager.prototype.onpong = function () {
  this.emitAll('pong', new Date() - this.lastPing);
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function (data) {
  this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function (err) {
  debug('error', err);
  this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function (nsp, opts) {
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp, opts);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connecting', onConnecting);
    socket.on('connect', function () {
      socket.id = self.generateId(nsp);
    });

    if (this.autoConnect) {
      // manually call here since connecting event is fired before listening
      onConnecting();
    }
  }

  function onConnecting () {
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function (socket) {
  var index = indexOf(this.connecting, socket);
  if (~index) this.connecting.splice(index, 1);
  if (this.connecting.length) return;

  this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function (packet) {
  debug('writing packet %j', packet);
  var self = this;
  if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function (encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i], packet.options);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else { // add packet to the queue
    self.packetBuffer.push(packet);
  }
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function () {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function () {
  debug('cleanup');

  var subsLength = this.subs.length;
  for (var i = 0; i < subsLength; i++) {
    var sub = this.subs.shift();
    sub.destroy();
  }

  this.packetBuffer = [];
  this.encoding = false;
  this.lastPing = null;

  this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function () {
  debug('disconnect');
  this.skipReconnect = true;
  this.reconnecting = false;
  if ('opening' === this.readyState) {
    // `onclose` will not fire because
    // an open event never happened
    this.cleanup();
  }
  this.backoff.reset();
  this.readyState = 'closed';
  if (this.engine) this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function (reason) {
  debug('onclose');

  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);

  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function () {
  if (this.reconnecting || this.skipReconnect) return this;

  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);

    this.reconnecting = true;
    var timer = setTimeout(function () {
      if (self.skipReconnect) return;

      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);

      // check again for the case socket closed in above events
      if (self.skipReconnect) return;

      self.open(function (err) {
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);

    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function () {
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":32,"./socket":33,"backo2":3,"component-bind":6,"component-emitter":7,"debug":9,"engine.io-client":11,"indexof":25,"socket.io-parser":36}],32:[function(require,module,exports){

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on (obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function () {
      obj.removeListener(ev, fn);
    }
  };
}

},{}],33:[function(require,module,exports){

/**
 * Module dependencies.
 */

var parser = require('socket.io-parser');
var Emitter = require('component-emitter');
var toArray = require('to-array');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:socket');
var parseqs = require('parseqs');
var hasBin = require('has-binary2');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  connecting: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1,
  ping: 1,
  pong: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket (io, nsp, opts) {
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat
  this.ids = 0;
  this.acks = {};
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
  this.flags = {};
  if (opts && opts.query) {
    this.query = opts.query;
  }
  if (this.io.autoConnect) this.open();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function () {
  if (this.subs) return;

  var io = this.io;
  this.subs = [
    on(io, 'open', bind(this, 'onopen')),
    on(io, 'packet', bind(this, 'onpacket')),
    on(io, 'close', bind(this, 'onclose'))
  ];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function () {
  if (this.connected) return this;

  this.subEvents();
  this.io.open(); // ensure open
  if ('open' === this.io.readyState) this.onopen();
  this.emit('connecting');
  return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function () {
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function (ev) {
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var packet = {
    type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
    data: args
  };

  packet.options = {};
  packet.options.compress = !this.flags || false !== this.flags.compress;

  // event ack callback
  if ('function' === typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  this.flags = {};

  return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function (packet) {
  packet.nsp = this.nsp;
  this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function () {
  debug('transport is open - connecting');

  // write connect packet if necessary
  if ('/' !== this.nsp) {
    if (this.query) {
      var query = typeof this.query === 'object' ? parseqs.encode(this.query) : this.query;
      debug('sending connect packet with query %s', query);
      this.packet({type: parser.CONNECT, query: query});
    } else {
      this.packet({type: parser.CONNECT});
    }
  }
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function (reason) {
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function (packet) {
  var sameNamespace = packet.nsp === this.nsp;
  var rootNamespaceError = packet.type === parser.ERROR && packet.nsp === '/';

  if (!sameNamespace && !rootNamespaceError) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function (packet) {
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function (id) {
  var self = this;
  var sent = false;
  return function () {
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);

    self.packet({
      type: hasBin(args) ? parser.BINARY_ACK : parser.ACK,
      id: id,
      data: args
    });
  };
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function (packet) {
  var ack = this.acks[packet.id];
  if ('function' === typeof ack) {
    debug('calling ack %s with %j', packet.id, packet.data);
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    debug('bad ack %s', packet.id);
  }
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function () {
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function () {
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function () {
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function () {
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }

  this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function () {
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({ type: parser.DISCONNECT });
  }

  // remove socket from pool
  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }
  return this;
};

/**
 * Sets the compress flag.
 *
 * @param {Boolean} if `true`, compresses the sending data
 * @return {Socket} self
 * @api public
 */

Socket.prototype.compress = function (compress) {
  this.flags.compress = compress;
  return this;
};

/**
 * Sets the binary flag
 *
 * @param {Boolean} whether the emitted data contains binary
 * @return {Socket} self
 * @api public
 */

Socket.prototype.binary = function (binary) {
  this.flags.binary = binary;
  return this;
};

},{"./on":32,"component-bind":6,"component-emitter":7,"debug":9,"has-binary2":23,"parseqs":28,"socket.io-parser":36,"to-array":38}],34:[function(require,module,exports){
(function (global){

/**
 * Module dependencies.
 */

var parseuri = require('parseuri');
var debug = require('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url (uri, loc) {
  var obj = uri;

  // default to window.location
  loc = loc || global.location;
  if (null == uri) uri = loc.protocol + '//' + loc.host;

  // relative path support
  if ('string' === typeof uri) {
    if ('/' === uri.charAt(0)) {
      if ('/' === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);
      if ('undefined' !== typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    }

    // parse
    debug('parse %s', uri);
    obj = parseuri(uri);
  }

  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';

  var ipv6 = obj.host.indexOf(':') !== -1;
  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

  // define unique id
  obj.id = obj.protocol + '://' + host + ':' + obj.port;
  // define href
  obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : (':' + obj.port));

  return obj;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"debug":9,"parseuri":29}],35:[function(require,module,exports){
(function (global){
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = require('isarray');
var isBuf = require('./is-buffer');
var toString = Object.prototype.toString;
var withNativeBlob = typeof global.Blob === 'function' || toString.call(global.Blob) === '[object BlobConstructor]';
var withNativeFile = typeof global.File === 'function' || toString.call(global.File) === '[object FileConstructor]';

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet) {
  var buffers = [];
  var packetData = packet.data;
  var pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {packet: pack, buffers: buffers};
};

function _deconstructPacket(data, buffers) {
  if (!data) return data;

  if (isBuf(data)) {
    var placeholder = { _placeholder: true, num: buffers.length };
    buffers.push(data);
    return placeholder;
  } else if (isArray(data)) {
    var newData = new Array(data.length);
    for (var i = 0; i < data.length; i++) {
      newData[i] = _deconstructPacket(data[i], buffers);
    }
    return newData;
  } else if (typeof data === 'object' && !(data instanceof Date)) {
    var newData = {};
    for (var key in data) {
      newData[key] = _deconstructPacket(data[key], buffers);
    }
    return newData;
  }
  return data;
}

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  packet.attachments = undefined; // no longer useful
  return packet;
};

function _reconstructPacket(data, buffers) {
  if (!data) return data;

  if (data && data._placeholder) {
    return buffers[data.num]; // appropriate buffer (should be natural order anyway)
  } else if (isArray(data)) {
    for (var i = 0; i < data.length; i++) {
      data[i] = _reconstructPacket(data[i], buffers);
    }
  } else if (typeof data === 'object') {
    for (var key in data) {
      data[key] = _reconstructPacket(data[key], buffers);
    }
  }

  return data;
}

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj;

    // convert any blob
    if ((withNativeBlob && obj instanceof Blob) ||
        (withNativeFile && obj instanceof File)) {
      pendingBlobs++;

      // async filereader
      var fileReader = new FileReader();
      fileReader.onload = function() { // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        }
        else {
          bloblessData = this.result;
        }

        // if nothing pending its callback time
        if(! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) { // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (typeof obj === 'object' && !isBuf(obj)) { // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;
  _removeBlobs(bloblessData);
  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./is-buffer":37,"isarray":26}],36:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('socket.io-parser');
var Emitter = require('component-emitter');
var binary = require('./binary');
var isArray = require('isarray');
var isBuf = require('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'ACK',
  'ERROR',
  'BINARY_EVENT',
  'BINARY_ACK'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

var ERROR_PACKET = exports.ERROR + '"encode error"';

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback){
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    encodeAsBinary(obj, callback);
  } else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {

  // first is type
  var str = '' + obj.type;

  // attachments if we have them
  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    str += obj.attachments + '-';
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' !== obj.nsp) {
    str += obj.nsp + ',';
  }

  // immediately followed by the id
  if (null != obj.id) {
    str += obj.id;
  }

  // json data
  if (null != obj.data) {
    var payload = tryStringify(obj.data);
    if (payload !== false) {
      str += payload;
    } else {
      return ERROR_PACKET;
    }
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

function tryStringify(str) {
  try {
    return JSON.stringify(str);
  } catch(e){
    return false;
  }
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;

    buffers.unshift(pack); // add packet info to beginning of data list
    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
  this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
  var packet;
  if (typeof obj === 'string') {
    packet = decodeString(obj);
    if (exports.BINARY_EVENT === packet.type || exports.BINARY_ACK === packet.type) { // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet);

      // no attachments, labeled binary but no binary data to follow
      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else { // non-binary full packet
      this.emit('decoded', packet);
    }
  }
  else if (isBuf(obj) || obj.base64) { // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);
      if (packet) { // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  }
  else {
    throw new Error('Unknown type: ' + obj);
  }
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  var i = 0;
  // look up type
  var p = {
    type: Number(str.charAt(0))
  };

  if (null == exports.types[p.type]) {
    return error('unknown packet type ' + p.type);
  }

  // look up attachments if type binary
  if (exports.BINARY_EVENT === p.type || exports.BINARY_ACK === p.type) {
    var buf = '';
    while (str.charAt(++i) !== '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }
    if (buf != Number(buf) || str.charAt(i) !== '-') {
      throw new Error('Illegal attachments');
    }
    p.attachments = Number(buf);
  }

  // look up namespace (if any)
  if ('/' === str.charAt(i + 1)) {
    p.nsp = '';
    while (++i) {
      var c = str.charAt(i);
      if (',' === c) break;
      p.nsp += c;
      if (i === str.length) break;
    }
  } else {
    p.nsp = '/';
  }

  // look up id
  var next = str.charAt(i + 1);
  if ('' !== next && Number(next) == next) {
    p.id = '';
    while (++i) {
      var c = str.charAt(i);
      if (null == c || Number(c) != c) {
        --i;
        break;
      }
      p.id += str.charAt(i);
      if (i === str.length) break;
    }
    p.id = Number(p.id);
  }

  // look up json data
  if (str.charAt(++i)) {
    var payload = tryParse(str.substr(i));
    var isPayloadValid = payload !== false && (p.type === exports.ERROR || isArray(payload));
    if (isPayloadValid) {
      p.data = payload;
    } else {
      return error('invalid payload');
    }
  }

  debug('decoded %s as %j', str, p);
  return p;
}

function tryParse(str) {
  try {
    return JSON.parse(str);
  } catch(e){
    return false;
  }
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
  this.buffers.push(binData);
  if (this.buffers.length === this.reconPack.attachments) { // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }
  return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
  this.reconPack = null;
  this.buffers = [];
};

function error(msg) {
  return {
    type: exports.ERROR,
    data: 'parser error: ' + msg
  };
}

},{"./binary":35,"./is-buffer":37,"component-emitter":7,"debug":9,"isarray":26}],37:[function(require,module,exports){
(function (global){

module.exports = isBuf;

var withNativeBuffer = typeof global.Buffer === 'function' && typeof global.Buffer.isBuffer === 'function';
var withNativeArrayBuffer = typeof global.ArrayBuffer === 'function';

var isView = (function () {
  if (withNativeArrayBuffer && typeof global.ArrayBuffer.isView === 'function') {
    return global.ArrayBuffer.isView;
  } else {
    return function (obj) { return obj.buffer instanceof global.ArrayBuffer; };
  }
})();

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
  return (withNativeBuffer && global.Buffer.isBuffer(obj)) ||
          (withNativeArrayBuffer && (obj instanceof global.ArrayBuffer || isView(obj)));
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],38:[function(require,module,exports){
module.exports = toArray

function toArray(list, index) {
    var array = []

    index = index || 0

    for (var i = index || 0; i < list.length; i++) {
        array[i - index] = list[i]
    }

    return array
}

},{}],39:[function(require,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}],40:[function(require,module,exports){
const { AceBaseBase, DebugLogger } = require('acebase-core');
const { WebApi } = require('./api-web');
const { AceBaseClientAuth } = require('./auth');

class AceBaseClientConnectionSettings {

    /**
     * Settings to connect to a remote AceBase server
     * @param {object} settings 
     * @param {string} settings.dbname Name of the database you want to access
     * @param {string} settings.host Host name, eg "localhost", or "mydb.domain.com"
     * @param {number} settings.port Port number the server is running on
     * @param {boolean} [settings.https=true] Use SSL (https) to access the server or not. Default: true
     * @param {boolean} [settings.autoConnect=true] Automatically connect to the server, or wait until .connect is called
     * @param {object} [settings.cache] Settings for local cache
     * @param {AceBase} [settings.cache.db] AceBase database instance to use for local cache
     * @param {'verbose'|'log'|'warn'|'error'} [settings.logLevel='log'] debug logging level
     * 
     */
    constructor(settings) {
        this.dbname = settings.dbname;
        this.host = settings.host;
        this.port = settings.port;
        this.https = typeof settings.https === 'boolean' ? settings.https : true;
        this.autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.cache = typeof settings.cache === 'object' && typeof settings.cache.db === 'object' ? settings.cache : null; //  && settings.cache.db.constructor.name.startsWith('AceBase')
        this.logLevel = typeof settings.logLevel === 'string' ? settings.logLevel : 'log';
    }
}

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 * @extends module:acebase-core/AceBaseBase
 */
class AceBaseClient extends AceBaseBase {

    /**
     * Create a client to access an AceBase server
     * @param {AceBaseClientConnectionSettings} settings
     */
    constructor(settings) {
        if (typeof settings !== 'object') {
            // Use old constructor signature: host, port, dbname, https = true
            settings = {};
            settings.host = arguments[0];
            settings.port = arguments[1];
            settings.dbname = arguments[2];
            settings.https = arguments[3];
        }
        if (!(settings instanceof AceBaseClientConnectionSettings)) {
            settings = new AceBaseClientConnectionSettings(settings);
        }
        super(settings.dbname, {});

        /*
            TODO: improve init flow with await/async (requires Node 7.6+) 
        */

        const cacheDb = settings.cache && settings.cache.db;
        const cacheReadyPromise = cacheDb ? cacheDb.ready() : Promise.resolve();

        let ready = false;
        this.on('ready', () => { ready = true; });
        this._connected = false;
        this.debug = new DebugLogger(settings.logLevel, `[${settings.dbname}]`.blue); // `[ ${settings.dbname} ]`

        let syncRunning = false;
        const syncPendingChanges = () => {
            if (syncRunning) { 
                // Already syncing
                return; 
            }
            if (!this._connected) {
                return; // We'll retry once connected
            }
            syncRunning = true;
            return cacheReadyPromise.then(() => {
                return this.api.sync({
                    fetchFreshData: ready,
                    eventCallback: (eventName, args) => {
                        this.debug.log(eventName, args || '');
                        this.emit(eventName, args); // this.emit('cache_sync_event', { name: eventName, args });
                    }
                });
            })
            .catch(err => {
                // Sync failed for some reason
                console.error(`Failed to synchronize:`, err);
            })
            .then(() => {
                syncRunning = false;
            });
        }
        let syncTimeout = 0;
        this.on('connect', () => {
            syncTimeout && clearTimeout(syncTimeout);
            syncTimeout = setTimeout(syncPendingChanges, 1000); // Start sync with a short delay to allow client to sign in first
        });
        this.on('signin', () => {
            syncTimeout && clearTimeout(syncTimeout);
            syncPendingChanges();
        });
        if (cacheDb) {
            const remoteConnectPromise = new Promise(resolve => this.once('connect', resolve));
            const syncDonePromise = new Promise(resolve => this.once('sync_done', resolve));
            cacheReadyPromise.then(() => {
                // Cache database is ready. Is remote database ready?
                let waitForSyncEvent = true;
                return promiseTimeout(
                    1000, 
                    remoteConnectPromise, 
                    'remote connection'
                )
                .catch(err => {
                    // If the connect promise timed out, we'll emit the ready event and use the cache.
                    // Any other error should halt execution
                    if (err instanceof PromiseTimeoutError) {
                        waitForSyncEvent = false;
                    }
                    else {
                        this.debug.error(`Error: ${err.message}`);
                        throw err;
                    }
                })
                .then(() => {
                    if (waitForSyncEvent) {
                        return syncDonePromise;
                    }
                })
                .then(() => {
                    this.emit('ready');
                });
            });
        }

        this.api = new WebApi(settings.dbname, { logLevel: settings.logLevel, debug: this.debug, url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`, autoConnect: settings.autoConnect, cache: settings.cache }, evt => {
            if (evt === 'connect') {
                this._connected = true;
                this.emit('connect');
                if (!ready) {
                    // If no local cache is used, we can emit the ready event now.
                    if (!settings.cache) {
                        this.emit('ready');
                    }
                }
            }
            else if (evt === 'disconnect') {
                this._connected = false;
                this.emit('disconnect');
            }
        });
        this.auth = new AceBaseClientAuth(this, (event, arg) => {
            this.emit(event, arg);
        });
    }

    get connected() {
        return this._connected;
    }

    connect() {
        return this.api.connect();
    }

    disconnect() {
        this.api.disconnect();
    }

    callExtension(method, path, data) {
        return this.api.callExtension(method, path, data);
    }
}

class PromiseTimeoutError extends Error {}
function promiseTimeout(ms, promise, comment) {
    let id;
    if (!promise) { promise = new Promise(() => { /* never resolves */}); }
    let timeout = new Promise((resolve, reject) => {
      id = setTimeout(() => {
        reject(new PromiseTimeoutError(`Promise timed out after ${ms}ms: ${comment}`))
      }, ms)
    })
  
    return Promise.race([
      promise,
      timeout
    ])
    .then((result) => {
      clearTimeout(id)
  
      /**
       * ... we also need to pass the result back
       */
      return result
    })
}

module.exports = { AceBaseClient, AceBaseClientConnectionSettings };
},{"./api-web":41,"./auth":42,"acebase-core":159}],41:[function(require,module,exports){
(function (Buffer){
const { Api, Transport, ID, PathInfo } = require('acebase-core');
const http = require('http');
const https = require('https');
const URL = require('url');
const connectSocket = require('socket.io-client');

class AceBaseRequestError extends Error {
    constructor(request, response, code, message) {
        super(message);
        this.code = code;
        this.request = request;
        this.response = response;
    }
}

const NOT_CONNECTED_ERROR_MESSAGE = 'remote database is not connected'; //'AceBaseClient is not connected';

const _request = (method, url, options = { accessToken: null, data: null, dataReceivedCallback: null, context: null }) => {
    return new Promise((resolve, reject) => {
        let endpoint = URL.parse(url);

        let postData = options.data;
        if (typeof postData === 'undefined' || postData === null) {
            postData = '';
        }
        else if (typeof postData === 'object') {
            postData = JSON.stringify(postData);
        }
        const request = {
            method: method,
            protocol: endpoint.protocol,
            host: endpoint.hostname,
            port: endpoint.port,
            path: endpoint.path, //.pathname,
            headers: {
                'AceBase-Context': JSON.stringify(options.context || null),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        if (options.accessToken) {
            request.headers['Authorization'] = `Bearer ${options.accessToken}`;
        }
        const client = request.protocol === 'https:' ? https : http;
        const req = client.request(request, res => {
            res.setEncoding("utf8");
            let data = '';
            if (typeof options.dataReceivedCallback === 'function') {
                res.on('data', options.dataReceivedCallback);
            }
            else {
                res.on('data', chunk => { data += chunk; });
            }
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (data[0] === '{') {
                        let val = JSON.parse(data);
                        // console.log('Delaying data retrieval...')
                        // setTimeout(() => resolve(val), 2500);
                        resolve(val);
                    }
                    else {
                        resolve(data);
                    }
                }
                else {
                    request.body = postData;
                    const response = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        body: data
                    };
                    let code = res.statusCode, message = res.statusMessage;
                    if (data[0] == '{') {
                        let err = JSON.parse(data);
                        if (err.code) { code = err.code; }
                        if (err.message) { message = err.message; }
                    }
                    return reject(new AceBaseRequestError(request, response, code, message));
                }
            });
        });

        req.on('error', (err) => {
            reject(new AceBaseRequestError(request, null, err.code || err.name, err.message));
        });

        if (postData.length > 0) {
            req.write(postData);
        }
        req.end();
    });
};

const _websocketRequest = (socket, event, data, accessToken) => {

    const requestId = ID.generate();
    const request = data;
    request.req_id = requestId;
    request.access_token = accessToken;

    socket.emit(event, request);

    let resolve, reject;
    let promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    const handle = response => {
        if (response.req_id === requestId) {
            socket.off("result", handle);
            if (response.success) {
                resolve(response);
            }
            else {
                // Access denied?
                // const err = new Error(response.reason.message);
                // err.code = response.reason.code;
                // err.request = request;
                // err.response = response;
                const code = typeof response.reason === 'object' ? response.reason.code : response.reason;
                const message = typeof response.reason === 'object' ? response.reason.message : `request failed: ${code}`;
                const err = new AceBaseRequestError(request, response, code, message);
                reject(err);
            }
        }
    };    
    socket.on("result", handle);

    return promise;
}

/**
 * Api to connect to a remote AceBase server over http(s)
 */
class WebApi extends Api {

    constructor(dbname = "default", settings, callback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();

        this._id = ID.generate(); // For mutation contexts, not using websocket client id because that might cause security issues
        this.url = settings.url;
        this._autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.dbname = dbname;
        this._connected = false;
        this._connecting = false;
        this._cache = settings.cache;
        this._realtimeQueries = {};
        this.debug = settings.debug;
        this._connectHooks = [];
        const eventCallback = (name, ...args) => {
            if (name === 'connect') {
                const callbacks = this._connectHooks;
                this._connectHooks = [];
                callbacks.forEach(callback => {
                    try { callback(); }
                    catch(err) {}
                });
            }
            callback(name, ...args);
        };

        let subscriptions = this._subscriptions = {};
        let accessToken;

        this.connect = () => {            
            if (this.socket !== null && typeof this.socket === 'object') {
                this.disconnect();
            }
            this._connecting = true;
            this.debug.log(`Connecting to AceBase server "${this.url}"`);
            if (!this.url.startsWith('https')) {
                this.debug.warn(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`.red)
            }
    
            return new Promise((resolve, reject) => {
                const socket = this.socket = connectSocket(this.url);

                socket.on("reconnect_attempt", () => {
                    this._connecting = true;
                });

                socket.on("reconnect_error", (err) => {
                    this._connecting = false;
                });

                socket.on("reconnect_failed", (err) => {
                    // Reconnecting failed
                    const scheduleRetry = () => {
                        // Try connecting again in a minute
                        setTimeout(() => { this.connect().catch(err => { scheduleRetry(); }); }, 60 * 1000);
                    };
                    if (typeof window !== 'undefined') {
                        // Monitor browser online event
                        const listener = () => {
                            window.removeEventListener('online', listener);
                            scheduleRetry();
                        }
                        window.addEventListener('online', listener);
                    }
                    else {
                        scheduleRetry();
                    }
                });

                socket.on("connect_error", (data) => {
                    // New connection failed to establish
                    this._connected = false;
                    this.debug.error(`Websocket connection error: ${data}`);
                    reject(new Error(`connect_error: ${data}`));
                });

                socket.on("connect_timeout", (data) => {
                    // New connection failed to establish
                    this._connected = false;
                    this.debug.error(`Websocket connection timeout`);
                    reject(new Error(`connect_timeout`));
                });

                socket.on("connect", (data) => {
                    this._connecting = false;
                    this._connected = true;
                    // eventCallback && eventCallback('connect');

                    // Sign in
                    let signInPromise = Promise.resolve();
                    if (accessToken) {
                        // User must be signed in again (NOTE: this does not trigger "signin" event)
                        signInPromise = this.signInWithToken(accessToken);
                    }
                    signInPromise.then(() => {
                        // (re)subscribe to any active subscriptions
                        const subscribePromises = [];
                        Object.keys(subscriptions).forEach(path => {
                            const events = [];
                            subscriptions[path].forEach(subscr => {
                                if (subscr.event === 'mutated') { return; } // Skip mutated events for now
                                const serverAlreadyNotifying = events.includes(subscr.event);
                                if (!serverAlreadyNotifying) {
                                    events.push(subscr.event);
                                    const promise = _websocketRequest(this.socket, 'subscribe', { path, event: subscr.event }, accessToken);
                                    subscribePromises.push(promise.catch(err => { console.error(err); }));
                                }
                            });
                        });
                        // Now, subscribe to all top path mutated events
                        Object.keys(subscriptions)
                            .filter(path => subscriptions[path].some(sub => sub.event === 'mutated'))
                            .filter((path, i, arr) => !arr.some(otherPath => PathInfo.get(otherPath).isAncestorOf(path)))
                            .forEach(topEventPath => {
                                const promise = _websocketRequest(this.socket, 'subscribe', { path: topEventPath, event: 'mutated' }, accessToken);
                                subscribePromises.push(promise.catch(err => { console.error(err); }));
                            });
                        return Promise.all(subscribePromises);
                    })
                    .then(() => {
                        eventCallback && eventCallback('connect'); // Safe to let client know we're connected
                        resolve(); // Resolve the .connect() promise
                    });
                });

                socket.on("disconnect", (data) => {
                    // Existing connection was broken, by us or network
                    this._connected = false;
                    eventCallback && eventCallback('disconnect');
                });

                socket.on("data-event", data => {
                    const val = Transport.deserialize(data.val);
                    const context = data.context || {};

                    /*
                        Using the new context, we can determine how we should handle this data event.
                        From client v0.9.29 on, the set and update API methods add an acebase_mutation object
                        to the context with the following info:

                        client_id: which client initiated the mutation (web api instance, also different per browser tab)
                        id: a unique id of the mutation
                        op: operation used: 'set' or 'update'
                        path: the path the operation was executed on
                        flow: the flow used: 
                            - 'server': app was connected, cache was not used.
                            - 'cache': app was offline while mutating, now syncs its change
                            - 'parallel': app was connected, cache was used and updated

                        To determine how to handle this data event, we have to know what events may have already
                        been fired.

                        [Mutation initiated:]
                            - Cache database used?
                                - No -> 'server' flow
                                - Yes -> Client was online/connected?
                                    - No -> 'cache' flow (saved to cache db, sycing once connected)
                                    - Yes -> 'parallel' flow
                        
                        During 'cache' and 'parallel' flow, any change events will have fired on the cache database
                        already. If we are receiving this data event on the same client, that means we don't have to
                        fire those events again. If we receive this event on a different client, we only have to fire 
                        events if they change cached data.

                        [Change event received:]
                            - Is mutation done by us?
                                - No -> Are we using cache?
                                    - No -> Fire events
                                    - Yes -> Update cache with events disabled*, fire events
                                - Yes -> Are we using cache?
                                    - No -> Fire events ourself
                                    - Yes -> Skip cache update, don't fire events (both done already)

                        * Different browser tabs use the same cache database. If we would let the cache database fire data change
                        events, they would only fire in 1 browser tab - the first one to update the cache, the others will see 
                        no changes because the data will have been updated already.

                        NOTE: While offline, the in-memory state of 2 separate browser tabs will go out of sync
                        because they rely on change notifications from the server - to tackle this problem, 
                        cross-tab communication must be implemented. (TODO: Let cache database change notifications
                        be sent to other tabs, and let them use the same client ID for server comminications)
                    */
                    const causedByUs = context.acebase_mutation && context.acebase_mutation.client_id === this._id;
                    const cacheEnabled = !!(this._cache && this._cache.db);
                    const fireThisEvent = !causedByUs || !cacheEnabled;
                    const updateCache = !causedByUs && cacheEnabled;
                    const fireCacheEvents = false; // See above flow documentation

                    // console.log(`${this._cache ? `[${this._cache.db.api.storage.name}] ` : ''}Received data event "${data.event}" on path "${data.path}":`, val);
                    console.log(`Received data event "${data.event}" on path "${data.path}":`, val);
                    const pathSubs = subscriptions[data.subscr_path];

                    if (!pathSubs && data.event !== 'mutated') {
                        // weird. we are not subscribed on this path?
                        this.debug.warn(`Received a data-event on a path we did not subscribe to: "${data.path}"`);
                        return;
                    }
                    if (updateCache) {
                        if (data.path.startsWith('__')) {
                            // Don't cache private data. This happens when the admin user is signed in 
                            // and has an event subscription on the root, or private path.
                            // NOTE: fireThisEvent === true, because it is impossible that this mutation was caused by us (well, it should be!)
                        }
                        else if (data.event === 'notify_child_removed') {
                            this._cache.db.api.set(PathInfo.getChildPath(`${this.dbname}/cache`, data.path), null, { suppress_events: !fireCacheEvents, context }); // Remove cached value
                        }
                        else if (!data.event.startsWith('notify_')) {
                            this._cache.db.api.set(PathInfo.getChildPath(`${this.dbname}/cache`, data.path), val.current, { suppress_events: !fireCacheEvents, context }); // Update cached value
                        }
                    }
                    if (!fireThisEvent) {
                        return;
                    }
                    // CHANGED - Only fire events if they were not triggered by the cache db already (and they only fired if the cached data really changed!)
                    // The last point in the comment above is why I changed this. If the local cache does not change, no events will be fired. This causes an
                    // issue in browser contexts when there are multiple open tabs: they share the same cache database and if 1 tab makes changes to the cache, 
                    // other clients won't know about it, and will not be notified of any changes.
                    // TODO: Implement cross-tab notifications in acebase/src/acebase-browser.js
                    const targetSubs = data.event === 'mutated'
                        ? Object.keys(subscriptions)
                            .filter(path => {
                                const pathInfo = PathInfo.get(path);
                                return path === data.path || pathInfo.equals(data.subscr_path) || pathInfo.isAncestorOf(data.path)
                            })
                            .reduce((subs, path) => {
                                const add = subscriptions[path].filter(sub => sub.event === 'mutated');
                                subs.push(...add);
                                return subs;
                            }, [])
                        : pathSubs.filter(sub => sub.event === data.event);
                    
                    targetSubs.forEach(subscr => { // !eventsFired && 
                        subscr.callback(null, data.path, val.current, val.previous, context);
                    });
                });

                socket.on("query-event", data => {
                    data = Transport.deserialize(data);
                    const query = this._realtimeQueries[data.query_id];
                    let keepMonitoring = true;
                    try {
                        keepMonitoring = query.options.eventHandler(data);
                    }
                    catch(err) {
                        keepMonitoring = false;
                    }
                    if (keepMonitoring === false) {
                        delete this._realtimeQueries[data.query_id];
                        socket.emit("query_unsubscribe", { query_id: data.query_id });
                    }
                });
            });
        };

        if (this._autoConnect) {
            this.connect();
        }

        this.disconnect = () => {
            if (this.socket !== null && typeof this.socket === 'object') {
                this.socket.disconnect();
                this.socket = null;
            }
            this._connected = false;
            this._connecting = false;
        }

        this.subscribe = (path, event, callback) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { pathSubs = subscriptions[path] = []; }
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event)
                || (event === 'mutated' && Object.keys(subscriptions).some(otherPath => PathInfo.get(otherPath).isAncestorOf(path) && subscriptions[otherPath].some(sub => sub.event === event)));
            const subscr = { path, event, callback };
            pathSubs.push(subscr);

            if (this._cache) {
                // Events are also handled by cache db
                subscr.cacheCallback = (err, path, newValue, oldValue, context) => subscr.callback(err, path.slice(`${this.dbname}/cache/`.length), newValue, oldValue, context);
                this._cache.db.api.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), event, subscr.cacheCallback);
            }

            if (serverAlreadyNotifying || !this._connected) {
                return Promise.resolve();
            }
            if (event === 'mutated') {
                // Unsubscribe from 'mutated' events set on descendant paths of current path
                Object.keys(subscriptions)
                .filter(otherPath => 
                    PathInfo.get(otherPath).isDescendantOf(path) 
                    && subscriptions[otherPath].some(sub => sub.event === 'mutated')
                )
                .map(path => _websocketRequest(this.socket, "unsubscribe", { path, event: 'mutated' }, accessToken))
                .map(promise => promise.catch(err => console.error(err)))
            }
            return _websocketRequest(this.socket, "subscribe", { path, event }, accessToken);
        };

        this.unsubscribe = (path, event = undefined, callback = undefined) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { return; }

            const unsubscribeFrom = (subscriptions) => {
                subscriptions.forEach(subscr => {
                    pathSubs.splice(pathSubs.indexOf(subscr), 1);
                    if (this._cache) {
                        // Events are also handled by cache db, also remove those
                        console.assert(typeof subscr.cacheCallback !== 'undefined', 'When subscription was added, cacheCallback must have been set');
                        this._cache.db.api.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), subscr.event, subscr.cacheCallback);
                    }
                });
            };

            const hadMutatedEvents = pathSubs.some(sub => sub.event === 'mutated');
            if (!event) {
                // Unsubscribe from all events on path
                unsubscribeFrom(pathSubs);
            }
            else if (!callback) {
                // Unsubscribe from specific event on path
                const subscriptions = pathSubs.filter(subscr => subscr.event === event);
                unsubscribeFrom(subscriptions);
            }
            else {
                // Unsubscribe from a specific callback on path event
                const subscriptions = pathSubs.filter(subscr => subscr.event === event && subscr.callback === callback);
                unsubscribeFrom(subscriptions);
            }
            const hasMutatedEvents = pathSubs.some(sub => sub.event === 'mutated');

            let promise = Promise.resolve();
            if (pathSubs.length === 0) {
                // Unsubscribed from all events on path
                delete subscriptions[path];
                if (this._connected) {
                    promise = _websocketRequest(this.socket, 'unsubscribe', { path, access_token: accessToken }, accessToken);
                }
            }
            else if (this._connected && !pathSubs.some(subscr => subscr.event === event)) {
                // No callbacks left for specific event
                promise = _websocketRequest(this.socket, 'unsubscribe', { path: path, event, access_token: accessToken }, accessToken);
            }
            if (this._connected && hadMutatedEvents && !hasMutatedEvents) {
                // If any descendant paths have mutated events, resubscribe those
                const promises = Object.keys(subscriptions)
                    .filter(otherPath => PathInfo.get(otherPath).isDescendantOf(path) && subscriptions[otherPath].some(sub => sub.event === 'mutated'))
                    .map(path => _websocketRequest(this.socket, 'subscribe', { path: path, event: 'mutated' }, accessToken))
                    .map(promise => promise.catch(err => console.error(err)));
                promise = Promise.all([promise, ...promises]);
            }
            return promise;
        };

        this.transaction = (path, callback, options = { context: {} }) => {
            const id = ID.generate();
            options.context = options.context || {};
            options.context.acebase_mutation = {
                client_id: this._id,
                id,
                op: 'transaction',
                path,
                flow: 'server'
            };
            const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
            let cacheUpdateVal;
            const startedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_started", startedCallback);
                    const currentValue = Transport.deserialize(data.value);
                    const val = callback(currentValue);
                    const finish = (val) => {
                        const newValue = Transport.serialize(val);
                        this.socket.emit("transaction", { action: "finish", id: id, path, value: newValue, access_token: accessToken });
                        if (this._cache) {
                            cacheUpdateVal = val;
                        }
                    };
                    if (val instanceof Promise) {
                        val.then(finish);
                    }
                    else {
                        finish(val);
                    }
                }
            }
            let txResolve, txReject, txPromise = new Promise((resolve, reject) => {
                txResolve = resolve;
                txReject = reject;
            });
            const handleSuccess = () => {
                if (this._cache && typeof cacheUpdateVal !== 'undefined') {
                    // Update cache db value
                    this._cache.db.api.set(cachePath, cacheUpdateVal).then(() => {
                        txResolve(this);
                    })
                }
                else {
                    txResolve(this);
                }
            };
            const handleFailure = err => {
                txReject(err);
            }
            const completedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_completed", completedCallback);
                    handleSuccess();
                }
            }
            const connectedCallback = () => {
                this.socket.on("tx_started", startedCallback);
                this.socket.on("tx_completed", completedCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                this.socket.emit("transaction", { action: "start", id, path, access_token: accessToken, context: options.context });
            };
            if (this._connected) { 
                connectedCallback(); 
            }
            else { 
                // Websocket might not be connected. Try http call instead
                const data = JSON.stringify({ path });
                this._request({ ignoreConnectionState: true, method: "POST", url: `${this.url}/transaction/${this.dbname}/start`, data, context: options.context })
                .then(tx => {
                    const id = tx.id;
                    const currentValue = Transport.deserialize(tx.value);
                    const value = callback(currentValue);
                    const data = JSON.stringify({ id, value: Transport.serialize(value) });
                    return this._request({ ignoreConnectionState: true, method: "POST", url: `${this.url}/transaction/${this.dbname}/finish`, data, context: options.context })
                })
                .catch(err => {
                    if (['ETIMEDOUT','ENOTFOUND','ECONNRESET','ECONNREFUSED','EPIPE'].includes(err.code)) {
                        err.message = NOT_CONNECTED_ERROR_MESSAGE;
                        // handleFailure(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                    }
                    handleFailure(err);
                });
            }
            return txPromise;
        };

        /**
         * @param {object} options 
         * @param {string} options.url
         * @param {'GET'|'PUT'|'POST'|'DELETE'} [options.method='GET']
         * @param {any} [options.data] Data to post when method is PUT or POST
         * @param {any} [options.context] Context to add to PUT or POST requests
         * @param {(chunk: string) => void} [options.dataReceivedCallback] A method that overrides the default data receiving handler. Override for streaming.
         * @param {boolean} [options.ignoreConnectionState=false] Whether to try the request even if there is no connection
         */
        this._request = (options) => {
            if (this._connected || options.ignoreConnectionState === true) { 
                return _request(options.method || 'GET', options.url, { data: options.data, accessToken, dataReceivedCallback: options.dataReceivedCallback, context: options.context })
                .catch(err => {
                    throw err;
                });
            }
            else {
                // We're not connected. We can wait for the connection to be established,
                // or fail the request now. Because we have now implemented caching, live requests
                // are only executed if they are not allowed to use cached responses. Wait for a
                // connection to be established (max 1s), then retry or fail

                if (!this._connecting) {
                    // We're currently not trying to connect. Fail now
                    return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                }

                let resolve, reject, 
                    promise = new Promise((rs, rj) => { resolve = rs; reject = rj; }),
                    state = 'wait',
                    timeout = setTimeout(() => {
                        if (state !== 'wait') { return; }
                        state = 'timeout';
                        this.socket.off('connect', callback); // Cancel connect wait
                        reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                    }, 1000),
                    callback = () => {
                        if (state !== 'wait') { return; }
                        state = 'connected';
                        clearTimeout(timeout); // Cancel timeout
                        this._request(options)
                        .then(resolve)
                        .catch(reject);
                    };
                this.socket.on('connect', callback); // wait for connection
                return promise;
            }
        };

        this.signIn = (username, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'account', username, password, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                // Make sure the connected websocket server knows who we are as well. 
                // (this is currently not necessary because the server does not support clustering yet, 
                // but future versions might be connected to a different instance than the one that 
                // handled the signin http request just now)
                this.socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithEmail = (email, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'email', email, password, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithToken = (token) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'token', access_token: token, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.startAuthProviderSignIn = (providerName, callbackUrl) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/init?provider=${providerName}&callbackUrl=${callbackUrl}` })
            .then(result => {
                return { redirectUrl: result.redirectUrl };
            })
            .catch(err => {
                throw err;
            });
        }

        this.finishAuthProviderSignIn = (callbackResult) => {
            /** @type {{ provider: { name: string, access_token: string, refresh_token: string, expires_in: number }, access_token: string, user: AceBaseUser }} */
            let result;
            try {
                result = JSON.parse(Buffer.from(callbackResult, 'base64').toString('utf8'));
                // TODO: Implement server check
            }
            catch(err) {
                return Promise.reject(`Invalid result`);
            }
            accessToken = result.access_token;
            this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
            return Promise.resolve({ user: result.user, accessToken, provider: result.provider });
        }

        this.refreshAuthProviderToken = (providerName, refreshToken) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/refresh?provider=${providerName}&refresh_token=${refreshToken}` })
            .then(result => {
                return result;
            })
            .catch(err => {
                throw err;
            });
        }

        this.signOut = (everywhere = false) => {
            if (!accessToken) { return Promise.resolve(); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signout`, data: { client_id: this.socket.id, everywhere } })
            .then(() => {
                this.socket.emit("signout", accessToken); // Make sure the connected websocket server knows we signed out as well. 
                accessToken = null;
            })
            .catch(err => {
                throw err;
            });
        };

        this.changePassword = (uid, currentPassword, newPassword) => {
            if (!accessToken) { return Promise.reject(new Error(`not_signed_in`)); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/change_password`, data: { uid, password: currentPassword, new_password: newPassword } })
            .then(result => {
                accessToken = result.access_token;
                return { accessToken };
            })
            .catch(err => {
                throw err;
            });
        };
    
        this.forgotPassword = (email) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/forgot_password`, data: { email } })
            .catch(err => {
                throw err;
            });
        };

        this.verifyEmailAddress = (verificationCode) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/verify_email`, data: { code: verificationCode } })
            .catch(err => {
                throw err;
            });
        };

        this.resetPassword = (resetCode, newPassword) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/reset_password`, data: { code: resetCode, password: newPassword } })
            .catch(err => {
                throw err;
            });
        };

        this.signUp = (details, signIn = true) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signup`, data: details })
            .then(result => {
                if (signIn) {
                    accessToken = result.access_token;
                    this.socket.emit("signin", accessToken);
                }
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.updateUserDetails = (details) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/update`, data: details })
            .then(result => {
                return { user: result.user };
            })
            .catch(err => {
                throw err;
            });
        }

        this.deleteAccount = (uid, signOut = true) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/delete`, data: { uid } })
            .then(result => {
                if (signOut) {
                    this.socket.emit("signout", accessToken);
                    accessToken = null;
                }
                return true;
            })
            .catch(err => {
                throw err;
            });
        }
    }

    stats(options = undefined) {
        return this._request({ url: `${this.url}/stats/${this.dbname}` });
    }

    sync(options = { fetchFreshData: true, eventCallback: null }) {
        // Sync cache
        if (!this._connected) {
            return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
        }
        // if (!this._cache) {
        //     return Promise.reject(new Error(`no cache database is used`));
        // }
        if (this._cache && !this._cache.db.isReady) {
            return Promise.reject(new Error(`cache database is not ready yet`));
        }

        options.eventCallback && options.eventCallback('sync_start');
        const handleStatsUpdateError = err => {
            this.debug.error(`Failed to update cache db stats:`, err);
        }
        let totalPendingChanges = 0;
        const cacheApi = this._cache && this._cache.db.api;
        let syncPushPromise = Promise.resolve();
        if (this._cache) {
            syncPushPromise = cacheApi.get(`${this.dbname}/pending`)
            .then(pendingChanges => {
                cacheApi.set(`${this.dbname}/stats/last_sync_start`, new Date()).catch(handleStatsUpdateError);
                if (pendingChanges === null) {
                    return; // No updates
                }
                return Object.keys(pendingChanges)
                    .sort((a,b) => a < b ? 1 : -1) // sort z-a
                    .reduce((netChangeIds, id) => {
                        // Only get effective changes: 
                        // ignore operations preceeding a 'set' or 'remove' operation on the same and descendant paths
                        const change = pendingChanges[id];
                        // Check if the change is about a path that is 'set' or 'remove'd later (earlier in our sort order...)
                        const pathInfo = PathInfo.get(change.path);
                        const ignore = netChangeIds.some(id => {
                            const laterChange = pendingChanges[id];
                            return (laterChange.path === change.path || pathInfo.isDescendantOf(laterChange.path)) && ['set','remove'].includes(laterChange.type);
                        })
                        if (!ignore) {
                            netChangeIds.push(id);
                        }
                        else {
                            delete pendingChanges[id];
                            cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                        }
                        return netChangeIds;
                    }, [])
                    .sort() // sort a-z
                    .reduce((prevPromise, id) => {
                        // Now process the net changes
                        const change = pendingChanges[id];
                        this.debug.verbose(`SYNC processing change ${id}: `, change);
                        totalPendingChanges++;
                        const go = () => {
                            let promise;
                            if (change.type === 'update') { 
                                promise = this.update(change.path, change.data, { allow_cache: false, context: change.context });
                            }
                            else if (change.type === 'set') { 
                                if (!change.data) { change.data = null; } // Before type 'remove' was implemented
                                promise = this.set(change.path, change.data, { allow_cache: false, context: change.context });
                            }
                            else if (change.type === 'remove') {
                                promise = this.set(change.path, null, { allow_cache: false, context: change.context });
                            }
                            else {
                                throw new Error(`unsupported change type "${change.type}"`);
                            }
                            return promise
                            .then(() => {
                                this.debug.verbose(`SYNC change ${id} processed ok`);
                                delete pendingChanges[id];
                                cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                            })
                            .catch(err => {
                                // Updating remote db failed
                                this.debug.error(`SYNC change ${id} failed: ${err.message}`);
                                if (!this._connected) {
                                    // Connection was broken, should retry later
                                    throw err;
                                }
                                // We are connected, so the change is not allowed or otherwise denied.
                                if (typeof err === 'string') { 
                                    err = { code: 'unknown', message: err, stack: 'n/a' }; 
                                }
                                cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                                // Delete the change and cached data
                                cacheApi.set(`${this.dbname}/pending/${id}`, null);
                                cacheApi.set(PathInfo.getChildPath(`${this.dbname}/cache`, change.data.path), null);
                                options.eventCallback && options.eventCallback('sync_change_error', { error: err, change });
                            });
                        };
                        return prevPromise.then(go); // Chain to previous promise
                    }, Promise.resolve());
            })
            .then(() => {
                this.debug.verbose(`SYNC push done`);
                cacheApi.set(`${this.dbname}/stats/last_sync_end`, new Date()).catch(handleStatsUpdateError);
                return totalPendingChanges;
            })
            .catch(err => {
                // 1 or more pending changes could not be processed.
                this.debug.error(`SYNC push error: ${err.message}`);
                if (typeof err === 'string') { 
                    err = { code: 'unknown', message: err, stack: 'n/a' }; 
                }
                cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                throw err;
            });            
        }
        let totalRemoteChanges = 0;
        return syncPushPromise
        .then(() => {
            // We've pushed our changes, now get fresh data for all paths with active subscriptions
            if (this._cache && options.fetchFreshData) {
                // Find out what data to load
                const loadPaths = Object.keys(this._subscriptions).reduce((paths, path) => {
                    if (!paths.includes(path)) {
                        const hasValueSubscribers = this._subscriptions[path].some(s => s.event !== 'mutated' && !s.event.startsWith('notify_'));
                        if (hasValueSubscribers) {
                            const pathInfo = PathInfo.get(path);
                            const ancestorIncluded = paths.some(otherPath => pathInfo.isDescendantOf(otherPath));
                            if (!ancestorIncluded) { paths.push(path); }
                        }
                    }
                    return paths;
                }, []);
                // Attach temp events to cache db so they will fire for data changes (just for counting)
                Object.keys(this._subscriptions).forEach(path => {
                    this._subscriptions[path].forEach(subscr => {
                        subscr.tempCallback = (err, path, newValue, oldValue, context) => {
                            totalRemoteChanges++;
                        }
                        cacheApi.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, subscr.path), subscr.event, subscr.tempCallback);
                    });
                });
                // Fetch new data
                const syncPullPromises = loadPaths.map(path => {
                    this.debug.verbose(`SYNC pull "${path}"`);
                    return this.get(path, { allow_cache: false })
                    .catch(err => {
                        this.debug.error(`SYNC pull error`, err);
                        options.eventCallback && options.eventCallback('sync_pull_error', err);
                    });
                });
                return Promise.all(syncPullPromises)
                .then(() => {
                    // Unsubscribe temp cache subscriptions
                    Object.keys(this._subscriptions).forEach(path => {
                        this._subscriptions[path].forEach(subscr => {
                            if (typeof subscr.tempCallback !== 'function') { 
                                // If a subscription was added while synchronizing, it won't have a tempCallback.
                                // This is no big deal, since our tempCallback is only to update sync statistics.
                                // Before acebase-client v0.9.29, this caused all subscriptions with current path
                                // and type to be removed.
                                return; 
                            }
                            cacheApi.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, subscr.path), subscr.event, subscr.tempCallback);
                            delete subscr.tempCallback;
                        });
                    });
                });
            }
            else if (!this._cache) {
                // Not using cache, so there is no real way of knowing if anything changed or removed.
                // We could trigger fake "value", "child_added" and "child_changed" events with fresh data, 
                // but... what's the use? It would result in broken data? 
                // --> Let's run "value" events only, and warn about all other events

                const syncPullPromises = [];
                Object.keys(this._subscriptions).forEach(path => {
                    const subs = this._subscriptions[path];
                    const valueSubscriptions = subs.filter(s => s.event === 'value');
                    if (valueSubscriptions.length === 0) {
                        return subs.forEach(sub => this.debug.warn(`Subscription "${sub.event}" on path "${path}" might have missed events while offline. Data should be reloaded!`));
                    }
                    const p = this.get(path, { allow_cache: false }).then(value => {
                        valueSubscriptions.forEach(subscr => subscr.callback(null, path, value));
                    });
                    syncPullPromises.push(p);
                });
                return Promise.all(syncPullPromises);
            }
        })
        .then(() => {
            this.debug.verbose(`SYNC done`);
            const info = { local: totalPendingChanges, remote: totalRemoteChanges };
            options.eventCallback && options.eventCallback('sync_done', info);
            return info;
        })
        .catch(err => {
            this.debug.error(`SYNC error`, err);
            options.eventCallback && options.eventCallback('sync_error', err);
            throw err;
        });
    }

    set(path, value, options = { allow_cache: true, context: {} }) {
        if (!options.context) { options.context = {}; }
        const useCache = this._cache && options.allow_cache !== false;
        const useServer = this._connected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'set',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(value));
            return this._request({ method: "PUT", url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context })
        };
        if (!useCache) {
            return updateServer();
        }

        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackValue;
        const updateCache = () => {
            return this._cache.db.api.transaction(cachePath, (currentValue) => {
                rollbackValue = currentValue;
                return value;
            }, { context: options.context });
        };
        const rollbackCache = () => {
            return this._cache.db.api.set(cachePath, rollbackValue, { context: options.context });
        };
        const addPendingTransaction = () => {
            return this._cache.db.api.set(`${this.dbname}/pending/${options.context.acebase_mutation.id}`, { type: 'set', path, data: value, context: options.context });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !useServer ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to set cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to set server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error)
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated, cache update was successful.
                // Add pending sync action

                addPendingTransaction().catch(err => {
                    this.debug.error(`Failed to add pending sync action for "${path}", rolling back cache to previous value. Error:`, err);
                    rollbackCache().catch(err => {
                        this.debug.error(`Failed to roll back cache? Error:`, err);
                    });
                });
            }
        })

        // Use optimistic approach - return cache promise
        return cachePromise;
    }

    update(path, updates, options = { allow_cache: true, context: {} }) {
        const useCache = this._cache && options && options.allow_cache !== false;
        const useServer = this._connected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'update',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(updates));
            return this._request({ method: "POST", url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context });
        };
        if (!useCache) {
            return updateServer();
        }

        const cacheApi = this._cache.db.api;
        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackUpdates;
        const updateCache = () => {
            const properties = Object.keys(updates);
            return cacheApi.get(cachePath, { include: properties })
            .then(currentValues => {
                rollbackUpdates = currentValues;
                return cacheApi.update(cachePath, updates, { context: options.context });
            });
        };
        // const deleteCache = () => {
        //     return this._cache.db.api.set(`${this.dbname}/cache/${path}`, null);
        // };
        const rollbackCache = () => {
            return cacheApi.update(cachePath, rollbackUpdates, { context: options.context });
        };
        const addPendingTransaction = () => {
            return cacheApi.set(`${this.dbname}/pending/${options.context.acebase_mutation.id}`, { type: 'update', path, data: updates, context: options.context });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !useServer ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to update cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to update server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error)
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated, cache update was successful.
                // Add pending sync action

                addPendingTransaction().catch(err => {
                    this.debug.error(`Failed to add pending sync action for "${path}", rolling back cache to previous value. Error:`, err);
                    rollbackCache().catch(err => {
                        this.debug.error(`Failed to roll back cache? Error:`, err);
                    });
                });
            }
        })

        // Use optimistic approach - return cache promise
        return cachePromise;
    }

    get(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getServerValue = () => {
            // Get from server
            let url = `${this.url}/data/${this.dbname}/${path}`;
            let filtered = false;
            if (options) {
                let query = [];
                if (options.exclude instanceof Array) { 
                    query.push(`exclude=${options.exclude.join(',')}`); 
                }
                if (options.include instanceof Array) { 
                    query.push(`include=${options.include.join(',')}`); 
                }
                if (typeof options.child_objects === "boolean") {
                    query.push(`child_objects=${options.child_objects}`);
                }
                if (query.length > 0) {
                    filtered = true;
                    url += `?${query.join('&')}`;
                }
            }
            return this._request({ url })
            .then(data => {
                let val = Transport.deserialize(data);
                if (this._cache) {
                    // Update cache
                    // DISABLED: if filtered data was requested, it should be merged with current data (nested objects in particular)
                    // TODO: do update if no nested filters are used.
                    // if (filtered) {
                    //     this._cache.db.api.update(`${this.dbname}/cache/${path}`, val);
                    // }
                    // else if (!filtered) { 
                    if (!filtered) {
                        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
                        return this._cache.db.api.set(cachePath, val, { context: { acebase_operation: 'update_cache' } })
                        .catch(err => {
                            this.debug.error(`Error caching data for "/${path}"`, err)
                        })
                        .then(() => val);
                    }
                }
                return val;
            })
            .catch(err => {
                throw err;
            });
        };
        const getCacheValue = () => {
            return this._cache.db.api.get(PathInfo.getChildPath(`${this.dbname}/cache`, path), options);
        };

        if (!useCache) {
            return getServerValue();
        }
        else if (!this._connected) {
            return getCacheValue();
        }
        else {
            // Get both, use cached value if available and server version takes too long
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotValue = (source, val) => {
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        console.log(`Using server value for "${path}"`);
                        resolve(val);
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        console.log(`Using cache value for "${path}"`);
                        resolve(val); 
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            console.log(`Using (delayed) cache value for "${path}"`);
                            done = true;
                            resolve(val);
                        }, 1000);
                    }
                };
                let errors = [];
                const gotError = (source, error) => {
                    errors.push({ source, error });
                    if (errors.length === 2) { 
                        // Both failed, reject with server error
                        reject(errors.find(e => e.source === 'server'));
                    }
                };

                getServerValue()
                    .then(val => gotValue('server', val))
                    .catch(err => (wait = false, gotError('server', err)));

                getCacheValue()
                    .then(val => gotValue('cache', val))
                    .catch(err => gotError('cache', err));
            });
        }
    }
    
    exists(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getCacheExists = () => {
            return this._cache.db.api.exists(PathInfo.getChildPath(`${this.dbname}/cache`, path));
        };
        const getServerExists = () => {
            return this._request({ url: `${this.url}/exists/${this.dbname}/${path}` })
            .then(res => res.exists)
            .catch(err => {
                throw err;
            });            
        }
        if (!useCache) {
            return getServerExists();
        }
        else if (!this._connected) {
            return getCacheExists();
        }
        else {
            // Check both
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotExists = (source, exists) => {
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        resolve(exists);
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        resolve(exists); 
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            done = true;
                            resolve(exists);
                        }, 1000);
                    }
                };
                let errors = [];
                const gotError = (source, error) => {
                    errors.push({ source, error });
                    if (errors.length === 2) { 
                        // Both failed, reject with server error
                        reject(errors.find(e => e.source === 'server'));
                    }
                };

                getServerExists()
                    .then(exists => gotExists('server', exists))
                    .catch(err => (wait = false, gotError('server', err)));

                getCacheExists()
                    .then(exists => gotExists('cache', exists))
                    .catch(err => gotError('cache', err));
            });
        }
    }

    callExtension(method, path, data) {
        method = method.toUpperCase();
        const postData = ['PUT','POST'].includes(method) ? data : null;
        let url = `${this.url}/ext/${this.dbname}/${path}`;
        if (data && !['PUT','POST'].includes(method)) {
            // Add to query string
            if (typeof data === 'object') {
                // Convert object to querystring
                data = Object.keys(data)
                    .filter(key => typeof data[key] !== 'undefined')
                    .map(key => key + '=' + encodeURIComponent(JSON.stringify(data[key])))
                    .join('&')
            }
            else if (typeof data !== 'string' || !data.includes('=')) {
                throw new Error('data must be an object, or a string with query parameters, like "index=3&name=Something"');
            }
            url += `?` + data;
        }
        return this._request({ method, url, data: postData, ignoreConnectionState: true });
    }

    /**
     * 
     * @param {string} path 
     * @param {object} query 
     * @param {Array<{ key: string, op: string, compare: any}>} query.filters
     * @param {number} query.skip number of results to skip, useful for paging
     * @param {number} query.take max number of results to return
     * @param {Array<{ key: string, ascending: boolean }>} query.order
     * @param {object} [options]
     * @param {boolean} [options.snapshots=false] whether to return matching data, or paths to matching nodes only
     * @param {string[]} [options.include] when using snapshots, keys or relative paths to include in result data
     * @param {string[]} [options.exclude] when using snapshots, keys or relative paths to exclude from result data
     * @param {boolean} [options.child_objects] when using snapshots, whether to include child objects in result data
     * @param {(event: { name: string, [key]: any }) => void} [options.eventHandler]
     * @param {object} [options.monitor] NEW (BETA) monitor changes
     * @param {boolean} [options.monitor.add=false] monitor new matches (either because they were added, or changed and now match the query)
     * @param {boolean} [options.monitor.change=false] monitor changed children that still match this query
     * @param {boolean} [options.monitor.remove=false] monitor children that don't match this query anymore
     * @ param {(event:string, path: string, value?: any) => boolean} [options.monitor.callback] NEW (BETA) callback with subscription to enable monitoring of new matches
     * @returns {Promise<object[]|string[]>} returns a promise that resolves with matching data or paths
     */
    query(path, query, options = { snapshots: false, allow_cache: true, eventListener: undefined, monitor: { add: false, change: false, remove: false } }) {
        const allowCache = options && options.allow_cache === true;
        if (allowCache && !this._connected && this._cache) {
            // Not connected, query cache db
            return this._cache.db.api.query(PathInfo.getChildPath(`${this.dbname}/cache`, path), query, options);
        }
        const request = {
            query,
            options
        };
        if (options.monitor === true || (typeof options.monitor === 'object' && (options.monitor.add || options.monitor.change || options.monitor.remove))) {
            console.assert(typeof options.eventHandler === 'function', `no eventHandler specified to handle realtime changes`);
            request.query_id = ID.generate();
            request.client_id = this.socket.id;
            this._realtimeQueries[request.query_id] = { query, options };
        }
        const data = JSON.stringify(Transport.serialize(request));
        return this._request({ method: "POST", url: `${this.url}/query/${this.dbname}/${path}`, data })
        .then(data => {
            let results = Transport.deserialize(data);
            return results.list;
        })
        .catch(err => {
            throw err;
        });
    }

    createIndex(path, key, options) {
        const data = JSON.stringify({ action: "create", path, key, options });
        return this._request({ method: "POST", url: `${this.url}/index/${this.dbname}`, data })
        .catch(err => {
            throw err;
        });
    }

    getIndexes() {
        return this._request({ url: `${this.url}/index/${this.dbname}` })
        .catch(err => {
            throw err;
        });         
    }

    reflect(path, type, args) {
        let url = `${this.url}/reflect/${this.dbname}/${path}?type=${type}`;
        if (typeof args === 'object') {
            let query = Object.keys(args).map(key => {
                return `${key}=${args[key]}`;
            });
            if (query.length > 0) {
                url += `&${query.join('&')}`;
            }
        }
        return this._request({ url })
        .catch(err => {
            throw err;
        }); 
    }

    export(path, stream, options = { format: 'json' }) {
        options = options || {};
        options.format = 'json';
        let url = `${this.url}/export/${this.dbname}/${path}?format=${options.format}`;
        return this._request({ url, dataReceivedCallback: chunk => stream.write(chunk) })
        .catch(err => {
            throw err;
        });
    }
}

module.exports = { WebApi };
}).call(this,require("buffer").Buffer)
},{"acebase-core":159,"buffer":169,"http":194,"https":173,"socket.io-client":30,"url":201}],42:[function(require,module,exports){
const { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult } = require('./user');
const { AceBaseClient } = require('./acebase-client');

class AceBaseClientAuth {

    /**
     * 
     * @param {AceBaseClient} client 
     */
    constructor(client, eventCallback) {
        this.client = client;
        this.eventCallback = eventCallback;

        this.user = null;
        this.accessToken = null;
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} username Your database username
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signIn(username, password) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signIn(username, password));
        }
        return this.client.api.signIn(username, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        });
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} email Your email address
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email, password) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signInWithEmail(email, password));
        }
        return this.client.api.signInWithEmail(email, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "email_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true, 
        });
    }

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithToken(accessToken) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signInWithToken(accessToken));
        }
        return this.client.api.signInWithToken(accessToken)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "token_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        });
    }

    /**
     * If the server has been configured with Auth providers, use this to kick off the authentication flow.
     * This method returs a Promise that resolves with the url you have to redirect your user to authenticate 
     * with the requested provider. After the user has authenticated, they will be redirected back to your callbackUrl.
     * Your code in the callbackUrl will have to call finishOAuthProviderSignIn with the result querystring parameter
     * to finish signing in.
     * @param {string} providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param {string} callbackUrl url on your website/app that will receive the sign in result
     * @returns {Promise<string>} returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName, callbackUrl) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.startAuthProviderSignIn(providerName, callbackUrl));
        }
        return this.client.api.startAuthProviderSignIn(providerName, callbackUrl, this.user)
        .then(details => {
            return details.redirectUrl;
        });
    }

    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param {string} callbackResult result received in your.callback/url?result
     * @returns {Promise<{ user: AceBaseUser, accessToken: string, provider: { name: string, access_token: string, refresh_token: string, expires_in: number } }>}
     */
    finishAuthProviderSignIn(callbackResult) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.finishAuthProviderSignIn(callbackResult));
        }
        return this.client.api.finishAuthProviderSignIn(callbackResult)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "oauth_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true, 
        });
    }

    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     * @param {string} providerName
     * @param {string} refreshToken 
     * @returns {Promise<{ provider: IAceBaseAuthProviderTokens }}
     */
    refreshAuthProviderToken(providerName, refreshToken) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.refreshAuthProviderToken(providerName, refreshToken));
        }
        return this.client.api.refreshAuthProviderToken(providerName, refreshToken)
        .then(details => {
            return { provider: details.provider };
        })
    }

    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     * @param {string} providerName 
     */
    signInWithRedirect(providerName) {
        if (typeof window === 'undefined') {
            throw new Error(`signInWithRedirect can only be used within a browser context`);
        }
        return this.startAuthProviderSignIn(providerName, window.location.href)
        .then(redirectUrl => {
            window.location.href = redirectUrl;
        });
    }

    /** 
     * Checks if the user authentication with an auth provider. 
     */
    getRedirectResult() {
        if (typeof window === 'undefined') {
            throw new Error(`getRedirectResult can only be used within a browser context`);
        }
        const match = window.location.search.match(/[?&]result=(.*?)(?:&|$)/);
        const callbackResult = match && decodeURIComponent(match[1]);
        if (!callbackResult) {
            return Promise.resolve(null);
        }
        return this.finishAuthProviderSignIn(callbackResult);
    }

    /**
     * Signs out of the current account
     * @param {boolean} [everywhere=false] whether to sign out all clients, or only this one
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut(everywhere) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signOut(everywhere));
        }
        else if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        return this.client.api.signOut(everywhere)
        .then(() => {
            this.accessToken = null;
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signout', user });
        });
    }

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    changePassword(oldPassword, newPassword) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.changePassword(oldPassword, newPassword));
        }
        else if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        return this.client.api.changePassword(this.user.uid, oldPassword, newPassword)
        .then(result => {
            this.accessToken = result.accessToken;
            this.eventCallback("signin", { source: "password_change", user: this.user, accessToken: this.accessToken });
            return { accessToken: result.accessToken }; //success: true, 
        });
    }

    /**
     * Requests a password reset for the account with specified email address
     * @param {string} email
     * @returns {Promise<void>} returns a promise that resolves once the request has been processed
     */
    forgotPassword(email) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.forgotPassword(email));
        }
        return this.client.api.forgotPassword(email);
    }

    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param {string} resetCode
     * @param {string} newPassword
     * @returns {Promise<void>} returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    resetPassword(resetCode, newPassword) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.resetPassword(resetCode, newPassword));
        }
        return this.client.api.resetPassword(resetCode, newPassword);
    }

    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param {string} verificationCode
     * @returns {Promise<void>} returns a promise that resolves when verification was successful
     */
    verifyEmailAddress(verificationCode) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.verifyEmailAddress(verificationCode));
        }
        return this.client.api.verifyEmailAddress(verificationCode);
    }

    _updateUserDetails(details) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this._updateUserDetails(details));
        }
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (typeof details !== 'object') {
            return Promise.reject({ code: 'invalid_details', message: 'details must be an object' });
        }
        return this.client.api.updateUserDetails(details)
        .then(result => {
            Object.keys(result.user).forEach(key => {
                this.user[key] = result.user[key];
            });
            return { user: this.user }; // success: true
        });
    }

    /**
     * Changes the username of the currrently signed into account
     * @param {string} newUsername 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername) {
        return this._updateUserDetails({ username: newUsername });
    }

    /**
     * Changes the email address of the currrently signed in user
     * @param {string} newEmail 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail) {
        return this._updateUserDetails({ email: newEmail });
    }

    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param {{ [key:string]: string|number|boolean }} settings - the settings to update
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    updateUserSettings(settings) {
        return this._updateUserDetails({ settings });
    }

    /**
     * Creates a new user account with the given details. If successful, you will automatically be 
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @param {object} details
     * @param {string} [details.username] 
     * @param {string} [details.email] 
     * @param {string} details.password
     * @param {string} details.displayName
     * @param {{ [key:string]: string|number|boolean }} [details.settings] optional settings 
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signUp(details) {
        if (!details.username && !details.email) {
            return Promise.reject({ code: 'invalid_details', message: 'No username or email set' });
        }
        if (!details.password) {
            return Promise.reject({ code: 'invalid_details', message: 'No password given' });
        }
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signUp(details));
        }
        const isAdmin = this.user && this.user.uid === 'admin';
        if (this.user && !isAdmin) {
            // Sign out of current account
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signup', user } );
        }
        return this.client.api.signUp(details, !isAdmin)
        .then(details => {
            if (isAdmin) {
                return { user: details.user };
            }
            else {
                // Sign into new account
                this.accessToken = details.accessToken;
                this.user = new AceBaseUser(details.user);
                this.eventCallback("signin", { source: "signup", user: this.user, accessToken: this.accessToken });
                return { user: this.user, accessToken: this.accessToken }; //success: true, 
            }
        });
    }

    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param {string} [uid] for admin user only: remove account with uid
     * @returns {Promise<void>}
     */
    deleteAccount(uid) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.deleteAccount(uid));
        }
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (uid && this.user.uid !== 'admin') {
            return Promise.reject({ code: 'not_admin', message: 'Cannot remove other accounts than signed into account, unless you are admin' });
        }
        const deleteUid = uid || this.user.uid;
        if (deleteUid === 'admin') {
            return Promise.reject({ code: 'not_allowed', message: 'Cannot remove admin user' });
        }
        const signOut = this.user.uid !== 'admin';
        return this.client.api.deleteAccount(deleteUid, signOut)
        .then(result => {
            if (signOut) {
                // Sign out of the account
                this.accessToken = null;
                let user = this.user;
                this.user = null;
                this.eventCallback("signout", { source: 'delete_account', user });
            }
        });
    }
}

module.exports = { AceBaseClientAuth };
},{"./acebase-client":40,"./user":45}],43:[function(require,module,exports){
/*
    * This file is used to generate a browser bundle,
    (re)generate it with: npm run browserify
    Note to self: if browserify fails, temp remove the "browser" property from package.json and run again.

    * To use AceBaseClient in the browser:
    const db = new AceBaseClient({ dbname: 'dbname', host: 'localhost', port: 3000, https: false });
*/

const acebaseclient = require('./index');

window.acebaseclient = acebaseclient;
window.AceBaseClient = acebaseclient.AceBaseClient; // Shortcut to AceBaseClient
module.exports = acebaseclient;
},{"./index":44}],44:[function(require,module,exports){
const { DataReference, DataSnapshot, EventSubscription, PathReference, TypeMappings, ID, proxyAccess } = require('acebase-core');
const { AceBaseClient } = require('./acebase-client');

module.exports = {
    AceBaseClient,
    DataReference, 
    DataSnapshot, 
    EventSubscription, 
    PathReference, 
    TypeMappings,
    ID,
    proxyAccess
};
},{"./acebase-client":40,"acebase-core":159}],45:[function(require,module,exports){

class AceBaseUser {
    /**
     * 
     * @param {{ uid: string, username?: string, email?: string, displayName: string, created: Date, last_signin: Date, last_signin_ip: string settings: { [key:string]: string|number|boolean } }} user
     */
    constructor(user) {
        // /** @type {string} unique id */
        // this.uid = user.uid;
        // /** @type {string?} username */
        // this.username = user.username;
        // /** @type {string?} email address */
        // this.email = user.email;
        // /** @type {string?} display or screen name */
        // this.displayName = user.displayName;
        // this.settings = user.settings;
        // this.created = user.created;
        // this.last_signin = user.last_signin;
        // this.last_signin_ip = user.last_signin_ip;
        // this.prev_signin = user.prev_signin;
        // this.prev_signin_ip = user.prev_signin_ip;
        Object.assign(this, user);
    }
}

class AceBaseSignInResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {AceBaseUser} [result.user]
     * @param {string} [result.accessToken]
     * @param {{ code: string, message: string }} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (result.success) {
            this.user = result.user;
            this.accessToken = result.accessToken;
        }
        else {
            this.reason = result.reason;
        }
    }
}

class AceBaseAuthResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {{ code: string, message: string }} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (!result.success) {
            this.reason = result.reason;
        }
    }
}

module.exports = { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult };
},{}],46:[function(require,module,exports){
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

var fingerprint = require('./lib/fingerprint.js');
var pad = require('./lib/pad.js');

var c = 0,
  blockSize = 4,
  base = 36,
  discreteValues = Math.pow(base, blockSize);

function randomBlock () {
  return pad((Math.random() *
    discreteValues << 0)
    .toString(base), blockSize);
}

function safeCounter () {
  c = c < discreteValues ? c : 0;
  c++; // this is not subliminal
  return c - 1;
}

function cuid () {
  // Starting with a lowercase letter makes
  // it HTML element ID friendly.
  var letter = 'c', // hard-coded allows for sequential access

    // timestamp
    // warning: this exposes the exact date and time
    // that the uid was created.
    timestamp = (new Date().getTime()).toString(base),

    // Prevent same-machine collisions.
    counter = pad(safeCounter().toString(base), blockSize),

    // A few chars to generate distinct ids for different
    // clients (so different computers are far less
    // likely to generate the same id)
    print = fingerprint(),

    // Grab some more chars from Math.random()
    random = randomBlock() + randomBlock();

  return letter + timestamp + counter + print + random;
}

cuid.slug = function slug () {
  var date = new Date().getTime().toString(36),
    counter = safeCounter().toString(36).slice(-4),
    print = fingerprint().slice(0, 1) +
      fingerprint().slice(-1),
    random = randomBlock().slice(-2);

  return date.slice(-2) +
    counter + print + random;
};

cuid.isCuid = function isCuid (stringToCheck) {
  if (typeof stringToCheck !== 'string') return false;
  if (stringToCheck.startsWith('c')) return true;
  return false;
};

cuid.isSlug = function isSlug (stringToCheck) {
  if (typeof stringToCheck !== 'string') return false;
  var stringLength = stringToCheck.length;
  if (stringLength >= 7 && stringLength <= 10) return true;
  return false;
};

cuid.fingerprint = fingerprint;

module.exports = cuid;

},{"./lib/fingerprint.js":47,"./lib/pad.js":48}],47:[function(require,module,exports){
var pad = require('./pad.js');

var env = typeof window === 'object' ? window : self;
var globalCount = Object.keys(env).length;
var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
var clientId = pad((mimeTypesLength +
  navigator.userAgent.length).toString(36) +
  globalCount.toString(36), 4);

module.exports = function fingerprint () {
  return clientId;
};

},{"./pad.js":48}],48:[function(require,module,exports){
module.exports = function pad (num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
};

},{}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("./internal/Observable");
exports.Observable = Observable_1.Observable;
var ConnectableObservable_1 = require("./internal/observable/ConnectableObservable");
exports.ConnectableObservable = ConnectableObservable_1.ConnectableObservable;
var groupBy_1 = require("./internal/operators/groupBy");
exports.GroupedObservable = groupBy_1.GroupedObservable;
var observable_1 = require("./internal/symbol/observable");
exports.observable = observable_1.observable;
var Subject_1 = require("./internal/Subject");
exports.Subject = Subject_1.Subject;
var BehaviorSubject_1 = require("./internal/BehaviorSubject");
exports.BehaviorSubject = BehaviorSubject_1.BehaviorSubject;
var ReplaySubject_1 = require("./internal/ReplaySubject");
exports.ReplaySubject = ReplaySubject_1.ReplaySubject;
var AsyncSubject_1 = require("./internal/AsyncSubject");
exports.AsyncSubject = AsyncSubject_1.AsyncSubject;
var asap_1 = require("./internal/scheduler/asap");
exports.asap = asap_1.asap;
exports.asapScheduler = asap_1.asapScheduler;
var async_1 = require("./internal/scheduler/async");
exports.async = async_1.async;
exports.asyncScheduler = async_1.asyncScheduler;
var queue_1 = require("./internal/scheduler/queue");
exports.queue = queue_1.queue;
exports.queueScheduler = queue_1.queueScheduler;
var animationFrame_1 = require("./internal/scheduler/animationFrame");
exports.animationFrame = animationFrame_1.animationFrame;
exports.animationFrameScheduler = animationFrame_1.animationFrameScheduler;
var VirtualTimeScheduler_1 = require("./internal/scheduler/VirtualTimeScheduler");
exports.VirtualTimeScheduler = VirtualTimeScheduler_1.VirtualTimeScheduler;
exports.VirtualAction = VirtualTimeScheduler_1.VirtualAction;
var Scheduler_1 = require("./internal/Scheduler");
exports.Scheduler = Scheduler_1.Scheduler;
var Subscription_1 = require("./internal/Subscription");
exports.Subscription = Subscription_1.Subscription;
var Subscriber_1 = require("./internal/Subscriber");
exports.Subscriber = Subscriber_1.Subscriber;
var Notification_1 = require("./internal/Notification");
exports.Notification = Notification_1.Notification;
exports.NotificationKind = Notification_1.NotificationKind;
var pipe_1 = require("./internal/util/pipe");
exports.pipe = pipe_1.pipe;
var noop_1 = require("./internal/util/noop");
exports.noop = noop_1.noop;
var identity_1 = require("./internal/util/identity");
exports.identity = identity_1.identity;
var isObservable_1 = require("./internal/util/isObservable");
exports.isObservable = isObservable_1.isObservable;
var ArgumentOutOfRangeError_1 = require("./internal/util/ArgumentOutOfRangeError");
exports.ArgumentOutOfRangeError = ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
var EmptyError_1 = require("./internal/util/EmptyError");
exports.EmptyError = EmptyError_1.EmptyError;
var ObjectUnsubscribedError_1 = require("./internal/util/ObjectUnsubscribedError");
exports.ObjectUnsubscribedError = ObjectUnsubscribedError_1.ObjectUnsubscribedError;
var UnsubscriptionError_1 = require("./internal/util/UnsubscriptionError");
exports.UnsubscriptionError = UnsubscriptionError_1.UnsubscriptionError;
var TimeoutError_1 = require("./internal/util/TimeoutError");
exports.TimeoutError = TimeoutError_1.TimeoutError;
var bindCallback_1 = require("./internal/observable/bindCallback");
exports.bindCallback = bindCallback_1.bindCallback;
var bindNodeCallback_1 = require("./internal/observable/bindNodeCallback");
exports.bindNodeCallback = bindNodeCallback_1.bindNodeCallback;
var combineLatest_1 = require("./internal/observable/combineLatest");
exports.combineLatest = combineLatest_1.combineLatest;
var concat_1 = require("./internal/observable/concat");
exports.concat = concat_1.concat;
var defer_1 = require("./internal/observable/defer");
exports.defer = defer_1.defer;
var empty_1 = require("./internal/observable/empty");
exports.empty = empty_1.empty;
var forkJoin_1 = require("./internal/observable/forkJoin");
exports.forkJoin = forkJoin_1.forkJoin;
var from_1 = require("./internal/observable/from");
exports.from = from_1.from;
var fromEvent_1 = require("./internal/observable/fromEvent");
exports.fromEvent = fromEvent_1.fromEvent;
var fromEventPattern_1 = require("./internal/observable/fromEventPattern");
exports.fromEventPattern = fromEventPattern_1.fromEventPattern;
var generate_1 = require("./internal/observable/generate");
exports.generate = generate_1.generate;
var iif_1 = require("./internal/observable/iif");
exports.iif = iif_1.iif;
var interval_1 = require("./internal/observable/interval");
exports.interval = interval_1.interval;
var merge_1 = require("./internal/observable/merge");
exports.merge = merge_1.merge;
var never_1 = require("./internal/observable/never");
exports.never = never_1.never;
var of_1 = require("./internal/observable/of");
exports.of = of_1.of;
var onErrorResumeNext_1 = require("./internal/observable/onErrorResumeNext");
exports.onErrorResumeNext = onErrorResumeNext_1.onErrorResumeNext;
var pairs_1 = require("./internal/observable/pairs");
exports.pairs = pairs_1.pairs;
var partition_1 = require("./internal/observable/partition");
exports.partition = partition_1.partition;
var race_1 = require("./internal/observable/race");
exports.race = race_1.race;
var range_1 = require("./internal/observable/range");
exports.range = range_1.range;
var throwError_1 = require("./internal/observable/throwError");
exports.throwError = throwError_1.throwError;
var timer_1 = require("./internal/observable/timer");
exports.timer = timer_1.timer;
var using_1 = require("./internal/observable/using");
exports.using = using_1.using;
var zip_1 = require("./internal/observable/zip");
exports.zip = zip_1.zip;
var scheduled_1 = require("./internal/scheduled/scheduled");
exports.scheduled = scheduled_1.scheduled;
var empty_2 = require("./internal/observable/empty");
exports.EMPTY = empty_2.EMPTY;
var never_2 = require("./internal/observable/never");
exports.NEVER = never_2.NEVER;
var config_1 = require("./internal/config");
exports.config = config_1.config;

},{"./internal/AsyncSubject":50,"./internal/BehaviorSubject":51,"./internal/Notification":53,"./internal/Observable":54,"./internal/ReplaySubject":57,"./internal/Scheduler":58,"./internal/Subject":59,"./internal/Subscriber":61,"./internal/Subscription":62,"./internal/config":63,"./internal/observable/ConnectableObservable":65,"./internal/observable/bindCallback":66,"./internal/observable/bindNodeCallback":67,"./internal/observable/combineLatest":68,"./internal/observable/concat":69,"./internal/observable/defer":70,"./internal/observable/empty":71,"./internal/observable/forkJoin":72,"./internal/observable/from":73,"./internal/observable/fromEvent":75,"./internal/observable/fromEventPattern":76,"./internal/observable/generate":77,"./internal/observable/iif":78,"./internal/observable/interval":79,"./internal/observable/merge":80,"./internal/observable/never":81,"./internal/observable/of":82,"./internal/observable/onErrorResumeNext":83,"./internal/observable/pairs":84,"./internal/observable/partition":85,"./internal/observable/race":86,"./internal/observable/range":87,"./internal/observable/throwError":88,"./internal/observable/timer":89,"./internal/observable/using":90,"./internal/observable/zip":91,"./internal/operators/groupBy":94,"./internal/scheduled/scheduled":104,"./internal/scheduler/VirtualTimeScheduler":114,"./internal/scheduler/animationFrame":115,"./internal/scheduler/asap":116,"./internal/scheduler/async":117,"./internal/scheduler/queue":118,"./internal/symbol/observable":120,"./internal/util/ArgumentOutOfRangeError":122,"./internal/util/EmptyError":123,"./internal/util/ObjectUnsubscribedError":125,"./internal/util/TimeoutError":126,"./internal/util/UnsubscriptionError":127,"./internal/util/identity":130,"./internal/util/isObservable":138,"./internal/util/noop":141,"./internal/util/pipe":143}],50:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("./Subject");
var Subscription_1 = require("./Subscription");
var AsyncSubject = (function (_super) {
    __extends(AsyncSubject, _super);
    function AsyncSubject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.value = null;
        _this.hasNext = false;
        _this.hasCompleted = false;
        return _this;
    }
    AsyncSubject.prototype._subscribe = function (subscriber) {
        if (this.hasError) {
            subscriber.error(this.thrownError);
            return Subscription_1.Subscription.EMPTY;
        }
        else if (this.hasCompleted && this.hasNext) {
            subscriber.next(this.value);
            subscriber.complete();
            return Subscription_1.Subscription.EMPTY;
        }
        return _super.prototype._subscribe.call(this, subscriber);
    };
    AsyncSubject.prototype.next = function (value) {
        if (!this.hasCompleted) {
            this.value = value;
            this.hasNext = true;
        }
    };
    AsyncSubject.prototype.error = function (error) {
        if (!this.hasCompleted) {
            _super.prototype.error.call(this, error);
        }
    };
    AsyncSubject.prototype.complete = function () {
        this.hasCompleted = true;
        if (this.hasNext) {
            _super.prototype.next.call(this, this.value);
        }
        _super.prototype.complete.call(this);
    };
    return AsyncSubject;
}(Subject_1.Subject));
exports.AsyncSubject = AsyncSubject;

},{"./Subject":59,"./Subscription":62}],51:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("./Subject");
var ObjectUnsubscribedError_1 = require("./util/ObjectUnsubscribedError");
var BehaviorSubject = (function (_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: true,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        if (subscription && !subscription.closed) {
            subscriber.next(this._value);
        }
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        if (this.hasError) {
            throw this.thrownError;
        }
        else if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else {
            return this._value;
        }
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, this._value = value);
    };
    return BehaviorSubject;
}(Subject_1.Subject));
exports.BehaviorSubject = BehaviorSubject;

},{"./Subject":59,"./util/ObjectUnsubscribedError":125}],52:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("./Subscriber");
var InnerSubscriber = (function (_super) {
    __extends(InnerSubscriber, _super);
    function InnerSubscriber(parent, outerValue, outerIndex) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.outerValue = outerValue;
        _this.outerIndex = outerIndex;
        _this.index = 0;
        return _this;
    }
    InnerSubscriber.prototype._next = function (value) {
        this.parent.notifyNext(this.outerValue, value, this.outerIndex, this.index++, this);
    };
    InnerSubscriber.prototype._error = function (error) {
        this.parent.notifyError(error, this);
        this.unsubscribe();
    };
    InnerSubscriber.prototype._complete = function () {
        this.parent.notifyComplete(this);
        this.unsubscribe();
    };
    return InnerSubscriber;
}(Subscriber_1.Subscriber));
exports.InnerSubscriber = InnerSubscriber;

},{"./Subscriber":61}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var empty_1 = require("./observable/empty");
var of_1 = require("./observable/of");
var throwError_1 = require("./observable/throwError");
var NotificationKind;
(function (NotificationKind) {
    NotificationKind["NEXT"] = "N";
    NotificationKind["ERROR"] = "E";
    NotificationKind["COMPLETE"] = "C";
})(NotificationKind = exports.NotificationKind || (exports.NotificationKind = {}));
var Notification = (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    Notification.prototype.observe = function (observer) {
        switch (this.kind) {
            case 'N':
                return observer.next && observer.next(this.value);
            case 'E':
                return observer.error && observer.error(this.error);
            case 'C':
                return observer.complete && observer.complete();
        }
    };
    Notification.prototype.do = function (next, error, complete) {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return next && next(this.value);
            case 'E':
                return error && error(this.error);
            case 'C':
                return complete && complete();
        }
    };
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        if (nextOrObserver && typeof nextOrObserver.next === 'function') {
            return this.observe(nextOrObserver);
        }
        else {
            return this.do(nextOrObserver, error, complete);
        }
    };
    Notification.prototype.toObservable = function () {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return of_1.of(this.value);
            case 'E':
                return throwError_1.throwError(this.error);
            case 'C':
                return empty_1.empty();
        }
        throw new Error('unexpected notification kind value');
    };
    Notification.createNext = function (value) {
        if (typeof value !== 'undefined') {
            return new Notification('N', value);
        }
        return Notification.undefinedValueNotification;
    };
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    Notification.createComplete = function () {
        return Notification.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    Notification.undefinedValueNotification = new Notification('N', undefined);
    return Notification;
}());
exports.Notification = Notification;

},{"./observable/empty":71,"./observable/of":82,"./observable/throwError":88}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var canReportError_1 = require("./util/canReportError");
var toSubscriber_1 = require("./util/toSubscriber");
var observable_1 = require("./symbol/observable");
var pipe_1 = require("./util/pipe");
var config_1 = require("./config");
var Observable = (function () {
    function Observable(subscribe) {
        this._isScalar = false;
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var operator = this.operator;
        var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
        if (operator) {
            sink.add(operator.call(sink, this.source));
        }
        else {
            sink.add(this.source || (config_1.config.useDeprecatedSynchronousErrorHandling && !sink.syncErrorThrowable) ?
                this._subscribe(sink) :
                this._trySubscribe(sink));
        }
        if (config_1.config.useDeprecatedSynchronousErrorHandling) {
            if (sink.syncErrorThrowable) {
                sink.syncErrorThrowable = false;
                if (sink.syncErrorThrown) {
                    throw sink.syncErrorValue;
                }
            }
        }
        return sink;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            if (config_1.config.useDeprecatedSynchronousErrorHandling) {
                sink.syncErrorThrown = true;
                sink.syncErrorValue = err;
            }
            if (canReportError_1.canReportError(sink)) {
                sink.error(err);
            }
            else {
                console.warn(err);
            }
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscription;
            subscription = _this.subscribe(function (value) {
                try {
                    next(value);
                }
                catch (err) {
                    reject(err);
                    if (subscription) {
                        subscription.unsubscribe();
                    }
                }
            }, reject, resolve);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var source = this.source;
        return source && source.subscribe(subscriber);
    };
    Observable.prototype[observable_1.observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        if (operations.length === 0) {
            return this;
        }
        return pipe_1.pipeFromArray(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
exports.Observable = Observable;
function getPromiseCtor(promiseCtor) {
    if (!promiseCtor) {
        promiseCtor = config_1.config.Promise || Promise;
    }
    if (!promiseCtor) {
        throw new Error('no Promise impl found');
    }
    return promiseCtor;
}

},{"./config":63,"./symbol/observable":120,"./util/canReportError":128,"./util/pipe":143,"./util/toSubscriber":150}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var hostReportError_1 = require("./util/hostReportError");
exports.empty = {
    closed: true,
    next: function (value) { },
    error: function (err) {
        if (config_1.config.useDeprecatedSynchronousErrorHandling) {
            throw err;
        }
        else {
            hostReportError_1.hostReportError(err);
        }
    },
    complete: function () { }
};

},{"./config":63,"./util/hostReportError":129}],56:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("./Subscriber");
var OuterSubscriber = (function (_super) {
    __extends(OuterSubscriber, _super);
    function OuterSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OuterSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
        this.destination.next(innerValue);
    };
    OuterSubscriber.prototype.notifyError = function (error, innerSub) {
        this.destination.error(error);
    };
    OuterSubscriber.prototype.notifyComplete = function (innerSub) {
        this.destination.complete();
    };
    return OuterSubscriber;
}(Subscriber_1.Subscriber));
exports.OuterSubscriber = OuterSubscriber;

},{"./Subscriber":61}],57:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("./Subject");
var queue_1 = require("./scheduler/queue");
var Subscription_1 = require("./Subscription");
var observeOn_1 = require("./operators/observeOn");
var ObjectUnsubscribedError_1 = require("./util/ObjectUnsubscribedError");
var SubjectSubscription_1 = require("./SubjectSubscription");
var ReplaySubject = (function (_super) {
    __extends(ReplaySubject, _super);
    function ReplaySubject(bufferSize, windowTime, scheduler) {
        if (bufferSize === void 0) { bufferSize = Number.POSITIVE_INFINITY; }
        if (windowTime === void 0) { windowTime = Number.POSITIVE_INFINITY; }
        var _this = _super.call(this) || this;
        _this.scheduler = scheduler;
        _this._events = [];
        _this._infiniteTimeWindow = false;
        _this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
        _this._windowTime = windowTime < 1 ? 1 : windowTime;
        if (windowTime === Number.POSITIVE_INFINITY) {
            _this._infiniteTimeWindow = true;
            _this.next = _this.nextInfiniteTimeWindow;
        }
        else {
            _this.next = _this.nextTimeWindow;
        }
        return _this;
    }
    ReplaySubject.prototype.nextInfiniteTimeWindow = function (value) {
        if (!this.isStopped) {
            var _events = this._events;
            _events.push(value);
            if (_events.length > this._bufferSize) {
                _events.shift();
            }
        }
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype.nextTimeWindow = function (value) {
        if (!this.isStopped) {
            this._events.push(new ReplayEvent(this._getNow(), value));
            this._trimBufferThenGetEvents();
        }
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        var _infiniteTimeWindow = this._infiniteTimeWindow;
        var _events = _infiniteTimeWindow ? this._events : this._trimBufferThenGetEvents();
        var scheduler = this.scheduler;
        var len = _events.length;
        var subscription;
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.isStopped || this.hasError) {
            subscription = Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            subscription = new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        }
        if (scheduler) {
            subscriber.add(subscriber = new observeOn_1.ObserveOnSubscriber(subscriber, scheduler));
        }
        if (_infiniteTimeWindow) {
            for (var i = 0; i < len && !subscriber.closed; i++) {
                subscriber.next(_events[i]);
            }
        }
        else {
            for (var i = 0; i < len && !subscriber.closed; i++) {
                subscriber.next(_events[i].value);
            }
        }
        if (this.hasError) {
            subscriber.error(this.thrownError);
        }
        else if (this.isStopped) {
            subscriber.complete();
        }
        return subscription;
    };
    ReplaySubject.prototype._getNow = function () {
        return (this.scheduler || queue_1.queue).now();
    };
    ReplaySubject.prototype._trimBufferThenGetEvents = function () {
        var now = this._getNow();
        var _bufferSize = this._bufferSize;
        var _windowTime = this._windowTime;
        var _events = this._events;
        var eventsCount = _events.length;
        var spliceCount = 0;
        while (spliceCount < eventsCount) {
            if ((now - _events[spliceCount].time) < _windowTime) {
                break;
            }
            spliceCount++;
        }
        if (eventsCount > _bufferSize) {
            spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
        }
        if (spliceCount > 0) {
            _events.splice(0, spliceCount);
        }
        return _events;
    };
    return ReplaySubject;
}(Subject_1.Subject));
exports.ReplaySubject = ReplaySubject;
var ReplayEvent = (function () {
    function ReplayEvent(time, value) {
        this.time = time;
        this.value = value;
    }
    return ReplayEvent;
}());

},{"./Subject":59,"./SubjectSubscription":60,"./Subscription":62,"./operators/observeOn":98,"./scheduler/queue":118,"./util/ObjectUnsubscribedError":125}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Scheduler = (function () {
    function Scheduler(SchedulerAction, now) {
        if (now === void 0) { now = Scheduler.now; }
        this.SchedulerAction = SchedulerAction;
        this.now = now;
    }
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        return new this.SchedulerAction(this, work).schedule(state, delay);
    };
    Scheduler.now = function () { return Date.now(); };
    return Scheduler;
}());
exports.Scheduler = Scheduler;

},{}],59:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("./Observable");
var Subscriber_1 = require("./Subscriber");
var Subscription_1 = require("./Subscription");
var ObjectUnsubscribedError_1 = require("./util/ObjectUnsubscribedError");
var SubjectSubscription_1 = require("./SubjectSubscription");
var rxSubscriber_1 = require("../internal/symbol/rxSubscriber");
var SubjectSubscriber = (function (_super) {
    __extends(SubjectSubscriber, _super);
    function SubjectSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        return _this;
    }
    return SubjectSubscriber;
}(Subscriber_1.Subscriber));
exports.SubjectSubscriber = SubjectSubscriber;
var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.observers = [];
        _this.closed = false;
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype[rxSubscriber_1.rxSubscriber] = function () {
        return new SubjectSubscriber(this);
    };
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype.next = function (value) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        if (!this.isStopped) {
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            for (var i = 0; i < len; i++) {
                copy[i].next(value);
            }
        }
    };
    Subject.prototype.error = function (err) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        this.hasError = true;
        this.thrownError = err;
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].error(err);
        }
        this.observers.length = 0;
    };
    Subject.prototype.complete = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].complete();
        }
        this.observers.length = 0;
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = true;
        this.closed = true;
        this.observers = null;
    };
    Subject.prototype._trySubscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else {
            return _super.prototype._trySubscribe.call(this, subscriber);
        }
    };
    Subject.prototype._subscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscriber.error(this.thrownError);
            return Subscription_1.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscriber.complete();
            return Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            return new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable_1.Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable_1.Observable));
exports.Subject = Subject;
var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var destination = this.destination;
        if (destination && destination.next) {
            destination.next(value);
        }
    };
    AnonymousSubject.prototype.error = function (err) {
        var destination = this.destination;
        if (destination && destination.error) {
            this.destination.error(err);
        }
    };
    AnonymousSubject.prototype.complete = function () {
        var destination = this.destination;
        if (destination && destination.complete) {
            this.destination.complete();
        }
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var source = this.source;
        if (source) {
            return this.source.subscribe(subscriber);
        }
        else {
            return Subscription_1.Subscription.EMPTY;
        }
    };
    return AnonymousSubject;
}(Subject));
exports.AnonymousSubject = AnonymousSubject;

},{"../internal/symbol/rxSubscriber":121,"./Observable":54,"./SubjectSubscription":60,"./Subscriber":61,"./Subscription":62,"./util/ObjectUnsubscribedError":125}],60:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscription_1 = require("./Subscription");
var SubjectSubscription = (function (_super) {
    __extends(SubjectSubscription, _super);
    function SubjectSubscription(subject, subscriber) {
        var _this = _super.call(this) || this;
        _this.subject = subject;
        _this.subscriber = subscriber;
        _this.closed = false;
        return _this;
    }
    SubjectSubscription.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        var subject = this.subject;
        var observers = subject.observers;
        this.subject = null;
        if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
            return;
        }
        var subscriberIndex = observers.indexOf(this.subscriber);
        if (subscriberIndex !== -1) {
            observers.splice(subscriberIndex, 1);
        }
    };
    return SubjectSubscription;
}(Subscription_1.Subscription));
exports.SubjectSubscription = SubjectSubscription;

},{"./Subscription":62}],61:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var isFunction_1 = require("./util/isFunction");
var Observer_1 = require("./Observer");
var Subscription_1 = require("./Subscription");
var rxSubscriber_1 = require("../internal/symbol/rxSubscriber");
var config_1 = require("./config");
var hostReportError_1 = require("./util/hostReportError");
var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(destinationOrNext, error, complete) {
        var _this = _super.call(this) || this;
        _this.syncErrorValue = null;
        _this.syncErrorThrown = false;
        _this.syncErrorThrowable = false;
        _this.isStopped = false;
        switch (arguments.length) {
            case 0:
                _this.destination = Observer_1.empty;
                break;
            case 1:
                if (!destinationOrNext) {
                    _this.destination = Observer_1.empty;
                    break;
                }
                if (typeof destinationOrNext === 'object') {
                    if (destinationOrNext instanceof Subscriber) {
                        _this.syncErrorThrowable = destinationOrNext.syncErrorThrowable;
                        _this.destination = destinationOrNext;
                        destinationOrNext.add(_this);
                    }
                    else {
                        _this.syncErrorThrowable = true;
                        _this.destination = new SafeSubscriber(_this, destinationOrNext);
                    }
                    break;
                }
            default:
                _this.syncErrorThrowable = true;
                _this.destination = new SafeSubscriber(_this, destinationOrNext, error, complete);
                break;
        }
        return _this;
    }
    Subscriber.prototype[rxSubscriber_1.rxSubscriber] = function () { return this; };
    Subscriber.create = function (next, error, complete) {
        var subscriber = new Subscriber(next, error, complete);
        subscriber.syncErrorThrowable = false;
        return subscriber;
    };
    Subscriber.prototype.next = function (value) {
        if (!this.isStopped) {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (!this.isStopped) {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        this.destination.error(err);
        this.unsubscribe();
    };
    Subscriber.prototype._complete = function () {
        this.destination.complete();
        this.unsubscribe();
    };
    Subscriber.prototype._unsubscribeAndRecycle = function () {
        var _parentOrParents = this._parentOrParents;
        this._parentOrParents = null;
        this.unsubscribe();
        this.closed = false;
        this.isStopped = false;
        this._parentOrParents = _parentOrParents;
        return this;
    };
    return Subscriber;
}(Subscription_1.Subscription));
exports.Subscriber = Subscriber;
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        _this._parentSubscriber = _parentSubscriber;
        var next;
        var context = _this;
        if (isFunction_1.isFunction(observerOrNext)) {
            next = observerOrNext;
        }
        else if (observerOrNext) {
            next = observerOrNext.next;
            error = observerOrNext.error;
            complete = observerOrNext.complete;
            if (observerOrNext !== Observer_1.empty) {
                context = Object.create(observerOrNext);
                if (isFunction_1.isFunction(context.unsubscribe)) {
                    _this.add(context.unsubscribe.bind(context));
                }
                context.unsubscribe = _this.unsubscribe.bind(_this);
            }
        }
        _this._context = context;
        _this._next = next;
        _this._error = error;
        _this._complete = complete;
        return _this;
    }
    SafeSubscriber.prototype.next = function (value) {
        if (!this.isStopped && this._next) {
            var _parentSubscriber = this._parentSubscriber;
            if (!config_1.config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                this.__tryOrUnsub(this._next, value);
            }
            else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            var useDeprecatedSynchronousErrorHandling = config_1.config.useDeprecatedSynchronousErrorHandling;
            if (this._error) {
                if (!useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(this._error, err);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, this._error, err);
                    this.unsubscribe();
                }
            }
            else if (!_parentSubscriber.syncErrorThrowable) {
                this.unsubscribe();
                if (useDeprecatedSynchronousErrorHandling) {
                    throw err;
                }
                hostReportError_1.hostReportError(err);
            }
            else {
                if (useDeprecatedSynchronousErrorHandling) {
                    _parentSubscriber.syncErrorValue = err;
                    _parentSubscriber.syncErrorThrown = true;
                }
                else {
                    hostReportError_1.hostReportError(err);
                }
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.complete = function () {
        var _this = this;
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            if (this._complete) {
                var wrappedComplete = function () { return _this._complete.call(_this._context); };
                if (!config_1.config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(wrappedComplete);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, wrappedComplete);
                    this.unsubscribe();
                }
            }
            else {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            this.unsubscribe();
            if (config_1.config.useDeprecatedSynchronousErrorHandling) {
                throw err;
            }
            else {
                hostReportError_1.hostReportError(err);
            }
        }
    };
    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
        if (!config_1.config.useDeprecatedSynchronousErrorHandling) {
            throw new Error('bad call');
        }
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            if (config_1.config.useDeprecatedSynchronousErrorHandling) {
                parent.syncErrorValue = err;
                parent.syncErrorThrown = true;
                return true;
            }
            else {
                hostReportError_1.hostReportError(err);
                return true;
            }
        }
        return false;
    };
    SafeSubscriber.prototype._unsubscribe = function () {
        var _parentSubscriber = this._parentSubscriber;
        this._context = null;
        this._parentSubscriber = null;
        _parentSubscriber.unsubscribe();
    };
    return SafeSubscriber;
}(Subscriber));
exports.SafeSubscriber = SafeSubscriber;

},{"../internal/symbol/rxSubscriber":121,"./Observer":55,"./Subscription":62,"./config":63,"./util/hostReportError":129,"./util/isFunction":133}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isArray_1 = require("./util/isArray");
var isObject_1 = require("./util/isObject");
var isFunction_1 = require("./util/isFunction");
var UnsubscriptionError_1 = require("./util/UnsubscriptionError");
var Subscription = (function () {
    function Subscription(unsubscribe) {
        this.closed = false;
        this._parentOrParents = null;
        this._subscriptions = null;
        if (unsubscribe) {
            this._ctorUnsubscribe = true;
            this._unsubscribe = unsubscribe;
        }
    }
    Subscription.prototype.unsubscribe = function () {
        var errors;
        if (this.closed) {
            return;
        }
        var _a = this, _parentOrParents = _a._parentOrParents, _ctorUnsubscribe = _a._ctorUnsubscribe, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
        this.closed = true;
        this._parentOrParents = null;
        this._subscriptions = null;
        if (_parentOrParents instanceof Subscription) {
            _parentOrParents.remove(this);
        }
        else if (_parentOrParents !== null) {
            for (var index = 0; index < _parentOrParents.length; ++index) {
                var parent_1 = _parentOrParents[index];
                parent_1.remove(this);
            }
        }
        if (isFunction_1.isFunction(_unsubscribe)) {
            if (_ctorUnsubscribe) {
                this._unsubscribe = undefined;
            }
            try {
                _unsubscribe.call(this);
            }
            catch (e) {
                errors = e instanceof UnsubscriptionError_1.UnsubscriptionError ? flattenUnsubscriptionErrors(e.errors) : [e];
            }
        }
        if (isArray_1.isArray(_subscriptions)) {
            var index = -1;
            var len = _subscriptions.length;
            while (++index < len) {
                var sub = _subscriptions[index];
                if (isObject_1.isObject(sub)) {
                    try {
                        sub.unsubscribe();
                    }
                    catch (e) {
                        errors = errors || [];
                        if (e instanceof UnsubscriptionError_1.UnsubscriptionError) {
                            errors = errors.concat(flattenUnsubscriptionErrors(e.errors));
                        }
                        else {
                            errors.push(e);
                        }
                    }
                }
            }
        }
        if (errors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
        }
    };
    Subscription.prototype.add = function (teardown) {
        var subscription = teardown;
        if (!teardown) {
            return Subscription.EMPTY;
        }
        switch (typeof teardown) {
            case 'function':
                subscription = new Subscription(teardown);
            case 'object':
                if (subscription === this || subscription.closed || typeof subscription.unsubscribe !== 'function') {
                    return subscription;
                }
                else if (this.closed) {
                    subscription.unsubscribe();
                    return subscription;
                }
                else if (!(subscription instanceof Subscription)) {
                    var tmp = subscription;
                    subscription = new Subscription();
                    subscription._subscriptions = [tmp];
                }
                break;
            default: {
                throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
            }
        }
        var _parentOrParents = subscription._parentOrParents;
        if (_parentOrParents === null) {
            subscription._parentOrParents = this;
        }
        else if (_parentOrParents instanceof Subscription) {
            if (_parentOrParents === this) {
                return subscription;
            }
            subscription._parentOrParents = [_parentOrParents, this];
        }
        else if (_parentOrParents.indexOf(this) === -1) {
            _parentOrParents.push(this);
        }
        else {
            return subscription;
        }
        var subscriptions = this._subscriptions;
        if (subscriptions === null) {
            this._subscriptions = [subscription];
        }
        else {
            subscriptions.push(subscription);
        }
        return subscription;
    };
    Subscription.prototype.remove = function (subscription) {
        var subscriptions = this._subscriptions;
        if (subscriptions) {
            var subscriptionIndex = subscriptions.indexOf(subscription);
            if (subscriptionIndex !== -1) {
                subscriptions.splice(subscriptionIndex, 1);
            }
        }
    };
    Subscription.EMPTY = (function (empty) {
        empty.closed = true;
        return empty;
    }(new Subscription()));
    return Subscription;
}());
exports.Subscription = Subscription;
function flattenUnsubscriptionErrors(errors) {
    return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError_1.UnsubscriptionError) ? err.errors : err); }, []);
}

},{"./util/UnsubscriptionError":127,"./util/isArray":131,"./util/isFunction":133,"./util/isObject":137}],63:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _enable_super_gross_mode_that_will_cause_bad_things = false;
exports.config = {
    Promise: undefined,
    set useDeprecatedSynchronousErrorHandling(value) {
        if (value) {
            var error = new Error();
            console.warn('DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: \n' + error.stack);
        }
        else if (_enable_super_gross_mode_that_will_cause_bad_things) {
            console.log('RxJS: Back to a better error behavior. Thank you. <3');
        }
        _enable_super_gross_mode_that_will_cause_bad_things = value;
    },
    get useDeprecatedSynchronousErrorHandling() {
        return _enable_super_gross_mode_that_will_cause_bad_things;
    },
};

},{}],64:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("./Subscriber");
var Observable_1 = require("./Observable");
var subscribeTo_1 = require("./util/subscribeTo");
var SimpleInnerSubscriber = (function (_super) {
    __extends(SimpleInnerSubscriber, _super);
    function SimpleInnerSubscriber(parent) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        return _this;
    }
    SimpleInnerSubscriber.prototype._next = function (value) {
        this.parent.notifyNext(value);
    };
    SimpleInnerSubscriber.prototype._error = function (error) {
        this.parent.notifyError(error);
        this.unsubscribe();
    };
    SimpleInnerSubscriber.prototype._complete = function () {
        this.parent.notifyComplete();
        this.unsubscribe();
    };
    return SimpleInnerSubscriber;
}(Subscriber_1.Subscriber));
exports.SimpleInnerSubscriber = SimpleInnerSubscriber;
var ComplexInnerSubscriber = (function (_super) {
    __extends(ComplexInnerSubscriber, _super);
    function ComplexInnerSubscriber(parent, outerValue, outerIndex) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.outerValue = outerValue;
        _this.outerIndex = outerIndex;
        return _this;
    }
    ComplexInnerSubscriber.prototype._next = function (value) {
        this.parent.notifyNext(this.outerValue, value, this.outerIndex, this);
    };
    ComplexInnerSubscriber.prototype._error = function (error) {
        this.parent.notifyError(error);
        this.unsubscribe();
    };
    ComplexInnerSubscriber.prototype._complete = function () {
        this.parent.notifyComplete(this);
        this.unsubscribe();
    };
    return ComplexInnerSubscriber;
}(Subscriber_1.Subscriber));
exports.ComplexInnerSubscriber = ComplexInnerSubscriber;
var SimpleOuterSubscriber = (function (_super) {
    __extends(SimpleOuterSubscriber, _super);
    function SimpleOuterSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SimpleOuterSubscriber.prototype.notifyNext = function (innerValue) {
        this.destination.next(innerValue);
    };
    SimpleOuterSubscriber.prototype.notifyError = function (err) {
        this.destination.error(err);
    };
    SimpleOuterSubscriber.prototype.notifyComplete = function () {
        this.destination.complete();
    };
    return SimpleOuterSubscriber;
}(Subscriber_1.Subscriber));
exports.SimpleOuterSubscriber = SimpleOuterSubscriber;
var ComplexOuterSubscriber = (function (_super) {
    __extends(ComplexOuterSubscriber, _super);
    function ComplexOuterSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ComplexOuterSubscriber.prototype.notifyNext = function (_outerValue, innerValue, _outerIndex, _innerSub) {
        this.destination.next(innerValue);
    };
    ComplexOuterSubscriber.prototype.notifyError = function (error) {
        this.destination.error(error);
    };
    ComplexOuterSubscriber.prototype.notifyComplete = function (_innerSub) {
        this.destination.complete();
    };
    return ComplexOuterSubscriber;
}(Subscriber_1.Subscriber));
exports.ComplexOuterSubscriber = ComplexOuterSubscriber;
function innerSubscribe(result, innerSubscriber) {
    if (innerSubscriber.closed) {
        return undefined;
    }
    if (result instanceof Observable_1.Observable) {
        return result.subscribe(innerSubscriber);
    }
    return subscribeTo_1.subscribeTo(result)(innerSubscriber);
}
exports.innerSubscribe = innerSubscribe;

},{"./Observable":54,"./Subscriber":61,"./util/subscribeTo":144}],65:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("../Subject");
var Observable_1 = require("../Observable");
var Subscriber_1 = require("../Subscriber");
var Subscription_1 = require("../Subscription");
var refCount_1 = require("../operators/refCount");
var ConnectableObservable = (function (_super) {
    __extends(ConnectableObservable, _super);
    function ConnectableObservable(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._refCount = 0;
        _this._isComplete = false;
        return _this;
    }
    ConnectableObservable.prototype._subscribe = function (subscriber) {
        return this.getSubject().subscribe(subscriber);
    };
    ConnectableObservable.prototype.getSubject = function () {
        var subject = this._subject;
        if (!subject || subject.isStopped) {
            this._subject = this.subjectFactory();
        }
        return this._subject;
    };
    ConnectableObservable.prototype.connect = function () {
        var connection = this._connection;
        if (!connection) {
            this._isComplete = false;
            connection = this._connection = new Subscription_1.Subscription();
            connection.add(this.source
                .subscribe(new ConnectableSubscriber(this.getSubject(), this)));
            if (connection.closed) {
                this._connection = null;
                connection = Subscription_1.Subscription.EMPTY;
            }
        }
        return connection;
    };
    ConnectableObservable.prototype.refCount = function () {
        return refCount_1.refCount()(this);
    };
    return ConnectableObservable;
}(Observable_1.Observable));
exports.ConnectableObservable = ConnectableObservable;
exports.connectableObservableDescriptor = (function () {
    var connectableProto = ConnectableObservable.prototype;
    return {
        operator: { value: null },
        _refCount: { value: 0, writable: true },
        _subject: { value: null, writable: true },
        _connection: { value: null, writable: true },
        _subscribe: { value: connectableProto._subscribe },
        _isComplete: { value: connectableProto._isComplete, writable: true },
        getSubject: { value: connectableProto.getSubject },
        connect: { value: connectableProto.connect },
        refCount: { value: connectableProto.refCount }
    };
})();
var ConnectableSubscriber = (function (_super) {
    __extends(ConnectableSubscriber, _super);
    function ConnectableSubscriber(destination, connectable) {
        var _this = _super.call(this, destination) || this;
        _this.connectable = connectable;
        return _this;
    }
    ConnectableSubscriber.prototype._error = function (err) {
        this._unsubscribe();
        _super.prototype._error.call(this, err);
    };
    ConnectableSubscriber.prototype._complete = function () {
        this.connectable._isComplete = true;
        this._unsubscribe();
        _super.prototype._complete.call(this);
    };
    ConnectableSubscriber.prototype._unsubscribe = function () {
        var connectable = this.connectable;
        if (connectable) {
            this.connectable = null;
            var connection = connectable._connection;
            connectable._refCount = 0;
            connectable._subject = null;
            connectable._connection = null;
            if (connection) {
                connection.unsubscribe();
            }
        }
    };
    return ConnectableSubscriber;
}(Subject_1.SubjectSubscriber));
var RefCountOperator = (function () {
    function RefCountOperator(connectable) {
        this.connectable = connectable;
    }
    RefCountOperator.prototype.call = function (subscriber, source) {
        var connectable = this.connectable;
        connectable._refCount++;
        var refCounter = new RefCountSubscriber(subscriber, connectable);
        var subscription = source.subscribe(refCounter);
        if (!refCounter.closed) {
            refCounter.connection = connectable.connect();
        }
        return subscription;
    };
    return RefCountOperator;
}());
var RefCountSubscriber = (function (_super) {
    __extends(RefCountSubscriber, _super);
    function RefCountSubscriber(destination, connectable) {
        var _this = _super.call(this, destination) || this;
        _this.connectable = connectable;
        return _this;
    }
    RefCountSubscriber.prototype._unsubscribe = function () {
        var connectable = this.connectable;
        if (!connectable) {
            this.connection = null;
            return;
        }
        this.connectable = null;
        var refCount = connectable._refCount;
        if (refCount <= 0) {
            this.connection = null;
            return;
        }
        connectable._refCount = refCount - 1;
        if (refCount > 1) {
            this.connection = null;
            return;
        }
        var connection = this.connection;
        var sharedConnection = connectable._connection;
        this.connection = null;
        if (sharedConnection && (!connection || sharedConnection === connection)) {
            sharedConnection.unsubscribe();
        }
    };
    return RefCountSubscriber;
}(Subscriber_1.Subscriber));

},{"../Observable":54,"../Subject":59,"../Subscriber":61,"../Subscription":62,"../operators/refCount":99}],66:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var AsyncSubject_1 = require("../AsyncSubject");
var map_1 = require("../operators/map");
var canReportError_1 = require("../util/canReportError");
var isArray_1 = require("../util/isArray");
var isScheduler_1 = require("../util/isScheduler");
function bindCallback(callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
        if (isScheduler_1.isScheduler(resultSelector)) {
            scheduler = resultSelector;
        }
        else {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return bindCallback(callbackFunc, scheduler).apply(void 0, args).pipe(map_1.map(function (args) { return isArray_1.isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
            };
        }
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var context = this;
        var subject;
        var params = {
            context: context,
            subject: subject,
            callbackFunc: callbackFunc,
            scheduler: scheduler,
        };
        return new Observable_1.Observable(function (subscriber) {
            if (!scheduler) {
                if (!subject) {
                    subject = new AsyncSubject_1.AsyncSubject();
                    var handler = function () {
                        var innerArgs = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            innerArgs[_i] = arguments[_i];
                        }
                        subject.next(innerArgs.length <= 1 ? innerArgs[0] : innerArgs);
                        subject.complete();
                    };
                    try {
                        callbackFunc.apply(context, args.concat([handler]));
                    }
                    catch (err) {
                        if (canReportError_1.canReportError(subject)) {
                            subject.error(err);
                        }
                        else {
                            console.warn(err);
                        }
                    }
                }
                return subject.subscribe(subscriber);
            }
            else {
                var state = {
                    args: args, subscriber: subscriber, params: params,
                };
                return scheduler.schedule(dispatch, 0, state);
            }
        });
    };
}
exports.bindCallback = bindCallback;
function dispatch(state) {
    var _this = this;
    var self = this;
    var args = state.args, subscriber = state.subscriber, params = state.params;
    var callbackFunc = params.callbackFunc, context = params.context, scheduler = params.scheduler;
    var subject = params.subject;
    if (!subject) {
        subject = params.subject = new AsyncSubject_1.AsyncSubject();
        var handler = function () {
            var innerArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                innerArgs[_i] = arguments[_i];
            }
            var value = innerArgs.length <= 1 ? innerArgs[0] : innerArgs;
            _this.add(scheduler.schedule(dispatchNext, 0, { value: value, subject: subject }));
        };
        try {
            callbackFunc.apply(context, args.concat([handler]));
        }
        catch (err) {
            subject.error(err);
        }
    }
    this.add(subject.subscribe(subscriber));
}
function dispatchNext(state) {
    var value = state.value, subject = state.subject;
    subject.next(value);
    subject.complete();
}
function dispatchError(state) {
    var err = state.err, subject = state.subject;
    subject.error(err);
}

},{"../AsyncSubject":50,"../Observable":54,"../operators/map":95,"../util/canReportError":128,"../util/isArray":131,"../util/isScheduler":140}],67:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var AsyncSubject_1 = require("../AsyncSubject");
var map_1 = require("../operators/map");
var canReportError_1 = require("../util/canReportError");
var isScheduler_1 = require("../util/isScheduler");
var isArray_1 = require("../util/isArray");
function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
        if (isScheduler_1.isScheduler(resultSelector)) {
            scheduler = resultSelector;
        }
        else {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return bindNodeCallback(callbackFunc, scheduler).apply(void 0, args).pipe(map_1.map(function (args) { return isArray_1.isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
            };
        }
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var params = {
            subject: undefined,
            args: args,
            callbackFunc: callbackFunc,
            scheduler: scheduler,
            context: this,
        };
        return new Observable_1.Observable(function (subscriber) {
            var context = params.context;
            var subject = params.subject;
            if (!scheduler) {
                if (!subject) {
                    subject = params.subject = new AsyncSubject_1.AsyncSubject();
                    var handler = function () {
                        var innerArgs = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            innerArgs[_i] = arguments[_i];
                        }
                        var err = innerArgs.shift();
                        if (err) {
                            subject.error(err);
                            return;
                        }
                        subject.next(innerArgs.length <= 1 ? innerArgs[0] : innerArgs);
                        subject.complete();
                    };
                    try {
                        callbackFunc.apply(context, args.concat([handler]));
                    }
                    catch (err) {
                        if (canReportError_1.canReportError(subject)) {
                            subject.error(err);
                        }
                        else {
                            console.warn(err);
                        }
                    }
                }
                return subject.subscribe(subscriber);
            }
            else {
                return scheduler.schedule(dispatch, 0, { params: params, subscriber: subscriber, context: context });
            }
        });
    };
}
exports.bindNodeCallback = bindNodeCallback;
function dispatch(state) {
    var _this = this;
    var params = state.params, subscriber = state.subscriber, context = state.context;
    var callbackFunc = params.callbackFunc, args = params.args, scheduler = params.scheduler;
    var subject = params.subject;
    if (!subject) {
        subject = params.subject = new AsyncSubject_1.AsyncSubject();
        var handler = function () {
            var innerArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                innerArgs[_i] = arguments[_i];
            }
            var err = innerArgs.shift();
            if (err) {
                _this.add(scheduler.schedule(dispatchError, 0, { err: err, subject: subject }));
            }
            else {
                var value = innerArgs.length <= 1 ? innerArgs[0] : innerArgs;
                _this.add(scheduler.schedule(dispatchNext, 0, { value: value, subject: subject }));
            }
        };
        try {
            callbackFunc.apply(context, args.concat([handler]));
        }
        catch (err) {
            this.add(scheduler.schedule(dispatchError, 0, { err: err, subject: subject }));
        }
    }
    this.add(subject.subscribe(subscriber));
}
function dispatchNext(arg) {
    var value = arg.value, subject = arg.subject;
    subject.next(value);
    subject.complete();
}
function dispatchError(arg) {
    var err = arg.err, subject = arg.subject;
    subject.error(err);
}

},{"../AsyncSubject":50,"../Observable":54,"../operators/map":95,"../util/canReportError":128,"../util/isArray":131,"../util/isScheduler":140}],68:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var isScheduler_1 = require("../util/isScheduler");
var isArray_1 = require("../util/isArray");
var OuterSubscriber_1 = require("../OuterSubscriber");
var subscribeToResult_1 = require("../util/subscribeToResult");
var fromArray_1 = require("./fromArray");
var NONE = {};
function combineLatest() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var resultSelector = undefined;
    var scheduler = undefined;
    if (isScheduler_1.isScheduler(observables[observables.length - 1])) {
        scheduler = observables.pop();
    }
    if (typeof observables[observables.length - 1] === 'function') {
        resultSelector = observables.pop();
    }
    if (observables.length === 1 && isArray_1.isArray(observables[0])) {
        observables = observables[0];
    }
    return fromArray_1.fromArray(observables, scheduler).lift(new CombineLatestOperator(resultSelector));
}
exports.combineLatest = combineLatest;
var CombineLatestOperator = (function () {
    function CombineLatestOperator(resultSelector) {
        this.resultSelector = resultSelector;
    }
    CombineLatestOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new CombineLatestSubscriber(subscriber, this.resultSelector));
    };
    return CombineLatestOperator;
}());
exports.CombineLatestOperator = CombineLatestOperator;
var CombineLatestSubscriber = (function (_super) {
    __extends(CombineLatestSubscriber, _super);
    function CombineLatestSubscriber(destination, resultSelector) {
        var _this = _super.call(this, destination) || this;
        _this.resultSelector = resultSelector;
        _this.active = 0;
        _this.values = [];
        _this.observables = [];
        return _this;
    }
    CombineLatestSubscriber.prototype._next = function (observable) {
        this.values.push(NONE);
        this.observables.push(observable);
    };
    CombineLatestSubscriber.prototype._complete = function () {
        var observables = this.observables;
        var len = observables.length;
        if (len === 0) {
            this.destination.complete();
        }
        else {
            this.active = len;
            this.toRespond = len;
            for (var i = 0; i < len; i++) {
                var observable = observables[i];
                this.add(subscribeToResult_1.subscribeToResult(this, observable, undefined, i));
            }
        }
    };
    CombineLatestSubscriber.prototype.notifyComplete = function (unused) {
        if ((this.active -= 1) === 0) {
            this.destination.complete();
        }
    };
    CombineLatestSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
        var values = this.values;
        var oldVal = values[outerIndex];
        var toRespond = !this.toRespond
            ? 0
            : oldVal === NONE ? --this.toRespond : this.toRespond;
        values[outerIndex] = innerValue;
        if (toRespond === 0) {
            if (this.resultSelector) {
                this._tryResultSelector(values);
            }
            else {
                this.destination.next(values.slice());
            }
        }
    };
    CombineLatestSubscriber.prototype._tryResultSelector = function (values) {
        var result;
        try {
            result = this.resultSelector.apply(this, values);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return CombineLatestSubscriber;
}(OuterSubscriber_1.OuterSubscriber));
exports.CombineLatestSubscriber = CombineLatestSubscriber;

},{"../OuterSubscriber":56,"../util/isArray":131,"../util/isScheduler":140,"../util/subscribeToResult":149,"./fromArray":74}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var of_1 = require("./of");
var concatAll_1 = require("../operators/concatAll");
function concat() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    return concatAll_1.concatAll()(of_1.of.apply(void 0, observables));
}
exports.concat = concat;

},{"../operators/concatAll":92,"./of":82}],70:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var from_1 = require("./from");
var empty_1 = require("./empty");
function defer(observableFactory) {
    return new Observable_1.Observable(function (subscriber) {
        var input;
        try {
            input = observableFactory();
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        var source = input ? from_1.from(input) : empty_1.empty();
        return source.subscribe(subscriber);
    });
}
exports.defer = defer;

},{"../Observable":54,"./empty":71,"./from":73}],71:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
exports.EMPTY = new Observable_1.Observable(function (subscriber) { return subscriber.complete(); });
function empty(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : exports.EMPTY;
}
exports.empty = empty;
function emptyScheduled(scheduler) {
    return new Observable_1.Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
}

},{"../Observable":54}],72:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var isArray_1 = require("../util/isArray");
var map_1 = require("../operators/map");
var isObject_1 = require("../util/isObject");
var from_1 = require("./from");
function forkJoin() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    if (sources.length === 1) {
        var first_1 = sources[0];
        if (isArray_1.isArray(first_1)) {
            return forkJoinInternal(first_1, null);
        }
        if (isObject_1.isObject(first_1) && Object.getPrototypeOf(first_1) === Object.prototype) {
            var keys = Object.keys(first_1);
            return forkJoinInternal(keys.map(function (key) { return first_1[key]; }), keys);
        }
    }
    if (typeof sources[sources.length - 1] === 'function') {
        var resultSelector_1 = sources.pop();
        sources = (sources.length === 1 && isArray_1.isArray(sources[0])) ? sources[0] : sources;
        return forkJoinInternal(sources, null).pipe(map_1.map(function (args) { return resultSelector_1.apply(void 0, args); }));
    }
    return forkJoinInternal(sources, null);
}
exports.forkJoin = forkJoin;
function forkJoinInternal(sources, keys) {
    return new Observable_1.Observable(function (subscriber) {
        var len = sources.length;
        if (len === 0) {
            subscriber.complete();
            return;
        }
        var values = new Array(len);
        var completed = 0;
        var emitted = 0;
        var _loop_1 = function (i) {
            var source = from_1.from(sources[i]);
            var hasValue = false;
            subscriber.add(source.subscribe({
                next: function (value) {
                    if (!hasValue) {
                        hasValue = true;
                        emitted++;
                    }
                    values[i] = value;
                },
                error: function (err) { return subscriber.error(err); },
                complete: function () {
                    completed++;
                    if (completed === len || !hasValue) {
                        if (emitted === len) {
                            subscriber.next(keys ?
                                keys.reduce(function (result, key, i) { return (result[key] = values[i], result); }, {}) :
                                values);
                        }
                        subscriber.complete();
                    }
                }
            }));
        };
        for (var i = 0; i < len; i++) {
            _loop_1(i);
        }
    });
}

},{"../Observable":54,"../operators/map":95,"../util/isArray":131,"../util/isObject":137,"./from":73}],73:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var subscribeTo_1 = require("../util/subscribeTo");
var scheduled_1 = require("../scheduled/scheduled");
function from(input, scheduler) {
    if (!scheduler) {
        if (input instanceof Observable_1.Observable) {
            return input;
        }
        return new Observable_1.Observable(subscribeTo_1.subscribeTo(input));
    }
    else {
        return scheduled_1.scheduled(input, scheduler);
    }
}
exports.from = from;

},{"../Observable":54,"../scheduled/scheduled":104,"../util/subscribeTo":144}],74:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var subscribeToArray_1 = require("../util/subscribeToArray");
var scheduleArray_1 = require("../scheduled/scheduleArray");
function fromArray(input, scheduler) {
    if (!scheduler) {
        return new Observable_1.Observable(subscribeToArray_1.subscribeToArray(input));
    }
    else {
        return scheduleArray_1.scheduleArray(input, scheduler);
    }
}
exports.fromArray = fromArray;

},{"../Observable":54,"../scheduled/scheduleArray":100,"../util/subscribeToArray":145}],75:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var isArray_1 = require("../util/isArray");
var isFunction_1 = require("../util/isFunction");
var map_1 = require("../operators/map");
var toString = (function () { return Object.prototype.toString; })();
function fromEvent(target, eventName, options, resultSelector) {
    if (isFunction_1.isFunction(options)) {
        resultSelector = options;
        options = undefined;
    }
    if (resultSelector) {
        return fromEvent(target, eventName, options).pipe(map_1.map(function (args) { return isArray_1.isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
    }
    return new Observable_1.Observable(function (subscriber) {
        function handler(e) {
            if (arguments.length > 1) {
                subscriber.next(Array.prototype.slice.call(arguments));
            }
            else {
                subscriber.next(e);
            }
        }
        setupSubscription(target, eventName, handler, subscriber, options);
    });
}
exports.fromEvent = fromEvent;
function setupSubscription(sourceObj, eventName, handler, subscriber, options) {
    var unsubscribe;
    if (isEventTarget(sourceObj)) {
        var source_1 = sourceObj;
        sourceObj.addEventListener(eventName, handler, options);
        unsubscribe = function () { return source_1.removeEventListener(eventName, handler, options); };
    }
    else if (isJQueryStyleEventEmitter(sourceObj)) {
        var source_2 = sourceObj;
        sourceObj.on(eventName, handler);
        unsubscribe = function () { return source_2.off(eventName, handler); };
    }
    else if (isNodeStyleEventEmitter(sourceObj)) {
        var source_3 = sourceObj;
        sourceObj.addListener(eventName, handler);
        unsubscribe = function () { return source_3.removeListener(eventName, handler); };
    }
    else if (sourceObj && sourceObj.length) {
        for (var i = 0, len = sourceObj.length; i < len; i++) {
            setupSubscription(sourceObj[i], eventName, handler, subscriber, options);
        }
    }
    else {
        throw new TypeError('Invalid event target');
    }
    subscriber.add(unsubscribe);
}
function isNodeStyleEventEmitter(sourceObj) {
    return sourceObj && typeof sourceObj.addListener === 'function' && typeof sourceObj.removeListener === 'function';
}
function isJQueryStyleEventEmitter(sourceObj) {
    return sourceObj && typeof sourceObj.on === 'function' && typeof sourceObj.off === 'function';
}
function isEventTarget(sourceObj) {
    return sourceObj && typeof sourceObj.addEventListener === 'function' && typeof sourceObj.removeEventListener === 'function';
}

},{"../Observable":54,"../operators/map":95,"../util/isArray":131,"../util/isFunction":133}],76:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var isArray_1 = require("../util/isArray");
var isFunction_1 = require("../util/isFunction");
var map_1 = require("../operators/map");
function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe(map_1.map(function (args) { return isArray_1.isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
    }
    return new Observable_1.Observable(function (subscriber) {
        var handler = function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return subscriber.next(e.length === 1 ? e[0] : e);
        };
        var retValue;
        try {
            retValue = addHandler(handler);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        if (!isFunction_1.isFunction(removeHandler)) {
            return undefined;
        }
        return function () { return removeHandler(handler, retValue); };
    });
}
exports.fromEventPattern = fromEventPattern;

},{"../Observable":54,"../operators/map":95,"../util/isArray":131,"../util/isFunction":133}],77:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var identity_1 = require("../util/identity");
var isScheduler_1 = require("../util/isScheduler");
function generate(initialStateOrOptions, condition, iterate, resultSelectorOrObservable, scheduler) {
    var resultSelector;
    var initialState;
    if (arguments.length == 1) {
        var options = initialStateOrOptions;
        initialState = options.initialState;
        condition = options.condition;
        iterate = options.iterate;
        resultSelector = options.resultSelector || identity_1.identity;
        scheduler = options.scheduler;
    }
    else if (resultSelectorOrObservable === undefined || isScheduler_1.isScheduler(resultSelectorOrObservable)) {
        initialState = initialStateOrOptions;
        resultSelector = identity_1.identity;
        scheduler = resultSelectorOrObservable;
    }
    else {
        initialState = initialStateOrOptions;
        resultSelector = resultSelectorOrObservable;
    }
    return new Observable_1.Observable(function (subscriber) {
        var state = initialState;
        if (scheduler) {
            return scheduler.schedule(dispatch, 0, {
                subscriber: subscriber,
                iterate: iterate,
                condition: condition,
                resultSelector: resultSelector,
                state: state
            });
        }
        do {
            if (condition) {
                var conditionResult = void 0;
                try {
                    conditionResult = condition(state);
                }
                catch (err) {
                    subscriber.error(err);
                    return undefined;
                }
                if (!conditionResult) {
                    subscriber.complete();
                    break;
                }
            }
            var value = void 0;
            try {
                value = resultSelector(state);
            }
            catch (err) {
                subscriber.error(err);
                return undefined;
            }
            subscriber.next(value);
            if (subscriber.closed) {
                break;
            }
            try {
                state = iterate(state);
            }
            catch (err) {
                subscriber.error(err);
                return undefined;
            }
        } while (true);
        return undefined;
    });
}
exports.generate = generate;
function dispatch(state) {
    var subscriber = state.subscriber, condition = state.condition;
    if (subscriber.closed) {
        return undefined;
    }
    if (state.needIterate) {
        try {
            state.state = state.iterate(state.state);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
    }
    else {
        state.needIterate = true;
    }
    if (condition) {
        var conditionResult = void 0;
        try {
            conditionResult = condition(state.state);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        if (!conditionResult) {
            subscriber.complete();
            return undefined;
        }
        if (subscriber.closed) {
            return undefined;
        }
    }
    var value;
    try {
        value = state.resultSelector(state.state);
    }
    catch (err) {
        subscriber.error(err);
        return undefined;
    }
    if (subscriber.closed) {
        return undefined;
    }
    subscriber.next(value);
    if (subscriber.closed) {
        return undefined;
    }
    return this.schedule(state);
}

},{"../Observable":54,"../util/identity":130,"../util/isScheduler":140}],78:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defer_1 = require("./defer");
var empty_1 = require("./empty");
function iif(condition, trueResult, falseResult) {
    if (trueResult === void 0) { trueResult = empty_1.EMPTY; }
    if (falseResult === void 0) { falseResult = empty_1.EMPTY; }
    return defer_1.defer(function () { return condition() ? trueResult : falseResult; });
}
exports.iif = iif;

},{"./defer":70,"./empty":71}],79:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var async_1 = require("../scheduler/async");
var isNumeric_1 = require("../util/isNumeric");
function interval(period, scheduler) {
    if (period === void 0) { period = 0; }
    if (scheduler === void 0) { scheduler = async_1.async; }
    if (!isNumeric_1.isNumeric(period) || period < 0) {
        period = 0;
    }
    if (!scheduler || typeof scheduler.schedule !== 'function') {
        scheduler = async_1.async;
    }
    return new Observable_1.Observable(function (subscriber) {
        subscriber.add(scheduler.schedule(dispatch, period, { subscriber: subscriber, counter: 0, period: period }));
        return subscriber;
    });
}
exports.interval = interval;
function dispatch(state) {
    var subscriber = state.subscriber, counter = state.counter, period = state.period;
    subscriber.next(counter);
    this.schedule({ subscriber: subscriber, counter: counter + 1, period: period }, period);
}

},{"../Observable":54,"../scheduler/async":117,"../util/isNumeric":136}],80:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var isScheduler_1 = require("../util/isScheduler");
var mergeAll_1 = require("../operators/mergeAll");
var fromArray_1 = require("./fromArray");
function merge() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var concurrent = Number.POSITIVE_INFINITY;
    var scheduler = null;
    var last = observables[observables.length - 1];
    if (isScheduler_1.isScheduler(last)) {
        scheduler = observables.pop();
        if (observables.length > 1 && typeof observables[observables.length - 1] === 'number') {
            concurrent = observables.pop();
        }
    }
    else if (typeof last === 'number') {
        concurrent = observables.pop();
    }
    if (scheduler === null && observables.length === 1 && observables[0] instanceof Observable_1.Observable) {
        return observables[0];
    }
    return mergeAll_1.mergeAll(concurrent)(fromArray_1.fromArray(observables, scheduler));
}
exports.merge = merge;

},{"../Observable":54,"../operators/mergeAll":96,"../util/isScheduler":140,"./fromArray":74}],81:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var noop_1 = require("../util/noop");
exports.NEVER = new Observable_1.Observable(noop_1.noop);
function never() {
    return exports.NEVER;
}
exports.never = never;

},{"../Observable":54,"../util/noop":141}],82:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isScheduler_1 = require("../util/isScheduler");
var fromArray_1 = require("./fromArray");
var scheduleArray_1 = require("../scheduled/scheduleArray");
function of() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args[args.length - 1];
    if (isScheduler_1.isScheduler(scheduler)) {
        args.pop();
        return scheduleArray_1.scheduleArray(args, scheduler);
    }
    else {
        return fromArray_1.fromArray(args);
    }
}
exports.of = of;

},{"../scheduled/scheduleArray":100,"../util/isScheduler":140,"./fromArray":74}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var from_1 = require("./from");
var isArray_1 = require("../util/isArray");
var empty_1 = require("./empty");
function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    if (sources.length === 0) {
        return empty_1.EMPTY;
    }
    var first = sources[0], remainder = sources.slice(1);
    if (sources.length === 1 && isArray_1.isArray(first)) {
        return onErrorResumeNext.apply(void 0, first);
    }
    return new Observable_1.Observable(function (subscriber) {
        var subNext = function () { return subscriber.add(onErrorResumeNext.apply(void 0, remainder).subscribe(subscriber)); };
        return from_1.from(first).subscribe({
            next: function (value) { subscriber.next(value); },
            error: subNext,
            complete: subNext,
        });
    });
}
exports.onErrorResumeNext = onErrorResumeNext;

},{"../Observable":54,"../util/isArray":131,"./empty":71,"./from":73}],84:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
function pairs(obj, scheduler) {
    if (!scheduler) {
        return new Observable_1.Observable(function (subscriber) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length && !subscriber.closed; i++) {
                var key = keys[i];
                if (obj.hasOwnProperty(key)) {
                    subscriber.next([key, obj[key]]);
                }
            }
            subscriber.complete();
        });
    }
    else {
        return new Observable_1.Observable(function (subscriber) {
            var keys = Object.keys(obj);
            var subscription = new Subscription_1.Subscription();
            subscription.add(scheduler.schedule(dispatch, 0, { keys: keys, index: 0, subscriber: subscriber, subscription: subscription, obj: obj }));
            return subscription;
        });
    }
}
exports.pairs = pairs;
function dispatch(state) {
    var keys = state.keys, index = state.index, subscriber = state.subscriber, subscription = state.subscription, obj = state.obj;
    if (!subscriber.closed) {
        if (index < keys.length) {
            var key = keys[index];
            subscriber.next([key, obj[key]]);
            subscription.add(this.schedule({ keys: keys, index: index + 1, subscriber: subscriber, subscription: subscription, obj: obj }));
        }
        else {
            subscriber.complete();
        }
    }
}
exports.dispatch = dispatch;

},{"../Observable":54,"../Subscription":62}],85:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var not_1 = require("../util/not");
var subscribeTo_1 = require("../util/subscribeTo");
var filter_1 = require("../operators/filter");
var Observable_1 = require("../Observable");
function partition(source, predicate, thisArg) {
    return [
        filter_1.filter(predicate, thisArg)(new Observable_1.Observable(subscribeTo_1.subscribeTo(source))),
        filter_1.filter(not_1.not(predicate, thisArg))(new Observable_1.Observable(subscribeTo_1.subscribeTo(source)))
    ];
}
exports.partition = partition;

},{"../Observable":54,"../operators/filter":93,"../util/not":142,"../util/subscribeTo":144}],86:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var isArray_1 = require("../util/isArray");
var fromArray_1 = require("./fromArray");
var OuterSubscriber_1 = require("../OuterSubscriber");
var subscribeToResult_1 = require("../util/subscribeToResult");
function race() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    if (observables.length === 1) {
        if (isArray_1.isArray(observables[0])) {
            observables = observables[0];
        }
        else {
            return observables[0];
        }
    }
    return fromArray_1.fromArray(observables, undefined).lift(new RaceOperator());
}
exports.race = race;
var RaceOperator = (function () {
    function RaceOperator() {
    }
    RaceOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new RaceSubscriber(subscriber));
    };
    return RaceOperator;
}());
exports.RaceOperator = RaceOperator;
var RaceSubscriber = (function (_super) {
    __extends(RaceSubscriber, _super);
    function RaceSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.hasFirst = false;
        _this.observables = [];
        _this.subscriptions = [];
        return _this;
    }
    RaceSubscriber.prototype._next = function (observable) {
        this.observables.push(observable);
    };
    RaceSubscriber.prototype._complete = function () {
        var observables = this.observables;
        var len = observables.length;
        if (len === 0) {
            this.destination.complete();
        }
        else {
            for (var i = 0; i < len && !this.hasFirst; i++) {
                var observable = observables[i];
                var subscription = subscribeToResult_1.subscribeToResult(this, observable, undefined, i);
                if (this.subscriptions) {
                    this.subscriptions.push(subscription);
                }
                this.add(subscription);
            }
            this.observables = null;
        }
    };
    RaceSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
        if (!this.hasFirst) {
            this.hasFirst = true;
            for (var i = 0; i < this.subscriptions.length; i++) {
                if (i !== outerIndex) {
                    var subscription = this.subscriptions[i];
                    subscription.unsubscribe();
                    this.remove(subscription);
                }
            }
            this.subscriptions = null;
        }
        this.destination.next(innerValue);
    };
    return RaceSubscriber;
}(OuterSubscriber_1.OuterSubscriber));
exports.RaceSubscriber = RaceSubscriber;

},{"../OuterSubscriber":56,"../util/isArray":131,"../util/subscribeToResult":149,"./fromArray":74}],87:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
function range(start, count, scheduler) {
    if (start === void 0) { start = 0; }
    return new Observable_1.Observable(function (subscriber) {
        if (count === undefined) {
            count = start;
            start = 0;
        }
        var index = 0;
        var current = start;
        if (scheduler) {
            return scheduler.schedule(dispatch, 0, {
                index: index, count: count, start: start, subscriber: subscriber
            });
        }
        else {
            do {
                if (index++ >= count) {
                    subscriber.complete();
                    break;
                }
                subscriber.next(current++);
                if (subscriber.closed) {
                    break;
                }
            } while (true);
        }
        return undefined;
    });
}
exports.range = range;
function dispatch(state) {
    var start = state.start, index = state.index, count = state.count, subscriber = state.subscriber;
    if (index >= count) {
        subscriber.complete();
        return;
    }
    subscriber.next(start);
    if (subscriber.closed) {
        return;
    }
    state.index = index + 1;
    state.start = start + 1;
    this.schedule(state);
}
exports.dispatch = dispatch;

},{"../Observable":54}],88:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
function throwError(error, scheduler) {
    if (!scheduler) {
        return new Observable_1.Observable(function (subscriber) { return subscriber.error(error); });
    }
    else {
        return new Observable_1.Observable(function (subscriber) { return scheduler.schedule(dispatch, 0, { error: error, subscriber: subscriber }); });
    }
}
exports.throwError = throwError;
function dispatch(_a) {
    var error = _a.error, subscriber = _a.subscriber;
    subscriber.error(error);
}

},{"../Observable":54}],89:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var async_1 = require("../scheduler/async");
var isNumeric_1 = require("../util/isNumeric");
var isScheduler_1 = require("../util/isScheduler");
function timer(dueTime, periodOrScheduler, scheduler) {
    if (dueTime === void 0) { dueTime = 0; }
    var period = -1;
    if (isNumeric_1.isNumeric(periodOrScheduler)) {
        period = Number(periodOrScheduler) < 1 && 1 || Number(periodOrScheduler);
    }
    else if (isScheduler_1.isScheduler(periodOrScheduler)) {
        scheduler = periodOrScheduler;
    }
    if (!isScheduler_1.isScheduler(scheduler)) {
        scheduler = async_1.async;
    }
    return new Observable_1.Observable(function (subscriber) {
        var due = isNumeric_1.isNumeric(dueTime)
            ? dueTime
            : (+dueTime - scheduler.now());
        return scheduler.schedule(dispatch, due, {
            index: 0, period: period, subscriber: subscriber
        });
    });
}
exports.timer = timer;
function dispatch(state) {
    var index = state.index, period = state.period, subscriber = state.subscriber;
    subscriber.next(index);
    if (subscriber.closed) {
        return;
    }
    else if (period === -1) {
        return subscriber.complete();
    }
    state.index = index + 1;
    this.schedule(state, period);
}

},{"../Observable":54,"../scheduler/async":117,"../util/isNumeric":136,"../util/isScheduler":140}],90:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var from_1 = require("./from");
var empty_1 = require("./empty");
function using(resourceFactory, observableFactory) {
    return new Observable_1.Observable(function (subscriber) {
        var resource;
        try {
            resource = resourceFactory();
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        var result;
        try {
            result = observableFactory(resource);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        var source = result ? from_1.from(result) : empty_1.EMPTY;
        var subscription = source.subscribe(subscriber);
        return function () {
            subscription.unsubscribe();
            if (resource) {
                resource.unsubscribe();
            }
        };
    });
}
exports.using = using;

},{"../Observable":54,"./empty":71,"./from":73}],91:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var fromArray_1 = require("./fromArray");
var isArray_1 = require("../util/isArray");
var Subscriber_1 = require("../Subscriber");
var iterator_1 = require("../../internal/symbol/iterator");
var innerSubscribe_1 = require("../innerSubscribe");
function zip() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var resultSelector = observables[observables.length - 1];
    if (typeof resultSelector === 'function') {
        observables.pop();
    }
    return fromArray_1.fromArray(observables, undefined).lift(new ZipOperator(resultSelector));
}
exports.zip = zip;
var ZipOperator = (function () {
    function ZipOperator(resultSelector) {
        this.resultSelector = resultSelector;
    }
    ZipOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ZipSubscriber(subscriber, this.resultSelector));
    };
    return ZipOperator;
}());
exports.ZipOperator = ZipOperator;
var ZipSubscriber = (function (_super) {
    __extends(ZipSubscriber, _super);
    function ZipSubscriber(destination, resultSelector, values) {
        if (values === void 0) { values = Object.create(null); }
        var _this = _super.call(this, destination) || this;
        _this.resultSelector = resultSelector;
        _this.iterators = [];
        _this.active = 0;
        _this.resultSelector = (typeof resultSelector === 'function') ? resultSelector : undefined;
        return _this;
    }
    ZipSubscriber.prototype._next = function (value) {
        var iterators = this.iterators;
        if (isArray_1.isArray(value)) {
            iterators.push(new StaticArrayIterator(value));
        }
        else if (typeof value[iterator_1.iterator] === 'function') {
            iterators.push(new StaticIterator(value[iterator_1.iterator]()));
        }
        else {
            iterators.push(new ZipBufferIterator(this.destination, this, value));
        }
    };
    ZipSubscriber.prototype._complete = function () {
        var iterators = this.iterators;
        var len = iterators.length;
        this.unsubscribe();
        if (len === 0) {
            this.destination.complete();
            return;
        }
        this.active = len;
        for (var i = 0; i < len; i++) {
            var iterator = iterators[i];
            if (iterator.stillUnsubscribed) {
                var destination = this.destination;
                destination.add(iterator.subscribe());
            }
            else {
                this.active--;
            }
        }
    };
    ZipSubscriber.prototype.notifyInactive = function () {
        this.active--;
        if (this.active === 0) {
            this.destination.complete();
        }
    };
    ZipSubscriber.prototype.checkIterators = function () {
        var iterators = this.iterators;
        var len = iterators.length;
        var destination = this.destination;
        for (var i = 0; i < len; i++) {
            var iterator = iterators[i];
            if (typeof iterator.hasValue === 'function' && !iterator.hasValue()) {
                return;
            }
        }
        var shouldComplete = false;
        var args = [];
        for (var i = 0; i < len; i++) {
            var iterator = iterators[i];
            var result = iterator.next();
            if (iterator.hasCompleted()) {
                shouldComplete = true;
            }
            if (result.done) {
                destination.complete();
                return;
            }
            args.push(result.value);
        }
        if (this.resultSelector) {
            this._tryresultSelector(args);
        }
        else {
            destination.next(args);
        }
        if (shouldComplete) {
            destination.complete();
        }
    };
    ZipSubscriber.prototype._tryresultSelector = function (args) {
        var result;
        try {
            result = this.resultSelector.apply(this, args);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return ZipSubscriber;
}(Subscriber_1.Subscriber));
exports.ZipSubscriber = ZipSubscriber;
var StaticIterator = (function () {
    function StaticIterator(iterator) {
        this.iterator = iterator;
        this.nextResult = iterator.next();
    }
    StaticIterator.prototype.hasValue = function () {
        return true;
    };
    StaticIterator.prototype.next = function () {
        var result = this.nextResult;
        this.nextResult = this.iterator.next();
        return result;
    };
    StaticIterator.prototype.hasCompleted = function () {
        var nextResult = this.nextResult;
        return Boolean(nextResult && nextResult.done);
    };
    return StaticIterator;
}());
var StaticArrayIterator = (function () {
    function StaticArrayIterator(array) {
        this.array = array;
        this.index = 0;
        this.length = 0;
        this.length = array.length;
    }
    StaticArrayIterator.prototype[iterator_1.iterator] = function () {
        return this;
    };
    StaticArrayIterator.prototype.next = function (value) {
        var i = this.index++;
        var array = this.array;
        return i < this.length ? { value: array[i], done: false } : { value: null, done: true };
    };
    StaticArrayIterator.prototype.hasValue = function () {
        return this.array.length > this.index;
    };
    StaticArrayIterator.prototype.hasCompleted = function () {
        return this.array.length === this.index;
    };
    return StaticArrayIterator;
}());
var ZipBufferIterator = (function (_super) {
    __extends(ZipBufferIterator, _super);
    function ZipBufferIterator(destination, parent, observable) {
        var _this = _super.call(this, destination) || this;
        _this.parent = parent;
        _this.observable = observable;
        _this.stillUnsubscribed = true;
        _this.buffer = [];
        _this.isComplete = false;
        return _this;
    }
    ZipBufferIterator.prototype[iterator_1.iterator] = function () {
        return this;
    };
    ZipBufferIterator.prototype.next = function () {
        var buffer = this.buffer;
        if (buffer.length === 0 && this.isComplete) {
            return { value: null, done: true };
        }
        else {
            return { value: buffer.shift(), done: false };
        }
    };
    ZipBufferIterator.prototype.hasValue = function () {
        return this.buffer.length > 0;
    };
    ZipBufferIterator.prototype.hasCompleted = function () {
        return this.buffer.length === 0 && this.isComplete;
    };
    ZipBufferIterator.prototype.notifyComplete = function () {
        if (this.buffer.length > 0) {
            this.isComplete = true;
            this.parent.notifyInactive();
        }
        else {
            this.destination.complete();
        }
    };
    ZipBufferIterator.prototype.notifyNext = function (innerValue) {
        this.buffer.push(innerValue);
        this.parent.checkIterators();
    };
    ZipBufferIterator.prototype.subscribe = function () {
        return innerSubscribe_1.innerSubscribe(this.observable, new innerSubscribe_1.SimpleInnerSubscriber(this));
    };
    return ZipBufferIterator;
}(innerSubscribe_1.SimpleOuterSubscriber));

},{"../../internal/symbol/iterator":119,"../Subscriber":61,"../innerSubscribe":64,"../util/isArray":131,"./fromArray":74}],92:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mergeAll_1 = require("./mergeAll");
function concatAll() {
    return mergeAll_1.mergeAll(1);
}
exports.concatAll = concatAll;

},{"./mergeAll":96}],93:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
function filter(predicate, thisArg) {
    return function filterOperatorFunction(source) {
        return source.lift(new FilterOperator(predicate, thisArg));
    };
}
exports.filter = filter;
var FilterOperator = (function () {
    function FilterOperator(predicate, thisArg) {
        this.predicate = predicate;
        this.thisArg = thisArg;
    }
    FilterOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new FilterSubscriber(subscriber, this.predicate, this.thisArg));
    };
    return FilterOperator;
}());
var FilterSubscriber = (function (_super) {
    __extends(FilterSubscriber, _super);
    function FilterSubscriber(destination, predicate, thisArg) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.thisArg = thisArg;
        _this.count = 0;
        return _this;
    }
    FilterSubscriber.prototype._next = function (value) {
        var result;
        try {
            result = this.predicate.call(this.thisArg, value, this.count++);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        if (result) {
            this.destination.next(value);
        }
    };
    return FilterSubscriber;
}(Subscriber_1.Subscriber));

},{"../Subscriber":61}],94:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
var Subscription_1 = require("../Subscription");
var Observable_1 = require("../Observable");
var Subject_1 = require("../Subject");
function groupBy(keySelector, elementSelector, durationSelector, subjectSelector) {
    return function (source) {
        return source.lift(new GroupByOperator(keySelector, elementSelector, durationSelector, subjectSelector));
    };
}
exports.groupBy = groupBy;
var GroupByOperator = (function () {
    function GroupByOperator(keySelector, elementSelector, durationSelector, subjectSelector) {
        this.keySelector = keySelector;
        this.elementSelector = elementSelector;
        this.durationSelector = durationSelector;
        this.subjectSelector = subjectSelector;
    }
    GroupByOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new GroupBySubscriber(subscriber, this.keySelector, this.elementSelector, this.durationSelector, this.subjectSelector));
    };
    return GroupByOperator;
}());
var GroupBySubscriber = (function (_super) {
    __extends(GroupBySubscriber, _super);
    function GroupBySubscriber(destination, keySelector, elementSelector, durationSelector, subjectSelector) {
        var _this = _super.call(this, destination) || this;
        _this.keySelector = keySelector;
        _this.elementSelector = elementSelector;
        _this.durationSelector = durationSelector;
        _this.subjectSelector = subjectSelector;
        _this.groups = null;
        _this.attemptedToUnsubscribe = false;
        _this.count = 0;
        return _this;
    }
    GroupBySubscriber.prototype._next = function (value) {
        var key;
        try {
            key = this.keySelector(value);
        }
        catch (err) {
            this.error(err);
            return;
        }
        this._group(value, key);
    };
    GroupBySubscriber.prototype._group = function (value, key) {
        var groups = this.groups;
        if (!groups) {
            groups = this.groups = new Map();
        }
        var group = groups.get(key);
        var element;
        if (this.elementSelector) {
            try {
                element = this.elementSelector(value);
            }
            catch (err) {
                this.error(err);
            }
        }
        else {
            element = value;
        }
        if (!group) {
            group = (this.subjectSelector ? this.subjectSelector() : new Subject_1.Subject());
            groups.set(key, group);
            var groupedObservable = new GroupedObservable(key, group, this);
            this.destination.next(groupedObservable);
            if (this.durationSelector) {
                var duration = void 0;
                try {
                    duration = this.durationSelector(new GroupedObservable(key, group));
                }
                catch (err) {
                    this.error(err);
                    return;
                }
                this.add(duration.subscribe(new GroupDurationSubscriber(key, group, this)));
            }
        }
        if (!group.closed) {
            group.next(element);
        }
    };
    GroupBySubscriber.prototype._error = function (err) {
        var groups = this.groups;
        if (groups) {
            groups.forEach(function (group, key) {
                group.error(err);
            });
            groups.clear();
        }
        this.destination.error(err);
    };
    GroupBySubscriber.prototype._complete = function () {
        var groups = this.groups;
        if (groups) {
            groups.forEach(function (group, key) {
                group.complete();
            });
            groups.clear();
        }
        this.destination.complete();
    };
    GroupBySubscriber.prototype.removeGroup = function (key) {
        this.groups.delete(key);
    };
    GroupBySubscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.attemptedToUnsubscribe = true;
            if (this.count === 0) {
                _super.prototype.unsubscribe.call(this);
            }
        }
    };
    return GroupBySubscriber;
}(Subscriber_1.Subscriber));
var GroupDurationSubscriber = (function (_super) {
    __extends(GroupDurationSubscriber, _super);
    function GroupDurationSubscriber(key, group, parent) {
        var _this = _super.call(this, group) || this;
        _this.key = key;
        _this.group = group;
        _this.parent = parent;
        return _this;
    }
    GroupDurationSubscriber.prototype._next = function (value) {
        this.complete();
    };
    GroupDurationSubscriber.prototype._unsubscribe = function () {
        var _a = this, parent = _a.parent, key = _a.key;
        this.key = this.parent = null;
        if (parent) {
            parent.removeGroup(key);
        }
    };
    return GroupDurationSubscriber;
}(Subscriber_1.Subscriber));
var GroupedObservable = (function (_super) {
    __extends(GroupedObservable, _super);
    function GroupedObservable(key, groupSubject, refCountSubscription) {
        var _this = _super.call(this) || this;
        _this.key = key;
        _this.groupSubject = groupSubject;
        _this.refCountSubscription = refCountSubscription;
        return _this;
    }
    GroupedObservable.prototype._subscribe = function (subscriber) {
        var subscription = new Subscription_1.Subscription();
        var _a = this, refCountSubscription = _a.refCountSubscription, groupSubject = _a.groupSubject;
        if (refCountSubscription && !refCountSubscription.closed) {
            subscription.add(new InnerRefCountSubscription(refCountSubscription));
        }
        subscription.add(groupSubject.subscribe(subscriber));
        return subscription;
    };
    return GroupedObservable;
}(Observable_1.Observable));
exports.GroupedObservable = GroupedObservable;
var InnerRefCountSubscription = (function (_super) {
    __extends(InnerRefCountSubscription, _super);
    function InnerRefCountSubscription(parent) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        parent.count++;
        return _this;
    }
    InnerRefCountSubscription.prototype.unsubscribe = function () {
        var parent = this.parent;
        if (!parent.closed && !this.closed) {
            _super.prototype.unsubscribe.call(this);
            parent.count -= 1;
            if (parent.count === 0 && parent.attemptedToUnsubscribe) {
                parent.unsubscribe();
            }
        }
    };
    return InnerRefCountSubscription;
}(Subscription_1.Subscription));

},{"../Observable":54,"../Subject":59,"../Subscriber":61,"../Subscription":62}],95:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
function map(project, thisArg) {
    return function mapOperation(source) {
        if (typeof project !== 'function') {
            throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
        }
        return source.lift(new MapOperator(project, thisArg));
    };
}
exports.map = map;
var MapOperator = (function () {
    function MapOperator(project, thisArg) {
        this.project = project;
        this.thisArg = thisArg;
    }
    MapOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
    };
    return MapOperator;
}());
exports.MapOperator = MapOperator;
var MapSubscriber = (function (_super) {
    __extends(MapSubscriber, _super);
    function MapSubscriber(destination, project, thisArg) {
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.count = 0;
        _this.thisArg = thisArg || _this;
        return _this;
    }
    MapSubscriber.prototype._next = function (value) {
        var result;
        try {
            result = this.project.call(this.thisArg, value, this.count++);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return MapSubscriber;
}(Subscriber_1.Subscriber));

},{"../Subscriber":61}],96:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mergeMap_1 = require("./mergeMap");
var identity_1 = require("../util/identity");
function mergeAll(concurrent) {
    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
    return mergeMap_1.mergeMap(identity_1.identity, concurrent);
}
exports.mergeAll = mergeAll;

},{"../util/identity":130,"./mergeMap":97}],97:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var map_1 = require("./map");
var from_1 = require("../observable/from");
var innerSubscribe_1 = require("../innerSubscribe");
function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
    if (typeof resultSelector === 'function') {
        return function (source) { return source.pipe(mergeMap(function (a, i) { return from_1.from(project(a, i)).pipe(map_1.map(function (b, ii) { return resultSelector(a, b, i, ii); })); }, concurrent)); };
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return function (source) { return source.lift(new MergeMapOperator(project, concurrent)); };
}
exports.mergeMap = mergeMap;
var MergeMapOperator = (function () {
    function MergeMapOperator(project, concurrent) {
        if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
        this.project = project;
        this.concurrent = concurrent;
    }
    MergeMapOperator.prototype.call = function (observer, source) {
        return source.subscribe(new MergeMapSubscriber(observer, this.project, this.concurrent));
    };
    return MergeMapOperator;
}());
exports.MergeMapOperator = MergeMapOperator;
var MergeMapSubscriber = (function (_super) {
    __extends(MergeMapSubscriber, _super);
    function MergeMapSubscriber(destination, project, concurrent) {
        if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.concurrent = concurrent;
        _this.hasCompleted = false;
        _this.buffer = [];
        _this.active = 0;
        _this.index = 0;
        return _this;
    }
    MergeMapSubscriber.prototype._next = function (value) {
        if (this.active < this.concurrent) {
            this._tryNext(value);
        }
        else {
            this.buffer.push(value);
        }
    };
    MergeMapSubscriber.prototype._tryNext = function (value) {
        var result;
        var index = this.index++;
        try {
            result = this.project(value, index);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.active++;
        this._innerSub(result);
    };
    MergeMapSubscriber.prototype._innerSub = function (ish) {
        var innerSubscriber = new innerSubscribe_1.SimpleInnerSubscriber(this);
        var destination = this.destination;
        destination.add(innerSubscriber);
        var innerSubscription = innerSubscribe_1.innerSubscribe(ish, innerSubscriber);
        if (innerSubscription !== innerSubscriber) {
            destination.add(innerSubscription);
        }
    };
    MergeMapSubscriber.prototype._complete = function () {
        this.hasCompleted = true;
        if (this.active === 0 && this.buffer.length === 0) {
            this.destination.complete();
        }
        this.unsubscribe();
    };
    MergeMapSubscriber.prototype.notifyNext = function (innerValue) {
        this.destination.next(innerValue);
    };
    MergeMapSubscriber.prototype.notifyComplete = function () {
        var buffer = this.buffer;
        this.active--;
        if (buffer.length > 0) {
            this._next(buffer.shift());
        }
        else if (this.active === 0 && this.hasCompleted) {
            this.destination.complete();
        }
    };
    return MergeMapSubscriber;
}(innerSubscribe_1.SimpleOuterSubscriber));
exports.MergeMapSubscriber = MergeMapSubscriber;
exports.flatMap = mergeMap;

},{"../innerSubscribe":64,"../observable/from":73,"./map":95}],98:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
var Notification_1 = require("../Notification");
function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return function observeOnOperatorFunction(source) {
        return source.lift(new ObserveOnOperator(scheduler, delay));
    };
}
exports.observeOn = observeOn;
var ObserveOnOperator = (function () {
    function ObserveOnOperator(scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        this.scheduler = scheduler;
        this.delay = delay;
    }
    ObserveOnOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, this.delay));
    };
    return ObserveOnOperator;
}());
exports.ObserveOnOperator = ObserveOnOperator;
var ObserveOnSubscriber = (function (_super) {
    __extends(ObserveOnSubscriber, _super);
    function ObserveOnSubscriber(destination, scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        var _this = _super.call(this, destination) || this;
        _this.scheduler = scheduler;
        _this.delay = delay;
        return _this;
    }
    ObserveOnSubscriber.dispatch = function (arg) {
        var notification = arg.notification, destination = arg.destination;
        notification.observe(destination);
        this.unsubscribe();
    };
    ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
        var destination = this.destination;
        destination.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
    };
    ObserveOnSubscriber.prototype._next = function (value) {
        this.scheduleMessage(Notification_1.Notification.createNext(value));
    };
    ObserveOnSubscriber.prototype._error = function (err) {
        this.scheduleMessage(Notification_1.Notification.createError(err));
        this.unsubscribe();
    };
    ObserveOnSubscriber.prototype._complete = function () {
        this.scheduleMessage(Notification_1.Notification.createComplete());
        this.unsubscribe();
    };
    return ObserveOnSubscriber;
}(Subscriber_1.Subscriber));
exports.ObserveOnSubscriber = ObserveOnSubscriber;
var ObserveOnMessage = (function () {
    function ObserveOnMessage(notification, destination) {
        this.notification = notification;
        this.destination = destination;
    }
    return ObserveOnMessage;
}());
exports.ObserveOnMessage = ObserveOnMessage;

},{"../Notification":53,"../Subscriber":61}],99:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
function refCount() {
    return function refCountOperatorFunction(source) {
        return source.lift(new RefCountOperator(source));
    };
}
exports.refCount = refCount;
var RefCountOperator = (function () {
    function RefCountOperator(connectable) {
        this.connectable = connectable;
    }
    RefCountOperator.prototype.call = function (subscriber, source) {
        var connectable = this.connectable;
        connectable._refCount++;
        var refCounter = new RefCountSubscriber(subscriber, connectable);
        var subscription = source.subscribe(refCounter);
        if (!refCounter.closed) {
            refCounter.connection = connectable.connect();
        }
        return subscription;
    };
    return RefCountOperator;
}());
var RefCountSubscriber = (function (_super) {
    __extends(RefCountSubscriber, _super);
    function RefCountSubscriber(destination, connectable) {
        var _this = _super.call(this, destination) || this;
        _this.connectable = connectable;
        return _this;
    }
    RefCountSubscriber.prototype._unsubscribe = function () {
        var connectable = this.connectable;
        if (!connectable) {
            this.connection = null;
            return;
        }
        this.connectable = null;
        var refCount = connectable._refCount;
        if (refCount <= 0) {
            this.connection = null;
            return;
        }
        connectable._refCount = refCount - 1;
        if (refCount > 1) {
            this.connection = null;
            return;
        }
        var connection = this.connection;
        var sharedConnection = connectable._connection;
        this.connection = null;
        if (sharedConnection && (!connection || sharedConnection === connection)) {
            sharedConnection.unsubscribe();
        }
    };
    return RefCountSubscriber;
}(Subscriber_1.Subscriber));

},{"../Subscriber":61}],100:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
function scheduleArray(input, scheduler) {
    return new Observable_1.Observable(function (subscriber) {
        var sub = new Subscription_1.Subscription();
        var i = 0;
        sub.add(scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
                return;
            }
            subscriber.next(input[i++]);
            if (!subscriber.closed) {
                sub.add(this.schedule());
            }
        }));
        return sub;
    });
}
exports.scheduleArray = scheduleArray;

},{"../Observable":54,"../Subscription":62}],101:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
var iterator_1 = require("../symbol/iterator");
function scheduleIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable_1.Observable(function (subscriber) {
        var sub = new Subscription_1.Subscription();
        var iterator;
        sub.add(function () {
            if (iterator && typeof iterator.return === 'function') {
                iterator.return();
            }
        });
        sub.add(scheduler.schedule(function () {
            iterator = input[iterator_1.iterator]();
            sub.add(scheduler.schedule(function () {
                if (subscriber.closed) {
                    return;
                }
                var value;
                var done;
                try {
                    var result = iterator.next();
                    value = result.value;
                    done = result.done;
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                    this.schedule();
                }
            }));
        }));
        return sub;
    });
}
exports.scheduleIterable = scheduleIterable;

},{"../Observable":54,"../Subscription":62,"../symbol/iterator":119}],102:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
var observable_1 = require("../symbol/observable");
function scheduleObservable(input, scheduler) {
    return new Observable_1.Observable(function (subscriber) {
        var sub = new Subscription_1.Subscription();
        sub.add(scheduler.schedule(function () {
            var observable = input[observable_1.observable]();
            sub.add(observable.subscribe({
                next: function (value) { sub.add(scheduler.schedule(function () { return subscriber.next(value); })); },
                error: function (err) { sub.add(scheduler.schedule(function () { return subscriber.error(err); })); },
                complete: function () { sub.add(scheduler.schedule(function () { return subscriber.complete(); })); },
            }));
        }));
        return sub;
    });
}
exports.scheduleObservable = scheduleObservable;

},{"../Observable":54,"../Subscription":62,"../symbol/observable":120}],103:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
function schedulePromise(input, scheduler) {
    return new Observable_1.Observable(function (subscriber) {
        var sub = new Subscription_1.Subscription();
        sub.add(scheduler.schedule(function () { return input.then(function (value) {
            sub.add(scheduler.schedule(function () {
                subscriber.next(value);
                sub.add(scheduler.schedule(function () { return subscriber.complete(); }));
            }));
        }, function (err) {
            sub.add(scheduler.schedule(function () { return subscriber.error(err); }));
        }); }));
        return sub;
    });
}
exports.schedulePromise = schedulePromise;

},{"../Observable":54,"../Subscription":62}],104:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scheduleObservable_1 = require("./scheduleObservable");
var schedulePromise_1 = require("./schedulePromise");
var scheduleArray_1 = require("./scheduleArray");
var scheduleIterable_1 = require("./scheduleIterable");
var isInteropObservable_1 = require("../util/isInteropObservable");
var isPromise_1 = require("../util/isPromise");
var isArrayLike_1 = require("../util/isArrayLike");
var isIterable_1 = require("../util/isIterable");
function scheduled(input, scheduler) {
    if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
            return scheduleObservable_1.scheduleObservable(input, scheduler);
        }
        else if (isPromise_1.isPromise(input)) {
            return schedulePromise_1.schedulePromise(input, scheduler);
        }
        else if (isArrayLike_1.isArrayLike(input)) {
            return scheduleArray_1.scheduleArray(input, scheduler);
        }
        else if (isIterable_1.isIterable(input) || typeof input === 'string') {
            return scheduleIterable_1.scheduleIterable(input, scheduler);
        }
    }
    throw new TypeError((input !== null && typeof input || input) + ' is not observable');
}
exports.scheduled = scheduled;

},{"../util/isArrayLike":132,"../util/isInteropObservable":134,"../util/isIterable":135,"../util/isPromise":139,"./scheduleArray":100,"./scheduleIterable":101,"./scheduleObservable":102,"./schedulePromise":103}],105:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscription_1 = require("../Subscription");
var Action = (function (_super) {
    __extends(Action, _super);
    function Action(scheduler, work) {
        return _super.call(this) || this;
    }
    Action.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        return this;
    };
    return Action;
}(Subscription_1.Subscription));
exports.Action = Action;

},{"../Subscription":62}],106:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncAction_1 = require("./AsyncAction");
var AnimationFrameAction = (function (_super) {
    __extends(AnimationFrameAction, _super);
    function AnimationFrameAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = requestAnimationFrame(function () { return scheduler.flush(null); }));
    };
    AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            cancelAnimationFrame(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    };
    return AnimationFrameAction;
}(AsyncAction_1.AsyncAction));
exports.AnimationFrameAction = AnimationFrameAction;

},{"./AsyncAction":110}],107:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncScheduler_1 = require("./AsyncScheduler");
var AnimationFrameScheduler = (function (_super) {
    __extends(AnimationFrameScheduler, _super);
    function AnimationFrameScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnimationFrameScheduler.prototype.flush = function (action) {
        this.active = true;
        this.scheduled = undefined;
        var actions = this.actions;
        var error;
        var index = -1;
        var count = actions.length;
        action = action || actions.shift();
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (++index < count && (action = actions.shift()));
        this.active = false;
        if (error) {
            while (++index < count && (action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AnimationFrameScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.AnimationFrameScheduler = AnimationFrameScheduler;

},{"./AsyncScheduler":111}],108:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Immediate_1 = require("../util/Immediate");
var AsyncAction_1 = require("./AsyncAction");
var AsapAction = (function (_super) {
    __extends(AsapAction, _super);
    function AsapAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = Immediate_1.Immediate.setImmediate(scheduler.flush.bind(scheduler, null)));
    };
    AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            Immediate_1.Immediate.clearImmediate(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    };
    return AsapAction;
}(AsyncAction_1.AsyncAction));
exports.AsapAction = AsapAction;

},{"../util/Immediate":124,"./AsyncAction":110}],109:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncScheduler_1 = require("./AsyncScheduler");
var AsapScheduler = (function (_super) {
    __extends(AsapScheduler, _super);
    function AsapScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsapScheduler.prototype.flush = function (action) {
        this.active = true;
        this.scheduled = undefined;
        var actions = this.actions;
        var error;
        var index = -1;
        var count = actions.length;
        action = action || actions.shift();
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (++index < count && (action = actions.shift()));
        this.active = false;
        if (error) {
            while (++index < count && (action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsapScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.AsapScheduler = AsapScheduler;

},{"./AsyncScheduler":111}],110:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Action_1 = require("./Action");
var AsyncAction = (function (_super) {
    __extends(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (this.closed) {
            return this;
        }
        this.state = state;
        var id = this.id;
        var scheduler = this.scheduler;
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.pending = true;
        this.delay = delay;
        this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
        return this;
    };
    AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        return setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && this.delay === delay && this.pending === false) {
            return id;
        }
        clearInterval(id);
        return undefined;
    };
    AsyncAction.prototype.execute = function (state, delay) {
        if (this.closed) {
            return new Error('executing a cancelled action');
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
            return error;
        }
        else if (this.pending === false && this.id != null) {
            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
    };
    AsyncAction.prototype._execute = function (state, delay) {
        var errored = false;
        var errorValue = undefined;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = !!e && e || new Error(e);
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype._unsubscribe = function () {
        var id = this.id;
        var scheduler = this.scheduler;
        var actions = scheduler.actions;
        var index = actions.indexOf(this);
        this.work = null;
        this.state = null;
        this.pending = false;
        this.scheduler = null;
        if (index !== -1) {
            actions.splice(index, 1);
        }
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, null);
        }
        this.delay = null;
    };
    return AsyncAction;
}(Action_1.Action));
exports.AsyncAction = AsyncAction;

},{"./Action":105}],111:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Scheduler_1 = require("../Scheduler");
var AsyncScheduler = (function (_super) {
    __extends(AsyncScheduler, _super);
    function AsyncScheduler(SchedulerAction, now) {
        if (now === void 0) { now = Scheduler_1.Scheduler.now; }
        var _this = _super.call(this, SchedulerAction, function () {
            if (AsyncScheduler.delegate && AsyncScheduler.delegate !== _this) {
                return AsyncScheduler.delegate.now();
            }
            else {
                return now();
            }
        }) || this;
        _this.actions = [];
        _this.active = false;
        _this.scheduled = undefined;
        return _this;
    }
    AsyncScheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        if (AsyncScheduler.delegate && AsyncScheduler.delegate !== this) {
            return AsyncScheduler.delegate.schedule(work, delay, state);
        }
        else {
            return _super.prototype.schedule.call(this, work, delay, state);
        }
    };
    AsyncScheduler.prototype.flush = function (action) {
        var actions = this.actions;
        if (this.active) {
            actions.push(action);
            return;
        }
        var error;
        this.active = true;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (action = actions.shift());
        this.active = false;
        if (error) {
            while (action = actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsyncScheduler;
}(Scheduler_1.Scheduler));
exports.AsyncScheduler = AsyncScheduler;

},{"../Scheduler":58}],112:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncAction_1 = require("./AsyncAction");
var QueueAction = (function (_super) {
    __extends(QueueAction, _super);
    function QueueAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    QueueAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay > 0) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
    };
    QueueAction.prototype.execute = function (state, delay) {
        return (delay > 0 || this.closed) ?
            _super.prototype.execute.call(this, state, delay) :
            this._execute(state, delay);
    };
    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        return scheduler.flush(this);
    };
    return QueueAction;
}(AsyncAction_1.AsyncAction));
exports.QueueAction = QueueAction;

},{"./AsyncAction":110}],113:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncScheduler_1 = require("./AsyncScheduler");
var QueueScheduler = (function (_super) {
    __extends(QueueScheduler, _super);
    function QueueScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueueScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.QueueScheduler = QueueScheduler;

},{"./AsyncScheduler":111}],114:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncAction_1 = require("./AsyncAction");
var AsyncScheduler_1 = require("./AsyncScheduler");
var VirtualTimeScheduler = (function (_super) {
    __extends(VirtualTimeScheduler, _super);
    function VirtualTimeScheduler(SchedulerAction, maxFrames) {
        if (SchedulerAction === void 0) { SchedulerAction = VirtualAction; }
        if (maxFrames === void 0) { maxFrames = Number.POSITIVE_INFINITY; }
        var _this = _super.call(this, SchedulerAction, function () { return _this.frame; }) || this;
        _this.maxFrames = maxFrames;
        _this.frame = 0;
        _this.index = -1;
        return _this;
    }
    VirtualTimeScheduler.prototype.flush = function () {
        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
        var error, action;
        while ((action = actions[0]) && action.delay <= maxFrames) {
            actions.shift();
            this.frame = action.delay;
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        }
        if (error) {
            while (action = actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    VirtualTimeScheduler.frameTimeFactor = 10;
    return VirtualTimeScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.VirtualTimeScheduler = VirtualTimeScheduler;
var VirtualAction = (function (_super) {
    __extends(VirtualAction, _super);
    function VirtualAction(scheduler, work, index) {
        if (index === void 0) { index = scheduler.index += 1; }
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.index = index;
        _this.active = true;
        _this.index = scheduler.index = index;
        return _this;
    }
    VirtualAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (!this.id) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.active = false;
        var action = new VirtualAction(this.scheduler, this.work);
        this.add(action);
        return action.schedule(state, delay);
    };
    VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        this.delay = scheduler.frame + delay;
        var actions = scheduler.actions;
        actions.push(this);
        actions.sort(VirtualAction.sortActions);
        return true;
    };
    VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        return undefined;
    };
    VirtualAction.prototype._execute = function (state, delay) {
        if (this.active === true) {
            return _super.prototype._execute.call(this, state, delay);
        }
    };
    VirtualAction.sortActions = function (a, b) {
        if (a.delay === b.delay) {
            if (a.index === b.index) {
                return 0;
            }
            else if (a.index > b.index) {
                return 1;
            }
            else {
                return -1;
            }
        }
        else if (a.delay > b.delay) {
            return 1;
        }
        else {
            return -1;
        }
    };
    return VirtualAction;
}(AsyncAction_1.AsyncAction));
exports.VirtualAction = VirtualAction;

},{"./AsyncAction":110,"./AsyncScheduler":111}],115:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AnimationFrameAction_1 = require("./AnimationFrameAction");
var AnimationFrameScheduler_1 = require("./AnimationFrameScheduler");
exports.animationFrameScheduler = new AnimationFrameScheduler_1.AnimationFrameScheduler(AnimationFrameAction_1.AnimationFrameAction);
exports.animationFrame = exports.animationFrameScheduler;

},{"./AnimationFrameAction":106,"./AnimationFrameScheduler":107}],116:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AsapAction_1 = require("./AsapAction");
var AsapScheduler_1 = require("./AsapScheduler");
exports.asapScheduler = new AsapScheduler_1.AsapScheduler(AsapAction_1.AsapAction);
exports.asap = exports.asapScheduler;

},{"./AsapAction":108,"./AsapScheduler":109}],117:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncAction_1 = require("./AsyncAction");
var AsyncScheduler_1 = require("./AsyncScheduler");
exports.asyncScheduler = new AsyncScheduler_1.AsyncScheduler(AsyncAction_1.AsyncAction);
exports.async = exports.asyncScheduler;

},{"./AsyncAction":110,"./AsyncScheduler":111}],118:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var QueueAction_1 = require("./QueueAction");
var QueueScheduler_1 = require("./QueueScheduler");
exports.queueScheduler = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);
exports.queue = exports.queueScheduler;

},{"./QueueAction":112,"./QueueScheduler":113}],119:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
exports.getSymbolIterator = getSymbolIterator;
exports.iterator = getSymbolIterator();
exports.$$iterator = exports.iterator;

},{}],120:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observable = (function () { return typeof Symbol === 'function' && Symbol.observable || '@@observable'; })();

},{}],121:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rxSubscriber = (function () {
    return typeof Symbol === 'function'
        ? Symbol('rxSubscriber')
        : '@@rxSubscriber_' + Math.random();
})();
exports.$$rxSubscriber = exports.rxSubscriber;

},{}],122:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ArgumentOutOfRangeErrorImpl = (function () {
    function ArgumentOutOfRangeErrorImpl() {
        Error.call(this);
        this.message = 'argument out of range';
        this.name = 'ArgumentOutOfRangeError';
        return this;
    }
    ArgumentOutOfRangeErrorImpl.prototype = Object.create(Error.prototype);
    return ArgumentOutOfRangeErrorImpl;
})();
exports.ArgumentOutOfRangeError = ArgumentOutOfRangeErrorImpl;

},{}],123:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EmptyErrorImpl = (function () {
    function EmptyErrorImpl() {
        Error.call(this);
        this.message = 'no elements in sequence';
        this.name = 'EmptyError';
        return this;
    }
    EmptyErrorImpl.prototype = Object.create(Error.prototype);
    return EmptyErrorImpl;
})();
exports.EmptyError = EmptyErrorImpl;

},{}],124:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nextHandle = 1;
var RESOLVED = (function () { return Promise.resolve(); })();
var activeHandles = {};
function findAndClearHandle(handle) {
    if (handle in activeHandles) {
        delete activeHandles[handle];
        return true;
    }
    return false;
}
exports.Immediate = {
    setImmediate: function (cb) {
        var handle = nextHandle++;
        activeHandles[handle] = true;
        RESOLVED.then(function () { return findAndClearHandle(handle) && cb(); });
        return handle;
    },
    clearImmediate: function (handle) {
        findAndClearHandle(handle);
    },
};
exports.TestTools = {
    pending: function () {
        return Object.keys(activeHandles).length;
    }
};

},{}],125:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ObjectUnsubscribedErrorImpl = (function () {
    function ObjectUnsubscribedErrorImpl() {
        Error.call(this);
        this.message = 'object unsubscribed';
        this.name = 'ObjectUnsubscribedError';
        return this;
    }
    ObjectUnsubscribedErrorImpl.prototype = Object.create(Error.prototype);
    return ObjectUnsubscribedErrorImpl;
})();
exports.ObjectUnsubscribedError = ObjectUnsubscribedErrorImpl;

},{}],126:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TimeoutErrorImpl = (function () {
    function TimeoutErrorImpl() {
        Error.call(this);
        this.message = 'Timeout has occurred';
        this.name = 'TimeoutError';
        return this;
    }
    TimeoutErrorImpl.prototype = Object.create(Error.prototype);
    return TimeoutErrorImpl;
})();
exports.TimeoutError = TimeoutErrorImpl;

},{}],127:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UnsubscriptionErrorImpl = (function () {
    function UnsubscriptionErrorImpl(errors) {
        Error.call(this);
        this.message = errors ?
            errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ') : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
        return this;
    }
    UnsubscriptionErrorImpl.prototype = Object.create(Error.prototype);
    return UnsubscriptionErrorImpl;
})();
exports.UnsubscriptionError = UnsubscriptionErrorImpl;

},{}],128:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
function canReportError(observer) {
    while (observer) {
        var _a = observer, closed_1 = _a.closed, destination = _a.destination, isStopped = _a.isStopped;
        if (closed_1 || isStopped) {
            return false;
        }
        else if (destination && destination instanceof Subscriber_1.Subscriber) {
            observer = destination;
        }
        else {
            observer = null;
        }
    }
    return true;
}
exports.canReportError = canReportError;

},{"../Subscriber":61}],129:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hostReportError(err) {
    setTimeout(function () { throw err; }, 0);
}
exports.hostReportError = hostReportError;

},{}],130:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function identity(x) {
    return x;
}
exports.identity = identity;

},{}],131:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = (function () { return Array.isArray || (function (x) { return x && typeof x.length === 'number'; }); })();

},{}],132:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });

},{}],133:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(x) {
    return typeof x === 'function';
}
exports.isFunction = isFunction;

},{}],134:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("../symbol/observable");
function isInteropObservable(input) {
    return input && typeof input[observable_1.observable] === 'function';
}
exports.isInteropObservable = isInteropObservable;

},{"../symbol/observable":120}],135:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var iterator_1 = require("../symbol/iterator");
function isIterable(input) {
    return input && typeof input[iterator_1.iterator] === 'function';
}
exports.isIterable = isIterable;

},{"../symbol/iterator":119}],136:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isArray_1 = require("./isArray");
function isNumeric(val) {
    return !isArray_1.isArray(val) && (val - parseFloat(val) + 1) >= 0;
}
exports.isNumeric = isNumeric;

},{"./isArray":131}],137:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(x) {
    return x !== null && typeof x === 'object';
}
exports.isObject = isObject;

},{}],138:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("../Observable");
function isObservable(obj) {
    return !!obj && (obj instanceof Observable_1.Observable || (typeof obj.lift === 'function' && typeof obj.subscribe === 'function'));
}
exports.isObservable = isObservable;

},{"../Observable":54}],139:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isPromise(value) {
    return !!value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
}
exports.isPromise = isPromise;

},{}],140:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isScheduler(value) {
    return value && typeof value.schedule === 'function';
}
exports.isScheduler = isScheduler;

},{}],141:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function noop() { }
exports.noop = noop;

},{}],142:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function not(pred, thisArg) {
    function notPred() {
        return !(notPred.pred.apply(notPred.thisArg, arguments));
    }
    notPred.pred = pred;
    notPred.thisArg = thisArg;
    return notPred;
}
exports.not = not;

},{}],143:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var identity_1 = require("./identity");
function pipe() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return pipeFromArray(fns);
}
exports.pipe = pipe;
function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity_1.identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}
exports.pipeFromArray = pipeFromArray;

},{"./identity":130}],144:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var subscribeToArray_1 = require("./subscribeToArray");
var subscribeToPromise_1 = require("./subscribeToPromise");
var subscribeToIterable_1 = require("./subscribeToIterable");
var subscribeToObservable_1 = require("./subscribeToObservable");
var isArrayLike_1 = require("./isArrayLike");
var isPromise_1 = require("./isPromise");
var isObject_1 = require("./isObject");
var iterator_1 = require("../symbol/iterator");
var observable_1 = require("../symbol/observable");
exports.subscribeTo = function (result) {
    if (!!result && typeof result[observable_1.observable] === 'function') {
        return subscribeToObservable_1.subscribeToObservable(result);
    }
    else if (isArrayLike_1.isArrayLike(result)) {
        return subscribeToArray_1.subscribeToArray(result);
    }
    else if (isPromise_1.isPromise(result)) {
        return subscribeToPromise_1.subscribeToPromise(result);
    }
    else if (!!result && typeof result[iterator_1.iterator] === 'function') {
        return subscribeToIterable_1.subscribeToIterable(result);
    }
    else {
        var value = isObject_1.isObject(result) ? 'an invalid object' : "'" + result + "'";
        var msg = "You provided " + value + " where a stream was expected."
            + ' You can provide an Observable, Promise, Array, or Iterable.';
        throw new TypeError(msg);
    }
};

},{"../symbol/iterator":119,"../symbol/observable":120,"./isArrayLike":132,"./isObject":137,"./isPromise":139,"./subscribeToArray":145,"./subscribeToIterable":146,"./subscribeToObservable":147,"./subscribeToPromise":148}],145:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToArray = function (array) { return function (subscriber) {
    for (var i = 0, len = array.length; i < len && !subscriber.closed; i++) {
        subscriber.next(array[i]);
    }
    subscriber.complete();
}; };

},{}],146:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var iterator_1 = require("../symbol/iterator");
exports.subscribeToIterable = function (iterable) { return function (subscriber) {
    var iterator = iterable[iterator_1.iterator]();
    do {
        var item = void 0;
        try {
            item = iterator.next();
        }
        catch (err) {
            subscriber.error(err);
            return subscriber;
        }
        if (item.done) {
            subscriber.complete();
            break;
        }
        subscriber.next(item.value);
        if (subscriber.closed) {
            break;
        }
    } while (true);
    if (typeof iterator.return === 'function') {
        subscriber.add(function () {
            if (iterator.return) {
                iterator.return();
            }
        });
    }
    return subscriber;
}; };

},{"../symbol/iterator":119}],147:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("../symbol/observable");
exports.subscribeToObservable = function (obj) { return function (subscriber) {
    var obs = obj[observable_1.observable]();
    if (typeof obs.subscribe !== 'function') {
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    }
    else {
        return obs.subscribe(subscriber);
    }
}; };

},{"../symbol/observable":120}],148:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hostReportError_1 = require("./hostReportError");
exports.subscribeToPromise = function (promise) { return function (subscriber) {
    promise.then(function (value) {
        if (!subscriber.closed) {
            subscriber.next(value);
            subscriber.complete();
        }
    }, function (err) { return subscriber.error(err); })
        .then(null, hostReportError_1.hostReportError);
    return subscriber;
}; };

},{"./hostReportError":129}],149:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var InnerSubscriber_1 = require("../InnerSubscriber");
var subscribeTo_1 = require("./subscribeTo");
var Observable_1 = require("../Observable");
function subscribeToResult(outerSubscriber, result, outerValue, outerIndex, innerSubscriber) {
    if (innerSubscriber === void 0) { innerSubscriber = new InnerSubscriber_1.InnerSubscriber(outerSubscriber, outerValue, outerIndex); }
    if (innerSubscriber.closed) {
        return undefined;
    }
    if (result instanceof Observable_1.Observable) {
        return result.subscribe(innerSubscriber);
    }
    return subscribeTo_1.subscribeTo(result)(innerSubscriber);
}
exports.subscribeToResult = subscribeToResult;

},{"../InnerSubscriber":52,"../Observable":54,"./subscribeTo":144}],150:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Subscriber_1 = require("../Subscriber");
var rxSubscriber_1 = require("../symbol/rxSubscriber");
var Observer_1 = require("../Observer");
function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver) {
        if (nextOrObserver instanceof Subscriber_1.Subscriber) {
            return nextOrObserver;
        }
        if (nextOrObserver[rxSubscriber_1.rxSubscriber]) {
            return nextOrObserver[rxSubscriber_1.rxSubscriber]();
        }
    }
    if (!nextOrObserver && !error && !complete) {
        return new Subscriber_1.Subscriber(Observer_1.empty);
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
}
exports.toSubscriber = toSubscriber;

},{"../Observer":55,"../Subscriber":61,"../symbol/rxSubscriber":121}],151:[function(require,module,exports){
/**
   ________________________________________________________________________________
   
      ___          ______                
     / _ \         | ___ \               
    / /_\ \ ___ ___| |_/ / __ _ ___  ___ 
    |  _  |/ __/ _ \ ___ \/ _` / __|/ _ \
    | | | | (_|  __/ |_/ / (_| \__ \  __/
    \_| |_/\___\___\____/ \__,_|___/\___|
                                     
   Copyright 2018-2020 Ewout Stortenbeker (me@appy.one)   
   Published under MIT license
   ________________________________________________________________________________
  
 */
const { EventEmitter } = require('events');
const { DataReference, DataReferenceQuery } = require('./data-reference');
const { TypeMappings } = require('./type-mappings');

class AceBaseSettings {
    constructor(options) {
        // if (typeof options.api !== 'object') {
        //     throw new Error(`No api passed to AceBaseSettings constructor`);
        // }
        this.logLevel = options.logLevel || "log";
        this.logPrefixing = typeof options.logPrefixing === 'boolean' ? options.logPrefixing : true;
        this.logColors = typeof options.logColors === 'boolean' ? options.logColors : true;
    }
}

class AceBaseBase extends EventEmitter {

    /**
     * 
     * @param {string} dbname | Name of the database to open or create
     * @param {AceBaseSettings} options | 
     */
    constructor(dbname, options) {
        super();

        if (!options) { options = {}; }

        this.setMaxListeners(50); // Prevent warning for >10 "ready" event listeners, increase to 50
        this.once("ready", () => {
            // console.log(`database "${dbname}" (${this.constructor.name}) is ready to use`);
            this._ready = true;
        });

        // Specific api given such as web api, or browser api etc
        // this.api = new options.api.class(dbname, options.api.settings, ready => {
        //     this.emit("ready");
        // });

        this.types = new TypeMappings(this);
    }

    /**
     * 
     * @param {()=>void} [callback] (optional) callback function that is called when ready. You can also use the returned promise
     * @returns {Promise<void>} returns a promise that resolves when ready
     */
    ready(callback = undefined) {
        if (this._ready === true) { 
            // ready event was emitted before
            callback && callback();
            return Promise.resolve();
        }
        else {
            // Wait for ready event
            let resolve;
            const promise = new Promise(res => resolve = res);
            this.on("ready", () => {
                resolve();
                callback && callback(); 
            });
            return promise;
        }
    }

    get isReady() {
        return this._ready === true;
    }

    /**
     * Creates a reference to a node
     * @param {string} path 
     * @returns {DataReference} reference to the requested node
     */
    ref(path) {
        return new DataReference(this, path);
    }

    /**
     * Get a reference to the root database node
     * @returns {DataReference} reference to root node
     */
    get root() {
        return this.ref("");
    }

    /**
     * Creates a query on the requested node
     * @param {string} path 
     * @returns {DataReferenceQuery} query for the requested node
     */
    query(path) {
        const ref = new DataReference(this, path);
        return new DataReferenceQuery(ref);
    }

    get indexes() {
        return {
            /**
             * Gets all indexes
             */
            get: () => {
                return this.api.getIndexes();
            },
            /**
             * Creates an index on "key" for all child nodes at "path". If the index already exists, nothing happens.
             * Example: creating an index on all "name" keys of child objects of path "system/users", 
             * will index "system/users/user1/name", "system/users/user2/name" etc.
             * You can also use wildcard paths to enable indexing and quering of fragmented data.
             * Example: path "users/*\/posts", key "title": will index all "title" keys in all posts of all users.
             * @param {string} path path to the container node
             * @param {string} key name of the key to index every container child node
             * @param {object} [options] any additional options
             * @param {string} [options.type] special index type, such as 'fulltext', or 'geo'
             * @param {string[]} [options.include] keys to include in the index. Speeds up sorting on these columns when the index is used (and dramatically increases query speed when .take(n) is used in addition)
             * @param {object} [options.config] additional index-specific configuration settings 
             */
            create: (path, key, options) => {
                return this.api.createIndex(path, key, options);
            }
        };
    }

}

module.exports = { AceBaseBase, AceBaseSettings };
},{"./data-reference":155,"./type-mappings":165,"events":172}],152:[function(require,module,exports){

class Api {
    // interface for local and web api's
    stats(options = undefined) {}

    /**
     * 
     * @param {string} path | reference
     * @param {string} event | event to subscribe to ("value", "child_added" etc)
     * @param {function} callback | callback function(err, path, value)
     */
    subscribe(path, event, callback) {}

    // TODO: add jsdoc comments

    unsubscribe(path, event, callback) {}
    update(path, updates) {}
    set(path, value) {}
    get(path, options) {}
    exists(path) {}
    query(path, query, options) {}
    createIndex(path, key) {}
    getIndexes() {}
}

module.exports = { Api };
},{}],153:[function(require,module,exports){
const c = function(input, length, result) {
    var i, j, n, b = [0, 0, 0, 0, 0];
    for(i = 0; i < length; i += 4){
        n = ((input[i] * 256 + input[i+1]) * 256 + input[i+2]) * 256 + input[i+3];
        if(!n){
            result.push("z");
        }else{
            for(j = 0; j < 5; b[j++] = n % 85 + 33, n = Math.floor(n / 85));
        }
        result.push(String.fromCharCode(b[4], b[3], b[2], b[1], b[0]));
    }
}

const ascii85 = {
    encode: function(arr) {
        // summary: encodes input data in ascii85 string
        // input: ArrayLike
        if (arr instanceof ArrayBuffer) {
            arr = new Uint8Array(arr, 0, arr.byteLength);
        }
        var input = arr;
        var result = [], remainder = input.length % 4, length = input.length - remainder;
        c(input, length, result);
        if(remainder){
            var t = new Uint8Array(4);
            t.set(input.slice(length), 0);
            c(t, 4, result);
            var x = result.pop();
            if(x == "z"){ x = "!!!!!"; }
            result.push(x.substr(0, remainder + 1));
        }
        var ret = result.join("");	// String
        ret = '<~' + ret + '~>';
        return ret;
    },
    decode: function(input) {
        // summary: decodes the input string back to an ArrayBuffer
        // input: String: the input string to decode
        if (!input.startsWith('<~') || !input.endsWith('~>')) {
            throw new Error('Invalid input string');
        }
        input = input.substr(2, input.length-4);
        var n = input.length, r = [], b = [0, 0, 0, 0, 0], i, j, t, x, y, d;
        for(i = 0; i < n; ++i) {
            if(input.charAt(i) == "z"){
                r.push(0, 0, 0, 0);
                continue;
            }
            for(j = 0; j < 5; ++j){ b[j] = input.charCodeAt(i + j) - 33; }
            d = n - i;
            if(d < 5){
                for(j = d; j < 4; b[++j] = 0);
                b[d] = 85;
            }
            t = (((b[0] * 85 + b[1]) * 85 + b[2]) * 85 + b[3]) * 85 + b[4];
            x = t & 255;
            t >>>= 8;
            y = t & 255;
            t >>>= 8;
            r.push(t >>> 8, t & 255, y, x);
            for(j = d; j < 5; ++j, r.pop());
            i += 4;
        }
        const data = new Uint8Array(r);
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
};

module.exports = ascii85;
},{}],154:[function(require,module,exports){
(function (process){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyAccess = exports.LiveDataProxy = void 0;
const utils_1 = require("./utils");
const path_info_1 = require("./path-info");
const path_reference_1 = require("./path-reference");
const isProxy = Symbol('isProxy');
class LiveDataProxy {
    /**
     * Creates a live data proxy for the given reference. The data of the reference's path will be loaded, and kept in-sync
     * with live data by listening for 'mutated' events. Any changes made to the value by the client will be synced back
     * to the database.
     * @param ref DataReference to create proxy for.
     * @param defaultValue Default value to use for the proxy if the database path does not exist yet. This value will also
     * be written to the database.
     */
    static async create(ref, defaultValue) {
        let cache, loaded = false;
        const proxyId = ref.push().key;
        let onMutationCallback;
        let onErrorCallback = err => {
            console.error(err.message, err.details);
        };
        // const waitingForMutationEvents = [];
        // function globalMutationEventsFired() {
        //     return new Promise(resolve => waitingForMutationEvents.push(resolve));
        // };
        // Subscribe to mutated events on the target path
        const subscription = ref.on('mutated').subscribe(async (snap) => {
            if (!loaded) {
                return;
            }
            // // alert those that were waiting for mutation events to fire
            // waitingForMutationEvents.splice(0).forEach(resolve => process.nextTick(resolve));
            const context = snap.ref.context();
            const remoteChange = context.proxy_id !== proxyId;
            if (snap.ref.path === ref.path) {
                // cache value itself being mutated (changing types? being removed/created?)
                cache = snap.val();
                return;
            }
            let reloadCache = false;
            if (remoteChange) {
                // Make changes to cached object
                const mutatedPath = snap.ref.path;
                const trailPath = mutatedPath.slice(ref.path.length);
                const trailKeys = path_info_1.PathInfo.getPathKeys(trailPath);
                let target = cache;
                while (trailKeys.length > 1) {
                    const key = trailKeys.shift();
                    if (!(key in target)) {
                        // Have we missed an event, or are local pending mutations creating this conflict?
                        // Do not proceed, reload entire value into cache
                        reloadCache = true;
                        console.warn(`Cached value appears outdated, will be reloaded`);
                        break;
                        // target[key] = typeof trailKeys[0] === 'number' ? [] : {}
                    }
                    target = target[key];
                }
                if (!reloadCache) {
                    const prop = trailKeys.shift();
                    // const oldValue = target[prop] || null;
                    const newValue = snap.val();
                    if (newValue === null) {
                        // Remove it
                        target instanceof Array ? target.splice(prop, 1) : delete target[prop];
                    }
                    else {
                        // Set or update it
                        target[prop] = newValue;
                    }
                }
            }
            if (reloadCache) {
                const newSnap = await ref.get();
                cache = newSnap.val();
                // Set mutationSnap to our new value snapshot, with conflict context
                const mutationContext = snap.ref.context();
                newSnap.ref.context({ proxy_id: proxyId, proxy_source: 'conflict', proxy_conflict: mutationContext });
                snap = newSnap;
            }
            onMutationCallback && onMutationCallback(snap, remoteChange);
        });
        // Setup updating functionality: enqueue all updates, process them at next tick in the order they were issued 
        let processQueueTimeout, processPromise = Promise.resolve();
        const overwriteQueue = [];
        const flagOverwritten = (target) => {
            // flag target for overwriting, if an ancestor (or itself) has not been already.
            // it will remove the flag for any descendants target previously set
            const ancestorOrSelf = overwriteQueue.find(otherTarget => otherTarget.length <= target.length && otherTarget.every((key, i) => key === target[i]));
            if (ancestorOrSelf) {
                return;
            }
            // remove descendants
            const descendants = overwriteQueue.filter(otherTarget => otherTarget.length > target.length && otherTarget.every((key, i) => key === target[i]));
            descendants.forEach(d => overwriteQueue.splice(descendants.indexOf(d), 1));
            // add to the queue
            overwriteQueue.push(target);
            // schedule database updates
            if (!processQueueTimeout) {
                processQueueTimeout = setTimeout(() => {
                    const targets = overwriteQueue.splice(0);
                    // Group targets into parent updates
                    const updates = targets.reduce((updates, target) => {
                        if (target.length === 0) {
                            // Overwrite this proxy's root value
                            updates.push({ ref, value: cache, type: 'set' });
                        }
                        else {
                            const parentTarget = target.slice(0, -1);
                            const key = target.slice(-1)[0];
                            const parentRef = parentTarget.reduce((ref, key) => ref.child(key), ref);
                            const parentUpdate = updates.find(update => update.ref.path === parentRef.path);
                            let cacheValue = target.reduce((value, key) => value[key], cache);
                            if (typeof cacheValue === 'undefined') {
                                cacheValue = null; // Being deleted
                            }
                            if (parentUpdate) {
                                parentUpdate.value[key] = cacheValue;
                            }
                            else {
                                updates.push({ ref: parentRef, value: { [key]: cacheValue }, type: 'update' });
                            }
                        }
                        return updates;
                    }, []);
                    console.log(`Proxy: processing ${updates.length} db updates`);
                    processQueueTimeout = null;
                    processPromise = updates.reduce(async (promise, update) => {
                        await promise;
                        return update.ref
                            .context({ proxy_id: proxyId, proxy_source: 'update' })[update.type](update.value) // .set or .update
                            .catch(err => {
                            onErrorCallback({ source: 'update', message: `Error processing update of "/${ref.path}"`, details: err });
                        });
                    }, processPromise);
                });
            }
        };
        const clientSubscriptions = [];
        const addOnChangeHandler = (target, callback) => {
            const targetRef = getTargetRef(ref, target);
            const subscription = targetRef.on('mutated').subscribe(async (snap) => {
                // await globalMutationEventsFired(); // Wait for the mutated events to fire
                const context = snap.ref.context();
                const isRemote = context.proxy_id !== proxyId;
                // Construct previous value from snapshot (we don't know what it was if the update was done locally) 
                const currentValue = getTargetValue(cache, target);
                const newValue = utils_1.cloneObject(currentValue);
                const previousValue = utils_1.cloneObject(newValue);
                for (let i = 0, val = newValue, prev = previousValue, arr = path_info_1.PathInfo.getPathKeys(snap.ref.path).slice(path_info_1.PathInfo.getPathKeys(targetRef.path).length); i < arr.length; i++) {
                    const last = i + 1 === arr.length, key = arr[i];
                    if (last) {
                        val[key] = snap.val();
                        if (val[key] === null) {
                            delete val[key];
                        }
                        prev[key] = snap.previous();
                        if (prev[key] === null) {
                            delete prev[key];
                        }
                    }
                    else {
                        val = val[key] = key in val ? val[key] : {};
                        prev = prev[key] = key in prev ? prev[key] : {};
                    }
                }
                // const proxyValue = newValue === null ? null : createProxy({ root: { ref, cache }, target, id: proxyId, flag: handleFlag });
                process.nextTick(() => {
                    // Run callback with read-only (frozen) values in next tick
                    const keepSubscription = callback(Object.freeze(newValue), Object.freeze(previousValue), isRemote, context);
                    if (keepSubscription === false) {
                        stop();
                    }
                });
            });
            const stop = () => {
                subscription.stop();
                clientSubscriptions.splice(clientSubscriptions.indexOf(subscription), 1);
            };
            clientSubscriptions.push(subscription);
            return { stop };
        };
        const handleFlag = (flag, target, args) => {
            if (flag === 'write') {
                return flagOverwritten(target);
            }
            else if (flag === 'onChange') {
                return addOnChangeHandler(target, args.callback);
            }
            else if (flag === 'observe') {
                // Import RxJS Observable without throwing errors when not available.
                const { Observable } = require('rxjs'); //'rxjs/internal/observable'
                if (!Observable) {
                    throw new Error(`Cannot observe proxy value because rxjs package could not be loaded. Add it to your project with: npm i rxjs`);
                }
                return new Observable(observer => {
                    const currentValue = getTargetValue(cache, target);
                    observer.next(currentValue);
                    const subscription = addOnChangeHandler(target, (value, previous, isRemote, context) => {
                        observer.next(value);
                    });
                    return function unsubscribe() {
                        subscription.stop();
                    };
                });
            }
        };
        const snap = await ref.get();
        loaded = true;
        cache = snap.val();
        if (cache === null && typeof defaultValue !== 'undefined') {
            cache = defaultValue;
            flagOverwritten([]);
        }
        let proxy = createProxy({ root: { ref, cache }, target: [], id: proxyId, flag: handleFlag });
        const assertProxyAvailable = () => {
            if (proxy === null) {
                throw new Error(`Proxy was destroyed`);
            }
        };
        return {
            destroy() {
                subscription.stop();
                clientSubscriptions.forEach(sub => sub.stop());
                cache = null; // Remove cache
                proxy = null;
            },
            stop() {
                this.destroy();
            },
            get value() {
                assertProxyAvailable();
                return proxy;
            },
            get hasValue() {
                assertProxyAvailable();
                return cache !== null;
            },
            set value(val) {
                // Overwrite the value of the proxied path itself!
                assertProxyAvailable();
                if (typeof val === 'object' && val[isProxy]) {
                    throw new Error(`Cannot set value to another proxy`);
                }
                cache = val;
                proxy = createProxy({ root: { ref, cache }, target: [], id: proxyId, flag: handleFlag });
                flagOverwritten([]);
            },
            async reload() {
                // Manually reloads current value when cache is out of sync, which should only 
                // be able to happen if an AceBaseClient is used without cache database, 
                // and the connection to the server was lost for a while. In all other cases, 
                // there should be no need to call this method.
                assertProxyAvailable();
                const newSnap = await ref.get();
                cache = newSnap.val();
                proxy = createProxy({ root: { ref, cache }, target: [], id: proxyId, flag: handleFlag });
                newSnap.ref.context({ proxy_id: proxyId, proxy_source: 'reload' });
                onMutationCallback(newSnap, true);
            },
            onMutation(callback) {
                // Fires callback each time anything changes
                assertProxyAvailable();
                onMutationCallback = (...args) => {
                    try {
                        callback(...args);
                    }
                    catch (err) {
                        onErrorCallback({ source: 'mutation_callback', message: 'Error in dataproxy onMutation callback', details: err });
                    }
                };
            },
            onError(callback) {
                // Fires callback each time anything goes wrong
                assertProxyAvailable();
                onErrorCallback = (...args) => {
                    try {
                        callback(...args);
                    }
                    catch (err) {
                        console.error(`Error in dataproxy onError callback: ${err.message}`);
                    }
                };
            }
        };
    }
}
exports.LiveDataProxy = LiveDataProxy;
function getTargetValue(obj, target) {
    let val = obj;
    for (let key of target) {
        val = typeof val === 'object' && val !== null && key in val ? val[key] : null;
    }
    return val;
}
function getTargetRef(ref, target) {
    let targetRef = ref;
    for (let key of target) {
        targetRef = targetRef.child(key);
    }
    return targetRef;
}
//update(ref: DataReference, value: any): void
function createProxy(context) {
    const targetRef = getTargetRef(context.root.ref, context.target);
    const childProxies = [];
    const handler = {
        get(target, prop, receiver) {
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                if (prop.toString() === isProxy.toString()) {
                    return true;
                }
                return Reflect.get(target, prop, receiver);
            }
            if (typeof target === null || typeof target !== 'object') {
                throw new Error(`Cannot read property "${prop}" of ${target}. Value of path "/${targetRef.path}" is not an object (anymore)`);
            }
            if (target instanceof Array && typeof prop === 'string' && /^[0-9]+$/.test(prop)) {
                // Proxy type definitions say prop can be a number, but this is never the case.
                prop = parseInt(prop);
            }
            const value = target[prop];
            // Check if we have a child proxy for this property already.
            // If so, and the properties' typeof value did not change, return that
            const childProxy = childProxies.find(proxy => proxy.prop === prop);
            if (childProxy) {
                if (childProxy.typeof === typeof value) {
                    return childProxy.value;
                }
                childProxies.splice(childProxies.indexOf(childProxy), 1);
            }
            // If the property contains a simple value, return it. 
            if (['string', 'number', 'boolean'].includes(typeof value)
                || value instanceof Date
                || value instanceof path_reference_1.PathReference
                || value instanceof ArrayBuffer
                || (typeof value === 'object' && 'buffer' in value) // Typed Arrays
            ) {
                return value;
            }
            const isArray = target instanceof Array;
            // TODO: Implement updateWithContext and setWithContext
            if (!(prop in target)) {
                if (prop === 'getTarget') {
                    // Get unproxied readonly (but still live) version of data.
                    return function getTarget() {
                        console.warn(`Use getTarget with caution - any changes will not be synchronized!`);
                        return target;
                    };
                }
                if (prop === 'getRef') {
                    // Gets the DataReference to this data target
                    return function getRef() {
                        const ref = getTargetRef(context.root.ref, context.target);
                        ref.context({ proxy_id: context.id, proxy_reason: 'getRef' });
                        return ref;
                    };
                }
                if (prop === 'forEach') {
                    return function forEach(callback) {
                        const keys = Object.keys(target);
                        for (let i = 0; i < keys.length && callback(target[keys[i]], keys[i], i) !== false; i++) { }
                    };
                }
                if (prop === 'toArray') {
                    return function toArray(sortFn) {
                        const arr = Object.keys(target).map(key => target[key]);
                        if (sortFn) {
                            arr.sort(sortFn);
                        }
                        return arr;
                    };
                }
                if (prop === 'onChanged') {
                    // Starts monitoring the value
                    return function onChanged(callback) {
                        return context.flag('onChange', context.target, { callback });
                    };
                }
                if (prop === 'getObservable') {
                    // Creates an observable for monitoring the value
                    return function getObservable() {
                        return context.flag('observe', context.target);
                    };
                }
                if (!isArray && prop === 'remove') {
                    // Removes target from object collection
                    return function remove() {
                        if (context.target.length === 0) {
                            throw new Error(`Can't remove proxy root value`);
                        }
                        const parent = getTargetValue(context.root.cache, context.target.slice(0, -1));
                        const key = context.target.slice(-1)[0];
                        delete parent[key];
                        context.flag('write', context.target);
                    };
                }
            }
            if (isArray && typeof value === 'function') {
                // Handle array functions
                const writeArray = ret => {
                    context.flag('write', context.target);
                    return ret;
                };
                if (prop === 'push') {
                    return function push(...items) {
                        const ret = target.push(...items); // push the items to the cache array
                        return writeArray(ret);
                    };
                }
                else if (prop === 'pop') {
                    return function pop() {
                        const ret = target.pop();
                        return writeArray(ret);
                    };
                }
                else if (prop === 'splice') {
                    return function splice(start, deleteCount, ...items) {
                        const ret = target.splice(start, deleteCount, ...items);
                        return writeArray(ret);
                    };
                }
                else if (prop === 'shift') {
                    return function shift() {
                        const ret = target.shift();
                        return writeArray(ret);
                    };
                }
                else if (prop === 'unshift') {
                    return function unshift(...items) {
                        const ret = target.unshift(...items);
                        return writeArray(ret);
                    };
                }
                else if (prop === 'sort') {
                    return function sort(compareFn) {
                        const ret = target.sort(compareFn);
                        return writeArray(ret);
                    };
                }
                else if (prop === 'reverse') {
                    return function reverse() {
                        const ret = target.reverse();
                        return writeArray(ret);
                    };
                }
                else {
                    // Other array function, does not alter its value
                    return function fn(...args) {
                        return target[prop](...args);
                    };
                }
            }
            else if (!isArray && typeof value === 'undefined' && prop === 'push') {
                // Push item to an object collection
                return function push(item) {
                    const childRef = targetRef.push();
                    // Add item to cache collection
                    target[childRef.key] = item;
                    // // Add it to the database, return promise
                    // return childRef.set(item);
                    context.flag('write', context.target.concat(childRef.key)); //(childRef, item);
                    return childRef.key;
                };
            }
            else if (typeof value === 'undefined') { //(!(prop in target)) {
                return undefined;
            }
            // Proxify any other value
            const proxy = createProxy({ root: context.root, target: context.target.concat(prop), id: context.id, flag: context.flag });
            childProxies.push({ typeof: typeof value, prop, value: proxy });
            return proxy;
        },
        set(target, prop, value, receiver) {
            // Eg: chats.chat1.title = 'New chat title';
            // target === chats.chat1, prop === 'title'
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                return Reflect.set(target, prop, value, receiver);
            }
            if (target === null || typeof target !== 'object') {
                throw new Error(`Cannot set property "${prop}" of ${target}. Value of path "/${targetRef.path}" is not an object`);
            }
            if (target instanceof Array && typeof prop === 'string') {
                if (!/^[0-9]+$/.test(prop)) {
                    throw new Error(`Cannot set property "${prop}" on array value of path "/${targetRef.path}"`);
                }
                prop = parseInt(prop);
            }
            if (typeof value === 'object' && value[isProxy]) {
                // Assigning one proxied value to another
                value = value.getTarget();
            }
            else if (typeof value === 'object' && Object.isFrozen(value)) {
                // Create a copy to unfreeze it
                value = utils_1.cloneObject(value);
            }
            if (typeof value !== 'object' && target[prop] === value) {
                // not changing the actual value, ignore
                return true;
            }
            // Set cached value:
            target[prop] = value;
            if (context.target.some(key => typeof key === 'number')) {
                // Updating an object property inside an array. Flag the first array in target to be written.
                // Eg: when chat.members === [{ name: 'Ewout', id: 'someid' }]
                // --> chat.members[0].name = 'Ewout' --> Rewrite members array instead of chat/members[0]/name
                context.flag('write', context.target.slice(0, context.target.findIndex(key => typeof key === 'number')));
            }
            else if (target instanceof Array) {
                // Flag the entire array to be overwritten
                context.flag('write', context.target); //(targetRef, target);
            }
            else {
                // Flag child property
                context.flag('write', context.target.concat(prop)); //(targetRef.child(prop), value);
            }
            return true;
        },
        deleteProperty(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                return Reflect.deleteProperty(target, prop);
            }
            delete target[prop];
            context.flag('write', context.target.concat(prop));
            return true;
        },
        ownKeys(target) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.ownKeys(target);
        },
        has(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.has(target, prop);
        },
        getOwnPropertyDescriptor(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
            if (descriptor) {
                descriptor.configurable = true; // prevent "TypeError: 'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property '...' which is either non-existant or configurable in the proxy target"
            }
            return descriptor;
        },
        getPrototypeOf(target) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.getPrototypeOf(target);
        }
    };
    return new Proxy({}, handler);
}
function proxyAccess(proxiedValue) {
    if (typeof proxiedValue !== 'object' || !proxiedValue[isProxy]) {
        throw new Error(`Given value is not proxied. Make sure you are referencing the value through the live data proxy.`);
    }
    return proxiedValue;
}
exports.proxyAccess = proxyAccess;

}).call(this,require('_process'))
},{"./path-info":160,"./path-reference":161,"./utils":166,"_process":179,"rxjs":49}],155:[function(require,module,exports){
const { DataSnapshot } = require('./data-snapshot');
const { EventStream, EventPublisher } = require('./subscription');
const { ID } = require('./id');
const debug = require('./debug');
const { PathInfo } = require('./path-info');
const { PathReference } = require('./path-reference');
const { LiveDataProxy } = require('./data-proxy');

class DataRetrievalOptions {
    /**
     * Options for data retrieval, allows selective loading of object properties
     * @param {{ include?: Array<string|number>, exclude?: Array<string|number>, child_objects?: boolean, allow_cache?: boolean }} options 
     */
    constructor(options) {
        if (!options) {
            options = {};
        }
        if (typeof options.include !== 'undefined' && !(options.include instanceof Array)) {
            throw new TypeError(`options.include must be an array`);
        }
        if (typeof options.exclude !== 'undefined' && !(options.exclude instanceof Array)) {
            throw new TypeError(`options.exclude must be an array`);
        }
        if (typeof options.child_objects !== 'undefined' && typeof options.child_objects !== 'boolean') {
            throw new TypeError(`options.child_objects must be a boolean`);
        }
        if (typeof options.allow_cache !== 'undefined' && typeof options.allow_cache !== 'boolean') {
            throw new TypeError(`options.allow_cache must be a boolean`);
        }

        /**
         * @property {string[]} include - child keys to include (will exclude other keys), can include wildcards (eg "messages/*\/title")
         */
        this.include = options.include || undefined;
        /**
         * @property {string[]} exclude - child keys to exclude (will include other keys), can include wildcards (eg "messages/*\/replies")
         */
        this.exclude = options.exclude || undefined;
        /**
         * @property {boolean} child_objects - whether or not to include any child objects, default is true
         */
        this.child_objects = typeof options.child_objects === "boolean" ? options.child_objects : undefined;
        /**
         * @property {boolean} allow_cache - whether cached results are allowed to be used (supported by AceBaseClients using local cache), default is true
         */
        this.allow_cache = typeof options.allow_cache === "boolean" ? options.allow_cache : undefined;
    }
}

class QueryDataRetrievalOptions extends DataRetrievalOptions {
    /**
     * Options for data retrieval, allows selective loading of object properties
     * @param {QueryDataRetrievalOptions} [options]
     */
    constructor(options) {
        super(options);
        if (typeof options.snapshots !== 'undefined' && typeof options.snapshots !== 'boolean') {
            throw new TypeError(`options.snapshots must be an array`);
        }
        /**
         * @property {boolean} snapshots - whether to return snapshots of matched nodes (include data), or references only (no data). Default is true
         */
        this.snapshots = typeof options.snapshots === 'boolean' ? options.snapshots : undefined;
    }
}

const _private = Symbol("private");
class DataReference {
    /**
     * Creates a reference to a node
     * @param {AceBase} db
     * @param {string} path 
     */
    constructor (db, path, vars) {
        if (!path) { path = ""; }
        path = path.replace(/^\/|\/$/g, ""); // Trim slashes
        const pathInfo = PathInfo.get(path);
        const key = pathInfo.key; //path.length === 0 ? "" : path.substr(path.lastIndexOf("/") + 1); //path.match(/(?:^|\/)([a-z0-9_$]+)$/i)[1];
        // const query = { 
        //     filters: [],
        //     skip: 0,
        //     take: 0,
        //     order: []
        // };
        const callbacks = [];
        this[_private] = {
            get path() { return path; },
            get key() { return key; },
            get callbacks() { return callbacks; },
            vars: vars || {},
            context: {}
        };
        this.db = db; //Object.defineProperty(this, "db", ...)
    }

    /**
     * Adds contextual info for database updates through this reference. 
     * This allows you to identify the event source (and/or reason) of 
     * data change events being triggered. You can use this for example 
     * to track if data updates were performed by the local client, a 
     * remote client, or the server. And, why it was changed, and by whom.
     * @param {any} [context] Context to set for this reference.
     * @returns {DataReference|any} returns this instance, or the previously set context when calling context()
     * @example
     * // Somewhere in your frontend code:
     * db.ref('accounts/123/balance').on('value', snap => {
     *      // Account balance changed
     *      const newBalance = snap.val();
     *      const updateContext = snap.ref.context();
     *      switch (updateContext.action) {
     *          case 'payment': alert('Your payment was processed!'); break;
     *          case 'deposit': alert('Money was added to your account'); break;
     *          case 'withdraw': alert('You just withdrew money from your account'); break;
     *      }
     * });
     * 
     * // Somewhere in your backend code:
     * db.ref('accounts/123/balance')
     *  .context({ action: 'withdraw', description: 'ATM withdrawal of €50' })
     *  .transaction(snap => {
     *      let balance = snap.val();
     *      return balance - 50;
     *  })
     */
    context(context = undefined) {
        if (typeof context === 'object') {
            this[_private].context = context;
            return this;
        }
        else if (typeof context === 'undefined') {
            return this[_private].context;
        }
        else {
            throw new Error('Invalid context argument');
        }
    }

    /**
    * The path this instance was created with
    * @type {string}
    */
    get path() { return this[_private].path; }

    /**
     * The key or index of this node
     * @type {string|number}
     */
    get key() { return this[_private].key; }
    
    /**
     * Returns a new reference to this node's parent
     * @type {DataReference}
     */
    get parent() {
        let currentPath = PathInfo.fillVariables2(this.path, this.vars);
        const info = PathInfo.get(currentPath);
        if (info.parentPath === null) {
            return null;
        }
        return new DataReference(this.db, info.parentPath).context(this[_private].context);
    }

    /**
     * Contains values of the variables/wildcards used in a subscription path if this reference was 
     * created by an event ("value", "child_added" etc)
     * @type {{ [index: number]: string|number, [variable: string]: string|number }}
     */
    get vars() {
        return this[_private].vars;
    }

    /**
     * Returns a new reference to a child node
     * @param {string|number} childPath Child key, index or path
     * @returns {DataReference} reference to the child
     */
    child(childPath) {
        childPath = typeof childPath === 'number' ? childPath : childPath.replace(/^\/|\/$/g, "");
        const currentPath = PathInfo.fillVariables2(this.path, this.vars);
        const targetPath = PathInfo.getChildPath(currentPath, childPath);
        return new DataReference(this.db, targetPath).context(this[_private].context); //  `${this.path}/${childPath}`
    }
    
    /**
     * Sets or overwrites the stored value
     * @param {any} value value to store in database
     * @param {(err: Error, ref: DataReference) => void} [onComplete] completion callback to use instead of returning promise 
     * @returns {Promise<DataReference>} promise that resolves with this reference when completed (when not using onComplete callback)
     */
    set(value, onComplete = undefined) {
        const handleError = err => {
            if (typeof onComplete === 'function') {
                try { onComplete(err); } catch(err) { console.error(`Error in onComplete callback:`, err); }
            }
            else {
                // throw again
                return Promise.reject(err);
            }
        };
        if (this.isWildcardPath) {
            return handleError(new Error(`Cannot set the value of wildcard path "/${this.path}"`));
        }
        if (this.parent === null) {
            return handleError(new Error(`Cannot set the root object. Use update, or set individual child properties`));
        }
        if (typeof value === 'undefined') {
            return handleError(new TypeError(`Cannot store undefined value in "/${this.path}"`));
        }
        if (!this.db.isReady) {
            return this.db.ready().then(() => this.set(value, onComplete));
        }
        value = this.db.types.serialize(this.path, value);
        return this.db.api.set(this.path, value, { context: this[_private].context })
        .then(res => {
            if (typeof onComplete === 'function') {
                try { onComplete(null, this);} catch(err) { console.error(`Error in onComplete callback:`, err); }
            }
        })
        .catch(err => {
            return handleError(err);
        })
        .then(() => {
            return this;
        });
    }

    /**
     * Updates properties of the referenced node
     * @param {object} updates object containing the properties to update
     * @param {(err: Error, ref: DataReference) => void} [onComplete] completion callback to use instead of returning promise 
     * @return {Promise<DataReference>} returns promise that resolves with this reference once completed (when not using onComplete callback)
     */
    update(updates, onComplete = undefined) {
        const handleError = err => {
            if (typeof onComplete === 'function') {
                try { onComplete(err); } catch(err) { console.error(`Error in onComplete callback:`, err); }
            }
            else {
                // throw again
                return Promise.reject(err);
            }
        };
        if (this.isWildcardPath) {
            return handleError(new Error(`Cannot update the value of wildcard path "/${this.path}"`));
        }
        let promise;
        if (typeof updates !== "object" || updates instanceof Array || updates instanceof ArrayBuffer || updates instanceof Date) {
            promise = this.set(updates);
        }
        else if (Object.keys(updates).length === 0) {
            console.warn(`update called on path "/${this.path}", but there is nothing to update`);
            promise = Promise.resolve();
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.update(updates, onComplete));
        }
        else {            
            updates = this.db.types.serialize(this.path, updates);
            promise = this.db.api.update(this.path, updates, { context: this[_private].context });
        }
        return promise.then(() => {
            if (typeof onComplete === 'function') {
                try { onComplete(null, this); } catch(err) { console.error(`Error in onComplete callback:`, err); }
            }
        })
        .catch(err => {
            return handleError(err);
        })
        .then(() => {
            return this;
        })
    }

    /**
     * Sets the value a node using a transaction: it runs your callback function with the current value, uses its return value as the new value to store.
     * The transaction is canceled if your callback returns undefined, or throws an error. If your callback returns null, the target node will be removed.
     * @param {(currentValue: DataSnapshot) => any} callback - callback function that performs the transaction on the node's current value. It must return the new value to store (or promise with new value), undefined to cancel the transaction, or null to remove the node.
     * @returns {Promise<DataReference>} returns a promise that resolves with the DataReference once the transaction has been processed
     */
    transaction(callback) {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot start a transaction on wildcard path "/${this.path}"`));
        }
        if (!this.db.isReady) {
            return this.db.ready().then(() => this.transaction(callback));
        }
        let throwError;
        let cb = (currentValue) => {
            currentValue = this.db.types.deserialize(this.path, currentValue);
            const snap = new DataSnapshot(this, currentValue);
            let newValue;
            try {
                newValue = callback(snap);
            }
            catch(err) {
                // callback code threw an error
                throwError = err; // Remember error
                return; // cancel transaction by returning undefined
            }
            if (newValue instanceof Promise) {
                return newValue
                .then((val) => {
                    return this.db.types.serialize(this.path, val);
                })
                .catch(err => {
                    throwError = err; // Remember error
                    return; // cancel transaction by returning undefined
                });
            }
            else {
                return this.db.types.serialize(this.path, newValue);
            }
        }
        return this.db.api.transaction(this.path, cb, { context: this[_private].context })
        .then(result => {
            if (throwError) {
                // Rethrow error from callback code
                throw throwError;
            }
            return this;
        });
    }

    /**
     * Subscribes to an event. Supported events are "value", "child_added", "child_changed", "child_removed", 
     * which will run the callback with a snapshot of the data. If you only wish to receive notifications of the 
     * event (without the data), use the "notify_value", "notify_child_added", "notify_child_changed", 
     * "notify_child_removed" events instead, which will run the callback with a DataReference to the changed 
     * data. This enables you to manually retreive data upon changes (eg if you want to exclude certain child 
     * data from loading)
     * @param {string} event - Name of the event to subscribe to
     * @param {((snapshotOrReference:DataSnapshot|DataReference) => void)|boolean} callback - Callback function(snapshot) or whether or not to run callbacks on current values when using "value" or "child_added" events
     * @returns {EventStream} returns an EventStream
     */
    on(event, callback, cancelCallbackOrContext, context) {
        if (this.path === '' && ['value', 'child_changed'].includes(event)) {
            // Removed 'notify_value' and 'notify_child_changed' events from the list, they do not require additional data loading anymore.
            console.warn(`WARNING: Listening for value and child_changed events on the root node is a bad practice. These events require loading of all data (value event), or potentially lots of data (child_changed event) each time they are fired`);
        }
        const cancelCallback = typeof cancelCallbackOrContext === 'function' && cancelCallbackOrContext;
        context = typeof cancelCallbackOrContext === 'object' ? cancelCallbackOrContext : context

        const useCallback = typeof callback === 'function';
        
        /** @type {EventPublisher} */
        let eventPublisher = null;
        const eventStream = new EventStream(publisher => { eventPublisher = publisher });

        // Map OUR callback to original callback, so .off can remove the right callback
        let cb = { 
            subscr: eventStream,
            original: callback, 
            ours: (err, path, newValue, oldValue, eventContext) => {
                if (err) {
                    debug.error(`Error getting data for event ${event} on path "${path}"`, err);
                    return;
                }
                let ref = this.db.ref(path).context(eventContext || {});
                ref[_private].vars = PathInfo.extractVariables(this.path, path);
                
                let callbackObject;
                if (event.startsWith('notify_')) {
                    // No data event, callback with reference
                    callbackObject = ref;
                }
                else {
                    const values = { 
                        previous: this.db.types.deserialize(path, oldValue),
                        current: this.db.types.deserialize(path, newValue)
                    };
                    if (event === 'child_removed') {
                        callbackObject = new DataSnapshot(ref, values.previous, true, values.previous);
                    }
                    else {
                        const isRemoved = event === 'mutated' && values.current === null;
                        callbackObject = new DataSnapshot(ref, values.current, isRemoved, values.previous);
                    }
                }

                try { useCallback && callback.call(context || null, callbackObject); }
                catch (err) { console.error(`ERROR firing "${event}" callback for path "${path}":`, err); }
                
                let keep = eventPublisher.publish(callbackObject);
                if (!keep && !useCallback) {
                    // If no callback was used, unsubscribe
                    let callbacks = this[_private].callbacks;
                    callbacks.splice(callbacks.indexOf(cb), 1);
                    this.db.api.unsubscribe(this.path, event, cb.ours);
                }
            }
        };
        this[_private].callbacks.push(cb);

        const subscribe = () => {
            let authorized = this.db.api.subscribe(this.path, event, cb.ours);
            const allSubscriptionsStoppedCallback = () => {
                let callbacks = this[_private].callbacks;
                callbacks.splice(callbacks.indexOf(cb), 1);
                this.db.api.unsubscribe(this.path, event, cb.ours);
            };
            if (authorized instanceof Promise) {
                // Web API now returns a promise that resolves if the request is allowed
                // and rejects when access is denied by the set security rules
                authorized.then(() => {
                    // Access granted
                    eventPublisher.start(allSubscriptionsStoppedCallback);
                })
                .catch(err => {
                    // Access denied?
                    // Cancel subscription
                    let callbacks = this[_private].callbacks;
                    callbacks.splice(callbacks.indexOf(cb), 1);
                    this.db.api.unsubscribe(this.path, event, cb.ours);

                    // Call cancelCallbacks
                    eventPublisher.cancel(err.message);
                    cancelCallback && cancelCallback(err.message);
                });
            }
            else {
                // Local API, always authorized
                eventPublisher.start(allSubscriptionsStoppedCallback);
            }

            if (callback && !this.isWildcardPath) {
                // If callback param is supplied (either a callback function or true or something else truthy),
                // it will fire events for current values right now.
                // Otherwise, it expects the .subscribe methode to be used, which will then
                // only be called for future events
                if (event === "value") {
                    this.get(snap => {
                        eventPublisher.publish(snap);
                        useCallback && callback(snap);
                    });
                }
                else if (event === "child_added") {
                    this.get(snap => {
                        const val = snap.val();
                        if (val === null || typeof val !== "object") { return; }
                        Object.keys(val).forEach(key => {
                            let childSnap = new DataSnapshot(this.child(key), val[key]);
                            eventPublisher.publish(childSnap);
                            useCallback && callback(childSnap);
                        });
                    });
                }
                else if (event === "notify_child_added") {
                    // Use the reflect API to get current children. 
                    // NOTE: This does not work with AceBaseServer <= v0.9.7, only when signed in as admin
                    const step = 100;
                    let limit = step, skip = 0;
                    const more = () => {
                        this.db.api.reflect(this.path, "children", { limit, skip })
                        .then(children => {
                            children.list.forEach(child => {
                                const childRef = this.child(child.key);
                                eventPublisher.publish(childRef);
                                useCallback && callback(childRef);
                            })
                            if (children.more) {
                                skip += step;
                                more();
                            }
                        });
                    };
                    more();
                }
            }
        };

        if (this.db.isReady) {
            subscribe();
        }
        else {
            this.db.ready(subscribe);
        }

        return eventStream;
    }

    /**
     * Unsubscribes from a previously added event
     * @param {string} event | Name of the event
     * @param {Function} callback | callback function to remove
     */
    off(event = undefined, callback = undefined) {
        const callbacks = this[_private].callbacks;
        if (callback) {
            const cb = callbacks.find(cb => cb.original === callback);
            if (!cb) {
                debug.error(`Can't find specified callback to unsubscribe from (path: "${this.path}", event: ${event}, callback: ${callback})`);
                return;
            }
            callbacks.splice(callbacks.indexOf(cb), 1);
            callback = cb.ours;
            cb.subscr.unsubscribe(callback);
        }
        else {
            callbacks.splice(0, callbacks.length).forEach(cb => {
                cb.subscr.unsubscribe();
            });
        }
        const unsubscribe = () => {
            this.db.api.unsubscribe(this.path, event, callback);
        };
        if (this.db.isReady) {
            unsubscribe();
        }
        else {
            this.db.ready(unsubscribe);
        }
        return this;
    }

    /**
     * Gets a snapshot of the stored value. Shorthand method for .once("value")
     * @param {DataRetrievalOptions|((snapshot:DataSnapshot) => void)} [optionsOrCallback] data retrieval options to include or exclude specific child keys, or callback
     * @param {(snapshot:DataSnapshot) => void} [callback] callback function to run with a snapshot of the data instead of returning a promise
     * @returns {Promise<DataSnapshot>|void} returns a promise that resolves with a snapshot of the data, or nothing if callback is used
     */
    get(optionsOrCallback = undefined, callback = undefined) {
        if (!this.db.isReady) {
            const promise = this.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== 'function' && typeof callback !== 'function' ? promise : undefined; // only return promise if no callback is used
        }

        callback = 
            typeof optionsOrCallback === 'function' 
            ? optionsOrCallback 
            : typeof callback === 'function'
                ? callback
                : undefined;

        if (this.isWildcardPath) {
            const error = new Error(`Cannot get value of wildcard path "/${this.path}". Use .query() instead`);
            if (typeof callback === 'function') { throw err; }
            return Promise.reject(error);
        }

        const options = 
            typeof optionsOrCallback === 'object' 
            ? optionsOrCallback
            : new DataRetrievalOptions({ allow_cache: true });

        if (typeof options.allow_cache === 'undefined') {
            options.allow_cache = true;
        }

        const promise = this.db.api.get(this.path, options).then(value => {
            value = this.db.types.deserialize(this.path, value);
            const snapshot = new DataSnapshot(this, value);
            return snapshot;
        });

        if (callback) { 
            promise.then(callback);
            return; 
        }
        else {
            return promise;
        }
    }

    /**
     * Waits for an event to occur
     * @param {string} event - Name of the event, eg "value", "child_added", "child_changed", "child_removed"
     * @param {DataRetrievalOptions} options - data retrieval options, to include or exclude specific child keys
     * @returns {Promise<DataSnapshot>} - returns promise that resolves with a snapshot of the data
     */
    once(event, options) {
        if (event === "value" && !this.isWildcardPath) {
            // Shortcut, do not start listening for future events
            return this.get(options);
        }
        return new Promise((resolve, reject) => {
            const callback = (snap) => {
                this.off(event, snap); // unsubscribe directly
                resolve(snap);
            }
            this.on(event, callback);
        });
    }

    /**
     * Creates a new child with a unique key and returns the new reference. 
     * If a value is passed as an argument, it will be stored to the database directly. 
     * The returned reference can be used as a promise that resolves once the
     * given value is stored in the database
     * @param {any} value optional value to store into the database right away
     * @param {function} onComplete optional callback function to run once value has been stored
     * @returns {DataReference|Promise<DataReference>} returns a reference to the new child, or a promise that resolves with the reference after the passed value has been stored
     * @example 
     * // Create a new user in "game_users"
     * db.ref("game_users")
     * .push({ name: "Betty Boop", points: 0 })
     * .then(ref => {
     * //  ref is a new reference to the newly created object,
     * //  eg to: "game_users/7dpJMeLbhY0tluMyuUBK27"
     * });
     * @example
     * // Create a new child reference with a generated key, 
     * // but don't store it yet
     * let userRef = db.ref("users").push();
     * // ... to store it later:
     * userRef.set({ name: "Popeye the Sailor" })
     */
    push(value = undefined, onComplete = undefined) {
        if (this.isWildcardPath) {
            const error = new Error(`Cannot push to wildcard path "/${this.path}"`);
            if (typeof value === 'undefined' || typeof onComplete === 'function') { throw error; }
            return Promise.reject(error);
        }

        const id = ID.generate(); //uuid62.v1({ node: [0x61, 0x63, 0x65, 0x62, 0x61, 0x73] });
        const ref = this.child(id);
        ref.__pushed = true;

        if (typeof value !== 'undefined') {
            return ref.set(value, onComplete).then(res => ref);
        }
        else {
            return ref;
        }
    }

    /**
     * Removes this node and all children
     */
    remove() {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot remove wildcard path "/${this.path}". Use query().remove instead`));
        }
        if (this.parent === null) {
            throw Promise.reject(new Error(`Cannot remove the root node`));
        }
        return this.set(null);
    }

    /**
     * Quickly checks if this reference has a value in the database, without returning its data
     * @returns {Promise<boolean>} | returns a promise that resolves with a boolean value
     */
    exists() {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot check wildcard path "/${this.path}" existence`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.exists());
        }
        return this.db.api.exists(this.path);
    }

    get isWildcardPath() {
        return this.path.indexOf('*') >= 0 || this.path.indexOf('$') >= 0;
    }

    query() {
        return new DataReferenceQuery(this);
    }

    count() {
        return this.reflect("info", { child_count: true })
        .then(info => {
            return info.children.count;
        })
    }

    reflect(type, args) {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot reflect on wildcard path "/${this.path}"`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.reflect(type, args));
        }
        return this.db.api.reflect(this.path, type, args);
    }

    export(stream, options = { format: 'json' }) {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot export wildcard path "/${this.path}"`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.export(stream, options));
        }
        return this.db.api.export(this.path, stream, options);
    }

    proxy(defaultValue) {
        return LiveDataProxy.create(this, defaultValue);
    }

    observe(options) {
        // options should not be used yet - we can't prevent/filter mutation events on excluded paths atm 

        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot observe wildcard path "/${this.path}"`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.observe(options));
        }
        let Observable;
        try {
            Observable = require('rxjs').Observable;
        }
        catch(err) {
            return Promise.reject(`RxJS not installed. Add it to your project with: npm install rxjs --save`)
        }
        return new Observable(observer => {
            let cache, resolved = false;
            let promise = this.get(options).then(snap => {
                resolved = true;
                cache = snap.val();
                observer.next(cache);
            });

            const updateCache = (snap) => {
                if (!resolved) { 
                    promise = promise.then(() => updateCache(snap));
                    return; 
                }
                const mutatedPath = snap.ref.path;
                const trailPath = mutatedPath.slice(this.path.length + 1);
                const trailKeys = PathInfo.getPathKeys(trailPath);
                let target = cache;
                while (trailKeys.length > 1) {
                    const key = trailKeys.shift();
                    if (!(key in target)) {
                        // Happens if initial loaded data did not include / excluded this data, 
                        // or we missed out on an event
                        target[key] = typeof trailKeys[0] === 'number' ? [] : {}
                    }
                    target = target[key];
                }
                const prop = trailKeys.shift();
                const newValue = snap.val();
                if (newValue === null) {
                    // Remove it
                    target instanceof Array ? target.splice(prop, 1) : delete target[prop];                    
                }
                else {
                    // Set or update it
                    target[prop] = newValue;
                }
                observer.next(cache);
            };

            this.on('mutated', updateCache);

            // Return unsubscribe function
            return () => {
                this.off('mutated', updateCache);
            };
        });
    }
} 

class DataReferenceQuery {
    
    /**
     * Creates a query on a reference
     * @param {DataReference} ref 
     */
    constructor(ref) {
        this.ref = ref;
        this[_private] = {
            filters: [],
            skip: 0,
            take: 0,
            order: []
        };
    }

    /**
     * Applies a filter to the children of the refence being queried. 
     * If there is an index on the property key being queried, it will be used 
     * to speed up the query
     * @param {string|number} key | property to test value of
     * @param {string} op | operator to use
     * @param {any} compare | value to compare with
     * @returns {DataReferenceQuery}
     */                
    filter(key, op, compare) {
        if ((op === "in" || op === "!in") && (!(compare instanceof Array) || compare.length === 0)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing at least 1 value`);
        }
        if ((op === "between" || op === "!between") && (!(compare instanceof Array) || compare.length !== 2)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing 2 values`);
        }
        if ((op === "matches" || op === "!matches") && !(compare instanceof RegExp)) {
            throw new Error(`${op} filter for ${key} must supply a RegExp compare argument`);
        }
        // DISABLED 2019/10/23 because it is not fully implemented only works locally
        // if (op === "custom" && typeof compare !== "function") {
        //     throw `${op} filter for ${key} must supply a Function compare argument`;
        // }
        if ((op === "contains" || op === "!contains") && ((typeof compare === 'object' && !(compare instanceof Array) && !(compare instanceof Date)) || (compare instanceof Array && compare.length === 0))) {
            throw new Error(`${op} filter for ${key} must supply a simple value or (non-zero length) array compare argument`);
        }
        this[_private].filters.push({ key, op, compare });
        return this;
    }

    /**
     * @deprecated use .filter instead
     */
    where(key, op, compare) {
        return this.filter(key, op, compare)
    }

    /**
     * Limits the number of query results to n
     * @param {number} n 
     * @returns {DataReferenceQuery}
     */
    take(n) {
        this[_private].take = n;
        return this;
    }

    /**
     * Skips the first n query results
     * @param {number} n 
     * @returns {DataReferenceQuery}
     */
    skip(n) {
        this[_private].skip = n;
        return this;
    }

    /**
     * Sorts the query results
     * @param {string} key 
     * @param {boolean} [ascending=true]
     * @returns {DataReferenceQuery}
     */
    sort(key, ascending = true) {
        if (typeof key !== "string") {
            throw `key must be a string`;
        }
        this[_private].order.push({ key, ascending });
        return this;
    }

    /**
     * @deprecated use .sort instead
     */
    order(key, ascending = true) {
        return this.sort(key, ascending);
    }

    /**
     * Executes the query
     * @param {((snapshotsOrReferences:DataSnapshotsArray|DataReferencesArray) => void)|QueryDataRetrievalOptions} [optionsOrCallback] data retrieval options (to include or exclude specific child data, and whether to return snapshots (default) or references only), or callback
     * @param {(snapshotsOrReferences:DataSnapshotsArray|DataReferencesArray) => void} [callback] callback to use instead of returning a promise
     * @returns {Promise<DataSnapshotsArray>|Promise<DataReferencesArray>|void} returns an Promise that resolves with an array of DataReferences or DataSnapshots, or void if a callback is used instead
     */
    get(optionsOrCallback = undefined, callback = undefined) {
        if (!this.ref.db.isReady) {
            return this.ref.db.ready().then(() => this.get(optionsOrCallback, callback));
        }

        callback = 
            typeof optionsOrCallback === 'function' 
            ? optionsOrCallback 
            : typeof callback === 'function'
                ? callback
                : undefined;

        const options = 
            typeof optionsOrCallback === 'object' 
            ? optionsOrCallback 
            : new QueryDataRetrievalOptions({ snapshots: true, allow_cache: true });

        if (typeof options.snapshots === 'undefined') {
            options.snapshots = true;
        }
        if (typeof options.allow_cache === 'undefined') {
            options.allow_cache = true;
        }
        options.eventHandler = ev => {
            if (!this._events || !this._events[ev.name]) { return false; }
            const listeners = this._events[ev.name];
            if (typeof listeners !== 'object' || listeners.length === 0) { return false; }
            if (['add','change','remove'].includes(ev.name)) {
                const ref = new DataReference(this.ref.db, ev.path);
                const eventData = { name: ev.name };
                if (options.snapshots && ev.name !== 'remove') {
                    const val = db.types.deserialize(ev.path, ev.value);
                    eventData.snapshot = new DataSnapshot(ref, val, false);
                }
                else {
                    eventData.ref = ref;
                }
                ev = eventData;
            }
            listeners.forEach(callback => { try { callback(ev); } catch(e) {} });
        };
        // Check if there are event listeners set for realtime changes
        options.monitor = { add: false, change: false, remove: false };
        if (this._events) {
            if (this._events['add'] && this._events['add'].length > 0) {
                options.monitor.add = true;
            }
            if (this._events['change'] && this._events['change'].length > 0) {
                options.monitor.change = true;
            }
            if (this._events['remove'] && this._events['remove'].length > 0) {
                options.monitor.remove = true;
            }
        }
        const db = this.ref.db;
        return db.api.query(this.ref.path, this[_private], options)
        .catch(err => {
            throw new Error(err);
        })
        .then(results => {
            results.forEach((result, index) => {
                if (options.snapshots) {
                    const val = db.types.deserialize(result.path, result.val);
                    results[index] = new DataSnapshot(db.ref(result.path), val);
                }
                else {
                    results[index] = db.ref(result);
                }
            });
            if (options.snapshots) {
                return DataSnapshotsArray.from(results);
            }
            else {
                return DataReferencesArray.from(results);
            }
        })
        .then(results => {
            callback && callback(results);
            return results;
        });
    }

    /**
     * Executes the query and returns references. Short for .get({ snapshots: false })
     * @param {(references:DataReferencesArray) => void} [callback] callback to use instead of returning a promise
     * @returns {Promise<DataReferencesArray>|void} returns an Promise that resolves with an array of DataReferences, or void when using a callback
     */
    getRefs(callback = undefined) {
        return this.get({ snapshots: false }, callback);
    }

    /**
     * Executes the query, removes all matches from the database
     * @returns {Promise<void>|void} | returns an Promise that resolves once all matches have been removed, or void if a callback is used
     */
    remove(callback) {
        return this.get({ snapshots: false })
        .then(refs => {
            const promises = [];
            return Promise.all(refs.map(ref => ref.remove()))
            .then(() => {
                callback && callback();
            });
        });
    }

    /**
     * Subscribes to an event. Supported events are:
     *  "stats": receive information about query performance.
     *  "hints": receive query or index optimization hints
     *  "add", "change", "remove": receive real-time query result changes
     * @param {string} event - Name of the event to subscribe to
     * @param {(event: object) => void} callback - Callback function
     * @returns {DataReferenceQuery} returns reference to this query
     */
    on(event, callback) {
        if (!this._events) { this._events = {}; };
        if (!this._events[event]) { this._events[event] = []; }
        this._events[event].push(callback);
        return this;
    }

    /**
     * Unsubscribes from a previously added event(s)
     * @param {string} [event] Name of the event
     * @param {Function} [callback] callback function to remove
     * @returns {DataReferenceQuery} returns reference to this query
     */
    off(event, callback) {
        if (!this._events) { return this; }
        if (typeof event === 'undefined') {
            this._events = {};
            return this;
        }
        if (!this._events[event]) { return this; }
        if (typeof callback === 'undefined') {
            delete this._events[event];
            return this;
        }
        const index = !this._events[event].indexOf(callback);
        if (!~index) { return this; }
        this._events[event].splice(index, 1);
        return this;
    }
}

class DataSnapshotsArray extends Array {
    /**
     * 
     * @param {DataSnapshot[]} snaps 
     */
    static from(snaps) {
        const arr = new DataSnapshotsArray(snaps.length);
        snaps.forEach((snap, i) => arr[i] = snap);
        return arr;
    }
    getValues() {
        return this.map(snap => snap.val());
    }
}

class DataReferencesArray extends Array { 
    /**
     * 
     * @param {DataReference[]} refs 
     */
    static from(refs) {
        const arr = new DataReferencesArray(refs.length);
        refs.forEach((ref, i) => arr[i] = ref);
        return arr;
    }
    getPaths() {
        return this.map(ref => ref.path);
    }
}

module.exports = { 
    DataReference, 
    DataReferenceQuery,
    DataRetrievalOptions,
    QueryDataRetrievalOptions
};
},{"./data-proxy":154,"./data-snapshot":156,"./debug":157,"./id":158,"./path-info":160,"./path-reference":161,"./subscription":163,"rxjs":49}],156:[function(require,module,exports){
const { DataReference } = require('./data-reference');
const { getPathKeys } = require('./path-info');

const getChild = (snapshot, path) => {
    if (!snapshot.exists()) { return null; }
    let child = snapshot.val();
    //path.split("/").every...
    getPathKeys(path).every(key => {
        child = child[key];
        return typeof child !== "undefined";
    });
    return child || null;
};

const getChildren = (snapshot) => {
    if (!snapshot.exists()) { return []; }
    let value = snapshot.val();
    if (value instanceof Array) {
        return new Array(value.length).map((v,i) => i);
    }
    if (typeof value === "object") {
        return Object.keys(value);
    }
    return [];
};

class DataSnapshot {

    /**
     * 
     * @param {DataReference} ref 
     * @param {any} value 
     */
    constructor(ref, value, isRemoved = false, prevValue) {
        this.ref = ref;
        this.val = () => { return value; };
        this.previous = () => { return prevValue; }
        this.exists = () => { 
            if (isRemoved) { return false; } 
            return value !== null && typeof value !== "undefined"; 
        }
    }
    
    /**
     * Gets a new snapshot for a child node
     * @param {string} path child key or path
     * @returns {DataSnapshot}
     */
    child(path) {
        // Create new snapshot for child data
        let child = getChild(this, path);
        return new DataSnapshot(this.ref.child(path), child);
    }

    /**
     * Checks if the snapshot's value has a child with the given key or path
     * @param {string} path child key or path
     * @returns {boolean}
     */
    hasChild(path) {
        return getChild(this, path) !== null;
    }

    /**
     * Indicates whether the the snapshot's value has any child nodes
     * @returns {boolean}
     */
    hasChildren() {
        return getChildren(this).length > 0;
    }

    /**
     * The number of child nodes in this snapshot
     * @returns {number}
     */
    numChildren() {
        return getChildren(this).length;          
    }

    /**
     * Runs a callback function for each child node in this snapshot until the callback returns false
     * @param {(child: DataSnapshot) => boolean} callback function that is called with a snapshot of each child node in this snapshot. Must return a boolean value that indicates whether to continue iterating or not.
     * @returns {void}
     */
    forEach(callback) {
        const value = this.val();
        return getChildren(this).every((key, i) => {
            const snap = new DataSnapshot(this.ref.child(key), value[key]); 
            return callback(snap);
        });
    }

    /**
     * @type {string|number}
     */
    get key() { return this.ref.key; }

    // /**
    //  * Convenience method to update this snapshot's value AND commit the changes to the database
    //  * @param {object} updates 
    //  */
    // update(updates) {
    //     return this.ref.update(updates)
    //     .then(ref => {
    //         const isRemoved = updates === null;
    //         let value = this.val();
    //         if (!isRemoved && typeof updates === 'object' && typeof value === 'object') {
    //             Object.assign(value, updates);
    //         }
    //         else {
    //             value = updates;
    //         }
    //         this.val = () => { return value; };
    //         this.exists = () => {
    //             return value !== null && typeof value !== "undefined"; 
    //         }
    //         return this;
    //     });
    // }
}

module.exports = { DataSnapshot };
},{"./data-reference":155,"./path-info":160}],157:[function(require,module,exports){
class DebugLogger {
    constructor(level = "log", prefix = '') {
        this.prefix = prefix;
        this.setLevel(level);
    }
    setLevel(level) {
        const prefix = this.prefix ? this.prefix : '';
        this.level = level;
        this.verbose = ["verbose"].includes(level) ? prefix ? console.log.bind(console, prefix) : console.log.bind(console) : () => {};
        this.log = ["verbose", "log"].includes(level) ? prefix ? console.log.bind(console, prefix) : console.log.bind(console) : () => {};
        this.warn = ["verbose", "log", "warn"].includes(level) ? prefix ? console.warn.bind(console, prefix) : console.warn.bind(console) : () => {};
        this.error = ["verbose", "log", "warn", "error"].includes(level) ? prefix ? console.error.bind(console, prefix) : console.error.bind(console) : () => {};
        this.write = console.log.bind(console);
    }
}

module.exports = DebugLogger;
},{}],158:[function(require,module,exports){
const cuid = require('cuid');
// const uuid62 = require('uuid62');

class ID {
    static generate() {
        // Could also use https://www.npmjs.com/package/pushid for Firebase style 20 char id's
        return cuid().slice(1); // Cuts off the always leading 'c'
        // return uuid62.v1();
    }
}

module.exports = { ID };
},{"cuid":46}],159:[function(require,module,exports){
const { AceBaseBase, AceBaseSettings } = require('./acebase-base');
const { Api } = require('./api');
const { DataReference, DataReferenceQuery, DataRetrievalOptions, QueryDataRetrievalOptions } = require('./data-reference');
const { DataSnapshot } = require('./data-snapshot');
const DebugLogger = require('./debug');
const { ID } = require('./id');
const { PathReference } = require('./path-reference');
const { EventStream, EventPublisher, EventSubscription } = require('./subscription');
const Transport = require('./transport');
const { TypeMappings, TypeMappingOptions } = require('./type-mappings');
const Utils = require('./utils');
const { PathInfo } = require('./path-info');
const ascii85 = require('./ascii85');
const { SimpleCache } = require('./simple-cache');
const { proxyAccess } = require('./data-proxy');

module.exports = {
    AceBaseBase, AceBaseSettings,
    Api,
    DataReference, DataReferenceQuery, DataRetrievalOptions, QueryDataRetrievalOptions,
    DataSnapshot,
    DebugLogger,
    ID,
    PathReference,
    EventStream, EventPublisher, EventSubscription,
    Transport,
    TypeMappings, TypeMappingOptions,
    Utils,
    PathInfo,
    ascii85,
    SimpleCache,
    proxyAccess
};
},{"./acebase-base":151,"./api":152,"./ascii85":153,"./data-proxy":154,"./data-reference":155,"./data-snapshot":156,"./debug":157,"./id":158,"./path-info":160,"./path-reference":161,"./simple-cache":162,"./subscription":163,"./transport":164,"./type-mappings":165,"./utils":166}],160:[function(require,module,exports){
/**
 * 
 * @param {string} path 
 * @returns {Array<string|number>}
 */
function getPathKeys(path) {
    path = path.replace(/^\//, ""); // Remove leading slash
    if (path.length === 0) { return []; }
    let keys = path.replace(/\[/g, "/[").split("/");
    keys.forEach((key, index) => {
        if (key.startsWith("[")) { 
            keys[index] = parseInt(key.substr(1, key.length - 2)); 
        }
    });
    return keys;
}

function getPathInfo(path) {
    path = path.replace(/^\//, ""); // Remove leading slash
    if (path.length === 0) {
        return { parent: null, key: "" };
    }
    const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("["));
    const parentPath = i < 0 ? "" : path.substr(0, i);
    let key = i < 0 ? path : path.substr(i);
    if (key.startsWith("[")) { 
        key = parseInt(key.substr(1, key.length - 2)); 
    }
    else if (key.startsWith("/")) {
        key = key.substr(1); // Chop off leading slash
    }
    if (parentPath === path) {
        parentPath = null;
    }
    return {
        parent: parentPath,
        key
    };
}

/**
 * 
 * @param {string} path 
 * @param {string|number} key 
 * @returns {string}
 */
function getChildPath(path, key) {
    path = path.replace(/^\//, ""); // Remove leading slash
    key = typeof key === "string" ? key.replace(/^\//, "") : key; // Remove leading slash
    if (path.length === 0) {
        if (typeof key === "number") { throw new TypeError("Cannot add array index to root path!"); }
        return key;
    }
    if (typeof key === "string" && key.length === 0) {
        return path;
    }
    if (typeof key === "number") {
        return `${path}[${key}]`;
    }
    return `${path}/${key}`;
}
//const _pathVariableRegex =  /^\$(\{[a-z0-9]+\})$/i;

class PathInfo {
    /** @returns {PathInfo} */
    static get(path) {
        return new PathInfo(path);
    }

    /** @returns {string} */
    static getChildPath(path, childKey) {
        return getChildPath(path, childKey);
    }

    /** @returns {Array<string|number>} */
    static getPathKeys(path) {
        return getPathKeys(path);
    }

    /**
     * @param {string} path 
     */
    constructor(path) {
        this.path = path;
    }

    /** @type {string|number} */
    get key() {
        return getPathInfo(this.path).key;
    }

    /** @type {string} */
    get parentPath() {
        return getPathInfo(this.path).parent;
    }

    /** 
     * @param {string|number} childKey
     * @returns {string} 
     * */
    childPath(childKey) {
        return getChildPath(`${this.path}`, childKey);
    }

    /** @returns {Array<string|number>} */
    get pathKeys() {
        return getPathKeys(this.path);
    }

    // /**
    //  * If varPath contains variables or wildcards, it will return them with the values found in fullPath
    //  * @param {string} varPath 
    //  * @param {string} fullPath 
    //  * @returns {Array<{ name?: string, value: string|number }>}
    //  * @example
    //  * PathInfo.extractVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === [
    //  *  { name: '$uid', value: 'ewout' },
    //  *  { name: '$postid', value: 'post1' }
    //  * ];
    //  * 
    //  * PathInfo.extractVariables('users/*\/posts/*\/$property', 'users/ewout/posts/post1/title') === [
    //  *  { value: 'ewout' },
    //  *  { value: 'post1' },
    //  *  { name: '$property', value: 'title' }
    //  * ]
    //  */
    // static extractVariables(varPath, fullPath) {
    //     if (varPath.indexOf('*') < 0 && varPath.indexOf('$') < 0) { 
    //         return []; 
    //     }
    //     // if (!this.equals(fullPath)) {
    //     //     throw new Error(`path does not match with the path of this PathInfo instance: info.equals(path) === false!`)
    //     // }
    //     const keys = getPathKeys(varPath);
    //     const pathKeys = getPathKeys(fullPath);
    //     const variables = [];
    //     keys.forEach((key, index) => {
    //         const pathKey = pathKeys[index];
    //         if (key === '*') {
    //             variables.push({ value: pathKey });
    //         }
    //         else if (typeof key === 'string' && key[0] === '$') {
    //             variables.push({ name: key, value: pathKey });
    //         }
    //     });
    //     return variables;
    // }

    /**
     * If varPath contains variables or wildcards, it will return them with the values found in fullPath
     * @param {string} varPath path containing variables such as * and $name
     * @param {string} fullPath real path to a node
     * @returns {{ [index: number]: string|number, [variable: string]: string|number }} returns an array-like object with all variable values. All named variables are also set on the array by their name (eg vars.uid and vars.$uid)
     * @example
     * PathInfo.extractVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  uid: 'ewout', // or $uid
     *  postid: 'post1' // or $postid
     * };
     * 
     * PathInfo.extractVariables('users/*\/posts/*\/$property', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  2: 'title',
     *  property: 'title' // or $property
     * };
     * 
     * PathInfo.extractVariables('users/$user/friends[*]/$friend', 'users/dora/friends[4]/diego') === {
     *  0: 'dora',
     *  1: 4,
     *  2: 'diego',
     *  user: 'dora', // or $user
     *  friend: 'diego' // or $friend
     * };
    */
    static extractVariables(varPath, fullPath) {
        if (!varPath.includes('*') && !varPath.includes('$')) { 
            return []; 
        }
        // if (!this.equals(fullPath)) {
        //     throw new Error(`path does not match with the path of this PathInfo instance: info.equals(path) === false!`)
        // }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        let count = 0;
        const variables = {
            get length() { return count; }
        };
        keys.forEach((key, index) => {
            const pathKey = pathKeys[index];
            if (key === '*') {
                variables[count++] = pathKey;
            }
            else if (typeof key === 'string' && key[0] === '$') {
                variables[count++] = pathKey;
                // Set the $variable property
                variables[key] = pathKey;
                // Set friendly property name (without $)
                const varName = key.slice(1);
                if (typeof variables[varName] === 'undefined') {
                    variables[varName] = pathKey;
                }
            }
        });
        return variables;
    }

    /**
     * If varPath contains variables or wildcards, it will return a path with the variables replaced by the keys found in fullPath.
     * @param {string} varPath 
     * @param {string} fullPath 
     * @returns {string}
     * @example
     * PathInfo.fillVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === 'users/ewout/posts/post1'
     */
    static fillVariables(varPath, fullPath) {
        if (varPath.indexOf('*') < 0 && varPath.indexOf('$') < 0) { 
            return varPath; 
        }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        let merged = keys.map((key, index) => {
            if (key === pathKeys[index] || index >= pathKeys.length) {
                return key;
            }
            else if (typeof key === 'string' && (key === '*' || key[0] === '$')) {
                return pathKeys[index];
            }
            else {
                throw new Error(`Path "${fullPath}" cannot be used to fill variables of path "${this.path}" because they do not match`);
            }
        });
        let mergedPath = '';
        merged.forEach(key => {
            if (typeof key === 'number') { 
                mergedPath += `[${key}]`; 
            }
            else { 
                if (mergedPath.length > 0) { mergedPath += '/'; }
                mergedPath += key;
            }
        });
        return mergedPath;
    }

    /**
     * Replaces all variables in a path with the values in the vars argument
     * @param {string} varPath path containing variables
     * @param {object} vars variables object such as one gotten from PathInfo.extractVariables
     */
    static fillVariables2(varPath, vars) {
        if (typeof vars !== 'object' || Object.keys(vars).length === 0) {
            return varPath; // Nothing to fill
        }
        let pathKeys = getPathKeys(varPath);
        let n = 0;
        const targetPath = pathKeys.reduce((path, key) => { 
            if (key === '*' || key.startsWith('$')) {
                key = vars[n++];
            }
            if (typeof key === 'number') {
                return `${path}[${key}]`;
            }
            else {
                return `${path}/${key}`;
            }
        }, '');
        return targetPath;
    }

    /**
     * Checks if a given path matches this path, eg "posts/*\/title" matches "posts/12344/title" and "users/123/name" matches "users/$uid/name"
     * @param {string} otherPath 
     * @returns {boolean}
     */
    equals(otherPath) {
        if (this.path === otherPath) { return true; } // they are identical
        const keys = this.pathKeys;
        const otherKeys = getPathKeys(otherPath);
        if (keys.length !== otherKeys.length) { return false; }
        return keys.every((key, index) => {
            const otherKey = otherKeys[index];
            return otherKey === key 
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" ||  key[0] === '$'));
        });
    }

    /**
     * Checks if a given path is an ancestor, eg "posts" is an ancestor of "posts/12344/title"
     * @param {string} otherPath 
     * @returns {boolean}
     */
    isAncestorOf(descendantPath) {
        if (descendantPath === '' || this.path === descendantPath) { return false; }
        if (this.path === '') { return true; }
        const ancestorKeys = this.pathKeys;
        const descendantKeys = getPathKeys(descendantPath);
        if (ancestorKeys.length >= descendantKeys.length) { return false; }
        return ancestorKeys.every((key, index) => {
            const otherKey = descendantKeys[index];
            return otherKey === key 
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" ||  key[0] === '$'));
        });
    }

    /**
     * Checks if a given path is a descendant, eg "posts/1234/title" is a descendant of "posts"
     * @param {string} otherPath 
     * @returns {boolean}
     */
    isDescendantOf(ancestorPath) {
        if (this.path === '' || this.path === ancestorPath) { return false; }
        if (ancestorPath === '') { return true; }
        const ancestorKeys = getPathKeys(ancestorPath);
        const descendantKeys = this.pathKeys;
        if (ancestorKeys.length >= descendantKeys.length) { return false; }
        return ancestorKeys.every((key, index) => {
            const otherKey = descendantKeys[index];
            return otherKey === key 
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" ||  key[0] === '$'));
        });
    }

    /**
     * Checks if the other path is on the same trail as this path. Paths on the same trail if they share a
     * common ancestor. Eg: "posts" is on the trail of "posts/1234/title" and vice versa.
     * @param {string} otherPath 
     */
    isOnTrailOf(otherPath) {
        if (this.path.length === 0 || otherPath.length === 0) { return true; }
        if (this.path === otherPath) { return true; }
        const otherKeys = getPathKeys(otherPath);
        return this.pathKeys.every((key, index) => {
            if (index >= otherKeys.length) { return true; }
            const otherKey = otherKeys[index];
            return otherKey === key 
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" ||  key[0] === '$'));
        });
    }

    /**
     * Checks if a given path is a direct child, eg "posts/1234/title" is a child of "posts/1234"
     * @param {string} otherPath 
     * @returns {boolean}
     */
    isChildOf(otherPath) {
        if (this.path === '') { return false; } // If our path is the root, it's nobody's child...
        const parentInfo = PathInfo.get(this.parentPath);
        return parentInfo.equals(otherPath);
    }

    /**
     * Checks if a given path is its parent, eg "posts/1234" is the parent of "posts/1234/title"
     * @param {string} otherPath 
     * @returns {boolean}
     */
    isParentOf(otherPath) {
        if (otherPath === '') { return false; } // If the other path is the root, this path cannot be its parent...
        const parentInfo = PathInfo.get(PathInfo.get(otherPath).parentPath);
        return parentInfo.equals(this.path);
    }
}

module.exports = { getPathInfo, getChildPath, getPathKeys, PathInfo };
},{}],161:[function(require,module,exports){
class PathReference {
    /**
     * Creates a reference to a path that can be stored in the database. Use this to create cross-references to other data in your database
     * @param {string} path
     */
    constructor(path) {
        this.path = path;
    }
}
module.exports = { PathReference };
},{}],162:[function(require,module,exports){
class SimpleCache {
    constructor(expirySeconds) {
        this.expirySeconds = expirySeconds;
        this.cache = new Map();
        setInterval(() => { this.cleanUp(); }, 60 * 1000); // Cleanup every minute
    }
    set(key, value) {
        this.cache.set(key, { value, expires: Date.now() + (this.expirySeconds * 1000) })
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry || entry.expires <= Date.now()) { return null; }
        return entry.value;
    }
    remove(key) {
        this.cache.delete(key);
    }
    cleanUp() {
        const now = Date.now();
        this.cache.forEach((entry, key) => {
            if (entry.expires <= now) { this.cache.delete(key); }
        });
    }
}

module.exports = { SimpleCache };
},{}],163:[function(require,module,exports){
class EventSubscription {
    /**
     * 
     * @param {() => void} stop function that stops the subscription from receiving future events
     * @param {(callback?: () => void) => Promise<void>} activated function that runs optional callback when subscription is activated, and returns a promise that resolves once activated
     */
    constructor(stop) {
        this.stop = stop;
        this._internal = { 
            state: 'init',
            cancelReason: undefined,
            /** @type {{ callback?: (activated: boolean, cancelReason?: string) => void, resolve?: () => void, reject?: (reason: any) => void}[]} */
            activatePromises: []
        };
    }

    /**
     * Notifies when subscription is activated or canceled
     * @param {callback?: (activated: boolean, cancelReason?: string) => void} [callback] optional callback when subscription is activated or canceled
     * @returns {Promise<void>} returns a promise that resolves once activated, or rejects when it is denied (and no callback was supplied)
     */
    activated(callback = undefined) {
        if (callback) {
            this._internal.activatePromises.push({ callback });
            if (this._internal.state === 'active') {
                callback(true);
            }
            else if (this._internal.state === 'canceled') {
                callback(false, this._internal.cancelReason);
            }
        }
        // Changed behaviour: now also returns a Promise when the callback is used.
        // This allows for 1 activated call to both handle: first activation result, 
        // and any future events using the callback
        return new Promise((resolve, reject) => { 
            if (this._internal.state === 'active') { 
                return resolve(); 
            }
            else if (this._internal.state === 'canceled' && !callback) { 
                return reject(new Error(this._internal.cancelReason)); 
            }
            this._internal.activatePromises.push({ 
                resolve, 
                reject: callback ? () => {} : reject // Don't reject when callback is used: let callback handle this (prevents UnhandledPromiseRejection if only callback is used)
            });
        });
    }

    _setActivationState(activated, cancelReason) {
        this._internal.cancelReason = cancelReason;
        this._internal.state = activated ? 'active' : 'canceled';
        while (this._internal.activatePromises.length > 0) {
            const p = this._internal.activatePromises.shift();
            if (activated) { 
                p.callback && p.callback(true); 
                p.resolve && p.resolve();
            }
            else { 
                p.callback && p.callback(false, cancelReason);
                p.reject && p.reject(cancelReason); 
            }
        }
    }
}

class EventPublisher {
    /**
     * 
     * @param {(val: any) => boolean} publish function that publishes a new value to subscribers, return if there are any active subscribers
     * @param {() => void} start function that notifies subscribers their subscription is activated
     * @param {(reason: string) => void} cancel function that notifies subscribers their subscription has been canceled, removes all subscriptions
     */
    constructor(publish, start, cancel) {
        this.publish = publish;
        this.start = start;
        this.cancel = cancel;
    }
}

class EventStream {

    /**
     * 
     * @param {(eventPublisher: EventPublisher) => void} eventPublisherCallback 
     */
    constructor(eventPublisherCallback) {
        const subscribers = [];
        let noMoreSubscribersCallback;
        let activationState;
        const _stoppedState = 'stopped (no more subscribers)';

        /**
         * Subscribe to new value events in the stream
         * @param {function} callback | function(val) to run once a new value is published
         * @param {(activated: boolean, cancelReason?: string) => void} activationCallback callback that notifies activation or cancelation of the subscription by the publisher. 
         * @returns {EventSubscription} returns a subscription to the requested event
         */
        this.subscribe = (callback, activationCallback) => {
            if (typeof callback !== "function") {
                throw new TypeError("callback must be a function");
            }
            else if (activationState === _stoppedState) {
                throw new Error("stream can't be used anymore because all subscribers were stopped");
            }

            const sub = {
                callback,
                activationCallback: function(activated, cancelReason) {
                    activationCallback && activationCallback(activated, cancelReason);
                    this.subscription._setActivationState(activated, cancelReason);
                },
                // stop() {
                //     subscribers.splice(subscribers.indexOf(this), 1);
                // },
                subscription: new EventSubscription(function stop() {
                    subscribers.splice(subscribers.indexOf(this), 1);
                    checkActiveSubscribers();
                })
            };
            subscribers.push(sub);

            if (typeof activationState !== 'undefined') {
                if (activationState === true) {
                    activationCallback && activationCallback(true);
                    sub.subscription._setActivationState(true);
                }
                else if (typeof activationState === 'string') {
                    activationCallback && activationCallback(false, activationState);
                    sub.subscription._setActivationState(false, activationState);
                }
            }
            return sub.subscription;
        };

        const checkActiveSubscribers = () => {
            if (subscribers.length === 0) {
                noMoreSubscribersCallback && noMoreSubscribersCallback();
                activationState = _stoppedState;
            }
        };

        /**
         * Stops monitoring new value events
         * @param {function} callback | (optional) specific callback to remove. Will remove all callbacks when omitted
         */
        this.unsubscribe = (callback = undefined) => {
            const remove = callback 
                ? subscribers.filter(sub => sub.callback === callback)
                : subscribers;
            remove.forEach(sub => {
                const i = subscribers.indexOf(sub);
                subscribers.splice(i, 1);
            });
            checkActiveSubscribers();
        };

        this.stop = () => {
            // Stop (remove) all subscriptions
            subscribers.splice(0);
            checkActiveSubscribers();
        }

        /**
         * For publishing side: adds a value that will trigger callbacks to all subscribers
         * @param {any} val
         * @returns {boolean} returns whether there are subscribers left
         */
        const publish = (val) => {
            subscribers.forEach(sub => {
                try {
                    sub.callback(val);
                }
                catch(err) {
                    console.error(`Error running subscriber callback: ${err.message}`);
                }
            });
            return subscribers.length > 0;
        };

        /**
         * For publishing side: let subscribers know their subscription is activated. Should be called only once
         */
        const start = (allSubscriptionsStoppedCallback) => {
            activationState = true;
            noMoreSubscribersCallback = allSubscriptionsStoppedCallback;
            subscribers.forEach(sub => {
                sub.activationCallback && sub.activationCallback(true);
            });
        };

        /**
         * For publishing side: let subscribers know their subscription has been canceled. Should be called only once
         */
        const cancel = (reason) => {
            activationState = reason;
            subscribers.forEach(sub => {
                sub.activationCallback && sub.activationCallback(false, reason || new Error('unknown reason'));
            });
            subscribers.splice(); // Clear all
        }

        const publisher = new EventPublisher(publish, start, cancel);
        eventPublisherCallback(publisher);
    }
}

module.exports = { EventStream, EventPublisher, EventSubscription };
},{}],164:[function(require,module,exports){
const { PathReference } = require('./path-reference');
//const { DataReference } = require('./data-reference');
const { cloneObject } = require('./utils');
const ascii85 = require('./ascii85');

module.exports = {
    deserialize(data) {
        if (data.map === null || typeof data.map === "undefined") {
            return data.val;
        }
        const deserializeValue = (type, val) => {
            if (type === "date") {
                // Date was serialized as a string (UTC)
                return new Date(val);
            }
            else if (type === "binary") {
                // ascii85 encoded binary data
                return ascii85.decode(val);
            }
            else if (type === "reference") {
                return new PathReference(val);
            }
            else if (type === "regexp") {
                return new RegExp(val.pattern, val.flags);
            }
            return val;          
        };
        if (typeof data.map === "string") {
            // Single value
            return deserializeValue(data.map, data.val);
        }
        Object.keys(data.map).forEach(path => {
            const type = data.map[path];
            const keys = path.replace(/\[/g, "/[").split("/");
            keys.forEach((key, index) => {
                if (key.startsWith("[")) { 
                    keys[index] = parseInt(key.substr(1, key.length - 2)); 
                }
            });
            let parent = data;
            let key = "val";
            let val = data.val;
            keys.forEach(k => {
                key = k;
                parent = val;
                val = val[key]; // If an error occurs here, there's something wrong with the calling code...
            });
            parent[key] = deserializeValue(type, val);
        });

        return data.val;
    },

    serialize(obj) {
        // Recursively find dates and binary data
        if (obj === null || typeof obj !== "object" || obj instanceof Date || obj instanceof ArrayBuffer || obj instanceof PathReference) {
            // Single value
            const ser = this.serialize({ value: obj });
            return {
                map: ser.map.value,
                val: ser.val.value
            };
        }
        obj = cloneObject(obj); // Make sure we don't alter the original object
        const process = (obj, mappings, prefix) => {
            Object.keys(obj).forEach(key => {
                const val = obj[key];
                const path = prefix.length === 0 ? key : `${prefix}/${key}`;
                if (val instanceof Date) {
                    // serialize date to UTC string
                    obj[key] = val.toISOString();
                    mappings[path] = "date";
                }
                else if (val instanceof ArrayBuffer) {
                    // Serialize binary data with ascii85
                    obj[key] = ascii85.encode(val); //ascii85.encode(Buffer.from(val)).toString();
                    mappings[path] = "binary";
                }
                else if (val instanceof PathReference) {
                    obj[key] = val.path;
                    mappings[path] = "reference";
                }
                else if (val instanceof RegExp) {
                    // Queries using the 'matches' filter with a regular expression can now also be used on remote db's
                    obj[key] = { pattern: val.source, flags: val.flags };
                    mappings[path] = "regexp";
                }
                else if (typeof val === "object" && val !== null) {
                    process(val, mappings, path);
                }
            });
        };
        const mappings = {};
        process(obj, mappings, "");
        return {
            map: mappings,
            val: obj
        };
    }        
};
},{"./ascii85":153,"./path-reference":161,"./utils":166}],165:[function(require,module,exports){
const { cloneObject } = require('./utils');
const { PathInfo } = require('./path-info');
const { AceBaseBase } = require('./acebase-base');
const { DataReference } = require('./data-reference');
const { DataSnapshot } = require('./data-snapshot');

/**
 * (for internal use) - gets the mapping set for a specific path
 * @param {TypeMappings} mappings
 * @param {string} path 
 */
const get = (mappings, path) => {
    // path points to the mapped (object container) location
    path = path.replace(/^\/|\/$/g, ''); // trim slashes
    // const keys = path.length > 0 ? path.split("/") : [];
    const keys = PathInfo.getPathKeys(path);
    const mappedPath = Object.keys(mappings).find(mpath => {
        // const mkeys = mpath.length > 0 ? mpath.split("/") : [];
        const mkeys = PathInfo.getPathKeys(mpath);
        if (mkeys.length !== keys.length) {
            return false; // Can't be a match
        }
        return mkeys.every((mkey, index) => {
            if (mkey === '*' || mkey[0] === '$') {
                return true; // wildcard
            }
            return mkey === keys[index];
        });
    });
    const mapping = mappings[mappedPath];
    return mapping;
};

/**
 * (for internal use) - gets the mapping set for a specific path's parent
 * @param {TypeMappings} mappings
 * @param {string} path 
 */
const map = (mappings, path) => {
   // path points to the object location, it's parent should have the mapping
//    path = path.replace(/^\/|\/$/g, ""); // trim slashes
//    const targetPath = path.substring(0, path.lastIndexOf("/"));
    const targetPath = PathInfo.get(path).parentPath;
    if (targetPath === null) { return; }
    return get(mappings, targetPath);
};

/**
 * (for internal use) - gets all mappings set for a specific path and all subnodes
 * @param {TypeMappings} mappings
 * @param {string} entryPath 
 * @returns {Array<object>} returns array of all matched mappings in path
 */
const mapDeep = (mappings, entryPath) => {
    // returns mapping for this node, and all mappings for nested nodes
    // entryPath: "users/ewout"
    // mappingPath: "users"
    // mappingPath: "users/*/posts"
    entryPath = entryPath.replace(/^\/|\/$/g, ''); // trim slashes

    // Start with current path's parent node
    const pathInfo = PathInfo.get(entryPath);
    const startPath = pathInfo.parentPath;
    const keys = startPath ? PathInfo.getPathKeys(startPath) : [];

    // Every path that starts with startPath, is a match
    const matches = Object.keys(mappings).reduce((m, mpath) => {

        //const mkeys = mpath.length > 0 ? mpath.split("/") : [];
        const mkeys = PathInfo.getPathKeys(mpath);
        if (mkeys.length < keys.length) {
            return m; // Can't be a match
        }
        let isMatch = true;
        if (keys.length === 0 && startPath !== null) {
            // Only match first node's children if mapping pattern is "*" or "$variable"
            isMatch = mkeys.length === 1 && (mkeys[0] === '*' || mkeys[0][0] === '$');
        }
        else {
            mkeys.every((mkey, index) => {
                if (index >= keys.length) { 
                    return false; // stop .every loop
                } 
                else if (mkey === '*' || mkey[0] === '$' || mkey === keys[index]) {
                    return true; // continue .every loop
                }
                else {
                    isMatch = false;
                    return false; // stop .every loop
                }
            });
        }

        if (isMatch) { 
            const mapping = mappings[mpath];
            m.push({ path: mpath, type: mapping }); 
        }

        return m;
    }, []);
    return matches;
};

/**
 * (for internal use) - serializes or deserializes an object using type mappings
 * @param {AceBaseBase} db
 * @param {TypeMappings} mappings
 * @param {string} path 
 * @param {any} obj
 * @param {string} action | "serialize" or "deserialize"
 * @returns {any} returns the (de)serialized value
 */
const process = (db, mappings, path, obj, action) => {
    if (obj === null || typeof obj !== 'object') { 
        return obj; 
    }
    const keys = PathInfo.getPathKeys(path); // path.length > 0 ? path.split("/") : [];
    const m = mapDeep(mappings, path);
    const changes = [];
    m.sort((a,b) => PathInfo.getPathKeys(a.path).length > PathInfo.getPathKeys(b.path).length ? -1 : 1); // Deepest paths first
    m.forEach(mapping => {
        const mkeys = PathInfo.getPathKeys(mapping.path); //mapping.path.length > 0 ? mapping.path.split("/") : [];
        mkeys.push('*');
        const mTrailKeys = mkeys.slice(keys.length);
        if (mTrailKeys.length === 0) {
            const vars = PathInfo.extractVariables(mapping.path, path);
            const ref = new DataReference(db, path, vars);
            if (action === 'serialize') {
                // serialize this object
                obj = mapping.type.serialize(obj, ref);
            }
            else if (action === 'deserialize') {
                // deserialize this object
                const snap = new DataSnapshot(ref, obj);
                obj = mapping.type.deserialize(snap);
            }
            return;
        }

        // Find all nested objects at this trail path
        const process = (parentPath, parent, keys) => {
            if (obj === null || typeof obj !== 'object') { 
                return obj; 
            }
            const key = keys[0];
            let children = [];
            if (key === '*' || key[0] === '$') {
                // Include all children
                if (parent instanceof Array) {
                    children = parent.map((val, index) => ({ key: index, val }));
                }
                else {
                    children = Object.keys(parent).map(k => ({ key: k, val: parent[k] }));
                }
            }
            else {
                // Get the 1 child
                const child = parent[key];
                if (typeof child === 'object') {
                    children.push({ key, val: child });
                }
            }
            children.forEach(child => { 
                const childPath = PathInfo.getChildPath(parentPath, child.key);
                const vars = PathInfo.extractVariables(mapping.path, childPath);
                const ref = new DataReference(db, childPath, vars);

                if (keys.length === 1) {
                    // TODO: this alters the existing object, we must build our own copy!
                    if (action === 'serialize') {
                        // serialize this object
                        changes.push({ parent, key: child.key, original: parent[child.key] });
                        parent[child.key] = mapping.type.serialize(child.val, ref);
                    }
                    else if (action === 'deserialize') {
                        // deserialize this object
                        const snap = new DataSnapshot(ref, child.val);
                        parent[child.key] = mapping.type.deserialize(snap);
                    }
                }
                else {
                    // Dig deeper
                    process(childPath, child.val, keys.slice(1)); 
                }
            });
        };
        process(path, obj, mTrailKeys);
    });
    if (action === "serialize") {
        // Clone this serialized object so any types that remained
        // will become plain objects without functions, and we can restore
        // the original object's values if any mappings were processed.
        // This will also prevent circular references
        obj = cloneObject(obj);

        if (changes.length > 0) {
            // Restore the changes made to the original object
            changes.forEach(change => {
                change.parent[change.key] = change.original;
            });
        }
    }
    return obj;
};

class TypeMappingOptions {
    constructor(options) {
        if (!options) { 
            options = {}; 
        }
        /** @type {string | ((ref: DataReference, typedObj: any) => any)} */
        this.serializer = options.serializer;
        /** @type {string | ((snap: DataSnapshot) => any)} */
        this.creator = options.creator;
    }
}

const _mappings = Symbol("mappings");
class TypeMappings {
    /**
     * 
     * @param {AceBaseBase} db 
     */
    constructor(db) {
        //this._mappings = {};
        this.db = db;
        this[_mappings] = {};
    }

    get mappings() { return this[_mappings]; }
    map(path) {
        return map(this[_mappings], path);
    }

    /**
     * Maps objects that are stored in a specific path to a class, so they can automatically be 
     * serialized when stored to, and deserialized (instantiated) when loaded from the database.
     * @param {string} path path to an object container, eg "users" or "users/*\/posts"
     * @param {(obj: any) => object} type class to bind all child objects of path to
     * @param {TypeMappingOptions} [options] (optional) You can specify the functions to use to 
     * serialize and/or instantiate your class. If you do not specificy a creator (constructor) method, 
     * AceBase will call YourClass.create(obj, ref) method if it exists, or execute: new YourClass(obj, ref).
     * If you do not specifiy a serializer method, AceBase will call YourClass.prototype.serialize(ref) if it
     * exists, or tries storing your object's fields unaltered. NOTE: 'this' in your creator function will point 
     * to YourClass, and 'this' in your serializer function will point to the instance of YourClass.
     */
    bind(path, type, options = {}) {
        // Maps objects that are stored in a specific path to a constructor method,
        // so they are automatically deserialized
        if (typeof path !== "string") {
            throw new TypeError("path must be a string");
        }
        if (typeof type !== "function") {
            throw new TypeError("constructor must be a function");
        }

        if (typeof options.serializer === 'undefined') {
            // if (typeof type.prototype.serialize === 'function') {
            //     // Use .serialize instance method
            //     options.serializer = type.prototype.serialize;
            // }

            // Use object's serialize method upon serialization (if available)
        }
        else if (typeof options.serializer === 'string') {
            if (typeof type.prototype[options.serializer] === 'function') {
                options.serializer = type.prototype[options.serializer];
            }
            else {
                throw new TypeError(`${type.name}.prototype.${options.serializer} is not a function, cannot use it as serializer`)
            }
        }
        else if (typeof options.serializer !== 'function') {
            throw new TypeError(`serializer for class ${type.name} must be a function, or the name of a prototype method`);
        }

        if (typeof options.creator === 'undefined') {
            if (typeof type.create === 'function') {
                // Use static .create as creator method
                options.creator = type.create;
            }
        }
        else if (typeof options.creator === 'string') {
            if (typeof type[options.creator] === 'function') {
                options.creator = type[options.creator];
            }
            else {
                throw new TypeError(`${type.name}.${options.creator} is not a function, cannot use it as creator`)
            }
        }
        else if (typeof options.creator !== 'function') {
            throw new TypeError(`creator for class ${type.name} must be a function, or the name of a static method`);
        }

        path = path.replace(/^\/|\/$/g, ""); // trim slashes
        this[_mappings][path] = {
            db: this.db,
            type,
            creator: options.creator,
            serializer: options.serializer,
            deserialize(snap) {
                // run constructor method
                let obj;
                if (this.creator) {
                    obj = this.creator.call(this.type, snap)
                }
                else {
                    obj = new this.type(snap);
                }
                return obj;
            },
            serialize(obj, ref) {
                if (this.serializer) {
                    obj = this.serializer.call(obj, ref, obj);
                }
                else if (obj && typeof obj.serialize === 'function') {
                    obj = obj.serialize(ref, obj);
                }
                return obj;
            }
        };
    }

    /**
     * Serializes any child in given object that has a type mapping
     * @param {string} path | path to the object's location
     * @param {object} obj | object to serialize
     */
    serialize(path, obj) {
        return process(this.db, this[_mappings], path, obj, "serialize");
    }

    /**
     * Deserialzes any child in given object that has a type mapping
     * @param {string} path | path to the object's location
     * @param {object} obj | object to deserialize
     */
    deserialize(path, obj) {
        return process(this.db, this[_mappings], path, obj, "deserialize");
    }
}

module.exports = {
    TypeMappings,
    TypeMappingOptions
}

},{"./acebase-base":151,"./data-reference":155,"./data-snapshot":156,"./path-info":160,"./utils":166}],166:[function(require,module,exports){
(function (Buffer){
const { PathReference } = require('./path-reference');

function numberToBytes(number) {
    const bytes = new Uint8Array(8);
    const view = new DataView(bytes.buffer);
    view.setFloat64(0, number);
    return new Array(...bytes);
}

function bytesToNumber(bytes) {
    //if (bytes.length !== 8) { throw "passed value must contain 8 bytes"; }
    if (bytes.length < 8) {
        throw new TypeError("must be 8 bytes");
        // // Pad with zeroes
        // let padding = new Uint8Array(8 - bytes.length);
        // for(let i = 0; i < padding.length; i++) { padding[i] = 0; }
        // bytes = concatTypedArrays(bytes, padding);
    }
    const bin = new Uint8Array(bytes);
    const view = new DataView(bin.buffer);
    const nr = view.getFloat64(0);
    return nr;
}

/**
 * Converts a string to a utf-8 encoded Uint8Array
 * @param {string} str 
 * @returns {Uint8Array}
 */
function encodeString(str) {
    if (typeof TextEncoder !== 'undefined') {
        // Modern browsers, Node.js v11.0.0+ (or v8.3.0+ with util.TextEncoder)
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }
    else if (typeof Buffer === 'function') {
        // Node.js
        const buf = Buffer.from(str, 'utf-8');
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    else {
        // Older browsers. Manually encode
        let arr = [];
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (code > 128) {
                // Attempt simple UTF-8 conversion. See https://en.wikipedia.org/wiki/UTF-8
                if ((code & 0xd800) === 0xd800) {
                    // code starts with 1101 10...: this is a 2-part utf-16 char code
                    const nextCode = str.charCodeAt(i+1);
                    if ((nextCode & 0xdc00) !== 0xdc00) {
                        // next code must start with 1101 11...
                        throw new Error('follow-up utf-16 character does not start with 0xDC00');
                    }
                    i++;
                    const p1 = code & 0x3ff; // Only use last 10 bits
                    const p2 = nextCode & 0x3ff;
                    // Create code point from these 2: (see https://en.wikipedia.org/wiki/UTF-16)
                    code = 0x10000 | (p1 << 10) | p2;
                }
                if (code < 2048) {
                    // Use 2 bytes for 11 bit value, first byte starts with 110xxxxx (0xc0), 2nd byte with 10xxxxxx (0x80)
                    const b1 = 0xc0 | ((code >> 6) & 0x1f); // 0xc0 = 11000000, 0x1f = 11111
                    const b2 = 0x80 | (code & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    arr.push(b1, b2);
                }
                else if (code < 65536) {
                    // Use 3 bytes for 16-bit value, bits per byte: 4, 6, 6
                    const b1 = 0xe0 | ((code >> 12) & 0xf); // 0xe0 = 11100000, 0xf = 1111
                    const b2 = 0x80 | ((code >> 6) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b3 = 0x80 | (code & 0x3f);
                    arr.push(b1, b2, b3);
                }
                else if (code < 2097152) {
                    // Use 4 bytes for 21-bit value, bits per byte: 3, 6, 6, 6
                    const b1 = 0xf0 | ((code >> 18) & 0x7); // 0xf0 = 11110000, 0x7 = 111
                    const b2 = 0x80 | ((code >> 12) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b3 = 0x80 | ((code >> 6) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b4 = 0x80 | (code & 0x3f);
                    arr.push(b1, b2, b3, b4);                    
                }
                else {
                    throw new Error(`Cannot convert character ${str.charAt(i)} (code ${code}) to utf-8`)
                }
            }
            else {
                arr.push(code < 128 ? code : 63); // 63 = ?
            }
        }
        return new Uint8Array(arr);
    }
}

/**
 * Converts a utf-8 encoded buffer to string
 * @param {ArrayBuffer|Buffer|Uint8Array|number[]} buffer 
 * @returns {string}
 */
function decodeString(buffer) {
    if (typeof TextDecoder !== 'undefined') {
        // Modern browsers, Node.js v11.0.0+ (or v8.3.0+ with util.TextDecoder)
        const decoder = new TextDecoder();
        if (buffer instanceof Uint8Array) {
            return decoder.decode(buffer);
        }
        const buf = Uint8Array.from(buffer);
        return decoder.decode(buf);
    }
    else if (typeof Buffer === 'function') {
        // Node.js
        if (buffer instanceof Buffer) { 
            return buffer.toString('utf-8'); 
        }
        else if (buffer instanceof Array) {
            const typedArray = Uint8Array.from(buffer);
            const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteOffset + typedArray.byteLength);
            return buf.toString('utf-8');
        }
        else if ('buffer' in buffer && buffer['buffer'] instanceof ArrayBuffer) {
            const buf = Buffer.from(buffer['buffer'], buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            return buf.toString('utf-8');
        }
        else {
            throw new Error(`Unsupported buffer argument`);
        }
    }
    else {
        // Older browsers. Manually decode!
        if (!(buffer instanceof Uint8Array) && 'buffer' in buffer && buffer['buffer'] instanceof ArrayBuffer) {
            // Convert TypedArray to Uint8Array
            buffer = new Uint8Array(buffer['buffer'], buffer.byteOffset, buffer.byteLength);
        }
        if (buffer instanceof Buffer || buffer instanceof Array || buffer instanceof Uint8Array) {
            let str = '';
            for (let i = 0; i < buffer.length; i++) {
                let code = buffer[i];
                if (code > 128) {
                    // Decode Unicode character
                    if ((code & 0xf0) === 0xf0) {
                        // 4 byte char
                        const b1 = code, b2 = buffer[i+1], b3 = buffer[i+2], b4 = buffer[i+3];
                        code = ((b1 & 0x7) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
                        i += 3;
                    }
                    else if ((code & 0xe0) === 0xe0) {
                        // 3 byte char
                        const b1 = code, b2 = buffer[i+1], b3 = buffer[i+2];
                        code = ((b1 & 0xf) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
                        i += 2;
                    }
                    else if ((code & 0xc0) === 0xc0) {
                        // 2 byte char
                        const b1 = code, b2 = buffer[i+1];
                        code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
                        i++;
                    }
                    else {
                        throw new Error(`invalid utf-8 data`);
                    }
                }
                if (code >= 65536) {
                    // Split into 2-part utf-16 char codes
                    code ^= 0x10000;
                    const p1 = 0xd800 | (code >> 10);
                    const p2 = 0xdc00 | (code & 0x3ff);
                    str += String.fromCharCode(p1);
                    str += String.fromCharCode(p2);
                }
                else {
                    str += String.fromCharCode(code);
                }
            }
            return str;
        }
        else {
            throw new Error(`Unsupported buffer argument`);
        }
    }
}

function concatTypedArrays(a, b) {
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
};

function cloneObject(original, stack) {
    const { DataSnapshot } = require('./data-snapshot'); // Don't move to top, because data-snapshot requires this script (utils)
    if (original instanceof DataSnapshot) {
        throw new TypeError(`Object to clone is a DataSnapshot (path "${original.ref.path}")`);
    }
    
    const checkAndFixTypedArray = obj => {
        if (obj !== null && typeof obj === 'object' 
            && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string' 
            && ['Buffer','Uint8Array','Int8Array','Uint16Array','Int16Array','Uint32Array','Int32Array','BigUint64Array','BigInt64Array'].includes(obj.constructor.name)) 
        {
            // FIX for typed array being converted to objects with numeric properties:
            // Convert Buffer or TypedArray to ArrayBuffer
            obj = obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength);
        }
        return obj;
    };
    original = checkAndFixTypedArray(original);

    if (typeof original !== "object" || original === null || original instanceof Date || original instanceof ArrayBuffer || original instanceof PathReference || original instanceof RegExp) {
        return original;
    }

    const cloneValue = (val) => {
        if (stack.indexOf(val) >= 0) {
            throw new ReferenceError(`object contains a circular reference`);
        }
        val = checkAndFixTypedArray(val);
        if (val === null || val instanceof Date || val instanceof ArrayBuffer || val instanceof PathReference || val instanceof RegExp) { // || val instanceof ID
            return val;
        }
        else if (val instanceof Array) {
            stack.push(val);
            val = val.map(item => cloneValue(item));
            stack.pop();
            return val;
        }
        else if (typeof val === "object") {
            stack.push(val);
            val = cloneObject(val, stack);
            stack.pop();
            return val;
        }
        else {
            return val; // Anything other can just be copied
        }
    }
    if (typeof stack === "undefined") { stack = [original]; }
    const clone = original instanceof Array ? [] : {};
    Object.keys(original).forEach(key => {
        let val = original[key];
        if (typeof val === "function") {
            return; // skip functions
        }
        clone[key] = cloneValue(val);
    });
    return clone;
}

function compareValues (oldVal, newVal) {
    const voids = [undefined, null];
    const isTypedArray = val => typeof val === 'object' && ['ArrayBuffer','Buffer','Uint8Array','Uint16Array','Uint32Array','Int8Array','Int16Array','Int32Array'].includes(val.constructor.name);
    if (oldVal === newVal) { return "identical"; }
    else if (voids.indexOf(oldVal) >= 0 && voids.indexOf(newVal) < 0) { return "added"; }
    else if (voids.indexOf(oldVal) < 0 && voids.indexOf(newVal) >= 0) { return "removed"; }
    else if (typeof oldVal !== typeof newVal) { return "changed"; }
    else if (isTypedArray(oldVal) || isTypedArray(newVal)) {
        // One or both values are typed arrays.
        if (!isTypedArray(oldVal) || !isTypedArray(newVal)) { return "changed"; }
        // Both are typed. Compare lengths and byte content of typed arrays
        const typed1 = oldVal instanceof Uint8Array ? oldVal : oldVal instanceof ArrayBuffer ? Uint8Array.from(oldVal) : new Uint8Array(oldVal.buffer, oldVal.byteOffset, oldVal.byteLength);
        const typed2 = newVal instanceof Uint8Array ? newVal : newVal instanceof ArrayBuffer ? Uint8Array.from(newVal) : new Uint8Array(newVal.buffer, newVal.byteOffset, newVal.byteLength);
        if (typed1.byteLength !== typed2.byteLength) { return "changed"; }
        return typed1.some((val, i) => typed2[i] !== val) ? "changed" : "identical";
    }
    else if (oldVal instanceof Date || newVal instanceof Date) { 
        // One or both values are dates
        if (!(oldVal instanceof Date) || !(newVal instanceof Date)) { return "changed"; }
        // Both are dates
        return oldVal.getTime() !== newVal.getTime() ? "changed" : "identical"; 
    }
    else if (typeof oldVal === "object") {
        // Do key-by-key comparison of objects
        const isArray = oldVal instanceof Array;
        const oldKeys = isArray 
            ? Object.keys(oldVal).map(v => parseInt(v)) //new Array(oldVal.length).map((v,i) => i) 
            : Object.keys(oldVal);
        const newKeys = isArray 
            ? Object.keys(newVal).map(v => parseInt(v)) //new Array(newVal.length).map((v,i) => i) 
            : Object.keys(newVal);
        const removedKeys = oldKeys.filter(key => newKeys.indexOf(key) < 0);
        const addedKeys = newKeys.filter(key => oldKeys.indexOf(key) < 0);
        const changedKeys = newKeys.reduce((changed, key) => { 
            if (oldKeys.indexOf(key) >= 0) {
                const val1 = oldVal[key];
                const val2 = newVal[key];
                const c = compareValues(val1, val2);
                if (c !== "identical") {
                    changed.push({ key, change: c });
                }
            } 
            return changed;
        }, []);

        if (addedKeys.length === 0 && removedKeys.length === 0 && changedKeys.length === 0) {
            return "identical";
        }
        else {
            return {
                added: addedKeys,
                removed: removedKeys,
                changed: changedKeys
            }; 
        }
    }
    else if (oldVal !== newVal) { return "changed"; }
    return "identical";
}

const getChildValues = (childKey, oldValue, newValue) => {
    oldValue = oldValue === null ? null : oldValue[childKey];
    if (typeof oldValue === 'undefined') { oldValue = null; }
    newValue = newValue === null ? null : newValue[childKey];
    if (typeof newValue === 'undefined') { newValue = null; }
    return { oldValue, newValue };
};

module.exports = {
    numberToBytes,
    bytesToNumber,
    concatTypedArrays,
    cloneObject,
    // getPathKeys,
    // getPathInfo,
    // getChildPath,
    compareValues,
    getChildValues,
    encodeString,
    decodeString
};

}).call(this,require("buffer").Buffer)
},{"./data-snapshot":156,"./path-reference":161,"buffer":169}],167:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],168:[function(require,module,exports){

},{}],169:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":167,"ieee754":174}],170:[function(require,module,exports){
module.exports = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
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
  "418": "I'm a teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
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
}

},{}],171:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":176}],172:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],173:[function(require,module,exports){
var http = require('http')
var url = require('url')

var https = module.exports

for (var key in http) {
  if (http.hasOwnProperty(key)) https[key] = http[key]
}

https.request = function (params, cb) {
  params = validateParams(params)
  return http.request.call(this, params, cb)
}

https.get = function (params, cb) {
  params = validateParams(params)
  return http.get.call(this, params, cb)
}

function validateParams (params) {
  if (typeof params === 'string') {
    params = url.parse(params)
  }
  if (!params.protocol) {
    params.protocol = 'https:'
  }
  if (params.protocol !== 'https:') {
    throw new Error('Protocol "' + params.protocol + '" not supported. Expected "https:"')
  }
  return params
}

},{"http":194,"url":201}],174:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],175:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],176:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],177:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],178:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":179}],179:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],180:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],181:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],182:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],183:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":181,"./encode":182}],184:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":186,"./_stream_writable":188,"core-util-is":171,"inherits":175,"process-nextick-args":178}],185:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":187,"core-util-is":171,"inherits":175}],186:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":184,"./internal/streams/BufferList":189,"./internal/streams/destroy":190,"./internal/streams/stream":191,"_process":179,"core-util-is":171,"events":172,"inherits":175,"isarray":177,"process-nextick-args":178,"safe-buffer":193,"string_decoder/":198,"util":168}],187:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":184,"core-util-is":171,"inherits":175}],188:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":184,"./internal/streams/destroy":190,"./internal/streams/stream":191,"_process":179,"core-util-is":171,"inherits":175,"process-nextick-args":178,"safe-buffer":193,"timers":199,"util-deprecate":203}],189:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":193,"util":168}],190:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":178}],191:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":172}],192:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":184,"./lib/_stream_passthrough.js":185,"./lib/_stream_readable.js":186,"./lib/_stream_transform.js":187,"./lib/_stream_writable.js":188}],193:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":169}],194:[function(require,module,exports){
(function (global){
var ClientRequest = require('./lib/request')
var response = require('./lib/response')
var extend = require('xtend')
var statusCodes = require('builtin-status-codes')
var url = require('url')

var http = exports

http.request = function (opts, cb) {
	if (typeof opts === 'string')
		opts = url.parse(opts)
	else
		opts = extend(opts)

	// Normally, the page is loaded from http or https, so not specifying a protocol
	// will result in a (valid) protocol-relative url. However, this won't work if
	// the protocol is something else, like 'file:'
	var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? 'http:' : ''

	var protocol = opts.protocol || defaultProtocol
	var host = opts.hostname || opts.host
	var port = opts.port
	var path = opts.path || '/'

	// Necessary for IPv6 addresses
	if (host && host.indexOf(':') !== -1)
		host = '[' + host + ']'

	// This may be a relative url. The browser should always be able to interpret it correctly.
	opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
	opts.method = (opts.method || 'GET').toUpperCase()
	opts.headers = opts.headers || {}

	// Also valid opts.auth, opts.mode

	var req = new ClientRequest(opts)
	if (cb)
		req.on('response', cb)
	return req
}

http.get = function get (opts, cb) {
	var req = http.request(opts, cb)
	req.end()
	return req
}

http.ClientRequest = ClientRequest
http.IncomingMessage = response.IncomingMessage

http.Agent = function () {}
http.Agent.defaultMaxSockets = 4

http.globalAgent = new http.Agent()

http.STATUS_CODES = statusCodes

http.METHODS = [
	'CHECKOUT',
	'CONNECT',
	'COPY',
	'DELETE',
	'GET',
	'HEAD',
	'LOCK',
	'M-SEARCH',
	'MERGE',
	'MKACTIVITY',
	'MKCOL',
	'MOVE',
	'NOTIFY',
	'OPTIONS',
	'PATCH',
	'POST',
	'PROPFIND',
	'PROPPATCH',
	'PURGE',
	'PUT',
	'REPORT',
	'SEARCH',
	'SUBSCRIBE',
	'TRACE',
	'UNLOCK',
	'UNSUBSCRIBE'
]
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/request":196,"./lib/response":197,"builtin-status-codes":170,"url":201,"xtend":204}],195:[function(require,module,exports){
(function (global){
exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableStream)

exports.writableStream = isFunction(global.WritableStream)

exports.abortController = isFunction(global.AbortController)

exports.blobConstructor = false
try {
	new Blob([new ArrayBuffer(1)])
	exports.blobConstructor = true
} catch (e) {}

// The xhr request to example.com may violate some restrictive CSP configurations,
// so if we're running in a browser that supports `fetch`, avoid calling getXHR()
// and assume support for certain features below.
var xhr
function getXHR () {
	// Cache the xhr value
	if (xhr !== undefined) return xhr

	if (global.XMLHttpRequest) {
		xhr = new global.XMLHttpRequest()
		// If XDomainRequest is available (ie only, where xhr might not work
		// cross domain), use the page location. Otherwise use example.com
		// Note: this doesn't actually make an http request.
		try {
			xhr.open('GET', global.XDomainRequest ? '/' : 'https://example.com')
		} catch(e) {
			xhr = null
		}
	} else {
		// Service workers don't have XHR
		xhr = null
	}
	return xhr
}

function checkTypeSupport (type) {
	var xhr = getXHR()
	if (!xhr) return false
	try {
		xhr.responseType = type
		return xhr.responseType === type
	} catch (e) {}
	return false
}

// For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
// Safari 7.1 appears to have fixed this bug.
var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined'
var haveSlice = haveArrayBuffer && isFunction(global.ArrayBuffer.prototype.slice)

// If fetch is supported, then arraybuffer will be supported too. Skip calling
// checkTypeSupport(), since that calls getXHR().
exports.arraybuffer = exports.fetch || (haveArrayBuffer && checkTypeSupport('arraybuffer'))

// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream = !exports.fetch && haveSlice && checkTypeSupport('ms-stream')
exports.mozchunkedarraybuffer = !exports.fetch && haveArrayBuffer &&
	checkTypeSupport('moz-chunked-arraybuffer')

// If fetch is supported, then overrideMimeType will be supported too. Skip calling
// getXHR().
exports.overrideMimeType = exports.fetch || (getXHR() ? isFunction(getXHR().overrideMimeType) : false)

exports.vbArray = isFunction(global.VBArray)

function isFunction (value) {
	return typeof value === 'function'
}

xhr = null // Help gc

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],196:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var response = require('./response')
var stream = require('readable-stream')
var toArrayBuffer = require('to-arraybuffer')

var IncomingMessage = response.IncomingMessage
var rStates = response.readyStates

function decideMode (preferBinary, useFetch) {
	if (capability.fetch && useFetch) {
		return 'fetch'
	} else if (capability.mozchunkedarraybuffer) {
		return 'moz-chunked-arraybuffer'
	} else if (capability.msstream) {
		return 'ms-stream'
	} else if (capability.arraybuffer && preferBinary) {
		return 'arraybuffer'
	} else if (capability.vbArray && preferBinary) {
		return 'text:vbarray'
	} else {
		return 'text'
	}
}

var ClientRequest = module.exports = function (opts) {
	var self = this
	stream.Writable.call(self)

	self._opts = opts
	self._body = []
	self._headers = {}
	if (opts.auth)
		self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'))
	Object.keys(opts.headers).forEach(function (name) {
		self.setHeader(name, opts.headers[name])
	})

	var preferBinary
	var useFetch = true
	if (opts.mode === 'disable-fetch' || ('requestTimeout' in opts && !capability.abortController)) {
		// If the use of XHR should be preferred. Not typically needed.
		useFetch = false
		preferBinary = true
	} else if (opts.mode === 'prefer-streaming') {
		// If streaming is a high priority but binary compatibility and
		// the accuracy of the 'content-type' header aren't
		preferBinary = false
	} else if (opts.mode === 'allow-wrong-content-type') {
		// If streaming is more important than preserving the 'content-type' header
		preferBinary = !capability.overrideMimeType
	} else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
		// Use binary if text streaming may corrupt data or the content-type header, or for speed
		preferBinary = true
	} else {
		throw new Error('Invalid value for opts.mode')
	}
	self._mode = decideMode(preferBinary, useFetch)
	self._fetchTimer = null

	self.on('finish', function () {
		self._onFinish()
	})
}

inherits(ClientRequest, stream.Writable)

ClientRequest.prototype.setHeader = function (name, value) {
	var self = this
	var lowerName = name.toLowerCase()
	// This check is not necessary, but it prevents warnings from browsers about setting unsafe
	// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
	// http-browserify did it, so I will too.
	if (unsafeHeaders.indexOf(lowerName) !== -1)
		return

	self._headers[lowerName] = {
		name: name,
		value: value
	}
}

ClientRequest.prototype.getHeader = function (name) {
	var header = this._headers[name.toLowerCase()]
	if (header)
		return header.value
	return null
}

ClientRequest.prototype.removeHeader = function (name) {
	var self = this
	delete self._headers[name.toLowerCase()]
}

ClientRequest.prototype._onFinish = function () {
	var self = this

	if (self._destroyed)
		return
	var opts = self._opts

	var headersObj = self._headers
	var body = null
	if (opts.method !== 'GET' && opts.method !== 'HEAD') {
		if (capability.arraybuffer) {
			body = toArrayBuffer(Buffer.concat(self._body))
		} else if (capability.blobConstructor) {
			body = new global.Blob(self._body.map(function (buffer) {
				return toArrayBuffer(buffer)
			}), {
				type: (headersObj['content-type'] || {}).value || ''
			})
		} else {
			// get utf8 string
			body = Buffer.concat(self._body).toString()
		}
	}

	// create flattened list of headers
	var headersList = []
	Object.keys(headersObj).forEach(function (keyName) {
		var name = headersObj[keyName].name
		var value = headersObj[keyName].value
		if (Array.isArray(value)) {
			value.forEach(function (v) {
				headersList.push([name, v])
			})
		} else {
			headersList.push([name, value])
		}
	})

	if (self._mode === 'fetch') {
		var signal = null
		var fetchTimer = null
		if (capability.abortController) {
			var controller = new AbortController()
			signal = controller.signal
			self._fetchAbortController = controller

			if ('requestTimeout' in opts && opts.requestTimeout !== 0) {
				self._fetchTimer = global.setTimeout(function () {
					self.emit('requestTimeout')
					if (self._fetchAbortController)
						self._fetchAbortController.abort()
				}, opts.requestTimeout)
			}
		}

		global.fetch(self._opts.url, {
			method: self._opts.method,
			headers: headersList,
			body: body || undefined,
			mode: 'cors',
			credentials: opts.withCredentials ? 'include' : 'same-origin',
			signal: signal
		}).then(function (response) {
			self._fetchResponse = response
			self._connect()
		}, function (reason) {
			global.clearTimeout(self._fetchTimer)
			if (!self._destroyed)
				self.emit('error', reason)
		})
	} else {
		var xhr = self._xhr = new global.XMLHttpRequest()
		try {
			xhr.open(self._opts.method, self._opts.url, true)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}

		// Can't set responseType on really old browsers
		if ('responseType' in xhr)
			xhr.responseType = self._mode.split(':')[0]

		if ('withCredentials' in xhr)
			xhr.withCredentials = !!opts.withCredentials

		if (self._mode === 'text' && 'overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain; charset=x-user-defined')

		if ('requestTimeout' in opts) {
			xhr.timeout = opts.requestTimeout
			xhr.ontimeout = function () {
				self.emit('requestTimeout')
			}
		}

		headersList.forEach(function (header) {
			xhr.setRequestHeader(header[0], header[1])
		})

		self._response = null
		xhr.onreadystatechange = function () {
			switch (xhr.readyState) {
				case rStates.LOADING:
				case rStates.DONE:
					self._onXHRProgress()
					break
			}
		}
		// Necessary for streaming in Firefox, since xhr.response is ONLY defined
		// in onprogress, not in onreadystatechange with xhr.readyState = 3
		if (self._mode === 'moz-chunked-arraybuffer') {
			xhr.onprogress = function () {
				self._onXHRProgress()
			}
		}

		xhr.onerror = function () {
			if (self._destroyed)
				return
			self.emit('error', new Error('XHR error'))
		}

		try {
			xhr.send(body)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}
	}
}

/**
 * Checks if xhr.status is readable and non-zero, indicating no error.
 * Even though the spec says it should be available in readyState 3,
 * accessing it throws an exception in IE8
 */
function statusValid (xhr) {
	try {
		var status = xhr.status
		return (status !== null && status !== 0)
	} catch (e) {
		return false
	}
}

ClientRequest.prototype._onXHRProgress = function () {
	var self = this

	if (!statusValid(self._xhr) || self._destroyed)
		return

	if (!self._response)
		self._connect()

	self._response._onXHRProgress()
}

ClientRequest.prototype._connect = function () {
	var self = this

	if (self._destroyed)
		return

	self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode, self._fetchTimer)
	self._response.on('error', function(err) {
		self.emit('error', err)
	})

	self.emit('response', self._response)
}

ClientRequest.prototype._write = function (chunk, encoding, cb) {
	var self = this

	self._body.push(chunk)
	cb()
}

ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
	var self = this
	self._destroyed = true
	global.clearTimeout(self._fetchTimer)
	if (self._response)
		self._response._destroyed = true
	if (self._xhr)
		self._xhr.abort()
	else if (self._fetchAbortController)
		self._fetchAbortController.abort()
}

ClientRequest.prototype.end = function (data, encoding, cb) {
	var self = this
	if (typeof data === 'function') {
		cb = data
		data = undefined
	}

	stream.Writable.prototype.end.call(self, data, encoding, cb)
}

ClientRequest.prototype.flushHeaders = function () {}
ClientRequest.prototype.setTimeout = function () {}
ClientRequest.prototype.setNoDelay = function () {}
ClientRequest.prototype.setSocketKeepAlive = function () {}

// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders = [
	'accept-charset',
	'accept-encoding',
	'access-control-request-headers',
	'access-control-request-method',
	'connection',
	'content-length',
	'cookie',
	'cookie2',
	'date',
	'dnt',
	'expect',
	'host',
	'keep-alive',
	'origin',
	'referer',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'via'
]

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":195,"./response":197,"_process":179,"buffer":169,"inherits":175,"readable-stream":192,"to-arraybuffer":200}],197:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var stream = require('readable-stream')

var rStates = exports.readyStates = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
}

var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode, fetchTimer) {
	var self = this
	stream.Readable.call(self)

	self._mode = mode
	self.headers = {}
	self.rawHeaders = []
	self.trailers = {}
	self.rawTrailers = []

	// Fake the 'close' event, but only once 'end' fires
	self.on('end', function () {
		// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
		process.nextTick(function () {
			self.emit('close')
		})
	})

	if (mode === 'fetch') {
		self._fetchResponse = response

		self.url = response.url
		self.statusCode = response.status
		self.statusMessage = response.statusText
		
		response.headers.forEach(function (header, key){
			self.headers[key.toLowerCase()] = header
			self.rawHeaders.push(key, header)
		})

		if (capability.writableStream) {
			var writable = new WritableStream({
				write: function (chunk) {
					return new Promise(function (resolve, reject) {
						if (self._destroyed) {
							reject()
						} else if(self.push(new Buffer(chunk))) {
							resolve()
						} else {
							self._resumeFetch = resolve
						}
					})
				},
				close: function () {
					global.clearTimeout(fetchTimer)
					if (!self._destroyed)
						self.push(null)
				},
				abort: function (err) {
					if (!self._destroyed)
						self.emit('error', err)
				}
			})

			try {
				response.body.pipeTo(writable).catch(function (err) {
					global.clearTimeout(fetchTimer)
					if (!self._destroyed)
						self.emit('error', err)
				})
				return
			} catch (e) {} // pipeTo method isn't defined. Can't find a better way to feature test this
		}
		// fallback for when writableStream or pipeTo aren't available
		var reader = response.body.getReader()
		function read () {
			reader.read().then(function (result) {
				if (self._destroyed)
					return
				if (result.done) {
					global.clearTimeout(fetchTimer)
					self.push(null)
					return
				}
				self.push(new Buffer(result.value))
				read()
			}).catch(function (err) {
				global.clearTimeout(fetchTimer)
				if (!self._destroyed)
					self.emit('error', err)
			})
		}
		read()
	} else {
		self._xhr = xhr
		self._pos = 0

		self.url = xhr.responseURL
		self.statusCode = xhr.status
		self.statusMessage = xhr.statusText
		var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
		headers.forEach(function (header) {
			var matches = header.match(/^([^:]+):\s*(.*)/)
			if (matches) {
				var key = matches[1].toLowerCase()
				if (key === 'set-cookie') {
					if (self.headers[key] === undefined) {
						self.headers[key] = []
					}
					self.headers[key].push(matches[2])
				} else if (self.headers[key] !== undefined) {
					self.headers[key] += ', ' + matches[2]
				} else {
					self.headers[key] = matches[2]
				}
				self.rawHeaders.push(matches[1], matches[2])
			}
		})

		self._charset = 'x-user-defined'
		if (!capability.overrideMimeType) {
			var mimeType = self.rawHeaders['mime-type']
			if (mimeType) {
				var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
				if (charsetMatch) {
					self._charset = charsetMatch[1].toLowerCase()
				}
			}
			if (!self._charset)
				self._charset = 'utf-8' // best guess
		}
	}
}

inherits(IncomingMessage, stream.Readable)

IncomingMessage.prototype._read = function () {
	var self = this

	var resolve = self._resumeFetch
	if (resolve) {
		self._resumeFetch = null
		resolve()
	}
}

IncomingMessage.prototype._onXHRProgress = function () {
	var self = this

	var xhr = self._xhr

	var response = null
	switch (self._mode) {
		case 'text:vbarray': // For IE9
			if (xhr.readyState !== rStates.DONE)
				break
			try {
				// This fails in IE8
				response = new global.VBArray(xhr.responseBody).toArray()
			} catch (e) {}
			if (response !== null) {
				self.push(new Buffer(response))
				break
			}
			// Falls through in IE8	
		case 'text':
			try { // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
				response = xhr.responseText
			} catch (e) {
				self._mode = 'text:vbarray'
				break
			}
			if (response.length > self._pos) {
				var newData = response.substr(self._pos)
				if (self._charset === 'x-user-defined') {
					var buffer = new Buffer(newData.length)
					for (var i = 0; i < newData.length; i++)
						buffer[i] = newData.charCodeAt(i) & 0xff

					self.push(buffer)
				} else {
					self.push(newData, self._charset)
				}
				self._pos = response.length
			}
			break
		case 'arraybuffer':
			if (xhr.readyState !== rStates.DONE || !xhr.response)
				break
			response = xhr.response
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'moz-chunked-arraybuffer': // take whole
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING || !response)
				break
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'ms-stream':
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING)
				break
			var reader = new global.MSStreamReader()
			reader.onprogress = function () {
				if (reader.result.byteLength > self._pos) {
					self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))))
					self._pos = reader.result.byteLength
				}
			}
			reader.onload = function () {
				self.push(null)
			}
			// reader.onerror = ??? // TODO: this
			reader.readAsArrayBuffer(response)
			break
	}

	// The ms-stream case handles end separately in reader.onload()
	if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
		self.push(null)
	}
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":195,"_process":179,"buffer":169,"inherits":175,"readable-stream":192}],198:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":193}],199:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":179,"timers":199}],200:[function(require,module,exports){
var Buffer = require('buffer').Buffer

module.exports = function (buf) {
	// If the buffer is backed by a Uint8Array, a faster version will work
	if (buf instanceof Uint8Array) {
		// If the buffer isn't a subarray, return the underlying ArrayBuffer
		if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
			return buf.buffer
		} else if (typeof buf.buffer.slice === 'function') {
			// Otherwise we need to get a proper copy
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
		}
	}

	if (Buffer.isBuffer(buf)) {
		// This is the slow version that will work with any Buffer
		// implementation (even in old browsers)
		var arrayCopy = new Uint8Array(buf.length)
		var len = buf.length
		for (var i = 0; i < len; i++) {
			arrayCopy[i] = buf[i]
		}
		return arrayCopy.buffer
	} else {
		throw new Error('Argument must be a Buffer')
	}
}

},{"buffer":169}],201:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":202,"punycode":180,"querystring":183}],202:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],203:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],204:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[43])(43)
});
