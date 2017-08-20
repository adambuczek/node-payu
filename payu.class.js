"use strict";

const requestPromise = require('request-promise');
const request = require('request');
const fs = require('fs');

const EventEmitter = require('events');
const ErrorHandler = new EventEmitter();

ErrorHandler.on('error', (err) => {
  const errorLog = '.error.log';
  fs.appendFile(errorLog, err, (e) => {
    if (e) console.error(e);
  });
});

// make promise version of fs.readFile()
// fs.readFileAsync = function(filename) {
//     return new Promise(function(resolve, reject) {
//         fs.readFile(filename, function(err, data){
//             if (err)
//                 reject(err);
//             else
//                 resolve(data);
//         });
//     });
// };

const PayU = function(settings) {

  this.clientId = settings.clientId;
  this.clientSecret = settings.clientSecret;

  this.posId = settings.posId;
  this.posDesc = settings.posDesc;
  this.posCurrency = settings.posCurrency;

  this.signatureKey = settings.signatureKey;

  this.notifyUrl = settings.notifyUrl;
  this.continueUrl = settings.continueUrl;

  this.baseUrl = (settings.environment === 'secure') ? 'https://secure.payu.com' : 'https://secure.snd.payu.com';
  this.hash = (settings.hash) ? settings.hash : 'MD5';

  if (settings.trustedMerchant) {
    this.grantType = 'trusted_merchant';
    this.oauthEmail = settings.trustedMerchant.email;
    this.oauthExtCustomerId = settings.trustedMerchant.extCustomerId;
  } else {
    this.grantType = 'client_credentials';
  }

};

PayU.prototype.authorize = async function() {
  let now = Math.floor(Date.now() / 1000), //Get the current date in ms, convert to s and floor
    cacheLocation = '.cache',
    auth;
  try {
    auth = (fs.existsSync()) ? JSON.parse(fs.readFileSync(cacheLocation, 'utf8')) : false;
    if (!auth || now >= auth.expires_at) {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      const url = '/pl/standard/user/oauth/authorize';
      let response = await requestPromise({
        method: 'POST',
        url: this.baseUrl + url,
        headers: headers,
        body: `grant_type=client_credentials&client_id=${ this.clientId }&client_secret=${ this.clientSecret }`
      });
      auth = JSON.parse(response);
      auth.expires_at = now + auth.expires_in;
      fs.writeFile(cacheLocation, JSON.stringify(auth), (err) => {
        if (err) throw new Exception(err)
      });
    }
    return auth.access_token;
  } catch (e) {
    ErrorHandler.emit('error', e);
  }
};

PayU.prototype.paymethods = async function() {
  let auth = await this.authorize();
  const url = '/api/v2_1/paymethods/';
  const headers = {
    'Authorization': `Bearer ${auth}`
  };
  try {
    let response = await requestPromise({
      method: 'GET',
      url: this.baseUrl + url,
      headers: headers
    });
    return JSON.parse(response);
  } catch (e) {
    ErrorHandler.emit('error', e);
  }
};

PayU.prototype.order = async function(req) {
  /**
  * products come as {id,quantity} and must be resolved against a db to
  * {name, unitPrice, quantity} before the order is created
  * ResolveProducts(order, collection)
  * 1. connect to db.then and save all Products into a collection
  * 2. match products in order with products from db by id
  * 3. populate products in order with fields from database
  */
  const auth = await this.authorize();
  const allProducts = JSON.parse(await requestPromise({
    method: 'GET',
    url: 'http://192.168.99.100:8080/products'
  }));
  const orderedProducts = [{
    id: 'ld', quantity: 2,
  },{            
    id: 'lp', quantity: 1,
  },{            
    id: 'sd', quantity: 2,
  },{            
    id: 'sp', quantity: 23,
  }];
  // knowing that ids are unique i can use first element of filtered array
  const products = orderedProducts.map(product => Object.assign({}, allProducts.filter(p => product.id === p.id)[0], product));
  const totalAmount = products.reduce((acc, curr) => acc += curr.unitPrice * curr.quantity, 0);

  const url = '/api/v2_1/orders/';

  const headers = {
    'Authorization': `Bearer ${auth}`,
    'Content-Type': 'application/json'
  };

  const buyer = {        
    email: "john.doe@example.com",
    phone: "654111654",
    firstName: "John",
    lastName: "Doe",
    language: "en"    
  };

  const order = {
    notifyUrl: this.notifyUrl,
    continueUrl: this.continueUrl,
    customerIp: req.ip, // change this when behind the reverse proxy
    merchantPosId: this.posId,
    description: this.posDesc,
    currencyCode: this.posCurrency,
    totalAmount,
    products,
    buyer,
  };

  console.log(order);

  try {

    let response = await requestPromise({
      method: 'POST',
      url: this.baseUrl + url,
      headers: headers,
      body: JSON.stringify(order),
      simple: false,
    });

    return JSON.parse(response);

  } catch (e) {
    ErrorHandler.emit('error', e);
  }
};

module.exports = PayU;
