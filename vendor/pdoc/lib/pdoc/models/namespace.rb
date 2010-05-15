module PDoc
  module Models
    class Namespace < Entity
      include Container
      def attach_to_parent(parent)
        parent.namespaces << self
      end
    end
  end
end
