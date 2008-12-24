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
 
/**
 * Adapter for browsers supporting a SQL implementation (Gears, HTML5).
 * @alias ActiveRecord.Adapters.Gears
 * @property {ActiveRecord.Adapter}
 */
Adapters.Gears = function(db){
    this.db = db;
    ActiveSupport.extend(this,Adapters.SQLite);
    ActiveSupport.extend(this,{
        log: function log()
        {
            if(!ActiveRecord.logging)
            {
                return;
            }
            return ActiveSupport.log.apply(ActiveSupport,arguments || []);
        },
        executeSQL: function executeSQL(sql)
        {
            var args = ActiveSupport.arrayFrom(arguments);
            var proceed = null;
            if(typeof(args[args.length - 1]) == 'function')
            {
                proceed = args.pop();
            }
            ActiveRecord.connection.log("Adapters.Gears.executeSQL: " + sql + " [" + args.slice(1).join(',') + "]");
            var response = ActiveRecord.connection.db.execute(sql,args.slice(1));
            if(proceed)
            {
                proceed(response);
            }
            return response;
        },
        getLastInsertedRowId: function getLastInsertedRowId()
        {
            return this.db.lastInsertRowId;
        },
        iterableFromResultSet: function iterableFromResultSet(result)
        {
            var response = {
                rows: []
            };
            var count = result.fieldCount();
            while(result.isValidRow())
            {
                var row = {};
                for(var i = 0; i < count; ++i)
                {
                    row[result.fieldName(i)] = result.field(i);
                }
                response.rows.push(row);
                result.next();
            }
            result.close();
            response.iterate = function(iterator)
            {
                if(typeof(iterator) == 'number')
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
                    for(var i = 0; i < this.rows.length; ++i)
                    {
                        var row = ActiveSupport.clone(this.rows[i]);
                        iterator(row);
                    }
                }
            };
            return response;
        },
        fieldListFromTable: function(table_name)
        {
            var response = {};
            var description = ActiveRecord.connection.iterableFromResultSet(ActiveRecord.connection.executeSQL('SELECT * FROM sqlite_master WHERE tbl_name = "' + table_name + '"')).iterate(0);
            var columns = description.sql.match(new RegExp('CREATE[\s]+TABLE[\s]+' + table_name + '[\s]+(\([^\)]+)'));
            var parts = columns.split(',');
            for(var i = 0; i < parts.length; ++i)
            {
                //second half of the statement should instead return the type that it is
                response[parts[i].replace(/(^\s+|\s+$)/g,'')] = parts[i].replace(/^\w+\s?/,'');
            }
            return response;
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
Adapters.Gears.DatabaseUnavailableError = 'ActiveRecord.Adapters.Gears could not find an HTML5 compliant or Google Gears database to connect to.';
Adapters.Gears.connect = function connect(name, version, display_name, size)
{
    var global_context = ActiveSupport.getGlobalContext();
    var db = null;
    
    if(!(global_context.google && google.gears))
    {
        var gears_factory = null;
        if('GearsFactory' in global_context)
        {
          gears_factory = new GearsFactory();
        }
        else if('ActiveXObject' in global_context)
        {
            try
            {
                gears_factory = new ActiveXObject('Gears.Factory');
                if(gears_factory.getBuildInfo().indexOf('ie_mobile') != -1)
                {
                    gears_factory.privateSetGlobalObject(this);
                }
            }
            catch(e)
            {
                throw Adapters.Gears.DatabaseUnavailableError;
            }
        }
        else if(('mimeTypes' in navigator) && ('application/x-googlegears' in navigator.mimeTypes))
        {
            gears_factory = document.createElement("object");
            gears_factory.style.display = "none";
            gears_factory.width = 0;
            gears_factory.height = 0;
            gears_factory.type = "application/x-googlegears";
            document.documentElement.appendChild(gears_factory);
        }
        
        if(!gears_factory)
        {
          throw Adapters.Gears.DatabaseUnavailableError;
        }
    
        if(!('google' in global_context))
        {
          google = {};
        }

        if(!('gears' in google))
        {
            google.gears = {
                factory: gears_factory
            };
        }
    }

    db = google.gears.factory.create('beta.database');
    db.open(name || 'ActiveRecord');
        
    return new Adapters.Gears(db);
};