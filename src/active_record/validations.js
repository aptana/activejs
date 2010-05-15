ActiveSupport.Object.extend(ActiveRecord.ClassMethods,{
    /**
     * ActiveRecord.Model.addValidator(callback) -> null
     * Adds the validator to the _validators array of a given ActiveRecord.Model.
     **/
    addValidator: function addValidator(validator)
    {
        if(!this._validators)
        {
            this._validators = [];
        }
        this._validators.push(validator);
    },
    /**
     * ActiveRecord.Model.validatesPresenceOf(field_name[,options])
     **/
    validatesPresenceOf: function validatesPresenceOf(field, options)
    {
        options = ActiveSupport.Object.extend({
            
        },options || {});
        this.addValidator(function validates_presence_of_callback(){
            if(!this.get(field) || this.get(field) === '')
            {
                this.addError(options.message || (field + ' is not present.'),field);
            }
        });
    },
    /**
     * ActiveRecord.Model.validatesLengthOf(field_name[,options]) -> null
     * Accepts "min" and "max" numbers as options.
     **/
    validatesLengthOf: function validatesLengthOf(field, options)
    {
        options = ActiveSupport.Object.extend({
            min: 1,
            max: 9999
        },options || {});
        //will run in scope of an ActiveRecord instance
        this.addValidator(function validates_length_of_callback(){
            var value = String(this.get(field));
            if (value.length < options.min)
            {
                this.addError(options.message || (field + ' is too short.'),field);
            }
            if (value.length > options.max)
            {
                this.addError(options.message || (field + ' is too long.'),field);
            }
        });
    }
});
ActiveSupport.Object.extend(ActiveRecord.InstanceMethods,{
    /**
     * ActiveRecord.Model#addError(message[,field_name]) -> null
     **/
    addError: function addError(str, field)
    {
        var error = null;
        if(field)
        {
            error = [str,field];
            error.toString = function toString()
            {
                return field ? field + ": " + str : str;
            };
        }
        else
        {
            error = str;
        }
        this._errors.push(error);
    },
    isValid: function isValid()
    {
        return this._errors.length === 0;
    },
    _validate: function _validate()
    {
        this._errors = [];
        var validators = this.getValidators();
        for (var i = 0; i < validators.length; ++i)
        {
            validators[i].apply(this);
        }
        if (typeof(this.validate) === 'function')
        {
            this.validate();
        }
        ActiveSupport.log('ActiveRecord.validate() ' + String(this._errors.length === 0) + (this._errors.length > 0 ? '. Errors: ' + String(this._errors) : ''));
        return this._errors.length === 0;
    },
    getValidators: function getValidators()
    {
        return this.constructor._validators || [];
    },
    /**
     * ActiveRecord.Model#getErrors() -> Array
     **/
    getErrors: function getErrors()
    {
        return this._errors;
    }
});