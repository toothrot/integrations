
var debug    = require('debug')('Segmentio:Customer.io')
  , errors   = require('../errors')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , unixTime = require('unix-time')
  , util     = require('util');


module.exports = CustomerIO;


function CustomerIO () {
  this.name = 'Customer.io';
  this.baseUrl = 'https://app.customer.io/api/v1/customers/';
}


util.inherits(CustomerIO, Provider);


/**
 * Check whether the provider is enabled
 */

CustomerIO.prototype.enabled = function (message, settings) {
  return Provider.enabled.call(this, message, settings) &&
         message.channel() === 'server';
};


/**
 * Validate the settings for the project
 */

CustomerIO.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'siteId') ||
         this._missingSetting(settings, 'apiKey');
};


/**
 * Update a Customer.io user
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 */

CustomerIO.prototype.identify = function (identify, settings, callback) {

  var id     = identify.userId() || identify.sessionId()
    , traits = identify.traits();

  if (identify.created()) {
    traits.created_at = unixTime(identify.created());
    delete traits.created;
  }

  var req = {
    url     : this.baseUrl + id,
    json    : traits,
    headers : reqHeaders(settings)
  };

  debug('making identify request');
  request.put(req, this._handleResponse(callback));
};


/**
 * Track a Customer.io event
 * http://customer.io/docs/api/rest.html#section-Track_a_custom_event
 */

CustomerIO.prototype.track = function (track, settings, callback) {

  var id         = track.userId() || track.sessionId()
    , properties = track.properties();

  var json = {
    name      : track.event(),
    data      : properties,
    timestamp : unixTime(track.timestamp())
  };

  var req = {
    url     : this.baseUrl + id + '/events',
    json    : json,
    headers : reqHeaders(settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Add the authentication to the headers.
 */

function reqHeaders (settings) {
  var auth = settings.siteId + ':' + settings.apiKey;
  return {
    'Authorization' : 'Basic ' + new Buffer(auth).toString('base64')
  };
}






