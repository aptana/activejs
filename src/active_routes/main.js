/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
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
 * @alias ActiveRoutes
 * @constructor
 * @param {Array} routes
 * @param {Object} [scope] defaults to window
 * @param {Object} [options]
 * @return {ActiveRoutes}
 * options can contain the following keys:
 * - base: default '', the default path / url prefix to be used in a generated url
 * - dispatcher: default ActiveRoutes.prototype.defaultDispatcher, the dispatcher function to be called when dispatch() is called and a route is found
 * - camelizeObjectName: default true, if true, trying to call "blog_controller" through routes will call "BlogController"
 * - camelizeMethodName: default true, if true, trying to call "my_method_name" through routes will call "myMethodName"
 * - camelizeGeneratedMethods: default true, will export generated methods into the scope as "articleUrl" instead of "article_url"
 * @example
 * var routes = new ActiveRoutes([
 *   ['article','article/:id',{object:'article',method:'article',requirements: {id:/\d+/}}],
 *   ['post','/blog/post/:id',{object:'blog',method: 'post'}],
 *   ['/blog/:method/:id',{object:'blog'}] //unnamed route
 * ]);
 * var route = routes.match('/blog/post/5');
 * route == {object: 'blog',method: 'post', id: 5};
 * routes.dispatch('/blog/post/5'); //calls Blog.post({object: 'blog',method: 'post', id: 5})
 * routes.urlFor({object: 'blog',method: 'post', id: 5}) == '/blog/post/5';
 * //creating the routes object above creates the following methods because there was a named route "post"
 * postUrl({id: 5}) == '/blog/post/5'
 * postParams({id: 5}) == {object: 'blog',method: 'post', id: 5}
 * callPost({id: 5}) //calls Blog.post({object: 'blog',method: 'post', id: 5})
 */
ActiveRoutes = function ActiveRoutes(routes,scope,options)
{
    this.error = false;
    this.scope = scope || window;
    this.routes = [];
    this.history = [];
    this.options = ActiveSupport.extend({
        camelizeObjectName: true,
        camelizeMethodName: true,
        camelizeGeneratedMethods: true,
        base: '',
        dispatcher: this.defaultDispatcher
    },options || {});
    this.dispatcher = this.options.dispatcher;
    var i;
    for(i = 0; i < routes.length; ++i)
    {
        this.addRoute.apply(this,routes[i]);
    }
    var current_route_set = this;
    this.scope[this.options.camelizeGeneratedMethods ? 'urlFor' : 'url_for'] = function generatedUrlFor(){
        current_route_set.urlFor.apply(current_route_set,arguments);
    };
};

/**
 * If match() returns false, the error it generates can be retrieved with this
 *  function.
 * @alias ActiveRoutes.prototype.getError
 * @return {mixed} String or null
 */
ActiveRoutes.prototype.getError = function getError()
{
    return this.error;
};

/**
 * @alias ActiveRoutes.prototype.addRoute
 * @exception {ActiveRoutes.Errors.NoPathInRoute}
 * @exception {ActiveRoutes.Errors.NoObjectInRoute}
 * @exception {ActiveRoutes.Errors.NoMethodInRoute}
 * Add a new route to the route set. All of the following are valid:
 * routes.addRoute('route_name','/route/path',{params});
 * routes.addRoute('/route/path',{params});
 * routes.addRoute('/route/path');
 */
ActiveRoutes.prototype.addRoute = function addRoute()
{
    var name,path,params,route;
    if(arguments.length == 3)
    {
        name = arguments[0];
        path = arguments[1];
        params = arguments[2];
    }
    else if(arguments.length == 2)
    {
        if(typeof(arguments[0]) == 'string' && typeof(arguments[1]) == 'string')
        {
            name = arguments[0];
            path = arguments[1];
        }
        else
        {
            path = arguments[0];
            params = arguments[1];
        }
    }
    else if(arguments.length == 1)
    {
        path = arguments[0];
    }
    route = {
        name: name,
        path: ActiveRoutes.normalizePath(path),
        params: params || {}
    };
    if(!Validations.hasPath(route))
    {
        throw Errors.NoPathInRoute;
    }
    if(!Validations.hasObject(route))
    {
        throw Errors.NoObjectInRoute + route.path;
    }
    if(!Validations.hasMethod(route))
    {
        throw Errors.NoMethodInRoute + route.path;
    }
    this.routes.push(route);
    this.generateMethodsForRoute(route);
};

ActiveRoutes.normalizePathDotDotRegexp = /[^\/\\]+[\/\\]\.\.[\/\\]/;
ActiveRoutes.normalizePath = function normalizePath(path)
{
    //remove hash
    path = path.replace(/\#.+$/,'');
    //remove query string
    path = path.replace(/\?.+$/,'');
    //remove trailing and starting slashes, replace backslashes, replace multiple slashes with a single slash
    path = path.replace(/\/{2,}/g,"/").replace(/\\\\/g,"\\").replace(/(\/|\\)$/,'').replace(/\\/g,'/').replace(/^\//,'');
    while(path.match(ActiveRoutes.normalizePathDotDotRegexp))
    {
        path = path.replace(ActiveRoutes.normalizePathDotDotRegexp,'');
    }
    //replace /index with /
    path = path.replace(/(\/index$|^index$)/i,'');
    return path;
};