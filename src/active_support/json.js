/**
 * Serializes an object to a JSON string.
 * @alias ActiveSupport.JSONFromObject
 * @param {Object} object
 * @return {String} json
 */ 
ActiveSupport.JSONFromObject = function JSONFromObject(object)
{
    return ActiveSupport.JSON.stringify(object);
};

/**
 * Serializes an object to an XML string.
 * @alias ActiveSupport.XMLFromObject
 * @param {String} outer_key_name
 * @param {Object} object
 * @return {String} xml
 */ 
ActiveSupport.XMLFromObject = function XMLFromObject(outer_key_name,object)
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
        if(typeof(value) === 'string' || typeof(value) === 'number' || typeof(value) === 'boolean')
        {
            response = '<![CDATA[' + String(value) + ']]>';
        }
        else if(typeof(value) === 'object')
        {
            response += String.fromCharCode(10);
            if('length' in value && 'splice' in value)
            {
                for(var i = 0; i < value.length; ++i)
                {
                    response += wrap_value(ActiveSupport.Inflector.singularize(key_name) || key_name,value[i],indent + 1);
                }
            }
            else
            {
                var object = value.toObject && typeof(value.toObject) === 'function' ? value.toObject() : value;
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
};

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
                typeof value.toJSON === 'function' && !ActiveSupport.isArray(value)) {
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
 * @namespace {ActiveSupport.JSON} Provides JSON support if a native implementation is not available.
 */
ActiveSupport.JSON = ActiveSupport.getNativeJSONImplementation() || ActiveSupport.getAlternateJSONImplementation();