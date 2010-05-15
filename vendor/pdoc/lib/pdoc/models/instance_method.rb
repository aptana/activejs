module PDoc
  module Models
    class InstanceMethod < Entity
      include Callable
      attr_accessor :functionalized_self
      def attach_to_parent(parent)
        parent.instance_methods << self
      end
      
      def to_hash
        f = functionalized_self
        super.merge({
          :functionalized_self => f ? f.id : nil
        })
      end
    end
  end
end