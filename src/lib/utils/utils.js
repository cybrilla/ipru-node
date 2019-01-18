var util = require('util')
var parseString = require('xml2js').parseString;
const request = require('request');
const qs = require('querystring')
var crypto = require('crypto');
var oauthSignature = require("oauth-signature");
const constants = require('constants');
const padding = constants.RSA_PKCS1_PADDING;



var DEFAULT_ERROR_CODE = -1

/**
 * An error with a code.
 *
 * @param {string} message
 * @param {number} code
 * @constructor
 */
function IprudError(message, code) {
  this.message = message
  this.code = code
}
util.inherits(IprudError, Error)


var utils = module.exports = {
  enforceParams: function (options, requiredKeys) {
    if (!options) {
      throw new IprudError('Parameters for this call are undefined', DEFAULT_ERROR_CODE)
    }
    requiredKeys.forEach(function (requiredKey) {
      if (!(options.hasOwnProperty(requiredKey))) throw new IprudError('Missing required parameter "' + requiredKey + '"', DEFAULT_ERROR_CODE)
    })
  },
  parseXml: function(xml_string, callback){
    parseString(xml_string, function (err, result) {
      if(err){
        throw new IprudError('publicKeyXml parse error! ', DEFAULT_ERROR_CODE)
      }else{
        if(!(result.hasOwnProperty("RSAKeyValue"))) throw new IprudError('Invalid Public Key XML', DEFAULT_ERROR_CODE)
        if(!(result.RSAKeyValue.hasOwnProperty("Modulus"))) throw new IprudError('Invalid Public Key XML', DEFAULT_ERROR_CODE)
        callback(result);
      }
    });
  },
  encryptParams : function(options, pem){
    var params = {};
    for (var prop in options) {
        var buffer = new Buffer(options[prop].toString());
        var encrypted = crypto.publicEncrypt({ key: pem, padding: padding  }, buffer);
        params[prop] = encrypted.toString("base64")
    }
    return params;
  },
  makeRequest : function(request_data){
    var that = this;
    utils.enforceParams(request_data, ['url', 'method','data']);
    return new Promise(function(resolve, reject) {
      try {
        request_data.data = utils.encryptParams(request_data.data, that._pem);
        var urlParams = {};
        urlParams["oauth_consumer_key"] = that._consumerKey;
        urlParams["oauth_nonce"] =  (Math.floor(Math.random() * (9999999 - 123400) + 123400)).toString();
        // Todo - Enduser should be able to pass this as argument.
        urlParams["oauth_timestamp"] = (Date.now()).toString();
        urlParams["oauth_signature_method"] = 'HMAC-SHA1';
        urlParams["oauth_version"] = '1.0';
        
        //Generate Oauth Signature
        var signature = oauthSignature.generate(
          request_data.method,
          request_data.url, 
          urlParams, 
          that._consumerSecret,
          "",
          { encodeSignature: false}
          )
        urlParams["oauth_signature"]  = signature;
        request({
          url: request_data.url,
          method: "POST",
          json: true,
          qs: urlParams,
          body: request_data.data
        }, function(error, response, body) {
          // Todo - Need to handle errors in a standardized way
            if(error){
              reject(error);
            }else{
              const res_data = qs.parse(body);
              resolve({response:response,body: body})
            }
            return;
        });        
      } catch (err) {
        // Todo - Need to handle errors in a standardized way
        reject(err);
        return;
      }
    });
  },
  iprudError: IprudError
}  