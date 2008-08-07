require 'rubygems'
require 'activesupport'
require 'sinatra'

TEST_ROOT = File.join(File.dirname(__FILE__), '..')

get '/' do
  File.read(File.join(TEST_ROOT, 'unit', 'editable_test.html'))
end

get '/src/editable.js' do
  File.read(File.join(TEST_ROOT, '..', 'src', 'editable.js'))
end

put '/lists/1' do
  puts params.to_yaml
  list = { :title => params['list[title]'] }
  list.to_json
end

put '/users/2' do
  user = { :user => { :first_name => params['user[first_name]'] } }
  user.to_json
end