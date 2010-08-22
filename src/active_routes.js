var ActiveRoutes = null;

if(typeof exports != "undefined"){
    exports.ActiveRoutes = ActiveRoutes;
}

(function() {

/**
 * == ActiveRoutes ==
 *
 * Maps urls to method calls and method calls to urls. This
 * enables back button support and allows methods to be called by normal links
 * (A tags) in your application without adding event handlers or additional code.
 * 
 * Calling `setRoutes` will setup ActiveRoutes and call the dispatcher with the
 * current url (if any) as soon as the page is fully loaded. `setRoutes` takes
 * a hash with items in two formats:
 * 
 *     - String path: Function anonymous_callback
 *     - String path: Array [Object,Function method_callback]
 * 
 * A path string can contain any of the following:
 * 
 *     - "/about/contact" A plain path with no parameters.
 *     - "/about/:section" A path with a required named parameter.
 *     - "/about/(:section)" A path with an optional named paramter.
 *     - "/about/*" A path with an asterix / wildcard.
 * 
 * Each callback will be called with a hash containing the named parameters
 * specified in the path. A path with a wildcard will contain a "path" parameter.
 * 
 *     ActiveRoutes.setRoutes({
 *         '/': [HomeView,'index'],
 *         '/contact/:id': [ContactView,'contact'],
 *         '/about/(:section)': function(params){
 *           if(params.section == 'about'){
 *             ...
 *           }
 *         },
 *         '/wiki/*': function(params){
 *           if(params.path == ''){
 *             ...
 *           }
 *         }
 *     });
 * 
 * Url Generation
 * --------------
 * Method callbacks gain a `getUrl` method that is added to the function
 * object. Anonymous callbacks do not gain this method.
 * 
 *     ContactView.contact.getUrl({id: 5}) == "/contact/5"
 * 
 * Two Way Routing
 * ---------------
 * When method callbacks are called directly the url bar and history will
 * be automatically updated.
 * 
 *     ContactView.contact({id:5});
 *     //browser url bar now set to #/contact/5
 * 
 * Anonymous callbacks do not support this functionality. To acheive this
 * functionality ActiveRoutes wraps your method callbacks with another method
 * that performs the routing callbacks. The original method (without
 * routing callbacks) can be called via the `callWithoutRouting` property:
 * 
 *     ContactView.contact.callWithoutRouting({id:5});
 * 
 * Dispatching
 * -----------
 * ActiveRoutes polls for changes in the url, so the user entering a 
 * url, clicking a link or clicking the back button will trigger the
 * dispatcher. You can call `dispatch` directly:
 * 
 *     ActiveRoutes.dispatch('/contact/5');
 * 
 * But any link would also automatically trigger the dispatcher:
 * 
 *     <a href="#/contact/5">My Link</a>
 * 
 * As well as calling the method directly:
 * 
 *     ContactView.contact({id:5});
 * 
 * Events
 * ------
 * - ready()
 * - afterDispatch(path,method,params)
 * - externalChange(path): called when the url is changed by the back button or a link is clicked
 * - initialDispatchFailed(): called when the page loads but no route could be matched from the url bar
 **/
 
/** section: ActiveRoutes
 * ActiveRoutes
 **/
ActiveRoutes = {
    errors: {
        methodDoesNotExist: ActiveSupport.createError('The method "%" does not exist for the route "%"')
    },
    historyManager: {
        initialize: function(){
            SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveRoutes.externalChangeHandler);
        },
        onChange: function(path){
            SWFAddress.setValue(path);
        }
    },
    startObserver: false,
    ready: false,
    routes: [], //array of [path,method]
    routePatterns: [], //array of [regexp,param_name_array]
    currentRoute: false,
    history: [],
    paramPattern: '([\\w]+)(/|$)',
    enabled: false,
    /**
     * ActiveRoutes.setRoutes(routes) -> null
     * 
     *     ActiveRoutes.setRoutes({
     *         '/': [HomeView,'index'],
     *         '/contact/:id': [ContactView,'contact'],
     *         '/about': function(params){},
     *         '/wiki/*': function(path){}
     *     });
     *     ContactView.contact.getUrl({id: 5}); //"/contact/5"
     **/
    setRoutes: function setRoutes(routes)
    {
        for(var path in routes)
        {
            var route_is_array = routes[path] && typeof(routes[path]) == 'object' && 'length' in routes[path] && 'splice' in routes[path] && 'join' in routes[path];
            if(route_is_array)
            {
                ActiveRoutes.addRoute(path,routes[path][0],routes[path][1]);
            }
            else
            {
                ActiveRoutes.addRoute(path,routes[path]);
            }
        }
        ActiveRoutes.start();
    },
    /**
     * ActiveRoutes.addRoute(path,method) -> null
     * ActiveRoutes.addRoute(path,object,method) -> null
     **/
    addRoute: function addRoute(path)
    {
        if(arguments[2])
        {
            var object = arguments[1];
            if(typeof(object.getInstance) != 'undefined')
            {
                object = object.getInstance();
            }
            var method = arguments[2];
            var original_method = object[method];
            if(typeof(object[method]) == 'undefined')
            {
                throw ActiveRoutes.errors.methodDoesNotExist.getErrorString(method,path);
            }
            object[method] = function routing_wrapper(params){
                ActiveRoutes.setRoute(ActiveRoutes.generateUrl(path,params));
                original_method.apply(object,arguments);
            };
            object[method].getUrl = function url_generator(params){
                return ActiveRoutes.generateUrl(path,params);
            };
            object[method].callWithoutRouting = function original_method_callback(){
                return original_method.apply(object,arguments);
            };
            ActiveRoutes.routes.push([path,object[method]]);
        }
        else
        {
            ActiveRoutes.routes.push([path,arguments[1]]);
        }
        ActiveRoutes.routePatterns.push(ActiveRoutes.routeMatcherFromPath(path));
    },
    routeMatcherFromPath: function routeMatcherFromPath(path)
    {
        var params = [];
        var reg_exp_pattern = String(path);
        reg_exp_pattern = reg_exp_pattern.replace(/\((\:?[\w]+)\)/g,function(){
          return '' + arguments[1] + '?'; //regex for optional params "/:one/:two/(:three)"
        });
        reg_exp_pattern = reg_exp_pattern.replace(/\:([\w]+)(\/?)/g,function(){
            params.push(arguments[1]);
            return '(' + ActiveRoutes.paramPattern + ')';
        });
        reg_exp_pattern = reg_exp_pattern.replace(/\)\?\/\(/g,')?('); //cleanup for optional params 
        if(reg_exp_pattern.match(/\*/))
        {
            params.push('path');
            reg_exp_pattern = reg_exp_pattern.replace(/\*/g,'((.+$))?');
        }
        return [new RegExp('^' + reg_exp_pattern + '$'),params];
    },
    /**
     * ActiveRoutes.dispatch(path) -> Boolean
     **/
    dispatch: function dispatch(path,force)
    {
        var match = ActiveRoutes.match(path);
        var should_dispatch = path != ActiveRoutes.currentRoute;
        if(!should_dispatch && force == true)
        {
            should_dispatch = true;
        }
        if(ActiveRoutes.enabled && should_dispatch && match)
        {
            if(!match[0].getUrl)
            {
                ActiveRoutes.setRoute(path);
            }
            match[0](match[1]);
            this.history.push([path,match[0],match[1]]);
            this.notify('afterDispatch',path,match[0],match[1]);
            return true;
        }
        else
        {
            return false;
        }
    },
    /**
     * ActiveRoutes.match(path) -> Array | Boolean
     * If a path is matched the response will be array [method,params]
     **/
    match: function match(path)
    {
        for(var i = 0; i < ActiveRoutes.routes.length; ++i)
        {
            if(ActiveRoutes.routes[i][0] == path)
            {
                return [ActiveRoutes.routes[i][1],{}];
            }
        }
        for(var i = 0; i < ActiveRoutes.routePatterns.length; ++i)
        {
            var matches = ActiveRoutes.routePatterns[i][0].exec(path);
            if(matches)
            {
                var params = {};
                for(var ii = 0; ii < ActiveRoutes.routePatterns[i][1].length; ++ii)
                {
                    params[ActiveRoutes.routePatterns[i][1][ii]] = matches[((ii + 1) * 3) - 1];
                }
                return [ActiveRoutes.routes[i][1],params];
            }
        }
        return false;
    },
    generateUrl: function generateUrl(url,params)
    {
        url = url.replace(/(\(|\))/g,'');
        params = params || {};
        if(typeof(params) == 'string' && url.match(/\*/))
        {
            url = url.replace(/\*/,params).replace(/\/\//g,'/');
        }
        else
        {
            var param_matcher = new RegExp('\\:' + ActiveRoutes.paramPattern,'g');
            for(var param_name in params)
            {
                url = url.replace(param_matcher,function(){
                    return arguments[1] == param_name ? params[param_name] + arguments[2] : ':' + arguments[1] + arguments[2];
                });
            }
        }
        return url;
    },
    setRoute: function setRoute(path)
    {
        if(ActiveRoutes.enabled)
        {
            if(ActiveRoutes.currentRoute != path)
            {
                ActiveRoutes.historyManager.onChange(path);
                ActiveRoutes.currentRoute = path;
            }
        }
    },
    /**
     * ActiveRoutes.getCurrentPath() -> String
     **/
    getCurrentPath: function getCurrentPath()
    {
        var path_bits = ActiveSupport.getGlobalContext().location.href.split('#');
        return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
    },
    /**
     * ActiveRoutes.start() -> null
     **/
    start: function start()
    {
        if(!ActiveRoutes.startObserver && !ActiveRoutes.ready)
        {
            ActiveRoutes.startObserver = ActiveSupport.Element.observe(ActiveSupport.getGlobalContext().document,'ready',function document_ready_observer(){
                ActiveRoutes.historyManager.initialize();
                ActiveRoutes.ready = true;
                ActiveRoutes.enabled = true;
                if(ActiveRoutes.notify('ready') !== false)
                {
                    setTimeout(function initial_route_dispatcher(){
                        if(!ActiveRoutes.dispatch(ActiveRoutes.getCurrentPath(),true))
                        {
                            ActiveRoutes.notify('initialDispatchFailed');
                        }
                    });
                }
            });
        }
    },
    externalChangeHandler: function externalChangeHandler()
    {
        if(ActiveRoutes.enabled)
        {
            var current_path = ActiveRoutes.getCurrentPath();
            if(ActiveRoutes.ready)
            {
                if(current_path != ActiveRoutes.currentRoute)
                {
                    if(ActiveRoutes.notify('externalChange',current_path) !== false)
                    {
                        ActiveRoutes.dispatch(current_path);
                    }
                }
            }
        }
    },
    /**
     * ActiveRoutes.stop() -> null
     **/
    stop: function stop()
    {
        ActiveRoutes.enabled = false;
    },
    /**
     * ActiveRoutes.getHistory() -> Array
     **/
    getHistory: function getHistory()
    {
        return ActiveRoutes.history;
    },
    /**
     * ActiveRoutes.getPreviousRoute() -> Array
     **/
    getPreviousRoute: function getPreviousRoute(){
      return ActiveRoutes.history[ActiveRoutes.history.length - 2];
    }
};
ActiveEvent.extend(ActiveRoutes);

})();
