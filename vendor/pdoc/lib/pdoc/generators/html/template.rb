begin
  require 'erubis'
rescue LoadError
end

module PDoc
  module Generators
    module Html
      class Template
        def initialize(file_name = "layout.erb", templates_directory = nil)
          @file_name = file_name
          @templates_directory = templates_directory
          @template = create_template(IO.read(file_path))
        end
        
        def result(binding)
          @template.result(binding)
        end
        
        private
          def file_path
            @file_name << '.erb' unless @file_name =~ /\.erb$/
            path = File.join(@templates_directory, @file_name.split("/"))
            File.expand_path(path, DIR)
          end
          
          def create_template(input)
            if defined?(Erubis)
              Erubis::Eruby.new(input)
            else
              ERB.new(input, nil, '%')
            end
          end
      end
    end
  end
end
