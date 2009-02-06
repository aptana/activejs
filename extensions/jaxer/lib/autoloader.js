/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * ***** END LICENSE BLOCK ***** */

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
