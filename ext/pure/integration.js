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

ActiveController.InstanceMethods.compile = function compile(source_element,name,directives)
{
    return ActiveSupport.getGlobalContext().pure.libs.compile(source_element,name,directives,this.toObject());
};

ActiveController.InstanceMethods.directive = function directive(source_element,directives)
{
    return ActiveSupport.getGlobalContext().pure.libs.mapDirective(source_element,directives);
};

ActiveSupport.extend(ActiveController.RenderFlags,{
    source: function source(source,args)
    {
        args[0] = source;
        args.pure = true;
    },
    directives: function directives(directives,args)
    {
        args.directives = directives;
    },
    target: function target(target,args)
    {
        args.pure = true;
        args[1] = target;
    }
});

ActiveController.InstanceMethods.render = ActiveSupport.wrap(ActiveController.InstanceMethods.render,function render(proceed,params)
{
    var args = this.renderArgumentsFromRenderParams(params);
    if(args.pure)
    {
        return ActiveSupport.getGlobalContext().pure.libs.render(
            args[1] || args[0],
            this.toObject(),
            args.directives,
            args[0],
            (typeof(args.directives) == 'undefined' || !args.directives)
        );
    }
    else
    {
        return proceed(params);
    }    
});