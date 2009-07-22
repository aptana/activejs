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

(function(){

/**
 * Adapter for v8cgi configured with MySQL.
 * @alias ActiveRecord.Adapters.V8CGIMySQL
 * @property {ActiveRecord.Adapter}
 */ 
ActiveRecord.Adapters.V8CGIMySQL = function V8CGIMySQL(){
    ActiveSupport.extend(this,ActiveRecord.Adapters.InstanceMethods);
    ActiveSupport.extend(this,ActiveRecord.Adapters.MySQL);
    ActiveSupport.extend(this,{
        executeSQL: function executeSQL(sql)
        {
            ActiveRecord.connection.log("Adapters.V8CGIMySQL.executeSQL: " + sql + " [" + ActiveSupport.arrayFrom(arguments).slice(1).join(',') + "]");
            var query = sprintf.apply(global,([sql.replace(/\?/g,"'%s'")]).concat(ActiveSupport.arrayFrom(arguments).slice(1)));
            var result = ActiveRecord.Adapters.V8CGIMySQL.db.query(query);
            result.rows  = result.fetchObjects ? result.fetchObjects() : [];
            return r;
        },
        getLastInsertedRowId: function getLastInsertedRowId()
        {
            return ActiveRecord.Adapters.V8CGIMySQL.db.insertId();
        },
        iterableFromResultSet: function iterableFromResultSet(result)
        {
            result.iterate = ActiveRecord.Adapters.defaultResultSetIterator;
            return result;
        }
    });
};

ActiveRecord.Adapters.V8CGIMySQL.connect = function connect(options)
{
    if(!options)
    {
        options = {};
    }
    for(var key in options)
    {
        options[key.toUpperCase()] = options[key];
    }
    var MySQL = require("mysql").MySQL; 
    options = ActiveSupport.extend({
        HOST: 'localhost',
        PORT: 3306,
        USER: 'root',
        PASS: '',
        NAME: ''
    },options);
    ActiveRecord.Adapters.V8CGIMySQL.db = new MySQL();
    ActiveRecord.Adapters.V8CGIMySQL.connection = ActiveRecord.Adapters.V8CGIMySQL.db.connect(options.HOST,options.USER,options.PASS,options.NAME);
    return new ActiveRecord.Adapters.V8CGIMySQL();
};

})();