"use strict";

const requestPromise = require('request-promise');
const request = require('request');
const fs = require('fs');

const PayU = function(settings) {

  this.clientId = settings.clientId;
  this.clientSecret = settings.clientSecret;

  this.posId = settings.posId;

  this.signatureKey = settings.signatureKey;

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

PayU.prototype.authorize = async function () {

    const url = '/pl/standard/user/oauth/authorize';
    let now = Math.floor(Date.now() / 1000), //Get the current date in ms, convert to s and floor
        cacheLocation = '.cache',
        authResponse = function() {
          return requestPromise({
            method: 'POST',
            url: this.baseUrl + url,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `grant_type=client_credentials&client_id=${ this.clientId }&client_secret=${ this.clientSecret }`
          });
        },
        auth;

    try {

      auth = JSON.parse(fs.readFileSync(cacheLocation));
      console.log(`read from file`);

      if (now >= auth.expires_at) {
        let response = await authResponse();
        auth = JSON.parse(response);
        auth.expires_at = now + auth.expires_in;
        fs.writeFile(cacheLocation, JSON.stringify(auth), (err) => {if (err) throw new Exception(err)});
        console.log(`refresh cache`);
        console.log(auth);

      } else {
        console.log(`from cache`);
        console.log(auth);
      }

      return auth.access_token;

    } catch (e) {
      console.error(e);
    }

};

module.exports = PayU;
