ActiveTest.Tests.Record.serialization = function()
{
    with(ActiveTest)
    {
        var a = Comment.create({
            title: 'a',
            test: {
                a: '1',
                b: 2,
                c: {
                    aa: '11',
                    bb: [1,2,3],
                    cc: '33'
                }
            }
        });
        var sample = Comment.find(a.id).test;
        assert(sample.a == a.test.a && sample.b == a.test.b && a.test.c.bb[1] == sample.c.bb[1],'Object serialization.');
        var b = Comment.create({
            title: 'b',
            test_2: [1,2,['a','b','c']]
        });
        var sample = Comment.find(b.id).test_2;
        assert(sample[0] == b.test_2[0] && sample[2][1] == b.test_2[2][1],'Array serialization.');
        a.destroy();
        b.destroy();
        
        var ted = User.create({name: 'ted'});
        var one = ted.createComment({title: 'title one',body: 'comment one'});
        var two = ted.createComment({title: 'title two',body: 'comment two'});
        //JSON
        
        //item
        assert(ActiveSupport.JSON.parse(ted.toJSON()).name === ted.name && ActiveSupport.JSON.parse(ted.toJSON()).id === ted.id,'JSON parse/serialize item');
        
        //array
        var result = Comment.find({all: true});
        assert(ActiveSupport.JSON.parse(result.toJSON())[0].body === result[0].body,'JSON parse/serialize array');
        
        //nested
        var json = ted.toJSON({
          comments: ted.getCommentList().toArray()
        });
        var parsed = ActiveSupport.JSON.parse(json);
        assert(ted.getCommentList()[0].body === parsed.comments[0].body,'JSON parse/serialize object with nested array');
    }
};