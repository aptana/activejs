(function(){

/**
 * Adapter for v8cgi configured with MySQL.
 * @alias ActiveRecord.Adapters.V8CGIMySQL
 * @property {ActiveRecord.Adapter}
 */ 
ActiveRecord.Adapters.V8CGIMySQL = function V8CGIMySQL(){
    ActiveSupport.extend(this,ActiveRecord.Adapters.InstanceMethods);
    ActiveSupport.extend(this,ActiveRecord.Adapters.MySQL);
    ActiveSupport.extend(this,{
        executeSQL: function executeSQL(sql)
        {
            ActiveRecord.connection.log("Adapters.V8CGIMySQL.executeSQL: " + sql + " [" + ActiveSupport.arrayFrom(arguments).slice(1).join(',') + "]");
            var query = sprintf.apply(global,([sql.replace(/\?/g,"'%s'")]).concat(ActiveSupport.arrayFrom(arguments).slice(1)));
            var result = ActiveRecord.Adapters.V8CGIMySQL.db.query(query);
            result.rows  = result.fetchObjects ? result.fetchObjects() : [];
            return r;
        },
        getLastInsertedRowId: function getLastInsertedRowId()
        {
            return ActiveRecord.Adapters.V8CGIMySQL.db.insertId();
        },
        iterableFromResultSet: function iterableFromResultSet(result)
        {
            result.iterate = ActiveRecord.Adapters.defaultResultSetIterator;
            return result;
        }
    });
};

ActiveRecord.Adapters.V8CGIMySQL.connect = function connect(options)
{
    if(!options)
    {
        options = {};
    }
    for(var key in options)
    {
        options[key.toUpperCase()] = options[key];
    }
    var MySQL = require("mysql").MySQL; 
    options = ActiveSupport.extend({
        HOST: 'localhost',
        PORT: 3306,
        USER: 'root',
        PASS: '',
        NAME: ''
    },options);
    ActiveRecord.Adapters.V8CGIMySQL.db = new MySQL();
    ActiveRecord.Adapters.V8CGIMySQL.connection = ActiveRecord.Adapters.V8CGIMySQL.db.connect(options.HOST,options.USER,options.PASS,options.NAME);
    return new ActiveRecord.Adapters.V8CGIMySQL();
};

})();