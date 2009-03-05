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

ActiveTest.Tests.View.template = function(proceed)
{
    with(ActiveTest)
    {
        var simple_template = ActiveView.Template.create('<b><%= test %></b>');
        var output_a = simple_template.render({
            test: 'a'
        });
        assert(output_a == '<b>a</b>','Simple render with variable replacement.');
        var output_b = simple_template.render({
            test: 'b'
        });
        assert(output_b == '<b>b</b>','Render output is not cached.');
        var loop_template = ActiveView.Template.create('<% for(var i = 0; i < list.length; ++i){ %><%= list[i] %><% } %>');
        var loop_output = loop_template.render({list:['a','b','c']});
        assert(loop_output == 'abc','Loop functions correctly.');
    }
    if(proceed)
        proceed()
};
