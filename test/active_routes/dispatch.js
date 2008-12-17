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

ActiveTest.Tests.Routes.dispatch = function(proceed)
{
    with(ActiveTest)
    {
        var last_action;
        var routes = new ActiveRoutes(test_valid_route_set,test_scope);
        assert(routes.history.length == 0,'history starts empty');
        
        routes.dispatch('/address/wa/98103');
        assert(routes.history.length == 1,'history incrimented');
        assert(routes.history[routes.history.length - 1].zip == '98103' == 1,'history contains params');
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '98103' && last_action.method == 'address','dispatcher called action from string');
        
        routes.dispatch(test_scope.addressParams({zip:'83340',state:'id'}))
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '83340' && last_action.method == 'address','dispatcher called action from params');
        
        test_scope.callAddress({zip:'83340',state:'id'});
        last_action = logged_actions.pop()[0];
        assert(last_action.zip == '83340' && last_action.method == 'address','dispatcher called action from generated call method');
    }
    if(proceed())
        proceed();
};