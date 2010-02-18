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
    ['article_comment','article/:id/:comment_id',{
      object:'article',
      method:'article',
      requirements: {
        id: /\d+/,
        comment_id: function(comment_id){
          return comment_id.match(/^\d+$/)
        }
      }
    }],
    ['post','/blog/post/:id',{object:'blog',method: 'post'}],
    ['/blog/:method/:id',{object:'blog'}],
    ['/pages/:method',{object:'page'}],
    ['/address/',{object: 'AddressBook',method:'index'}],
    ['address','/address/:state/:zip',{object: 'AddressBook',method:'address'}],
    ['/my/application/wiki/*',{object: 'Wiki',method:'wiki'}],
    ['root','/',{object:'welcome',method:'index'}],
    ['default','/:object/:method/:id']
];