Syntax
======

Comments
--------

Documentation comments start with `/**` and end with `**/`. Each new line starts with `*`. 

    /** ...
     *  ...
     **/

Tags (optional)
----

The first line of a comment is reserved for tags. Tags are optional. Tags are separated by a comma followed by whitespace (", "). They can be either a tag name or a key / value pair separated by a colon and a space (`: `).

Currently accepted tags are: `deprecated`, `section:`, `alias of:`, `related to:`

    /** deprecated, section: DOM, alias of: Element#descendantOf
     *  Element#childOf(@element, className) -> Element
     *  ...
     **/



EBNF
----

The lines directly following tags are reserved for the EBNF description of the documented object. Typically, there's only one EBNF per documented object. However, some objects might require more than one.

    /** 
     *  Element#down(@element[, cssSelector][, index]) -> Element | null
     *  ...
     **/
     
    /** 
     *  Element#writeAttribute(@element, attribute[, value = true]) -> Element
     *  Element#writeAttribute(@element, attributes) -> Element
     *  ...
     **/
     
### Arguments

For all methods, functions, etc. parentheses around the arguments are required even if no arguments are present.
The syntax for arguments is as follows:

#### required arguments

    /** 
     *  Event.stop(event) -> Event
     *  ...
     **/
     
#### optional arguments

Optional arguments are surrounded by squared brackets (`[]`).

    /** 
     *  String#evalJSON([sanitize]) -> Object | Array
     *  ...
     **/

A default value may be indicated using the equal sign (`=`).
     
    /** 
     *  String#evalJSON([sanitize = false]) -> Object | Array
     *  ...
     **/
     

Note that the argument separating comas belong _inside_ the brackets.

    /** 
     *  Event.findElement(event[, cssSelector]) -> Element | null
     *  ...
     **/     
     
Arguments can be described below the EBNF description using the following syntax:
    
    - argumentName (acceptedType | otherAcceptedType | ...): description.
     
For example: 

    /** 
     *  Event.findElement(event[, cssSelector]) -> Element | null
     *  - event (Event): a native Event instance
     *  - cssSelector (String): a optional CSS selector which uses
     *  the same syntax found in regular CSS.
     **/
     
### Supported EBNF types

#### Namespace

    /** 
     *  Ajax
     *  ...
     **/
     
    /** 
     *  Prototype.Browser
     *  ...
     **/
     
#### Classes

Classes require a `class` prefix:

    /** 
     *  class Ajax.Base
     *  ...
     **/

Sub-classes can indicate their parent just like in the Ruby syntax:

    /** 
     *  class Ajax.Request < Ajax.Base
     *  ...
     **/

Where `Ajax.Base` is the parent class and `Ajax.Request` the subclass.

Included mixins are indicated like so:

    /** 
     *  class CustomHash
     *  includes Enumerable, Comparable
     **/

#### Mixins

Mixins are indicated by a `mixin` prefix:

    /** 
     *  mixin Enumerable
     *  ...
     **/

#### Constructors

Constructors require the `new` prefix and their arguments.

    /** 
     *  new Element(tagName[, attributes])
     *  ...
     **/
          
    /** 
     *  new Foobar()
     *  ...
     **/
     
#### Klass Methods

Klass methods are identified by a dot (`.`).

    /** 
     *  Array.from([iterable]) -> Array
     *  ...
     **/

#### Instance Methods

Instance methods are identified by the hash symbol (`#`).

    /** 
     *  Array#first() -> Array element
     *  ...
     **/
     
#### Utilities

Utilities are global functions starting with a dollar-sign (`$`).

    /** 
     *  $w(string) -> Array
     *  ...
     **/
     
#### Methodized Methods

Methodized methods are methods which are both available as a class method and an instance method, in which case the first argument becomes the instance object itself. For example, all of `Element`'s instance methods are methodized and thus also available as class methods of `Element`. Methodized methods are indicated by prefixing their first argument with the `@` symbol.

    /** 
     *  Element#hide(@element) -> Element
     *  ...
     **/
     
#### Klass Properties

Klass properties are identified by a dot (`.`).

    /** 
     *  Ajax.Responders.responders -> Array
     *  ...
     **/
     
#### Instance Properties

Instance properties are identified by the hash symbol (`#`).

    /** 
     *  Ajax.Response#responseText -> String
     *  ...
     **/
     
#### Constants

Constant must have their value specified using the equal sign (`=`).

    /** 
     *  Prototype.JSONFilter = /^\/\*-secure-([\s\S]*)\*\/\s*$/
     *  ...
     **/
     
### Events

Some methods can fire native or custom events. These are indicated below the arguments descriptions:

    /** 
     *  Ajax.Request#respondToReadyState(readyState) -> undefined
     *  - readyState (Number): a number from 0 to 4 corresponding to the state of the request.
     *  fires ajax:created, ajax:completed
     **/

