var debug    = require('debug')('Segmentio:Librato')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , unixTime = require('unix-time')
  , util     = require('util');


module.exports = Librato;


function Librato () {
  this.name = 'Librato';
  this.baseUrl = 'https://metrics-api.librato.com/v1';
}


util.inherits(Librato, Provider);


/**
 * Check whether Librato is enabled. Since librato comes through us for both
 * server and client, just make sure it isn't _disabled_.
 */

Librato.prototype.enabled = function (message, settings) {
  return Provider.enabled.call(this, message, settings);
};


/**
 * Validate that the proper settings do exist.
 */

Librato.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'email') ||
         this._missingSetting(settings, 'token');
};


/**
 * Send event data to Librato
 * http://dev.librato.com/v1/post/metrics
 */

Librato.prototype.track = function (track, settings, callback) {

  var options = track.options(this.name);

  // Events may only consist of these characters and be no more than 255 chars
  var event = track.event().replace(/[^A-Za-z0-9._-]/gi, '-').substring(0, 255);

  var payload = {
    name         : event,
    value        : track.proxy('properties.value') || 1,
    measure_time : unixTime(track.timestamp()),
    source       : options.source || event
  };

  var req = {
    url     : this.baseUrl + '/metrics',
    json    : { gauges : [payload] },
    headers : headers(settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Add librato auth header
 * http://dev.librato.com/v1/metrics-authentication
 */

function headers (settings) {
  var authString = new Buffer(settings.email + ':' + settings.token)
                        .toString('base64');
  return {
    'Authorization' : 'Basic ' + authString
  };
}