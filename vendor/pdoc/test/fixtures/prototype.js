/*  Prototype JavaScript framework, version 1.6.0.2
 *  (c) 2005-2007 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {
  Version: '1.6.0.2',

  Browser: {
    IE:     !!(window.attachEvent && !window.opera),
    Opera:  !!window.opera,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
  },

  BrowserFeatures: {
    XPath: !!document.evaluate,
    SelectorsAPI: !!document.querySelector,
    ElementExtensions: !!window.HTMLElement,
    SpecificElementExtensions:
      document.createElement('div').__proto__ &&
      document.createElement('div').__proto__ !==
        document.createElement('form').__proto__
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },
  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


/* Based on Alex Arnell's inheritance implementation. */

/**
 * == lang ==
 * Language extensions.
**/

/**
 *  == ajax ==
 *  Dead-simple Ajax.
**/

/**
 *  == DOM ==
 *  DOM extensions.
**/
 

/** section: lang
 * Class
**/
var Class = {
  /**
   *  Class.create([superclass][, methods...]) -> Class
   *  - superclass (Class): The optional superclass to inherit methods from.
   *  - methods (Object): An object whose properties will be "mixed-in" to the
   *      new class. Any number of mixins can be added; later mixins take
   *      precedence.
   *
   *  Creates a class.
   *
   *  Class.create returns a function that, when called, will fire its own
   *  `initialize` method.
   *
   *  `Class.create` accepts two kinds of arguments. If the first argument is
   *  a `Class`, it's treated as the new class's superclass, and all its
   *  methods are inherited. Otherwise, any arguments passed are treated as
   *  objects, and their methods are copied over as instance methods of the new
   *  class. Later arguments take precedence over earlier arguments.
   *
   *  If a subclass overrides an instance method declared in a superclass, the
   *  subclass's method can still access the original method. To do so, declare
   *  the subclass's method as normal, but insert `$super` as the first
   *  argument. This makes `$super` available as a method for use within the
   *  function.
   *
   *  To extend a class after it has been defined, use [[Class#addMethods]].
  **/
  create: function() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;

    return klass;
  }
};

Class.Methods = {
  /**
   *  Class#addMethods(methods) -> Class
   *  - methods (Object): The methods to add to the class.
   *
   *  Adds methods to an existing class.
   *
   *  `Class#addMethods` is a method available on classes that have been
   *  defined with `Class.create`. It can be used to add new instance methods
   *  to that class, or overwrite existing methods, after the class has been
   *  defined.
   *
   *  New methods propagate down the inheritance chain. If the class has
   *  subclasses, those subclasses will receive the new methods — even in the
   *  context of `$super` calls. The new methods also propagate to instances of
   *  the class and of all its subclasses, even those that have already been
   *  instantiated.
  **/
  addMethods: function(source) {
    var ancestor   = this.superclass && this.superclass.prototype;
    var properties = Object.keys(source);

    if (!Object.keys({ toString: true }).length)
      properties.push("toString", "valueOf");

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames().first() == "$super") {
        var method = value, value = Object.extend((function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property).wrap(method), {
          valueOf:  function() { return method },
          toString: function() { return method.toString() }
        });
      }
      this.prototype[property] = value;
    }

    return this;
  }
};

var Abstract = { };

/** section: lang
 * Object
**/

/**
 *  Object.extend(destination, source) -> Object
 *  - destination (Object): The object to receive the new properties.
 *  - source (Object): The object whose properties will be duplicated.
 *
 *  Copies all properties from the source to the destination object. Returns
 *  the destination object.
**/
Object.extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
};

Object.extend(Object, {
  /**
   *  Object.inspect(object) -> String
   *  - object (Object): The item to be inspected.
   *
   *  Returns the debug-oriented string representation of the object.
   *
   *  `undefined` and `null` are represented as such.
   *
   *  Other types are checked for a `inspect` method. If there is one, it is
   *  used; otherwise, it reverts to the `toString` method.
   *
   *  Prototype provides `inspect` methods for many types, both built-in and
   *  library-defined — among them `String`, `Array`, `Enumerable` and `Hash`.
   *  These attempt to provide useful string representations (from a
   *  developer’s standpoint) for their respective types.
  **/
  inspect: function(object) {
    try {
      if (Object.isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  },

  /**
   *  Object.toJSON(object) -> String
   *  - object (Object): The object to be serialized.
   *
   *  Returns a JSON string.
   *
   *  `undefined` and `function` types have no JSON representation. `boolean`
   *  and `null` are coerced to strings.
   *
   *  For other types, `Object.toJSON` looks for a `toJSON` method on `object`.
   *  If there is one, it is used; otherwise the object is treated like a
   *  generic `Object`.
  **/
  toJSON: function(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (Object.isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = Object.toJSON(object[property]);
      if (!Object.isUndefined(value))
        results.push(property.toJSON() + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  },

  /**
   *  Object.toQueryString(object) -> String
   *  object (Object): The object whose property/value pairs will be converted.
   *
   *  Turns an object into its URL-encoded query string representation.
   *
   *  This is a form of serialization, and is mostly useful to provide complex
   *  parameter sets for stuff such as objects in the Ajax namespace (e.g.
   *  [[Ajax.Request]]).
   *
   *  Undefined-value pairs will be serialized as if empty-valued. Array-valued
   *  pairs will get serialized with one name/value pair per array element. All
   *  values get URI-encoded using JavaScript’s native `encodeURIComponent`
   *  function.
   *
   *  The order of pairs in the serialized form is not guaranteed (and mostly
   *  irrelevant anyway) — except for array-based parts, which are serialized
   *  in array order.
  **/
  toQueryString: function(object) {
    return $H(object).toQueryString();
  },

  /**
   *  Object.toHTML(object) -> String
   *  - object (Object): The object to convert to HTML.
   *
   *  Converts the object to its HTML representation.
   *
   *  Returns the return value of `object`’s `toHTML` method if it exists; else
   *  runs `object` through [[String.interpret]].
  **/
  toHTML: function(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  },

  /**
   *  Object.keys(object) -> Array
   *  - object (Object): The object to pull keys from.
   *
   *  Returns an array of the object's property names.
   *
   *  Note that the order of the resulting array is browser-dependent — it
   *  relies on the `for&#8230;in` loop, for which the ECMAScript spec does not
   *  prescribe an enumeration order. Sort the resulting array if you wish to
   *  normalize the order of the object keys.
  **/
  keys: function(object) {
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
  },

  /**
   *  Object.values(object) -> Array
   *  - object (Object): The object to pull values from.
   *
   *  Returns an array of the object's values.
   *
   *  Note that the order of the resulting array is browser-dependent — it
   *  relies on the `for&#8230;in` loop, for which the ECMAScript spec does not
   *  prescribe an enumeration order.
   *
   *  Also, remember that while property _names_ are unique, property _values_
   *  have no such constraint.
  **/
  values: function(object) {
    var values = [];
    for (var property in object)
      values.push(object[property]);
    return values;
  },

  /**
   *  Object.clone(object) -> Object
   *  - object (Object): The object to clone.
   *
   *  Duplicates the passed object.
   *
   *  Copies all the original's key/value pairs onto an empty object.
   *
   *  Do note that this is a _shallow_ copy, not a _deep_ copy. Nested objects
   *  will retain their references.
  **/
  clone: function(object) {
    return Object.extend({ }, object);
  },

  /**
   *  Object.isElement(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is a DOM node of type 1; `false` otherwise.
  **/
  isElement: function(object) {
    return object && object.nodeType == 1;
  },

  /**
   *  Object.isArray(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is an array; false otherwise.
  **/
  isArray: function(object) {
    return object != null && typeof object == "object" &&
      'splice' in object && 'join' in object;
  },

  /**
   *  Object.isHash(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is an instance of the [[Hash]] class; `false`
   *  otherwise.
  **/
  isHash: function(object) {
    return object instanceof Hash;
  },

  /**
   *  Object.isFunction(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is of type `function`; `false` otherwise.
  **/
  isFunction: function(object) {
    return typeof object == "function";
  },

  /**
   *  Object.isString(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is of type `string`; `false` otherwise.
  **/
  isString: function(object) {
    return typeof object == "string";
  },

  /**
   *  Object.isNumber(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is of type `number`; `false` otherwise.
  **/
  isNumber: function(object) {
    return typeof object == "number";
  },

  /**
   *  Object.isUndefined(object) -> Boolean
   *  - object (Object): The object to test.
   *
   *  Returns `true` if `object` is of type `string`; `false` otherwise.
  **/
  isUndefined: function(object) {
    return typeof object == "undefined";
  }
});

/** section: lang
 * Function
**/

Object.extend(Function.prototype, {
  /**
   *  Function#argumentNames() -> Array
   *  Reads the argument names as stated in the function definition and returns
   *  the values as an array of strings (or an empty array if the function is
   *  defined without parameters).
  **/
  argumentNames: function() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(",").invoke("strip");
    return names.length == 1 && !names[0] ? [] : names;
  },

  /**
   *  Function#bind(object[, args...]) -> Function
   *  - object (Object): The object to bind to.
   *
   *  Wraps the function in another, locking its execution scope to an object
   *  specified by `object`.
  **/
  bind: function() {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = $A(arguments), object = args.shift();
    return function() {
      return __method.apply(object, args.concat($A(arguments)));
    }
  },

  /** related to: Function#bind
   *  Function#bindAsEventListener(object[, args...]) -> Function
   *  - object (Object): The object to bind to.
   *
   *  An event-specific variant of [[Function#bind]] which ensures the function
   *  will recieve the current event object as the first argument when
   *  executing.
  **/
  bindAsEventListener: function() {
    var __method = this, args = $A(arguments), object = args.shift();
    return function(event) {
      return __method.apply(object, [event || window.event].concat(args));
    }
  },

  /**
   *  Function#curry(args...) -> Function
   *  Partially applies the function, returning a function with one or more
   *  arguments already “filled in.”
   *
   *  Function#curry works just like [[Function#bind]] without the initial
   *  scope argument. Use the latter if you need to partially apply a function
   *  _and_ modify its execution scope at the same time.
  **/
  curry: function() {
    if (!arguments.length) return this;
    var __method = this, args = $A(arguments);
    return function() {
      return __method.apply(this, args.concat($A(arguments)));
    }
  },

  /**
   *  Function#delay(seconds[, args...]) -> Number
   *  - seconds (Number): How long to wait before calling the function.
   *
   *  Schedules the function to run after the specified amount of time, passing
   *  any arguments given.
   *
   *  Behaves much like `window.setTimeout`. Returns an integer ID that can be
   *  used to clear the timeout with `window.clearTimeout` before it runs.
   *
   *  To schedule a function to run as soon as the interpreter is idle, use
   *  [[Function#defer]].
  **/
  delay: function() {
    var __method = this, args = $A(arguments), timeout = args.shift() * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  },

  /**
   *  Function#wrap(wrapperFunction) -> Function
   *  - wrapperFunction (Function): The function to act as a wrapper.
   *
   *  Returns a function “wrapped” around the original function.
   *
   *  `Function#wrap` distills the essence of aspect-oriented programming into
   *  a single method, letting you easily build on existing functions by
   *  specifying before and after behavior, transforming the return value, or
   *  even preventing the original function from being called.
  **/
  wrap: function(wrapper) {
    var __method = this;
    return function() {
      return wrapper.apply(this, [__method.bind(this)].concat($A(arguments)));
    }
  },


  /**
   *  Function#methodize() -> Function
   *  Wraps the function inside another function that, at call time, pushes
   *  `this` to the original function as the first argument.
   *
   *  Used to define both a generic method and an instance method.
  **/
  methodize: function() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      return __method.apply(null, [this].concat($A(arguments)));
    };
  }
});

/**
 *  Function#defer(args...) -> Number
 *  Schedules the function to run as soon as the interpreter is idle.
 *
 *  A “deferred” function will not run immediately; rather, it will run as soon
 *  as the interpreter’s call stack is empty.
 *
 *  Behaves much like `window.setTimeout` with a delay set to `0`. Returns an
 *  ID that can be used to clear the timeout with `window.clearTimeout` before
 *  it runs.
**/
Function.prototype.defer = Function.prototype.delay.curry(0.01);


/** section: lang
 * Date
**/ 

/**
 *  Date#toJSON() -> String
 *  Converts the date into a JSON string (following the ISO format used by
 *  JSON).
**/
Date.prototype.toJSON = function() {
  return '"' + this.getUTCFullYear() + '-' +
    (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
    this.getUTCDate().toPaddedString(2) + 'T' +
    this.getUTCHours().toPaddedString(2) + ':' +
    this.getUTCMinutes().toPaddedString(2) + ':' +
    this.getUTCSeconds().toPaddedString(2) + 'Z"';
};

/** section: lang
 * Try
**/

/**
 *  Try.these(function...) -> ?
 *  - function (Function): A function that may throw an exception.
 *  Accepts an arbitrary number of functions and returns the result of the
 *  first one that doesn't throw an error.
**/
var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

RegExp.prototype.match = RegExp.prototype.test;

/** section: lang
 * RegExp
**/

/**
 *  RegExp.escape(str) -> String
 *  - str (String): A string intended to be used in a `RegExp` constructor.
 *
 *  Escapes any characters in the string that have special meaning in a
 *  regular expression.
 *
 *  Use before passing a string into the `RegExp` constructor.
**/
RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};

/*--------------------------------------------------------------------------*/

/** section: lang
 *  class PeriodicalExecuter
**/
var PeriodicalExecuter = Class.create({
  /**
   *  new PeriodicalExecuter(callback, frequency)
   *  - callback (Function): the function to be executed at each interval.
   *  - frequency (Number): the amount of time, in sections, to wait in between
   *      callbacks.
   *
   *  Creates an object that oversees the calling of a particular function via
   *  `window.setInterval`.
   *
   *  The only notable advantage provided by `PeriodicalExecuter` is that it
   *  shields you against multiple parallel executions of the `callback`
   *  function, should it take longer than the given interval to execute (it
   *  maintains an internal “running” flag, which is shielded against
   *  exceptions in the callback function).
   *
   *  This is especially useful if you use one to interact with the user at
   *  given intervals (e.g. use a prompt or confirm call): this will avoid
   *  multiple message boxes all waiting to be actioned.
  **/
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  /**
   *  PeriodicalExecuter#stop() -> undefined
   *  Stops the periodical executer (there will be no further triggers).
  **/
  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
      } finally {
        this.currentlyExecuting = false;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, {
  gsub: function(pattern, replacement) {
    var result = '', source = this, match;
    replacement = arguments.callee.prepareReplacement(replacement);

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  },

  sub: function(pattern, replacement, count) {
    replacement = this.gsub.prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  },

  scan: function(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  },

  truncate: function(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },

  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  },

  extractScripts: function() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
    var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  },

  evalScripts: function() {
    return this.extractScripts().map(function(script) { return eval(script) });
  },

  escapeHTML: function() {
    var self = arguments.callee;
    self.text.data = this;
    return self.div.innerHTML;
  },

  unescapeHTML: function() {
    var div = new Element('div');
    div.innerHTML = this.stripTags();
    return div.childNodes[0] ? (div.childNodes.length > 1 ?
      $A(div.childNodes).inject('', function(memo, node) { return memo+node.nodeValue }) :
      div.childNodes[0].nodeValue) : '';
  },

  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  },

  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },

  times: function(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  },

  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },

  capitalize: function() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  },

  underscore: function() {
    return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/,'#{1}_#{2}').gsub(/([a-z\d])([A-Z])/,'#{1}_#{2}').gsub(/-/,'_').toLowerCase();
  },

  dasherize: function() {
    return this.gsub(/_/,'-');
  },

  inspect: function(useDoubleQuotes) {
    var escapedString = this.gsub(/[\x00-\x1f\\]/, function(match) {
      var character = String.specialChar[match[0]];
      return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  },

  toJSON: function() {
    return this.inspect(true);
  },

  unfilterJSON: function(filter) {
    return this.sub(filter || Prototype.JSONFilter, '#{1}');
  },

  isJSON: function() {
    var str = this;
    if (str.blank()) return false;
    str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
  },

  evalJSON: function(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  },

  include: function(pattern) {
    return this.indexOf(pattern) > -1;
  },

  startsWith: function(pattern) {
    return this.indexOf(pattern) === 0;
  },

  endsWith: function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
  },

  empty: function() {
    return this == '';
  },

  blank: function() {
    return /^\s*$/.test(this);
  },

  interpolate: function(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }
});

if (Prototype.Browser.WebKit || Prototype.Browser.IE) Object.extend(String.prototype, {
  escapeHTML: function() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  unescapeHTML: function() {
    return this.stripTags().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  }
});

String.prototype.gsub.prepareReplacement = function(replacement) {
  if (Object.isFunction(replacement)) return replacement;
  var template = new Template(replacement);
  return function(match) { return template.evaluate(match) };
};

String.prototype.parseQuery = String.prototype.toQueryParams;

Object.extend(String.prototype.escapeHTML, {
  div:  document.createElement('div'),
  text: document.createTextNode('')
});

String.prototype.escapeHTML.div.appendChild(String.prototype.escapeHTML.text);

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return '';

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3];
      var pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].gsub('\\\\]', ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = {
  each: function(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  },

  eachSlice: function(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  },

  all: function(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  },

  any: function(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  },

  collect: function(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  },

  detect: function(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  },

  findAll: function(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  },

  grep: function(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(filter);

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  },

  include: function(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },

  inGroupsOf: function(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  },

  inject: function(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  },

  invoke: function(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  },

  max: function(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  },

  min: function(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  },

  partition: function(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

  pluck: function(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  },

  reject: function(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function() {
    return this.map();
  },

  zip: function() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  },

  size: function() {
    return this.toArray().length;
  },

  inspect: function() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
};

Object.extend(Enumerable, {
  map:     Enumerable.collect,
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  filter:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray,
  every:   Enumerable.all,
  some:    Enumerable.any
});
/** alias: Array.from, section: lang
 *  $A(iterable) -> Array
 *  - iterable (Object): An array-like collection (anything with numeric
 *      indices).
 *
 *  Coerces an "array-like" collection into an actual array.
 *
 *  This method is a convenience alias of [[Array.from]], but is the preferred
 *  way of casting to an `Array`.
**/
function $A(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

if (Prototype.Browser.WebKit) {
  $A = function(iterable) {
    if (!iterable) return [];
    if (!(Object.isFunction(iterable) && iterable == '[object NodeList]') &&
        iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  };
}

Array.from = $A;

/** section: lang
 *  class Array
 *  
**/
Object.extend(Array.prototype, Enumerable);

if (!Array.prototype._reverse) Array.prototype._reverse = Array.prototype.reverse;

Object.extend(Array.prototype, {
  _each: function(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  },

  /**
   *  Array#clear() -> Array
   *  Empties an array.
  **/
  clear: function() {
    this.length = 0;
    return this;
  },

  /**
   *  Array#first() -> ?
   *  Returns the array's first item.
  **/
  first: function() {
    return this[0];
  },

  /**
   *  Array#last() -> ?
   *  Returns the array's last item.
  **/
  last: function() {
    return this[this.length - 1];
  },


  /**
   *  Array#compact() -> Array
   *  Trims the array of `null`, `undefined`, or other "falsy" values.
  **/
  compact: function() {
    return this.select(function(value) {
      return value != null;
    });
  },

  /**
   *  Array#flatten() -> Array
   *  Returns a “flat” (one-dimensional) version of the array.
   *
   *  Nested arrays are recursively injected “inline.” This can prove very
   *  useful when handling the results of a recursive collection algorithm,
   *  for instance.
  **/
  flatten: function() {
    return this.inject([], function(array, value) {
      return array.concat(Object.isArray(value) ?
        value.flatten() : [value]);
    });
  },

  /**
   *  Array#without(value...) -> Array
   *  - value (?): A value to exclude.
   *
   *  Produces a new version of the array that does not contain any of the
   *  specified values.
  **/
  without: function() {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },

  /**
   *  Array#reverse([inline = false]) -> Array
   *  - inline (Boolean): Whether to modify the array in place. If `false`,
   *      clones the original array first.
   *
   *  Returns the reversed version of the array.
  **/
  reverse: function(inline) {
    return (inline !== false ? this : this.toArray())._reverse();
  },

  /**
   * Array#reduce() -> Array
   *  Reduces arrays: one-element arrays are turned into their unique item,
   *  while multiple-element arrays are returned untouched.
  **/
  reduce: function() {
    return this.length > 1 ? this : this[0];
  },

  /**
   *  Array#uniq([sorted = false]) -> Array
   *  - sorted (Boolean): Whether the array has already been sorted. If `true`,
   *      a less-costly algorithm will be used.
   *
   *  Produces a duplicate-free version of an array. If no duplicates are
   *  found, the original array is returned.
  **/
  uniq: function(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  },

  /**
   *  Array#intersect(array) -> Array
   *  - array (Array): A collection of values.
   *
   *  Returns an array containing every item that is shared between the two
   *  given arrays.
  **/
  intersect: function(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  },

  /** alias of: Array#toArray
   *  Array#clone() -> Array
   *  Returns a duplicate of the array, leaving the original array intact.
  **/
  clone: function() {
    return [].concat(this);
  },

  /** related to: Enumerable#size
   *  Array#size() -> Number
   *  Returns the size of the array.
   *
   *  This is just a local optimization of the mixed-in [[Enumerable#size]]
   *  which avoids array cloning and uses the array’s native length property.
  **/
  size: function() {
    return this.length;
  },


  /** related to: Object.inspect
   *  Array#inspect() -> String
   *  Returns the debug-oriented string representation of an array.
  **/
  inspect: function() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  },

  /** related to: Object.toJSON
   *  Array#toJSON() -> String
   *  Returns a JSON string representation of the array.
  **/
  toJSON: function() {
    var results = [];
    this.each(function(object) {
      var value = Object.toJSON(object);
      if (!Object.isUndefined(value)) results.push(value);
    });
    return '[' + results.join(', ') + ']';
  }
});

// use native browser JS 1.6 implementation if available
if (Object.isFunction(Array.prototype.forEach))
  Array.prototype._each = Array.prototype.forEach;


/**
 *  Array#indexOf(item[, offset = 0]) -> Number
 *  - item (?): A value that may or may not be in the array.
 *  - offset (Number): The number of initial items to skip before beginning the
 *      search.
 *
 *  Returns the position of the first occurrence of `item` within the array — or
 *  `-1` if `item` doesn’t exist in the array.
**/
if (!Array.prototype.indexOf) Array.prototype.indexOf = function(item, i) {
  i || (i = 0);
  var length = this.length;
  if (i < 0) i = length + i;
  for (; i < length; i++)
    if (this[i] === item) return i;
  return -1;
};

/**
 *  Array#lastIndexOf(item[, offset]) -> Number
 *  - item (?): A value that may or may not be in the array.
 *  - offset (Number): The number of items at the end to skip before beginning
 *      the search.
 *
 *  Returns the position of the last occurrence of `item` within the array — or
 *  `-1` if `item` doesn’t exist in the array.
**/
if (!Array.prototype.lastIndexOf) Array.prototype.lastIndexOf = function(item, i) {
  i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
  var n = this.slice(0, i).reverse().indexOf(item);
  return (n < 0) ? n : i - n - 1;
};

Array.prototype.toArray = Array.prototype.clone;

/** section: lang
 *  $w(string) -> Array
 *  - string (String): A string with zero or more spaces.
 *
 *  Splits a string into an array, treating all whitespace as delimiters.
 *
 *  Equivalent to Ruby's `%w{foo bar}` or Perl's `qw(foo bar)`.
**/
function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

if (Prototype.Browser.Opera){
  Array.prototype.concat = function() {
    var array = [];
    for (var i = 0, length = this.length; i < length; i++) array.push(this[i]);
    for (var i = 0, length = arguments.length; i < length; i++) {
      if (Object.isArray(arguments[i])) {
        for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++)
          array.push(arguments[i][j]);
      } else {
        array.push(arguments[i]);
      }
    }
    return array;
  };
}
Object.extend(Number.prototype, {
  toColorPart: function() {
    return this.toPaddedString(2, 16);
  },

  succ: function() {
    return this + 1;
  },

  times: function(iterator) {
    $R(0, this, true).each(iterator);
    return this;
  },

  toPaddedString: function(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  },

  toJSON: function() {
    return isFinite(this) ? this.toString() : 'null';
  }
});

$w('abs round ceil floor').each(function(method){
  Number.prototype[method] = Math[method].methodize();
});
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  return {
    initialize: function(object) {
      this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    },

    _each: function(iterator) {
      for (var key in this._object) {
        var value = this._object[key], pair = [key, value];
        pair.key = key;
        pair.value = value;
        iterator(pair);
      }
    },

    set: function(key, value) {
      return this._object[key] = value;
    },

    get: function(key) {
      return this._object[key];
    },

    unset: function(key) {
      var value = this._object[key];
      delete this._object[key];
      return value;
    },

    toObject: function() {
      return Object.clone(this._object);
    },

    keys: function() {
      return this.pluck('key');
    },

    values: function() {
      return this.pluck('value');
    },

    index: function(value) {
      var match = this.detect(function(pair) {
        return pair.value === value;
      });
      return match && match.key;
    },

    merge: function(object) {
      return this.clone().update(object);
    },

    update: function(object) {
      return new Hash(object).inject(this, function(result, pair) {
        result.set(pair.key, pair.value);
        return result;
      });
    },

    toQueryString: function() {
      return this.inject([], function(results, pair) {
        var key = encodeURIComponent(pair.key), values = pair.value;

        if (values && typeof values == 'object') {
          if (Object.isArray(values))
            return results.concat(values.map(toQueryPair.curry(key)));
        } else results.push(toQueryPair(key, values));
        return results;
      }).join('&');
    },

    inspect: function() {
      return '#<Hash:{' + this.map(function(pair) {
        return pair.map(Object.inspect).join(': ');
      }).join(', ') + '}>';
    },

    toJSON: function() {
      return Object.toJSON(this.toObject());
    },

    clone: function() {
      return new Hash(this);
    }
  }
})());

Hash.prototype.toTemplateReplacements = Hash.prototype.toObject;
Hash.from = $H;
var ObjectRange = Class.create(Enumerable, {
  initialize: function(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  },

  _each: function(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  },

  include: function(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }
});

var $R = function(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
};

/** section: ajax
 * Ajax
**/

var Ajax = {
  /**
   *  Ajax.getTransport() -> XMLHttpRequest
   *  Returns a new instance of XMLHttpRequest (or its ActiveXObject
   *  equivalent in the case of Internet Explorer).
  **/
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

/** section: ajax
 * Ajax.Responders
**/

Ajax.Responders = {
  /**
   *  Ajax.Responders.responders = Array
  **/
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  /**
   *  Ajax.Responders.register(responders) -> undefined
   *  - responders (Object): An object with any number of key/value pairs. The key can be any
   *  one of `onCreate`, `onUninitialized`, `onLoading`,`onLoaded`,
   *  `onInteractive`, `onComplete`, `onSuccess`, `onFailure`, or `onXXX`,
   *  where XXX is any HTTP status code. The value is a function that will
   *  receive three arguments (in order): the [[Ajax.Response]] object; the raw
   *  XMLHttpRequest object; and the evaluated JSON, if any, that was delivered
   *  in the response.
   *
   *  Attaches global responders for the life cycle of every Ajax request.
   *
   *  To remove responders, use [[Ajax.Responders.unregister]].
  **/
  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  /**
   *  Ajax.Responders.unregister(responders) -> undefined
   *  - responders (Object): A reference to an object previously passed into
   *      [[Ajax.Responders.register]].
   *
   *  Detaches global responders for the life cycle of every Ajax request.
  **/
  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});

/** section: ajax
 *  class Ajax.Base
**/
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isString(this.options.parameters))
      this.options.parameters = this.options.parameters.toQueryParams();
    else if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});

/** section: ajax
 *  class Ajax.Request < Ajax.Base
**/
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  /**
   *  new Ajax.Request(url[, options])
   *  Creates and dispatches an XmlHttpRequest to the given URL.
   *  This object is a general-purpose AJAX requester: it handles the
   *  life-cycle of the request, handles the boilerplate, and lets you plug in
   *  callback functions for your custom needs.
   *
   *  In the optional `options` hash, you usually provide an `onComplete` and/or
   *  onSuccess callback, unless you're in the edge case where you're getting a
   *  JavaScript-typed response, that will automatically be eval'd.
   *
  **/
  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      // simulate other verbs over post
      params['_method'] = this.method;
      this.method = 'post';
    }

    this.parameters = params;

    if (params = Object.toQueryString(params)) {
      // when GET, append parameters to URL
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    // user-defined headers
    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },

  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      // avoid memory leak in MSIE: clean up
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

/** section: ajax
 *  Ajax.Request.Events = Array
**/
Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];


/** section: ajax
 *  class Ajax.Response
**/
Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if(readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,
  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

/** section: ajax
 *  class Ajax.Updater < Ajax.Request
**/
Ajax.Updater = Class.create(Ajax.Request, {
  /**
   *  new Ajax.Updater(container, url, options)
   *  - container(Element | String): A reference to a DOM element.
   *  - url (String): The URL to request. Must be on the same server as the
   *      requesting page.
   *  - options (Object): A set of key/value pairs for customizing the request.
   *
   *  Creates and dispatches an `XmlHttpRequest`, then fills the given element
   *  with the text of the response.
  **/
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

/** section: ajax
 *  class Ajax.PeriodicalUpdater < Ajax.Base
**/
Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  /**
   *  new Ajax.PeriodicalUpdater(container, url, options)
   *  - container(Element | String): A reference to a DOM element.
   *  - url (String): The URL to request. Must be on the same server as the
   *      requesting page.
   *  - options (Object): A set of key/value pairs for customizing the updater.
   *
   *  Periodically performs an Ajax request and updates a container’s contents
   *  based on the response text.
   *
   *  Offers a mechanism for “decay” (`options.decay`) which lets it trigger at
   *  widening intervals while the response is unchanged.
  **/
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  /**
   *  Ajax.PeriodicalUpdater#start() -> undefined
   *  Triggers a `PeriodicalUpdater`'s Ajax request.
  **/
  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  /**
   *  Ajax.PeriodicalUpdater#stop() -> undefined
   *  Pauses a `PeriodicalUpdater`.
  **/
  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});
/** section: DOM
 *  $(element) -> Element
 *  $(element...) -> [Element...]
 *  - element (Element | String): A reference to an existing DOM node _or_ a
 *      string representing the node's ID.
 *
 *  If provided with a string, returns the element in the document with matching
 *  ID; otherwise returns the passed element.
 *
 *  Takes in an arbitrary number of arguments. All elements returned by the
 *  function are extended with Prototype's [[Element]] instance methods.
**/
function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

/** section: DOM
 * Node
**/
if (!window.Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  // DOM level 2 ECMAScript Language Binding
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}

/** section: DOM
 *  class Element
**/
(function() {
  /**
   *  new Element(tagName[, attributes])
   *  The `Element` object can be used to create new elements in a friendlier,
   *  more concise way than afforted by the built-in DOM methods. It returns
   *  an extended element, so you can chain a call to [[Element#update]] in
   *  order to set the element’s content.
  **/
  var element = this.Element;
  this.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;
    if (Prototype.Browser.IE && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }
    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
    return Element.writeAttribute(cache[tagName].cloneNode(false), attributes);
  };
  Object.extend(this.Element, element || { });
  if (element) this.Element.prototype = element.prototype;
}).call(window);

Element.cache = { };

Element.Methods = {
  /**
   *  Element.visible(@element) -> Boolean
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Returns a boolean indicating whether or not `element` is visible (i.e.,
   *  whether its inline style property is set to `display: none`).
  **/
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  /**
   *  Element.toggle(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Toggles the CSS `display` of `element` between `none` and its native value.
   *  Returns the element itself.
  **/
  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  /**
   *  Element.hide(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Hides `element` by setting its CSS `display` property to `none`. Returns
   *  the element itself.
  **/
  hide: function(element) {
    $(element).style.display = 'none';
    return element;
  },

  /**
   *  Element.show(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Displays `element` by setting its CSS `display` property to an empty
   *  string (deferring to a stylesheet or the element's native display state).
   *  Returns the element itself.
  **/
  show: function(element) {
    $(element).style.display = '';
    return element;
  },

  /**
   *  Element.remove(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Removes the element from its context in the DOM tree. Returns the element
   *  itself.
   *
   *  The element still exists after removal and can be re-appended elsewhere
   *  in the DOM tree.
  **/
  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  /**
   *  Element.update(@element[, content]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - content (String | Element | Object): The content to insert.
   *
   *  Replaces the content of element with the provided `content` argument.
   *  Returns itself.
   *
   *  `content` can be plain text, an HTML snippet, a DOM node, or a JavaScript
   *  object. If an object is passed, duck typing applies; `Element.update` will
   *  search for a method named `toHTML` or, failing that, `toString`.
   *
   *  If `content` contains any `<script>` tags, they will be evaluated after
   *  element has been updated (`Element.update` internally calls
   *  [[String#evalScripts]]).
   *
   *  If no argument is provided, `Element.update` will simply clear the element
   *  of its content.
   *
   *  Note that this method allows seamless content update of table-related
   *  elements in Internet Explorer 6 and beyond.
   *
   *  Returns the element itself.
  **/
  update: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) return element.update().insert(content);
    content = Object.toHTML(content);
    element.innerHTML = content.stripScripts();
    content.evalScripts.bind(content).defer();
    return element;
  },


  /**
   *  Element.replace(@element[, content]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - content (String | Element | Object): The content to insert.
   *
   *  Replaces `element` and its contents with the provided `content` argument.
   *  Returns the removed element.
   *
   *  `content` can be plain text, an HTML snippet, a DOM node, or a JavaScript
   *  object. If an object is passed, duck typing applies; `Element.replace`
   *  will search for a method named `toHTML` or, failing that, `toString`.
   *
   *  If `content` contains any `<script>` tags, they will be evaluated after
   *  the element has been updated (`Element.replace` internally calls
   *  [[String#evalScripts]]).
   *
   *  Note that if no argument is provided, Element.replace will simply clear
   *  `element` of its content. However, using [[Element.remove]] to do so is
   *  both faster and more standards-compliant.
  **/
  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  /**
   *  Element.insert(@element, content) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - content (Object | String | Element): The content to insert.
   *
   *  Inserts content before, after, at the top of, or at the bottom of
   *  `element`, as specified by the properties of the second argument. If the
   *  second argument is the content itself, `insert` will append it to
   *  `element`. Returns the element itself.
   *
   *  Accepts the following kinds of content: text, HTML, DOM elements, and any
   *  kind of object with a `toHTML` or `toElement` method.
   *
   *  Note that if the inserted HTML contains any `<script>` tags, they will be
   *  automatically evaluated after the insertion (`insert` internally calls
   *  [[String#evalScripts]] when inserting HTML).
  **/
  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  /**
   *  Element.wrap(@element[, wrapper]) -> Element
   *  Element.wrap(@element, wrapper[, attributes]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - wrapper (Element | String): An existing element to serve as the wrapper
   *      _or_ a string representing the tag name of an element to be created.
   *  - attributes (Object): Attributes that will be applied to the wrapper
   *      using [[Element.writeAttribute]].
   *
   *  Wraps an element inside another, then returns the wrapper.
   *
   *  If the given element exists on the page, `Element#wrap` will wrap it in
   *  place — the new element will insert itself at the same position and append
   *  the original element as its child.
  **/
  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  /** related to: Object.inspect
   *  Element.inspect(@element) -> String
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Returns the debug-oriented string representation of `element`.
  **/
  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(), attribute = pair.last();
      var value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  /**
   *  Element.recursivelyCollect(@element, property) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *  - property (String): The name of a property of `element` that points to a
   *      single DOM node (e.g., `parentNode`, `lastChild`).
   *
   *  Recursively collects elements whose relationship is specified by
   *  `property`. Returns an array of extended elements.
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  recursivelyCollect: function(element, property) {
    element = $(element);
    var elements = [];
    while (element = element[property])
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
    return elements;
  },

  /**
   *  Element.ancestors(@element) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Collects all of `element`’s ancestors and returns them as an array of
   *  extended elements.
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  ancestors: function(element) {
    return $(element).recursivelyCollect('parentNode');
  },

  /**
   *  Element.descendants(@element) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Collects all of `element`’s descendants and returns them as an array of
   *  extended elements.
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  descendants: function(element) {
    return $(element).select("*");
  },

  /**
   *  Element.firstDescendant(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Returns the first child that is _an element_. This is opposed to the
   *  `firstChild` DOM property, which will return _any node_ (often a
   *  whitespace-only text node).
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  /** deprecated, related to: Element.childElements
   *  Element.immediateDescendants(@element) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Collects all of the element’s immediate descendants (i.e., children) and
   *  returns them as an array of extended elements.
   *
   *  The returned array reflects the order of the children in the document
   *  (e.g., an index of 0 refers to the topmost child of element).
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  immediateDescendants: function(element) {
    if (!(element = $(element).firstChild)) return [];
    while (element && element.nodeType != 1) element = element.nextSibling;
    if (element) return [element].concat($(element).nextSiblings());
    return [];
  },

  /**
   *  Element.previousSiblings(@element) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Collects all of `element`’s previous siblings and returns them as an array
   *  of extended elements.
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  previousSiblings: function(element) {
    return $(element).recursivelyCollect('previousSibling');
  },

  /**
   *  Element.nextSiblings(@element) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Collects all of `element`'s next siblings and returns them as an array of
   *  extended elements.
   *
   *  Note that all of Prototype’s DOM traversal methods ignore text nodes and
   *  return element nodes only.
  **/
  nextSiblings: function(element) {
    return $(element).recursivelyCollect('nextSibling');
  },

  /**
   *  Element.siblings(@element) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Collects all of `element`’s siblings and returns them as an array of
   *  extended elements.
  **/
  siblings: function(element) {
    element = $(element);
    return element.previousSiblings().reverse().concat(element.nextSiblings());
  },

  /**
   *  Element.match(@element, selector) -> Boolean
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *
   *  Tests if `element` matches the given CSS selector.
  **/
  match: function(element, selector) {
    if (Object.isString(selector))
      selector = new Selector(selector);
    return selector.match($(element));
  },

  /**
   *  Element.up(@element[, selector]) -> Element
   *  Element.up(@element[, index]) -> Element
   *  Element.up(@element, selector[, index]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *  - index (Number): Number of results to skip.
   *
   *  Returns `element`’s first ancestor (or _n_th ancestor if `index` is
   *  specified) that matches `selector`.
   *
   *  If `selector` is omitted, all ancestors are considered. Returns
   *  `undefined` if no elements match.
  **/
  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = element.ancestors();
    return Object.isNumber(expression) ? ancestors[expression] :
      Selector.findElement(ancestors, expression, index);
  },

  /**
   *  Element.down(@element[, selector]) -> Element
   *  Element.down(@element[, index]) -> Element
   *  Element.down(@element, selector[, index]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *  - index (Number): Number of results to skip.
   *
   *  Returns `element`’s first descendant (or _n_th descendant if `index` is
   *  specified) that matches `selector`.
   *
   *  If `selector` is omitted, all descendants are considered. Returns
   *  `undefined` if no elements match.
  **/

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return element.firstDescendant();
    return Object.isNumber(expression) ? element.descendants()[expression] :
      element.select(expression)[index || 0];
  },

  /**
   *  Element.previous(@element[, selector]) -> Element
   *  Element.previous(@element[, index]) -> Element
   *  Element.previous(@element, selector[, index]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *  - index (Number): Number of results to skip.
   *
   *  Returns `element`’s first preceding sibling (or _n_th preceding sibling if
   *  `index` is specified) that matches `selector`.
   *
   *  If `selector` is omitted, all preceding siblings are considered.
   *  Returns `undefined` if no elements match.
  **/
  previous: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.previousElementSibling(element));
    var previousSiblings = element.previousSiblings();
    return Object.isNumber(expression) ? previousSiblings[expression] :
      Selector.findElement(previousSiblings, expression, index);
  },

  /**
   *  Element.next(@element[, selector]) -> Element
   *  Element.next(@element[, index]) -> Element
   *  Element.next(@element, selector[, index]) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *  - index (Number): Number of results to skip.
   *
   *  Returns `element`’s first following sibling (or _n_th following sibling if
   *  `index` is specified) that matches `selector`.
   *
   *  If `selector` is omitted, all following siblings are considered.
   *  Returns `undefined` if no elements match.
  **/
  next: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.nextElementSibling(element));
    var nextSiblings = element.nextSiblings();
    return Object.isNumber(expression) ? nextSiblings[expression] :
      Selector.findElement(nextSiblings, expression, index);
  },

  /** related to: $$
   *  Element.select(@element, selector...) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *
   *  Takes an arbitrary number of CSS selectors (strings) and returns an array
   *  of extended descendants of `element` that match any of them.
   *
   *  This method is very similar to [[$$]] but can be used within the context
   *  of one element, rather than the whole document. The supported CSS syntax
   *  is identical.
  **/
  select: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element, args);
  },

  /**
   *  Element.adjacent(@element[, selector...]) -> [Element...]
   *  - element (Element | String): A reference to a DOM element.
   *  - selector (String | Selector): A string representing a CSS selector
   *      _or_ an instance of [[Selector]].
   *
   *  Finds all siblings of `element` that match the given selector(s).
  **/
  adjacent: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element.parentNode, args).without(element);
  },

  /**
   *  Element.identify(@element) -> String
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Returns element’s id attribute if it exists; or else sets and returns a
   *  unique, auto-generated id.
  **/
  identify: function(element) {
    element = $(element);
    var id = element.readAttribute('id'), self = arguments.callee;
    if (id) return id;
    do { id = 'anonymous_element_' + self.counter++ } while ($(id));
    element.writeAttribute('id', id);
    return id;
  },

  /**
   *  Element.readAttribute(@element, attribute) -> String | null
   *  - element (Element | String): A reference to a DOM element.
   *  - attribute (String): The name of an HTML attribute.
   *
   *  Returns the value of element's attribute or `null` if attribute has not
   *  been specified.
  **/
  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  /**
   *  Element.writeAttribute(@element, attribute[, value = true]) -> Element
   *  Element.writeAttribute(@element, attributes) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - attribute (String): The name of an HTML attribute.
   *  - value (String | Boolean): The value of the attribute. Handles booleans
   *      for HTML attributes like `disabled` and `checked`.
   *  - attributes (Object): A set of attribute/value pairs to set on `element`.
   *
   *  Adds, changes, or removes attributes passed either as a hash or as
   *  consecutive arguments.
  **/
  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  /** deprecated
   *  Element.classNames(@element) -> Element.ClassNames
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Returns a new instance of `ClassNames`, an `Enumerable` object used to
   *  read and write CSS class names of `element`.
  **/
  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  /**
   *  Element.hasClassName(@element, className) -> Boolean
   *  - element (Element | String): A reference to a DOM element.
   *  - className (String): A CSS class name.
   *
   *  Checks whether `element` has the given CSS `className`.
  **/
  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  /**
   *  Element.addClassName(@element, className) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - className (String): A CSS class name.
   *
   *  Adds a CSS class to `element`. Returns the element itself.
  **/
  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!element.hasClassName(className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  /**
   *  Element.removeClassName(@element, className) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - className (String): A CSS class name.
   *
   *  Removes `element`’s CSS `className`. Returns the element itself.
  **/
  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  /**
   *  Element.toggleClassName(@element, className) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - className (String): A CSS class name.
   *
   *  Toggles `element`’s CSS `className` and returns `element`.
  **/
  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return element[element.hasClassName(className) ?
      'removeClassName' : 'addClassName'](className);
  },

  /**
   *  Element.cleanWhitespace(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Removes all of `element`'s text nodes which contain _only_ whitespace.
   *  Returns `element`.
  **/
  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  /**
   *  Element.empty(@element) -> Boolean
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Tests whether element is empty (i.e. contains only whitespace).
   *
   *  Note that this method's logic differs from the semantics of the CSS
   *  `:empty` pseudoclass, which excludes all elements whose content is of a
   *  length greater than zero.
  **/
  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  /**
   *  Element.descendantOf(@element, ancestor) -> Boolean
   *  - element (Element | String): A reference to a DOM element.
   *  - element (Element): The potential ancestor of `element`.
   *
   *  Tests whether `element` is a descendant of `ancestor`.
  **/
  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (ancestor.contains)
      return ancestor.contains(element) && ancestor !== element;

    while (element = element.parentNode)
      if (element == ancestor) return true;

    return false;
  },

  /**
   *  Element.scrollTo(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Scrolls the window so that `element` appears at the top of the viewport.
   *  Returns the element itself.
   *
   *  The effect is similar to what would be achieved using HTML anchors (except
   *  the browser’s history is not modified).
  **/
  scrollTo: function(element) {
    element = $(element);
    var pos = element.cumulativeOffset();
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  /**
   *  Element.getStyle(@element, property) -> String | null
   *  - element (Element | String): A reference to a DOM element.
   *  - property (String): The name of a CSS property. Can be specified in
   *      either hyphenated style (`z-index`) or camelCase style (`zIndex`).
   *
   *  Returns the given CSS property value of `element`.
  **/
  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value) {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  /**
   *  Element.setStyle(@element, styles) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *  - styles (Object): An object of property/value pairs in which the
   *      properties are specified _in their camelized form_.
   *
   *  Modifies `element`’s CSS style properties.
  **/
  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  /**
   *  Element.makePositioned(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Allows for the easy creation of a CSS containing block by setting
   *  `element`'s CSS position to `relative` if its initial position is either
   *  `static` or `undefined`. Returns the element itself.
  **/
  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      // Opera returns the offset relative to the positioning context, when an
      // element is position relative but top and left have not been defined
      if (window.opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  /** related to: Element.makePositioned
   *  Element.undoPositioned(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Sets element back to the state it was in _before_
   *  [[Element.makePositioned]] was applied. Returns the element itself.
  **/
  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  /**
   *  Element.makeClipping(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Simulates the poorly-supported CSS `clip` property by setting `element`'s
   *  `overflow` value to `hidden`. Returns the element itself.
  **/
  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  /** related to: Element.makeClipping
   *  Element.undoClipping(@element) -> Element
   *  - element (Element | String): A reference to a DOM element.
   *
   *  Sets `element`’s CSS `overflow` property back to the value it had _before_
   *  [[Element.makeClipping]] was applied. Returns the element itself.
  **/
  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  }
};

Element.Methods.identify.counter = 1;

Object.extend(Element.Methods, {
  /** deprecated, alias of: Element.select
   *  Element.getElementsBySelector(@element, selector...) -> [Element...]
  **/
  getElementsBySelector: Element.Methods.select,
  /** alias of: Element.immediateDescendants
   *  Element.childElements(@element) -> [Element...]
  **/
  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'left': case 'top': case 'right': case 'bottom':
          if (proceed(element, 'position') === 'static') return null;
        case 'height': case 'width':
          // returns '0px' for hidden elements; we want it to return null
          if (!Element.visible(element)) return null;

          // returns the border-box dimensions rather than the content-box
          // dimensions, so we subtract padding and borders from the value
          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  // IE doesn't report offsets correctly for static elements, so we change them
  // to "relative" to get the values, then change them back.
  Element.Methods.getOffsetParent = Element.Methods.getOffsetParent.wrap(
    function(proceed, element) {
      element = $(element);
      // IE throws an error if element is not in document
      try { element.offsetParent }
      catch(e) { return $(document.body) }
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);
      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    }
  );

  $w('positionedOffset viewportOffset').each(function(method) {
    Element.Methods[method] = Element.Methods[method].wrap(
      function(proceed, element) {
        element = $(element);
        try { element.offsetParent }
        catch(e) { return Element._returnOffset(0,0) }
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        // Trigger hasLayout on the offset parent so that IE6 reports
        // accurate offsetTop and offsetLeft values for position: fixed.
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          offsetParent.setStyle({ zoom: 1 });
        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );
  });

  Element.Methods.cumulativeOffset = Element.Methods.cumulativeOffset.wrap(
    function(proceed, element) {
      try { element.offsetParent }
      catch(e) { return Element._returnOffset(0,0) }
      return proceed(element);
    }
  );

  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = {
    read: {
      names: {
        'class': 'className',
        'for':   'htmlFor'
      },
      values: {
        _getAttr: function(element, attribute) {
          return element.getAttribute(attribute, 2);
        },
        _getAttrNode: function(element, attribute) {
          var node = element.getAttributeNode(attribute);
          return node ? node.value : "";
        },
        _getEv: function(element, attribute) {
          attribute = element.getAttribute(attribute);
          return attribute ? attribute.toString().slice(23, -2) : null;
        },
        _flag: function(element, attribute) {
          return $(element).hasAttribute(attribute) ? attribute : null;
        },
        style: function(element) {
          return element.style.cssText.toLowerCase();
        },
        title: function(element) {
          return element.title;
        }
      }
    }
  };

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr,
      src:         v._getAttr,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);

  // Wrap Element#update to clean up event handlers on
  // newly-removed elements. Prevents memory leaks in IE.
  Element.Methods.update = Element.Methods.update.wrap(
    function(proceed, element, contents) {
      Element.select(element, '*').each(Event.stopObserving);
      return proceed(element, contents);
    }
  );
}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if(element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };

  // Safari returns margins on body which is incorrect if the child is absolutely
  // positioned.  For performance reasons, redefine Element#cumulativeOffset for
  // KHTML/WebKit only.
  Element.Methods.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return Element._returnOffset(valueL, valueT);
  };
}

if (Prototype.Browser.IE || Prototype.Browser.Opera) {
  // IE and Opera are missing .innerHTML support for TABLE-related and SELECT elements
  Element.Methods.update = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) return element.update().insert(content);

    content = Object.toHTML(content);
    var tagName = element.tagName.toUpperCase();

    if (tagName in Element._insertionTranslations.tags) {
      $A(element.childNodes).each(function(node) { element.removeChild(node) });
      Element._getContentFromAnonymousElement(tagName, content.stripScripts())
        .each(function(node) { element.appendChild(node) });
    }
    else element.innerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

if ('outerHTML' in document.createElement('div')) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next();
      var fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html) {
  var div = new Element('div'), t = Element._insertionTranslations.tags[tagName];
  if (t) {
    div.innerHTML = t[0] + html + t[1];
    t[2].times(function() { div = div.firstChild });
  } else div.innerHTML = html;
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  Object.extend(this.tags, {
    THEAD: this.tags.TBODY,
    TFOOT: this.tags.TBODY,
    TH:    this.tags.TD
  });
}).call(Element._insertionTranslations);

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return node && node.specified;
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

if (!Prototype.BrowserFeatures.ElementExtensions &&
    document.createElement('div').__proto__) {
  window.HTMLElement = { };
  window.HTMLElement.prototype = document.createElement('div').__proto__;
  Prototype.BrowserFeatures.ElementExtensions = true;
}

/**
 *  Element.extend(element) -> Element
 *  - element (Element | String): A reference to a DOM element.
 *
 *  Extends `element` with _all_ of the methods contained in `Element.Methods`
 *  and `Element.Methods.Simulated`.
 *
 *  If `element` is an `input`, `textarea` or `select` element, it will also be
 *  extended with the methods from `Form.Element.Methods`. If it is a `form`
 *  tag, it will also be extended with the methods `Form.Methods`.
 *
 *  If methods for a specific tag have been defined using
 *  [[Element.addMethods]], those methods will also be added to any `element`
 *  with that same tag name.
**/
Element.extend = (function() {
  if (Prototype.BrowserFeatures.SpecificElementExtensions)
    return Prototype.K;

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || element._extendedByPrototype ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
      tagName = element.tagName.toUpperCase(), property, value;

    // extend methods for specific tags
    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    for (property in methods) {
      value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      // extend methods for all tags (Safari doesn't need this)
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

Element.hasAttribute = function(element, attribute) {
  if (element.hasAttribute) return element.hasAttribute(attribute);
  return Element.Methods.Simulated.hasAttribute(element, attribute);
};

/**
 *  Element.addMethods([methods]) -> undefined
 *  Element.addMethods(tagName, methods) -> undefined
 *  - tagName (String | Array): The name of an HTML element (or an array of
 *      names) on which to add the given methods. If omitted, will add methods
 *      to _all_ HTML elements.
 *  - methods (Object): A set of name/value pairs in which the values are
 *      functions.
 *
 *  Takes an object of methods and makes them available as methods of extended
 *  elements and of the `Element` object.
 *
 *  This method can be used to add methods to only certain HTML elements by
 *  passing the tag name as the first argument.
**/
Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    window[klass] = { };
    window[klass].prototype = document.createElement(tagName).__proto__;
    return window[klass];
  }

  if (F.ElementExtensions) {
    copy(Element.Methods, HTMLElement.prototype);
    copy(Element.Methods.Simulated, HTMLElement.prototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};
/** section: DOM
 *  class Element.Layout
**/
Element.Layout = Class.create({
  /**
   *  new Element.Layout(element[, options])
   *  Returns a versatile measurement object that quacks several ways. Can be
   *  coerced into a hash, an object, or JSON.
  **/
  initialize: function(element, options) {
    this.element = $(element);
    this.options = Object.extend({
      dimensions: true,
      offsets:    true
    }, options || {});

    this.layout = {};
    this.getLayout();
  },

  _applyTemporaryStyles: function(element, styles) {
    for (var property in styles) {
      element['_original_' + property] = element.style[property];
    }
    element.setStyle(styles);
  },

  _removeTemporaryStyles: function(element) {
    var prop, styles = {};
    for (var property in element) {
      if (!property.startsWith('_original_')) continue;
      prop = property.replace(/^_original_/, '');
      styles[prop] = element[property] || '';
      element[property] = undefined;
    }
    element.setStyle(styles);
  },

  getLayout: function() {
    var element = this.element,
        display = element.getStyle('display'),
        noOffsetWidth;

    // The style object is inaccessible in Safari <= 2.0 when the element
    // is hidden.
    var isNotShown = display === "none" || display === null || element.offsetHeight == 0;
    var isTable = element.tagName.toUpperCase() == 'TABLE';
    var hasHiddenAncestor = false;

    // If the element is hidden, we show it for an instant
    // to grab its dimensions.
    if (isNotShown) {
      this._applyTemporaryStyles(element, {
        visibility: 'hidden',
        position:   'absolute',
        display:    'block'
      });

      // If, after showing the element, it still has an offsetHeight of 0,
      // we assume one of its ancestors is hidden.
      hasHiddenAncestor = element.offsetHeight == 0;

      if (hasHiddenAncestor) {
        var ancestors = element.ancestors();
        ancestors.each( function(ancestor) {
          if (ancestor !== element && ancestor.visible()) return;
          this._applyTemporaryStyles(ancestor, {
            display: 'block', visibility: 'visible', position: 'absolute'
          });
        }, this);
      }
    }

    if (this.options.dimensions === true) {
      // clientWidth includes margin offsets of a table in Mozilla,
      // set offsets to 0, get width value, then revert back
      if (isTable) {
        var originalLeft = element.style.marginLeft;
        var originalRight = element.style.marginRight;
        element.style.marginLeft = '0px';
        element.style.marginRight = '0px';
        noOffsetWidth = element.clientWidth;
        element.style.marginLeft = originalLeft;
        element.style.marginRight = originalRight;
      }

      var paddingBox = {
        width:  noOffsetWidth || element.clientWidth,
        height: element.clientHeight
      };

      // For backwards-compatibility, the returned object will have
      // width and height equal to the padding-box values.
      Object.extend(this.layout, paddingBox);

      this.layout.paddingBox = paddingBox;

      var padding = this._getStyleValuesFor('padding', 'trbl');
      this.layout.padding = padding;

      var contentBox = {
        width:  paddingBox.width  - padding.left - padding.right,
        height: paddingBox.height - padding.top  - padding.bottom
      };

      this.layout.contentBox = contentBox;

      var border = this._getStyleValuesFor('border', 'trbl');
      this.layout.border = border;

      var borderBox = {
        width:  paddingBox.width  + border.left + border.right,
        height: paddingBox.height + border.top  + border.bottom
      };

      this.layout.borderBox = borderBox;

    } // dimensions


    if (this.options.offsets === true) {
      var offsets = {};

      offsets.positioned = this.offset();
      offsets.viewport   = this.viewportOffset();
      offsets.scroll     = this.scrollOffset();
      offsets.document   = this.documentOffset();

      this.layout.offsets = offsets;
    } // offsets

    // If we altered the element's styles, return them to their
    // original values.
    if (isNotShown) {
      this._removeTemporaryStyles(element);
      if (hasHiddenAncestor) {
        ancestors.each(this._removeTemporaryStyles, this);
      }
    }

    return this.layout;
  },

  // Converts a raw CSS value like '9px' or '1em' to
  // a number (in pixels).
  // IE: Redefined below
  cssToNumber: function(property) {
    return window.parseFloat(this.element.getStyle(property));
  },

  // sidesNeeded argument is a string.
  // "trbl" = top, right, bottom, left
  // "tb"   = top, bottom
  _getStyleValuesFor: function(property, sidesNeeded) {
    var sides = $w('top bottom left right');
    var propertyNames = sides.map( function(s) {
      return property + s.capitalize();
    });

    if (property === 'border') {
      propertyNames = propertyNames.map( function(p) {
        return p + 'Width';
      });
    }

    var values = {};

    sides.each( function(side, index) {
      if (!sidesNeeded.include(side.charAt(0))) return;
      values[side] = this.cssToNumber(propertyNames[index]);
    }, this);

    return values;
  },

  toObject: function() {
    return this.layout;
  },

  toHash: function() {
    return $H(this.layout);
  },

  toJSON: function() {
    return Object.toJSON(this.layout);
  },

  toCSS: function() {
    var css = {}, d = this.layout;
    if (this.options.dimensions) {
      var margins = $w('top right bottom left').map( function(side) {
        return d.margin[side] + 'px';
      }).join(' ');
      var padding = $w('top right bottom left').map( function(side) {
        return d.padding[side] + 'px';
      }).join(' ');

      Object.extend(css, {
        width:   d.contentBox.width  + 'px',
        height:  d.contentBox.height + 'px',
        margin:  margins,
        padding: padding
      });
    }

    if (this.options.offsets) {
      Object.extend(css, {
        left: d.offset.left + 'px',
        top:  d.offset.top  + 'px'
      });
    }

    return css;
  },

  /**
   *  Element.Layout#dimensions() -> Element.Coordinates
   *  Reports the dimensions of the given element.
  **/
  dimensions: function() {
    var box = this.layout.contentBox;
    return { width: box.width, height: box.height };
  },

  /**
   *  Element.Layout#offset([element=document]) -> Element.Coordinates
   *  Positioned offset. Measured from offset parent.
  **/
  offset: function() {
    var element = this.element;
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (element.tagName.toUpperCase() == 'BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);
    return Element.Layout.normalize({ left: valueL, top: valueT });
  },

  /**
   *  Element.Layout#viewportOffset() -> Element.Coordinates
   *  Reports the element's top- and left-distance from the upper-left
   *  corner of the viewport.
  **/
  viewportOffset: function() {
    var element = this.element;

    // IE and FF >= 3 provide getBoundingClientRect, a much quicker path
    // to retrieving viewport offset.
    if (element.getBoundingClientRect) {
      var d = element.getBoundingClientRect();
      return { left: Math.round(d.left), top: Math.round(d.top) };
    }

    var valueT = 0, valueL = 0, element = this.element;

    // First collect cumulative offsets
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      if (element.offsetParent == document.body &&
        Element.getStyle(element, 'position') === 'absolute') break;

    } while (element = element.offsetParent);

    // Then subtract cumulative scroll offsets
    element = this.element;
    do {
      if (!Prototype.Browser.Opera || element.tagName.toUpperCase() == 'HTML') {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return { left: valueL, top: valueT };
  },

  /**
   *  Element.Layout#documentOffset() -> Element.Coords
   *  Reports the element's top- and left-distance from the upper-left
   *  corner of its containing document.
  **/
  documentOffset: function() {
    var element = this.element;
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return Element.Layout.normalize({ left: valueL, top: valueT });
  },

  /**
   *  Element.Layout#offsetParent() -> Element
   *  Returns the element's positioning context — the nearest ancestor
   *  with a CSS "position" value other than "static."
  **/
  offsetParent: function() {
    var element = this.element;
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element !== document.body
     && element.nodeType !== 9)
      if (Element.getStyle(element, 'position') !== 'static')
        return element;

    return $(document.body);
  },

  /**
   *  Element.Layout#scrollOffset(@element) -> Object
   *  Reports the element's top- and left-distance from the upper-left
   *  corner of its containing document, compensating for the scroll
   *  offsets of any ancestors.
  **/
  scrollOffset: function() {
    var element = this.element;
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return Element.Layout.normalize({ left: valueL, top: valueT });
  }

});

if (Prototype.Browser.IE) {
  Element.Layout.addMethods({
    // IE gives the literal cascaded style, not the computed style.
    // We need to ensure pixel values are returned.
    cssToNumber: function(property) {
      var value = this.element.getStyle(property);

      if ((/^\d+(px)?$/i).test(value))
        return window.parseFloat(value);

      // If the unit is something other than a pixel (em, pt, %), set it on
      // something we can grab a pixel value from.
      var element = this.element;

      var sl = element.style.left, rsl = element.runtimeStyle.left;

      element.runtimeStyle.left = element.currentStyle.left;
      element.style.left = value || 0;

      value = element.style.pixelLeft;

      element.style.left = sl;
      element.runtimeStyle.left = rsl;

      return value;
    }
  });
}

// Acts like an array for backwards-compatibility.
Element.Layout.normalize = function(obj) {
  var arr = [];
  arr[0] = ('left' in obj) ? obj.left : obj.width;
  arr[1] = ('top'  in obj) ? obj.top  : obj.height;
  return Object.extend(arr, obj);
};

Object.extend(Element.Methods, {
  /**
   *  Element#getLayout(@element[, options]) -> Object
   *  Reports the dimensions and offsets of the given element.
   *
   *  By default, `getLayout` will return as much information about the
   *  element as possible: dimensions for the content, padding, and border
   *  boxes; and viewport, cumulative, scroll, and positioned offsets.
   *  The `options` argument can be used to bypass checks you don't need
   *  when speed is of the utmost importance.
  **/
  getLayout: function(element, options) {
    return new Element.Layout(element, options).toObject();
  },

  getDimensions: function(element) {
    var d = new Element.Layout(element, { offsets: false }).toObject();
    return Object.extend(Element.Layout.normalize(d), d);
  },

  /**
   *  Element#getHeight(@element) -> Number
   *  Returns the height of the element.
  **/
  getHeight: function(element) {
    return Element.getDimensions(element).height;
  },

  /**
   *  Element#getWidth(@element) -> Number
   *  Returns the width of the element.
  **/
  getWidth: function(element) {
    return Element.getDimensions(element).width;
  },

  getOffsets: function(element) {
    return new Element.Layout(element, { dimensions: false }).toObject().offsets;
  },

  viewportOffset: function(element) {
    var o = Element.getOffsets(element).viewport;
    return Element.Layout.normalize(o);
  },

  cumulativeOffset: function(element) {
    var o = Element.getOffsets(element).document;
    return Element.Layout.normalize(o);
  },

  /**
   *  Element#cumulativeScrollOffset(@element) -> Object
   *  Reports the element's top- and left-distance from the upper-left
   *  corner of its containing document, compensating for the scroll
   *  offsets of any ancestors.
  **/
  cumulativeScrollOffset: function(element) {
    var o = Element.getOffsets(element).scroll;
    return Element.Layout.normalize(o);
  },

  /**
   *  Element#cumulativeOffset(@element) -> Object
   *  Reports the element's top- and left-distance from its positioning
   *  parent.
  **/
  positionedOffset: function(element) {
    var o = Element.getOffsets(element).positioned;
    return Element.Layout.normalize(o);
  },

  /**
   *  Element#absolutize(@element) -> Element
   *  Switches element from static/relative positioning to absolute
   *  positioning while maintaining the element's size and position.
  **/
  absolutize: function(element) {
    element = $(element);
    if (element.getStyle('position') === 'absolute') return element;

    var offsets = element.positionedOffset();
    var top     = offsets[1];
    var left    = offsets[0];
    var width   = element.clientWidth;
    var height  = element.clientHeight;

    Object.extend(element, {
      _originalLeft:   left - parseFloat(element.style.left || 0),
      _originalTop:    top  - parseFloat(element.style.top  || 0),
      _originalWidth:  element.style.width,
      _originalHeight: element.style.height
    });

    element.setStyle({
      position: 'absolute',
      top:      top + 'px',
      left:     left + 'px',
      width:    width + 'px',
      height:   height + 'px'
    });

    return element;
  },

  /**
   *  Element#relativize(@element) -> Element
   *  Reverts element from absolute positioning to relative positioning
   *  while maintaining the element's size and position.
  **/
  relativize: function(element) {
    element = $(element);
    if (element.getStyle('position') === 'relative') return element;

    if (Object.isUndefined(element._originalTop)) {
      throw "Element#absolutize must be called first.";
    }

    element.setStyle({ position: 'relative' });

    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0);
    var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.setStyle({
      top:      top + 'px',
      left:     left + 'px',
      width:    element._originalHeight + 'px',
      height:   element._originalWidth  + 'px'
    });

    return element;
  },

  /**
   *  Element#getOffsetParent(@element) -> Element
   *  Returns the element's positioning context — the nearest ancestor
   *  with a CSS "position" value other than "static."
  **/
  getOffsetParent: function(element) {
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element !== document.body)
      if (Element.getStyle(element, 'position') !== 'static')
        return element;

    return $(document.body);
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    // find page position of source
    source = $(source);
    var sourceLayout = new Element.Layout(source).toCSS();

    if (!options.setHeight) delete sourceLayout.height;
    if (!options.setWidth)  delete sourceLayout.width;
    if (!options.setLeft)   delete sourceLayout.left;
    if (!options.setTop)    delete sourceLayout.top;

    $(element).setStyle(souceLayout);

    return element;
  }
});

/** section: DOM
 * document.viewport
**/ 

document.viewport = {
  /**
   *  document.viewport.getDimensions() -> Object
   *  Returns the height and width of the browser viewport.
  **/
  getDimensions: function() {
    var dimensions = { };
    var B = Prototype.Browser;
    $w('width height').each(function(d) {
      var D = d.capitalize();
      dimensions[d] = (B.WebKit && !document.evaluate) ? self['inner' + D] :
        (B.Opera) ? document.body['client' + D] : document.documentElement['client' + D];
    });
    return dimensions;
  },

  /**
   *  document.viewport.getWidth() -> Number
   *  Returns the width of the browser viewport.
  **/
  getWidth: function() {
    return this.getDimensions().width;
  },

  /**
   *  document.viewport.getHeight() -> Number
   *  Returns the height of the browser viewport.
  **/
  getHeight: function() {
    return this.getDimensions().height;
  },

  /**
   *  document.viewport.getScrollOffsets() -> Object
   *  Returns the distances the viewport has been scrolled in the
   *  horizontal and vertical directions.
  **/
  getScrollOffsets: function() {
    return Element.Layout.normalize({
      left: window.pageXOffset
        || document.documentElement.scrollLeft
        || document.body.scrollLeft,
      top: window.pageYOffset
        || document.documentElement.scrollTop
        || document.body.scrollTop
    });
  }
};
/* Portions of the Selector class are derived from Jack Slocum's DomQuery,
 * part of YUI-Ext version 0.40, distributed under the terms of an MIT-style
 * license.  Please see http://www.yui-ext.com/ for more information. */

var Selector = Class.create({
  initialize: function(expression) {
    this.expression = expression.strip();

    if (this.shouldUseSelectorsAPI()) {
      this.mode = 'selectorsAPI';
    } else if (this.shouldUseXPath()) {
      this.mode = 'xpath';
      this.compileXPathMatcher();
    } else {
      this.mode = "normal";
      this.compileMatcher();
    }

  },

  shouldUseXPath: function() {
    if (!Prototype.BrowserFeatures.XPath) return false;

    var e = this.expression;

    // Safari 3 chokes on :*-of-type and :empty
    if (Prototype.Browser.WebKit &&
     (e.include("-of-type") || e.include(":empty")))
      return false;

    // XPath can't do namespaced attributes, nor can it read
    // the "checked" property from DOM nodes
    if ((/(\[[\w-]*?:|:checked)/).test(e))
      return false;

    return true;
  },

  shouldUseSelectorsAPI: function() {
    if (!Prototype.BrowserFeatures.SelectorsAPI) return false;

    if (!Selector._div) Selector._div = new Element('div');

    // Make sure the browser treats the selector as valid. Test on an
    // isolated element to minimize cost of this check.
    try {
      Selector._div.querySelector(this.expression);
    } catch(e) {
      return false;
    }

    return true;
  },

  compileMatcher: function() {
    var e = this.expression, ps = Selector.patterns, h = Selector.handlers,
        c = Selector.criteria, le, p, m;

    if (Selector._cache[e]) {
      this.matcher = Selector._cache[e];
      return;
    }

    this.matcher = ["this.matcher = function(root) {",
                    "var r = root, h = Selector.handlers, c = false, n;"];

    while (e && le != e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        p = ps[i];
        if (m = e.match(p)) {
          this.matcher.push(Object.isFunction(c[i]) ? c[i](m) :
            new Template(c[i]).evaluate(m));
          e = e.replace(m[0], '');
          break;
        }
      }
    }

    this.matcher.push("return h.unique(n);\n}");
    eval(this.matcher.join('\n'));
    Selector._cache[this.expression] = this.matcher;
  },

  compileXPathMatcher: function() {
    var e = this.expression, ps = Selector.patterns,
        x = Selector.xpath, le, m;

    if (Selector._cache[e]) {
      this.xpath = Selector._cache[e]; return;
    }

    this.matcher = ['.//*'];
    while (e && le != e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        if (m = e.match(ps[i])) {
          this.matcher.push(Object.isFunction(x[i]) ? x[i](m) :
            new Template(x[i]).evaluate(m));
          e = e.replace(m[0], '');
          break;
        }
      }
    }

    this.xpath = this.matcher.join('');
    Selector._cache[this.expression] = this.xpath;
  },

  findElements: function(root) {
    root = root || document;
    var e = this.expression, results;

    switch (this.mode) {
      case 'selectorsAPI':
        // querySelectorAll queries document-wide, then filters to descendants
        // of the context element. That's not what we want.
        // Add an explicit context to the selector if necessary.
        if (root !== document) {
          var oldId = root.id, id = $(root).identify();
          e = "#" + id + " " + e;
        }

        results = $A(root.querySelectorAll(e)).map(Element.extend);
        root.id = oldId;

        return results;
      case 'xpath':
        return document._getElementsByXPath(this.xpath, root);
      default:
       return this.matcher(root);
    }
  },

  match: function(element) {
    this.tokens = [];

    var e = this.expression, ps = Selector.patterns, as = Selector.assertions;
    var le, p, m;

    while (e && le !== e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        p = ps[i];
        if (m = e.match(p)) {
          // use the Selector.assertions methods unless the selector
          // is too complex.
          if (as[i]) {
            this.tokens.push([i, Object.clone(m)]);
            e = e.replace(m[0], '');
          } else {
            // reluctantly do a document-wide search
            // and look for a match in the array
            return this.findElements(document).include(element);
          }
        }
      }
    }

    var match = true, name, matches;
    for (var i = 0, token; token = this.tokens[i]; i++) {
      name = token[0], matches = token[1];
      if (!Selector.assertions[name](element, matches)) {
        match = false; break;
      }
    }

    return match;
  },

  toString: function() {
    return this.expression;
  },

  inspect: function() {
    return "#<Selector:" + this.expression.inspect() + ">";
  }
});

Object.extend(Selector, {
  _cache: { },

  xpath: {
    descendant:   "//*",
    child:        "/*",
    adjacent:     "/following-sibling::*[1]",
    laterSibling: '/following-sibling::*',
    tagName:      function(m) {
      if (m[1] == '*') return '';
      return "[local-name()='" + m[1].toLowerCase() +
             "' or local-name()='" + m[1].toUpperCase() + "']";
    },
    className:    "[contains(concat(' ', @class, ' '), ' #{1} ')]",
    id:           "[@id='#{1}']",
    attrPresence: function(m) {
      m[1] = m[1].toLowerCase();
      return new Template("[@#{1}]").evaluate(m);
    },
    attr: function(m) {
      m[1] = m[1].toLowerCase();
      m[3] = m[5] || m[6];
      return new Template(Selector.xpath.operators[m[2]]).evaluate(m);
    },
    pseudo: function(m) {
      var h = Selector.xpath.pseudos[m[1]];
      if (!h) return '';
      if (Object.isFunction(h)) return h(m);
      return new Template(Selector.xpath.pseudos[m[1]]).evaluate(m);
    },
    operators: {
      '=':  "[@#{1}='#{3}']",
      '!=': "[@#{1}!='#{3}']",
      '^=': "[starts-with(@#{1}, '#{3}')]",
      '$=': "[substring(@#{1}, (string-length(@#{1}) - string-length('#{3}') + 1))='#{3}']",
      '*=': "[contains(@#{1}, '#{3}')]",
      '~=': "[contains(concat(' ', @#{1}, ' '), ' #{3} ')]",
      '|=': "[contains(concat('-', @#{1}, '-'), '-#{3}-')]"
    },
    pseudos: {
      'first-child': '[not(preceding-sibling::*)]',
      'last-child':  '[not(following-sibling::*)]',
      'only-child':  '[not(preceding-sibling::* or following-sibling::*)]',
      'empty':       "[count(*) = 0 and (count(text()) = 0)]",
      'checked':     "[@checked]",
      'disabled':    "[(@disabled) and (@type!='hidden')]",
      'enabled':     "[not(@disabled) and (@type!='hidden')]",
      'not': function(m) {
        var e = m[6], p = Selector.patterns,
            x = Selector.xpath, le, v;

        var exclusion = [];
        while (e && le != e && (/\S/).test(e)) {
          le = e;
          for (var i in p) {
            if (m = e.match(p[i])) {
              v = Object.isFunction(x[i]) ? x[i](m) : new Template(x[i]).evaluate(m);
              exclusion.push("(" + v.substring(1, v.length - 1) + ")");
              e = e.replace(m[0], '');
              break;
            }
          }
        }
        return "[not(" + exclusion.join(" and ") + ")]";
      },
      'nth-child':      function(m) {
        return Selector.xpath.pseudos.nth("(count(./preceding-sibling::*) + 1) ", m);
      },
      'nth-last-child': function(m) {
        return Selector.xpath.pseudos.nth("(count(./following-sibling::*) + 1) ", m);
      },
      'nth-of-type':    function(m) {
        return Selector.xpath.pseudos.nth("position() ", m);
      },
      'nth-last-of-type': function(m) {
        return Selector.xpath.pseudos.nth("(last() + 1 - position()) ", m);
      },
      'first-of-type':  function(m) {
        m[6] = "1"; return Selector.xpath.pseudos['nth-of-type'](m);
      },
      'last-of-type':   function(m) {
        m[6] = "1"; return Selector.xpath.pseudos['nth-last-of-type'](m);
      },
      'only-of-type':   function(m) {
        var p = Selector.xpath.pseudos; return p['first-of-type'](m) + p['last-of-type'](m);
      },
      nth: function(fragment, m) {
        var mm, formula = m[6], predicate;
        if (formula == 'even') formula = '2n+0';
        if (formula == 'odd')  formula = '2n+1';
        if (mm = formula.match(/^(\d+)$/)) // digit only
          return '[' + fragment + "= " + mm[1] + ']';
        if (mm = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
          if (mm[1] == "-") mm[1] = -1;
          var a = mm[1] ? Number(mm[1]) : 1;
          var b = mm[2] ? Number(mm[2]) : 0;
          predicate = "[((#{fragment} - #{b}) mod #{a} = 0) and " +
          "((#{fragment} - #{b}) div #{a} >= 0)]";
          return new Template(predicate).evaluate({
            fragment: fragment, a: a, b: b });
        }
      }
    }
  },

  criteria: {
    tagName:      'n = h.tagName(n, r, "#{1}", c);      c = false;',
    className:    'n = h.className(n, r, "#{1}", c);    c = false;',
    id:           'n = h.id(n, r, "#{1}", c);           c = false;',
    attrPresence: 'n = h.attrPresence(n, r, "#{1}", c); c = false;',
    attr: function(m) {
      m[3] = (m[5] || m[6]);
      return new Template('n = h.attr(n, r, "#{1}", "#{3}", "#{2}", c); c = false;').evaluate(m);
    },
    pseudo: function(m) {
      if (m[6]) m[6] = m[6].replace(/"/g, '\\"');
      return new Template('n = h.pseudo(n, "#{1}", "#{6}", r, c); c = false;').evaluate(m);
    },
    descendant:   'c = "descendant";',
    child:        'c = "child";',
    adjacent:     'c = "adjacent";',
    laterSibling: 'c = "laterSibling";'
  },

  patterns: {
    // combinators must be listed first
    // (and descendant needs to be last combinator)
    laterSibling: /^\s*~\s*/,
    child:        /^\s*>\s*/,
    adjacent:     /^\s*\+\s*/,
    descendant:   /^\s/,

    // selectors follow
    tagName:      /^\s*(\*|[\w\-]+)(\b|$)?/,
    id:           /^#([\w\-\*]+)(\b|$)/,
    className:    /^\.([\w\-\*]+)(\b|$)/,
    pseudo:
/^:((first|last|nth|nth-last|only)(-child|-of-type)|empty|checked|(en|dis)abled|not)(\((.*?)\))?(\b|$|(?=\s|[:+~>]))/,
    attrPresence: /^\[((?:[\w]+:)?[\w]+)\]/,
    attr:         /\[((?:[\w-]*:)?[\w-]+)\s*(?:([!^$*~|]?=)\s*((['"])([^\4]*?)\4|([^'"][^\]]*?)))?\]/
  },

  // for Selector.match and Element#match
  assertions: {
    tagName: function(element, matches) {
      return matches[1].toUpperCase() == element.tagName.toUpperCase();
    },

    className: function(element, matches) {
      return Element.hasClassName(element, matches[1]);
    },

    id: function(element, matches) {
      return element.id === matches[1];
    },

    attrPresence: function(element, matches) {
      return Element.hasAttribute(element, matches[1]);
    },

    attr: function(element, matches) {
      var nodeValue = Element.readAttribute(element, matches[1]);
      return nodeValue && Selector.operators[matches[2]](nodeValue, matches[5] || matches[6]);
    }
  },

  handlers: {
    // UTILITY FUNCTIONS
    // joins two collections
    concat: function(a, b) {
      for (var i = 0, node; node = b[i]; i++)
        a.push(node);
      return a;
    },

    // marks an array of nodes for counting
    mark: function(nodes) {
      var _true = Prototype.emptyFunction;
      for (var i = 0, node; node = nodes[i]; i++)
        node._countedByPrototype = _true;
      return nodes;
    },

    unmark: function(nodes) {
      for (var i = 0, node; node = nodes[i]; i++)
        node._countedByPrototype = undefined;
      return nodes;
    },

    // mark each child node with its position (for nth calls)
    // "ofType" flag indicates whether we're indexing for nth-of-type
    // rather than nth-child
    index: function(parentNode, reverse, ofType) {
      parentNode._countedByPrototype = Prototype.emptyFunction;
      if (reverse) {
        for (var nodes = parentNode.childNodes, i = nodes.length - 1, j = 1; i >= 0; i--) {
          var node = nodes[i];
          if (node.nodeType == 1 && (!ofType || node._countedByPrototype)) node.nodeIndex = j++;
        }
      } else {
        for (var i = 0, j = 1, nodes = parentNode.childNodes; node = nodes[i]; i++)
          if (node.nodeType == 1 && (!ofType || node._countedByPrototype)) node.nodeIndex = j++;
      }
    },

    // filters out duplicates and extends all nodes
    unique: function(nodes) {
      if (nodes.length == 0) return nodes;
      var results = [], n;
      for (var i = 0, l = nodes.length; i < l; i++)
        if (!(n = nodes[i])._countedByPrototype) {
          n._countedByPrototype = Prototype.emptyFunction;
          results.push(Element.extend(n));
        }
      return Selector.handlers.unmark(results);
    },

    // COMBINATOR FUNCTIONS
    descendant: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, node.getElementsByTagName('*'));
      return results;
    },

    child: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        for (var j = 0, child; child = node.childNodes[j]; j++)
          if (child.nodeType == 1 && child.tagName != '!') results.push(child);
      }
      return results;
    },

    adjacent: function(nodes) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        var next = this.nextElementSibling(node);
        if (next) results.push(next);
      }
      return results;
    },

    laterSibling: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, Element.nextSiblings(node));
      return results;
    },

    nextElementSibling: function(node) {
      while (node = node.nextSibling)
        if (node.nodeType == 1) return node;
      return null;
    },

    previousElementSibling: function(node) {
      while (node = node.previousSibling)
        if (node.nodeType == 1) return node;
      return null;
    },

    // TOKEN FUNCTIONS
    tagName: function(nodes, root, tagName, combinator) {
      var uTagName = tagName.toUpperCase();
      var results = [], h = Selector.handlers;
      if (nodes) {
        if (combinator) {
          // fastlane for ordinary descendant combinators
          if (combinator == "descendant") {
            for (var i = 0, node; node = nodes[i]; i++)
              h.concat(results, node.getElementsByTagName(tagName));
            return results;
          } else nodes = this[combinator](nodes);
          if (tagName == "*") return nodes;
        }
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName.toUpperCase() === uTagName) results.push(node);
        return results;
      } else return root.getElementsByTagName(tagName);
    },

    id: function(nodes, root, id, combinator) {
      var targetNode = $(id), h = Selector.handlers;
      if (!targetNode) return [];
      if (!nodes && root == document) return [targetNode];
      if (nodes) {
        if (combinator) {
          if (combinator == 'child') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (targetNode.parentNode == node) return [targetNode];
          } else if (combinator == 'descendant') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (Element.descendantOf(targetNode, node)) return [targetNode];
          } else if (combinator == 'adjacent') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (Selector.handlers.previousElementSibling(targetNode) == node)
                return [targetNode];
          } else nodes = h[combinator](nodes);
        }
        for (var i = 0, node; node = nodes[i]; i++)
          if (node == targetNode) return [targetNode];
        return [];
      }
      return (targetNode && Element.descendantOf(targetNode, root)) ? [targetNode] : [];
    },

    className: function(nodes, root, className, combinator) {
      if (nodes && combinator) nodes = this[combinator](nodes);
      return Selector.handlers.byClassName(nodes, root, className);
    },

    byClassName: function(nodes, root, className) {
      if (!nodes) nodes = Selector.handlers.descendant([root]);
      var needle = ' ' + className + ' ';
      for (var i = 0, results = [], node, nodeClassName; node = nodes[i]; i++) {
        nodeClassName = node.className;
        if (nodeClassName.length == 0) continue;
        if (nodeClassName == className || (' ' + nodeClassName + ' ').include(needle))
          results.push(node);
      }
      return results;
    },

    attrPresence: function(nodes, root, attr, combinator) {
      if (!nodes) nodes = root.getElementsByTagName("*");
      if (nodes && combinator) nodes = this[combinator](nodes);
      var results = [];
      for (var i = 0, node; node = nodes[i]; i++)
        if (Element.hasAttribute(node, attr)) results.push(node);
      return results;
    },

    attr: function(nodes, root, attr, value, operator, combinator) {
      if (!nodes) nodes = root.getElementsByTagName("*");
      if (nodes && combinator) nodes = this[combinator](nodes);
      var handler = Selector.operators[operator], results = [];
      for (var i = 0, node; node = nodes[i]; i++) {
        var nodeValue = Element.readAttribute(node, attr);
        if (nodeValue === null) continue;
        if (handler(nodeValue, value)) results.push(node);
      }
      return results;
    },

    pseudo: function(nodes, name, value, root, combinator) {
      if (nodes && combinator) nodes = this[combinator](nodes);
      if (!nodes) nodes = root.getElementsByTagName("*");
      return Selector.pseudos[name](nodes, value, root);
    }
  },

  pseudos: {
    'first-child': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        if (Selector.handlers.previousElementSibling(node)) continue;
          results.push(node);
      }
      return results;
    },
    'last-child': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        if (Selector.handlers.nextElementSibling(node)) continue;
          results.push(node);
      }
      return results;
    },
    'only-child': function(nodes, value, root) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!h.previousElementSibling(node) && !h.nextElementSibling(node))
          results.push(node);
      return results;
    },
    'nth-child':        function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root);
    },
    'nth-last-child':   function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, true);
    },
    'nth-of-type':      function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, false, true);
    },
    'nth-last-of-type': function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, true, true);
    },
    'first-of-type':    function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, "1", root, false, true);
    },
    'last-of-type':     function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, "1", root, true, true);
    },
    'only-of-type':     function(nodes, formula, root) {
      var p = Selector.pseudos;
      return p['last-of-type'](p['first-of-type'](nodes, formula, root), formula, root);
    },

    // handles the an+b logic
    getIndices: function(a, b, total) {
      if (a == 0) return b > 0 ? [b] : [];
      return $R(1, total).inject([], function(memo, i) {
        if (0 == (i - b) % a && (i - b) / a >= 0) memo.push(i);
        return memo;
      });
    },

    // handles nth(-last)-child, nth(-last)-of-type, and (first|last)-of-type
    nth: function(nodes, formula, root, reverse, ofType) {
      if (nodes.length == 0) return [];
      if (formula == 'even') formula = '2n+0';
      if (formula == 'odd')  formula = '2n+1';
      var h = Selector.handlers, results = [], indexed = [], m;
      h.mark(nodes);
      for (var i = 0, node; node = nodes[i]; i++) {
        if (!node.parentNode._countedByPrototype) {
          h.index(node.parentNode, reverse, ofType);
          indexed.push(node.parentNode);
        }
      }
      if (formula.match(/^\d+$/)) { // just a number
        formula = Number(formula);
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.nodeIndex == formula) results.push(node);
      } else if (m = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
        if (m[1] == "-") m[1] = -1;
        var a = m[1] ? Number(m[1]) : 1;
        var b = m[2] ? Number(m[2]) : 0;
        var indices = Selector.pseudos.getIndices(a, b, nodes.length);
        for (var i = 0, node, l = indices.length; node = nodes[i]; i++) {
          for (var j = 0; j < l; j++)
            if (node.nodeIndex == indices[j]) results.push(node);
        }
      }
      h.unmark(nodes);
      h.unmark(indexed);
      return results;
    },

    'empty': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        // IE treats comments as element nodes
        if (node.tagName == '!' || node.firstChild) continue;
        results.push(node);
      }
      return results;
    },

    'not': function(nodes, selector, root) {
      var h = Selector.handlers, selectorType, m;
      var exclusions = new Selector(selector).findElements(root);
      h.mark(exclusions);
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!node._countedByPrototype) results.push(node);
      h.unmark(exclusions);
      return results;
    },

    'enabled': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!node.disabled && (!node.type || node.type !== 'hidden'))
          results.push(node);
      return results;
    },

    'disabled': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (node.disabled) results.push(node);
      return results;
    },

    'checked': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (node.checked) results.push(node);
      return results;
    }
  },

  operators: {
    '=':  function(nv, v) { return nv == v; },
    '^=': function(nv, v) { return nv == v || nv && nv.startsWith(v); },
    '$=': function(nv, v) { return nv == v || nv && nv.endsWith(v); },
    '*=': function(nv, v) { return nv == v || nv && nv.include(v); },
    '$=': function(nv, v) { return nv.endsWith(v); },
    '*=': function(nv, v) { return nv.include(v); },
    '~=': function(nv, v) { return (' ' + nv + ' ').include(' ' + v + ' '); },
    '|=': function(nv, v) { return ('-' + (nv || "").toUpperCase() +
     '-').include('-' + (v || "").toUpperCase() + '-'); }
  },

  split: function(expression) {
    var expressions = [];
    expression.scan(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/, function(m) {
      expressions.push(m[1].strip());
    });
    return expressions;
  },

  matchElements: function(elements, expression) {
    var matches = $$(expression), h = Selector.handlers;
    h.mark(matches);
    for (var i = 0, results = [], element; element = elements[i]; i++)
      if (element._countedByPrototype) results.push(element);
    h.unmark(matches);
    return results;
  },

  findElement: function(elements, expression, index) {
    if (Object.isNumber(expression)) {
      index = expression; expression = false;
    }
    return Selector.matchElements(elements, expression || '*')[index || 0];
  },

  findChildElements: function(element, expressions) {
    expressions = Selector.split(expressions.join(','));
    var results = [], h = Selector.handlers;
    for (var i = 0, l = expressions.length, selector; i < l; i++) {
      selector = new Selector(expressions[i].strip());
      h.concat(results, selector.findElements(element));
    }
    return (l > 1) ? h.unique(results) : results;
  }
});

if (Prototype.Browser.IE) {
  Object.extend(Selector.handlers, {
    // IE returns comment nodes on getElementsByTagName("*").
    // Filter them out.
    concat: function(a, b) {
      for (var i = 0, node; node = b[i]; i++)
        if (node.tagName !== "!") a.push(node);
      return a;
    },

    // IE improperly serializes _countedByPrototype in (inner|outer)HTML.
    unmark: function(nodes) {
      for (var i = 0, node; node = nodes[i]; i++)
        node.removeAttribute('_countedByPrototype');
      return nodes;
    }
  });
}

function $$() {
  return Selector.findChildElements(document, $A(arguments));
}
var Form = {
  reset: function(form) {
    $(form).reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit;

    var data = elements.inject({ }, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          if (key in result) {
            // a key is already present; construct an array of values
            if (!Object.isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return options.hash ? data : Object.toQueryString(data);
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    return $A($(form).getElementsByTagName('*')).inject([],
      function(elements, child) {
        if (Form.Element.Serializers[child.tagName.toLowerCase()])
          elements.push(Element.extend(child));
        return elements;
      }
    );
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return ['input', 'select', 'textarea'].include(element.tagName.toLowerCase());
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/

Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {
  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !['button', 'reset', 'submit'].include(element.type)))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.blur();
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;
var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  },

  select: function(element, index) {
    if (Object.isUndefined(index))
      return this[element.type == 'select-one' ?
        'selectOne' : 'selectMany'](element);
    else {
      var opt, value, single = !Object.isArray(index);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        value = this.optionValue(opt);
        if (single) {
          if (value == index) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = index.include(value);
      }
    }
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    // extend element because hasAttribute may not be native
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/

Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
if (!window.Event) var Event = { };

Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,
  KEY_HOME:     36,
  KEY_END:      35,
  KEY_PAGEUP:   33,
  KEY_PAGEDOWN: 34,
  KEY_INSERT:   45,

  cache: { },

  relatedTarget: function(event) {
    var element;
    switch(event.type) {
      case 'mouseover': element = event.fromElement; break;
      case 'mouseout':  element = event.toElement;   break;
      default: return null;
    }
    return Element.extend(element);
  }
});

Event.Methods = (function() {
  var isButton;

  if (Prototype.Browser.IE) {
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    isButton = function(event, code) {
      return event.button == buttonMap[code];
    };

  } else if (Prototype.Browser.WebKit) {
    isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };

  } else {
    isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  return {
    isLeftClick:   function(event) { return isButton(event, 0) },
    isMiddleClick: function(event) { return isButton(event, 1) },
    isRightClick:  function(event) { return isButton(event, 2) },

    element: function(event) {
      event = Event.extend(event);

      var node = event.target, type = event.type;

      if (event.currentTarget) {
        // Firefox screws up the "click" event when moving between radio buttons
        // via arrow keys. It also screws up the "load" and "error" events on images,
        // reporting the document as the target instead of the original image.
        var currentTarget = event.currentTarget;
        var tagName = currentTarget.tagName.toUpperCase();
        if (['load', 'error'].include(type) ||
         (tagName === 'INPUT' && currentTarget.type === 'radio' && type === 'click'))
          node = currentTarget;
      }

      return Element.extend(node && node.nodeType == Node.TEXT_NODE ?
       node.parentNode : node);
    },

    findElement: function(event, expression) {
      var element = Event.element(event);
      if (!expression) return element;
      var elements = [element].concat(element.ancestors());
      return Selector.findElement(elements, expression, 0);
    },

    pointer: function(event) {
      var docElement = document.documentElement,
      body = document.body || { scrollLeft: 0, scrollTop: 0 };
      return {
        x: event.pageX || (event.clientX +
          (docElement.scrollLeft || body.scrollLeft) -
          (docElement.clientLeft || 0)),
        y: event.pageY || (event.clientY +
          (docElement.scrollTop || body.scrollTop) -
          (docElement.clientTop || 0))
      };
    },

    pointerX: function(event) { return Event.pointer(event).x },
    pointerY: function(event) { return Event.pointer(event).y },

    stop: function(event) {
      Event.extend(event);
      event.preventDefault();
      event.stopPropagation();
      event.stopped = true;
    }
  };
})();

Event.extend = (function() {
  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (Prototype.Browser.IE) {
    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return "[object Event]" }
    });

    return function(event) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);
      Object.extend(event, {
        target: event.srcElement,
        relatedTarget: Event.relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });
      return Object.extend(event, methods);
    };

  } else {
    Event.prototype = Event.prototype || document.createEvent("HTMLEvents").__proto__;
    Object.extend(Event.prototype, methods);
    return Prototype.K;
  }
})();

Object.extend(Event, (function() {
  var cache = Event.cache;

  function getEventID(element) {
    // Event ID is stored as the 0th index in a one-item array so that it
    // won't get copied to a new node when cloneNode is called.
    if (element._prototypeEventID) return element._prototypeEventID[0];
    arguments.callee.id = arguments.callee.id || 1;

    return element._prototypeEventID = [++arguments.callee.id];
  }

  function getDOMEventName(eventName) {
    if (eventName && eventName.include(':')) return "dataavailable";
    return eventName;
  }

  function getCacheForID(id) {
    return cache[id] = cache[id] || { };
  }

  function getWrappersForEventName(id, eventName) {
    var c = getCacheForID(id);
    return c[eventName] = c[eventName] || [];
  }

  function createWrapper(element, eventName, handler) {
    var id = getEventID(element), _c = getCacheForID(id);

    // Attach the element itself onto its cache entry so we can retrieve it for
    // cleanup on page unload.
    if (!_c.element) _c.element = element;

    var c = getWrappersForEventName(id, eventName);
    if (c.pluck("handler").include(handler)) return false;

    var wrapper = function(event) {
      if (!Event || !Event.extend ||
        (event.eventName && event.eventName != eventName))
          return false;

      Event.extend(event);
      handler.call(element, event);
    };

    wrapper.handler = handler;
    c.push(wrapper);
    return wrapper;
  }

  function findWrapper(id, eventName, handler) {
    var c = getWrappersForEventName(id, eventName);
    return c.find(function(wrapper) { return wrapper.handler == handler });
  }

  function destroyWrapper(id, eventName, handler) {
    var c = getCacheForID(id);
    if (!c[eventName]) return false;
    c[eventName] = c[eventName].without(findWrapper(id, eventName, handler));
  }

  // Loop through all elements and remove all handlers on page unload. IE
  // needs this in order to prevent memory leaks.
  function purgeListeners() {
    var element, entry;
    for (var i in Event.cache) {
      entry = Event.cache[i];
      Event.stopObserving(entry.element);
      entry.element = null;
    }
  }

  function onStop() {
    document.detachEvent('onstop', onStop);
    purgeListeners();
  }

  function onBeforeUnload() {
    if (document.readyState === "interactive") {
      document.attachEvent('onstop', onStop);
      (function() { document.detachEvent('onstop', onStop); }).defer();
    }
  }

  if (window.attachEvent) {
    // Internet Explorer needs to remove event handlers on page unload
    // in order to avoid memory leaks.
    window.attachEvent("onunload", purgeListeners);

    // IE also doesn't fire the unload event if the page is navigated away
    // from before it's done loading. Workaround adapted from
    // http://blog.moxiecode.com/2008/04/08/unload-event-never-fires-in-ie/.
    window.attachEvent("onbeforeunload", onBeforeUnload);
  }

  // Safari has a dummy event handler on page unload so that it won't
  // use its bfcache. Safari <= 3.1 has an issue with restoring the "document"
  // object when page is returned to via the back button using its bfcache.
  if (Prototype.Browser.WebKit) {
    window.addEventListener('unload', Prototype.emptyFunction, false);
  }

  return {
    observe: function(element, eventName, handler) {
      element = $(element);
      var name = getDOMEventName(eventName);

      var wrapper = createWrapper(element, eventName, handler);
      if (!wrapper) return element;

      if (element.addEventListener) {
        element.addEventListener(name, wrapper, false);
      } else {
        element.attachEvent("on" + name, wrapper);
      }

      return element;
    },

    stopObserving: function(element, eventName, handler) {
      element = $(element);
      var id = getEventID(element), name = getDOMEventName(eventName);

      if (!handler && eventName) {
        getWrappersForEventName(id, eventName).each(function(wrapper) {
          Event.stopObserving(element, eventName, wrapper.handler);
        });
        return element;

      } else if (!eventName) {
        Object.keys(getCacheForID(id)).without("element").each(function(eventName) {
          Event.stopObserving(element, eventName);
        });
        return element;
      }

      var wrapper = findWrapper(id, eventName, handler);
      if (!wrapper) return element;

      if (element.removeEventListener) {
        element.removeEventListener(name, wrapper, false);
      } else {
        element.detachEvent("on" + name, wrapper);
      }

      destroyWrapper(id, eventName, handler);

      return element;
    },

    fire: function(element, eventName, memo) {
      element = $(element);
      if (element == document && document.createEvent && !element.dispatchEvent)
        element = document.documentElement;

      var event;
      if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent("dataavailable", true, true);
      } else {
        event = document.createEventObject();
        event.eventType = "ondataavailable";
      }

      event.eventName = eventName;
      event.memo = memo || { };

      if (document.createEvent) {
        element.dispatchEvent(event);
      } else {
        element.fireEvent(event.eventType, event);
      }

      return Event.extend(event);
    }
  };
})());

Object.extend(Event, Event.Methods);

Element.addMethods({
  fire:          Event.fire,
  observe:       Event.observe,
  stopObserving: Event.stopObserving
});

Object.extend(document, {
  fire:          Element.Methods.fire.methodize(),
  observe:       Element.Methods.observe.methodize(),
  stopObserving: Element.Methods.stopObserving.methodize(),
  loaded:        false
});

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards and John Resig. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearInterval(timer);
    document.fire("dom:loaded");
    document.loaded = true;
  }

  if (document.addEventListener) {
    if (Prototype.Browser.WebKit) {
      timer = window.setInterval(function() {
        if (/loaded|complete/.test(document.readyState))
          fireContentLoadedEvent();
      }, 0);

      Event.observe(window, "load", fireContentLoadedEvent);

    } else {
      document.addEventListener("DOMContentLoaded",
        fireContentLoadedEvent, false);
    }

  } else {
    document.write("<script id=__onDOMContentLoaded defer src=//:><\/script>");
    $("__onDOMContentLoaded").onreadystatechange = function() {
      if (this.readyState == "complete") {
        this.onreadystatechange = null;
        fireContentLoadedEvent();
      }
    };
  }
})();
/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

// This should be moved to script.aculo.us; notice the deprecated methods
// further below, that map to the newer Element methods.
var Position = {
  // set to true if needed, warning: firefox performance problems
  // NOT neeeded for page scrolling, only if draggable contained in
  // scrollable elements
  includeScrollOffsets: false,

  // must be called before calling withinIncludingScrolloffset, every time the
  // page is scrolled
  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  // caches x/y coordinate pair to use with overlap
  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  // within must be called directly before
  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },

  // Deprecation layer -- use newer Element methods now (1.5.2).

  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

Element.addMethods();