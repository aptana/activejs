require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class EbnfExpressionTest < Test::Unit::TestCase
  include PDocTestHelper
  include EbnfExpression
  
  def setup
    @parser = EbnfExpressionParser.new
  end
  
  def test_inspect
    ebnf = "Ajax.Responders.responders -> Array"
    assert_equal "#<EbnfExpression::KlassProperty @input=\"#{ebnf}\">", parse(ebnf).inspect
  end
  
  def test_instance_property
    ebnf = "Ajax.Response#responseJSON -> Array | Object | null"
    assert_parsed ebnf
    assert_equal InstanceProperty,             parse(ebnf).class
    assert_equal "Ajax.Response",              parse(ebnf).namespace
    assert_equal "responseJSON",               parse(ebnf).name
    assert_equal "Ajax.Response#responseJSON", parse(ebnf).full_name
    assert_equal "Response",                   parse(ebnf).klass_name
    assert_equal "Array | Object | null",      parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "a123#b456 -> Array | Object | null"
    assert_parsed ebnf
    assert_equal InstanceProperty,             parse(ebnf).class
    assert_equal "a123",                       parse(ebnf).namespace
    assert_equal "b456",                       parse(ebnf).name
    assert_equal "a123#b456",                  parse(ebnf).full_name
    assert_equal "a123",                       parse(ebnf).klass_name
    assert_equal "Array | Object | null",      parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_klass_property
    ebnf = "Ajax.Responders.responders -> Array"
    assert_parsed ebnf
    assert_equal KlassProperty,                parse(ebnf).class
    assert_equal "Ajax.Responders",            parse(ebnf).namespace
    assert_equal "responders",                 parse(ebnf).name
    assert_equal "Ajax.Responders.responders", parse(ebnf).full_name
    assert_equal "Responders",                 parse(ebnf).klass_name
    assert_equal "Array",                      parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "document.viewport.foo -> Bar"
    assert_parsed ebnf
    assert_equal KlassProperty,                parse(ebnf).class
    assert_equal "document.viewport",          parse(ebnf).namespace
    assert_equal "foo",                        parse(ebnf).name
    assert_equal "document.viewport.foo",      parse(ebnf).full_name
    assert_equal "viewport",                   parse(ebnf).klass_name
    assert_equal "Bar",                        parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_utility
    ebnf = "$(element) -> Element | Array"
    assert_parsed ebnf
    assert_parsed "$$() -> Array"
    assert_parsed "$w() -> Array"
    assert_parsed "$A() -> Array"
    assert_equal Utility,                      parse(ebnf).class
    assert_equal "",                           parse(ebnf).namespace
    assert_equal "$",                          parse(ebnf).name
    assert_equal "$",                          parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal %w[element],                  parse(ebnf).arguments.map(&:name)
    assert_equal "Element | Array",            parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_klass_method
    ebnf = "Element.update(@element[,content]) -> Element"
    assert_parsed ebnf
    assert_equal KlassMethod,                  parse(ebnf).class
    assert_equal "Element",                    parse(ebnf).namespace
    assert_equal "update",                     parse(ebnf).name
    assert_equal "Element.update",             parse(ebnf).full_name
    assert_equal "Element",                    parse(ebnf).klass_name
    assert_equal %w[element content],          parse(ebnf).arguments.map(&:name)
    assert_equal "Element",                    parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "document.viewport.getWidth() -> Number"
    assert_parsed ebnf
    assert_equal KlassMethod,                  parse(ebnf).class
    assert_equal "document.viewport",          parse(ebnf).namespace
    assert_equal "getWidth",                   parse(ebnf).name
    assert_equal "document.viewport.getWidth", parse(ebnf).full_name
    assert_equal "viewport",                   parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).arguments
    assert_equal "Number",                     parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_instance_method
    ebnf = "Element#update([content]) -> Element"
    assert_parsed ebnf
    assert_equal InstanceMethod,               parse(ebnf).class
    assert_equal "Element",                    parse(ebnf).namespace
    assert_equal "update",                     parse(ebnf).name
    assert_equal "Element#update",             parse(ebnf).full_name
    assert_equal "Element",                    parse(ebnf).klass_name
    assert_equal %w[content],                  parse(ebnf).arguments.map(&:name)
    assert_equal "Element",                    parse(ebnf).returns
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_constructors
    ebnf = "new Element(tagName[,attributes])"
    assert_parsed ebnf
    assert_equal Constructor,                  parse(ebnf).class
    assert_equal "Element",                    parse(ebnf).namespace
    assert_equal "new",                        parse(ebnf).name
    assert_equal "new Element",                parse(ebnf).full_name
    assert_equal "Element",                    parse(ebnf).klass_name
    assert_equal %w[tagName attributes],       parse(ebnf).arguments.map(&:name)
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "new Ajax.Request(url[,options])"
    assert_parsed ebnf
    assert_equal Constructor,                  parse(ebnf).class
    assert_equal "Ajax.Request",               parse(ebnf).namespace
    assert_equal "new",                        parse(ebnf).name
    assert_equal "new Ajax.Request",           parse(ebnf).full_name
    assert_equal "Request",                    parse(ebnf).klass_name
    assert_equal %w[url options],              parse(ebnf).arguments.map(&:name)
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  
  def test_klass
    ebnf = "class Ajax.Base"
    assert_parsed ebnf
    assert_equal Klass,                        parse(ebnf).class
    assert_equal "Ajax",                       parse(ebnf).namespace
    assert_equal "Base",                       parse(ebnf).name
    assert_equal "Ajax.Base",                  parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "class Element"
    assert_parsed ebnf
    assert_equal Klass,                        parse(ebnf).class
    assert_equal "",                           parse(ebnf).namespace
    assert_equal "Element",                    parse(ebnf).name
    assert_equal "Element",                    parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert                                    !parse(ebnf).subklass?
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "class Ajax.Request < Ajax.Base"
    assert_parsed ebnf
    assert_equal Klass,                        parse(ebnf).class
    assert_equal "Ajax",                       parse(ebnf).namespace
    assert_equal "Request",                    parse(ebnf).name
    assert_equal "Ajax.Request",               parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert                                     parse(ebnf).subklass?
    assert_equal "Base",                       parse(ebnf).superklass.name
    assert_equal "Ajax",                       parse(ebnf).superklass.namespace
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "class Array\n * includes Enumerable"
    assert_parsed ebnf
    assert_equal %w[Enumerable],               parse(ebnf).mixins.map(&:name)
    assert_equal [""],                         parse(ebnf).mixins.map(&:namespace)
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "class Array\n * includes Enumerable, Foo.Comparable"
    assert_parsed ebnf
    assert_equal %w[Enumerable Comparable],    parse(ebnf).mixins.map(&:name)
    assert_equal ["", "Foo"],                  parse(ebnf).mixins.map(&:namespace)
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_namespace
    ebnf = "Prototype.Browser"
    assert_parsed ebnf
    assert_equal Namespace,                    parse(ebnf).class
    assert_equal "Prototype",                  parse(ebnf).namespace
    assert_equal "Browser",                    parse(ebnf).name
    assert_equal "Prototype.Browser",          parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "Ajax"
    assert_parsed ebnf
    assert_equal Namespace,                    parse(ebnf).class
    assert_equal "",                           parse(ebnf).namespace
    assert_equal "Ajax",                       parse(ebnf).name
    assert_equal "Ajax",                       parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "scripty2"
    assert_parsed ebnf
    assert_equal Namespace,                    parse(ebnf).class
    assert_equal "",                           parse(ebnf).namespace
    assert_equal "scripty2",                   parse(ebnf).name
    assert_equal "scripty2",                   parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "Ajax\n * includes Enumerable"
    assert_parsed ebnf
    assert_equal Namespace,                    parse(ebnf).class
    assert_equal "",                           parse(ebnf).namespace
    assert_equal "Ajax",                       parse(ebnf).name
    assert_equal "Ajax",                       parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal %w[Enumerable],               parse(ebnf).mixins.map(&:name)
    assert_equal [""],                         parse(ebnf).mixins.map(&:namespace)
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "document"
    assert_parsed ebnf
    assert_equal Namespace,                    parse(ebnf).class
    assert_equal "",                           parse(ebnf).namespace
    assert_equal "document",                   parse(ebnf).name
    assert_equal "document",                   parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
    
    ebnf = "document.viewport"
    assert_parsed ebnf
    assert_equal Namespace,                    parse(ebnf).class
    assert_equal "document",                   parse(ebnf).namespace
    assert_equal "viewport",                   parse(ebnf).name
    assert_equal "document.viewport",          parse(ebnf).full_name
    assert_equal nil,                          parse(ebnf).klass_name
    assert_equal [],                           parse(ebnf).mixins
    assert_equal ebnf,                         parse(ebnf).to_s
  end
  
  def test_mixin
    ebnf = "mixin Enumerable"
    assert_parsed ebnf
    assert_equal Mixin,                              parse(ebnf).class
    assert_equal "",                                 parse(ebnf).namespace
    assert_equal "Enumerable",                       parse(ebnf).name
    assert_equal "Enumerable",                       parse(ebnf).full_name
    assert_equal ebnf,                               parse(ebnf).to_s
  end
  
  def test_constant
    ebnf = "Prototype.JSONFilter = /^\/\*-secure-([\s\S]*)\*\/\s*$/"
    assert_parsed ebnf
    assert_equal Constant,                           parse(ebnf).class
    assert_equal "Prototype",                        parse(ebnf).namespace
    assert_equal "JSONFilter",                       parse(ebnf).name
    assert_equal "Prototype.JSONFilter",             parse(ebnf).full_name
    assert_equal "/^\/\*-secure-([\s\S]*)\*\/\s*$/", parse(ebnf).returns
    assert_equal ebnf,                               parse(ebnf).to_s
    
    ebnf = "s2.css.LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/"
    assert_parsed ebnf
    assert_equal Constant,                           parse(ebnf).class
    assert_equal "s2.css",                           parse(ebnf).namespace
    assert_equal "LENGTH",                           parse(ebnf).name
    assert_equal "s2.css.LENGTH",                    parse(ebnf).full_name
    assert_equal "/^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/", parse(ebnf).returns
    assert_equal ebnf,                               parse(ebnf).to_s
  end
  
  def test_no_arguments
    assert_parsed "Event#stop() -> a value"
    assert_parsed "Event#stop(   ) -> a value"
    assert_equal [], parse("Event#stop() -> a value").arguments
    assert_equal [], parse("Event#stop(   ) -> a value").arguments
  end
  
  def test_one_required_argument
    ebnf            = "Event.stop(event) -> Event"
    ebnf_with_space = "Event.stop( event ) -> Event"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert_equal 1,                     parse(ebnf).arguments.length
    assert_equal 1,                     parse(ebnf_with_space).arguments.length
    assert_equal "event",               parse(ebnf).arguments.first.name
    assert_equal nil,                   parse(ebnf).arguments.first.default_value
    assert_equal false,                 parse(ebnf).arguments.first.optional?
  end
  
  def test_multiple_required_arguments
    ebnf            = "Event.findElement(event,selector) -> Event"
    ebnf_with_space = "Event.findElement( event , selector ) -> Event"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert_equal 2,                     parse(ebnf).arguments.length
    assert_equal 2,                     parse(ebnf_with_space).arguments.length
    assert_equal ["event", "selector"], parse(ebnf).arguments.map(&:name)
    assert_equal [nil, nil],            parse(ebnf).arguments.map(&:default_value)
    assert_equal [false, false],        parse(ebnf).arguments.map(&:optional?)
  end
  
  def test_one_optional_argument
    ebnf            = "Element#update([content]) -> Element"
    ebnf_with_space = "Element#update(   [   content ]   ) -> Element"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert_equal 1,                     parse(ebnf).arguments.length
    assert_equal 1,                     parse(ebnf_with_space).arguments.length
    assert_equal "content",             parse(ebnf).arguments.first.name
    assert_equal nil,                   parse(ebnf).arguments.first.default_value
    assert_equal true,                  parse(ebnf).arguments.first.optional?
  end
  
  def test_one_optional_argument_with_default_value
    ebnf            = "Element#update([content='']) -> Element"
    ebnf_with_space = "Element#update(   [   content='' ]   ) -> Element"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert_equal 1,                     parse(ebnf).arguments.length
    assert_equal 1,                     parse(ebnf_with_space).arguments.length
    assert_equal "content",             parse(ebnf).arguments.first.name
    assert_equal "''",                  parse(ebnf).arguments.first.default_value
    assert_equal true,                  parse(ebnf).arguments.first.optional?
  end
  
  def test_multiple_optional_arguments
    ebnf            = "Element#down([selector][,index=0]) -> Element"
    ebnf_with_space = "Element#down( [ selector ] [ , index=0 ] ) -> Element"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert_equal 2,                     parse(ebnf).arguments.length
    assert_equal 2,                     parse(ebnf_with_space).arguments.length
    assert_equal ["selector", "index"], parse(ebnf).arguments.map(&:name)
    assert_equal [nil, "0"],            parse(ebnf).arguments.map(&:default_value)
    assert_equal [true, true],          parse(ebnf).arguments.map(&:optional?)
  end
  
  def test_multiple_mixed_arguments
    ebnf            = "Element.down(element[,selector][,index=0]) -> Element"
    ebnf_with_space = "Element.down( element [ , selector ] [ , index=0 ] ) -> Element"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert_equal 3,                                parse(ebnf).arguments.length
    assert_equal 3,                                parse(ebnf_with_space).arguments.length
    assert_equal ["element", "selector", "index"], parse(ebnf).arguments.map(&:name)
    assert_equal [nil, nil, "0"],                  parse(ebnf).arguments.map(&:default_value)
    assert_equal [false, true, true],              parse(ebnf).arguments.map(&:optional?)
  end
  
  def test_methodized_argument
    ebnf            = "Element.down(@element[,selector][,index=0]) -> Element"
    ebnf_with_space = "Element.down( @element [ , selector ] [ , index=0 ] ) -> Element"
    ebnf2           = "Element.writeAttribute(@element, attribute[, value = true]) -> Element"
    
    assert_parsed ebnf
    assert_parsed ebnf_with_space
    assert parse(ebnf).methodized?
    assert parse(ebnf_with_space).methodized?
    assert !parse("Event#stop() -> a value").methodized?
    assert_equal 3,                                parse(ebnf).arguments.length
    assert_equal 3,                                parse(ebnf2).arguments.length
    assert_equal 3,                                parse(ebnf_with_space).arguments.length
    assert_equal ["element", "selector", "index"], parse(ebnf).arguments.map(&:name)
    assert_equal ['element', 'attribute', 'value'],parse(ebnf2).arguments.map(&:name)
    assert_equal [nil, nil, "0"],                  parse(ebnf).arguments.map(&:default_value)
    assert_equal [nil, nil, "true"],               parse(ebnf2).arguments.map(&:default_value)
    assert_equal [false, true, true],              parse(ebnf).arguments.map(&:optional?)
    assert_equal [false, false, true],             parse(ebnf2).arguments.map(&:optional?)
  end
end
