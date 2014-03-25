
/**
 * Module dependencies.
 */

var time = require('unix-time');

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  return {
    id: identify.userId() || identify.sessionId(),
    auth_token: settings.authToken,
    email: identify.email(),
    data: identify.traits(),
  };
};

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track, settings){
  return {
    auth_token: settings.authToken,
    event_name: track.event(),
    data: track.properties(),
    identity: {
      id: track.userId() || track.sessionId(),
      email: track.email()
    },
    extras: {
      created_at: time(track.timestamp())
    }
  };
};

/**
 * Alias.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.alias = function(alias, settings){
  return {
    auth_token: settings.authToken,
    id: alias.from(),
    new_id: alias.to()
  };
};