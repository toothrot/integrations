
/**
 * Module dependencies.
 */

var extend = require('extend');
var is = require('is');
var del = require('obj-case').del;

/**
 * Map identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  var payload = basePayload(identify, settings);
  return extend(payload, {
    userId: identify.userId(),
    userName: identify.name() || identify.username(),
    userData: clean(identify.traits())
  });
};

/**
 * Map group.
 *
 * @param {Group} group
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.group = function(group, settings){
  var payload = basePayload(group, settings);
  return extend(payload, {
    userId: group.userId(),
    accountId: group.groupId(),
    accountName: group.proxy('traits.name'),
    accountData: clean(group.traits())
  });
};

/**
 * Map track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track, settings){
  var payload = basePayload(track, settings);
  return extend(payload, {
    userId: track.userId(),
    userData: clean(track.traits()),
    session: track.sessionId(),
    event: track.event(),
    eventData: clean(track.properties())
  });
};

/**
 * Clean all nested objects and arrays.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

var clean = exports._clean = function(obj){
  var ret = {};

  // Remove traits/properties that are already represented
  // outside of the data container
  var excludeKeys = ["id","name","firstName","lastName"];
  excludeKeys.forEach(function(key){ del(obj, key); });

  // Flatten nested hierarchy, preserving arrays
  obj = flatten(obj);

  // Discard nulls, represent arrays as comma-separated strings
  Object.keys(obj).forEach(function(key){
    var val = obj[key];
    if (null == val) return;
    if (is.array(val)) val = val.toString();
    ret[key] = val;
  });

  return ret;
}

/**
 * Flatten a nested object into a single level space-delimited
 * hierarchy.
 *
 * Based on https://github.com/hughsk/flat
 *
 * @param {Object} source
 * @return {Object}
 * @api private
 */

function flatten(source){
  var output = {};

  function step(object, prev) {
    for (var key in object) {
      var value = object[key];
      var newKey = prev ? prev + ' ' + key : key;
      if (!is.array(value) && is.object(value)) return step(value, newKey);
      output[newKey] = value;
    }
  }
  step(source);
  return output;
}

/**
 * Populate payload with data needed for every Frontleaf API call.
 *
 * @param facade
 * @param settings
 * @return {Object}
 * @api private
 */

function basePayload(facade, settings){
  return {
    token: settings.token,
    stream: settings.stream,
    timestamp: facade.timestamp().getTime()
  };
}
