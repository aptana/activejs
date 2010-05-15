module PDoc
  module Models
    class Root
      include Container
      
      def sections
        @sections ||= []
      end
      
      def sections?
        @sections && !@sections.empty?
      end
      
      def registry
        @registry ||= {}
      end
      
      def find(id)
        registry[id]
      end
      
      def parent
        nil
      end
    end
  end
end
