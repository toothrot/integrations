
/**
 * Module dependencies.
 */

var time = require('unix-time');
var reject = require('reject');
var extend = require('extend');

/**
 * Map `track`.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  return {
    person: person(track.identify()),
    event: event(track),
    source: "segmentio-server"
  };
};

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  return {
    person: person(identify),
    event: {
      name: "___identify"
    },
    source: "segmentio-server"
  };
};


/**
 * Format `identify` to `person`.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

function person(identify){
  return reject({
    created_at: identify.created(),
    uid: identify.userId() || identify.sessionId(),
    email: identify.email(),
    properties: identify.traits(),
    twitter_id: identify.proxy('traits.twitterId'),
    facebook_id: identify.proxy('traits.facebookId'),
    stripe_id: identify.proxy('traits.stripeId'),
  });
};

/**
 * Format `track` to `event`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

function event(track){
  var extras = track.properties();

  reject(extend(extras, {
    _ua: track.userAgent(),
    _referer: track.referrer(),
    _url: track.proxy('properties.url'),
    _page_title: track.proxy('properties.pageTitle'),
    _ip: track.ip()
  }));

  return reject({
    name: track.event(),
    timestamp: time(track.timestamp()),
    extras: extras,
    note: track.proxy('properties.note'),
    account: track.proxy('properties.account'),
    target_id: track.proxy('properties.targetId'),
    link_url: track.proxy('properties.linkUrl'),
    thumb_url: track.proxy('properties.thumbUrl'),
    revenue: 100 * track.revenue(),
    userAgent: track.userAgent()
  });
}
