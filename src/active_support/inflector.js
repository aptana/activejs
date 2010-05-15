ActiveSupport.Inflections = {
    plural: [
        [/(quiz)$/i,               "$1zes"  ],
        [/^(ox)$/i,                "$1en"   ],
        [/([m|l])ouse$/i,          "$1ice"  ],
        [/(matr|vert|ind)ix|ex$/i, "$1ices" ],
        [/(x|ch|ss|sh)$/i,         "$1es"   ],
        [/([^aeiouy]|qu)y$/i,      "$1ies"  ],
        [/(hive)$/i,               "$1s"    ],
        [/(?:([^f])fe|([lr])f)$/i, "$1$2ves"],
        [/sis$/i,                  "ses"    ],
        [/([ti])um$/i,             "$1a"    ],
        [/(buffal|tomat)o$/i,      "$1oes"  ],
        [/(bu)s$/i,                "$1ses"  ],
        [/(alias|status)$/i,       "$1es"   ],
        [/(octop|vir)us$/i,        "$1i"    ],
        [/(ax|test)is$/i,          "$1es"   ],
        [/s$/i,                    "s"      ],
        [/$/,                      "s"      ]
    ],
    singular: [
        [/(quiz)zes$/i,                                                    "$1"     ],
        [/(matr)ices$/i,                                                   "$1ix"   ],
        [/(vert|ind)ices$/i,                                               "$1ex"   ],
        [/^(ox)en/i,                                                       "$1"     ],
        [/(alias|status)es$/i,                                             "$1"     ],
        [/(octop|vir)i$/i,                                                 "$1us"   ],
        [/(cris|ax|test)es$/i,                                             "$1is"   ],
        [/(shoe)s$/i,                                                      "$1"     ],
        [/(o)es$/i,                                                        "$1"     ],
        [/(bus)es$/i,                                                      "$1"     ],
        [/([m|l])ice$/i,                                                   "$1ouse" ],
        [/(x|ch|ss|sh)es$/i,                                               "$1"     ],
        [/(m)ovies$/i,                                                     "$1ovie" ],
        [/(s)eries$/i,                                                     "$1eries"],
        [/([^aeiouy]|qu)ies$/i,                                            "$1y"    ],
        [/([lr])ves$/i,                                                    "$1f"    ],
        [/(tive)s$/i,                                                      "$1"     ],
        [/(hive)s$/i,                                                      "$1"     ],
        [/([^f])ves$/i,                                                    "$1fe"   ],
        [/(^analy)ses$/i,                                                  "$1sis"  ],
        [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis"],
        [/([ti])a$/i,                                                      "$1um"   ],
        [/(n)ews$/i,                                                       "$1ews"  ],
        [/s$/i,                                                            ""       ]
    ],
    irregular: [
        ['move',   'moves'   ],
        ['sex',    'sexes'   ],
        ['child',  'children'],
        ['man',    'men'     ],
        ['person', 'people'  ]
    ],
    uncountable: [
        "sheep",
        "fish",
        "series",
        "species",
        "money",
        "rice",
        "information",
        "info",
        "equipment",
        "media"
    ]
};

ActiveSupport.Object.extend(ActiveSupport.Number,{
    /**
     * ActiveSupport.Number.ordinalize(number) -> String
     * Generates an ordinalized version of a number as a string (9th, 2nd, etc)
     **/
    ordinalize: function ordinalize(number)
    {
        if (11 <= parseInt(number, 10) % 100 && parseInt(number, 10) % 100 <= 13)
        {
            return number + "th";
        }
        else
        {
            switch (parseInt(number, 10) % 10)
            {
                case  1: return number + "st";
                case  2: return number + "nd";
                case  3: return number + "rd";
                default: return number + "th";
            }
        }
    }
});

ActiveSupport.Object.extend(ActiveSupport.String,{
    /**
     * ActiveSupport.String.pluralize(word) -> String
     * Generates a plural version of an english word.
     **/
    pluralize: function pluralize(word)
    {
        var i, lc = word.toLowerCase();
        for (i = 0; i < ActiveSupport.Inflections.uncountable.length; i++)
        {
            var uncountable = ActiveSupport.Inflections.uncountable[i];
            if (lc === uncountable)
            {
                return word;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.irregular.length; i++)
        {
            var singular = ActiveSupport.Inflections.irregular[i][0];
            var plural = ActiveSupport.Inflections.irregular[i][1];
            if ((lc === singular) || (lc === plural))
            {
                return plural;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.plural.length; i++)
        {
            var regex = ActiveSupport.Inflections.plural[i][0];
            var replace_string = ActiveSupport.Inflections.plural[i][1];
            if (regex.test(word))
            {
                return word.replace(regex, replace_string);
            }
        }
        return word;
    },
    /**
     * ActiveSupport.String.singularize(word) -> String
     * Generates a singular version of an english word.
     **/
    singularize: function singularize(word)
    {
        var i, lc = word.toLowerCase();
        for (i = 0; i < ActiveSupport.Inflections.uncountable.length; i++)
        {
            var uncountable = ActiveSupport.Inflections.uncountable[i];
            if (lc === uncountable)
            {
                return word;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.irregular.length; i++)
        {
            var singular = ActiveSupport.Inflections.irregular[i][0];
            var plural   = ActiveSupport.Inflections.irregular[i][1];
            if ((lc === singular) || (lc === plural))
            {
                return singular;
            }
        }
        for (i = 0; i < ActiveSupport.Inflections.singular.length; i++)
        {
            var regex = ActiveSupport.Inflections.singular[i][0];
            var replace_string = ActiveSupport.Inflections.singular[i][1];
            if (regex.test(word))
            {
                return word.replace(regex, replace_string);
            }
        }
        return word;
    }
});