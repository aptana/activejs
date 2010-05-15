module Description
  class Text < Treetop::Runtime::SyntaxNode
    include Enumerable
    def each
      elements.map { |e| e.to_s }.each { |tag| yield tag }
    end
    
    def join(sep = "\n")
      outdent.join(sep).strip
    end
    
    def to_s
      join
    end
    
    def excerpt
      
    end
    
    def inspect
      text = truncate(15).gsub(/\n/, " ").strip.inspect
      "#<#{self.class} #{text}>"
    end
    
    def truncate(num = 30)
      to_s.length < num ? to_s : to_s.slice(0..num) << "..."
    end
    
    def outdent
      range = tab_length..-1
      map { |l| l.slice(range) }
    end
    
    private
      def tab_length
        reject { |l| l =~ /^\s*$/ }.map do |line|
          line = line.slice(/^\s*/)
          line ? line.length : 0
        end.min || 0
      end
  end
end