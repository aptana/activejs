module PDoc
  module Models
    class Mixin < Entity
      include Container
      def attach_to_parent(parent)
        parent.mixins << self
      end
    end
  end
end