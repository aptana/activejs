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
 * Indicies must be added before the InMemory adapter is initialized with data.
 * 
 * @alias ActiveRecord.Class.addIndex
 * @param {String} index_name
 * @param {Object} index 
 * @param {Object} callbacks
 *     Must contain "afterSave" and "afterDestroy" keys containing callback functions.
 */
ActiveRecord.ClassMethods.addIndex = function addIndex(name,index,callbacks)
{
    if(!this.indexed)
    {
        this.indexed = {};
    }
    if(!this.indexingCallbacks)
    {
        this.indexingCallbacks = {};
    }
    this.indexed[name] = index || {};
    this.indexingCallbacks[name] = {};
    this.indexingCallbacks[name].afterSave = this.observe('afterSave',ActiveSupport.bind(function afterSaveIndexObserver(instance){
        callbacks.afterSave(this.indexed[name],instance.toObject());
    },this));
    this.indexingCallbacks[name].afterDestroy = this.observe('afterDestroy',ActiveSupport.bind(function afterDestroyIndexObserver(instance){
        callbacks.afterDestroy(this.indexed[name],instance.toObject());
    },this));
};

/**
 * @alias ActiveRecord.Class.removeIndex
 * @param {String} index_name
 */
ActiveRecord.ClassMethods.removeIndex = function removeIndex(name)
{
    this.stopObserving('afterSave',this.indexingCallbacks[name].afterSave);
    this.stopObserving('afterDestroy',this.indexingCallbacks[name].afterDestroy);
    delete this.indexingCallbacks[name];
    delete this.indexed[name];
};

ActiveRecord.Indicies = Indicies;