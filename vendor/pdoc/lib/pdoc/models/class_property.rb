module PDoc
  module Models
    class ClassProperty < Entity
      def attach_to_parent(parent)
        parent.class_properties << self
      end
    end
  end
end