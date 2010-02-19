ActiveTest.Tests.Routes.history = function()
{
    with(ActiveTest)
    {
        var last_action;
        
        var routes = new ActiveRoutes(test_valid_route_set,test_scope);
        assert(routes.history.length == 0,'history starts empty');
        
        routes.dispatch('/address/wa/98103');
        routes.dispatch('/address/wa/98104');
        routes.dispatch('/address/wa/98105');
        
        assert(routes.history.length == 3,'history incremented');
        assert(routes.index == 2,'index incremented');
        
        var back_response = routes.back();
        assert(routes.history.length == 3,'history not incremented by back()');
        assert(routes.index == 1,'index decrimented by back()');
        last_action = logged_actions.pop()[0];
        assert(back_response && last_action.zip == '98104','back() calls correct action');
        
        routes.back();
        var back_response = routes.back();
        assert(!back_response && routes.index == 0,'back cannot traverse below 0');
        
        routes.next();
        routes.next();
        assert(routes.history.length == 3,'history not incremented by next()');
        assert(routes.index == 2,'index incremented by next()');
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '98105','next() calls correct action');
        
        var next_response = routes.next();
        assert(!next_response && routes.index == 2,'next() cannot traverse beyond history length');
    }
};
