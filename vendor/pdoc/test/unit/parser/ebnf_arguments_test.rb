require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class ArgumentsTest < Test::Unit::TestCase
  include PDocTestHelper
  include EbnfArguments
  
  def setup
    @parser = EbnfArgumentsParser.new
  end
  
  def test_no_arguments
    assert_parsed "  "
    assert_parsed ""
    assert_equal [], parse("    ").to_a.map(&:name)
  end
    
  def test_one_required_argument
    assert_parsed "content"
    assert_parsed "{ position: '(top|bottom|before|after)' }"
    assert_equal "content", parse("content").to_a.first.name
    assert_equal nil, parse("content").to_a.first.default_value
    assert !parse("content").to_a.first.optional?
    assert_equal "elements...", parse("elements...").to_a.first.name
  end
  
  def test_multiple_required_arguments
    assert_parsed "foo,bar"
    assert_parsed "foo  , bar"
    assert_parsed "foo  , bar"
    assert_equal ["foo", "bar"], parse("foo,bar").to_a.map(&:name)
  end
  
  def test_one_optional_argument
    assert_parsed "[content]"
    assert_parsed "[   content    ]"
    assert_parsed "[{ position: '(top|bottom|before|after)' }]"
    assert_equal "content", parse("[content]").to_a.first.name
    assert_equal OptionalArgument, parse("[content]").to_a.first.class
    assert_equal nil, parse("[content]").to_a.first.default_value
    assert parse("[content]").to_a.first.optional?
    assert_equal "elements...", parse("[elements...]").to_a.first.name
  end
 
 def test_default_value
   assert_parsed "[content=foobar]"
   assert_parsed "[  content=foobar  ]"
   assert_equal "content", parse("[content=foo]").to_a.first.name
   assert_equal "foo", parse("[content=foo]").to_a.first.default_value
   assert_equal "foo", parse("[content = foo]").to_a.first.default_value
   assert parse("[content]").to_a.first.optional?
 end
 
 def test_multiple_optional_arguments
   assert_parsed "[foo][,bar]"
   assert_parsed "[ foo ] [   ,  bar ]"
   assert_equal ["foo", "bar"], parse("[foo][,bar]").to_a.map(&:name)
 end
 
 def test_multiple_mixed_arguments
   assert_parsed "hello[,foo][,bar=43]"
   assert_parsed "hello [  , foo ] [   ,  bar=43 ]"
   assert_parsed "hello,world[,foo][,bar=43]"
   assert_parsed "hello  ,  world [ ,  foo ] [   ,  bar=43 ]"
   assert_parsed "hello...[, world = foo]"
   assert_equal ["foo", "bar"], parse("[foo],bar").to_a.map(&:name)
   assert_equal "content", parse("hello[,content]").to_a.last.name
   assert_equal "content", parse("hello[,content=foo]").to_a.last.name
   assert_equal "foo", parse("hello[,content=foo]").to_a.last.default_value
   assert parse("hello[,content=foo]").to_a.last.optional?
   assert !parse("hello[,content=foo]").to_a.first.optional?
 end
  
  def test_nested_optional_arguments
    assert_parsed "hello[,foo[,bar]]"
    assert_parsed "hello [  ,  foo = 3 [   ,  bar = 43 ]]"
    assert_parsed "hello[,foo[,bar=43][,baz=26]]"
    assert_parsed "[length = 30[, suffix = '...']]"
    assert_equal ["foo", "bar"], parse("[foo[,bar]]").to_a.map(&:name)
    assert_equal ["hello", "foo", "bar", "baz"], parse("hello[,foo[,bar=43][,baz=26]]").to_a.map(&:name)
  end
end
