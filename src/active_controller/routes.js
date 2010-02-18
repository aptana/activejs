ActiveController.routes = false;

ActiveController.setRoutes = function setRoutes(route_set)
{
    ActiveController.routes = route_set;
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
            //dispatch the route, but surpress the actual dispatcher
            ActiveController.routes.dispatch(final_route,true);
        }
    }
};