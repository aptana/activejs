require File.expand_path(File.join(File.dirname(__FILE__), "..", "parser_test_helper"))

class EventsTest < Test::Unit::TestCase
  include PDocTestHelper
  
  def setup
    @parser = EventsParser.new
  end
  
  def test_single_event
    fixture = "\n * fires click"
    assert_parsed fixture
    assert_equal %w[click],                  parse(fixture).to_a
  end
  
  def test_single_namespaced_event
    fixture = "\n * fires element:updated"
    assert_parsed fixture
    assert_equal %w[element:updated],        parse(fixture).to_a
  end
  
  def test_multiple_events
    fixture = "\n * fires click, element:updated"
    assert_parsed fixture
    assert_equal %w[click element:updated],  parse(fixture).to_a
  end
end
