
var debug       = require('debug')('Segmentio:Preact')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


module.exports = Preact;


function Preact () {
  this.name = 'Preact';
  this.baseUrl = 'https://api.preact.io/api/v2';
}


util.inherits(Preact, Integration);


/**
 * Decide whether the message is enabled.
 */

Preact.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


/**
 * Validate the message and settings
 */

Preact.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'projectCode') ||
         this._missingSetting(settings, 'apiSecret');
};


/**
 * Track an action in Preact
 */

Preact.prototype.track = function (track, settings, callback) {

  var properties = track.properties();
  properties.revenue = properties.revenue * 100;

  var payload = {
    person : {
      name        : track.identify().name(),
      uid         : track.userId() || track.sessionId(),
      email       : track.traits().email,
      properties  : track.traits(),
      created_at  : track.identify().created()
    },
    event : {
      name      : track.event(),
      revenue   : properties.revenue,
      timestamp : unixTime(track.timestamp()),
      extras    : properties,
      note      : track.properties().note
    },
  };

  var req = {
    url  : this.baseUrl + '/events',
    json : payload,
    headers: reqHeaders(settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};


function reqHeaders (settings) {
  var auth = settings.projectCode + ':' + settings.apiSecret;
  return {
    'Authorization' : 'Basic ' + new Buffer(auth).toString('base64')
  };
}
