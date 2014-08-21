
/**
 * Module dependencies.
 */

var object = require('obj-case');
var reject = require('reject');
var extend = require('extend');
var is = require('is');

/**
 * Map `identify`.
 *
 * @param {Identify} track
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  return {
    apikey: this.settings.apiKey,
    id: this.settings.listId,
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

  // remove nested objects
  return reject.type(traits, 'object');
}
