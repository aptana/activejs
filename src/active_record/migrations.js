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
 /**
  * @namespace {ActiveRecord.Migrations}
  * Migrations are a method of versioining the database schema used by your application. All of your migrations must be defined in an object assigned to ActiveRecord.Migrations.migrations. The keys need not be numerically sequential, but must be numeric (i.e. 1,2,3 or 100,200,300).
  *
  * Each migration object must have an up() and down() method which will recieve an ActiveRecord.Migrations.Schema object. createTable() and addColumn() both use the same syntax as define() to specify default values and field types.
  * 
  * ActiveRecord.Migrations.migrations = {
  *   1: {
  *       up: function(schema){
  *           schema.createTable('one',{
  *               a: '',
  *               b: {
  *                   type: 'TEXT',
  *                   value: 'default'
  *               }
  *           });
  *       },
  *       down: function(schema){
  *           schema.dropTable('one');
  *       }
  *   },
  *   2: {
  *       up: function(schema){
  *           schema.addColumn('one','c');
  *       },
  *       down: function(schema){
  *           schema.dropColumn('one','c');
  *       }
  *   }
  * };
  *
  * ActiveRecord.Migrations.migrate(); //will migrate to the highest available (2 in this case)
  * ActiveRecord.Migrations.migrate(0); //migrates down below 1, effectively erasing the schema
  * ActiveRecord.Migrations.migrate(1); //migrates to version 1
  */

 /**
  * If the table for your ActiveRecord does not exist, this will define the ActiveRecord and automatically create the table.
  * @example
  * <pre>
  *      var User = ActiveRecord.define('users',{
  *          name: '',
  *          password: '',
  *          comment_count: 0,
  *          profile: {
  *              type: 'text',
  *              value: ''
  *          },
  *          serializable_field: {}
  *      });
  *      var u = User.create({
  *          name: 'alice',
  *          serializable_field: {a: '1', b: '2'}
  *      });
  * </pre>
  * @alias ActiveRecord.define
  * @param {String} table_name
  * @param {Object} fields
  *      Should consist of column name, default value pairs. If an empty array or empty object is set as the default, any arbitrary data can be set and will automatically be serialized when saved. To specify a specific type, set the value to an object that contains a "type" key, with optional "length" and "value" keys.
  * @param {Object} [methods]
  * @param {Function} [readyCallback]
  *      Must be specified if running in asynchronous mode.
  * @return {Object}
  */
ActiveRecord.define = function define(table_name, fields, methods)
{
    var model = ActiveRecord.create(table_name,methods);
    Migrations.Schema.createTable(table_name,fields);
    Migrations.applyTypeConversionCallbacks(model,fields);
    return model;
};

var Migrations = {
    migrations: {},
    /**
     * Migrates a database schema to the given version.
     * @alias ActiveRecord.Migrations.migrate
     * @param {Number} target
     */
    migrate: function migrate(target)
    {
        if(typeof(target) == 'undefined' || target === false)
        {
            target = Migrations.max();
        }
        
        Migrations.setup();
        ActiveRecord.connection.log('Migrations.migrate(' + target + ') start.');
        
        var current_version = Migrations.current();
        ActiveRecord.connection.log('Current schema version is ' + current_version);
        
        var migrations, i, versions;
        Migrations.Meta.transaction(function(){
            if(target > current_version)
            {
                migrations = Migrations.collectAboveIndex(current_version,target);
                for(i = 0; i < migrations.length; ++i)
                {
                    ActiveRecord.connection.log('Migrating up to version ' + migrations[i][0]);
                    migrations[i][1].up(Migrations.Schema);
                    Migrations.Meta.create({
                        version: migrations[i][0]
                    });
                }
            }
            else if(target < current_version)
            {
                migrations = Migrations.collectBelowIndex(current_version,target);
                for(i = 0; i < migrations.length; ++i)
                {
                    ActiveRecord.connection.log('Migrating down to version ' + migrations[i][0]);
                    migrations[i][1].down(Migrations.Schema);
                }
                versions = Migrations.Meta.find({
                    all: true
                });
                for(i = 0; i < versions.length; ++i)
                {
                    if(versions[i].get('version') > target)
                    {
                        versions[i].destroy();
                    }
                }
                ActiveRecord.connection.log('Migrate to version ' + target + ' complete.');
            }
            else
            {
                ActiveRecord.connection.log('Current schema version is current, no migrations were run.');
            }
        },function(e){
            ActiveRecord.connection.log('Migration failed: ' + e);
        });
        ActiveRecord.connection.log('Migrations.migrate(' + target + ') finished.');
    },
    /**
     * Returns the current schema version number.
     * @alias ActiveRecord.Migrations.current
     * @return {Number}
     */
    current: function current()
    {
        Migrations.setup();
        return Migrations.Meta.max('version') || 0;
    },
    /**
     * Returns the highest key name in the ActiveRecord.Migrations hash.
     * @alias ActiveRecord.Migrations.max
     * @return {Number}
     */
    max: function max()
    {
        var max = 0;
        for(var key_name in Migrations.migrations)
        {
            key_name = parseInt(key_name);
            if(key_name > max)
            {
                max = key_name;
            }
        }
        return max;
    },
    setup: function setMigrationsTable()
    {
        if(!Migrations.Meta)
        {
            Migrations.Meta = ActiveRecord.define('schema_migrations',{
                version: 0
            });
            delete ActiveRecord.Models.SchemaMigrations;
        }
    },
    /**
     * Returns an array of [key_name,migration] pairs in the order they should be run to migrate down.
     * @private
     * @alias ActiveRecord.Migrations.collectBelowIndex
     * @param {Number} index
     * @param {Number} target
     * @return {Array}
     */
    collectBelowIndex: function collectBelowIndex(index,target)
    {
        return [[index,Migrations.migrations[index]]].concat(Migrations.collectMigrations(index,target + 1,'down'));
    },
    /**
     * Returns an array of [key_name,migration] pairs in the order they should be run to migrate up.
     * @private
     * @alias ActiveRecord.Migrations.collectAboveIndex
     * @param {Number} index
     * @param {Number} target
     * @return {Array}
     */
    collectAboveIndex: function collectAboveIndex(index,target)
    {
        return Migrations.collectMigrations(index,target,'up');
    },
    collectMigrations: function collectMigrations(index,target,direction)
    {
        var keys = [];
        for(var key_name in Migrations.migrations)
        {
            key_name = parseInt(key_name);
            if((direction == 'up' && key_name > index) || (direction == 'down' && key_name < index))
            {
                keys.push(key_name);
            }
        }
        keys = keys.sort();
        if(direction == 'down')
        {
            keys = keys.reverse();
        }
        var migrations = [];
        for(var i = 0; i < keys.length; ++i)
        {
            if((direction == 'down' && typeof(target) != 'undefined' && target > keys[i]) || (direction == 'up' && typeof(target) != 'undefined' && target < keys[i]))
            {
                break;
            }
            migrations.push([keys[i],Migrations.migrations[keys[i]]]);
        }
        return migrations;
    },
    applyTypeConversionCallbacks: function applyTypeConversionCallbacks(model,fields)
    {
        model.observe('afterInitialize', function applyFieldOut(record){
            for (var key in fields)
            {
                record.set(key,ActiveRecord.connection.fieldOut(fields[key], record.get(key)));
            }
        });
        model.observe('beforeSave', function applyFieldIn(record){
            for (var key in fields)
            {
                record.set(key,ActiveRecord.connection.fieldIn(fields[key], record.get(key)));
            }
        });
        model.observe('afterSave', function applyFieldOut(record){
            for (var key in fields)
            {
                record.set(key,ActiveRecord.connection.fieldOut(fields[key], record.get(key)));
            }
        });
        for (var key in fields)
        {
            Finders.generateFindByField(model, key);
            Finders.generateFindAllByField(model, key);
        }
        Finders.generateFindByField(model, 'id');
        //illogical, but consistent
        Finders.generateFindAllByField(model, 'id');
    },
    /**
     * @namespace {ActiveRecord.Migrations.Schema}
     * This object is passed to all migrations as the only parameter.
     */
    Schema: {
        /**
         * @param {String} table_name
         * @param {Object} columns
         */
        createTable: function createTable(table_name,columns)
        {
            return ActiveRecord.connection.createTable(table_name,columns);
        },
        /**
         * @param {String} table_name
         */
        dropTable: function dropTable(table_name)
        {
            return ActiveRecord.connection.dropTable(table_name);
        },
        /**
         * @param {String} table_name
         * @param {String} column_name
         * @param {mixed} [data_type]
         */
        addColumn: function addColumn(table_name,column_name,data_type)
        {
            return ActiveRecord.connection.addColumn(table_name,column_name,data_type);
        },
        /**
         * @param {String} table_name
         * @param {String} column_name
         */
        dropColumn: function removeColumn(table_name,column_name)
        {
            return ActiveRecord.connection.dropColumn(table_name,column_name);
        },
        /**
         * @param {String} table_name
         * @param {Array} column_names
         * @param {Object} options
         */
        addIndex: function addIndex(table_name,column_names,options)
        {
            return ActiveRecord.connection.addIndex(table_name,column_names,options);
        },
        /**
         * @param {String} table_name
         * @param {String} index_name
         */
        removeIndex: function removeIndex(table_name,index_name)
        {
            return ActiveRecord.connection.removeIndex(table_name,index_name);
        }
    }
};

ActiveRecord.Migrations = Migrations;