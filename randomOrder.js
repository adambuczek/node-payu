const randomOrder = async function() {

  const db = await require('mongoose').connect('mongodb://mongo:27017', {useMongoClient: true});
  const products = await require('./models/product.js').find({}).lean();

  return products.map(product => {
    return {
      id: product._id,
      quantity: Math.floor(Math.random() * 5)
    }
  }).filter(p => p.quantity > 0);

};

module.exports = randomOrder;
