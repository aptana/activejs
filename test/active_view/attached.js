ActiveTest.Tests.View.attached = function()
{
    with(ActiveTest)
    {
        var ParentView = ActiveView.create(function(builder,dom){
          return builder.span();
        });
        ParentView.className = 'ParentView.Class';
        ParentView.prototype.className = 'ParentView.Instnace';
        var ChildView = ActiveView.create(ParentView,function(parent_element,builder,dom){
          return parent_element;
        });
        ChildView.className = 'ChildView.Class';
        ChildView.prototype.className = 'ChildView.Instnace';

        var trigger_count = 0;
        ParentView.observe('attached',function(){
          ++trigger_count;
        });
        var parent_instance = new ParentView();
        parent_instance.observe('attached',function(){
          ++trigger_count;
        });
        document.body.appendChild(parent_instance.getElement());
        parent_instance.observe('attached',function(){
          ++trigger_count;
        });
        //observing "attached" immediately after inserting will syncrhonusly trigger other observers that had been delayed
        ActiveSupport.Element.remove(parent_instance.getElement());
        assert(trigger_count == 3,'Attached event firing on class, instance and after attached.');

        child_instance = new ChildView();
        document.body.appendChild(child_instance.getElement());
        child_instance.observe('attached',function(){
          ++trigger_count;
        });
        assert(trigger_count == 5,'attached event cascades to child class.');

    }
};