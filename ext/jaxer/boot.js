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
            ActiveSupport.extend(controller.params,ActiveController.parseParams(Jaxer.request.data || {})); //post
            ActiveSupport.extend(controller.params,ActiveController.parseParams(Jaxer.request.parsedUrl.queryParts)); //get
            ActiveSupport.extend(controller.params,route.params);
            controller.request = Jaxer.request;
            //handles request method (GET,PUT,etc) not method name
            if(controller.params._method)
            {
                controller.request.method = controller.params._method.toLowerCase();
                delete controller.params._method;
            }
            else
            {
                controller.request.method = controller.request.action.toLowerCase();
            }
            controller.request.extension = route.extension;
            
            if(ActiveController.logging)
            {
                ActiveSupport.log(''); //put space before each request
                ActiveSupport.log('ActiveController: ' + route.params.object + '#' + route.params.method + ' [' + controller.request.method.toUpperCase() + ' ' + Jaxer.request.uri + '] <params:' + uneval(controller.params) + '>');
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