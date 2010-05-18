/**
 * ActiveView.Routing
 * Enables history / back button support in ActiveView. See the ActiveView tutorial for examples.
 **/
ActiveView.Routing = {
    routes: false,
    enabled: true,
    ready: false,
    lastDispatchLocation: false,
    startObserver: false,
    start: function start()
    {
        if(!ActiveView.Routing.startObserver && !ActiveView.Routing.ready)
        {
            ActiveView.Routing.startObserver = ActiveSupport.Element.observe(ActiveSupport.getGlobalContext().document,'ready',function document_ready_observer(){
                ActiveView.Routing.ready = true;
                ActiveView.Routing.routes.dispatch(ActiveView.Routing.getCurrentPath());
            });
        }
    },
    /**
     * ActiveView.Routing.enable() -> null
     * Calling [[ActiveView.Routing.setRoutes]] will automatically call `enable`.
     **/
    enable: function enable()
    {
        ActiveView.Routing.enabled = true;
        ActiveView.Routing.start();
    },
    /**
     * ActiveView.Routing.disable() -> null
     **/
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
    generateRouteArray: function generateRouteArray(view_class,route_name,path,method_name)
    {
        return [route_name,path,{
            object: 'Routing',
            method: method_name
        }];
    },
    generateRoutingWrapperMethod: function generateRoutingWrapperMethod(view_class,route_name,method_name)
    {
        ActiveView.Routing[route_name] = function generated_routing_wrapper(params){
            return view_class[method_name](params);
        };
    },
    initializeRoutes: function initializeRoutes()
    {
        ActiveView.Routing.routes = new ActiveRoutes([],ActiveView);
        ActiveView.Routing.routes.observe('afterDispatch',ActiveView.Routing.afterDispatchHandler);
        SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveView.Routing.externalChangeHandler);
    },
    addRoute: function addRoute(view_class,route_name,path,method_name)
    {
        ActiveView.Routing.generateRoutingWrapperMethod(view_class,route_name,method_name);
        ActiveView.Routing.routes.addRoute.apply(ActiveView.Routing.routes,ActiveView.Routing.generateRouteArray(view_class,route_name,path,method_name));
    },
    generateRoutingMethod: function generateRoutingMethod(view_class,route_name,method_name)
    {
        view_class.getInstance()[method_name] = ActiveSupport.Function.wrap(view_class.getInstance()[method_name],function wrapped_generated_routing_handler(proceed,params){
            ActiveView.Routing.setRoute(view_class,route_name,params,method_name);
            proceed(params);
        });
        view_class[method_name] = function generated_routing_handler(params){
            view_class.getInstance()[method_name](params);
        };
    },
    setRoute: function setRoute(view,route_name,params,method_name)
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
        params.method = method_name;
        params.object = 'Routing';
        var final_route = ActiveSupport.Object.clone(route);
        //need to deep copy the params
        final_route.params = ActiveSupport.Object.clone(route.params);
        ActiveSupport.Object.extend(final_route.params,params || {});
        //dispatch the route, but suppress the actual dispatcher
        ActiveView.Routing.routes.dispatch(final_route,true);
    },
    /**
     * ActiveView.Routing.setRoutes(routes) -> null
     * - routes (Object)
     * See the ActiveView tutorial for a full explanation of routing.
     * 
     *     ActiveView.Routing.setRoutes({
     *         home: ['/',BlogView,'index'],
     *         articles: ['/articles/',ArticlesView,'index'],
     *         article: ['/articles/:id',ArticlesView,'article']
     *     });
     **/
    setRoutes: function setRoutes(routes)
    {
        if(!ActiveView.Routing.routes)
        {
            ActiveView.Routing.initializeRoutes();
        }
        for(var route_name in routes)
        {
            var view_class = routes[route_name][1];
            var method_name = routes[route_name][2] || route_name;
            var path = routes[route_name][0];
            ActiveView.Routing.generateRoutingMethod(view_class,route_name,method_name);
            ActiveView.Routing.addRoute(view_class,route_name,path,method_name);
        }
        ActiveView.Routing.enable();
    }
};