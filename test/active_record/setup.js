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

ActiveTest.Tests.ActiveRecord = {};

ActiveTest.Tests.ActiveRecord.setup = function(proceed)
{
    if(ActiveRecord.asynchronous)
    {
        ActiveRecord.execute('SELECT * FROM sqlite_master');
        
    }
    else
    {
        
        ActiveRecord.execute('DROP TABLE IF EXISTS schema_migrations');
        if(ActiveRecord.Migrations.Meta)
        {
            delete ActiveRecord.Migrations.Meta;
        }
        ActiveRecord.execute('DROP TABLE IF EXISTS posts');
        ActiveRecord.execute('DROP TABLE IF EXISTS comments');
        ActiveRecord.execute('DROP TABLE IF EXISTS users');
        ActiveRecord.execute('DROP TABLE IF EXISTS credit_cards');
        
        //define Posts via SQL
        if(ActiveRecord.adapter == ActiveRecord.Adapters.JaxerMySQL)
        {
            ActiveRecord.execute('CREATE TABLE IF NOT EXISTS posts(id INT NOT NULL AUTO_INCREMENT, user_id INT, title VARCHAR(255), body TEXT, PRIMARY KEY(id))');
        }
        else
        {
            ActiveRecord.execute('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY,user_id,title,body)');
        }
        Post = ActiveRecord.create('posts');
        with(Post)
        {
            belongsTo('user',{
                counter: 'post_count'
            });
            hasMany('comments',{
                dependent: true
            });
        }

        //define Comments via Migrations
        Comment = ActiveRecord.define('comments',{
            title: '',
            post_id: 0,
            user_id: 0,
            body: {
                type: 'text',
                value: ''
            },
            test: {},
            test_2: []
        });
        Comment.validatesPresenceOf('title');
        Comment.belongsTo('user');
        Comment.belongsTo(Post);

        CreditCard = ActiveRecord.define('credit_cards',{
            number: 0
        });

        User = ActiveRecord.define('users',{
            name: '',
            password: '',
            comment_count: 0,
            post_count: 0,
            credit_card_id: 0
        });
        //you can mix and match singular, plural, camelcase, normal
        User.hasMany('Comment',{
            dependent: true
        });
        User.hasMany('posts',{
            dependent: true
        });
        User.hasOne(CreditCard,{
            dependent: true
        });
        
        ModelWithStringDates = ActiveRecord.define('string_dates',{
            name: '',
            created: '',
            updated: ''
        });
        
        ModelWithDates = ActiveRecord.define('dates',{
            name: '',
            created: {
                type: 'DATETIME'
            },
            updated: {
                type: 'DATETIME'
            }
        });
        
        Article = ActiveRecord.define('articles',{
            name: ''
        });
        Article.hasMany('Categorization');
        Article.hasMany('Category',{
            through: 'Categorization'
        });
        
        Category = ActiveRecord.define('categories',{
            name: ''
        });
        Category.hasMany('Categorization');
        Category.hasMany('Article',{
            through: 'Categorization'
        });
        
        Categorization = ActiveRecord.define('categorizations',{
            article_id: 0,
            category_id: 0
        });
        Categorization.belongsTo('Article',{
            dependent: true
        });
        Categorization.belongsTo('Category',{
            dependent: true
        });
        
        if(proceed)
            proceed();
    }
};