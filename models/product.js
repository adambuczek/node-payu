const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Product Schema
const productSchema = new Schema({
  name: String,
  unitPrice: Number,
  id: String,
});

productSchema.statics.findById = function(id) {
  return this.find({ id: id });
};

module.exports = mongoose.model('product', productSchema);
