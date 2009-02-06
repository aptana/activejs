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

RestController = {
    underscoreString: function underscoreString(string)
    {
        return string.replace(/([a-z])([A-Z])/,function(){
            return arguments[1] + '_' + arguments[2].toLowerCase();
        }).toLowerCase()
    },
    create: function create(model_name,actions,methods)
    {
        var underscore_model_name = RestController.underscoreString(model_name);
        var route_string = Application.Config.rest_prefix + '/' + underscore_model_name + '/:id';
        Application.routes.addRoute(route_string,{
            object: model_name + 'Rest',
            method: 'rest_dispatcher'
        });
        RestController.Introspection.addServiceDescription({
            controller_name: model_name + 'Rest' + 'Controller',
            model_name: model_name,
            post_param_name: underscore_model_name,
            route: route_string
        });
        var model = ActiveSupport.getClass(model_name);
        return ActiveController.create(ActiveSupport.extend({
            rest_dispatcher: function rest_dispatcher()
            {
                if(ActiveController.Server.Environment.isProduction() && 'describe' in this.params)
                {
                    this.describe();
                }
                else
                {
                    switch(ActiveController.Server.Request.getMethod())
                    {
                        case 'get': return this.params.id ? this.show() : this.list();
                        case 'post': return this.create();
                        case 'put': return this.update();
                        case 'delete': return this.destroy();
                    }
                }
            }
        },actions || {}),ActiveSupport.extend({
            list: function list()
            {
                var items = model.find({
                    all: true
                });
                if(this.request.extension == 'xml')
                {
                    this.render({
                        xml: items,
                        status: 200
                    });
                }
                else
                {
                    this.render({
                        json: items,
                        status: 200
                    });
                }
            },
            create: function create()
            {
                var instance = model.create(this.params[underscore_model_name]);
                this.renderInstance(instance);
            },
            update: function update()
            {
                var instance = model.find(this.params.id);
                instance.updateAttributes(this.params[underscore_model_name]);
                this.renderInstance(instance);
            },
            show: function show()
            {
                var instance = model.find(this.params.id);
                this.renderInstance(instance);
            },
            destroy: function destroy()
            {
                var instance = model.find(this.params.id);
                instance.destroy();
                this.head('ok');
            },
            renderInstance: function renderInstance(instance)
            {
                if(this.request.extension == 'xml')
                {
                    this.render({
                        xml: instance,
                        status: 200
                    });
                }
                else
                {
                    this.render({
                        json: instance,
                        status: 200
                    });
                }
            },
            describe: function describe()
            {
                this.render({
                    html: RestController.Introspection.getServiceDescription()
                });
            }
        },methods || {}));
    }
};

RestController.Introspection = {
    serviceDescription: [],
    /*
        accepts:
            controller_name: String
            model_name: String,
            post_param_name: String,
            route: String
            methods: ['list','create','update','show','destroy'],
            formats: ['json','xml'],
            sample_record: record
    */
    addServiceDescription: function addServiceDescription(description)
    {
        if(!description.methods)
        {
            description.methods = ['list','create','update','show','destroy'];
        }
        if(!description.formats)
        {
            description.formats = ['json','xml'];
        }
        RestController.Introspection.serviceDescription.push(description);
    },
    getServiceDescription: function getServiceDescription()
    {
        function json_string_from_object(controller_method,model_name,object)
        {
            var json = object.toJSON ? object.toJSON() : ActiveSupport.JSONFromObject(object);
            var response = json.replace(/,/g,',\n    ').replace(/^\{/,"{\n    ").replace(/\}$/,"\n}");
            return modify_response_for_method(controller_method,'json',model_name,response);
        };
        function xml_string_from_object(controller_method,model_name,object)
        {
            var xml = object.toXML ? object.toXML() : ActiveSupport.XMLFromObject(model_name,object);
            return modify_response_for_method(controller_method,'xml',model_name,xml).replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
        };
        function modify_response_for_method(controller_method,format,model_name,response){
            if(controller_method == 'list')
            {
                var pluralized = RestController.underscoreString(ActiveSupport.Inflector.pluralize(model_name)).toLowerCase();
                if(format == 'xml')
                {
                    response = '<' + pluralized + ">\n    " + response.replace(/\n(\s|\<)/g,function(){return "\n    " + arguments[1];}) + "\n</" + pluralized + '>';
                }
                else
                {
                    response = '{"' + pluralized + '":[' + response + ']}';
                }
                return response;
            }
            else
            {
                return response;
            }
        };
        var method_mapping = {
            list: 'GET',
            show: 'GET',
            create: 'POST',
            update: 'PUT',
            destroy: 'DELETE'
        };
        var output = '<h2>REST Service API</h2><table cellpadding="5" border="1"><tr><th>Model</th><th>Called Method</th><th>HTTP Method</th><th>URI</th><th>POST/PUT Key</th><th>Response Format</th></tr>';
        for(var i = 0; i < RestController.Introspection.serviceDescription.length; ++i)
        {
            var description = RestController.Introspection.serviceDescription[i];
            for(var m = 0; m < description.methods.length; ++m)
            {
                var controller_method = description.methods[m];
                var sample_record = description.sample_record || ActiveRecord.Models[description.model_name].build();
                for(var f = 0; f < description.formats.length; ++f)
                {
                    if(controller_method == 'show' || controller_method == 'create' || controller_method == 'update' || controller_method == 'list')
                    {
                        sample_record.set('id','');
                    }
                    var format = description.formats[f];
                    output += '<tr><td>' + [
                        description.model_name,
                        description.controller_name + '.' + controller_method,
                        method_mapping[controller_method],
                        (controller_method == 'list' ? description.route.replace(/\/\:id$/,'') : description.route) + '.' + format,
                        controller_method == 'create' || controller_method == 'update' ? description.post_param_name : '[NONE]',
                        '<pre>' + (controller_method == 'destroy' ? 'HEAD (OK)' : (format == 'json'
                            ? json_string_from_object(controller_method,description.model_name,sample_record)
                            : xml_string_from_object(controller_method,description.model_name,sample_record)
                        )) + '</pre>'
                    ].join('</td><td>') + '</td></tr>';
                }
            }
        }
        return output + '</table>';
    }
};