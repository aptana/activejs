/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
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
 
/**
 * @namespace {ActiveSupport} Provides a number of methods from the
 *  Prototype.js framework, without modifying any built in prototypes to
 *  ensure compatibility and portability.
 */
ActiveSupport = null;

(function(global_context){
ActiveSupport = {
    /**
     * Returns the global context object (window in most implementations).
     * @alias ActiveSupport.getGlobalContext
     * @return {Object}
     */
    getGlobalContext: function getGlobalContext()
    {
        return global_context;
    },
    /**
     * Returns a class if it exists. If the context (default window / global
     * context) does not contain the class, but does have a __noSuchMethod__
     * property, it will attempt to call context[class_name]() to trigger
     * the __noSuchMethod__ handler.
     * @param {String} class_name
     * @param {Object} context
     * @return {Mixed}
     */
    getClass: function getClass(class_name,context)
    {
        context = context || ActiveSupport.getGlobalContext();
        var klass = context[class_name];
        if(!klass)
        {
            var trigger_no_such_method = (typeof(context.__noSuchMethod__) != 'undefined');
            if(trigger_no_such_method)
            {
                try
                {
                    context[class_name]();
                    klass = context[class_name];
                }
                catch(e)
                {
                    return false;
                }
            }
        }
        return klass;
    },
    /**
     * Logs a message to the available logging resource. Accepts a variable
     * number of arguments.
     * @alias ActiveSupport.log
     */
    log: function log()
    {
        if(typeof(Jaxer) != 'undefined')
        {
            Jaxer.Log.info.apply(Jaxer.Log,arguments || []);
        }
        else if(typeof(air) != 'undefined')
        {
            air.Introspector.Console.log.apply(air.Introspector.Console,arguments || []);
        }
        else if(typeof(console) != 'undefined')
        {
            console.log.apply(console,arguments || []);
        }
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
     * @param {Array} array
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
     * Returns a function wrapped around the original function.
     * @alias ActiveSupport.wrap
     * @param {Function} func
     * @param {Function} wrapper
     * @return {Function} wrapped
     * @example
     *
     *     String.prototype.capitalize = String.prototype.capitalize.wrap( 
     *     function(proceed, eachWord) { 
     *         if (eachWord && this.include(" ")) {
     *             // capitalize each word in the string
     *             return this.split(" ").invoke("capitalize").join(" ");
     *         } else {
     *             // proceed using the original function
     *             return proceed(); 
     *         }
     *     });
     */
    wrap: function wrap(func,wrapper)
    {
        func.wrap = function wrap(wrapper){
            var __method = this;
            return function wrapped(){
                return wrapper.apply(this,[ActiveSupport.bind(__method,this)].concat(ActiveSupport.arrayFrom(arguments)));
            };
        };
        return func.wrap(wrapper);
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
     * If the value passed is a function the value passed will be returned,
     * otherwise a function returning the value passed will be returned.
     * @alias ActiveSupport.proc
     * @param {mixed} proc
     * @return {Function}
     */
    proc: function proc(proc)
    {
        return typeof(proc) == 'function' ? proc : function(){return proc;};
    },
    
    /**
     * If the value passed is a function, the function is called and the value
     * returned, otherwise the value passed in is returned.
     * @alias ActiveSupport.value
     * @param {mixed} value
     * @return {scalar}
     */
    value: function value(value)
    {
        return typeof(value) == 'function' ? value() : value;
    },
    
    /**
     * If it is the last argument of current function is a function, it will be
     * returned. You can optionally specify the number of calls in the stack to
     * look up.
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
    
    /**
     * @namespace {ActiveSupport.Inflector} A port of Rails Inflector class.
     */
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
                var uncountable = ActiveSupport.Inflector.Inflections.uncountable[i];
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
     * Date Format 1.2.2
     * (c) 2007-2008 Steven Levithan <stevenlevithan.com>
     * MIT license
     * Includes enhancements by Scott Trenda <scott.trenda.net> and Kris Kowal <cixar.com/~kris.kowal/>
     *
     * Accepts a date, a mask, or a date and a mask.
     * Returns a formatted version of the given date.
     * The date defaults to the current date/time.
     * The mask defaults to dateFormat.masks.default.
     */
     
    /**
     * @alias ActiveSupport.dateFormat
     * @param {Date} date
     * @param {String} format
     * @param {Boolean} utc
     * @return {String}
     */
    dateFormat: function date_format_wrapper()
    {
        var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        var dateFormat = function dateFormat(date, mask, utc) {
            var dF = dateFormat;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && (typeof date == "string" || date instanceof String) && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date();
            if (isNaN(date)) throw new SyntaxError("invalid date");

            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var _ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
                D = date[_ + "Day"](),
                m = date[_ + "Month"](),
                y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
                M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
                L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d:    d,
                    dd:   pad(d),
                    ddd:  dF.i18n.dayNames[D],
                    dddd: dF.i18n.dayNames[D + 7],
                    m:    m + 1,
                    mm:   pad(m + 1),
                    mmm:  dF.i18n.monthNames[m],
                    mmmm: dF.i18n.monthNames[m + 12],
                    yy:   String(y).slice(2),
                    yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12),
                    H:    H,
                    HH:   pad(H),
                    M:    M,
                    MM:   pad(M),
                    s:    s,
                    ss:   pad(s),
                    l:    pad(L, 3),
                    L:    pad(L > 99 ? Math.round(L / 10) : L),
                    t:    H < 12 ? "a"  : "p",
                    tt:   H < 12 ? "am" : "pm",
                    T:    H < 12 ? "A"  : "P",
                    TT:   H < 12 ? "AM" : "PM",
                    Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
        
        // Some common format strings
        dateFormat.masks = {
            "default":      "ddd mmm dd yyyy HH:MM:ss",
            shortDate:      "m/d/yy",
            mediumDate:     "mmm d, yyyy",
            longDate:       "mmmm d, yyyy",
            fullDate:       "dddd, mmmm d, yyyy",
            shortTime:      "h:MM TT",
            mediumTime:     "h:MM:ss TT",
            longTime:       "h:MM:ss TT Z",
            isoDate:        "yyyy-mm-dd",
            isoTime:        "HH:MM:ss",
            isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
            MySQL:          "yyyy-mm-dd HH:MM:ss",
            isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
        };

        // Internationalization strings
        dateFormat.i18n = {
            dayNames: [
                "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
            ],
            monthNames: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
            ]
        };
        
        return dateFormat;
    }(),
    /**
     * Serializes an object to a JSON string.
     * @alias ActiveSupport.JSONFromObject
     * @param {Object} object
     * @return {String} json
     */ 
    JSONFromObject: function JSONFromObject(object)
    {
        return ActiveSupport.JSON.stringify(object);
    },
    /**
     * Serializes an object to an XML string.
     * @alias ActiveSupport.XMLFromObject
     * @param {String} outer_key_name
     * @param {Object} object
     * @return {String} xml
     */ 
    XMLFromObject: function XMLFromObject(outer_key_name,object)
    {
        var indent = 0;
        
        var str_repeat = function str_repeat(string,repeat)
        {
            var response = '';
            for(var i = 0; i < repeat; ++i)
            {
                response += string;
            }
            return response;
        };
        
        var serialize_value = function serialize_value(key_name,value,indent)
        {
            var response = '';
            if(typeof(value) == 'string' || typeof(value) == 'number' || typeof(value) == 'boolean')
            {
                response = '<![CDATA[' + (new String(value)).toString() + ']]>';
            }
            else if(typeof(value) == 'object')
            {
                response += String.fromCharCode(10);
                if('length' in value && 'splice' in value)
                {
                    for(var i = 0; i < value.length; ++i)
                    {
                        response += wrap_value(ActiveSupport.Inflector.singularize(key_name),value[i],indent + 1);
                    }
                }
                else
                {
                    var object = value.toObject && typeof(value.toObject) == 'function' ? value.toObject() : value;
                    for(key_name in object)
                    {
                        response += wrap_value(key_name,object[key_name],indent + 1);
                    }
                }
                response += str_repeat(' ',4 * indent);
            }
            return response;
        };
        
        var sanitize_key_name = function sanitize_key_name(key_name)
        {
            return key_name.replace(/[\s\_]+/g,'-').toLowerCase();
        };
        
        var wrap_value = function wrap_value(key_name,value,indent)
        {
            key_name = sanitize_key_name(key_name);
            return str_repeat(' ',4 * indent) + '<' + key_name + '>' + serialize_value(key_name,value,indent) + '</' + key_name + '>' + String.fromCharCode(10);
        };
        
        outer_key_name = sanitize_key_name(outer_key_name);
        return '<' + outer_key_name + '>' + serialize_value(outer_key_name,object,0) + '</' + outer_key_name + '>';
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
    
    /**
     * @namespace {ActiveSupport.JSON} Provides JSON support if a native implementation is not available.
     */
    JSON: function()
    {
        //use native support if available
        if(global_context && 'JSON' in global_context && 'stringify' in global_context.JSON && 'parse' in global_context.JSON)
        {
          return global_context.JSON;
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

})(this);

/**
 * @namespace {ActiveEvent}
 * @example
 * ActiveEvent allows you to create observable events, and attach event
 * handlers to any class or object.
 *
 * Setup
 * -----
 * Before you can use ActiveEvent you must call extend a given class or object
 * with ActiveEvent's methods. If you extend a class, both the class itself
 * will become observable, as well as all of it's instances.
 *
 *     ActiveEvent.extend(MyClass); //class and all instances are observable
 *     ActiveEvent.extend(my_object); //this object becomes observable
 * 
 * Creating Events
 * ---------------
 * You can create an event inside any method of your class or object by calling
 * the notify() method with name of the event followed by any arguments to be
 * passed to observers. You can also have an existing method fire an event with
 * the same name as the method using makeObservable().
 * 
 *     var Message = function(){};
 *     Message.prototype.send = function(text){
 *         //message sending code here...
 *         this.notify('sent',text);
 *     };
 *     ActiveEvent.extend(Message);
 * 
 *     //make an existing method observable
 *     var observable_hash = new Hash({});
 *     ActiveEvent.extend(observable_hash);
 *     observable_hash.makeObservable('set');
 * 
 * Observing Events
 * ----------------
 * To observe an event call the observe() method with the name of the event you
 * want to observe, and the observer function. The observer function will
 * receive any additional arguments passed to notify(). If observing a class,
 * the instance that triggered the event will always be the first argument
 * passed to the observer. observeOnce() works just like observe() in every
 * way, but is only called once.
 * 
 *     Message.observe('sent',function(message,text){
 *         //responds to all sent messages
 *     });
 * 
 *     var m = new Message();
 *     m.observe('sent',function(text){
 *         //this will only be called when "m" is sent
 *     });
 * 
 *     observable_hash.observe('set',function(key,value){
 *         console.log('observable_hash.set: ' + key + '=' + value);
 *     });
 *     observable_hash.observeOnce(function(key,value){
 *         //this will only be called once
 *     });
 * 
 * Control Flow
 * ------------
 * When notify() is called, if any of the registered observers for that event
 * return false, no other observers will be called and notify() will return
 * false. Returning null or not calling return will not stop the event.
 *
 * Otherwise notify() will return an array of the
 * collected return values from any registered observer functions. Observers
 * can be unregistered with the stopObserving() method. If no observer is
 * passed, all observers of that object or class with the given event name
 * will be unregistered. If no event name and no observer is passed, all
 * observers of that object or class will be unregistered.
 *
 *     Message.prototype.send = function(text){
 *         if(this.notify('send',text) === false)
 *             return false;
 *         //message sending code here...
 *         this.notify('sent',text);
 *         return true;
 *     };
 * 
 *     var m = new Message();
 *     
 *     var observer = m.observe('send',function(message,text){
 *         if(text == 'test')
 *             return false;
 *     });
 *     
 *     m.send('my message'); //returned true
 *     m.send('test'); //returned false
 *     
 *     m.stopObserving('send',observer);
 *     
 *     m.send('test'); //returned true</code></pre>
 * 
 * Object.options
 * --------------
 * If an object has an options property that contains a callable function with
 * the same name as an event triggered with <b>notify()</b>, it will be
 * treated just like an instance observer. So the falling code is equivalent.
 *
 *     var rating_one = new Control.Rating('rating_one',{  
 *         afterChange: function(new_value){}    
 *     });  
 *     
 *     var rating_two = new Control.Rating('rating_two');  
 *     rating_two.observe('afterChange',function(new_value){});</code></pre>
 * 
 * MethodCallObserver
 * ------------------
 * The makeObservable() method permanently modifies the method that will
 * become observable. If you need to temporarily observe a method call without
 * permanently modifying it, use the observeMethod(). Pass the name of the
 * method to observe and the observer function will receive all of the
 * arguments passed to the method. An ActiveEvent.MethodCallObserver object is
 * returned from the call to observeMethod(), which has a stop() method on it.
 * Once stop() is called, the method is returned to it's original state. You
 * can optionally pass another function to observeMethod(), if you do the
 * MethodCallObserver will be automatically stopped when that function
 * finishes executing.
 *
 *   var h = new Hash({});
 *   ActiveEvent.extend(h);
 *   
 *   var observer = h.observeMethod('set',function(key,value){
 *       console.log(key + '=' + value);
 *   });
 *   h.set('a','one');
 *   h.set('a','two');
 *   observer.stop();
 *   
 *   //console now contains:
 *   //"a = one"
 *   //"b = two"
 *   
 *   //the following does the same as above
 *   h.observeMethod('set',function(key,value){
 *       console.log(key + '=' + value);
 *   },function(){
 *       h.set('a','one');
 *       h.set('b','two');
 *   });
 */
ActiveEvent = null;

/**
 * @namespace {ActiveEvent.ObservableObject} After calling
 *  ActiveEvent.extend(object), the given object will inherit the
 *  methods in this namespace. If the given object has a prototype
 *  (is a class constructor), the object's prototype will inherit
 *  these methods as well.
 */

(function(){

ActiveEvent = {};

/**
 * After extending a given object, it will inherit the methods described in
 *  ActiveEvent.ObservableObject.
 * @alias ActiveEvent.extend
 * @param {Object} object
 */
ActiveEvent.extend = function extend(object){
    
    /**
     * Wraps the given method_name with a function that will call the method,
     *  then trigger an event with the same name as the method. This can
     *  safely be applied to virtually any method, including built in
     *  Objects (Array.pop, etc), but cannot be undone.
     * @alias ActiveEvent.ObservableObject.makeObservable
     * @param {String} method_name
     */
    object.makeObservable = function makeObservable(method_name)
    {
        if(this[method_name])
        {
            this._objectEventSetup(method_name);
            this[method_name] = ActiveSupport.wrap(this[method_name],function wrapped_observer(proceed){
                var args = ActiveSupport.arrayFrom(arguments).slice(1);
                var response = proceed.apply(this,args);
                args.unshift(method_name);
                this.notify.apply(this,args);
                return response;
            });
        }
        if(this.prototype)
        {
            this.prototype.makeObservable(method_name);
        }
    };
    
    /**
     * Similiar to makeObservable(), but after the callback is called, the
     *  method will be returned to it's original state and will no longer
     *  be observable.
     * @alias ActiveEvent.ObservableObject.observeMethod
     * @param {String} method_name
     * @param {Function} observe
     * @param {Function} [callback]
     */
    object.observeMethod = function observeMethod(method_name,observer,scope)
    {
        return new ActiveEvent.MethodCallObserver([[this,method_name]],observer,scope);
    };
    
    object._objectEventSetup = function _objectEventSetup(event_name)
    {
        this._observers = this._observers || {};
        this._observers[event_name] = this._observers[event_name] || [];
    };
    
    /**
     * @alias ActiveEvent.ObservableObject.observe
     * @param {String} event_name
     * @param {Function} observer
     * @return {Function} observer
     */
    object.observe = function observe(event_name,observer)
    {
        if(typeof(event_name) == 'string' && typeof(observer) != 'undefined')
        {
            this._objectEventSetup(event_name);
            if(!(ActiveSupport.indexOf(this._observers[event_name],observer) > -1))
            {
                this._observers[event_name].push(observer);
            }
        }
        else
        {
            for(var e in event_name)
            {
                this.observe(e,event_name[e]);
            }
        }
        return observer;
    };
    
    /**
     * Removes a given observer. If no observer is passed, removes all
     *   observers of that event. If no event is passed, removes all
     *   observers of the object.
     * @alias ActiveEvent.ObservableObject.stopObserving
     * @param {String} [event_name]
     * @param {Function} [observer]
     */
    object.stopObserving = function stopObserving(event_name,observer)
    {
        this._objectEventSetup(event_name);
        if(event_name && observer)
        {
            this._observers[event_name] = ActiveSupport.without(this._observers[event_name],observer);
        }
        else if(event_name)
        {
            this._observers[event_name] = [];
        }
        else
        {
            this._observers = {};
        }
    };
    
    /**
     * Works exactly like observe(), but will stopObserving() after the next
     *   time the event is fired.
     * @alias ActiveEvent.ObservableObject.observeOnce
     * @param {String} event_name
     * @param {Function} observer
     * @return {Function} The observer that was passed in will be wrapped,
     *  this generated / wrapped observer is returned.
     */
    object.observeOnce = function observeOnce(event_name,outer_observer)
    {
        var inner_observer = ActiveSupport.bind(function bound_inner_observer(){
            outer_observer.apply(this,arguments);
            this.stopObserving(event_name,inner_observer);
        },this);
        this._objectEventSetup(event_name);
        this._observers[event_name].push(inner_observer);
        return inner_observer;
    };
    
    /**
     * Triggers event_name with the passed arguments.
     * @alias ActiveEvent.ObservableObject.notify
     * @param {String} event_name
     * @param {mixed} [args]
     * @return {mixed} Array of return values, or false if the event was
     *  stopped by an observer.
     */
    object.notify = function notify(event_name){
        this._objectEventSetup(event_name);
        var collected_return_values = [];
        var args = ActiveSupport.arrayFrom(arguments).slice(1);
        for(var i = 0; i < this._observers[event_name].length; ++i)
        {
            var response = this._observers[event_name][i].apply(this._observers[event_name][i],args);
            if(response === false)
            {
                return false;
            }
            else
            {
                collected_return_values.push(response);
            }
        }
        return collected_return_values;
    };
    if(object.prototype)
    {
        object.prototype.makeObservable = object.makeObservable;
        object.prototype.observeMethod = object.observeMethod;
        object.prototype._objectEventSetup = object._objectEventSetup;
        object.prototype.observe = object.observe;
        object.prototype.stopObserving = object.stopObserving;
        object.prototype.observeOnce = object.observeOnce;
        
        object.prototype.notify = function notify(event_name)
        {
            if(object.notify)
            {
                var args = ActiveSupport.arrayFrom(arguments).slice(1);
                args.unshift(this);
                args.unshift(event_name);
                object.notify.apply(object,args);
            }
            this._objectEventSetup(event_name);
            var args = ActiveSupport.arrayFrom(arguments).slice(1);
            var collected_return_values = [];
            var response;
            if(this.options && this.options[event_name] && typeof(this.options[event_name]) == 'function')
            {
                response = this.options[event_name].apply(this,args);
                if(response === false)
                {
                    return false;
                }
                else
                {
                    collected_return_values.push(response);
                }
            }
            for(var i = 0; i < this._observers[event_name].length; ++i)
            {
                response = this._observers[event_name][i].apply(this._observers[event_name][i],args);
                if(response === false)
                {
                    return false;
                }
                else
                {
                    collected_return_values.push(response);
                }
            }
            return collected_return_values;
        };
    }
};

ActiveEvent.MethodCallObserver = function MethodCallObserver(methods,observer,scope)
{
    this.stop = function stop(){
        for(var i = 0; i < this.methods.length; ++i)
        {
            this.methods[i][0][this.methods[i][1]] = this.originals[i];
        }
    };
    this.methods = methods;
    this.originals = [];
    for(var i = 0; i < this.methods.length; ++i)
    {
        this.originals.push(this.methods[i][0][this.methods[i][1]]);
        this.methods[i][0][this.methods[i][1]] = ActiveSupport.wrap(this.methods[i][0][this.methods[i][1]],function(proceed){
            var args = ActiveSupport.arrayFrom(arguments).slice(1);
            observer.apply(this,args);
            return proceed.apply(this,args);
        });
    }
    if(scope)
    {
        scope();
        this.stop();
    }
};

var ObservableHash = function ObservableHash(object)
{
    this._object = object || {};
};

ObservableHash.prototype.set = function set(key,value)
{
    this._object[key] = value;
    this.notify('set',key,value);
    return value;
};

ObservableHash.prototype.get = function get(key)
{
    this.notify('get',key);
    return this._object[key];
};

ObservableHash.prototype.toObject = function toObject()
{
    return this._object;
};

ActiveEvent.extend(ObservableHash);

ActiveEvent.ObservableHash = ObservableHash;

})();

ActiveView = null;

(function(){

ActiveView = {};

ActiveView.logging = false;

ActiveView.create = function create(structure,methods)
{
    if(typeof(options) == 'function')
    {
        options = {
            structure: options
        };
    }
    var klass = function klass(){
        this.initialize.apply(this,arguments);
    };
    ActiveSupport.extend(klass,ClassMethods);
    ActiveSupport.extend(klass.prototype,methods || {});
    ActiveSupport.extend(klass.prototype,InstanceMethods);
    klass.prototype.structure = structure || ActiveView.defaultStructure;
    ActiveEvent.extend(klass);
    return klass;
};

ActiveView.defaultStructure = function defaultStructure()
{
    return ActiveSupport.getGlobalContext().document.createElement('div');
};

ActiveView.makeArrayObservable = function makeArrayObservable(array)
{
    ActiveEvent.extend(array);
    array.makeObservable('shift');
    array.makeObservable('unshift');
    array.makeObservable('pop');
    array.makeObservable('push');
    array.makeObservable('splice');
};

ActiveView.render = function render(content,target,scope,clear,execute)
{
    if(!execute)
    {
        execute = function render_execute(target,content)
        {
            if(!content)
            {
                throw Errors.InvalidContent;
            }
            target.appendChild(content);
        };
    }
    if(typeof(content) === 'function' && !content.prototype.structure)
    {
        content = content(scope);
    }
    if(clear !== false)
    {
        target.innerHTML = '';
    }
    if(typeof(content) === 'string')
    {
        target.innerHTML = content;
        return content;
    }
    else if(content && content.nodeType == 1)
    {
        execute(target,content);
        return content;
    }
    else if(content && content.container)
    {
      //is ActiveView instance
      execute(target,content.container);
      return view;
    }
    else if(content && content.prototype && content.prototype.structure)
    {
        //is ActiveView class
        var view = new content(scope);
        execute(target,view.container);
        return view;
    }
    else
    {
        throw Errors.InvalidContent;
    }
};

var InstanceMethods = {
    initialize: function initialize(scope,parent)
    {
        this.parent = parent;
        this.setupScope(scope);
        if(ActiveView.logging)
        {
            ActiveSupport.log('ActiveView: initialized with scope:',scope);
        }
        this.builder = ActiveView.Builder;
        ActiveView.generateBinding(this);
        this.container = this.structure();
        if(!this.container || !this.container.nodeType || this.container.nodeType != 1)
        {
            throw Errors.ViewDoesNotReturnContainer + typeof(this.container);
        }
        for(var key in this.scope._object)
        {
            this.scope.set(key,this.scope._object[key]);
        }
    },
    setupScope: function setupScope(scope)
    {
        this.scope = (scope ? (scope.toObject ? scope : new ActiveEvent.ObservableHash(scope)) : new ActiveEvent.ObservableHash({}));
        for(var key in this.scope._object)
        {
            var item = this.scope._object[key];
            if((item != null && typeof item == "object" && 'splice' in item && 'join' in item) && !item.observe)
            {
                ActiveView.makeArrayObservable(item);
            }
        }
    },
    get: function get(key)
    {
        return this.scope.get(key);
    },
    set: function set(key,value)
    {
        return this.scope.set(key,value);
    },
    registerEventHandler: function registerEventHandler(element,event_name,observer)
    {
      this.eventHandlers.push([element,event_name,observer]);
    }
};

var ClassMethods = {

};

var Errors = {
    ViewDoesNotReturnContainer: 'The view constructor must return a DOM element. Returned: ',
    InvalidContent: 'The content to render was not a string, DOM element or ActiveView.',
    MismatchedArguments: 'Incorrect argument type passed: '
};

var Builder = {
    createElement: function createElement(tag,attributes)
    {
        var global_context = ActiveSupport.getGlobalContext();
        var ie = !!(global_context.attachEvent && !global_context.opera);
        attributes = attributes || {};
        tag = tag.toLowerCase();
        if(ie && attributes.name)
        {
            tag = '<' + tag + ' name="' + attributes.name + '">';
            delete attributes.name;
        }
        var element = global_context.document.createElement(tag);
        Builder.writeAttribute(element,attributes);
        return element;
    },
    writeAttribute: function writeAttribute(element,name,value)
    {
        var transitions = {
            className: 'class',
            htmlFor:   'for'
        };
        var attributes = {};
        if(typeof name == 'object')
        {
            attributes = name;
        }
        else
        {
            attributes[name] = typeof(value) == 'undefined' ? true : value;
        }
        for(var attribute_name in attributes)
        {
            name = transitions[attribute_name] || attribute_name;
            value = attributes[attribute_name];
            if(value === false || value === null)
            {
                element.removeAttribute(name);
            }
            else if(value === true)
            {
                element.setAttribute(name,name);
            }
            else
            {
                element.setAttribute(name,value);
            }
        }
        return element;
    },
    addMethods: function addMethods(methods)
    {
        ActiveSupport.extend(Builder,methods || {});
    }
};

(function builder_generator(){
    var tags = ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
        "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
        "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX "+
        "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P "+
        "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD "+
        "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/);
    var global_context = ActiveSupport.getGlobalContext();
    for(var t = 0; t < tags.length; ++t)
    {
        var tag = tags[t];
        (function tag_iterator(tag){
            Builder[tag.toLowerCase()] = Builder[tag] = function tag_generator(){
                var i, argument, attributes, elements, element;
                text_nodes = [];
                elements = [];
                for(i = 0; i < arguments.length; ++i)
                {
                    argument = arguments[i];
                    if(typeof(argument) === 'undefined' || argument === null || argument === false)
                    {
                        continue;
                    }
                    if(typeof(argument) == 'function')
                    {
                        argument = argument();
                    }
                    if(typeof(argument) != 'string' && typeof(argument) != 'number' && !(argument != null && typeof argument == "object" && 'splice' in argument && 'join' in argument) && !(argument && argument.nodeType == 1))
                    {
                        attributes = argument;
                    }
                    else if(argument != null && typeof argument == "object" && 'splice' in argument && 'join' in argument)
                    {
                        elements = argument;
                    }
                    else if((argument && argument.nodeType == 1) || typeof(argument) == 'string' || typeof(argument) == 'number')
                    {
                        elements.push(argument);
                    }
                }
                element = Builder.createElement(tag,attributes);
                for(i = 0; i < elements.length; ++i)
                {
                    element.appendChild((elements[i] && elements[i].nodeType == 1) ? elements[i] : global_context.document.createTextNode((new String(elements[i])).toString()));
                }
                return element;
            };
        })(tag);
    }
})();

ActiveView.Builder = Builder;

ActiveView.generateBinding = function generateBinding(instance)
{
    instance.binding = {};
    instance.binding.update = function update(element)
    {
        if(!element || !element.nodeType == 1)
        {
            console.log(element)
            throw Errors.MismatchedArguments + 'expected Element, recieved ' + typeof(element);
        }
        return {
            from: function from(observe_key)
            {
                var object = instance.scope;
                if(arguments.length == 2)
                {
                    object = arguments[1];
                    observe_key = arguments[2];
                }
                
                var transformation = null;
                var condition = function default_condition(){
                    return true;
                };
                
                var transform = function transform(callback)
                {
                    if(!callback || typeof(callback) != 'function')
                    {
                        throw Errors.MismatchedArguments + 'expected Function, recieved ' + typeof(callback);
                    }
                    transformation = callback;
                    return {
                        when: when
                    };
                };

                var when = function when(callback)
                {
                    if(!callback || typeof(callback) != 'function')
                    {
                        throw Errors.MismatchedArguments + 'expected Function, recieved ' + typeof(callback);
                    }
                    condition = callback;
                    return {
                        transform: transform
                    };
                };

                object.observe('set',function update_from_observer(set_key,value){
                    if(observe_key == set_key)
                    {
                        if(condition())
                        {
                            element.innerHTML = transformation ? transformation(value) : value;
                        }
                    }
                });
                
                return {
                    transform: transform,
                    when: when
                };
            }
        };
    };

    instance.binding.collect = function collect(view)
    {
        if(!view)
        {
            throw Errors.MismatchedArguments + 'expected string, ActiveView class or function, recieved ' + typeof(view);
        }
        return {
            from: function from(collection)
            {
                if(!collection || (typeof(collection) != 'object' && typeof(collection) != 'string'))
                {
                    throw Errors.MismatchedArguments + 'expected array, recieved ' + typeof(collection);
                }
                return {
                    into: function into(element)
                    {
                        if(!element || !element.nodeType == 1)
                        {
                            throw Errors.MismatchedArguments + 'expected Element, recieved ' + typeof(element);
                        }
                        //if a string is passed make sure that the view is re-built when the key is set
                        if(typeof(collection) == 'string')
                        {
                            var collection_name = collection;
                            instance.scope.observe('set',function collection_key_change_observer(key,value){
                                if(key == collection_name)
                                {
                                    element.innerHTML = '';
                                    instance.binding.collect(view).from(value).into(element);
                                }
                            });
                        }
                        else
                        {
                            //loop over the collection when it is passed in to build the view the first time
                            var collected_elements = [];
                            for(var i = 0; i < collection.length; ++i)
                            {
                                ActiveView.render(view,element,collection[i],false);
                                collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                            }
                            //these handlers will add or remove elements from the view as the collection changes
                            if(collection.observe)
                            {
                                collection.observe('pop',function pop_observer(){
                                    collected_elements[collected_elements.length - 1].parentNode.removeChild(collected_elements[collected_elements.length - 1]);
                                    collected_elements.pop();
                                });
                                collection.observe('push',function push_observer(item){
                                    ActiveView.render(view,element,item,false);
                                    collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                                });
                                collection.observe('unshift',function unshift_observer(item){
                                    ActiveView.render(view,element,item,false,function unshift_observer_render_executor(element,content){
                                        element.insertBefore(content,element.firstChild);
                                    });
                                    collected_elements.unshift(element.firstChild);
                                });
                                collection.observe('shift',function shift_observer(){
                                    element.removeChild(element.firstChild);
                                    collected_elements.shift(element.firstChild);
                                });
                                collection.observe('splice',function splice_observer(index,to_remove){
                                    var children = [];
                                    var i;
                                    for(i = 2; i < arguments.length; ++i)
                                    {
                                        children.push(arguments[i]);
                                    }
                                    if(to_remove)
                                    {
                                        for(i = index; i < (index + to_remove); ++i)
                                        {
                                            collected_elements[i].parentNode.removeChild(collected_elements[i]);
                                        }
                                    }
                                    for(i = 0; i < children.length; ++i)
                                    {
                                        ActiveView.render(view,element,children[i],false,function splice_observer_render_executor(element,content){
                                            element.insertBefore(typeof(content) == 'string' ? document.createTextNode(content) : content,element.childNodes[index + i]);
                                            children[i] = element.childNodes[index + i];
                                        });
                                    }
                                    collected_elements.splice.apply(collected_elements,[index,to_remove].concat(children));
                                });
                            }
                        }
                    }
                };
            }
        };
    };

    instance.binding.when = function when(outer_key)
    {
        return {
            changes: function changes(callback)
            {
                if(!callback || typeof(callback) != 'function')
                {
                    throw Errors.MismatchedArguments + 'expected Function, recieved ' + typeof(callback);
                }
                instance.scope.observe('set',function changes_observer(inner_key,value){
                    if(outer_key == inner_key)
                    {
                        callback(value);
                    }
                });
            }
        };
    };
};

})();
