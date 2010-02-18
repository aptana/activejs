/**
 * @namespace {ActiveRecord.Migrations}
 * @example
 * 
 * Migrations
 * ----------
 * 
 * Migrations are a method of versioining the database schema used by your
 * application. All of your migrations must be defined in an object assigned
 * to ActiveRecord.Migrations.migrations. The keys need not be numerically
 * sequential, but must be numeric (i.e. 1,2,3 or 100,200,300).
 * 
 * Each migration object must have an up() and down() method which will
 * recieve an ActiveRecord.Migrations.Schema object. createTable() and
 * addColumn() both use the same syntax as define() to specify default
 * values and field types.
 * 
 *     ActiveRecord.Migrations.migrations = {
 *         1: {
 *             up: function(schema){
 *                 schema.createTable('one',{
 *                     a: '',
 *                     b: {
 *                         type: 'TEXT',
 *                         value: 'default'
 *                     }
 *                 });
 *             },
 *             down: function(schema){
 *                 schema.dropTable('one');
 *             }
 *         },
 *         2: {
 *             up: function(schema){
 *                 schema.addColumn('one','c');
 *             },
 *             down: function(schema){
 *                 schema.dropColumn('one','c');
 *             }
 *         }
 *     };
 *     
 *     ActiveRecord.Migrations.migrate(); //will migrate to the highest available (2 in this case)
 *     ActiveRecord.Migrations.migrate(0); //migrates down below 1, effectively erasing the schema
 *     ActiveRecord.Migrations.migrate(1); //migrates to version 1
 */
var Migrations = {
    fieldTypesWithDefaultValues: {
        'tinyint': 0,
        'smallint': 0,
        'mediumint': 0,
        'int': 0,
        'integer': 0,
        'bigint': 0,
        'float': 0,
        'double': 0,
        'double precision': 0,
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
        'mediumtext': '',
        'mediumblob': '',
        'longblob': '',
        'longtext': '',
        
        'enum': '',
        'set': ''
    },    
    migrations: {},
    /**
     * Migrates a database schema to the given version.
     * @alias ActiveRecord.Migrations.migrate
     * @param {Number} target
     */
    migrate: function migrate(target)
    {
        if(typeof(target) === 'undefined' || target === false)
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
        var max_val = 0;
        for(var key_name in Migrations.migrations)
        {
            key_name = parseInt(key_name, 10);
            if(key_name > max_val)
            {
                max_val = key_name;
            }
        }
        return max_val;
    },
    setup: function setMigrationsTable()
    {
        if(!Migrations.Meta)
        {
            Migrations.Meta = ActiveRecord.create('schema_migrations',{
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
            key_name = parseInt(key_name, 10);
            if((direction === 'up' && key_name > index) || (direction === 'down' && key_name < index))
            {
                keys.push(key_name);
            }
        }
        keys = keys.sort();
        if(direction === 'down')
        {
            keys = keys.reverse();
        }
        var migrations = [];
        for(var i = 0; i < keys.length; ++i)
        {
            if((direction === 'down' && typeof(target) !== 'undefined' && target > keys[i]) || (direction === 'up' && typeof(target) !== 'undefined' && target < keys[i]))
            {
                break;
            }
            migrations.push([keys[i],Migrations.migrations[keys[i]]]);
        }
        return migrations;
    },
    objectIsFieldDefinition: function objectIsFieldDefinition(object)
    {
        return typeof(object) === 'object' && ActiveSupport.keys(object).length === 2 && ('type' in object) && ('value' in object);
    },
    /**
     * @namespace {ActiveRecord.Migrations.Schema} This object is passed to all migrations as the only parameter.
     */
    Schema: {
        /**
         * @alias ActiveRecord.Migrations.Schema.createTable
         * @param {String} table_name
         * @param {Object} columns
         */
        createTable: function createTable(table_name,columns)
        {
            return ActiveRecord.connection.createTable(table_name,columns);
        },
        /**
         * @alias ActiveRecord.Migrations.Schema.dropTable
         * @param {String} table_name
         */
        dropTable: function dropTable(table_name)
        {
            return ActiveRecord.connection.dropTable(table_name);
        },
        /**
         * @alias ActiveRecord.Migrations.Schema.addColumn
         * @param {String} table_name
         * @param {String} column_name
         * @param {mixed} [data_type]
         */
        addColumn: function addColumn(table_name,column_name,data_type)
        {
            return ActiveRecord.connection.addColumn(table_name,column_name,data_type);
        },
        /**
         * @alias ActiveRecord.Migrations.Schema.dropColumn
         * @param {String} table_name
         * @param {String} column_name
         */
        dropColumn: function removeColumn(table_name,column_name)
        {
            return ActiveRecord.connection.dropColumn(table_name,column_name);
        },
        /**
         * @alias ActiveRecord.Migrations.Schema.addIndex
         * @param {String} table_name
         * @param {Array} column_names
         * @param {Object} options
         */
        addIndex: function addIndex(table_name,column_names,options)
        {
            return ActiveRecord.connection.addIndex(table_name,column_names,options);
        },
        /**
         * @alias ActiveRecord.Migrations.Schema.removeIndex
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
