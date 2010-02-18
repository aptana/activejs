ActiveTest.Tests.ActiveRecord.parser = function(proceed)
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