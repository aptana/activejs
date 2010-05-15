$:.unshift(File.dirname(__FILE__), 'models')

require 'models/base'
require 'models/entity'
require 'models/container'
require 'models/callable'
require 'models/section'
require 'models/root'
require 'models/argument'
require 'models/class'
require 'models/class_method'
require 'models/class_property'
require 'models/constant'
require 'models/constructor'
require 'models/instance_method'
require 'models/instance_property'
require 'models/mixin'
require 'models/namespace'
require 'models/signature'
require 'models/utility'

module PDoc
  module Models
    class << Models
      attr_accessor :src_code_href
      attr_accessor :doc_href
    end
    
    class Base
      @@subclasses_by_type = {
        'section' => Section,
        'argument' => Argument,
        'class' => Class,
        'class method' => ClassMethod,
        'class property' => ClassProperty,
        'constant' => Constant,
        'constructor' => Constructor,
        'instance method' => InstanceMethod,
        'instance property' => InstanceProperty,
        'mixin' => Mixin,
        'namespace' => Namespace,
        'signature' => Signature,
        'utility' => Utility
      }
    end
  end
end