ActiveTest.Tests.ActiveRecord.cleanup = function(proceed)
{
    if(ActiveRecord.asynchronous)
    {

    }
    else
    {
        Comment.destroy('all');
        Post.destroy('all');
        User.destroy('all');
        ModelWithStringDates.destroy('all');
        ModelWithDates.destroy('all');
        Article.destroy('all');
        Category.destroy('all');
        Categorization.destroy('all');
        
        if(proceed)
            proceed();
    }
};
