"use strict";

// Dependencies
const requestPromise = require('request-promise');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const YAML = require('yamljs');
const fs = require('fs');

// Express settings
const router = express.Router();
const port = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.json());

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
router.get('/', async function(req, res) {

  /**
  * This is how the object send from the frontend should be structured.
  * @type {Array}
  */
  const mockOrder = [
    {id: 'ld', quantity: 2,},
    {id: 'lp', quantity: 1,},
    {id: 'sd', quantity: 2,},
    {id: 'sp', quantity: 3,},
  ];

  try {

    const order = mockOrder;

    const db = await mongoose.connect(mongoUri, mongooseOptions);
    const Product = require('./models/product.js');
    const ShippingMethod = require('./models/shippingMethod.js');

    const products = order.map(async function(product) {
      // Documents returned from queries with the lean option enabled are plain javascript objects
      const resolvedProduct = await Product.findOne({id: product.id}).lean();
      return Object.assign({}, resolvedProduct, product);
    });
    // Documents returned from queries with the lean option enabled are plain javascript objects
    const shippingMethods = await ShippingMethod.find({}).lean(); // get all shiping methods

    Promise.all(products).then((products) => {
      const totalAmount = products.reduce((acc, cur) => acc += cur.unitPrice * cur.quantity, 0);

      payu.order(products, totalAmount, shippingMethods, req.ip).then(response => {
        // TODO: add exponential falloff retry if the server returns 4xx status
        // TODO: add error loging with notification system
        if (response.statusCode !== 'SUCCESS') console.error(response);
        res.send(`<a href="${response.redirectUri}">place order</a>`);
      });

    });


  } catch (err) {
    console.error(err);
  }

});

router.get('/products', async function(req, res) {
  try {
    let db = await mongoose.connect(mongoUri, mongooseOptions);
    let products = await require('./models/product.js').find({});
    res.json(products);
  } catch (err) {
    console.error(err);
  }
});

router.get('/product/:id', async function(req, res) {
  try {
    let db = await mongoose.connect(mongoUri, mongooseOptions);
    let product = await require('./models/product.js').findById(req.params.id);
    res.json(product);
  } catch (err) {
    console.error(err);
  }
});

router.get('/shippingMethods', async function(req, res) {
  try {
    let db = await mongoose.connect(mongoUri, mongooseOptions);
    let shippingMethods = await require('./models/shippingMethod.js').find({});
    res.json(shippingMethods);
  } catch (err) {
    console.error(err);
  }
});

/*
 * Next steps
 *    1. add front end cart - this way i can finish the order state change handling on the dev server with notofication url open
 *    OR 2. fing a way to tunnel requests from dev.adambuczek.com into here
 *
 */

router.post('/order', async function(req, res) {
  try {
    let db = await mongoose.connect(mongoUri, mongooseOptions);
    let order = await new require('./models/order.js')(req.body).save();
  } catch (err) {
    console.error(err);
  }
});

router.get('/orders', async function(req, res) {
  try {
    let db = await mongoose.connect(mongoUri, mongooseOptions);
    let orders = await require('./models/order.js').find({});
    res.json(orders);
  } catch (err) {
    console.error(err);
  }
});

router.get('/paymethods', function(req, res) {
  payu.paymethods().then((methods) => res.json(methods)).catch((err) => console.error(err));
});

router.post('/notify', function(req, res) {
  console.log('notify: ');
  console.log(req.body);
  res.status(200);
});

app.use('/', router);
app.listen(port);

console.log('Server started on port ' + port);
