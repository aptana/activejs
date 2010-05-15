ActiveSupport.Object.extend(ActiveRecord.ClassMethods,{
    processCalculationParams: function processCalculationParams(operation,params)
    {
        if(!params)
        {
            params = {};
        }
        if(typeof(params) === 'string')
        {
            params = {
                where: params
            };
        }
        return params;
    },
    performCalculation: function performCalculation(operation,params,sql_fragment)
    {
        return ActiveRecord.connection.calculateEntities(this.tableName,this.processCalculationParams(operation,params),sql_fragment);
    },
    /**
     * ActiveRecord.Model.count([options]) -> Number
     * options can contain all params that `find` can
     **/
    count: function count(params)
    {
        return this.performCalculation('count',params,'COUNT(*)');
    },
    /**
     * ActiveRecord.Model.average(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    average: function average(column_name,params)
    {
        return this.performCalculation('average',params,'AVG(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.max(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    max: function max(column_name,params)
    {
        return this.performCalculation('max',params,'MAX(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.min(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    min: function min(column_name,params)
    {
        return this.performCalculation('min',params,'MIN(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.sum(column_name[,options]) -> Number
     * options can contain all params that `find` can
     **/
    sum: function sum(column_name,params)
    {
        return this.performCalculation('sum',params,'SUM(' + column_name + ')');
    },
    /**
     * ActiveRecord.Model.first() -> Object
     * Returns the first record sorted by id.
     **/
    first: function first()
    {
        return this.find({
            first: true
        });
    },
    /**
     * ActiveRecord.Model.last() -> Object
     * Returns the last record sorted by id.
     **/
    last: function last()
    {
        return this.find({
            first: true,
            order: this.primaryKeyName + ' DESC'
        });
    }
});