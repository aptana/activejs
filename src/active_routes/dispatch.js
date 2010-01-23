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
                return ActiveSupport.throwError(this.error);
            }
            else
            {
                return ActiveSupport.throwError(Errors.UnresolvableUrl,path);
            }
        }
    }
    else if(path && !path.name && !path.path)
    {
        var reverse_lookup_result = this.reverseLookup(path.object,path.method);
        if(!reverse_lookup_result)
        {
            return ActiveSupport.throwError(Errors.ReverseLookupFailed,path);
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