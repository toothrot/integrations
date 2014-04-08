
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
  var trackedEvent = track.event()
  ret = {}
   ret["event-type"] = trackedEvent;
   ret["message"] = {
                     'messages': [
                         {
                           'body': JSON.stringify(track)
                         }
                       ]
                     };
  return ret;
};
