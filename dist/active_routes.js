/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * ***** END LICENSE BLOCK ***** */

ActiveSupport = null;

(function(){
ActiveSupport = {
    /**
     * Returns the global context object (window in most implementations).
     * @alias ActiveSupport.getGlobalContext
     */
    getGlobalContext: function getGlobalContext()
    {
        return window;
    },
    /**
     * Returns an array from an array or array like object.
     * @alias ActiveSupport.arrayFrom
     * @param {Object} object
     *      Any iterable object (Array, NodeList, arguments)
     * @return {Array}
     */
    arrayFrom: function arrayFrom(object)
    {
        if(!object)
        {
            return [];
        }
        var length = object.length || 0;
        var results = new Array(length);
        while (length--)
        {
            results[length] = object[length];
        }
        return results;
    },
    /**
     * Emulates Array.indexOf for implementations that do not support it.
     * @alias ActiveSupport.indexOf
     * @param {Array} item
     * @param {mixed} item
     * @return {Number}
     */
    indexOf: function indexOf(array,item,i)
    {
        i || (i = 0);
        var length = array.length;
        if(i < 0)
        {
            i = length + i;
        }
        for(; i < length; i++)
        {
            if(array[i] === item)
            {
                return i;
            }
        }
        return -1;
    },
    /**
     * Returns an array without the given item.
     * @alias ActiveSupport.without
     * @param {Array} arr
     * @param {mixed} item to remove
     * @return {Array}
     */
    without: function without(arr){
        var values = ActiveSupport.arrayFrom(arguments).slice(1);
        var response = [];
        for(var i = 0 ; i < arr.length; i++)
        {
            if(!(ActiveSupport.indexOf(values,arr[i]) > -1))
            {
                response.push(arr[i]);
            }
        }
        return response;
    },
    /**
     * Emulates Prototype's Function.prototype.bind
     * @alias ActiveSupport.bind
     * @param {Function} func
     * @param {Object} object
     *      object will be in scope as "this" when func is called.
     * @return {Function}
     */
    bind: function bind(func, object)
    {
        func.bind = function bind()
        {
            if (arguments.length < 2 && typeof(arguments[0]) == "undefined")
            {
                return this;
            }
            var __method = this;
            var args = ActiveSupport.arrayFrom(arguments);
            var object = args.shift();
            return function bound()
            {
                return __method.apply(object, args.concat(ActiveSupport.arrayFrom(arguments)));
            };
        };
        return func.bind(object);
    },
    /**
     * Emulates Prototype's Function.prototype.curry.
     * @alias ActiveSupport.curry
     * @param {Function} func
     * @return {Function}
     */
    curry: function curry(func)
    {
        func.curry = function curry()
        {
            if (!arguments.length)
            {
                return this;
            }
            var __method = this;
            var args = ActiveSupport.arrayFrom(arguments);
            return function curried()
            {
                return __method.apply(this, args.concat(ActiveSupport.arrayFrom(arguments)));
            };
        };
        return func.curry.apply(func, ActiveSupport.arrayFrom(arguments).slice(1));
    },
    /**
     * Returns an array of keys from an object.
     * @alias ActiveSupport.keys
     * @param {Object} object
     * @return {Array}
     */
    keys: function keys(object)
    {
        var keys = [];
        for (var property in object)
        {
            keys.push(property);
        }
        return keys;
    },
    /**
     * Emulates Prototype's String.prototype.underscore
     * @alias ActiveSupport.underscore
     * @param {String} str
     * @return {String}
     */
    underscore: function underscore(str)
    {
        return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, function(match){
            return match[0] + '_' + match[1];
        }).replace(/([a-z\d])([A-Z])/g, function(match){
            return match[0] + '_' + match[1];
        }).replace(/-/g, '_').toLowerCase();
    },
    /**
     * Emulates Prototype's String.prototype.camelize
     * @alias ActiveSupport.camelize
     * @param {String} str
     * @param {Boolean} [capitalize]
     * @return {String}
     */
    camelize: function camelize(str, capitalize){
        var parts = str.replace(/\_/g,'-').split('-'), len = parts.length;
        if (len == 1)
        {
            if(capitalize)
            {
                return parts[0].charAt(0).toUpperCase() + parts[0].substring(1);
            }
            else
            {
                return parts[0];
            }
        }
        if(str.charAt(0) == '-')
        {
            var camelized = parts[0].charAt(0).toUpperCase() + parts[0].substring(1);
        }
        else
        {
            var camelized = parts[0];
        }
        for (var i = 1; i < len; i++)
        {
            camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
        }
        if(capitalize)
        {
            return camelized.charAt(0).toUpperCase() + camelized.substring(1);
        }
        else
        {
            return camelized;
        }
    },
    /**
     * Emulates Prototype's Object.extend
     * @alias ActiveSupport.extend
     * @param {Object} destination
     * @param {Object} source
     * @return {Object}
     */
    extend: function extend(destination, source)
    {
        for (var property in source)
        {
            destination[property] = source[property];
        }
        return destination;
    },
    /**
     * Emulates Prototype's Object.clone
     * @alias ActiveSupport.clone
     * @param {Object} object
     * @return {Object}
     */
    clone: function clone(object)
    {
        return ActiveSupport.extend({}, object);
    },
    
    /**
     * If the value passed is a function the value passed will be returned, otherwise a function returning the value passed will be returned.
     * @alias ActiveSupport.proc
     * @param {mixed} proc
     * @return {Function}
     */
    proc: function proc(proc)
    {
        return typeof(proc) == 'function' ? proc : function(){return proc;};
    },
    
    /**
     * If the value passed is a function, the function is called and the value returned, otherwise the value passed in is returned.
     * @alias ActiveSupport.value
     * @params {mixed} value
     * @return {scalar}
     */
    value: function value(value)
    {
        return typeof(value) == 'function' ? value() : value;
    },
    
    /**
     * If it is the last argument of current function is a function, it will be returned. You can optionally specify the number of calls in the stack to look up.
     * @alias ActiveSupport.block
     * @param {Number} [levels]
     * @return {mixed}
     */
    block: function block(args)
    {
        if(typeof(args) == 'number' || !args)
        {
            var up = arguments.callee;
            for(var i = 0; i <= (args || 0); ++i)
            {
                up = up.caller;
                if(!up)
                {
                    return false;
                }
            }
            args = up.arguments;
        }
        return (args.length == 0 || typeof(args[args.length - 1]) != 'function') ? false : args[args.length - 1];
    },
    
    /**
     * @alias ActiveSupport.synchronize
     */
    synchronize: function synchronize(execute,finish)
    {
        var scope = {};
        var stack = [];
        stack.waiting = {};
        stack.add = function add(callback){
            var wrapped = ActiveSupport.wrap(callback || function(){},function synchronizationWrapper(proceed){
                var i = null;
                var index = ActiveSupport.indexOf(stack,wrapped);
                stack.waiting[index] = [proceed,ActiveSupport.arrayFrom(arguments)];
                var all_present = true;
                for(i = 0; i < stack.length; ++i)
                {
                    if(!stack.waiting[i])
                    {
                        all_present = false;
                    }
                }
                if(all_present)
                {
                    for(i = 0; i < stack.length; ++i)
                    {
                        var item = stack.waiting[i];
                        item[0].apply(item[0],item[1]);
                        delete stack.waiting[i];
                    }
                }
                if(all_present && i == stack.length)
                {
                    if(finish)
                    {
                        finish(scope);
                    }
                }
            });
            stack.push(wrapped);
            return wrapped;
        };
        execute(stack,scope);
        if(stack.length == 0 && finish)
        {
            finish(scope);
        }
    },
    
    Inflector: {
        Inflections: {
            plural: [
                [/(quiz)$/i,               "$1zes"  ],
                [/^(ox)$/i,                "$1en"   ],
                [/([m|l])ouse$/i,          "$1ice"  ],
                [/(matr|vert|ind)ix|ex$/i, "$1ices" ],
                [/(x|ch|ss|sh)$/i,         "$1es"   ],
                [/([^aeiouy]|qu)y$/i,      "$1ies"  ],
                [/(hive)$/i,               "$1s"    ],
                [/(?:([^f])fe|([lr])f)$/i, "$1$2ves"],
                [/sis$/i,                  "ses"    ],
                [/([ti])um$/i,             "$1a"    ],
                [/(buffal|tomat)o$/i,      "$1oes"  ],
                [/(bu)s$/i,                "$1ses"  ],
                [/(alias|status)$/i,       "$1es"   ],
                [/(octop|vir)us$/i,        "$1i"    ],
                [/(ax|test)is$/i,          "$1es"   ],
                [/s$/i,                    "s"      ],
                [/$/,                      "s"      ]
            ],
            singular: [
                [/(quiz)zes$/i,                                                    "$1"     ],
                [/(matr)ices$/i,                                                   "$1ix"   ],
                [/(vert|ind)ices$/i,                                               "$1ex"   ],
                [/^(ox)en/i,                                                       "$1"     ],
                [/(alias|status)es$/i,                                             "$1"     ],
                [/(octop|vir)i$/i,                                                 "$1us"   ],
                [/(cris|ax|test)es$/i,                                             "$1is"   ],
                [/(shoe)s$/i,                                                      "$1"     ],
                [/(o)es$/i,                                                        "$1"     ],
                [/(bus)es$/i,                                                      "$1"     ],
                [/([m|l])ice$/i,                                                   "$1ouse" ],
                [/(x|ch|ss|sh)es$/i,                                               "$1"     ],
                [/(m)ovies$/i,                                                     "$1ovie" ],
                [/(s)eries$/i,                                                     "$1eries"],
                [/([^aeiouy]|qu)ies$/i,                                            "$1y"    ],
                [/([lr])ves$/i,                                                    "$1f"    ],
                [/(tive)s$/i,                                                      "$1"     ],
                [/(hive)s$/i,                                                      "$1"     ],
                [/([^f])ves$/i,                                                    "$1fe"   ],
                [/(^analy)ses$/i,                                                  "$1sis"  ],
                [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis"],
                [/([ti])a$/i,                                                      "$1um"   ],
                [/(n)ews$/i,                                                       "$1ews"  ],
                [/s$/i,                                                            ""       ]
            ],
            irregular: [
                ['move',   'moves'   ],
                ['sex',    'sexes'   ],
                ['child',  'children'],
                ['man',    'men'     ],
                ['person', 'people'  ]
            ],
            uncountable: [
                "sheep",
                "fish",
                "series",
                "species",
                "money",
                "rice",
                "information",
                "equipment"
            ]
        },
        /**
         * Generates an orginalized version of a number as a string (9th, 2nd, etc)
         * @alias ActiveSupport.Inflector.ordinalize
         * @param {Number} number
         * @return {String}
         */
        ordinalize: function ordinalize(number)
        {
            if (11 <= parseInt(number) % 100 && parseInt(number) % 100 <= 13)
            {
                return number + "th";
            }
            else
            {
                switch (parseInt(number) % 10)
                {
                    case  1: return number + "st";
                    case  2: return number + "nd";
                    case  3: return number + "rd";
                    default: return number + "th";
                }
            }
        },
        /**
         * Generates a plural version of an english word.
         * @alias ActiveSupport.Inflector.pluralize
         * @param {String} word
         * @return {String}
         */
        pluralize: function pluralize(word)
        {
            for (var i = 0; i < ActiveSupport.Inflector.Inflections.uncountable.length; i++)
            {
                var uncountable = Inflector.Inflections.uncountable[i];
                if (word.toLowerCase == uncountable)
                {
                    return uncountable;
                }
            }
            for (var i = 0; i < ActiveSupport.Inflector.Inflections.irregular.length; i++)
            {
                var singular = ActiveSupport.Inflector.Inflections.irregular[i][0];
                var plural = ActiveSupport.Inflector.Inflections.irregular[i][1];
                if ((word.toLowerCase == singular) || (word == plural))
                {
                    return plural;
                }
            }
            for (var i = 0; i < ActiveSupport.Inflector.Inflections.plural.length; i++)
            {
                var regex = ActiveSupport.Inflector.Inflections.plural[i][0];
                var replace_string = ActiveSupport.Inflector.Inflections.plural[i][1];
                if (regex.test(word))
                {
                    return word.replace(regex, replace_string);
                }
            }
        },
        /**
         * Generates a singular version of an english word.
         * @alias ActiveSupport.Inflector.singularize
         * @param {String} word
         * @return {String}
         */
        singularize: function singularize(word) {
            for (var i = 0; i < ActiveSupport.Inflector.Inflections.uncountable.length; i++)
            {
                var uncountable = ActiveSupport.Inflector.Inflections.uncountable[i];
                if (word.toLowerCase == uncountable)
                {
                    return uncountable;
                }
            }
            for (var i = 0; i < ActiveSupport.Inflector.Inflections.irregular.length; i++)
            {
                var singular = ActiveSupport.Inflector.Inflections.irregular[i][0];
                var plural   = ActiveSupport.Inflector.Inflections.irregular[i][1];
                if ((word.toLowerCase == singular) || (word == plural))
                {
                    return plural;
                }
            }
            for (var i = 0; i < ActiveSupport.Inflector.Inflections.singular.length; i++)
            {
                var regex = ActiveSupport.Inflector.Inflections.singular[i][0];
                var replace_string = ActiveSupport.Inflector.Inflections.singular[i][1];
                if (regex.test(word))
                {
                    return word.replace(regex, replace_string);
                }
            }
        }
    },
    /*
        http://www.JSON.org/json2.js
        2008-07-15

        Public Domain.

        NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

        See http://www.JSON.org/js.html

        This file creates a global JSON object containing two methods: stringify
        and parse.

            JSON.stringify(value, replacer, space)
                value       any JavaScript value, usually an object or array.

                replacer    an optional parameter that determines how object
                            values are stringified for objects. It can be a
                            function or an array.

                space       an optional parameter that specifies the indentation
                            of nested structures. If it is omitted, the text will
                            be packed without extra whitespace. If it is a number,
                            it will specify the number of spaces to indent at each
                            level. If it is a string (such as '\t' or '&nbsp;'),
                            it contains the characters used to indent at each level.

                This method produces a JSON text from a JavaScript value.

                When an object value is found, if the object contains a toJSON
                method, its toJSON method will be called and the result will be
                stringified. A toJSON method does not serialize: it returns the
                value represented by the name/value pair that should be serialized,
                or undefined if nothing should be serialized. The toJSON method
                will be passed the key associated with the value, and this will be
                bound to the object holding the key.

                For example, this would serialize Dates as ISO strings.

                    Date.prototype.toJSON = function (key) {
                        function f(n) {
                            // Format integers to have at least two digits.
                            return n < 10 ? '0' + n : n;
                        }

                        return this.getUTCFullYear()   + '-' +
                             f(this.getUTCMonth() + 1) + '-' +
                             f(this.getUTCDate())      + 'T' +
                             f(this.getUTCHours())     + ':' +
                             f(this.getUTCMinutes())   + ':' +
                             f(this.getUTCSeconds())   + 'Z';
                    };

                You can provide an optional replacer method. It will be passed the
                key and value of each member, with this bound to the containing
                object. The value that is returned from your method will be
                serialized. If your method returns undefined, then the member will
                be excluded from the serialization.

                If the replacer parameter is an array, then it will be used to
                select the members to be serialized. It filters the results such
                that only members with keys listed in the replacer array are
                stringified.

                Values that do not have JSON representations, such as undefined or
                functions, will not be serialized. Such values in objects will be
                dropped; in arrays they will be replaced with null. You can use
                a replacer function to replace those with JSON values.
                JSON.stringify(undefined) returns undefined.

                The optional space parameter produces a stringification of the
                value that is filled with line breaks and indentation to make it
                easier to read.

                If the space parameter is a non-empty string, then that string will
                be used for indentation. If the space parameter is a number, then
                the indentation will be that many spaces.

                Example:

                text = JSON.stringify(['e', {pluribus: 'unum'}]);
                // text is '["e",{"pluribus":"unum"}]'


                text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
                // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

                text = JSON.stringify([new Date()], function (key, value) {
                    return this[key] instanceof Date ?
                        'Date(' + this[key] + ')' : value;
                });
                // text is '["Date(---current time---)"]'


            JSON.parse(text, reviver)
                This method parses a JSON text to produce an object or array.
                It can throw a SyntaxError exception.

                The optional reviver parameter is a function that can filter and
                transform the results. It receives each of the keys and values,
                and its return value is used instead of the original value.
                If it returns what it received, then the structure is not modified.
                If it returns undefined then the member is deleted.

                Example:

                // Parse the text. Values that look like ISO date strings will
                // be converted to Date objects.

                myData = JSON.parse(text, function (key, value) {
                    var a;
                    if (typeof value === 'string') {
                        a =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                        if (a) {
                            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                                +a[5], +a[6]));
                        }
                    }
                    return value;
                });

                myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                    var d;
                    if (typeof value === 'string' &&
                            value.slice(0, 5) === 'Date(' &&
                            value.slice(-1) === ')') {
                        d = new Date(value.slice(5, -1));
                        if (d) {
                            return d;
                        }
                    }
                    return value;
                });


        This is a reference implementation. You are free to copy, modify, or
        redistribute.

        This code should be minified before deployment.
        See http://javascript.crockford.com/jsmin.html

        USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
        NOT CONTROL.
    */
    JSON: function()
    {
        //use native support if available
        if(window && 'JSON' in window && 'stringify' in window.JSON && 'parse' in window.JSON)
        {
          return window.JSON;
        }
        
        function f(n) {
            // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
        };
        Date.prototype.toJSON = function (key) {
            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };
        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            escapeable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            gap,
            indent,
            meta = {    // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"' : '\\"',
                '\\': '\\\\'
            },
            rep;
        function quote(string) {
            escapeable.lastIndex = 0;
            return escapeable.test(string) ?
                '"' + string.replace(escapeable, function (a) {
                    var c = meta[a];
                    if (typeof c === 'string') {
                        return c;
                    }
                    return '\\u' + ('0000' +
                            (+(a.charCodeAt(0))).toString(16)).slice(-4);
                }) + '"' :
                '"' + string + '"';
        };
        function str(key, holder) {
            var i,          // The loop counter.
                k,          // The member key.
                v,          // The member value.
                length,
                mind = gap,
                partial,
                value = holder[key];
            if (value && typeof value === 'object' &&
                    typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }
            if (typeof rep === 'function') {
                value = rep.call(holder, key, value);
            }
            switch (typeof value) {
            case 'string':
                return quote(value);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'boolean':
            case 'null':
                return String(value);
            case 'object':
                if (!value) {
                    return 'null';
                }
                gap += indent;
                partial = [];
                if (typeof value.length === 'number' &&
                        !(value.propertyIsEnumerable('length'))) {
                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || 'null';
                    }
                    v = partial.length === 0 ? '[]' :
                        gap ? '[\n' + gap +
                                partial.join(',\n' + gap) + '\n' +
                                    mind + ']' :
                              '[' + partial.join(',') + ']';
                    gap = mind;
                    return v;
                }
                if (rep && typeof rep === 'object') {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        k = rep[i];
                        if (typeof k === 'string') {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                } else {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                }
                v = partial.length === 0 ? '{}' :
                    gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                            mind + '}' : '{' + partial.join(',') + '}';
                gap = mind;
                return v;
            }
        };
        return {
            /**
             * @alias ActiveSupport.JSON.stringify
             * @param {Object} value
             * @return {String}
             */
            stringify: function (value, replacer, space) {
                var i;
                gap = '';
                indent = '';
                if (typeof space === 'number') {
                    for (i = 0; i < space; i += 1) {
                        indent += ' ';
                    }
                } else if (typeof space === 'string') {
                    indent = space;
                }
                rep = replacer;
                if (replacer && typeof replacer !== 'function' &&
                        (typeof replacer !== 'object' ||
                         typeof replacer.length !== 'number')) {
                    throw new Error('JSON.stringify');
                }
                return str('', {'': value});
            },
            /**
             * @alias ActiveSupport.JSON.parse
             * @param {String} text
             * @return {Object}
             */
            parse: function (text, reviver) {
                var j;
                function walk(holder, key) {
                    var k, v, value = holder[key];
                    if (value && typeof value === 'object') {
                        for (k in value) {
                            if (Object.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v;
                                } else {
                                    delete value[k];
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value);
                };
                cx.lastIndex = 0;
                if (cx.test(text)) {
                    text = text.replace(cx, function (a) {
                        return '\\u' + ('0000' +
                                (+(a.charCodeAt(0))).toString(16)).slice(-4);
                    });
                }
                if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                    j = eval('(' + text + ')');
                    return typeof reviver === 'function' ?
                        walk({'': j}, '') : j;
                }
                throw new SyntaxError('JSON.parse');
            }
        };
    }()
};

})();

ActiveRoutes = null;

(function() {
 
/**
 * @alias ActiveRoutes
 * @param {Array} routes
 * @param {Object} [scope] defaults to window
 * @param {Object} [options]
 * @return {ActiveRoutes}
 * options can contain the following keys:
 * - base: default '', the default path / url prefix to be used in a generated url
 * - dispatcher: default ActiveRoutes.prototype.defaultDispatcher, the dispatcher function to be called when dispatch() is called and a route is found
 * - camelizeObjectName: default true, if true, trying to call "blog_controller" through routes will call "BlogController"
 * - camelizeMethodName: default true, if true, trying to call "my_method_name" through routes will call "myMethodName"
 * - camelizeGeneratedMethods: default true, will export generated methods into the scope as "articleUrl" instead of "article_url"
 * @example
 * var routes = new ActiveRoutes([
 *   ['article','article/:id',{object:'article',method:'article',requirements: {id:/\d+/}}],
 *   ['post','/blog/post/:id',{object:'blog',method: 'post'}],
 *   ['/blog/:method/:id',{object:'blog'}] //unnamed route
 * ]);
 * var route = routes.match('/blog/post/5');
 * route == {object: 'blog',method: 'post', id: 5};
 * routes.dispatch('/blog/post/5'); //calls Blog.post({object: 'blog',method: 'post', id: 5})
 * routes.urlFor({object: 'blog',method: 'post', id: 5}) == '/blog/post/5';
 * //creating the routes object above creates the following methods because there was a named route "post"
 * postUrl({id: 5}) == '/blog/post/5'
 * postParams({id: 5}) == {object: 'blog',method: 'post', id: 5}
 * callPost({id: 5}) //calls Blog.post({object: 'blog',method: 'post', id: 5})
 */
ActiveRoutes = function ActiveRoutes(routes,scope,options)
{
    this.error = false;
    this.scope = scope || window;
    this.routes = [];
    this.history = [];
    this.options = ActiveSupport.extend({
        camelizeObjectName: true,
        camelizeMethodName: true,
        camelizeGeneratedMethods: true,
        base: '',
        dispatcher: this.defaultDispatcher
    },options || {});
    this.dispatcher = this.options.dispatcher;
    var i;
    for(i = 0; i < routes.length; ++i)
    {
        this.addRoute.apply(this,routes[i]);
    }
    var current_route_set = this;
    this.scope[this.options.camelizeGeneratedMethods ? 'urlFor' : 'url_for'] = function generatedUrlFor(){
        current_route_set.urlFor.apply(current_route_set,arguments);
    };
};

/**
 * If match() returns false, the error it generates can be retrieved with this function.
 * @return {mixed} String or null
 */
ActiveRoutes.prototype.getError = function getError()
{
    return this.error;
};

/**
 * Add a new route to the route set. All of the following are valid:
 * @example
 * routes.addRoute('route_name','/route/path',{params});
 * routes.addRoute('/route/path',{params});
 * routes.addRoute('/route/path');
 */
ActiveRoutes.prototype.addRoute = function addRoute()
{
    var name,path,params,route;
    if(arguments.length == 3)
    {
        name = arguments[0];
        path = arguments[1];
        params = arguments[2];
    }
    else if(arguments.length == 2)
    {
        if(typeof(arguments[0]) == 'string' && typeof(arguments[1]) == 'string')
        {
            name = arguments[0];
            path = arguments[1];
        }
        else
        {
            path = arguments[0];
            params = arguments[1];
        }
    }
    else if(arguments.length == 1)
    {
        path = arguments[0];
    }
    route = {
        name: name,
        path: ActiveRoutes.normalizePath(path),
        params: params || {}
    };
    if(!Validations.hasPath(route))
    {
        throw Errors.NoPathInRoute;
    }
    if(!Validations.hasObject(route))
    {
        throw Errors.NoObjectInRoute + route.path;
    }
    if(!Validations.hasMethod(route))
    {
        throw Errors.NoMethodInRoute + route.path;
    }
    this.routes.push(route);
    this.generateMethodsForRoute(route);
};

ActiveRoutes.normalizePathDotDotRegexp = /[^\/\\]+[\/\\]\.\.[\/\\]/;
ActiveRoutes.normalizePath = function normalizePath(path)
{
    //remove hash
    path = path.replace(/\#.+$/,'');
    //remove query string
    path = path.replace(/\?.+$/,'');
    //remove trailing and starting slashes, replace backslashes, replace multiple slashes with a single slash
    path = path.replace(/\/{2,}/g,"/").replace(/\\\\/g,"\\").replace(/(\/|\\)$/,'').replace(/\\/g,'/').replace(/^\//,'');
    while(path.match(ActiveRoutes.normalizePathDotDotRegexp))
    {
        path = path.replace(ActiveRoutes.normalizePathDotDotRegexp,'');
    }
    //replace /index with /
    path = path.replace(/(\/index$|^index$)/i,'');
    return path;
};

var Errors = {
    NoPathInRoute: 'No path was specified in the route',
    NoObjectInRoute: 'No :object was specified in the route: ',
    NoMethodInRoute: 'No :method was specified in the route: ',
    ObjectDoesNotExist: 'The following object does not exist: ',
    MethodDoesNotExist: 'The following method does not exist: ',
    MethodNotCallable: 'The following method is not callable: ',
    NamedRouteDoesNotExist: 'The following named route does not exist: ',
    UnresolvableUrl: 'Cloud not resolve the url: '
};
ActiveRoutes.Errors = Errors;

ActiveRoutes.prototype.checkAndCleanRoute = function checkAndCleanRoute(route)
{
    if(!route.params.method)
    {
        route.params.method = 'index';
    }
    if(this.options.camelizeObjectName)
    {
        route.params.object = ActiveSupport.camelize(route.params.object,true);
    }
    if(route.params.requirements)
    {
        delete route.params.requirements;
    }
    if(!this.objectExists(route.params.object))
    {
        this.error = Errors.ObjectDoesNotExist + route.params.object;
    }
    if(!this.methodExists(route.params.object,route.params.method))
    {
        this.error = Errors.MethodDoesNotExist + route.params.object + '.' + route.params.method;
    }
    if(!this.methodCallable(route.params.object,route.params.method))
    {
        this.error = Errors.MethodNotCallable + route.params.object + '.' + route.params.method;
    }
    if(this.error)
    {
        return false;
    }
    else
    {
        return route;
    }
};

/**
 * @alias ActiveRoutes.prototype.match
 * var route = routes.match('/blog/post/5');
 * route == {object: 'blog',method: 'post', id: 5};
 * @param {String} path
 * @return {mixed} false if no match, otherwise the matching route.
 */
ActiveRoutes.prototype.match = function(path){
    this.error = false;
    //make sure the path is a copy
    path = ActiveRoutes.normalizePath((new String(path)).toString());
    var path_components = path.split('/');
    var path_length = path_components.length;
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = ActiveSupport.clone(this.routes[i]);
        route.params = ActiveSupport.clone(this.routes[i].params || {});
        route.orderedParams = [];
        
        //exact match
        if(route.path == path)
        {
            return this.checkAndCleanRoute(route);
        }
        
        //perform full match
        var route_path_components = route.path.split('/');
        var route_path_length = route_path_components.length;
        var valid = true;
        
        //length of path components must match, but must treat "/blog", "/blog/action", "/blog/action/id" the same
        if(path_length <= route_path_length || route_path_components[route_path_components.length - 1] == '*'){
            for(var ii = 0; ii < route_path_components.length; ++ii)
            {
                var path_component = path_components[ii];
                var route_path_component = route_path_components[ii];
                //catch all
                if(route_path_component[0] == '*')
                {
                    route.params.path = path_components.slice(ii);
                    return this.checkAndCleanRoute(route); 
                }
                //named component
                else if(route_path_component[0] == ':')
                {
                    var key = route_path_component.substr(1);
                    if(path_component && route.params.requirements && route.params.requirements[key] && !path_component.match(route.params.requirements[key]))
                    {
                        valid = false;
                        break;
                    }
                    else
                    {
                        if(typeof(path_component) == 'undefined' && key != 'method' && key != 'object' && key != 'id')
                        {
                            valid = false;
                            break;
                        }
                        else
                        {
                            route.params[key] = path_component;
                            route.orderedParams.push(path_component);
                        }
                    }
                }
                else if(path_component != route_path_component)
                {
                    valid = false;
                    break;
                }
            }
            if(valid)
            {
                return this.checkAndCleanRoute(route);
            }
        }
    }
    return false;
};
 
/**
 * @alias ActiveRoutes.prototype.dispatch
 * @param {String} path
 * This will match() the given path and call the dispatcher if one is found.
 * var routes = new ActiveRoutes([['post','/blog/post/:id',{object:'blog',method: 'post'}]]);
 * routes.dispatch('/blog/post/5');
 * //by default calls Blog.post({object:'blog',method: 'post',id: 5});
 */
ActiveRoutes.prototype.dispatch = function dispatch(path)
{
    var route;
    if(typeof(path) == 'string')
    {
        route = this.match(path);
        if(!route)
        {
            throw Errors.UnresolvableUrl + path;
        }
    }
    else
    {
        route = {
            params: path
        };
    }
    this.history.push(route.params);
    this.dispatcher(route);
};

/**
 * If no "dispatcher" key is passed into the options to contstruct a route set this is used. It will call scope.object_name.method_name(route.params)
 */
ActiveRoutes.prototype.defaultDispatcher = function defaultDispatcher(route)
{
    this.scope[route.params.object][route.params.method](route.params);
};

var Validations = {
    hasPath: function(route)
    {
        if(route.path === '')
        {
            return true;
        }
        else
        {
            return !!route.path;
        }
    },
    hasMethod: function(route)
    {
        return !(!route.path.match(':method') && (!route.params || !route.params.method));
    },
    hasObject: function(route)
    {
        return !(!route.path.match(':object') && (!route.params || !route.params.object));
    }
};

ActiveRoutes.prototype.objectExists = function(object_name)
{
    return !(!this.scope[object_name]);
};
ActiveRoutes.prototype.methodExists = function(object_name,method_name)
{
    return !(!this.scope[object_name] || !this.scope[object_name][method_name]);
};
ActiveRoutes.prototype.methodCallable = function(object_name,method_name)
{
    return (this.methodExists(object_name,method_name) && typeof(this.scope[object_name][method_name]) == 'function');
};


ActiveRoutes.Validations = Validations;

ActiveRoutes.prototype.cleanPath = function cleanPath(path,params,only_path)
{
    if(!params.id)
    {
        path = path.replace(/\/?\:id/,'');
    }
    if(params.method == 'index')
    {
        path = path.replace(/\/?\:method/,'');
    }
    path = path.replace(/\/?index$/,'');
    if(path[0] != '/')
    {
        path = '/' + path;
    }
    path = only_path ? path : this.options.base + path;
    return path;
};

ActiveRoutes.performParamSubstitution = function performParamSubstitution(path,route,params)
{
    for(var p in params)
    {
        if(path.match(':' + p) && params[p])
        {
            if(route.params.requirements && route.params.requirements[p] && !params[p].toString().match(route.params.requirements[p]))
            {
                continue;
            }
            path = path.replace(':' + p,params[p].toString());
        }
    }
    return path;
};

/**
 * @alias ActiveRoutes.prototype.urlFor
 * @param {Object} [params]
 * @return {String}
 * var routes = new ActiveRoutes([['post','/blog/post/:id',{object:'blog',method: 'post'}]]);
 * routes.urlFor({object: 'blog',method: 'post', id: 5}) == '/blog/post/5';
 */
ActiveRoutes.prototype.urlFor = function urlFor(params)
{
    var only_path = false;
    if(params.only_path){
        only_path = true;
        delete params.only_path;
    }
  
    //get a named route with no params
    if(typeof(params) == 'string')
    {
        var found = false;
        for(var i = 0; i < this.routes.length; ++i)
        {
            if(this.routes[i].name && this.routes[i].name == params)
            {
                found = i;
                break;
            }
        }
        if(found === false)
        {
            throw Errors.NamedRouteDoesNotExistError + params;
        }
        else
        {
            var final_params = {};
            var found_params = ActiveSupport.clone(this.routes[found].params);
            for(var name in found_params)
            {
                final_params[name] = found_params[name];
            }
            if(typeof(arguments[1]) == 'object')
            {
                for(var name in arguments[1])
                {
                    final_params[name] = arguments[1][name];
                }
            }
            return this.urlFor(final_params);
        }
    }
    
    if(!params.method)
    {
        params.method = 'index';
    }
    
    if(this.options.camelizeMethodName)
    {
        params.method = ActiveSupport.camelize(params.method,false);
    }
    
    if(this.options.camelizeObjectName)
    {
        params.object = ActiveSupport.camelize(params.object,true);
    }
    
    //first past for exact match
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = ActiveSupport.clone(this.routes[i]);
        route.params = ActiveSupport.clone(this.routes[i].params || {});
        var path = route.path;
        if((route.params.method || '').toLowerCase() == (params.method || '').toLowerCase() && (route.params.object || '').toLowerCase() == (params.object || '').toLowerCase())
        {
            path = ActiveRoutes.performParamSubstitution(path,route,params);
            var cleaned = this.cleanPath(path,params,only_path);
            if(!cleaned.match(':'))
            {
                return cleaned;
            }
            
        }
    }
    //match that requires param replacement
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = ActiveSupport.clone(this.routes[i]);
        route.params = ActiveSupport.clone(this.routes[i].params || {});
        var path = route.path;
        if(route.params.object == params.object)
        {
            path = ActiveRoutes.performParamSubstitution(path,route,params);
            var cleaned = this.cleanPath(path,params,only_path);
            if(!cleaned.match(':'))
            {
                return cleaned;
            }
        }
    }
    return false;
};

ActiveRoutes.prototype.generateMethodsForRoute = function generateMethodsForRoute(route)
{
    var current_route_set = this;
    if(route.name)
    {
        var params_for_method_name = route.name + '_params';
        var url_for_method_name = route.name + '_url';
        var call_method_name = 'call_' + route.name;
        if(current_route_set.options.camelizeGeneratedMethods)
        {
            params_for_method_name = ActiveSupport.camelize(params_for_method_name.replace(/\_/g,'-'));
            url_for_method_name = ActiveSupport.camelize(url_for_method_name.replace(/\_/g,'-'));
            call_method_name = ActiveSupport.camelize(call_method_name.replace(/\_/g,'-'));
        }
        
        current_route_set.scope[params_for_method_name] = function generated_params_for(params){
            var final_params = {};
            for(var name in route.params || {})
            {
                final_params[name] = route.params[name];
            }
            for(var name in params)
            {
                final_params[name] = params[name];
            }
            return final_params;
        };
        
        current_route_set.scope[url_for_method_name] = function generated_url_for(params){
            return current_route_set.urlFor(current_route_set.scope[params_for_method_name](params));
        };
        
        current_route_set.scope[call_method_name] = function generated_call(params){
            return current_route_set.dispatch(current_route_set.scope[params_for_method_name](params));
        };
    }
};

})();
