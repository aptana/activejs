RestController = {
    create: function create(model_name,actions,methods)
    {
        var underscore_model_name = model_name.replace(/([a-z])([A-Z])/,function(){
            return args[1] + '_' + args[2].toLowerCase();
        }).toLowerCase();
        Application.routes.addRoute('/' + underscore_model_name + '/:id',{
            object: model_name,
            method: 'rest_dispatcher'
        });
        var model = ActiveSupport.getClass(model_name);
        return ActiveController.create(ActiveSupport.extend({
            rest_dispatcher: function rest_dispatcher()
            {
                switch(this.request.method)
                {
                    case 'get': return this.params.id ? this.show() : this.list();
                    case 'post': return this.create();
                    case 'put': return this.update();
                    case 'delete': return this.destroy();
                }
            },
            //
            list: function list()
            {
                this.render({
                    json: model.find()
                });
            },
            create: function create()
            {
                model.create(this.params[underscore_model_name]);
                this.head('ok');
            },
            update: function update()
            {
                var instance = model.find(this.params.id);
                instance.updateAttributes(this.params[underscore_model_name]);
                this.head('ok');
            },
            show: function show()
            {
                var instance = model.find(this.params.id);
                this.render({
                    json: instance
                });
            },
            destroy: function destroy()
            {
                var instance = model.find(this.params.id);
                instance.destroy();
                this.head('ok');
            }
        },actions || {}),methods || {});
    }
};