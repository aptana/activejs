/**
 * Default adapter, will try to automatically pick the appropriate adapter
 * for the current environment.
 * @alias ActiveRecord.Adapters.Auto
 * @property {ActiveRecord.Adapter}
 */
Adapters.Auto = {};
Adapters.Auto.connect = function connect()
{
    if(typeof(Jaxer) !== 'undefined')
    {
        if(Jaxer.DB.connection.constructor == Jaxer.DB.MySQL.Connection)
        {
            return Adapters.JaxerMySQL.connect.apply(Adapters.JaxerMySQL.connect,arguments);
        }
        else
        {
            return Adapters.JaxerSQLite.connect.apply(Adapters.JaxerSQLite.connect,arguments);
        }
    }
    else if(typeof(air) !== 'undefined')
    {
        return Adapters.AIR.connect.apply(Adapters.AIR.connect,arguments);
    }
    else
    {
        try{
            return Adapters.Gears.connect.apply(Adapters.Gears.connect,arguments);
        }catch(e){
            return Adapters.InMemory.connect.apply(Adapters.InMemory.connect,arguments);
        }
    }
};