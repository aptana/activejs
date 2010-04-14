/**
 * In memory, non persistent storage.
 * @alias ActiveRecord.Adapters.InMemory
 * @property {ActiveRecord.Adapter}
 */
Adapters.InMemory = function InMemory(storage){
    this.lastInsertId = null;
    this.setStorage(storage);
};

ActiveSupport.extend(Adapters.InMemory.prototype,Adapters.InstanceMethods);

ActiveSupport.extend(Adapters.InMemory.prototype,{
    schemaLess: true,
    entityMissing: function entityMissing(id)
    {
        return {};
    },
    /**
     * @alias ActiveRecord.connection.setStorage
     * @param {Object} storage
     * Only for use with the InMemory adapter.
     * 
     * Sets the storage (in memory database hash) affter connect() has been called.
     * 
     *     ActiveRecord.connect(ActiveRecord.Adapters.InMemory);
     *     ActiveRecord.connection.setStorage({my_table:{...}});
     */
    setStorage: function setStorage(storage)
    {
        this.storage = typeof(storage) === 'string' ? ActiveSupport.JSON.parse(storage) : (storage || {});
        ActiveRecord.Indicies.initializeIndicies(this.storage);
    },
    /**
     * @alias ActiveRecord.connection.serialize
     * @return {String} json
     * Only for use with the InMemory adapter.
     *
     * Returns a JSON representation of the storage hash that the InMemory adapter
     * uses.
     */
    serialize: function serialize()
    {
        return ActiveSupport.JSON.stringify(this.storage);
    },
    executeSQL: function executeSQL(sql)
    {
        ActiveRecord.connection.log('Adapters.InMemory could not execute SQL:' + sql);
    },
    insertEntity: function insertEntity(table, primary_key_name, data)
    {
        this.setupTable(table);
        var max = 1;
        var table_data = this.storage[table];
        if(!data.id)
        {
            for(var id in table_data)
            {
                if(parseInt(id, 10) >= max)
                {
                    max = parseInt(id, 10) + 1;
                }
            }
            data.id = max;
        }
        this.lastInsertId = data.id;
        this.storage[table][data.id] = data;
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
    updateEntity: function updateEntity(table, primary_key_name, id, data)
    {
        this.setupTable(table);
        if(data[primary_key_name] != id)
        {
            //edge case where id has changed
            this.storage[table][data[primary_key_name]] = data;
            delete this.storage[table][id];
        }
        else
        {
            this.storage[table][id] = data;
        }
        this.notify('updated',table,id,data);
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
                    if(parseInt(entities[i][column_name], 10) > max)
                    {
                        max = parseInt(entities[i][column_name], 10);
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
                return operation_type === 'avg' ? sum / entities.length : sum;
        }
    },
    deleteEntity: function deleteEntity(table, primary_key_name, id)
    {
        this.setupTable(table);
        if(!id || id === 'all')
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
    findEntitiesById: function findEntitiesById(table, primary_key_name, ids)
    {
        var table_data = this.storage[table];
        var response = [];
        for(var i = 0; i < ids.length; ++i)
        {
            var id = ids[i];
            if(table_data[id])
            {
                response.push(table_data[id]);
            }
        }
        return this.iterableFromResultSet(response);
    },
    findEntities: function findEntities(table, params)
    {
        if (typeof(table) === 'string' && !table.match(/^\d+$/) && typeof(params) != 'object')
        {
            //find by SQL

            //replace ? in SQL strings
            var sql = table;
            var sql_args = ActiveSupport.arrayFrom(arguments).slice(1);
            for(var i = 0; i < sql_args.length; ++i)
            {
                sql = sql.replace(/\?/,ActiveRecord.escape(sql_args[i]));
            }
            var response = this.paramsFromSQLString(sql);
            table = response[0];
            params = response[1];
        }
        else if(typeof(params) === 'undefined')
        {
            params = {};
        }
        this.setupTable(table);
        var entity_array = [];
        var table_data = this.storage[table];
        if(params && params.where && params.where.id)
        {
            if(table_data[params.where.id])
            {
                entity_array.push(table_data[params.where.id]);
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
        if(params && params.group)
        {
            filters.push(this.createGroupBy(params.group));
        }
        if(params && params.where)
        {
            filters.push(this.createWhere(params.where));
        }
        if(params && params.callback)
        {
            filters.push(this.createCallback(params.callback));
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
    paramsFromSQLString: function paramsFromSQLString(sql)
    {
        var params = {};
        var select = /\s*SELECT\s+.+\s+FROM\s+(\w+)\s+/i;
        var select_match = sql.match(select); 
        var table = select_match[1];
        sql = sql.replace(select,'');
        var fragments = [
            ['limit',/(^|\s+)LIMIT\s+(.+)$/i],
            ['order',/(^|\s+)ORDER\s+BY\s+(.+)$/i],
            ['group',/(^|\s+)GROUP\s+BY\s+(.+)$/i],
            ['where',/(^|\s+)WHERE\s+(.+)$/i]
        ];
        for(var i = 0; i < fragments.length; ++i)
        {
            var param_name = fragments[i][0];
            var matcher = fragments[i][1];
            var match = sql.match(matcher);
            if(match)
            {
                params[param_name] = match[2];
                sql = sql.replace(matcher,'');
            }
        }
        return [table,params];
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
        if(ActiveSupport.isArray(where))
        {
            var where_fragment = where[0];
            for(var i = 1; i < where.length; ++i)
            {
                where_fragment = where_fragment.replace(/\?/,ActiveRecord.escape(where[i]));
            }
            where = where_fragment;
        }
        if(typeof(where) === 'string')
        {
            return function json_result_where_processor(result_set)
            {
                var response = [];
                var where_parser = new WhereParser();
                var abstract_syntax_tree = where_parser.parse(where);
                for(var i = 0; i < result_set.length; ++i)
                {
                    if(abstract_syntax_tree.execute(result_set[i],Adapters.InMemory.method_call_handler))
                    {
                        response.push(result_set[i]);
                    }
                }
                return response;
            };
        }
        else
        {
            return function json_result_where_processor(result_set)
            {
                var response = [];
                for(var i = 0; i < result_set.length; ++i)
                {
                    var included = true;
                    for(var column_name in where)
                    {
                        if((String(result_set[i][column_name])) != (String(where[column_name])))
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
    createCallback: function createCallback(callback)
    {
        return function json_result_callback_processor(result_set)
        {
            var response = [];
            for(var i = 0; i < result_set.length; ++i)
            {
                if(callback(result_set[i]))
                {
                    response.push(result_set[i]);
                }
            }
            return response;
        };
    },
    createLimit: function createLimit(limit,offset)
    {
        return function json_result_limit_processor(result_set)
        {
            return result_set.slice(offset || 0,limit);
        };
    },
    createGroupBy: function createGroupBy(group_by)
    {
        if(!group_by || group_by == '')
        {
            return function json_result_group_by_processor(result_set)
            {
                return result_set;
            }
        }
        var group_key = group_by.replace(/(^[\s]+|[\s]+$)/g,'');
        return function json_result_group_by_processor(result_set)
        {
            var response = [];
            var indexed_by_group = {};
            for(var i = 0; i < result_set.length; ++i)
            {
                indexed_by_group[result_set[i][group_key]] = result_set[i];
            }
            for(var group_key_value in indexed_by_group)
            {
                response.push(indexed_by_group[group_key_value]);
            }
            return response;
        }
    },
    createOrderBy: function createOrderBy(order_by)
    {
        if(!order_by || order_by === '')
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
                var reverse = trimmed_order_statements_bits[1] && trimmed_order_statements_bits[1] === 'desc';
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
    cachedObjectIsFieldDefinitionResults: {},
    cachedGetDefaultValueFromFieldDefinitionResults: {},
    fieldIn: function fieldIn(field, value)
    {
        if(value && value instanceof Date)
        {
            return ActiveSupport.dateFormat(value,'yyyy-mm-dd HH:MM:ss');
        }
        if(typeof(this.cachedObjectIsFieldDefinitionResults[field]) == 'undefined')
        {
            this.cachedObjectIsFieldDefinitionResults[field] = Migrations.objectIsFieldDefinition(field);
        }
        if(this.cachedObjectIsFieldDefinitionResults[field])
        {
            if(typeof(this.cachedGetDefaultValueFromFieldDefinitionResults[field]) == 'undefined')
            {
                this.cachedGetDefaultValueFromFieldDefinitionResults[field] = this.getDefaultValueFromFieldDefinition(field);
            }
            field = this.cachedGetDefaultValueFromFieldDefinitionResults[field];
        }
        value = this.setValueFromFieldIfValueIsNull(field,value);
        return value;
    },
    fieldOut: function fieldOut(field, value)
    {
        if(typeof(this.cachedObjectIsFieldDefinitionResults[field]) == 'undefined')
        {
            this.cachedObjectIsFieldDefinitionResults[field] = Migrations.objectIsFieldDefinition(field);
        }
        if(this.cachedObjectIsFieldDefinitionResults[field])
        {
            //date handling
            if(field.type.toLowerCase().match(/date/) && typeof(value) == 'string')
            {
                return ActiveSupport.dateFromDateTime(value);
            }
            if(typeof(this.cachedGetDefaultValueFromFieldDefinitionResults[field]) == 'undefined')
            {
                this.cachedGetDefaultValueFromFieldDefinitionResults[field] = this.getDefaultValueFromFieldDefinition(field);
            }
            field = this.cachedGetDefaultValueFromFieldDefinitionResults[field];
        }
        value = this.setValueFromFieldIfValueIsNull(field,value);
        return value;
    }
});

Adapters.InMemory.method_call_handler = function method_call_handler(name,row,args)
{
    if(!Adapters.InMemory.MethodCallbacks[name])
    {
        name = name.toLowerCase().replace(/\_[0-9A-Z-a-z]/g,function camelize_underscores(match){
            return match.toUpperCase();
        });
    }
    if(!Adapters.InMemory.MethodCallbacks[name])
    {
        throw Errors.MethodDoesNotExist.getErrorString('"' + name + '"' + ' was called from a sql statement.');
    }
    else
    {
        return Adapters.InMemory.MethodCallbacks[name].apply(Adapters.InMemory.MethodCallbacks[name],[row].concat(args || []));
    }
};
Adapters.InMemory.MethodCallbacks = (function(){
    var methods = {};
    var math_methods = ['abs','acos','asin','atan','atan2','ceil','cos','exp','floor','log','max','min','pow','random','round','sin','sqrt','tan'];
    for(var i = 0; i < math_methods.length; ++i)
    {
        methods[math_methods[i]] = (function math_method_generator(i){
            return function generated_math_method(){
                return Math[math_methods[i]].apply(Math.math_methods[i],ActiveSupport.arrayFrom(arguments).slice(1));
            };
        })(i);
    }
    return methods;
})();

Adapters.InMemory.connect = function(storage){
  return new Adapters.InMemory(storage || {});
};
