DIR = File.expand_path(File.dirname(__FILE__))
OUTPUT_DIR    = File.join(DIR, '..', 'output')
TEMPLATES_DIR = File.join(DIR, '..', 'templates')
VENDOR_DIR    = File.join(DIR, '..', 'vendor')
PARSER_DIR    = File.join(DIR, 'pdoc', 'parser')

[DIR, VENDOR_DIR, PARSER_DIR, OUTPUT_DIR, TEMPLATES_DIR].each do |c|
  $:.unshift(c)
end

require 'rubygems'
require 'erb'
require 'fileutils'

require 'pdoc/runner'
require 'pdoc/generators'
require 'pdoc/parser'
require 'pdoc/models'
require 'pdoc/treemaker'

module PDoc
  def self.run(options = {})
    Runner.new(options.dup).run
  end
  
  def self.copy_templates(template_type, destination)
    dir = File.expand_path(destination)
    raise "File already exists: #{destination}" if File.exist?(dir)
    FileUtils.cp_r("#{TEMPLATES_DIR}/#{template_type}", dir)
  end
end
