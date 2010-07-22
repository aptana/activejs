require 'rubygems'
require 'vendor/sprockets/lib/sprockets'
require 'rake'
require 'rake/packagetask'
require 'yaml'
require 'fileutils'

module ActiveJSHelper
  ROOT_DIR = File.expand_path(File.dirname(__FILE__))
  
  ASSETS_DIR = File.join(ROOT_DIR, 'assets')
  SRC_DIR = File.join(ROOT_DIR, 'src')
  DIST_DIR = File.join(ROOT_DIR, 'assets/downloads')
  DOCS_DIR = File.join(ROOT_DIR, 'docs')
  TEST_DIR = File.join(ROOT_DIR, 'test')
  VENDOR_DIR = File.join(ROOT_DIR, 'vendor')
  
  VERSION = YAML.load(IO.read(File.join(SRC_DIR, 'constants.yml')))['VERSION']
  
  SOURCE_FILE_FOR_DOCS = File.join(DIST_DIR, 'source_for_docs.js')
  
  INCLUDES = {
    :swfaddress => [
      File.join(VENDOR_DIR,'swfaddress/swfaddress.js'),
      File.join(SRC_DIR,'active_view/routing.js')
    ],
    :active_support_extensions => [
      File.join(SRC_DIR,'active_support/inflector.js'),
      File.join(SRC_DIR,'active_support/date.js'),
      File.join(SRC_DIR,'active_support/json.js'),
      File.join(SRC_DIR,'active_support/callback_queue.js'),
      File.join(SRC_DIR,'active_support/element.js'),
      File.join(SRC_DIR,'active_support/request.js'),
      File.join(SRC_DIR,'active_support/initializer.js')
    ]
  }
  
  DISTRIBUTION_FOR_DOC_GENERATION = [
    File.join(SRC_DIR,'active_support.js'),
    INCLUDES[:active_support_extensions],
    File.join(SRC_DIR,'active_event.js'),
    File.join(SRC_DIR,'active_routes.js'),
    File.join(SRC_DIR,'active_record.js'),
    File.join(SRC_DIR,'active_view.js')
  ]
  
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
      File.join(SRC_DIR,'active_support/element.js'),
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_view.js')
    ],
    'active_routes.js' => [
      File.join(SRC_DIR,'active_support.js'),
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_routes.js')
    ],
    'active_record.js' => [
      File.join(SRC_DIR,'active_support.js'),
      INCLUDES[:active_support_extensions],
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_record.js')
    ],
    'active.js' => [
      File.join(SRC_DIR,'active_support.js'),
      INCLUDES[:active_support_extensions],
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_routes.js'),
      File.join(SRC_DIR,'active_view.js'),
      File.join(SRC_DIR,'active_record.js'),
      INCLUDES[:swfaddress]
    ],    
    #ActiveJS combined tests
    File.join('..','..','test','test.js') => [
      Dir[File.join(TEST_DIR,'**/setup.js')],
      Dir[File.join(TEST_DIR,'**/*.js')].reject{|item| item.match(/setup\.js$/)}
    ].flatten.reject{|item| item.match(/\/test.js$/)}
  }
  #individual test building
  [
    'active_event',
    'active_view',
    'active_routes',
    'active_record',
    'active_support'
  ].each do |group|
    DISTRIBUTIONS[File.join('..','..','test',group,'test.js')] = [
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
  
  def self.sprocketize_for_docs
    flattened_source_files = DISTRIBUTION_FOR_DOC_GENERATION.clone.flatten
    secretary = Sprockets::Secretary.new(
      :root           => ROOT_DIR,
      :load_path      => [SRC_DIR],
      :source_files   => flattened_source_files,
      :strip_comments => false
    )
    secretary.concatenation.save_to(SOURCE_FILE_FOR_DOCS)
  end
end

desc "Builds the distribution."
task :dist, :copy_locations do |task,arguments|
  puts "Building ActiveJS distributions with Sprockets"
  ActiveJSHelper.sprocketize
  ActiveJSHelper::DISTRIBUTIONS.each_pair do |target,payload|
    puts "Built #{File.expand_path(File.join(ActiveJSHelper::DIST_DIR,target))}"
  end  
  copy_locations = (arguments[:copy_locations] || '').split(',')
  copy_locations.each do |location_pair|
    source, target = location_pair.split(':')
    source = File.expand_path(File.join(ActiveJSHelper::DIST_DIR,source))
    target = File.expand_path(target)
    FileUtils.copy(
      source,
      target
    )
    puts "Copied #{source} to #{target}"
  end
  puts "Task complete."
end

desc "Builds the documentation"
task :docs do
  require 'vendor/pdoc/lib/pdoc'
  rm_rf Dir.glob(File.join(ActiveJSHelper::DOCS_DIR, "*"))
  ActiveJSHelper.sprocketize_for_docs
  PDoc.run({
    :source_files => [ActiveJSHelper::SOURCE_FILE_FOR_DOCS],
    :destination => ActiveJSHelper::DOCS_DIR,
    :syntax_highlighter => :pygments,
    :markdown_parser => :bluecloth,
    :src_code_href => proc { |doc|
      "http://github.com/aptana/activejs/blob/#{hash}/#{doc.file}#LID#{doc.line_number}"
    },
    :pretty_urls => false,
    :bust_cache => false,
    :name => 'ActiveJS',
    :short_name => 'ActiveJS',
    :home_url => 'http://activejs.org',
    :doc_url => 'http://activejs.org',
    :version => ActiveJSHelper::VERSION,
    :index_title => 'ActiveJS: JavaScript Application Framework',
    :index_page => 'README.markdown',
    :index_header => '<a href="http://activejs.org/" id="header_logo"><img src="http://activejs.org/images/activejs.gif"/></a>',
    :footer => '<div id="footer_logos"><a href="http://syntacticx.com"><img src="http://activejs.org/images/syntacticx.gif" style="border:none;"/></a><a href="http://aptana.org/"><img src="http://activejs.org/images/aptana.gif" style="border:none;"/></a></div>',
    :stylesheets => ['docs']
  })
  FileUtils.rm(ActiveJSHelper::SOURCE_FILE_FOR_DOCS)
  FileUtils.cp_r(Dir.glob(File.join(ActiveJSHelper::ASSETS_DIR,"**")), ActiveJSHelper::DOCS_DIR)
end

desc "Builds the distributions, and documentation, and copies the generated docs to a location of your choosing"
task :deploy, :target do |task,arguments|
  Rake::Task["dist"].reenable
  Rake::Task["dist"].invoke
  Rake::Task["docs"].reenable
  Rake::Task["docs"].invoke
  rm_rf Dir.glob(File.join(arguments[:target],"*"))
  FileUtils.cp_r(Dir.glob(File.join(ActiveJSHelper::DOCS_DIR,"*")),File.join(arguments[:target]))
end

task :compress do
  require 'yui/compressor'
  compressor = YUI::JavaScriptCompressor.new(:munge => true)
  ActiveJSHelper::DISTRIBUTIONS.each_pair do |name,payload|
    src = File.read(File.join(ActiveJSHelper::DIST_DIR,name))
    File.open(File.join(ActiveJSHelper::DIST_DIR,name.gsub(/\.js$/,'.min.js')),'w') do |file|
      file.write(compressor.compress(src))
    end
  end
end