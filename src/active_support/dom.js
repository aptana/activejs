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
    cache: {},
    createElement: function createElement(tag_name,attributes)
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
            element = ActiveSupport.DOM.extendCreatedElement(global_context.document.createElement(tag));
        }
        else
        {
            if(!ActiveSupport.DOM.cache[tag_name])
            {
                ActiveSupport.DOM.cache[tag_name] = ActiveSupport.DOM.extendCreatedElement(global_context.document.createElement(tag_name));
            }
            element = ActiveSupport.DOM.cache[tag_name].cloneNode(false);
        }
        ActiveSupport.DOM.writeAttribute(element,attributes);
        return element;
    },
    extendCreatedElement: function extendCreatedElement(element)
    {
        return element;
    },
    clearElement: function clearElement(element)
    {
        while(element.firstChild)
        {
            element.removeChild(element.firstChild);
        }
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
    addEventListener: function addEventListener(element,event_name,callback,context){
        //bind context to context and curried arguments if applicable
        var arguments_array = ActiveSupport.arrayFrom(arguments);
        var arguments_for_bind = arguments_array.slice(4);
        if(typeof(context) != 'undefined')
        {
            arguments_for_bind.shift(context);
        }
        if(arguments_for_bind.length > 0)
        {
            arguments_for_bind.shift(callback);
            callback = ActiveSupport.bind.apply(arguments_for_bind);
        }
        
        //create callback wrapper
        var callback_wrapper = function callback_wrapper(event){
            return callback(event || window.event,function stop_callback(){
                event.cancelBubble = true;
                event.returnValue = false;
            },function remove_event_listener(){
                if(element.removeEventListener)
                {
                    element.removeEventListener(event_name,callback_wrapper,false);
                }
                else
                {
                    element.detachEvent("on" + event_name,callback_wrapper);
                }
            });
        };
        
        //attach event listener
        if(element.addEventListener)
        {
            element.addEventListener(event_name,callback,false);
        }
        else
        {
            element.attachEvent('on' + event_name,callback);
        }
        
        return callback_wrapper;
    }
};

//Ajax Library integration
(function(){
    //Prototype
    if(global_context.Prototype && global_context.Prototype.Browser && global_context.Prototype.Browser.IE && global_context.Element && global_context.Element.extend)
    {
        ActiveSupport.DOM.extendCreatedElement = function extendCreatedElementForPrototype(element){
          return Element.extend(element);
        };
    };
    //MooTools
    if(global_context.MooTools && global_context.Browser && global_context.Browser.Engine.trident && global_context.document.id)
    {
        ActiveSupport.DOM.extendCreatedElement = function extendCreatedElementForMooTools(element){
            return global_context.document.id(element);
        };
    }
})();