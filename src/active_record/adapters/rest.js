/*

document:
    - format of rest mapping
    - expected inputs and outputs of rest methods
    - what additional events are triggered (for instance: updateAttributes() called on success of create/update/destroy)

*/
Adapters.REST = {};

ActiveSupport.Object.extend(Adapters.REST,{
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
                if(ActiveSupport.Array.indexOf(['outbound_transform','inbound_transform'],action_name) == -1)
                {
                    Adapters.REST.generateWrapper(action_name,model);
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
        var http_method = initial_data_location[1].toLowerCase() || 'post';
        var post_body = Adapters.REST.getHTTPParamsFromMappingFragment(initial_data_location);
        var response_processor_callback = initial_data_location[3];
        Adapters.REST.createAjaxRequest(
            url,
            http_method,
            post_body,
            function initial_data_load_on_success(transport){
                var json_data = transport.responseJSON || ActiveSupport.JSON.parse(transport.responseText);
                if(response_processor_callback)
                {
                    json_data = response_processor_callback(json_data);
                }
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
    generateWrapper: function generateWrapper(action_name,model)
    {
        switch(action_name)
        {
            case 'update':
                Adapters.REST.generateClassWrapper('update',model);
                Adapters.REST.generateInstanceWrapper('save',model);
                Adapters.REST.generateInstanceWrapper('updateAttribute',model);
                Adapters.REST.generateInstanceWrapper('updateAttributes',model);
                break;
            case 'create':
                Adapters.REST.generateClassWrapper('create',model);
                Adapters.REST.generateInstanceWrapper('save',model);
                break;
            case 'destroy':
                Adapters.REST.generateClassWrapper('destroy',model);
                Adapters.REST.generateInstanceWrapper('destroy',model);
                break;
            case 'batch_create':
                Adapters.REST.generateClassWrapper('create',model);
                break;
            case 'batch_update':
                Adapters.REST.generateClassWrapper('update',model);
                break;
            case 'batch_destroy':
                Adapters.REST.generateClassWrapper('destroy',model);
                break;
            case 'find':
                Adapters.REST.generateClassWrapper('find',model);
                break;
            case 'search':
                model.search = Adapters.REST.generateSearchMethod(model);
                break;
        }
    },
    generateInstanceWrapper: function generateInstanceWrapper(method_name,model)
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
            Adapters.REST.wrappedMethods[model.modelName].instance[method_name] = model.prototype[method_name] = ActiveSupport.Function.wrap(model.prototype[method_name],Adapters.REST.instanceWrapperGenerators[method_name](model));
        }
    },
    generateClassWrapper: function generateClassWrapper(method_name,model)
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
            Adapters.REST.wrappedMethods[model.modelName].klass[method_name] = model[method_name] = ActiveSupport.Function.wrap(model[method_name],Adapters.REST.classWrapperGenerators[method_name](model));
        }
    },
    getPersistencePostBody: function getPersistencePostBody(model,params,http_params,mapping_fragment)
    {
        var params_container_name = ActiveSupport.String.singularize(model.tableName);
        var transform = false;
        if(Adapters.REST.mapping[model.modelName].outbound_transform)
        {
            transform = Adapters.REST.mapping[model.modelName].outbound_transform;
        }
        if(params)
        {
            if(ActiveSupport.Object.isArray(params))
            {
                var plural_params_container_name = model.tableName;
                var final_params = {};
                ActiveSupport.Object.extend(final_params,http_params || {});
                if(transform)
                {
                    for(var i = 0; i < params.length; ++i)
                    {
                        transform(params[i]);
                    }
                }
                final_params[plural_params_container_name] = params;
                return ActiveSupport.JSON.stringify(final_params);
            }
            else
            {
                var final_params = {};
                ActiveSupport.Object.extend(final_params,http_params);
                if(transform)
                {
                    transform(params);
                }
                final_params[params_container_name] = params;
                return ActiveSupport.JSON.stringify(final_params);
            }
        }
        return '';
    },
    getPersistenceSuccessCallback: function getPersistenceSuccessCallback(mapping_fragment,instance,callback)
    {
        return function on_success_callback(transport){
            var response_processor_callback = mapping_fragment[3];
            if(response_processor_callback)
            {
                transport.responseJSON = response_processor_callback(transport.responseJSON);
            }
            //console.log('success: transport.responseJSON',transport.responseJSON);
            if(instance)
            {
                if(ActiveSupport.Object.isArray(instance))
                {
                    for(var i = 0; i < instance.length; ++i)
                    {
                        instance[i].updateAttributes(transport.responseJSON[i]);
                    }
                }
                else
                {
                    instance.updateAttributes(transport.responseJSON);
                }
            }
            if(callback && typeof(callback) == 'function')
            {
                callback(instance,true);
            }
        };
    },
    getPersistenceFailureCallback: function getPersistenceFailureCallback(mapping_fragment,instance,callback)
    {
        return function on_failure_callback(transport){
            //console.log('failure: transport',transport);
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
            }
            if(callback && typeof(callback) == 'function')
            {
                callback(instance,false);
            }
        };
    },
    substituteUrlParams: function substituteUrlParams(url,params)
    {
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
                http_params = mapping_fragment[2]();
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
        var http_method = mapping_fragment[1].toLowerCase() || 'post';
        var http_params = Adapters.REST.getHTTPParamsFromMappingFragment(mapping_fragment);
        http_params = Adapters.REST.extendHTTPParams(http_params,http_method);
        return Adapters.REST.createAjaxRequest(
            Adapters.REST.substituteUrlParams(url,instance_params),
            http_method.toLowerCase(),
            http_method.toLowerCase() == 'get'
                ? ActiveSupport.Object.extend(ActiveSupport.Object.clone(instance_params || {}),http_params)
                : Adapters.REST.getPersistencePostBody(model,instance_params,http_params,mapping_fragment),
            Adapters.REST.getPersistenceSuccessCallback(mapping_fragment,instance,callback),
            Adapters.REST.getPersistenceFailureCallback(mapping_fragment,instance,callback)
        );
    },
    extendHTTPParams: function extendHTTPParams(http_params,http_method)
    {
        if(!http_params)
        {
            http_params = {};
        }
        if(window._auth_token)
        {
            http_params.authenticity_token = window._auth_token;
        }
        http_params._method = http_method.toLowerCase();
        return http_params;
    },
    createAjaxRequest: function createAjaxRequest(url,http_method,post_body,on_success,on_failure)
    {
        var post_body_is_json = post_body && typeof(post_body) == 'string' && (post_body.substr(0,1) == '{' || post_body.substr(0,1) == '[');
        var final_url = url;
        var final_params = {
            contentType: post_body_is_json ? 'application/json' : 'application/x-www-form-urlencoded',
            method: http_method,
            onSuccess: on_success,
            onFailure: on_failure
        };
        if(http_method.toLowerCase() == 'get'){
          final_params.parameters = post_body;
        }else{
          final_params.postBody = post_body;
        }
        return new ActiveSupport.Request(final_url,final_params);
    }
});

Adapters.REST.classWrapperGenerators = {
    create: function create(model)
    {
        return function generated_class_create_wrapper(proceed,attributes,callback){
            var instance = proceed(attributes);
            var model_name = model.modelName;
            if(instance && callback)
            {
                if(ActiveSupport.Object.isArray(attributes))
                {
                    if(Adapters.REST.mapping[model_name].batch_create)
                    {
                        var params_array = [];
                        for(var i = 0; i < instance.length; ++i)
                        {
                            params_array.push(instance[i].toObject(function(attributes){
                                delete attributes.id;
                                return attributes;
                            }));
                        }
                        Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].batch_create,params_array,callback);
                    }
                    else
                    {
                        var created_items = [];
                        var callback_queue = new ActiveSupport.CallbackQueue(function(){
                            //this will be called when all of the ajax requests have finished
                            if(callback && typeof(callback) == 'function')
                            {
                                callback(created_items);
                            }
                        });
                        for(var i = 0; i < instance.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,instance[i],Adapters.REST.mapping[model_name].create,instance[i].toObject(function(attributes){
                                delete attributes.id;
                                return attributes;
                            }),callback_queue.push(function(created_item){
                                created_items.push(created_item);
                            }));
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].create,instance.toObject(function(attributes){
                        delete attributes.id;
                        return attributes;
                    }),callback);
                }
            }
            return instance;
        };
    },
    update: function update(model)
    {
        return function generated_class_update_wrapper(proceed,id,attributes,callback){
            var instance = proceed(id,attributes);
            var model_name = model.modelName;
            if(instance && callback)
            {
                if(ActiveSupport.Object.isArray(id))
                {
                    if(Adapters.REST.mapping[model_name].batch_update)
                    {
                        var params_array = [];
                        for(var i = 0; i < instance.length; ++i)
                        {
                            params_array.push(instance[i].toObject());
                        }
                        Adapters.REST.createPersistenceRequest(model,instance[i],Adapters.REST.mapping[model_name].batch_update,params_array,callback);
                    }
                    else
                    {
                        var updated_items = [];
                        var callback_queue = new ActiveSupport.CallbackQueue(function(){
                            //this will be called when all of the ajax requests have finished
                            if(callback && typeof(callback) == 'function')
                            {
                                callback(updated_items);
                            }
                        });
                        for(var i = 0; i < instance.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,instance[i],Adapters.REST.mapping[model_name].update,instance[i].toObject(),callback_queue.push(function(updated_item){
                                updated_items.push(updated_item);
                            }));
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].update,instance.toObject(),callback);
                }
            }
            return instance;
        };
    },
    destroy: function destroy(model)
    {
        return function generated_class_destroy_wrapper(proceed,id,callback){
            var response = proceed(id);
            var model_name = model.modelName;
            if(callback)
            {
                if(ActiveSupport.Object.isArray(id))
                {
                    if(Adapters.REST.mapping[model_name].batch_destroy)
                    {
                        var params_array = [];
                        for(var i = 0; i < id.length; ++i)
                        {
                            params_array.push({
                                id: id
                            });
                        }
                        Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].batch_destroy,params_array,callback);
                    }
                    else
                    {
                        var callback_queue = new ActiveSupport.CallbackQueue(callback);
                        for(var i = 0; i < id.length; ++i)
                        {
                            Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].destroy,{
                                id: id
                            },callback_queue.push(function(){}));
                        }
                    }
                }
                else
                {
                    Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].destroy,{
                        id: id
                    },callback);
                }
            }
            return response;
        };
    },
    find: function(model){
        return function generated_class_create_wrapper(proceed,attributes,callback){
            var method_name = 'find';
            if(!attributes.remote)
            {
                return proceed.apply(proceed,ActiveSupport.Array.from(arguments).slice(1));
            }
            var final_attributes = ActiveSupport.Object.clone(attributes);
            delete final_attributes.remote;
            Adapters.REST.remoteFindHandlerGenerator('find',model,final_attributes,callback);
        };
    }
};

Adapters.REST.instanceWrapperGenerators = {
    updateAttribute: function updateAttribute(model)
    {
        return function generated_instance_update_attribute_wrapper(proceed,key,value,callback){
            var model_name = model.modelName;
            var instance = proceed(key,value);
            if(instance && callback)
            {
                Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].update,instance.toObject(),callback);
            }
            return instance;
        };
    },
    updateAttributes: function updateAttributes(model)
    {
        return function generated_instance_update_attributes_wrapper(proceed,attributes,callback){
            var model_name = model.modelName;
            var instance = proceed(attributes);
            if(instance && callback)
            {
                Adapters.REST.createPersistenceRequest(model,instance,Adapters.REST.mapping[model_name].update,instance.toObject(),callback);
            }
            return instance;
        };
    },
    save: function save(model)
    {
        return function generated_instance_save_wrapper(proceed,force_created_mode,callback){
            var instance = proceed(force_created_mode);
            //TODO: see if should delete "id" for create case
            if(instance && callback)
            {
                throw "REST adapter instance.save not implemented";
            }
            return instance;
        };
    },
    destroy: function destroy(model)
    {
        return function generated_instance_destroy_wrapper(proceed,callback){
            var model_name = model.modelName;
            var response = proceed();
            if(callback)
            {
                Adapters.REST.createPersistenceRequest(model,false,Adapters.REST.mapping[model_name].destroy,instance.toObject(),callback);
            }
            return response;
        };
    }
};

Adapters.REST.remoteFindHandlerGenerator = function(method_name,model,attributes,callback){
    var mapping = ActiveRecord.Adapters.REST.mapping[model.modelName];
    if(mapping && mapping[method_name])
    {
        var final_mapping = ActiveSupport.Object.clone(mapping[method_name]);
        final_mapping[2] = ActiveSupport.Object.extend(final_mapping[2] || {},attributes || {});
        var request = ActiveRecord.Adapters.REST.createPersistenceRequest(this,false,final_mapping,false);
        request.options.onSuccess = function remote_find_on_success_handler(response){
            if(!ActiveSupport.Object.isArray(response.responseJSON))
            {
                throw Adapters.REST.Errors.remoteFindDidNotReturnArray.getErrorString(model.modelName,method_name);
            }
            callback(response.responseJSON.map(function remote_find_result_iterator(instance_attributes){
                return new model(instance_attributes);
            }));
        };
    }
    else
    {
        throw Adapters.REST.Errors.methodNotImplemented.getErrorString(method_name,model.modelName)
    }
};

Adapters.REST.generateSearchMethod = function(model){
    return function generated_search_method(attributes,callback){
        Adapters.REST.remoteFindHandlerGenerator('search',model,attributes,callback);
    };
};

Adapters.REST.Errors = {
    modelDoesNotExist: ActiveSupport.createError('The ActiveRecord model % does not exist.'),
    initialDataLoadError: ActiveSupport.createError('A server error occurred while performing the initial data load.'),
    remoteFindDidNotReturnArray: ActiveSupport.createError('%.%() failed to return an array.'),
    methodNotImplemented: ActiveSupport.createError('% is not implemented for %')
};

/*

Test
    - class.create
        - test with failure
    - class.update
        - test with failure
    - class.destroy
        - test with failure
    - class.batch_create with batch_create
        - test with failure
    - class.batch_create with create
        - test with failure
    - class.batch_update with batch_update
        - test with failure
    - class.batch_update with update
        - test with failure
    - class.batch_destroy with batch_destroy
        - test with failure
    - class.batch_destroy with destroy
        - test with failure
    - class.find
        - test with failure
    - class.search
        - test with failure
    - instance.updateAttribute
        - test with failure
    - instance.updateAttributes
        - test with failure
    - instance.save
        - test with failure
    - instance.destroy
        - test with failure

*/