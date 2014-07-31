
/**
 * Module dependencies.
 */

var time = require('unix-time');

/**
 * Map track.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var event = exports.clean(track.event());
  return {
    name: event,
    value: track.value() == null ? 1 : track.value(),
    measure_time: time(track.timestamp()),
    source: track.options(this.name).source || event
  };
};

/**
 * Clean event for librato.
 *
 * @param {String} event
 * @return {String}
 * @api private
 */

exports.clean = function(event){
  return event
    .replace(/[^a-z0-9._-]/gi, '-')
    .substring(0, 255);
};
