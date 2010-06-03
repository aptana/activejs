/**
 * == ActiveView ==
 * 
 * ActiveView tutorial in progress.
 **/
 
/** section: ActiveView
 * ActiveView
 **/
ActiveView = {};

/**
 * ActiveView.logging -> Boolean
 **/
ActiveView.logging = false;

/**
 * ActiveView.create(structure[,methods]) -> ActiveView.Class
 * - structure (Function): This function must return an DOM Element node.
 * - methods (Object): Instance methods for your ActiveView class.
 **/
ActiveView.create = function create(structure,methods)
{
    var klass = function klass(scope){
        this.setupScope(scope);
        this.initialize.apply(this,arguments);
    };
    klass.instance = false;
    klass.prototype.structure = structure;
    ActiveSupport.Object.extend(klass,ClassMethods);
    ActiveSupport.Object.extend(klass.prototype,InstanceMethods);
    ActiveSupport.Object.extend(klass.prototype,methods || {});
    ActiveEvent.extend(klass);
    klass.observe = ActiveSupport.Function.wrap(klass.observe,ActiveView.observeWrapperForAttachedEvent);
    klass.prototype.observe = ActiveSupport.Function.wrap(klass.prototype.observe,ActiveView.observeWrapperForAttachedEvent);
    return klass;
};

//fires the "attached" event when the instance's element is attached to the dom
ActiveView.observeWrapperForAttachedEvent = function observeWrapper(proceed)
{
    var arguments_array = ActiveSupport.Array.from(arguments).slice(1);
    var is_class = (typeof(this.instance) != 'undefined' && typeof(this.initialize) == 'undefined');
    var event_name = arguments_array[is_class ? 1 : 0];
    var instance = is_class ? arguments_array[0] : this;
    if(event_name == 'attached')
    {
        var element = instance.getElement();
        if(instance._attachedEventFired || (!instance._attachedEventFired && element && element.parentNode))
        {
            instance._attachedEventFired = true;
            instance.notify('attached');
        }
        else
        {
            instance._eventAttachedInterval = setInterval(function(){
                var element = instance.getElement();
                if(element && element.parentNode)
                {
                    instance.notify('attached');
                    instance._attachedEventFired = true;
                    clearInterval(instance._eventAttachedInterval);
                }
            },10);
        }
    }
    return proceed.apply(proceed,arguments_array);
};

/**
 * class ActiveView.Class
 * includes Observable
 * ActiveView.Class refers to any class created with [[ActiveView.create]].
 * 
 * Events
 * ------
 * - initialized()
 * - attached(): Called when the instance's `element` object is attached to the DOM tree.
 **/
ActiveView.isActiveViewInstance = function isActiveViewInstance(object)
{
    return object && object.getElement && object.getElement().nodeType == 1 && object.scope;
};

ActiveView.isActiveViewClass = function isActiveViewClass(object)
{
    return object && object.prototype && object.prototype.structure && object.prototype.setupScope;
};

var InstanceMethods = (function(){
    return {
        initialize: function initialize(scope)
        {
            if(ActiveView.logging)
            {
                ActiveSupport.log('ActiveView: initialized ',this,' with scope:',scope);
            }
            var response = this.structure(ActiveView.Builder,ActiveSupport.Element);
            if(response && !this.element)
            {
                this.setElement(response);
            }
            if(!this.element || !this.element.nodeType || this.element.nodeType !== 1)
            {
                throw Errors.ViewDoesNotReturnelement.getErrorString(typeof(this.element));
            }
            for(var key in this.scope._object)
            {
                this.scope.set(key,this.scope._object[key]);
            }
            this.notify('initialized');
        },
        setupScope: function setupScope(scope)
        {
            this.scope = (scope ? (scope.toObject ? scope : new ActiveEvent.ObservableHash(scope)) : new ActiveEvent.ObservableHash({}));
            for(var key in this.scope._object)
            {
                var item = this.scope._object[key];
            }
        },
        /**
         * ActiveView.Class#get(key) -> mixed
         **/
        get: function get(key)
        {
            return this.scope.get(key);
        },
        /**
         * ActiveView.Class#set(key,value[,suppress_notifications]) -> mixed
         **/
        set: function set(key,value,suppress_observers)
        {
            return this.scope.set(key,value,suppress_observers);
        },
        /**
         * ActiveView.Class#attachTo(element) -> Element
         * Inserts the view's outer most element into the passed element.
         **/
        attachTo: function attachTo(element)
        {
            element.appendChild(this.getElement());
            return this.element;
        },
        setElement: function setElement(element)
        {
            this.element = element;
        },
        /**
         * ActiveView.Class#getElement() -> Element
         **/
        getElement: function getElement()
        {
            return this.element;
        },
        /**
         * ActiveView.Class#getScope() -> ActiveEvent.ObservableHash
         * Get's the current scope/data in your view. Note that modifying this
         * object may trigger changes in the view. Use `exportScope` to get copy
         * of the data that is safe to mutate.
         **/
        getScope: function getScope()
        {
            return this.scope;
        },
        /**
         * ActiveView.Class#exportScope() -> Object
         * Gets a vanilla hash of the scope/data in your view.
         **/
        exportScope: function exportScope()
        {
            return ActiveSupport.Object.clone(this.scope.toObject());
        }
    };
})();

var ClassMethods = (function(){
    return {
        /**
         * ActiveView.Class.getInstance([params]) -> Object
         * Returns an instance of the ActiveView.Class, initializing it
         * if necessary.
         **/
        getInstance: function getInstance(params)
        {
            if(!this.instance)
            {
                this.instance = new this(params || {});
            }
            return this.instance;
        }
    };
})();

var Errors = {
    ViewDoesNotReturnelement: ActiveSupport.createError('The view constructor must return a DOM element, or set this.element as a DOM element. View constructor returned: %'),
    InvalidContent: ActiveSupport.createError('The content to render was not a string, DOM element or ActiveView.'),
    MismatchedArguments: ActiveSupport.createError('Incorrect argument type passed: Expected %. Recieved %:%')
};