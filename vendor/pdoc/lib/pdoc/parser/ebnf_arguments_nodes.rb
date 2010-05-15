module EbnfArguments
  class Argument < Treetop::Runtime::SyntaxNode
    def name
      text_value.strip
    end
    
    def optional?
      false
    end
    
    def default_value
      nil
    end
    
    def flatten_nested_args
      [self]
    end
  end

  class OptionalArgument < Treetop::Runtime::SyntaxNode
    def name
      required_argument.name
    end
    
    def optional?
      true
    end
    
    def default_value
      unless default.empty?
        value = default.value.text_value.strip
        value.empty? ? nil : value
      end
    end
    
    def flatten_nested_args
      arguments = [self]
      unless nested.empty?
        nested.elements.each do |optional|
          arguments.concat(optional.flatten_nested_args)
        end
      end
      arguments
    end
  end
  
  class Arguments < Treetop::Runtime::SyntaxNode
    def to_a
      first_argument.flatten_nested_args + rest_arguments_flattened
    end
    
    def rest_arguments_flattened
      rest.elements.inject([]) do |args, e|
        args.concat(e.argument.flatten_nested_args)
      end
    end
  end
end
