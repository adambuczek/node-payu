"use strict";

const express = require('express');
const requestPromise = require('request-promise');
// const mongoose = require('mongoose');

const PayU = require('./payu.class.js');

const router = express.Router();
const app = express();

const port = process.env.PORT || 8080;

const settings = {
  posId: 302060,
  clientId: 302060,
  clientSecret: 'db40979e497def5477a72128d3ecf696',
  signatureKey: 'b77aa26adb1fe6743b4fe1274b36e007',
  environment: 'sandbox',
};

let payu = new PayU(settings);

// mongoose.connect('mongodb://mongo:27017');

router.get('/', function(req, res) {});

router.get('/paymethods', function(req, res) {
  payu.paymethods().then((methods) => res.json(methods));
});

app.use('/', router);
app.listen(port);

console.log('Magic happens on port ' + port);
