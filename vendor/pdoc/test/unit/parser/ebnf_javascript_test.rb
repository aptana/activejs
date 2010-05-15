require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class EbnfJavascriptTest < Test::Unit::TestCase
  include PDocTestHelper
  
  def setup
    @parser = EbnfJavascriptParser.new
  end
  
  def test_variable
    assert_parsed "innerHTML"
    assert_parsed "extended"
    assert_parsed "getElementsByClassName"
  end
  
  def test_constant
    assert_parsed "Element"
    assert_parsed "DefaultOptions"
  end
  
  def test_all_caps_constant
    assert_parsed "CSS"
    assert_parsed "KEY_BACKSPACE"
  end
  
  def test_object # basic and non-recursive
    assert_parsed "{}"
    assert_parsed "{foo: 'bar'}"
  end
  
  def test_namespace # basic and non-recursive
    assert_parsed "Foo.Bar"
    assert_parsed "foo.bar"
    assert_parsed "foo.Bar"
    assert_parsed "Foo.bar"
  end
end
