module PDoc
  module Generators
    module Html
      class SyntaxHighlighter
        CODE_BLOCK_REGEXP = /(?:\n\n|\A)(?:\s{4,}lang(?:uage)?:\s*(\w+)\s*\n)?((?:\s{4}.*\n*)+)(^\s{0,3}\S|\z)?/
        
        attr_reader :highlighter
        
        def initialize(h = nil)
          @highlighter = h.nil? ? :none : h.to_sym
        end
        
        def parse(input)
          input.gsub(CODE_BLOCK_REGEXP) do |block|
            language, codeblock, remainder = $1, $2, $3
            codeblock = codeblock.gsub(/^\s{4}/, '').rstrip
            "\n\n#{highlight_block(codeblock, language)}\n#{remainder}"
          end
        end
        
        def highlight_block(code, language)
          language = :javascript if language.nil?
          case highlighter.to_sym
            when :none
              require 'cgi'
              code = CGI.escapeHTML(code)
              "<pre><code class=\"#{language}\">#{code}</code></pre>"
            when :coderay
              require 'coderay'
              CodeRay.scan(code, language).div
            when :pygments
              require 'albino'
              Albino.new(code, language).colorize
          else
            raise "Requested unsupported syntax highlighter: #{highlighter}"
          end
        end
      end
    end
  end
end
