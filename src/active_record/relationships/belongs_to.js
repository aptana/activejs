/**
 * Sepcifies a 1<-1 relationship between models. The foreign key will reside in the declaring object.
 * @alias ActiveRecord.Class.belongsTo
 * @param {String} related_model_name
 *      Can be a plural or singular referring to the related table, the model name, or a reference to the model itself ("users","User" or User would all work).
 * @param {Object} [options]
 *      Can contain {String} "foreignKey", {String} name, {String} "counter" keys.
 * @example
 *
 *     Comment.belongsTo('User',{
 *         counter: 'comment_count' //comment count must be a column in User
 *     });
 *     var c = Comment.find(5);
 *     //each Comment instance will gain the following 3 methods
 *     c.getUser()
 *     c.buildUser()
 *     c.createUser()
 */
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
    instance_methods['get' + relationship_name] = ActiveSupport.curry(function getRelated(related_model_name,foreign_key){
        var id = this.get(foreign_key);
        if (id)
        {
            return ActiveRecord.Models[related_model_name].get(id);
        }
        else
        {
            return false;
        }
    }, related_model_name, foreign_key);
    instance_methods['build' + relationship_name] = class_methods['build' + relationship_name] = ActiveSupport.curry(function buildRelated(related_model_name, foreign_key, params){
        var record = ActiveRecord.Models[related_model_name].build(params || {});
        if(options.counter)
        {
            record[options.counter] = 1;
        }
        return record;
    }, related_model_name, foreign_key);
    instance_methods['create' + relationship_name] = ActiveSupport.curry(function createRelated(related_model_name, foreign_key, params){
        var record = this['build' + related_model_name](params);
        if(record.save() && this.get(this.constructor.primaryKeyName))
        {
            this.updateAttribute(foreign_key, record.get(record.constructor.primaryKeyName));
        }
        return record;
    }, related_model_name, foreign_key);
    ActiveSupport.extend(this.prototype, instance_methods);
    ActiveSupport.extend(this, class_methods);
    
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
