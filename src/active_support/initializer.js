/**
 * class ActiveSupport.Initializer
 * Several asynchronous events occur in an ActiveJS application before
 * your application is ready to use. The initializer ensures that ActiveRoutes
 * and ActiveRecord are configured appropriately and that these events occur
 * in the correct order. Specifically the initializer will:
 * 
 * - observe the document 'ready' event provided by DOM
 * - connect ActiveRecord to a data source
 * - configure ActiveView.Routing
 * 
 *     new ActiveSupport.Initializer({
 *         database: 'path/to/db.json',
 *         routes: function(){
 *             return {
 *                 '/': [MyApp.ViewOne,'index'],
 *                 '/about': [MyApp.ViewTwo,'about']
 *             };
 *         },
 *         initialRoute: '/',
 *         callback: function(){
 *             MyApp.setup();
 *         }
 *     });
 *     
 **/
 
/**
 * new ActiveSupport.Initializer(options)
 * - options (Object)
 * 
 * The options hash can contain:
 * 
 * - database (String | Array): URL of a JSON database to load, or an array of arguments to [[ActiveRecord.connect]]
 * - routes (Object | Function): A hash of routes, or a function that returns one. Usually a function is needed as the objects that will be routed to are not available when the initializer is loaded.
 * - initialRoute (String): The route to be called when the app starts. Defaults to false.
 * - callback (Function): The function to be called when the initializer has completed.
 **/
 
/**
 * ActiveSupport.Initializer#initialized -> Boolean
 **/
ActiveSupport.Initializer = function Initializer(params)
{
    this.initialRoute = params.initialRoute || false;
    this.database = params.database;
    this.routes = params.routes;
    this.callback = params.callback || function(){};
    this.initialized = false;
    this.queue = new ActiveSupport.CallbackQueue(this.setRoutes,this);
    if(this.database)
    {
        ActiveRecord.observe('ready',this.queue.push());
        if(typeof(this.database) == 'string' || (typeof(this.database) == 'object' && !ActiveSupport.Object.isArray(this.database)))
        {
            ActiveRecord.connect(this.database);
        }
        else if(ActiveSupport.Object.isArray(this.database))
        {
            ActiveRecord.connect.apply(ActiveRecord,this.database);
        }
        else
        {
            ActiveRecord.connect();
        }
    }
    if(this.initialRoute)
    {
        ActiveRoutes.observe('initialDispatchFailed',function(){
          ActiveRoutes.dispatch(this.initialRoute);
        },this);
    }
    DOM.observe(document,'ready',this.queue.push());
};

ActiveSupport.Initializer.prototype.setRoutes = function setRoutes()
{
    if(this.routes)
    {
        ActiveRoutes.observe('ready',this.onComplete,this);
        ActiveRoutes.setRoutes((typeof(this.routes) == 'function') ? this.routes() : this.routes);
    }
    else
    {
        this.onComplete();
    }
};

ActiveSupport.Initializer.prototype.onComplete = function onComplete()
{
    this.initialized = true;
    this.callback();
};