require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))
require File.expand_path(File.join(File.dirname(__FILE__), *%w[.. .. .. templates html helpers]))

class HtmlHelpersTest < Test::Unit::TestCase
  include PDocTestHelper
  # include EbnfExpression
  
  def setup
    @helper = Object.new
    class << @helper
      attr_accessor :root
      include PDoc::Generators::Html::Helpers::BaseHelper
      include PDoc::Generators::Html::Helpers::LinkHelper
      include PDoc::Generators::Html::Helpers::CodeHelper
      
      def path_to(foo)
        '/some/path' # Not tested here, although it should
      end
    end
  end
  
  def test_truth
    assert true
  end
end
