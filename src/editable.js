// Editable: Better in-place-editing
// http://github.com/nakajima/nakatype/wikis/better-edit-in-place-editable-js
var Editable = Class.create({
  editFieldTag: 'input',

  initialize: function(element, options) {
    Object.extend(this, options);
    this.element = $(element);
    this.elementID = this.element.identify();
    this.field = this.parseField();
    this.value = this.element.innerHTML;
    this.setupForm();
    this.setupBehaviors();
  },
  
 	// In order to parse the field correctly, it's necessary that the element
	// you want to edit in place for have an id of (model_name)_(id)_(field_name).
	// For example, if you want to edit the "caption" field in a "Photo" model,
	// your id should be something like "photo_#{@photo.id}_caption".
	// If you want to edit the "comment_body" field in a "MemberBlogPost" model,
	// it would be: "member_blog_post_#{@member_blog_post.id}_comment_body"
 	parseField: function() {
		var matches = this.elementID.match(/(.*)_(\d*)_(.*)/);
    var fieldString = matches[1] + '[' + matches[3] + ']';
		return fieldString;
  },
  
  // Create the editing form for the editable and inserts it after the element.
  // If window._token is defined, then we add a hidden element that contains the
  // authenticity_token for the AJAX request.
  setupForm: function() {
    this.editForm = new Element('form', { 'action': this.element.readAttribute('rel'), 'style':'display:none', 'class':'editor' });
    this.editInput = new Element(this.editFieldTag, { 'name':this.field, 'id':('edit_' + this.element.identify()) });
    this.editInput.value = this.element.innerHTML;
    var saveInput = new Element('input', { 'type':'submit', 'value':'Save' });
    this.cancelLink = new Element('a', { 'href':'#' }); this.cancelLink.update('Cancel');
    var methodInput = new Element('input', { 'type':'hidden', 'value':'put', 'name':'_method' });
    if (typeof(window._token) != 'undefined') {
      this.editForm.insert(new Element('input', {
        type: 'hidden',
        value: window._token,
        name: 'authenticity_token'
      }));
    }
    this.editForm.insert(this.editInput);
    this.editForm.insert(saveInput);
    this.editForm.insert(this.cancelLink);
    this.editForm.insert(methodInput);
    this.element.insert({after: this.editForm });
  },

  // Sets up event handles for editable.
  setupBehaviors: function() {
    this.element.observe('click', this.edit.bindAsEventListener(this));
    this.editForm.observe('submit', this.save.bindAsEventListener(this));
    this.cancelLink.observe('click', this.cancel.bindAsEventListener(this));
  },

  // Event Handler that activates form and hides element
  edit: function(event) {
    this.element.hide();
    this.editForm.show();
    this.editInput.activate();
    event.stop();
  },

  // Event handler that makes request to server, then handles a JSON response.
  save: function(event) {
    var form = event.element();
    var pars = form.serialize();
    var url = form.readAttribute('action');
    form.disable();
    new Ajax.Request(url, {
      method: 'put',
      parameters: pars,
      onSuccess: function(transport) {
        var json = transport.responseText.evalJSON();
        var attr = this.field.replace(/\w+\[(\w+)\]/, '$1');
        this.value = json[attr];
        this.editInput.value = json[attr];
        this.element.update(json[attr]);
        form.enable();
        this.cancel();
      }.bind(this),
      onFailure: function(transport) {
        this.cancel();
        alert("Your change could not be saved.");
      }.bind(this)
    });
    event.stop();
  },

  // Event handler that restores original editable value and hides form.
  cancel: function(event) {
    this.element.show();
    this.editInput.value = this.value;
    this.editForm.hide();
    event.stop();
  },
  
  // Removes editable behavior from an element.
  clobber: function() {
    this.editForm.remove();
    this.element.stopObserving('click');
    delete(this);
  }
});

Object.extend(Editable, {
  create: function(element) {
    new Editable(element);
  },
  
  setupAll: function() {
    $$('.editable').each(Editable.create);
  }
});

Event.observe(document, 'dom:loaded', Editable.setupAll);