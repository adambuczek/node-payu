const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// User Schema
const userSchema = new Schema({
  name: {
    first: String,
    last: String
  },
  address: {
    street: String,
    city: String,
    post: String
  },
  email: String,
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'order'
  }]
});

module.exports = mongoose.model('user', userSchema);
