/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
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

/*
    add support for  update multiple
*/

Adapters.HashTable = function HashTable(storage){
    this.storage = typeof(storage) == 'string' ? ActiveSupport.JSON.parse(storage) : (storage || {});
    this.lastInsertId = null;
};

ActiveSupport.extend(Adapters.HashTable.prototype,{
    schemaLess: true,
    entityMissing: function entityMissing(id){
        return {};
    },
    serialize: function serialize()
    {
        return ActiveSupport.JSON.stringify(this.storage);
    },
    log: function log()
    {
        if(!ActiveRecord.logging)
        {
            return;
        }
        if(typeof(Jaxer) != 'undefined')
        {
            Jaxer.Log.info.apply(Jaxer.Log,arguments);
        }
        else if(typeof(air) != 'undefined')
        {
            air.Introspector.Console.log.apply(air.Introspector.Console,ActiveSupport.arrayFrom(arguments || []));
        }
        else if(console)
        {
            console.log.apply(console,arguments);
        }
    },
    executeSQL: function executeSQL(sql)
    {
        ActiveRecord.connection.log('Adapters.HashTable could not execute SQL:' + sql);
    },
    insertEntity: function insertEntity(table, data)
    {
        this.setupTable(table);
        var max = 1;
        var table_data = this.storage[table];
        if(!data.id)
        {
            for(var id in table_data)
            {
                if(parseInt(id) >= max)
                {
                    max = parseInt(id) + 1;
                }
            }
            data.id = max;
        }
        this.lastInsertId = data.id;
        this.storage[table][max] = data;
        this.notify('created',table,data.id,data);
        return true;
    },
    getLastInsertedRowId: function getLastInsertedRowId()
    {
        return this.lastInsertId;
    },
    updateMultitpleEntities: function updateMultitpleEntities(table, updates, conditions)
    {
        
    },
    updateEntity: function updateEntity(table, id, data)
    {
        this.setupTable(table);
        this.storage[table][id] = data;
        this.notify('updated',table,id,data);
        return true;
    },
    updateAttribute: function updateAttribute(table, id, key, value)
    {
        this.setupTable(table);
        this.storage[table][id][key] = value;
        this.notify('updated',table,id,this.storage[table][id]);
        return true;
    },
    calculateEntities: function calculateEntities(table, params, operation)
    {
        this.setupTable(table);
        var entities = this.findEntities(table,params);
        var parsed_operation = operation.match(/([A-Za-z]+)\(([^\)]+)\)/);
        var operation_type = parsed_operation[1].toLowerCase();
        var column_name = parsed_operation[2];
        switch(operation_type){
            case 'count':
                return entities.length;
            case 'max':
                var max = 0;
                for(var i = 0; i < entities.length; ++i)
                {
                    if(parseInt(entities[i][column_name]) > max)
                    {
                        max = parseInt(entities[i][column_name]);
                    }
                }
                return max;
            case 'min':
                var min = 0;
                if(entities[0])
                {
                    min = entities[0][column_name];
                }
                for(var i = 0; i < entities.length; ++i)
                {
                    if(entities[i][column_name] < min)
                    {
                        min = entities[i][column_name];
                    }
                }
                return min;
            case 'avg':
            case 'sum':
                var sum = 0;
                for(var i = 0; i < entities.length; ++i)
                {
                    sum += entities[i][column_name];
                }
                return operation_type == 'avg' ? sum / entities.length : sum;
        }
    },
    deleteEntity: function deleteEntity(table, id)
    {
        this.setupTable(table);
        if(!id || id == 'all')
        {
            for(var id_to_be_deleted in this.storage[table])
            {
                this.notify('destroyed',table,id_to_be_deleted);
            }
            this.storage[table] = {};
            return true;
        }
        else if(this.storage[table][id])
        {
            delete this.storage[table][id];
            this.notify('destroyed',table,id);
            return true;
        }
        return false;
    },
    findEntities: function findEntities(table, params)
    {
        if (typeof(table) == 'string' && !params)
        {
            //find by SQL
            var sql = table;
            var select = /\s*SELECT\s+.+\s+FROM\s+(\w+)\s+/i;
            var select_match = sql.match(select); 
            var table = select_match[1];
            sql = sql.replace(select,'');
            var params = {};
            var fragments = {
                limit: 'LIMIT\s+',
                order: 'ORDER\s+BY\s+',
                where: ''
            };
            var where = sql.match(/\s+WHERE\s+(.+)(ORDER\s+BY\s+|LIMIT\s+|$)/i);
            if(where)
            {
                params.where = where[1];
            }
            var order = sql.match(/ORDER\s+BY\s+(.+)(LIMIT\s+|$)/i);
            if(order)
            {
                params.order = order[1];
            }
            var limit = sql.match(/LIMIT\s+(.+)$/);
            if(limit)
            {
                params.limit = limit[1];
            }
        }
        else if(typeof(params) == 'undefined')
        {
            params = {};
        }
        this.setupTable(table);
        var entity_array = [];
        var table_data = this.storage[table];
        if(params && params.where && params.where.id)
        {
            if(table_data[parseInt(params.where.id)])
            {
                entity_array.push(table_data[parseInt(params.where.id)]);
            }
        }
        else
        {
            for(var id in table_data)
            {
                entity_array.push(table_data[id]);
            }
        }
        var filters = [];
        if(params && params.where)
        {
            filters.push(this.createWhere(params.where));
        }
        if(params && params.order)
        {
            filters.push(this.createOrderBy(params.order));
        }
        if(params && params.limit || params.offset)
        {
            filters.push(this.createLimit(params.limit,params.offset));
        }
        for(var i = 0; i < filters.length; ++i)
        {
            entity_array = filters[i](entity_array);
        }
        return this.iterableFromResultSet(entity_array);
    },
    transaction: function transaction(proceed)
    {
        var backup = {};
        for(var table_name in this.storage)
        {
            backup[table_name] = ActiveSupport.clone(this.storage[table_name]);
        }
        try
        {
            proceed();
        }
        catch(e)
        {
            this.storage = backup;
            throw e;
        }
    },
    /* PRVIATE */
    iterableFromResultSet: function iterableFromResultSet(result)
    {
        result.iterate = function iterate(iterator)
        {
            if (typeof(iterator) == 'number')
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
                    var row = ActiveSupport.clone(this[i]);
                    iterator(row);
                }
            }
        };
        return result;
    },
    setupTable: function setupTable(table)
    {
        if(!this.storage[table])
        {
            this.storage[table] = {};
        }
    },
    createWhere: function createWhere(where)
    {
        if(typeof(where) == 'string'){
            return function json_result_where_processor(result_set)
            {
                var response = [];
                var where_parser = new WhereParser();
                var abstract_syntax_tree = where_parser.parse(where);
                for(var i = 0; i < result_set.length; ++i)
                {
                    if(abstract_syntax_tree.execute(result_set[i],Adapters.HashTable.method_call_handler))
                    {
                        response.push(result_set[i]);
                    }
                }
                return response;
            };
        }else{
            return function json_result_where_processor(result_set)
            {
                var response = [];
                for(var i = 0; i < result_set.length; ++i)
                {
                    var included = true;
                    for(var column_name in where)
                    {
                        if((new String(result_set[i][column_name]).toString()) != (new String(where[column_name]).toString()))
                        {
                            included = false;
                            break;
                        }
                    }
                    if(included)
                    {
                        response.push(result_set[i]);
                    }
                }
                return response;
            };
        }
    },
    createLimit: function createLimit(limit,offset)
    {
        return function json_result_limit_processor(result_set)
        {
            return result_set.slice(offset || 0,limit);
        };
    },
    createOrderBy: function createOrderBy(order_by)
    {
        if(!order_by || order_by == '')
        {
            return function json_result_order_by_processor(result_set)
            {
                return result_set;
            };
        }
        var order_statements = order_by.split(',');
        var trimmed_order_statements = [];
        for(var i = 0; i < order_statements.length; ++i)
        {
            trimmed_order_statements.push(order_statements[i].replace(/(^[\s]+|[\s]+$)/g,'').replace(/[\s]{2,}/g,'').toLowerCase());
        }
        return function json_result_order_by_processor(result_set)
        {
            for(var i = 0; i < trimmed_order_statements.length; ++i)
            {
                var trimmed_order_statements_bits = trimmed_order_statements[i].split(/\s/);
                var column_name = trimmed_order_statements_bits[0];
                var reverse = trimmed_order_statements_bits[1] && trimmed_order_statements_bits[1] == 'desc';
                result_set = result_set.sort(function result_set_sorter(a,b){
                    return a[column_name] < b[column_name] ? -1 : a[column_name] > b[column_name] ? 1 : 0;
                });
                if(reverse)
                {
                    result_set = result_set.reverse();
                }
            }
            return result_set;
        };
    },
    //schema
    createTable: function createTable(table_name,columns)
    {
        if(!this.storage[table_name])
        {
            this.storage[table_name] = {};
        }
    },
    dropTable: function dropTable(table_name)
    {
        delete this.storage[table_name];
    },
    addColumn: function addColumn(table_name,column_name,data_type)
    {
        return; //no action needed
    },
    removeColumn: function removeColumn(table_name,column_name)
    {
        return; //no action needed
    },
    addIndex: function addIndex(table_name,column_names,options)
    {
        return; //no action needed
    },
    removeIndex: function removeIndex(table_name,index_name)
    {
        return; //no action needed
    },
    fieldIn: function fieldIn(field, value)
    {
        return value;
    },
    fieldOut: function fieldOut(field, value)
    {
        return value;
    }
});

Adapters.HashTable.method_call_handler = function method_call_handler(name,args)
{
    if(!Adapters.HashTable.MethodCallbacks[name])
    {
        name = name.toLowerCase().replace(/\_[0-9A-Z-a-z]/g,function camelize_underscores(match){
            return match.toUpperCase();
        });
    }
    if(!Adapters.HashTable.MethodCallbacks[name])
    {
        throw Errors.MethodDoesNotExist;
    }
    else
    {
        return Adapters.HashTable.MethodCallbacks[name].apply(Adapters.HashTable.MethodCallbacks[name],args);
    }
};
Adapters.HashTable.MethodCallbacks = (function(){
    var methods = {};
    var math_methods = ['abs','acos','asin','atan','atan2','ceil','cos','exp','floor','log','max','min','pow','random','round','sin','sqrt','tan'];
    for(var i = 0; i < math_methods.length; ++i)
    {
        methods[math_methods[i]] = (function math_method_generator(i){
            return function generated_math_method(){
                return Math[math_method[i]].apply(Math.math_method[i],arguments);
            };
        })(i);
    }
    return methods;
})();

Adapters.HashTable.connect = function(storage){
  return new Adapters.HashTable(storage || {});
};