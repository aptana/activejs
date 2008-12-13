ActionView = null;

(function(){

ActionView = {};

ActionView.create = function create(structure,methods)
{
    if(typeof(options) == 'function')
    {
        options = {
            structure: options
        };
    }
    var klass = function klass(){
        this.initialize.apply(this,arguments);
    };
    Object.extend(klass,ClassMethods);
    Object.extend(klass.prototype,methods || {});
    Object.extend(klass.prototype,InstanceMethods);
    klass.prototype.structure = structure || ActionView.defaultStructure;
    Object.Event.extend(klass);
    return klass;
};

ActionView.defaultStructure = function defaultStructure()
{
    return document.createElement('div');
};

ActionView.makeArrayObservable = function makeArrayObservable(array)
{
    Object.Event.extend(array);
    array.makeObservable('shift');
    array.makeObservable('unshift');
    array.makeObservable('pop');
    array.makeObservable('push');
    array.makeObservable('splice');
};

var InstanceMethods = {
    initialize: function initialize(scope,parent)
    {
        this.parent = parent;
        this.scope = scope || {};
        if(!this.scope.get || typeof(this.scope.get) != 'function')
        {
            this.scope = new ObservableHash(this.scope);
        }
        this.builder = Builder.generateBuilder(this);
        this.binding = new Binding(this);
        for(var key in this.scope._object)
        {
            if(Object.isArray(this.scope._object[key]) && !this.scope._object[key].observe)
            {
                ActionView.makeArrayObservable(this.scope._object[key]);
            }
        }
        this.container = this.structure();
        for(var key in this.scope._object)
        {
            this.scope.set(key,this.scope._object[key]);
        }
    },
    get: function get(key)
    {
        this.notify('get',key);
        return this.scope.get(key);
    },
    set: function set(key,value)
    {
        var response = this.scope.set(key,value);
        this.notify('set',key,value);
        return response;
    },
    registerEventHandler: function registerEventHandler(element,event_name,observer)
    {
      this.eventHandlers.push([element,event_name,observer]);
    }
};

var ClassMethods = {

};

var ObservableHash = function ObservableHash(object)
{
    this._object = object || {};
};

ObservableHash.prototype.set = function set(key,value)
{
    this._object[key] = value;
    this.notify('set',key,value);
    return value;
};

ObservableHash.prototype.get = function get(key)
{
    this.notify('get',key);
    return this._object[key];
};

ObservableHash.prototype.toObject = function toObject()
{
    return this._object;
};

Object.Event.extend(ObservableHash);

ActionView.ObservableHash = ObservableHash;

var Builder = {
    tags: ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
        "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
        "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX "+
        "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P "+
        "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD "+
        "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/),
    createElement: function createElement(tag,attributes,view)
    {
        var element;
        element = new Element(tag,attributes);
        Builder.attachElementExtensions(element,view);
        return element;
    },
    attachElementExtensions: function attachElementExtensions(element,view)
    {
        element.observe = element.observe.wrap(function(proceed,event_name,handler){
            view.registerEventHandler(this,event_name,handler);
            return proceed(event_name,handler);
        });
    },
    generateBuilder: function generateBuilder(view)
    {
        var builder;
        builder = {};
        Object.extend(builder,Builder.InstanceMethods);
        Builder.tags.each(function(tag){
            builder[tag.toLowerCase()] = builder[tag] = function tag_generator(){
                var i, argument, attributes, elements, element;
                text_nodes = [];
                elements = [];
                for(i = 0; i < arguments.length; ++i)
                {
                    argument = arguments[i];
                    if(Object.isFunction(argument))
                    {
                        argument = argument();
                    }
                    if(!Object.isString(argument) && !Object.isNumber(argument) && !Object.isArray(argument) && !Object.isElement(argument))
                    {
                        attributes = argument;
                    }
                    else if(Object.isArray(argument))
                    {
                        elements = argument;
                    }
                    else if(Object.isElement(argument) || Object.isString(argument) || Object.isNumber(argument))
                    {
                        elements.push(argument);
                    }
                }
                element = Builder.createElement(tag,attributes,view);
                for(i = 0; i < elements.length; ++i)
                {
                    element.appendChild(Object.isElement(elements[i]) ? elements[i] : document.createTextNode(elements[i]));
                }
                return element;
            };
        });
        return builder;
    }
};

Builder.InstanceMethods = {};
ActionView.Builder = Builder;

var Binding = function Binding(view)
{
    this.view = view;
};

Object.extend(Binding,{
    
});

Object.extend(Binding.prototype,{
    update: function update(element)
    {
        return {
            from: function from(observe_key)
            {
                var transformation = null;
                var condition = function default_condition(){
                    return true;
                };
                
                var transform = function transform(callback)
                {
                    transformation = callback;
                    return {
                        when: when
                    };
                };

                var when = function when(callback)
                {
                    condition = callback;
                    return {
                        transform: transform
                    };
                };

                this.view.scope.observe('set',function update_from_observer(set_key,value){
                    if(observe_key == set_key)
                    {
                        if(condition())
                        {
                            element.innerHTML = transformation ? transformation(value) : value;
                        }
                    }
                });
                return {
                    transform: transform,
                    when: when
                };
            }.bind(this)
        }
    },
    collect: function collect(view)
    {
        /*
        var view = function(){
            var response = view_callback.apply(view_callback,arguments);
            if(typeof(response) == 'string')
            {
                response = document.createTextNode(response);
            }
            return response;
        };
        */
        return {
            from: function from(collection)
            {
                if(typeof(collection) == 'string')
                {
                    collection = this.view.scope.get(collection);
                }
                return {
                    into: function into(element)
                    {
                        var collected_elements = [];
                        for(var i = 0; i < collection.length; ++i)
                        {
                            element.insert(view(collection[i]));
                            collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                        }
                        collection.observe('pop',function pop_observer(){
                            collected_elements[collected_elements.length - 1].parentNode.removeChild(collected_elements[collected_elements.length - 1]);
                            collected_elements.pop();
                        });
                        collection.observe('push',function push_observer(item){
                            element.insert(view(item));
                            collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                        });
                        collection.observe('unshift',function unshift_observer(item){
                            element.insert({top: view(item)});
                            collected_elements.unshift(element.firstChild);
                        });
                        collection.observe('shift',function shift_observer(){
                            element.removeChild(element.firstChild);
                            collected_elements.shift(element.firstChild);
                        });
                        collection.observe('splice',function splice_observer(index,to_remove){
                            var children = [];
                            var i;
                            for(i = 2; i < arguments.length; ++i)
                            {
                                children.push(arguments[i]);
                            }
                            if(to_remove)
                            {
                                for(i = index; i < (index + to_remove); ++i)
                                {
                                    collected_elements[i].parentNode.removeChild(collected_elements[i]);
                                }
                            }
                            for(i = 0; i < children.length; ++i)
                            {
                                var item = view(children[i]);
                                if(index == 0 && i == 0)
                                {
                                    element.insert({top: item});
                                    children[i] = element.firstChild;
                                }
                                else
                                {
                                    element.insertBefore(typeof(item) == 'string' ? document.createTextNode(item) : item,element.childNodes[index + i]);
                                    children[i] = element.childNodes[i + 1];
                                }
                            }
                            collected_elements.splice.apply(collected_elements,[index,to_remove].concat(children));
                        });
                    }
                };
            }.bind(this)
        };
    }
});

})();

/*



ActionView.InstanceMethods = {
  initialize: function(options){
    
    this.callback = this.constructor.callback.bind(this,options);
    this.bindings = Object.clone(this.constructor.bindings);
    this.builder = ActionView.Builder.generateBuilder(this);
    this.eventHandlers = [];
  },
  attachTo: function(container){
    container.insert(this.callback());
  },
  getAllElements: function(){
    var elements, key_name;
    elements = [];
    for(key_name in this){
      if(Object.isElement(this[key_name])){
        elements.push(this[key_name]);
      }
    }
    return elements;
  },
  registerEventHandler: function(element,event_name,observer){
    this.eventHandlers.push([element,event_name,observer]);
  }
};
ActionView.ClassMethods = {
  bindings: {},
  getBindings: function(){
    return this.bindings;
  },
  getBinding: function(name){
    return this.bindings[name];
  },
  addBinding: function(name,binding){
    this.bindings[name] = binding;
  },
  removeBinding: function(name){
    if(this.bindings[name]){
      this.bindings[name].destroy();
      delete this.bindings[name];
      return true;
    }else{
      return false;
    }
  }
};

//binding methods
ActionView.Binding = Class.create({
  initialize: function(options){
    this.action = null;
    this.timeout = null;
    this.timeoutLength = null;
    this.transform = null;
    this.initialized = false;
    if(options.source){
      this.setSource(options.source);
    }
    if(options.target){
      this.setTarget(options.target);
    }
    if(options.transform){
      this.setTransform(options.transform);
    }
    if(options.timeout){
      this.setTimeoutLength(options.timeout);
    }
    if(options.action){
      this.setAction(options.action);
    }
  },
  finishInitialize: function(){
    if(this.source && this.target && !this.initialized){
      this.initialized = true;
      this.observer = this.generateObserver();
      this.source.object.observe('set',this.observer);
      if(this.source.object.get(this.source.key)){
        this.observer(this.source.key,this.source.object.get(this.source.key));
      }
    }
  },
  destroy: function(){
    this.source.stopObserving('set',this.observer);
  },
  setSource: function(source){
    if(arguments.length == 2 && typeof(arguments[1]) == "string"){
      this.source = {
        object: arguments[0],
        key: arguments[1]
      };
    }else{
      this.source = source;
    }
    if(!this.source.object.observe){
      Object.Event.extend(this.source.object);
    }
    this.finishInitialize();
  },
  setTarget: function(target){
    this.target = target;
    this.finishInitialize();
  },
  setTimeoutLength: function(timeout_length){
    this.timeoutLength = timeout_length;
  },
  setTransform: function(transform){
    this.transform = transform;
  },
  setAction: function(action){
    this.action = action;
  },
  getSource: function(){
    return this.source;
  },
  getTarget: function(){
    return this.target;
  },
  generateObserver: function(){
    var transformed_value, action, proceed;
    return function(key,value){
      if(this.source.key == key || (Object.isArray(this.source.key) && this.source.key.include(key))){
        transformed_value = this.transform ? this.transform(value,this.source.object) : value;
        action = this.action || 'update';
        proceed = function(){
          this.timeout = null;
          if(action == 'update' || action == 'insert'){
            this.target[action](transformed_value)
          }else if(Object.isFunction(action)){
            action(transformed_value,this.target);
          }
        }.bind(this);
        if(this.timeoutLength){
          if(this.timeout){
            window.clearTimeout(this.timeout);
          }
          this.timeout = window.setTimeout(proceed,this.timeoutLength);
        }else{
          proceed();
        }
      }
    }.bind(this);
  },
});

//builder methods
ActionView.Builder = {
  tags: ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
    "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
    "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX "+
    "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P "+
    "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD "+
    "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/),
  createElement: function(tag,attributes,view)
  {
    var element;
    element = new Element(tag,attributes);
    ActionView.Builder.attachElementExtensions(element,view);
    return element;
  },
  attachElementExtensions: function(element,view){
    element.observe = element.observe.wrap(function(proceed,event_name,handler){
      view.registerEventHandler(this,event_name,handler);
      return proceed(event_name,handler);
    });
  },
  generateBuilder: function(view){
    var builder;
    builder = {};
    ActionView.Builder.tags.each(function(tag){
      builder[tag.toLowerCase()] = builder[tag] = function(){
        var i, argument, attributes, elements, element;
        text_nodes = [];
        elements = [];
        for(i = 0; i < arguments.length; ++i){
          argument = arguments[i];
          if(Object.isFunction(argument)){
            argument = argument();
          }
          if(!Object.isString(argument) && !Object.isNumber(argument) && !Object.isArray(argument) && !Object.isElement(argument)){
            attributes = argument;
          }else if(Object.isArray(argument)){
            elements = argument;
          }else if(Object.isElement(argument) || Object.isString(argument) || Object.isNumber(argument)){
            elements.push(argument);
          }
        }
        element = ActionView.Builder.createElement(tag,attributes,view);
        for(i = 0; i < elements.length; ++i){
          element.appendChild(Object.isElement(elements[i]) ? elements[i] : document.createTextNode(elements[i]));
        }
        return element;
      };
    });
    return builder;
  }
};

})();
*/