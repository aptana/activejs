module PDoc
  module Models
    module Callable
      def arguments
        @arguments ||= []
      end
      
      def arguments?
        @arguments && !@arguments.empty?
      end
      
      def to_hash
        super.merge({
          :arguments => arguments
        })
      end
    end
  end
end