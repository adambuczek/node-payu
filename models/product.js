const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Product Schema
const productSchema = new Schema({
  name: String,
  price: Number,
  id: String,
});
module.exports = mongoose.model('product', productSchema);
