
var debug       = require('debug')('segmentio:integrations:preact')
  , extend      = require('extend')
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
 * Decide whether the message is enabled. Preact requires an email as well.
 * http://www.preact.io/api
 */

Preact.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server' &&
         message.email() !== undefined;
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
 * http://www.preact.io/api
 */

Preact.prototype.track = function (track, settings, callback) {
  var identify = track.identify();
  var payload = {
    person : formatPerson(identify),
    event  : formatEvent(track)
  };

  var req = {
    url  : this.baseUrl + '/events',
    json : payload,
    headers: reqHeaders(settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};



/**
 * Format the event object for track calls
 * http://www.preact.io/api
 */

function formatEvent (track) {
  var event = {
    name      : track.event(),
    timestamp : unixTime(track.timestamp()),
    extras    : track.properties(),
    note      : track.proxy('properties.note'),
    account   : track.proxy('properties.account'),
    target_id : track.proxy('properties.targetId'),
    link_url  : track.proxy('properties.linkUrl'),
    thumb_url : track.proxy('properties.thumbUrl')
  };

  if (track.revenue()) event.revenue = track.revenue() * 100;
  if (track.userAgent()) event.extras._ua = track.userAgent().full;

  extend(event.extras, {
    _ip         : track.ip(),
    _referer    : track.referrer(),
    _url        : track.proxy('properties.url'),
    _page_title : track.proxy('properties.pageTitle')
  });
  return event;
}



/**
 * Format the person object for track calls
 * http://www.preact.io/api
 */

function formatPerson (identify) {
  var person = {
    name        : identify.name(),
    uid         : identify.userId() || identify.sessionId(),
    email       : identify.email(),
    properties  : identify.traits(),
    twitter_id  : identify.proxy('traits.twitterId'),
    facebook_id : identify.proxy('traits.facebookId'),
    stripe_id   : identify.proxy('traits.stripeId')
  };

  if (identify.created()) person.created_at = unixTime(identify.created());
  return person;
}


/**
 * Set the basic auth: http://www.preact.io/api
 */

function reqHeaders (settings) {
  var auth = settings.projectCode + ':' + settings.apiSecret;
  return {
    'Authorization' : 'Basic ' + new Buffer(auth).toString('base64')
  };
}
