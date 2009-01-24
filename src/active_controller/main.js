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

ActiveController = {};

ActiveController.logging = false;

ActiveController.create = function create(actions,methods)
{
    var klass = function klass(container,params){
        this.container = container || ActiveController.createDefaultContainer();
        this.renderTarget = this.container;
        this.layoutRendered = false;
        if(this.layout && typeof(this.layout.view) === 'function')
        {
            this.layout.view = ActiveSupport.bind(this.layout.view,this);
        }
        this.params = params || {};
        this.scope = new ActiveEvent.ObservableHash({});
        this.initialize();
    };
    ActiveSupport.extend(klass,ClassMethods);
    for(var action_name in actions || {})
    {
        if(typeof(actions[action_name]) == 'function')
        {
            ActiveController.createAction(klass,action_name,actions[action_name]);
        }
        else
        {
            //plain old property
            klass.prototype[action_name] = actions[action_name];
        }
    }
    ActiveSupport.extend(klass.prototype,InstanceMethods);
    ActiveSupport.extend(klass.prototype,methods || {});
    ActiveEvent.extend(klass);
    return klass;
};

ActiveController.createDefaultContainer = function createDefaultContainer()
{
    var global_context = ActiveSupport.getGlobalContext();
    var div = global_context.document.createElement('div');
    if(!global_context.document.body)
    {
        throw Errors.BodyNotAvailable;
    }
    global_context.document.body.appendChild(div);
    return div;
};

ActiveController.createAction = function createAction(klass,action_name,action)
{
    klass.prototype[action_name] = function action_wrapper(){
        this.notify('beforeCall',action_name,this.params);
        if(this.layout && !this.layoutRendered && this.layout.view)
        {
            this.layoutRendered = true;
            this.layout.target = this.container;
            var layout = this.render(this.layout);
            if(layout && layout.renderTarget)
            {
                this.renderTarget = layout.renderTarget;
            }
        }
        ActiveSupport.bind(action,this)();
        this.notify('afterCall',action_name,this.params);
    };
};

var InstanceMethods = {
    initialize: function initialize()
    {
        
    },
    get: function get(key)
    {
        return this.scope.get(key);
    },
    set: function set(key,value)
    {
        return this.scope.set(key,value);
    },
    render: function render(params)
    {
        var args = this.renderArgumentsFromRenderParams(params);
        var response = args.stopped ? null : ActiveView.render.apply(ActiveView,args);
        return response;
    },
    renderArgumentsFromRenderParams: function renderArgumentsFromRenderParams(params)
    {
        if(typeof(params) !== 'object')
        {
            throw Errors.InvalidRenderParams;
        }
        var args = [null,this.renderTarget,this.scope];
        for(var flag_name in params || {})
        {
            if(!RenderFlags[flag_name])
            {
                if(ActiveController.logging)
                {
                    ActiveSupport.log('ActiveController: render() failed with params:',params);
                }
                throw Errors.UnknownRenderFlag + flag_name;
            }
            ActiveSupport.bind(RenderFlags[flag_name],this)(params[flag_name],args);
        }
        return args;
    }
};
ActiveController.InstanceMethods = InstanceMethods;

var RenderFlags = {
    view: function view(view_class,args)
    {
        if(typeof(view_class) === 'string')
        {
            var klass = ActiveSupport.getClass(view_class);
            if(!klass)
            {
                throw Errors.ViewDoesNotExist + view_class;
            }
            args[0] = klass;
        }
        else
        {
            args[0] = view_class;
        }
    },
    text: function text(text,args)
    {
        args[0] = text;
    },
    target: function target(target,args)
    {
        args[1] = target;
    },
    scope: function scope(scope,args)
    {
        args[2] = scope;
    }
};
ActiveController.RenderFlags = RenderFlags;

var ClassMethods = {
    createAction: function wrapAction(action_name,action)
    {
        return ActiveController.createAction(this,action_name,action);
    }
};
ActiveController.ClassMethods = ClassMethods;

var Errors = {
    BodyNotAvailable: 'Controller could not attach to a DOM element, no container was passed and document.body is not available',
    InvalidRenderParams: 'The parameter passed to render() was not an object.',
    UnknownRenderFlag: 'The following render flag does not exist: ',
    ViewDoesNotExist: 'The specified view does not exist: '
};
ActiveController.Errors = Errors;