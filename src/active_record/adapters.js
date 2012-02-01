/**
 * ActiveRecord.Adapters
 **/
var Adapters = {};

/**
 * ActiveRecord.connection
 * null if no connection is active, or the connection object.
 **/
ActiveRecord.connection = null;

/**
 * ActiveRecord.connect() -> null
 * ActiveRecord.connect(url) -> null
 * ActiveRecord.connection(json) -> null
 * - url (String): Location to load JSON data from.
 * - json (String | Object): JSON string or JSON object.
 *
 *     //empty in memory database
 *     ActiveRecord.connect();
 *
 *     //in memory database populated with json data
 *     ActiveRecord.connect('{my_table:{1:{field:"value"}}}');
 *
 *     //in memory database populated with json data loaded from remote source
 *     ActiveRecord.connect('my_data_source.json');
 *
 *     //same as above with custom HTTP method and params to load data
 *     ActiveRecord.connect(['http://server/','POST',{session_id:1}]);
 *
 *     //same as above with REST mapping parameters
 *     ActiveRecord.connect(['http://server/','POST',{session_id:1}],{
 *         User: {
 *             create: ['http://server/user.json','POST'],
 *             update: ['http://server/user/:id.json','PUT'],
 *             destroy: ['http://server/user/:id.json','DELETE']
 *         }
 *     });
 **/
ActiveRecord.connect = function connect()
{
    switch(arguments.length)
    {
        case 0:
            ActiveRecord.connection = ActiveRecord.Adapters.InMemory.connect();
            ActiveRecord.notify('ready');
            break;
        case 1:
        case 2:
            if((typeof(arguments[0]) == 'string' && arguments[0].match(/\{/)) || (typeof(arguments[0]) == 'object' && !ActiveSupport.Object.isArray(arguments[0])))
            {
                ActiveRecord.connection = ActiveRecord.Adapters.InMemory.connect(arguments[0]);
                ActiveRecord.notify('ready');
            }
            else
            {
                ActiveRecord.connection = ActiveRecord.Adapters.InMemory.connect();
                ActiveRecord.Adapters.REST.connect(typeof(arguments[0]) == 'string' ? [arguments[0],'GET',false] : arguments[0],arguments[1]);
                //ready fired from within the REST adapter after Ajax request
            }
            break;
    }
};

/**
 * ActiveRecord.execute(sql_statement) -> Array
 * Accepts a variable number of arguments.
 *
 * Execute a SQL statement on the active connection. If the statement requires arguments they must be passed in after the SQL statement.
 *
 *     ActiveRecord.execute('DELETE FROM users WHERE user_id = ?',5);
 **/
ActiveRecord.execute = function execute()
{
    if (!ActiveRecord.connection)
    {
        throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
    }
    return ActiveRecord.connection.executeSQL.apply(ActiveRecord.connection, arguments);
};

/**
 * ActiveRecord.escape(value[,suppress_quotes = false]) -> Number | String
 * Escapes a given argument for use in a SQL string. By default
 * the argument passed will also be enclosed in quotes.
 *
 * ActiveRecord.escape(5) == 5
 * ActiveRecord.escape('tes"t') == '"tes\"t"';
 **/
ActiveRecord.escape = function escape(argument,suppress_quotes)
{
    var quote = suppress_quotes ? '' : '"';
    return typeof(argument) == 'number'
        ? argument
        : quote + String(argument).replace(/\"/g,'\\"').replace(/\\/g,'\\\\').replace(/\0/g,'\\0') + quote
    ;
};


/**
 * ActiveRecord.transaction(callback,[error_callback]) -> null
 * - proceed (Function): The block of code to execute inside the transaction.
 * - error_callback (Function): Optional error handler that will be called with an exception if one is thrown during a transaction. If no error handler is passed the exception will be thrown.
 *
 *     ActiveRecord.transaction(function(){
 *         var from = Account.find(2);
 *         var to = Account.find(3);
 *         to.despoit(from.withdraw(100.00));
 *     });
 **/
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
            return ActiveSupport.Object.clone(this.rows[iterator]);
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
            var row = ActiveSupport.Object.clone(this.rows[i]);
            iterator(row);
        }
    }
};

Adapters.objectIsFieldDefinition = function objectIsFieldDefinition(object)
{
    return typeof(object) === 'object' && ActiveSupport.Object.keys(object).length === 2 && ('type' in object) && ('value' in object);
};

Adapters.fieldTypesWithDefaultValues = {
    'tinyint': 0,
    'smallint': 0,
    'mediumint': 0,
    'int': 0,
    'integer': 0,
    'bigint': 0,
    'float': 0,
    'double': 0,
    'double precision': 0,
    'real': 0,
    'decimal': 0,
    'numeric': 0,

    'date': '',
    'datetime': '',
    'timestamp': '',
    'time': '',
    'year': '',

    'char': '',
    'varchar': '',
    'tinyblob': '',
    'tinytext': '',
    'blob': '',
    'text': '',
    'mediumtext': '',
    'mediumblob': '',
    'longblob': '',
    'longtext': '',

    'enum': '',
    'set': ''
};


Adapters.InstanceMethods = {
    setValueFromFieldIfValueIsNull: function setValueFromFieldIfValueIsNull(field,value)
    {
        //no value was passed
        if (value === null || typeof(value) === 'undefined')
        {
            //default value was in field specification
            if(Adapters.objectIsFieldDefinition(field))
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
        return field.value ? field.value : Adapters.fieldTypesWithDefaultValues[field.type ? field.type.replace(/\(.*/g,'').toLowerCase() : ''];
    },
    quoteIdentifier: function quoteIdentifier(name)
    {
      return '"' + name + '"';
    }
};

ActiveRecord.Adapters = Adapters;
