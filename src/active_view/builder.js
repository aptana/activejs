/**
 * ActiveView.Builder
 * See the [[ActiveView]] or [[ActiveView.Builder.tag]] for usage.
 * 
 * Contains the following DOM Element generator methods:
 * 
 * - abbr
 * - acronym
 * - address
 * - applet
 * - area
 * - b
 * - base
 * - basefont
 * - bdo
 * - big
 * - blockquote
 * - body
 * - br
 * - button
 * - canvas
 * - caption
 * - center
 * - cite
 * - code
 * - col
 * - colgroup
 * - dd
 * - del
 * - dfn
 * - dir
 * - div
 * - dl
 * - dt
 * - em
 * - embed
 * - fieldset
 * - font
 * - form
 * - frame
 * - frameset
 * - h1
 * - h2
 * - h3
 * - h4
 * - h5
 * - h6
 * - head
 * - hr
 * - html
 * - i
 * - iframe
 * - img
 * - input
 * - ins
 * - isindex
 * - kbd
 * - label
 * - legend
 * - li
 * - link
 * - map
 * - menu
 * - meta
 * - nobr
 * - noframes
 * - noscript
 * - object
 * - ol
 * - optgroup
 * - option
 * - p
 * - param
 * - pre
 * - q
 * - s
 * - samp
 * - script
 * - select
 * - small
 * - span
 * - strike
 * - strong
 * - style
 * - sub
 * - sup
 * - table
 * - tbody
 * - td
 * - textarea
 * - tfoot
 * - th
 * - thead
 * - title
 * - tr
 * - tt
 * - u
 * - ul
 * - var
 * 
 * Also includes HTML 5 tags:
 * 
 * - article
 * - aside
 * - audio
 * - command
 * - details
 * - figcaption
 * - figure
 * - footer
 * - header
 * - hgroup
 * - keygen
 * - mark
 * - meter
 * - nav
 * - output
 * - progress
 * - rp
 * - ruby
 * - section
 * - source
 * - summary
 * - time
 * - video
 * 
 **/
var Builder = {
    tags: ('A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY ' +
        'BR BUTTON CANVAS CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM EMBED FIELDSET ' +
        'FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX '+
        'KBD LABEL LEGEND LI LINK MAP MENU META NOBR NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P '+
        'PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD '+
        'TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR ' + 
        'ARTICLE ASIDE AUDIO COMMAND DETAILS FIGCAPTION FIGURE FOOTER HEADER HGROUP KEYGEN MARK' + 
        'METER NAV OUTPUT PROGRESS RP RUBY SECTION SOURCE SUMMARY TIME VIDEO'
    ).split(/\s+/),
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
    /**
     * ActiveView.Builder.tag([content][,attributes][,child_nodes]) -> Element
     * - content (String | Number | Function): The content to be inserted in the node.
     * - attributes (Object): Hash of HTML attributes, must use "className" instead of "class".
     * - child_nodes (Array | Element | Function): May be an array of child nodes, a callback function or an Element
     *  
     * **This method refers to tag methods, "br", "li", etc not a method named "tag".**
     *  
     *  `tag` methods accept a variable number of arguments. You can pass multiple
     *  `content` arguments, `attributes` hashes or child nodes (as an array or single
     *  elements) in any order.
     *  
     *     builder.ul(builder.li('a'),builder.li('b'),{className:'my_list'});
     *     builder.ul({className:'my_list'},[builder.li('a'),builder.li('b')]);
     *  
     * Functions that are passed in will be called, and the response treated as
     * an argument, for instance: one of the tag methods:
     *  
     *     builder.p('First line',builder.br,'Second Line')
     * 
     * it could also be a class method, or an inline function:
     * 
     *     builder.p('First line',my_view_method,'Second Line')
     **/
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

ActiveView.Builder = {};
Builder.generator(ActiveView.Builder);