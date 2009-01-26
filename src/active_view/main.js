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

ActiveView = {};

ActiveView.logging = false;

ActiveView.create = function create(structure,methods)
{
    if(typeof(options) === 'function')
    {
        options = {
            structure: options
        };
    }
    var klass = function klass(){
        this.initialize.apply(this,arguments);
    };
    ActiveSupport.extend(klass,ClassMethods);
    ActiveSupport.extend(klass.prototype,methods || {});
    ActiveSupport.extend(klass.prototype,InstanceMethods);
    klass.prototype.structure = structure || ActiveView.defaultStructure;
    ActiveEvent.extend(klass);
    return klass;
};

ActiveView.defaultStructure = function defaultStructure()
{
    return ActiveSupport.getGlobalContext().document.createElement('div');
};

ActiveView.makeArrayObservable = function makeArrayObservable(array)
{
    ActiveEvent.extend(array);
    array.makeObservable('shift');
    array.makeObservable('unshift');
    array.makeObservable('pop');
    array.makeObservable('push');
    array.makeObservable('splice');
};

ActiveView.render = function render(content,target,scope,clear,execute)
{
    if(content && typeof(content) == 'object' && 'length' in content && 'splice' in content && 'join' in content)
    {
        var responses = [];
        for(var i = 0; i < content.length; ++i)
        {
            responses.push(ActiveView.render(content[i],target,scope,clear,execute));
        }
        return responses;
    }
    else
    {
        if(!execute)
        {
            execute = function render_execute(target,content)
            {
                if(!content)
                {
                    return ActiveSupport.throwError(Errors.InvalidContent);
                }
                target.appendChild(content);
            };
        }
        if(typeof(content) === 'function' && !content.prototype.structure)
        {
            content = content(scope);
        }
        if(clear !== false)
        {
            target.innerHTML = '';
        }
        if(typeof(content) === 'string')
        {
            target.innerHTML = content;
            return content;
        }
        else if(content && content.nodeType === 1)
        {
            execute(target,content);
            return content;
        }
        else if(content && content.container)
        {
          //is ActiveView instance
          execute(target,content.container);
          return view;
        }
        else if(content && content.prototype && content.prototype.structure)
        {
            //is ActiveView class
            var view = new content(scope);
            execute(target,view.container);
            return view;
        }
        else
        {
            return ActiveSupport.throwError(Errors.InvalidContent);
        }
    }
};

var InstanceMethods = {
    initialize: function initialize(scope,parent)
    {
        this.parent = parent;
        this.setupScope(scope);
        if(ActiveView.logging)
        {
            ActiveSupport.log('ActiveView: initialized with scope:',scope);
        }
        this.builder = ActiveView.Builder;
        ActiveView.generateBinding(this);
        this.container = this.structure();
        if(!this.container || !this.container.nodeType || this.container.nodeType !== 1)
        {
            return ActiveSupport.throwError(Errors.ViewDoesNotReturnContainer,typeof(this.container),this.container);
        }
        for(var key in this.scope._object)
        {
            this.scope.set(key,this.scope._object[key]);
        }
    },
    setupScope: function setupScope(scope)
    {
        this.scope = (scope ? (scope.toObject ? scope : new ActiveEvent.ObservableHash(scope)) : new ActiveEvent.ObservableHash({}));
        for(var key in this.scope._object)
        {
            var item = this.scope._object[key];
            if((item !== null && typeof item === "object" && 'splice' in item && 'join' in item) && !item.observe)
            {
                ActiveView.makeArrayObservable(item);
            }
        }
    },
    get: function get(key)
    {
        return this.scope.get(key);
    },
    set: function set(key,value)
    {
        if((value !== null && typeof value === "object" && 'splice' in value && 'join' in value) && !value.observe)
        {
            ActiveView.makeArrayObservable(value);
        }
        return this.scope.set(key,value);
    },
    registerEventHandler: function registerEventHandler(element,event_name,observer)
    {
      this.eventHandlers.push([element,event_name,observer]);
    }
};

var ClassMethods = {

};

var Errors = {
    ViewDoesNotReturnContainer: ActiveSupport.createError('The view constructor must return a DOM element. Returned: '),
    InvalidContent: ActiveSupport.createError('The content to render was not a string, DOM element or ActiveView.'),
    MismatchedArguments: ActiveSupport.createError('Incorrect argument type passed: ')
};