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

var Finders = {
    mergeOptions: function mergeOptions(field_name, value, options)
    {
        if(!options){
            options = {};
        }
        options = ActiveSupport.clone(options);
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
    /**
     * Generates a findByField method for a ActiveRecord.Class (User.findByName)
     * @private
     * @alias ActiveRecord.Finders.generateFindByField
     * @param {Object} ActiveRecord.Class
     * @param {String} field_name
     */
    generateFindByField: function generateFindByField(klass, field_name)
    {
        klass['findBy' + ActiveSupport.camelize(field_name, true)] = ActiveSupport.curry(function generated_find_by_field_delegator(klass, field_name, value, options){
            return klass.find(ActiveSupport.extend(Finders.mergeOptions(field_name, value, options), {
                first: true
            }));
        }, klass, field_name);
    },
    /**
     * Generates a findAllByField method for a ActiveRecord.Class (User.findAllByName)
     * @private
     * @alias ActiveRecord.Finders.generateFindAllByField
     * @param {Object} ActiveRecord.Class
     * @param {String} field_name
     */
    generateFindAllByField: function generateFindAllByField(klass, field_name)
    {
        klass['findAllBy' + ActiveSupport.camelize(field_name, true)] = ActiveSupport.curry(function generated_find_all_by_field_delegator(klass, field_name, value, options){
            return klass.find(ActiveSupport.extend(Finders.mergeOptions(field_name, value, options), {
                all: true
            }));
        }, klass, field_name);
    }
};
ActiveRecord.Finders = Finders;