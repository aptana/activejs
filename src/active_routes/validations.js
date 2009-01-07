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