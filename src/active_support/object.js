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