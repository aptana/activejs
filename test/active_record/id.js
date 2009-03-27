/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Matt Brubeck.
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

ActiveTest.Tests.ActiveRecord.id = function(proceed)
{
    with (ActiveTest)
    {
        if (ActiveRecord.asynchronous)
        {

        }
        else
        {
            var a = Custom.create({name: 'test'});
            assert(Custom.find(a.custom_id).name == 'test', 'Custom integer primary key.');

            var b = Guid.create({guid: '123', data: 'test'});
            assert(Guid.findByGuid('123').data == 'test', 'findByGuid');
            assert(Guid.get('123').data == 'test', 'get(guid)');

            Guid.update('123', {data: 'changed'});
            assert(b.reload() && b.data == 'changed', 'Guid.update && b.reload');

            assert(Guid.destroy('123') && Guid.count() == 0, 'Guid.destroy');

            if(proceed)
                proceed();
        }
    }
};
