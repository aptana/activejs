module PDoc
  module Models
    class Signature < Base
      attr_reader :return_value
      def attach_to_parent(parent)
        parent.signatures << self
      end
      
      #TODO API cleanup
      
      def to_s
        @signature
      end
      
      def name
        @signature
      end
      
      def to_hash
        {
          :name => name,
          :return_value => return_value
        }
      end
    end
  end
end