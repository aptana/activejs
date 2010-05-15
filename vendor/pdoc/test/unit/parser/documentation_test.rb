require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class DocumentationTest < Test::Unit::TestCase
  include PDocTestHelper
  include Documentation
  @@fixtures = nil
  
  def setup
    @parser = DocumentationParser.new
  end
  
  def fixtures
    @@fixtures ||= parse_file("ajax.js") # rather hacky, I know.
  end
  
  def test_listing_methods
    %w(klass_methods instance_methods constructors constants
    descendants globals klass_properties instance_properties utilities
    klasses).each do |method|
      assert_respond_to fixtures, method
    end
    assert_equal 34, fixtures.size
  end
  
  def test_globals
    assert_equal %w[$ $$ Ajax Element Enumerable String Toggle], fixtures.globals.map(&:name).sort
  end
  
  def test_descendants
    assert_equal %w[$ $$ Ajax Base Element Enumerable Manager Request Responders String Toggle],
      fixtures.descendants.map(&:name).sort
  end
  
  def test_mixins
    assert_equal %w[Enumerable], fixtures.mixins.map(&:name)
  end
  
  def test_sections
    assert_equal %w[DOM ajax lang],                fixtures.sections.map(&:name)
    assert_equal [Section, Section, Section],      fixtures.sections.map(&:class)
    assert_equal %w[Ajax],                         fixtures.sections[1].children.map(&:name)
    assert_equal %w[Ajax Base Manager Request Responders], fixtures.sections[1].descendants.map(&:name)
  end
  
  def test_find_by_name
    assert_equal "Ajax",                   fixtures.find_by_name("Ajax").name
    assert_equal "Responders",             fixtures.find_by_name("Ajax.Responders").name
    assert_equal nil,                      fixtures.find_by_name("Foo.bar")
  end
  
  def test_root
    assert_equal Doc,                      fixtures.find_by_name("Ajax").root.class
  end
  
  def test_namespace
    fixture = fixtures.find_by_name("Ajax")
    assert_equal Namespace,                fixture.class
    assert_equal [],                       fixture.mixins
    assert_equal "Ajax",                   fixture.name
    assert_equal "ajax",                   fixture.section.name
    assert_equal "",                       fixture.namespace_string
    assert_equal nil,                      fixture.namespace
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal %w[__private__ getTransport], fixture.klass_methods.map(&:name)
    assert_equal %w[activeRequestCount],   fixture.klass_properties.map(&:name)
    assert_equal [],                       fixture.instance_methods
    assert_equal [],                       fixture.instance_properties
    assert_equal [],                       fixture.related_utilities
    assert_equal "ajax",                   fixture.doc_parent.name
    assert_equal %w[ajax],                 fixture.ancestors.map(&:name)
    assert_equal %w[Base Request Responders], fixture.children.map(&:name)
    assert_equal %w[Base Request Responders], fixture.descendants.map(&:name)
    
    fixture = fixtures.find_by_name("Ajax.Responders")
    assert_equal Namespace,                fixture.class
    assert                                !fixture.mixin?
    assert_equal ["Enumerable"],           fixture.mixins.map(&:name)
    assert_equal [Mixin],                  fixture.mixins.map(&:class)
    assert_equal "Responders",             fixture.name
    assert_equal "ajax",                   fixture.section.name
    assert_equal "Ajax",                   fixture.namespace_string
    assert_equal "Ajax",                   fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Ajax",                   fixture.doc_parent.name
    assert_equal %w[Ajax ajax],            fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_mixin
    fixture = fixtures.find_by_name("Enumerable")
    assert_equal Mixin,                    fixture.class
    assert                                 fixture.mixin?
    assert_equal "Enumerable",             fixture.name
    assert_equal "lang",                   fixture.section.name
    assert_equal "",                       fixture.namespace_string
    assert_equal nil,                      fixture.namespace
    assert_equal [],                       fixture.klass_methods
    assert_equal [],                       fixture.klass_properties
    assert_equal ["each"],                 fixture.instance_methods.map(&:name)
    assert_equal [],                       fixture.instance_properties
    assert_equal [],                       fixture.related_utilities
    assert_equal "lang",                   fixture.doc_parent.name
    assert_equal %w[lang],                 fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_klass
    fixture = fixtures.find_by_name("Ajax.Base")
    assert_equal Klass,                    fixture.class
    assert_equal "Base",                   fixture.name
    assert_equal "Ajax",                   fixture.namespace_string
    assert_equal "Ajax.Base",              fixture.full_name
    assert_equal [],                       fixture.mixins
    assert_equal %w[Request],              fixture.subklasses.map(&:name)
    assert                                !fixture.mixin?
    assert                                !fixture.subklass?
    assert_equal nil,                      fixture.superklass
    assert                                 fixture.superklass?
    assert_equal "ajax",                   fixture.section.name
    assert_equal "Ajax",                   fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal [],                       fixture.klass_methods
    assert_equal [],                       fixture.methodized_methods
    assert_equal [],                       fixture.klass_properties
    assert_equal [],                       fixture.instance_methods
    assert_equal [],                       fixture.instance_properties
    assert_equal [],                       fixture.related_utilities
    assert_equal "Ajax",                   fixture.doc_parent.name
    assert_equal %w[Ajax ajax],            fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("Ajax.Request")
    assert_equal Klass,                    fixture.class
    assert_equal "Request",                fixture.name
    assert_equal "Ajax",                   fixture.namespace_string
    assert_equal "Ajax.Request",           fixture.full_name
    assert_equal fixtures.find_by_name("new Ajax.Request"),  fixture.constructor
    assert_equal [],                       fixture.mixins
    assert_equal [],                       fixture.subklasses
    assert                                !fixture.mixin?
    assert                                 fixture.subklass?
    assert                                !fixture.superklass?
    assert_equal "Ajax.Base",              fixture.superklass.full_name
    assert_equal Klass,                    fixture.superklass.class
    assert_equal "ajax",                   fixture.section.name
    assert_equal "Ajax",                   fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal [],                       fixture.klass_methods
    assert_equal [],                       fixture.methodized_methods
    assert_equal %w[classProp],            fixture.klass_properties.map(&:name)
    assert_equal %w[request success],      fixture.instance_methods.map(&:name)
    assert_equal %w[dummy],                fixture.instance_properties.map(&:name)
    assert_equal %w[Events],               fixture.constants.map(&:name)
    assert_equal [],                       fixture.related_utilities
    assert_equal "Ajax",                   fixture.doc_parent.name
    assert_equal %w[Ajax ajax],            fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("Element")
    assert_equal Klass,                    fixture.class
    assert_equal %w[setStyle],             fixture.klass_methods.map(&:name)
    assert_equal %w[setStyle],             fixture.methodized_methods.map(&:name)
    assert_equal [],                       fixture.klass_properties
    assert_equal %w[bar foo],              fixture.instance_methods.map(&:name)
    assert_equal [],                       fixture.instance_properties
    assert_equal %w[$],                    fixture.related_utilities.map(&:name)
    assert_equal "DOM",                    fixture.doc_parent.name
    assert_equal %w[DOM],                  fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("String")
    assert_equal Klass,                    fixture.class
    assert_equal %w[interpret],            fixture.klass_methods.map(&:name)
  end
  
  def test_klass_method
    fixture = fixtures.find_by_name("String.interpret")
    assert_equal KlassMethod,              fixture.class
    assert_equal "interpret",              fixture.name
    assert_equal "String",                 fixture.namespace_string
    assert_equal "String.interpret",       fixture.full_name
    assert_equal "String",                 fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "String",                 fixture.klass.full_name
    assert_equal "lang",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "String",                 fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "String",                 fixture.doc_parent.name
    assert_equal %w[String lang],          fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("Ajax.getTransport")
    assert_equal KlassMethod,              fixture.class
    assert_equal "getTransport",           fixture.name
    assert_equal "Ajax",                   fixture.namespace_string
    assert_equal "Ajax.getTransport",      fixture.full_name
    assert_equal nil,                      fixture.klass_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Namespace,                fixture.namespace.class
    assert_equal "Ajax",                   fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Ajax",                   fixture.doc_parent.name
    assert_equal %w[Ajax ajax],            fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_klass_properties
    fixture = fixtures.find_by_name("Ajax.Request.classProp")
    assert_equal KlassProperty,            fixture.class
    assert_equal "classProp",              fixture.name
    assert_equal "Ajax.Request",           fixture.namespace_string
    assert_equal "Ajax.Request.classProp", fixture.full_name
    assert_equal "Request",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Ajax.Request",           fixture.klass.full_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Ajax.Request",           fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Request",                fixture.doc_parent.name
    assert_equal %w[Request Ajax ajax],    fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_utilities
    fixture = fixtures.find_by_name("$")
    assert_equal Utility,                  fixture.class
    assert_equal "$",                      fixture.name
    assert_equal "",                       fixture.namespace_string
    assert_equal "$",                      fixture.full_name
    assert_equal nil,                      fixture.klass_name
    assert_equal "DOM",                    fixture.section.name
    assert_equal fixtures.find_by_name("Element"), fixture.related_to
    assert_equal nil,                      fixture.namespace
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "DOM",                    fixture.doc_parent.name
    assert_equal %w[DOM],                  fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("$$")
    assert_equal Utility,                  fixture.class
    assert_equal "DOM",                    fixture.section.name
    assert_equal nil,                      fixture.related_to
  end
  
  def test_constants
    fixture = fixtures.find_by_name("Ajax.Request.Events")
    assert_equal Constant,                 fixture.class
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Events",                 fixture.name
    assert_equal "Ajax.Request",           fixture.namespace_string
    assert_equal "Ajax.Request.Events",    fixture.full_name
    assert_equal "Request",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Ajax.Request",           fixture.klass.full_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Ajax.Request",           fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Request",                fixture.doc_parent.name
    assert_equal %w[Request Ajax ajax],    fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants

    fixture = fixtures.find_by_name("Ajax.Request.classProp")
    assert_equal KlassProperty,            fixture.class
    assert_equal "classProp",              fixture.name
    assert_equal "Ajax.Request",           fixture.namespace_string
    assert_equal "Ajax.Request.classProp", fixture.full_name
    assert_equal "Request",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Ajax.Request",           fixture.klass.full_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Ajax.Request",           fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Request",                fixture.doc_parent.name
    assert_equal %w[Request Ajax ajax],    fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_instance_properties
    fixture = fixtures.find_by_name("Ajax.Request#dummy")
    assert_equal InstanceProperty,         fixture.class
    assert_equal "dummy",                  fixture.name
    assert_equal "Ajax.Request",           fixture.namespace_string
    assert_equal "Ajax.Request#dummy",     fixture.full_name
    assert_equal "Request",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Ajax.Request",           fixture.klass.full_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Ajax.Request",           fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Request",                fixture.doc_parent.name
    assert_equal %w[Request Ajax ajax],    fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_instance_method
    fixture = fixtures.find_by_name("Ajax.Request#request")
    assert_equal InstanceMethod,           fixture.class
    assert_equal "request",                fixture.name
    assert_equal "Ajax.Request",           fixture.namespace_string
    assert_equal "Ajax.Request#request",   fixture.full_name
    assert_equal "Request",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Ajax.Request",           fixture.klass.full_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Ajax.Request",           fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert                                !fixture.methodized?
    assert_equal "Request",                fixture.doc_parent.name
    assert_equal %w[Request Ajax ajax],    fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("Element.setStyle")
    assert_equal KlassMethod,              fixture.class
    assert_equal "setStyle",               fixture.name
    assert_equal "Element",                fixture.namespace_string
    assert_equal "Element.setStyle",       fixture.full_name
    assert_equal "Element",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Element",                fixture.klass.full_name
    assert_equal "DOM",                    fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Element",                fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert                                 fixture.methodized?
    assert_equal "Element",                fixture.doc_parent.name
    assert_equal %w[Element DOM],          fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_constructor
    fixture = fixtures.find_by_name("new Ajax.Request")
    assert_equal Constructor,              fixture.class
    assert_equal "new",                    fixture.name
    assert_equal "Ajax.Request",           fixture.namespace_string
    assert_equal "new Ajax.Request",       fixture.full_name
    assert_equal "Request",                fixture.klass_name
    assert_equal Klass,                    fixture.klass.class
    assert_equal "Ajax.Request",           fixture.klass.full_name
    assert_equal "ajax",                   fixture.section.name
    assert_equal Klass,                    fixture.namespace.class
    assert_equal "Ajax.Request",           fixture.namespace.full_name
    assert                                !fixture.deprecated?
    assert                                !fixture.alias?
    assert                                !fixture.methodized?
    assert_equal "Request",                fixture.doc_parent.name
    assert_equal %w[Request Ajax ajax],    fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_deprecated
    fixture = fixtures.find_by_name("Toggle")    
    
    assert_equal Namespace,                fixture.class
    assert_equal [],                       fixture.mixins
    assert_equal "Toggle",                 fixture.name
    assert_equal nil,                      fixture.klass
    assert_equal "DOM",                    fixture.section.name
    assert_equal "",                       fixture.namespace_string
    assert_equal nil,                      fixture.namespace
    assert                                 fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal %w[display foo],          fixture.klass_methods.map(&:name)
    assert_equal [],                       fixture.klass_properties
    assert_equal [],                       fixture.instance_methods
    assert_equal [],                       fixture.instance_properties
    assert_equal [],                       fixture.related_utilities
    assert_equal "DOM",                    fixture.doc_parent.name
    assert_equal %w[DOM],                  fixture.ancestors.map(&:name)
    assert_equal %w[],                     fixture.children.map(&:name)
    assert_equal %w[],                     fixture.descendants.map(&:name)
    
    fixture = fixtures.find_by_name("Toggle.display")
    assert_equal KlassMethod,              fixture.class
    assert_equal "display",                fixture.name
    assert_equal "Toggle",                 fixture.namespace_string
    assert_equal "Toggle.display",         fixture.full_name
    assert_equal nil,                      fixture.klass_name
    assert_equal "DOM",                    fixture.section.name
    assert_equal Namespace,                fixture.namespace.class
    assert_equal "Toggle",                 fixture.namespace.full_name
    assert                                 fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Toggle",                 fixture.doc_parent.name
    assert_equal %w[Toggle DOM],           fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
    
    fixture = fixtures.find_by_name("Toggle.foo")
    assert_equal KlassMethod,              fixture.class
    assert_equal "foo",                    fixture.name
    assert_equal "Toggle",                 fixture.namespace_string
    assert_equal "Toggle.foo",             fixture.full_name
    assert_equal nil,                      fixture.klass_name
    assert_equal "DOM",                    fixture.section.name
    assert_equal Namespace,                fixture.namespace.class
    assert_equal "Toggle",                 fixture.namespace.full_name
    assert                                 fixture.deprecated?
    assert                                !fixture.alias?
    assert_equal "Toggle",                 fixture.doc_parent.name
    assert_equal %w[Toggle DOM],           fixture.ancestors.map(&:name)
    assert_equal [],                       fixture.children
    assert_equal [],                       fixture.descendants
  end
  
  def test_description
    assert_equal "The Element class",      fixtures.find_by_name("Element").description
    assert_equal "Sets the style of element\nand returns it", fixtures.find_by_name("Element.setStyle").description
    assert_equal "Calls `iterator` for each item in the collection.", fixtures.find_by_name("Enumerable#each").description
  end
  
  def test_arguments_descriptions
    fixture = fixtures.find_by_name("Element.setStyle")
    assert_equal %w[element styles],       fixture.arguments.map(&:name)
    assert_equal %w[String Element],       fixture.arguments.first.types
    assert_equal "an id or DOM node",      fixture.arguments.first.description
    assert_equal %w[String Object Hash],   fixture.arguments.last.types
    assert_equal "can be either a regular CSS string or a hash or regular object, in which case, properties need to be camelized",
      fixture.arguments.last.description
    
    assert_equal [],                       fixtures.find_by_name("Element#foo").arguments
  end
  
  def test_event
    assert_equal %w[element:style:updated], fixtures.find_by_name("Element.setStyle").fires
    assert_equal [],                       fixtures.find_by_name("Element#foo").fires
    assert_equal %w[click],                fixtures.find_by_name("Element#bar").fires
  end
  
  def test_aliases
    fixture = fixtures.find_by_name("Element.setStyle")
    assert_equal [],                       fixture.aliases
    assert                                !fixture.alias?
    assert_equal nil,                      fixture.alias_of
    
    fixture = fixtures.find_by_name("Element#foo")
    assert_equal ["bar"],                  fixture.aliases.map(&:name)
    assert                                !fixture.alias?
    assert_equal nil,                      fixture.alias_of 
    
    fixture = fixtures.find_by_name("Element#bar")
    assert_equal [],                       fixture.aliases.map(&:name)
    assert                                 fixture.alias?
    assert_equal "foo",                    fixture.alias_of.name
  end
  
  def test_weird
    weird = parse(<<-EOS
    
      /** section: DOM
       *  document
       *
       *  Prototype extends the built-in `document` object with several convenience
       *  methods related to events.
      **/
      
      
    EOS
    )
    doc = weird.find_by_name("document")
    assert_equal 'document', doc.name
    assert_equal Documentation::Namespace, doc.class
  end
  
  def test_weirder
    weird = parse(<<-EOS
    
    /**
     *  document.viewport
     *
     *  The `document.viewport` namespace contains methods that return information
     *  about the viewport &mdash; the rectangle that represents the portion of a web
     *  page within view. In other words, it's the browser window minus all chrome.
    **/
      
      
    EOS
    )
    doc = weird.find_by_name("document.viewport")
    assert_equal 'viewport', doc.name
    assert_equal Documentation::Namespace, doc.class
  end
  
  def test_weirdest

  end  
end
