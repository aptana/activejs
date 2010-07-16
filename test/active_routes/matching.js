ActiveTest.Tests.Routes.matching = function()
{
    with(ActiveTest)
    {
        
        assert(ActiveRoutes.match('/')[0] == Controller.home,'basic match');
        assert(ActiveRoutes.match('/article/5')[0] == Controller.article && ActiveRoutes.match('/article/5')[1].id == 5,'match with param');
        assert(ActiveRoutes.match('/one/two/3/4/5/6')[0] == Controller.multipleParams
          && ActiveRoutes.match('/one/two/3/4/5/6')[1].three == 3
          && ActiveRoutes.match('/one/two/3/4/5/6')[1].four == 4
          && ActiveRoutes.match('/one/two/3/4/5/6')[1].five == 5
          && ActiveRoutes.match('/one/two/3/4/5/6')[1].six == 6
        ,'match with multiple params');
        assert(ActiveRoutes.match('/one/a/b')[0] == Controller.optionalOne
          && ActiveRoutes.match('/one/a/b')[1].a == 'a'
          && ActiveRoutes.match('/one/a/b')[1].b == 'b'
        ,'match with optional param');
        assert(ActiveRoutes.match('/one/a/b/c')[0] == Controller.optionalTwo
          && ActiveRoutes.match('/one/a/b/c')[1].a == 'a'
          && ActiveRoutes.match('/one/a/b/c')[1].b == 'b'
          && ActiveRoutes.match('/one/a/b/c')[1].c == 'c'
        ,'match with multiple optional params');
        assert(ActiveRoutes.match('/one/a/b/c/d/e')[0] == Controller.optionalThree
          && ActiveRoutes.match('/one/a/b/c/d/e')[1].a == 'a'
          && ActiveRoutes.match('/one/a/b/c/d/e')[1].b == 'b'
          && ActiveRoutes.match('/one/a/b/c/d/e')[1].c == 'c'
          && ActiveRoutes.match('/one/a/b/c/d/e')[1].d == 'd'
          && ActiveRoutes.match('/one/a/b/c/d/e')[1].e == 'e'
        ,'match with multiple optional params');
        assert(ActiveRoutes.match('/one/a/b/c/d')[0] == Controller.optionalThree
          && ActiveRoutes.match('/one/a/b/c/d')[1].a == 'a'
          && ActiveRoutes.match('/one/a/b/c/d')[1].b == 'b'
          && ActiveRoutes.match('/one/a/b/c/d')[1].c == 'c'
          && ActiveRoutes.match('/one/a/b/c/d')[1].d == 'd'
        ,'match with multiple optional params, with missing params');
        
    }
};