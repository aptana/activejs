ActiveView.Routing = {
    routes: false,
    enabled: true,
    ready: false,
    lastDispatchLocation: false,
    start: function start()
    {
        ActiveView.Routing.ready = true;
        ActiveSupport.DOM.observe(ActiveSupport.getGlobalContext().document,'ready',function document_ready_observer(){
            ActiveView.Routing.routes.dispatch(ActiveView.Routing.getCurrentPath());
        });
    },
    enable: function enable()
    {
        ActiveView.Routing.enabled = true;
        if(!ActiveView.Routing.ready)
        {
            ActiveView.Routing.start();
        }
    },
    disable: function disable()
    {
        ActiveView.Routing.enabled = false;
    },
    getCurrentPath: function getCurrentPath()
    {
        var path_bits = ActiveSupport.getGlobalContext().location.href.split('#');
        return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
    },
    afterDispatchHandler: function afterDispatchHandler(route,path)
    {
        if(ActiveView.Routing.enabled)
        {
            SWFAddress.setValue(path);
            ActiveView.Routing.lastDispatchLocation = path;
        }
    },
    externalChangeHandler: function externalChangeHandler()
    {
        if(ActiveView.Routing.enabled)
        {
            var current_path = ActiveView.Routing.getCurrentPath();
            if(ActiveView.Routing.ready)
            {
                if(current_path != ActiveView.Routing.lastDispatchLocation)
                {
                    ActiveView.Routing.routes.dispatch(current_path);
                }
            }
        }
    },
    generateRoutesArray: function generateRoutesArray(routes)
    {
        var routes_array = [];
        for(var route_name in routes)
        {
            var route = [route_name];
            var route_params = {};
            if(typeof(routes[route_name]) == 'string')
            {
                route.push(routes[route_name]);
            }
            else
            {
                route.push(routes[route_name][0]);
                route_params = routes[route_name][1];
            }
            route_params.object = 'Routing';
            route_params.method = route_name;
            route.push(route_params);
            routes_array.push(route);
        }
        return routes_array;
    },
    generateRoutingWrapperMethods: function generateRoutingWrapperMethods(view_class,routes)
    {
        for(var route_name in routes)
        {
            ActiveView.Routing[route_name] = (function routing_wrapper_generator_iterator(route_name){
                return function generated_routing_wrapper(params){
                    return view_class[route_name](params);
                };
            }).apply(this,[route_name]);
        }
    },
    initializeRoutes: function initializeRoutes()
    {
        ActiveView.Routing.routes = new ActiveRoutes([],ActiveView);
        ActiveView.Routing.routes.observe('afterDispatch',ActiveView.Routing.afterDispatchHandler);
        SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveView.Routing.externalChangeHandler);
    },
    addRoutes: function addRoutes(view_class,routes)
    {
        if(!ActiveView.Routing.routes)
        {
            ActiveView.Routing.initializeRoutes();
        }
        ActiveView.Routing.generateRoutingWrapperMethods(view_class,routes);
        var routes_array = ActiveView.Routing.generateRoutesArray(routes);
        for(var i = 0; i < routes_array.length; ++i)
        {
            if(routes_array[i])
            {
                ActiveView.Routing.routes.addRoute.apply(ActiveView.Routing.routes,routes_array[i]);
            }
        }
        ActiveView.Routing.enable();
    },
    setRoute: function setRoute(view,route_name,params)
    {
        var route = false;
        for(var i = 0; i < ActiveView.Routing.routes.routes.length; ++i)
        {
            if(ActiveView.Routing.routes.routes[i].name == route_name)
            {
                route = ActiveView.Routing.routes.routes[i];
                break;
            }
        }
        params.method = route_name;
        params.object = 'Routing';
        var final_route = ActiveSupport.clone(route);
        //need to deep copy the params
        final_route.params = ActiveSupport.clone(route.params);
        ActiveSupport.extend(final_route.params,params || {});
        //dispatch the route, but suppress the actual dispatcher
        ActiveView.Routing.routes.dispatch(final_route,true);
    }
};

ActiveSupport.extend(ClassMethods,{
    setRoutes: function setRoutes(routes)
    {
        this.generateRoutingMethods(routes);
        ActiveView.Routing.addRoutes(this,routes);
    },
    generateRoutingMethods: function generateRoutingMethods(routes)
    {
        for(var route_name in routes)
        {
            (function routing_generator_iterator(route_name){
                this[route_name] = function generated_routing_handler(params){
                    ActiveView.Routing.setRoute(this,route_name,params);
                    this.getInstance()[route_name](params);
                };
            }).apply(this,[route_name]);
        }
    }
});


/*


ClassMethods.dispatch = function dispatch(params)
{
    var instance = this.getInstance();
    for(var param_name in params)
    {
        instance.set(param_name,params[param_name]);
    }
};

ActiveView.Routing = {
    enabled: true,
    ready: false,
    lastDispatchLocation: false,
    getCurrentPath: function getCurrentPath()
    {
        var path_bits = ActiveSupport.getGlobalContext().location.href.split('#');
        return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
    },
    externalChangeHandler: function externalChangeHandler()
    {
        if(ActiveView.Routing.enabled)
        {
            var current_path = ActiveView.Routing.getCurrentPath();
            if(ActiveView.Routing.ready)
            {
                if(current_path != ActiveView.Routing.lastDispatchLocation)
                {
                    ActiveRoutes.routes.dispatch(current_path);
                }
            }
        }
    },
    afterDispatchHandler: function afterDispatchHandler(route,path)
    {
        if(ActiveView.Routing.enabled)
        {
            SWFAddress.setValue(path);
            ActiveView.Routing.lastDispatchLocation = path;
        }
    },
    setRoutesWrapper: function setRoutesWrapper(proceed,route_set)
    {
        proceed(route_set);
        SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveView.Routing.externalChangeHandler);
        route_set.observe('afterDispatch',ActiveView.Routing.afterDispatchHandler);
        ActiveView.Routing.start();
    },
    start: function start()
    {
        ActiveView.Routing.ready = true;
        ActiveRoutes.routes.dispatch(ActiveView.Routing.getCurrentPath());
    },
    enable: function enable()
    {
        ActiveView.Routing.enabled = true;
        if(!ActiveView.Routing.ready)
        {
            ActiveView.Routing.start();
        }
    },
    disable: function disable()
    {
        ActiveView.Routing.enabled = false;
    }
};

ActiveRoutes.setRoutes = ActiveSupport.wrap(ActiveRoutes.setRoutes,ActiveView.Routing.setRoutesWrapper);

ActiveController.createAction = function createAction(klass,action_name,action)
{
    klass[action_name] = function action_wrapper(){
        if(arguments[0] && typeof(arguments[0]) == 'object')
        {
            this.params = arguments[0];
        }
        var suppress_routes = (arguments.length == 2 && arguments[1] === false);
        this.notify('beforeCall',action_name,this.params);
        if(!this.setupComplete)
        {
            this.setup();
        }
        this.renderLayout();
        if(ActiveController.routes && !suppress_routes)
        {
            ActiveController.setRoute(klass,action_name,this.params);
        }
        ActiveSupport.bind(action,this)();
        this.notify('afterCall',action_name,this.params);
    };
};

ActiveController.setRoute = function setRoute(klass,action_name,params)
{
    if(ActiveController.routes)
    {
        var route = ActiveController.routes.reverseLookup(klass,action_name);
        if(route)
        {
            params.method = route.params.method;
            params.object = route.params.object;
            var final_route = ActiveSupport.clone(route);
            //need to deep copy the params
            final_route.params = ActiveSupport.clone(route.params);
            ActiveSupport.extend(final_route.params,params || {});
            //dispatch the route, but suppress the actual dispatcher
            ActiveController.routes.dispatch(final_route,true);
        }
    }
};
*/