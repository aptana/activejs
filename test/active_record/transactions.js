ActiveTest.Tests.Record.transactions = function()
{
    with(ActiveTest)
    {
        var count = Comment.count();
        Comment.transaction(function(){
            var a = Comment.create({
                title: 'a'
            });
            var b = Comment.create({
                title: 'a'
            });
        });
        assert(Comment.count() == count + 2,'Transaction COMMIT');
        try{
            Comment.transaction(function(){
                var c = Comment.create({
                    title: 'c'
                });
                var d = Comment.create({
                    title: 'd'
                });
                throw 'error';
            });
            
        }catch(e){
            assert(Comment.count() == count + 2 && e.message == 'error','Transaction ROLLBACK without handler');
        }
        Comment.transaction(function(){
            var c = Comment.create({
                title: 'c'
            });
            var d = Comment.create({
                title: 'd'
            });
            throw 'error';
        },function(e){
            assert(Comment.count() == count + 2 && e.message == 'error','Transaction ROLLBACK with handler');
        });
        
    }
};