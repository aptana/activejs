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
 * @namespace {ActiveRecord}
 * @author Aptana Inc.
 * @version 1.0b1
 * @projectDescription

 * ActiveRecord.js is a cross browser, cross platform, stand-alone object relational mapper. It shares a very similar vocabulary to the Ruby ActiveRecord implementation, but uses JavaScript idioms and best practices -- it is not a direct port. Aptana's Jaxer platform (SQLite and MySQL) and Google Gears (SQLite) are the currently supported enviornments. Support for the HTML 5 SQL storage spec is planned.
 * 
 * To begin using ActiveRecord.js, you will need to include the activerecord.js file and establish a connection. Jaxer requires pre-configuring of the database for the entire application, and Gears automatically configures the database, so simply passing the type of connection is enough. In all of the SQLite implementations you can optionally specify a database name (browser) or path (Jaxer):
 * 
 * 	ActiveRecord.connect(ActiveRecord.Adapters.JaxerMySQL); //Jaxer MySQL
 * 	ActiveRecord.connect(ActiveRecord.Adapters.JaxerSQLite); //Jaxer SQLite
 * 	ActiveRecord.connect(ActiveRecord.Adapters.Local,'my_database'); //Gears or HTML5, name is optional
 * 
 * Once connected you can always execute SQL statements directly:
 * 
 * 	ActiveRecord.execute('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, user_id, title, text)');
 * 	
 * Logging (to either the Jaxer log or browser console) can be turned on by setting:
 * 
 * 	ActiveRecord.logging = true;
 * 
 * The only rule for all ActiveRecord classes is that the related table in the database must have an auto incrimenting 'id' property. If you are working with a database table that already exists, you can create a model psuedo-class using the create() method, passing the table name as the first parameter, and any methods you want to define on that class as the second paramter:
 * 
 * 	var Post = ActiveRecord.create('posts',{
 * 		getWordCount: function(){
 * 			return this.get('text').split(/\s+/).length;
 * 		}
 * 	});
 * 
 * This both returns the class, and stores it inside ActiveRecord.Models.Post. If the table for your model does not yet exist you can use the define() method which takes the desired table as the first argument, the fields as the second and the methods as the third:
 * 
 * 	var User = ActiveRecord.define('users',{
 * 		username: '',
 * 		password: '',
 * 		post_count: 0,
 * 		profile: {
 * 			type: 'TEXT',
 * 			value: ''
 * 		}
 * 	},{
 * 		getFormattedProfile: function(){
 * 			return Markdown.format(this.get('profile'));
 * 		}
 * 	});
 * 
 * JavaScript does not have true static methods or classes, but in this case any method of the User variable above is refered to as a class method, and any method of a particular user (that the User class would find) is refered to as an instance method. The most important class methods as create() and find():
 * 
 * 	var jessica = User.create({
 * 		username: 'Jessica',
 * 		password: 'rabbit'
 * 	});
 * 	
 * It is extremely important to note that all of the attributes/columns of the user are accessible directly for reading (for convenience), but cannot be written directly. You <b>must</b> use the set() method to set an attribute, you <b>should</b> use the get() method to access all attributes, but you <b>must</b> use the get() method if your attribute/column is a method of the object or a JavaScript reserved keyword ('save,'initialize','default', etc). 
 * 
 * 	jessica.username // 'Jessica'
 * 	jessica.get('username'); // 'Jessica'
 * 	jessica.username = 'new username';
 * 	jessica.get('username'); // 'Jessica'
 * 	jessica.set('username','new username');
 * 	jessica.get('username'); // 'new username'
 * 
 * If you created the User class using the define() method you automatically have free "finder" methods:
 * 	
 * 	User.findByUsername('Jessica');
 * 	User.findAllByPassword(''); //finds all with blank passwords
 * 	
 * Otherwise you can use the base find() method, which takes a hash of options, a numeric id or a complete SQL string:
 * 
 * 	var posts = Post.find({
 * 		all: true,
 * 		order: 'id DESC',
 * 		limit: 10
 * 	});
 * 	
 * There are 7 currently supported lifecycle events which allow granular control over your data, and are convenient to build user interface components and interactions around on the client side:
 * 
 * 	- afterInitialize
 * 	- beforeSave
 * 	- afterSave
 * 	- beforeCreate
 * 	- afterCreate
 * 	- beforeDestroy
 * 	- afterDestroy
 * 
 * beforeSave and afterSave are called when both creating (inserting) and saving (updating) a record. You can observe events on all instances of a class, or just a particular instnace:
 * 
 * 	User.observe('afterCreate',function(user){
 * 		console.log('User with id of ' + user.id + ' was created.');
 * 	});
 * 	
 * 	var u = User.find(5);
 * 	u.observe('afterDestroy',function(){
 * 		//this particular user was destroyed
 * 	});
 * 
 * In the example above, each user that is created will be passed to the first callback. You can also call stopObserving() to remove a given observer, and use the observeOnce() method (same arguments as observe()) method if needed. Alternately, each event name is also a convience method and the following example is functionally equivelent to the prior example:
 * 
 * 	User.afterCreate(function(user){
 * 		console.log('User with id of ' + user.id + ' was created.');
 * 	});
 * 	
 * 	var u = User.find(5);
 * 	u.afterDestroy(function(){
 * 		//this particular user was destroyed
 * 	});
 * 
 * You can stop the creation, saving or destruction of a record by throwing the $break variable inside any observers of the beforeCreate, beforeSave and beforeDestroy events respectively:
 * 
 * 	User.beforeDestroy(function(user){
 * 		if(!allow_deletion_checkbox.checked){
 * 			throw $break; //record will not be destroyed
 * 		}
 * 	});
 * 
 * ActiveRecord.js will not support all of the advanced features of the Ruby ActiveRecord implementation, but several key features are currently missing and will be added soon:
 * 
 * 	- complete set o f default validations from ActiveRecord::Validations::ClassMethods
 * 	- ActsAsList
 * 	- ActsAsTree
 * 	- hasMany :through (which will likely be the only supported many to many relationship)
*/
ActiveRecord = {
    /**
     * @type {Boolean} Defaults to false.
     */
    logging: false,
    /**
     * @type {Number} Tracks the number of records created.
     */
    internalCounter: 0,
    /**
     * @type {Object} Contains model_name, ModelClass pairs.
     */
    Models: {},
    /**
     * @type {Object} Contains all methods that will become available to ActiveRecord classes.
     */
    ClassMethods: {},
    /**
     * @type {Object} Contains all methods that will become available to ActiveRecord instances.
     */
    InstanceMethods: {},
    /**
     * Creates an ActiveRecord class, returning the class and storing it inside ActiveRecord.Models[model_name]. model_name is a singularized, capitalized form of table name.
     * @example
     * <pre>
     *      var User = ActiveRecord.create('users');
     *      var u = User.find(5);
     * </pre>
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