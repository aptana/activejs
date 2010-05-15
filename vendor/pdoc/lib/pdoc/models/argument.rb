module PDoc
  module Models
    class Argument < Base
      attr_reader :name
      attr_reader :default_value
      
      def attach_to_parent(parent)
        parent.arguments << self
      end
      
      # returns the argument's id in the form
      # method_id:argument_name. So, for example:
      # document.querySelectorAll:cssSelector
      def id
        @id ||= "#{parent.id}:#{name}"
      end
      
      def optional?
        !!@optional
      end
      
      def types
        @types ||= []
      end
      
      def to_hash
        {
          :name => name,
          :description => description,
          :default_value => default_value,
          :optional => optional?,
          :types => types
        }
      end
    end
  end
end