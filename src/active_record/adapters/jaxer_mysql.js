(function(){
  
/**
 * Adapter for Jaxer configured with MySQL.
 * @alias ActiveRecord.Adapters.JaxerMySQL
 * @property {ActiveRecord.Adapter}
 */ 
ActiveRecord.Adapters.JaxerMySQL = function JaxerMySQL(){
    ActiveSupport.extend(this,ActiveRecord.Adapters.InstanceMethods);
    ActiveSupport.extend(this,ActiveRecord.Adapters.MySQL);
    ActiveSupport.extend(this,{
        executeSQL: function executeSQL(sql)
        {
            ActiveRecord.connection.log("Adapters.JaxerMySQL.executeSQL: " + sql + " [" + ActiveSupport.arrayFrom(arguments).slice(1).join(',') + "]");
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

ActiveRecord.Adapters.JaxerMySQL.connect = function connect(options)
{
    if(!options)
    {
        options = {};
    }
    for(var key in options)
    {
        options[key.toUpperCase()] = options[key];
    }
    Jaxer.DB.connection = new Jaxer.DB.MySQL.Connection(ActiveSupport.extend({
        HOST: 'localhost',
        PORT: 3306,
        USER: 'root',
        PASS: '',
        NAME: 'jaxer'
    },options));
    return new ActiveRecord.Adapters.JaxerMySQL();
};

})();