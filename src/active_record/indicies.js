var Indicies = {
    initializeIndicies: function initializeIndicies(storage)
    {
        var model_name, model, table_name, index_name, index, index_callbacks, id;
        for(model_name in ActiveRecord.Models)
        {
            model = ActiveRecord.Models[model_name];
            if(model.indexingCallbacks)
            {
                table_name = model.tableName;
                for(index_name in model.indexingCallbacks)
                {
                    index = model.indexed[index_name];
                    index_callbacks = model.indexingCallbacks[index_name];
                    for(id in storage[table_name])
                    {
                        index_callbacks.afterSave(index,storage[table_name][id]);
                    }
                }
            }
        }
        
    }
};

/**
 * Warning: this functionality is only available when using the InMemory adapter.
 * 
 * Allows the construction of arbitrary data indicies from data in your models.
 * Indicies will stay up to date as records are created, saved or destroyed.
 * 
 * The afterSave and afterDestroy objects will only receive the data for a
 * given record (generated with instance.toObject()). The afterSave callback
 * will handle both the create and update scenarios.
 *
 *     Photo.addIndex('byName',{},{
 *         afterSave: function(index,photo){
 *             index[photo.name] = photo.id;
 *         },
 *         afterDestroy: function(index,photo){
 *             delete index[photo.name];
 *         }
 *     });
 *     var flower_record = Photo.create({name:'flower'});
 *     Photo.indexed.byName.flower == flower_record;
 *     
 * If you only need and index of key => id pairs (name => id pairs in the
 * example above), you can shorten the call to the following:
 *
 *     Photo.addIndex('byName','name'):
 *
 * A more complicated example, which pre fills an index object:
 * 
 *     var index = {a:{},b:{},c:{}};
 *     
 *     Contact.addIndex('byLetter',index,{
 *         afterSave: function(index,contact){
 *             var first_letter = contact.name.substring(0,1).toLowerCase();
 *             index[first_letter][contact.id] = contact;
 *         },
 *         afterDestroy: function(index,contact){
 *             var first_letter = contact.name.substring(0,1).toLowerCase();
 *             delete index[first_letter][contact.id];
 *         }
 *     });
 *     
 *     //the index will now be available at:
 *     Contact.indexed.byLetter;
 *     
 *     Contact.create({name: 'Abbey'});
 *     
 *     for(var id in Contact.indexed.byLetter.a){}
 * 
 * @alias ActiveRecord.Class.addIndex
 * @param {String} index_name
 * @param {Object} index 
 * @param {Object} callbacks
 *     Must contain "afterSave" and "afterDestroy" keys containing callback functions.
 */
ActiveRecord.ClassMethods.addIndex = function addIndex(name,index,callbacks)
{
    if(!callbacks)
    {
        if(typeof(index) == 'string')
        {
            var key_name = index;
            index = {};
            callbacks = {
                afterSave: function afterSaveIndexCallback(index,item){
                    index[item[key_name]] = item.id;
                },
                afterDestroy: function afterDestroyIndexCallback(index,item){
                    delete index[item[key_name]];
                }
            };
        }
        else
        {
            callbacks = index;
            index = {};
        }
    }
    if(!this.indexed)
    {
        this.indexed = {};
    }
    if(!this.indexingCallbacks)
    {
        this.indexingCallbacks = {};
    }
    if(!this.indexingCallbackObservers)
    {
        this.indexingCallbackObservers = {};
    }
    this.indexed[name] = index || {};
    this.indexingCallbacks[name] = callbacks;
    this.indexingCallbackObservers[name] = {};
    this.indexingCallbackObservers[name].afterSave = this.observe('afterSave',ActiveSupport.bind(function afterSaveIndexObserver(instance){
        callbacks.afterSave(this.indexed[name],instance.toObject());
    },this));
    this.indexingCallbackObservers[name].afterDestroy = this.observe('afterDestroy',ActiveSupport.bind(function afterDestroyIndexObserver(instance){
        callbacks.afterDestroy(this.indexed[name],instance.toObject());
    },this));
};

/**
 * @alias ActiveRecord.Class.removeIndex
 * @param {String} index_name
 */
ActiveRecord.ClassMethods.removeIndex = function removeIndex(name)
{
    this.stopObserving('afterSave',this.indexingCallbackObservers[name].afterSave);
    this.stopObserving('afterDestroy',this.indexingCallbackObservers[name].afterDestroy);
    delete this.indexingCallbacks[name];
    delete this.indexed[name];
};

ActiveRecord.Indicies = Indicies;