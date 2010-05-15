module PDoc
  module Generators
    class AbstractGenerator
      attr_reader :options, :root
      def initialize(root, options = {})
        @root = root
        @options = options
      end
      
      # Creates a new directory with read, write and execute permission.
      def mkdir(name)
        Dir.mkdir(name, 0755)
      end
    end
  end
end