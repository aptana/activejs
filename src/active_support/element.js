var global_context = ActiveSupport.getGlobalContext();
var ie = !!(global_context.attachEvent && !global_context.opera);

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
     * ActiveSupport.Element.update(element,content[,position])
     * Works exactly like update, 
     **/
    update: function update(element,content,position)
    {
        ActiveSupport.Element.clear(element);
        ActiveSupport.Element.insert(element,content,position);
    },
    collect: function collect(target_element,elements,callback,context)
    {
        if(callback)
        {
            var arguments_array = ActiveSupport.Array.from(arguments);
            var arguments_for_bind = arguments_array.slice(3);
            if(arguments_for_bind.length > 0)
            {
                arguments_for_bind.unshift(callback);
                callback = ActiveSupport.Function.bind.apply(ActiveSupport,arguments_for_bind);
            }
            var collected_elements = [];
            for(var i = 0; i < elements.length; ++i)
            {
                collected_elements.push(callback(elements[i]));
            }
            elements = collected_elements;
        }
        for(var i = 0; i < elements.length; ++i)
        {
            target_element.appendChild(elements[i]);
        }
        return elements;
    },
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
                if(!ie)
                {
                    element.setAttribute(name,value);
                }
                else
                {
                    if(name == 'style')
                    {
                        element.style.cssText = value;
                    }
                    else
                    {
                        element.setAttribute(ActiveSupport.Element.ieAttributeTranslations[name] || name,value);
                    }
                }
            }
        }
        return element;
    },
    hasClassName: function hasClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        var element_class_name = element.className;
        return (element_class_name.length > 0 && (element_class_name == class_name || new RegExp("(^|\\s)" + class_name + "(\\s|$)").test(element_class_name)));
    },
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
    removeClassName: function removeClassName(element,class_name)
    {
        if(!element)
        {
            return false;
        }
        element.className = element.className.replace(new RegExp("(^|\\s+)" + class_name + "(\\s+|$)"),' ').replace(/^\s+/, '').replace(/\s+$/, '');
        return element;
    },
    documentReadyObservers: [],
    observe: function observe(element,event_name,callback,context)
    {
        //bind context to context and curried arguments if applicable
        if(arguments.length > 3)
        {
            var arguments_array = ActiveSupport.Array.from(arguments);
            var arguments_for_bind = arguments_array.slice(3);
            if(arguments_for_bind.length > 0)
            {
                arguments_for_bind.unshift(callback);
                callback = ActiveSupport.Function.bind.apply(ActiveSupport,arguments_for_bind);
            }
        }
        
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