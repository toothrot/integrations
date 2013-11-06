
var debug       = require('debug')('segmentio:integrations:trak.io')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


module.exports = TrakIO;


function TrakIO () {
  this.name = 'Trak.io';
  this.baseUrl = 'https://api.trak.io/v1';
}


util.inherits(TrakIO, Integration);


/**
 * Check whether the integration is enabled
 */

TrakIO.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


/**
 * Validate the settings for the project
 */

TrakIO.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'token');
};


/**
 * Update a Trak.io user
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 */

TrakIO.prototype.identify = function (identify, settings, callback) {

  var id      = identify.userId() || identify.sessionId()
    , traits  = identify.traits();

  var payload = {
    data: {
      distinct_id: id, 
      properties: traits
    }
  };

  var req = {
    url     : this.baseUrl + '/identify',
    json    : payload,
    headers : reqHeaders(settings)
  };

  debug('making identify request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Track a Trak.io event
 * http://customer.io/docs/api/rest.html#section-Track_a_custom_event
 */

TrakIO.prototype.track = function (track, settings, callback) {

  var id      = track.userId() || track.sessionId()
    , traits  = track.traits();

  var payload = {
    data: {
      distinct_id : id,
      event       : track.event(),
      properties  : traits,
      time        : unixTime(track.timestamp())
    }
  };

  var req = {
    url     : this.baseUrl + '/track',
    json    : payload,
    headers : reqHeaders(settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};



/**
 * Alias a Trak.io user
 */

TrakIO.prototype.alias = function (alias, settings, callback) {

  var from  = alias.from()
    , to    = alias.to();

  var payload = {
    data: {
      distinct_id : from,
      alias       : to,
    }
  };

  var req = {
    url     : this.baseUrl + '/alias',
    json    : payload,
    headers : reqHeaders(settings)
  };

  debug('making alias request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Add the authentication to the headers.
 */

function reqHeaders (settings) {
  return {
    'X-Token' : settings.token
  };
}






