const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Order Schema
const orderSchema = new Schema({
  created_at: Date,
  updated_at: Date,
  statusHistory: [{
    status: String,
    changed: Date
  }],
  products: [{
    quantity: Number,
    product: {
      type: Schema.Types.ObjectId,
      ref: 'product'
    }
  }],
  client: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  shippingMethod: {
    type: Schema.Types.ObjectId,
    ref: 'shippingMethod'
  },
  deliveryaddress: {
    recipient: String,
    street: String,
    city: String,
    post: String,
    country: {type: String, default: 'PL'}
  },
});

orderSchema.methods.changeStatus = function(status) {
  this.statusHistory.unshift({
    changed: new Date(),
    status,
  });
  return this;
};

orderSchema.pre('save', function(next) {
  let currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at) {
    this.statusHistory.unshift({status: 'NEW', changed: currentDate});
    this.created_at = currentDate;
  }
  next();
});

module.exports = mongoose.model('order', orderSchema);
