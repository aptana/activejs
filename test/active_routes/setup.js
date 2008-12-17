/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
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

ActiveTest.Tests.Routes = {};

var logged_actions = [];
var action_logger = function action_logger(){
    logged_actions.push(arguments);
};
var test_scope = {
    Blog: {
        index: action_logger,
        post: action_logger,
        edit: action_logger
    },
    Page: {
        index: action_logger,
        about: action_logger,
        contact: action_logger
    },
    AddressBook: {
        index: action_logger,
        address: action_logger
    },
    Test: {
        test: action_logger,
        index: action_logger
    },
    Article: {
        article: action_logger
    },
    Wiki: {
        wiki: action_logger
    },
    Welcome: {
        index: action_logger
    }
};
var test_valid_route_set = [
    ['article','article/:id',{object:'article',method:'article',requirements: {id:/\d+/}}],
    ['post','/blog/post/:id',{object:'blog',method: 'post'}],
    ['/blog/:method/:id',{object:'blog'}],
    ['/pages/:method',{object:'page'}],
    ['/address/',{object: 'AddressBook',method:'index'}],
    ['address','/address/:state/:zip',{object: 'AddressBook',method:'address'}],
    ['/my/application/wiki/*',{object: 'Wiki',method:'wiki'}],
    ['root','/',{object:'welcome',method:'index'}],
    ['default','/:object/:method/:id']
];