ExampleLayout = ActiveView.create(function(builder,dom){
  document.title = 'ActiveJS Example: ' + this.get('title');
  var element = builder.div(
    builder.div({id:'nav'},
      builder.a({id:'return',href:'http://activejs.org/'},'Return to ActiveJS Home'),
      builder.h1(this.get('title'),
        ' ',
        builder.span('Uses: ',
          builder.b(this.generateComponentLinks())
        )
      )
    ),
    builder.div({id:'example_container'}),
    builder.pre({className:'highlighted'},
      this.codeContainer = builder.code({className:'javascript',id:'source_code_display'})
    )
  );
  this.codeContainer.innerHTML = document.getElementById('source_code').innerHTML;
  return element;
},{
  generateComponentLinks: function(){
    var builder = ActiveView.Builder;
    var elements = [];
    for(var i = 0; i < this.get('uses').length; ++i){
      var component = this.get('uses')[i];
      if(component.match(/^Active/)){
        elements.push(builder.a({href:'http://activejs.org/' + component.toLowerCase() + '/'},component));
        elements.push(' ');
      }else{
        elements.push(component);
      }
    }
    return elements;
  }
});
ActiveSupport.Element.observe(document,'ready',function(){
  dp.sh.HighlightAll('javascript',false,false,false,true,false);
});