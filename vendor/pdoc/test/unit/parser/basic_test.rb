require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class BasicTest < Test::Unit::TestCase
  include PDocTestHelper
  include Basic
  
  def setup
    @parser = BasicParser.new
  end
  
  def test_fixture_loader
    assert_file_parsed "test.txt"
  end
  
  def test_space
    assert_parsed " "
    assert_equal Space, parse(" ").elements.first.class
  end
  
  def test_text_line
    text_line =  "\n *    here's some text       "
    assert_parsed text_line
    assert_equal TextLine, parse(text_line).elements.first.class
    assert_equal "here's some text", parse(text_line).elements.first.to_s.strip
  end
  
  def test_line_break
    assert_parsed "\n"
    assert_equal LineBreak, parse("\n").elements.first.class
  end
  
  def test_blank_line
    blank_line = "\n  *   \n"
    assert_parsed blank_line
    assert_equal BlankLine, parse(blank_line).elements.first.class
    assert_equal "", parse(blank_line).elements.first.to_s
    
    empty = "\n  *\n"
    assert_parsed empty
    assert_equal BlankLine, parse(empty).elements.first.class
    assert_equal "", parse(empty).elements.first.to_s
  end
  
  def test_comment_start
    starts =  "\n   /**     "
    assert_parsed starts
    assert_equal CommentStart, parse(starts).elements.first.class
  end
  
  def test_comment_end
    ends = "\n   **/    \n"
    assert_parsed ends
    assert_equal CommentEnd, parse(ends).elements.first.class
  end
end
