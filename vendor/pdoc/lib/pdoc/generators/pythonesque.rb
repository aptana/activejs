module PDoc
  module Generators
    class Pythonesque < AbstractGenerator
      def render(output)
        open(output, "w+") do |file|
          file << render_to_str
        end
      end
      
      def render_to_str
        selected_objects.map do |k, obj|
          js_name = to_js_name(obj)
          desc = Description.new(obj).to_escaped_str
          " #{js_name}.__doc__ = '#{desc}';"
        end.join("\n")
      end
      
      def to_js_name(obj)
        if obj.is_a?(Models::InstanceMethod)
          obj.full_name.sub('#', '.prototype.')
        else
          obj.full_name
        end
      end
      
      def selected_objects
        root.registry.select do |k, v|
          (v.is_a?(Models::InstanceMethod) ||
          v.is_a?(Models::ClassMethod) ||
          v.is_a?(Models::Mixin) ||
          v.is_a?(Models::Class) ||
          v.is_a?(Models::Namespace) ||
          v.is_a?(Models::Utility)) && !v.alias?
        end
      end
      
      class Description
        JS_ESCAPE_MAP = {
          '\\'    => '\\\\',
          '</'    => '<\/',
          "\r\n"  => '\n',
          "\n"    => '\n',
          "\r"    => '\n',
          '"'     => '\\"',
          "'"     => "\\'"
        }
        
        attr_reader :obj
        def initialize(obj)
          @obj = obj
        end
        
        def to_str
          return "#{obj.full_name} has been deprecated." if obj.deprecated?
          results = []
          results << sig
          results << args if obj.respond_to?(:arguments) && obj.arguments?
          results << desc
          results << aliases if obj.aliases?
          if obj.respond_to?(:constructor) && obj.constructor
            results << "\nWhen called as a constructor:\n"
            results << Description.new(obj.constructor).to_str
          end
          results.join("\n")
        end
        
        def to_escaped_str
          escape(to_str)
        end
        
        private
          def escape(str)
            str.gsub(/(\\|<\/|\r\n|[\n\r"'])/) {
              JS_ESCAPE_MAP[$1]
            }
          end
        
          def sig
            if obj.signatures?
              obj.signatures.map do |s|
                s.return_value ? "#{s.name} -> #{s.return_value}" : s.name
              end.join("\n")
            else
              obj.full_name
            end
          end
        
          def aliases
            aliases = obj.aliases.map { |a| a.full_name }.join(', ')
            "Aliased as: #{aliases}."
          end
        
          def args
            obj.arguments.map do |a|
               "  - #{a.name} (#{a.types.join(' | ')}): #{a.description.chomp}"
            end.join("\n")
          end
        
          def desc
            obj.short_description ? obj.short_description : ''
          end
      end
    end
  end
end
