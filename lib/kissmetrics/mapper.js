
/**
 * Module dependencies.
 */

var isostring = require('isostring');
var time = require('unix-time');
var extend = require('extend');

/**
 * Map identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  var payload = clean(identify.traits());
  return extend(payload, {
    _p: identify.userId() || identify.sessionId(),
    _t: time(identify.timestamp()),
    _k: settings.apiKey,
    _d: 1
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
  var payload = clean(track.properties());
  return extend(payload, {
    _p: track.userId() || track.sessionId(),
    _t: time(track.timestamp()),
    _k: settings.apiKey,
    _n: track.event(),
    _d: 1
  });
};

/**
 * Map alias.
 *
 * @param {Alias} alias
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.alias = function(alias, settings){
  return {
    _k: settings.apiKey,
    _p: alias.from(),
    _n: alias.to()
  };
};

/**
 * Clean all nested objects and arrays.
 *
 * @param {Object} obj
 * @return {Object}
 * @api public
 */

function clean(obj){
  var ret = {};

  for (var k in obj) {
    var value = obj[k];
    if (null == value) continue;

    // iso
    if (isostring(value)) {
      ret[k] = time(value);
      continue;
    }

    // not object
    if ('[object Object]' == value.toString()) {
      ret[k] = value.toString();
      continue;
    }

    // json
    ret[k] = JSON.stringify(value);
  }

  return ret;
}
