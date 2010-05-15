/**
 * ActiveSupport.Function
 **/
ActiveSupport.Function = {
    /**
     * ActiveSupport.Function.methodize(function) -> Function
     * Emulates Prototype's [Function.prototype.methodize](http://api.prototypejs.org/language/function/prototype/methodize/) including curry functionality.
     **/
    methodize: function methodize(func)
    {
        if(func._methodized)
        {
            return func._methodized;
        }
        return func._methodized = function()
        {
            return func.apply(null,[this].concat(ActiveSupport.Array.from(arguments)));
        };
    },
    /**
     * ActiveSupport.Function.bind(function,context[,argument]) -> Function
     * Emulates Prototype's [Function.prototype.bind](http://api.prototypejs.org/language/function/prototype/bind/) including curry functionality.
     **/
    bind: function bind(func,object)
    {
        if(typeof(object) == 'undefined')
        {
            return func;
        }
        if(arguments.length < 3)
        {
            return function bound()
            {
                return func.apply(object,arguments);
            };
        }
        else
        {
            var args = ActiveSupport.Array.from(arguments);
            args.shift();
            args.shift();
            return function bound()
            {
                return func.apply(object,args.concat(ActiveSupport.Array.from(arguments)));
            }
        }
    },
    /**
     * ActiveSupport.Function.curry(function[,argument]) -> Function
     * Emulates Prototype's [Function.prototype.curry](http://api.prototypejs.org/language/function/prototype/curry/).
     **/
    curry: function curry(func)
    {
        if(arguments.length == 1)
        {
            return func;
        }
        var args = ActiveSupport.Array.from(arguments).slice(1);
        return function curried()
        {
            return func.apply(this,args.concat(ActiveSupport.Array.from(arguments)));
        };
    },
    /**
     * ActiveSupport.Function.wrap(function,wrapper) -> Function
     * Emulates Prototype's [Function.prototype.wrap](http://api.prototypejs.org/language/function/prototype/wrap/)
     **/
    wrap: function wrap(func,wrapper)
    {
        return function wrapped()
        {
            return wrapper.apply(this,[ActiveSupport.Function.bind(func,this)].concat(ActiveSupport.Array.from(arguments)));
        };
    }
};