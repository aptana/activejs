/**
 * Will match() the given path and call the dispatcher if one is found.
 * @alias ActiveRoutes.prototype.dispatch
 * @param {mixed} String path or params object or route object.
 * @exception {ActiveRoutes.Errors.UnresolvableUrl}
 * @example
 *     var routes = new ActiveRoutes([['post','/blog/post/:id',{object:'blog',method: 'post'}]]);
 *     routes.dispatch('/blog/post/5');
 *     //by default calls Blog.post({object:'blog',method: 'post',id: 5});
 *     routes.dispatch({object:'blog',method: 'post',id: 5});
 *     //calls same as above, but saves history, fires callbacks, etc
 */
ActiveRoutes.prototype.dispatch = function dispatch(path,surpress_dispatcher)
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
            params: ActiveSupport.clone(path),
            name: reverse_lookup_result.name,
            path: reverse_lookup_result.path
        };
        path = this.urlFor(route.params);
        ActiveSupport.extend(route.params,reverse_lookup_result.params);
    }
    else
    {
        route = ActiveSupport.clone(path);
        path = this.urlFor(route.params);
    }
    this.history.push(route);
    this.index = this.history.length - 1;
    if(this.notify('beforeDispatch',route,path) === false)
    {
        return false;
    }
    if(!surpress_dispatcher)
    {
        if(ActiveRoutes.logging)
        {
            ActiveSupport.log('ActiveRoutes: dispatching "' + path + '" to ' + route.params.object + '.' + route.params.method);
        }
        
        this.dispatcher(route);
    }
    this.notify('afterDispatch',route,path);
};

/**
 * If no "dispatcher" key is passed into the options to contstruct a route set
 *  this is used. It will call scope.object_name.method_name(route.params)
 * @property {Function}
 * @alias ActiveRoutes.prototype.defaultDispatcher
 */
ActiveRoutes.prototype.defaultDispatcher = function defaultDispatcher(route)
{
    //the second parameter prevents the action from trying to set the current route
    //which was already set if the action was called from the dispatcher
    this.scope[route.params.object][route.params.method](route.params,false);
};