const randomTicket = async function() {

  const cart = await require('./randomCart.js')();
  const user = await require('./randomUser.js')();

return {
    cart,
    shippingMethod: '59a2cae4140889000ac408de',
    user: user._id,
    address: user.address
  }

};

module.exports = randomTicket;
