/**
 * == ActiveView ==
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
 * ActiveView.create(parent_class,structure[,methods]) -> ActiveView.Class
 * - structure (Function): This function must return an DOM Element node.
 * - methods (Object): Instance methods for your ActiveView class.
 **/
ActiveView.create = function create(structure,methods)
{
    var parent_class;
    if(ActiveView.isActiveViewClass(structure))
    {
        parent_class = structure;
        structure = arguments[1];
        methods = arguments[2];
    }
    var klass = function klass(scope){
        this.setupScope(scope);
        this.initialize.apply(this,arguments);
        this.notify('initialized');
        if(klass._observers && 'attached' in klass._observers)
        {
             ActiveView.triggerOrDelayAttachedEventOnInstance(this);
        }
    };
    klass.instance = false;
    ActiveSupport.Object.extend(klass,ClassMethods);
    if(parent_class)
    {
        ActiveSupport.Object.extend(klass.prototype,parent_class.prototype);
        klass.prototype.structure = ActiveSupport.Function.wrap(parent_class.prototype.structure,function(proceed,builder,dom){
          return ActiveSupport.Function.bind(structure,this)(ActiveSupport.Function.bind(proceed,this)(builder,dom),builder,dom);
        });
    }
    else
    {
        ActiveSupport.Object.extend(klass.prototype,InstanceMethods);
        klass.prototype.structure = structure;
    }
    ActiveEvent.extend(klass);
    klass.prototype.observe = ActiveSupport.Function.wrap(klass.prototype.observe,ActiveView.observeWrapperForAttachedEventOnInstance);
    if(parent_class)
    {
        klass._observers = ActiveSupport.Object.clone(parent_class._observers);
        klass.prototype._observers = {};
        ActiveView.wrapActiveEventMethodsForChildClass(klass,parent_class);
    }
    ActiveSupport.Object.extend(klass.prototype,methods || {});
    return klass;
};

ActiveView.wrapActiveEventMethodsForChildClass = function wrapActiveEventMethodsForChildClass(child_class,parent_class)
{
    var methods = ['observe','stopObserving','observeOnce'];
    for(var i = 0; i < methods.length; ++i)
    {
        (function method_wrapper_iterator(method_name){
            parent_class[method_name] = ActiveSupport.Function.wrap(parent_class[method_name],function method_wrapper(proceed){
                var arguments_array = ActiveSupport.Array.from(arguments).slice(1);
                child_class[method_name].apply(child_class,arguments_array);
                return proceed.apply(proceed,arguments_array);
            });
        })(methods[i]);
    }
};

//fires the "attached" event when the instance's element is attached to the dom
ActiveView.observeWrapperForAttachedEventOnInstance = function observeWrapperForAttachedEventOnInstance(proceed,event_name)
{
    var arguments_array = ActiveSupport.Array.from(arguments).slice(1);
    var response = proceed.apply(proceed,arguments_array);
    if(event_name == 'attached')
    {
        ActiveView.triggerOrDelayAttachedEventOnInstance(this);
    }
    return response;
};

ActiveView.nodeInDomTree = function nodeInDomTree(node)
{
    var ancestor = node;
    while(ancestor.parentNode)
    {
        ancestor = ancestor.parentNode;
    }
    return !!(ancestor.body);
};

ActiveView.triggerOrDelayAttachedEventOnInstance = function triggerOrDelayAttachedEventOnInstance(instance){
    if(!instance._attachedEventFired && instance.element && ActiveView.nodeInDomTree(instance.element))
    {
        instance.notify('attached');
        instance._attachedEventFired = true;
        if(instance._attachedEventInterval)
        {
            clearInterval(instance._attachedEventInterval);
        }
    }
    else if(!('_attachedEventInterval' in instance))
    {
        instance._attachedEventInterval = setInterval(function(){
            if(instance.element && ActiveView.nodeInDomTree(instance.element))
            {
                instance.notify('attached');
                instance._attachedEventFired = true;
                clearInterval(instance._attachedEventInterval);
                instance._attachedEventInterval = false;
            }
        },10);
    }
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
        /**
         * new ActiveView.Class([scope])
         **/
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
         * Gets a plain hash of the scope/data in your view.
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