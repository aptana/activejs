/**
 * == ActiveRecord ==
 * 
 * ActiveRecord in ActiveJS shares a similar API to the Rails implementation
 * and includes lifecycle events, relationships, validations and REST
 * persistence.
 * 
 * Setup
 * -----
 * Before your models can be used you must call the `connect` method.
 * 
 *     ActiveRecord.connect()
 * 
 * Because the connection might involve a network call, a `ready` event is
 * available which is triggered when ActiveRecord has finished loading all
 * data, synchronously or asynchronously.
 * 
 *     ActiveRecord.observe('ready',function(){
 *     
 *     });
 * 
 * Defining Your Model
 * -------------------
 * ActiveRecord classes are created using the ActiveRecord.create method which
 * takes three arguments: the name of the table that the class will reference,
 * a field definition hash, and optionally a hash of instance methods that
 * will be added to the class. The field definition hash should contain pairs
 * of column names and default values.
 *
 *     var User = ActiveRecord.create('users',{
 *         username: '',
 *         password: '',
 *         post_count: 0,
 *         profile: ''
 *     },{
 *         getProfileWordCount: function(){
 *             return this.get('profile').split(/\s+/).length;
 *         }
 *     });
 * 
 * Creating Updating and Destroying Records
 * ----------------------------------------
 * CRUD operations are straightforward:
 *   
 *     var jessica = User.create({
 *         username: "Jessica",
 *         password: "rabbit"
 *     });
 *     
 *     jessica.updateAttribute('password','rabbit123');
 *     //or
 *     jessica.set('password','rabbit123');
 *     jessica.save();
 *     //or
 *     User.update(jessica.id,{
 *         password: 'rabbit123'
 *     });
 *     
 *     jessica.destroy();
 *     //or
 *     User.destroy(jessica.id);
 *     
 * Getters & Setters
 * -----------------
 * All column names that do not conflict with JavaScript keywords or ActiveRecord
 * methods are accessible via the columns' name. Attributes that conflict
 * are accessible via the `get` method. The **`set`** method must be used to set
 * a column's value**.
 * 
 *     jessica.username // 'Jessica'
 *     jessica.get('username'); // 'Jessica'
 * 
 *     jessica.username = 'new username'; //INCORRECT
 *     jessica.set('username','new username'); //CORRECT
 * 
 * Finding Records
 * ---------------
 * If a field defintion hash was used to create your model, the model class
 * will automatically have `findByX` and `findAllByX` methods created for it.
 * 
 *     User.findByUsername('Jessica');
 *     User.findAllByPassword(''); //finds all with blank passwords
 * 
 * Otherwise you can use the base `find` method, which takes a hash of options,
 * a numeric id or a complete SQL string:
 * 
 *     var posts = Post.find({
 *         all: true,
 *         order: 'id DESC',
 *         limit: 10
 *     });
 * 
 *     var post = Post.find(5);
 *     
 *     var post = Post.find({
 *         first: true,
 *         where: {
 *             id: 5
 *         }
 *     });
 * 
 *     var posts = Post.find('SELECT * FROM posts');
 * 
 * REST Persistence Setup
 * ----------------------
 * All **location** arguments described below can be either a string URI
 * or an array containing:
 * 
 * - String URI
 * - String HTTP method (GET,POST,PUT,DELETE)
 * - Object HTTP params or Function returning Object HTTP params
 * 
 * To load data from a remote source the first argument should be a location:
 * 
 *     ActiveRecord.connect('my_data_source.json');
 *     //or
 *     ActiveRecord.connect(['http://server/','POST',{session_id:1}]);
 * 
 * Data persistence back to a remote location must be specified per model /
 * per method. A hash of these specifications is passed as the second argument
 * to `connect`. The hash must be in the following format:
 * 
 *     ActiveRecord.connect(location,{
 *         ModelName: {
 *             method: location
 *         }
 *     });
 * 
 * "method" can be any of the following keys, each taking a location argument:
 * 
 * - create
 * - batch_create
 * - update
 * - batch_update
 * - destroy
 * - batch_destroy
 * 
 * "batch" methods are used when multiple records or ids are passed to `create`,
 * `update` or `destroy`. If no batch locations are specified and multiple ids
 * / records are passed to those methods, multiple HTTP requests will be
 * initiated.
 * 
 * URI strings in the location arguments can contain dynamic parameters
 * specified with a colon. For instance: "http://server/user/:id.json"
 * 
 * In addition there are two keys that allow modifications of data as it is
 * read or written from the remote source. These are independent of lifecycle
 * callbacks (afterUpdate, etc) and outbound_transform will not modify local
 * record attributes.
 * 
 * - inbound_transform: Function receiving an array of records.
 * - outbound_transform: Function receiving a single record.
 * 
 * A complete example for a single model would be:
 * 
 *     ActiveRecord.connect('/data.json',{
 *         User: {
 *             batch_destroy: ['/users/batch.json','DELETE'],
 *             destroy: ['/users/:id.json','DELETE'],
 *             batch_create: ['/users/batch.json','POST'],
 *             create: ['/users.json','POST'],
 *             update: ['/users/:id.json','PUT'],
 *             batch_update: ['/users/batch.json','PUT'],
 *             inbound_transform: function(users){
 *                 for(var id in users){
 *                     users[id].modified_at += time_zone_offset;
 *                 }
 *             },
 *             outbound_transform: function(user){
 *                 user.modified_at -= time_zone_offset;
 *             }
 *         }
 *     });
 * 
 * Server Request and Response Formats
 * -----------------------------------
 * All requests and responses to and from the server are JSON strings.
 * The inital data load request should return a JSON payload in this format:
 * 
 *     {
 *         table_name: {
 *             id: {
 *                 column: value
 *             }
 *         }
 *     }
 * 
 * In the "User" example above, the server would implement the following
 * request and response format:
 * 
 * <table>
 *     <tr>
 *       <th>JS Method</th>
 *       <th>HTTP Method</th>
 *       <th>URI</th>
 *       <th>Request</th>
 *       <th>Response</th>
 *     </tr>
 *     <tr>
 *       <td valign="top"><b>User</b>.destroy(batch)</td>
 *       <td valign="top">DELETE</td>
 *       <td valign="top">/users/batch.json</td>
 *       <td valign="top">{Users:[ {column: value, ...}, ... ]}</td>
 *       <td>[{column_name: value, ...}, ...]</td>
 *     </tr>
 *     <tr>
 *       <td valign="top"><b>User</b>.destroy</td>
 *       <td valign="top">DELETE</td>
 *       <td valign="top">/users/:id.json</td>
 *       <td valign="top">{User: {column: value, ...}}</td>
 *       <td>{column_name: value, ...}</td>
 *     </tr>
 *     <tr>
 *       <td valign="top"><b>User</b>.create(batch)</td>
 *       <td valign="top">POST</td>
 *       <td valign="top">/users/batch.json</td>
 *       <td valign="top">{Users:[ {column: value, ...}, ... ]}</td>
 *       <td>[{column_name: value, ...}, ...]</td>
 *     </tr>
 *     <tr>
 *       <td valign="top"><b>User</b>.create</td>
 *       <td valign="top">POST</td>
 *       <td valign="top">/users.json</td>
 *       <td valign="top">{User: {column: value, ...}}</td>
 *       <td>{column_name: value, ...}</td>
 *     </tr>
 *     <tr>
 *       <td valign="top"><b>User</b>.update</td>
 *       <td valign="top">PUT</td>
 *       <td valign="top">/Users/:id.json</td>
 *       <td valign="top">{User: {column: value, ...}}</td>
 *       <td>{column_name: value, ...}</td>
 *     </tr>
 *     <tr>
 *       <td valign="top"><b>User</b>.update(batch)</td>
 *       <td valign="top">PUT</td>
 *       <td valign="top">/users/batch.json</td>
 *       <td valign="top">{Users:[ {column: value, ...}, ... ]}</td>
 *       <td>[{column_name: value, ...}, ...]</td>
 *     </tr>
 * </table>
 * 
 * Using REST Persistence
 * ----------------------
 * In additon to configuring your models to use REST persistence, the
 * persistence needs to be triggered. By default calling `create`, `save`, etc
 * **will not** persist data back to the server. In order to trigger the
 * persistence pass an extra argument of true, or a function callback to any
 * of the following methods:
 * 
 * - Class.create
 * - Class.update
 * - Class.destroy
 * - instance.updateAttribute
 * - instance.updateAttributes
 * - instance.save
 * - instance.destroy
 * 
 * When the server responds the local data will be automatically updated
 * and the callback will receive the instance that was create / updated
 * / destroyed. If it was a batch operation the callback will receive an
 * array of instances.
 * 
 *      var jessica = User.create({
 *          username: 'Jessica',
 *          password: 'rabbit'
 *      },true);
 *      
 *      jessica.set('password','rabbit123');
 *      jessica.save(function(jessica){
 *           //the instance will contain any modifications
 *           //the server made to the attributes
 *      });
 * 
 * Class & Instance Methods
 * ------------------------
 * Class or instance methods can be added to all ActiveRecord models by using
 * the `InstanceMethods` and `ClassMethods` objects.
 * 
 *     ActiveRecord.ClassMethods.myClassMethod = function(){
 *         //this === model class
 *     };
 * 
 *     ActiveRecord.InstanceMethods.myInstanceMethod = function(){
 *         // this === model instance
 *     };
 * 
 * Lifecycle
 * ---------
 * There are 10 supported lifecycle events which allow granular control
 * over the lifecycle of your data:
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
 * callback. You can also call `stopObserving` to remove a given observer, and
 * use the `observeOnce` method (same arguments as `observe`) method if needed.
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
 * Validation is performed on each model instance when `create` or `save` is
 * called. Validation can be applied either by using pre defined validations or by
 * defining a `valid` method in the class definition. (or by both). If a record is
 * not valid, `save` will return false. `create` will always return the record,
 * but in either case you can call `getErrors` on the record to determine if
 * there are any errors present.
 * 
 *     User = ActiveRecord.create('users',{
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
 * The related model name should be specified with a string:
 * 
 *     User.hasMany('Comment'); //PREFFERED
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
 * ActiveJS:
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
 * has_and_belongs_to_many, and has_many :through are not yet implemented.
 **/

/** section: ActiveRecord
 * ActiveRecord
 **/
ActiveRecord = {
    /**
     * ActiveRecord.logging -> Boolean
     * Defaults to false.
     **/
    logging: false,
    /**
     * ActiveRecord.Models -> Object
     * Contains model_name, ActiveRecord.Class pairs.
     **/
    Models: {},
    /**
     * ActiveRecord.ClassMethods -> Object
     * Contains all methods that will become available to ActiveRecord classes.
     **/
    ClassMethods: {},
    /**
     * ActiveRecord.InstanceMethods -> Object
     * Contains all methods that will become available to ActiveRecord instances.
     **/
    InstanceMethods: {},
    /**
     * ActiveRecord.create(table_name[,fields][,instance_methods]) -> ActiveRecord.Model
     * ActiveRecord.create(options[,fields][,instance_methods]) -> ActiveRecord.Model
     * Creates an ActiveRecord class, returning the class and storing it inside
     * ActiveRecord.Models[model_name]. model_name is a singularized,
     * capitalized form of table name.
     *
     *     var User = ActiveRecord.create('users',{
     *         id: 0,
     *         name: ''
     *     });
     *     var u = User.find(5);
     * 
     * The fields hash should consist of column name, default value pairs. If an empty
     * array or empty object is set as the default, any arbitrary data
     * can be set and will automatically be serialized when saved. To
     * specify a specific type, set the value to an object that contains
     * a "type" key, with optional "length" and "value" keys.
     **/
    create: function create(options, fields, methods)
    {
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
            var model_name = ActiveSupport.String.camelize(ActiveSupport.String.singularize(options.tableName) || options.tableName);
            options.modelName = model_name.charAt(0).toUpperCase() + model_name.substring(1);
        }

        //constructor
        model = ActiveRecord.Models[options.modelName] = function initialize(data)
        {
            if(!ActiveRecord.connection)
            {
                throw ActiveRecord.Errors.ConnectionNotEstablished.getErrorString();
            }
            
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
                    var value = ActiveRecord.connection.fieldOut(key,field,this.get(key));
                    if(Adapters.objectIsFieldDefinition(value))
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
        /**
         * ActiveRecord.Model.modelName -> String
         **/
        model.modelName = options.modelName;
        /**
         * ActiveRecord.Model.tableName -> String
         **/
        model.tableName = options.tableName;
        /**
         * ActiveRecord.Model.primaryKeyName -> String
         **/
        model.primaryKeyName = 'id';
        
        //mixin instance methods
        ActiveSupport.Object.extend(model.prototype, ActiveRecord.InstanceMethods);

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
            ActiveSupport.Object.extend(model.prototype, methods);
        }

        //mixin class methods
        ActiveSupport.Object.extend(model, ActiveRecord.ClassMethods);

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

        ActiveSupport.Object.extend(model.prototype, {
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
        
        //setup relationship meta data container
        model.relationships = [];
        
        return model;
    }
};

/**
 * class ActiveRecord.Model
 * includes Observable
 * All classes created with [[ActiveRecord.create]] will contain these class and instance methods.
 * Models may also contain dynamically generated finder and relationship methods that are not
 * listed in the API documentation.
 **/