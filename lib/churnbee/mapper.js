
/**
 * Map track `msg`.
 *
 * https://churnbee.com/docs/api
 *
 * @param {Track} msg
 * @return {Object}
 */

exports.track = function(msg){
  return clean({
    reason: msg.proxy('properties.description'),
    dateTime: msg.timestamp().toISOString(),
    plan: msg.proxy('properties.plan'),
    custom: msg.properties(),
    amount: msg.revenue(),
  });
};

/**
 * Clean `nulls`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function clean(obj){
  var ret = {};

  for (var k in obj) {
    if (null == obj[k]) continue;
    ret[k] = obj[k];
  }

  return ret;
}
