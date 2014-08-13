
/**
 * Module dependencies.
 */

var reject = require('reject');

/**
 * Map track `msg`.
 *
 * https://churnbee.com/docs/api
 *
 * @param {Track} msg
 * @return {Object}
 */

exports.track = function(msg){
  return reject({
    reason: msg.proxy('properties.description'),
    dateTime: msg.timestamp().toISOString(),
    plan: msg.proxy('properties.plan'),
    custom: msg.properties(),
    amount: msg.revenue(),
  });
};
