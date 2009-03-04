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

ActiveView.Template = {
    create: function create(src,helpers)
    {
        var klass = function klass(){};
        klass.helpers = {};
        ActiveSupport.extend(klass.helpers,helpers || {});
        ActiveSupport.extend(klass.helpers,ActiveView.Template.Helpers);
        ActiveSupport.extend(klass,ActiveView.Template.ClassMethods);
        klass.template = ActiveView.Template.generateTemplate(src);
        return klass;
    }
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

ActiveView.Template.ClassMethods = {
    render: function render(data)
    {
        return ActiveSupport.bind(this.template,this)(data || {});
    }
};

ActiveView.Template.Helpers = {};
