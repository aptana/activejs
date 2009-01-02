/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
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

ActiveController.InstanceMethods.render = ActiveSupport.wrap(ActiveController.InstanceMethods.render,function pure_render(proceed,source_element,target,clear){
    if(source_element && source_element.nodeType == 1 && ((target && target.nodeType == 1) || !target))
    {
        if(!target)
        {
            target = source_element;
        }
        var directives = clear;
        return ActiveSupport.getGlobalContext().pure.libs.render(target,this.toObject(),directives,source_element,(typeof(directives) == 'undefined' || !directives));
    }
    else
    {
        return proceed(source_element,target,clear);
    }
});
