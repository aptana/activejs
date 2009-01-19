require 'rubygems'
require 'ftools'
require 'json'
require 'packr'

JSON.parse(File.read(File.join(File.dirname(__FILE__),'build.json'))).each do |target|
  if(target['output'])
    puts "Building: #{target['name']}"
    target_file = File.new(File.join(File.dirname(__FILE__),target['output']),'w')
    target['files'].each do |filename|
      file_contents = File.read(File.join(File.dirname(__FILE__),filename))
      if filename == 'license.txt'
        target_file.write(file_contents)
      else
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
    end
    target_file.close
    if target['compress'] #&& (ARGV[0] && ARGV[0] == 'compress')
      buffer = File.read(File.join(File.dirname(__FILE__),target['output']))
      target_file = File.new(File.join(File.dirname(__FILE__),target['output']),'w+')
      buffer = Packr.pack(buffer, :shrink_vars => true, :base62 => true)
      buffer = File.read(File.join(File.dirname(__FILE__),target['compress_prepend'])) + buffer if target['compress_prepend']
      target_file.write(buffer)
    end
  end
end