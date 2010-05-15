require 'json'
module PDoc
  module Generators
    class JSON < AbstractGenerator
      def render(output)
        open(output, "w+") do |file|
          json = root.registry.map do |k, obj|
            "#{k.inspect}: #{obj.to_json}"
          end.join(",\n  ")
          file << "{\n  #{json}\n}"
        end
      end
    end
  end
end
