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
 * null if no connection is active, or the class that created the connection.
 * @alias ActiveRecord.adapter
 * @property {mixed}
 */
ActiveRecord.adapter = null;

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
 *     ActiveRecord.adapter == ActiveRecord.Adapters.JaxerSQLite;
 *     ActiveRecord.connection.executeSQL('SELECT * FROM sqlite_master');
 *     //or you can have ActiveRecord try to auto detect the enviornment
 *     ActiveRecord.connect();
 */
ActiveRecord.connect = function connect(adapter)
{   
    if(!adapter)
    {
        ActiveRecord.connection = Adapters.Auto.connect.apply(Adapters.Auto, ActiveSupport.arrayFrom(arguments).slice(1));
        ActiveRecord.adapter = ActiveRecord.connection.constructor;
    }
    else
    {
        ActiveRecord.adapter = adapter;
        ActiveRecord.connection = adapter.connect.apply(adapter, ActiveSupport.arrayFrom(arguments).slice(1));
    }
    ActiveEvent.extend(ActiveRecord.connection);
    ActiveRecord.notify('connected');
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
        throw ActiveRecord.Errors.ConnectionNotEstablished;
    }
    return ActiveRecord.connection.executeSQL.apply(ActiveRecord.connection, arguments);
};

/**
* @namespace {ActiveRecord.Adapters}
*/
var Adapters = {};

Adapters.InstanceMethods = {
    setValueFromFieldIfValueIsNull: function setValueFromFieldIfValueIsNull(field,value)
    {
        //no value was passed
        if (value == null || typeof(value) == 'undefined')
        {
            //default value was in field specification
            if(Migrations.objectIsFieldDefinition(field))
            {
                var default_value = this.getDefaultValueFromFieldDefinition(field);
                if(typeof(default_value) == 'undefined')
                {
                    throw Errors.InvalidFieldType + (field ? (field.type || '[object]') : 'false');
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
        return key + ' ' + ((typeof(columns[key]) == 'object' && typeof(columns[key].type) != 'undefined') ? columns[key].type : this.getDefaultColumnDefinitionFragmentFromValue(columns[key]));
    },
    getDefaultColumnDefinitionFragmentFromValue: function getDefaultColumnDefinitionFragmentFromValue(value)
    {
        if (typeof(value) == 'string')
        {
            return 'VARCHAR(255)';
        }
        if (typeof(value) == 'number')
        {
            return 'INT';
        }
        return 'TEXT';
    },
    getDefaultValueFromFieldDefinition: function getDefaultValueFromFieldDefinition(field)
    {
        return field.value ? field.value : Migrations.fieldTypesWithDefaultValues[field.type ? field.type.replace(/\(.*/g,'').toLowerCase() : ''];
    }
};

ActiveRecord.Adapters = Adapters;