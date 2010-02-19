var ActiveTest = {
    pass: 0,
    fail: 0,
    error: 0,
    currentGroupName: null,
    currentTestName: null,
    summary: [],
    lastNote: '',
    log: function log(msg)
    {
        if(ActiveTest.currentTestName)
        {
            msg = '[' + ActiveTest.currentTestName + '] ' + msg;
        }
        ActiveSupport.log(msg);
    },
    assert: function assert(condition,note)
    {
        ActiveTest.lastNote = note;
        try
        {
            var pass = !!(typeof(condition) === 'function' ? condition() : condition);
            ++ActiveTest[pass ? 'pass' : 'fail'];
            ActiveTest.log((pass ? 'Pass' : 'Fail') + (note ? ': ' + note : ''));
        }
        catch(e)
        {
            ++ActiveTest.error;
            ActiveTest.log('Error' + (note ? ': ' + note : ''));
            ActiveTest.log(e);
        }
    },
    run: function run(run_group_name)
    {
        ActiveTest.summary = [];
        ActiveTest.lastNote = '';
        ActiveTest.currentGroupName = null;
        ActiveTest.currentTestName = null;
        for(var group_name in ActiveTest.Tests)
        {
            if(!run_group_name || run_group_name == group_name)
            {
                ActiveTest.log(group_name + ' Test Starting');
                ActiveTest.pass = 0;
                ActiveTest.fail = 0;
                ActiveTest.error = 0;
                var stack = [];
                if(ActiveTest.Tests[group_name].setup)
                {
                    stack.push(function(){
                        ActiveTest.Tests[group_name].setup();
                    });
                }
                for(var test_name in ActiveTest.Tests[group_name])
                {
                    if(test_name !== 'setup' && test_name !== 'teardown' && test_name !== 'cleanup')
                    {            
                        stack.push(ActiveSupport.curry(function(test_name){
                            ActiveTest.currentTestName = test_name;
                            try
                            {
                                ActiveTest.Tests[group_name][test_name]();
                            }
                            catch(e)
                            {
                                ++ActiveTest.error;
                                ActiveTest.log('Error after test' + (ActiveTest.lastNote ? ': ' + ActiveTest.lastNote : ''));
                                ActiveTest.log(e);
                                throw e;
                                var output = '[' + group_name + ' Pass:' + ActiveTest.pass +',Fail:' + ActiveTest.fail + ',Error:' + ActiveTest.error + ']';
                                ActiveTest.summary.push(output);
                                ActiveTest.log(output);
                            }
                        },test_name));
                        if(ActiveTest.Tests[group_name].cleanup)
                        {
                            stack.push(function(){
                                ActiveTest.Tests[group_name].cleanup();
                            });
                        }
                    }
                }
                if(ActiveTest.Tests[group_name].teardown)
                {
                    stack.push(function(){
                        ActiveTest.Tests[group_name].teardown();
                    });
                }
                stack.push(function(){
                    ActiveTest.currentTestName = null;
                    var output = '[' + group_name + ' Pass:' + ActiveTest.pass +',Fail:' + ActiveTest.fail + ',Error:' + ActiveTest.error + ']';
                    ActiveTest.summary.push(output);
                    ActiveTest.log(output);
                });
                for(var i = 0; i < stack.length; ++i){
                    stack[i]();
                }
            }
        }
        ActiveTest.log('SUMMARY');
        ActiveTest.log('-------');
        for(var i = 0; i < ActiveTest.summary.length; ++i)
        {
            ActiveTest.log(ActiveTest.summary[i]);
        }
    }
};

ActiveTest.Tests = {};