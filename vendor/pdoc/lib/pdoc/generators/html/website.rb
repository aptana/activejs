module PDoc
  module Generators
    module Html
      
      unless defined? TEMPLATES_DIRECTORY
        TEMPLATES_DIRECTORY = File.join(TEMPLATES_DIR, "html")
      end
      
      class Website < AbstractGenerator
        
        include Helpers::BaseHelper
        include Helpers::LinkHelper
        
        class << Website
          attr_accessor :syntax_highlighter
          attr_accessor :markdown_parser
          def pretty_urls?
            !!@pretty_urls
          end
          
          def pretty_urls=(boolean)
            @pretty_urls = boolean
          end
        end
        attr_reader :templates_directory, :custom_assets, :index_page
        def initialize(parser_output, options = {})
          super
          @templates_directory = File.expand_path(options[:templates] || TEMPLATES_DIRECTORY)
          @index_page = options[:index_page] && File.expand_path(options[:index_page])
          @custom_assets = @options[:assets] && File.expand_path(@options[:assets])
          self.class.syntax_highlighter = SyntaxHighlighter.new(options[:syntax_highlighter])
          self.class.pretty_urls = options[:pretty_urls]
          set_markdown_parser(options[:markdown_parser])
          load_custom_helpers
        end
        
        def set_markdown_parser(parser = nil)
          parser = :rdiscount if parser.nil?
          case parser.to_sym
          when :rdiscount
            require 'rdiscount'
            self.class.markdown_parser = RDiscount
          when :bluecloth
            require 'bluecloth'
            self.class.markdown_parser = BlueCloth
          when :maruku
            require 'maruku'
            self.class.markdown_parser = Maruku
          else
            raise "Requested unsupported Markdown parser: #{parser}."
          end
        end
        
        def load_custom_helpers
          begin
            require File.join(templates_directory, "helpers")
          rescue LoadError => e
            return nil
          end
          self.class.__send__(:include, Helpers::BaseHelper)
          Page.__send__(:include, Helpers::BaseHelper)
          Helpers.constants.map(&Helpers.method(:const_get)).each(&DocPage.method(:include))
        end
        
        # Generates the website to the specified directory.
        def render(output)
          @depth = 0
          path = File.expand_path(output)
          FileUtils.mkdir_p(path)
          Dir.chdir(path) do
          
            render_index
            copy_assets
            copy_custom_assets
            
            render_children(root)
            if root.sections?
              root.sections.each do |section|
                @depth = 0
                render_template('section', { :doc_instance => section })
              end
            end

            dest = File.join("javascripts", "pdoc", "item_index.js")
            DocPage.new("item_index.js", false, variables).render_to_file(dest)
          end
        end
        
        def render_index
          vars = variables.merge(:index_page_content => index_page_content, :home => true)
          DocPage.new('index', 'layout', vars).render_to_file('index.html')
        end
        
        def render_template(template, var = {})
          @depth += 1
          doc = var[:doc_instance]
          dest = doc.url(File::SEPARATOR)
          puts "        Rendering #{dest}..."
          FileUtils.mkdir_p(dest)
          DocPage.new(template, variables.merge(var)).render_to_file(File.join(dest, 'index.html'))
          render_json("#{dest}.json", doc) if json_api?
          render_children(doc)
          @depth -= 1
        end
        
        def render_json(dest, obj)
          open(dest, 'w') { |file| file << obj.to_json }
        end
        
        def render_children(obj)
          [:namespaces, :classes, :mixins].each do |prop|
            obj.send(prop).each(&method(:render_node)) if obj.respond_to?(prop)
          end
          
          obj.utilities.each(&method(:render_leaf)) if obj.respond_to?(:utilities)
          render_leaf(obj.constructor) if obj.respond_to?(:constructor) && obj.constructor
          
          [:instance_methods, :instance_properties, :class_methods, :class_properties, :constants].each do |prop|
            obj.send(prop).each(&method(:render_leaf)) if obj.respond_to?(prop)
          end
        end
        
        # Copies the content of the assets folder to the generated website's
        # root directory.
        def copy_assets
          FileUtils.cp_r(Dir.glob(File.join(templates_directory, "assets", "**")), '.')
        end
        
        def copy_custom_assets
          if custom_assets
            FileUtils.cp_r(Dir.glob(File.join(custom_assets, "**")), ".")
          end
        end
        
        def render_leaf(object)
          is_proto_prop = is_proto_prop?(object)
          @depth += 1 if is_proto_prop
          render_template('leaf', { :doc_instance => object })
          @depth -= 1 if is_proto_prop
        end
        
        def render_node(object)          
          render_template('node', { :doc_instance => object })
        end
        
        private
          def variables
            {
              :root => root,
              :depth => @depth,
              :templates_directory => templates_directory,
              :name => @options[:name],
              :short_name => @options[:short_name] || @options[:name],
              :home_url => @options[:home_url],
              :version => @options[:version],
              :stylesheets => @options[:stylesheets] || [],
              :index_title => @options[:index_title] || false,
              :footer => footer,
              :index_header => index_header,
              :header => header
            }
          end

          def header
            @header ||= @options[:header] ? htmlize(@options[:header]) : ''
          end
          
          def index_header
            @index_header ||= @options[:index_header] ? htmlize(@options[:index_header]) : ''
          end
          
          def footer
            @footer ||= @options[:footer] ? htmlize(@options[:footer]) : ''
          end
          
          def json_api?
            !!options[:json_api]
          end
          
          def is_proto_prop?(object)
            object.is_a?(Models::InstanceMethod) ||
              object.is_a?(Models::InstanceProperty)
          end
          
          def index_page_content
            @index_page ? htmlize(File.read(@index_page)) : nil
          end
      end
    end
  end
end
