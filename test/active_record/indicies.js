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

ActiveTest.Tests.ActiveRecord.indicies = function(proceed)
{
    with(ActiveTest)
    {
        if(ActiveRecord.connection && ActiveRecord.connection.storage){
            User.addIndex('byLetter',{a:{},b:{},c:{}},{
                afterSave: function(index,user){
                    var first_letter = user.name.substring(0,1).toLowerCase();
                    index[first_letter][user.id] = user;
                },
                afterDestroy: function(index,user){
                    var first_letter = user.name.substring(0,1).toLowerCase();
                    delete index[first_letter][user.id];
                }
            });
            var alice = User.create({name: 'alice'});
            var bob = User.create({name: 'bob'});
            assert(User.indexed.byLetter.a[alice.id].name == 'alice','test index creation');
            assert(User.indexed.byLetter.b[bob.id].name == 'bob','test index creation');
            bob.destroy();
            assert(User.indexed.byLetter.a[alice.id].name == 'alice','test index destruction');
            assert(!(bob.id in User.indexed.byLetter.b),'test index item destruction');
            User.removeIndex('byLetter');
            assert(!('byLetter' in User.indexed),'test index destruction');
        }
    }
    if(proceed)
        proceed();
};