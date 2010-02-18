ActiveRecord.asynchronous = false; //deprecated until we have HTML5 support

var Synchronization = {};

Synchronization.calculationNotifications = {};

Synchronization.resultSetNotifications = {};

Synchronization.notifications = {};

Synchronization.setupNotifications = function setupNotifications(record)
{
    if(!record.get(record.constructor.primaryKeyName))
    {
        return false;
    }
    if(!Synchronization.notifications[record.tableName])
    {
        Synchronization.notifications[record.tableName] = {};
    }
    if(!Synchronization.notifications[record.tableName][record[record.constructor.primaryKeyName]])
    {
        Synchronization.notifications[record.tableName][record[record.constructor.primaryKeyName]] = {};
    }    
    return true;
};

Synchronization.triggerSynchronizationNotifications = function triggerSynchronizationNotifications(record,event_name)
{
    var found_records, internal_count_id;
    if(!Synchronization.setupNotifications(record))
    {
        return false;
    }
    if(event_name === 'afterSave')
    {
        found_records = Synchronization.notifications[record.tableName][record[record.constructor.primaryKeyName]];
        for(internal_count_id in found_records)
        {
            if(internal_count_id !== record.internalCount)
            {
                var found_record = found_records[internal_count_id];
                var keys = found_record.keys();
                for(var i = 0; i < keys.length; ++i)
                {
                    var key_name = keys[i];
                    found_record.set(key_name,record.get(key_name));
                }
                found_record.notify('synchronization:afterSave');
            }
        }
    }
    else if(event_name === 'afterDestroy' || event_name === 'afterCreate')
    {
        if(Synchronization.calculationNotifications[record.tableName])
        {
            for(var synchronized_calculation_count in Synchronization.calculationNotifications[record.tableName])
            {
                Synchronization.calculationNotifications[record.tableName][synchronized_calculation_count]();
            }
        }
        if(Synchronization.resultSetNotifications[record.tableName])
        {
            for(var synchronized_result_set_count in Synchronization.resultSetNotifications[record.tableName])
            {
                var old_result_set = Synchronization.resultSetNotifications[record.tableName][synchronized_result_set_count].resultSet;
                var new_params = ActiveSupport.clone(Synchronization.resultSetNotifications[record.tableName][synchronized_result_set_count].params);
                var new_result_set = record.constructor.find(ActiveSupport.extend(new_params,{synchronize: false}));
                var splices = Synchronization.spliceArgumentsFromResultSetDiff(old_result_set,new_result_set,event_name);
                for(var x = 0; x < splices.length; ++x)
                {
                    if(event_name == 'afterCreate')
                    {
                        var to_synchronize = splices[x].slice(2);
                        for(var s = 0; s < to_synchronize.length; ++s)
                        {
                            to_synchronize[s].synchronize();
                        }
                    }
                    old_result_set.splice.apply(old_result_set,splices[x]);
                }
            }
        }
        if(event_name === 'afterDestroy')
        {
            found_records = Synchronization.notifications[record.tableName][record[record.constructor.primaryKeyName]];
            for(internal_count_id in found_records)
            {
                if(internal_count_id !== record.internalCount)
                {
                    found_records[internal_count_id].notify('synchronization:afterDestroy');
                    Synchronization.notifications[record.tableName][record[record.constructor.primaryKeyName]][internal_count_id] = null;
                    delete Synchronization.notifications[record.tableName][record[record.constructor.primaryKeyName]][internal_count_id];
                }
            }
        }
    }
};

ActiveSupport.extend(ActiveRecord.InstanceMethods,{
    /**
     * Once synchronized a found instance will have it's values updated if
     * other records with the same id change in the database.
     * @alias ActiveRecord.Instance.synchronize
     * @return {null}
     */
    synchronize: function synchronize()
    {
        if(!this.isSynchronized)
        {
            this.isSynchronized = true;
            Synchronization.setupNotifications(this);
            Synchronization.notifications[this.tableName][this[this.constructor.primaryKeyName]][this.internalCount] = this;
        }
    },
    /**
     * Stops the synchronization of the record with the database.
     * @alias ActiveRecord.Instance.stop
     * @return {null}
     */
    stop: function stop()
    {
        Synchronization.setupNotifications(this);
        Synchronization.notifications[this.tableName][this[this.constructor.primaryKeyName]][this.internalCount] = null;
        delete Synchronization.notifications[this.tableName][this[this.constructor.primaryKeyName]][this.internalCount];
    }
});

Synchronization.synchronizedCalculationCount = 0;

Synchronization.synchronizeCalculation = function synchronizeCalculation(klass,operation,params)
{
    ++Synchronization.synchronizedCalculationCount;
    var callback = params.synchronize;
    var callback_params = ActiveSupport.clone(params);
    delete callback_params.synchronize;
    if(!Synchronization.calculationNotifications[klass.tableName])
    {
        Synchronization.calculationNotifications[klass.tableName] = {};
    }
    Synchronization.calculationNotifications[klass.tableName][Synchronization.synchronizedCalculationCount] = (function calculation_synchronization_executer_generator(klass,operation,params,callback){
        return function calculation_synchronization_executer(){
            callback(klass[operation](callback_params));
        };
    })(klass,operation,params,callback);
    Synchronization.calculationNotifications[klass.tableName][Synchronization.synchronizedCalculationCount]();
    return (function calculation_synchronization_stop_generator(table_name,synchronized_calculation_count){
        return function calculation_synchronization_stop(){
            Synchronization.calculationNotifications[table_name][synchronized_calculation_count] = null;
            delete Synchronization.calculationNotifications[table_name][synchronized_calculation_count];
        };
    })(klass.tableName,Synchronization.synchronizedCalculationCount);
};

Synchronization.synchronizedResultSetCount = 0;

Synchronization.synchronizeResultSet = function synchronizeResultSet(klass,params,result_set)
{
    ++Synchronization.synchronizedResultSetCount;
    if(!Synchronization.resultSetNotifications[klass.tableName])
    {
        Synchronization.resultSetNotifications[klass.tableName] = {};
    }
    Synchronization.resultSetNotifications[klass.tableName][Synchronization.synchronizedResultSetCount] = {
        resultSet: result_set,
        params: params
    };
    for(var i = 0; i < result_set.length; ++i)
    {
        result_set[i].synchronize();
    }
    result_set.stop = (function result_set_synchronization_stop_generator(table_name,synchronized_result_set_count){
        return function stop(){
            for(var i = 0; i < this.length; ++i)
            {
                this[i].stop();
            }
            Synchronization.resultSetNotifications[table_name][synchronized_result_set_count] = null;
            delete Synchronization.resultSetNotifications[table_name][synchronized_result_set_count];
        };
    })(klass.tableName,Synchronization.synchronizedResultSetCount);
};

Synchronization.spliceArgumentsFromResultSetDiff = function spliceArgumentsFromResultSetDiff(a,b,event_name)
{
    var diffs = [];
    if(event_name === 'afterCreate')
    {
        for(var i = 0; i < b.length; ++i)
        {
            if(!a[i] || (a[i] && (a[i][a[i].constructor.primaryKeyName] !== b[i][b[i].constructor.primaryKeyName])))
            {
                diffs.push([i,null,b[i]]);
                break;
            }
        }
    }
    else if(event_name === 'afterDestroy')
    {
        for(var i = 0; i < a.length; ++i)
        {
            if(!b[i] || (b[i] && (b[i][b[i].constructor.primaryKeyName] !== a[i][a[i].constructor.primaryKeyName])))
            {
                diffs.push([i,1]);
                break;
            }
        }
    }
    return diffs;
};

ActiveRecord.Synchronization = Synchronization;