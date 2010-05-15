module PDoc
  module Models
    class Base
      @@subclasses_by_type = {}
      
      def self.instantiate(attributes)
        @@subclasses_by_type[attributes['type']].new(attributes)
      end
      
      attr_accessor :parent
      attr_reader   :description
      attr_reader   :id
      attr_reader   :type
      attr_reader   :file
      attr_reader   :line_number
      
      def initialize(attributes = {})
        attributes.each { |k, v| instance_variable_set("@#{k}", v) }
      end
      
      def register_on(registry)
        registry[id] = self
      end
      
      def short_description
        @short_description ||= description.split(/\n\n/).first
      end
      
      def deprecated?
        return !!@deprecated if @deprecated
        parent.respond_to?(:deprecated?) ? parent.deprecated? : false
      end
      
      def full_name
        @id
      end
      
      def name
        @name ||= @id.match(/[\w\d\$]+$/)[0]
      end
      
      def ancestor_of?(obj)
        while obj = obj.parent
          return true if obj == self
        end 
        false
      end
      
      def descendant_of?(obj)
        obj.ancestor_of?(self)
      end
      
      def doc_href
        proc = Models.doc_href
        @doc_href ||= proc ? proc.call(self) : nil
      end
      
      def url(separator = '/')
        result = []
        obj = self
        begin
          result << obj.normalized_name
          if obj.is_a?(Models::InstanceMethod) || obj.is_a?(Models::InstanceProperty)
            result << 'prototype'
          end
          obj = obj.parent
        end until obj.is_a?(Models::Root)
        result.reverse.join(separator)
      end
      
      def to_hash
        {
          :deprecated => deprecated?,
          :id => id,
          :type => type,
          :description => description,
          :short_description => short_description,
          :parent => parent.is_a?(Models::Root) ? nil : parent.id,
          :doc_href => doc_href
        }
      end
      
      def to_json(*args)
        to_hash.to_json(*args)
      end
      
      def normalized_name
        @normalized_name ||= name.gsub(/(^\$+$)|(^\$+)|(\$+$)|(\$+)/) do |m|
          dollar = Array.new(m.length, 'dollar').join('-')
          if $1
            dollar
          elsif $2
            "#{dollar}-"
          elsif $3
            "-#{dollar}"
          elsif $4
            "-#{dollar}-"
          end
        end
      end
      
      def inspect
        "#<#{self.class} #{id}>"
      end
    end
  end
end