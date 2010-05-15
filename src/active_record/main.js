/**
 * == ActiveRecord ==
 * 
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
     * ActiveRecord.internalCounter -> Number
     * Tracks the number of records created.
     **/
    internalCounter: 0,
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
            var model_name = ActiveSupport.String.camelize(ActiveSupport.String.singularize(options.tableName) || options.tableName);
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
        model.modelName = options.modelName;
        model.tableName = options.tableName;
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
        //get is a synonym for findBy<PrimaryKey>
        model.get = model['findBy' + ActiveSupport.String.camelize(model.primaryKeyName, true)];
        
        //setup relationship meta data container
        model.relationships = [];
        
        return model;
    }
};

/**
 * class ActiveRecord.Model  
 **/