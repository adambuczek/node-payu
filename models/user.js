const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// User Schema
const userSchema = new Schema({
  name: {
    first: String,
    last: String
  },
  email: String,
  language: {type: String, default: 'pl'},
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'order'
  }],
  verified: {type: Boolean, default: false},
});

module.exports = mongoose.model('user', userSchema);
