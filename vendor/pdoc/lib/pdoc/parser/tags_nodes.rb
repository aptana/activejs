module Tags
  class Tags < Treetop::Runtime::SyntaxNode
    include Enumerable
    
    def include?(tag_name)
      any? {|tag| tag.name == tag_name }
    end
    
    def each
      yield tag
      more.elements.each { |e| yield e.tag }
    end
  end
end