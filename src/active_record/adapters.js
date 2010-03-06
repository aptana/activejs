 /**
 * @namespace {ActiveRecord.Adapters}
 */
var Adapters = {};

/**
 * null if no connection is active, or the class that created the connection.
 * @alias ActiveRecord.adapter
 * @property {mixed}
 */
ActiveRecord.adapters = [];

/**
 * null if no connection is active, or the connection object.
 * @alias ActiveRecord.connection
 * @property {mixed}
 */
ActiveRecord.connection = null;

/**
 * Must be called before using ActiveRecord. If the adapter requires arguments, those must be passed in after the type of adapter.
 * @alias ActiveRecord.connect
 * @param {Object} adapter
 * @param {mixed} [args]
 * @example
 * 
 *     ActiveRecord.connect(ActiveRecord.Adapters.JaxerSQLite,'path_to_database_file');
 *     ActiveRecord.adapters === [ActiveRecord.Adapters.JaxerSQLite];
 *     ActiveRecord.connection.executeSQL('SELECT * FROM sqlite_master');
 *     //or you can have ActiveRecord try to auto detect the enviornment
 *     ActiveRecord.connect();
 */
ActiveRecord.connect = function connect(adapter)
{   
    if(!adapter)
    {
        var connection = Adapters.Auto.connect.apply(Adapters.Auto, ActiveSupport.arrayFrom(arguments).slice(1));
        if(connection)
        {
            ActiveRecord.connection = connection;
        }
        ActiveRecord.adapters.push(ActiveRecord.connection.constructor);
    }
    else
    {
        var connection = adapter.connect.apply(adapter, ActiveSupport.arrayFrom(arguments).slice(1));
        
        if(connection)
        {
            ActiveRecord.connection = connection;
        }
        ActiveRecord.adapters.push(adapter);
    }
    ActiveEvent.extend(ActiveRecord.connection);
    if(!ActiveRecord.connection.preventConnectedNotification)
    {
        ActiveRecord.notify('connected');
    }
};

/**
 * Execute a SQL statement on the active connection. If the statement requires arguments they must be passed in after the SQL statement.
 * @alias ActiveRecord.execute
 * @param {String} sql
 * @return {mixed}
 * @example
 *
 *     ActiveRecord.execute('DELETE FROM users WHERE user_id = ?',5);
 */
ActiveRecord.execute = function execute()
{
    if (!ActiveRecord.connection)
    {
        throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
    }
    return ActiveRecord.connection.executeSQL.apply(ActiveRecord.connection, arguments);
};

/**
 * Escapes a given argument for use in a SQL string. By default
 * the argument passed will also be enclosed in quotes.
 * @alias ActiveRecord.escape
 * @param {mixed} argument
 * @param {Boolean} [supress_quotes] Defaults to false.
 * @return {mixed}
 * ActiveRecord.escape(5) == 5
 * ActiveRecord.escape('tes"t') == '"tes\"t"';
 */
ActiveRecord.escape = function escape(argument,supress_quotes)
{
    var quote = supress_quotes ? '' : '"';
    return typeof(argument) == 'number'
        ? argument
        : quote + String(argument).replace(/\"/g,'\\"').replace(/\\/g,'\\\\').replace(/\0/g,'\\0') + quote
    ;
};


/**
 * @alias ActiveRecord.transaction
 * @param {Function} proceed
 *      The block of code to execute inside the transaction.
 * @param {Function} [error]
 *      Optional error handler that will be called with an exception if one is thrown during a transaction. If no error handler is passed the exception will be thrown.
 * @example
 *     ActiveRecord.transaction(function(){
 *         var from = Account.find(2);
 *         var to = Account.find(3);
 *         to.despoit(from.withdraw(100.00));
 *     });
 */
ActiveRecord.transaction = function transaction(proceed,error)
{
    try
    {
        ActiveRecord.connection.transaction(proceed);
    }
    catch(e)
    {
        if(error)
        {
            error(e);
        }
        else
        {
            throw e;
        }
    }
};
//deprecated
ActiveRecord.ClassMethods.transaction = ActiveRecord.transaction;

Adapters.defaultResultSetIterator = function defaultResultSetIterator(iterator)
{
    if (typeof(iterator) === 'number')
    {
        if (this.rows[iterator])
        {
            return ActiveSupport.clone(this.rows[iterator]);
        }
        else
        {
            return false;
        }
    }
    else
    {
        for (var i = 0; i < this.rows.length; ++i)
        {
            var row = ActiveSupport.clone(this.rows[i]);
            iterator(row);
        }
    }
};


Adapters.InstanceMethods = {
    setValueFromFieldIfValueIsNull: function setValueFromFieldIfValueIsNull(field,value)
    {
        //no value was passed
        if (value === null || typeof(value) === 'undefined')
        {
            //default value was in field specification
            if(Migrations.objectIsFieldDefinition(field))
            {
                var default_value = this.getDefaultValueFromFieldDefinition(field);
                if(typeof(default_value) === 'undefined')
                {
                    throw Errors.InvalidFieldType.getErrorString(field ? (field.type || '[object]') : 'false');
                }
                return field.value || default_value;
            }
            //default value was set, but was not field specification 
            else
            {
                return field;
            }
        }
        return value;
    },
    getColumnDefinitionFragmentFromKeyAndColumns: function getColumnDefinitionFragmentFromKeyAndColumns(key,columns)
    {
        return this.quoteIdentifier(key) + ((typeof(columns[key]) === 'object' && typeof(columns[key].type) !== 'undefined') ? columns[key].type : this.getDefaultColumnDefinitionFragmentFromValue(columns[key]));
    },
    getDefaultColumnDefinitionFragmentFromValue: function getDefaultColumnDefinitionFragmentFromValue(value)
    {
        if (typeof(value) === 'string')
        {
            return 'VARCHAR(255)';
        }
        if (typeof(value) === 'number')
        {
            return 'INT';
        }
        if (typeof(value) == 'boolean')
        {
            return 'TINYINT(1)';
        }
        return 'TEXT';
    },
    getDefaultValueFromFieldDefinition: function getDefaultValueFromFieldDefinition(field)
    {
        return field.value ? field.value : Migrations.fieldTypesWithDefaultValues[field.type ? field.type.replace(/\(.*/g,'').toLowerCase() : ''];
    },
    quoteIdentifier: function quoteIdentifier(name)
    {
      return '"' + name + '"';
    },
    log: function log()
    {
        if(!ActiveRecord.logging)
        {
            return;
        }
        if(arguments[0])
        {
            arguments[0] = 'ActiveRecord: ' + arguments[0];
        }
        return ActiveSupport.log.apply(ActiveSupport,arguments || {});
    }
};

ActiveRecord.Adapters = Adapters;
