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

Adapters.SQL = {
    schemaLess: false,
    insertEntity: function insertEntity(table, data)
    {
        var keys = ActiveSupport.keys(data).sort();
        var values = [];
        var args = [];
        for(var i = 0; i < keys.length; ++i)
        {
            args.push(data[keys[i]]);
            values.push('?');
        }
        args.unshift("INSERT INTO " + table + " (" + keys.join(',') + ") VALUES (" + values.join(',') + ")");
        var response = this.executeSQL.apply(this,args);
        var id = this.getLastInsertedRowId();
        var data_with_id = ActiveSupport.clone(data);
        data_with_id.id = id;
        this.notify('created',table,id,data_with_id);
        return response;
    },
    updateMultitpleEntities: function updateMultitpleEntities(table, updates, conditions)
    {
        var args = [];
        if(typeof(updates) != 'string')
        {
            var values = [];
            var keys = ActiveSupport.keys(updates).sort();
            for (var i = 0; i < keys.length; ++i)
            {
                args.push(updates[keys[i]]);
                values.push(updates[i] + " = ?");
            }
            updates = values.join(',');
        }
        args.unshift('UPDATE ' + table + ' SET ' + updates + this.buildWhereSQLFragment(conditions, args));
        return this.executeSQL.apply(this, args);
    },
    updateEntity: function updateEntity(table, id, data)
    {
        var keys = ActiveSupport.keys(data).sort();
        var args = [];
        var values = [];
        for (var i = 0; i < keys.length; ++i)
        {
            args.push(data[keys[i]]);
            values.push(keys[i] + " = ?");
        }
        args.push(id);
        args.unshift("UPDATE " + table + " SET " + values.join(',') + " WHERE id = ?");
        var response = this.executeSQL.apply(this, args);
        this.notify('updated',table,id,data);
        return response;
    },
    updateAttribute: function updateAttribute(table, id, key, value)
    {
        var args = ["UPDATE " + table + " SET " + key + " = ? WHERE id = ?", value, id];
        this.executeSQL.apply(this, args);
        this.notify('updated',table,id,this.findEntities(table,{
            id: id
        }).iterate(0));
    },
    calculateEntities: function calculateEntities(table, params, operation)
    {
        var process_count_query_result = function process_count_query_result(response)
        {
            if(!response)
            {
                return 0;
            }
            return parseInt(ActiveRecord.connection.iterableFromResultSet(response).iterate(0)['calculation']);
        };
        var args = this.buildSQLArguments(table, params, operation);
        return process_count_query_result(this.executeSQL.apply(this, args))
    },
    deleteEntity: function deleteEntity(table, id)
    {
        if (id == 'all')
        {
            var args = ["DELETE FROM " + table];
            var ids = [];
            var ids_result_set = this.executeSQL('SELECT id FROM ' + table);
            if(!ids_result_set)
            {
                return null;
            }
            this.iterableFromResultSet(ids_result_set).iterate(function id_collector_iterator(row){
                ids.push(row.id);
            });
            var response = this.executeSQL.apply(this,args);
            for(var i = 0; i < ids.length; ++i)
            {
                this.notify('destroyed',table,ids[i]);
            }
            return response;
        }
        else
        {
            var args = ["DELETE FROM " + table + " WHERE id = ?",id];
            var response = this.executeSQL.apply(this,args);
            this.notify('destroyed',table,id);
            return response;
        }
    },
    findEntities: function findEntities(table, params)
    {
        if (typeof(table) == 'string' && !params)
        {
            var args = [table];
        }
        else
        {
            var args = this.buildSQLArguments(table, params, false);
        }
        var response = this.executeSQL.apply(this,args);
        if (!response)
        {
            return false;
        }
        else
        {
            return ActiveRecord.connection.iterableFromResultSet(response);
        }
    },
    buildSQLArguments: function buildSQLArguments(table, params, calculation)
    {
        var args = [];
        var sql = 'SELECT ' + (calculation ? (calculation + ' AS calculation') : (params.select ? params.select.join(',') : '*')) + ' FROM ' + table +
            this.buildWhereSQLFragment(params.where, args) +
            (params.joins ? ' ' + params.joins : '') + 
            (params.order ? ' ORDER BY ' + params.order : '') + 
            (params.offset && params.limit ? ' LIMIT ' + params.offset + ',' + params.limit : '') + 
            (!params.offset && params.limit ? ' LIMIT ' + params.limit : '')
        ;
        args.unshift(sql);
        return args;
    },
    buildWhereSQLFragment: function buildWhereSQLFragment(fragment, args)
    {
        var where, keys, i;
        if(fragment && typeof(fragment) != "string")
        {
            where = '';
            keys = ActiveSupport.keys(fragment);
            for(i = 0; i < keys.length; ++i)
            {
                where += keys[i] + " = ? AND";
                args.push(typeof(fragment[keys[i]]) == 'number' ? (fragment[keys[i]]) : (new String(fragment[keys[i]]).toString()));
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
    fieldIn: function fieldIn(field, value)
    {
        if (typeof(field) == 'string')
        {
            return (new String(value)).toString();
        }
        if (typeof(field) == 'number')
        {
            return (new String(value)).toString();
        }
        //array or object
        if (typeof(value) == 'object' && (typeof(field.length) != 'undefined' || typeof(field.type) == 'undefined'))
        {
            return ActiveSupport.JSON.stringify(value);
        }
        //custom type (text, etc)
        return this.fieldIn(this.typeFromField(field), value);
    },
    fieldOut: function fieldOut(field, value)
    {
        //field has custom default value
        if (value == null || typeof(value) == 'undefined' && typeof(field) != 'object')
        {
            return field;
        }
        if (!value && typeof(field) == 'object' && typeof(field.length) == 'undefined' && ActiveSupport.keys(field).length > 0 && field.value)
        {
            return field.value;
        }
        //process value
        if (typeof(field) == 'string')
        {
            return value;
        }
        if (typeof(field) == 'number')
        {
            var trim = function(str)
            {
                return (new String(str)).toString().replace(/^\s+|\s+$/g,"");
            };
            return (trim(value).length > 0 && !(/[^0-9.]/).test(trim(value)) && (/\.\d/).test(trim(value))) ? parseFloat(new Number(value)) : parseInt(new Number(value));
        }
        //array or object (can come from DB (as string) or coding enviornment (object))
        if ((typeof(value) == 'string' || typeof(value) == 'object') && (typeof(field) == 'object' && (typeof(field.length) != 'undefined' || typeof(field.type) == 'undefined')))
        {
            if (typeof(value) == 'string')
            {
                return ActiveSupport.JSON.parse(value);
            }
            else
            {
                return value;
            }
        }
        //custom type (text, etc)
        return this.fieldOut(this.typeFromField(field), value);
    },
    typeFromField: function typeFromField(field, invert)
    {
        if (invert)
        {
            if (typeof(field) == 'string')
            {
                return 'VARCHAR(255)';
            }
            if (typeof(field) == 'number')
            {
                return 'INT';
            }
            return 'TEXT';
        }
        else
        {
            return {
                'tinyint': 0,
                'smallint': 0,
                'mediumint': 0,
                'int': 0,
                'integer': 0,
                'bitint': 0,
                'float': 0,
                'double': 0,
                'bouble precision': 0,
                'real': 0,
                'decimal': 0,
                'numeric': 0,

                'date': '',
                'datetime': '',
                'timestamp': '',
                'time': '',
                'year': '',

                'char': '',
                'varchar': '',
                'tinyblob': '',
                'tinytext': '',
                'blob': '',
                'text': '',
                'mediumblob': '',
                'longblob': '',
                'longtext': '',

                'enum': '',
                'set': ''
            }[field.type ? field.type.replace(/\(.*/g,'').toLowerCase() : ''];
        }
    }
};