
/**
 * Map identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  return {
    user_id: identify.userId() || identify.sessionId(),
    traits: identify.traits()
  };
};

/**
 * Map track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track, settings){
  return {
    user_id: track.userId() || track.sessionId(),
    payload: track.properties(),
    event: track.event()
  };
};
