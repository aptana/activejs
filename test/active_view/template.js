ActiveTest.Tests.View.template = function(proceed)
{
    with(ActiveTest)
    {
        var simple_template = new ActiveView.Template('<b><%= test %></b>');
        var output_a = simple_template.render({
            test: 'a'
        });
        assert(output_a == '<b>a</b>','Simple render with variable replacement.');
        var output_b = simple_template.render({
            test: 'b'
        });
        assert(output_b == '<b>b</b>','Render output is not cached.');
        var loop_template = new ActiveView.Template('<% for(var i = 0; i < list.length; ++i){ %><%= list[i] %><% } %>');
        var loop_output = loop_template.render({list:['a','b','c']});
        assert(loop_output == 'abc','Loop functions correctly.');
    }
    if(proceed)
        proceed()
};
