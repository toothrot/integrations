
var debug       = require('debug')('Segmentio:KISSmetrics')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


module.exports = KISSmetrics;


function KISSmetrics () {
  this.name    = 'KISSmetrics';
  this.baseUrl = 'https://trk.kissmetrics.com';
}


util.inherits(KISSmetrics, Integration);


KISSmetrics.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


KISSmetrics.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey');
};


/**
 * Identify a user
 * http://support.kissmetrics.com/apis/specifications.html
 */

KISSmetrics.prototype.identify = function (identify, settings, callback) {

  var payload = formatProperties(identify.traits() || {});
  extend(payload, {
    _k : settings.apiKey,
    _p : identify.userId() || identify.sessionId(),
    _t : unixTime(identify.timestamp()),
    _d : 1
  });

  var req = {
    url : this.baseUrl + '/s',
    qs  : payload
  };

  debug('making identify request');
  request.get(req, this._handleResponse(callback));
};


/**
 * Track an event:
 * http://support.kissmetrics.com/apis/specifications.html
 * http://support.kissmetrics.com/advanced/importing-data
 */

KISSmetrics.prototype.track = function (track, settings, callback) {

  var payload = formatProperties(track.properties() || {});
  extend(payload, {
    _k : settings.apiKey,
    _p : track.userId() || track.sessionId(),
    _t : unixTime(track.timestamp()),
    _n : track.event(),
    _d : 1
  });

  if (track.revenue()) payload['Billing Amount'] = track.revenue();

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

KISSmetrics.prototype.alias = function (alias, settings, callback) {

  var payload = {
    _k : settings.apiKey,
    _p : alias.from(),
    _n : alias.to()
  };

  var req = {
    url : this.baseUrl + '/a',
    qs  : payload
  };

  debug('making alias request');
  request.get(req, this._handleResponse(callback));
};



/**
 * Kissmetrics doesn't handle arrays and nested objects well, so fake their
 * function to filter those out.
 */

function formatProperties (properties) {
  var output = {};

  Object.keys(properties).forEach(function (key) {
    var val = properties[key];
    if (val === null || val === undefined) return;

    // Transform dates and objects
    if (!isNaN(Date.parse(val))) output[key] = unixTime(val);
    else if (val.toString() !== '[object Object]') output[key] = val.toString();
  });

  return output;
}