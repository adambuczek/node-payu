"use strict";

const requestPromise = require('request-promise');
const request = require('request');
const md5 = require('md5');
const fs = require('fs');

const EventEmitter = require('events');
const ErrorHandler = new EventEmitter();

ErrorHandler.on('error', (err) => {
  const errorLog = '.payu.error.log';
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
    auth = (fs.existsSync(cacheLocation)) ? JSON.parse(fs.readFileSync(cacheLocation, 'utf8')) : false;
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
        if (err) throw new (err)
      });
    }
    return auth.access_token;
  } catch (e) {
    ErrorHandler.emit('error', e);
  }
};

PayU.prototype.verifyNotification = function(header, body) {
  const incoming = header.split(';').reduce((a, c) => {
    let tmp = c.split('=');
    a[tmp[0]] = tmp[1];
    return a;
  }, {});
  if (incoming.algorithm !== 'MD5') throw new (`Unsupported hashing algorithm: ${incoming.algorithm}`);
  if (incoming.signature === md5(body + this.signatureKey)) return true;
  return false;
}

/**
 * Handle PayU notification
 * @param  Object notification PayU notification Object
 * @return Object              An object with status and a possible client info.
 */
PayU.prototype.handleNotification = function(header, body) {
    if (this.verifyNotification(header, body)) {
        const notification = JSON.parse(body);
        const status = notification.order.status;
        // switch (status) {
        //   case 'NEW':
        //     break;
        //   case 'PENDING':
        //     break;
        //   case 'WAITING_FOR_CONFIRMATION':
        //     break;
        //   case 'COMPLETED':
        //     break;
        //   case 'CANCELED':
        //     break;
        //   case 'REJECTED':
        //     break;
        //   default:
        // }
        if (status === 'COMPLETED') {
          return {
            shippingMethod: notification.order.shippingMethod,
            extOrderId: notification.order.extOrderId,
            user: {
              name: {
                first: notification.order.buyer.firstName,
                last: notification.order.buyer.lastName,
              },
              address: {
                recipient: notification.order.buyer.delivery.recipientName,
                country: notification.order.buyer.delivery.countryCode,
                post: notification.order.buyer.delivery.postalCode,
                street: notification.order.buyer.delivery.street,
                city: notification.order.buyer.delivery.city,
              },
              language: notification.order.language,
              email: notification.order.email,
            },
            status,
          }
        }
        return {
          extOrderId: notification.order.extOrderId,
          status,
        }
      }
      return false;
    }

    PayU.prototype.paymethods = async function() {
      const auth = await this.authorize();
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

    PayU.prototype.order = async function(order) {
      const auth = await this.authorize();

      const url = '/api/v2_1/orders/';

      const headers = {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      };

      try {

        let response = JSON.parse(await requestPromise({
          method: 'POST',
          url: this.baseUrl + url,
          headers: headers,
          body: JSON.stringify({
            products: order.products,
            description: this.posDesc,
            merchantPosId: this.posId,
            notifyUrl: this.notifyUrl,
            extOrderId: order.extOrderId,
            customerIp: order.customerIp,
            continueUrl: this.continueUrl,
            currencyCode: this.posCurrency,
            totalAmount: order.totalAmount,
            shippingMethods: order.shippingMethods,
          }),
          simple: false,
        }));

        return response;

      } catch (e) {
        ErrorHandler.emit('error', e);
      }
    };

    module.exports = PayU;
