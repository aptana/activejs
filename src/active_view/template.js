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

/**
 * @alias ActiveView.Template
 * @constructor
 * @param {String} src
 * @param {Object} [helpers]
 * @return {ActiveView.Template}
 * @example
 * 
 * String Based Templating
 * -----------------------
 * Original implementation by [John Resig](http://ejohn.org/)
 * 
 * ActiveView.Template provides a string based templating approach that
 * is similar to ERB, ASP or PHP.
 * 
 *     var template_one = new ActiveView.Template('<h1><%= title %></h1>');
 *     template_one.render({title: 'The Title'});
 *     //<h1>The Title</h1>
 * 
 * Each template class can accept a hash of helper functions as the second
 * argument. To add helpers to all ActiveView.Template classes, you can 
 * add properties to ActiveView.Template.Helpers.
 * 
 *     var template_two = new ActiveView.Template('<h1><%= i(title) %></h1>',{
 *         i: function(text){
 *             return '<i>' + text + '</i>';
 *         }
 *     });
 *     template_two.render({title: 'The Title'});
 *     //<h1><i>The Title</i></h1>
 * 
 * You can embed JavaScript with logic (loops, conditions, etc) within your
 * template source. John Resig [points out](http://ejohn.org/blog/javascript-micro-templating/)
 * that you can place the template source code in your page using a script tag with an
 * unknown content type to get the browser to ignore it (but stil have access to it via the DOM).
 * 
 *     <script type="text/html" id="complex_template_source">
 *         <h2><%= title %></h2>
 *         <ul>
 *             <% for(var i = 0; i < list.length; ++i){ %>
 *                 <li><%= list[i] %></li>
 *             <% } %>
 *         </ul>
 *     </script>
 * 
 * Then in your code:
 * 
 *     var complex_template = new ActiveView.Template($('complex_template_source').innerHTML);
 * 
 */
ActiveView.Template = function Template(src,helpers)
{
    this.helpers = {};
    ActiveSupport.extend(this.helpers,helpers || {});
    ActiveSupport.extend(this.helpers,ActiveView.Template.Helpers);
    this.template = ActiveView.Template.generateTemplate(src);
    ActiveSupport.extend(this,ActiveView.Template.InstanceMethods);
};

ActiveView.Template.generateTemplate = function generateTemplate(source)
{
    try
    {
        // Original Implementation: Simple JavaScript Templating
        // John Resig - http://ejohn.org/ - MIT Licensed
        var processed_source = source
            .replace(/<%([^\=](.+?))\)(\s*)%>/g,'<%$1);$3%>') //fix missing semi-colons
            .replace(/[\r\t\n]/g, " ")
            .replace(/'(?=[^%]*%>)/g,"\t")
            .split("'").join("\\'")
            .split("\t").join("'")
            .replace(/<%=(.+?)%>/g, "',$1,'")
            .split("<%").join("');")
            .split("%>").join("p.push('")
        ;
        return new Function("data",[
            "var p = [];",
            "var print = function(){p.push.apply(p,arguments);};",
            "with(this.helpers){with(data){p.push('",
            processed_source,
            "');}}",
            "return p.join('');"
        ].join(''));
    }
    catch(e)
    {
        ActiveSupport.throwError(ActiveView.Template.Errors.CompilationFailed,'input:',source,'processed:',processed_source,e);
    }
};

ActiveView.Template.Errors = {
    CompilationFailed: ActiveSupport.createError('The template could not be compiled:')
};

ActiveView.Template.InstanceMethods = {
    /**
     * Renders the template with the given scope / data, returning
     * the processed result as a string.
     * @alias ActiveView.Template.prototype.render
     * @param {Object} [data]
     * @return {String}
     */
    render: function render(data)
    {
        return ActiveSupport.bind(this.template,this)(data || {});
    }
};

/**
 * Contains all methods that will become available as locals to templates.
 * @alias ActiveView.Template.Helpers
 * @property {Object}
 */
ActiveView.Template.Helpers = {};