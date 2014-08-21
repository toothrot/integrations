
/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  return {
    app_id: this.settings.apiKey,
    identity: id(track),
    event: track.event(),
    properties: track.properties()
  };
};

/**
 * Id.
 *
 * @param {Track} message
 * @return {String}
 * @api private
 */

function id(message){
  return message.email() || message.username() || message.userId();
}
