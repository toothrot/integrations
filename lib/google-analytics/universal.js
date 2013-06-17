
var errors  = require('../errors')
  , is      = require('is')
  , request = require('request-retry')({ retries : 2 })
  , util    = require('util');


function GAUniversal () {
  this.name = 'Google Analytics';
  this.url  = 'https://ssl.google-analytics.com/collect';
}


GAUniversal.prototype.enabled = function (message, settings) {
  return message.channel === 'enabled';
};


GAUniversal.prototype.validate = function(message, settings) {
  var trackingId = setting.serversideTrackingId;

  if (is.string(trackingId) && !is.empty(trackingId)) return;

  var msg = util.format("%s requires setting 'trackingId'", this.name)
    , err = new errors.ValidateSettings(msg);

  return err;
};


GAUniversal.prototype.identify = function (message, settings, callback) {
  process.nextTick(callback);
};


GAUniversal.prototype.track = function (message, settings, callback) {

  var req = {
    url     : this.url,
    form    : this._createForm(message, settings),
    headers : this._headers(message, settings)
  };

  request.post(req, function (err, res, body) {
    if (err) return callback(err, body);
    if (res.statusCode === 200) return callback(err, body);

    err = new errors.BadRequest('Failed Google Analytics request',
                                 res.statusCode,
                                 body);
    return callback(err, body);
  });
};


/**
 * Adds the required parameters to the GA analytics request, per
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 * @param  {Object} message
 * @param  {Object} settings
 * @return {Object} form
 */
GAUniversal.prototype._createForm = function (message, settings) {

  var properties = message.properties
    , visitorId  = message.userId || message.sessionId
    , cid        = hash(visitorId);

  // If they set the clientId explicitly in the context
  if (message.context && message.context[this.name]) {
    var clientId = message.context[this.name].clientId;
    if (typeof clientId === 'string') cid = clientId;
  }

  return {
    v   : 1,
    tid : settings.serversideTrackingId,
    cid : cid,
    t   : 'event',
    ec  : properties.category || 'All',
    ea  : message.event,
    el  : properties.label    || 'event',
    ev  : properties.value    || 1
  };
};


GAUniversal.prototype._headers = function (message, settings) {
  var userAgent = 'not set';

  if (message.context && message.context.userAgent) {
    userAgent = message.context.userAgent.userAgent;
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
    , max = Math.pow(2, 32);

  for (var i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
    sum *= 31;
    sum %= max;
  }
  return sum;
}