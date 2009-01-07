(function(scope){
  var find_class = function find_class(directory,class_name)
  {
    return Jaxer.Dir.map(directory,{
      pattern: '^' + class_name + '\.js$',
      recursive: true
    },function file_iterator(file){
      return file.path;
    })[0];
  };
  
  var file_name_for_class_name = function file_name_for_class_name(class_name)
  {
    var file = false;
    ['models','views','controllers'].forEach(function directory_iterator(directory){
      if(!file)
      {
        var path = Jaxer.Dir.resolve(Jaxer.Dir.combine(Application.root,directory));
        file = find_class(path,class_name) || find_class(path,class_name.replace(/[a-z][A-Z]/g,function to_underscore(match){
          return match[0] + '_' + match[1].toLowerCase();
        }).toLowerCase());
      }
    });
    return file;
  };
  
  window.__noSuchMethod__ = function(class_name,args)
  {
    var file = file_name_for_class_name(class_name);
    if(!file)
    {
      throw "Autoloader could not find a file for the class: " + class_name;
    }
    Jaxer.Log.log('Autoloader loaded:' + file);
    Jaxer.load('file://' + file,scope,'server');
    var argument_names = ['_' + i for (i in args)].join(",");
    return Function.constructor.apply(null,[argument_names,"return new " + class_name + "(" + argument_names + ");"]).apply(null,args);
  };
})(this);
