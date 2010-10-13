(function(global_context){

var ie = !!(global_context.attachEvent && !global_context.opera);
var mouseenter_mouseleave_supported = 'onmouseenter' in document.documentElement && 'onmouseleave' in document.documentElement;

/**
 * DOM
 * 
 * DOM is a simple DOM manipulation library that does not modify the built in
 * Element object. All DOM methods take an Element object (and not a string)
 * as their first argument except `stop`, `pointerX` and `pointerY` which
 * take an Event object.
 * 
 * The implementation of event obeserver's differs from Prototype's since it
 * does not modify the Element object.
 * 
 *     DOM.observe(link,'click',function(event){
 *         //do stuff
 *         DOM.stop(event);
 *     });
 * 
 * DOM also supports the a similar event to Prototype's dom:ready:
 * 
 *     DOM.observe(document,'ready',function(){
 *         //...
 *     });
 **/
DOM = {
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
     * DOM.keyCodes -> Object
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
     * DOM.create(tag_name,attributes_hash) -> Element
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
            element = DOM.extend(global_context.document.createElement(tag));
        }
        else
        {
            if(!DOM.cache[tag_name])
            {
                DOM.cache[tag_name] = DOM.extend(global_context.document.createElement(tag_name));
            }
            element = DOM.cache[tag_name].cloneNode(false);
        }
        DOM.writeAttribute(element,attributes);
        return element;
    },
    extend: function extend(element)
    {
        return element;
    },
    /**
     * DOM.clear(element) -> Element
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
     * DOM.hide(element) -> Element
     **/
    hide: function hide(element)
    {
        element.style.display = 'none';
        return element;
    },
    /**
     * DOM.show(element) -> Element
     **/
    show: function show(element)
    {
        element.style.display = '';
        return element;
    },
    /**
     * DOM.remove(element) -> Element
     **/
    remove: function remove(element)
    {
        element.parentNode.removeChild(element);
        return element;
    },
    /**
     * DOM.insert(element,content[,position]) -> Element
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
        if(content && typeof(content) == 'object' && 'length' in content && 'splice' in content && 'join' in content)
        {
            for(var i = 0; i < content.length; ++i)
            {
                DOM.insert(element,content[i],position);
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
     * DOM.update(element,content[,position]) -> Element
     * Works exactly like update, but calls DOM.clear() on the element first.
     **/
    update: function update(element,content,position)
    {
        DOM.clear(element);
        DOM.insert(element,content,position);
        return element;
    },
    /**
     * DOM.writeAttribute(element,name,value) -> Element
     * DOM.writeAttribute(element,attributes_hash) -> Element
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
            if(ie && DOM.ieAttributeTranslations[name])
            {
                if(name in DOM.ieAttributeTranslationSniffingCache)
                {
                    if(DOM.ieAttributeTranslationSniffingCache[name])
                    {
                        name = DOM.ieAttributeTranslations[name];
                    }
                }
                else
                {
                    var test_element = global_context.document.createElement("div");
                    test_element.setAttribute(name,"test");
                    if(test_element[DOM.ieAttributeTranslations[name]] !== "test") {
                        test_element.setAttribute(DOM.ieAttributeTranslations[name],"test");
                        DOM.ieAttributeTranslationSniffingCache[name] = test_element[DOM.ieAttributeTranslations[name]] === "test";
                        if(DOM.ieAttributeTranslationSniffingCache[name])
                        {
                            name = DOM.ieAttributeTranslations[name];
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
     * DOM.hasClassName(element,class_name) -> Boolean
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
     * DOM.addClassName(element,class_name) -> Element
     **/
    addClassName: function addClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        if(!DOM.hasClassName(element,class_name))
        {
            element.className += (element.className ? ' ' : '') + class_name;
        }
        return element;
    },
    /**
     * DOM.removeClassName(element,class_name) -> Element
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
            var css;
            if(document.defaultView && document.defaultView.getComputedStyle)
            {
                css = document.defaultView.getComputedStyle(element,null);
            }
            else if(element.currentStyle)
            {
                css = element.currentStyle;
            }
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
     * DOM.getWidth(element) -> Number
     **/
    getWidth: function getWidth(element)
    {
        return DOM.getDimensions(element).width;
    },
    /**
     * DOM.getHeight(element) -> Number
     **/
    getHeight: function getHeight(element)
    {
        return DOM.getDimensions(element).height;
    },
    /**
     * DOM.cumulativeOffset(element) -> Array
     * Returns an array containing [left,top], also has `left` and `top`.
     **/
    cumulativeOffset: function cumulativeOffset(element)
    {
      if(ie)
      {
          try
          {
              element.offsetParent;
          }
          catch(e)
          {
              var response = [0,0];
              response.top = 0;
              response.left = 0;
              return response;
          }
      }
      var top = 0;
      var left = 0;
      do
      {
          top += element.offsetTop  || 0;
          left += element.offsetLeft || 0;
          element = element.offsetParent;
      }while(element);
      var response = [left,top];
      response.left = left;
      response.top = top;
      return response;
    },
    /**
     * DOM.ancestors(element) -> Array
     **/
    ancestors: function ancestors(element)
    {
        var elements = [];
        while(element = element.parentNode)
        {
            if(element.nodeType == 1)
            {
                elements.push(element);
            }
        }
        return elements;
    },
    /**
     * DOM.pointerX(event) -> Number
     **/
    pointerX: function pointerX(event)
    {
        return event.pageX || (event.clientX +
          (document.documentElement.scrollLeft || (document.body ? document.body.scrollLeft : 0)) -
          (document.documentElement.clientLeft || 0)
        );
    },
    /**
     * DOM.pointerY(event) -> Number
     **/
    pointerY: function pointerY(event)
    {
        return event.pageY || (event.clientY +
          (document.documentElement.scrollTop || (document.body ? document.body.scrollTop : 0)) -
          (document.documentElement.clientTop || 0)
        );
    },
    documentReadyObservers: [],
    /**
     * DOM.observe(element,event_name,callback[,context]) -> Function
     * - element (Element): The DOM element to observe.
     * - event_name (String): The name of the event, in all lower case, without the "on" prefix — e.g., "click" (not "onclick").
     * - callback (Function): The function to call when the event occurs.
     * - context (Object): The context to bind the callback to. Any additional arguments after context will be curried onto the callback.
     * This implementation of event observation is loosely based on Prototype's. "mouseenter" and "mouseleave" events are supported cross
     * browser.
     * 
     *     var my_handler = DOM.observe(element,'click',function(event){
     *         DOM.stop(event);
     *         DOM.stopObserving(element,'click',my_handler);
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
     *     DOM.observe(document,'ready',function(){});
     * 
     * If the above call was made after the document 'ready' event had already fired, the callback would be called immediately.
     **/
    observe: function observe(element,event_name,callback,context)
    {
        if(arguments.length > 3)
        {
            var arguments_for_bind = [];
            for(var i = 2; i < arguments.length; ++i)
            {
                arguments_for_bind.push(arguments[i]);
            }
            callback = DOM.bind.apply(DOM,arguments_for_bind);
        }
        //dom:ready support
        if(element == global_context.document && event_name == 'ready')
        {
            if(DOM.documentReadyObservers == null)
            {
                //DOM.documentReadyObservers will be null if the document is ready
                //if so, trigger the observer now
                callback();
            }
            else
            {
                DOM.documentReadyObservers.push(callback);
            }
            return;
        }
        
        //create callback wrapper
        var callback_wrapper = function callback_wrapper(event){
            if(!event)
            {
                event = window.event;
            }
            if(!mouseenter_mouseleave_supported && (event_name === 'mouseenter' || event_name === 'mouseleave'))
            {
                var parent = event.relatedTarget;
                while(parent && parent !== element)
                {
                    try
                    {
                        parent = parent.parentNode;
                    }
                    catch(e)
                    {
                        parent = element;
                    }
                }
                if(parent === element)
                {
                    return;
                }
                return callback(event);
            }
            else
            {
                return callback(event);
            }
        };
        
        var actual_event_name = event_name;
        if(!mouseenter_mouseleave_supported && (event_name === 'mouseenter' || event_name === 'mouseleave'))
        {
            actual_event_name = {
              'mouseenter': 'mouseover',
              'mouseleave': 'mouseout'
            }[event_name];
        }
        
        //attach event listener
        if(element.addEventListener)
        {
            element.addEventListener(actual_event_name,callback_wrapper,false);
        }
        else
        {
            element.attachEvent('on' + actual_event_name,callback_wrapper);
        }
        
        return callback_wrapper;
    },
    /**
     * DOM.stopObserving(element,event_name,callback) -> Function
     **/
    stopObserving: function stopObserving(element,event_name,callback)
    {
        if(element.removeEventListener)
        {
            element.removeEventListener(event_name,callback,false);
        }
        else
        {
            element.detachEvent("on" + event_name,callback);
        }
    },
    /**
     * DOM.stop(event) -> Event
     * Cross browser compatible way of stopping the propagation of an event.
     **/
    stop: function stop(event)
    {
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
        return event;
    },
    //cloned from ActiveSupport.Function for portability
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
            var args = [];
            for(var i = 2; i < arguments.length; ++i)
            {
                args.push(arguments[i]);
            }
            return function bound()
            {
                var concat_args = [];
                for(var i = 0; i < arguments.length; ++i)
                {
                    concat_args.push(arguments[i]);
                }
                return func.apply(object,args.concat(concat_args));
            }
        }
    }
};

})(this);

/*
Ported from Prototype.js usage:
    
    DOM.observe(document,'ready',function(){
    
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
      if(DOM.documentReadyObservers.length > 0)
      {
          for(var i = 0; i < DOM.documentReadyObservers.length; ++i)
          {
              DOM.documentReadyObservers[i]();
          }
          DOM.documentReadyObservers = null;
      }
  };

  function check_ready_state(event)
  {
      if(document.readyState === 'complete')
      {
          DOM.stopObserving(document,'readystatechange',check_ready_state);
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
      DOM.observe(document,'readystatechange',check_ready_state);
      if(window == top)
      {
          timer = window.setTimeout(poll_do_scroll);
      }
  }
  
  DOM.observe(window,'load',fire_content_loaded_event);
  
})();

//Ajax Library integration
(function(global_context){
    //Prototype
    if(global_context.Prototype && global_context.Prototype.Browser && global_context.Prototype.Browser.IE && global_context.Element && global_context.Element.extend)
    {
        DOM.extend = function extendForPrototype(element){
          return Element.extend(element);
        };
    };
    //MooTools
    if(global_context.MooTools && global_context.Browser && global_context.Browser.Engine.trident && global_context.document.id)
    {
        DOM.extend = function extendForMooTools(element){
            return global_context.document.id(element);
        };
    }
})(this);