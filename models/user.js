const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// User Schema
const userSchema = new Schema({
  name: {
    first: String,
    last: String
  },
  address: {
    recipient: String,
    street: String,
    city: String,
    post: String,
    country: {type: String, default: 'PL'}
  },
  email: String,
  language: {type: String, default: 'pl'},
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'order'
  }]
});

module.exports = mongoose.model('user', userSchema);
