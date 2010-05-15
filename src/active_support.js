var ActiveSupport = null;

if(typeof exports != "undefined"){
    exports.ActiveSupport = ActiveSupport;
}

(function(global_context){
 
/** 
 * ActiveSupport
 * Provides a subset of methods from the Prototype.js framework,
 * without modifying any built in prototypes to ensure compatibility
 * and portability.
 **/
ActiveSupport = {
    /**
     * ActiveSupport.getGlobalContext() -> Object
     * Returns the global context object (window in most implementations).
     **/
    getGlobalContext: function getGlobalContext()
    {
        return global_context;
    },
    /**
     * ActiveSupport.log() -> null
     * Logs a message to the available logging resource. Accepts a variable
     * number of arguments.
     **/
    log: function log()
    {
        if(typeof(console) !== 'undefined')
        {
            //console.log.apply not supported by IE
            switch(arguments.length)
            {
                case 1: console.log(arguments[0]); break;
                case 2: console.log(arguments[0],arguments[1]); break;
                case 3: console.log(arguments[0],arguments[1],arguments[2]); break;
                case 4: console.log(arguments[0],arguments[1],arguments[2],arguments[3]); break;
                case 5: console.log(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]); break;
            }
        }
    },
    /**
     * ActiveSupport.createError(message) -> Object
     * Creates an Error object (but does not throw it).
     *
     *     var MyError = ActiveSupport.createError('Error in file % on line %.');
     *     throw MyError.getErrorString(file_name,line_number);
     **/
    createError: function createError(message)
    {
        return {
            getErrorString: function getErrorString()
            {
                var output = String(message);
                for(var i = 0; i < arguments.length; ++i)
                {
                    output = output.replace(/\%/,arguments[i].toString ? arguments[i].toString() : String(arguments[i]));
                }
                return output;
            }
        };
    },
    /**
     * ActiveSupport.methodize([modules]) -> null
     * - modules (Array): A list of the modules to methodize, can contain "Array", "Function", "String", "Number"
     * 
     * Calling ActiveSupport.methodize will take the methods inside of the "Array", "Function", "String", "Number"
     * modules and make them methods of the respective native class's prototype. This is not enabled by default.
     * 
     *     var bound = ActiveSupport.Function.bind(function(){},this);
     *     ActiveSupport.methodize()
     *     //bind() now available on Function.prototype
     *     var bound = function(){}.bind(this)
     **/
    methodize: function methodize(modules)
    {
        if(!modules)
        {
            modules = ['Array','Function','String','Number'];
        }
        for(var i = 0; i < modules.length; ++i)
        {
            for(var method_name in ActiveSupport[modules[i]])
            {
                if(typeof(ActiveSupport[modules[i]][method_name]) == 'function')
                {
                    ActiveSupport.getGlobalContext()[modules[i]].prototype[method_name] = ActiveSupport.Function.methodize(ActiveSupport[modules[i]][method_name]);
                }
            }
        }
    }
};

})(this);

//= require <active_support/array>
//= require <active_support/function>
//= require <active_support/string>
//= require <active_support/number>
//= require <active_support/object>