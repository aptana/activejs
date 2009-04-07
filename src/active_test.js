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
 
var ActiveTest = {
    pass: 0,
    fail: 0,
    error: 0,
    currentGroupName: null,
    currentTestName: null,
    summary: [],
    lastNote: '',
    log: function log(msg)
    {
        if(ActiveTest.currentTestName)
        {
            msg = '[' + ActiveTest.currentTestName + '] ' + msg;
        }
        ActiveSupport.log(msg);
    },
    assert: function assert(condition,note)
    {
        ActiveTest.lastNote = note;
        try
        {
            var pass = !!(typeof(condition) === 'function' ? condition() : condition);
            ++ActiveTest[pass ? 'pass' : 'fail'];
            ActiveTest.log((pass ? 'Pass' : 'Fail') + (note ? ': ' + note : ''));
        }
        catch(e)
        {
            ++ActiveTest.error;
            ActiveTest.log('Error' + (note ? ': ' + note : ''));
            ActiveTest.log(e);
        }
    },
    run: function run()
    {
        ActiveTest.summary = [];
        ActiveTest.lastNote = '';
        ActiveTest.currentGroupName = null;
        ActiveTest.currentTestName = null;
        for(var group_name in ActiveTest.Tests)
        {
            ActiveTest.log(group_name + ' Test Starting');
            ActiveTest.pass = 0;
            ActiveTest.fail = 0;
            ActiveTest.error = 0;
            var stack = [];
            if(ActiveTest.Tests[group_name].setup)
            {
                stack.push(function(){
                    ActiveTest.Tests[group_name].setup(stack.shift());
                });
            }
            for(var test_name in ActiveTest.Tests[group_name])
            {
                if(test_name !== 'setup' && test_name !== 'teardown' && test_name !== 'cleanup')
                {            
                    stack.push(ActiveSupport.curry(function(test_name){
                        ActiveTest.currentTestName = test_name;
                        try
                        {
                            ActiveTest.Tests[group_name][test_name](stack.shift());
                        }
                        catch(e)
                        {
                            ++ActiveTest.error;
                            ActiveTest.log('Error after test' + (ActiveTest.lastNote ? ': ' + ActiveTest.lastNote : ''));
                            ActiveTest.log(e);
                            var output = '[' + group_name + ' Pass:' + ActiveTest.pass +',Fail:' + ActiveTest.fail + ',Error:' + ActiveTest.error + ']';
                            ActiveTest.summary.push(output);
                            ActiveTest.log(output);
                        }
                    },test_name));
                    if(ActiveTest.Tests[group_name].cleanup)
                    {
                        stack.push(function(){
                            ActiveTest.Tests[group_name].cleanup(stack.shift());
                        });
                    }
                }
            }
            if(ActiveTest.Tests[group_name].teardown)
            {
                stack.push(function(){
                    ActiveTest.Tests[group_name].teardown(stack.shift());
                });
            }
            stack.push(function(){
                ActiveTest.currentTestName = null;
                var output = '[' + group_name + ' Pass:' + ActiveTest.pass +',Fail:' + ActiveTest.fail + ',Error:' + ActiveTest.error + ']';
                ActiveTest.summary.push(output);
                ActiveTest.log(output);
            });
            stack.shift()();
        }
        ActiveTest.log('SUMMARY');
        ActiveTest.log('-------');
        for(var i = 0; i < ActiveTest.summary.length; ++i)
        {
            ActiveTest.log(ActiveTest.summary[i]);
        }
    }
};

ActiveTest.Tests = {};