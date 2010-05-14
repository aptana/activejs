/**
 */
ActiveView = {};

/**
 * Defaults to false.
 * @alias ActiveView.logging
 * @property {Boolean}
 */
ActiveView.logging = false;

/**
 * Creates a new ActiveView class. The structure function must return a DOM node.
 * @alias ActiveView.create
 * @param {Function} structure
 * @param {Object} [instance_methods]
 * @return {ActiveView}
 */
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
    return klass;
};

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
                ActiveSupport.log('ActiveView: initialized with scope:',scope);
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
         * @alias ActiveView.prototype.get
         * @param {String} key
         * @return {mixed}
         */
        get: function get(key)
        {
            return this.scope.get(key);
        },
        /**
         * @alias ActiveView.prototype.set
         * @param {String} key
         * @param {mixed} value
         * @param {Boolean} [suppress_observers]
         * @return {mixed}
         */
        set: function set(key,value,suppress_observers)
        {
            return this.scope.set(key,value,suppress_observers);
        },
        /**
         * @alias ActiveView.prototype.attachTo
         * Inserts the view's outer most element into the passed element.
         * @param {Element} element
         * @return {Element}
         */
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
         * @alias ActiveView.prototype.getElement
         * @return {Element}
         */
        getElement: function getElement()
        {
            return this.element;
        },
        getScope: function getScope()
        {
            return this.scope;
        },
        exportScope: function exportScope()
        {
            return ActiveSupport.Object.clone(this.scope);
        }
    };
})();

var ClassMethods = (function(){
    return {
        set: function set(key,value,suppress_observers)
        {
            return this.getInstance().set(key,value,suppress_observers);
        },
        get: function get(key)
        {
            return this.getInstance().get(key);
        },
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