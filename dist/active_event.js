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

ActiveEvent = null;

(function(){
    
var global_context = ActiveSupport.getGlobalContext();

/**
 * Mimics the Prototype.js framework's $break variable if it is not available.
 * @property
 * @alias $break
 */
if(typeof(global_context.$break) == 'undefined')
{
    global_context.$break = {};
}

ActiveEvent = {};

ActiveEvent.extend = function extend(object){
    
    /**
     * Wraps the given method_name with a function that will call the method,
     *  then trigger an event with the same name as the method. This can
     *  safely be applied to virtually any method, including built in
     *  Objects (Array.pop, etc), but cannot be undone.
     * @alias ActiveEvent.ObservableObject.makeObservable
     * @param {String} method_name
     */
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
    
    /**
     * Similiar to makeObservable(), but after the callback is called, the
     *  method will be returned to it's original state and will no longer
     *  be observable.
     * @alias ActiveEvent.ObservableObject.observeMethod
     * @param {String} method_name
     * @param {Function} observe
     * @param {Function} [callback]
     */
    object.observeMethod = function observeMethod(method_name,observer,scope)
    {
        return new ActiveEvent.MethodCallObserver([[this,method_name]],observer,scope);
    };
    
    object._objectEventSetup = function _objectEventSetup(event_name)
    {
        this._observers = this._observers || {};
        this._observers[event_name] = this._observers[event_name] || [];
    };
    
    /**
     * @alias ActiveEvent.ObservableObject.observe
     * @param {String} event_name
     * @param {Function} observer
     * @return {Function} observer
     */
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
    
    /**
     * Removes a given observer. If no observer is passed, removes all
     *   observers of that event. If no event is passed, removes all
     *   observers of the object.
     * @alias ActiveEvent.ObservableObject.stopObserving
     * @param {String} [event_name]
     * @param {Function} [observer]
     */
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
    
    /**
     * Works exactly like observe(), but will stopObserving() after the next
     *   time the event is fired.
     * @alias ActiveEvent.ObservableObject.observeOnce
     * @param {String} event_name
     * @param {Function} observer
     * @return {Function} The observer that was passed in will be wrapped,
     *  this generated / wrapped observer is returned.
     */
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
    
    /**
     * Triggers event_name with the passed arguments.
     * @alias ActiveEvent.ObservableObject.notify
     * @param {String} event_name
     * @param {mixed} [args]
     * @return {mixed} Array of return values, or false if $break was thrown
     *  by an observer.
     */
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
            }
            catch(e)
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
};

})();
