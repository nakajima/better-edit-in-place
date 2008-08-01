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
  
  // Tries to make a good guess at model/attribute names. The trouble is that
  // if you have multiple editable elements that are of the same type, editing
  // the same attribute, you could end up with duplicate ID attributes. Also ID
  // attributes shouldn't have brackets in them. As a result, editables can have
  // unique ID attributes that contain their ID and valid attribute syntax, but 
  // we have to do some work figuring out what the original resource[attribute]
  // intention is. There's probably a better way to do this.
  parseField: function() {
    var params = new Array; var values = new Array;
    var levels = new Array;
    this.element.readAttribute('rel').scan(/\/(\w+)\//, function(m) { if (!m[1].match(/\d+/)) { params.push(m[1].gsub(/s$/, '')); } });
    var split = this.elementID.split('_').reject(function(m) { return m.match(/\d+/); });
    var attrs = $A(split).select(function(m) { return params.include(m); });
    var fields = split.inject(new Array, function(memo, attr) {
      if ( attrs.include(attr) ) {
        memo.push(attr);
        return memo;
      } else {
        if ( !attrs.include(memo.last()) || attr == 'id' ) {
          memo[memo.length - 1] += '_' + attr;
        } else { memo.push(attr); }
        return memo;
      }
    });
    var fieldString = fields.join('[');
    (fields.length - 1).times(function() { fieldString += ']'; });
    return fieldString;
  },
  
  // Create the editing form for the editable and inserts it after the element.
  setupForm: function() {
    this.editForm = new Element('form', { 'action': this.element.readAttribute('rel'), 'style':'display:none', 'class':'editor' });
    this.editInput = new Element(this.editFieldTag, { 'name':this.field, 'id':('edit_' + this.element.identify()) });
    this.editInput.value = this.element.innerHTML;
    var saveInput = new Element('input', { 'type':'submit', 'value':'Save' });
    this.cancelLink = new Element('a', { 'href':'#' }); this.cancelLink.update('Cancel');
    var methodInput = new Element('input', { 'type':'hidden', 'value':'put', 'name':'_method' });
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