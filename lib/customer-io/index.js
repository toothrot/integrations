
var clone    = require('clone')
  , errors   = require('../errors')
  , is       = require('is')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = CustomerIO;


function CustomerIO () {
  this.name = 'Customer.io';
}


util.inherits(CustomerIO, Provider);


CustomerIO.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


CustomerIO.prototype.validate = function (message, settings) {
  return this._validateSetting(settings, 'siteId') ||
         this._validateSetting(settings, 'apiKey');
};


CustomerIO.prototype.identify = function (message, settings, callback) {

  var id     = message.userId() || message.sessionId()
    , traits = clone(message.traits() || {});

  if (message.created()) {
    traits.created_at = Math.floor(message.created().getTime() / 1000);
    delete traits.created;
  }

  var req = {
    url     : this._identifyUrl(id),
    json    : traits,
    headers : reqHeaders(settings)
  };

  request.put(req, this._handleResponse(callback));
};


CustomerIO.prototype.track = function (message, settings, callback) {

  var id         = message.userId() || message.sessionId()
    , properties = clone(message.properties() || {});

  var json = {
    name      : message.event(),
    data      : properties,
    timestamp : Math.floor(message.timestamp().getTime() / 1000)
  };

  var req = {
    url     : this._trackUrl(id),
    json    : json,
    headers : reqHeaders(settings)
  };

  request.post(req, this._handleResponse(callback));
};


CustomerIO.prototype._trackUrl = function (visitorId) {
  return 'https://app.customer.io/api/v1/customers/' + visitorId + '/events';
};


CustomerIO.prototype._identifyUrl = function (visitorId) {
  return 'https://app.customer.io/api/v1/customers/' + visitorId;
};



function reqHeaders (settings) {
  var auth = settings.siteId + ':' + settings.apiKey;
  return {
    'Authorization' : 'Basic ' + new Buffer(auth).toString('base64')
  };
}






