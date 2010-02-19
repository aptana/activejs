ActiveTest.Tests.Record.indicies = function()
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
};