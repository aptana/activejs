#accepts any of these three arguments: compress website documentation
require 'rubygems'
require 'ftools'
require 'json'
require 'packr'
require 'rexml/document'
require 'rdiscount'
include REXML

def append_file_contents_to_target_file_without_license(file_contents,target_file)
  lines = file_contents.split(/\n/)
  license_block_start_line = 0
  license_block_finish_line = 0
  lines.each_with_index do |line,i|
    license_block_start_line = i if(line['***** LICENSE BLOCK *****'])
    license_block_finish_line = i if(line['***** END LICENSE BLOCK *****'])
  end
  if license_block_start_line == 0 && license_block_finish_line == 0
    target_file.write(file_contents + "\n")
  else
    target_file.write(lines[license_block_finish_line + 1,lines.length].join("\n") + "\n")
  end
end

def format_example(example)
  RDiscount.new(example).to_html
end

parsed_json = JSON.parse(File.read(File.join(File.dirname(__FILE__),'build.json')))

parsed_json.each do |target|
  if(target['output'])
    puts "Building: #{target['name']}"
    target_file = File.new(File.join(File.dirname(__FILE__),target['output']),'w')
    target['files'].each do |filename|
      if !File.exists?(File.join(File.dirname(__FILE__),filename))
        include_target = parsed_json.find{|item| item['name'] && item['name'] == filename}
        raise "unknown file or include: #{filename}" if !include_target
        include_target['build'].each do |include_target_filename|
          file_contents = File.read(File.join(File.dirname(__FILE__),include_target_filename))
          append_file_contents_to_target_file_without_license(file_contents,target_file)
        end
      else
        file_contents = File.read(File.join(File.dirname(__FILE__),filename))
        if filename == 'license.txt'
          target_file.write(file_contents)
        else
          append_file_contents_to_target_file_without_license(file_contents,target_file)
        end
      end
    end
    target_file.close
    if target['compress'] && (ARGV.include?('compress') || ARGV.include?('full'))
      buffer = File.read(File.join(File.dirname(__FILE__),target['output']))
      target_file = File.new(File.join(File.dirname(__FILE__),target['output']),'w+')
      buffer = Packr.pack(buffer, :shrink_vars => true, :base62 => true)
      buffer = File.read(File.join(File.dirname(__FILE__),target['compress_prepend'])) + buffer if target['compress_prepend']
      target_file.write(buffer)
    end
  end
end

if ARGV.include?('documentation') || ARGV.include?('full')
  puts `cd extensions/docs; ./make_docs.sh ~/Documents/workspace/com.aptana.sdoc; cd ..; cd ..;`
end

if ARGV.include?('website') || ARGV.include?('full')
  file = File.new('extensions/website/docs/docs.xml')
  doc = Document.new(file)
  examples = {}
  doc.root.each_element('class/examples/example') do |example|
    key = example.parent.parent.attributes['type'].gsub(/\..+$/,'').gsub(/^Active/,'').downcase
    if !examples.has_key?(key)
      examples[key] = example.text
    else
      examples[key] += "\n\n" + example.text
    end
  end
  examples.each do |key,example|
    source = File.read('extensions/website/index.html')
    target = File.new("extensions/website/#{key}.html",'w+')
    target.write(source[0,source.index('<!-- CONTENT -->')] + format_example(example) + source[source.index('<!-- /CONTENT -->') + 17,source.length])
  end
end