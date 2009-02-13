/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
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

ActiveTest.Tests.Routes.matching = function(proceed)
{
    with(ActiveTest)
    {
        //test exact matches
        var routes_without_params = new ActiveRoutes([
            ['index','/home',{object: 'page',method: 'index'}],
            ['contact','pages/contact',{object: 'page', method: 'index'}],
            ['/pages/about/',{object: 'page',method: 'about'}]
        ],test_scope);
        
        assert(routes_without_params.match('/home').name == 'index','match() /home');
        assert(routes_without_params.match('home').name == 'index','match() home');
        assert(routes_without_params.match('/home/').name == 'index','match() home/');
        
        assert(routes_without_params.match('/pages/contact/').name == 'contact','match() /pages/contact/');
        assert(routes_without_params.match('/pages/contact').name == 'contact','match() /pages/contact');
        assert(routes_without_params.match('pages/contact/').name == 'contact','match() pages/contact/');
        assert(routes_without_params.match('pages/contact').name == 'contact','match() pages/contact');
        
        assert(routes_without_params.match('/pages/about/').params.method == 'about','match() /pages/about/');
        assert(routes_without_params.match('/pages/about').params.method == 'about','match() /pages/about');
        assert(routes_without_params.match('pages/about/').params.method == 'about','match() pages/about/');
        assert(routes_without_params.match('pages/about').params.method == 'about','match() pages/about');
        
        //test index handling
        var routes_without_params = new ActiveRoutes([
            ['index','pages',{object: 'page',method: 'index'}],
            ['contact','pages/contact',{object: 'page', method: 'index'}]
        ],test_scope);
        
        assert(routes_without_params.match('pages').name == 'index','index match() pages');
        assert(routes_without_params.match('pages/contact').name == 'contact','index match() pages/contact');
        assert(routes_without_params.match('pages/').name == 'index','index match() pages/');
        assert(routes_without_params.match('pages/index').name == 'index','index match() pages/index');
        
        var routes_without_params = new ActiveRoutes([
            ['index','pages/index',{object: 'page',method: 'index'}],
            ['contact','pages/contact',{object: 'page', method: 'index'}]
        ],test_scope);
        
        assert(routes_without_params.match('pages').name == 'index','index match() pages');
        assert(routes_without_params.match('pages/contact').name == 'contact','index match() pages/contact');
        assert(routes_without_params.match('pages/').name == 'index','index match() pages/');
        assert(routes_without_params.match('pages/index').name == 'index','index match() pages/index');
        
        //test complex route set with params
        var routes = new ActiveRoutes(test_valid_route_set,test_scope);
            
        var match;
        match = routes.match('/blog/post/5');
        assert(match.name == 'post' && match.params.id == 5 && match.params.method == 'post','complex match() /blog/post/5');
        
        match = routes.match('/blog/post/5.xml');
        assert(match.name == 'post' && match.extension == 'xml' && match.params.id == 5 && match.params.method == 'post','match() with extension /blog/post/5.xml');
        
        match = routes.match('/blog/edit/5');
        assert(match.params.id == 5 && match.params.method == 'edit','complex match() /blog/edit/5');
        
        match = routes.match('/blog/edit');
        assert(!match.params.id && match.params.method == 'edit','complex match() /blog/edit');
        
        match = routes.match('/blog/edit/');
        assert(!match.params.id && match.params.method == 'edit','complex match() /blog/edit/');
        
        match = routes.match('/pages/');
        assert(match.params.method == 'index','complex match() /pages/');
        
        match = routes.match('/pages/index');
        assert(match.params.method == 'index','complex match() /pages/index');
        
        match = routes.match('/pages/contact');
        assert(match.params.method == 'contact','complex match() /pages/contact');
        
        match = routes.match('/pages/about');
        assert(match.params.method == 'about','complex match() /pages/about');
        
        match = routes.match('/pages/about/');
        assert(match.params.method == 'about','complex match() /pages/about/');
        
        match = routes.match('/address/');
        assert(match.params.method == 'index','complex match() /address/');
        
        match = routes.match('/address');
        assert(match.params.method == 'index','complex match() /address');
        
        match = routes.match('/address/wa');
        assert(!match,'complex match() /address/wa');
        
        match = routes.match('/address/wa/98103');
        assert(match.params.method == 'address' && match.params.state == 'wa' && match.params.zip == '98103','complex match() /address/wa/98103');
        
        match = routes.match('/test');
        assert(match.params.method == 'index','complex match() /test');
        
        match = routes.match('/test/');
        assert(match.params.method == 'index','complex match() /test/');
        
        match = routes.match('/test/test');
        assert(match.params.method == 'test','complex match() /test/test');
        
        match = routes.match('/test/test/');
        assert(match.params.method == 'test','complex match() /test/test/');
        
        match = routes.match('/test/test/id');
        assert(match.params.method == 'test' && match.params.id == 'id','complex match() /test/test/id');
        
        match = routes.match('/test/test/id/');
        assert(match.params.method == 'test' && match.params.id == 'id','complex match() /test/test/id/');
        
        //test requirements
        match = routes.match('article/test');
        assert(!match,'requirements article/test');
        match = routes.match('article/53');
        assert(match.params.method == 'article' && match.params.id == '53' && !match.params.requirements,'requirements article/53');
        
        //with callback
        match = routes.match('article/53/54');
        assert(match.params.method == 'article' && match.params.id == '53' && match.params.comment_id == '54' && !match.params.requirements,'requirements article/53/54');
        
        //test catch all
        match = routes.match('my/application/wiki');
        assert(match.params.method == 'wiki' && match.params.path.length == 0,'catch all my/application/wiki');
        
        match = routes.match('my/application/wiki/');
        assert(match.params.method == 'wiki' && match.params.path.length == 0,'catch all my/application/wiki/');
        
        match = routes.match('my/application/wiki/a');
        assert(match.params.method == 'wiki' && match.params.path.length == 1 && match.params.path[0] == 'a','catch all my/application/wiki/a');
        
        match = routes.match('my/application/wiki/a/b/');
        assert(match.params.method == 'wiki' && match.params.path.length == 2 && match.params.path[1] == 'b','catch all my/application/wiki/a/b/');
        
        match = routes.match('my/application/wiki/a/b/c');
        assert(match.params.method == 'wiki' && match.params.path.length == 3 && match.params.path[2] == 'c','catch all my/application/wiki/a/b/c');
        
        match = routes.match('my/application/wiki/a/b/c/d/');
        assert(match.params.method == 'wiki' && match.params.path.length == 4 && match.params.path[3] == 'd','catch all my/application/wiki/a/b/c/d/');
                
        //test root
        match = routes.match('');
        assert(match.params.method == 'index' && match.params.object == 'Welcome','test root ""');
        match = routes.match('/');
        assert(match.params.method == 'index' && match.params.object == 'Welcome','test root "/"');
        
        //test class suffix
        routes.scope.BlogController = {
            post: function post(){}
        };
        var old_suffix = routes.options.classSuffix;
        routes.options.classSuffix = 'Controller';
        match = routes.match('/blog/post/5');
        routes.options.classSuffix = old_suffix;
        assert(match.name == 'post' && match.params.id == 5 && match.params.method == 'post' && match.params.object == 'BlogController','test of classSuffix');
    }
    if(proceed())
        proceed();
};