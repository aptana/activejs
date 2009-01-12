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
 * Adapter for Adobe AIR.
 * @alias ActiveRecord.Adapters.AIR
 * @property {ActiveRecord.Adapter}
 */ 
Adapters.AIR = function AIR(connection){
    this.connection = connection;
    ActiveSupport.extend(this,Adapters.InstanceMethods);
    ActiveSupport.extend(this,Adapters.SQLite);
    ActiveSupport.extend(this,{
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
            if(air.Introspector)
            {
                ActiveSupport.log.apply(ActiveSupport,arguments || []);
            }
            else
            {
                return null;
            }
        },
        executeSQL: function executeSQL(sql)
        {
            ActiveRecord.connection.log("Adapters.AIR.executeSQL: " + sql + " [" + ActiveSupport.arrayFrom(arguments).slice(1).join(',') + "]");
            this.statement = new air.SQLStatement();
            this.statement.sqlConnection = this.connection;
            this.statement.text = sql;
            var parameters = ActiveSupport.arrayFrom(arguments).slice(1);
            for(var i = 0; i < parameters.length; ++i)
            {
                this.statement.parameters[i] = parameters[i];
            }
            this.statement.execute();
            return this.statement.getResult().data;
        },
        getLastInsertedRowId: function getLastInsertedRowId()
        {
            return this.connection.lastInsertRowID;
        },
        iterableFromResultSet: function iterableFromResultSet(result)
        {
            result.iterate = function iterate(iterator)
            {
                if (typeof(iterator) == 'number')
                {
                    if (this[iterator])
                    {
                        return ActiveSupport.clone(this[iterator]);
                    }
                    else
                    {
                        return false;
                    }
                }
                else
                {
                    for (var i = 0; i < this.length; ++i)
                    {
                        iterator(this[i]);
                    }
                }
            };
            return result;
        },
        transaction: function transaction(proceed)
        {
            try
            {
                this.connection.begin();
                proceed();
                this.connection.commit();
            }
            catch(e)
            {
                this.connection.rollback();
                throw e;
            }
        }
    });
};
Adapters.AIR.connect = function connect(path)
{
    var connection = new air.SQLConnection();
    connection.open(air.File.applicationDirectory.resolvePath(path || 'ActiveRecord'),air.SQLMode.CREATE);
    return new Adapters.AIR(connection);
};