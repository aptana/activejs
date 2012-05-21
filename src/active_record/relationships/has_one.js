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
