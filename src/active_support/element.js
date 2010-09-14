var global_context = ActiveSupport.getGlobalContext();
var ie = !!(global_context.attachEvent && !global_context.opera);

/**
 * ActiveSupport.Element
 * ActiveSupport.Element is a simple DOM manipulation library that does not modify the built in Element object. All ActiveSupport.Element methods take an Element object (and not a string) as their first argument. ActiveSupport.Element is available inside ActiveView classes as the second argument:
 * 
 *     var MyClass = ActiveView.create(function(builder,dom){
 *         var link = builder.a({href:'#'},'Text');
 *         dom.addClassName(link,'active');
 *         dom.getWidth(link);
 *         return builder.div(link);
 *     });
 * 
 * The implementation of event obeserver's differs from Prototype's since it does not modify the Element object. Your observer receives three arguments, the Event object, a function that will stop the event when called, and a function that will unregister the observer.
 * 
 *     var dom = ActiveSupport.Element;
 *     dom.observe(link,'click',function(event,stop,unregister){
 *         //do stuff
 *         stop();
 *     });
 * 
 * ActiveSupport.Element also supports the a similar event to Prototype's dom:ready:
 * 
 *     dom.observe(document,'ready',function(){
 *         //...
 *     });
 **/
ActiveSupport.Element = {
    ieAttributeTranslations: {
        'class': 'className',
        'checked': 'defaultChecked',
        'usemap': 'useMap',
        'for': 'htmlFor',
        'readonly': 'readOnly',
        'colspan': 'colSpan',
        'bgcolor': 'bgColor',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding'
    },
    ieAttributeTranslationSniffingCache: {},
    /**
     * ActiveSupport.Element.keyCodes -> Object
     * Contains the following:
     *  
     * - KEY_BACKSPACE
     * - KEY_TAB
     * - KEY_RETURN
     * - KEY_ESC
     * - KEY_LEFT
     * - KEY_UP
     * - KEY_RIGHT
     * - KEY_DOWN
     * - KEY_DELETE
     * - KEY_HOME
     * - KEY_END
     * - KEY_PAGEUP
     * - KEY_PAGEDOWN
     * - KEY_INSERT
     **/
    keyCodes: {
        KEY_BACKSPACE: 8,
        KEY_TAB:       9,
        KEY_RETURN:   13,
        KEY_ESC:      27,
        KEY_LEFT:     37,
        KEY_UP:       38,
        KEY_RIGHT:    39,
        KEY_DOWN:     40,
        KEY_DELETE:   46,
        KEY_HOME:     36,
        KEY_END:      35,
        KEY_PAGEUP:   33,
        KEY_PAGEDOWN: 34,
        KEY_INSERT:   45
    },
    cache: {},
    /**
     * ActiveSupport.Element.create(tag_name,attributes_hash) -> Element
     **/
    create: function create(tag_name,attributes)
    {
        attributes = attributes || {};
        tag_name = tag_name.toLowerCase();
        var element;
        if(ie && (attributes.name || (tag_name == 'input' && attributes.type)))
        {
            //ie needs these attributes to be written in the string passed to createElement
            tag = '<' + tag_name;
            if(attributes.name)
            {
                tag += ' name="' + attributes.name + '"';
            }
            if(tag_name == 'input' && attributes.type)
            {
                tag += ' type="' + attributes.type + '"';
            }
            tag += '>';
            delete attributes.name;
            delete attributes.type;
            element = ActiveSupport.Element.extend(global_context.document.createElement(tag));
        }
        else
        {
            if(!ActiveSupport.Element.cache[tag_name])
            {
                ActiveSupport.Element.cache[tag_name] = ActiveSupport.Element.extend(global_context.document.createElement(tag_name));
            }
            element = ActiveSupport.Element.cache[tag_name].cloneNode(false);
        }
        ActiveSupport.Element.writeAttribute(element,attributes);
        return element;
    },
    extend: function extend(element)
    {
        return element;
    },
    /**
     * ActiveSupport.Element.clear(element) -> Element
     **/
    clear: function clear(element)
    {
        while(element.firstChild)
        {
            element.removeChild(element.firstChild);
        }
        return element;
    },
    /**
     * ActiveSupport.Element.hide(element) -> Element
     **/
    hide: function hide(element)
    {
        element.style.display = 'none';
        return element;
    },
    /**
     * ActiveSupport.Element.show(element) -> Element
     **/
    show: function show(element)
    {
        element.style.display = '';
        return element;
    },
    /**
     * ActiveSupport.Element.remove(element) -> Element
     **/
    remove: function remove(element)
    {
        element.parentNode.removeChild(element);
        return element;
    },
    /**
     * ActiveSupport.Element.insert(element,content[,position]) -> Element
     * - element (Element)
     * - content (String | Number | Element)
     * - position (String): "top", "bottom", "before", "after"
     * Note that this element does not identically mimic Prototype's Element.prototype.insert
     **/
    insert: function insert(element,content,position)
    {
        if(content && typeof(content.getElement) == 'function')
        {
            content = content.getElement();
        }
        if(ActiveSupport.Object.isArray(content))
        {
            for(var i = 0; i < content.length; ++i)
            {
                ActiveSupport.Element.insert(element,content[i],position);
            }
        }
        else
        {
            if(!content || !content.nodeType || content.nodeType !== 1)
            {
                content = global_context.document.createTextNode(String(content));
            }
            if(!position)
            {
                position = 'bottom';
            }
            switch(position)
            {
                case 'top': element.insertBefore(content,element.firstChild); break;
                case 'bottom': element.appendChild(content); break;
                case 'before': element.parentNode.insertBefore(content,element); break;
                case 'after': element.parentNode.insertBefore(content,element.nextSibling); break;
            }
        }
        return element;
    },
    /**
     * ActiveSupport.Element.update(element,content[,position]) -> Element
     * Works exactly like update, but calls ActiveSupport.Element.clear() on the element first.
     **/
    update: function update(element,content,position)
    {
        ActiveSupport.Element.clear(element);
        ActiveSupport.Element.insert(element,content,position);
        return element;
    },
    /**
     * ActiveSupport.Element.writeAttribute(element,name,value) -> Element
     * ActiveSupport.Element.writeAttribute(element,attributes_hash) -> Element
     **/
    writeAttribute: function writeAttribute(element,name,value)
    {
        var transitions = {
            className: 'class',
            htmlFor:   'for'
        };
        var attributes = {};
        if(typeof name === 'object')
        {
            attributes = name;
        }
        else
        {
            attributes[name] = typeof(value) === 'undefined' ? true : value;
        }
        for(var attribute_name in attributes)
        {
            name = transitions[attribute_name] || attribute_name;
            // check if things need to be remapped for IE (Some stuff has been fixed when IE > 7)
            if(ie && ActiveSupport.Element.ieAttributeTranslations[name])
            {
                if(name in ActiveSupport.Element.ieAttributeTranslationSniffingCache)
                {
                    if(ActiveSupport.Element.ieAttributeTranslationSniffingCache[name])
                    {
                        name = ActiveSupport.Element.ieAttributeTranslationSniffingCache[name];
                    }
                }
                else
                {
                    var test_element = ActiveSupport.getGlobalContext().document.createElement("div");
                    test_element.setAttribute(name,"test");
                    if(test_element[ActiveSupport.Element.ieAttributeTranslations[name]] !== "test") {
                        test_element.setAttribute(ActiveSupport.Element.ieAttributeTranslations[name],"test");
                        ActiveSupport.Element.ieAttributeTranslationSniffingCache[name] = test_element[ActiveSupport.Element.ieAttributeTranslations[name]] === "test";
                        if(ActiveSupport.Element.ieAttributeTranslationSniffingCache[name])
                        {
                            name = ActiveSupport.Element.ieAttributeTranslations[name];
                        }
                    }
                }
            }
            value = attributes[attribute_name];
            if(value === false || value === null)
            {
                element.removeAttribute(name);
            }
            else if(value === true)
            {
                element.setAttribute(name,name);
            }
            else
            {
                if(name == 'style')
                {
                    element.style.cssText = value;
                }
                else
                {
                    element.setAttribute(name,value);
                }
            }
        }
        return element;
    },
    /**
     * ActiveSupport.Element.hasClassName(element,class_name) -> Boolean
     **/
    hasClassName: function hasClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        var element_class_name = element.className;
        return (element_class_name.length > 0 && (element_class_name == class_name || new RegExp("(^|\\s)" + class_name + "(\\s|$)").test(element_class_name)));
    },
    /**
     * ActiveSupport.Element.addClassName(element,class_name) -> Element
     **/
    addClassName: function addClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        if(!ActiveSupport.Element.hasClassName(element,class_name))
        {
            element.className += (element.className ? ' ' : '') + class_name;
        }
        return element;
    },
    /**
     * ActiveSupport.Element.removeClassName(element,class_name) -> Element
     **/
    removeClassName: function removeClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        element.className = element.className.replace(new RegExp("(^|\\s+)" + class_name + "(\\s+|$)"),' ').replace(/^\s+/, '').replace(/\s+$/, '');
        return element;
    },
    getDimensions: function getDimensions(element)
    {
        var display = element.style.display;
        if(!display)
        {
            var css = document.defaultView.getComputedStyle(element,null);
            display = css ? css.display : null;
        }
        //safari bug
        if(display != 'none' && display != null)
        {
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            };
        }
        var element_style = element.style;
        var original_visibility = element_style.visibility;
        var original_position = element_style.position;
        var original_display = element_style.display;
        element_style.visibility = 'hidden';
        element_style.position = 'absolute';
        element_style.display = 'block';
        var original_width = element.clientWidth;
        var original_height = element.clientHeight;
        element_style.display = original_display;
        element_style.position = original_position;
        element_style.visibility = original_visibility;
        return {
            width: original_width,
            height: original_height
        };
    },
    /**
     * ActiveSupport.Element.getWidth(element) -> Number
     **/
    getWidth: function getWidth(element)
    {
        return ActiveSupport.Element.getDimensions(element).width;
    },
    /**
     * ActiveSupport.Element.getHeight(element) -> Number
     **/
    getHeight: function getHeight(element)
    {
        return ActiveSupport.Element.getDimensions(element).height;
    },
    documentReadyObservers: [],
    /**
     * ActiveSupport.Element.observe(element,event_name,callback[,context]) -> Function
     * - element (Element): The DOM element to observe.
     * - event_name (String): The name of the event, in all lower case, without the "on" prefix — e.g., "click" (not "onclick").
     * - callback (Function): The function to call when the event occurs.
     * - context (Object): The context to bind the callback to. Any additional arguments after context will be curried onto the callback.
     * This implementation of event observation is loosely based on Prototype's, but instead of adding element.stopObserving() and event.stop() 
     * methods to the respective Element and Event objects, an event stopping callback and an event handler unregistration callback are passed
     * into your event handler.
     * 
     *     ActiveSupport.Element.observe(element,'click',function(event,stop,unregister){
     *         stop();
     *         unregister();
     *     },this);
     *     
     *     //Prototype equivelent:
     *     
     *     var my_handler = element.observe('click',function(event){
     *         event.stop();
     *         element.stopObserving('click',my_handler);
     *     }.bind(this));
     * 
     * dom:ready support is also built in:
     *  
     *     ActiveSupport.Element.observe(document,'ready',function(){});
     * 
     * If the above call was made after the document 'ready' event had already fired, the callback would be called immediately.
     **/
    observe: function observe(element,event_name,callback,context)
    {
        callback = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(callback || function(){},arguments,3);
        //dom:ready support
        if(element == ActiveSupport.getGlobalContext().document && event_name == 'ready')
        {
            if(ActiveSupport.Element.documentReadyObservers == null)
            {
                //ActiveSupport.Element.documentReadyObservers will be null if the document is ready
                //if so, trigger the observer now
                callback();
            }
            else
            {
                ActiveSupport.Element.documentReadyObservers.push(callback);
            }
            return;
        }
        
        //create callback wrapper
        var callback_wrapper = function callback_wrapper(event){
            if(!event)
            {
                event = window.event;
            }
            return callback(
                event,
                //event.srcElement ? (event.srcElement.nodeType == 3 ? event.srcElement.parentNode : event.srcElement) : null,
                function stop_callback(){
                    event.cancelBubble = true;
                    event.returnValue = false;
                    if(event.preventDefault)
                    {
                        event.preventDefault();
                    }
                    if(event.stopPropagation)
                    {
                        event.stopPropagation();
                    }                
                },function remove_event_listener(){
                    if(element.removeEventListener)
                    {
                        element.removeEventListener(event_name,callback_wrapper,false);
                    }
                    else
                    {
                        element.detachEvent("on" + event_name,callback_wrapper);
                    }
                }
            );
        };
        
        //attach event listener
        if(element.addEventListener)
        {
            element.addEventListener(event_name,callback_wrapper,false);
        }
        else
        {
            element.attachEvent('on' + event_name,callback_wrapper);
        }
        
        return callback_wrapper;
    }
};

/*
Ported from Prototype.js usage:
    
    ActiveSupport.Element.observe(document,'ready',function(){
    
    });
*/
(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;
  var loaded = false;
  
  function fire_content_loaded_event()
  {
      if(loaded)
      {
          return;
      }
      if(timer)
      {
          window.clearTimeout(timer);
      }
      loaded = true;
      if(ActiveSupport.Element.documentReadyObservers.length > 0)
      {
          for(var i = 0; i < ActiveSupport.Element.documentReadyObservers.length; ++i)
          {
              ActiveSupport.Element.documentReadyObservers[i]();
          }
          ActiveSupport.Element.documentReadyObservers = null;
      }
  };

  function check_ready_state(event,stop,stop_observing)
  {
      if(document.readyState === 'complete')
      {
          stop_observing();
          fire_content_loaded_event();
      }
  };

  function poll_do_scroll()
  {
      try
      {
          document.documentElement.doScroll('left');
      }
      catch(e)
      {
          timer = window.setTimeout(poll_do_scroll);
          return;
      }
      fire_content_loaded_event();
  };

  if(document.addEventListener)
  {
      document.addEventListener('DOMContentLoaded',fire_content_loaded_event,false);
  }
  else
  {
      ActiveSupport.Element.observe(document,'readystatechange',check_ready_state);
      if(window == top)
      {
          timer = window.setTimeout(poll_do_scroll);
      }
  }
  
  ActiveSupport.Element.observe(window,'load',fire_content_loaded_event);
})();

//Ajax Library integration
(function(){
    //Prototype
    if(global_context.Prototype && global_context.Prototype.Browser && global_context.Prototype.Browser.IE && global_context.Element && global_context.Element.extend)
    {
        ActiveSupport.Element.extend = function extendForPrototype(element){
          return Element.extend(element);
        };
    };
    //MooTools
    if(global_context.MooTools && global_context.Browser && global_context.Browser.Engine.trident && global_context.document.id)
    {
        ActiveSupport.Element.extend = function extendForMooTools(element){
            return global_context.document.id(element);
        };
    }
})();