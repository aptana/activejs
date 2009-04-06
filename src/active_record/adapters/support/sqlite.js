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

Adapters.SQLite = ActiveSupport.extend(ActiveSupport.clone(Adapters.SQL),{
    createTable: function createTable(table_name,columns)
    {
        var keys = ActiveSupport.keys(columns);
        var fragments = [];
        for (var i = 0; i < keys.length; ++i)
        {
            var key = keys[i];
            if(columns[key].primaryKey)
            {
                var type = columns[key].type || 'INTEGER';
                fragments.unshift(key + ' ' + type + ' PRIMARY KEY');
            }
            else
            {
                fragments.push(this.getColumnDefinitionFragmentFromKeyAndColumns(key,columns));
            }
        }
        return this.executeSQL('CREATE TABLE IF NOT EXISTS ' + table_name + ' (' + fragments.join(',') + ')');
    },
    dropColumn: function dropColumn(table_name,column_name)
    {
        this.transaction(ActiveSupport.bind(function drop_column_transaction(){
            var description = ActiveRecord.connection.iterableFromResultSet(ActiveRecord.connection.executeSQL('SELECT * FROM sqlite_master WHERE tbl_name = "' + table_name + '"')).iterate(0);
            var temp_table_name = 'temp_' + table_name;
            ActiveRecord.execute(description['sql'].replace(new RegExp('^CREATE\s+TABLE\s+' + table_name),'CREATE TABLE ' + temp_table_name).replace(new RegExp('(,|\()\s*' + column_name + '[\s\w]+(\)|,)'),function(){
                return (args[1] == '(' ? '(' : '' ) + args[2];
            }));
            ActiveRecord.execute('INSERT INTO ' + temp_table_name + ' SELECT * FROM ' + table_name);
            this.dropTable(table_name);
            this.renameTable(temp_table_name,table_name);
        },this));
    }
});
