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

ActiveTest.Tests.Controller.scoping = function(proceed)
{
    with(ActiveTest)
    {
        TestController = ActiveController.create({
            index: function index(){
                this.set('a',1);
                this.render({
                    view: TestView
                });
                assert(this.get('a') == 3,'view set() persisted to controller');
                this.set('a',4);
                assert(changes_call_count == 3,'controller triggers view binding change()');
            }
        });
        
        var changes_call_count = 0;
        
        TestView = ActiveView.create(function(){
            assert(this.get('a') == 1,'controller set() persisted to view');
            this.set('a',2);
            this.binding.when('a').changes(function(value){
                ++changes_call_count;
            });
            this.set('a',3);
            return this.builder.div();
        });
        
        TestViewFragment = ActiveView.create(function(){
            return div();
        });
        
        TestController.index();
        
        if(proceed)
            proceed()
    }
};