ActiveTest.Tests.View.states = function()
{
    with(ActiveTest)
    {
        var ViewWithStates = ActiveView.create(function(){
            with(ActiveView.Builder){
                return div(
                    this.title = h1(),
                    this.button = input({type:'button'})
                );
            }
        },{},{
            title: function(new_title,old_title){
                this.title.innerHTML = new_title;
            },
            button: {
                on: function(old_button_state){
                    this.button.className = 'on';
                },
                off: function(old_button_state){
                    this.button.className = 'off'
                }
            }
        });
        var view_with_states = new ViewWithStates();
        view_with_states.set('title','new title');
        assert(view_with_states.title.innerHTML == 'new title','View with states responds to set of key with general responder.');
        view_with_states.set('button','off');
        assert(view_with_states.button.className == 'off','View with states responds to set of key with specific responder.');
    }
};