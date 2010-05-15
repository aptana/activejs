module PDoc
  module Models
    class Utility < Entity
      include Callable
      
      def attach_to_parent(parent)
        parent.utilities << self
      end
    end
  end
end