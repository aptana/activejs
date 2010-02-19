require 'rake'
require 'rake/packagetask'
require 'yaml'

module ActiveJSHelper
  ROOT_DIR      = File.expand_path(File.dirname(__FILE__))
  
  SRC_DIR       = File.join(ROOT_DIR, 'src')
  DIST_DIR      = File.join(ROOT_DIR, 'dist')
  TEST_DIR      = File.join(ROOT_DIR, 'test')
  VENDOR_DIR    = File.join(ROOT_DIR, 'vendor')
  
  VERSION       = YAML.load(IO.read(File.join(SRC_DIR, 'constants.yml')))['ACTIVE_JS_VERSION']
  
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
    ].flatten,
    'active_record.js' => [
      File.join(SRC_DIR,'active_support.js'),
      INCLUDES[:active_support_extensions],
      File.join(SRC_DIR,'active_event.js'),
      File.join(SRC_DIR,'active_record.js'),
      INCLUDES[:gears]
    ].flatten,
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
    ].flatten,
    #test building
    File.join('..','test','test.js') => [
      File.join(SRC_DIR,'active_test.js'),
      Dir[File.join(TEST_DIR,'**/setup.js')],
      Dir[File.join(TEST_DIR,'**/*.js')].reject{|item| item.match(/setup\.js$/)}
    ].flatten.reject{|item| item.match(/\/test\/test.js$/)}
  }
  
  def self.sprocketize
    require_sprockets
    load_path = [SRC_DIR]
    DISTRIBUTIONS.each_pair do |distribution_name,source_files|
      final_source_files = source_files.clone
      final_source_files.unshift('LICENSE')
      secretary = Sprockets::Secretary.new(
        :root           => ROOT_DIR,
        :load_path      => load_path,
        :source_files   => source_files,
        :strip_comments => false
      )
      secretary.concatenation.save_to(File.join(DIST_DIR, distribution_name))
    end
  end
  
  def self.has_git?
    begin
      `git --version`
      return true
    rescue Error => e
      return false
    end
  end
  
  def self.require_git
    return if has_git?
    puts "\nPrototype requires Git in order to load its dependencies."
    puts "\nMake sure you've got Git installed and in your path."
    puts "\nFor more information, visit:\n\n"
    puts "  http://book.git-scm.com/2_installing_git.html"
    exit
  end
  
  def self.require_sprockets
    require_submodule('Sprockets', 'sprockets')
  end
  
  def self.get_submodule(name, path)
    require_git
    puts "\nYou seem to be missing #{name}. Obtaining it via git...\n\n"
    
    Kernel.system("git submodule init")
    return true if Kernel.system("git submodule update vendor/#{path}")
    # If we got this far, something went wrong.
    puts "\nLooks like it didn't work. Try it manually:\n\n"
    puts "  $ git submodule init"
    puts "  $ git submodule update vendor/#{path}"
    false
  end
  
  def self.require_submodule(name, path)
    begin
      require path
    rescue LoadError => e
      # Wait until we notice that a submodule is missing before we bother the
      # user about installing git. (Maybe they brought all the files over
      # from a different machine.)
      missing_file = e.message.sub('no such file to load -- ', '')
      if missing_file == path
        # Missing a git submodule.
        retry if get_submodule(name, path)
      else
        # Missing a gem.
        puts "\nIt looks like #{name} is missing the '#{missing_file}' gem. Just run:\n\n"
        puts "  $ gem install #{missing_file}"
        puts "\nand you should be all set.\n\n"
      end
      exit
    end
  end
end

desc "Builds the distribution."
task :dist do
  ActiveJSHelper.sprocketize
end