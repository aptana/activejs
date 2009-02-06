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

(function boot(scope){
    var __DIR__ = Jaxer.request.currentFolder + '/app';
    
    Application = {};
    
    function load_all_js_files_in_directory(directory)
    {
        var file_to_load = [];
        Jaxer.Dir.grep(__DIR__ + '/' + directory,{
            pattern: '^.*\.?js$',
            recursive: true
        }).forEach(function directory_iterator(file){
            file_to_load.push(file.path);
        });
        file_to_load.sort();
        for each(file in file_to_load)
        {
            Jaxer.load('file://' + file,scope,'server');
        }
    };
    
    //load lib and config
    load_all_js_files_in_directory('lib');
    Jaxer.load('file://' + __DIR__ + '/config.js',scope,'server');
    
    //setup db
    ActiveRecord.connect();
  
    //put space before initial request in log
    ActiveSupport.log('');
  
    //setup dispatcher
    Application.routes = new ActiveRoutes(Application.Config.routes,scope,{
        classSuffix: 'Controller',
        dispatcher: function dispatcher(route){
            var controller = new this.scope[route.params.object]();
            controller.params = {};
            ActiveSupport.extend(controller.params,ActiveController.Server.parseParams(Jaxer.request.data || {})); //post
            ActiveSupport.extend(controller.params,ActiveController.Server.parseParams(Jaxer.request.parsedUrl.queryParts)); //get
            ActiveSupport.extend(controller.params,route.params);
            //handles request method (GET,PUT,etc) not method name
            if(controller.params._method)
            {
                delete controller.params._method;
            }
            
            if(ActiveController.logging)
            {
                ActiveSupport.log(''); //put space before each request
                ActiveSupport.log('ActiveController: ' + route.params.object + '#' + route.params.method + ' [' + ActiveController.Server.Request.getMethod().toUpperCase() + ' ' + ActiveController.Server.Request.getURI() + '] <params:' + uneval(controller.params) + '>');
            }
            controller[route.params.method]();
        }
    });
    
    //load models and controllers
    load_all_js_files_in_directory('models');
    load_all_js_files_in_directory('controllers');
    
    //dispatch the request
    Application.routes.dispatch(Jaxer.request.uri.substring(Jaxer.request.uri.indexOf('/' + Application.Config.web_root) + (Application.Config.web_root.length + 1)));
})(this);