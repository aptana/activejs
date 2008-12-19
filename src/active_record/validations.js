/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
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

ActiveSupport.extend(ActiveRecord.ClassMethods,{
    /**
     * Adds the validator to the _validators array of a given ActiveRecord.Class.
     * @private
     * @alias ActiveRecord.Class.addValidator
     * @param {Function} validator
     */
    addValidator: function addValidator(validator)
    {
        if(!this._validators)
        {
            this._validators = [];
        }
        this._validators.push(validator);
    },
    /**
     * @alias ActiveRecord.Class.validatesPresenceOf
     * @param {String} field
     * @param {Object} [options]
     */
    validatesPresenceOf: function validatesPresenceOf(field, options)
    {
        options = ActiveSupport.extend({
            
        },options || {});
        this.addValidator(function validates_presence_of_callback(){
            if(!this.get(field) || this.get(field) == '')
            {
                this.addError(options.message || (field + ' is not present.'));
            }
        });
    },
    /**
     * Accepts "min" and "max" numbers as options.
     * @alias ActiveRecord.Class.validatesLengthOf
     * @param {String} field
     * @param {Object} [options]
     */
    validatesLengthOf: function validatesLengthOf(field, options)
    {
        options = ActiveSupport.extend({
            min: 1,
            max: 9999
        },options || {});
        //will run in scope of an ActiveRecord instance
        this.addValidator(function validates_length_of_callback(){
            var value = new String(this.get(field));
            if (value.length < options.min)
            {
                this.addError(options.message || (field + ' is too short.'));
            }
            if (value.length > options.max)
            {
                this.addError(options.message || (field + ' is too long.'));
            }
        });
    }
});
ActiveSupport.extend(ActiveRecord.InstanceMethods,{
    /**
     * @private
     * @alias ActiveRecord.Instance.addError
     * @param {String} message
     * @param {String} field_name
     */
    addError: function addError(str, field)
    {
        var error = null;
        if(field)
        {
            error = [str,field];
            error.toString = function toString()
            {
                return str;
            };
        }
        else
        {
            error = str;
        }
        this._errors.push(str);
    },
    _valid: function _valid()
    {
        this._errors = [];
        var validators = this._getValidators();
        for (var i = 0; i < validators.length; ++i)
        {
            validators[i].apply(this);
        }
        if (typeof(this.valid) == 'function')
        {
            this.valid();
        }
        ActiveRecord.connection.log('ActiveRecord.valid()? ' + (new String(this._errors.length == 0).toString()) + (this._errors.length > 0 ? '. Errors: ' + (new String(this._errors)).toString() : ''));
        return this._errors.length == 0;
    },
    _getValidators: function _getValidators()
    {
        return this.constructor._validators || [];
    },
    /**
     * @alias ActiveRecord.Instance.getErrors
     * @return {Array}
     */
    getErrors: function getErrors()
    {
        return this._errors;
    }
});