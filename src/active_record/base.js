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

ActiveSupport.extend(ActiveRecord.InstanceMethods,{
    /**
     * Sets a given key on the object. You must use this method to set a property, properties assigned directly (instance.key_name = value) will not persist to the database and may cause errors.
     * @alias ActiveRecord.Instance.set
     * @param {String} key
     * @param {mixed} value
     * @return {mixed} the value that was set
     */
    set: function set(key, value)
    {
        if (typeof(this[key]) !== "function")
        {
            this[key] = value;
        }
        this._object[key] = value;
        this.notify('set',key,value);
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
     * @return {Object}
     */
    toObject: function toObject()
    {
        return ActiveSupport.clone(this._object);
    },
    /**
     * Returns an array of the column names that the instance contains.
     * @alias ActiveRecord.Instance.keys
     * @return {Array}
     */
    keys: function keys()
    {
        var keysArray = [];
        for(var key_name in this._object)
        {
            keysArray.push(key_name);
        }
        return keysArray;
    },
    /**
     * Returns an array of the column values that the instance contains.
     * @alias ActiveRecord.Instance.values
     * @return {Array}
     */
    values: function values()
    {
        var valuesArray = [];
        for(var key_name in this._object)
        {
            valuesArray.push(this._object[key_name]);
        }
        return valuesArray;
    },
    /**
     * Sets a given key on the object and immediately persists that change to the database without triggering callbacks or validation .
     * @alias ActiveRecord.Instance.updateAttribute
     * @param {String} key
     * @param {mixed} value
     */
    updateAttribute: function updateAttribute(key, value)
    {
        this.set(key, value);
        ActiveRecord.connection.updateAttribute(this.tableName, this.id, key, value);
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
        if (!this.get('id'))
        {
            return false;
        }
        var record = this.constructor.find(this.get('id'));
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
     * @return {Boolean}
     */
    save: function save()
    {
        //callbacks/proxy not working
        if (!this._valid())
        {
            return false;
        }
        if (this.notify('beforeSave') === false)
        {
            return false;
        }
        if (!this.get('id'))
        {
            if(this.notify('beforeCreate') === false)
            {
                return false;
            }
            ActiveRecord.connection.insertEntity(this.tableName, this.toObject());
            this.set('id', ActiveRecord.connection.getLastInsertedRowId());
            Synchronization.triggerSynchronizationNotifications(this,'afterCreate');
            this.notify('afterCreate');
        }
        else
        {
            ActiveRecord.connection.updateEntity(this.tableName, this.get('id'), this.toObject());
        }
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
        if (!this.get('id'))
        {
            return false;
        }
        if (this.notify('beforeDestroy') === false)
        {
            return false;
        }
        ActiveRecord.connection.deleteEntity(this.tableName,this.get('id'));
        Synchronization.triggerSynchronizationNotifications(this,'afterDestroy');
        if (this.notify('afterDestroy') === false)
        {
            return false;
        }
        return true;
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
        return ActiveSupport.JSON.stringify(ActiveSupport.extend(this.toObject(),object_to_inject || {}));
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
        return ActiveSupport.XMLFromObject(this.modelName,ActiveSupport.extend(this.toObject(),object_to_inject || {}));
    }
});
ActiveSupport.extend(ActiveRecord.ClassMethods,{
    /**
     * Find a given record, or multiple records matching the passed conditions.
     * @alias ActiveRecord.Class.find
     * @param {mixed} params
     *      Can be an integer to try and find a record by id, a complete SQL statement String, or Object of params, params may contain:
     *          select: Array of columns to select (default ['*'])
     *          where: String or Object
     *          joins: String
     *          order: String
     *          limit: Number
     *          offset: Number
     *          synchronize: Boolean
     * @return {mixed}
     *      If finding a single record, response will be Boolean false or ActiveRecord.Instance. Otherwise an Array of ActiveRecord.Instance s will be returned (which may be empty).
     * @example
     *
     *     var user = User.find(5); //finds a single record
     *     var user = User.find({
     *         first: true,
     *         where: {
     *             id: 5
     *         }
     *     });
     *     var users = User.find(); //finds all
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
     *     var users = User.find('SELECT * FROM users ORDER id DESC');
     */
    find: function find(params)
    {
        var result;
        if (!params)
        {
            params = {};
        }
        if (params.first || typeof(params) === "number" || (typeof(params) === "string" && params.match(/^\d+$/)))
        {
            if (params.first)
            {
                //find first
                params.limit = 1;
            }
            else
            {
                //find by id
                params = ActiveSupport.extend(arguments[1] || {},{
                    where: {
                        id: params
                    }
                });
            }
            result = ActiveRecord.connection.findEntities(this.tableName,params);
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
            if (typeof(params) === 'string')
            {
                //find by sql
                result = ActiveRecord.connection.findEntities(params);
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
            ResultSet.extend(response,params,this);
            this.notify('afterFind',response,params);
            if(params.synchronize)
            {
                Synchronization.synchronizeResultSet(this,params,response);
            }
            return response;
        }
    },
    /**
     * Deletes a given id (if it exists) WITHOUT calling any callbacks or validations on the record.
     * @alias ActiveRecord.Class.destroy
     * @param {Number} id 
     * @return {Boolean}
     */
    destroy: function destroy(id)
    {
        return ActiveRecord.connection.deleteEntity(this.tableName,id);
    },
    /**
     * Identical to calling create(), but does not save the record.
     * @alias ActiveRecord.Class.build
     * @param {Object} data
     * @return {ActiveRecord.Instance}
     */
    build: function build(data)
    {
        ++ActiveRecord.internalCounter;
        var record = new this(ActiveSupport.clone(data));
        record.internalCount = parseInt(new Number(ActiveRecord.internalCounter), 10); //ensure number is a copy
        return record;
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
        var record = this.build(data);
        record.save();
        return record;
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
     */
    update: function update(id, attributes)
    {
        //array of ids and array of attributes passed in
        if(typeof(id.length) !== 'undefined')
        {
            var results = [];
            for(var i = 0; i < id.length; ++i)
            {
                results.push(this.update(id[i], attributes[i]));
            }
            return results;
        }
        else
        {
            var record = this.find(id);
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
     * @alias ActiveRecord.Class.transaction
     * @param {Function} proceed
     *      The block of code to execute inside the transaction.
     * @param {Function} [error]
     *      Optional error handler that will be called with an exception if one is thrown during a transaction. If no error handler is passed the exception will be thrown.
     * @example
     *     Account.transaction(function(){
     *         var from = Account.find(2);
     *         var to = Account.find(3);
     *         to.despoit(from.withdraw(100.00));
     *     });
     */
    transaction: function transaction(proceed,error)
    {
        try
        {
            ActiveRecord.connection.transaction(proceed);
        }
        catch(e)
        {
            if(error)
            {
                error(e);
            }
            else
            {
                throw e;
            }
        }
    }
});