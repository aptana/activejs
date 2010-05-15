module PDoc
  module Models
    class Constructor < Entity
      include Callable
      def attach_to_parent(parent)
        parent.constructor = self
      end
      
      def name
        @name ||= 'new'
      end
    end
  end
end
