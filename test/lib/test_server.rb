require 'rubygems'
require 'sinatra'
require 'activesupport'

TEST_ROOT = File.join(File.dirname(__FILE__), '..')

get '/' do
  File.read(File.join(TEST_ROOT, 'unit', 'editable_test.html'))
end

get '/src/editable.js' do
  File.read(File.join(TEST_ROOT, '..', 'src', 'editable.js'))
end

put '/lists/1.json' do
  list = { :title => params['list']['title'] }
  list.to_json
end

put '/users/2.json' do
  user = { :user => { :first_name => params['user']['first_name'] } }
  user.to_json
end

put '/posts/5.json' do
  post = { :post => { :author_id => params['post']['author_id'] } }
  post.to_json
end
