var FormScript = /** @class */ (function () {
    function FormScript(fields, formType) {
        this.changeCallbacks = [];
        this.submitCallbacks = [];
        this.fields = fields;
        this.formType = formType;
        this.form = document.getElementById('form');
        this.fieldMap = fields.reduce(function (map, field) {
            map[field.name] = field;
            map[field.name].element = $('#form-' + field.name);
            return map;
        }, {});
        var that = this;
        this.fields.forEach(function (field) {
            that.setMandatory(field.name, field.mandatory);
            that.setReadOnly(field.name, field.read_only);
        });
        this._attachListeners();
    }
    FormScript.prototype.isCreateForm = function () {
        return this.formType === 'create';
    };
    FormScript.prototype.isEditForm = function () {
        return this.formType === 'edit';
    };
    FormScript.prototype.getLabel = function (fieldName) {
        return this.fieldMap[fieldName].label;
    };
    FormScript.prototype.getValue = function (fieldName) {
        var field = this.fieldMap[fieldName];
        if (field) {
            if (field.type === 'boolean') {
                return this.getElement(fieldName).prop('checked');
            }
            else if (field.type === 'script') {
                // @ts-ignore
                return window.editors[fieldName].getValue();
            }
            else {
                return this.getElement(fieldName).val();
            }
        }
        else {
            console.warn("No such field - " + fieldName);
            return '';
        }
    };
    FormScript.prototype.setValue = function (fieldName, value) {
        var field = this.fieldMap[fieldName];
        if (field) {
            if (field.type === 'boolean') {
                this.getElement(fieldName).prop('checked', value);
            }
            else if (field.type === 'script') {
                // @ts-ignore
                window.editors[fieldName].setValue(value);
            }
            else {
                this.getElement(fieldName).val(value);
            }
        }
        else {
            console.warn("No such field - " + fieldName);
        }
    };
    FormScript.prototype.setDisplay = function (fieldName, display) {
        var element = this.getElement(fieldName);
        if (element.length) {
            if (display) {
                element.closest('.form-group').removeClass('d-none');
            }
            else {
                element.closest('.form-group').addClass('d-none');
            }
        }
    };
    FormScript.prototype.getElement = function (fieldName) {
        return $('#form-' + fieldName);
    };
    FormScript.prototype.addErrorMessage = function (htmlMessage) {
        $('#alert-zone').append('<div class="alert alert-danger alert-dismissible fade show mt-2 form-alert" role="alert">' +
            htmlMessage +
            '    <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '        <span aria-hidden="true">&times;</span>' +
            '    </button>' +
            '    </div>');
    };
    FormScript.prototype.clearAlertMessages = function () {
        // @ts-ignore
        $('.form-alert').alert("close");
    };
    FormScript.prototype.setMandatory = function (fieldName, mandatory) {
        var element = this.getElement(fieldName);
        if (element.length) {
            if (mandatory) {
                element.closest('.form-group').addClass('required');
                element.prop('required', true);
            }
            else {
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
            }
            else
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
    FormScript.prototype._attachListeners = function () {
        var that = this;
        this.fields.forEach(function (field) {
            if (field.type === 'script') {
                // @ts-ignore
                //  window.editors[fieldName].setValue(value);
            }
            else {
                that.getElement(field.name).on('change', function () {
                    that.fireCallBacks(field);
                });
            }
        });
    };
    FormScript.prototype.fireCallBacks = function (field) {
        var that = this;
        that.changeCallbacks.forEach(function (callBack) {
            callBack(field, that.getValue(field.name));
        });
    };
    FormScript.prototype.onChange = function (callBack) {
        this.changeCallbacks.push(callBack);
    };
    FormScript.prototype.onSubmit = function (callBack) {
        this.submitCallbacks.push(callBack);
    };
    FormScript.prototype.submit = function () {
        var that = this;
        var promises = [];
        this.submitCallbacks.forEach(function (callBack) {
            // @ts-ignore
            promises.push(new Promise(function (resolve, reject) {
                callBack(resolve, reject);
            }));
        });
        // @ts-ignore
        Promise.all(promises).then(function () {
            that.clearAlertMessages();
            var evt = document.createEvent("Event");
            evt.initEvent("submit", true, true);
            that.form.dispatchEvent(evt);
        });
    };
    return FormScript;
}());
// @ts-ignore
(function (window, $) {
    // @ts-ignore
    window.FormScript = FormScript;
})(window, $);
