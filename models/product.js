const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Product Schema
const productSchema = new Schema({
  name: String,
  unitPrice: Number,
  enabled: { type: Boolean, default: true },
  added: { type: Date, default: Date.now },
});

module.exports = mongoose.model('product', productSchema);
