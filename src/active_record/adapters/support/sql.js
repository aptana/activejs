Adapters.SQL = {
    schemaLess: false,
    insertEntity: function insertEntity(table, primary_key_name, data)
    {
        var keys = ActiveSupport.keys(data).sort();
        var values = [];
        var args = [];
        var quoted_keys = [];
        for(var i = 0; i < keys.length; ++i)
        {
            args.push(data[keys[i]]);
            values.push('?');
            quoted_keys.push(this.quoteIdentifier(keys[i]));
        }
        args.unshift("INSERT INTO " + table + " (" + quoted_keys.join(',') + ") VALUES (" + values.join(',') + ")");
        var response = this.executeSQL.apply(this,args);
        var id = data[primary_key_name] || this.getLastInsertedRowId();
        var data_with_id = ActiveSupport.clone(data);
        data_with_id[primary_key_name] = id;
        this.notify('created',table,id,data_with_id);
        return response;
    },
    updateMultitpleEntities: function updateMultitpleEntities(table, updates, conditions)
    {
        var args = [];
        if(typeof(updates) !== 'string')
        {
            var values = [];
            var keys = ActiveSupport.keys(updates).sort();
            for (var i = 0; i < keys.length; ++i)
            {
                args.push(updates[keys[i]]);
                values.push(this.quoteIdentifier(keys[i]) + " = ?");
            }
            updates = values.join(',');
        }
        args.unshift('UPDATE ' + table + ' SET ' + updates + this.buildWhereSQLFragment(conditions, args));
        return this.executeSQL.apply(this, args);
    },
    updateEntity: function updateEntity(table, primary_key_name, id, data)
    {
        var keys = ActiveSupport.keys(data).sort();
        var args = [];
        var values = [];
        for (var i = 0; i < keys.length; ++i)
        {
            args.push(data[keys[i]]);
            values.push(this.quoteIdentifier(keys[i]) + " = ?");
        }
        args.push(id);
        args.unshift("UPDATE " + table + " SET " + values.join(',') + " WHERE " + this.quoteIdentifier(primary_key_name) + " = ?");
        var response = this.executeSQL.apply(this, args);
        this.notify('updated',table,id,data);
        return response;
    },
    calculateEntities: function calculateEntities(table, params, operation)
    {
        var process_count_query_result = function process_count_query_result(response)
        {
            if(!response)
            {
                return 0;
            }
            return parseInt(ActiveRecord.connection.iterableFromResultSet(response).iterate(0)['calculation'], 10);
        };
        var args = this.buildSQLArguments(table, params, operation);
        return process_count_query_result(this.executeSQL.apply(this, args));
    },
    deleteEntity: function deleteEntity(table, primary_key_name, id)
    {
        var args, response;
        if (id === 'all')
        {
            args = ["DELETE FROM " + table];
            var ids = [];
            var ids_result_set = this.executeSQL('SELECT ' + this.quoteIdentifier(primary_key_name) + ' FROM ' + table);
            if(!ids_result_set)
            {
                return null;
            }
            this.iterableFromResultSet(ids_result_set).iterate(function id_collector_iterator(row){
                ids.push(row[primary_key_name]);
            });
            response = this.executeSQL.apply(this,args);
            for(var i = 0; i < ids.length; ++i)
            {
                this.notify('destroyed',table,ids[i]);
            }
            return response;
        }
        else
        {
            args = ["DELETE FROM " + table + " WHERE " + this.quoteIdentifier(primary_key_name) + " = ?",id];
            response = this.executeSQL.apply(this,args);
            this.notify('destroyed',table,id);
            return response;
        }
    },
    findEntitiesById: function findEntityById(table, primary_key_name, ids)
    {
        var response = this.executeSQL.apply(this,['SELECT * FROM ' + table + ' WHERE ' + this.quoteIdentifier(primary_key_name) + ' IN (' + ids.join(',') + ')']);
        if (!response)
        {
            return false;
        }
        else
        {
            return ActiveRecord.connection.iterableFromResultSet(response);
        }
    },
    findEntities: function findEntities(table, params)
    {
        var args;
        if (typeof(table) === 'string' && !table.match(/^\d+$/) && typeof(params) != 'object')
        {
            args = arguments;
        }
        else
        {
            args = this.buildSQLArguments(table, params, false);
        }
        var response = this.executeSQL.apply(this,args);
        if (!response)
        {
            return false;
        }
        else
        {
            var iterable_response = ActiveRecord.connection.iterableFromResultSet(response);
            if(params.callback)
            {
                var filtered_response = [];
                iterable_response.iterate(function(row){
                    if(params.callback(row))
                    {
                        filtered_response.push(row);
                    }
                });
                return filtered_response;
            }
            else
            {
                return iterable_response;
            }
        }
    },
    buildSQLArguments: function buildSQLArguments(table, params, calculation)
    {
        var args = [];
        var sql = 'SELECT ' + (calculation ? (calculation + ' AS calculation') : (params.select ? params.select.join(',') : '*')) + ' FROM ' + table +
            this.buildWhereSQLFragment(params.where, args) +
            (params.joins ? ' ' + params.joins : '') + 
            (params.group ? ' GROUP BY ' + params.group : '') + 
            (params.order ? ' ORDER BY ' + params.order : '') + 
            (params.offset && params.limit ? ' LIMIT ' + params.offset + ',' + params.limit : '') + 
            (!params.offset && params.limit ? ' LIMIT ' + params.limit : '');
        args.unshift(sql);
        return args;
    },
    buildWhereSQLFragment: function buildWhereSQLFragment(fragment, args)
    {
        var where, keys, i;
        if(fragment && ActiveSupport.isArray(fragment))
        {
            for(i = 1; i < fragment.length; ++i)
            {
                args.push(fragment[i]);
            }
            return ' WHERE ' + fragment[0];
        }
        else if(fragment && typeof(fragment) !== "string")
        {
            where = '';
            keys = ActiveSupport.keys(fragment);
            for(i = 0; i < keys.length; ++i)
            {
                where += this.quoteIdentifier(keys[i]) + " = ? AND ";
                var value;
                if(typeof(fragment[keys[i]]) === 'number')
                {
                    value = fragment[keys[i]];
                }
                else if(typeof(fragment[keys[i]]) == 'boolean')
                {
                    value = parseInt(Number(fragment[keys[i]]),10);
                }
                else
                {
                    value = String(fragment[keys[i]]);
                }
                args.push(value);
            }
            where = ' WHERE ' + where.substring(0,where.length - 4);
        }
        else if(fragment)
        {
            where = ' WHERE ' + fragment;
        }
        else
        {
            where = '';
        }
        return where;
    },
    //schema
    dropTable: function dropTable(table_name)
    {
        return this.executeSQL('DROP TABLE IF EXISTS ' + table_name);
    },
    addIndex: function addIndex(table_name,column_names,options)
    {
        
    },
    renameTable: function renameTable(old_table_name,new_table_name)
    {
        this.executeSQL('ALTER TABLE ' + old_table_name + ' RENAME TO ' + new_table_name);
    },
    removeIndex: function removeIndex(table_name,index_name)
    {
        
    },
    addColumn: function addColumn(table_name,column_name,data_type)
    {
        return this.executeSQL('ALTER TABLE ' + table_name + ' ADD COLUMN ' + this.getColumnDefinitionFragmentFromKeyAndColumns(key,columns));
    },
    fieldIn: function fieldIn(field, value)
    {
        if(value && value instanceof Date)
        {
            return ActiveSupport.dateFormat(value,'yyyy-mm-dd HH:MM:ss');
        }
        if(Migrations.objectIsFieldDefinition(field))
        {
            field = this.getDefaultValueFromFieldDefinition(field);
        }
        value = this.setValueFromFieldIfValueIsNull(field,value);
        if (typeof(field) === 'string')
        {
            return String(value);
        }
        if (typeof(field) === 'number')
        {
            return String(value);
        }
        if(typeof(field) === 'boolean')
        {
            return String(parseInt(Number(value),10));
        }
        //array or object
        if (typeof(value) === 'object' && !Migrations.objectIsFieldDefinition(field))
        {
            return ActiveSupport.JSON.stringify(value);
        }
    },
    fieldOut: function fieldOut(field, value)
    {
        if(Migrations.objectIsFieldDefinition(field))
        {
            //date handling
            if(typeof(value) == 'string' && /date/.test(field.type.toLowerCase()))
            {
                return ActiveSupport.dateFromDateTime(value);
            }
            field = this.getDefaultValueFromFieldDefinition(field);
        }
        value = this.setValueFromFieldIfValueIsNull(field,value);
        if (typeof(field) === 'string')
        {
            return value;
        }
        if(typeof(field) === 'boolean')
        {
            if(value === '0' || value === 0 || value === 'false')
            {
                value = false;
            }
            return !!value;
        }
        if (typeof(field) === 'number')
        {
            if (typeof(value) === 'number')
            {
                return value;
            };
            var t = ActiveSupport.trim(String(value));
            return (t.length > 0 && !(/[^0-9.]/).test(t) && (/\.\d/).test(t)) ? parseFloat(Number(value)) : parseInt(Number(value),10);
        }
        //array or object (can come from DB (as string) or coding enviornment (object))
        if ((typeof(value) === 'string' || typeof(value) === 'object') && (typeof(field) === 'object' && (typeof(field.length) !== 'undefined' || typeof(field.type) === 'undefined')))
        {
            if (typeof(value) === 'string')
            {
                return ActiveSupport.JSON.parse(value);
            }
            else
            {
                return value;
            }
        }
    },
    transaction: function transaction(proceed)
    {
        try
        {
            ActiveRecord.connection.executeSQL('BEGIN');
            proceed();
            ActiveRecord.connection.executeSQL('COMMIT');
        }
        catch(e)
        {
            ActiveRecord.connection.executeSQL('ROLLBACK');
            throw e;
        }
    }
};
