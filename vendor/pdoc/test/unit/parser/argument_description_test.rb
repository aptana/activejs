require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class ArgumentDescriptionTest < Test::Unit::TestCase
  include PDocTestHelper
  include Basic
  include ArgumentDescription
  
  def setup
    @parser = ArgumentDescriptionParser.new
  end
  
  def test_argument_with_no_type
    fixture = parse("\n * - foo: a definition#{blank_line}")
    assert_equal "foo",                            fixture.name
    assert_equal [],                               fixture.types
    assert_equal "a definition",                   fixture.description
    
    fixture = parse("\n * - @foo: a definition#{blank_line}")
    assert_equal "foo",                            fixture.name
    assert_equal [],                               fixture.types
    assert_equal "a definition",                   fixture.description
    
    fixture = parse("\n * - foo:    a rather long definition  \n*     that extends to a second line.  #{blank_line}")
    assert_equal "a rather long definition that extends to a second line.", fixture.description
  end
  
  def test_argument_with_single_type
    fixture = parse("\n * - foo (String): a definition#{blank_line}")
    assert_equal "foo",                            fixture.name
    assert_equal %w[String],                       fixture.types
  end
  
  def test_argument_with_multiple_types
    fixture = parse("\n * - foo (String | Number): a definition#{blank_line}")
    assert_equal "foo",                            fixture.name
    assert_equal %w[String Number],                fixture.types
    fixture = parse("\n * - foo (String | Number | Object): a definition#{blank_line}")
    assert_equal %w[String Number Object],         fixture.types
  end
end
