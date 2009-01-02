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

ActiveTest.Tests.ActiveRecord.migrations = function(proceed)
{
    with(ActiveTest)
    {
        if(ActiveRecord.asynchronous)
        {

        }
        else
        {
            if(ActiveRecord.connection.schemaLess)
            {
                if(proceed)
                    return proceed();
            }
            //test migration versioning with no actual migration
            var times_up_executed = 0;
            var times_down_executed = 0;
            var empty_migration = {
                up: function(){
                    ++times_up_executed;
                },
                down: function(){
                    ++times_down_executed;
                }
            };
            ActiveRecord.Migrations.migrations = {
                1: empty_migration,
                2: empty_migration,
                3: empty_migration,
                4: empty_migration,
                5: empty_migration
            };
            
            //test internals
            assert(ActiveRecord.Migrations.collectAboveIndex(3)[0][0] == 4 && ActiveRecord.Migrations.collectAboveIndex(3)[1][0] == 5,'Migrations.collectAboveIndex(3)');
            assert(ActiveRecord.Migrations.collectBelowIndex(3)[0][0] == 3 && ActiveRecord.Migrations.collectBelowIndex(3)[1][0] == 2  && ActiveRecord.Migrations.collectBelowIndex(3)[2][0] == 1,'Migrations.collectBelowIndex(3)');
            
            assert(ActiveRecord.Migrations.collectAboveIndex(3,4)[0][0] == 4 && !ActiveRecord.Migrations.collectAboveIndex(3,4)[1],'Migrations.collectAboveIndex(3,4)');
            
            assert(ActiveRecord.Migrations.collectBelowIndex(3,2)[0][0] == 3 && !ActiveRecord.Migrations.collectBelowIndex(3,2)[1],'Migrations.collectBelowIndex(3,2)');
            
            assert(ActiveRecord.Migrations.max() == 5,'Migrations.max()');
            assert(ActiveRecord.Migrations.current() == 0,'Migrations.current()');
            
            //0 -> 5
            ActiveRecord.Migrations.migrate();
            assert(times_down_executed == 0 && times_up_executed == 5 && ActiveRecord.Migrations.current() == 5,'Migrations.migrate() 0 -> 5');
            times_up_executed = 0;
            times_down_executed = 0;
            
            //5 -> 0
            ActiveRecord.Migrations.migrate(0);
            assert(times_down_executed == 5 && times_up_executed == 0 && ActiveRecord.Migrations.current() == 0,'Migrations.migrate() 5 -> 0');
            times_up_executed = 0;
            times_down_executed = 0;
            
            //0 -> 3
            ActiveRecord.Migrations.migrate(3);
            assert(times_down_executed == 0 && times_up_executed == 3 && ActiveRecord.Migrations.current() == 3,'Migrations.migrate() 0 -> 3');
            times_up_executed = 0;
            times_down_executed = 0;
            
            //3 -> 5
            ActiveRecord.Migrations.migrate(5);
            assert(times_down_executed == 0 && times_up_executed == 2 && ActiveRecord.Migrations.current() == 5,'Migrations.migrate() 3 -> 5');
            times_up_executed = 0;
            times_down_executed = 0;
            
            //5 -> 3
            ActiveRecord.Migrations.migrate(3);
            assert(times_down_executed == 2 && times_up_executed == 0 && ActiveRecord.Migrations.current() == 3,'Migrations.migrate() 5 -> 3');
            times_up_executed = 0;
            times_down_executed = 0;
            
            //3 -> 0
            ActiveRecord.Migrations.migrate(0);
            assert(times_down_executed == 3 && times_up_executed == 0 && ActiveRecord.Migrations.current() == 0,'Migrations.migrate() 3 -> 0');
            times_up_executed = 0;
            times_down_executed = 0;
            
            //now use real migrations
            ActiveRecord.Migrations.migrations = {
                1: {
                    up: function(schema){
                        schema.createTable('one',{
                            a: '',
                            b: {
                                type: 'TEXT',
                                value: 'default'
                            }
                        });
                    },
                    down: function(schema){
                        schema.dropTable('one');
                    }
                },
                2: {
                    up: function(schema){
                        schema.addColumn('one','c');
                    },
                    down: function(schema){
                        schema.dropColumn('one','c');
                    }
                },
                3: {
                    up: function(schema){
                        schema.addColumn('one','d',{
                            type: 'TEXT',
                            value: 'default'
                        })
                    },
                    down: function(schema){
                        schema.dropColumn('one','d');
                    }
                }
            };
            
            var assertions = {
                1: {
                    up: function(){
                        try{
                            ActiveRecord.execute('SELECT * FROM one');
                            assert(true,'Migrations.migrate() 0 -> 1 (createTable)');
                        }catch(e){
                            assert(false,'Migrations.migrate() 0 -> 1 (createTable)');
                        }
                    },
                    down: function(){
                        try{
                            ActiveRecord.execute('SELECT * FROM one');
                            assert(false,'Migrations.migrate() 1 -> 0 (dropTable)');
                        }catch(e){
                            assert(true,'Migrations.migrate() 1 -> 0 (dropTable)');
                        }
                    }
                },
                2: {
                    up: function(){
                        try{
                            ActiveRecord.execute('SELECT a,b,c FROM one');
                            assert(true,'Migrations.migrate() 0 -> 2 (addColumn)');
                        }catch(e){
                            assert(false,'Migrations.migrate() 0 -> 2 (addColumn)');
                        }
                    },
                    down: function(){
                        try{
                            ActiveRecord.execute('SELECT a,b,c FROM one');
                            assert(false,'Migrations.migrate() 0 -> 2 (dropColumn)');
                        }catch(e){
                            assert(true,'Migrations.migrate() 0 -> 2 (dropColumn)');
                        }
                    }
                },
                3: {
                    up: function(){
                        
                    },
                    down: function(){
                        
                    }
                }
            };
            ActiveRecord.Migrations.migrate(1);
            assertions[1].up();
            ActiveRecord.Migrations.migrate(0);
            assertions[1].down();
            
            //ActiveRecord.logging = true;
            //
            //ActiveRecord.Migrations.migrate(3);
            //assertions[1].up();
            //assertions[2].up();
            //ActiveRecord.Migrations.migrate(0);
            //assertions[2].down();
            //assertions[1].down();
            //
            //ActiveRecord.logging = false;
            
            if(proceed)
                proceed();
        }
    }
};