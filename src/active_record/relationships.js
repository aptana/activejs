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