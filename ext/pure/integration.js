(function(){
	var global_context = ActiveSupport.getGlobalContext();
	var pure = global_context.pure;
	
	ActiveController.InstanceMethods.compile = function compile(source_element,name,directives)
	{
		return pure.libs.compile(source_element,name,directives,this.toObject());
	};
	
	ActiveController.InstanceMethods.directive = function directive(source_element,directives)
	{
		return pure.libs.mapDirective(source_element,directives);
	};
	
	ActiveController.InstanceMethods.render = ActiveSupport.wrap(ActiveController.InstanceMethods.render,function pure_render(proceed,source_element,target,clear){
		if(content && content.nodeType == 1 && target && target.nodeType == 1 && typeof(clear) === 'object')
		{
			var directives = clear;
			return pure.libs.render(target,this.toObject(),directives,source_element,(typeof(directives) == 'undefined' || !directives));
		}
		else
		{
			return proceed(source_element,target,clear);
		}
	});
})();