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
        this.error = Errors.ObjectDoesNotExist + route.params.object;
    }
    if(!this.methodExists(route.params.object,route.params.method))
    {
        this.error = Errors.MethodDoesNotExist + route.params.object + '.' + route.params.method;
    }
    if(!this.methodCallable(route.params.object,route.params.method))
    {
        this.error = Errors.MethodNotCallable + route.params.object + '.' + route.params.method;
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
        if(ActiveRoutes.logging)
        {
            ActiveSupport.log('ActiveRoutes: matched "' + original_path + '" with "' + (route.name || route.path) + '"');
        }
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
    path = ActiveRoutes.normalizePath((new String(path)).toString());
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
                            ? route.params.requirements[key]((new String(path_component).toString()))
                            : path_component.match(route.params.requirements[key])))
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
