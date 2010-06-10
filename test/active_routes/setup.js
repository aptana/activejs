ActiveTest.Tests.Routes = {};

Controller = {
    article: function(){},
    articleComment: function(){},
    home: function(){},
    wiki: function(){},
    direct: function(){}
};

ActiveRoutes.addRoute('/article/:id',Controller,'article');
ActiveRoutes.addRoute('article/:id/:comment_id',Controller,'articleComment');
ActiveRoutes.addRoute('/',Controller,'home');
ActiveRoutes.addRoute('/wiki/*',Controller,'wiki');
ActiveRoutes.addRoute('/one/two/:three/:four',Controller.direct);
