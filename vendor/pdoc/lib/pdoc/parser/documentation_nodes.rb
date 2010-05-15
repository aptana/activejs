module Documentation
  class Doc < Treetop::Runtime::SyntaxNode
    include Enumerable
    
    def tags
      @tags ||= elements.first.elements.map { |e| e.elements.last }
    end

    def each
      tags.each { |tag| yield tag }
    end
    
    # find_by_name allows you to search through all the documented instances based on the 
    # instances Base#full_name.
    # For example:
    #
    #     PDoc::Parser.new("prototype.js").parse.root.find_by_name("Element#update")
    #
    # Return an instance of InstanceMethod corresponding to "Element#update".
    def find_by_name(name)
      find { |e| e.full_name == name }
    end
    
    def inspect
      to_a.inspect
    end
    
    # Returns the total number of documented instances
    def size
      to_a.length
    end
    
    def name
      "Home"
    end
    
    def serialize(serializer)
      each { |obj| obj.serialize(serializer) }
    end
  end
  
  module Memoized
    def method_added(method_name)
      if instance_method(method_name).arity.zero?
        avoid_infinite_method_added_loop do
          memoize(method_name)
        end
      end
    end
    
    def memoize(method_name)
      sanitized_name = method_name.to_s
      sanitized_name = sanitized_name.sub(/!$/, '_bang')
      sanitized_name = sanitized_name.sub(/\?$/, '_question_mark')
      complete_name = "#{sanitized_name}_#{object_id.abs}"
      
      class_eval(<<-EVAL, __FILE__, __LINE__)
        alias compute_#{complete_name} #{method_name}    # alias compute_section_12235760 section
                                                         # 
        def #{method_name}                               # def section
          unless defined?(@#{complete_name})             #   unless defined?(@section_12235760)
            @#{complete_name} = compute_#{complete_name} #     @section_12235760 = compute_section_12235760
          end                                            #   end
          @#{complete_name}                              #   @section_12235760
        end                                              # end
      EVAL
    end
    
    def avoid_infinite_method_added_loop
      unless @memoizing
        @memoizing = true
        yield
        @memoizing = false
      end
    end
  end
  
  class Base < Treetop::Runtime::SyntaxNode
    extend Memoized
    
    # Returns an instance of Doc (the root of the tree outputed by the PDoc::Parser).
    def root
      parent.parent.parent
    end
    
    # True if the instance was tagged as deprecated.
    def deprecated?
      tags.include?("deprecated")
    end
    
    # If instance is tagged as an alias, alias_of returns the corresponding object.
    # It will return nil otherwise.
    def alias_of
      tag = tags.find { |tag| tag.name == "alias of" }
      tag.value if tag
    end
    
    def related_to
      tag = tags.find { |tag| tag.name == "related to" }
      tag.value if tag
    end
    
    # Returns an instance of Tags::Tags.
    def tags
      start.elements.last.empty? ? [] : start.elements.last
    end
    
    # Returns the instance's class name.
    def klass_name
      ebnf.klass_name
    end
    
    # Returns the instance's name. For example:
    #     root.find_by_name("Element#update").name
    #     # -> "update"
    def name
      ebnf.name
    end
    
    # Returns the instance's full_name. For example:
    #     root.find_by_name("Element#update").full_name
    #     # -> "Element#update"
    def full_name
      ebnf.full_name
    end
    
    # Returns the instance's namespace_string. Note that event if the instance is an method or property,
    # the klass_name is not included in that string. So for example:
    #
    #     root.find_by_name("Ajax.Request#request").namespace_string
    #     # -> "Ajax"
    def namespace_string
      ebnf.namespace
    end
    
    # Returns the Klass instance if object is a class, nil otherwise.
    def klass
      nil
    end
    
    # Returns the instance's closests namespace or nil when instance or instance's
    # Klass is a global.
    def namespace
      @namespace ||= namespace_string.empty? ? nil : root.find_by_name(namespace_string)
    end
    
    # If instance is a global, returns its Section. Else its Namespace.
    def doc_parent
      namespace ? namespace : section
    end
    
    def ebnf_expressions
      ebnf.elements.map { |e| e.elements.last }
    end
    
    def description
      text.to_s
    end
    
    def signature
      ebnf.text_value.strip
    end
    
    def inspect
      "#<#{self.class} #{full_name}>"
    end
    
    def src_code_line
      input.line_of(interval.last) - 1
    end
    
    def parent_id
      namespace_string.empty? ? section_name : namespace_string
    end
    
    def section_name
      if tags.include?('section')
        value = tags.find { |tag| tag.name == 'section' }.value
        "#{value} section"
      end
    end
    
    def to_yaml
      str = "id: #{full_name.inspect}"
      str << "\nparent_id: #{parent_id.inspect}" if parent_id
      str << "\ntype: #{type}"
      str << "\nsuperclass_id: #{superclass.inspect}" if respond_to?(:superclass) && superclass
      str << "\nincluded: #{mixins.inspect}" if respond_to?(:mixins) && !mixins.empty?
      str << "\nline_number: #{src_code_line}"
      str << "\ndeprecated: true" if deprecated?
      str << "\nalias_of: #{alias_of.inspect}" if respond_to?(:alias_of) && alias_of
      str << "\nrelated_to: #{related_to.inspect}" if respond_to?(:related_to) && related_to
      str << "\ndescription: |\n#{indent(description)}\n"
    end
    
    def serialize(serializer)
      serializer << to_yaml
    end
    
    private
    def indent(str, prefix = '  ')
      str.split($/).map { |line| "#{prefix}#{line}" } * $/
    end
  end
  
  class Section < Base
    # Returns section's name
    def name
      section.name
    end

    # Returns section's full_name
    def full_name
      "#{section.name} section"
    end

    # Returns section's title
    def title
      section.title
    end

    # Returns section's description
    def description
      section.description
    end

    # Returns section's text
    def text
      section.text
    end
    
    # Returns nil.
    def klass_name
      nil
    end
    
    # Returns false.
    def global?
      false
    end
    
    # Returns nil.
    def namespace
      nil
    end
    
    # Returns an empty string.
    def namespace_string
      ""
    end
    
    # Returns nil.
    def section
      nil
    end
    
    # Returns nil.
    def doc_parent
      nil
    end
    
    # Returns "section".
    def type
      "section"
    end
  end
  
  class Method < Base
    def klass
      namespace
    end
    
    def klass_name
      ebnf_expressions.first.klass_name
    end

    def full_name
      ebnf_expressions.first.full_name
    end

    def name
      ebnf_expressions.first.name
    end

    def methodized?
      ebnf_expressions.first.methodized?
    end
    
    def namespace_string
      ebnf_expressions.first.namespace
    end
    
    def arguments
      args = argument_descriptions.elements
      args ? args.first.elements :  []
    end
    
    def signature
      ebnf_expressions.first.signature
    end

    def returns
      ebnf_expressions.first.returns
    end
    
    def fires
      events.empty? ? [] : events.to_a
    end
    
    def signatures
      ebnf_expressions
    end
    
    def serialize(serializer)
      str = to_yaml
      str << "\nmethodized: true" if respond_to?(:methodized?) && methodized?
      
      serialize_signatures(str)
      
      serialize_arguments(str) unless arguments.empty?
      
      serializer << str
    end
    
    def serialize_signatures(str)
      str << "\nsignatures:"
      ebnf_expressions.each do |ebnf|
        str << "\n -"
        str << "\n  signature: #{ebnf.signature.inspect}"
        str << "\n  return_value: #{ebnf.returns.inspect}" if ebnf.returns
      end
    end
    
    def serialize_arguments(str)
      str << "\narguments:"
      arguments.each do |arg|
        str << "\n -"
        str << "\n  name: #{arg.name}"
        str << "\n  types: [#{arg.types.join(', ')}]" unless arg.types.empty?
        str << "\n  description: >"
        str << "\n    #{arg.description}\n"
      end
    end
  end
  
  class Property < Base
    def klass
      namespace
    end
    
    def signature
      ebnf.signature
    end
    
    def returns
      ebnf.returns
    end
    
    def serialize(serializer)
      str = to_yaml
      
      str << "\nsignatures:"
      str << "\n -"
      str << "\n  signature: #{signature.inspect}"
      str << "\n  return_value: #{returns.inspect}"

      serializer << str
    end
  end
  
  class KlassMethod < Method
    def klass
      namespace.is_a?(Klass) ? namespace : nil
    end
    
    def klass_name
      klass ? klass.name : nil
    end
    
    def type
      "class method"
    end
  end
  
  class Utility < Method
    def type
      "utility"
    end
  end
  
  class InstanceMethod < Method
    def type
      "instance method"
    end
  end
  
  class Constructor < Method
    def namespace_string
      ebnf_expressions.first.namespace
    end
    
    def type
      "constructor"
    end
  end
  
  class KlassProperty < Property
    def type
      "class property"
    end
  end
  
  class InstanceProperty < Property
    def type
      "instance property"
    end
  end
  
  class Constant < Base
    def klass
      namespace.is_a?(Klass) ? namespace : nil
    end
    
    def klass_name
      klass ? klass.name : nil
    end
    
    def returns
      ebnf.returns
    end
    
    def signature
      ebnf.signature
    end
    
    def type
      "constant"
    end
  end
  
  class Namespace < Base
    def mixins
      ebnf.mixins.map { |m| m.full_name }
    end
    
    def mixin?
      false
    end
    
    def klass?
      false
    end
    
    def type
      "namespace"
    end
  end
  
  class Klass < Namespace
    def klass?
      true
    end
    
    def superclass
      sc = ebnf.superklass
      sc.text_value if sc
    end
    
    def type
      "class"
    end
  end
  
  class Mixin < Namespace
    def mixin?
      true
    end
    
    def type
      "mixin"
    end
  end
end
