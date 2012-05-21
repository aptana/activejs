/**
 * == ActiveEvent ==
 *
 * Create observable events, and attach event handlers to any class or object.
 * Supports class events that cascade to all instances.
 *
 * Setup
 * -----
 * Before you can use ActiveEvent you call [[ActiveEvent.extend]]. If you extend a class, both the class itself
 * will become observable, as well as all of it's instances.
 *
 *     ActiveEvent.extend(MyClass); //class and all instances are observable
 *     ActiveEvent.extend(my_object); //this object becomes observable
 *
 * Creating Events
 * ---------------
 * You can create an event inside any method of your class or object by calling
 * the `notify` method with name of the event followed by any arguments to be
 * passed to observers.
 *
 *     var Message = function(){};
 *     ActiveEvent.extend(Message);
 *     Message.prototype.send = function(text){
 *         //message sending code here...
 *         this.notify('sent',text);
 *     };
 *
 * Observing Events
 * ----------------
 * To observe an event call the `observe` method with the name of the event you
 * want to observe, and the observer function. The observer function will
 * receive any additional arguments passed to `notify`. If observing a class,
 * the instance that triggered the event will always be the first argument
 * passed to the observer. `observeOnce` works just like `observe` in every
 * way, but is only called once.
 *
 *     Message.observe('sent',function(message,text){
 *         //responds to all sent messages
 *     });
 *
 *     var m = new Message();
 *     m.observe('sent',function(text){
 *         //this will only be called when "m" is sent
 *     });
 *
 *     observable_hash.observe('set',function(key,value){
 *         console.log('observable_hash.set: ' + key + '=' + value);
 *     });
 *
 *     observable_hash.observeOnce('set',function(key,value){
 *         //this will only be called once
 *     });
 *
 * Function Binding
 * ----------------
 * You can bind and curry your observers by adding extra arguments, which
 * will be passed to [[ActiveSupport.Function.bind]]:
 *
 *     Message.observe('sent',function(message,text){
 *         //this == context
 *     },context);
 *
 *     Message.observe('sent',function(curried_argument,message,text){
 *         //this == context
 *     },context,curried_argument);
 *
 * Control Flow
 * ------------
 * When `notify` is called, if any of the registered observers for that event
 * return false, no other observers will be called and `notify` will return
 * false. Returning null or not calling return will not stop the event.
 *
 * Otherwise `notify` will return an array of the
 * collected return values from any registered observer functions. Observers
 * can be unregistered with the `stopObserving` method. If no observer is
 * passed, all observers of that object or class with the given event name
 * will be unregistered. If no event name and no observer is passed, all
 * observers of that object or class will be unregistered.
 *
 *     Message.prototype.send = function(text){
 *         if(this.notify('send',text) === false)
 *             return false;
 *         //message sending code here...
 *         this.notify('sent',text);
 *         return true;
 *     };
 *
 *     var m = new Message();
 *
 *     var observer = m.observe('send',function(message,text){
 *         if(text === 'test')
 *             return false;
 *     });
 *
 *     m.send('my message'); //returned true
 *     m.send('test'); //returned false
 *
 *     m.stopObserving('send',observer);
 *
 *     m.send('test'); //returned true
 *
 * Object.options
 * --------------
 * If an object has an options property that contains a callable function with
 * the same name as an event triggered with `notify`, it will be
 * treated just like an instance observer.
 *
 *     var Widget = function(options){
 *         this.options = options;
 *     };
 *     ActiveEvent.extend(Widget);
 *
 *     var my_widget = new Widget({
 *         afterChange: function(){}
 *     });
 *     //equivelent to:
 *     var my_widget = new Widget();
 *     my_widget.observe('afterChange',function(){});
 **/
var ActiveEvent = null;

if(typeof exports != "undefined"){
    exports.ActiveEvent = ActiveEvent;
}

/** section: ActiveEvent
 * mixin Observable
 * After calling [[ActiveEvent.extend]], the given object will inherit the
 * methods in this namespace. If the given object has a prototype
 * (is a class constructor), the object's prototype will inherit
 * these methods as well.
 **/
(function(){

ActiveEvent = {};

/** section: ActiveEvent
 * ActiveEvent
 * See [ActiveEvent tutorial](../index.html).
 **/

/**
 * ActiveEvent.extend(object) -> Object
 * Mixin [[Observable]] to the given object.
 **/
ActiveEvent.extend = function extend(object){

    object._objectEventSetup = function _objectEventSetup(event_name)
    {
        if(!this._observers)
        {
            this._observers = {};
        }
        if(!(event_name in this._observers))
        {
            this._observers[event_name] = [];
        }
    };

    /**
     * Observable.observe(event_name,observer[,context]) -> Function
     * See ActiveEvent tutorial.
     **/
    object.observe = function observe(event_name,observer,context)
    {
        observer = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(observer,arguments,2);
        if(typeof(event_name) === 'string' && typeof(observer) !== 'undefined')
        {
            this._objectEventSetup(event_name);
            if(!(ActiveSupport.Array.indexOf(this._observers[event_name],observer) > -1))
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
     * Observable.stopObserving([event_name][,observer]) -> null
     * Removes a given observer. If no observer is passed, removes all
     * observers of that event. If no event is passed, removes all
     * observers of the object.
     **/
    object.stopObserving = function stopObserving(event_name,observer)
    {
        this._objectEventSetup(event_name);
        if(event_name && observer)
        {
            this._observers[event_name] = ActiveSupport.Array.without(this._observers[event_name],observer);
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
     * Observable.observeOnce(event_name,observer[,context]) -> Function
     * Works exactly like `observe`, but will `stopObserving` after the first
     * time the event is fired. Note that the observer that is passed in will
     * be wrapped by another function which will be returned. The returned
     * function can then be passed to `stopObserving`
     **/
    object.observeOnce = function observeOnce(event_name,outer_observer,context)
    {
        outer_observer = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(outer_observer,arguments,2);
        var inner_observer = ActiveSupport.Function.bind(function bound_inner_observer(){
            outer_observer.apply(this,arguments);
            this.stopObserving(event_name,inner_observer);
        },this);
        this._objectEventSetup(event_name);
        this._observers[event_name].push(inner_observer);
        return inner_observer;
    };

    /**
     * Observable.notify(event_name[,argument]) -> Array | Boolean
     * Triggers event_name with the passed arguments, accepts a variable number of arguments.
     * Returns an Array of values returned by the registered observers, or false if the event was
     * stopped by an observer.
     **/
    object.notify = function notify(event_name)
    {
        if(!this._observers || !this._observers[event_name] || (this._observers[event_name] && this._observers[event_name].length == 0))
        {
            return [];
        }
        this._objectEventSetup(event_name);
        var collected_return_values = [];
        var args = ActiveSupport.Array.from(arguments).slice(1);
        for(var i = 0; i < this._observers[event_name].length; ++i)
        {
            var response = this._observers[event_name][i].apply(this._observers[event_name][i],args);
            if(response === false)
            {
                return false;
            }
            else
            {
                collected_return_values.push(response);
            }
        }
        return collected_return_values;
    };
    if(object.prototype)
    {
        object.prototype._objectEventSetup = object._objectEventSetup;
        object.prototype.observe = object.observe;
        object.prototype.stopObserving = object.stopObserving;
        object.prototype.observeOnce = object.observeOnce;
        object.prototype.notify = function notify_instance(event_name)
        {
            if(
              (!object._observers || !object._observers[event_name] || (object._observers[event_name] && object._observers[event_name].length == 0)) &&
              (!this.options || !this.options[event_name]) &&
              (!this._observers || !this._observers[event_name] || (this._observers[event_name] && this._observers[event_name].length == 0))
            )
            {
                return [];
            }
            var args = ActiveSupport.Array.from(arguments).slice(1);
            var collected_return_values = [];
            if(object.notify)
            {
                object_args = ActiveSupport.Array.from(arguments).slice(1);
                object_args.unshift(this);
                object_args.unshift(event_name);
                var collected_return_values_from_object = object.notify.apply(object,object_args);
                if(collected_return_values_from_object === false)
                {
                    return false;
                }
                collected_return_values = collected_return_values.concat(collected_return_values_from_object);
            }
            this._objectEventSetup(event_name);
            var response;
            if(this.options && this.options[event_name] && typeof(this.options[event_name]) === 'function')
            {
                response = this.options[event_name].apply(this,args);
                if(response === false)
                {
                    return false;
                }
                else
                {
                    collected_return_values.push(response);
                }
            }
            for(var i = 0; i < this._observers[event_name].length; ++i)
            {
                response = this._observers[event_name][i].apply(this._observers[event_name][i],args);
                if(response === false)
                {
                    return false;
                }
                else
                {
                    collected_return_values.push(response);
                }
            }
            return collected_return_values;
        };
    }
};

/**
 * class ActiveEvent.ObservableHash
 * includes Observable
 * A simple hash implementation that fires notifications on `set`/`unset`.
 *
 * Events
 * ------
 * - set(key,value)
 * - unset(key)
 **/
var ObservableHash = function ObservableHash(object)
{
    this._object = object || {};
};

/**
 * ActiveEvent.ObservableHash#set(key,value[,suppress_notifications = false]) -> mixed
 **/
ObservableHash.prototype.set = function set(key,value,suppress_observers)
{
    var old_value = this._object[key];
    this._object[key] = value;
    if(this._observers && this._observers.set && !suppress_observers)
    {
        this.notify('set',key,value);
    }
    return value;
};

/**
 * ActiveEvent.ObservableHash#get(key) -> mixed
 **/
ObservableHash.prototype.get = function get(key)
{
    return this._object[key];
};

/**
 * ActiveEvent.ObservableHash#unset(key) -> mixed
 **/
ObservableHash.prototype.unset = function unset(key)
{
    if(this._observers && this._observers.unset)
    {
        this.notify('unset',key);
    }
    var value = this._object[key];
    delete this._object[key];
    return value;
};

/**
 * ActiveEvent.ObservableHash#toObject() -> Object
 * Returns a vanilla (non-observable) hash.
 **/
ObservableHash.prototype.toObject = function toObject()
{
    return this._object;
};

ActiveEvent.extend(ObservableHash);

ActiveEvent.ObservableHash = ObservableHash;

})();