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

ActiveController = {};

ActiveController.create = function create(actions,methods)
{
    var klass = function klass(container,params){
        this.container = container;
        this.params = params || {};
        this.scope = {};
        this.initialize();
    };
    ActiveSupport.extend(klass,ClassMethods);
    for(var action_name in actions || {})
    {
        ActiveController.createAction(klass,action_name,actions[action_name]);
    }
    ActiveSupport.extend(klass.prototype,InstanceMethods);
    ActiveSupport.extend(klass.prototype,methods || {});
    ActiveEvent.extend(klass);
    return klass;
};

ActiveController.createAction = function wrapAction(klass,action_name,action)
{
    klass.prototype[action_name] = function action_wrapper(){
        this.notify('beforeCall',action_name);
        action.bind(this)();
        this.notify('afterCall',action_name);
    };
};

var InstanceMethods = {
    initialize: function initialize()
    {
        
    },
    get: function get(key)
    {
        return this.scope[key];
    },
    set: function set(key,value)
    {
        this.scope[key] = value;
        this.notify('set',key,value);
        return value;
    }
};

var ClassMethods = {
    
};
