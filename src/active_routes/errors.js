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

var Errors = {
    NoPathInRoute: ActiveSupport.createError('No path was specified in the route'),
    NoObjectInRoute: ActiveSupport.createError('No :object was specified in the route: '),
    NoMethodInRoute: ActiveSupport.createError('No :method was specified in the route: '),
    ObjectDoesNotExist: ActiveSupport.createError('The following object does not exist: '),
    MethodDoesNotExist: ActiveSupport.createError('The following method does not exist: '),
    MethodNotCallable: ActiveSupport.createError('The following method is not callable: '),
    NamedRouteDoesNotExist: ActiveSupport.createError('The following named route does not exist: '),
    UnresolvableUrl: ActiveSupport.createError('Could not resolve the url: '),
    ObjectNotInRouteSet: ActiveSupport.createError('The passed object does not exist in the route set:'),
    ReverseLookupFailed: ActiveSupport.createError('A route could not be found that corresponds to the following object:')
};
ActiveRoutes.Errors = Errors;