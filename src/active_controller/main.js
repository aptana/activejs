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

/**
 * @namespace {ActiveController}
 * @example
 * 
 * ActiveController.js
 * ===============
 * Tutorial coming soon.
 */
ActiveController = {};

ActiveController.logging = false;

ActiveController.create = function create(actions,methods)
{
    var klass = function klass(container,parent,params){
        this.container = container;
        this.setRenderTarget(this.container);
        this.parent = parent;
        this.children = [];
        this.history = ActiveSupport.clone(ActiveController.History);
        this.history.callActionAtIndex = ActiveSupport.bind(this.history.callActionAtIndex,this);
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
    var div = ActiveView.Builder.div();
    if(!global_context.document.body)
    {
        return ActiveSupport.throwError(Errors.BodyNotAvailable);
    }
    global_context.document.body.appendChild(div);
    return div;
};

ActiveController.createAction = function createAction(klass,action_name,action)
{
    klass.prototype[action_name] = function action_wrapper(){
        if(arguments[0] && typeof(arguments[0]) == 'object')
        {
            this.params = arguments[0];
        }
        this.notify('beforeCall',action_name,this.params);
        this.renderLayout();
        ActiveSupport.bind(action,this)();
        this.history.history.push([action_name,this.params]);
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
        if(typeof(params) !== 'object')
        {
            return ActiveSupport.throwError(Errors.InvalidRenderParams);
        }
        for(var flag_name in params || {})
        {
            if(!RenderFlags[flag_name])
            {
                if(ActiveController.logging)
                {
                    ActiveSupport.log('ActiveController: render() failed with params:',params);
                }
                return ActiveSupport.throwError(Errors.UnknownRenderFlag,flag_name);
            }
            ActiveSupport.bind(RenderFlags[flag_name],this)(params[flag_name],params);
        }
        return params;
    },
    getRenderTarget: function getRenderTarget()
    {
        return this.renderTarget;
    },
    setRenderTarget: function setRenderTarget(target)
    {
        this.renderTarget = target;
    },
    renderLayout: function renderLayout()
    {
        if(this.layout && !this.layoutRendered && typeof(this.layout) == 'function')
        {
            this.layoutRendered = true;
            this.container.innerHtml = '';
            this.container.appendChild(this.layout.bind(this)());
        }
    }
};
ActiveController.InstanceMethods = InstanceMethods;

var RenderFlags = {
    view: function view(view_class,params)
    {
        if(typeof(view_class) === 'string')
        {
            var klass = ActiveSupport.getClass(view_class);
            if(!klass)
            {
                return ActiveSupport.throwError(Errors.ViewDoesNotExist,view_class);
            }
        }
        else
        {
            klass = view_class;
        }
        var response = ActiveView.render(klass,params.scope || this.scope);
        var container = params.target || this.getRenderTarget();
        if(container)
        {
            container.innerHTML = '';
            container.appendChild(response);
        }
    },
    text: function text(text,params)
    {
        var container = params.target || this.getRenderTarget();
        if(container)
        {
            container.innerHTML = text;
        }
    },
    target: function target(target,params)
    {
        //target only available for text + view, needs no processing
    },
    scope: function scope(scope,params)
    {
        //scope only available for text + view, needs no processing
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
    BodyNotAvailable: ActiveSupport.createError('Controller could not attach to a DOM element, no container was passed and document.body is not available'),
    InvalidRenderParams: ActiveSupport.createError('The parameter passed to render() was not an object.'),
    UnknownRenderFlag: ActiveSupport.createError('The following render flag does not exist: '),
    ViewDoesNotExist: ActiveSupport.createError('The specified view does not exist: ')
};
ActiveController.Errors = Errors;