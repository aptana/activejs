/**
 * Sepcifies a 1->N relationship between models. The foreign key will reside in the child (related) object.
 * @alias ActiveRecord.Class.hasMany
 * @param {String} related_model_name
 *      Can be a plural or singular referring to the related table, the model name, or a reference to the model itself ("users","User" or User would all work).
 * @param {Object} [options]
 *      Can contain {String} "foreignKey", {Sting} "name", {Boolean} "dependent", {String} "order" and {String} "where" keys.
 * @example
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
 */
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
        instance_methods['get' + relationship_name + 'List'] = ActiveSupport.curry(function getRelatedListForThrough(through_model_name, related_model_name, foreign_key, params){
            var related_list = this['get' + through_model_name + 'List']();
            var ids = [];
            var response = [];
            for(var i = 0; i < related_list.length; ++i)
            {
                response.push(related_list[i]['get' + related_model_name]());
            }
            return response;
        }, through_model_name, related_model_name, foreign_key);
        
        instance_methods['get' + relationship_name + 'Count'] = ActiveSupport.curry(function getRelatedCountForThrough(through_model_name, related_model_name, foreign_key, params){
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
        instance_methods['destroy' + relationship_name] = class_methods['destroy' + relationship_name] = ActiveSupport.curry(function destroyRelated(related_model_name, foreign_key, params){
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

        instance_methods['get' + relationship_name + 'List'] = ActiveSupport.curry(function getRelatedList(related_model_name, foreign_key, params){
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
            if(options.synchronize && !('synchronize' in params))
            {
                params.synchronize = options.synchronize;
            }
            if(!params.where)
            {
                params.where = {};
            }
            params.where[foreign_key] = id;
            params.all = true;
            return ActiveRecord.Models[related_model_name].find(params);
        }, related_model_name, foreign_key);

        instance_methods['get' + relationship_name + 'Count'] = ActiveSupport.curry(function getRelatedCount(related_model_name, foreign_key, params){
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

        instance_methods['build' + relationship_name] = ActiveSupport.curry(function buildRelated(related_model_name, foreign_key, params){
            var id = this.get(this.constructor.primaryKeyName);
            if(!params)
            {
                params = {};
            }
            params[foreign_key] = id;
            return ActiveRecord.Models[related_model_name].build(params);
        }, related_model_name, foreign_key);

        instance_methods['create' + relationship_name] = ActiveSupport.curry(function createRelated(related_model_name, foreign_key, params){
            var id = this.get(this.constructor.primaryKeyName);
            if(!params)
            {
                params = {};
            }
            params[foreign_key] = id;
            return ActiveRecord.Models[related_model_name].create(params);
        }, related_model_name, foreign_key);
    }
    
    ActiveSupport.extend(this.prototype, instance_methods);
    ActiveSupport.extend(this, class_methods);
    
    //dependent
    if(options.dependent)
    {
        this.observe('afterDestroy', function destroyDependentChildren(record){
            var list = record['get' + relationship_name + 'List']();
            ActiveRecord.connection.log('Relationships.hasMany destroy ' + list.length + ' dependent ' + related_model_name + ' children of ' + record.modelName);
            for(var i = 0; i < list.length; ++i)
            {
                list[i].destroy();
            }
        });
    }
};