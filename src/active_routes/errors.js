var Errors = {
    NoPathInRoute: ActiveSupport.createError('No path was specified in the route.'),
    NoObjectInRoute: ActiveSupport.createError('No :object was specified in the route: %'),
    NoMethodInRoute: ActiveSupport.createError('No :method was specified in the route: %'),
    ObjectDoesNotExist: ActiveSupport.createError('The following object does not exist: %'),
    MethodDoesNotExist: ActiveSupport.createError('The following method does not exist: %'),
    MethodNotCallable: ActiveSupport.createError('The following method is not callable: %'),
    NamedRouteDoesNotExist: ActiveSupport.createError('The following named route does not exist: %'),
    UnresolvableUrl: ActiveSupport.createError('Could not resolve the url: %'),
    ObjectNotInRouteSet: ActiveSupport.createError('The passed object does not exist in the route set: %'),
    ReverseLookupFailed: ActiveSupport.createError('A route could not be found that corresponds to the following object: %')
};
ActiveRoutes.Errors = Errors;