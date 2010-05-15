module Basic
  class BlankLine < Treetop::Runtime::SyntaxNode
    def to_s
      ""
    end
  end

  class TextLine < Treetop::Runtime::SyntaxNode
    def to_s
      text.text_value
    end
  end

  class Line < Treetop::Runtime::SyntaxNode
  end

  class CommentStart < Treetop::Runtime::SyntaxNode
  end

  class CommentEnd < Treetop::Runtime::SyntaxNode
  end

  class LineBreak < Treetop::Runtime::SyntaxNode
  end

  class Char < Treetop::Runtime::SyntaxNode
  end

  class Space < Treetop::Runtime::SyntaxNode
  end
end