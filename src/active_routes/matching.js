ActiveRoutes.prototype.checkAndCleanRoute = function checkAndCleanRoute(route,original_path)
{
    if(!route.params.method)
    {
        route.params.method = 'index';
    }
    if(this.options.camelizeObjectName)
    {
        route.params.object = ActiveSupport.camelize(route.params.object,true);
    }
    if(route.params.requirements)
    {
        delete route.params.requirements;
    }
    if(this.options.classSuffix)
    {
        route.params.object += this.options.classSuffix;
    }
    if(!this.objectExists(route.params.object))
    {
        this.error = Errors.ObjectDoesNotExist.getErrorString(route.params.object);
    }
    if(!this.methodExists(route.params.object,route.params.method))
    {
        this.error = Errors.MethodDoesNotExist.getErrorString(route.params.object + '.' + route.params.method);
    }
    if(!this.methodCallable(route.params.object,route.params.method))
    {
        this.error = Errors.MethodNotCallable.getErrorString(route.params.object + '.' + route.params.method);
    }
    if(this.error)
    {
        if(ActiveRoutes.logging)
        {
            ActiveSupport.log('ActiveRoutes: No match for "' + original_path + '" (' + this.error + ')');
        }
        return false;
    }
    else
    {
        return route;
    }
};

/**
 * @alias ActiveRoutes.prototype.match
 * @param {String} path
 * @return {mixed} false if no match, otherwise the matching route.
 * @example
 * var route = routes.match('/blog/post/5');<br/>
 * route == {object: 'blog',method: 'post', id: 5};
 */
ActiveRoutes.prototype.match = function(path){
    var original_path = path;
    this.error = false;
    //make sure the path is a copy
    path = ActiveRoutes.normalizePath(String(path));
    //handle extension
    var extension = path.match(/\.([^\.]+)$/);
    if(extension)
    {
        extension = extension[1];
        path = path.replace(/\.[^\.]+$/,'');
    }
    var path_components = path.split('/');
    var path_length = path_components.length;
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = ActiveSupport.clone(this.routes[i]);
        route.params = ActiveSupport.clone(this.routes[i].params || {});
        route.extension = extension;
        route.orderedParams = [];
        
        //exact match
        if(route.path == path)
        {
            return this.checkAndCleanRoute(route,original_path);
        }
        
        //perform full match
        var route_path_components = route.path.split('/');
        var route_path_length = route_path_components.length;
        var valid = true;
        //length of path components must match, but must treat "/blog", "/blog/action", "/blog/action/id" the same
        if(path_length <= route_path_length || route_path_components[route_path_components.length - 1] == '*'){
            for(var ii = 0; ii < route_path_components.length; ++ii)
            {
                var path_component = path_components[ii];
                var route_path_component = route_path_components[ii];
                //catch all
                if(route_path_component.charAt(0) == '*')
                {
                    route.params.path = path_components.slice(ii);
                    return this.checkAndCleanRoute(route,original_path); 
                }
                //named component
                else if(route_path_component.charAt(0) == ':')
                {
                    var key = route_path_component.substr(1);
                    if(path_component && route.params.requirements && route.params.requirements[key] &&
                        !(typeof(route.params.requirements[key]) == 'function'
                            ? route.params.requirements[key](String(path_component))
                            : path_component.match(route.params.requirements[key])
                        )
                    )
                    {
                        valid = false;
                        break;
                    }
                    else
                    {
                        if(typeof(path_component) == 'undefined' && key != 'method' && key != 'object' && key != 'id')
                        {
                            valid = false;
                            break;
                        }
                        else
                        {
                            route.params[key] = path_component;
                            route.orderedParams.push(path_component);
                        }
                    }
                }
                else if(path_component != route_path_component)
                {
                    valid = false;
                    break;
                }
            }
            if(valid)
            {
                return this.checkAndCleanRoute(route,original_path);
            }
        }
    }
    return false;
};

/**
 * @alias ActiveRoutes.prototype.reverseLookup
 * @param {mixed} Object klass or string class name
 * @param {String} action_name
 * @return {mixed} false if no match, otherwise the matching route.
 * @example
 * var route = routes.reverseLookup({object: 'blog',method: 'post'});
 * //route.path == '/blog/post/:id'
 */
ActiveRoutes.prototype.reverseLookup = function reverseLookup(class_name,action_name)
{
    var lower_case_action_name = action_name.toLowerCase();
    if(typeof(class_name) != 'string')
    {
        var original_class_name = class_name;
        class_name = this.classNameFromClass(class_name);
        if(!class_name)
        {
            return false;
        }
    }
    //look for object + method match
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = this.routes[i];
        if(route.params.object && route.params.object.toLowerCase() == class_name.toLowerCase() && route.params.method && route.params.method.toLowerCase() == lower_case_action_name)
        {
            return route;
        }
    }
    //look for object + :method match
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = this.routes[i];
        if(route.params.object && route.params.object.toLowerCase() == class_name.toLowerCase() && (!route.params.method || route.path.match(/(^|\/)\:method($|\/)/)))
        {
            var final_route = ActiveSupport.clone(route);
            final_route.method = action_name;
            return final_route;
        }
    }
    //look for :object + :method match
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = this.routes[i];
        if((!route.params.object || route.path.match(/(^|\/)\:object($|\/)/)) && (!route.params.method || route.path.match(/(^|\/)\:method($|\/)/)))
        {
            var final_route = ActiveSupport.clone(route);
            final_route.method = action_name;
            final_route.object = class_name;
            return route;
        }
    }
    return false;
};

ActiveRoutes.prototype.classNameFromClass = function classNameFromClass(klass)
{
    for(var class_name in this.scope)
    {
        if(this.scope[class_name] == klass)
        {
            return class_name;
        }
    }
    return false;
};