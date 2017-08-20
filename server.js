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
router.get('/', function(req, res) {
  payu.order(req).then((response) => {
    const url = response.redirectUri;
    res.send(`<a href="${url}">place order</a>`);
  }).catch((err) => console.error(err));
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

router.get('/shippingMethods', async function(req, res) {
  try {
    let db = await mongoose.connect(mongoUri, mongooseOptions);
    let shippingMethods = await require('./models/shippingMethod.js').find({});
    res.json(shippingMethods);
  } catch (err) {
    console.error(err);
  }
});

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
  res.json(req.body);
});

app.use('/', router);
app.listen(port);

console.log('Server started on port ' + port);
