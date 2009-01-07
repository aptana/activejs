(function boot(scope){  
    Application = {
        root: Jaxer.request.currentFolder + '/app'
    };
    
    function load_all_js_files_in_directory(directory)
    {
        Jaxer.Dir.grep(Application.root + '/' + directory,{
            pattern: '^.*\.?js$',
            recursive: true
        }).forEach(function directory_iterator(file){
            Jaxer.load('file://' + file.path,scope,'server');
        });
    };
    
    //load lib and config
    load_all_js_files_in_directory('lib');
    Jaxer.load('file://' + Application.root + '/config.js',scope,'server');
    
    //setup db
    ActiveRecord.connect();
  
    //setup dispatcher
    Application.routes = new ActiveRoutes(Application.Config.routes,scope,{
        classSuffix: 'Controller',
        dispatcher: function dispatcher(route){
            var controller = new this.scope[route.params.object]();
            controller.params = {};
            ActiveSupport.extend(controller.params,Jaxer.request.data || {}); //post
            ActiveSupport.extend(controller.params,Jaxer.request.parsedUrl.queryParts); //get
            ActiveSupport.extend(controller.params,route.params);
            controller.request = ActiveSupport.clone(Jaxer.request);
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
            controller[route.params.method]();
        }
    });
    
    //load models and controllers
    load_all_js_files_in_directory('models');
    load_all_js_files_in_directory('controllers');
    
    //dispatch the request
    Application.routes.dispatch(Jaxer.request.uri);
})(this);