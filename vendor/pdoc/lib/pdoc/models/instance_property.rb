module PDoc
  module Models
    class InstanceProperty < Entity
      def attach_to_parent(parent)
        parent.instance_properties << self
      end
    end
  end
end