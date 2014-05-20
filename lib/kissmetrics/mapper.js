
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
  var userId = identify.userId();
  var anonymousId = identify.sessionId();
  var payload = {};
  payload.identify = clean(identify.traits());
  payload.identify = extend(payload.identify, {
    _p: userId || anonymousId,
    _t: time(identify.timestamp()),
    _k: settings.apiKey,
    _d: 1
  });
  if (userId && anonymousId) {
    payload.alias = {
      _k: settings.apiKey,
      _p: identify.userId(),
      _n: identify.sessionId()
    };
  }
  return payload;
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
  if (track.revenue()) payload['Billing Amount'] = track.revenue();
  if (settings.prefixProperties) payload = prefix(track.event(), payload);
  return extend(payload, {
    _p: track.userId() || track.sessionId(),
    _t: time(track.timestamp()),
    _k: settings.apiKey,
    _n: track.event(),
    _d: 1
  });
};

/**
 * Prefix properties with the event name.
 *
 * @param {String} event
 * @param {Object} properties
 * @api private
 */

function prefix(event, properties){
  var props = {};
  Object.keys(properties).forEach(function(key){
    var val = properties[key];
    if (key === 'Billing Amount') props[key] = val;
    else props[event + ' - ' + key] = val;
  });
  return props;
}

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
    if ('[object Object]' != value.toString()) {
      ret[k] = value.toString();
      continue;
    }

    // json
    ret[k] = JSON.stringify(value);
  }

  return ret;
}
