require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class DescriptionTest < Test::Unit::TestCase
  include PDocTestHelper
  include Basic
  include Description
  
  def setup
    @parser = DescriptionParser.new
  end
  
  def test_parsing
    assert_parsed ""
    assert_parsed "\n * hello"
    assert_parsed "\n * \n * hello"
    assert_file_parsed "text.txt"
  end
  
  def test_description
    fixture = parse_file("text.txt")
    assert_equal String, fixture.to_s.class
    assert_equal "some text", fixture.to_a.first
    assert_equal "aliqua.", fixture.to_a.last
  end
  
  def test_truncate
    assert_equal "some text...", parse_file("text.txt").truncate(8)
    assert_equal "some text", parse("\n * some text").truncate()
  end
  
  def test_inspect
    assert_equal "#<Description::Text \"some text more t...\">", parse_file("text.txt").inspect
  end
end
