/*

document:
    - format of rest mapping
    - expected inputs and outputs of rest methods
    - what additional events are triggered (for instance: updateAttributes() called on success of create/update/destroy)

*/
Adapters.REST = {};

ActiveSupport.extend(Adapters.REST,{
    mapping: {},
    wrappedMethods: {},
    connect: function connect(initial_data_location,mapping)
    {
        Adapters.REST.mapping = mapping;
        for(var model_name in mapping)
        {
            var model = ActiveRecord.Models[model_name];
            if(!model)
            {
                throw Adapters.REST.Errors.modelDoesNotExist.getErrorString(model_name);
            }
            for(var action_name in mapping[model_name])
            {
                if(ActiveSupport.indexOf(['search','outbound_transform','inbound_transform'],action_name) == -1)
                {
                    Adapters.REST.generateWrapper(action_name,model,mapping[model_name][action_name]);
                }
            }
        }
        if(initial_data_location)
        {
            Adapters.REST.performInitialDataLoad(initial_data_location);
        }
    },
    performInitialDataLoad: function performInitialDataLoad(initial_data_location)
    {
        var url = initial_data_location[0];
        var http_method = initial_data_location[1].toLowerCase() || 'POST';
        var http_params = Adapters.REST.getHTTPParamsFromMappingFragment(initial_data_location);
        Adapters.REST.createAjaxRequest(
            url,
            http_method,
            http_params,
            function initial_data_load_on_success(transport){
                var json_data = transport.responseJSON || eval(transport.responseText); //TODO: remove eval
                for(var model_name in Adapters.REST.mapping)
                {
                    var model = ActiveRecord.Models[model_name];
                    if(!model)
                    {
                        throw Adapters.REST.Errors.modelDoesNotExist.getErrorString(model_name);
                    }
                    if(json_data[model.tableName] && Adapters.REST.mapping[model_name].inbound_transform)
                    {
                        Adapters.REST.mapping[model_name].inbound_transform(json_data[model.tableName]);
                    }
                }
                ActiveRecord.connection.setStorage(json_data);
                ActiveRecord.notify('ready');
            },
            function initial_data_load_on_failure(){
                throw Adapters.REST.Errors.initialDataLoadError.getErrorString();
            }
        );
    },
    generateWrapper: function generateWrapper(action_name,model,mapping_fragment)
    {
        switch(action_name)
        {
            case 'update':
                Adapters.REST.generateClassWrapper('update',model,mapping_fragment);
                Adapters.REST.generateInstanceWrapper('save',model,mapping_fragment);
                Adapters.REST.generateInstanceWrapper('updateAttribute',model,mapping_fragment);
                Adapters.REST.generateInstanceWrapper('updateAttributes',model,mapping_fragment);
                break;
            case 'create':
                Adapters.REST.generateClassWrapper('create',model,mapping_fragment);
                Adapters.REST.generateInstanceWrapper('save',model,mapping_fragment);
                break;
            case 'destroy':
                Adapters.REST.generateClassWrapper('destroy',model,mapping_fragment);
                Adapters.REST.generateInstanceWrapper('destroy',model,mapping_fragment);
                break;
            case 'batch_create':
                Adapters.REST.generateClassWrapper('create',model,mapping_fragment);
                break;
            case 'batch_update':
                Adapters.REST.generateClassWrapper('update',model,mapping_fragment);
                break;
            case 'batch_destroy':
                Adapters.REST.generateClassWrapper('destroy',model,mapping_fragment);
                break;
            case 'search':
                
                break;
        }
    },
    generateInstanceWrapper: function generateInstanceWrapper(method_name,model,mapping_fragment)
    {
        if(!Adapters.REST.wrappedMethods[model.modelName])
        {
            Adapters.REST.wrappedMethods[model.modelName] = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].instance)
        {
            Adapters.REST.wrappedMethods[model.modelName].instance = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].instance[method_name])
        {
            Adapters.REST.wrappedMethods[model.modelName].instance[method_name] = model.prototype[method_name] = ActiveSupport.wrap(model.prototype[method_name],Adapters.REST.instanceWrapperGenerators[method_name](model,mapping_fragment));
        }
    },
    generateClassWrapper: function generateClassWrapper(method_name,model,mapping_fragment)
    {   
        if(!Adapters.REST.wrappedMethods[model.modelName])
        {
            Adapters.REST.wrappedMethods[model.modelName] = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].klass)
        {
            Adapters.REST.wrappedMethods[model.modelName].klass = {};
        }
        if(!Adapters.REST.wrappedMethods[model.modelName].klass[method_name])
        {
            Adapters.REST.wrappedMethods[model.modelName].klass[method_name] = model[method_name] = ActiveSupport.wrap(model[method_name],Adapters.REST.classWrapperGenerators[method_name](model,mapping_fragment));
        }
    },
    getPersistenceParams: function getPersistenceParams(model,params,http_params)
    {
        var final_params = {};
        if(params)
        {
            if(ActiveSupport.isArray(params))
            {
                
            }
            else
            {
                if(Adapters.REST.mapping[model.modelName].outbound_transform)
                {
                    Adapters.REST.mapping[model.modelName].outbound_transform(params);
                }
                for(var param_name in params)
                {
                    final_params[ActiveSupport.Inflector.singularize(model.tableName) + '[' + param_name + ']'] = params[param_name];
                }
            }
        }
        ActiveSupport.extend(final_params,http_params || {});
        return final_params;
    },
    getPersistenceSuccessCallback: function getPersistenceSuccessCallback(instance,callback)
    {
        return function on_success_callback(transport){
            console.log('success: transport.responseJSON',transport.responseJSON);
            /*
            if(transport.responseJSON.id)
            {
                transport.responseJSON.id = transport.responseJSON.id + 100; //TODO: remove this when testing is complete
            }
            */
            instance.updateAttributes(transport.responseJSON);
            //TODO: handle array case
            callback(instance,true);
        };
    },
    getPersistenceFailureCallback: function getPersistenceCallbacks(instance,callback)
    {
        return function on_failure_callback(transport){
            console.log('failure: transport',transport);
            if(instance)
            {
                //TODO: handle array case
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
        };
    },
    substituteUrlParams: function substituteUrlParams(url,params){
        return url.replace(/(\:[\w\-]+)/g,function(fragment){
            var key = fragment.substr(1);
            return params[key] || fragment;
        });
    },
    getHTTPParamsFromMappingFragment: function getHTTPParamsFromMappingFragment(mapping_fragment)
    {
        var http_params = false;
        if(mapping_fragment && mapping_fragment[2])
        {
            if(typeof(mapping_fragment[2]) == 'function')
            {
                http_params = mapping_fragment[2]()
            }
            else
            {
                http_params = mapping_fragment[2];
            }
        }
        return http_params;
    },
    createPersistenceRequest: function createPersistenceRequest(model,instance,mapping_fragment,instance_params,callback)
    {
        var url = mapping_fragment[0];
        var http_method = mapping_fragment[1].toLowerCase() || 'POST';
        var http_params = Adapters.REST.getHTTPParamsFromMappingFragment(mapping_fragment);
        return Adapters.REST.createAjaxRequest(
            Adapters.REST.substituteUrlParams(url,instance_params),
            http_method.toUpperCase(),
            Adapters.REST.getPersistenceParams(model,instance_params,http_params),
            Adapters.REST.getPersistenceSuccessCallback(instance,callback),
            Adapters.REST.getPersistenceFailureCallback(instance,callback)
        );
    },
    createAjaxRequest: function createAjaxRequest(url,http_method,parameters,on_success,on_failure)
    {
        console.log('new ajax request:',url,{
            method: http_method,
            parameters: parameters,
            onSuccess: on_success,
            onFailure: on_failure
        });
        return new Ajax.Request(url,{
            method: http_method,
            parameters: parameters,
            onSuccess: on_success,
            onFailure: on_failure
        });
    }
});

Adapters.REST.classWrapperGenerators = {
    create: function create(model,mapping_fragment)
    {
        return function generated_class_create_wrapper(proceed,attributes,callback){
            var instance = proceed(attributes);
            if(instance && callback)
            {
                if(ActiveSupport.isArray(attributes))
                {
                    if(Adapters.REST.mapping.batch_create)
                    {
                        var params_array = [];
                        for(var i = 0; i < instance.length; ++i)
                        {
                            params_array.push(instance[i].toObject(function(attributes){
                                delete attributes.id;
                                return attributes;
                            }));
                        }
                        Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping.batch_create,params_array,callback);
                    }
                    else
                    {
                        for(var i = 0; i < instance.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,instance,mapping_fragment,instance[i].toObject(function(attributes){
                                delete attributes.id;
                                return attributes;
                            }),callback);
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,instance,mapping_fragment,instance.toObject(function(attributes){
                        delete attributes.id;
                        return attributes;
                    }),callback);
                }
            }
            console.log('return instance',instance);
            return instance;
        };
    },
    update: function update(model,mapping_fragment)
    {
        return function generated_class_update_wrapper(proceed,id,attributes,callback){
            var instance = proceed(id,attributes);
            if(instance && callback)
            {
                if(ActiveSupport.isArray(id))
                {
                    if(Adapters.REST.mapping.batch_update)
                    {
                        var params_array = [];
                        for(var i = 0; i < instance.length; ++i)
                        {
                            params_array.push(instance[i].toObject());
                        }
                        Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping.batch_update,params_array,callback);
                    }
                    else
                    {
                        for(var i = 0; i < instance.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,instance,mapping_fragment,instance[i].toObject(),callback);
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,instance,mapping_fragment,instance.toObject(),callback);
                }
            }
            return instance;
        };
    },
    destroy: function destroy(model,mapping_fragment)
    {
        return function generated_class_destroy_wrapper(proceed,id,callback){
            var response = proceed(id);
            if(callback)
            {
                if(ActiveSupport.isArray(id))
                {
                    if(Adapters.REST.mapping.batch_destroy)
                    {
                        Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping.batch_destroy,params_array,callback);
                    }
                    else
                    {
                        for(var i = 0; i < id.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,false,mapping_fragment,instance.toObject(),callback);
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,false,mapping_fragment,instance.toObject(),callback);
                }
            }
            return response;
        };
    }
};

Adapters.REST.instanceWrapperGenerators = {
    updateAttribute: function updateAttribute(model,mapping_fragment)
    {
        return function generated_instance_update_attribute_wrapper(proceed,key,value,callback){
            var instance = proceed(key,value);
            if(instance && callback)
            {
                
            }
            return instance;
        };
    },
    updateAttributes: function updateAttributes(model,mapping_fragment)
    {
        return function generated_instance_update_attributes_wrapper(proceed,attributes,callback){
            var instance = proceed(attributes);
            if(instance && callback)
            {
                
            }
            return instance;
        };
    },
    save: function save(model,mapping_fragment)
    {
        return function generated_instance_save_wrapper(proceed,force_created_mode,callback){
            var instance = proceed(force_created_mode);
            //TODO: see if should delete "id" for create case
            if(instance && callback)
            {
                
            }
            return instance;
        };
    },
    destroy: function destroy(model,mapping_fragment)
    {
        return function generated_instance_destroy_wrapper(proceed,callback){
            var response = proceed();
            if(callback)
            {
                
            }
            return response;
        };
    }
};

Adapters.REST.Errors = {
    modelDoesNotExist: ActiveSupport.createError('The ActiveRecord model % does not exist.'),
    initialDataLoadError: ActiveSupport.createError('A server error occurred while performing the initial data load.')
};

/*
ActiveRecord.ClassMethods.search = function search(query,proceed,extra_query_params){
  new Ajax.Request('/' + this.tableName + '/search.json',{
    method: 'get',
    parameters: encodeURIComponent('query') + '=' + encodeURIComponent(query) + (extra_query_params || ''),
    onSuccess: function(request){
      proceed(request.responseJSON,query)
    }
  });
};
*/

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
