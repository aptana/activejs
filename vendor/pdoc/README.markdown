PDoc
====

PDoc is an inline comment parser and JavaScript documentation generator written in Ruby. It is designed for documenting [Prototype](http://prototypejs.org) and Prototype-based libraries.

PDoc uses [Treetop](http://treetop.rubyforge.org/), a Ruby-based DSL for text parsing and interpretation, and its own ActionView-inspired, ERB-based templating system for HTML generation. Other documentation generators (e.g., DocBook XML) are planned.

Unlike other inline-doc parsers, PDoc does not rely on the JavaScript source code at all; it only parses the comments. This approach, though slightly more verbose, is much better at generating consistent, reliable documentation, and avoids the headaches encountered when documenting highly dynamic languages.

## Installation

PDoc depends on Rake, your choice of markdown parser, and treetop, all of which can be obtained through RubyGems:

    gem install rake bluecloth treetop
    
## Usage

For hints on how to run PDoc on the command line, consult the built-in Rake tasks (in `Rakefile`) and the `PDoc::Runner` class (in `lib/pdoc/runner.rb`).

## How it works

The process of turning inline PDoc comments into a human-friendly document has two phases.

### Parsing phase
In this phase, the source files are scanned for PDoc comments, then parsed with the Ruby files generated from the Treetop language grammar. The product of this phase is a tree full of specialized classes, all of which inherit from `Treetop::Runtime::SyntaxNode`.

The root of the tree is an instance of `Documentation::Doc`. It comprises one or more instances of `Documentation::Section`; which in turn comprise language elements like namespaces, classes, constants, etc., all of which have class representations.

### Rendering phase
Next, PDoc asks a _generator_ how to translate this abstract tree into a hierarchical document. The default generator outputs organized HTML in a manner similar to [RDoc](http://rdoc.sourceforge.net/ "RDoc - Document Generator for Ruby Source")'s.

The HTML generator (`PDoc::Generators::Html`) has associated _templates_ (in the `templates` directory) that accept syntax nodes and echo their metadata onto the page using [ERB](http://www.ruby-doc.org/stdlib/libdoc/erb/rdoc/index.html "erb: Ruby Standard Library Documentation"). Templates are modular, so it's quite easy to apply a custom "skin" to one's documentation pages.

Furthermore, generators themselves are modular; PDoc can, theoretically, parse once and render to several different targets (HTML, [DocBook XML](http://www.docbook.org/ "DocBook.org"), CHM, PDF, even [ScriptDoc](http://www.scriptdoc.org/ "ScriptDoc.org: Dynamic Language Documentation").) We hope many such generators will exist in the future.