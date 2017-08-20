const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Order Schema
const orderSchema = new Schema({
  id: String,
  createDate: String,
  statusHistory: Array
});
module.exports = mongoose.model('order', orderSchema);
