ActiveTest.Tests.Support = {};
ActiveTest.Tests.Support.active_support = function()
{
    with (ActiveTest)
    {
        // Inflector
        assert(ActiveSupport.String.pluralize('cat') == 'cats', 'pluralize(cat)');
        assert(ActiveSupport.String.pluralize('cats') == 'cats', 'pluralize(cats)');

        assert(ActiveSupport.String.singularize('cat') == 'cat', 'singularize(cat)');
        assert(ActiveSupport.String.singularize('cats') == 'cat', 'singularize(cats)');

        assert(ActiveSupport.String.pluralize('person') == 'people', 'pluralize(person)');
        assert(ActiveSupport.String.pluralize('people') == 'people', 'pluralize(people)');

        assert(ActiveSupport.String.singularize('people') == 'person', 'singularize(people)');
        assert(ActiveSupport.String.singularize('person') == 'person', 'singularize(person)');
    }
};
