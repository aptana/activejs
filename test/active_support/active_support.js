/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Matt Brubeck.
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

ActiveTest.Tests.ActiveSupport = {};
ActiveTest.Tests.ActiveSupport.ActiveSupport = function(proceed)
{
    with (ActiveTest)
    {
        // Inflector
        assert(ActiveSupport.Inflector.pluralize('cat') == 'cats', 'pluralize(cat)');
        assert(ActiveSupport.Inflector.pluralize('cats') == 'cats', 'pluralize(cats)');

        assert(ActiveSupport.Inflector.singularize('cat') == 'cat', 'singularize(cat)');
        assert(ActiveSupport.Inflector.singularize('cats') == 'cat', 'singularize(cats)');

        assert(ActiveSupport.Inflector.pluralize('person') == 'people', 'pluralize(person)');
        assert(ActiveSupport.Inflector.pluralize('people') == 'people', 'pluralize(people)');

        assert(ActiveSupport.Inflector.singularize('people') == 'person', 'singularize(people)');
        assert(ActiveSupport.Inflector.singularize('person') == 'person', 'singularize(person)');

        if(proceed)
            proceed();
    }
};
