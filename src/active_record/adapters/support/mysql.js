(function(){

ActiveRecord.Adapters.MySQL = ActiveSupport.extend(ActiveSupport.clone(ActiveRecord.Adapters.SQL),{
    createTable: function createTable(table_name,columns)
    {
        var keys = ActiveSupport.keys(columns);
        var fragments = [];
        for (var i = 0; i < keys.length; ++i)
        {
            var key = keys[i];
            if(columns[key].primaryKey)
            {
                var type = columns[key].type || 'INT';
                fragments.unshift(this.quoteIdentifier(key) + ' ' + type + ' NOT NULL' + (type == 'INT' ? ' AUTO_INCREMENT' : ''));
                fragments.push('PRIMARY KEY(' + this.quoteIdentifier(key) + ')');
            }
            else
            {
                fragments.push(this.getColumnDefinitionFragmentFromKeyAndColumns(key,columns));
            }
        }
        return this.executeSQL('CREATE TABLE IF NOT EXISTS ' + table_name + ' (' + fragments.join(',') + ') ENGINE=InnoDB');
    },
    dropColumn: function dropColumn(table_column,column_name)
    {
        return this.executeSQL('ALTER TABLE ' + table_name + ' DROP COLUMN ' + this.quoteIdentifier(key));
    }
});

})();
