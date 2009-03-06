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
    return ActiveView.Builder.div();
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

/**
 * This method is not usually called directly but is utilized by data
 * bindings and ActiveControllers.
 * 
 * This method is normalizes or renders a variety of inputs. Strings or
 * Element objects are returned untouched, ActiveView instances will have
 * their DOM container returned, ActiveView classes will be rendered and
 * the DOM container returned. If a function is passed in it will be called
 * with the passed scope. That function should return a string or Element.
 * 
 * @alias ActiveView.render
 * @param {mixed} content
 * @param {Object} [scope]
 * @return {mixed}
 */
ActiveView.render = function render(content,scope)
{
    if(!scope)
    {
        scope = {};
    }
    
    //if content is a function, that function can return nodes or an ActiveView class or instance
    if(typeof(content) === 'function' && !content.prototype.structure)
    {
        content = content(scope);
    }
    
    if(content && (typeof(content) == 'string' || content.nodeType == 1))
    {
        return content;
    }
    else if(content && content.container && content.container.nodeType == 1)
    {
        //is ActiveView instance
        return content.container;
    }
    else if(content && content.prototype && content.prototype.structure)
    {
        //is ActiveView class
        return new content(scope).container;
    }
    return ActiveSupport.throwError(Errors.InvalidContent);
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