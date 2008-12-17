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
 * Original Author: Ryan Johnson <ryan@syntacticx.com>
 * Additional Contributors: The Aptana Jaxer team
 * 
 * ***** END LICENSE BLOCK ***** */

ActiveEvent = null;

(function(){
    
var global_context = ActiveSupport.getGlobalContext();

if(typeof(global_context.$break) == 'undefined')
{
    global_context.$break = {};
}

ActiveEvent = {};

ActiveEvent.extend = function extend(object){
    
    object.makeObservable = function makeObservable(method_name)
    {
        if(this[method_name])
        {
            this._objectEventSetup(method_name);
            this[method_name] = ActiveSupport.wrap(this[method_name],function wrapped_observer(proceed){
                var args = ActiveSupport.arrayFrom(arguments).slice(1);
                var response = proceed.apply(this,args);
                args.unshift(method_name);
                this.notify.apply(this,args);
                return response;
            });
        }
        if(this.prototype)
        {
            this.prototype.makeObservable(method_name);
        }
    };
    
    object.observeMethod = function observeMethod(method_name,observer,scope)
    {
        return new ActiveEvent.MethodCallObserver([[this,method_name]],observer,scope);
    };
    
    object._objectEventSetup = function _objectEventSetup(event_name)
    {
        this._observers = this._observers || {};
        this._observers[event_name] = this._observers[event_name] || [];
    };
    
    object.observe = function observe(event_name,observer)
    {
        if(typeof(event_name) == 'string' && typeof(observer) != 'undefined')
        {
            this._objectEventSetup(event_name);
            if(!(ActiveSupport.indexOf(this._observers[event_name],observer) > -1))
            {
                this._observers[event_name].push(observer);
            }
        }
        else
        {
            for(var e in event_name)
            {
                this.observe(e,event_name[e]);
            }
        }
        return observer;
    };
    
    object.stopObserving = function stopObserving(event_name,observer)
    {
        this._objectEventSetup(event_name);
        if(event_name && observer)
        {
            this._observers[event_name] = ActiveSupport.without(this._observers[event_name],observer);
        }
        else if(event_name)
        {
            this._observers[event_name] = [];
        }
        else
        {
            this._observers = {};
        }
    };
    
    object.observeOnce = function observeOnce(event_name,outer_observer)
    {
        var inner_observer = ActiveSupport.bind(function bound_inner_observer(){
            outer_observer.apply(this,arguments);
            this.stopObserving(event_name,inner_observer);
        },this);
        this._objectEventSetup(event_name);
        this._observers[event_name].push(inner_observer);
        return inner_observer;
    };
    
    object.notify = function notify(event_name){
        this._objectEventSetup(event_name);
        var collected_return_values = [];
        var args = ActiveSupport.arrayFrom(arguments).slice(1);
        try{
            for(var i = 0; i < this._observers[event_name].length; ++i)
                collected_return_values.push(this._observers[event_name][i].apply(this._observers[event_name][i],args) || null);
        }catch(e){
            if(e == $break)
            {
                return false;
            }
            else
            {
                throw e;
            }
        }
        return collected_return_values;
    };
    if(object.prototype)
    {
        object.prototype.makeObservable = object.makeObservable;
        object.prototype.observeMethod = object.observeMethod;
        object.prototype._objectEventSetup = object._objectEventSetup;
        object.prototype.observe = object.observe;
        object.prototype.stopObserving = object.stopObserving;
        object.prototype.observeOnce = object.observeOnce;
        
        object.prototype.notify = function notify(event_name)
        {
            if(object.notify)
            {
                var args = ActiveSupport.arrayFrom(arguments).slice(1);
                args.unshift(this);
                args.unshift(event_name);
                object.notify.apply(object,args);
            }
            this._objectEventSetup(event_name);
            var args = ActiveSupport.arrayFrom(arguments).slice(1);
            var collected_return_values = [];
            try
            {
                if(this.options && this.options[event_name] && typeof(this.options[event_name]) == 'function')
                {
                    collected_return_values.push(this.options[event_name].apply(this,args) || null);
                }
                for(var i = 0; i < this._observers[event_name].length; ++i)
                {
                    collected_return_values.push(this._observers[event_name][i].apply(this._observers[event_name][i],args) || null);
                }
            }catch(e)
            {
                if(e == $break)
                {
                    return false;
                }
                else
                {
                    throw e;
                }
            }
            return collected_return_values;
        };
    }
};

ActiveEvent.MethodCallObserver = function MethodCallObserver(methods,observer,scope)
{
    this.stop = function stop(){
        for(var i = 0; i < this.methods.length; ++i)
        {
            this.methods[i][0][this.methods[i][1]] = this.originals[i];
        }
    };
    this.methods = methods;
    this.originals = [];
    for(var i = 0; i < this.methods.length; ++i)
    {
        this.originals.push(this.methods[i][0][this.methods[i][1]]);
        this.methods[i][0][this.methods[i][1]] = ActiveSupport.wrap(this.methods[i][0][this.methods[i][1]],function(proceed){
            var args = ActiveSupport.arrayFrom(arguments).slice(1);
            observer.apply(this,args);
            return proceed.apply(this,args);
        });
    }
    if(scope)
    {
        scope();
        this.stop();
    }
},

global_context.$proc = function $proc(proc)
{
    return typeof(proc) == 'function' ? proc : function(){return proc;};
};

global_context.$value = function $value(value)
{
    return typeof(value) == 'function' ? value() : value;
};

global_context.$block = function $block(args)
{
    if(typeof(args) == 'number' || !args)
    {
        var up = arguments.callee;
        for(var i = 0; i <= (args || 0); ++i)
        {
            up = up.caller;
            if(!up)
            {
                return false;
            }
        }
        args = up.arguments;
    }
    return (args.length == 0 || typeof(args[args.length - 1]) != 'function') ? false : args[args.length - 1];
};

global_context.$synchronize  function $synchronize(execute,finish)
{
    var scope = {};
    var stack = [];
    stack.waiting = {};
    stack.add = function add(callback){
        var wrapped = ActiveSupport.wrap(callback || function(){},function synchronizationWrapper(proceed){
            var i = null;
            var index = ActiveSupport.indexOf(stack,wrapped);
            stack.waiting[index] = [proceed,ActiveSupport.arrayFrom(arguments)];
            var all_present = true;
            for(i = 0; i < stack.length; ++i)
            {
                if(!stack.waiting[i])
                {
                    all_present = false;
                }
            }
            if(all_present)
            {
                for(i = 0; i < stack.length; ++i)
                {
                    var item = stack.waiting[i];
                    item[0].apply(item[0],item[1]);
                    delete stack.waiting[i];
                }
            }
            if(all_present && i == stack.length)
            {
                if(finish)
                {
                    finish(scope);
                }
            }
        });
        stack.push(wrapped);
        return wrapped;
    };
    execute(stack,scope);
    if(stack.length == 0 && finish)
    {
        finish(scope);
    }
}

})();