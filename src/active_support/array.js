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