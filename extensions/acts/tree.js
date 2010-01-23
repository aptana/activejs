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
 
/*
    
    Category = ActiveRecord.define('categories',{
        parent_id: 0
    });
    Category.actsAsTree();
    
    var felines = Category.create({name: 'Felines',parent_id: 0});
    var tigers = felines.createChild({name: 'Tigers'});
    var kitties = felinescreateChild({name: 'Kitties'});

    var tiger_jr = kitties.createChild({name: 'Tiger Jr.'});
    var grey_kitty = kitties.createChild({name: 'That Grey One'});
    
    grey_kitty.getParent() == kitties;
    grey_kitty.getRoot() == felines;
    
    grey_kitty.getSiblings().length == 1;
    
    var jasper = kitties.createChild({name: 'Jasper'});
    
    grey_kitty.getSiblings().length == 2;
    
    grey_kitty.getAllParents() == [kitties,felines];
    
    felines.getAllChildren() //contains all records in example except felines
    
    //  categories now looks like this:
    //  ---------------------------------------------
    //  | id          | parent_id | name            |
    //  ---------------------------------------------
    //  | 1           | 0         | Felines         |
    //  | 2           | 1         | Tigers          |
    //  | 3           | 1         | Kitties         |
    //  | 4           | 3         | Tiger Jr.       |
    //  | 5           | 3         | That Grey One   |
    //  | 6           | 3         | Jasper          |
    //  --------------------------------------------|
*/

(function(){
    
    var ActsAsTree = {};
    
    ActiveRecord.ClassMethods.actsAsTree = function actsAsTree(params)
    {
        params = ActiveSupport.extend({
            parent: 'parent_id',
            where: {},
            order: ''
        },params || {});
        
        this.belongsTo(this.modelName,{
            foreignKey: params.parent,
            name: 'parent'
        });
        this.hasMany(this.modelName,{
            foreignKey: params.parent,
            dependent: true,
            order: params.order,
            name: 'child'
        });
        
        for(var method_name in ActsAsTree.ClassMethods)
        {
            this[method_name] = ActiveSupport.curry(ActsAsTree.ClassMethods[method_name],params);
        }
        
        for(var method_name in ActsAsTree.InstanceMethods)
        {
            this.prototype[method_name] = ActiveSupport.curry(ActsAsTree.InstanceMethods[method_name],params);
        }
    };
    
    ActsAsTree.ClassMethods = {
        
        getRoots: function getRoots(params)
        {
            var where = {};
            where[params.parent] = 0;
            return this.find({
                all: true,
                where: where,
                order: params.order
            })
        }
    };
        
    ActsAsTree.InstanceMethods = {
        /**
         * @delegate mixed getRoot()
         * Returns the ActiveRecord that is the root of the tree the record is in, or false if there is no root.
         */
        getRoot: function getRoot(params)
        {
            var where = ActiveSupport.extend({},params.where || {});
            where[params.parent] = 0;
            return this.constructor.find({
                first: true,
                where: where,
                order: params.order
            });
        },
        /**
         * @delegate mixed getSiblings()
         * Returns an array of records that share the same parent, or false if there are no siblings.
         */
        getSiblings: function getSiblings(params)
        {
            var parent = this.getParent();
            if(parent)
            {
                var where = ActiveSupport.extend({},params.where || {});
                where[params.parent] = parent.id;
                var siblings = this.constructor.find({
                    all: true,
                    where: where,
                    order: params.order
                });
                var siblings_without_self = [];
                for(var i = 0; i < siblings.length; ++i)
                {
                    if(siblings[i].id != this.id)
                    {
                        siblings_without_self.push(siblings[i]);
                    }
                }
                return siblings_without_self;
            }
            else
            {
                return this.constructor.getRoots();
            }
        },
        /**
         * @delegate array getAllChildren()
         * Returns an array of all children (grandchildren, etc). Always returns an array even if there are no children.
         */
        getAllChildren: function getAllChildren(params,child_list)
        {
            if(!child_list)
            {
                child_list = [];
            }
            var children = this.getChildList();
            if(!children)
            {
                return child_list;
            }
            for(var i = 0; i < children.length; ++i)
            {
                var child = children[i];
                child_list.push(child);
                child.getAllChildren(child_list);
            }
            return child_list;
        },
        /**
         * @delegate array getAllParents()
         * Returns an array of parents (grandparents, etc). Always returns an array even if there are no parents.
         */
        getAllParents: function getAllParents()
        {
            var parents = [];
            var parent = this.getParent();
            if(!parent)
            {
                return parents;
            }
            parents.push(parent);
            while(true)
            {
                parent = parent.getParent();
                if(parent)
                {
                    parents.push(parent);
                }
                else
                {
                    break;
                }
            }
            return parents;
        }
    };
    
})();