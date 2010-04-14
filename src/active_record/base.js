ActiveSupport.extend(ActiveRecord.InstanceMethods,{
    /**
     * Sets a given key on the object. You must use this method to set a property, properties assigned directly (instance.key_name = value) will not persist to the database and may cause errors.
     * @alias ActiveRecord.Instance.set
     * @param {String} key
     * @param {mixed} value
     * @param {Boolean} suppress_notifications Defaults to false
     * @return {mixed} the value that was set
     */
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
     * Get a given key on the object. If your field name is a reserved word, or the name of a method (save, updateAttribute, etc) you must use the get() method to access the property. For convenience non reserved words (title, user_id, etc) can be accessed directly (instance.key_name)
     * @alias ActiveRecord.Instance.get
     * @param {String} key
     * @return {mixed}
     */
    get: function get(key)
    {
        return this._object[key];
    },
    /**
     * Returns a "clean" version of the object, with just the data and no methods.
     * @alias ActiveRecord.Instance.toObject
     * @param {Function} [transform_callback] Will recieve and should reutrn a hash of attributes.
     * @return {Object}
     */
    toObject: function toObject(callback)
    {
        var response = ActiveSupport.clone(this._object);
        if(callback)
        {
            response = callback(response);
        }
        return response;
    },
    /**
     * Returns an array of the column names that the instance contains.
     * @alias ActiveRecord.Instance.keys
     * @return {Array}
     */
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
     * Returns an array of the column values that the instance contains.
     * @alias ActiveRecord.Instance.values
     * @return {Array}
     */
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
     * Sets a given key on the object and immediately persists that change to the database triggering any callbacks or validation .
     * @alias ActiveRecord.Instance.updateAttribute
     * @param {String} key
     * @param {mixed} value
     */
    updateAttribute: function updateAttribute(key, value)
    {
        this.set(key, value);
        return this.save();
    },
    /**
     * Updates all of the passed attributes on the record and then calls save().
     * @alias ActiveRecord.Instance.updateAttributes
     * @param {Object} attributes
     */
    updateAttributes: function updateAttributes(attributes)
    {
        for(var key in attributes)
        {
            this.set(key, attributes[key]);
        }
        return this.save();
    },
    /**
     * Loads the most current data for the object from the database.
     * @alias ActiveRecord.Instance.reload
     * @return {Boolean}
     */
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
     * Persists the object, creating or updating as nessecary. 
     * @alias ActiveRecord.Instance.save
     * @param {Boolean} force_created_mode Defaults to false, will force the
     *     record to act as if it was created even if an id property was passed.
     * @return {Boolean}
     */
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
                this.set(key,ActiveRecord.connection.fieldIn(this.constructor.fields[key],this.get(key)),true);
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
            Synchronization.triggerSynchronizationNotifications(this,'afterCreate');
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
                this.set(key,ActiveRecord.connection.fieldOut(this.constructor.fields[key],this.get(key)),true);
            }
        }
        this._id = this.get(this.constructor.primaryKeyName);
        Synchronization.triggerSynchronizationNotifications(this,'afterSave');
        this.notify('afterSave');
        return this;
    },
    /**
     * Removes the object from the database, but does not destroy the object in memory itself.
     * @alias ActiveRecord.Instance.destroy
     * @return {Boolean}
     */
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
        Synchronization.triggerSynchronizationNotifications(this,'afterDestroy');
        if (this.notify('afterDestroy') === false)
        {
            return false;
        }
        return true;
    },
    /**
     * toJSON and toXML will call this instead of toObject() to get the
     * data they will serialize. By default this calls toObject(), but 
     * you can override this method to easily create custom JSON and XML
     * output.
     * @param {Function} [transform_callback] Will recieve and should reutrn a hash of attributes.
     * @alias ActiveRecord.Instance.toSerializableObject
     * @return {Object}
     */
    toSerializableObject: function toSerializableObject(callback)
    {
        return this.toObject(callback);
    },
    /**
     * Serializes the record to an JSON string. If object_to_inject is passed
     * that object will override any values of the record.
     * @alias ActiveRecord.Instance.toJSON
     * @param {Object} [object_to_inject]
     * @return {String}
     */
    toJSON: function toJSON(object_to_inject)
    {
        return ActiveSupport.JSON.stringify(ActiveSupport.extend(this.toSerializableObject(),object_to_inject || {}));
    },
    /**
     * Serializes the record to an XML string. If object_to_inject is passed
     * that object will override any values of the record.
     * @alias ActiveRecord.Instance.toXML
     * @param {Object} [object_to_inject]
     * @return {String}
     */
    toXML: function toXML(object_to_inject)
    {
        return ActiveSupport.XMLFromObject(this.modelName,ActiveSupport.extend(this.toSerializableObject(),object_to_inject || {}));
    }
});
ActiveSupport.extend(ActiveRecord.ClassMethods,{
    /**
     * Find a given record, or multiple records matching the passed conditions.
     * @alias ActiveRecord.Class.find
     * @param {mixed} params
     *      Can be an integer to try and find a record by id, a complete SQL statement String, or Object of params, params may contain:
     *          select: Array of columns to select (default ['*'])
     *          where: String or Object or Array
     *          joins: String
     *          order: String
     *          limit: Number
     *          offset: Number
     *          synchronize: Boolean
     * @return {mixed}
     *      If finding a single record, response will be Boolean false or ActiveRecord.Instance. Otherwise an Array of ActiveRecord.Instance s will be returned (which may be empty).
     * @example
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
     */
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
                var ids = ((typeof(params) == 'number' || typeof(params) == 'string') && arguments.length > 1) ? ActiveSupport.arrayFrom(arguments) : params;
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
                result.iterate(ActiveSupport.bind(function result_iterator(row){
                    response.push(this.build(row));
                }, this));
            }
            this.resultSetFromArray(response,params);
            this.notify('afterFind',response,params);
            return response;
        }
    },
    /**
     * Deletes a given id (if it exists) calling any callbacks or validations
     * on the record. If "all" is passed as the ids, all records will be found
     * and destroyed.
     * @alias ActiveRecord.Class.destroy
     * @param {Number} id
     * @return {Boolean}
     */
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
        else if(ActiveSupport.isArray(id))
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
     * Identical to calling create(), but does not save the record.
     * @alias ActiveRecord.Class.build
     * @param {Object} data
     * @return {ActiveRecord.Instance}
     */
    build: function build(data)
    {
        if(ActiveSupport.isArray(data))
        {
            var records = [];
            for(var i = 0; i < data.length; ++i)
            {
                ++ActiveRecord.internalCounter;
                var record = new this(ActiveSupport.clone(data[i]));
                record.internalCount = parseInt(Number(ActiveRecord.internalCounter),10); //ensure number is a copy
                records.push(record);
            }
            return records;
        }
        else
        {
            ++ActiveRecord.internalCounter;
            var record = new this(ActiveSupport.clone(data));
            record.internalCount = parseInt(Number(ActiveRecord.internalCounter),10); //ensure number is a copy
            return record;
        }
    },
    /**
     * @alias ActiveRecord.Class.create
     * @param {Object} data
     * @return {ActiveRecord.Instance}
     * @example
     *     var u = User.create({
     *         name: 'alice',
     *         password: 'pass'
     *     });
     *     u.id //will now contain the id of the user
     */
    create: function create(data)
    {
        if(ActiveSupport.isArray(data))
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
     * @alias ActiveRecord.Class.update
     * @param {Number} id
     * @param {Object} attributes
     * @return {ActiveRecord.Instance}
     * @example
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
     */
    update: function update(id, attributes)
    {
        if (ActiveSupport.isArray(id))
        {
            var attributes_is_array = ActiveSupport.isArray(attributes);
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
     * @alias ActiveRecord.Class.updateAll
     * @param {Object} updates
     *      A string of updates to make, or a Hash of column value pairs.
     * @param {String} [conditions]
     *      Optional where condition, or Hash of column name, value pairs.
     */
    updateAll: function updateAll(updates, conditions)
    {
        ActiveRecord.connection.updateMultitpleEntities(this.tableName, updates, conditions);
    },
    /**
     * Extends a vanilla array with ActiveRecord.ResultSet methods allowing for
     * the construction of custom result set objects from arrays where result 
     * sets are expected. This will modify the array that is passed in and
     * return the same array object.
     * @alias ActiveRecord.Class.resultSetFromArray
     * @param {Array} result_set
     * @param {Object} [params]
     * @return {Array}
     * @example
     *     var one = Comment.find(1);
     *     var two = Comment.find(2);
     *     var result_set = Comment.resultSetFromArray([one,two]);
     */
    resultSetFromArray: function resultSetFromArray(result_set,params)
    {
        if(!params)
        {
            params = {};
        }
        for(var method_name in ResultSet.InstanceMethods)
        {
            result_set[method_name] = ActiveSupport.curry(ResultSet.InstanceMethods[method_name],result_set,params,this);
        }
        if(params.synchronize)
        {
            Synchronization.synchronizeResultSet(this,params,result_set);
        }
        return result_set;
    }
});