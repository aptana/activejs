var global_context = ActiveSupport.getGlobalContext();
var ie = !!(global_context.attachEvent && !global_context.opera);

ActiveSupport.DOM = {
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
            element = ActiveSupport.DOM.extend(global_context.document.createElement(tag));
        }
        else
        {
            if(!ActiveSupport.DOM.cache[tag_name])
            {
                ActiveSupport.DOM.cache[tag_name] = ActiveSupport.DOM.extend(global_context.document.createElement(tag_name));
            }
            element = ActiveSupport.DOM.cache[tag_name].cloneNode(false);
        }
        ActiveSupport.DOM.writeAttribute(element,attributes);
        return element;
    },
    extend: function extend(element)
    {
        return element;
    },
    clear: function clear(element)
    {
        while(element.firstChild)
        {
            element.removeChild(element.firstChild);
        }
        return element;
    },
    hide: function hide(element)
    {
        element.style.display = 'none';
        return element;
    },
    show: function show(element)
    {
        element.style.display = '';
        return element;
    },
    remove: function remove(element)
    {
        element.parentNode.removeChild(element);
        return element;
    },
    insert: function insert(element,content,position)
    {
        if(content && typeof(content.getElement) == 'function')
        {
            content = content.getElement();
        }
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
        return element;
    },
    update: function update(element,content,position)
    {
        ActiveSupport.DOM.clear(element);
        ActiveSupport.DOM.insert(element,content,position);
    },
    collect: function collect(target_element,elements,callback,context)
    {
        if(callback)
        {
            var arguments_array = ActiveSupport.arrayFrom(arguments);
            var arguments_for_bind = arguments_array.slice(3);
            if(arguments_for_bind.length > 0)
            {
                arguments_for_bind.unshift(callback);
                callback = ActiveSupport.bind.apply(ActiveSupport,arguments_for_bind);
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
                        element.setAttribute(ActiveSupport.DOM.ieAttributeTranslations[name] || name,value);
                    }
                }
            }
        }
        return element;
    },
    documentReadyObservers: [],
    observe: function observe(element,event_name,callback,context)
    {
        //bind context to context and curried arguments if applicable
        if(arguments.length > 3)
        {
            var arguments_array = ActiveSupport.arrayFrom(arguments);
            var arguments_for_bind = arguments_array.slice(3);
            if(arguments_for_bind.length > 0)
            {
                arguments_for_bind.unshift(callback);
                callback = ActiveSupport.bind.apply(ActiveSupport,arguments_for_bind);
            }
        }
        
        //dom:ready support
        if(element == ActiveSupport.getGlobalContext().document && event_name == 'ready')
        {
            if(ActiveSupport.DOM.documentReadyObservers == null)
            {
                //ActiveSupport.DOM.documentReadyObservers will be null if the document is ready
                //if so, trigger the observer now
                callback();
            }
            else
            {
                ActiveSupport.DOM.documentReadyObservers.push(callback);
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
    
    ActiveSupport.DOM.observe(document,'ready',function(){
    
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
      if(ActiveSupport.DOM.documentReadyObservers.length > 0)
      {
          for(var i = 0; i < ActiveSupport.DOM.documentReadyObservers.length; ++i)
          {
              ActiveSupport.DOM.documentReadyObservers[i]();
          }
          ActiveSupport.DOM.documentReadyObservers = null;
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
      ActiveSupport.DOM.observe(document,'readystatechange',check_ready_state);
      if(window == top)
      {
          timer = window.setTimeout(poll_do_scroll);
      }
  }
  
  ActiveSupport.DOM.observe(window,'load',fire_content_loaded_event);
})();

//Ajax Library integration
(function(){
    //Prototype
    if(global_context.Prototype && global_context.Prototype.Browser && global_context.Prototype.Browser.IE && global_context.Element && global_context.Element.extend)
    {
        ActiveSupport.DOM.extend = function extendForPrototype(element){
          return Element.extend(element);
        };
    };
    //MooTools
    if(global_context.MooTools && global_context.Browser && global_context.Browser.Engine.trident && global_context.document.id)
    {
        ActiveSupport.DOM.extend = function extendForMooTools(element){
            return global_context.document.id(element);
        };
    }
})();