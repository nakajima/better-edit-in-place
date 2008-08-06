module Nakajima
  module BetterEditInPlace
    def edit_in_place(resource, field, options={})
      # Get record to be edited. If resource is an array, pull it out.
      record = resource.is_a?(Array) ? resource.last : resource

      options[:id]  ||= "#{dom_id(record)}_#{field}"
      options[:tag] ||= :span
      options[:url] ||= url_for(resource)
      options[:rel] ||= options.delete(:url)
      options.delete(:url) # Just in case it wasn't cleared already

      classes = options[:class].split(' ') rescue []
      classes << 'editable'
      options[:class] = classes.uniq.join(' ')

      content_tag(options.delete(:tag), record.send(field), options)
    end
  end  
end

ActionView::Base.send :include, Nakajima::BetterEditInPlace