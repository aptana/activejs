require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class TagsTest < Test::Unit::TestCase
  include PDocTestHelper
  
  def setup
    @parser = TagsParser.new
  end
  
  def test_valueless_tag
    tag = "deprecated"
    assert_parsed tag
    assert_equal "deprecated", parse(tag).to_a.first.name
    assert_equal nil,          parse(tag).to_a.first.value
  end
  
  def test_tag_with_value
    tag = "section: dom"
    assert_parsed tag
    assert_equal "section", parse(tag).to_a.first.name
    assert_equal "dom", parse(tag).to_a.first.value
    
    tag = "alias of: $A"
    assert_parsed tag
    assert_equal "alias of", parse(tag).to_a.first.name
    assert_equal "$A", parse(tag).to_a.first.value
  end
  
  def test_tags
    tags = "deprecated, alias of: $A"
    assert_parsed tags
    assert_equal "deprecated", parse(tags).to_a.first.name
    assert_equal nil,          parse(tags).to_a.first.value
    assert_equal "alias of",   parse(tags).to_a.last.name
    assert_equal "$A",         parse(tags).to_a.last.value
    assert                     parse(tags).include?("deprecated")
    assert                    !parse(tags).include?("foo")
  end
end
