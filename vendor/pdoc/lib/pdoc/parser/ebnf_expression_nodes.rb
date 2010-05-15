module EbnfExpression
  class Base < Treetop::Runtime::SyntaxNode
    def klass_name
      js_namespace.to_a.last
    end
    
    def name
      js_variable.value
    end
    
    def full_name
      js_namespace.text_value
    end
    
    def namespace
      js_namespace.text_value
    end
    
    def returns
      return_value.value.text_value.strip
    end
    
    def to_s
      text_value
    end
    
    def inspect
      "#<#{self.class} @input=#{@input.inspect}>"
    end
  end
  
  class Method < Base
    def arguments
      args.arguments.to_a
    end
    
    def methodized?
      false
    end
    
    def signature
      "#{name}#{args.text_value}"
    end
  end
  
  class KlassMethod < Method
    def klass_name
      js_namespace.to_a.slice(-2)
    end
    
    def name
      js_namespace.to_a.last
    end

    def methodized?
      args.methodize.text_value == '@'
    end

    def namespace
      js_namespace.to_a.slice(0..-2).join(".")
    end
    
    def signature
      "#{namespace}.#{name}#{args.text_value.sub('@', '')}"
    end
  end
  
  class Utility < Method
    def klass_name
      nil
    end
    
    def name
      utility_name.text_value
    end
    
    def full_name
      name
    end
    
    def namespace
      ""
    end
  end
  
  class InstanceMethod < Method
    def accessor
      instance_signature.instance_accessor
    end
    
    def args
      instance_signature.args
    end
    
    def js_namespace
      accessor.js_namespace
    end
    
    def js_variable
      accessor.js_variable
    end
    
    def full_name
      accessor.text_value
    end

    def signature
      instance_signature.text_value
    end
  end
  
  class Constructor < Method
    def name
      "new"
    end
    
    def full_name
      "new #{super}"
    end
    
    def returns
      nil
    end
    
    def signature
      "#{full_name}#{args.text_value}"
    end
  end
  
  class KlassProperty < Base
    def klass_name
      js_namespace.to_a.slice(-2)
    end
    
    def name
      js_namespace.to_a.last
    end

    def namespace
      js_namespace.to_a.slice(0..-2).join(".")
    end
    
    def signature
      "#{namespace}.#{name}"
    end
  end
  
  class InstanceProperty < Base
    def accessor
      instance_accessor
    end
    
    def js_namespace
      accessor.js_namespace
    end
    
    def js_variable
      accessor.js_variable
    end
    
    def full_name
      accessor.text_value
    end
    
    def signature
      "#{namespace}##{name}"
    end
  end
  
  class Constant < Base
    def klass_name
      nil
    end
    
    def name
      js_namespace.to_a.last
    end
        
    def namespace
      js_namespace.to_a.slice(0..-2).join(".")
    end
    
    def returns
      value.text_value.strip
    end
    
    def signature
      "#{namespace}.#{name}"
    end
  end
  
  class Namespace < Base
    def klass_name
      nil
    end
    
    def name
      js_namespace.to_a.last
    end

    def namespace
      js_namespace.to_a.slice(0..-2).join(".")
    end
    
    def mixins
      second_line = elements.last
      if second_line.empty?
        []
      else
        [second_line.js_namespace].concat(second_line.more.elements.map{|e| e.elements.last})
      end
    end
  end
  
  class Klass < Namespace
    def subklass?
      !extends.elements.nil?
    end
    
    def superklass
      subklass? ? extends.elements.last : nil
    end
  end
  
  class Mixin < Namespace
  end
end
