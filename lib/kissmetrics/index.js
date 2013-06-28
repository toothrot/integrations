
var debug    = require('debug')('Segmentio-Kissmetrics')
  , extend   = require('extend')
  , is       = require('is')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = KISSmetrics;


function KISSmetrics () {
  this.name    = 'KISSmetrics';
  this.baseUrl = 'https://trk.kissmetrics.com';
}


util.inherits(KISSmetrics, Provider);


KISSmetrics.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


KISSmetrics.prototype.validate = function (message, settings) {
  return this._validateSetting(settings, 'apiKey');
};


/**
 * Identify a user
 * http://support.kissmetrics.com/apis/specifications.html
 */

KISSmetrics.prototype.identify = function (message, settings, callback) {

  var payload = formatProperties(message.traits() || {});
  extend(payload, {
    _k : settings.apiKey,
    _p : message.userId() || message.sessionId(),
    _t : formatTimestamp(message.timestamp()),
    _d : 1
  });

  var req = {
    url : this.baseUrl + '/s',
    qs  : payload
  };

  debug('making identify request...');

  request.get(req, this._handleResponse(callback));
};


/**
 * Track an event:
 * http://support.kissmetrics.com/apis/specifications.html
 * http://support.kissmetrics.com/advanced/importing-data
 */

KISSmetrics.prototype.track = function (message, settings, callback) {

  var payload = formatProperties(message.properties() || {});
  extend(payload, {
    _k : settings.apiKey,
    _p : message.userId() || message.sessionId(),
    _t : formatTimestamp(message.timestamp()),
    _n : message.event(),
    _d : 1
  });

  if (message.revenue()) payload['Billing Amount'] = message.revenue();

  var req = {
    url : this.baseUrl + '/e',
    qs  : payload
  };

  debug('making track request');

  request.get(req, this._handleResponse(callback));
};


/**
 * Alias a user
 * http://support.kissmetrics.com/apis/specifications.html
 */

KISSmetrics.prototype.alias = function (message, settings, callback) {

  var payload = {
    _k : settings.apiKey,
    _p : message.from(),
    _n : message.to()
  };

  var req = {
    url : this.baseUrl + '/a',
    qs  : payload
  };

  debug('making alias request');

  request.get(req, this._handleResponse(callback));
};


/**
 * Format a timestamp for kissmetrics
 * @param {Date} timestamp
 * @return {Number} seconds since the epoch
 */

function formatTimestamp (timestamp) {
  return Math.floor(timestamp.getTime() / 1000);
}


/**
 * Kissmetrics doesn't handle arrays and nested objects well, so fake their
 * function to filter those out.
 */

function formatProperties (properties) {
  var output = {};

  for (var key in properties) {
    var val = properties[key];

    // Transform dates and objects
    if (!isNaN(Date.parse(val))) output[key] = formatTimestamp(val);
    else if (val.toString() !== '[object Object]') output[key] = val.toString();
  }

  return output;
}