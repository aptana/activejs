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
 * Adapter for Jaxer configured with SQLite
 * @alias ActiveRecord.Adapters.JaxerSQLite
 * @property {ActiveRecord.Adapter}
 */ 
Adapters.JaxerSQLite = function JaxerSQLite(){
    ActiveSupport.extend(this,Adapters.InstanceMethods);
    ActiveSupport.extend(this,Adapters.SQLite);
    ActiveSupport.extend(this,{
        log: function log()
        {
            if (!ActiveRecord.logging)
            {
                return;
            }
            if (arguments[0])
            {
                arguments[0] = 'ActiveRecord: ' + arguments[0];
            }
            return ActiveSupport.log.apply(ActiveSupport,arguments || {});
        },
        executeSQL: function executeSQL(sql)
        {
            ActiveRecord.connection.log("Adapters.JaxerSQLite.executeSQL: " + sql + " [" + ActiveSupport.arrayFrom(arguments).slice(1).join(',') + "]");
            var response = Jaxer.DB.execute.apply(Jaxer.DB.connection, arguments);
            return response;
        },
        getLastInsertedRowId: function getLastInsertedRowId()
        {
            return Jaxer.DB.lastInsertId;
        },
        iterableFromResultSet: function iterableFromResultSet(result)
        {
            result.iterate = function iterate(iterator)
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
                        delete row['$values'];
                        iterator(row);
                    }
                }
            };
            return result;
        },
        transaction: function transaction(proceed)
        {
            try
            {
                ActiveRecord.connection.executeSQL('BEGIN');
                proceed();
                ActiveRecord.connection.executeSQL('COMMIT');
            }
            catch(e)
            {
                ActiveRecord.connection.executeSQL('ROLLBACK');
                throw e;
            }
        }
    });
};
Adapters.JaxerSQLite.connect = function connect(path)
{
    Jaxer.DB.connection = new Jaxer.DB.SQLite.createDB({
        PATH: Jaxer.Dir.resolve(path || 'ActiveRecord.sqlite')
    });
    return new Adapters.JaxerSQLite();
};