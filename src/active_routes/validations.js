var Validations = {
    hasPath: function(route)
    {
        if(route.path === '')
        {
            return true;
        }
        else
        {
            return !!route.path;
        }
    },
    hasMethod: function(route)
    {
        return !(!route.path.match(':method') && (!route.params || !route.params.method));
    },
    hasObject: function(route)
    {
        return !(!route.path.match(':object') && (!route.params || !route.params.object));
    }
};

ActiveRoutes.prototype.objectExists = function(object_name)
{
    return !!ActiveSupport.getClass(object_name,this.scope);
};

ActiveRoutes.prototype.getMethod = function(object_name,method_name)
{
    if(this.scope[object_name].prototype && this.scope[object_name].prototype[method_name])
    {
        return this.scope[object_name].prototype[method_name];
    }
    else
    {
        return this.scope[object_name][method_name];
    }
};

ActiveRoutes.prototype.methodExists = function(object_name,method_name)
{
    return !(!this.objectExists(object_name) || !this.getMethod(object_name,method_name));
};

ActiveRoutes.prototype.methodCallable = function(object_name,method_name)
{
    return (this.methodExists(object_name,method_name) && (typeof(this.getMethod(object_name,method_name)) === 'function'));
};


ActiveRoutes.Validations = Validations;