require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class BasicTest < Test::Unit::TestCase
  
  def test_restores_original_dir
    original_dir = Dir.pwd
    puts "*** #{original_dir}"
    PDoc::Runner.new("test/fixtures/test.txt",
      :output    => 'test/output',
      :templates => 'templates/html'
    ).run
    assert_equal original_dir, Dir.pwd
  end
end
