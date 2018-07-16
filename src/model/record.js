const mongoose = require('mongoose');
const Q = require('q');
const logger = require('../config/logger');

class Record {

    constructor(record, fields) {
        fields.forEach(field => {
          this[field.name] = record[field.name];
          if(field.display_value)
            this._private.displayField = field;
        });
    }
    
    getDisplayValue() {
      return this[this._private.displayField.name];
    }

}

module.exports = Record;
