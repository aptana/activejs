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

/**
 * @namespace {ActiveRecord}
 * @example
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
 * activerecord.js file and establish a connection, if you do not specify
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
 * will not be able to use the Migration features, since there are no table
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
 * The only rule for all ActiveRecord classes is that the related table in the
 * database must have an auto incrimenting 'id' property. If you are working
 * with a database table that already exists, you can create a model psuedo-class
 * using the create() method, passing the table name as the first parameter, and
 * any methods you want to define on that class as the second paramter:
 * 
 *     var Post = ActiveRecord.create('posts',{
 *         getWordCount: function(){
 *             return this.get('text').split(/\s+/).length;
 *         }
 *     });
 * 
 * This both returns the class, and stores it inside ActiveRecord.Models.Post. If
 * the table for your model does not yet exist you can use the define() method
 * which takes the desired table as the first argument, the fields as the second
 * and the methods as the third:
 * 
 *     var User = ActiveRecord.define('users',{
 *         username: '',
 *         password: '',
 *         post_count: 0,
 *         profile: {
 *             type: 'TEXT',
 *             value: ''
 *         }
 *     },{
 *         getFormattedProfile: function(){
 *             return Markdown.format(this.get('profile'));
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
 *         //this == model class
 *     };
 *     ActiveRecord.InstanceMethods.myInstanceMethod = function(){
 *         // this == model instance
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
 * record to ensure it is not out of synch with your DB at any time.
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
 * automatically garbage collected / stopped when the record or result set goes
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
 *     aaron.get('name') == 'Aaron!';
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
 *     var new_user = User.create({...}); //current_count incremented
 *     new_user.destroy();  //current_count decremented
 *     stop();
 *     User.create({...}); //current_count unchanged
 *
 * Lifecycle
 * ---------
 * There are 8 currently supported lifecycle events which allow granular control
 * over your data, and are convenient to build user interface components and
 * interactions around on the client side:
 * 
 * - afterFind
 * - afterInitialize
 * - beforeSave
 * - afterSave
 * - beforeCreate
 * - afterCreate
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
 *     ActiveRecord.observe('created',function(model_class,model_instance){});
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
 * handling relatioship logic:
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
*/
ActiveRecord = {
    /**
     * Defaults to false.
     * @alias ActiveRecord.logging
     * @property {Boolean}
     */
    logging: false,
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
     * Creates an ActiveRecord class, returning the class and storing it inside ActiveRecord.Models[model_name]. model_name is a singularized, capitalized form of table name.
     * @example
     *     var User = ActiveRecord.create('users');
     *     var u = User.find(5);
     * @alias ActiveRecord.create
     * @param {String} table_name
     * @param {Array} [methods]
     * @param {Function} [readyCallback]
     *      Must be specified if running in asynchronous mode.
     * @return {Object}
     */
    create: function create(table_name, methods)
    {
        if (!ActiveRecord.connection)
        {
            throw ActiveRecord.Errors.ConnectionNotEstablished;
        }

        //determine proper model name
        var model = null;
        var model_name = ActiveSupport.camelize(ActiveSupport.Inflector.singularize(table_name));
        model_name = model_name.charAt(0).toUpperCase() + model_name.substring(1);

        //constructor
        model = ActiveRecord.Models[model_name] = function initialize(data)
        {
            this.modelName = this.constructor.modelName;
            this.tableName = this.constructor.tableName;
            this._object = {};
            for (var key in data)
            {
                this.set(key, data[key]);
            }
            this._errors = [];
            this.notify('afterInitialize', data);
            if('created' in this._object)
            {
                this.observe('beforeCreate',ActiveSupport.bind(function set_created_date(){
                    this.set('created',ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss'));
                },this));
            }
            if('updated' in this._object)
            {
                this.observe('beforeSave',ActiveSupport.bind(function set_updated_date(){
                    this.set('updated',ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss'));
                },this));
            }
        };
        model.modelName = model_name;
        model.tableName = table_name;

        //mixin instance methods
        ActiveSupport.extend(model.prototype, ActiveRecord.InstanceMethods);

        //user defined take precedence
        if(methods && typeof(methods) != 'function')
        {
            ActiveSupport.extend(model.prototype, methods || {});
        }

        //mixin class methods
        ActiveSupport.extend(model, ActiveRecord.ClassMethods);

        //add lifecycle abilities
        ActiveEvent.extend(model);

        return model;
    }
};
