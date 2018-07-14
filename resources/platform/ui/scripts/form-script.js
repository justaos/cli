(function () {

    function FormScript(fields) {
        this.fields = fields;
        this.fieldMap = fields.reduce(function (map, field) {
            map[field.name] = field;
            return map;
        }, {});
    }

    FormScript.prototype.constructor = FormScript;

    FormScript.prototype.getValue = function (fieldName) {
        var field = this.fieldMap[fieldName];
        if(field.type === 'integer' || field.type === 'option'){
            return $('#form-' + fieldName).val();
        } else if(field.type === 'boolean'){
            return $('#form-' + fieldName).prop('checked');
        } else if(field.type === 'password'){

        } else {
            return $('#form-' + fieldName).val();
        }
    };

    FormScript.prototype.getRecord = function(){
        var that = this;
        return this.fields.reduce(function (map, field) {
            map[field.name] = that.getValue(field.name);
            return map;
        }, {});
    };

    window.FormScript = FormScript;

})(window);