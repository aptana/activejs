ActiveTest.Tests.Record.validations = function()
{
    with(ActiveTest)
    {
        var a = Comment.create({});
        assert(!a.id && a.getErrors().length > 0,'create() enforces validations.');
        var b = new Comment();
        assert(!b.save() && !b.id && b.getErrors().length > 0,'save() enforces validations.');
        b.set('title','b');
        b.save();
        assert(b.id && b.getErrors().length == 0,'save() allows save after correction');
    }
};