/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
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

ActiveView.create = function create(structure,methods)
{
    if(typeof(options) == 'function')
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
    return document.createElement('div');
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
    if(!execute)
    {
        execute = function render_execute(target,content)
        {
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
    else if(content && content.nodeType == 1)
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
        throw Errors.InvalidContent;
    }
};

var InstanceMethods = {
    initialize: function initialize(scope,parent)
    {
        this.parent = parent;
        this.scope = scope || {};
        if(!this.scope.get || typeof(this.scope.get) != 'function')
        {
            this.scope = new ObservableHash(this.scope);
        }
        this.builder = ActiveView.Builder;
		ActiveView.generateBinding(this);
        for(var key in this.scope._object)
        {
            if((this.scope._object[key] != null && typeof this.scope._object[key] == "object" && 'splice' in this.scope._object[key] && 'join' in this.scope._object[key]) && !this.scope._object[key].observe)
            {
                ActiveView.makeArrayObservable(this.scope._object[key]);
            }
        }
        this.container = this.structure();
        for(var key in this.scope._object)
        {
            this.scope.set(key,this.scope._object[key]);
        }
    },
    get: function get(key)
    {
        this.notify('get',key);
        return this.scope.get(key);
    },
    set: function set(key,value)
    {
        var response = this.scope.set(key,value);
        this.notify('set',key,value);
        return response;
    },
    registerEventHandler: function registerEventHandler(element,event_name,observer)
    {
      this.eventHandlers.push([element,event_name,observer]);
    }
};

var ClassMethods = {

};