module PDoc
  module Models
    class Entity < Base
      attr_accessor :alias
      
      def signatures
        @signatures ||= []
      end
      
      def <=>(other)
        id.downcase <=> other.id.downcase
      end
      
      def src_code_href
        proc = Models.src_code_href
        @src_code_href ||= proc ? proc.call(self) : nil
      end

      def signatures?
        @signatures && !@signatures.empty?
      end
      
      def signature
        @signature ||= signatures.first
      end
      
      def methodized?
        !!@methodized
      end
      
      def alias?
        !!@alias
      end
      
      # returns an array of aliases
      def aliases
        @aliases ||= []
      end
      
      def aliases?
        @aliases && !@aliases.empty?
      end
      
      def to_hash
        super.merge({
          :aliases => aliases.map { |a| a.id },
          :alias => self.alias ? self.alias.id : nil,
          :signatures => signatures,
          :src_code_href => src_code_href
        })
      end
    end
  end
end
