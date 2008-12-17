/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * ***** END LICENSE BLOCK ***** */

ActiveTest.Tests.Routes.generator = function(proceed)
{
    with(ActiveTest)
    {
        var routes = new Routes(test_valid_route_set,test_scope);
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
    if(proceed())
        proceed();
};