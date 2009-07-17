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

ActiveView.generateBinding = function generateBinding(instance)
{
    instance.binding = {};
    instance.binding.update = function update(element)
    {
        if(!element || !element.nodeType === 1)
        {
            return ActiveSupport.throwError(Errors.MismatchedArguments,'expected Element, recieved ',typeof(element),element);
        }
        return {
            from: function from(observe_key)
            {
                var object = instance.scope;
                if(arguments.length === 2)
                {
                    object = arguments[1];
                    observe_key = arguments[2];
                }
                
                var transformation = null;
                var condition = function default_condition(){
                    return true;
                };
                
                var transform = function transform(callback)
                {
                    if(!callback || typeof(callback) !== 'function')
                    {
                        return ActiveSupport.throwError(Errors.MismatchedArguments,'expected Function, recieved ',typeof(callback),callback);
                    }
                    transformation = callback;
                    return {
                        when: when
                    };
                };

                var when = function when(callback)
                {
                    if(!callback || typeof(callback) !== 'function')
                    {
                        return ActiveSupport.throwError(Errors.MismatchedArguments,'expected Function, recieved ',typeof(callback),callback);
                    }
                    condition = callback;
                    return {
                        transform: transform
                    };
                };

                object.observe('set',function update_from_observer(set_key,value){
                    if(observe_key == set_key)
                    {
                        if(condition())
                        {
                            ActiveView.clearNode(element);
                            element.appendChild(ActiveSupport.getGlobalContext().document.createTextNode(transformation ? transformation(value) : value));
                        }
                    }
                });
                
                return {
                    transform: transform,
                    when: when
                };
            }
        };
    };

    instance.binding.collect = function collect(view)
    {
        if(!view)
        {
            return ActiveSupport.throwError(Errors.MismatchedArguments,'expected string, ActiveView class or function, recieved ',typeof(view),view);
        }
        return {
            from: function from(collection)
            {
                if(!collection || (typeof(collection) !== 'object' && typeof(collection) !== 'string'))
                {
                    return ActiveSupport.throwError(Errors.MismatchedArguments,'expected array, recieved ',typeof(collection),collection);
                }
                return {
                    into: function into(element)
                    {
                        if(!element || !element.nodeType === 1)
                        {
                            return ActiveSupport.throwError(Errors.MismatchedArguments,'expected Element, recieved ',typeof(element),element);
                        }
                        //if a string is passed make sure that the view is re-built when the key is set
                        if(typeof(collection) === 'string')
                        {
                            var collection_name = collection;
                            instance.scope.observe('set',function collection_key_change_observer(key,value){
                                if(key == collection_name)
                                {
                                    ActiveView.clearNode(element);
                                    instance.binding.collect(view).from(value).into(element);
                                }
                            });
                        }
                        else
                        {
                            //loop over the collection when it is passed in to build the view the first time
                            var collected_elements = [];
                            for(var i = 0; i < collection.length; ++i)
                            {
                                var generated_element = ActiveView.render(view,collection[i]);
                                element.appendChild(generated_element);
                                collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                            }
                            //these handlers will add or remove elements from the view as the collection changes
                            if(collection.observe)
                            {
                                collection.observe('pop',function pop_observer(){
                                    collected_elements[collected_elements.length - 1].parentNode.removeChild(collected_elements[collected_elements.length - 1]);
                                    collected_elements.pop();
                                });
                                collection.observe('push',function push_observer(item){
                                    var generated_element = ActiveView.render(view,item);
                                    element.appendChild(generated_element);
                                    collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                                });
                                collection.observe('unshift',function unshift_observer(item){
                                    var generated_element = ActiveView.render(view,item);
                                    element.insertBefore(generated_element,element.firstChild);
                                    collected_elements.unshift(element.firstChild);
                                });
                                collection.observe('shift',function shift_observer(){
                                    element.removeChild(element.firstChild);
                                    collected_elements.shift(element.firstChild);
                                });
                                collection.observe('splice',function splice_observer(index,to_remove){
                                    var global_context = ActiveSupport.getGlobalContext();
                                    var children = [];
                                    var i;
                                    for(i = 2; i < arguments.length; ++i)
                                    {
                                        children.push(arguments[i]);
                                    }
                                    if(to_remove)
                                    {
                                        for(i = index; i < (index + to_remove); ++i)
                                        {
                                            collected_elements[i].parentNode.removeChild(collected_elements[i]);
                                        }
                                    }
                                    for(i = 0; i < children.length; ++i)
                                    {
                                        var generated_element = ActiveView.render(view,children[i]);
                                        element.insertBefore((typeof(generated_element) === 'string'
                                            ? global_context.document.createTextNode(generated_element)
                                            : generated_element
                                        ),element.childNodes[index + i]);
                                        children[i] = element.childNodes[index + i];
                                    }
                                    collected_elements.splice.apply(collected_elements,[index,to_remove].concat(children));
                                });
                            }
                        }
                    }
                };
            }
        };
    };

    instance.binding.when = function when(outer_key)
    {
        var outer_keys;
        if(arguments.length > 1)
        {
            outer_keys = ActiveSupport.arrayFrom(arguments);
        }
        else if(ActiveSupport.isArray(outer_key))
        {
            outer_keys = outer_key;
        }
        else
        {
            outer_keys = [outer_key];
        }
        return {
            changes: function changes(callback)
            {
                if(!callback || typeof(callback) !== 'function')
                {
                    return ActiveSupport.throwError(Errors.MismatchedArguments,'expected Function, recieved ',typeof(callback),callback);
                }
                instance.scope.observe('set',function changes_observer(inner_key,value){
                    for(var i = 0; i < outer_keys.length; ++i)
                    {
                        if(outer_keys[i] == inner_key)
                        {
                            callback(value);
                        }
                    }
                });
            }
        };
    };
};