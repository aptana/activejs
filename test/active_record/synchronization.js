ActiveTest.Tests.Record.synchronization = function()
{
    with(ActiveTest)
    {
        //INDIVIDUAL RESULT SYNCHRONIZATION
        
        //test basic synchronization through find
        var abbey = User.create({
            name: 'Abbey'
        });
        
        //ensure no spill over into other records
        var bailey = User.create({
            name: 'Bailey'
        });
        
        //setup events for event count test
        var after_save_event_trigger_count = 0;
        var synchronization_after_save_event_trigger_count = 0;
        var after_destroy_event_trigger_count = 0;
        var synchronization_after_destroy_event_trigger_count = 0;
        
        User.observe('afterSave',function(){
            ++after_save_event_trigger_count;
        });
        User.observe('synchronization:afterSave',function(){
            ++synchronization_after_save_event_trigger_count;
        });
        User.observe('afterDestroy',function(){
            ++after_destroy_event_trigger_count;
        });
        User.observe('synchronization:afterDestroy',function(){
            ++synchronization_after_destroy_event_trigger_count;
        });
        
        
        //test synchronize param works
        var abbey_clone = User.find({
            first: true,
            where: {
                id: abbey.id
            }
        });
        abbey_clone.synchronize();
        
        var abbey_clone_2 = User.find({
            first: true,
            where: {
                id: abbey.id
            }
        });
        abbey_clone_2.synchronize();
        
        
        abbey.set('name','Abbey!');
        abbey.save();
        
        assert(abbey_clone.name == 'Abbey!' && abbey_clone_2.name == 'Abbey!','basic synchronization with param');
        assert(after_save_event_trigger_count == 1,'afterSave event not triggered by synchronization');
        assert(synchronization_after_save_event_trigger_count == 2,'synchronization:afterSave event triggered by synchronization');
        
        //ensure created record applies synchronization
        var colin = User.create({
            name: 'colin'
        });
        colin.synchronize();
        var colin_clone = User.findByName('colin');
        colin_clone.set('name','Colin');
        colin_clone.save();
        assert(colin.get('name') == 'Colin','created record synchronizes');
        
        //ensure stop works
        abbey_clone_2.stop();
        abbey.set('name','ABBEY');
        abbey.save();
        assert(abbey_clone.name == 'ABBEY' && abbey_clone_2.name == 'Abbey!','stop() prevents synchronization');
        
        //after destroy triggered
        abbey.destroy();
        assert(after_destroy_event_trigger_count == 1,'afterDestory event not triggered by synchronization');
        assert(synchronization_after_destroy_event_trigger_count == 1,'synchronization:afterDestory event triggered by synchronization');
        
        //RESULT SET SYNCHRONIZATION
        var users = User.find({synchronize: true});
        var dave = User.create({
            name: 'dave'
        });
        assert(users[2] && users[2].name == 'dave','basic result set synchronization');
        
        var users_ordered_by_name = User.find({
            order: 'name DESC',
            synchronize: true
        });
        var freddy = User.create({
            name: 'freddy'
        });
        assert(users_ordered_by_name[0] && users_ordered_by_name[0].name == 'freddy','ordered result set synchronization');
        
        colin_clone.destroy();
        
        assert(users[0].name == 'Bailey' && users[2].name == 'freddy' && users_ordered_by_name[0].name == 'freddy' && users_ordered_by_name[2].name == 'Bailey','result sets synchronized afterDestroy');
        
        users_ordered_by_name.stop();
        users.stop();
        
        users[0].destroy();
        
        assert(users_ordered_by_name[2] && users_ordered_by_name[2].name == 'Bailey','result set stop() prevents synchronization');
        
        //calculation synchronization
        var count_callback_call_count = 0;
        var response;
        var count_synchronization_stopper = User.count({
            synchronize: function(count){
                ++count_callback_call_count;
                response = count;
            }
        });
        assert(count_callback_call_count == 1 && response == 2,'count synchronize calls callback with correct value');
        var egor = User.create({
            name: 'egor'
        });
        assert(count_callback_call_count == 2 && response == 3,'count synchronize calls callback with correct value after create');
        egor.destroy();
        assert(count_callback_call_count == 3 && response == 2,'count synchronize calls callback with correct value after destroy');
        count_synchronization_stopper();
        User.create({
            name: 'freddy'
        });
        assert(count_callback_call_count == 3 && response == 2,'count synchronize stoppable');
    }
};