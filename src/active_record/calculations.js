ActiveSupport.extend(ActiveRecord.ClassMethods,{
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
        if(params && params.synchronize)
        {
            return Synchronization.synchronizeCalculation(this,operation,params);
        }
        else
        {
            return ActiveRecord.connection.calculateEntities(this.tableName,this.processCalculationParams(operation,params),sql_fragment);
        }
    },
    /**
     * options can contain all params that find() can
     * @alias ActiveRecord.Class.count
     * @param {Object} [params] 
     * @return {Number}
     */
    count: function count(params)
    {
        return this.performCalculation('count',params,'COUNT(*)');
    },
    /**
     * options can contain all params that find() can
     * @alias ActiveRecord.Class.average
     * @param {String} column_name
     * @param {Object} [params] 
     * @return {Number}
     */
    average: function average(column_name,params)
    {
        return this.performCalculation('average',params,'AVG(' + column_name + ')');
    },
    /**
     * options can contain all params that find() can
     * @alias ActiveRecord.Class.max
     * @param {String} column_name
     * @param {Object} [params] 
     * @return {Number}
     */
    max: function max(column_name,params)
    {
        return this.performCalculation('max',params,'MAX(' + column_name + ')');
    },
    /**
     * options can contain all params that find() can
     * @alias ActiveRecord.Class.min
     * @param {String} column_name
     * @param {Object} [params] 
     * @return {Number}
     */
    min: function min(column_name,params)
    {
        return this.performCalculation('min',params,'MIN(' + column_name + ')');
    },
    /**
     * options can contain all params that find() can
     * @alias ActiveRecord.Class.sum
     * @param {String} column_name
     * @param {Object} [params]
     * @return {Number}
     */
    sum: function sum(column_name,params)
    {
        return this.performCalculation('sum',params,'SUM(' + column_name + ')');
    },
    /**
     * Returns the first record sorted by id.
     * @alias ActiveRecord.Class.first
     * @return {ActiveRecord.Instance} 
     */
    first: function first()
    {
        return this.find({
            first: true
        });
    },
    /**
     * Returns the last record sorted by id.
     * @alias ActiveRecord.Class.last
     * @return {ActiveRecord.Instance} 
     */
    last: function last()
    {
        return this.find({
            first: true,
            order: this.primaryKeyName + ' DESC'
        });
    }
});