"use strict";

const express = require('express');
const requestPromise = require('request-promise');
const YAML = require('yamljs');
const fs = require('fs');
// const mongoose = require('mongoose');

const PayU = require('./payu.class.js');

const router = express.Router();
const app = express();

const port = process.env.PORT || 8080;

const settings = YAML.parse(fs.readFileSync('.settings.yml', 'utf8'));

let payu = new PayU(settings);

// mongoose.connect('mongodb://mongo:27017');

router.get('/', function(req, res) {

  payu.order(req).then((response) => {
    const url = response.redirectUri;
    res.send(`<a href="${url}">place order</a>`);
  }).catch((err) => console.error(err));

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
