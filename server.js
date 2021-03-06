"use strict";

// Dependencies
const requestPromise = require('request-promise');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const YAML = require('yamljs');
const fs = require('fs');

// error handling
const EventEmitter = require('events');
const ErrorHandler = new EventEmitter();

ErrorHandler.on('error', (err) => {
  const errorLog = './.server.error.log';
  console.error(err);
  // fs.appendFile(errorLog  + "\n", err, (e) => {
  //   if (e) console.error(e);
  // });
});

// Express settings
const router = express.Router();
const port = process.env.PORT || 8080;
const app = express();

// Mongose settings
mongoose.Promise = global.Promise;
const mongoUri = 'mongodb://mongo:27017';
const mongooseOptions = {
  useMongoClient: true
};

// PayU settings
const settings = YAML.parse(fs.readFileSync('.settings.yml', 'utf8'));
const PayU = require('./payu.class.js');
let payu = new PayU(settings);

// Routes
// router.post('/', bodyParser.json(), async function(req, res) {});
router.get('/', async function(req, res) {

  try {

    const mockTicket = await require('./test/randomTicket.js')();

    const cart = mockTicket.cart;
    const address = mockTicket.address;
    const shippingMethod = mockTicket.shippingMethod;
    const user = mockTicket.user;

    const db = await mongoose.connect(mongoUri, mongooseOptions);
    const Product = require('./models/product.js');
    const Order = require('./models/order.js');
    const User = require('./models/user.js');
    const ShippingMethod = require('./models/shippingMethod.js');

    let order = new Order({
      client: user,
      deliveryaddress: address,
      shippingMethod,
      products: cart
    }); // Prepare an Order object

    // reference the order in user
    User.findById(user).exec((err, user) => {
      user.orders.unshift(order._id);
      user.save();
    });

    const products = cart;
    // const products = cart.map(async function(item) {
    //
    //   // Documents returned from queries with the lean option enabled are plain javascript objects
    //   const product = await Product.findById(item.id).lean();
    //
    //   order.products.push({ // populate an Order object with resolved shopping cart
    //     product: product._id,
    //     quantity: item.quantity
    //   });
    //
    //   return Object.assign({}, product, item);
    // });

    // Documents returned from queries with the lean option enabled are plain javascript objects
    // const shippingMethods = await ShippingMethod.find({}).lean(); // get all shiping methods

    // wait for order to save and retrieve it fully populated
    order.save().then(() => {
      Order.findById(order._id)
        .populate('shippingMethod')
        .populate('client')
        .populate({
          path: 'products.product',
          model: 'product'
        })
        .exec((err, order) => {
          if (err) throw new Error(err);
          payu.order({
            products: order.products.toObject(),
            customerIp: req.ip,
            extOrderId: order._id,
            client: order.client.toObject(),
            deliveryaddress: order.deliveryaddress,
            shippingMethod: order.shippingMethod.toObject(),
          }).then(response => {
            if (response.status.statusCode !== 'SUCCESS') console.error(response);
            order.changeStatus('CREATED').save().then(() => {
              res.send(`<a href="${response.redirectUri}">place order</a>`);
            });

          });
        });
    });

  } catch (e) {
    ErrorHandler.emit('error', e);
  }

});

// router.get('/random', async function(req, res) {
//   try {
//     const randomOrder = require('./randomOrder.js');
//     const order = await randomOrder();
//     res.json(order);
//   } catch (e) {
//     ErrorHandler.emit('error', e);
//   }
// });

// router.get('/products', async function(req, res) {
//   try {
//     let db = await mongoose.connect(mongoUri, mongooseOptions);
//     let products = await require('./models/product.js').find({});
//     res.json(products);
//   } catch (err) {
//     console.error(err);
//   }
// });
//
// router.get('/product/:id', async function(req, res) {
//   try {
//     let db = await mongoose.connect(mongoUri, mongooseOptions);
//     let product = await require('./models/product.js').findById(req.params.id);
//     res.json(product);
//   } catch (err) {
//     console.error(err);
//   }
// });
//
// router.get('/shippingMethods', async function(req, res) {
//   try {
//     let db = await mongoose.connect(mongoUri, mongooseOptions);
//     let shippingMethods = await require('./models/shippingMethod.js').find({});
//     res.json(shippingMethods);
//   } catch (err) {
//     console.error(err);
//   }
// });

router.get('/paymethods', function(req, res) {
  payu.paymethods().then((methods) => res.json(methods)).catch((e) => ErrorHandler.emit('error', e));
});

router.post('/notify', bodyParser.text({
  type: '*/*'
}), async function(req, res) {

  try {

    // body MUST be parsed as text
    const notification = payu.handleNotification(req.headers['openpayu-signature'], req.body);
    if (!notification) throw new Error('Wrong signature.');

    const status = notification.status;

    const db = await mongoose.connect(mongoUri, mongooseOptions);
    const Order = require('./models/order.js');
    const User = require('./models/user.js');

    const order = await Order.findById(notification.extOrderId);
    if (!order) throw new Error(`There is no such order.`);

    order.changeStatus(status).save();

    if (status === 'COMPLETED') {
      const user = new User(notification.user);
      user.orders.unshift(order._id);
      order.client = user._id;
      order.save();
      user.save();
    }

    res.status(200);

  } catch (e) {

    console.log(e);
    // ErrorHandler.emit('error', e);

  }


});

app.use('/', router);
app.listen(port);

console.log('Server started on port ' + port);
