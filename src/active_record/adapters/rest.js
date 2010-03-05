Adapters.REST = function REST(){
  
};

ActiveSupport.extend(Adapters.REST,{
    mapping: {
        klass: {},
        instance: {}
    },
    wrappedMethods: {},
    connect: function connect(mapping)
    {
        Adapters.REST.mapping = mapping;
        for(var model_name in mapping)
        {
            var model = ActiveRecord.Models[model_name];
            if(!c)
            {
                throw Adapters.REST.Errors.modelDoesNotExist.getErrorString(model_name);
            }
            for(var action_name in mapping[model_name])
            {
                var url = mapping[model_name][action_name][0];
                var http_method = mapping[model_name][action_name][1].toLowerCase();
                Adapters.REST.generateWrapper(action_name,model,url,http_method);
            }
        }
    },
    generateWrapper: function generateWrapper(action_name,model,url,http_method)
    {
        switch(action_name)
        {
            case 'update':
                Adapters.REST.generateClassWrapper('update',model,url,http_method);
                Adapters.REST.generateInstanceWrapper('save',model,url,http_method);
                Adapters.REST.generateInstanceWrapper('updateAttribute',model,url,http_method);
                Adapters.REST.generateInstanceWrapper('updateAttributes',model,url,http_method);
                break;
            case 'create':
                Adapters.REST.generateClassWrapper('create',model,url,http_method);
                Adapters.REST.generateInstanceWrapper('save',model,url,http_method);
                break;
            case 'destroy':
                Adapters.REST.generateClassWrapper('destroy',model,url,http_method);
                Adapters.REST.generateInstanceWrapper('destroy',model,url,http_method);
                break;
            case 'batch_create':
                Adapters.REST.generateClassWrapper('create',model,url,http_method);
                break;
            case 'batch_update':
                Adapters.REST.generateClassWrapper('update',model,url,http_method);
                break;
            case 'batch_destroy':
                Adapters.REST.generateClassWrapper('destroy',model,url,http_method);
                break;
        }
    },
    generateInstanceWrapper: function generateInstanceWrapper(method_name,model,url,http_method)
    {
        if(!Adapters.REST.wrappedMethods.instance[method_name])
        {
            Adapters.REST.wrappedMethods.instance[method_name] = model.prototype[method_name] = ActiveSupport.wrap(model.prototype[method_name],Adapters.REST.instanceWrapperGenerators[method_name](model,url,http_method));
        }
    },
    generateClassWrapper: function generateClassWrapper(method_name,model,url,http_method)
    {
        if(!Adapters.REST.wrappedMethods.klass[method_name])
        {
            Adapters.REST.wrappedMethods.klass[method_name] = model[method_name] = ActiveSupport.wrap(model[method_name],Adapters.REST.classWrapperGenerators[method_name](model,url,http_method));
        }
    },
    getPersistenceParams = function getPersistenceParams(model,params)
    {
        var final_params = {};
        if(params)
        {
            if(ActiveSupport.isArray(params))
            {
                
            }
            else
            {
                for(var param_name in params)
                {
                    final_params[ActiveSupport.Inflector.singularize(model.tableName) + '[' + param_name + ']'] = params[param_name];
                }
            }
        }
        return final_params;
    },
    getPersistenceCallbacks: function getPersistenceCallbacks(instance,callback)
    {
        return {
            onSuccess: function onSuccessCallback(transport){
                console.log('onSuccess',transport);
                //set new attributes on instance
                //handle array case
                callback(instance,true);
            },
            onFailure: function onFailureCallback(transport){
                if(instance)
                {
                    //handle array case
                    if(transport.responseJSON && transport.responseJSON.errors)
                    {
                        for(var field_name in transport.responseJSON.errors)
                        {
                            for(var i = 0; i < transport.responseJSON.errors[field_name].length; ++i)
                            {
                                instance.addError(transport.responseJSON.errors[field_name][i],field_name);
                            }
                        }
                    }
                    else
                    {
                        instance.addError('An unknown server error occurred.');
                    }
                    callback(instance,false);
                }
            }
        };
    },
    createPersistenceRequest: function createPersistenceRequest(model,instance,url,http_method,params,callback,options)
    {
        var final_options = {
            method: http_method,
            parameters: Adapters.REST.getPersistenceParams(model,params)
        };
        ActiveSupport.extend(final_options,Adapters.REST.getPersistenceCallbacks(instance,callback));
        ActiveSupport.extend(final_options,options || {});
        return new Ajax.Request(url,final_options);
    }
});

Adapters.REST.classWrapperGenerators = {
    create: function create(model,url,http_method)
    {
        return function generated_class_create_wrapper(proceed,attributes,callback){
            var instance = proceed(attributes);
            if(ActiveSupport.isArray(attributes))
            {
                if(Adapters.REST.mapping.batch_create)
                {
                    var params_array = [];
                    for(var i = 0; i < instance.length; ++i)
                    {
                        params_array.push(instance[i].toObject());
                    }
                    Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping.batch_create[0],Adapters.REST.mapping.batch_create[1],params_array,callback);
                }
                else
                {
                    for(var i = 0; i < instance.length; ++i)
                    {
                        Adapters.REST.createPersistenceRequest(model,instance,url,http_method,instance[i].toObject(),callback);
                    }
                }
            }
            else
            {
                Adapters.REST.createPersistenceRequest(model,instance,url,http_method,instance.toObject(),callback);
            }
            return instance;
        };
    },
    update: function update(model,url,http_method)
    {
        return function generated_class_update_wrapper(proceed,id,attributes,callback){
            var instance = proceed(id,attributes);
            if(ActiveSupport.isArray(id))
            {
                if(Adapters.REST.mapping.batch_update)
                {
                    var params_array = [];
                    for(var i = 0; i < instance.length; ++i)
                    {
                        params_array.push(instance[i].toObject());
                    }
                    Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping.batch_update[0],Adapters.REST.mapping.batch_update[1],params_array,callback);
                }
                else
                {
                    for(var i = 0; i < instance.length; ++i)
                    {
                        Adapters.REST.createPersistenceRequest(model,instance,url,http_method,instance[i].toObject(),callback);
                    }
                }
            }
            else
            {
                Adapters.REST.createPersistenceRequest(model,instance,url,http_method,instance.toObject(),callback);
            }
            return instance;
        };
    },
    destroy: function destroy(model,url,http_method)
    {
        return function generated_class_destroy_wrapper(proceed,id,callback){
            var response = proceed(id);
            if(ActiveSupport.isArray(id))
            {
                if(Adapters.REST.mapping.batch_destroy)
                {
                    Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping.batch_destroy[0],Adapters.REST.mapping.batch_destroy[1],params_array,callback);
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,false,url,http_method,instance.toObject(),callback);
                }
            }
            else
            {
                Adapters.REST.createPersistenceRequest(model,false,url,http_method,instance.toObject(),callback);
            }
            return response;
        };
    }
};

Adapters.REST.instanceWrapperGenerators = {
    updateAttribute: function updateAttribute(model,url,http_method)
    {
        return function generated_instance_update_attribute_wrapper(proceed,key,value,callback){
            return proceed(key,value);
        };
    },
    updateAttributes: function updateAttributes(model,url,http_method)
    {
        return function generated_instance_update_attributes_wrapper(proceed,attributes,callback){
            return proceed(attributes);
        };
    },
    save: function save(model,url,http_method)
    {
        return function generated_instance_save_wrapper(proceed,force_created_mode,callback){
            return proceed(force_created_mode);
        };
    },
    destroy: function destroy(model,url,http_method)
    {
        return function generated_instance_destroy_wrapper(proceed,callback){
            return proceed();
        };
    }
};

Adapters.REST.Errors = {
    modelDoesNotExist: ActiveSupport.createError('The ActiveRecord model % does not exist.')
};


/*

create: ['/bookmarks.json','POST'],
update: ['/bookmarks/:id.json','PUT'],
destroy: ['/bookmarks/:id.json','DELETE'],
batch_create: ['/bookmarks/batch.json','CREATE'],
batch_destroy: ['/bookmarks/batch.jsopn','DELETE']

success: function() {
  var status = this.getStatus();
  return !status || (status >= 200 && status < 300);
},

getStatus: function() {
  try {
    return this.transport.status || 0;
  } catch (e) { return 0 }
},

*/
