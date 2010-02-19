ActiveTest.Tests.Record.basic = function()
{
    with(ActiveTest)
    {
        //ensure singular table name model can write / read
        var a = SingularTableName.create({string_field: 'test'});
        assert(SingularTableName.find(a.id).string_field == 'test','Singular table names supported.');
        
        //Comment is defined by ActiveRecord, Post is defined by SQL
        var a = new Comment({
            title: 'a',
            body: 'aa'
        });
        assert(a.title == 'a','Record correctly initialized.');
        
        var b = Comment.create({
            title: 'b',
            body: 'bb'
        });
        assert(b.title == 'b','Record correctly initialized with create().');
        assert(b.id > 0,'Record has id.');
        assert(Comment.find(b.id).title == 'b','Record persisted.');
        
        var c = Comment.create({
            title: 'c',
            body: 'cc'
        });
        assert(c.id == b.id + 1,'Record incremented id.');
        assert(Comment.find(c.id).title == 'c','Record persisted.');
        assert(Comment.count() == 2,'Record count is correct.');
        assert(Comment.count({
            where: {
                title: 'c'
            }
        }) == 1,'Record count with conditions is correct.');
        
        
        assert(b.id == Comment.first().id,'Calculations: first()');
        assert(c.id == Comment.last().id,'Calculations: last()');
        assert(3 == Comment.sum('id'),'Calculations: sum()')
        assert(1 == Comment.min('id'),'Calculations: min()')
        assert(2 == Comment.max('id'),'Calculations: max()')
        
        assert(c.get('title') == 'c','set()')
        c.set('title','ccc');
        assert(c.get('title') == 'ccc' && c.title == 'ccc','set() basic');
        
        c.set('save','test');
        assert(c.save != 'test' && c.get('save') == 'test','set() does not override protected parameter');
        
        c.reload();
        assert(c.title == 'c' && c.get('title') == 'c' && typeof(c.save) == 'function','reload()');
        
        c.updateAttribute('title','ccc');
        assert(c.title == 'ccc' && c.get('title') == 'ccc' && Comment.find(c.id).title == 'ccc','updateAttribute()');
        
        c.set('title','cccc');
        c.save();
        var _c = Comment.find(c.id);
        assert(_c.title == 'cccc' && _c.title == 'cccc' && c.id == _c.id,'save()');
        
        var count = Comment.count();
        c.destroy();
        assert(!c.reload() && count - 1 == Comment.count(),'destroy()');
        
        //create with an id preserves id and still acts as "created"
        var called = false;
        Comment.observeOnce('afterCreate',function(){
            called = true;
        });
        var d = Comment.create({
            id: 50,
            title: 'd',
            body: 'dd'
        });
        d.reload();
        assert(d.id == 50 && called,'create with an id preserves id and still acts as "created"');
        
        Comment.destroy('all');
        assert(Comment.count() == 0,'destroy("all")');
        
        //field type testing
        
        var field_test_zero = new FieldTypeTester();
        assert(field_test_zero.string_field == '' && field_test_zero.number_field == 0 && field_test_zero.default_value_field == 'DEFAULT' && field_test_zero.custom_type_field_with_default == 'DEFAULT','correct default values are set on initialize()');            
        
        var field_test_one = FieldTypeTester.create({
            string_field: 'a',
            number_field: 1,
            boolean_field: true
        });
        field_test_one.reload();
        assert(field_test_one.string_field === 'a' && field_test_one.number_field === 1 && field_test_one.boolean_field === true,'String, Number and Boolean(true) field types preserved.');
        
        var field_test_two = FieldTypeTester.create({
            string_field: 'b',
            number_field: 2,
            boolean_field: false
        });
        field_test_two.reload();
        assert(field_test_two.string_field === 'b' && field_test_two.number_field === 2 && field_test_two.boolean_field === false,'String, Number and Boolean(false) field types preserved.');
        
        var empty_record = FieldTypeTester.create();
        empty_record.reload();
        assert(empty_record.default_value_field == 'DEFAULT','Default value is set on simple field type.');
        assert(empty_record.custom_type_field == '','Empty value is set on custom field type with no default specification.');
        assert(empty_record.custom_type_field_with_default == 'DEFAULT','Default value is set on custom field type with default specification.');
        
        //should find one false
        assert(FieldTypeTester.find({
            where: {
                boolean_field: false
            }
        })[0].id == field_test_two.id,'find({where: {boolean_field: false}})');
        
        //should find two true (since true is the default value and we created an empty record)
        assert(FieldTypeTester.find({
            where: {
                boolean_field: true
            }
        })[0].id == field_test_one.id,'find({where: {boolean_field: true}})');
        
        assert(FieldTypeTester.findByBooleanField(true).id == field_test_one.id,'findByBooleanField(true)');
        assert(FieldTypeTester.findByBooleanField(false).id == field_test_two.id,'findByBooleanField(false)');
        
        // Identifiers that are reserved words should be quoted automatically.
        var reserved_test = Reserved.create({
            from: 'b',
            select: 'c'
        });
        assert(Reserved.count() == 1,'Reserved.create');
        assert(Reserved.find(reserved_test.to).from == 'b','Reserved.find');
        assert(Reserved.findByFrom('b').select == 'c','Reserved.findByFrom');
        
        // Identifiers must be quoted explicitly in SQL fragments.
        assert(Reserved.find({
          select: ['"to" + "from"', '"select"']
        })[0].select == 'c','Reserved.find({select:...})');
        
        // Keys of {where: {...}} properties are assumed to be column names...
        //(length by default does not exist in the InMemory adapter)
        ActiveRecord.Adapters.InMemory.MethodCallbacks.length = function(argument){
            return argument.length;
        };
        
        /*
        these are not working in the InMemory adapter
        
        assert(Reserved.find({
          where: {select: 'c'}
        })[0].select == 'c','Reserved.find({where:{...}})');
        
        try {
          // ...so that format won't work for arbitrary SQL fragments...
          Reserved.find({
            where: {'length("select")': 1}
          });
          assert(false,'Reserved.find({where:{\'length...\': 1}) throws an exception');
        } catch (e) {
        }
        // ...but you can use {where: '...'} instead.
        assert(Reserved.find({
          where: 'length("select") = 1'
        })[0].select == 'c','Reserved.find({where:\'length... = 1\'})');
        */
        
        reserved_test.set('select', 'd');
        assert(reserved_test.select == 'd','reserved_test.set');
        reserved_test.save();
        assert(Reserved.find(reserved_test.to).select == 'd','reserved_test.save');
        
        /*
        these are not working in the InMemory adapter
        
        Reserved.updateAll({from: 'me'}, {select: 'd'});
        assert(Reserved.find(reserved_test.to).from == 'me','Reserved.updateAll');
        */
        
        reserved_test.destroy();
        assert(Reserved.count() == 0,'Reserved.destroy');
    }
};
