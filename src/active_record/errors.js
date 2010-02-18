var Errors = {
    /**
     * @alias ActiveRecord.Errors.ConnectionNotEstablished
     * @property {String} Error that will be thrown if ActiveRecord is used without a connection.
     */
    ConnectionNotEstablished: ActiveSupport.createError('No ActiveRecord connection is active.'),
    /**
     * @alias ActiveRecord.Errors.MethodDoesNotExist
     * @property {String} Error that will be thrown if using InMemory based adapter, and a method called inside a SQL statement cannot be found.
     */
    MethodDoesNotExist: ActiveSupport.createError('The requested method does not exist.'),
    /**
     * @alias ActiveRecord.Errors.InvalidFieldType
     * @property {String} Error that will be thrown if an unrecognized field type definition is used.
     */
    InvalidFieldType: ActiveSupport.createError('The field type does not exist:')
};

ActiveRecord.Errors = Errors;