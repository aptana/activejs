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
 * Sepcifies a 1->1 relationship between models. The foreign key will reside in the related object.
 * @alias ActiveRecord.Class.hasOne
 * @param {String} related_model_name
 *      Can be a plural or singular referring to the related table, the model name, or a reference to the model itself ("users","User" or User would all work).
 * @param {Object} [options]
 *      Can contain {String} "foreignKey", {String} "name", {Boolean} "dependent" keys.
 * @example
 * 
 *     User.hasOne(CreditCard);
 *     var u = User.find(5);
 *     //each User instance will gain the following 3 methods
 *     u.getCreditCard()
 *     u.buildCreditCard()
 *     u.createCreditCard()
 */
ActiveRecord.ClassMethods.hasOne = function hasOne(related_model_name, options)
{
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
    instance_methods['get' + relationship_name] = ActiveSupport.curry(function getRelated(related_model_name, foreign_key){
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
    class_methods['build' + relationship_name] = instance_methods['build' + relationship_name] = ActiveSupport.curry(function buildRelated(related_model_name, foreign_key, params){
        return ActiveRecord.Models[related_model_name].build(params || {});
    }, related_model_name, foreign_key);
    instance_methods['create' + relationship_name] = ActiveSupport.curry(function createRelated(related_model_name, foreign_key, params){
        var record = ActiveRecord.Models[related_model_name].create(params || {});
        if(this.get('id'))
        {
            this.updateAttribute(foreign_key, record.get('id'));
        }
        return record;
    }, related_model_name, foreign_key);
    ActiveSupport.extend(this.prototype, instance_methods);
    ActiveSupport.extend(this, class_methods);
    
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