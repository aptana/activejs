ActiveTest.Tests.View.builder = function()
{
    with(ActiveTest)
    {
        var ArgumentsTestView = ActiveView.create(function(){
           with(ActiveView.Builder){
               return ul(
                   li('one','two',b('three'),'four',b('five')),
                   li({className: 'test'}),
                   {className: 'blarg'}
               );
           } 
        });
        
        var DeepView = ActiveView.create(function(){
            with(ActiveView.Builder){
                return div(
                    table(
                        tbody(
                            tr(
                                td(
                                    ul(
                                        li(span(b('test'))),
                                        li()
                                    )
                                ),
                                td(
                                    p(span('test'))
                                )
                            ),
                            tr(
                                td(
                                    
                                ),
                                td(
                                    
                                )
                            )
                        )
                    )
                );
            }
        });
        var deep_instance = new DeepView();
        var arguments_instance = new ArgumentsTestView();
        assert(arguments_instance.getElement().firstChild.firstChild.nodeValue == 'one' && arguments_instance.getElement().firstChild.childNodes[2].tagName == 'B','mix and match of text and elements');
        assert(deep_instance.getElement().firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.nodeValue == 'test','deep builder node test');
    }
};