
/**
 * Module dependencies.
 */

var extend = require('extend');
var is = require('is');
var time = require('unix-time');


/**
 * Map identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings) {
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

exports.group = function(group, settings) {
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

exports.track = function(track, settings) {
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

var clean = exports._clean = function(obj) {
  var ret = {};

  // Remove traits/properties that are already represented
  // outside of the data container
  var excludeKeys = ["id","name","firstName","lastName"];
  var len = excludeKeys.length;
  for (var i = 0; i < len; i++) {
    clear(obj, excludeKeys[i]);
  }

  // Flatten nested hierarchy, preserving arrays
  obj = flatten(obj);

  // Discard nulls, represent arrays as comma-separated strings
  for (var key in obj) {
    var val = obj[key];
    if (null == val) {
      continue;
    }

    if (is.array(val)) {
      ret[key] = val.toString();
      continue;
    }

    ret[key] = val;
  }

  return ret;
}

/**
 * Remove a property from an object if set.
 *
 * @param {Object} obj
 * @param {String} key
 * @api private
 */

function clear(obj, key) {
  if (obj.hasOwnProperty(key)) {
    delete obj[key];
  }
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

function flatten(source) {
  var output = {};

  function step(object, prev) {
    Object.keys(object).forEach(function(key) {
      var value = object[key];
      var newKey = prev ? prev + ' ' + key : key;

      if (!is.array(value) && is.object(value)) {
        return step(value, newKey);
      }

      output[newKey] = value
    })
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

function basePayload(facade, settings) {
  return {
    token: settings.token,
    stream: settings.stream,
    timestamp: time(facade.timestamp()) * 1000
  };
}
