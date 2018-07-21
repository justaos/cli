(function () {

    function FormScript(fields) {
        this.fields = fields;
        this.fieldMap = fields.reduce(function (map, field) {
            map[field.name] = field;
            return map;
        }, {});
        var that = this;
        this.fields.forEach(function (field) {
            that.setMandatory(field.name, field.mandatory);
            that.setReadOnly(field.name, field.read_only);
        });
    }

    FormScript.prototype.constructor = FormScript;

    FormScript.prototype.getValue = function (fieldName) {
        var field = this.fieldMap[fieldName];
        if (field) {
            if (field.type === 'boolean') {
                return this.getElement(fieldName).prop('checked');
            } else if (field.type === 'script') {
                return window.editors[fieldName].getValue();
            } else {
                return this.getElement(fieldName).val();
            }
        } else {
            console.warn("No such field - " + fieldName);
            return '';
        }
    };

    FormScript.prototype.setValue = function (fieldName, value) {
        var field = this.fieldMap[fieldName];
        if (field) {
            if (field.type === 'boolean') {
                this.getElement(fieldName).prop('checked', value);
            } else if (field.type === 'script') {
                window.editors[fieldName].setValue(value);
            } else {
                this.getElement(fieldName).val(value);
            }
        } else {
            console.warn("No such field - " + fieldName)
        }
    };

    FormScript.prototype.getElement = function (fieldName) {
        return $('#form-' + fieldName);
    };

    FormScript.prototype.addErrorMessage = function (htmlMessage) {
        $('#alert-zone').append('<div class="alert alert-danger alert-dismissible fade show mt-2" role="alert">' +
            htmlMessage +
            '    <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '        <span aria-hidden="true">&times;</span>' +
            '    </button>' +
            '    </div>');
    };


    FormScript.prototype.setMandatory = function (fieldName, mandatory) {
        var element = this.getElement(fieldName);
        if (element.length) {
            if (mandatory) {
                element.closest('.form-group').addClass('required');
                element.prop('required', true);
            } else {
                element.closest('.form-group').removeClass('required');
                element.prop('required', false);
            }
        }
    };

    FormScript.prototype.isMandatory = function (fieldName) {
        var element = this.getElement(fieldName);
        if (element.length) {
            return element.prop('required');
        }
    };

    FormScript.prototype.setReadOnly = function (fieldName, readOnly) {
        var element = this.getElement(fieldName);
        if (element.length) {
            if (readOnly && this.isMandatory(fieldName)) {
                this.addErrorMessage(this.fieldMap[fieldName].label + ' : mandatory field cannot be made read-only');
            } else
                element.prop('disabled', readOnly);
        }
    };

    FormScript.prototype.getRecord = function () {
        var that = this;
        return this.fields.reduce(function (map, field) {
            map[field.name] = that.getValue(field.name);
            return map;
        }, {});
    };

    window.FormScript = FormScript;

})(window);