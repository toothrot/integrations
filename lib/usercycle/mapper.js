
/**
 * Module dependencies.
 */

var isostring = require('isostring');
var object = require('obj-case');
var time = require('unix-time');
var extend = require('extend');
var is = require('is');

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var traits = clean(identify.traits());

  object.del(traits, 'firstName');
  object.del(traits, 'lastName');

  extend(traits, {
    first_name: identify.firstName(),
    last_name: identify.lastName(),
    email: identify.email()
  });

  return {
    uid: identify.userId() || identify.sessionId(),
    occurred_at: time(identify.timestamp()),
    action_name: 'came_back',
    properties: traits
  };
};

/**
 * Map `track`.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var props = clean(track.properties());
  var revenue = track.revenue();
  props.email = track.email();
  if (revenue) props.revenue_amount = revenue;

  return {
    uid: track.userId() || track.sessionId(),
    occurred_at: time(track.timestamp()),
    action_name: track.event(),
    properties: props
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

    // convert dates
    if (is.date(value)) {
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
