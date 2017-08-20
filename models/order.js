const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Order Schema
const orderSchema = new Schema({
  id: String,
  createDate: String,
  statusHistory: Array,
  products: Array,
  totalAmount: Number,
  client: Object
});

orderSchema.methods.changeStatus = function(status) {
  let currentDate = new Date();
  this.statusHistory.push({status, currentDate,});
};

orderSchema.pre('save', function(next) {
  let currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at) {
    this.statusHistory.push({
      status: 'NEW',
      changed_at: currentDate,
    });
    this.created_at = currentDate;
  }
  next();
});

module.exports = mongoose.model('order', orderSchema);
