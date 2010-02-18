/**
 * When using any finder method, the returned array will be extended
 * with the methods in this namespace. A returned result set is still
 * an instance of Array.
 * @namespace {ActiveRecord.ResultSet}
 */
var ResultSet = {};

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