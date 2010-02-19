ActiveTest.Tests.Routes.normalize = function()
{
    with(ActiveTest)
    {
        assert(ActiveRoutes.normalizePath('a/b/c?a/b/c'),'removes query string');
        assert(ActiveRoutes.normalizePath('a/b/c#a/b/c'),'removes hash');
        assert(ActiveRoutes.normalizePath('a/b/c?a/b/c#a/b/c'),'removes both hash and query string');
        assert(ActiveRoutes.normalizePath('a/b/c#a/b/c?a/b/c'),'removes both hash and query string');
        assert(ActiveRoutes.normalizePath('a/b/c') == 'a/b/c','does not replace single non trailing or leading slashes');
        assert(ActiveRoutes.normalizePath('//x//y/z') == 'x/y/z','deletes leading slash and multiple slash');
        assert(ActiveRoutes.normalizePath('/////one/two//three///four////') == 'one/two/three/four','combined');
    }
};