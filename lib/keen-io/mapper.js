
/**
 * Module dependencies.
 */

var extend = require('extend');

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var props = track.properties();
  var options = track.options(this.name);
  var globals = options.traits || {};
  var ret = {};

  extend(props, {
    userId: track.userId() || track.sessionId(),
    keen: { timestamp: track.timestamp() }
  });

  extend(props, globals);

  ret[track.event()] = [props];
  return ret;
};
