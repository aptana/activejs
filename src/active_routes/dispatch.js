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
 
/**
 * Will match() the given path and call the dispatcher if one is found.
 * @alias ActiveRoutes.prototype.dispatch
 * @param {String} path
 * @exception {ActiveRoutes.Errors.UnresolvableUrl}
 * @example
 * var routes = new ActiveRoutes([['post','/blog/post/:id',{object:'blog',method: 'post'}]]);<br/>
 * routes.dispatch('/blog/post/5');<br/>
 * //by default calls Blog.post({object:'blog',method: 'post',id: 5});
 */
ActiveRoutes.prototype.dispatch = function dispatch(path)
{
    var route;
    if(typeof(path) == 'string')
    {
        route = this.match(path);
        if(!route)
        {
            throw Errors.UnresolvableUrl + path;
        }
    }
    else
    {
        route = {
            params: path
        };
    }
    this.history.push(route.params);
    this.dispatcher(route);
};

/**
 * If no "dispatcher" key is passed into the options to contstruct a route set
 *  this is used. It will call scope.object_name.method_name(route.params)
 * @property {Function}
 * @alias ActiveRoutes.prototype.defaultDispatcher
 */
ActiveRoutes.prototype.defaultDispatcher = function defaultDispatcher(route)
{
    this.scope[route.params.object][route.params.method](route.params);
};