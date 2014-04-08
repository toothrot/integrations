
/**
 * Module dependencies.
 */

var extend = require('extend');

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var props = track.properties();
  var trackedEvent = track.event()
  ret = {}

   ret["event-type"] = trackedEvent;
   ret["message"] = {
                     'messages': [
                         {
                           'body': JSON.stringify(props)
                         }
                       ]
                     };
  return ret;
};
