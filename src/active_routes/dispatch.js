/**
 * ActiveRoutes#dispatch(path[,suppress_dispatcher = false]) -> Boolean
 * Will match() the given path and call the dispatcher if one is found.
 * 
 *     var routes = new ActiveRoutes([['post','/blog/post/:id',{object:'blog',method: 'post'}]]);
 *     
 *     routes.dispatch('/blog/post/5');
 *     //calls Blog.post({object:'blog',method: 'post',id: 5});
 *     
 *     routes.dispatch({object:'blog',method: 'post',id: 5});
 *     //calls Blog.post({object:'blog',method: 'post',id: 5});
 **/
ActiveRoutes.prototype.dispatch = function dispatch(path,suppress_dispatcher)
{
    var route;
    if(typeof(path) == 'string')
    {
        route = this.match(path);
        if(!route)
        {
            if(this.error)
            {
                throw this.error;
            }
            else
            {
                throw Errors.UnresolvableUrl.getErrorString(path);
            }
        }
    }
    else if(path && !path.name && !path.path)
    {
        var reverse_lookup_result = this.reverseLookup(path.object,path.method);
        if(!reverse_lookup_result)
        {
            throw Errors.ReverseLookupFailed.getErrorString(path);
        }
        route = {
            params: ActiveSupport.Object.clone(path),
            name: reverse_lookup_result.name,
            path: reverse_lookup_result.path
        };
        path = this.urlFor(route.params);
        ActiveSupport.Object.extend(route.params,reverse_lookup_result.params);
    }
    else
    {
        route = ActiveSupport.Object.clone(path);
        if(route.params.path && ActiveSupport.Object.isArray(route.params.path))
        {
            route.params.path = route.params.path.join('/');
        }
        path = this.urlFor(route.params);
    }
    this.history.push(route);
    this.index = this.history.length - 1;
    if(this.notify('beforeDispatch',route,path) === false)
    {
        return false;
    }
    if(!suppress_dispatcher)
    {
        if(ActiveRoutes.logging)
        {
            ActiveSupport.log('ActiveRoutes: dispatching "' + path + '" to ' + route.params.object + '.' + route.params.method);
        }
        
        this.dispatcher(route);
    }
    this.notify('afterDispatch',route,path);
    return true;
};

/**
 * ActiveRoutes#defaultDispatcher -> Function
 * If no "dispatcher" key is passed into the options to contstruct a route set
 *  this is used. It will call scope.object_name.method_name(route.params)
 **/
ActiveRoutes.prototype.defaultDispatcher = function defaultDispatcher(route)
{
    //the second parameter prevents the action from trying to set the current route
    //which was already set if the action was called from the dispatcher
    this.scope[route.params.object][route.params.method](route.params,false);
};