ActiveSupport.Object.extend(ActiveRecord.InstanceMethods,{
    /**
     * ActiveRecord.Model#set(key,value[,suppress_notifications = false]) -> null
     * Sets a given key on the object. You must use this method to set a property, properties assigned directly (instance.key_name = value) will not persist to the database and may cause errors.
     **/
    set: function set(key, value, suppress_notifications)
    {
        if (typeof(this[key]) !== "function")
        {
            this[key] = value;
        }
        this._object[key] = value;
        if(!suppress_notifications)
        {
            if(this._observers && ('set' in this._observers))
            {
                this.notify('set',key,value);
            }
        }
    },
    /**
     * ActiveRecord.Model#get(key) -> mixed
     * Get a given key on the object. If your field name is a reserved word, or the name of a method (save, updateAttribute, etc) you must use the get() method to access the property. For convenience non reserved words (title, user_id, etc) can be accessed directly (instance.key_name)
     **/
    get: function get(key)
    {
        return this._object[key];
    },
    /**
     * ActiveRecord.Model#toObject([transform_callback]) -> Object
     * Returns a vanilla version of the object, with just the data and no methods.
     * - transform_callback (Function) Will recieve and should reutrn a hash of attributes.
     **/
    toObject: function toObject(callback)
    {
        var response = ActiveSupport.Object.clone(this._object);
        if(callback)
        {
            response = callback(response);
        }
        return response;
    },
    /**
     * ActiveRecord.Model#keys() -> Array
     * Returns an array of the column names that the instance contains.
     **/
    keys: function keys()
    {
        var keys_array = [];
        for(var key_name in this._object)
        {
            keys_array.push(key_name);
        }
        return keys_array;
    },
    /**
     * ActiveRecord.Model#values() -> Array
     * Returns an array of the column values that the instance contains.
     **/
    values: function values()
    {
        var values_array = [];
        for(var key_name in this._object)
        {
            values_array.push(this._object[key_name]);
        }
        return values_array;
    },
    /**
     * ActiveRecord.Model#updateAttribute(key,value) -> Boolean
     * Sets a given key on the object and immediately persists that change to the database triggering any callbacks or validation .
     **/
    updateAttribute: function updateAttribute(key, value)
    {
        this.set(key, value);
        return this.save();
    },
    /**
     * ActiveRecord.Model#updateAttributes(attributes) -> Boolean
     * Updates all of the passed attributes on the record and then calls save().
     **/
    updateAttributes: function updateAttributes(attributes)
    {
        for(var key in attributes)
        {
            this.set(key, attributes[key]);
        }
        return this.save();
    },
    /**
     * ActiveRecord.Model#reload() -> Boolean
     * Loads the most current data for the object from the database.
     **/
    reload: function reload()
    {
        if (this._id === undefined)
        {
            return false;
        }
        var record = this.constructor.get(this._id);
        if (!record)
        {
            return false;
        }
        this._object = {};
        var raw = record.toObject();
        for (var key in raw)
        {
            this.set(key,raw[key]);
        }
        return true;
    },
    /**
     * ActiveRecord.Model#save([force_created_mode = false]) -> Boolean
     * - force_created_mode (Boolean): Defaults to false, will force the record to act as if it was created even if an id property was passed.
     * Persists the object, creating or updating as nessecary. 
     **/
    save: function save(force_created_mode)
    {
        this._validate();
        if (!this.isValid())
        {
            return false;
        }
        //apply field in conversions
        for (var key in this.constructor.fields)
        {
            if(!this.constructor.fields[key].primaryKey)
            {
                //third param is to suppress observers
                this.set(key,ActiveRecord.connection.fieldIn(key,this.constructor.fields[key],this.get(key)),true);
            }
        }
        if (this.notify('beforeSave') === false)
        {
            return false;
        }
        if ('updated' in this._object)
        {
            this.set('updated',ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss'));
        }
        if (force_created_mode || this._id === undefined)
        {
            if (this.notify('beforeCreate') === false)
            {
                return false;
            }
            if ('created' in this._object)
            {
                this.set('created',ActiveSupport.dateFormat('yyyy-mm-dd HH:MM:ss'));
            }
            ActiveRecord.connection.insertEntity(this.tableName, this.constructor.primaryKeyName, this.toObject());
            if(!this.get(this.constructor.primaryKeyName))
            {
                this.set(this.constructor.primaryKeyName, ActiveRecord.connection.getLastInsertedRowId());
            }
            this.notify('afterCreate');
        }
        else
        {
            if(this.notify('beforeUpdate') === false)
            {
                return false;
            }
            ActiveRecord.connection.updateEntity(this.tableName, this.constructor.primaryKeyName, this._id, this.toObject());
            //afterUpdate is not a synchronization event, afterSave covers all cases
            this.notify('afterUpdate');
        }
        //apply field out conversions
        for (var key in this.constructor.fields)
        {
            if(!this.constructor.fields[key].primaryKey)
            {
                //third param is to suppress observers
                this.set(key,ActiveRecord.connection.fieldOut(key,this.constructor.fields[key],this.get(key)),true);
            }
        }
        this._id = this.get(this.constructor.primaryKeyName);
        this.notify('afterSave');
        return this;
    },
    /**
     * ActiveRecord.Model#destroy() -> Boolean
     * Removes the object from the database, but does not destroy the object in memory itself.
     **/
    destroy: function destroy()
    {
        if (this._id === undefined)
        {
            return false;
        }
        if (this.notify('beforeDestroy') === false)
        {
            return false;
        }
        ActiveRecord.connection.deleteEntity(this.tableName,this.constructor.primaryKeyName,this._id);
        if (this.notify('afterDestroy') === false)
        {
            return false;
        }
        return true;
    },
    /**
     * ActiveRecord.Model#toSerializableObject([transform_callback]) -> Object
     * toJSON will call this instead of toObject() to get the
     * data they will serialize. By default this calls toObject(), but 
     * you can override this method to easily create custom JSON output.
     * - transform_callback (Function): Will recieve and should reutrn a hash of attributes.
     **/
    toSerializableObject: function toSerializableObject(callback)
    {
        return this.toObject(callback);
    },
    /**
     * ActiveRecord.Model#toJSON([object_to_inject]) -> String
     * Serializes the record to an JSON string. If object_to_inject is passed
     * that object will override any values of the record.
     **/
    toJSON: function toJSON(object_to_inject)
    {
        return ActiveSupport.JSON.stringify(ActiveSupport.Object.extend(this.toSerializableObject(),object_to_inject || {}));
    }
});
ActiveSupport.Object.extend(ActiveRecord.ClassMethods,{
    /**
     * ActiveRecord.Model.find(id) -> Boolean | Object
     * ActiveRecord.Model.find(array_of_ids) -> Array
     * ActiveRecord.Model.find(params) -> Array
     * ActiveRecord.Model.find(sql_statement) -> Array
     * 
     * Find a given record, or multiple records matching the passed conditions. Params may contain:
     *
     * - select (Array) of columns to select, default ['*']
     * - where (String | Object | Array)
     * - joins (String)
     * - order (String)
     * - limit (Number)
     * - offset (Number)
     * - callback (Function)
     *
     *     //finding single records
     *     var user = User.find(5); 
     *     var user = User.find({
     *         first: true,
     *         where: {
     *             id: 5
     *         }
     *     });
     *     var user = User.find({
     *         first: true,
     *         where: ['id = ?',5]
     *     });
     *
     *     //finding multiple records
     *     var users = User.find(); //finds all
     *     var users = User.find(1,2,3); //finds ids 1,2,3
     *     var users = User.find([1,2,3]); // finds ids 1,2,3
     *     
     *     //finding multiple records with complex where statements
     *     var users = User.find({
     *         where: 'name = "alice" AND password = "' + md5('pass') + '"',
     *         order: 'id DESC'
     *     });
     *
     *     var users = User.find({
     *         where: ['name = ? AND password = ?','alice',md5('pass')],
     *         order: 'id DESC'
     *     });
     *
     *     //using the where syntax below, the parameters will be properly escaped
     *     var users = User.find({
     *         where: {
     *             name: 'alice',
     *             password: md5('pass')
     *         }
     *         order: 'id DESC'
     *     });
     *     
     *     //find using a complete SQL statement
     *     var users = User.find('SELECT * FROM users ORDER id DESC');
     *
     *     //find using a callback, "user" in this case only contains a hash
     *     //of the user attributes, it is not an ActiveRecord instance
     *     var users = User.find({
     *         callback: function(user){
     *              return user.name.toLowerCase() == 'a';
     *         }
     *     });
     *
     *     // If your primary key is not numeric, find(id) will not work.
     *     // Use findBy<PrimaryKey>(id) or get(id) instead:
     *
     *     var commit = Commit.find('cxfeea6'); // BAD - Will be interpreted as a SQL statement.
     *     commit = Commit.findById('cxfeea6'); // GOOD
     *     commit = Commit.get('cxfeea6');      // GOOD
     **/
    find: function find(params)
    {
        var result;
        if(params === 0)
        {
            return false;
        }
        if (!params)
        {
            params = {};
        }
        if ((params.first && typeof params.first === "boolean") || ((typeof(params) === "number" || (typeof(params) === "string" && params.match(/^\d+$/))) && arguments.length == 1))
        {
            if (params.first)
            {
                //find first
                params.limit = 1;
                result = ActiveRecord.connection.findEntities(this.tableName,params);
            }
            else
            {
                //single id
                result = ActiveRecord.connection.findEntitiesById(this.tableName,this.primaryKeyName,[params]);
            }
            if (result && result.iterate && result.iterate(0))
            {
                return this.build(result.iterate(0));
            }
            else
            {
                return false;
            }
        }
        else
        {
            result = null;
            if (typeof(params) === 'string' && !params.match(/^\d+$/))
            {
                //find by sql
                result = ActiveRecord.connection.findEntities.apply(ActiveRecord.connection,arguments);
            }
            else if (params && ((typeof(params) == 'object' && 'length' in params && 'slice' in params) || ((typeof(params) == 'number' || typeof(params) == 'string') && arguments.length > 1)))
            {
                //find by multiple ids
                var ids = ((typeof(params) == 'number' || typeof(params) == 'string') && arguments.length > 1) ? ActiveSupport.Array.from(arguments) : params;
                result = ActiveRecord.connection.findEntitiesById(this.tableName,this.primaryKeyName,ids);
            }
            else
            {
                //result find
                result = ActiveRecord.connection.findEntities(this.tableName,params);
            }
            var response = [];
            if (result)
            {
                result.iterate(function result_iterator(row){
                    response.push(this.build(row));
                },this);
            }
            this.resultSetFromArray(response,params);
            this.notify('afterFind',response,params);
            return response;
        }
    },
    /**
     * ActiveRecord.Model.destroy(id) -> Boolean | String
     * Deletes a given id (if it exists) calling any callbacks or validations
     * on the record. If "all" is passed as the ids, all records will be found
     * and destroyed.
     **/
    destroy: function destroy(id)
    {
        if(id == 'all')
        {
            var instances = this.find({
                all: true
            });
            var responses = [];
            for(var i = 0; i < instances.length; ++i)
            {
                responses.push(instances[i].destroy());
            }
            return responses;
        }
        else if(ActiveSupport.Object.isArray(id))
        {
            var responses = [];
            for(var i = 0; i < id.length; ++i)
            {
                var instance = this.get(id[i]);
                if(!instance)
                {
                    responses.push(false);
                }
                else
                {
                    responses.push(instance.destroy());
                }
            }
            return responses;
        }
        else
        {
            var instance = this.get(id);
            if(!instance)
            {
                return false;
            }
            return instance.destroy();
        }
    },
    /**
     * ActiveRecord.Model.build(attributes) -> Object
     * Identical to calling create(), but does not save the record.
     **/
    build: function build(data)
    {
        if(ActiveSupport.Object.isArray(data))
        {
            var records = [];
            for(var i = 0; i < data.length; ++i)
            {
                ++ActiveRecord.internalCounter;
                var record = new this(ActiveSupport.Object.clone(data[i]));
                record.internalCount = parseInt(Number(ActiveRecord.internalCounter),10); //ensure number is a copy
                records.push(record);
            }
            return records;
        }
        else
        {
            ++ActiveRecord.internalCounter;
            var record = new this(ActiveSupport.Object.clone(data));
            record.internalCount = parseInt(Number(ActiveRecord.internalCounter),10); //ensure number is a copy
            return record;
        }
    },
    /**
     * ActiveRecord.Model.create(attributes) -> Object
     * 
     *     var u = User.create({
     *         name: 'alice',
     *         password: 'pass'
     *     });
     *     u.id //will now contain the id of the user
     **/
    create: function create(data)
    {
        if(ActiveSupport.Object.isArray(data))
        {
            var records = [];
            for(var i = 0; i < data.length; ++i)
            {
                var record = this.build(data[i]);
                record.save(true);
                records.push(record);
            }
            return records;
        }
        else
        {
            var record = this.build(data);
            record.save(true);
            return record;
        }
    },
    /**
     * ActiveRecord.Model.update(id,attributes) -> Object
     * 
     *     Article.update(3,{
     *         title: 'New Title'
     *     });
     *     //or pass an array of ids and an array of attributes
     *     Article.update([5,7],[
     *         {title: 'Title for 5'},
     *         {title: 'Title for 7'}
     *     ]);
     *     //or pass an array of ids and a hash of attributes
     *     Article.update([5,7],{
     *         featured: false
     *     });
     **/
    update: function update(id, attributes)
    {
        if (ActiveSupport.Object.isArray(id))
        {
            var attributes_is_array = ActiveSupport.Object.isArray(attributes);
            var results = [];
            for(var i = 0; i < id.length; ++i)
            {
                var record = this.get(id[i]);
                if(!record)
                {
                    results.push(false);
                }
                else
                {
                    results.push(record.updateAttributes(attributes_is_array ? attributes[i] : attributes));
                }
            }
            return results;
        }
        else
        {
            var record = this.get(id);
            if(!record)
            {
                return false;
            }
            record.updateAttributes(attributes);
            return record;
        }
    },
    /**
     * ActiveRecord.Model.updateAll(updates[,conditions]) -> null
     * - updates (Object | String) A string of updates to make, or a Hash of column value pairs.
     * - conditions (String): Optional where condition, or Hash of column name, value pairs.
     **/
    updateAll: function updateAll(updates, conditions)
    {
        ActiveRecord.connection.updateMultitpleEntities(this.tableName, updates, conditions);
    },
    /**
     * ActiveRecord.Model.resultSetFromArray(result_set[,find_params]) -> Array 
     * Extends a vanilla array with ActiveRecord.ResultSet methods allowing for
     * the construction of custom result set objects from arrays where result 
     * sets are expected. This will modify the array that is passed in and
     * return the same array object.
     *
     *     var one = Comment.find(1);
     *     var two = Comment.find(2);
     *     var result_set = Comment.resultSetFromArray([one,two]);
     **/
    resultSetFromArray: function resultSetFromArray(result_set,params)
    {
        if(!params)
        {
            params = {};
        }
        for(var method_name in ResultSet.InstanceMethods)
        {
            result_set[method_name] = ActiveSupport.Function.curry(ResultSet.InstanceMethods[method_name],result_set,params,this);
        }
        return result_set;
    }
});