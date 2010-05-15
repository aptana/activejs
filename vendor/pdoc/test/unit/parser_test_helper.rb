require 'test/unit'

require File.expand_path(File.join(File.dirname(__FILE__), "..", "..", "lib", "pdoc")) unless defined?(PDoc)

class Treetop::Runtime::SyntaxNode 
  def method_missing(method, *args)
    raise "Node representing '#{text_value}' does not respond to '#{method}'"
  end
end

module PDocTestHelper
  def parse(input)
    result = @parser.parse(input)
    unless result
      puts "\n" << @parser.terminal_failures.join("\n") << "\n"
    end
    assert !result.nil?
    result
  end
  
  def blank_line
    "\n * \n "
  end
  
  def parse_file(filename)
    path = File.expand_path(File.join(File.dirname(__FILE__), "..", "fixtures", filename))
    file = File.open(path){ |f| f.read }
    file.gsub!(/\r\n/, "\n")
    file = file.split("\n").map do |line|
      line.gsub(/\s+$/, '')
    end.join("\n")
    parse(file)
  end
  
  def assert_parsed(input)
    assert !parse(input).nil?
  end
  
  def assert_file_parsed(filename)
    assert !parse_file(filename).nil?
  end
  
  def assert_not_parsed(input)
    assert @parser.parse(input).nil?
  end
end

# Stolen from Rails
unless :test.respond_to?(:to_proc)
  class Symbol
    # Turns the symbol into a simple proc, which is especially useful for enumerations. Examples:
    #
    #   # The same as people.collect { |p| p.name }
    #   people.collect(&:name)
    #
    #   # The same as people.select { |p| p.manager? }.collect { |p| p.salary }
    #   people.select(&:manager?).collect(&:salary)
    def to_proc
      Proc.new { |*args| args.shift.__send__(self, *args) }
    end
  end
end
