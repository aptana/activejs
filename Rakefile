require 'rake'
require 'rake/packagetask'
require 'yaml'
require 'sprockets'

module ActiveJSHelper
  ROOT_DIR = File.expand_path(File.dirname(__FILE__))
  
  SRC_DIR = File.join(ROOT_DIR, 'src')
  DIST_DIR = File.join(ROOT_DIR, 'dist')
  DOCS_DIR = File.join(ROOT_DIR, 'docs')
  TEST_DIR = File.join(ROOT_DIR, 'test')
  VENDOR_DIR = File.join(ROOT_DIR, 'vendor')
  
  VERSION = YAML.load(IO.read(File.join(SRC_DIR, 'constants.yml')))['ACTIVE_JS_VERSION']
    
  INCLUDES = {
    :swfaddress => [
      File.join(VENDOR_DIR,'swfaddress/swfaddress.js'),
      File.join(SRC_DIR,'active_controller/adapters/swfaddress.js')
    ],
    :gears => [
      File.join(SRC_DIR,'active_record/adapters/gears.js')
    ],
    :active_support_extensions => [
      File.join(SRC_DIR,'active_support/inflector.js'),
      File.join(SRC_DIR,'active_support/date.js'),
      File.join(SRC_DIR,'active_support/json.js')
    ]
  }
  
  DISTRIBUTIONS = {
    'active_support.js' => [
      File.join(SRC_DIR,'active_support.js'),
      INCLUDES[:active_support_extensions]
    ],
    'active_event.js' => [
      File.join(SRC_DIR,'active_support.js'),
      File.join(SRC_DIR,'active_event.js')
    ],
    'active_view.js' => [
      File.join(SRC_DIR,'active_support.js'),
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_view.js')
    ],
    'active_routes.js' => [
      File.join(SRC_DIR,'active_support.js'),
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_routes.js')
    ],
    'active_controller.js' => [
      File.join(SRC_DIR,'active_support.js'),
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_view.js'),
      File.join(SRC_DIR,'active_routes.js'),
      File.join(SRC_DIR,'active_controller.js'),
      INCLUDES[:swfaddress]
    ],
    'active_record.js' => [
      File.join(SRC_DIR,'active_support.js'),
      INCLUDES[:active_support_extensions],
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_record.js'),
      INCLUDES[:gears]
    ],
    'active.js' => [
      File.join(SRC_DIR,'active_support.js'),
      INCLUDES[:active_support_extensions],
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_view.js'),
      File.join(SRC_DIR,'active_routes.js'),
      File.join(SRC_DIR,'active_controller.js'),
      INCLUDES[:swfaddress],
      File.join(SRC_DIR,'active_record.js'),
      INCLUDES[:gears]
    ],    
    #ActiveJS combined tests
    File.join('..','test','test.js') => [
      Dir[File.join(TEST_DIR,'**/setup.js')],
      Dir[File.join(TEST_DIR,'**/*.js')].reject{|item| item.match(/setup\.js$/)}
    ].flatten.reject{|item| item.match(/\/test.js$/)}
  }
  #individual test building
  [
    'active_event',
    'active_view',
    'active_routes',
    'active_controller',
    'active_record',
    'active_support'
  ].each do |group|
    DISTRIBUTIONS[File.join('..','test',group,'test.js')] = [
      Dir[File.join(TEST_DIR,group + '/setup.js')],
      Dir[File.join(TEST_DIR,group + '/*.js')].reject{|item| item.match(/setup\.js$/)}
    ].flatten.reject{|item| item.match(/\/test.js$/)}
  end
  
  def self.sprocketize
    load_path = [SRC_DIR]
    DISTRIBUTIONS.each_pair do |distribution_name,source_files|
      flattened_source_files = source_files.clone.flatten
      flattened_source_files.unshift('LICENSE')
      secretary = Sprockets::Secretary.new(
        :root           => ROOT_DIR,
        :load_path      => load_path,
        :source_files   => flattened_source_files,
        :strip_comments => false
      )
      secretary.concatenation.save_to(File.join(DIST_DIR, distribution_name))
    end
  end
  
end

desc "Builds the distribution."
task :dist do
  ActiveJSHelper.sprocketize
end

task :docs do
  require 'vendor/pdoc/lib/pdoc'
  PDoc.run({
    :source_files => File.join(ActiveJSHelper::DIST_DIR,'active.js'),
    :destination => ActiveJSHelper::DOCS_DIR,
    :index_page => 'README.markdown',
    :syntax_highlighter => :pygments,
    :markdown_parser => :maruku
  })
end