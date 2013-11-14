
var debug = require('debug')('segmentio:integrations:trak.io');
var extend = require('extend');
var Integration = require('segmentio-integration');
var request = require('request-retry')({ retries : 2 });
var unixTime = require('unix-time');
var util = require('util');


module.exports = TrakIO;


function TrakIO () {
  this.name = 'trak.io';
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
 * http://docs.trak.io/identify.html#http
 */

TrakIO.prototype.identify = function (identify, settings, callback) {
  var id = identify.userId() || identify.sessionId();
  var payload = {
    data: {
      distinct_id: id,
      properties: formatTraits(identify)
    }
  };

  var req = {
    url: this.baseUrl + '/identify',
    json: payload,
    headers: reqHeaders(settings)
  };

  debug('making identify request %j', req);
  request.post(req, this._handleResponse(callback));
};


/**
 * Track a Trak.io event
 * http://docs.trak.io/track.html#http
 */

TrakIO.prototype.track = function (track, settings, callback) {
  var id = track.userId() || track.sessionId();
  var timestamp = track.timestamp().toISOString();

  var payload = {
    data: {
      distinct_id: id,
      event: track.event(),
      properties: track.properties(),
      time: timestamp
    }
  };

  var req = {
    url     : this.baseUrl + '/track',
    json    : payload,
    headers : reqHeaders(settings)
  };

  debug('making track request %j', req);
  request.post(req, this._handleResponse(callback));
};



/**
 * Alias a Trak.io user
 */

TrakIO.prototype.alias = function (alias, settings, callback) {
  var payload = {
    data: {
      distinct_id : alias.from(),
      alias       : alias.to()
    }
  };

  var req = {
    url     : this.baseUrl + '/alias',
    json    : payload,
    headers : reqHeaders(settings)
  };

  debug('making alias request %j', req);
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


/**
 * Trak's special people properties
 * http://docs.trak.io/properties.html#person
 */

function formatTraits (identify) {
  var avatar = identify.proxy('traits.avatar') ||
               identify.proxy('traits.avatarUrl');

  return extend(identify.traits(), {
    email: identify.email(),
    avatar_url: avatar,
    name: identify.name(),
    gender: identify.proxy('traits.gender'),
    position: identify.proxy('traits.position'),
    company: identify.proxy('traits.company'),
    positions: identify.proxy('traits.positions'),
    industry: identify.proxy('traits.industry'),
    location: identify.proxy('traits.location'),
    languages: identify.proxy('traits.languages'),
    birthday: identify.proxy('traits.birthday'),
    tags: identify.proxy('traits.tags'),
    headline: identify.proxy('traits.headline'),
    account_id: identify.proxy('traits.account')
  });
}