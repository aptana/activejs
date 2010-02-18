(function(){

/**
 * Adapter for Jaxer configured with SQLite
 * @alias ActiveRecord.Adapters.JaxerSQLite
 * @property {ActiveRecord.Adapter}
 */ 
ActiveRecord.Adapters.JaxerSQLite = function JaxerSQLite(){
    ActiveSupport.extend(this,ActiveRecord.Adapters.InstanceMethods);
    ActiveSupport.extend(this,ActiveRecord.Adapters.SQLite);
    ActiveSupport.extend(this,{
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
            result.iterate = ActiveRecord.Adapters.defaultResultSetIterator;
            return result;
        }
    });
};
ActiveRecord.Adapters.JaxerSQLite.connect = function connect(path)
{
    Jaxer.DB.connection = new Jaxer.DB.SQLite.createDB({
        PATH: Jaxer.Dir.resolve(path || 'ActiveRecord.sqlite')
    });
    return new ActiveRecord.Adapters.JaxerSQLite();
};

})();