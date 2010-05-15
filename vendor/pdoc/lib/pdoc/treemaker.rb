module PDoc
  class Treemaker
    include Models
    
    def initialize(doc_fragments = [])
      methodized = []
      doc_fragments.each do |attributes|
        if attributes['methodized']
          dups = attributes.dup
          dups['id'] = methodize_id(dups['id'])
          dups['type'] = 'instance method'
          if dups['signatures']
            dups['signatures'] = dups['signatures'].map do |s|
              {
                'signature' => methodize_signature(s['signature']),
                'return_value' => s['return_value']
              }
            end
          end
          if dups['alias_of']
            dups['alias_of'] = methodize_id(dups['alias_of'])
          end
          methodized << dups
          i = instantiate_from(dups)
          c = instantiate_from(attributes)
          i.functionalized_self = c
          c.methodized_self = i
        else
          instantiate_from(attributes)
        end
      end

      doc_fragments.concat(methodized).each do |attributes|
        if parent_id = attributes['parent_id']
          parent = root.find(parent_id)
          raise "Undocumented object: #{parent_id}." unless parent
        else
          parent = root
        end
        object = root.find(attributes['id'])
        object.parent = parent
        object.attach_to_parent(parent)
        
        if superclass_id = attributes['superclass_id']
          superclass = root.find(superclass_id)
          raise "Undocumented object: #{superclass_id}." unless superclass
          object.superclass = superclass
          superclass.subclasses << object
        end
        
        if included = attributes['included']
          included.each do |id|
            mixin = root.find(id)
            raise "Undocumented object: #{id}." unless mixin
            object.included_mixins << mixin
          end
        end
        
        if alias_of_id = attributes['alias_of']
          alias_of = root.find(alias_of_id)
          raise "Undocumented object: #{alias_of_id}." unless alias_of
          object.alias = alias_of
          alias_of.aliases << object
        end
      end
    end
    
    def instantiate_from(attributes)
      arguments = attributes.delete('arguments')
      signatures = attributes.delete('signatures')
      object = Base.instantiate(attributes)
      arguments.each { |a| Argument.new(a).attach_to_parent(object) } if arguments
      signatures.each { |s| Signature.new(s).attach_to_parent(object) } if signatures
      object.register_on(root.registry)
    end
    
    def methodize_signature(sig)
      sig.sub(/\.([\w\d\$]+)\((.*?)(,\s*|\))/) do
        first_arg = $2.to_s.strip
        prefix = first_arg[-1, 1] == '[' ? '([' : '('
        rest = $3 == ')' ? $3 : ''
        "##{$1}#{prefix}#{rest}"
      end
    end
    
    def methodize_id(id)
      id.sub(/\.([^\.]+)$/) { "##{$1}" }
    end
    
    def root
      @root ||= Root.new
    end
  end
end