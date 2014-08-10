
/**
 * Map identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var body = {
    user_id: identify.userId(),
    attributes: identify.traits(),
    email: identify.email(),
    phone_number: identify.phone(),
    first_name: identify.firstName(),
    last_name: identify.lastName()
  };

  var token = identify.proxy('context.device.token');
  var platform = identify.proxy('context.library.name');
  if (!platform || !token) return body;

  if (platform.indexOf('android') > 0) body.gcm = [token];
  if (platform.indexOf('ios') > 0) body.apns = [token];

  return body;
};

/**
 * Map track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  return {
    user_id: track.userId(),
    properties: track.properties(),
    event: track.event()
  };
};
