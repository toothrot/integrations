
/**
 * Map identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  var payload = {
    email: identify.email(),
    duplicates:false
  };
  var method = settings.deliveryMethod;
  if (method) payload.delivery_method = method;
  return payload;
};
