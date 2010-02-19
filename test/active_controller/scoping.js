ActiveTest.Tests.Controller.scoping = function()
{
    with(ActiveTest)
    {
        TestController = ActiveController.create({
            index: function index(){
                this.set('a',1);
                this.render({
                    view: TestView
                });
                assert(this.get('a') == 3,'view set() persisted to controller');
                this.set('a',4);
                assert(changes_call_count == 3,'controller triggers view binding change()');
            }
        });
        
        var changes_call_count = 0;
        
        TestView = ActiveView.create(function(){
            assert(this.get('a') == 1,'controller set() persisted to view');
            this.set('a',2);
            this.binding.when('a').changes(function(value){
                ++changes_call_count;
            });
            this.set('a',3);
            return this.builder.div();
        });
        
        TestViewFragment = ActiveView.create(function(){
            return div();
        });
        
        TestController.index();
    }
};