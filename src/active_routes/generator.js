ActiveRoutes.prototype.cleanPath = function cleanPath(path,params,only_path)
{
    if(!params.id)
    {
        path = path.replace(/\/?\:id/,'');
    }
    if(params.method == 'index')
    {
        path = path.replace(/\/?\:method/,'');
    }
    path = path.replace(/\/?index$/,'');
    if(path.charAt(0) != '/')
    {
        path = '/' + path;
    }
    path = only_path ? path : this.options.base + path;
    return path;
};

ActiveRoutes.performParamSubstitution = function performParamSubstitution(path,route,params)
{
    for(var p in params)
    {
        if(path.match(':' + p) && params[p])
        {
            if(route.params.requirements && route.params.requirements[p]){
                if(typeof(route.params.requirements[p]) == 'function' && !route.params.requirements[p](String(params[p])))
                {
                    continue;
                }
                else if(!route.params.requirements[p].exec(String(params[p])))
                {
                    continue;
                }
            }
            path = path.replace(':' + p,params[p].toString());
        }
        else if(p == 'path' && path.match(/\*/))
        {
            path = path.replace(/\*/,params[p]);
        }
    }
    return path;
};

/**
 * @alias ActiveRoutes.prototype.urlFor
 * @param {Object} [params]
 * @return {String}
 * @exception {ActiveRoutes.Errors.NamedRouteDoesNotExistError}
 * @example
 * var routes = new ActiveRoutes([['post','/blog/post/:id',{object:'blog',method: 'post'}]]);<br/>
 * routes.urlFor({object: 'blog',method: 'post', id: 5}) == '/blog/post/5';
 */
ActiveRoutes.prototype.urlFor = function urlFor(params)
{
    var only_path = false;
    if(params.only_path){
        only_path = true;
        delete params.only_path;
    }
  
    //get a named route with no params
    if(typeof(params) == 'string')
    {
        var found = false;
        for(var i = 0; i < this.routes.length; ++i)
        {
            if(this.routes[i].name && this.routes[i].name == params)
            {
                found = i;
                break;
            }
        }
        if(found === false)
        {
            throw Errors.NamedRouteDoesNotExistError.getErrorString(params);
        }
        else
        {
            var final_params = {};
            var found_params = ActiveSupport.clone(this.routes[found].params);
            for(var name in found_params)
            {
                final_params[name] = found_params[name];
            }
            if(typeof(arguments[1]) == 'object')
            {
                for(var name in arguments[1])
                {
                    final_params[name] = arguments[1][name];
                }
            }
            return this.urlFor(final_params);
        }
    }
    
    if(!params.method)
    {
        params.method = 'index';
    }
    
    if(this.options.camelizeMethodName)
    {
        params.method = ActiveSupport.camelize(params.method,false);
    }
    
    if(this.options.camelizeObjectName)
    {
        params.object = ActiveSupport.camelize(params.object,true);
    }
    
    //first past for exact match
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = ActiveSupport.clone(this.routes[i]);
        route.params = ActiveSupport.clone(this.routes[i].params || {});
        var path = route.path;
        if((route.params.method || '').toLowerCase() == (params.method || '').toLowerCase() && (route.params.object || '').toLowerCase() == (params.object || '').toLowerCase())
        {
            path = ActiveRoutes.performParamSubstitution(path,route,params);
            var cleaned = this.cleanPath(path,params,only_path);
            if(!cleaned.match(':'))
            {
                return cleaned;
            }
            
        }
    }
    //match that requires param replacement
    for(var i = 0; i < this.routes.length; ++i)
    {
        var route = ActiveSupport.clone(this.routes[i]);
        route.params = ActiveSupport.clone(this.routes[i].params || {});
        var path = route.path;
        if(route.params.object == params.object)
        {
            path = ActiveRoutes.performParamSubstitution(path,route,params);
            var cleaned = this.cleanPath(path,params,only_path);
            if(!cleaned.match(':'))
            {
                return cleaned;
            }
        }
    }
    return false;
};

ActiveRoutes.prototype.generateMethodsForRoute = function generateMethodsForRoute(route)
{
    var current_route_set = this;
    if(route.name)
    {
        var params_for_method_name = route.name + '_params';
        var url_for_method_name = route.name + '_url';
        if(current_route_set.options.camelizeGeneratedMethods)
        {
            params_for_method_name = ActiveSupport.camelize(params_for_method_name.replace(/\_/g,'-'));
            url_for_method_name = ActiveSupport.camelize(url_for_method_name.replace(/\_/g,'-'));
        }
        
        current_route_set.scope[params_for_method_name] = function generated_params_for(params){
            var final_params = {};
            for(var name in route.params || {})
            {
                final_params[name] = route.params[name];
            }
            for(var name in params)
            {
                final_params[name] = params[name];
            }
            return final_params;
        };
        
        current_route_set.scope[url_for_method_name] = function generated_url_for(params){
            return current_route_set.urlFor(current_route_set.scope[params_for_method_name](params));
        };
    }
};