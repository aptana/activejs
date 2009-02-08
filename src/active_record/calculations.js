/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
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