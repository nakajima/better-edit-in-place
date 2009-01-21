// Editable: Better in-place-editing
// http://github.com/nakajima/nakatype/wikis/better-edit-in-place-editable-js

var Editable = Class.create({
    initialize: function(element, options) {
        this.element = $(element);
        Object.extend(this, options);

        // Set default values for options
        this.editField = this.editField || {};
        this.editField.type = this.editField.type || 'input';
        this.onLoading = this.onLoading || Prototype.emptyFunction;
        this.onComplete = this.onComplete || Prototype.emptyFunction;

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
        var matches = this.element.id.match(/(.*)_\d*_(.*)/);
        this.modelName = matches[1];
        this.fieldName = matches[2];
        if (this.editField.foreignKey) this.fieldName += '_id';
        return this.modelName + '[' + this.fieldName + ']';
    },

    // Create the editing form for the editable and inserts it after the element.
    // If window._token is defined, then we add a hidden element that contains the
    // authenticity_token for the AJAX request.
    setupForm: function() {
        this.editForm = new Element('form', {
            'action': this.element.readAttribute('rel'),
            'style':'display:none',
            'class':'in-place-editor'
        });

        this.setupInputElement();

        if (this.editField.tag != 'select') {
            this.saveInput = new Element('input', {
                type:'submit',
                value: Editable.options.saveText
            });
            if (this.submitButtonClass) this.saveInput.addClassName(this.submitButtonClass);

            this.cancelLink = new Element('a', {
                href:'#'
            }).update(Editable.options.cancelText);
            if (this.cancelButtonClass) this.cancelLink.addClassName(this.cancelButtonClass);
        }

        var methodInput = new Element('input', {
            type:'hidden',
            value:'put',
            name:'_method'
        });
        if (typeof(window._token) != 'undefined') {
            this.editForm.insert(new Element('input', {
                type: 'hidden',
                value: window._token,
                name: 'authenticity_token'
            }));
        }

        this.editForm.insert(this.editField.element);
        if (this.editField.type != 'select') {
            this.editForm.insert(this.saveInput);
            this.editForm.insert(this.cancelLink);
        }
        this.editForm.insert(methodInput);
        this.element.insert({
            after: this.editForm
        });
    },

    // Create input element - text input, text area or select box.
    setupInputElement: function() {
        this.editField.element = new Element(this.editField.type, {
            'name':this.field,
            'id':('edit_' + this.element.id)
        });
        if(this.editField['class']) this.editField.element.addClassName(this.editField['class']);

        if(this.editField.type == 'select') {
            // Create options
            var options = this.editField.options.map(function(option) {
                return new Option(option[0], option[1]);
            });
            // And assign them to select element
            options.each(function(option, index) {
                this.editField.element.options[index] = options[index];
            }.bind(this));

            // Set selected option
            try {
                this.editField.element.selectedIndex = $A(this.editField.element.options).find(function(option) {
                    return option.text == this.element.innerHTML;
            }.bind(this)).index;
            } catch(e) {
                this.editField.element.selectedIndex = 0;
            }

            // Set event handlers to automaticall submit form when option is changed
            this.editField.element.observe('blur', this.cancel.bind(this));
            this.editField.element.observe('change', this.save.bind(this));
        } else {
            // Copy value of the element to the input
            this.editField.element.value = this.element.innerHTML;
        }
    },

    // Sets up event handles for editable.
    setupBehaviors: function() {
        this.element.observe('click', this.edit.bindAsEventListener(this));
        if (this.saveInput) this.editForm.observe('submit', this.save.bindAsEventListener(this));
        if (this.cancelLink) this.cancelLink.observe('click', this.cancel.bindAsEventListener(this));
    },

    // Event Handler that activates form and hides element.
    edit: function(event) {
        this.element.hide();
        this.editForm.show();
        this.editField.element.activate ? this.editField.element.activate() : this.editField.element.focus();
        if (event) event.stop();
    },

    // Event handler that makes request to server, then handles a JSON response.
    save: function(event) {
        var pars = this.editForm.serialize(true);
        var url = this.editForm.readAttribute('action');
        this.editForm.disable();
        new Ajax.Request(url + ".json", {
            method: 'put',
            parameters: pars,
            onSuccess: function(transport) {
                var json = transport.responseText.evalJSON();
                var value;
                if (json[this.modelName]) {
                    value = json[this.modelName][this.fieldName];
                }
                else {
                    value = json[this.fieldName];
                }
                // If we're using foreign key, read value from the form
                // instead of displaying foreign key ID
                if (this.editField.foreignKey) {
                    value = $A(this.editField.element.options).find(function(option) {
                        return option.value == value;
                    }).text;
                }
                this.value = value;
                this.editField.element.value = this.value;
                this.element.update(this.value);
                this.editForm.enable();
                if (Editable.afterSave) {
                    Editable.afterSave(this);
                }
                this.cancel();
            }.bind(this),
            onFailure: function(transport) {
                this.cancel();
                alert("Your change could not be saved.");
            }.bind(this),
            onLoading: this.onLoading.bind(this),
            onComplete: this.onComplete.bind(this)
        });
        if (event) {
            event.stop();
        }
    },

    // Event handler that restores original editable value and hides form.
    cancel: function(event) {
        this.element.show();
        this.editField.element.value = this.value;
        this.editForm.hide();
        if (event) {
            event.stop();
        }
    },

    // Removes editable behavior from an element.
    clobber: function() {
        this.element.stopObserving('click');
        try {
            this.editForm.remove(); delete(this);
        }
        catch(e) {
            delete(this);
        }
    }
});

// Editable class methods.
Object.extend(Editable, {
    options: {
        saveText: 'Save',
        cancelText: 'Cancel'
    },
    create: function(element) {
        new Editable(element);
    },

    setupAll: function(klass) {
        klass = klass || '.editable';
        $$(klass).each(Editable.create);
    }
});

// Helper method for event delegation
Element.addMethods({
    editable: function(element, options) {
        new Editable(element, options).edit();
    }
});
