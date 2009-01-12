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

ActiveTest.Tests.ActiveRecord.finders = function(proceed)
{    
    with(ActiveTest)
    {
        if(ActiveRecord.asynchronous)
        {

        }
        else
        {
            var a = Comment.create({
                title: 'a'
            });
            var b = Comment.create({
                title: 'b'
            });
            var c = Comment.create({
                title: 'c'
            });
            assert(Comment.find({
                all: true,
                where: {
                    title: 'b'
                }
            })[0].title == 'b','find({where: Hash})');
            assert(Comment.find({
                all: true,
                where: 'title = "c"'
            })[0].title == 'c','find({where: String})');
            assert(Comment.find({
                first: true,
                where: {
                    title: 'b'
                }
            }).title == 'b','find({first: true, where: Hash})');

            assert(Comment.find().length == 3 && Comment.find({all: true}).length == 3,'find({all: true})');

            var asc = Comment.find({
                all: true,
                order: 'id ASC'
            });
            var desc = Comment.find({
                all: true,
                order: 'id DESC'
            });

            var asc_find_by_sql = Comment.find('SELECT * FROM comments ORDER BY id ASC');
            var desc_find_by_sql = Comment.find('SELECT * FROM comments ORDER BY id DESC');

            assert(asc[0].title == asc_find_by_sql[0].title && asc[2].title == asc_find_by_sql[2].title && desc[0].title == desc_find_by_sql[0].title && desc[2].title == desc_find_by_sql[2].title,'find(sql_string)');
            assert(asc[0].title == 'a' && asc[2].title == 'c' && desc[0].title == 'c' && desc[2].title == 'a','find({all: true,order: String})');

            assert(typeof(Comment.findByTitle) != 'undefined','findBy#{X} exists.');
            assert(typeof(Comment.findAllByTitle) != 'undefined','findAllBy#{X} exists.');
            assert(Comment.findByTitle('a').title == a.title && Comment.findById(a.id).id == a.id,'findByX works');
            if(proceed)
                proceed();
        }
    }
};