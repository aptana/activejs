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

ActiveTest.Tests.View.builder = function(proceed)
{
    with(ActiveTest)
    {
        var ArgumentsTestView = ActiveView.create(function(){
           with(this.builder){
               return ul(
                   li('one','two',b('three'),'four',b('five')),
                   li({className: 'test'}),
                   {className: 'blarg'}
               );
           } 
        });
        
        var DeepView = ActiveView.create(function(){
            with(this.builder){
                return div(
                    table(
                        tbody(
                            tr(
                                td(
                                    ul(
                                        li(),
                                        li(span(b('test')))
                                    )
                                ),
                                td(
                                    p(span('test'))
                                )
                            ),
                            tr(
                                td(
                                    
                                ),
                                td(
                                    
                                )
                            )
                        )
                    )
                );
            }
        });
        var deep_instance = new DeepView();
        var arguments_instance = new ArgumentsTestView();

        assert(arguments_instance.container.firstChild.firstChild.nodeValue == 'one' && arguments_instance.container.firstChild.childNodes[2].tagName == 'B','mix and match of text and elements');
        
        if(proceed)
            proceed()
    }
};