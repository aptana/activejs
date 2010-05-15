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