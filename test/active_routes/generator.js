ActiveTest.Tests.Routes.generator = function()
{
    with(ActiveTest)
    {
        var routes = new ActiveRoutes(test_valid_route_set,test_scope);
        assert('articleUrl' in test_scope,'url_for method generated');
        assert('articleParams' in test_scope,'params_for method generated');
        
        var params = test_scope.articleParams({id: 5});
        assert(params.method == 'article' && params.id == 5,'generated params_for returns correct params');
        assert(routes.urlFor('root') == '/','root route');
        assert(routes.urlFor('article',{id :5}) == '/article/5','named route with params');
        assert(routes.urlFor({object: 'article', method: 'article', id: 5}) == '/article/5','unname route with params');
        assert(test_scope.articleUrl({id: 5}) == '/article/5','generated url method with params');
        assert(!test_scope.articleUrl({id: 'TEST'}),'generated url still processes requirements');
        assert(test_scope.addressUrl({state:'wa',zip:'98102'}) == '/address/wa/98102','generated url with multiple params');
        assert(!routes.routes[5].params.state,'url generation does not contaminate params');
    }
};