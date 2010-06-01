/**
 * ActiveSupport.String
 **/
ActiveSupport.String = {
    /**
     * ActiveSupport.String.underscore(string) -> String
     * Emulates Prototype's [String.prototype.underscore](http://api.prototypejs.org/language/string/prototype/underscore/)
     **/
    underscore: function underscore(str)
    {
        return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, function(match){
            match = match.split("");
            return match[0] + '_' + match[1];
        }).replace(/([a-z\d])([A-Z])/g, function(match){
            match = match.split("");
            return match[0] + '_' + match[1];
        }).replace(/-/g, '_').toLowerCase();
    },
    /**
     * ActiveSupport.String.camelize(string[,capitalize = false]) -> String
     * Emulates Prototype's [String.prototype.camelize](http://api.prototypejs.org/language/string/prototype/camelize/)
     **/
    camelize: function camelize(str, capitalize)
    {
        var camelized,
            parts = str.replace(/\_/g,'-').split('-'), len = parts.length;
        if (len === 1)
        {
            if(capitalize)
            {
                return parts[0].charAt(0).toUpperCase() + parts[0].substring(1);
            }
            else
            {
                return parts[0];
            }
        }
        if(str.charAt(0) === '-')
        {
            camelized = parts[0].charAt(0).toUpperCase() + parts[0].substring(1);
        }
        else
        {
            camelized = parts[0];
        }
        for (var i = 1; i < len; i++)
        {
            camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
        }
        if(capitalize)
        {
            return camelized.charAt(0).toUpperCase() + camelized.substring(1);
        }
        else
        {
            return camelized;
        }
    },
    /**
     * ActiveSupport.String.trim(string) -> String
     * Trim leading and trailing whitespace.
     **/
    trim: function trim(str)
    {
        return (str || "").replace(/^\s+|\s+$/g,"");
    },
    scriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
    /**
     * ActiveSupport.String.evalScripts(string) -> null
     **/
    evalScripts: function evalScripts(str)
    {
        var match_all = new RegExp(ActiveSupport.String.scriptFragment,'img');
        var match_one = new RegExp(ActiveSupport.String.scriptFragment,'im');
        var matches = str.match(match_all) || [];
        for(var i = 0; i < matches.length; ++i)
        {
            eval((matches[i].match(match_one) || ['', ''])[1]);
        }
    },
    /**
     * ActiveSupport.String.stripScripts(string) -> String
     **/
    stripScripts: function stripScripts(str)
    {
        return str.replace(new RegExp(ActiveSupport.String.scriptFragment,'img'),'');
    }
};