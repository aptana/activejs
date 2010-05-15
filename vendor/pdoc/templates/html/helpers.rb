module PDoc
  module Generators
    module Html
      module Helpers
        module BaseHelper
          def layout_section(title, classname = title.downcase)
            <<-EOS
              <div class="section section-#{classname}">
                <div class="section-title">
                  <h3>#{title}</h3>
                </div> <!-- .section-title -->
                <div class="section-content">
            EOS
          end
          
          def end_layout_section
            <<-EOS
              </div> <!-- .section-content -->
            </div> <!-- .section -->
            EOS
          end
        end
        
        module LinkHelper
        end
        
        module CodeHelper
        end
        
        module MenuHelper
        end
      end
    end
  end
end