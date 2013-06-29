
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


CustomerIO.prototype.identify = function (identify, settings, callback) {

  var id     = identify.userId() || identify.sessionId()
    , traits = clone(identify.traits() || {});

  if (identify.created()) {
    traits.created_at = Math.floor(identify.created().getTime() / 1000);
    delete traits.created;
  }

  var req = {
    url     : this._identifyUrl(id),
    json    : traits,
    headers : reqHeaders(settings)
  };

  request.put(req, this._handleResponse(callback));
};


CustomerIO.prototype.track = function (track, settings, callback) {

  var id         = track.userId() || track.sessionId()
    , properties = clone(track.properties() || {});

  var json = {
    name      : track.event(),
    data      : properties,
    timestamp : Math.floor(track.timestamp().getTime() / 1000)
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






