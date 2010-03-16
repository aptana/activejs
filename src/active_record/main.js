/**
 * @namespace {ActiveRecord}
 * @example
 * 
 * ActiveRecord
 * ============
 * 
 * ActiveRecord.js is a cross browser, cross platform, stand-alone object
 * relational mapper. It shares a very similar vocabulary to the Ruby
 * ActiveRecord implementation, but uses JavaScript idioms and best
 * practices -- it is not a direct port. It can operate using an in memory
 * hash table, or with a SQL back end on the Jaxer platform (SQLite and
 * MySQL), Adobe's AIR (SQLite) and Google Gears (SQLite). Support
 * for the HTML 5 SQL storage spec is planned.
 * 
 * Setup
 * -----
 * To begin using ActiveRecord.js, you will need to include the
 * activerecord.js file and establish a connection. If you do not specify
 * a connection type, one will be automatically chosen.
 * 
 *     ActiveRecord.connect();
 * 
 * You can also specify a specific type of adapter. Jaxer requires
 * pre-configuring of the database for the entire application, and Gears
 * automatically configures the database, so simply passing the type of
 * connection is enough. In all of the SQLite implementations you can
 * optionally specify a database name (browser) or path (Jaxer):
 * 
 *     ActiveRecord.connect(ActiveRecord.Adapters.InMemory); //in JS memory
 *     ActiveRecord.connect(ActiveRecord.Adapters.JaxerMySQL); //Jaxer MySQL
 *     ActiveRecord.connect(ActiveRecord.Adapters.JaxerSQLite); //Jaxer SQLite
 *     ActiveRecord.connect(ActiveRecord.Adapters.AIR); //Adobe AIR
 *     ActiveRecord.connect(ActiveRecord.Adapters.Gears,'my_database'); //Gears or HTML5, name is optional
 *     
 * Once connected you can always execute SQL statements directly:
 * 
 *     ActiveRecord.execute('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, user_id, title, text)');
 *     
 * Logging (to either the Jaxer log or browser console) can be turned on by setting:
 * 
 *     ActiveRecord.logging = true;
 * 
 * InMemory Adapter
 * ----------------
 * If you are using a browser or platform that does not have access to a SQL
 * database, you can use the InMemory adapter which will store your objects
 * in memory. All features (including find by SQL) will still work, but you
 * will not be able to use the Migration features, since there is no table
 * schema. Since your objects will not persist, the second parameter to
 * establish a connection is a hash with the data you would like to use
 * in this format: {table_name: {id: row}}. The InMemory adapter will also
 * trigger three observable events that allow you to write an AJAX
 * persistence layer.
 * 
 *     ActiveRecord.connect(ActiveRecord.Adapters.InMemory,{
 *         table_one: {
 *             1: {row_data},
 *             2: {row_data}
 *         },
 *         table_two: {
 *             1: {row_data},
 *             2: {row_data}
 *         }
 *     });
 * 
 *     ActiveRecord.connection.observe('created',function(table_name,id,data){});
 *     ActiveRecord.connection.observe('updated',function(table_name,id,data){});
 *     ActiveRecord.connection.observe('destroyed',function(table_name,id){});
 *     
 * Defining Your Model
 * -------------------
 * ActiveRecord classes are created using the ActiveRecord.create method which
 * takes three arguments: the name of the table that the class will reference,
 * a field definition hash, and optionally a hash of instance methods that
 * will be added to the class. If the table does not exist it will be
 * automically created.
 *
 *     var User = ActiveRecord.create('users',{
 *         username: '',
 *         password: '',
 *         post_count: 0,
 *         profile: {
 *             type: 'TEXT',
 *             value: ''
 *         }
 *     },{
 *         getProfileWordCount: function(){
 *             return this.get('profile').split(/\s+/).length;
 *         }
 *     });
 * 
 * Class & Instance Methods
 * ------------------------
 * JavaScript does not have true static methods or classes, but in this case any
 * method of the User variable above is refered to as a class method, and any
 * method of a particular user (that the User class would find) is refered to as
 * an instance method. The most important class methods are create() and find():
 * 
 *     var jessica = User.create({
 *         username: 'Jessica',
 *         password: 'rabbit'
 *     });
 * 
 * Add new class or instance methods to all ActiveRecord models in the following
 * way:
 * 
 *     ActiveRecord.ClassMethods.myClassMethod = function(){
 *         //this === model class
 *     };
 *     ActiveRecord.InstanceMethods.myInstanceMethod = function(){
 *         // this === model instance
 *     };
 * 
 * Getters & Setters
 * -----------------
 * It is extremely important to note that all of the attributes/columns of the user
 * are accessible directly for reading (for convenience), but cannot be written
 * directly. You **must** use the set() method to set an attribute, you **should**
 * use the get() method to access all attributes, but you **must** use the get()
 * method if your attribute/column is a method of the object or a JavaScript
 * reserved keyword ('save,'initialize','default', etc).
 * 
 *     jessica.username // 'Jessica'
 *     jessica.get('username'); // 'Jessica'
 *     jessica.username = 'new username';
 *     jessica.get('username'); // 'Jessica'
 *     jessica.set('username','new username');
 *     jessica.get('username'); // 'new username'
 * 
 * When Data is Persisted
 * ----------------------
 * Data is only persisted to the database in three cases: when you explicitly call
 * save() on a record, when you call create() on a record, or create a child record
 * through a relationship (the method will contain the word "create" in this case),
 * or when you call updateAttribute() on a record. In the case of the latter, only
 * the attribute you update will be saved, the rest of the record will not be
 * persisted to the database, even if changes have been made. Calling save() may
 * add an "id" property to the record if it does not exist, but if there are no
 * errors, it's state will otherwise be unchanged. You can call refresh() on any
 * record to ensure it is not out of synch with your database at any time.
 * 
 * Finding Records
 * ---------------
 * If you created the User class using the define() method you automatically have
 * free "finder" methods:
 * 
 *     User.findByUsername('Jessica');
 *     User.findAllByPassword(''); //finds all with blank passwords
 * 
 * Otherwise you can use the base find() method, which takes a hash of options,
 * a numeric id or a complete SQL string:
 * 
 *     var posts = Post.find({
 *         all: true,
 *         order: 'id DESC',
 *         limit: 10
 *     });
 * 
 * Synchronization
 * ---------------
 * It is sometimes useful to keep records that have already been found in synch
 * with the database. Each found record has a synchronize() method that will keep
 * the values of that record in synch with the database. If you pass the parameter
 * synchronize: true to find(), all objects will have their values synchronized,
 * and in addition the result set itself will update as objects are destroyed or
 * created. Both features are relatively expensive operations, and are not
 * automatically garbage collected/stopped when the record or result set goes
 * out of scope, so you will need to explicitly stop both record and result set
 * synchronization.
 * 
 *     var aaron = User.findByName('aaron');
 *     aaron.synchronize();
 * 
 *     var aaron_clone = User.findByName('aaron');
 *     aaron_clone.set('name','Aaron!');
 *     aaron_clone.save();
 * 
 *     aaron.get('name') === 'Aaron!';
 *     aaron.stop(); //record will no longer be synchronized
 * 
 *     var users = User.find({
 *         all: true,
 *         synchronize: true
 *     });
 *     //users contains aaron
 *     aaron.destroy();
 *     //users will no longer contain aaron
 *     users.stop(); //result set will no longer be synchronized
 * 
 * Calculations (count, min, max, etc) can also be synchronized. As a second
 * parameter to the calculation function, pass a hash with a synchronize
 * property that contains a function. That function will be called when the
 * result of the calculation changes. Instead of returning the value of the
 * calculation the initial call to the calculation function will return a
 * function that will stop the synchronization.
 *
 *     var current_count;
 *     var stop = User.count({
 *         synchronize: function(updated_count){
 *             current_count = updated_count;
 *         }
 *     });
 *     var new_user = User.create({params}); //current_count incremented
 *     new_user.destroy();  //current_count decremented
 *     stop();
 *     User.create({params}); //current_count unchanged
 *
 * Lifecycle
 * ---------
 * There are 10 currently supported lifecycle events which allow granular control
 * over your data, and are convenient to build user interface components and
 * interactions around on the client side:
 * 
 * - afterFind
 * - afterInitialize
 * - beforeSave
 * - afterSave
 * - beforeCreate
 * - afterCreate
 * - beforeUpdate
 * - afterUpdate
 * - beforeDestroy
 * - afterDestroy
 * 
 * beforeSave and afterSave are called when both creating (inserting) and saving
 * (updating) a record. You can observe events on all instances of a class, or
 * just a particular instnace:
 * 
 *     User.observe('afterCreate',function(user){
 *         console.log('User with id of ' + user.id + ' was created.');
 *     });
 * 
 *     var u = User.find(5);
 *     u.observe('afterDestroy',function(){
 *         //this particular user was destroyed
 *     });
 * 
 * In the example above, each user that is created will be passed to the first
 * callback. You can also call stopObserving() to remove a given observer, and
 * use the observeOnce() method (same arguments as observe()) method if needed.
 * Alternately, each event name is also a convience method and the following
 * example is functionally equivelent to the prior example:
 * 
 *     User.afterCreate(function(user){
 *         console.log('User with id of ' + user.id + ' was created.');
 *     });
 * 
 *     var u = User.find(5);
 *     u.afterDestroy(function(){
 *         //this particular user was destroyed
 *     });
 * 
 * You can stop the creation, saving or destruction of a record by returning
 * false inside any observers of the beforeCreate, beforeSave and
 * beforeDestroy events respectively:
 * 
 *     User.beforeDestroy(function(user){
 *         if(!allow_deletion_checkbox.checked){
 *             return false; //record will not be destroyed
 *         }
 *     });
 *
 * Returning null, or returning nothing is equivelent to returning true in
 * this context and will not stop the event.
 *     
 * To observe a given event on all models, you can do the following: 
 * 
 *     ActiveRecord.observe('afterCreate',function(model_class,model_instance){});
 *     
 * afterFind works differently than all of the other events. It is only available
 * to the model class, not the instances, and is called only when a result set is
 * found. A find first, or find by id call will not trigger the event.
 * 
 *     User.observe('afterFind',function(users,params){
 *         //params contains the params used to find the array of users
 *     });
 *     
 * Validation
 * ----------
 * Validation is performed on each model instance when create() or save() is
 * called. Validation can be applied either by using pre defined validations
 * (validatesPresenceOf, validatesLengthOf, more will be implemented soon), or by
 * defining a valid() method in the class definition. (or by both). If a record is
 * not valid, save() will return false. create() will always return the record,
 * but in either case you can call getErrors() on the record to determine if
 * there are any errors present.
 * 
 *     User = ActiveRecord.define('users',{
 *         username: '',
 *         password: ''
 *     },{
 *         valid: function(){
 *             if(User.findByUsername(this.username)){
 *                 this.addError('The username ' + this.username + ' is already taken.');
 *             }
 *         }
 *     });
 * 
 *     User.validatesPresenceOf('password');
 * 
 *     var user = User.build({
 *         'username': 'Jessica'
 *     });
 * 
 *     user.save(); //false
 *     var errors = user.getErrors(); //contains a list of the errors that occured
 *     user.set('password','rabbit');
 *     user.save(); //true
 *     
 * Relationships
 * -------------
 * Relationships are declared with one of three class methods that are available
 *  to all models:
 * 
 * - belongsTo
 * - hasMany
 * - hasOne
 * 
 * The related model name can be specified in a number of ways, assuming that you
 * have a Comment model already declared, any of the following would work:
 * 
 *     User.hasMany(Comment)
 *     User.hasMany('Comment')
 *     User.hasMany('comment')
 *     User.hasMany('comments')
 * 
 * Each relationship adds various instance methods to each instance of that
 * model. This differs significantly from the Rails "magical array" style of
 * handling relationship logic:
 * 
 * Rails:
 * 
 *     u = User.find(5)
 *     u.comments.length
 *     u.comments.create :title => 'comment title'
 * 
 * ActiveRecord.js:
 * 
 *     var u = User.find(5);
 *     u.getCommentList().length;
 *     u.createComment({title: 'comment title'});
 * 
 * You can name the relationship (and thus the generate methods) by passing
 * a name parameter:
 * 
 *     TreeNode.belongsTo(TreeNode,{name: 'parent'});
 *     TreeNode.hasMany(TreeNode,{name: 'child'});
 *     //instance now have, getParent(), getChildList(), methods
 * 
 * Missing Features
 * ----------------
 * ActiveRecord.js will not support all of the advanced features of the Ruby
 * ActiveRecord implementation, but several key features are currently missing
 * and will be added soon:
 * 
 * - complete set of default validations from ActiveRecord::Validations::ClassMethods
 * - ActsAsList
 * - ActsAsTree
 * - hasMany :through (which will likely be the only supported many to many relationship)
 * 
 */
ActiveRecord = {
    /**
     * Defaults to false.
     * @alias ActiveRecord.logging
     * @property {Boolean}
     */
    logging: false,
    /**
     * Will automatically create a table when create() is called. Defaults to true.
     * @alias ActiveRecord.autoMigrate
     * @property {Boolean}
     */
    autoMigrate: true,
    /**
     * Tracks the number of records created.
     * @alias ActiveRecord.internalCounter
     * @property {Number}
     */
    internalCounter: 0,
    /**
     * Contains model_name, ActiveRecord.Class pairs.
     * @alias ActiveRecord.Models
     * @property {Object} 
     */
    Models: {},
    /**
     * @namespace {ActiveRecord.Class} Each generated class will inherit all of
     * the methods in this class, in addition to the ones dynamically generated
     * by finders, validators, relationships, or your own definitions.
     */
    /**
     * Contains all methods that will become available to ActiveRecord classes.
     * @alias ActiveRecord.ClassMethods
     * @property {Object} 
     */
    ClassMethods: {},
    /**
     * @namespace {ActiveRecord.Instance} Each found instance will inherit all of
      * the methods in this class, in addition to the ones dynamically generated
      * by finders, validators, relationships, or your own definitions.
     */
    /**
     * Contains all methods that will become available to ActiveRecord instances.
     * @alias ActiveRecord.InstanceMethods
     * @property {Object}
     */
    InstanceMethods: {},
    /**
     * Creates an ActiveRecord class, returning the class and storing it inside
     * ActiveRecord.Models[model_name]. model_name is a singularized,
     * capitalized form of table name.
     * @example
     *     var User = ActiveRecord.create('users');
     *     var u = User.find(5);
     * @alias ActiveRecord.create
     * @param {String} table_name
     * @param {Object} fields
     *      Should consist of column name, default value pairs. If an empty
     *      array or empty object is set as the default, any arbitrary data
     *      can be set and will automatically be serialized when saved. To
     *      specify a specific type, set the value to an object that contains
     *      a "type" key, with optional "length" and "value" keys.
     * @param {Object} [methods]
     * @return {Object}
     */
    create: function create(options, fields, methods)
    {
        if (!ActiveRecord.connection)
        {
            throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
        }
        
        if(typeof(options) === 'string')
        {
            options = {
                tableName: options
            };
        }

        //determine proper model name
        var model = null;
        if(!options.modelName)
        {
            var model_name = ActiveSupport.camelize(ActiveSupport.Inflector.singularize(options.tableName) || options.tableName);
            options.modelName = model_name.charAt(0).toUpperCase() + model_name.substring(1);
        }

        //constructor
        model = ActiveRecord.Models[options.modelName] = function initialize(data)
        {
            this._object = {};
            for(var key in data)
            {
                //third param is to suppress notifications on set
                this.set(key,data[key],true);
            }
            this._errors = [];
            var fields = this.constructor.fields;
            for(var key in fields)
            {
                var field = fields[key];
                if(!field.primaryKey)
                {
                    var value = ActiveRecord.connection.fieldOut(field,this.get(key));
                    if(Migrations.objectIsFieldDefinition(value))
                    {
                        value = value.value;
                    }
                    //don't supress notifications on set since these are the processed values
                    this.set(key,value);
                }
            }
            this._id = this.get(this.constructor.primaryKeyName);
            //performance optimization if no observers
            this.notify('afterInitialize', data);
        };
        model.modelName = options.modelName;
        model.tableName = options.tableName;
        model.primaryKeyName = 'id';
        
        //mixin instance methods
        ActiveSupport.extend(model.prototype, ActiveRecord.InstanceMethods);

        //user defined methods take precedence
        if(typeof(methods) == 'undefined')
        {
            //detect if the fields object is actually a methods object
            for(var method_name in fields)
            {
                if(typeof(fields[method_name]) == 'function')
                {
                    methods = fields;
                    fields = null; 
                }
                break;
            }
        }
        if(methods && typeof(methods) !== 'function')
        {
            ActiveSupport.extend(model.prototype, methods);
        }

        //mixin class methods
        ActiveSupport.extend(model, ActiveRecord.ClassMethods);

        //add lifecycle abilities
        ActiveEvent.extend(model);
        
        //clean and set field definition
        if(!fields)
        {
            fields = {};
        }
        var custom_primary_key = false;
        for(var field_name in fields)
        {
            if(typeof(fields[field_name]) === 'object' && fields[field_name].type && !('value' in fields[field_name]))
            {
                fields[field_name].value = null;
            }
            if(typeof(fields[field_name]) === 'object' && fields[field_name].primaryKey)
            {
                custom_primary_key = field_name;
            }
        }
        if(!custom_primary_key)
        {
            fields['id'] = {
                primaryKey: true
            };
        }
        model.fields = fields;
        if(custom_primary_key)
        {
            model.primaryKeyName = custom_primary_key;
        }

        ActiveSupport.extend(model.prototype, {
          modelName: model.modelName,
          tableName: model.tableName,
          primaryKeyName: model.primaryKeyName
        });
        
        //generate finders
        for(var key in model.fields)
        {
            Finders.generateFindByField(model,key);
            Finders.generateFindAllByField(model,key);
        }
        //get is a synonym for findBy<PrimaryKey>
        model.get = model['findBy' + ActiveSupport.camelize(model.primaryKeyName, true)];
        
        //setup relationship meta data container
        model.relationships = [];
        
        //create table for model if autoMigrate enabled
        if(ActiveRecord.autoMigrate)
        {
            Migrations.Schema.createTable(options.tableName,ActiveSupport.clone(model.fields));
        }
        
        return model;
    }
};
ActiveRecord.define = ActiveRecord.create;

/**
 * If the table for your ActiveRecord does not exist, this will define the
 * ActiveRecord and automatically create the table.
 * @alias ActiveRecord.define
 * @param {String} table_name
 * @param {Object} fields
 *      Should consist of column name, default value pairs. If an empty array or empty object is set as the default, any arbitrary data can be set and will automatically be serialized when saved. To specify a specific type, set the value to an object that contains a "type" key, with optional "length" and "value" keys.
 * @param {Object} [methods]
 * @param {Function} [readyCallback]
 *      Must be specified if running in asynchronous mode.
 * @return {Object}
 * @example
 * 
 *     var User = ActiveRecord.define('users',{
 *         name: '',
 *         password: '',
 *         comment_count: 0,
 *         profile: {
 *             type: 'text',
 *             value: ''
 *         },
 *         serializable_field: {}
 *     });
 *     var u = User.create({
 *         name: 'alice',
 *         serializable_field: {a: '1', b: '2'}
 *     }); 
 */
