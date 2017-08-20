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
  posDesc: "Jakiwół - ręcznie robiony na twoje zamówienie",
  posCurrency: "PLN",
  clientId: 302060,
  clientSecret: 'db40979e497def5477a72128d3ecf696',
  signatureKey: 'b77aa26adb1fe6743b4fe1274b36e007',
  environment: 'sandbox',
  notifyUrl: 'http://192.168.99.100:8080/notify',
  continueUrl: 'http://192.168.99.100:8080',
};

let payu = new PayU(settings);

// mongoose.connect('mongodb://mongo:27017');

router.get('/', async function(req, res) {

  let response = await requestPromise({
    method: 'GET',
    url: 'http://192.168.99.100:8080/order',
    simple: false,
  });

  const url = JSON.parse(response).redirectUri;

  res.send(`<a href="${url}">place order</a>`);

});

router.get('/paymethods', function(req, res) {
  payu.paymethods().then((methods) => res.json(methods)).catch((err) => console.error(err));
});

router.get('/order', function(req, res) {
  payu.order(req).then((link) => res.json(link)).catch((err) => console.error(err));
});

router.post('/notify', function(req, res) {
  console.log('notify: ' + req);
});

app.use('/', router);
app.listen(port);

console.log('Server started on port ' + port);
