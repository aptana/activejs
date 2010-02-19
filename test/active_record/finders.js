ActiveTest.Tests.Record.finders = function()
{    
    with(ActiveTest)
    {
        var a = Comment.create({
            title: 'a'
        });
        var b = Comment.create({
            title: 'b'
        });
        var c = Comment.create({
            title: 'c'
        });
        assert(Comment.find({
            all: true,
            where: {
                title: 'b'
            }
        })[0].title == 'b','find({where: Hash})');
        assert(Comment.find({
            all: true,
            where: 'title = "c"'
        })[0].title == 'c','find({where: String})');
        assert(Comment.find({
            first: true,
            where: {
                title: 'b'
            }
        }).title == 'b','find({first: true, where: Hash})');
        assert(Comment.find({
            first: true,
            where: 'title = "b"'
        }).title == 'b','find({first: true, where: string})');
        b = Comment.find('SELECT * FROM comments WHERE title = ? LIMIT 1','b');
        assert(b[0] && b[0].title == 'b','find(SQL string with WHERE, LIMIT and param substituion)');
        b = Comment.find({
          where: ['title = ?','b'],
          limit: 1
        });
        assert(b[0] && b[0].title == 'b','find(SQL string with WHERE, LIMIT and param substituion via find)');            
        
        assert(Comment.find().length == 3 && Comment.find({all: true}).length == 3,'find({all: true})');
        
        var asc = Comment.find({
            all: true,
            order: 'id ASC'
        });
        var desc = Comment.find({
            all: true,
            order: 'id DESC'
        });
        
        var asc_find_by_sql = Comment.find('SELECT * FROM comments ORDER BY id ASC');
        var desc_find_by_sql = Comment.find('SELECT * FROM comments ORDER BY id DESC');
        
        assert(asc[0].title == asc_find_by_sql[0].title && asc[2].title == asc_find_by_sql[2].title && desc[0].title == desc_find_by_sql[0].title && desc[2].title == desc_find_by_sql[2].title,'find(sql_string)');
        assert(asc[0].title == 'a' && asc[2].title == 'c' && desc[0].title == 'c' && desc[2].title == 'a','find({all: true,order: String})');
        
        assert(typeof(Comment.findByTitle) != 'undefined','findBy#{X} exists.');
        assert(typeof(Comment.findAllByTitle) != 'undefined','findAllBy#{X} exists.');
        assert(Comment.findByTitle('a').title == a.title && Comment.findById(a.id).id == a.id,'findByX works');
        
        //find by callback
        var comments_found_by_callback = Comment.find({
            callback: function(comment){
                return comment.title == 'b';
            }
        });
        assert(comments_found_by_callback.length == 1 && comments_found_by_callback[0] && comments_found_by_callback[0].title == 'b','find({callback:function(){}})');
        var comment_found_by_callback = Comment.find({
            first: true,
            callback: function(comment){
                return comment.title == 'c';
            }
        });
        assert(comment_found_by_callback.title == 'c','find({callback:function(){},first:true})');
        
        //test GROUP BY
        Comment.destroy('all');
        var one = Comment.create({title: 'a'});
        var two = Comment.create({title: 'a'});
        var three = Comment.create({title: 'b'});
        var result = Comment.find({
            group: 'title',
            order: 'id ASC'
        });
        assert(result[0].title == 'a' && result[1].title == 'b','GROUP BY clause via params works');
        var result = Comment.find('SELECT * FROM comments GROUP BY title ORDER BY id ASC');
        assert(result[0].title == 'a' && result[1].title == 'b','GROUP BY clause via SQL works');
        
        //test find multiple by id
        //add extra record to make sure it is not finding all
        Comment.create({
            title: 'c'
        });
        var a = Comment.find(one.id,two.id,three.id);
        assert(a.length == 3 && a[0].id == one.id && a[1].id == two.id && a[2].id == three.id,'WHERE id IN(arguments array)');
        var b = Comment.find([one.id,two.id,three.id]);
        assert(b.length == 3 && b[0].id == one.id && b[1].id == two.id && b[2].id == three.id,'WHERE id IN(array)');
        var c = Comment.find('SELECT * FROM comments WHERE id IN(?,?,?)',one.id,two.id,three.id);
        assert(c.length == 3 && c[0].id == one.id && c[1].id == two.id && c[2].id == three.id,'WHERE id IN(array) via SQL string');
    }
};