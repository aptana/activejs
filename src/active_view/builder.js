var Builder = {
    tags: ('A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY ' +
        'BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM EMBED FIELDSET ' +
        'FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX '+
        'KBD LABEL LEGEND LI LINK MAP MENU META NOBR NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P '+
        'PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD '+
        'TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR').split(/\s+/),
    processNodeArgument: function processNodeArgument(elements,attributes,argument)
    {
        if(typeof(argument) === 'undefined' || argument === null || argument === false)
        {
            return;
        }
        if(typeof(argument) === 'function' && !ActiveView.isActiveViewClass(argument))
        {
            argument = argument();
        }
        if(ActiveView.isActiveViewInstance(argument) || typeof(argument.getElement) == 'function')
        {
            elements.push(argument.getElement());
        }
        else if(ActiveView.isActiveViewClass(argument))
        {
            elements.push(new argument().getElement());
        }
        else if(typeof(argument) !== 'string' && typeof(argument) !== 'number' && !(argument !== null && typeof argument === "object" && 'splice' in argument && 'join' in argument) && !(argument && argument.nodeType === 1))
        {
            for(attribute_name in argument)
            {
                attributes[attribute_name] = argument[attribute_name];
            }
        }
        else if(argument !== null && typeof argument === "object" && 'splice' in argument && 'join' in argument)
        {
            for(ii = 0; ii < argument.length; ++ii)
            {
                Builder.processNodeArgument(elements,attributes,argument[ii]);
            }
        }
        else if((argument && argument.nodeType === 1) || typeof(argument) === 'string' || typeof(argument) === 'number')
        {
            elements.push(argument);
        }
    },
    generator: function generator(target,scope)
    {
        var global_context = ActiveSupport.getGlobalContext();
        for(var t = 0; t < Builder.tags.length; ++t)
        {
            var tag = Builder.tags[t];
            (function tag_iterator(tag){
                target[tag.toLowerCase()] = target[tag] = function node_generator(){
                    var i, ii, argument, attributes, attribute_name, elements, element;
                    elements = [];
                    attributes = {};
                    for(i = 0; i < arguments.length; ++i)
                    {
                        Builder.processNodeArgument(elements,attributes,arguments[i]);
                    }
                    element = ActiveSupport.Element.create(tag,attributes);
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
    }
};

/**
 * Contains all DOM generator methods, b(), h1(), etc. This object can
 * always be referenced statically as ActiveView.Builder, but is also
 * available as this.builder inside of ActiveView classes.
 * @alias ActiveView.Builder
 * @property {Object}
 */
ActiveView.Builder = {};
Builder.generator(ActiveView.Builder);