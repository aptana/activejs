//var WhereLexer;
var WhereParser;

//(function() {

// token types
var $c$ = 0,
    ERROR              = -1,
    AND                = $c$++,
    COMMA              = $c$++,
    EQUAL              = $c$++,
    FALSE              = $c$++,
    GREATER_THAN       = $c$++,
    GREATER_THAN_EQUAL = $c$++,
    IDENTIFIER         = $c$++,
    IN                 = $c$++,
    LESS_THAN          = $c$++,
    LESS_THAN_EQUAL    = $c$++,
    LPAREN             = $c$++,
    NOT_EQUAL          = $c$++,
    NUMBER             = $c$++,
    RPAREN             = $c$++,
    STRING             = $c$++,
    TRUE               = $c$++,
    OR                 = $c$++,
    WHITESPACE         = $c$++;

// this is here mostly for debugging messages
var TypeMap = [];
TypeMap[AND]                = "AND";
TypeMap[COMMA]              = "COMMA";
TypeMap[EQUAL]              = "EQUAL";
TypeMap[FALSE]              = "FALSE";
TypeMap[GREATER_THAN]       = "GREATER_THAN";
TypeMap[GREATER_THAN_EQUAL] = "GREATER_THAN_EQUAL";
TypeMap[IDENTIFIER]         = "IDENTIFIER";
TypeMap[IN]                 = "IN";
TypeMap[LESS_THAN]          = "LESS_THAN";
TypeMap[LESS_THAN_EQUAL]    = "LESS_THAN_EQUAL";
TypeMap[LPAREN]             = "LPAREN";
TypeMap[NOT_EQUAL]          = "NOT_EQUAL";
TypeMap[NUMBER]             = "NUMBER";
TypeMap[RPAREN]             = "RPAREN";
TypeMap[STRING]             = "STRING";
TypeMap[TRUE]               = "TRUE";
TypeMap[OR]                 = "OR";
TypeMap[WHITESPACE]         = "WHITESPACE";

// map operators and keywords to their propery type
var OperatorMap = {
    "&&":    AND,
    ",":     COMMA,
    "||":    OR,
    "<":     LESS_THAN,
    "<=":    LESS_THAN_EQUAL,
    "=":     EQUAL,
    "!=":    NOT_EQUAL,
    ">":     GREATER_THAN,
    ">=":    GREATER_THAN_EQUAL,
    "(":     LPAREN,
    ")":     RPAREN
};
var KeywordMap = {
    "and":   AND,
    "false": FALSE,
    "in":    IN,
    "or":    OR,
    "true":  TRUE
};

// Lexer token patterns
var WHITESPACE_PATTERN = /^\s+/;
var IDENTIFIER_PATTERN = /^[a-zA-Z\_][a-zA-Z\_]*/;
var OPERATOR_PATTERN   = /^(?:&&|\|\||<=|<|=|!=|>=|>|,|\(|\))/i;
var KEYWORD_PATTERN    = /^(true|or|in|false|and)\b/i;
var STRING_PATTERN     = /^(?:'(\\.|[^'])*'|"(\\.|[^"])*")/;
var NUMBER_PATTERN     = /^[1-9][0-9]*/;

// Current lexeme to parse
var currentLexeme;

// *** Lexeme class ***

/*
 * Lexeme
 * 
 * @param {Number} type
 * @param {String} text
 */
function Lexeme(type, text)
{
    this.type = type;
    this.typeName = null;
    this.text = text;
}

/*
 * toString
 * 
 * @return {String}
 */
Lexeme.prototype.toString = function toString()
{
    if (this.typeName) 
    {
        return "[" + this.typeName + "]~" + this.text + "~";
    }
    else 
    {
        return "[" + this.type + "]~" + this.text + "~";
    }
};

// *** Lexer class ***

/*
 * WhereLexer
 */
function WhereLexer()
{
    // initialize
    this.setSource(null);
}

/*
 * setSource
 * 
 * @param {String} source
 */
WhereLexer.prototype.setSource = function setSource(source)
{
    this.source = source;
    this.offset = 0;
    this.length = (source !== null) ? source.length : 0;

    currentLexeme = null;
};

/*
 * advance
 */
WhereLexer.prototype.advance = function advance()
{
    var inWhitespace = true;
    var result = null;

    while (inWhitespace) 
    {
        // assume not in whitespace
        inWhitespace = false;

        // clear possible last whitespace result
        result = null;

        if (this.offset < this.length) 
        {
            var match, text, type;

            // NOTE: [KEL] Switching on the first character may speed things up
            // here.

            if ((match = WHITESPACE_PATTERN.exec(this.source)) !== null)
            {
                result = new Lexeme(WHITESPACE, match[0]);
                inWhitespace = true;
            }
            else if ((match = OPERATOR_PATTERN.exec(this.source)) !== null) 
            {
                text = match[0];
                type = OperatorMap[text.toLowerCase()];

                result = new Lexeme(type, text);
            }
            else if ((match = KEYWORD_PATTERN.exec(this.source)) !== null) 
            {
                text = match[0];
                type = KeywordMap[text.toLowerCase()];

                result = new Lexeme(type, text);
            }
            else if ((match = STRING_PATTERN.exec(this.source)) !== null) 
            {
                result = new Lexeme(STRING, match[0]);
            }
            else if ((match = NUMBER_PATTERN.exec(this.source)) !== null) 
            {
                result = new Lexeme(NUMBER, match[0]);
            }
            else if ((match = IDENTIFIER_PATTERN.exec(this.source)) !== null) 
            {
                result = new Lexeme(IDENTIFIER, match[0]);
            }
            else
            {
                result = new Lexeme(ERROR, this.source);
            }

            // assign type name, if we have one
            if (TypeMap[result.type]) 
            {
                result.typeName = TypeMap[result.type];
            }

            // update source state
            var length = result.text.length;
            this.offset += length;
            this.source = this.source.substring(length);
        }
    }

    // expose result
    currentLexeme = result;

    return result;
};

// Binary operator node

/*
 * BinaryOperatorNode
 * 
 * @param {Node} identifier
 * @param {Number} identifier
 * @param {Node} identifier
 */
function BinaryOperatorNode(lhs, operator, rhs)
{
    this.lhs = lhs;
    this.operator = operator;
    this.rhs = rhs;
}

/*
 * execute
 * 
 * @param {Object} row
 * @param {Function} functionProvider
 */
BinaryOperatorNode.prototype.execute = function execute(row, functionProvider)
{
    var result = null;
    var lhs = this.lhs.execute(row, functionProvider);

    if (this.operator == IN)
    {
        // assume failure
        result = false;

        // see if the lhs value is in the rhs list
        for (var i = 0; i < this.rhs.length; i++)
        {
            var rhs = this.rhs[i].execute(row, functionProvider);

            if (lhs == rhs)
            {
                result = true;
                break;
            }
        }
    }
    else
    {
        var rhs = this.rhs.execute(row, functionProvider);
        
        switch (this.operator)
        {
            case EQUAL:
                result = (lhs === rhs);
                break;
                
            case NOT_EQUAL:
                result = (lhs !== rhs);
                break;
                
            case LESS_THAN:
                result = (lhs < rhs);
                break;
                
            case LESS_THAN_EQUAL:
                result = (lhs <= rhs);
                break;
                
            case GREATER_THAN:
                result = (lhs > rhs);
                break;
                
            case GREATER_THAN_EQUAL:
                result = (lhs >= rhs);
                break;
                
            case AND:
                result = (lhs && rhs);
                break;
                
            case OR:
                result = (lhs || rhs);
                break;
                
            default:
                throw new Error("Unknown operator type: " + this.operator);
        }
    }
    
    return result;
};

// Identifer node

/*
 * Parser.IdentifierNode
 * 
 * @param {Object} identifier
 */
function IdentifierNode(identifier)
{
    this.identifier = identifier;
}

/*
 * execute
 * 
 * @param {Object} row
 * @param {Function} functionProvider
 */
IdentifierNode.prototype.execute = function execute(row, functionProvider)
{
    return row[this.identifier];
};

// Function node

/*
 * FunctionNode
 * 
 * @param {String} name
 * @param {Array} args
 */
function FunctionNode(name, args)
{
    this.name = name;
    this.args = args;
}

/*
 * execute
 * 
 * @param {Object} row
 * @param {Function} functionProvider
 */
FunctionNode.prototype.execute = function execute(row, functionProvider)
{
    // evaluate arguments
    var args = new Array(this.args.length);

    for (var i = 0; i < this.args.length; i++)
    {
        args[i] = this.args[i].execute(row, functionProvider);
    }

    // evaluate function and return result
    return functionProvider(this.name, row, args);
};

// Scalar node

/*
 * Parser.ScalarNode
 */
function ScalarNode(value)
{
    this.value = value;
}

/*
 * execute
 * 
 * @param {Object} row
 * @param {Function} functionProvider
 */
ScalarNode.prototype.execute = function execute(row, functionProvider)
{
    return this.value;
};


// Parser class

/*
 * WhereParser
 */
WhereParser = function WhereParser()
{
    this._lexer = new WhereLexer();
};

/*
 * parse
 * 
 * @param {String} source
 */
WhereParser.prototype.parse = function parse(source)
{
    var result = null;

    // clear current lexeme cache
    currentLexeme = null;

    // pass source to lexer
    this._lexer.setSource(source);

    // prime the lexeme pump
    this._lexer.advance();

    // parse it
    while (currentLexeme !== null)
    {
        // fast fail
        switch (currentLexeme.type)
        {
            case IDENTIFIER:
            case FALSE:
            case LPAREN:
            case NUMBER:
            case STRING:
            case TRUE:
                result = this.parseInExpression();
                break;

            default:
                throw new Error("Unrecognized starting token in where-clause:" + this._lexer.currentLexeme);
        }
    }
    return result;
};

/*
 * parseWhereExpression
 */
WhereParser.prototype.parseInExpression = function parseInExpression()
{
    var result = this.parseOrExpression();

    while (currentLexeme !== null && currentLexeme.type === IN) 
    {
        // advance over 'in'
        this._lexer.advance();

        var rhs = [];

        if (currentLexeme !== null && currentLexeme.type === LPAREN)
        {
            // advance over '('
            this._lexer.advance();

            while (currentLexeme !== null)
            {
                rhs.push(this.parseOrExpression());

                if (currentLexeme !== null && currentLexeme.type === COMMA)
                {
                    this._lexer.advance();
                }
                else
                {
                    break;
                }
            }

            if (currentLexeme !== null && currentLexeme.type === RPAREN)
            {
                this._lexer.advance();

                result = new BinaryOperatorNode(result, IN, rhs);
            }
            else
            {
                throw new Error("'in' list did not end with a right parenthesis." + currentLexeme);
            }
        }
        else
        {
            throw new Error("'in' list did not start with a left parenthesis");
        }
    }

    return result;
};

/*
 * parseOrExpression
 */
WhereParser.prototype.parseOrExpression = function parseOrExpression()
{
    var result = this.parseAndExpression();

    while (currentLexeme !== null && currentLexeme.type === OR) 
    {
        // advance over 'or' or '||'
        this._lexer.advance();

        var rhs = this.parseAndExpression();

        result = new BinaryOperatorNode(result, OR, rhs);
    }

    return result;
};

/*
 * parseAndExpression
 */
WhereParser.prototype.parseAndExpression = function parseAndExpression()
{
    var result = this.parseEqualityExpression();

    while (currentLexeme !== null && currentLexeme.type === AND) 
    {
        // advance over 'and' or '&&'
        this._lexer.advance();

        var rhs = this.parseEqualityExpression();

        result = new BinaryOperatorNode(result, AND, rhs);
    }

    return result;
};

/*
 * parseEqualityExpression
 */
WhereParser.prototype.parseEqualityExpression = function parseEqualityExpression()
{
    var result = this.parseRelationalExpression();

    if (currentLexeme !== null) 
    {
        var type = currentLexeme.type;

        switch (type)
        {
            case EQUAL:
            case NOT_EQUAL:
                // advance over '=' or '!='
                this._lexer.advance();

                var rhs = this.parseRelationalExpression();

                result = new BinaryOperatorNode(result, type, rhs);
                break;
        }
    }

    return result;
};

/*
 * parseRelationalExpression
 */
WhereParser.prototype.parseRelationalExpression = function()
{
    var result = this.parseMemberExpression();

    if (currentLexeme !== null) 
    {
        var type = currentLexeme.type;

        switch (type)
        {
            case LESS_THAN:
            case LESS_THAN_EQUAL:
            case GREATER_THAN:
            case GREATER_THAN_EQUAL:
                // advance over '<', '<=', '>' or '>='
                this._lexer.advance();

                var rhs = this.parseMemberExpression();

                result = new BinaryOperatorNode(result, type, rhs);
                break;
        }
    }

    return result;
};

/*
 * parseMemberExpression
 */
WhereParser.prototype.parseMemberExpression = function parseMemberExpression()
{
    var result = null;

    if (currentLexeme !== null) 
    {
        switch (currentLexeme.type)
        {
            case IDENTIFIER:
                result = new IdentifierNode(currentLexeme.text);
                // advance over identifier
                this._lexer.advance();

                if (currentLexeme !== null && currentLexeme.type === LPAREN) 
                {
                    // this is a function
                    var name = result.identifier;
                    var args = [];

                    // advance over '('
                    this._lexer.advance();

                    // process arguments
                    while (currentLexeme !== null && currentLexeme.type !== RPAREN) 
                    {
                        args.push(this.parseOrExpression());

                        if (currentLexeme !== null && currentLexeme.type === COMMA)
                        {
                            this._lexer.advance();
                        }
                    }

                    // advance over ')'
                    if (currentLexeme !== null) 
                    {
                        this._lexer.advance();
                        result = new FunctionNode(name, args);
                    }
                    else 
                    {
                        throw new Error("Function argument list was not closed with a right parenthesis.");
                    }
                }
                break;

            case TRUE:
                result = new ScalarNode(true);

                // advance over 'true'
                this._lexer.advance();
                break;

            case FALSE:
                result = new ScalarNode(false);

                // advance over 'false'
                this._lexer.advance();
                break;

            case NUMBER:
                result = new ScalarNode(currentLexeme.text - 0);

                // advance over number
                this._lexer.advance();
                break;

            case STRING:
                var text = currentLexeme.text;

                result = new ScalarNode(text.substring(1, text.length - 1));

                // advance over string
                this._lexer.advance();
                break;

            case LPAREN:
                // advance over '('
                this._lexer.advance();

                result = this.parseOrExpression();

                if (currentLexeme !== null && currentLexeme.type === RPAREN)
                {
                    // advance over ')'
                    this._lexer.advance();
                }
                else
                {
                    throw new Error("Missing closing right parenthesis: " + currentLexeme);
                }
                break;
        }
    }

    return result;
};


//})();

//ActiveRecord.WhereLexer = WhereLexer;
ActiveRecord.WhereParser = WhereParser;
