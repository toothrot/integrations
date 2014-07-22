
/**
 * Map messages.
 */

exports.identify = map;
exports.track = map;

/**
 * Map msg.
 *
 * @param {Facade} msg
 * @return {Object}
 * @api private
 */

function map(msg){
  return {
    messages: [
      { body: JSON.stringify(msg.json()) }
    ]
  };
}
