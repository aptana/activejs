ActiveTest.Tests.Routes = {};

Controller = {
    article: function(){},
    articleComment: function(){},
    home: function(){},
    wiki: function(){},
    multipleParams: function(){},
    test: function(){},
    optionalOne: function(){},
    optionalTwo: function(){},
    optionalThree: function(){}
};

ActiveRoutes.addRoute('/article/:id',Controller,'article');
ActiveRoutes.addRoute('/article/:id/:comment_id',Controller,'articleComment');
ActiveRoutes.addRoute('/',Controller,'home');
ActiveRoutes.addRoute('/wiki/*',Controller,'wiki');
ActiveRoutes.addRoute('/one/two/:three/:four/:five/:six',Controller.multipleParams);
ActiveRoutes.addRoute('/one/:a/(:b)',Controller,'optionalOne');
ActiveRoutes.addRoute('/one/:a/(:b)/(:c)',Controller,'optionalTwo');
ActiveRoutes.addRoute('/one/:a/(:b)/(:c)/(:d)/(:e)',Controller,'optionalThree');
ActiveRoutes.addRoute('/:controller/:method/:id',Controller,'test');
