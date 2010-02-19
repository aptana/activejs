ActiveTest.Tests.Record.date = function()
{
    with(ActiveTest)
    {
        var a = ModelWithStringDates.create({
            name: 'a'
        });
        assert(a.get('created').match(/^\d{4}/) && a.get('updated').match(/^\d{4}/),'created and updated set via string field');
        var old_date = a.get('updated');
        a.set('updated','');
        a.save();
        var new_date = a.get('updated');
        assert(ModelWithStringDates.find(a.id).get('updated') == new_date,'created and updated persist via string field');
        
        var a = ModelWithDates.create({
            name: 'a'
        });
        assert(ActiveSupport.dateFormat(a.get('created'),'yyyy-mm-dd HH:MM:ss').match(/^\d{4}/) && ActiveSupport.dateFormat(a.get('updated'),'yyyy-mm-dd HH:MM:ss').match(/^\d{4}/),'created and updated set via date field');
        var old_date = a.get('updated');
        a.set('updated','');
        a.save();
        var new_date = a.get('updated');
        var saved_date = ModelWithDates.find(a.id).get('updated');
        assert(saved_date.toString() == new_date.toString(),'created and updated persist via date field');
        
        //make sure dates are preserved
        var reload_test = ModelWithDates.find(a.id);
        var old_created = reload_test.get('created');
        reload_test.save();
        reload_test.reload();
        reload_test.save();
        reload_test.reload();
        assert(reload_test.get('created').toString() == old_created.toString(),'created time is preserved on update');
    }
};