
/**
 * Module dependencies.
 */

var time = require('unix-time');
var reject = require('reject');

/**
 * Map identify.
 *
 * TODO:
 *
 *    .city() -> traits.city || traits.address.city
 *    .state() -> traits.state || traits.address.state
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  return reject({
    address: identify.address(),
    created: time(identify.created()),
    duplicates: false,
    email: identify.email(),
    user_ip: identify.ip(),
    city: identify.city(),
    state: identify.state(),
    website: identify.website(),
    phone: identify.phone(),
    name: identify.name(),
    first_name: identify.firstName(),
    last_name: identify.lastName(),
    user_agent: identify.userAgent(),
    delivery_method: settings.deliveryMethod
  });
};
