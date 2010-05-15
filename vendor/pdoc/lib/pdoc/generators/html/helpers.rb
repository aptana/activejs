module PDoc
  module Generators
    module Html
      module Helpers
        module BaseHelper
          def content_tag(tag_name, content, attributes = {})
            "<#{tag_name}#{attributes_to_html(attributes)}>#{content}</#{tag_name}>"
          end

          def img_tag(filename, attributes = {})
            attributes.merge! :src => "#{path_prefix}images/#{filename}"
            tag(:img, attributes)
          end

          def tag(tag_name, attributes = {})
            "<#{tag_name}#{attributes_to_html(attributes)} />"
          end
          
          def link_to(name, path, attributes={})
            content_tag(:a, name, attributes.merge(:href => path))
          end
          
          def htmlize(markdown)
            markdown = Website.syntax_highlighter.parse(markdown)
            Website.markdown_parser.new(markdown).to_html
          end
          
          # Gah, what an ugly hack.
          def inline_htmlize(markdown)
            htmlize(markdown).gsub(/^<p>/, '').gsub(/<\/p>$/, '')
          end
          
          def javascript_include_tag(*names)
            names.map do |name|
              attributes = {
                :src => "#{path_prefix}javascripts/#{name}.js",
                :type => "text/javascript",
                :charset => "utf-8"
              }
              content_tag(:script, "", attributes)
            end.join("\n")
          end

          def stylesheet_link_tag(*names)
            names.map do |name|
              attributes = {
                :href => "#{path_prefix}stylesheets/#{name}.css",
                :type => "text/css",
                :media => "screen, projection",
                :charset => "utf-8",
                :rel => "stylesheet"
              }
              tag(:link, attributes)
            end.join("\n")
          end
          
          private
            def attributes_to_html(attributes)
              attributes = attributes.sort { |a, b| a.to_s <=> b.to_s }
              attributes.map do |a|
                k, v = a
                k ? " #{k}=\"#{v}\"" : ""
              end.join
            end
        end
        
        module LinkHelper
          def path_prefix
            "../" * depth
          end
          
          def path_to(obj)
            path = path_prefix << obj.url << '/'
            Website.pretty_urls? ? path : "#{path}index.html"
          end
          
          def auto_link(obj, options = {})
            if obj.is_a?(String)
              original = obj
              obj = root.find(obj)
              return original unless obj
            end
            name = options.delete(:name) == :short ? obj.name : obj.full_name
            if obj.type == 'section'
              title = obj.full_name
            else
              title = "#{obj.full_name} (#{obj.type})"
            end
            link_to(name, path_to(obj), { :title => title }.merge(options))
          end
          
          def auto_link_code(obj, options = {})
            "<code>#{auto_link(obj, options)}</code>"
          end

          def auto_link_content(content)
            return '' if content.nil?
            content.gsub!(/\[\[([a-zA-Z]+)\s+section\]\]/) do |m|
              result = auto_link(root.find($1), :name => :long)
              result
            end
            content.gsub(/\[\[([a-zA-Z$\.#]+)(?:\s+([^\]]+))?\]\]/) do |m|
              if doc_instance = root.find($1)
                $2 ? link_to($2, path_to(doc_instance)) : auto_link_code(doc_instance, :name => :long)
              else
                $1
              end
            end
          end
          
          def auto_link_types(types, options = {})
            types = types.split(/\s+\|\s+/) if types.is_a?(String)
            types.map do |t|
              if match = /^\[([\w\d\$\.\(\)#]*[\w\d\$\(\)#])...\s*\]$/.match(t) # e.g.: [Element...]
                "[#{auto_link(match[1], options)}…]"
              else
                auto_link(t, options)
              end
            end
          end
          
          def dom_id(obj)
            "#{obj.id}-#{obj.type.gsub(/\s+/, '_')}"
          end
        end
        
        module CodeHelper
          def methodize_signature(sig)
            sig.sub(/\.([\w\d\$]+)\((.*?)(,\s*|\))/) do
              first_arg = $2.to_s.strip
              prefix = first_arg[-1, 1] == '[' ? '([' : '('
              rest = $3 == ')' ? $3 : ''
              "##{$1}#{prefix}#{rest}"
            end
          end
          
          def methodize_full_name(obj)
            obj.full_name.sub(/\.([^.]+)$/, '#\1')
          end
          
          def method_synopsis(object)
            result = []
            object.signatures.each do |signature|
              if return_value = signature.return_value
                types = auto_link_types(return_value, :name => :long).join(' | ')
                result << "#{signature.name} &rarr; #{types}"
              else # Constructors
                result << signature.name
              end
            end
            result
          end
          
          def breadcrumb(obj, options = {})
            options = {:name => :short}.merge(options)
            result = []
            begin
              result << auto_link(obj, options.dup)
              obj = obj.parent
            end until obj.is_a?(Models::Root)
            result.reverse!
          end
        end
        
        module MenuHelper
          NODES = [
            :namespaces,
            :classes,
            :mixins,
            :utilities
          ]
          LEAVES = [
            :constants,
            :class_methods,
            :class_properties,
            :instance_methods,
            :instance_properties
          ]
          
          def menu(obj)
            if obj.parent
              html = menu_item(obj, :name => :long)
            
              html << node_submenu(obj)
            
              if obj == doc_instance && obj.respond_to?(:constants)
                html << leaf_submenu(obj)
              elsif doc_instance && doc_instance.respond_to?(:parent)
                parent = doc_instance.parent
                html << leaf_submenu(parent) if parent == obj && obj.respond_to?(:constants)
              end
            
              content_tag(:li, html)
            else #root
              node_submenu(obj)
            end
          end
          
          def node_submenu(obj)
            children = []
            options = {}
            
            NODES.each do |prop|
              children.concat(obj.send(prop)) if obj.respond_to?(prop)
            end
            
            list_items = children.sort.map { |item| menu(item) }
            if obj.respond_to?(:sections)
              obj.sections.each { |section| list_items << menu(section) }
              options[:class] = "menu-items"
              options[:id] = "api_menu"
            elsif obj.type == "section"
              options[:class] = "menu-section"
            end
            list_items.empty? ? '' : content_tag(:ul, list_items.join("\n"), options)
          end
          
          def menu_item(obj, options = {})
            options = options.dup
            options[:class] = class_names_for(obj, options)
            content_tag(:div, auto_link(obj, options), :class => 'menu-item')
          end
          
          def leaf_submenu(obj)
            items = []
            if obj.respond_to?(:constructor) && obj.constructor
              items << content_tag(:li, menu_item(obj.constructor, :name => :short))
            end
            LEAVES.each do |prop|
              if obj.respond_to?(prop)
                obj.send(prop).sort!.map do |item|
                  items << content_tag(:li, menu_item(item, :name => :short))
                end
              end
            end
            content_tag(:ul, items.join("\n"))
          end
          
          def class_names_for(obj, options = {})
            classes = []
            classes << obj.type.gsub(/\s+/, '-')
            classes << "deprecated" if obj.deprecated?
            if doc_instance
              if obj == doc_instance
                classes << "current"
              elsif obj.ancestor_of?(doc_instance)
                classes << "current-parent"
              end
            end
            classes.join(' ')
          end
        end
      end
    end
  end
end
