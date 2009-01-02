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

ActiveTest.Tests.Routes.normalize = function(proceed)
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
    if(proceed())
        proceed();
};