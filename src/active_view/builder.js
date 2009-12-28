/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * ***** END LICENSE BLOCK ***** */

var Builder = {
    tags: ('A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY ' +
        'BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM EMBED FIELDSET ' +
        'FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX '+
        'KBD LABEL LEGEND LI LINK MAP MENU META NOBR NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P '+
        'PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD '+
        'TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR').split(/\s+/),
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
        var global_context = ActiveSupport.getGlobalContext();
        var ie = !!(global_context.attachEvent && !global_context.opera);
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
            element = Builder.extendCreatedElement(global_context.document.createElement(tag));
        }
        else
        {
            if(!Builder.cache[tag_name])
            {
                Builder.cache[tag_name] = Builder.extendCreatedElement(global_context.document.createElement(tag_name));
            }
            element = Builder.cache[tag_name].cloneNode(false);
        }
        Builder.writeAttribute(element,attributes);
        return element;
    },
    clearElement: function clearElement(element)
    {
        while(element.firstChild)
        {
            element.removeChild(element.firstChild);
        }
    },
    extendCreatedElement: function extendCreatedElement(element)
    {
        return element;
    },
    writeAttribute: function writeAttribute(element,name,value)
    {
        var global_context = ActiveSupport.getGlobalContext();
        var ie = !!(global_context.attachEvent && !global_context.opera);
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
                        element.setAttribute(Builder.ieAttributeTranslations[name] || name,value);
                    }
                }
            }
        }
        return element;
    },
    addMethods: function addMethods(methods)
    {
        ActiveSupport.extend(Builder,methods || {});
    }
};

Builder.generator = function generator(target,scope){
    var global_context = ActiveSupport.getGlobalContext();
    for(var t = 0; t < Builder.tags.length; ++t)
    {
        var tag = Builder.tags[t];
        (function tag_iterator(tag){
            target[tag.toLowerCase()] = target[tag] = function tag_generator(){
                var i, argument, attributes, text_nodes, elements, element;
                text_nodes = [];
                elements = [];
                for(i = 0; i < arguments.length; ++i)
                {
                    argument = arguments[i];
                    if(typeof(argument) === 'undefined' || argument === null || argument === false)
                    {
                        continue;
                    }
                    if(typeof(argument) === 'function' && !ActiveView.isActiveViewClass(argument))
                    {
                        argument = argument();
                    }
                    if(ActiveView.isActiveViewInstance(argument))
                    {
                        elements.push(argument.container);
                    }
                    else if(ActiveView.isActiveViewClass(argument))
                    {
                        elements.push(new argument(scope._object || {}).container);
                    }
                    else if(typeof(argument) !== 'string' && typeof(argument) !== 'number' && !(argument !== null && typeof argument === "object" && 'splice' in argument && 'join' in argument) && !(argument && argument.nodeType === 1))
                    {
                        attributes = argument;
                    }
                    else if(argument !== null && typeof argument === "object" && 'splice' in argument && 'join' in argument)
                    {
                        elements = argument;
                    }
                    else if((argument && argument.nodeType === 1) || typeof(argument) === 'string' || typeof(argument) === 'number')
                    {
                        elements.push(argument);
                    }
                }
                element = Builder.createElement(tag,attributes);
                for(i = 0; i < elements.length; ++i)
                {
                    if(elements[i] && elements[i].nodeType === 1)
                    {
                        element.appendChild(elements[i]);
                    }
                    else
                    {
                        element.appendChild(global_context.document.createTextNode(String(elements[i])));
                    }
                }
                return element;
            };
        })(tag);
    }
};
Builder.generator(Builder);

/**
 * Contains all DOM generator methods, b(), h1(), etc. This object can
 * always be referenced statically as ActiveView.Builder, but is also
 * available as this.builder inside of ActiveView classes.
 * @alias ActiveView.Builder
 * @property {Object}
 */
ActiveView.Builder = Builder;