
/**
 * Module dependencies.
 */

var time = require('unix-time');
var object = require('obj-case');
var is = require('is');
var flatten = require('flat').flatten;
var extend = require('extend');


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

/**
 * Clean all nested objects and arrays.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function clean(obj){
  var ret = {};

  // Remove traits/properties that are already represented
  // outside of the data container
  object.del(obj, 'id');
  object.del(obj, 'name');

  // Flatten nested hierarchy, preserving arrays (safe == true)
  obj = flatten(obj, {delimiter : ' ', safe : true});

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
