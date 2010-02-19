ActiveTest.Tests.Support = {};
ActiveTest.Tests.Support.active_support = function()
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
    }
};
