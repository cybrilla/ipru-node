var utils = require('./utils/utils')
var getPem = require('./utils/rs_to_pem');




//axios.defaults.headers.common['Content-Type'] = 'application/json';


/**
 * The core client.
 *
 * @param {{
 *  baseUrl: string,
 *  publicKeyXml: string,
 *  consumerKey: string,
 *  consumerSecret: string,
 * }} options
 * @constructor
 */
function IprudClient(options) {
  utils.enforceParams(options, ['baseUrl', 'publicKeyXml','consumerKey','consumerSecret']);
  var parsedObject;
  utils.parseXml(options.publicKeyXml, function(parsedData){
    parsedObject = parsedData;
  });
  this._baseUrl = options.baseUrl;
  this._publicKeyXml = options.publicKeyXml;
  this._consumerKey = options.consumerKey;
  this._consumerSecret = options.consumerSecret;
  this._modulus =  parsedObject.RSAKeyValue.Modulus[0];
  this._exponent =  parsedObject.RSAKeyValue.Exponent[0];
  // TODO assert certificate generated is valid
  this._pem =  getPem( this._modulus,  this._exponent);
  this._intialized = true;
  return this;
}

/**
 * Check IMPS Redemption Allowed Status (Instant Withdraw)
 * This service is used to check whether IMPS redemption transaction is allowed or not allowed for selected folio with selected scheme.
 *
 * @param {{
 *  FolioNo: string,
 *  Scheme_Code: string,
 *  RedeemAmount: Number,
 *  Source: string,
 * }} options
 * @constructor
 */
IprudClient.prototype.checkIMPSAllowed =  function(params){
  var that = this;
  var request_data = {
    url: that._baseUrl + "/JSON/CheckIMPSAllowed?",
    method: 'POST',
    data: params
  };
  return new Promise(function(resolve, reject) {
    try {
      utils.enforceParams(params, ['FolioNo', 'Scheme_Code','RedeemAmount','Source']);
      request_data.data = that.makeRequest(request_data).then((response)=>{
        resolve(response);
      }).catch(function(error){
        return reject(error);
      });
    } catch (err) {
      console.log("error",err);
      reject(err);
      return;
    }
  });  
}
IprudClient.prototype.makeRequest = utils.makeRequest


module.exports = IprudClient