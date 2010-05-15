Gem::Specification.new do |s|
  s.name     = "pdoc"
  s.version  = "0.2.0"
  s.date     = "2008-11-17"
  s.summary  = "Inline comment parser and JavaScript documentation generator"
  s.email    = "tobie.langel@gmail.com"
  s.homepage = "http://pdoc.org/"
  s.description = "PDoc is an inline comment parser and JavaScript documentation generator written in Ruby. It is designed for documenting Prototype and Prototype-based libraries."
  s.has_rdoc = true
  s.authors  = ["Tobie Langel"]
  s.files    = [
        "CHANGELOG", 
		"README.markdown", 
		"Rakefile", 
		"pdoc.gemspec"] +
		Dir['lib/**/*'] +
        Dir['templates/**/*']
  
  s.autorequire = "lib/pdoc.rb"
  
  s.bindir = "bin"
  s.executables = ["pdoc"]
  s.default_executable = "pdoc"
  
  s.test_files = Dir['test/**/*.rb']
  s.rdoc_options = ["--main", "README.markdown"]
  s.extra_rdoc_files = ["CHANGELOG", "README.markdown"]
  s.add_dependency("BlueCloth", ["> 0.0.0"])
  s.add_dependency("treetop", ["> 0.0.0"])
  s.add_dependency("oyster", ["> 0.0.0"])
end

