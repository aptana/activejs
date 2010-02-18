ActiveSupport.extend(ActiveRecord.ClassMethods,{
    /**
     * Adds the validator to the _validators array of a given ActiveRecord.Class.
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
            if(!this.get(field) || this.get(field) === '')
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
            var value = String(this.get(field));
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
        if (typeof(this.valid) === 'function')
        {
            this.valid();
        }
        ActiveRecord.connection.log('ActiveRecord.valid()? ' + String(this._errors.length === 0) + (this._errors.length > 0 ? '. Errors: ' + String(this._errors) : ''));
        return this._errors.length === 0;
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