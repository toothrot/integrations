/**
 * Module dependencies.
 */

var unixTime = require('unix-time');

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  return {
    email: track.email(),
    eventName: track.event(),
    createdAt: unixTime(track.timestamp()),
    dataFields: track.properties()
  };
};

/**
 * Map `identify`.
 *
 * @param {Identify} track
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var traits = identify.traits();
  var created = identify.created();
  if (created) traits.met = created.toISOString();
  return {
    email: identify.email(),
    dataFields: traits
  };
};