
var time = require('unix-time');

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
  // NOTE(ted) - I'm assuming IP is proxied from client and isn't server IP
  if (identify.ip()) payload.user_ip = identify.ip();
  if (identify.created()) payload.created = time(identify.created());
  if (identify.address()) payload.address = identify.address();
  if (identify.proxy('traits.city')) payload.city = identify.proxy('traits.city');
  if (identify.proxy('traits.state')) payload.state = identify.proxy('traits.state');
  if (identify.website()) payload.website = identify.website();
  if (identify.phone()) payload.phone = identify.phone();
  if (identify.name()) payload.name = identify.name();
  if (identify.firstName()) payload.first_name = identify.firstName();
  if (identify.lastName()) payload.last_name = identify.lastName();
  // note identify.userAgent() appears broken...
  if (identify.proxy('traits.userAgent')) payload.user_agent = identify.proxy('traits.userAgent');
  if (settings.deliveryMethod) payload.delivery_method = settings.deliveryMethod;
  return payload;
};
