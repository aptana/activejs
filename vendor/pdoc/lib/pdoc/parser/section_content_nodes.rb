module SectionContent
  class Section < Treetop::Runtime::SyntaxNode
    def name
      title.text_value.strip
    end

    def description
      text.to_s
    end

    def full_name
      name
    end
    
    def id
      name.downcase.gsub(/\s+/, "_")
    end
  end
end
