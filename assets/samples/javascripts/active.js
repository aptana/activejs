/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (c) 2010 Aptana, Inc.
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
var ActiveSupport = null;

if(typeof exports != "undefined"){
    exports.ActiveSupport = ActiveSupport;
}

/**
 * == ActiveSupport ==
 * Provides a subset of important Function, Array and String methods from Prototype.js
 * Also includes a port of Ajax.Request, and methods that other modules in ActiveJS rely
 * on to operate.
 **/
(function(global_context){

/** section: ActiveSupport
 * ActiveSupport
 * Provides a subset of methods from the Prototype.js framework,
 * without modifying any built in prototypes to ensure compatibility
 * and portability.
 **/
ActiveSupport = {
    /**
     * ActiveSupport.getGlobalContext() -> Object
     * Returns the global context object (window in most implementations).
     **/
    getGlobalContext: function getGlobalContext()
    {
        return global_context;
    },
    /**
     * ActiveSupport.log() -> null
     * Logs a message to the available logging resource. Accepts a variable
     * number of arguments.
     **/
    log: function log()
    {
        if(typeof(console) !== 'undefined')
        {
            //console.log.apply not supported by IE
            switch(arguments.length)
            {
                case 1: console.log(arguments[0]); break;
                case 2: console.log(arguments[0],arguments[1]); break;
                case 3: console.log(arguments[0],arguments[1],arguments[2]); break;
                case 4: console.log(arguments[0],arguments[1],arguments[2],arguments[3]); break;
                case 5: console.log(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]); break;
            }
        }
    },
    /**
     * ActiveSupport.createError(message) -> Object
     * Creates an Error object (but does not throw it).
     *
     *     var MyError = ActiveSupport.createError('Error in file % on line %.');
     *     throw MyError.getErrorString(file_name,line_number);
     **/
    createError: function createError(message)
    {
        return {
            getErrorString: function getErrorString()
            {
                var output = String(message);
                for(var i = 0; i < arguments.length; ++i)
                {
                    output = output.replace(/\%/,arguments[i].toString ? arguments[i].toString() : String(arguments[i]));
                }
                return output;
            }
        };
    }
};

})(this);

/**
 * ActiveSupport.Array
 **/
ActiveSupport.Array = {
    /**
     * ActiveSupport.Array.from(object) -> Array
     * Returns an array from an array or array like object.
     **/
    from: function from(object)
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
     * ActiveSupport.Array.indexOf(array,object[,index]) -> Number
     * Emulates Array.indexOf for implementations that do not support it.
     **/
    indexOf: function indexOf(array,item,i)
    {
        if(Array.prototype.indexOf)
        {
            return array.indexOf(item,i);
        }
        i = i || (0);
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
     * ActiveSupport.Array.without(array,item) -> Array
     * Returns an array without the given item.
     **/
    without: function without(arr)
    {
        var values = ActiveSupport.Array.from(arguments).slice(1);
        var response = [];
        for(var i = 0 ; i < arr.length; i++)
        {
            if(!(ActiveSupport.Array.indexOf(values,arr[i]) > -1))
            {
                response.push(arr[i]);
            }
        }
        return response;
    },
    /**
     * ActiveSupport.Array.map(array,iterator[,context]) -> Array
     * Emulates Array.prototype.map for browsers that do not support it.
     **/
    map: function map(array,iterator,context)
    {
        var length = array.length;
        context = context || window;
        var response = new Array(length);
        for(var i = 0; i < length; ++i)
        {
            if(array[i])
            {
                response[i] = iterator.call(context,array[i],i,array);
            }
        }
        return response;
    }
};
/**
 * ActiveSupport.Function
 **/
ActiveSupport.Function = {
    /**
     * ActiveSupport.Function.methodize(function) -> Function
     * Emulates Prototype's [Function.prototype.methodize](http://api.prototypejs.org/language/function/prototype/methodize/) including curry functionality.
     **/
    methodize: function methodize(func)
    {
        if(func._methodized)
        {
            return func._methodized;
        }
        return func._methodized = function()
        {
            return func.apply(null,[this].concat(ActiveSupport.Array.from(arguments)));
        };
    },
    /**
     * ActiveSupport.Function.bind(function,context[,argument]) -> Function
     * Emulates Prototype's [Function.prototype.bind](http://api.prototypejs.org/language/function/prototype/bind/) including curry functionality.
     **/
    bind: function bind(func,object)
    {
        if(typeof(object) == 'undefined')
        {
            return func;
        }
        if(arguments.length < 3)
        {
            return function bound()
            {
                return func.apply(object,arguments);
            };
        }
        else
        {
            var args = ActiveSupport.Array.from(arguments);
            args.shift();
            args.shift();
            return function bound()
            {
                return func.apply(object,args.concat(ActiveSupport.Array.from(arguments)));
            }
        }
    },
    bindAndCurryFromArgumentsAboveIndex: function bindAndCurryFromArgumentsAboveIndex(func,arguments,length)
    {
        if(arguments.length - length > 0)
        {
            var arguments_array = ActiveSupport.Array.from(arguments);
            var arguments_for_bind = arguments_array.slice(length);
            arguments_for_bind.unshift(func);
            return ActiveSupport.Function.bind.apply(ActiveSupport,arguments_for_bind);
        }
        else
        {
            return func;
        }
    },
    /**
     * ActiveSupport.Function.curry(function[,argument]) -> Function
     * Emulates Prototype's [Function.prototype.curry](http://api.prototypejs.org/language/function/prototype/curry/).
     **/
    curry: function curry(func)
    {
        if(arguments.length == 1)
        {
            return func;
        }
        var args = ActiveSupport.Array.from(arguments).slice(1);
        return function curried()
        {
            return func.apply(this,args.concat(ActiveSupport.Array.from(arguments)));
        };
    },
    /**
     * ActiveSupport.Function.wrap(function,wrapper) -> Function
     * Emulates Prototype's [Function.prototype.wrap](http://api.prototypejs.org/language/function/prototype/wrap/)
     **/
    wrap: function wrap(func,wrapper)
    {
        return function wrapped()
        {
            return wrapper.apply(this,[ActiveSupport.Function.bind(func,this)].concat(ActiveSupport.Array.from(arguments)));
        };
    }
};
/**
 * ActiveSupport.String
 **/
ActiveSupport.String = {
    /**
     * ActiveSupport.String.underscore(string) -> String
     * Emulates Prototype's [String.prototype.underscore](http://api.prototypejs.org/language/string/prototype/underscore/)
     **/
    underscore: function underscore(str)
    {
        return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, function(match){
            match = match.split("");
            return match[0] + '_' + match[1];
        }).replace(/([a-z\d])([A-Z])/g, function(match){
            match = match.split("");
            return match[0] + '_' + match[1];
        }).replace(/-/g, '_').toLowerCase();
    },
    /**
     * ActiveSupport.String.camelize(string[,capitalize = false]) -> String
     * Emulates Prototype's [String.prototype.camelize](http://api.prototypejs.org/language/string/prototype/camelize/)
     **/
    camelize: function camelize(str, capitalize)
    {
        var camelized,
            parts = str.replace(/\_/g,'-').split('-'), len = parts.length;
        if (len === 1)
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
        if(str.charAt(0) === '-')
        {
            camelized = parts[0].charAt(0).toUpperCase() + parts[0].substring(1);
        }
        else
        {
            camelized = parts[0];
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
     * ActiveSupport.String.trim(string) -> String
     * Trim leading and trailing whitespace.
     **/
    trim: function trim(str)
    {
        return (str || "").replace(/^\s+|\s+$/g,"");
    },
    scriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
    /**
     * ActiveSupport.String.evalScripts(string) -> null
     **/
    evalScripts: function evalScripts(str)
    {
        var match_all = new RegExp(ActiveSupport.String.scriptFragment,'img');
        var match_one = new RegExp(ActiveSupport.String.scriptFragment,'im');
        var matches = str.match(match_all) || [];
        for(var i = 0; i < matches.length; ++i)
        {
            eval((matches[i].match(match_one) || ['', ''])[1]);
        }
    },
    /**
     * ActiveSupport.String.stripScripts(string) -> String
     **/
    stripScripts: function stripScripts(str)
    {
        return str.replace(new RegExp(ActiveSupport.String.scriptFragment,'img'),'');
    }
};
/**
 * ActiveSupport.Number
 **/
ActiveSupport.Number = {};
/**
 * ActiveSupport.Object
 **/
ActiveSupport.Object = {
    /**
     * ActiveSupport.Object.isArray(object) -> Boolean
     **/
    isArray: function isArray(object)
    {
        return object && typeof(object) == 'object' && 'length' in object && 'splice' in object && 'join' in object;
    },
    /**
     * ActiveSupport.Object.keys(object) -> Array
     * Returns an array of keys from an object.
     **/
    keys: function keys(object)
    {
        var keys_array = [];
        for (var property_name in object)
        {
            keys_array.push(property_name);
        }
        return keys_array;
    },
    /**
     * ActiveSupport.Object.values(object) -> Array
     * Returns an array of values from an object.
     **/
    values: function values(object)
    {
        var values_array = [];
        for (var property_name in object)
        {
            values_array.push(object[property_name]);
        }
        return values_array;
    },
    /**
     * ActiveSupport.Object.extend(destination,source) -> Object
     * Emulates Prototype's [Object.extend](http://api.prototypejs.org/language/object/extend/)
     **/
    extend: function extend(destination, source)
    {
        for (var property in source)
        {
            destination[property] = source[property];
        }
        return destination;
    },
    /**
     * ActiveSupport.Object.clone(object) -> Object
     * Emulates Prototype's [Object.clone](http://api.prototypejs.org/language/object/clone/)
     **/
    clone: function clone(object)
    {
        return ActiveSupport.Object.extend({}, object);
    }
};
ActiveSupport.Inflections = {
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
        "info",
        "equipment",
        "media"
    ]
};

ActiveSupport.Object.extend(ActiveSupport.Number,{
    /**
     * ActiveSupport.Number.ordinalize(number) -> String
     * Generates an ordinalized version of a number as a string (9th, 2nd, etc)
     **/
    ordinalize: function ordinalize(number)
    {
        if (11 <= parseInt(number, 10) % 100 && parseInt(number, 10) % 100 <= 13)
        {
            return number + "th";
        }
        else
        {
            switch (parseInt(number, 10) % 10)
            {
                case  1: return number + "st";
                case  2: return number + "nd";
                case  3: return number + "rd";
                default: return number + "th";
            }
        }
    }
});

ActiveSupport.Object.extend(ActiveSupport.String,{
    /**
     * ActiveSupport.String.pluralize(word) -> String
     * Generates a plural version of an english word.
     **/
    pluralize: function pluralize(word)
    {
        var i, lc = word.toLowerCase();
        for (i = 0; i < ActiveSupport.Inflections.uncountable.length; i++)
        {
            var uncountable = ActiveSupport.Inflections.uncountable[i];
            if (lc === uncountable)
            {
                return word;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.irregular.length; i++)
        {
            var singular = ActiveSupport.Inflections.irregular[i][0];
            var plural = ActiveSupport.Inflections.irregular[i][1];
            if ((lc === singular) || (lc === plural))
            {
                return plural;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.plural.length; i++)
        {
            var regex = ActiveSupport.Inflections.plural[i][0];
            var replace_string = ActiveSupport.Inflections.plural[i][1];
            if (regex.test(word))
            {
                return word.replace(regex, replace_string);
            }
        }
        return word;
    },
    /**
     * ActiveSupport.String.singularize(word) -> String
     * Generates a singular version of an english word.
     **/
    singularize: function singularize(word)
    {
        var i, lc = word.toLowerCase();
        for (i = 0; i < ActiveSupport.Inflections.uncountable.length; i++)
        {
            var uncountable = ActiveSupport.Inflections.uncountable[i];
            if (lc === uncountable)
            {
                return word;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.irregular.length; i++)
        {
            var singular = ActiveSupport.Inflections.irregular[i][0];
            var plural   = ActiveSupport.Inflections.irregular[i][1];
            if ((lc === singular) || (lc === plural))
            {
                return singular;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.singular.length; i++)
        {
            var regex = ActiveSupport.Inflections.singular[i][0];
            var replace_string = ActiveSupport.Inflections.singular[i][1];
            if (regex.test(word))
            {
                return word.replace(regex, replace_string);
            }
        }
        return word;
    }
});
/**
 * ActiveSupport.dateFromDateTime(date_time) -> Date
 * - date_time (String): in "yyyy-mm-dd HH:MM:ss" format
 *
 * Generates a JavaScript Date object from a MySQL DATETIME formatted string.
 **/
ActiveSupport.dateFromDateTime = function dateFromDateTime(date_time)
{
    var parts = date_time.replace(/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/,"$1 $2 $3 $4 $5 $6").split(' ');
    return new Date(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5]);
};

/*
 * Date Format 1.2.2
 * (c) 2007-2008 Steven Levithan <stevenlevithan.com>
 * MIT license
 * Includes enhancements by Scott Trenda <scott.trenda.net> and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * http://blog.stevenlevithan.com/archives/date-time-format
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

/**
 *  ActiveSupport.dateFormat(format) -> String
 *  ActiveSupport.dateFormat(date,format[,convert_to_local_time = false]) -> String
 *  - date (Date): If no date is passed the current Date will be used.
 *  - format (String): test
 *  - convert_to_local_time (Boolean): test
 *
 * See: <http://blog.stevenlevithan.com/archives/date-time-format>
 *
 * If convert_to_local_time is true the Date object will be assume to be GMT
 * and be converted from GMT to the local time. Local time will be the local
 * time of the server if running server side, or local time of the client
 * side if running in the browser.
 *
 *     ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss');
 *     ActiveSupport.dateFormat(new Date(),'yyyy-mm-dd HH:MM:ss');
 **/
ActiveSupport.dateFormat = (function date_format_wrapper()
{
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[\-\+]\d{4})?)\b/g,
        timezoneClip = /[^\-\+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) {
                val = "0" + val;
            }
            return val;
        };

    // Regexes and supporting functions are cached through closure
    var dateFormat = function dateFormat(date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length === 1 && (typeof date === "string" || date instanceof String) && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date();
        if (isNaN(date)) {
            throw new SyntaxError("invalid date");
        }

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) === "UTC:") {
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
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
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
})();
ActiveSupport.getNativeJSONImplementation = function getNativeJSONImplementation()
{
    var global_context = ActiveSupport.getGlobalContext();
    //use native support if available
    if(global_context && 'JSON' in global_context && 'stringify' in global_context.JSON && 'parse' in global_context.JSON)
    {
        var test_output = JSON.stringify({a:[]});
        if(test_output.match(/\"\}$/))
        {
            //double encoding bug for arrays in hashes in safari
            return false;
        }
        else
        {
            return global_context.JSON;
        }
    }
    else
    {
        return false;
    }
};

/*
    http://www.JSON.org/json2.js
    2008-07-15

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html
*/
ActiveSupport.getAlternateJSONImplementation = function getAlternateJSONImplementation()
{
    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    Date.prototype.toJSON = function (key) {
        return this.getUTCFullYear()   + '-' +
             f(this.getUTCMonth() + 1) + '-' +
             f(this.getUTCDate())      + 'T' +
             f(this.getUTCHours())     + ':' +
             f(this.getUTCMinutes())   + ':' +
             f(this.getUTCSeconds())   + 'Z';
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
    }

    function str(key, holder) {
        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];
        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function' && !ActiveSupport.Object.isArray(value)) {
            value = value.toJSON(key);
        }
        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
        case 'string':
            return quote(value.valueOf());
        case 'number':
            return isFinite(value) ? String(value.valueOf()) : 'null';
        case 'boolean':
            return String(value.valueOf());
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
    }

    return {
        /**
         * ActiveSupport.JSON.stringify(object) -> String
         **/
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
         * ActiveSupport.JSON.parse(json_string) -> Object
         **/
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
            }

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
};

/**
 * ActiveSupport.JSON
 * Provides JSON support, will use the browser's native implementation if it is available and complies with the JSON spec.
 **/
ActiveSupport.JSON = ActiveSupport.getNativeJSONImplementation() || ActiveSupport.getAlternateJSONImplementation();
/**
 * class ActiveSupport.CallbackQueue
 * Allows for the execution of callbacks in the order they are registered.
 *
 *     var queue = new ActiveSupport.CallbackQueue(function(){
 *         console.log('Callback queue empty.');
 *     });
 *     new ActiveSupport.Request(url,{
 *         onComplete: queue.push(function(){
 *             console.log('Ajax Request finished.');
 *         })
 *     });
 *     var callback_two = queue.push(function(){
 *         console.log('"callback_two" called.');
 *     });
 *     callback_two();
 *     var callback_three = queue.push(function(){
 *         console.log('"callback_three" called.');
 *     });
 *     callback_three();
 *
 * Ajax callback finishes after `callback_two` and `callback_three`, but
 * output to the console would still be:
 *
 *     //Ajax Request finished.
 *     //"callback_two" called.
 *     //"callback_three" called.
 *     //Callback queue empty.
 *
 * Note that ActiveSupport.CallbackQueue will only function if the first callback
 * added will be called asynchronously (as a result of an Ajax request or setTimeout
 * call).
 **/

/**
 * new ActiveSupport.CallbackQueue(on_complete[,context])
 * - on_complete (Function): The function to call when all callacks are completed.
 * - context (Object): optional context to bind the on_complete function to.
 **/
ActiveSupport.CallbackQueue = function CallbackQueue(on_complete)
{
    on_complete = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(on_complete || function(){},arguments,1);
    this.stack = [];
    this.waiting = {};
    if(on_complete)
    {
        this.setOnComplete(on_complete || function(){});
    }
};

/**
 * ActiveSupport.CallbackQueue.stack -> Array
 * The stack of callbacks that are `push`ed onto the queue.
 **/

ActiveSupport.CallbackQueue.prototype.setOnComplete = function setOnComplete(on_complete)
{
    this.onComplete = on_complete;
};

/**
 * ActiveSupport.CallbackQueue#push(callback[,context]) -> Function
 **/
ActiveSupport.CallbackQueue.prototype.push = function push(callback)
{
    callback = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(callback || function(){},arguments,1);
    var wrapped = ActiveSupport.Function.wrap(callback,ActiveSupport.Function.bind(function callback_queue_wrapper(proceed){
        var i = null;
        var index = ActiveSupport.Array.indexOf(this.stack,wrapped);
        this.waiting[index] = [proceed,ActiveSupport.Array.from(arguments).slice(1)];
        var all_present = true;
        for(i = 0; i < this.stack.length; ++i)
        {
            if(!this.waiting[i])
            {
                all_present = false;
            }
        }
        if(all_present)
        {
            for(i = 0; i < this.stack.length; ++i)
            {
                var item = this.waiting[i];
                item[0].apply(item[0],item[1]);
                delete this.waiting[i];
            }
        }
        if(all_present && i === this.stack.length)
        {
            if(this.onComplete)
            {
                this.onComplete();
            }
        }
    },this));
    this.stack.push(wrapped);
    return wrapped;
};
var global_context = ActiveSupport.getGlobalContext();
var ie = !!(global_context.attachEvent && !global_context.opera);

/**
 * ActiveSupport.Element
 * ActiveSupport.Element is a simple DOM manipulation library that does not modify the built in Element object. All ActiveSupport.Element methods take an Element object (and not a string) as their first argument. ActiveSupport.Element is available inside ActiveView classes as the second argument:
 *
 *     var MyClass = ActiveView.create(function(builder,dom){
 *         var link = builder.a({href:'#'},'Text');
 *         dom.addClassName(link,'active');
 *         dom.getWidth(link);
 *         return builder.div(link);
 *     });
 *
 * The implementation of event obeserver's differs from Prototype's since it does not modify the Element object. Your observer receives three arguments, the Event object, a function that will stop the event when called, and a function that will unregister the observer.
 *
 *     var dom = ActiveSupport.Element;
 *     dom.observe(link,'click',function(event,stop,unregister){
 *         //do stuff
 *         stop();
 *     });
 *
 * ActiveSupport.Element also supports the a similar event to Prototype's dom:ready:
 *
 *     dom.observe(document,'ready',function(){
 *         //...
 *     });
 **/
ActiveSupport.Element = {
    ieAttributeTranslations: {
        'class': 'className',
        'checked': 'defaultChecked',
        'usemap': 'useMap',
        'for': 'htmlFor',
        'readonly': 'readOnly',
        'colspan': 'colSpan',
        'bgcolor': 'bgColor',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding'
    },
    /**
     * ActiveSupport.Element.keyCodes -> Object
     * Contains the following:
     *
     * - KEY_BACKSPACE
     * - KEY_TAB
     * - KEY_RETURN
     * - KEY_ESC
     * - KEY_LEFT
     * - KEY_UP
     * - KEY_RIGHT
     * - KEY_DOWN
     * - KEY_DELETE
     * - KEY_HOME
     * - KEY_END
     * - KEY_PAGEUP
     * - KEY_PAGEDOWN
     * - KEY_INSERT
     **/
    keyCodes: {
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
        KEY_INSERT:   45
    },
    cache: {},
    /**
     * ActiveSupport.Element.create(tag_name,attributes_hash) -> Element
     **/
    create: function create(tag_name,attributes)
    {
        attributes = attributes || {};
        tag_name = tag_name.toLowerCase();
        var element;
        if(ie && (attributes.name || (tag_name == 'input' && attributes.type)))
        {
            //ie needs these attributes to be written in the string passed to createElement
            tag = '<' + tag_name;
            if(attributes.name)
            {
                tag += ' name="' + attributes.name + '"';
            }
            if(tag_name == 'input' && attributes.type)
            {
                tag += ' type="' + attributes.type + '"';
            }
            tag += '>';
            delete attributes.name;
            delete attributes.type;
            element = ActiveSupport.Element.extend(global_context.document.createElement(tag));
        }
        else
        {
            if(!ActiveSupport.Element.cache[tag_name])
            {
                ActiveSupport.Element.cache[tag_name] = ActiveSupport.Element.extend(global_context.document.createElement(tag_name));
            }
            element = ActiveSupport.Element.cache[tag_name].cloneNode(false);
        }
        ActiveSupport.Element.writeAttribute(element,attributes);
        return element;
    },
    extend: function extend(element)
    {
        return element;
    },
    /**
     * ActiveSupport.Element.clear(element) -> Element
     **/
    clear: function clear(element)
    {
        while(element.firstChild)
        {
            element.removeChild(element.firstChild);
        }
        return element;
    },
    /**
     * ActiveSupport.Element.hide(element) -> Element
     **/
    hide: function hide(element)
    {
        element.style.display = 'none';
        return element;
    },
    /**
     * ActiveSupport.Element.show(element) -> Element
     **/
    show: function show(element)
    {
        element.style.display = '';
        return element;
    },
    /**
     * ActiveSupport.Element.remove(element) -> Element
     **/
    remove: function remove(element)
    {
        element.parentNode.removeChild(element);
        return element;
    },
    /**
     * ActiveSupport.Element.insert(element,content[,position]) -> Element
     * - element (Element)
     * - content (String | Number | Element)
     * - position (String): "top", "bottom", "before", "after"
     * Note that this element does not identically mimic Prototype's Element.prototype.insert
     **/
    insert: function insert(element,content,position)
    {
        if(content && typeof(content.getElement) == 'function')
        {
            content = content.getElement();
        }
        if(ActiveSupport.Object.isArray(content))
        {
            for(var i = 0; i < content.length; ++i)
            {
                ActiveSupport.Element.insert(element,content[i],position);
            }
        }
        else
        {
            if(!content || !content.nodeType || content.nodeType !== 1)
            {
                content = global_context.document.createTextNode(String(content));
            }
            if(!position)
            {
                position = 'bottom';
            }
            switch(position)
            {
                case 'top': element.insertBefore(content,element.firstChild); break;
                case 'bottom': element.appendChild(content); break;
                case 'before': element.parentNode.insertBefore(content,element); break;
                case 'after': element.parentNode.insertBefore(content,element.nextSibling); break;
            }
        }
        return element;
    },
    /**
     * ActiveSupport.Element.update(element,content[,position]) -> Element
     * Works exactly like update, but calls ActiveSupport.Element.clear() on the element first.
     **/
    update: function update(element,content,position)
    {
        ActiveSupport.Element.clear(element);
        ActiveSupport.Element.insert(element,content,position);
        return element;
    },
    /**
     * ActiveSupport.Element.writeAttribute(element,name,value) -> Element
     * ActiveSupport.Element.writeAttribute(element,attributes_hash) -> Element
     **/
    writeAttribute: function writeAttribute(element,name,value)
    {
        var transitions = {
            className: 'class',
            htmlFor:   'for'
        };
        var attributes = {};
        if(typeof name === 'object')
        {
            attributes = name;
        }
        else
        {
            attributes[name] = typeof(value) === 'undefined' ? true : value;
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
                if(!ie)
                {
                    element.setAttribute(name,value);
                }
                else
                {
                    if(name == 'style')
                    {
                        element.style.cssText = value;
                    }
                    else
                    {
                        element.setAttribute(ActiveSupport.Element.ieAttributeTranslations[name] || name,value);
                    }
                }
            }
        }
        return element;
    },
    /**
     * ActiveSupport.Element.hasClassName(element,class_name) -> Boolean
     **/
    hasClassName: function hasClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        var element_class_name = element.className;
        return (element_class_name.length > 0 && (element_class_name == class_name || new RegExp("(^|\\s)" + class_name + "(\\s|$)").test(element_class_name)));
    },
    /**
     * ActiveSupport.Element.addClassName(element,class_name) -> Element
     **/
    addClassName: function addClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        if(!ActiveSupport.Element.hasClassName(element,class_name))
        {
            element.className += (element.className ? ' ' : '') + class_name;
        }
        return element;
    },
    /**
     * ActiveSupport.Element.removeClassName(element,class_name) -> Element
     **/
    removeClassName: function removeClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        element.className = element.className.replace(new RegExp("(^|\\s+)" + class_name + "(\\s+|$)"),' ').replace(/^\s+/, '').replace(/\s+$/, '');
        return element;
    },
    getDimensions: function getDimensions(element)
    {
        var display = element.style.display;
        if(!display)
        {
            var css = document.defaultView.getComputedStyle(element,null);
            display = css ? css.display : null;
        }
        //safari bug
        if(display != 'none' && display != null)
        {
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            };
        }
        var element_style = element.style;
        var original_visibility = element_style.visibility;
        var original_position = element_style.position;
        var original_display = element_style.display;
        element_style.visibility = 'hidden';
        element_style.position = 'absolute';
        element_style.display = 'block';
        var original_width = element.clientWidth;
        var original_height = element.clientHeight;
        element_style.display = original_display;
        element_style.position = original_position;
        element_style.visibility = original_visibility;
        return {
            width: original_width,
            height: original_height
        };
    },
    /**
     * ActiveSupport.Element.getWidth(element) -> Number
     **/
    getWidth: function getWidth(element)
    {
        return ActiveSupport.Element.getDimensions(element).width;
    },
    /**
     * ActiveSupport.Element.getHeight(element) -> Number
     **/
    getHeight: function getHeight(element)
    {
        return ActiveSupport.Element.getDimensions(element).height;
    },
    documentReadyObservers: [],
    /**
     * ActiveSupport.Element.observe(element,event_name,callback[,context]) -> Function
     * - element (Element): The DOM element to observe.
     * - event_name (String): The name of the event, in all lower case, without the "on" prefix — e.g., "click" (not "onclick").
     * - callback (Function): The function to call when the event occurs.
     * - context (Object): The context to bind the callback to. Any additional arguments after context will be curried onto the callback.
     * This implementation of event observation is loosely based on Prototype's, but instead of adding element.stopObserving() and event.stop()
     * methods to the respective Element and Event objects, an event stopping callback and an event handler unregistration callback are passed
     * into your event handler.
     *
     *     ActiveSupport.Element.observe(element,'click',function(event,stop,unregister){
     *         stop();
     *         unregister();
     *     },this);
     *
     *     //Prototype equivelent:
     *
     *     var my_handler = element.observe('click',function(event){
     *         event.stop();
     *         element.stopObserving('click',my_handler);
     *     }.bind(this));
     *
     * dom:ready support is also built in:
     *
     *     ActiveSupport.Element.observe(document,'ready',function(){});
     *
     * If the above call was made after the document 'ready' event had already fired, the callback would be called immediately.
     **/
    observe: function observe(element,event_name,callback,context)
    {
        callback = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(callback || function(){},arguments,3);
        //dom:ready support
        if(element == ActiveSupport.getGlobalContext().document && event_name == 'ready')
        {
            if(ActiveSupport.Element.documentReadyObservers == null)
            {
                //ActiveSupport.Element.documentReadyObservers will be null if the document is ready
                //if so, trigger the observer now
                callback();
            }
            else
            {
                ActiveSupport.Element.documentReadyObservers.push(callback);
            }
            return;
        }

        //create callback wrapper
        var callback_wrapper = function callback_wrapper(event){
            if(!event)
            {
                event = window.event;
            }
            return callback(
                event,
                //event.srcElement ? (event.srcElement.nodeType == 3 ? event.srcElement.parentNode : event.srcElement) : null,
                function stop_callback(){
                    event.cancelBubble = true;
                    event.returnValue = false;
                    if(event.preventDefault)
                    {
                        event.preventDefault();
                    }
                    if(event.stopPropagation)
                    {
                        event.stopPropagation();
                    }
                },function remove_event_listener(){
                    if(element.removeEventListener)
                    {
                        element.removeEventListener(event_name,callback_wrapper,false);
                    }
                    else
                    {
                        element.detachEvent("on" + event_name,callback_wrapper);
                    }
                }
            );
        };

        //attach event listener
        if(element.addEventListener)
        {
            element.addEventListener(event_name,callback_wrapper,false);
        }
        else
        {
            element.attachEvent('on' + event_name,callback_wrapper);
        }

        return callback_wrapper;
    }
};

/*
Ported from Prototype.js usage:

    ActiveSupport.Element.observe(document,'ready',function(){

    });
*/
(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;
  var loaded = false;

  function fire_content_loaded_event()
  {
      if(loaded)
      {
          return;
      }
      if(timer)
      {
          window.clearTimeout(timer);
      }
      loaded = true;
      if(ActiveSupport.Element.documentReadyObservers.length > 0)
      {
          for(var i = 0; i < ActiveSupport.Element.documentReadyObservers.length; ++i)
          {
              ActiveSupport.Element.documentReadyObservers[i]();
          }
          ActiveSupport.Element.documentReadyObservers = null;
      }
  };

  function check_ready_state(event,stop,stop_observing)
  {
      if(document.readyState === 'complete')
      {
          stop_observing();
          fire_content_loaded_event();
      }
  };

  function poll_do_scroll()
  {
      try
      {
          document.documentElement.doScroll('left');
      }
      catch(e)
      {
          timer = window.setTimeout(poll_do_scroll);
          return;
      }
      fire_content_loaded_event();
  };

  if(document.addEventListener)
  {
      document.addEventListener('DOMContentLoaded',fire_content_loaded_event,false);
  }
  else
  {
      ActiveSupport.Element.observe(document,'readystatechange',check_ready_state);
      if(window == top)
      {
          timer = window.setTimeout(poll_do_scroll);
      }
  }

  ActiveSupport.Element.observe(window,'load',fire_content_loaded_event);
})();

//Ajax Library integration
(function(){
    //Prototype
    if(global_context.Prototype && global_context.Prototype.Browser && global_context.Prototype.Browser.IE && global_context.Element && global_context.Element.extend)
    {
        ActiveSupport.Element.extend = function extendForPrototype(element){
          return Element.extend(element);
        };
    };
    //MooTools
    if(global_context.MooTools && global_context.Browser && global_context.Browser.Engine.trident && global_context.document.id)
    {
        ActiveSupport.Element.extend = function extendForMooTools(element){
            return global_context.document.id(element);
        };
    }
})();
/**
 * class ActiveSupport.Request
 *
 * Supports an indentical API to Prototype's [Ajax.Request/Response](http://api.prototypejs.org/ajax/),
 * but does not include handling / onException callbacks or Ajax.Responders.
 *
 * You can mimic Ajax.Responder functionality with ActiveEvent:
 *
 *     //only needs to be done once per app, but not enabled by default
 *     ActiveEvent.extend(ActiveSupport.Request);
 *     ActiveSupport.Request.observe('onComplete',function(request,response,header_json){});
 **/
ActiveSupport.Request = function Request(url,options)
{
    this._complete = false;
    this.options = {
        method: 'post',
        asynchronous: true,
        contentType: 'application/x-www-form-urlencoded',
        encoding: 'UTF-8',
        parameters: {},
        evalJSON: true,
        evalJS: true
    };
    ActiveSupport.Object.extend(this.options,options || {});
    this.options.method = this.options.method.toLowerCase();
    this.url = url;
    this.transport = ActiveSupport.Request.getTransport();
    this.request(url);
};

ActiveSupport.Object.extend(ActiveSupport.Request.prototype,{
    request: function request()
    {
        this.method = this.options.method;
        var params = ActiveSupport.Object.clone(this.options.parameters);
        if(this.method != 'get' && this.method != 'post')
        {
            params['_method'] = this.method;
            this.method = 'post';
        }
        if(this.method == 'post')
        {
            if(this.options.postBody && this.options.postBody.indexOf('authenticity_token') == -1)
            {
                this.options.postBody = this.options.postBody.replace(/}$/,',"authenticity_token":"' + window._auth_token + '"}');
            }
            else if(params['authenticity_token'] == null)
            {
                params['authenticity_token'] = window._auth_token;
            }
        }
        this.parameters = params;
        if(params = ActiveSupport.Request.encodeParamters(params))
        {
            if(this.method == 'get')
            {
                this.url += (this.url.match(/\?/) ? '&' : '?') + params;
            }
            else if(/Konqueror|Safari|KHTML/.test(navigator.userAgent))
            {
                params += '&_=';
            }
        }
        this.transport.open(this.method.toUpperCase(),this.url,this.options.asynchronous);
        if(this.options.asynchronous)
        {
            window.setTimeout(ActiveSupport.Function.bind(this.respondToReadyState,this),1000);
        }
        this.transport.onreadystatechange = ActiveSupport.Function.bind(this.onStateChange,this);
        this.setRequestHeaders();
        this.body = this.method == 'post' ? (this.options.postBody || params) : null;
        this.transport.send(this.body);
    },
    onStateChange: function onStateChange()
    {
        var ready_state = this.transport.readyState;
        if(ready_state > 1 && !((ready_state == 4) && this._complete))
        {
            this.respondToReadyState(this.transport.readyState);
        }
    },
    setRequestHeaders: function setRequestHeaders()
    {
        var headers = {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };
        if(this.method == 'post')
        {
            headers['Content-type'] = this.options.contentType + (this.options.encoding ? '; charset=' + this.options.encoding : '');
            /* Force "Connection: close" for older Mozilla browsers to work
             * around a bug where XMLHttpRequest sends an incorrect
             * Content-length header. See Mozilla Bugzilla #246651.
             */
            if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            {
                headers['Connection'] = 'close';
            }
        }
        // user-defined headers
        if(typeof this.options.requestHeaders == 'object')
        {
            var extras = this.options.requestHeaders;
            if(typeof(extras.push) == 'function')
            {
                for(var i = 0, length = extras.length; i < length; i += 2)
                {
                    headers[extras[i]] = extras[i+1];
                }
            }
            else
            {
                for(var extra_name in extras)
                {
                    headers[extra_name] = extras[extra_name];
                }
            }
        }
        for(var name in headers)
        {
            this.transport.setRequestHeader(name,headers[name]);
        }
    },
    respondToReadyState: function respondToReadyState(ready_state)
    {
        var response = new ActiveSupport.Response(this);
        if(this.options.onCreate)
        {
            this.options.onCreate(response);
        }
        if(this.notify)
        {
            this.notify('onCreate',response);
        }
        var state = ActiveSupport.Request.events[ready_state];
        if(state == 'Complete')
        {
            this._complete = true;
            (this.options['on' + response.status] || this.options['on' + (this.success() ? 'Success' : 'Failure')] || function(){})(response,response.headerJSON);
            var content_type = response.getHeader('Content-type');
            if(this.options.evalJS == 'force' || (this.options.evalJS && this.isSameOrigin() && content_type && content_type.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
            {
                this.evalResponse();
            }
        }
        (this.options['on' + state] || function(){})(response,response.headerJSON);
        if(this.notify)
        {
            this.notify('on' + state,response,response.headerJSON);
        }
        if(state == 'Complete')
        {
            // avoid memory leak in MSIE: clean up
            this.transport.onreadystatechange = function(){};
        }
    },
    getStatus: function getStatus()
    {
        try
        {
            return this.transport.status || 0;
        }
        catch(e)
        {
            return 0;
        }
    },
    success: function success()
    {
        var status = this.getStatus();
        return !status || (status >= 200 && status < 300);
    },
    getHeader: function getHeader(name)
    {
        try
        {
            return this.transport.getResponseHeader(name) || null;
        }
        catch(e)
        {
            return null;
        }
    },
    evalResponse: function evalResponse()
    {
        return eval((this.transport.responseText || '').replace(/^\/\*-secure-([\s\S]*)\*\/\s*$/,'$1'));
    },
    isSameOrigin: function isSameOrigin()
    {
        var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
        return !m || (m[0] == location.protocol + '//' + document.domain + location.port ? ':' + location.port : '');
    }
});

ActiveSupport.Object.extend(ActiveSupport.Request,{
    events: [
        'Uninitialized',
        'Loading',
        'Loaded',
        'Interactive',
        'Complete'
    ],
    getTransport: function getTransport()
    {
        try
        {
            return new XMLHttpRequest();
        }
        catch(e)
        {
            try
            {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }
            catch(e)
            {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        }
    },
    encodeParamters: function encodeParamters(params)
    {
        var response = [];
        for(var param_name in params)
        {
            param_name = encodeURIComponent(param_name);
            var values = params[param_name];
            if(values && typeof values == 'object')
            {
                if(ActiveSupport.Object.isArray(values))
                {
                    var values_response = [];
                    for(var i = 0; i < values.length; ++i)
                    {
                        values_response.push(ActiveSupport.Request.toQueryPair(param_name,values[i]));
                    }
                    response.push(values_response.join('&'));
                }
            }
            else
            {
                response.push(ActiveSupport.Request.toQueryPair(param_name,values));
            }
        }
        return response.join('&');
    },
    toQueryPair: function toQueryPair(key,value)
    {
        if(typeof(value) == 'undefined')
        {
            return key;
        }
        else
        {
            return key + '=' + encodeURIComponent(value == null ? '' : String(value));
        }
    }
});

ActiveSupport.Response = function Response(request)
{
    var global_context = ActiveSupport.getGlobalContext();
    var ie = !!(global_context.attachEvent && !global_context.opera);

    this.status = 0;
    this.statusText = '';
    this.getStatus = request.getStatus;
    this.getHeader = request.getHeader;

    this.request = request;
    var transport = this.transport = request.transport;
    var ready_state = this.readyState = transport.readyState;
    if((ready_state > 2 && !ie) || ready_state == 4)
    {
        this.status = this.getStatus();
        this.statusText = this.getStatusText();
        this.responseText = transport.responseText;
        this.headerJSON = this.getHeaderJSON();
    }
    if(ready_state == 4)
    {
        var xml = transport.responseXML;
        this.responseXML = typeof(xml) == 'undefined' ? null : xml;
        this.responseJSON = this.getResponseJSON();
    }
};
ActiveSupport.Object.extend(ActiveSupport.Response.prototype,{
    getStatusText: function getStatusText()
    {
        try
        {
            return this.transport.statusText || '';
        }
        catch(e)
        {
            return '';
        }
    },
    getHeaderJSON: function getHeaderJSON()
    {
        var json = this.getHeader('X-JSON');
        if(!json)
        {
            return null;
        }
        json = decodeURIComponent(escape(json));
        return ActiveSupport.JSON.parse(json);
    },
    getResponseJSON: function getResponseJSON()
    {
        var options = this.request.options;
        if(!options.evalJSON || (options.evalJSON != 'force' && !((this.getHeader('Content-type') || '').indexOf('application/json') > -1)) || (!this.responseText || this.responseText == ''))
        {
            return null;
        }
        return ActiveSupport.JSON.parse(this.responseText);
    }
});
/**
 * class ActiveSupport.Initializer
 * Several asynchronous events occur in an ActiveJS application before
 * your application is ready to use. The initializer ensures that ActiveView
 * and ActiveRecord are configured appropriately and that these events occur
 * in the correct order. Specifically the initializer will:
 *
 * - observe the document 'ready' event provided by ActiveSupport.Element
 * - connect ActiveRecord to a data source
 * - configure ActiveView.Routing
 *
 *     new ActiveSupport.Initializer({
 *         database: 'path/to/db.json',
 *         routes: function(){
 *             return {
 *                 home: ['/',MyApp.ViewOne,'index'],
 *                 about: ['/about',MyApp.ViewTwo,'about']
 *             };
 *         },
 *         callback: function(){
 *             MyApp.setup();
 *         }
 *     });
 *
 **/

/**
 * new ActiveSupport.Initializer(options)
 * - options (Object)
 *
 * The options hash can contain:
 *
 * - database (String | Array): URL of a JSON database to load, or an array of arguments to [[ActiveRecord.connect]]
 * - routes (Object | Function): A hash of routes, or a function that returns one. Usually a function is needed to avoid a race condition.
 * - callback (Function): The function to be called when the initializer is completed.
 **/

/**
 * ActiveSupport.Initializer#initialized -> Boolean
 **/
ActiveSupport.Initializer = function Initializer(params)
{
    this.database = params.database;
    this.routes = params.routes;
    this.callback = params.callback || function(){};
    this.initialized = false;
    this.queue = new ActiveSupport.CallbackQueue(this.setRoutes,this);
    if(this.database)
    {
        ActiveRecord.observe('ready',this.queue.push());
        if(typeof(this.database) == 'string' || (typeof(this.database) == 'object' && !ActiveSupport.Object.isArray(this.database)))
        {
            ActiveRecord.connect(this.database);
        }
        else if(ActiveSupport.Object.isArray(this.database))
        {
            ActiveRecord.connect.apply(ActiveRecord,this.database);
        }
        else
        {
            ActiveRecord.connect();
        }
    }
    ActiveSupport.Element.observe(document,'ready',this.queue.push());
};

ActiveSupport.Initializer.prototype.setRoutes = function setRoutes()
{
    if(this.routes)
    {
        ActiveView.Routing.observe('ready',this.onComplete,this);
        ActiveView.Routing.setRoutes((typeof(this.routes) == 'function') ? this.routes() : this.routes);
    }
    else
    {
        this.onComplete();
    }
};

ActiveSupport.Initializer.prototype.onComplete = function onComplete()
{
    this.initialized = true;
    this.callback();
};
/**
 * == ActiveEvent ==
 *
 * ActiveEvent allows you to create observable events, and attach event
 * handlers to any class or object.
 *
 * Setup
 * -----
 * Before you can use ActiveEvent you call [[ActiveEvent.extend]]. If you extend a class, both the class itself
 * will become observable, as well as all of it's instances.
 *
 *     ActiveEvent.extend(MyClass); //class and all instances are observable
 *     ActiveEvent.extend(my_object); //this object becomes observable
 *
 * Creating Events
 * ---------------
 * You can create an event inside any method of your class or object by calling
 * the `notify` method with name of the event followed by any arguments to be
 * passed to observers.
 *
 *     var Message = function(){};
 *     ActiveEvent.extend(Message);
 *     Message.prototype.send = function(text){
 *         //message sending code here...
 *         this.notify('sent',text);
 *     };
 *
 * Observing Events
 * ----------------
 * To observe an event call the `observe` method with the name of the event you
 * want to observe, and the observer function. The observer function will
 * receive any additional arguments passed to `notify`. If observing a class,
 * the instance that triggered the event will always be the first argument
 * passed to the observer. `observeOnce` works just like `observe` in every
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
 *
 *     observable_hash.observeOnce('set',function(key,value){
 *         //this will only be called once
 *     });
 *
 * You can bind and curry your observers by adding extra arguments, which
 * will be passed to [[ActiveSupport.Function.bind]]:
 *
 *     Message.observe('sent',function(curried_argument,message,text){
 *         //this == context
 *     },context,curried_argument);
 *
 * Control Flow
 * ------------
 * When `notify` is called, if any of the registered observers for that event
 * return false, no other observers will be called and `notify` will return
 * false. Returning null or not calling return will not stop the event.
 *
 * Otherwise `notify` will return an array of the
 * collected return values from any registered observer functions. Observers
 * can be unregistered with the `stopObserving` method. If no observer is
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
 *         if(text === 'test')
 *             return false;
 *     });
 *
 *     m.send('my message'); //returned true
 *     m.send('test'); //returned false
 *
 *     m.stopObserving('send',observer);
 *
 *     m.send('test'); //returned true
 *
 * Object.options
 * --------------
 * If an object has an options property that contains a callable function with
 * the same name as an event triggered with `notify`, it will be
 * treated just like an instance observer.
 *
 *     var Widget = function(options){
 *         this.options = options;
 *     };
 *     ActiveEvent.extend(Widget);
 *
 *     var my_widget = new Widget({
 *         afterChange: function(){}
 *     });
 *     //equivelent to:
 *     var my_widget = new Widget();
 *     my_widget.observe('afterChange',function(){});
 **/
var ActiveEvent = null;

if(typeof exports != "undefined"){
    exports.ActiveEvent = ActiveEvent;
}

/** section: ActiveEvent
 * mixin Observable
 * After calling [[ActiveEvent.extend]], the given object will inherit the
 * methods in this namespace. If the given object has a prototype
 * (is a class constructor), the object's prototype will inherit
 * these methods as well.
 **/
(function(){

ActiveEvent = {};

/** section: ActiveEvent
 * ActiveEvent
 * See [ActiveEvent tutorial](../index.html).
 **/

/**
 * ActiveEvent.extend(object) -> Object
 * Mixin [[Observable]] to the given object.
 **/
ActiveEvent.extend = function extend(object){

    object._objectEventSetup = function _objectEventSetup(event_name)
    {
        if(!this._observers)
        {
            this._observers = {};
        }
        if(!(event_name in this._observers))
        {
            this._observers[event_name] = [];
        }
    };

    /**
     * Observable.observe(event_name,observer[,context]) -> Function
     * See ActiveEvent tutorial.
     **/
    object.observe = function observe(event_name,observer,context)
    {
        observer = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(observer,arguments,2);
        if(typeof(event_name) === 'string' && typeof(observer) !== 'undefined')
        {
            this._objectEventSetup(event_name);
            if(!(ActiveSupport.Array.indexOf(this._observers[event_name],observer) > -1))
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
     * Observable.stopObserving([event_name][,observer]) -> null
     * Removes a given observer. If no observer is passed, removes all
     * observers of that event. If no event is passed, removes all
     * observers of the object.
     **/
    object.stopObserving = function stopObserving(event_name,observer)
    {
        this._objectEventSetup(event_name);
        if(event_name && observer)
        {
            this._observers[event_name] = ActiveSupport.Array.without(this._observers[event_name],observer);
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
     * Observable.observeOnce(event_name,observer[,context]) -> Function
     * Works exactly like `observe`, but will `stopObserving` after the first
     * time the event is fired. Note that the observer that is passed in will
     * be wrapped by another function which will be returned. The returned
     * function can then be passed to `stopObserving`
     **/
    object.observeOnce = function observeOnce(event_name,outer_observer,context)
    {
        outer_observer = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(outer_observer,arguments,2);
        var inner_observer = ActiveSupport.Function.bind(function bound_inner_observer(){
            outer_observer.apply(this,arguments);
            this.stopObserving(event_name,inner_observer);
        },this);
        this._objectEventSetup(event_name);
        this._observers[event_name].push(inner_observer);
        return inner_observer;
    };

    /**
     * Observable.notify(event_name[,argument]) -> Array | Boolean
     * Triggers event_name with the passed arguments, accepts a variable number of arguments.
     * Returns an Array of values returned by the registered observers, or false if the event was
     * stopped by an observer.
     **/
    object.notify = function notify(event_name)
    {
        if(!this._observers || !this._observers[event_name] || (this._observers[event_name] && this._observers[event_name].length == 0))
        {
            return [];
        }
        this._objectEventSetup(event_name);
        var collected_return_values = [];
        var args = ActiveSupport.Array.from(arguments).slice(1);
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
        object.prototype._objectEventSetup = object._objectEventSetup;
        object.prototype.observe = object.observe;
        object.prototype.stopObserving = object.stopObserving;
        object.prototype.observeOnce = object.observeOnce;
        object.prototype.notify = function notify_instance(event_name)
        {
            if(
              (!object._observers || !object._observers[event_name] || (object._observers[event_name] && object._observers[event_name].length == 0)) &&
              (!this.options || !this.options[event_name]) &&
              (!this._observers || !this._observers[event_name] || (this._observers[event_name] && this._observers[event_name].length == 0))
            )
            {
                return [];
            }
            var args = ActiveSupport.Array.from(arguments).slice(1);
            var collected_return_values = [];
            if(object.notify)
            {
                object_args = ActiveSupport.Array.from(arguments).slice(1);
                object_args.unshift(this);
                object_args.unshift(event_name);
                var collected_return_values_from_object = object.notify.apply(object,object_args);
                if(collected_return_values_from_object === false)
                {
                    return false;
                }
                collected_return_values = collected_return_values.concat(collected_return_values_from_object);
            }
            this._objectEventSetup(event_name);
            var response;
            if(this.options && this.options[event_name] && typeof(this.options[event_name]) === 'function')
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

/**
 * class ActiveEvent.ObservableHash
 * includes Observable
 * A simple hash implementation that fires notifications on `set`/`unset`.
 *
 * Events
 * ------
 * - set(key,value)
 * - unset(key)
 **/
var ObservableHash = function ObservableHash(object)
{
    this._object = object || {};
};

/**
 * ActiveEvent.ObservableHash#set(key,value[,suppress_notifications = false]) -> mixed
 **/
ObservableHash.prototype.set = function set(key,value,suppress_observers)
{
    var old_value = this._object[key];
    this._object[key] = value;
    if(this._observers && this._observers.set && !suppress_observers)
    {
        this.notify('set',key,value);
    }
    return value;
};

/**
 * ActiveEvent.ObservableHash#get(key) -> mixed
 **/
ObservableHash.prototype.get = function get(key)
{
    return this._object[key];
};

/**
 * ActiveEvent.ObservableHash#unset(key) -> mixed
 **/
ObservableHash.prototype.unset = function unset(key)
{
    if(this._observers && this._observers.unset)
    {
        this.notify('unset',key);
    }
    var value = this._object[key];
    delete this._object[key];
    return value;
};

/**
 * ActiveEvent.ObservableHash#toObject() -> Object
 * Returns a vanilla (non-observable) hash.
 **/
ObservableHash.prototype.toObject = function toObject()
{
    return this._object;
};

ActiveEvent.extend(ObservableHash);

ActiveEvent.ObservableHash = ObservableHash;

})();
var ActiveRoutes = null;

if(typeof exports != "undefined"){
    exports.ActiveRoutes = ActiveRoutes;
}

(function() {

/**
 * == ActiveRoutes ==
 *
 * ActiveRoutes maps urls to method calls and method calls back to urls. This
 * enables back button support and allows methods to be called by normal links
 * (A tags) in your application without adding event handlers or additional code.
 *
 * Calling `setRoutes` will setup ActiveRoutes and call the dispatcher with the
 * current url (if any) as soon as the page is fully loaded. `setRoutes` takes
 * a hash with items in two formats:
 *
 *     - String path: Function anonymous_callback
 *     - String path: Array [Object,Function method_callback]
 *
 * A path string can contain any of the following:
 *
 *     - "/about/contact" A plain path with no parameters.
 *     - "/about/:section" A path with a required named parameter.
 *     - "/about/(:section)" A path with an optional named paramter.
 *     - "/about/*" A path with an asterix / wildcard.
 *
 * Each callback will be called with a hash containing the named parameters
 * specified in the path. A path with a wildcard will contain a "path" parameter.
 *
 *     ActiveRoutes.setRoutes({
 *         '/': [HomeView,'index'],
 *         '/contact/:id': [ContactView,'contact'],
 *         '/about/(:section)': function(params){
 *           if(params.section == 'about'){
 *             ...
 *           }
 *         },
 *         '/wiki/*': function(params){
 *           if(params.path == ''){
 *             ...
 *           }
 *         }
 *     });
 *
 * Url Generation
 * --------------
 * Method callbacks gain a `getUrl` method that is added to the function
 * object. Anonymous callbacks do not gain this method.
 *
 *     ContactView.contact.getUrl({id: 5}) == "/contact/5"
 *
 * Two Way Routing
 * ---------------
 * When method callbacks are called directly the url bar and history will
 * be automatically updated.
 *
 *     ContactView.contact({id:5});
 *     //browser url bar now set to #/contact/5
 *
 * Anonymous callbacks do not support this functionality.
 *
 * Dispatching
 * -----------
 * ActiveRoutes polls for changes in the url, so the user entering a
 * url, clicking a link or clicking the back button will trigger the
 * dispatcher. You can call `dispatch` directly:
 *
 *     ActiveRoutes.dispatch('/contact/5');
 *
 * But any link would also automatically trigger the dispatcher:
 *
 *     <a href="#/contact/5">My Link</a>
 *
 * As well as calling the method directly:
 *
 *     ContactView.contact({id:5});
 *
 * Events
 * ------
 * - ready()
 * - afterDispatch(path,method,params)
 * - externalChange(path): called when the url is changed by the back button or a link is clicked,
 **/

/**
 * ActiveRoutes
 **/
ActiveRoutes = {
    historyManager: {
        initialize: function(){
            SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveRoutes.externalChangeHandler);
        },
        onChange: function(path){
            SWFAddress.setValue(path);
        }
    },
    startObserver: false,
    ready: false,
    routes: [], //array of [path,method]
    routePatterns: [], //array of [regexp,param_name_array]
    currentIndex: 0,
    currentRoute: false,
    history: [],
    paramPattern: '([\\w]+)(/|$)',
    enabled: false,
    /**
     * ActiveRoutes.setRoutes(routes) -> null
     *
     *     ActiveRoutes.setRoutes({
     *         '/': [HomeView,'index'],
     *         '/contact/:id': [ContactView,'contact'],
     *         '/about': function(params){},
     *         '/wiki/*': function(path){}
     *     });
     *     ContactView.contact.getUrl({id: 5}); //"/contact/5"
     **/
    setRoutes: function setRoutes(routes)
    {
        for(var path in routes)
        {
            var route_is_array = routes[path] && typeof(routes[path]) == 'object' && 'length' in routes[path] && 'splice' in routes[path] && 'join' in routes[path];
            if(route_is_array)
            {
                ActiveRoutes.addRoute(path,routes[path][0],routes[path][1]);
            }
            else
            {
                ActiveRoutes.addRoute(path,routes[path]);
            }
        }
        ActiveRoutes.start();
    },
    /**
     * ActiveRoutes.addRoute(path,method) -> null
     * ActiveRoutes.addRoute(path,object,method) -> null
     **/
    addRoute: function addRoute(path)
    {
        if(arguments[2])
        {
            var object = arguments[1];
            var method = arguments[2];
            var original_method = object[method];
            object[method] = function routing_wrapper(params){
                ActiveRoutes.setRoute(ActiveRoutes.generateUrl(path,params));
                original_method.apply(original_method,arguments);
            };
            object[method].getUrl = function url_generator(params){
                return ActiveRoutes.generateUrl(path,params);
            };
            ActiveRoutes.routes.push([path,object[method]]);
        }
        else
        {
            ActiveRoutes.routes.push([path,arguments[1]]);
        }
        ActiveRoutes.routePatterns.push(ActiveRoutes.routeMatcherFromPath(path));
    },
    routeMatcherFromPath: function routeMatcherFromPath(path)
    {
        var params = [];
        var reg_exp_pattern = String(path);
        reg_exp_pattern = reg_exp_pattern.replace(/\((\:?[\w]+)\)/g,function(){
          return '' + arguments[1] + '?'; //regex for optional params "/:one/:two/(:three)"
        });
        reg_exp_pattern = reg_exp_pattern.replace(/\:([\w]+)(\/?)/g,function(){
            params.push(arguments[1]);
            return '(' + ActiveRoutes.paramPattern + ')';
        });
        reg_exp_pattern = reg_exp_pattern.replace(/\)\?\/\(/g,')?('); //cleanup for optional params
        if(reg_exp_pattern.match(/\*/))
        {
            params.push('path');
            reg_exp_pattern = reg_exp_pattern.replace(/\*/g,'((.+$))?');
        }
        return [new RegExp('^' + reg_exp_pattern + '$'),params];
    },
    /**
     * ActiveRoutes.dispatch(path) -> Boolean
     **/
    dispatch: function dispatch(path)
    {
        var match = ActiveRoutes.match(path);
        path = ActiveRoutes.normalizePath(path);
        if(ActiveRoutes.enabled && path != ActiveRoutes.currentRoute && match)
        {
            if(!match[0].getUrl)
            {
                ActiveRoutes.setRoute(path);
            }
            match[0](match[1]);
            this.notify('afterDispatch',path,match[0],match[1]);
            return true;
        }
        else
        {
            return false;
        }
    },
    /**
     * ActiveRoutes.match(path) -> Array | Boolean
     * If a path is matched the response will be array [method,params]
     **/
    match: function match(path)
    {
        for(var i = 0; i < ActiveRoutes.routes.length; ++i)
        {
            if(ActiveRoutes.routes[i][0] == path)
            {
                return [ActiveRoutes.routes[i][1],{}];
            }
        }
        for(var i = 0; i < ActiveRoutes.routePatterns.length; ++i)
        {
            var matches = ActiveRoutes.routePatterns[i][0].exec(path);
            if(matches)
            {
                var params = {};
                for(var ii = 0; ii < ActiveRoutes.routePatterns[i][1].length; ++ii)
                {
                    params[ActiveRoutes.routePatterns[i][1][ii]] = matches[((ii + 1) * 3) - 1];
                }
                return [ActiveRoutes.routes[i][1],params];
            }
        }
        return false;
    },
    generateUrl: function generateUrl(url,params)
    {
        url = url.replace(/(\(|\))/g,'');
        params = params || {};
        if(typeof(params) == 'string' && url.match(/\*/))
        {
            url = url.replace(/\*/,params).replace(/\/\//g,'/');
        }
        else
        {
            var param_matcher = new RegExp('\\:' + ActiveRoutes.paramPattern,'g');
            for(var param_name in params)
            {
                url = url.replace(param_matcher,function(){
                    return arguments[1] == param_name ? params[param_name] + arguments[2] : ':' + arguments[1] + arguments[2];
                });
            }
        }
        return url;
    },
    setRoute: function setRoute(path)
    {
        if(ActiveRoutes.enabled)
        {
            if(ActiveRoutes.currentRoute != path)
            {
                ActiveRoutes.historyManager.onChange(path);
                ActiveRoutes.currentRoute = path;
            }
        }
    },
    /**
     * ActiveRoutes.getCurrentPath() -> String
     **/
    getCurrentPath: function getCurrentPath()
    {
        var path_bits = ActiveSupport.getGlobalContext().location.href.split('#');
        return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
    },
    /**
     * ActiveRoutes.start() -> null
     **/
    start: function start()
    {
        if(!ActiveRoutes.startObserver && !ActiveRoutes.ready)
        {
            ActiveRoutes.startObserver = ActiveSupport.Element.observe(ActiveSupport.getGlobalContext().document,'ready',function document_ready_observer(){
                ActiveRoutes.historyManager.initialize();
                ActiveRoutes.ready = true;
                ActiveRoutes.enabled = true;
                if(ActiveRoutes.notify('ready') !== false)
                {
                    setTimeout(function initial_route_dispatcher(){
                        ActiveRoutes.dispatch(ActiveRoutes.getCurrentPath());
                    });
                }
            });
        }
    },
    externalChangeHandler: function externalChangeHandler()
    {
        if(ActiveRoutes.enabled)
        {
            var current_path = ActiveView.Routing.getCurrentPath();
            if(ActiveRoutes.ready)
            {
                if(current_path != ActiveRoutes.currentRoute)
                {
                    if(ActiveRoutes.notify('externalChange',current_path) !== false)
                    {
                        ActiveRoutes.dispatch(current_path);
                    }
                }
            }
        }
    },
    /**
     * ActiveRoutes.stop() -> null
     **/
    stop: function stop()
    {
        ActiveRoutes.enabled = false;
    },
    /**
     * ActiveRoutes.back() -> null
     **/
    back: function back()
    {
        if(ActiveRoutes.currentIndex == 0)
        {
            return false;
        }
        --ActiveRoutes.currentIndex;
        ActiveRoutes.dispatch(this.history[ActiveRoutes.currentIndex]);
        return true;
    },
    /**
     * ActiveRoutes.forward() -> null
     **/
    forward: function forward()
    {
        if(ActiveRoutes.currentIndex >= ActiveRoutes.history.length - 1)
        {
            return false;
        }
        ++ActiveRoutes.currentIndex;
        ActiveRoutes.dispatch(ActiveRoutes.history[ActiveRoutes.currentIndex]);
        return true;
    },
    /**
     * ActiveRoutes.goTo(index) -> Boolean
     **/
    goTo: function goTo(index)
    {
        return ActiveRoutes.dispatch(ActiveRoutes.history[index]);
    },
    /**
     * ActiveRoutes.getHistory() -> Array
     **/
    getHistory: function getHistory()
    {
        return ActiveRoutes.history;
    }
};
ActiveEvent.extend(ActiveRoutes);

})();
var ActiveView = null;

(function(){

/**
 * == ActiveView ==
 *
 * ActiveView tutorial in progress.
 **/

/** section: ActiveView
 * ActiveView
 **/
ActiveView = {};

/**
 * ActiveView.logging -> Boolean
 **/
ActiveView.logging = false;

/**
 * ActiveView.create(structure[,methods]) -> ActiveView.Class
 * ActiveView.create(parent_class,structure[,methods]) -> ActiveView.Class
 * - structure (Function): This function must return an DOM Element node.
 * - methods (Object): Instance methods for your ActiveView class.
 **/
ActiveView.create = function create(structure,methods)
{
    var parent_class;
    if(ActiveView.isActiveViewClass(structure))
    {
        parent_class = structure;
        structure = arguments[1];
        methods = arguments[2];
    }
    var klass = function klass(scope){
        this.setupScope(scope);
        this.initialize.apply(this,arguments);
        this.notify('initialized');
        if(klass._observers && 'attached' in klass._observers)
        {
             ActiveView.triggerOrDelayAttachedEventOnInstance(this);
        }
    };
    klass.instance = false;
    ActiveSupport.Object.extend(klass,ClassMethods);
    if(parent_class)
    {
        ActiveSupport.Object.extend(klass.prototype,parent_class.prototype);
        klass.prototype.structure = ActiveSupport.Function.wrap(parent_class.prototype.structure,function(proceed,builder,dom){
          return ActiveSupport.Function.bind(structure,this)(ActiveSupport.Function.bind(proceed,this)(builder,dom),builder,dom);
        });
    }
    else
    {
        ActiveSupport.Object.extend(klass.prototype,InstanceMethods);
        klass.prototype.structure = structure;
    }
    ActiveEvent.extend(klass);
    klass.prototype.observe = ActiveSupport.Function.wrap(klass.prototype.observe,ActiveView.observeWrapperForAttachedEventOnInstance);
    if(parent_class)
    {
        klass._observers = ActiveSupport.Object.clone(parent_class._observers);
        klass.prototype._observers = {};
        ActiveView.wrapActiveEventMethodsForChildClass(klass,parent_class);
    }
    ActiveSupport.Object.extend(klass.prototype,methods || {});
    return klass;
};

ActiveView.wrapActiveEventMethodsForChildClass = function wrapActiveEventMethodsForChildClass(child_class,parent_class)
{
    var methods = ['observe','stopObserving','observeOnce'];
    for(var i = 0; i < methods.length; ++i)
    {
        (function method_wrapper_iterator(method_name){
            parent_class[method_name] = ActiveSupport.Function.wrap(parent_class[method_name],function method_wrapper(proceed){
                var arguments_array = ActiveSupport.Array.from(arguments).slice(1);
                child_class[method_name].apply(child_class,arguments_array);
                return proceed.apply(proceed,arguments_array);
            });
        })(methods[i]);
    }
};

//fires the "attached" event when the instance's element is attached to the dom
ActiveView.observeWrapperForAttachedEventOnInstance = function observeWrapperForAttachedEventOnInstance(proceed,event_name)
{
    var arguments_array = ActiveSupport.Array.from(arguments).slice(1);
    var response = proceed.apply(proceed,arguments_array);
    if(event_name == 'attached')
    {
        ActiveView.triggerOrDelayAttachedEventOnInstance(this);
    }
    return response;
};

ActiveView.nodeInDomTree = function nodeInDomTree(node)
{
    var ancestor = node;
    while(ancestor.parentNode)
    {
        ancestor = ancestor.parentNode;
    }
    return !!(ancestor.body);
};

ActiveView.triggerOrDelayAttachedEventOnInstance = function triggerOrDelayAttachedEventOnInstance(instance){
    if(!instance._attachedEventFired && instance.element && ActiveView.nodeInDomTree(instance.element))
    {
        instance.notify('attached');
        instance._attachedEventFired = true;
        if(instance._attachedEventInterval)
        {
            clearInterval(instance._attachedEventInterval);
        }
    }
    else if(!('_attachedEventInterval' in instance))
    {
        instance._attachedEventInterval = setInterval(function(){
            if(instance.element && ActiveView.nodeInDomTree(instance.element))
            {
                instance.notify('attached');
                instance._attachedEventFired = true;
                clearInterval(instance._attachedEventInterval);
                instance._attachedEventInterval = false;
            }
        },10);
    }
};

/**
 * class ActiveView.Class
 * includes Observable
 * ActiveView.Class refers to any class created with [[ActiveView.create]].
 *
 * Events
 * ------
 * - initialized()
 * - attached(): Called when the instance's `element` object is attached to the DOM tree.
 **/
ActiveView.isActiveViewInstance = function isActiveViewInstance(object)
{
    return object && object.getElement && object.getElement().nodeType == 1 && object.scope;
};

ActiveView.isActiveViewClass = function isActiveViewClass(object)
{
    return object && object.prototype && object.prototype.structure && object.prototype.setupScope;
};

var InstanceMethods = (function(){
    return {
        initialize: function initialize(scope)
        {
            if(ActiveView.logging)
            {
                ActiveSupport.log('ActiveView: initialized ',this,' with scope:',scope);
            }
            var response = this.structure(ActiveView.Builder,ActiveSupport.Element);
            if(response && !this.element)
            {
                this.setElement(response);
            }
            if(!this.element || !this.element.nodeType || this.element.nodeType !== 1)
            {
                throw Errors.ViewDoesNotReturnelement.getErrorString(typeof(this.element));
            }
            for(var key in this.scope._object)
            {
                this.scope.set(key,this.scope._object[key]);
            }
            this.notify('initialized');
        },
        setupScope: function setupScope(scope)
        {
            this.scope = (scope ? (scope.toObject ? scope : new ActiveEvent.ObservableHash(scope)) : new ActiveEvent.ObservableHash({}));
            for(var key in this.scope._object)
            {
                var item = this.scope._object[key];
            }
        },
        /**
         * ActiveView.Class#get(key) -> mixed
         **/
        get: function get(key)
        {
            return this.scope.get(key);
        },
        /**
         * ActiveView.Class#set(key,value[,suppress_notifications]) -> mixed
         **/
        set: function set(key,value,suppress_observers)
        {
            return this.scope.set(key,value,suppress_observers);
        },
        /**
         * ActiveView.Class#attachTo(element) -> Element
         * Inserts the view's outer most element into the passed element.
         **/
        attachTo: function attachTo(element)
        {
            element.appendChild(this.getElement());
            return this.element;
        },
        setElement: function setElement(element)
        {
            this.element = element;
        },
        /**
         * ActiveView.Class#getElement() -> Element
         **/
        getElement: function getElement()
        {
            return this.element;
        },
        /**
         * ActiveView.Class#getScope() -> ActiveEvent.ObservableHash
         * Get's the current scope/data in your view. Note that modifying this
         * object may trigger changes in the view. Use `exportScope` to get copy
         * of the data that is safe to mutate.
         **/
        getScope: function getScope()
        {
            return this.scope;
        },
        /**
         * ActiveView.Class#exportScope() -> Object
         * Gets a vanilla hash of the scope/data in your view.
         **/
        exportScope: function exportScope()
        {
            return ActiveSupport.Object.clone(this.scope.toObject());
        }
    };
})();

var ClassMethods = (function(){
    return {
        /**
         * ActiveView.Class.getInstance([params]) -> Object
         * Returns an instance of the ActiveView.Class, initializing it
         * if necessary.
         **/
        getInstance: function getInstance(params)
        {
            if(!this.instance)
            {
                this.instance = new this(params || {});
            }
            return this.instance;
        }
    };
})();

var Errors = {
    ViewDoesNotReturnelement: ActiveSupport.createError('The view constructor must return a DOM element, or set this.element as a DOM element. View constructor returned: %'),
    InvalidContent: ActiveSupport.createError('The content to render was not a string, DOM element or ActiveView.'),
    MismatchedArguments: ActiveSupport.createError('Incorrect argument type passed: Expected %. Recieved %:%')
};
/**
 * ActiveView.Builder
 * See the [[ActiveView]] or [[ActiveView.Builder.tag]] for usage.
 *
 * Contains the following DOM Element generator methods:
 * - abbr
 * - acronym
 * - address
 * - applet
 * - area
 * - b
 * - base
 * - basefont
 * - bdo
 * - big
 * - blockquote
 * - body
 * - br
 * - button
 * - canvas
 * - caption
 * - center
 * - cite
 * - code
 * - col
 * - colgroup
 * - dd
 * - del
 * - dfn
 * - dir
 * - div
 * - dl
 * - dt
 * - em
 * - embed
 * - fieldset
 * - font
 * - form
 * - frame
 * - frameset
 * - h1
 * - h2
 * - h3
 * - h4
 * - h5
 * - h6
 * - head
 * - hr
 * - html
 * - i
 * - iframe
 * - img
 * - input
 * - ins
 * - isindex
 * - kbd
 * - label
 * - legend
 * - li
 * - link
 * - map
 * - menu
 * - meta
 * - nobr
 * - noframes
 * - noscript
 * - object
 * - ol
 * - optgroup
 * - option
 * - p
 * - param
 * - pre
 * - q
 * - s
 * - samp
 * - script
 * - select
 * - small
 * - span
 * - strike
 * - strong
 * - style
 * - sub
 * - sup
 * - table
 * - tbody
 * - td
 * - textarea
 * - tfoot
 * - th
 * - thead
 * - title
 * - tr
 * - tt
 * - u
 * - ul
 * - var
 **/
var Builder = {
    tags: ('A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY ' +
        'BR BUTTON CANVAS CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM EMBED FIELDSET ' +
        'FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX '+
        'KBD LABEL LEGEND LI LINK MAP MENU META NOBR NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P '+
        'PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD '+
        'TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR').split(/\s+/),
    processNodeArgument: function processNodeArgument(elements,attributes,argument)
    {
        if(typeof(argument) === 'undefined' || argument === null || argument === false)
        {
            return;
        }
        if(typeof(argument) === 'function' && !ActiveView.isActiveViewClass(argument))
        {
            argument = argument();
        }
        if(ActiveView.isActiveViewInstance(argument) || typeof(argument.getElement) == 'function')
        {
            elements.push(argument.getElement());
        }
        else if(ActiveView.isActiveViewClass(argument))
        {
            elements.push(new argument().getElement());
        }
        else if(typeof(argument) !== 'string' && typeof(argument) !== 'number' && !(argument !== null && typeof argument === "object" && 'splice' in argument && 'join' in argument) && !(argument && argument.nodeType === 1))
        {
            for(attribute_name in argument)
            {
                attributes[attribute_name] = argument[attribute_name];
            }
        }
        else if(argument !== null && typeof argument === "object" && 'splice' in argument && 'join' in argument)
        {
            for(ii = 0; ii < argument.length; ++ii)
            {
                Builder.processNodeArgument(elements,attributes,argument[ii]);
            }
        }
        else if((argument && argument.nodeType === 1) || typeof(argument) === 'string' || typeof(argument) === 'number')
        {
            elements.push(argument);
        }
    },
    /**
     * ActiveView.Builder.tag([content][,attributes][,child_nodes]) -> Element
     * - content (String | Number | Function): The content to be inserted in the node.
     * - attributes (Object): Hash of HTML attributes, must use "className" instead of "class".
     * - child_nodes (Array | Element | Function): May be an array of child nodes, a callback function or an Element
     *
     * **This method refers to tag methods, "br", "li", etc not a method named "tag".**
     *
     *  tag() methods accept a variable number of arguments. You can pass multiple
     *  `content` arguments, `attributes` hashes or child nodes (as an array or single
     *  elements) in any order.
     *
     *     builder.ul(builder.li('a'),builder.li('b'),{className:'my_list'});
     *     builder.ul({className:'my_list'},[builder.li('a'),builder.li('b')]);
     *
     * Functions that are passed in will be called, and the response treated as
     * an argument, this could be one of the tag methods:
     *
     *     builder.p('First line',builder.br,'Second Line')
     *
     * it could also be a class method, or an inline function:
     *
     *     builder.p('First line',my_view_method,'Second Line')
     **/
    generator: function generator(target,scope)
    {
        var global_context = ActiveSupport.getGlobalContext();
        for(var t = 0; t < Builder.tags.length; ++t)
        {
            var tag = Builder.tags[t];
            (function tag_iterator(tag){
                target[tag.toLowerCase()] = target[tag] = function node_generator(){
                    var i, ii, argument, attributes, attribute_name, elements, element;
                    elements = [];
                    attributes = {};
                    for(i = 0; i < arguments.length; ++i)
                    {
                        Builder.processNodeArgument(elements,attributes,arguments[i]);
                    }
                    element = ActiveSupport.Element.create(tag,attributes);
                    for(i = 0; i < elements.length; ++i)
                    {
                        if(elements[i] && elements[i].nodeType === 1)
                        {
                            element.appendChild(elements[i]);
                        }
                        else
                        {
                            element.appendChild(global_context.document.createTextNode(String(elements[i])));
                        }
                    }
                    return element;
                };
            })(tag);
        }
    }
};

ActiveView.Builder = {};
Builder.generator(ActiveView.Builder);
/**
 * ActiveView.Routing
 * fires ready
 * Enables history / back button support in ActiveView. See the ActiveView tutorial for examples.
 *
 * Events
 * ------
 * - ready()
 * - external_change(current_path): Called when a url (link) or back/forward button triggers a route.
 **/
ActiveView.Routing = {
    routes: false,
    enabled: true,
    ready: false,
    lastDispatchLocation: false,
    startObserver: false,
    start: function start()
    {
        if(!ActiveView.Routing.startObserver && !ActiveView.Routing.ready)
        {
            ActiveView.Routing.startObserver = ActiveSupport.Element.observe(ActiveSupport.getGlobalContext().document,'ready',function document_ready_observer(){
                ActiveView.Routing.ready = true;
                if(ActiveView.Routing.notify('ready') !== false)
                {
                    setTimeout(function initial_route_dispatcher(){
                        ActiveView.Routing.routes.dispatch(ActiveView.Routing.getCurrentPath());
                    });
                }
            });
        }
    },
    /**
     * ActiveView.Routing.enable() -> null
     * Calling [[ActiveView.Routing.setRoutes]] will automatically call `enable`.
     **/
    enable: function enable()
    {
        ActiveView.Routing.enabled = true;
        ActiveView.Routing.start();
    },
    /**
     * ActiveView.Routing.disable() -> null
     **/
    disable: function disable()
    {
        ActiveView.Routing.enabled = false;
    },
    getCurrentPath: function getCurrentPath()
    {
        var path_bits = ActiveSupport.getGlobalContext().location.href.split('#');
        return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
    },
    afterDispatchHandler: function afterDispatchHandler(route,path)
    {
        if(ActiveView.Routing.enabled)
        {
            SWFAddress.setValue(path);
            ActiveView.Routing.lastDispatchLocation = path;
        }
    },
    externalChangeHandler: function externalChangeHandler()
    {
        if(ActiveView.Routing.enabled)
        {
            var current_path = ActiveView.Routing.getCurrentPath();
            if(ActiveView.Routing.ready)
            {
                if(current_path != ActiveView.Routing.lastDispatchLocation)
                {
                    ActiveView.Routing.notify('external_change',current_path);
                    ActiveView.Routing.routes.dispatch(current_path);
                }
            }
        }
    },
    generateRouteArray: function generateRouteArray(view_class,route_name,path,method_name)
    {
        return [route_name,path,{
            object: 'Routing',
            method: route_name
        }];
    },
    generateRoutingWrapperMethod: function generateRoutingWrapperMethod(view_class,route_name,method_name)
    {
        ActiveView.Routing[route_name] = function generated_routing_wrapper(params){
            return view_class[method_name](params);
        };
    },
    initializeRoutes: function initializeRoutes()
    {
        ActiveView.Routing.routes = new ActiveRoutes([],ActiveView);
        ActiveView.Routing.routes.observe('afterDispatch',ActiveView.Routing.afterDispatchHandler);
        SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveView.Routing.externalChangeHandler);
    },
    addRoute: function addRoute(view_class,route_name,path,method_name)
    {
        ActiveView.Routing.generateRoutingWrapperMethod(view_class,route_name,method_name);
        ActiveView.Routing.routes.addRoute.apply(ActiveView.Routing.routes,ActiveView.Routing.generateRouteArray(view_class,route_name,path,method_name));
    },
    generateRoutingMethod: function generateRoutingMethod(view_class,route_name,method_name)
    {
        view_class.getInstance()[method_name] = ActiveSupport.Function.wrap(view_class.getInstance()[method_name],function wrapped_generated_routing_handler(proceed,params){
            ActiveView.Routing.setRoute(view_class,route_name,params,method_name);
            proceed(params);
        });
        view_class[method_name] = function generated_routing_handler(params){
            view_class.getInstance()[method_name](params);
        };
    },
    setRoute: function setRoute(view,route_name,params,method_name)
    {
        var route = false;
        for(var i = 0; i < ActiveView.Routing.routes.routes.length; ++i)
        {
            if(ActiveView.Routing.routes.routes[i].name == route_name)
            {
                route = ActiveView.Routing.routes.routes[i];
                break;
            }
        }
        params.method = route_name;
        params.object = 'Routing';
        var final_route = ActiveSupport.Object.clone(route);
        //need to deep copy the params
        final_route.params = ActiveSupport.Object.clone(route.params);
        ActiveSupport.Object.extend(final_route.params,params || {});
        //dispatch the route, but suppress the actual dispatcher
        ActiveView.Routing.routes.dispatch(final_route,true);
    },
    /**
     * ActiveView.Routing.setRoutes(routes) -> null
     * - routes (Object)
     * See the ActiveView tutorial for a full explanation of routing.
     *
     *     ActiveView.Routing.setRoutes({
     *         home: ['/',BlogView,'index'],
     *         articles: ['/articles/',ArticlesView,'index'],
     *         article: ['/articles/:id',ArticlesView,'article']
     *     });
     **/
    setRoutes: function setRoutes(routes)
    {
        if(!ActiveView.Routing.routes)
        {
            ActiveView.Routing.initializeRoutes();
        }
        for(var route_name in routes)
        {
            var view_class = routes[route_name][1];
            var method_name = routes[route_name][2] || route_name;
            var path = routes[route_name][0];
            ActiveView.Routing.generateRoutingMethod(view_class,route_name,method_name);
            ActiveView.Routing.addRoute(view_class,route_name,path,method_name);
        }
        ActiveView.Routing.enable();
    }
};
ActiveEvent.extend(ActiveView.Routing);

})();
var ActiveRecord = null;

if(typeof exports != "undefined"){
    exports.ActiveRecord = ActiveRecord;
}

(function() {

/**
 * == ActiveRecord ==
 *
 * ActiveRecord tutorial in progress.
 *
 * Events
 * ------
 * - ready
 **/

/** section: ActiveRecord
 * ActiveRecord
 **/
ActiveRecord = {
    /**
     * ActiveRecord.logging -> Boolean
     * Defaults to false.
     **/
    logging: false,
    /**
     * ActiveRecord.Models -> Object
     * Contains model_name, ActiveRecord.Class pairs.
     **/
    Models: {},
    /**
     * ActiveRecord.ClassMethods -> Object
     * Contains all methods that will become available to ActiveRecord classes.
     **/
    ClassMethods: {},
    /**
     * ActiveRecord.InstanceMethods -> Object
     * Contains all methods that will become available to ActiveRecord instances.
     **/
    InstanceMethods: {},
    /**
     * ActiveRecord.create(table_name[,fields][,instance_methods]) -> ActiveRecord.Model
     * ActiveRecord.create(options[,fields][,instance_methods]) -> ActiveRecord.Model
     * Creates an ActiveRecord class, returning the class and storing it inside
     * ActiveRecord.Models[model_name]. model_name is a singularized,
     * capitalized form of table name.
     *
     *     var User = ActiveRecord.create('users',{
     *         id: 0,
     *         name: ''
     *     });
     *     var u = User.find(5);
     *
     * The fields hash should consist of column name, default value pairs. If an empty
     * array or empty object is set as the default, any arbitrary data
     * can be set and will automatically be serialized when saved. To
     * specify a specific type, set the value to an object that contains
     * a "type" key, with optional "length" and "value" keys.
     **/
    create: function create(options, fields, methods)
    {
        if(typeof(options) === 'string')
        {
            options = {
                tableName: options
            };
        }

        //determine proper model name
        var model = null;
        if(!options.modelName)
        {
            var model_name = ActiveSupport.String.camelize(ActiveSupport.String.singularize(options.tableName) || options.tableName);
            options.modelName = model_name.charAt(0).toUpperCase() + model_name.substring(1);
        }

        //constructor
        model = ActiveRecord.Models[options.modelName] = function initialize(data)
        {
            if(!ActiveRecord.connection)
            {
                throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
            }

            this._object = {};
            for(var key in data)
            {
                //third param is to suppress notifications on set
                this.set(key,data[key],true);
            }
            this._errors = [];
            var fields = this.constructor.fields;
            for(var key in fields)
            {
                var field = fields[key];
                if(!field.primaryKey)
                {
                    var value = ActiveRecord.connection.fieldOut(key,field,this.get(key));
                    if(Adapters.objectIsFieldDefinition(value))
                    {
                        value = value.value;
                    }
                    //don't supress notifications on set since these are the processed values
                    this.set(key,value);
                }
            }
            this._id = this.get(this.constructor.primaryKeyName);
            //performance optimization if no observers
            this.notify('afterInitialize', data);
        };
        /**
         * ActiveRecord.Model.modelName -> String
         **/
        model.modelName = options.modelName;
        /**
         * ActiveRecord.Model.tableName -> String
         **/
        model.tableName = options.tableName;
        /**
         * ActiveRecord.Model.primaryKeyName -> String
         **/
        model.primaryKeyName = 'id';

        //mixin instance methods
        ActiveSupport.Object.extend(model.prototype, ActiveRecord.InstanceMethods);

        //user defined methods take precedence
        if(typeof(methods) == 'undefined')
        {
            //detect if the fields object is actually a methods object
            for(var method_name in fields)
            {
                if(typeof(fields[method_name]) == 'function')
                {
                    methods = fields;
                    fields = null;
                }
                break;
            }
        }
        if(methods && typeof(methods) !== 'function')
        {
            ActiveSupport.Object.extend(model.prototype, methods);
        }

        //mixin class methods
        ActiveSupport.Object.extend(model, ActiveRecord.ClassMethods);

        //add lifecycle abilities
        ActiveEvent.extend(model);

        //clean and set field definition
        if(!fields)
        {
            fields = {};
        }
        var custom_primary_key = false;
        for(var field_name in fields)
        {
            if(typeof(fields[field_name]) === 'object' && fields[field_name].type && !('value' in fields[field_name]))
            {
                fields[field_name].value = null;
            }
            if(typeof(fields[field_name]) === 'object' && fields[field_name].primaryKey)
            {
                custom_primary_key = field_name;
            }
        }
        if(!custom_primary_key)
        {
            fields['id'] = {
                primaryKey: true
            };
        }
        model.fields = fields;
        if(custom_primary_key)
        {
            model.primaryKeyName = custom_primary_key;
        }

        ActiveSupport.Object.extend(model.prototype, {
            modelName: model.modelName,
            tableName: model.tableName,
            primaryKeyName: model.primaryKeyName
        });

        //generate finders
        for(var key in model.fields)
        {
            Finders.generateFindByField(model,key);
            Finders.generateFindAllByField(model,key);
        }

        //setup relationship meta data container
        model.relationships = [];

        return model;
    }
};

/**
 * class ActiveRecord.Model
 * includes Observable
 * All classes created with [[ActiveRecord.create]] will contain these class and instance methods.
 * Models may also contain dynamically generated finder and relationship methods that are not
 * listed in the API documentation.
 **/
ActiveEvent.extend(ActiveRecord);

ActiveRecord.eventNames = [
    'afterInitialize',
    'afterFind',
    'beforeSave',
    'afterSave',
    'beforeCreate',
    'afterCreate',
    'beforeDestroy',
    'afterDestroy'
];

//add lifecycle method names to classes and models (model_instance.beforeDestory() model_class.beforeDestroy())
(function(){
    for (var i = 0; i < ActiveRecord.eventNames.length; ++i)
    {
        ActiveRecord.ClassMethods[ActiveRecord.eventNames[i]] = ActiveRecord.InstanceMethods[ActiveRecord.eventNames[i]] = ActiveSupport.Function.curry(function event_name_delegator(event_name, observer){
            return this.observe(event_name, observer);
        },ActiveRecord.eventNames[i]);
    }
})();

/**
 * ActiveRecord.observe(event_name,callback) -> Array
 * Observe an event on all models. observer will be called with model_class, model_instance.
 *
 *     ActiveRecord.observe('afterDestroy',function(model,instance){});
 **/
ActiveRecord.old_observe = ActiveRecord.observe;
ActiveRecord.observe = function observe(event_name,observer)
{
    for(var i = 0; i < ActiveRecord.eventNames.length; ++i)
    {
        if(ActiveRecord.eventNames[i] === event_name)
        {
            var observers = [];
            var model_observer;
            for(var model_name in ActiveRecord.Models)
            {
                model_observer = ActiveSupport.Function.curry(observer,ActiveRecord.Models[model_name]);
                observers.push(model_observer);
                ActiveRecord.Models[model_name].observe(event_name,model_observer);
            }
            return observers;
        }
    }
    return ActiveRecord.old_observe(event_name,observer);
};

//add lifecycle method names to ActiveRecord (ActiveRecord.beforeDestory)
(function(){
    for (var i = 0; i < ActiveRecord.eventNames.length; ++i)
    {
        ActiveRecord[ActiveRecord.eventNames[i]] = ActiveSupport.Function.curry(function event_name_delegator(event_name, observer){
            ActiveRecord.observe(event_name, observer);
        },ActiveRecord.eventNames[i]);
    }
})();
var Errors = {
    ConnectionNotEstablished: ActiveSupport.createError('No ActiveRecord connection is active.'),
    MethodDoesNotExist: ActiveSupport.createError('The requested method does not exist. %'),
    InvalidFieldType: ActiveSupport.createError('The field type does not exist: %')
};

ActiveRecord.Errors = Errors;
ActiveSupport.Object.extend(ActiveRecord.InstanceMethods,{
    /**
     * ActiveRecord.Model#set(key,value[,suppress_notifications = false]) -> null
     * Sets a given key on the object. You must use this method to set a property, properties assigned directly (instance.key_name = value) will not persist to the database and may cause errors.
     **/
    set: function set(key, value, suppress_notifications)
    {
        if (typeof(this[key]) !== "function")
        {
            this[key] = value;
        }
        this._object[key] = value;
        if(!suppress_notifications)
        {
            if(this._observers && ('set' in this._observers))
            {
                this.notify('set',key,value);
            }
        }
    },
    /**
     * ActiveRecord.Model#get(key) -> mixed
     * Get a given key on the object. If your field name is a reserved word, or the name of a method (save, updateAttribute, etc) you must use the get() method to access the property. For convenience non reserved words (title, user_id, etc) can be accessed directly (instance.key_name)
     **/
    get: function get(key)
    {
        return this._object[key];
    },
    /**
     * ActiveRecord.Model#toObject([transform_callback]) -> Object
     * Returns a vanilla version of the object, with just the data and no methods.
     * - transform_callback (Function) Will recieve and should reutrn a hash of attributes.
     **/
    toObject: function toObject(callback)
    {
        var response = ActiveSupport.Object.clone(this._object);
        if(callback)
        {
            response = callback(response);
        }
        return response;
    },
    /**
     * ActiveRecord.Model#keys() -> Array
     * Returns an array of the column names that the instance contains.
     **/
    keys: function keys()
    {
        var keys_array = [];
        for(var key_name in this._object)
        {
            keys_array.push(key_name);
        }
        return keys_array;
    },
    /**
     * ActiveRecord.Model#values() -> Array
     * Returns an array of the column values that the instance contains.
     **/
    values: function values()
    {
        var values_array = [];
        for(var key_name in this._object)
        {
            values_array.push(this._object[key_name]);
        }
        return values_array;
    },
    /**
     * ActiveRecord.Model#updateAttribute(key,value) -> Boolean
     * Sets a given key on the object and immediately persists that change to the database triggering any callbacks or validation .
     **/
    updateAttribute: function updateAttribute(key, value)
    {
        this.set(key, value);
        return this.save();
    },
    /**
     * ActiveRecord.Model#updateAttributes(attributes) -> Boolean
     * Updates all of the passed attributes on the record and then calls save().
     **/
    updateAttributes: function updateAttributes(attributes)
    {
        for(var key in attributes)
        {
            this.set(key, attributes[key]);
        }
        return this.save();
    },
    /**
     * ActiveRecord.Model#reload() -> Boolean
     * Loads the most current data for the object from the database.
     **/
    reload: function reload()
    {
        if (this._id === undefined)
        {
            return false;
        }
        var record = this.constructor.find(this._id);
        if (!record)
        {
            return false;
        }
        this._object = {};
        var raw = record.toObject();
        for (var key in raw)
        {
            this.set(key,raw[key]);
        }
        return true;
    },
    /**
     * ActiveRecord.Model#save([force_created_mode = false]) -> Boolean
     * - force_created_mode (Boolean): Defaults to false, will force the record to act as if it was created even if an id property was passed.
     * Persists the object, creating or updating as nessecary.
     **/
    save: function save(force_created_mode)
    {
        this._validate();
        if (!this.isValid())
        {
            return false;
        }
        //apply field in conversions
        for (var key in this.constructor.fields)
        {
            if(!this.constructor.fields[key].primaryKey)
            {
                //third param is to suppress observers
                this.set(key,ActiveRecord.connection.fieldIn(key,this.constructor.fields[key],this.get(key)),true);
            }
        }
        if (this.notify('beforeSave') === false)
        {
            return false;
        }
        if ('updated' in this._object)
        {
            this.set('updated',ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss'));
        }
        if (force_created_mode || this._id === undefined)
        {
            if (this.notify('beforeCreate') === false)
            {
                return false;
            }
            if ('created' in this._object)
            {
                this.set('created',ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss'));
            }
            ActiveRecord.connection.insertEntity(this.tableName, this.constructor.primaryKeyName, this.toObject());
            if(!this.get(this.constructor.primaryKeyName))
            {
                this.set(this.constructor.primaryKeyName, ActiveRecord.connection.getLastInsertedRowId());
            }
            this.notify('afterCreate');
        }
        else
        {
            if(this.notify('beforeUpdate') === false)
            {
                return false;
            }
            ActiveRecord.connection.updateEntity(this.tableName, this.constructor.primaryKeyName, this._id, this.toObject());
            //afterUpdate is not a synchronization event, afterSave covers all cases
            this.notify('afterUpdate');
        }
        //apply field out conversions
        for (var key in this.constructor.fields)
        {
            if(!this.constructor.fields[key].primaryKey)
            {
                //third param is to suppress observers
                this.set(key,ActiveRecord.connection.fieldOut(key,this.constructor.fields[key],this.get(key)),true);
            }
        }
        this._id = this.get(this.constructor.primaryKeyName);
        this.notify('afterSave');
        return this;
    },
    /**
     * ActiveRecord.Model#destroy() -> Boolean
     * Removes the object from the database, but does not destroy the object in memory itself.
     **/
    destroy: function destroy()
    {
        if (this._id === undefined)
        {
            return false;
        }
        if (this.notify('beforeDestroy') === false)
        {
            return false;
        }
        var response = ActiveRecord.connection.deleteEntity(this.tableName,this.constructor.primaryKeyName,this._id);
        if (this.notify('afterDestroy') === false)
        {
            return false;
        }
        return true;
    },
    /**
     * ActiveRecord.Model#toSerializableObject([transform_callback]) -> Object
     * toJSON will call this instead of toObject() to get the
     * data they will serialize. By default this calls toObject(), but
     * you can override this method to easily create custom JSON output.
     * - transform_callback (Function): Will recieve and should reutrn a hash of attributes.
     **/
    toSerializableObject: function toSerializableObject(callback)
    {
        return this.toObject(callback);
    },
    /**
     * ActiveRecord.Model#toJSON([object_to_inject]) -> String
     * Serializes the record to an JSON string. If object_to_inject is passed
     * that object will override any values of the record.
     **/
    toJSON: function toJSON(object_to_inject)
    {
        return ActiveSupport.JSON.stringify(ActiveSupport.Object.extend(this.toSerializableObject(),object_to_inject || {}));
    }
});
ActiveSupport.Object.extend(ActiveRecord.ClassMethods,{
    /**
     * ActiveRecord.Model.find(id) -> Boolean | Object
     * ActiveRecord.Model.find(array_of_ids) -> Array
     * ActiveRecord.Model.find(params) -> Array
     * ActiveRecord.Model.find(sql_statement) -> Array
     *
     * Find a given record, or multiple records matching the passed conditions. Params may contain:
     *
     * - select (Array) of columns to select, default ['*']
     * - where (String | Object | Array)
     * - joins (String)
     * - order (String)
     * - limit (Number)
     * - offset (Number)
     * - callback (Function)
     *
     *     //finding single records
     *     var user = User.find(5);
     *     var user = User.find({
     *         first: true,
     *         where: {
     *             id: 5
     *         }
     *     });
     *     var user = User.find({
     *         first: true,
     *         where: ['id = ?',5]
     *     });
     *
     *     //finding multiple records
     *     var users = User.find(); //finds all
     *     var users = User.find(1,2,3); //finds ids 1,2,3
     *     var users = User.find([1,2,3]); // finds ids 1,2,3
     *
     *     //finding multiple records with complex where statements
     *     var users = User.find({
     *         where: 'name = "alice" AND password = "' + md5('pass') + '"',
     *         order: 'id DESC'
     *     });
     *
     *     var users = User.find({
     *         where: ['name = ? AND password = ?','alice',md5('pass')],
     *         order: 'id DESC'
     *     });
     *
     *     //using the where syntax below, the parameters will be properly escaped
     *     var users = User.find({
     *         where: {
     *             name: 'alice',
     *             password: md5('pass')
     *         }
     *         order: 'id DESC'
     *     });
     *
     *     //find using a complete SQL statement
     *     var users = User.find('SELECT * FROM users ORDER id DESC');
     *
     *     //find using a callback, "user" in this case only contains a hash
     *     //of the user attributes, it is not an ActiveRecord instance
     *     var users = User.find({
     *         callback: function(user){
     *              return user.name.toLowerCase() == 'a';
     *         }
     *     });
     **/
    find: function find(params)
    {
        if(!ActiveRecord.connection)
        {
            throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
        }
        if(params === 0)
        {
            return false;
        }
        var result;
        if (!params)
        {
            params = {};
        }
        if ((params.first && typeof params.first === "boolean") || ((typeof(params) === "number" || (typeof(params) === "string" && params.match(/^\d+$/))) && arguments.length == 1))
        {
            if (params.first)
            {
                //find first
                params.limit = 1;
                result = ActiveRecord.connection.findEntities(this.tableName,params);
            }
            else
            {
                //single id
                var data = ActiveRecord.connection.findEntityById(this.tableName,this.primaryKeyName,params);
                if(data)
                {
                    return this.build(data);
                }
                else
                {
                    return false;
                }

            }
            if (result && result.iterate && result.iterate(0))
            {
                return this.build(result.iterate(0));
            }
            else
            {
                return false;
            }
        }
        else
        {
            result = null;
            if (typeof(params) === 'string' && !params.match(/^\d+$/))
            {
                //find by sql
                result = ActiveRecord.connection.findEntities.apply(ActiveRecord.connection,arguments);
            }
            else if (params && ((typeof(params) == 'object' && 'length' in params && 'slice' in params) || ((typeof(params) == 'number' || typeof(params) == 'string') && arguments.length > 1)))
            {
                //find by multiple ids
                var ids = ((typeof(params) == 'number' || typeof(params) == 'string') && arguments.length > 1) ? ActiveSupport.Array.from(arguments) : params;
                result = ActiveRecord.connection.findEntitiesById(this.tableName,this.primaryKeyName,ids);
            }
            else
            {
                //result find
                result = ActiveRecord.connection.findEntities(this.tableName,params);
            }
            var response = [];
            if (result)
            {
                result.iterate(function result_iterator(row){
                    response.push(this.build(row));
                },this);
            }
            this.resultSetFromArray(response,params);
            this.notify('afterFind',response,params);
            return response;
        }
    },
    /**
     * ActiveRecord.Model.destroy(id) -> Boolean | String
     * Deletes a given id (if it exists) calling any callbacks or validations
     * on the record. If "all" is passed as the ids, all records will be found
     * and destroyed.
     **/
    destroy: function destroy(id)
    {
        if(id == 'all')
        {
            var instances = this.find({
                all: true
            });
            var responses = [];
            for(var i = 0; i < instances.length; ++i)
            {
                responses.push(instances[i].destroy());
            }
            return responses;
        }
        else if(ActiveSupport.Object.isArray(id))
        {
            var responses = [];
            for(var i = 0; i < id.length; ++i)
            {
                var instance = this.find(id[i]);
                if(!instance)
                {
                    responses.push(false);
                }
                else
                {
                    responses.push(instance.destroy());
                }
            }
            return responses;
        }
        else
        {
            var instance = this.find(id);
            if(!instance)
            {
                return false;
            }
            return instance.destroy();
        }
    },
    /**
     * ActiveRecord.Model.build(attributes) -> Object
     * Identical to calling create(), but does not save the record.
     **/
    build: function build(data)
    {
        if(ActiveSupport.Object.isArray(data))
        {
            var records = [];
            for(var i = 0; i < data.length; ++i)
            {
                var record = new this(ActiveSupport.Object.clone(data[i]));
                records.push(record);
            }
            return records;
        }
        else
        {
            return new this(ActiveSupport.Object.clone(data));
        }
    },
    /**
     * ActiveRecord.Model.create(attributes) -> Object
     *
     *     var u = User.create({
     *         name: 'alice',
     *         password: 'pass'
     *     });
     *     u.id //will now contain the id of the user
     **/
    create: function create(data)
    {
        if(ActiveSupport.Object.isArray(data))
        {
            var records = [];
            for(var i = 0; i < data.length; ++i)
            {
                var record = this.build(data[i]);
                record.save(true);
                records.push(record);
            }
            return records;
        }
        else
        {
            var record = this.build(data);
            record.save(true);
            return record;
        }
    },
    /**
     * ActiveRecord.Model.update(id,attributes) -> Object
     *
     *     Article.update(3,{
     *         title: 'New Title'
     *     });
     *     //or pass an array of ids and an array of attributes
     *     Article.update([5,7],[
     *         {title: 'Title for 5'},
     *         {title: 'Title for 7'}
     *     ]);
     *     //or pass an array of ids and a hash of attributes
     *     Article.update([5,7],{
     *         featured: false
     *     });
     **/
    update: function update(id, attributes)
    {
        if (ActiveSupport.Object.isArray(id))
        {
            var attributes_is_array = ActiveSupport.Object.isArray(attributes);
            var results = [];
            for(var i = 0; i < id.length; ++i)
            {
                var record = this.find(id[i]);
                if(!record)
                {
                    results.push(false);
                }
                else
                {
                    results.push(record.updateAttributes(attributes_is_array ? attributes[i] : attributes));
                }
            }
            return results;
        }
        else
        {
            var record = this.find(id);
            if(!record)
            {
                return false;
            }
            record.updateAttributes(attributes);
            return record;
        }
    },
    /**
     * ActiveRecord.Model.updateAll(updates[,conditions]) -> null
     * - updates (Object | String) A string of updates to make, or a Hash of column value pairs.
     * - conditions (String): Optional where condition, or Hash of column name, value pairs.
     **/
    updateAll: function updateAll(updates, conditions)
    {
        ActiveRecord.connection.updateMultitpleEntities(this.tableName, updates, conditions);
    },
    /**
     * ActiveRecord.Model.resultSetFromArray(result_set[,find_params]) -> Array
     * Extends a vanilla array with ActiveRecord.ResultSet methods allowing for
     * the construction of custom result set objects from arrays where result
     * sets are expected. This will modify the array that is passed in and
     * return the same array object.
     *
     *     var one = Comment.find(1);
     *     var two = Comment.find(2);
     *     var result_set = Comment.resultSetFromArray([one,two]);
     **/
    resultSetFromArray: function resultSetFromArray(result_set,params)
    {
        if(!params)
        {
            params = {};
        }
        for(var method_name in ResultSet.InstanceMethods)
        {
            result_set[method_name] = ActiveSupport.Function.curry(ResultSet.InstanceMethods[method_name],result_set,params,this);
        }
        return result_set;
    }
});
ActiveSupport.Object.extend(ActiveRecord.ClassMethods,{
    processCalculationParams: function processCalculationParams(operation,params)
    {
        if(!params)
        {
            params = {};
        }
        if(typeof(params) === 'string')
        {
            params = {
                where: params
            };
        }
        return params;
    },
    performCalculation: function performCalculation(operation,params,sql_fragment)
    {
        return ActiveRecord.connection.calculateEntities(this.tableName,this.processCalculationParams(operation,params),sql_fragment);
    },
    /**
     * ActiveRecord.Model.count([options]) -> Number
     * options can contain all params that `find` can
     **/
    count: function count(params)
    {
        return this.performCalculation('count',params,'COUNT(*)');
    },
    /**
     * ActiveRecord.Model.average(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    average: function average(column_name,params)
    {
        return this.performCalculation('average',params,'AVG(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.max(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    max: function max(column_name,params)
    {
        return this.performCalculation('max',params,'MAX(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.min(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    min: function min(column_name,params)
    {
        return this.performCalculation('min',params,'MIN(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.sum(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    sum: function sum(column_name,params)
    {
        return this.performCalculation('sum',params,'SUM(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.first() -> Object
     * Returns the first record sorted by id.
     **/
    first: function first()
    {
        return this.find({
            first: true
        });
    },
    /**
     * ActiveRecord.Model.last() -> Object
     * Returns the last record sorted by id.
     **/
    last: function last()
    {
        return this.find({
            first: true,
            order: this.primaryKeyName + ' DESC'
        });
    }
});
/**
 * ActiveRecord.Adapters
 **/
var Adapters = {};

/**
 * ActiveRecord.connection
 * null if no connection is active, or the connection object.
 **/
ActiveRecord.connection = null;

/**
 * ActiveRecord.connect() -> null
 * ActiveRecord.connect(url) -> null
 * ActiveRecord.connection(json) -> null
 * - url (String): Location to load JSON data from.
 * - json (String | Object): JSON string or JSON object.
 *
 *     //empty in memory database
 *     ActiveRecord.connect();
 *     //in memory database populated with json data
 *     ActiveRecord.connect('{my_table:{1:{field:"value"}}}');
 *     //in memory database populated with json data loaded from remote source
 *     ActiveRecord.connect('my_data_source.json');
 **/
ActiveRecord.connect = function connect()
{
    switch(arguments.length)
    {
        case 0:
            ActiveRecord.connection = ActiveRecord.Adapters.InMemory.connect();
            ActiveRecord.notify('ready');
            break;
        case 1:
        case 2:
            if((typeof(arguments[0]) == 'string' && arguments[0].match(/\{/)) || (typeof(arguments[0]) == 'object' && !ActiveSupport.Object.isArray(arguments[0])))
            {
                ActiveRecord.connection = ActiveRecord.Adapters.InMemory.connect(arguments[0]);
                ActiveRecord.notify('ready');
            }
            else
            {
                ActiveRecord.connection = ActiveRecord.Adapters.InMemory.connect();
                ActiveRecord.Adapters.REST.connect(typeof(arguments[0]) == 'string' ? [arguments[0],'GET',false] : arguments[0],arguments[1]);
                //ready fired from within the REST adapter after Ajax request
            }
            break;
    }
};

/**
 * ActiveRecord.execute(sql_statement) -> Array
 * Accepts a variable number of arguments.
 *
 * Execute a SQL statement on the active connection. If the statement requires arguments they must be passed in after the SQL statement.
 *
 *     ActiveRecord.execute('DELETE FROM users WHERE user_id = ?',5);
 **/
ActiveRecord.execute = function execute()
{
    if (!ActiveRecord.connection)
    {
        throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
    }
    return ActiveRecord.connection.executeSQL.apply(ActiveRecord.connection, arguments);
};

/**
 * ActiveRecord.escape(value[,suppress_quotes = false]) -> Number | String
 * Escapes a given argument for use in a SQL string. By default
 * the argument passed will also be enclosed in quotes.
 *
 * ActiveRecord.escape(5) == 5
 * ActiveRecord.escape('tes"t') == '"tes\"t"';
 **/
ActiveRecord.escape = function escape(argument,suppress_quotes)
{
    var quote = suppress_quotes ? '' : '"';
    return typeof(argument) == 'number'
        ? argument
        : quote + String(argument).replace(/\"/g,'\\"').replace(/\\/g,'\\\\').replace(/\0/g,'\\0') + quote
    ;
};


/**
 * ActiveRecord.transaction(callback,[error_callback]) -> null
 * - proceed (Function): The block of code to execute inside the transaction.
 * - error_callback (Function): Optional error handler that will be called with an exception if one is thrown during a transaction. If no error handler is passed the exception will be thrown.
 *
 *     ActiveRecord.transaction(function(){
 *         var from = Account.find(2);
 *         var to = Account.find(3);
 *         to.despoit(from.withdraw(100.00));
 *     });
 **/
ActiveRecord.transaction = function transaction(proceed,error)
{
    try
    {
        ActiveRecord.connection.transaction(proceed);
    }
    catch(e)
    {
        if(error)
        {
            error(e);
        }
        else
        {
            throw e;
        }
    }
};

//deprecated
ActiveRecord.ClassMethods.transaction = ActiveRecord.transaction;

Adapters.defaultResultSetIterator = function defaultResultSetIterator(iterator)
{
    if (typeof(iterator) === 'number')
    {
        if (this.rows[iterator])
        {
            return ActiveSupport.Object.clone(this.rows[iterator]);
        }
        else
        {
            return false;
        }
    }
    else
    {
        for (var i = 0; i < this.rows.length; ++i)
        {
            var row = ActiveSupport.Object.clone(this.rows[i]);
            iterator(row);
        }
    }
};

Adapters.objectIsFieldDefinition = function objectIsFieldDefinition(object)
{
    return typeof(object) === 'object' && ActiveSupport.Object.keys(object).length === 2 && ('type' in object) && ('value' in object);
};

Adapters.fieldTypesWithDefaultValues = {
    'tinyint': 0,
    'smallint': 0,
    'mediumint': 0,
    'int': 0,
    'integer': 0,
    'bigint': 0,
    'float': 0,
    'double': 0,
    'double precision': 0,
    'real': 0,
    'decimal': 0,
    'numeric': 0,

    'date': '',
    'datetime': '',
    'timestamp': '',
    'time': '',
    'year': '',

    'char': '',
    'varchar': '',
    'tinyblob': '',
    'tinytext': '',
    'blob': '',
    'text': '',
    'mediumtext': '',
    'mediumblob': '',
    'longblob': '',
    'longtext': '',

    'enum': '',
    'set': ''
};


Adapters.InstanceMethods = {
    setValueFromFieldIfValueIsNull: function setValueFromFieldIfValueIsNull(field,value)
    {
        //no value was passed
        if (value === null || typeof(value) === 'undefined')
        {
            //default value was in field specification
            if(Adapters.objectIsFieldDefinition(field))
            {
                var default_value = this.getDefaultValueFromFieldDefinition(field);
                if(typeof(default_value) === 'undefined')
                {
                    throw Errors.InvalidFieldType.getErrorString(field ? (field.type || '[object]') : 'false');
                }
                return field.value || default_value;
            }
            //default value was set, but was not field specification
            else
            {
                return field;
            }
        }
        return value;
    },
    getColumnDefinitionFragmentFromKeyAndColumns: function getColumnDefinitionFragmentFromKeyAndColumns(key,columns)
    {
        return this.quoteIdentifier(key) + ((typeof(columns[key]) === 'object' && typeof(columns[key].type) !== 'undefined') ? columns[key].type : this.getDefaultColumnDefinitionFragmentFromValue(columns[key]));
    },
    getDefaultColumnDefinitionFragmentFromValue: function getDefaultColumnDefinitionFragmentFromValue(value)
    {
        if (typeof(value) === 'string')
        {
            return 'VARCHAR(255)';
        }
        if (typeof(value) === 'number')
        {
            return 'INT';
        }
        if (typeof(value) == 'boolean')
        {
            return 'TINYINT(1)';
        }
        return 'TEXT';
    },
    getDefaultValueFromFieldDefinition: function getDefaultValueFromFieldDefinition(field)
    {
        return field.value ? field.value : Adapters.fieldTypesWithDefaultValues[field.type ? field.type.replace(/\(.*/g,'').toLowerCase() : ''];
    },
    quoteIdentifier: function quoteIdentifier(name)
    {
      return '"' + name + '"';
    }
};

ActiveRecord.Adapters = Adapters;
Adapters.InMemory = function InMemory(storage){
    this.lastInsertId = null;
    this.setStorage(storage);
};

/**
 * ActiveRecord.connection.storage -> Object
 * Contains the raw data that the InMemory database uses. Stored in this format:
 *
 *     {
 *         table_name: {
 *             id: {
 *                 column_name: value
 *             }
 *         }
 *     }
 *
 *     ActiveRecord.connection.storage.table_name[id].column_name
 *     ActiveRecord.connection.storage.comments[5].title
 **/

ActiveSupport.Object.extend(Adapters.InMemory.prototype,Adapters.InstanceMethods);

ActiveSupport.Object.extend(Adapters.InMemory.prototype,{
    schemaLess: true,
    entityMissing: function entityMissing(id)
    {
        return {};
    },
    /**
     * ActiveRecord.connection.setStorage(storage) -> null
     * Sets the storage (in memory database hash) affter connect() has been called.
     *
     *     ActiveRecord.connect(ActiveRecord.Adapters.InMemory);
     *     ActiveRecord.connection.setStorage({my_table:{...}});
     **/
    setStorage: function setStorage(storage)
    {
        this.storage = typeof(storage) === 'string' ? ActiveSupport.JSON.parse(storage) : (storage || {});
        ActiveRecord.Indicies.initializeIndicies(this.storage);
    },
    /**
     * ActiveRecord.connection.serialize() -> String
     * Returns a JSON representation of the storage hash that the InMemory adapter
     * uses.
     **/
    serialize: function serialize()
    {
        return ActiveSupport.JSON.stringify(this.storage);
    },
    executeSQL: function executeSQL(sql)
    {
        if(ActiveRecord.logging)
        {
            ActiveSupport.log('Adapters.InMemory could not execute SQL:' + sql);
        }
    },
    insertEntity: function insertEntity(table, primary_key_name, data)
    {
        this.setupTable(table);
        var max = 1;
        var table_data = this.storage[table];
        if(!data.id)
        {
            for(var id in table_data)
            {
                if(parseInt(id, 10) >= max)
                {
                    max = parseInt(id, 10) + 1;
                }
            }
            data.id = max;
        }
        this.lastInsertId = data.id;
        this.storage[table][data.id] = data;
        return true;
    },
    getLastInsertedRowId: function getLastInsertedRowId()
    {
        return this.lastInsertId;
    },
    updateMultitpleEntities: function updateMultitpleEntities(table, updates, conditions)
    {

    },
    updateEntity: function updateEntity(table, primary_key_name, id, data)
    {
        this.setupTable(table);
        if(data[primary_key_name] != id)
        {
            //edge case where id has changed
            this.storage[table][data[primary_key_name]] = data;
            delete this.storage[table][id];
        }
        else
        {
            this.storage[table][id] = data;
        }
        return true;
    },
    calculateEntities: function calculateEntities(table, params, operation)
    {
        this.setupTable(table);
        var entities = this.findEntities(table,params);
        var parsed_operation = operation.match(/([A-Za-z]+)\(([^\)]+)\)/);
        var operation_type = parsed_operation[1].toLowerCase();
        var column_name = parsed_operation[2];
        switch(operation_type){
            case 'count':
                return entities.length;
            case 'max':
                var max = 0;
                for(var i = 0; i < entities.length; ++i)
                {
                    if(parseInt(entities[i][column_name], 10) > max)
                    {
                        max = parseInt(entities[i][column_name], 10);
                    }
                }
                return max;
            case 'min':
                var min = 0;
                if(entities[0])
                {
                    min = entities[0][column_name];
                }
                for(var i = 0; i < entities.length; ++i)
                {
                    if(entities[i][column_name] < min)
                    {
                        min = entities[i][column_name];
                    }
                }
                return min;
            case 'avg':
            case 'sum':
                var sum = 0;
                for(var i = 0; i < entities.length; ++i)
                {
                    sum += entities[i][column_name];
                }
                return operation_type === 'avg' ? sum / entities.length : sum;
        }
    },
    deleteEntity: function deleteEntity(table, primary_key_name, id)
    {
        this.setupTable(table);
        if(!id || id === 'all')
        {
            this.storage[table] = {};
            return true;
        }
        else if(this.storage[table][id])
        {
            delete this.storage[table][id];
            return true;
        }
        return false;
    },
    findEntityById: function findEntityById(table, primary_key_name, id)
    {
        return this.storage[table][id];
    },
    findEntitiesById: function findEntitiesById(table, primary_key_name, ids)
    {
        var table_data = this.storage[table];
        var response = [];
        for(var i = 0; i < ids.length; ++i)
        {
            var id = ids[i];
            if(table_data[id])
            {
                response.push(table_data[id]);
            }
        }
        return this.iterableFromResultSet(response);
    },
    findEntities: function findEntities(table, params)
    {
        if (typeof(table) === 'string' && !table.match(/^\d+$/) && typeof(params) != 'object')
        {
            //find by SQL

            //replace ? in SQL strings
            var sql = table;
            var sql_args = ActiveSupport.Array.from(arguments).slice(1);
            for(var i = 0; i < sql_args.length; ++i)
            {
                sql = sql.replace(/\?/,ActiveRecord.escape(sql_args[i]));
            }
            var response = this.paramsFromSQLString(sql);
            table = response[0];
            params = response[1];
        }
        else if(typeof(params) === 'undefined')
        {
            params = {};
        }
        this.setupTable(table);
        var entity_array = [];
        var table_data = this.storage[table];
        if(params && params.where && params.where.id)
        {
            if(table_data[params.where.id])
            {
                entity_array.push(table_data[params.where.id]);
            }
        }
        else
        {
            for(var id in table_data)
            {
                entity_array.push(table_data[id]);
            }
        }
        var filters = [];
        if(params && params.group)
        {
            filters.push(this.createGroupBy(params.group));
        }
        if(params && params.where)
        {
            filters.push(this.createWhere(params.where));
        }
        if(params && params.callback)
        {
            filters.push(this.createCallback(params.callback));
        }
        if(params && params.order)
        {
            filters.push(this.createOrderBy(params.order));
        }
        if(params && params.limit || params.offset)
        {
            filters.push(this.createLimit(params.limit,params.offset));
        }
        for(var i = 0; i < filters.length; ++i)
        {
            entity_array = filters[i](entity_array);
        }
        return this.iterableFromResultSet(entity_array);
    },
    paramsFromSQLString: function paramsFromSQLString(sql)
    {
        var params = {};
        var select = /\s*SELECT\s+.+\s+FROM\s+(\w+)\s+/i;
        var select_match = sql.match(select);
        var table = select_match[1];
        sql = sql.replace(select,'');
        var fragments = [
            ['limit',/(^|\s+)LIMIT\s+(.+)$/i],
            ['order',/(^|\s+)ORDER\s+BY\s+(.+)$/i],
            ['group',/(^|\s+)GROUP\s+BY\s+(.+)$/i],
            ['where',/(^|\s+)WHERE\s+(.+)$/i]
        ];
        for(var i = 0; i < fragments.length; ++i)
        {
            var param_name = fragments[i][0];
            var matcher = fragments[i][1];
            var match = sql.match(matcher);
            if(match)
            {
                params[param_name] = match[2];
                sql = sql.replace(matcher,'');
            }
        }
        return [table,params];
    },
    transaction: function transaction(proceed)
    {
        var backup = {};
        for(var table_name in this.storage)
        {
            backup[table_name] = ActiveSupport.Object.clone(this.storage[table_name]);
        }
        try
        {
            proceed();
        }
        catch(e)
        {
            this.storage = backup;
            throw e;
        }
    },
    //PRVIATE
    iterableFromResultSet: function iterableFromResultSet(result)
    {
        result.iterate = function iterate(iterator,context)
        {
            if (typeof(iterator) === 'number')
            {
                if (this[iterator])
                {
                    return ActiveSupport.Object.clone(this[iterator]);
                }
                else
                {
                    return false;
                }
            }
            else
            {
                for (var i = 0; i < this.length; ++i)
                {
                    var row = ActiveSupport.Object.clone(this[i]);
                    iterator.apply(context,[row]);
                }
            }
        };
        return result;
    },
    setupTable: function setupTable(table)
    {
        if(!this.storage[table])
        {
            this.storage[table] = {};
        }
    },
    createWhere: function createWhere(where)
    {
        if(ActiveSupport.Object.isArray(where))
        {
            var where_fragment = where[0];
            for(var i = 1; i < where.length; ++i)
            {
                where_fragment = where_fragment.replace(/\?/,ActiveRecord.escape(where[i]));
            }
            where = where_fragment;
        }
        if(typeof(where) === 'string')
        {
            return function json_result_where_processor(result_set)
            {
                var response = [];
                var where_parser = new WhereParser();
                var abstract_syntax_tree = where_parser.parse(where);
                for(var i = 0; i < result_set.length; ++i)
                {
                    if(abstract_syntax_tree.execute(result_set[i],Adapters.InMemory.method_call_handler))
                    {
                        response.push(result_set[i]);
                    }
                }
                return response;
            };
        }
        else
        {
            return function json_result_where_processor(result_set)
            {
                var response = [];
                for(var i = 0; i < result_set.length; ++i)
                {
                    var included = true;
                    for(var column_name in where)
                    {
                        if((String(result_set[i][column_name])) != (String(where[column_name])))
                        {
                            included = false;
                            break;
                        }
                    }
                    if(included)
                    {
                        response.push(result_set[i]);
                    }
                }
                return response;
            };
        }
    },
    createCallback: function createCallback(callback)
    {
        return function json_result_callback_processor(result_set)
        {
            var response = [];
            for(var i = 0; i < result_set.length; ++i)
            {
                if(callback(result_set[i]))
                {
                    response.push(result_set[i]);
                }
            }
            return response;
        };
    },
    createLimit: function createLimit(limit,offset)
    {
        return function json_result_limit_processor(result_set)
        {
            return result_set.slice(offset || 0,limit);
        };
    },
    createGroupBy: function createGroupBy(group_by)
    {
        if(!group_by || group_by == '')
        {
            return function json_result_group_by_processor(result_set)
            {
                return result_set;
            }
        }
        var group_key = group_by.replace(/(^[\s]+|[\s]+$)/g,'');
        return function json_result_group_by_processor(result_set)
        {
            var response = [];
            var indexed_by_group = {};
            for(var i = 0; i < result_set.length; ++i)
            {
                indexed_by_group[result_set[i][group_key]] = result_set[i];
            }
            for(var group_key_value in indexed_by_group)
            {
                response.push(indexed_by_group[group_key_value]);
            }
            return response;
        }
    },
    createOrderBy: function createOrderBy(order_by)
    {
        if(!order_by || order_by === '')
        {
            return function json_result_order_by_processor(result_set)
            {
                return result_set;
            };
        }
        var order_statements = order_by.split(',');
        var trimmed_order_statements = [];
        for(var i = 0; i < order_statements.length; ++i)
        {
            trimmed_order_statements.push(order_statements[i].replace(/(^[\s]+|[\s]+$)/g,'').replace(/[\s]{2,}/g,'').toLowerCase());
        }
        return function json_result_order_by_processor(result_set)
        {
            for(var i = 0; i < trimmed_order_statements.length; ++i)
            {
                var trimmed_order_statements_bits = trimmed_order_statements[i].split(/\s/);
                var column_name = trimmed_order_statements_bits[0];
                var reverse = trimmed_order_statements_bits[1] && trimmed_order_statements_bits[1] === 'desc';
                result_set = result_set.sort(function result_set_sorter(a,b){
                    return a[column_name] < b[column_name] ? -1 : a[column_name] > b[column_name] ? 1 : 0;
                });
                if(reverse)
                {
                    result_set = result_set.reverse();
                }
            }
            return result_set;
        };
    },
    //schema
    createTable: function createTable(table_name,columns)
    {
        if(!this.storage[table_name])
        {
            this.storage[table_name] = {};
        }
    },
    dropTable: function dropTable(table_name)
    {
        delete this.storage[table_name];
    },
    addColumn: function addColumn(table_name,column_name,data_type)
    {
        return; //no action needed
    },
    removeColumn: function removeColumn(table_name,column_name)
    {
        return; //no action needed
    },
    addIndex: function addIndex(table_name,column_names,options)
    {
        return; //no action needed
    },
    removeIndex: function removeIndex(table_name,index_name)
    {
        return; //no action needed
    },
    cachedObjectIsFieldDefinitionResults: {},
    cachedGetDefaultValueFromFieldDefinitionResults: {},
    fieldIn: function fieldIn(key_name, field, value)
    {
        if(value && value instanceof Date)
        {
            return ActiveSupport.dateFormat(value,'yyyy-mm-dd HH:MM:ss');
        }
        if(typeof(this.cachedObjectIsFieldDefinitionResults[key_name]) == 'undefined')
        {
            this.cachedObjectIsFieldDefinitionResults[key_name] = Adapters.objectIsFieldDefinition(field);
        }
        if(this.cachedObjectIsFieldDefinitionResults[key_name])
        {
            if(typeof(this.cachedGetDefaultValueFromFieldDefinitionResults[key_name]) == 'undefined')
            {
                this.cachedGetDefaultValueFromFieldDefinitionResults[key_name] = this.getDefaultValueFromFieldDefinition(field);
            }
            field = this.cachedGetDefaultValueFromFieldDefinitionResults[key_name];
        }
        value = this.setValueFromFieldIfValueIsNull(field,value);
        return value;
    },
    fieldOut: function fieldOut(key_name, field, value)
    {
        if(typeof(this.cachedObjectIsFieldDefinitionResults[key_name]) == 'undefined')
        {
            this.cachedObjectIsFieldDefinitionResults[key_name] = Adapters.objectIsFieldDefinition(field);
        }
        if(this.cachedObjectIsFieldDefinitionResults[key_name])
        {
            //date handling
            if(field.type.toLowerCase().match(/date/) && typeof(value) == 'string')
            {
                return ActiveSupport.dateFromDateTime(value);
            }
            if(typeof(this.cachedGetDefaultValueFromFieldDefinitionResults[key_name]) == 'undefined')
            {
                this.cachedGetDefaultValueFromFieldDefinitionResults[key_name] = this.getDefaultValueFromFieldDefinition(field);
            }
            field = this.cachedGetDefaultValueFromFieldDefinitionResults[key_name];
        }
        value = this.setValueFromFieldIfValueIsNull(field,value);
        return value;
    }
});

Adapters.InMemory.method_call_handler = function method_call_handler(name,row,args)
{
    if(!Adapters.InMemory.MethodCallbacks[name])
    {
        name = name.toLowerCase().replace(/\_[0-9A-Z-a-z]/g,function camelize_underscores(match){
            return match.toUpperCase();
        });
    }
    if(!Adapters.InMemory.MethodCallbacks[name])
    {
        throw Errors.MethodDoesNotExist.getErrorString('"' + name + '"' + ' was called from a sql statement.');
    }
    else
    {
        return Adapters.InMemory.MethodCallbacks[name].apply(Adapters.InMemory.MethodCallbacks[name],[row].concat(args || []));
    }
};
Adapters.InMemory.MethodCallbacks = (function(){
    var methods = {};
    var math_methods = ['abs','acos','asin','atan','atan2','ceil','cos','exp','floor','log','max','min','pow','random','round','sin','sqrt','tan'];
    for(var i = 0; i < math_methods.length; ++i)
    {
        methods[math_methods[i]] = (function math_method_generator(i){
            return function generated_math_method(){
                return Math[math_methods[i]].apply(Math.math_methods[i],ActiveSupport.Array.from(arguments).slice(1));
            };
        })(i);
    }
    return methods;
})();

Adapters.InMemory.connect = function(storage){
  return new Adapters.InMemory(storage || {});
};
/*

document:
    - format of rest mapping
    - expected inputs and outputs of rest methods
    - what additional events are triggered (for instance: updateAttributes() called on success of create/update/destroy)

*/
Adapters.REST = {};

ActiveSupport.Object.extend(Adapters.REST,{
    mapping: {},
    wrappedMethods: {},
    connect: function connect(initial_data_location,mapping)
    {
        Adapters.REST.mapping = mapping;
        for(var model_name in mapping)
        {
            var model = ActiveRecord.Models[model_name];
            if(!model)
            {
                throw Adapters.REST.Errors.modelDoesNotExist.getErrorString(model_name);
            }
            for(var action_name in mapping[model_name])
            {
                if(ActiveSupport.Array.indexOf(['search','outbound_transform','inbound_transform'],action_name) == -1)
                {
                    Adapters.REST.generateWrapper(action_name,model);
                }
            }
        }
        if(initial_data_location)
        {
            Adapters.REST.performInitialDataLoad(initial_data_location);
        }
    },
    performInitialDataLoad: function performInitialDataLoad(initial_data_location)
    {
        var url = initial_data_location[0];
        var http_method = initial_data_location[1].toLowerCase() || 'post';
        var http_params = Adapters.REST.getHTTPParamsFromMappingFragment(initial_data_location);
        var response_processor_callback = initial_data_location[3];
        Adapters.REST.createAjaxRequest(
            url,
            http_method,
            http_params,
            function initial_data_load_on_success(transport){
                var json_data = transport.responseJSON || ActiveSupport.JSON.parse(transport.responseText);
                if(response_processor_callback)
                {
                    json_data = response_processor_callback(json_data);
                }
                for(var model_name in Adapters.REST.mapping)
                {
                    var model = ActiveRecord.Models[model_name];
                    if(!model)
                    {
                        throw Adapters.REST.Errors.modelDoesNotExist.getErrorString(model_name);
                    }
                    if(json_data[model.tableName] && Adapters.REST.mapping[model_name].inbound_transform)
                    {
                        Adapters.REST.mapping[model_name].inbound_transform(json_data[model.tableName]);
                    }
                }
                ActiveRecord.connection.setStorage(json_data);
                ActiveRecord.notify('ready');
            },
            function initial_data_load_on_failure(){
                throw Adapters.REST.Errors.initialDataLoadError.getErrorString();
            }
        );
    },
    generateWrapper: function generateWrapper(action_name,model)
    {
        switch(action_name)
        {
            case 'update':
                Adapters.REST.generateClassWrapper('update',model);
                Adapters.REST.generateInstanceWrapper('save',model);
                Adapters.REST.generateInstanceWrapper('updateAttribute',model);
                Adapters.REST.generateInstanceWrapper('updateAttributes',model);
                break;
            case 'create':
                Adapters.REST.generateClassWrapper('create',model);
                Adapters.REST.generateInstanceWrapper('save',model);
                break;
            case 'destroy':
                Adapters.REST.generateClassWrapper('destroy',model);
                Adapters.REST.generateInstanceWrapper('destroy',model);
                break;
            case 'batch_create':
                Adapters.REST.generateClassWrapper('create',model);
                break;
            case 'batch_update':
                Adapters.REST.generateClassWrapper('update',model);
                break;
            case 'batch_destroy':
                Adapters.REST.generateClassWrapper('destroy',model);
                break;
            case 'search':

                break;
        }
    },
    generateInstanceWrapper: function generateInstanceWrapper(method_name,model)
    {
        if(!Adapters.REST.wrappedMethods[model.modelName])
        {
            Adapters.REST.wrappedMethods[model.modelName] = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].instance)
        {
            Adapters.REST.wrappedMethods[model.modelName].instance = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].instance[method_name])
        {
            Adapters.REST.wrappedMethods[model.modelName].instance[method_name] = model.prototype[method_name] = ActiveSupport.Function.wrap(model.prototype[method_name],Adapters.REST.instanceWrapperGenerators[method_name](model));
        }
    },
    generateClassWrapper: function generateClassWrapper(method_name,model)
    {
        if(!Adapters.REST.wrappedMethods[model.modelName])
        {
            Adapters.REST.wrappedMethods[model.modelName] = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].klass)
        {
            Adapters.REST.wrappedMethods[model.modelName].klass = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].klass[method_name])
        {
            Adapters.REST.wrappedMethods[model.modelName].klass[method_name] = model[method_name] = ActiveSupport.Function.wrap(model[method_name],Adapters.REST.classWrapperGenerators[method_name](model));
        }
    },
    getPersistencePostBody: function getPersistencePostBody(model,params,http_params,mapping_fragment)
    {
        var params_container_name = ActiveSupport.String.singularize(model.tableName);
        var transform = false;
        if(Adapters.REST.mapping[model.modelName].outbound_transform)
        {
            transform = Adapters.REST.mapping[model.modelName].outbound_transform;
        }
        if(params)
        {
            if(ActiveSupport.Object.isArray(params))
            {
                var plural_params_container_name = model.tableName;
                var final_params = {};
                ActiveSupport.Object.extend(final_params,http_params || {});
                if(transform)
                {
                    for(var i = 0; i < params.length; ++i)
                    {
                        transform(params[i]);
                    }
                }
                final_params[plural_params_container_name] = params;
                return ActiveSupport.JSON.stringify(final_params);
            }
            else
            {
                var final_params = {};
                ActiveSupport.Object.extend(final_params,http_params);
                if(transform)
                {
                    transform(params);
                }
                final_params[params_container_name] = params;
                return ActiveSupport.JSON.stringify(final_params);
            }
        }
        return '';
    },
    getPersistenceSuccessCallback: function getPersistenceSuccessCallback(mapping_fragment,instance,callback)
    {
        return function on_success_callback(transport){
            var response_processor_callback = mapping_fragment[3];
            if(response_processor_callback)
            {
                transport.responseJSON = response_processor_callback(transport.responseJSON);
            }
            //console.log('success: transport.responseJSON',transport.responseJSON);
            if(instance)
            {
                if(ActiveSupport.Object.isArray(instance))
                {
                    for(var i = 0; i < instance.length; ++i)
                    {
                        instance[i].updateAttributes(transport.responseJSON[i]);
                    }
                }
                else
                {
                    instance.updateAttributes(transport.responseJSON);
                }
            }
            if(callback && typeof(callback) == 'function')
            {
                callback(instance,true);
            }
        };
    },
    getPersistenceFailureCallback: function getPersistenceFailureCallback(mapping_fragment,instance,callback)
    {
        return function on_failure_callback(transport){
            //console.log('failure: transport',transport);
            if(instance)
            {
                //TODO: handle array case
                if(transport.responseJSON && transport.responseJSON.errors)
                {
                    for(var field_name in transport.responseJSON.errors)
                    {
                        for(var i = 0; i < transport.responseJSON.errors[field_name].length; ++i)
                        {
                            instance.addError(transport.responseJSON.errors[field_name][i],field_name);
                        }
                    }
                }
                else
                {
                    instance.addError('An unknown server error occurred.');
                }
            }
            if(callback && typeof(callback) == 'function')
            {
                callback(instance,false);
            }
        };
    },
    substituteUrlParams: function substituteUrlParams(url,params)
    {
        return url.replace(/(\:[\w\-]+)/g,function(fragment){
            var key = fragment.substr(1);
            return params[key] || fragment;
        });
    },
    getHTTPParamsFromMappingFragment: function getHTTPParamsFromMappingFragment(mapping_fragment)
    {
        var http_params = false;
        if(mapping_fragment && mapping_fragment[2])
        {
            if(typeof(mapping_fragment[2]) == 'function')
            {
                http_params = mapping_fragment[2]();
            }
            else
            {
                http_params = mapping_fragment[2];
            }
        }
        return http_params;
    },
    createPersistenceRequest: function createPersistenceRequest(model,instance,mapping_fragment,instance_params,callback)
    {
        var url = mapping_fragment[0];
        var http_method = mapping_fragment[1].toLowerCase() || 'post';
        var http_params = Adapters.REST.getHTTPParamsFromMappingFragment(mapping_fragment);
        http_params = Adapters.REST.extendHTTPParams(http_params,http_method);
        return Adapters.REST.createAjaxRequest(
            Adapters.REST.substituteUrlParams(url,instance_params),
            http_method.toLowerCase(),
            Adapters.REST.getPersistencePostBody(model,instance_params,http_params,mapping_fragment),
            Adapters.REST.getPersistenceSuccessCallback(mapping_fragment,instance,callback),
            Adapters.REST.getPersistenceFailureCallback(mapping_fragment,instance,callback)
        );
    },
    extendHTTPParams: function extendHTTPParams(http_params,http_method)
    {
        if(!http_params)
        {
            http_params = {};
        }
        if(window._auth_token)
        {
            http_params.authenticity_token = window._auth_token;
        }
        http_params._method = http_method.toLowerCase();
        return http_params;
    },
    createAjaxRequest: function createAjaxRequest(url,http_method,post_body,on_success,on_failure)
    {
        var post_body_is_json = post_body && (post_body.substr(0,1) == '{' || post_body.substr(0,1) == '[');
        var final_url = url;
        var final_params = {
            contentType: post_body_is_json ? 'application/json' : 'application/x-www-form-urlencoded',
            method: http_method,
            postBody: post_body,
            onSuccess: on_success,
            onFailure: on_failure
        };
        //console.log('new ActiveSupport.Request',final_url,final_params);
        return new ActiveSupport.Request(final_url,final_params);
    }
});

Adapters.REST.classWrapperGenerators = {
    create: function create(model)
    {
        return function generated_class_create_wrapper(proceed,attributes,callback){
            var instance = proceed(attributes);
            var model_name = model.modelName;
            if(instance && callback)
            {
                if(ActiveSupport.Object.isArray(attributes))
                {
                    if(Adapters.REST.mapping[model_name].batch_create)
                    {
                        var params_array = [];
                        for(var i = 0; i < instance.length; ++i)
                        {
                            params_array.push(instance[i].toObject(function(attributes){
                                delete attributes.id;
                                return attributes;
                            }));
                        }
                        Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].batch_create,params_array,callback);
                    }
                    else
                    {
                        var created_items = [];
                        var callback_queue = new ActiveSupport.CallbackQueue(function(){
                            //this will be called when all of the ajax requests have finished
                            if(callback && typeof(callback) == 'function')
                            {
                                callback(created_items);
                            }
                        });
                        for(var i = 0; i < instance.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,instance[i],Adapters.REST.mapping[model_name].create,instance[i].toObject(function(attributes){
                                delete attributes.id;
                                return attributes;
                            }),callback_queue.push(function(created_item){
                                created_items.push(created_item);
                            }));
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].create,instance.toObject(function(attributes){
                        delete attributes.id;
                        return attributes;
                    }),callback);
                }
            }
            return instance;
        };
    },
    update: function update(model)
    {
        return function generated_class_update_wrapper(proceed,id,attributes,callback){
            var instance = proceed(id,attributes);
            var model_name = model.modelName;
            if(instance && callback)
            {
                if(ActiveSupport.Object.isArray(id))
                {
                    if(Adapters.REST.mapping[model_name].batch_update)
                    {
                        var params_array = [];
                        for(var i = 0; i < instance.length; ++i)
                        {
                            params_array.push(instance[i].toObject());
                        }
                        Adapters.REST.createPersistenceRequest(model,instance[i],Adapters.REST.mapping[model_name].batch_update,params_array,callback);
                    }
                    else
                    {
                        var updated_items = [];
                        var callback_queue = new ActiveSupport.CallbackQueue(function(){
                            //this will be called when all of the ajax requests have finished
                            if(callback && typeof(callback) == 'function')
                            {
                                callback(updated_items);
                            }
                        });
                        for(var i = 0; i < instance.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,instance[i],Adapters.REST.mapping[model_name].update,instance[i].toObject(),callback_queue.push(function(updated_item){
                                updated_items.push(updated_item);
                            }));
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].update,instance.toObject(),callback);
                }
            }
            return instance;
        };
    },
    destroy: function destroy(model)
    {
        return function generated_class_destroy_wrapper(proceed,id,callback){
            var response = proceed(id);
            var model_name = model.modelName;
            if(callback)
            {
                if(ActiveSupport.Object.isArray(id))
                {
                    if(Adapters.REST.mapping[model_name].batch_destroy)
                    {
                        var params_array = [];
                        for(var i = 0; i < id.length; ++i)
                        {
                            params_array.push({
                                id: id
                            });
                        }
                        Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].batch_destroy,params_array,callback);
                    }
                    else
                    {
                        var callback_queue = new ActiveSupport.CallbackQueue(callback);
                        for(var i = 0; i < id.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].destroy,{
                                id: id
                            },callback_queue.push(function(){}));
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].destroy,{
                        id: id
                    },callback);
                }
            }
            return response;
        };
    }
};

Adapters.REST.instanceWrapperGenerators = {
    updateAttribute: function updateAttribute(model)
    {
        return function generated_instance_update_attribute_wrapper(proceed,key,value,callback){
            var instance = proceed(key,value);
            if(instance && callback)
            {
                Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].update,instance.toObject(),callback);
            }
            return instance;
        };
    },
    updateAttributes: function updateAttributes(model)
    {
        return function generated_instance_update_attributes_wrapper(proceed,attributes,callback){
            var instance = proceed(attributes);
            if(instance && callback)
            {
                Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].update,instance.toObject(),callback);
            }
            return instance;
        };
    },
    save: function save(model)
    {
        return function generated_instance_save_wrapper(proceed,force_created_mode,callback){
            var instance = proceed(force_created_mode);
            //TODO: see if should delete "id" for create case
            if(instance && callback)
            {

            }
            return instance;
        };
    },
    destroy: function destroy(model)
    {
        return function generated_instance_destroy_wrapper(proceed,callback){
            var response = proceed();
            if(callback)
            {
                Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].destroy,instance.toObject(),callback);
            }
            return response;
        };
    }
};

Adapters.REST.Errors = {
    modelDoesNotExist: ActiveSupport.createError('The ActiveRecord model % does not exist.'),
    initialDataLoadError: ActiveSupport.createError('A server error occurred while performing the initial data load.')
};

/*

Test
    - class.create
        - test with failure
    - class.update
        - test with failure
    - class.destroy
        - test with failure
    - class.batch_create with batch_create
        - test with failure
    - class.batch_create with create
        - test with failure
    - class.batch_update with batch_update
        - test with failure
    - class.batch_update with update
        - test with failure
    - class.batch_destroy with batch_destroy
        - test with failure
    - class.batch_destroy with destroy
        - test with failure
    - instance.updateAttribute
        - test with failure
    - instance.updateAttributes
        - test with failure
    - instance.save
        - test with failure
    - instance.destroy
        - test with failure

*/
/*
ActiveRecord.ClassMethods.search = function search(query,proceed,extra_query_params){
  new Ajax.Request('/' + this.tableName + '/search.json',{
    method: 'get',
    parameters: encodeURIComponent('query') + '=' + encodeURIComponent(query) + (extra_query_params || ''),
    onSuccess: function(request){
      proceed(request.responseJSON,query)
    }
  });
};
*/
//Infinite thanks to [Kevin Lindsey](http://www.kevlindev.com/)

//var WhereLexer;
var WhereParser;

//(function() {

// token types
var $c$ = 0,
    ERROR              = -1,
    AND                = $c$++,
    COMMA              = $c$++,
    EQUAL              = $c$++,
    FALSE              = $c$++,
    GREATER_THAN       = $c$++,
    GREATER_THAN_EQUAL = $c$++,
    IDENTIFIER         = $c$++,
    IN                 = $c$++,
    LESS_THAN          = $c$++,
    LESS_THAN_EQUAL    = $c$++,
    LPAREN             = $c$++,
    NOT_EQUAL          = $c$++,
    NUMBER             = $c$++,
    RPAREN             = $c$++,
    STRING             = $c$++,
    TRUE               = $c$++,
    OR                 = $c$++,
    WHITESPACE         = $c$++;

// this is here mostly for debugging messages
var TypeMap = [];
TypeMap[AND]                = "AND";
TypeMap[COMMA]              = "COMMA";
TypeMap[EQUAL]              = "EQUAL";
TypeMap[FALSE]              = "FALSE";
TypeMap[GREATER_THAN]       = "GREATER_THAN";
TypeMap[GREATER_THAN_EQUAL] = "GREATER_THAN_EQUAL";
TypeMap[IDENTIFIER]         = "IDENTIFIER";
TypeMap[IN]                 = "IN";
TypeMap[LESS_THAN]          = "LESS_THAN";
TypeMap[LESS_THAN_EQUAL]    = "LESS_THAN_EQUAL";
TypeMap[LPAREN]             = "LPAREN";
TypeMap[NOT_EQUAL]          = "NOT_EQUAL";
TypeMap[NUMBER]             = "NUMBER";
TypeMap[RPAREN]             = "RPAREN";
TypeMap[STRING]             = "STRING";
TypeMap[TRUE]               = "TRUE";
TypeMap[OR]                 = "OR";
TypeMap[WHITESPACE]         = "WHITESPACE";

// map operators and keywords to their propery type
var OperatorMap = {
    "&&":    AND,
    ",":     COMMA,
    "||":    OR,
    "<":     LESS_THAN,
    "<=":    LESS_THAN_EQUAL,
    "=":     EQUAL,
    "!=":    NOT_EQUAL,
    ">":     GREATER_THAN,
    ">=":    GREATER_THAN_EQUAL,
    "(":     LPAREN,
    ")":     RPAREN
};
var KeywordMap = {
    "and":   AND,
    "false": FALSE,
    "in":    IN,
    "or":    OR,
    "true":  TRUE
};

// Lexer token patterns
var WHITESPACE_PATTERN = /^\s+/;
var IDENTIFIER_PATTERN = /^[a-zA-Z\_][a-zA-Z\_]*/;
var OPERATOR_PATTERN   = /^(?:&&|\|\||<=|<|=|!=|>=|>|,|\(|\))/i;
var KEYWORD_PATTERN    = /^(true|or|in|false|and)\b/i;
var STRING_PATTERN     = /^(?:'(\\.|[^'])*'|"(\\.|[^"])*")/;
var NUMBER_PATTERN     = /^[1-9][0-9]*/;

// Current lexeme to parse
var currentLexeme;

// Lexeme class

function Lexeme(type, text)
{
    this.type = type;
    this.typeName = null;
    this.text = text;
}

Lexeme.prototype.toString = function toString()
{
    if (this.typeName)
    {
        return "[" + this.typeName + "]~" + this.text + "~";
    }
    else
    {
        return "[" + this.type + "]~" + this.text + "~";
    }
};

// Lexer class

function WhereLexer()
{
    // initialize
    this.setSource(null);
}

WhereLexer.prototype.setSource = function setSource(source)
{
    this.source = source;
    this.offset = 0;
    this.length = (source !== null) ? source.length : 0;

    currentLexeme = null;
};

WhereLexer.prototype.advance = function advance()
{
    var inWhitespace = true;
    var result = null;

    while (inWhitespace)
    {
        // assume not in whitespace
        inWhitespace = false;

        // clear possible last whitespace result
        result = null;

        if (this.offset < this.length)
        {
            var match, text, type;

            // NOTE: [KEL] Switching on the first character may speed things up
            // here.

            if ((match = WHITESPACE_PATTERN.exec(this.source)) !== null)
            {
                result = new Lexeme(WHITESPACE, match[0]);
                inWhitespace = true;
            }
            else if ((match = OPERATOR_PATTERN.exec(this.source)) !== null)
            {
                text = match[0];
                type = OperatorMap[text.toLowerCase()];

                result = new Lexeme(type, text);
            }
            else if ((match = KEYWORD_PATTERN.exec(this.source)) !== null)
            {
                text = match[0];
                type = KeywordMap[text.toLowerCase()];

                result = new Lexeme(type, text);
            }
            else if ((match = STRING_PATTERN.exec(this.source)) !== null)
            {
                result = new Lexeme(STRING, match[0]);
            }
            else if ((match = NUMBER_PATTERN.exec(this.source)) !== null)
            {
                result = new Lexeme(NUMBER, match[0]);
            }
            else if ((match = IDENTIFIER_PATTERN.exec(this.source)) !== null)
            {
                result = new Lexeme(IDENTIFIER, match[0]);
            }
            else
            {
                result = new Lexeme(ERROR, this.source);
            }

            // assign type name, if we have one
            if (TypeMap[result.type])
            {
                result.typeName = TypeMap[result.type];
            }

            // update source state
            var length = result.text.length;
            this.offset += length;
            this.source = this.source.substring(length);
        }
    }

    // expose result
    currentLexeme = result;

    return result;
};

// Binary operator node

function BinaryOperatorNode(lhs, operator, rhs)
{
    this.lhs = lhs;
    this.operator = operator;
    this.rhs = rhs;
}

BinaryOperatorNode.prototype.execute = function execute(row, functionProvider)
{
    var result = null;
    var lhs = this.lhs.execute(row, functionProvider);

    if (this.operator == IN)
    {
        // assume failure
        result = false;

        // see if the lhs value is in the rhs list
        for (var i = 0; i < this.rhs.length; i++)
        {
            var rhs = this.rhs[i].execute(row, functionProvider);

            if (lhs == rhs)
            {
                result = true;
                break;
            }
        }
    }
    else
    {
        var rhs = this.rhs.execute(row, functionProvider);

        switch (this.operator)
        {
            case EQUAL:
                result = (lhs === rhs);
                break;

            case NOT_EQUAL:
                result = (lhs !== rhs);
                break;

            case LESS_THAN:
                result = (lhs < rhs);
                break;

            case LESS_THAN_EQUAL:
                result = (lhs <= rhs);
                break;

            case GREATER_THAN:
                result = (lhs > rhs);
                break;

            case GREATER_THAN_EQUAL:
                result = (lhs >= rhs);
                break;

            case AND:
                result = (lhs && rhs);
                break;

            case OR:
                result = (lhs || rhs);
                break;

            default:
                throw new Error("Unknown operator type: " + this.operator);
        }
    }

    return result;
};

// Identifer node

function IdentifierNode(identifier)
{
    this.identifier = identifier;
}

IdentifierNode.prototype.execute = function execute(row, functionProvider)
{
    return row[this.identifier];
};

// Function node

function FunctionNode(name, args)
{
    this.name = name;
    this.args = args;
}

FunctionNode.prototype.execute = function execute(row, functionProvider)
{
    // evaluate arguments
    var args = new Array(this.args.length);

    for (var i = 0; i < this.args.length; i++)
    {
        args[i] = this.args[i].execute(row, functionProvider);
    }

    // evaluate function and return result
    return functionProvider(this.name, row, args);
};

// Scalar node

function ScalarNode(value)
{
    this.value = value;
}

ScalarNode.prototype.execute = function execute(row, functionProvider)
{
    return this.value;
};


// Parser class

WhereParser = function WhereParser()
{
    this._lexer = new WhereLexer();
};

WhereParser.prototype.parse = function parse(source)
{
    var result = null;

    // clear current lexeme cache
    currentLexeme = null;

    // pass source to lexer
    this._lexer.setSource(source);

    // prime the lexeme pump
    this._lexer.advance();

    // parse it
    while (currentLexeme !== null)
    {
        // fast fail
        switch (currentLexeme.type)
        {
            case IDENTIFIER:
            case FALSE:
            case LPAREN:
            case NUMBER:
            case STRING:
            case TRUE:
                result = this.parseInExpression();
                break;

            default:
                throw new Error("Unrecognized starting token in where-clause:" + this._lexer.currentLexeme);
        }
    }
    return result;
};

WhereParser.prototype.parseInExpression = function parseInExpression()
{
    var result = this.parseOrExpression();

    while (currentLexeme !== null && currentLexeme.type === IN)
    {
        // advance over 'in'
        this._lexer.advance();

        var rhs = [];

        if (currentLexeme !== null && currentLexeme.type === LPAREN)
        {
            // advance over '('
            this._lexer.advance();

            while (currentLexeme !== null)
            {
                rhs.push(this.parseOrExpression());

                if (currentLexeme !== null && currentLexeme.type === COMMA)
                {
                    this._lexer.advance();
                }
                else
                {
                    break;
                }
            }

            if (currentLexeme !== null && currentLexeme.type === RPAREN)
            {
                this._lexer.advance();

                result = new BinaryOperatorNode(result, IN, rhs);
            }
            else
            {
                throw new Error("'in' list did not end with a right parenthesis." + currentLexeme);
            }
        }
        else
        {
            throw new Error("'in' list did not start with a left parenthesis");
        }
    }

    return result;
};

WhereParser.prototype.parseOrExpression = function parseOrExpression()
{
    var result = this.parseAndExpression();

    while (currentLexeme !== null && currentLexeme.type === OR)
    {
        // advance over 'or' or '||'
        this._lexer.advance();

        var rhs = this.parseAndExpression();

        result = new BinaryOperatorNode(result, OR, rhs);
    }

    return result;
};

WhereParser.prototype.parseAndExpression = function parseAndExpression()
{
    var result = this.parseEqualityExpression();

    while (currentLexeme !== null && currentLexeme.type === AND)
    {
        // advance over 'and' or '&&'
        this._lexer.advance();

        var rhs = this.parseEqualityExpression();

        result = new BinaryOperatorNode(result, AND, rhs);
    }

    return result;
};

WhereParser.prototype.parseEqualityExpression = function parseEqualityExpression()
{
    var result = this.parseRelationalExpression();

    if (currentLexeme !== null)
    {
        var type = currentLexeme.type;

        switch (type)
        {
            case EQUAL:
            case NOT_EQUAL:
                // advance over '=' or '!='
                this._lexer.advance();

                var rhs = this.parseRelationalExpression();

                result = new BinaryOperatorNode(result, type, rhs);
                break;
        }
    }

    return result;
};

WhereParser.prototype.parseRelationalExpression = function()
{
    var result = this.parseMemberExpression();

    if (currentLexeme !== null)
    {
        var type = currentLexeme.type;

        switch (type)
        {
            case LESS_THAN:
            case LESS_THAN_EQUAL:
            case GREATER_THAN:
            case GREATER_THAN_EQUAL:
                // advance over '<', '<=', '>' or '>='
                this._lexer.advance();

                var rhs = this.parseMemberExpression();

                result = new BinaryOperatorNode(result, type, rhs);
                break;
        }
    }

    return result;
};

WhereParser.prototype.parseMemberExpression = function parseMemberExpression()
{
    var result = null;

    if (currentLexeme !== null)
    {
        switch (currentLexeme.type)
        {
            case IDENTIFIER:
                result = new IdentifierNode(currentLexeme.text);
                // advance over identifier
                this._lexer.advance();

                if (currentLexeme !== null && currentLexeme.type === LPAREN)
                {
                    // this is a function
                    var name = result.identifier;
                    var args = [];

                    // advance over '('
                    this._lexer.advance();

                    // process arguments
                    while (currentLexeme !== null && currentLexeme.type !== RPAREN)
                    {
                        args.push(this.parseOrExpression());

                        if (currentLexeme !== null && currentLexeme.type === COMMA)
                        {
                            this._lexer.advance();
                        }
                    }

                    // advance over ')'
                    if (currentLexeme !== null)
                    {
                        this._lexer.advance();
                        result = new FunctionNode(name, args);
                    }
                    else
                    {
                        throw new Error("Function argument list was not closed with a right parenthesis.");
                    }
                }
                break;

            case TRUE:
                result = new ScalarNode(true);

                // advance over 'true'
                this._lexer.advance();
                break;

            case FALSE:
                result = new ScalarNode(false);

                // advance over 'false'
                this._lexer.advance();
                break;

            case NUMBER:
                result = new ScalarNode(currentLexeme.text - 0);

                // advance over number
                this._lexer.advance();
                break;

            case STRING:
                var text = currentLexeme.text;

                result = new ScalarNode(text.substring(1, text.length - 1));

                // advance over string
                this._lexer.advance();
                break;

            case LPAREN:
                // advance over '('
                this._lexer.advance();

                result = this.parseOrExpression();

                if (currentLexeme !== null && currentLexeme.type === RPAREN)
                {
                    // advance over ')'
                    this._lexer.advance();
                }
                else
                {
                    throw new Error("Missing closing right parenthesis: " + currentLexeme);
                }
                break;
        }
    }

    return result;
};


//})();

//ActiveRecord.WhereLexer = WhereLexer;
ActiveRecord.WhereParser = WhereParser;
var Finders = {
    mergeOptions: function mergeOptions(field_name, value, options)
    {
        if(!options){
            options = {};
        }
        options = ActiveSupport.Object.clone(options);
        if(options.where)
        {
            options.where[field_name] = value;
        }
        else
        {
            options.where = {};
            options.where[field_name] = value;
        }
        return options;
    },
    generateFindByField: function generateFindByField(klass, field_name)
    {
        klass['findBy' + ActiveSupport.String.camelize(field_name, true)] = ActiveSupport.Function.curry(function generated_find_by_field_delegator(klass, field_name, value, options){
            return klass.find(ActiveSupport.Object.extend(Finders.mergeOptions(field_name, value, options), {
                first: true
            }));
        }, klass, field_name);
    },
    generateFindAllByField: function generateFindAllByField(klass, field_name)
    {
        klass['findAllBy' + ActiveSupport.String.camelize(field_name, true)] = ActiveSupport.Function.curry(function generated_find_all_by_field_delegator(klass, field_name, value, options){
            return klass.find(ActiveSupport.Object.extend(Finders.mergeOptions(field_name, value, options), {
                all: true
            }));
        }, klass, field_name);
    }
};
ActiveRecord.Finders = Finders;
var Indicies = {
    initializeIndicies: function initializeIndicies(storage)
    {
        var model_name, model, table_name, index_name, index, index_callbacks, id;
        for(model_name in ActiveRecord.Models)
        {
            model = ActiveRecord.Models[model_name];
            if(model.indexingCallbacks)
            {
                table_name = model.tableName;
                for(index_name in model.indexingCallbacks)
                {
                    index = model.indexed[index_name];
                    index_callbacks = model.indexingCallbacks[index_name];
                    for(id in storage[table_name])
                    {
                        index_callbacks.afterSave(index,storage[table_name][id]);
                    }
                }
            }
        }

    }
};

/**
 * ActiveRecord.Model.addIndex(name,index,callbacks) -> null
 * - index_name (name)
 * - index (Object)
 * - callbacks (Object): Must contain "afterSave" and "afterDestroy" keys containing callback functions.
 *
 * Allows the construction of arbitrary data indicies from data in your models.
 * Indicies will stay up to date as records are created, saved or destroyed.
 *
 * The afterSave and afterDestroy objects will only receive the data for a
 * given record (generated with instance.toObject()). The afterSave callback
 * will handle both the create and update scenarios.
 *
 *     Photo.addIndex('byName',{},{
 *         afterSave: function(index,photo){
 *             index[photo.name] = photo.id;
 *         },
 *         afterDestroy: function(index,photo){
 *             delete index[photo.name];
 *         }
 *     });
 *     var flower_record = Photo.create({name:'flower'});
 *     Photo.indexed.byName.flower == flower_record;
 *
 * If you only need and index of key => id pairs (name => id pairs in the
 * example above), you can shorten the call to the following:
 *
 *     Photo.addIndex('byName','name'):
 *
 * A more complicated example, which pre fills an index object:
 *
 *     var index = {a:{},b:{},c:{}};
 *
 *     Contact.addIndex('byLetter',index,{
 *         afterSave: function(index,contact){
 *             var first_letter = contact.name.substring(0,1).toLowerCase();
 *             index[first_letter][contact.id] = contact;
 *         },
 *         afterDestroy: function(index,contact){
 *             var first_letter = contact.name.substring(0,1).toLowerCase();
 *             delete index[first_letter][contact.id];
 *         }
 *     });
 *
 *     //the index will now be available at:
 *     Contact.indexed.byLetter;
 *
 *     Contact.create({name: 'Abbey'});
 *
 *     for(var id in Contact.indexed.byLetter.a){}
 **/
ActiveRecord.ClassMethods.addIndex = function addIndex(name,index,callbacks)
{
    if(!callbacks)
    {
        if(typeof(index) == 'string')
        {
            var key_name = index;
            index = {};
            callbacks = {
                afterSave: function afterSaveIndexCallback(index,item){
                    index[item[key_name]] = item.id;
                },
                afterDestroy: function afterDestroyIndexCallback(index,item){
                    delete index[item[key_name]];
                }
            };
        }
        else
        {
            callbacks = index;
            index = {};
        }
    }
    if(!this.indexed)
    {
        this.indexed = {};
    }
    if(!this.indexingCallbacks)
    {
        this.indexingCallbacks = {};
    }
    if(!this.indexingCallbackObservers)
    {
        this.indexingCallbackObservers = {};
    }
    this.indexed[name] = index || {};
    this.indexingCallbacks[name] = callbacks;
    this.indexingCallbackObservers[name] = {};
    this.indexingCallbackObservers[name].afterSave = this.observe('afterSave',ActiveSupport.Function.bind(function afterSaveIndexObserver(instance){
        callbacks.afterSave(this.indexed[name],instance.toObject());
    },this));
    this.indexingCallbackObservers[name].afterDestroy = this.observe('afterDestroy',ActiveSupport.Function.bind(function afterDestroyIndexObserver(instance){
        callbacks.afterDestroy(this.indexed[name],instance.toObject());
    },this));
};

/**
 * ActiveRecord.Model.removeIndex(index_name) -> null
 **/
ActiveRecord.ClassMethods.removeIndex = function removeIndex(name)
{
    this.stopObserving('afterSave',this.indexingCallbackObservers[name].afterSave);
    this.stopObserving('afterDestroy',this.indexingCallbackObservers[name].afterDestroy);
    delete this.indexingCallbacks[name];
    delete this.indexed[name];
};

ActiveRecord.Indicies = Indicies;
/**
 * class ActiveRecord.ResultSet
 * When using any finder method, the returned array will be extended
 * with the methods in this namespace. A returned result set is still
 * an instance of Array.
 **/
var ResultSet = {};

ResultSet.InstanceMethods = {
    /**
     * ActiveRecord.ResultSet#reload() -> null
     * Re-runs the query that generated the result set. This modifies the
     * array in place and does not return a new array.
     **/
    reload: function reload(result_set,params,model){
        result_set.length = 0;
        var new_response = model.find(ActiveSupport.Object.extend(ActiveSupport.Object.clone(params)));
        for(var i = 0; i < new_response.length; ++i)
        {
            result_set.push(new_response[i]);
        }
    },
    /**
     * ActiveRecord.ResultSet#toArray() -> Array
     * Builds an array calling toObject() on each instance in the result
     * set, thus reutrning a vanilla array of vanilla objects.
     **/
    toArray: function toArray(result_set,params,model)
    {
        var items = [];
        for(var i = 0; i < result_set.length; ++i)
        {
            items.push(result_set[i].toObject());
        }
        return items;
    },
    /**
     * ActiveRecord.ResultSet#toJSON() -> String
     **/
    toJSON: function toJSON(result_set,params,model)
    {
        var items = [];
        for(var i = 0; i < result_set.length; ++i)
        {
            items.push(result_set[i].toSerializableObject());
        }
        return ActiveSupport.JSON.stringify(items);
    }
};
var Relationships = {
    normalizeModelName: function(related_model_name)
    {
        var plural = ActiveSupport.String.camelize(related_model_name, true);
        var singular = ActiveSupport.String.camelize(ActiveSupport.String.singularize(plural) || plural,true);
        return singular || plural;
    },
    normalizeForeignKey: function(foreign_key, related_model_name)
    {
        var plural = ActiveSupport.String.underscore(related_model_name).toLowerCase();
        var singular = ActiveSupport.String.singularize(plural) || plural;
        if (!foreign_key || typeof(foreign_key) === 'undefined')
        {
            return (singular || plural) + '_id';
        }
        else
        {
            return foreign_key;
        }
    }
};
ActiveRecord.Relationships = Relationships;
/**
 * ActiveRecord.Model.hasOne(related_model_name[,options]) -> null
 * Sepcifies a 1->1 relationship between models. The foreign key will reside in the related object.
 * - related_model_name (String): Can be a plural or singular referring to the related table, the model name, or a reference to the model itself ("users","User" or User would all work).
 * - options (Object)
 *
 * Options can contain:
 *
 * - foreignKey (String)
 * - name (String)
 * - dependent (Boolean)
 *
 *     User.hasOne(CreditCard);
 *     var u = User.find(5);
 *     //each User instance will gain the following 3 methods
 *     u.getCreditCard()
 *     u.buildCreditCard()
 *     u.createCreditCard()
 **/
ActiveRecord.ClassMethods.hasOne = function hasOne(related_model_name, options)
{
    this.relationships.push(['hasOne',related_model_name,options]);
    if(related_model_name && related_model_name.modelName)
    {
        related_model_name = related_model_name.modelName;
    }
    if(!options)
    {
        options = {};
    }
    related_model_name = Relationships.normalizeModelName(related_model_name);
    var relationship_name = options.name ? Relationships.normalizeModelName(options.name) : related_model_name;
    var foreign_key = Relationships.normalizeForeignKey(options.foreignKey, Relationships.normalizeModelName(related_model_name));
    var class_methods = {};
    var instance_methods = {};
    instance_methods['get' + relationship_name] = ActiveSupport.Function.curry(function getRelated(related_model_name, foreign_key){
        var id = this.get(foreign_key);
        if (id)
        {
            return ActiveRecord.Models[related_model_name].find(id);
        }
        else
        {
            return false;
        }
    }, related_model_name, foreign_key);
    class_methods['build' + relationship_name] = instance_methods['build' + relationship_name] = ActiveSupport.Function.curry(function buildRelated(related_model_name, foreign_key, params){
        return ActiveRecord.Models[related_model_name].build(params || {});
    }, related_model_name, foreign_key);
    instance_methods['create' + relationship_name] = ActiveSupport.Function.curry(function createRelated(related_model_name, foreign_key, params){
        var record = ActiveRecord.Models[related_model_name].create(params || {});
        if(this.get(this.constructor.primaryKeyName))
        {
            this.updateAttribute(foreign_key, record.get(record.constructor.primaryKeyName));
        }
        return record;
    }, related_model_name, foreign_key);
    ActiveSupport.Object.extend(this.prototype, instance_methods);
    ActiveSupport.Object.extend(this, class_methods);

    //dependent
    if(options.dependent)
    {
        this.observe('afterDestroy',function destroyRelatedDependent(record){
            var child = record['get' + relationship_name]();
            if(child)
            {
                child.destroy();
            }
        });
    }
};
/**
 * ActiveRecord.Model.hasMany(related_model_name[,options]) -> null
 * Sepcifies a 1->N relationship between models. The foreign key will reside in the child (related) object.
 * - related_model_name (String): Can be a plural or singular referring to the related table, the model name, or a reference to the model itself ("users","User" or User would all work).
 * - options (Object)
 *
 * Options can contain:
 *
 * - foreignKey (String)
 * - name (String)
 * - dependent (Boolean)
 * - order (String)
 * - where (String)
 *
 *     User.hasMany('comments',{
 *         dependent: true
 *     });
 *     var u = User.find(5);
 *     //each User instance will gain the following 5 methods
 *     u.createComment()
 *     u.buildComment()
 *     u.destroyComment()
 *     u.getCommentList() //takes the same options as find()
 *     u.getCommentCount() //takes the same options as count()
 **/
ActiveRecord.ClassMethods.hasMany = function hasMany(related_model_name, options)
{
    this.relationships.push(['hasMany',related_model_name,options]);
    if(related_model_name && related_model_name.modelName)
    {
        related_model_name = related_model_name.modelName;
    }
    if(!options)
    {
        options = {};
    }
    related_model_name = Relationships.normalizeModelName(related_model_name);
    var relationship_name = options.name ? Relationships.normalizeModelName(options.name) : related_model_name;
    var original_related_model_name = related_model_name;
    var foreign_key = Relationships.normalizeForeignKey(options.foreignKey, Relationships.normalizeModelName(this.modelName));
    var class_methods = {};
    var instance_methods = {};

    if(options.through)
    {
        var through_model_name = Relationships.normalizeModelName(options.through);
        instance_methods['get' + relationship_name + 'List'] = ActiveSupport.Function.curry(function getRelatedListForThrough(through_model_name, related_model_name, foreign_key, params){
            var related_list = this['get' + through_model_name + 'List']();
            var ids = [];
            var response = [];
            for(var i = 0; i < related_list.length; ++i)
            {
                response.push(related_list[i]['get' + related_model_name]());
            }
            return response;
        }, through_model_name, related_model_name, foreign_key);

        instance_methods['get' + relationship_name + 'Count'] = ActiveSupport.Function.curry(function getRelatedCountForThrough(through_model_name, related_model_name, foreign_key, params){
            if(!params)
            {
                params = {};
            }
            if(!params.where)
            {
                params.where = {};
            }
            params.where[foreign_key] = this.get(this.constructor.primaryKeyName);
            return ActiveRecord.Models[through_model_name].count(params);
        }, through_model_name, related_model_name, foreign_key);
    }
    else
    {
        instance_methods['destroy' + relationship_name] = class_methods['destroy' + relationship_name] = ActiveSupport.Function.curry(function destroyRelated(related_model_name, foreign_key, params){
            var record = ActiveRecord.Models[related_model_name].find((params && typeof(params.get) === 'function') ? params.get(params.constructor.primaryKeyName) : params);
            if (record)
            {
                return record.destroy();
            }
            else
            {
                return false;
            }
        }, related_model_name, foreign_key);

        instance_methods['get' + relationship_name + 'List'] = ActiveSupport.Function.curry(function getRelatedList(related_model_name, foreign_key, params){
            var id = this.get(this.constructor.primaryKeyName);
            if(!id)
            {
                return this.constructor.resultSetFromArray([]);
            }
            if(!params)
            {
                params = {};
            }
            if(options.order && !('order' in params))
            {
                params.order = options.order;
            }
            if(!params.where)
            {
                params.where = {};
            }
            params.where[foreign_key] = id;
            params.all = true;
            return ActiveRecord.Models[related_model_name].find(params);
        }, related_model_name, foreign_key);

        instance_methods['get' + relationship_name + 'Count'] = ActiveSupport.Function.curry(function getRelatedCount(related_model_name, foreign_key, params){
            var id = this.get(this.constructor.primaryKeyName);
            if(!id)
            {
                return 0;
            }
            if(!params)
            {
                params = {};
            }
            if(!params.where)
            {
                params.where = {};
            }
            params.where[foreign_key] = id;
            return ActiveRecord.Models[related_model_name].count(params);
        }, related_model_name, foreign_key);

        instance_methods['build' + relationship_name] = ActiveSupport.Function.curry(function buildRelated(related_model_name, foreign_key, params){
            var id = this.get(this.constructor.primaryKeyName);
            if(!params)
            {
                params = {};
            }
            params[foreign_key] = id;
            return ActiveRecord.Models[related_model_name].build(params);
        }, related_model_name, foreign_key);

        instance_methods['create' + relationship_name] = ActiveSupport.Function.curry(function createRelated(related_model_name, foreign_key, params){
            var id = this.get(this.constructor.primaryKeyName);
            if(!params)
            {
                params = {};
            }
            params[foreign_key] = id;
            return ActiveRecord.Models[related_model_name].create(params);
        }, related_model_name, foreign_key);
    }

    ActiveSupport.Object.extend(this.prototype, instance_methods);
    ActiveSupport.Object.extend(this, class_methods);

    //dependent
    if(options.dependent)
    {
        this.observe('afterDestroy', function destroyDependentChildren(record){
            var list = record['get' + relationship_name + 'List']();
            if(ActiveRecord.logging)
            {
                ActiveSupport.log('Relationships.hasMany destroy ' + list.length + ' dependent ' + related_model_name + ' children of ' + record.modelName);
            }
            for(var i = 0; i < list.length; ++i)
            {
                list[i].destroy();
            }
        });
    }
};
/**
 * ActiveRecord.Model.belongsTo(related_model_name[,options]) -> null
 * Sepcifies a 1<-1 relationship between models. The foreign key will reside in the declaring object.
 * - related_model_name (String): Can be a plural or singular referring to the related table, the model name, or a reference to the model itself ("users","User" or User would all work).
 * - options (Object)
 *
 * Options can contain:
 *
 * - foreignKey (String)
 * - name (String)
 * - counter (String)
 *
 *     Comment.belongsTo('User',{
 *         counter: 'comment_count' //comment count must be a column in User
 *     });
 *     var c = Comment.find(5);
 *     //each Comment instance will gain the following 3 methods
 *     c.getUser()
 *     c.buildUser()
 *     c.createUser()
 **/
ActiveRecord.ClassMethods.belongsTo = function belongsTo(related_model_name, options)
{
    this.relationships.push(['belongsTo',related_model_name,options]);
    if(related_model_name && related_model_name.modelName)
    {
        related_model_name = related_model_name.modelName;
    }
    if(!options)
    {
        options = {};
    }
    related_model_name = Relationships.normalizeModelName(related_model_name);
    var relationship_name = options.name ? Relationships.normalizeModelName(options.name) : related_model_name;
    var foreign_key = Relationships.normalizeForeignKey(options.foreignKey, related_model_name);
    var class_methods = {};
    var instance_methods = {};
    instance_methods['get' + relationship_name] = ActiveSupport.Function.curry(function getRelated(related_model_name,foreign_key){
        var id = this.get(foreign_key);
        if (id)
        {
            return ActiveRecord.Models[related_model_name].find(id);
        }
        else
        {
            return false;
        }
    }, related_model_name, foreign_key);
    instance_methods['build' + relationship_name] = class_methods['build' + relationship_name] = ActiveSupport.Function.curry(function buildRelated(related_model_name, foreign_key, params){
        var record = ActiveRecord.Models[related_model_name].build(params || {});
        if(options.counter)
        {
            record[options.counter] = 1;
        }
        return record;
    }, related_model_name, foreign_key);
    instance_methods['create' + relationship_name] = ActiveSupport.Function.curry(function createRelated(related_model_name, foreign_key, params){
        var record = this['build' + related_model_name](params);
        if(record.save() && this.get(this.constructor.primaryKeyName))
        {
            this.updateAttribute(foreign_key, record.get(record.constructor.primaryKeyName));
        }
        return record;
    }, related_model_name, foreign_key);
    ActiveSupport.Object.extend(this.prototype, instance_methods);
    ActiveSupport.Object.extend(this, class_methods);

    //counter
    if(options.counter)
    {
        this.observe('afterDestroy', function decrementBelongsToCounter(record){
            var child = record['get' + relationship_name]();
            if(child)
            {
                var current_value = child.get(options.counter);
                if(typeof(current_value) === 'undefined')
                {
                    current_value = 0;
                }
                child.updateAttribute(options.counter, Math.max(0, parseInt(current_value, 10) - 1));
            }
        });
        this.observe('afterCreate', function incrementBelongsToCounter(record){
            var child = record['get' + relationship_name]();
            if(child)
            {
                var current_value = child.get(options.counter);
                if(typeof(current_value) === 'undefined')
                {
                    current_value = 0;
                }
                child.updateAttribute(options.counter, parseInt(current_value, 10) + 1);
            }
        });
    }
};
ActiveSupport.Object.extend(ActiveRecord.ClassMethods,{
    /**
     * ActiveRecord.Model.addValidator(callback) -> null
     * Adds the validator to the _validators array of a given ActiveRecord.Model.
     **/
    addValidator: function addValidator(validator)
    {
        if(!this._validators)
        {
            this._validators = [];
        }
        this._validators.push(validator);
    },
    /**
     * ActiveRecord.Model.validatesPresenceOf(field_name[,options]) -> null
     **/
    validatesPresenceOf: function validatesPresenceOf(field, options)
    {
        options = ActiveSupport.Object.extend({

        },options || {});
        this.addValidator(function validates_presence_of_callback(){
            if(!this.get(field) || this.get(field) === '')
            {
                this.addError(options.message || (field + ' is not present.'),field);
            }
        });
    },
    /**
     * ActiveRecord.Model.validatesLengthOf(field_name[,options]) -> null
     * Accepts "min" and "max" numbers as options.
     **/
    validatesLengthOf: function validatesLengthOf(field, options)
    {
        options = ActiveSupport.Object.extend({
            min: 1,
            max: 9999
        },options || {});
        //will run in scope of an ActiveRecord instance
        this.addValidator(function validates_length_of_callback(){
            var value = String(this.get(field));
            if (value.length < options.min)
            {
                this.addError(options.message || (field + ' is too short.'),field);
            }
            if (value.length > options.max)
            {
                this.addError(options.message || (field + ' is too long.'),field);
            }
        });
    }
});
ActiveSupport.Object.extend(ActiveRecord.InstanceMethods,{
    /**
     * ActiveRecord.Model#addError(message[,field_name]) -> null
     **/
    addError: function addError(str, field)
    {
        var error = null;
        if(field)
        {
            error = [str,field];
            error.toString = function toString()
            {
                return field ? field + ": " + str : str;
            };
        }
        else
        {
            error = str;
        }
        this._errors.push(error);
    },
    isValid: function isValid()
    {
        return this._errors.length === 0;
    },
    _validate: function _validate()
    {
        this._errors = [];
        var validators = this.getValidators();
        for (var i = 0; i < validators.length; ++i)
        {
            validators[i].apply(this);
        }
        if (typeof(this.validate) === 'function')
        {
            this.validate();
        }
        if(ActiveRecord.logging)
        {
            ActiveSupport.log('ActiveRecord.validate() ' + String(this._errors.length === 0) + (this._errors.length > 0 ? '. Errors: ' + String(this._errors) : ''));
        }
        return this._errors.length === 0;
    },
    getValidators: function getValidators()
    {
        return this.constructor._validators || [];
    },
    /**
     * ActiveRecord.Model#getErrors() -> Array
     **/
    getErrors: function getErrors()
    {
        return this._errors;
    }
});

})();
/** * SWFAddress 2.4: Deep linking for Flash and Ajax <http://www.asual.com/swfaddress/> * * SWFAddress is (c) 2006-2009 Rostislav Hristov and contributors * This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> * */if (typeof asual == "undefined") {    var asual = {}}if (typeof asual.util == "undefined") {    asual.util = {}}asual.util.Browser = newfunction () {    var b = navigator.userAgent.toLowerCase(),        a = /webkit/.test(b),        e = /opera/.test(b),        c = /msie/.test(b) && !/opera/.test(b),        d = /mozilla/.test(b) && !/(compatible|webkit)/.test(b),        f = parseFloat(c ? b.substr(b.indexOf("msie") + 4) : (b.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [0, "0"])[1]);    this.toString = function () {        return "[class Browser]"    };    this.getVersion = function () {        return f    };    this.isMSIE = function () {        return c    };    this.isSafari = function () {        return a    };    this.isOpera = function () {        return e    };    this.isMozilla = function () {        return d    }};asual.util.Events = newfunction () {    var c = "DOMContentLoaded",        j = "onstop",        k = window,        h = document,        b = [],        a = asual.util,        e = a.Browser,        d = e.isMSIE(),        g = e.isSafari();    this.toString = function () {        return "[class Events]"    };    this.addListener = function (n, l, m) {        b.push({            o: n,            t: l,            l: m        });        if (! (l == c && (d || g))) {            if (n.addEventListener) {                n.addEventListener(l, m, false)            } else {                if (n.attachEvent) {                    n.attachEvent("on" + l, m)                }            }        }    };    this.removeListener = function (p, m, n) {        for (var l = 0, o; o = b[l]; l++) {            if (o.o == p && o.t == m && o.l == n) {                b.splice(l, 1);                break            }        }        if (! (m == c && (d || g))) {            if (p.removeEventListener) {                p.removeEventListener(m, n, false)            } else {                if (p.detachEvent) {                    p.detachEvent("on" + m, n)                }            }        }    };    var i = function () {        for (var m = 0, l; l = b[m]; m++) {            if (l.t != c) {                a.Events.removeListener(l.o, l.t, l.l)            }        }    };    var f = function () {        if (h.readyState == "interactive") {            function l() {                h.detachEvent(j, l);                i()            }            h.attachEvent(j, l);            k.setTimeout(function () {                h.detachEvent(j, l)            },            0)        }    };    if (d || g) {        (function () {            try {                if ((d && h.body) || !/loaded|complete/.test(h.readyState)) {                    h.documentElement.doScroll("left")                }            } catch(m) {                return setTimeout(arguments.callee, 0)            }            for (var l = 0, m; m = b[l]; l++) {                if (m.t == c) {                    m.l.call(null)                }            }        })()    }    if (d) {        k.attachEvent("onbeforeunload", f)    }    this.addListener(k, "unload", i)};asual.util.Functions = newfunction () {    this.toString = function () {        return "[class Functions]"    };    this.bind = function (f, b, e) {        for (var c = 2, d, a = []; d = arguments[c]; c++) {            a.push(d)        }        return function () {            return f.apply(b, a)        }    }};var SWFAddressEvent = function (d) {    this.toString = function () {        return "[object SWFAddressEvent]"    };    this.type = d;    this.target = [SWFAddress][0];    this.value = SWFAddress.getValue();    this.path = SWFAddress.getPath();    this.pathNames = SWFAddress.getPathNames();    this.parameters = {};    var c = SWFAddress.getParameterNames();    for (var b = 0, a = c.length; b < a; b++) {        this.parameters[c[b]] = SWFAddress.getParameter(c[b])    }    this.parameterNames = c};SWFAddressEvent.INIT = "init";SWFAddressEvent.CHANGE = "change";SWFAddressEvent.INTERNAL_CHANGE = "internalChange";SWFAddressEvent.EXTERNAL_CHANGE = "externalChange";var SWFAddress = newfunction () {    var _getHash = function () {        var index = _l.href.indexOf("#");        return index != -1 ? _ec(_dc(_l.href.substr(index + 1))) : ""    };    var _getWindow = function () {        try {            top.document;            return top        } catch(e) {            return window        }    };    var _strictCheck = function (value, force) {        if (_opts.strict) {            value = force ? (value.substr(0, 1) != "/" ? "/" + value : value) : (value == "" ? "/" : value)        }        return value    };    var _ieLocal = function (value, direction) {        return (_msie && _l.protocol == "file:") ? (direction ? _value.replace(/\?/, "%3F") : _value.replace(/%253F/, "?")) : value    };    var _searchScript = function (el) {        if (el.childNodes) {            for (var i = 0, l = el.childNodes.length, s; i < l; i++) {                if (el.childNodes[i].src) {                    _url = String(el.childNodes[i].src)                }                if (s = _searchScript(el.childNodes[i])) {                    return s                }            }        }    };    var _titleCheck = function () {        if (_d.title != _title && _d.title.indexOf("#") != -1) {            _d.title = _title        }    };    var _listen = function () {        if (!_silent) {            var hash = _getHash();            var diff = !(_value == hash);            if (_safari && _version < 523) {                if (_length != _h.length) {                    _length = _h.length;                    if (typeof _stack[_length - 1] != UNDEFINED) {                        _value = _stack[_length - 1]                    }                    _update.call(this, false)                }            } else {                if (_msie && diff) {                    if (_version < 7) {                        _l.reload()                    } else {                        this.setValue(hash)                    }                } else {                    if (diff) {                        _value = hash;                        _update.call(this, false)                    }                }            }            if (_msie) {                _titleCheck.call(this)            }        }    };    var _bodyClick = function (e) {        if (_popup.length > 0) {            var popup = window.open(_popup[0], _popup[1], eval(_popup[2]));            if (typeof _popup[3] != UNDEFINED) {                eval(_popup[3])            }        }        _popup = []    };    var _swfChange = function () {        for (var i = 0, id, obj, value = SWFAddress.getValue(), setter = "setSWFAddressValue"; id = _ids[i]; i++) {            obj = document.getElementById(id);            if (obj) {                if (obj.parentNode && typeof obj.parentNode.so != UNDEFINED) {                    obj.parentNode.so.call(setter, value)                } else {                    if (! (obj && typeof obj[setter] != UNDEFINED)) {                        var objects = obj.getElementsByTagName("object");                        var embeds = obj.getElementsByTagName("embed");                        obj = ((objects[0] && typeof objects[0][setter] != UNDEFINED) ? objects[0] : ((embeds[0] && typeof embeds[0][setter] != UNDEFINED) ? embeds[0] : null))                    }                    if (obj) {                        obj[setter](value)                    }                }            } else {                if (obj = document[id]) {                    if (typeof obj[setter] != UNDEFINED) {                        obj[setter](value)                    }                }            }        }    };    var _jsDispatch = function (type) {        this.dispatchEvent(new SWFAddressEvent(type));        type = type.substr(0, 1).toUpperCase() + type.substr(1);        if (typeof this["on" + type] == FUNCTION) {            this["on" + type]()        }    };    var _jsInit = function () {        if (_util.Browser.isSafari()) {            _d.body.addEventListener("click", _bodyClick)        }        _jsDispatch.call(this, "init")    };    var _jsChange = function () {        _swfChange();        _jsDispatch.call(this, "change")    };    var _update = function (internal) {        _jsChange.call(this);        if (internal) {            _jsDispatch.call(this, "internalChange")        } else {            _jsDispatch.call(this, "externalChange")        }        _st(_functions.bind(_track, this), 10)    };    var _track = function () {        var value = (_l.pathname + (/\/$/.test(_l.pathname) ? "" : "/") + this.getValue()).replace(/\/\//, "/").replace(/^\/$/, "");        var fn = _t[_opts.tracker];        if (typeof fn == FUNCTION) {            fn(value)        } else {            if (typeof _t.pageTracker != UNDEFINED && typeof _t.pageTracker._trackPageview == FUNCTION) {                _t.pageTracker._trackPageview(value)            } else {                if (typeof _t.urchinTracker == FUNCTION) {                    _t.urchinTracker(value)                }            }        }    };    var _htmlWrite = function () {        var doc = _frame.contentWindow.document;        doc.open();        doc.write("<html><head><title>" + _d.title + "</title><script>var " + ID + ' = "' + _getHash() + '";<\/script></head></html>');        doc.close()    };    var _htmlLoad = function () {        var win = _frame.contentWindow;        var src = win.location.href;        _value = (typeof win[ID] != UNDEFINED ? win[ID] : "");        if (_value != _getHash()) {            _update.call(SWFAddress, false);            _l.hash = _ieLocal(_value, TRUE)        }    };    var _load = function () {        if (!_loaded) {            _loaded = TRUE;            if (_msie && _version < 8) {                var frameset = _d.getElementsByTagName("frameset")[0];                _frame = _d.createElement((frameset ? "" : "i") + "frame");                if (frameset) {                    frameset.insertAdjacentElement("beforeEnd", _frame);                    frameset[frameset.cols ? "cols" : "rows"] += ",0";                    _frame.src = "javascript:false";                    _frame.noResize = true;                    _frame.frameBorder = _frame.frameSpacing = 0                } else {                    _frame.src = "javascript:false";                    _frame.style.display = "none";                    _d.body.insertAdjacentElement("afterBegin", _frame)                }                _st(function () {                    _events.addListener(_frame, "load", _htmlLoad);                    if (typeof _frame.contentWindow[ID] == UNDEFINED) {                        _htmlWrite()                    }                },                50)            } else {                if (_safari) {                    if (_version < 418) {                        _d.body.innerHTML += '<form id="' + ID + '" style="position:absolute;top:-9999px;" method="get"></form>';                        _form = _d.getElementById(ID)                    }                    if (typeof _l[ID] == UNDEFINED) {                        _l[ID] = {}                    }                    if (typeof _l[ID][_l.pathname] != UNDEFINED) {                        _stack = _l[ID][_l.pathname].split(",")                    }                }            }            _st(_functions.bind(function () {                _jsInit.call(this);                _jsChange.call(this);                _track.call(this)            },            this), 1);            if (_msie && _version >= 8) {                _d.body.onhashchange = _functions.bind(_listen, this);                _si(_functions.bind(_titleCheck, this), 50)            } else {                _si(_functions.bind(_listen, this), 50)            }        }    };    var ID = "swfaddress",        FUNCTION = "function",        UNDEFINED = "undefined",        TRUE = true,        FALSE = false,        _util = asual.util,        _browser = _util.Browser,        _events = _util.Events,        _functions = _util.Functions,        _version = _browser.getVersion(),        _msie = _browser.isMSIE(),        _mozilla = _browser.isMozilla(),        _opera = _browser.isOpera(),        _safari = _browser.isSafari(),        _supported = FALSE,        _t = _getWindow(),        _d = _t.document,        _h = _t.history,        _l = _t.location,        _si = setInterval,        _st = setTimeout,        _dc = decodeURI,        _ec = encodeURI,        _frame, _form, _url, _title = _d.title,        _length = _h.length,        _silent = FALSE,        _loaded = FALSE,        _justset = TRUE,        _juststart = TRUE,        _ref = this,        _stack = [],        _ids = [],        _popup = [],        _listeners = {},        _value = _getHash(),        _opts = {        history: TRUE,        strict: TRUE    };    if (_msie && _d.documentMode && _d.documentMode != _version) {        _version = _d.documentMode != 8 ? 7 : 8    }    _supported = (_mozilla && _version >= 1) || (_msie && _version >= 6) || (_opera && _version >= 9.5) || (_safari && _version >= 312);    if (_supported) {        if (_opera) {            history.navigationMode = "compatible"        }        for (var i = 1; i < _length; i++) {            _stack.push("")        }        _stack.push(_getHash());        if (_msie && _l.hash != _getHash()) {            _l.hash = "#" + _ieLocal(_getHash(), TRUE)        }        _searchScript(document);        var _qi = _url ? _url.indexOf("?") : -1;        if (_qi != -1) {            var param, params = _url.substr(_qi + 1).split("&");            for (var i = 0, p; p = params[i]; i++) {                param = p.split("=");                if (/^(history|strict)$/.test(param[0])) {                    _opts[param[0]] = (isNaN(param[1]) ? /^(true|yes)$/i.test(param[1]) : (parseInt(param[1]) != 0))                }                if (/^tracker$/.test(param[0])) {                    _opts[param[0]] = param[1]                }            }        }        if (_msie) {            _titleCheck.call(this)        }        if (window == _t) {            _events.addListener(document, "DOMContentLoaded", _functions.bind(_load, this))        }        _events.addListener(_t, "load", _functions.bind(_load, this))    } else {        if ((!_supported && _l.href.indexOf("#") != -1) || (_safari && _version < 418 && _l.href.indexOf("#") != -1 && _l.search != "")) {            _d.open();            _d.write('<html><head><meta http-equiv="refresh" content="0;url=' + _l.href.substr(0, _l.href.indexOf("#")) + '" /></head></html>');            _d.close()        } else {            _track()        }    }    this.toString = function () {        return "[class SWFAddress]"    };    this.back = function () {        _h.back()    };    this.forward = function () {        _h.forward()    };    this.up = function () {        var path = this.getPath();        this.setValue(path.substr(0, path.lastIndexOf("/", path.length - 2) + (path.substr(path.length - 1) == "/" ? 1 : 0)))    };    this.go = function (delta) {        _h.go(delta)    };    this.href = function (url, target) {        target = typeof target != UNDEFINED ? target : "_self";        if (target == "_self") {            self.location.href = url        } else {            if (target == "_top") {                _l.href = url            } else {                if (target == "_blank") {                    window.open(url)                } else {                    _t.frames[target].location.href = url                }            }        }    };    this.popup = function (url, name, options, handler) {        try {            var popup = window.open(url, name, eval(options));            if (typeof handler != UNDEFINED) {                eval(handler)            }        } catch(ex) {}        _popup = arguments    };    this.getIds = function () {        return _ids    };    this.getId = function (index) {        return _ids[0]    };    this.setId = function (id) {        _ids[0] = id    };    this.addId = function (id) {        this.removeId(id);        _ids.push(id)    };    this.removeId = function (id) {        for (var i = 0; i < _ids.length; i++) {            if (id == _ids[i]) {                _ids.splice(i, 1);                break            }        }    };    this.addEventListener = function (type, listener) {        if (typeof _listeners[type] == UNDEFINED) {            _listeners[type] = []        }        _listeners[type].push(listener)    };    this.removeEventListener = function (type, listener) {        if (typeof _listeners[type] != UNDEFINED) {            for (var i = 0, l; l = _listeners[type][i]; i++) {                if (l == listener) {                    break                }            }            _listeners[type].splice(i, 1)        }    };    this.dispatchEvent = function (event) {        if (this.hasEventListener(event.type)) {            event.target = this;            for (var i = 0, l; l = _listeners[event.type][i]; i++) {                l(event)            }            return TRUE        }        return FALSE    };    this.hasEventListener = function (type) {        return (typeof _listeners[type] != UNDEFINED && _listeners[type].length > 0)    };    this.getBaseURL = function () {        var url = _l.href;        if (url.indexOf("#") != -1) {            url = url.substr(0, url.indexOf("#"))        }        if (url.substr(url.length - 1) == "/") {            url = url.substr(0, url.length - 1)        }        return url    };    this.getStrict = function () {        return _opts.strict    };    this.setStrict = function (strict) {        _opts.strict = strict    };    this.getHistory = function () {        return _opts.history    };    this.setHistory = function (history) {        _opts.history = history    };    this.getTracker = function () {        return _opts.tracker    };    this.setTracker = function (tracker) {        _opts.tracker = tracker    };    this.getTitle = function () {        return _d.title    };    this.setTitle = function (title) {        if (!_supported) {            return null        }        if (typeof title == UNDEFINED) {            return        }        if (title == "null") {            title = ""        }        title = _dc(title);        _st(function () {            _title = _d.title = title;            if (_juststart && _frame && _frame.contentWindow && _frame.contentWindow.document) {                _frame.contentWindow.document.title = title;                _juststart = FALSE            }            if (!_justset && _mozilla) {                _l.replace(_l.href.indexOf("#") != -1 ? _l.href : _l.href + "#")            }            _justset = FALSE        },        10)    };    this.getStatus = function () {        return _t.status    };    this.setStatus = function (status) {        if (!_supported) {            return null        }        if (typeof status == UNDEFINED) {            return        }        if (status == "null") {            status = ""        }        status = _dc(status);        if (!_safari) {            status = _strictCheck((status != "null") ? status : "", TRUE);            if (status == "/") {                status = ""            }            if (! (/http(s)?:\/\//.test(status))) {                var index = _l.href.indexOf("#");                status = (index == -1 ? _l.href : _l.href.substr(0, index)) + "#" + status            }            _t.status = status        }    };    this.resetStatus = function () {        _t.status = ""    };    this.getValue = function () {        if (!_supported) {            return null        }        return _dc(_strictCheck(_ieLocal(_value, FALSE), FALSE))    };    this.setValue = function (value) {        if (!_supported) {            return null        }        if (typeof value == UNDEFINED) {            return        }        if (value == "null") {            value = ""        }        value = _ec(_dc(_strictCheck(value, TRUE)));        if (value == "/") {            value = ""        }        if (_value == value) {            return        }        _justset = TRUE;        _value = value;        _silent = TRUE;        _update.call(SWFAddress, true);        _stack[_h.length] = _value;        if (_safari) {            if (_opts.history) {                _l[ID][_l.pathname] = _stack.toString();                _length = _h.length + 1;                if (_version < 418) {                    if (_l.search == "") {                        _form.action = "#" + _value;                        _form.submit()                    }                } else {                    if (_version < 523 || _value == "") {                        var evt = _d.createEvent("MouseEvents");                        evt.initEvent("click", TRUE, TRUE);                        var anchor = _d.createElement("a");                        anchor.href = "#" + _value;                        anchor.dispatchEvent(evt)                    } else {                        _l.hash = "#" + _value                    }                }            } else {                _l.replace("#" + _value)            }        } else {            if (_value != _getHash()) {                if (_opts.history) {                    _l.hash = "#" + _dc(_ieLocal(_value, TRUE))                } else {                    _l.replace("#" + _dc(_value))                }            }        }        if ((_msie && _version < 8) && _opts.history) {            _st(_htmlWrite, 50)        }        if (_safari) {            _st(function () {                _silent = FALSE            },            1)        } else {            _silent = FALSE        }    };    this.getPath = function () {        var value = this.getValue();        if (value.indexOf("?") != -1) {            return value.split("?")[0]        } else {            if (value.indexOf("#") != -1) {                return value.split("#")[0]            } else {                return value            }        }    };    this.getPathNames = function () {        var path = this.getPath(),            names = path.split("/");        if (path.substr(0, 1) == "/" || path.length == 0) {            names.splice(0, 1)        }        if (path.substr(path.length - 1, 1) == "/") {            names.splice(names.length - 1, 1)        }        return names    };    this.getQueryString = function () {        var value = this.getValue(),            index = value.indexOf("?");        if (index != -1 && index < value.length) {            return value.substr(index + 1)        }    };    this.getParameter = function (param) {        var value = this.getValue();        var index = value.indexOf("?");        if (index != -1) {            value = value.substr(index + 1);            var p, params = value.split("&"),                i = params.length,                r = [];            while (i--) {                p = params[i].split("=");                if (p[0] == param) {                    r.push(p[1])                }            }            if (r.length != 0) {                return r.length != 1 ? r : r[0]            }        }    };    this.getParameterNames = function () {        var value = this.getValue();        var index = value.indexOf("?");        var names = [];        if (index != -1) {            value = value.substr(index + 1);            if (value != "" && value.indexOf("=") != -1) {                var params = value.split("&"),                    i = 0;                while (i < params.length) {                    names.push(params[i].split("=")[0]);                    i++                }            }        }        return names    };    this.onInit = null;    this.onChange = null;    this.onInternalChange = null;    this.onExternalChange = null;    (function () {        var _args;        if (typeof FlashObject != UNDEFINED) {            SWFObject = FlashObject        }        if (typeof SWFObject != UNDEFINED && SWFObject.prototype && SWFObject.prototype.write) {            var _s1 = SWFObject.prototype.write;            SWFObject.prototype.write = function () {                _args = arguments;                if (this.getAttribute("version").major < 8) {                    this.addVariable("$swfaddress", SWFAddress.getValue());                    ((typeof _args[0] == "string") ? document.getElementById(_args[0]) : _args[0]).so = this                }                var success;                if (success = _s1.apply(this, _args)) {                    _ref.addId(this.getAttribute("id"))                }                return success            }        }        if (typeof swfobject != UNDEFINED) {            var _s2r = swfobject.registerObject;            swfobject.registerObject = function () {                _args = arguments;                _s2r.apply(this, _args);                _ref.addId(_args[0])            };            var _s2c = swfobject.createSWF;            swfobject.createSWF = function () {                _args = arguments;                var swf = _s2c.apply(this, _args);                if (swf) {                    _ref.addId(_args[0].id)                }                return swf            };            var _s2e = swfobject.embedSWF;            swfobject.embedSWF = function () {                _args = arguments;                if (typeof _args[8] == UNDEFINED) {                    _args[8] = {}                }                if (typeof _args[8].id == UNDEFINED) {                    _args[8].id = _args[1]                }                _s2e.apply(this, _args);                _ref.addId(_args[8].id)            }        }        if (typeof UFO != UNDEFINED) {            var _u = UFO.create;            UFO.create = function () {                _args = arguments;                _u.apply(this, _args);                _ref.addId(_args[0].id)            }        }        if (typeof AC_FL_RunContent != UNDEFINED) {            var _a = AC_FL_RunContent;            AC_FL_RunContent = function () {                _args = arguments;                _a.apply(this, _args);                for (var i = 0, l = _args.length; i < l; i++) {                    if (_args[i] == "id") {                        _ref.addId(_args[i + 1])                    }                }            }        }    })()};
