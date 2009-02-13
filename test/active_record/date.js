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

ActiveTest.Tests.ActiveRecord.date = function(proceed)
{
    with(ActiveTest)
    {
        if(ActiveRecord.asynchronous)
        {

        }
        else
        {
            var a = ModelWithStringDates.create({
                name: 'a'
            });
            assert(a.get('created').match(/^\d{4}/) && a.get('updated').match(/^\d{4}/),'created and updated set via string field');
            var old_date = a.get('updated');
            a.set('updated','');
            a.save();
            var new_date = a.get('updated');
            assert(ModelWithStringDates.find(a.id).get('updated') == new_date,'created and updated persist via string field');

            var a = ModelWithDates.create({
                name: 'a'
            });
            assert(ActiveSupport.dateFormat(a.get('created'),'yyyy-mm-dd HH:MM:ss').match(/^\d{4}/) && ActiveSupport.dateFormat(a.get('updated'),'yyyy-mm-dd HH:MM:ss').match(/^\d{4}/),'created and updated set via date field');
            var old_date = a.get('updated');
            a.set('updated','');
            a.save();
            var new_date = a.get('updated');
            var saved_date = ModelWithDates.find(a.id).get('updated');
            assert(saved_date.toString() == new_date.toString(),'created and updated persist via date field');
            
            //make sure dates are preserved
            var reload_test = ModelWithDates.find(a.id);
            var old_created = reload_test.get('created');
            reload_test.save();
            reload_test.reload();
            reload_test.save();
            reload_test.reload();
            //ActiveSupport.dateFormat(reload_test.get('updated'),'yyyy-mm-dd HH:MM:ss');
            assert(reload_test.get('created').toString() == old_created.toString(),'created time is preserved on update');

            if(proceed)
                proceed();
        }
    }
};