ActiveEvent.extend(ActiveRecord);

ActiveRecord.eventNames = [
    'afterInitialize',
    'afterFind',
    'beforeSave',
    'afterSave',
    'beforeCreate',
    'afterCreate',
    'beforeDestroy',
    'afterDestroy'
];

//add lifecycle method names to classes and models (model_instance.beforeDestory() model_class.beforeDestroy())
(function(){
    for (var i = 0; i < ActiveRecord.eventNames.length; ++i)
    {
        ActiveRecord.ClassMethods[ActiveRecord.eventNames[i]] = ActiveRecord.InstanceMethods[ActiveRecord.eventNames[i]] = ActiveSupport.curry(function event_name_delegator(event_name, observer){
            return this.observe(event_name, observer);
        },ActiveRecord.eventNames[i]);
    }
})();

/**
 * Observe an event on all models. observer will be called with model_class, model_instance.
 * @alias ActiveRecord.observe
 * @param {String} event_name
 * @param {Function} observer
 * @return {Array} Array of observers 
 */
ActiveRecord.old_observe = ActiveRecord.observe;
ActiveRecord.observe = function observe(event_name,observer)
{
    for(var i = 0; i < ActiveRecord.eventNames.length; ++i)
    {
        if(ActiveRecord.eventNames[i] === event_name)
        {
            var observers = [];
            var model_observer;
            for(var model_name in ActiveRecord.Models)
            {
                model_observer = ActiveSupport.curry(observer,ActiveRecord.Models[model_name]);
                observers.push(model_observer);
                ActiveRecord.Models[model_name].observe(event_name,model_observer);
            }
            return observers;
        }
    }
    return ActiveRecord.old_observe(event_name,observer);
};

//add lifecycle method names to ActiveRecord (ActiveRecord.beforeDestory)
(function(){
    for (var i = 0; i < ActiveRecord.eventNames.length; ++i)
    {
        ActiveRecord[ActiveRecord.eventNames[i]] = ActiveSupport.curry(function event_name_delegator(event_name, observer){
            ActiveRecord.observe(event_name, observer);
        },ActiveRecord.eventNames[i]);
    }
})();