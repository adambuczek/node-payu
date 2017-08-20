"use strict";

const requestPromise = require('request-promise');
const request = require('request');
const fs = require('fs');

// make promise version of fs.readFile()
fs.readFileAsync = function(filename) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, function(err, data){
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
};

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
        auth;
    try {
      auth = (fs.existsSync()) ? JSON.parse(fs.readFileSync(cacheLocation)) : false;
      if (!auth || now >= auth.expires_at) {
        let response = await requestPromise({
          method: 'POST',
          url: this.baseUrl + url,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: `grant_type=client_credentials&client_id=${ this.clientId }&client_secret=${ this.clientSecret }`
        });
        auth = JSON.parse(response);
        auth.expires_at = now + auth.expires_in;
        fs.writeFile(cacheLocation, JSON.stringify(auth), (err) => {if (err) throw new Exception(err)});
      }
      return auth.access_token;
    } catch (e) {
      console.error(e);
    }

};

PayU.prototype.paymethods = async function () {
  let auth = await this.authorize();
  const url = '/api/v2_1/paymethods/';
  const headers = {'Authorization': `Bearer ${auth}`};
  try {
    let response = await requestPromise({
      method: 'GET',
      url: this.baseUrl + url,
      headers: headers
    });
    return JSON.parse(response);
  } catch (e) {
    console.error(e);
  }
};

module.exports = PayU;
