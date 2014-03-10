
var debug       = require('debug')('segmentio:integrations:iterable')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


module.exports = Iterable;


function Iterable () {
  this.name = 'Iterable';
  this.baseUrl = 'https://api.iterable.com/api';
}


util.inherits(Iterable, Integration);


/**
 * Decide whether the message is enabled.
 */

Iterable.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


/**
 * Validate the message and settings
 */

Iterable.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey');
};


/**
 * Track an action in Iterable
 * https://api.iterable.com/api/docs#!/events/track_post_0
 */

Iterable.prototype.track = function (track, settings, callback) {
  var payload = {
    eventName  : track.event(),
    dataFields : track.properties(),
    email      : track.email(),
    createdAt  : unixTime(track.timestamp())
  };

  var req = {
    url        : this.baseUrl + '/events/track',
    json       : payload,
    headers    : headers(settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Identify an Iterable user
 * https://api.iterable.com/api/docs#!/users/updateUser_post_1
 */

Iterable.prototype.identify = function (identify, settings, callback) {
  var traits = identify.traits();

  if (identify.created()) {
    traits.createdAt = formatDate(identify.created());
    delete traits.created;
  }

  var payload = {
    email      : identify.email(),
    dataFields : traits
  };

  var req = {
    url        : this.baseUrl + '/users/update',
    json       : payload,
    headers    : headers(settings)
  };

  debug('making identify request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Format timestamp to Iterable compatible date format
 */

function formatDate (date) {
  date = new Date(date);
  if (isNaN(date.getTime())) return;
  return date.toISOString();
}


function headers (settings) {
  return {
    'User-Agent'   : 'Segment.io/1.0',
    'Api-Key'      : settings.apiKey
  };
}
