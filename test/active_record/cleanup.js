ActiveTest.Tests.Record.cleanup = function()
{
    Comment.destroy('all');
    Post.destroy('all');
    User.destroy('all');
    ModelWithStringDates.destroy('all');
    ModelWithDates.destroy('all');
    Article.destroy('all');
    Category.destroy('all');
    Categorization.destroy('all');
};
