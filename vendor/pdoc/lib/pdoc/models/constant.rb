module PDoc
  module Models
    class Constant < Entity
      def attach_to_parent(parent)
        parent.constants << self
      end
    end
  end
end