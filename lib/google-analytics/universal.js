
var debug    = require('debug')('Segmentio:Google Analytics Universal')
  , errors   = require('../errors')
  , is       = require('is')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = GAUniversal;


function GAUniversal () {
  Provider.call(this);
  this.name = 'Google Analytics';
  this.url  = 'https://ssl.google-analytics.com/collect';
}


util.inherits(GAUniversal, Provider);


GAUniversal.prototype.track = function (message, settings, callback) {

  var req = {
    url     : this.url,
    form    : this._createForm(message, settings),
    headers : this._headers(message, settings)
  };

  request.post(req, this._handleResponse(callback));
};


/**
 * Adds the required parameters to the GA analytics request, per
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 * @param  {Object} message
 * @param  {Object} settings
 * @return {Object} form
 */
GAUniversal.prototype._createForm = function (message, settings) {

  var properties = message.properties()
    , visitorId  = message.userId() || message.sessionId()
    , cid        = hash(visitorId)
    , options    = message.options(this.name);

  // If they set the clientId explicitly in the context
  if (options) {
    var clientId = options.clientId;
    if (is.string(clientId)) cid = clientId;
  }

  return {
    v   : 1,
    tid : settings.serversideTrackingId,
    cid : cid,
    t   : 'event',
    ec  : properties.category || 'All',
    ea  : message.event(),
    el  : properties.label    || 'event',
    ev  : properties.value    || 1
  };
};


GAUniversal.prototype._headers = function (message, settings) {
  var userAgent = 'not set'
    , options   = message.options();

  if (options && options.userAgent) {
    userAgent = options.userAgent.userAgent;
  }

  return {
    'User-Agent' : userAgent
  };
};


/**
 * Returns a simple hashcode from the string.
 */
function hash (str) {
  var sum = 17
    , max = Math.pow(2, 31);

  for (var i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
    sum *= 31;
    sum %= max;
  }
  return sum;
}