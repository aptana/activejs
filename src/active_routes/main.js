/**
 * @alias ActiveRoutes
 * @constructor
 * @param {Array} routes
 * @param {Object} [scope] defaults to window
 * @param {Object} [options]
 * @return {ActiveRoutes}
 * @example
 *
 * ActiveRoutes
 * ============
 * 
 * ActiveRoutes maps URI strings to method calls, and visa versa. It shares a
 * similar syntax to Rails Routing, but is framework agnostic and can map
 * calls to any type of object. Server side it can be used to map requests for
 * a given URL to a method that will render a page, client side it can be used
 * to provide deep linking and back button / history support for your Ajax
 * application.
 * 
 * Declaring Routes
 * ----------------
 * Wether declared in the constructor, or with addRoute(), routes can have up
 * to three parameters, and can be declared in any of the follow ways:
 * 
 * - "name", "path", {params}
 * - "path", {params}
 * - "path"
 * 
 * The path portion of a route is a URI string. Parameters that will be passed
 * to the method called are represented with a colon. Names are optional, but
 * the path and the params together must declare "object" and "method"
 * parameters. The following are all valid routes:
 * 
 *     var routes = new ActiveRoutes([
 *       ['root','/',{object:'Pages',method:'index'}],
 *       ['contact','/contact',{object:'Pages',method:'contact'}],
 *       ['blog','/blog',{object:'Blog',method:'index'}],
 *       ['post','/blog/post/:id',{object:'Blog',method:'post'}],
 *       ['/pages/*',{object:'Pages',method:'page'}],
 *       ['/:object/:method']
 *     ],Application);
 * 
 * Options
 * -------
 * You can pass a hash of options as the third parameter to the ActiveRoutes
 * constructor. This hash can contain the following keys:
 * 
 * - base: default '', the default path / url prefix to be used in a generated url
 * - classSuffix: default '' if it was "Controller", calling "/blog/post/5" would call BlogController.post instead of Blog.post
 * - dispatcher: default ActiveRoutes.prototype.defaultDispatcher, the dispatcher function to be called when dispatch() is called and a route is found
 * - camelizeObjectName: default true, if true, trying to call "blog_controller" through routes will call "BlogController"
 * - camelizeMethodName: default true, if true, trying to call "my_method_name" through routes will call "myMethodName"
 * - camelizeGeneratedMethods: default true, will export generated methods into the scope as "articleUrl" instead of "article_url"
 * 
 * Catch All Routes
 * ----------------
 * If you want to route all requests below a certain path to a given method,
 * place an asterisk in your route. When a matching path is dispatched to
 * that route the path components will be available in an array called "path".
 * 
 *     route_set.addRoute('/wiki/*',{object:'WikiController',method:'page'})
 *     route_set.dispatch('/wiki/a/b/c');
 *     //calls: WikiController.page({object:'WikiController',method:'page',path:['a','b','c']})
 * 
 * Route Requirements
 * ------------------
 * Each route can take a special "requirements" parameter that will not be
 * passed in the params passed to the called method. Each requirement
 * can be a regular expression or a function, which the value of the
 * parameter will be checked against. Each value checked by a regular
 * expression or function is always a string.
 * 
 *     route_set.addRoute('/article/:article_id/:comment_id',{
 *         article_id: /^\d+$/,
 *         comment_id: function(comment_id){
 *             return comment_id.match(/^\d+$/);
 *         }
 *     });
 * 
 * Scope
 * -----
 * You can specify what scope an ActiveRoutes instance will look in to call
 * the specified objects and methods. This defaults to window but can be
 * specified as the second parameter to the constructor.
 * 
 * Generating URLs
 * ---------------
 * The method urlFor() is available on every route set, and can generate a
 * URL from an object. Using the routes declared in the example above:
 * 
 *     routes.urlFor({object:'Blog',method:'post',id:5}) == '/blog/post/5';
 * 
 * If named routes are given, corresponding methods are generated in the
 * passed scope to resolve these urls.
 * 
 *     Application.postUrl({id: 5}) == '/blog/post/5';
 * 
 * To get the params to generate a url, a similar method is generated:
 * 
 *     Application.postParams({id: 5}) == {object:'Blog',method:'post',id:5};
 *
 * Dispatching
 * -----------
 * To call a given method from a URL string, use the dispatch() method.
 * 
 *     routes.dispatch('/'); //will call Pages.index()
 *     routes.dispatch('/blog/post/5'); //will call Blog.post({id: 5});
 * 
 * History
 * -------
 * Most server side JavaScript implementations will not preserve objects
 * between requests, so the history is not of use. Client side, after each
 * dispatch, the route and parameters are recorded. The history itself is
 * accessible with the "history" property, and is traversable with the
 * next() and back() methods.
 */
ActiveRoutes = function initialize(routes,scope,options)
{
    this.initialized = false;
    this.error = false;
    this.scope = scope || ActiveSupport.getGlobalContext();
    this.routes = [];
    this.index = 0;
    /**
     * @alias ActiveRoutes.prototype.history
     * @property {Array}
     */
    this.history = [];
    this.options = ActiveSupport.extend({
        classSuffix: '',
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
        if(routes[i]) //fix for accidental trailing commas in IE arrays
        {
            this.addRoute.apply(this,routes[i]);
        }
    }
    var current_route_set = this;
    this.scope[this.options.camelizeGeneratedMethods ? 'urlFor' : 'url_for'] = function generatedUrlFor(){
        current_route_set.urlFor.apply(current_route_set,arguments);
    };
    this.initialized = true;
};
ActiveEvent.extend(ActiveRoutes);

/**
 * @namespace {ActiveRoutes.Route} A Route object reffered to in
 * the documentation is a psuedo class instance that will always
 * contain the following properties:
 *
 *  - name {String}
 *  - path {String}
 *  - params {Object}
 * 
 * The route may optionally contain:
 *
 *  - orderedParams {Array}
 *  - extension {String}
 */

/**
 * @alias ActiveRoutes.logging
 * @property {Boolean}
 */
ActiveRoutes.logging = false;

ActiveRoutes.prototype.goToIndex = function goToIndex(index)
{
    if(!this.history[index])
    {
        return false;
    }
    this.index = index;
    this.dispatcher(this.history[this.index]);
    return true;
};

/**
 * Calls to the previous dispatched route in the history.
 * @alias ActiveRoutes.prototype.back
 * @return {Boolean}
 */
ActiveRoutes.prototype.back = function back()
{
    if(this.index == 0)
    {
        return false;
    }
    --this.index;
    this.dispatcher(this.history[this.index]);
    return true;
};

/**
 * Calls to the next dispatched route in the history if back() has already
 * been called.
 * @alias ActiveRoutes.prototype.next
 * @return {Boolean}
 */
ActiveRoutes.prototype.next = function next()
{
    if(this.index >= this.history.length - 1)
    {
        return false;
    }
    ++this.index;
    this.dispatcher(this.history[this.index]);
    return true;
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
 * Add a new route to the route set. When adding routes via the constructor
 * routes will be pushed onto the array, if called after the route set is
 * initialized, the route will be unshifted onto the route set (and will
 * have the highest priority).
 * @alias ActiveRoutes.prototype.addRoute
 * @exception {ActiveRoutes.Errors.NoPathInRoute}
 * @exception {ActiveRoutes.Errors.NoObjectInRoute}
 * @exception {ActiveRoutes.Errors.NoMethodInRoute}
 * @example
 * routes.addRoute('route_name','/route/path',{params});<br/>
 * routes.addRoute('/route/path',{params});<br/>
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
        throw Errors.NoPathInRoute.getErrorString();
    }
    if(!Validations.hasObject(route))
    {
        throw Errors.NoObjectInRoute.getErrorString(route.path);
    }
    if(!Validations.hasMethod(route))
    {
        throw Errors.NoMethodInRoute.getErrorString(route.path);
    }
    if(this.initialized)
    {
        this.routes.unshift(route);
    }
    else
    {
        this.routes.push(route);
    }
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