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

ActiveTest.Tests.Routes.validation = function(proceed)
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
    if(proceed())
        proceed();
};