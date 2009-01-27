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
 * When using any finder method, the returned array will be extended
 * with the methods in this namespace. A returned result set is still
 * an instance of Array.
 * @namespace {ActiveRecord.ResultSet}
 */
var ResultSet = {};

ResultSet.extend = function extend(result_set,params,model){
    for(var method_name in ResultSet.InstanceMethods)
    {
        result_set[method_name] = ActiveSupport.curry(ResultSet.InstanceMethods[method_name],result_set,params,model);
    }
};

ResultSet.InstanceMethods = {
    /**
     * Re-runs the query that generated the result set. This modifies the
     * array in place and does not return a new array.
     * @alias ActiveRecord.ResultSet.reload
     */
    reload: function reload(result_set,params,model){
        result_set.length = 0;
        var new_response = model.find(ActiveSupport.extend(ActiveSupport.clone(params),{synchronize: false}));
        for(var i = 0; i < new_response.length; ++i)
        {
            result_set.push(new_response[i]);
        }
    },
    /**
     * Builds an array calling toObject() on each instance in the result
     * set, thus reutrning a vanilla array of vanilla objects.
     * @alias ActiveRecord.ResultSet.toArray
     * @return {Array}
     */
    toArray: function toArray(result_set)
    {
        var items = [];
        for(var i = 0; i < result_set.length; ++i)
        {
            items.push(result_set[i].toObject());
        }
        return items;
    },
    /**
     * @alias ActiveRecord.ResultSet.toJSON
     * @return {String}
     */
    toJSON: function toJSON(result_set,params,model)
    {
        var items = [];
        for(var i = 0; i < result_set.length; ++i)
        {
            items.push(result_set[i].toSerializableObject());
        }
        return ActiveSupport.JSON.stringify(items);
    },
    /**
     * @alias ActiveRecord.ResultSet.toXML
     * @return {String}
     */
    toXML: function toXML(result_set,params,model)
    {
        var items = [];
        for(var i = 0; i < result_set.length; ++i)
        {
            items.push(result_set[i].toSerializableObject());
        }
        return ActiveSupport.XMLFromObject(ActiveSupport.Inflector.pluralize(model.modelName),items);
    }
};