const mongoose = require('mongoose');

class CollectionFind {

  constructor(model) {
    this.model = model;
  }


  findById(model, id) {
    return this.model.findById(id);
  }


}

module.exports = CollectionFind;

