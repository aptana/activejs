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

ActiveTest.Tests.Routes.history = function(proceed)
{
    with(ActiveTest)
    {
        var last_action;
        
        var routes = new ActiveRoutes(test_valid_route_set,test_scope);
        assert(routes.history.length == 0,'history starts empty');
        
        routes.dispatch('/address/wa/98103');
        routes.dispatch('/address/wa/98104');
        routes.dispatch('/address/wa/98105');
        
        assert(routes.history.length == 3,'history incrimented');
        assert(routes.index == 2,'index incrimented');
        
        var back_response = routes.back();
        assert(routes.history.length == 3,'history not incrimented by back()');
        assert(routes.index == 1,'index decrimented by back()');
        last_action = logged_actions.pop()[0];
        assert(back_response && last_action.zip == '98104','back() calls correct action');
        
        routes.back();
        var back_response = routes.back();
        assert(!back_response && routes.index == 0,'back cannot traverse below 0');
        
        routes.next();
        routes.next();
        assert(routes.history.length == 3,'history not incrimented by next()');
        assert(routes.index == 2,'index incrimented by next()');
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '98105','next() calls correct action');
        
        var next_response = routes.next();
        assert(!next_response && routes.index == 2,'next() cannot traverse beyond history length');
    }
    if(proceed())
        proceed();
};