ActiveTest.Tests.ActiveRecord.teardown = function(proceed)
{
    with(ActiveTest)
    {
        if(ActiveRecord.asynchronous)
        {

        }
        else
        {
            if(proceed)
                proceed();
        }
    }
};