module ArgumentDescription
  class ArgumentDescription < Treetop::Runtime::SyntaxNode
    def name
      first.argument_name.name.text_value
    end
    
    def types
      if first.arg_types.empty?
        []
      else
        args = first.arg_types.elements.last
        [args.argument_type.text_value].concat(args.more.elements.map{ |e| e.argument_type.text_value })
      end
    end
    
    def description
      more_lines = more.elements.map{ |l| l.to_s.strip }.reject { |l| l.empty? }
      [first.description.text_value.strip].concat(more_lines).join(" ")
    end
  end
end