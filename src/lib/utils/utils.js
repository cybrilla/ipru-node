var util = require('util')
var parseString = require('xml2js').parseString;
const request = require('request');
const qs = require('querystring')

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
  encryptParams : function(options, crt){
    var params = {};
    for (var prop in options) {
      params[prop] = crt.encrypt(options[prop].toString, 'utf8','base64');
    }
    return params;
  },
  makeRequest : function(request_data){
    var that = this;
    utils.enforceParams(request_data, ['url', 'method','data']);
    return new Promise(function(resolve, reject) {
      try {
        request_data.data = utils.encryptParams(request_data.data, that._crt);
        var requestParams =  that._oauth.authorize(request_data);
        var url_params = {};
        url_params["oauth_consumer_key"] = requestParams.oauth_consumer_key;
        delete requestParams["oauth_consumer_key"];  
        url_params["oauth_signature_method"] = requestParams.oauth_signature_method;
        delete requestParams["oauth_signature_method"];  
        url_params["oauth_timestamp"] = requestParams.oauth_timestamp;
        delete requestParams["oauth_timestamp"];  
        url_params["oauth_version"] = requestParams.oauth_version;
        delete requestParams["oauth_version"];  
        url_params["oauth_signature"] = requestParams.oauth_signature;
        delete requestParams["oauth_signature"];  
        var urlp =  Object.keys(url_params).map(function(key) {
          return key + '=' + url_params[key];
        }).join('&');
        console.log(request_data.url+ urlp);
        //oauth:{consumer_key: that._consumerKey, consumer_secret:  that._consumerSecret}
        request({
          url: request_data.url+ urlp,
          method: "POST",
          json: true,
          body: requestParams, 
        }, function(error, response, body) {
          const res_data = qs.parse(body)
            console.log("Successs---",response.statusCode,res_data, error);
            if(error){
              console.log("Failure---",error);
              reject(error);
              return;
            }else{
              resolve({response:response,body: body})
            }
        });        
      } catch (err) {
        console.log("error",err);
        reject(err);
        return;
      }

  
      // axios.post(request_data.url+ urlp, requestParams)
      // .then(function (response) {
      //   resolve(response)
      // })
      // .catch(function (error) {
      //   reject(error);
      // });
    });
  },
  iprudError: IprudError
}  