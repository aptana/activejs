(function(){

/**
 * Adapter for browsers supporting a SQL implementation (Gears, HTML5).
 * @alias ActiveRecord.Adapters.Gears
 * @property {ActiveRecord.Adapter}
 */
ActiveRecord.Adapters.Gears = function Gears(db){
    this.db = db;
    ActiveSupport.extend(this,ActiveRecord.Adapters.InstanceMethods);
    ActiveSupport.extend(this,ActiveRecord.Adapters.SQLite);
    ActiveSupport.extend(this,{
        executeSQL: function executeSQL(sql)
        {
            var args = ActiveSupport.arrayFrom(arguments);
            ActiveRecord.connection.log("Adapters.Gears.executeSQL: " + sql + " [" + args.slice(1).join(',') + "]");
            var response = ActiveRecord.connection.db.execute(sql,args.slice(1));
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
            var fieldNames = [];
            for(var i = 0; i < count; ++i)
            {
                fieldNames[i] = result.fieldName(i);
            }
            while(result.isValidRow())
            {
                var row = {};
                for(var i = 0; i < count; ++i)
                {
                    row[fieldNames[i]] = result.field(i);
                }
                response.rows.push(row);
                result.next();
            }
            result.close();
            response.iterate = ActiveRecord.Adapters.defaultResultSetIterator;
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
        }
    });
};
ActiveRecord.Adapters.Gears.DatabaseUnavailableError = 'ActiveRecord.Adapters.Gears could not find a Google Gears database to connect to.';
ActiveRecord.Adapters.Gears.connect = function connect(name, version, display_name, size)
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
                if(gears_factory.getBuildInfo().indexOf('ie_mobile') !== -1)
                {
                    gears_factory.privateSetGlobalObject(this);
                }
            }
            catch(e)
            {
                throw ActiveRecord.Adapters.Gears.DatabaseUnavailableError;
            }
        }
        else if(('mimeTypes' in navigator) && ('application/x-googlegears' in navigator.mimeTypes))
        {
            gears_factory = ActiveSupport.getGlobalContext().document.createElement("object");
            gears_factory.style.display = "none";
            gears_factory.width = 0;
            gears_factory.height = 0;
            gears_factory.type = "application/x-googlegears";
            ActiveSupport.getGlobalContext().document.documentElement.appendChild(gears_factory);
        }
        
        if(!gears_factory)
        {
            throw ActiveRecord.Adapters.Gears.DatabaseUnavailableError;
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
    db.open(typeof name == 'undefined' ? 'ActiveRecord' : name);
        
    return new ActiveRecord.Adapters.Gears(db);
};

})();
