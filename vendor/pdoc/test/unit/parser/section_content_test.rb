require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class SectionContentTest < Test::Unit::TestCase
  include PDocTestHelper
  include Basic
  include Description
  include SectionContent
  
  def setup
    @parser = SectionContentParser.new
  end
  
  def test_parsing
    assert_parsed "\n* ==dom==\n * hello"
    assert_parsed "\n* == dom ==  \n * hello"
  end
  
  def test_section
    text = "\n* == dom ==  \n * hello"
    assert_equal Section, parse(text).class
  end
  
  def test_title
    text = "\n* == DOM ==  \n * hello"
    assert_equal "DOM", parse(text).name
    assert_equal "DOM", parse(text).full_name
    assert_equal "dom", parse(text).id
    
    text = "\n* == Some Section ==  \n * hello"
    assert_equal "Some Section", parse(text).name
    assert_equal "Some Section", parse(text).full_name
    assert_equal "some_section", parse(text).id
    
    text = "\n* == scripty2 ==  \n * hello"
    assert_equal "scripty2", parse(text).name
    assert_equal "scripty2", parse(text).full_name
    assert_equal "scripty2", parse(text).id
  end
  
  def test_description
    text = "\n* == Some Section ==  \n * hello"
    assert_equal "hello", parse(text).description
  end
end
