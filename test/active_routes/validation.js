ActiveTest.Tests.Routes.validation = function()
{
    with(ActiveTest)
    {
        var no_object_no_method = {
            path: 'a/b/c'
        };
        var no_object_method_in_string = {
            path: 'a/:method'
        };
        var no_object_method_in_params = {
            path: 'a',
            params: {
                method: 'b'
            }
        };
        var no_method_object_in_string = {
            path: 'a/:object'
        };
        var no_method_object_in_params = {
            path: 'a',
            params: {
                object: 'b'
            }
        };
        
        //only the following two are valid
        var method_and_object_in_params = {
            path: '/a/b',
            params: {
                object: 'a',
                method: 'b'
            }
        };
        var method_and_object_in_string = {
            path: ':object/:method'
        };
        
        assert(!ActiveRoutes.Validations.hasObject(no_object_no_method),'no_object_no_method: !hasObject()');
        assert(!ActiveRoutes.Validations.hasMethod(no_object_no_method),'no_object_no_method: !hasMethod()');
        assert(!ActiveRoutes.Validations.hasObject(no_object_method_in_string),'no_object_method_in_string: !hasObject()');
        assert(ActiveRoutes.Validations.hasMethod(no_object_method_in_string),'no_object_method_in_string: hasMethod()');
        assert(!ActiveRoutes.Validations.hasObject(no_object_method_in_params),'no_object_method_in_params: !hasObject()');
        assert(ActiveRoutes.Validations.hasMethod(no_object_method_in_params),'no_object_method_in_params: hasMethod()');
        assert(ActiveRoutes.Validations.hasObject(no_method_object_in_string),'no_object_method_in_params: hasObject()');
        assert(!ActiveRoutes.Validations.hasMethod(no_method_object_in_string),'no_object_method_in_params: !hasMethod()');
        assert(ActiveRoutes.Validations.hasObject(no_method_object_in_params),'no_method_object_in_params: hasObject()');
        assert(!ActiveRoutes.Validations.hasMethod(no_method_object_in_params),'no_method_object_in_params: !hasMethod()');
        assert(ActiveRoutes.Validations.hasObject(method_and_object_in_params) && ActiveRoutes.Validations.hasMethod(method_and_object_in_params),'method_and_object_in_params: valid?');
        assert(ActiveRoutes.Validations.hasObject(method_and_object_in_string) && ActiveRoutes.Validations.hasMethod(method_and_object_in_string),'method_and_object_in_string: valid?');
    
        var test_scope = {
            object_one: {
                method_one: function(){},
                method_two: 'a string'
            }
        };
        var r = new ActiveRoutes([],test_scope);
        assert(r.objectExists('object_one'),'Routes.objectExists()');
        assert(!r.objectExists('object_two'),'!Routes.objectExists()');
        
        assert(!r.methodExists('object_two','method_one'),'!Routes.methodExists()');
        assert(!r.methodExists('object_two','method_three'),'!Routes.methodExists()');
        assert(!r.methodExists('object_one','method_three'),'!Routes.methodExists()');
        assert(r.methodExists('object_one','method_one'),'Routes.methodExists()');
        assert(r.methodExists('object_one','method_two'),'Routes.methodExists()');
        assert(r.methodCallable('object_one','method_one'),'Routes.methodCallable()');
    }
};