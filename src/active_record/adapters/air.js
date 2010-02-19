(function(){

/**
 * Adapter for Adobe AIR.
 * @alias ActiveRecord.Adapters.AIR
 * @property {ActiveRecord.Adapter}
 */ 
ActiveRecord.Adapters.AIR = function AIR(connection){
    this.connection = connection;
    ActiveSupport.extend(this,ActiveRecord.Adapters.InstanceMethods);
    ActiveSupport.extend(this,ActiveRecord.Adapters.SQLite);
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
                if (typeof(iterator) === 'number')
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
ActiveRecord.Adapters.AIR.connect = function connect(path)
{
    var connection = new air.SQLConnection();
    connection.open(air.File.applicationDirectory.resolvePath(path || 'ActiveRecord'),air.SQLMode.CREATE);
    return new ActiveRecord.Adapters.AIR(connection);
};

})();