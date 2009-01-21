require 'fileutils'

FileUtils.cp(File.dirname(__FILE__) + '/src/editable.js', File.dirname(__FILE__) + '/../../../public/javascripts/editable.js')
