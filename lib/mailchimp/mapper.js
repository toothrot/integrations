
/**
 * Module dependencies.
 */
var object = require('obj-case');
var extend = require('extend');
var is = require('is');

/**
 * Map `identify`.
 *
 * @param {Identify} track
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  return {
    apikey: settings.apiKey,
    id: settings.listId,
    double_optin: false,
    send_welcome: false,
    update_existing: true,
    replace_interests: false,
    email: { email : identify.email() },
    merge_vars: formatTraits(identify)
  };
};

/**
 * Format the traits from the identify
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

function formatTraits (identify) {
  var traits = identify.traits() || {};

  // http://kb.mailchimp.com/article/all-the-merge-tags-cheatsheet
  extend(traits, {
    FNAME  : identify.firstName(),
    LNAME  : identify.lastName(),
    USERID : identify.userId()
  });

  // Remove possible duplicate properties.
  object.del(traits, 'firstName');
  object.del(traits, 'lastName');
  object.del(traits, 'email');

  stripNestedObjects(traits);
  return traits;
}

/**
 * Stringify the nested values for an object.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stripNestedObjects (obj) {
  if (!is.object(obj)) return obj;

  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    if (is.object(val)) obj[key] = null;
  });

  return obj;
}
