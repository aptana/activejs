var Errors = {
    ConnectionNotEstablished: ActiveSupport.createError('No ActiveRecord connection is active.'),
    MethodDoesNotExist: ActiveSupport.createError('The requested method does not exist. %'),
    InvalidFieldType: ActiveSupport.createError('The field type does not exist: %')
};

ActiveRecord.Errors = Errors;