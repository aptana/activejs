ActiveTest.Tests.View.aspect = function()
{
    with(ActiveTest)
    {
        var ParentView = ActiveView.create(function(builder,dom){
		  this.set('a','1');
          this.textNode = builder.span();
          this.setText(this.get('value'));
		  this.notify('parent_event','a');
          return this.textNode;
        },{
          setText: function(text){
            this.notify('text',text);
            this.textNode.innerHTML = text;
          },
          getText: function(){
            return this.textNode.innerHTML;
          },
		  parentTrigger: function(){
			this.notify('parent_trigger_event','a');
		  }
        });
		ParentView.className = 'ParentView.Class';
		ParentView.prototype.className = 'ParentView.Instnace';
        var ChildView = ActiveView.create(ParentView,function(parent_element,builder,dom){
	      this.set('b',2);
          dom.addClassName(parent_element,'added');
		  this.notify('child_event','b');
          return parent_element;
        },{
	      childTrigger: function(){
		    this.notify('child_trigger_event','b');
	      }
        });
		ChildView.className = 'ChildView.Class';
		ChildView.prototype.className = 'ChildView.Instnace';
		
		var child = new ChildView({value:'test'});
		assert(child.get('a') == 1 && child.get('b') == 2,'View aspects, scope cascades to child.');
		document.body.appendChild(child.getElement());
        assert(child.getText() == 'test' && child.textNode.className == 'added','Basic aspect logic working.');
        ActiveSupport.Element.remove(child.getElement());
		
		var notify_arg_from_parent;
		var notify_arg_from_child;
		var trigger_count = 0;
		child.observe('parent_trigger_event',function(){
		  ++trigger_count;
          notify_arg_from_parent = arguments[0];
		});
		child.observe('child_trigger_event',function(){
	      ++trigger_count;
          notify_arg_from_child = arguments[0];
		});
		child.parentTrigger();
		child.childTrigger();
		assert(trigger_count == 2 && notify_arg_from_parent == 'a' && notify_arg_from_child == 'b','Instance events inherited and triggered properly.');
		
		notify_arg_from_parent = false;
		notify_arg_from_child = false;
		ChildView.observe('parent_event',function(){
		  ++trigger_count;
          notify_arg_from_parent = arguments[1];
		});
		ChildView.observe('child_event',function(){
		  ++trigger_count;
          notify_arg_from_child = arguments[1];
		});
		new ChildView({value: 'test'});
		assert(trigger_count == 4 && notify_arg_from_parent == 'a' && notify_arg_from_child == 'b','Class events triggered properly.');
		
		var notify_arg_from_parent_class;
		notify_arg_from_parent = false;
		notify_arg_from_child = false;
		ParentView.observe('parent_event',function(){
		  ++trigger_count;
          notify_arg_from_parent_class = arguments[1];
		});
		new ChildView({value: 'test'});
		assert(trigger_count == 7 && notify_arg_from_parent_class == 'a' && notify_arg_from_parent == 'a' && notify_arg_from_child == 'b','Event registered on parent class cascades to child.');
		
		notify_arg_from_parent_class = false;
		notify_arg_from_parent = false;
		notify_arg_from_child = false;
		ChildView.stopObserving('parent_event');
		new ChildView({value: 'test'});
		assert(trigger_count == 8 && notify_arg_from_parent_class == false && notify_arg_from_parent == false && notify_arg_from_child == 'b','stopObserving on child unregisters all including cascaded observer (continues)');
		new ParentView({value: 'test'});
		assert(trigger_count == 9 && notify_arg_from_parent_class == 'a','(continued) but does not unregister parent observer');
    }
};