const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Shipping Method Schema
const shippingMethodSchema = new Schema({
  country: String,
  price: Number,
  name: String,
  id: String,
});
module.exports = mongoose.model('shippingMethod', shippingMethodSchema);
