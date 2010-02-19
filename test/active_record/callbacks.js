ActiveTest.Tests.Record.callbacks = function()
{
    with(ActiveTest)
    {
        var i = 0;
        var x = 0;
        Comment.observe('beforeCreate',function(){
            ++i;
        });
        var a = Comment.create({
            title: 'a'
        });
        //alternate syntax
        a.afterSave(function(){
            ++x;
        });
        var b = Comment.create({
            title: 'b'
        });
        assert(i == 2,'Class callbacks.');
        a.save();
        assert(i == 2 && x == 1,'Instance.callbacks');
    }
};