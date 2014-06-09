
/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  return {
    messages: [
      { body: JSON.stringify(track.json()) }
    ]
  };
};
