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

var Binding = function Binding(view)
{
    this.view = view;
};

ActiveSupport.extend(Binding,{
    
});

ActiveSupport.extend(Binding.prototype,{
    update: function update(element)
    {
        return {
            from: ActiveSupport.bind(function from(observe_key)
            {
                var object = this.view.scope;
                if(arguments.length == 2)
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
                    transformation = callback;
                    return {
                        when: when
                    };
                };

                var when = function when(callback)
                {
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
                            element.innerHTML = transformation ? transformation(value) : value;
                        }
                    }
                });
                
                return {
                    transform: transform,
                    when: when
                };
            },this)
        }
    },
    collect: function collect(view)
    {
        /*
        var view = function(){
            var response = view_callback.apply(view_callback,arguments);
            if(typeof(response) == 'string')
            {
                response = document.createTextNode(response);
            }
            return response;
        };
        */
        return {
            from: ActiveSupport.bind(function from(collection)
            {
                if(typeof(collection) == 'string')
                {
                    collection = this.view.scope.get(collection);
                }
                return {
                    into: function into(element)
                    {
                        var collected_elements = [];
                        for(var i = 0; i < collection.length; ++i)
                        {
                            element.insert(view(collection[i]));
                            collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                        }
                        collection.observe('pop',function pop_observer(){
                            collected_elements[collected_elements.length - 1].parentNode.removeChild(collected_elements[collected_elements.length - 1]);
                            collected_elements.pop();
                        });
                        collection.observe('push',function push_observer(item){
                            element.insert(view(item));
                            collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                        });
                        collection.observe('unshift',function unshift_observer(item){
                            element.insert({top: view(item)});
                            collected_elements.unshift(element.firstChild);
                        });
                        collection.observe('shift',function shift_observer(){
                            element.removeChild(element.firstChild);
                            collected_elements.shift(element.firstChild);
                        });
                        collection.observe('splice',function splice_observer(index,to_remove){
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
                                var item = view(children[i]);
                                if(index == 0 && i == 0)
                                {
                                    element.insert({top: item});
                                    children[i] = element.firstChild;
                                }
                                else
                                {
                                    element.insertBefore(typeof(item) == 'string' ? document.createTextNode(item) : item,element.childNodes[index + i]);
                                    children[i] = element.childNodes[i + 1];
                                }
                            }
                            collected_elements.splice.apply(collected_elements,[index,to_remove].concat(children));
                        });
                    }
                };
            },this)
        };
    }
});
