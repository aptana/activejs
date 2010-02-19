ActiveTest.Tests.Routes.dispatch = function()
{
    with(ActiveTest)
    {
        var last_action;
        var routes = new ActiveRoutes(test_valid_route_set,test_scope);
        assert(routes.history.length == 0,'history starts empty');
        
        routes.dispatch('/address/wa/98103');
        assert(routes.history.length == 1,'history incremented');
        assert(routes.history[routes.history.length - 1].params.zip == '98103' == 1,'history contains params');
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '98103' && last_action.method == 'address','dispatcher called action from string');
        
        routes.dispatch(test_scope.addressParams({zip:'83340',state:'id'}))
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '83340' && last_action.method == 'address','dispatcher called action from params');
    }
};
