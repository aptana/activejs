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

ActiveTest.Tests.ActiveRecord.basic = function(proceed)
{
    with(ActiveRecord.Test)
    {
        if(ActiveRecord.asynchronous)
        {

        }
        else
        {
            //Comment is defined by ActiveRecord, Post is defined by SQL
            var a = new Comment({
                title: 'a',
                body: 'aa'
            });
            assert(a.title == 'a','Record correctly initialized.');

            var b = Comment.create({
                title: 'b',
                body: 'bb'
            });
            assert(b.title == 'b','Record correctly initialized with create().');
            assert(b.id > 0,'Record has id.');
            assert(Comment.find(b.id).title == 'b','Record persisted.');

            var c = Comment.create({
                title: 'c',
                body: 'cc'
            });
            assert(c.id == b.id + 1,'Record incrimented id.');
            assert(Comment.find(c.id).title == 'c','Record persisted.');
            assert(Comment.count() == 2,'Record count is correct.');
            assert(Comment.count({
                where: {
                    title: 'c'
                }
            }) == 1,'Record count with conditions is correct.');

            
            assert(b.id == Comment.first().id,'Calculations: first()');
            assert(c.id == Comment.last().id,'Calculations: last()');
            assert(3 == Comment.sum('id'),'Calculations: sum()')
            assert(1 == Comment.min('id'),'Calculations: min()')
            assert(2 == Comment.max('id'),'Calculations: max()')
            
            assert(c.get('title') == 'c','set()')
            c.set('title','ccc');
            assert(c.get('title') == 'ccc' && c.title == 'ccc','set() basic');

            c.set('save','test');
            assert(c.save != 'test' && c.get('save') == 'test','set() does not override protected parameter');

            c.reload();
            assert(c.title == 'c' && c.get('title') == 'c' && typeof(c.save) == 'function','reload()');

            c.updateAttribute('title','ccc');
            assert(c.title == 'ccc' && c.get('title') == 'ccc' && Comment.find(c.id).title == 'ccc','updateAttribute()');

            c.set('title','cccc');
            c.save();
            var _c = Comment.find(c.id);
            assert(_c.title == 'cccc' && _c.title == 'cccc' && c.id == _c.id,'save()');

            var count = Comment.count();
            c.destroy();
            assert(!c.reload() && count - 1 == Comment.count(),'destroy()');

            Comment.destroy('all');
            assert(Comment.count() == 0,'destroy("all")');
            if(proceed)
                proceed();
        }
    }
};