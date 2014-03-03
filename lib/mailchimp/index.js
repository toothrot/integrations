
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var object = require('obj-case');
var extend = require('extend');
var is = require('is');

/**
 * Expose `MailChimp`
 */

var MailChimp = module.exports = integration('MailChimp')
  .retries(2);

/**
 * Initialize.
 *
 * @api private
 */

MailChimp.prototype.initialize = function(){
  this.subscribeUrl = 'https://<datacenter>.api.mailchimp.com/2.0/lists/subscribe.json';
};

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

MailChimp.prototype.enabled = function(message){
  return !! (message.enabled(this.name)
    && message.email
    && message.email());
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

MailChimp.prototype.validate = function(message, settings){
  return this.ensure(settings.datacenter, 'datacenter')
    || this.ensure(settings.listId, 'listId')
    || this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Subscribe the user to the specified list.
 * http://apidocs.mailchimp.com/api/2.0/lists/subscribe.php
 *
 * Potential problem is that MailChimp throttles:
 * http://apidocs.mailchimp.com/api/faq/#faq6
 *
 * @param  {Object}   identify  the identify call
 * @param  {Object}   settings  the mailchimp settings
 * @param  {Function} callback  (err)
 * @api public
 */

MailChimp.prototype.identify = function(identify, settings, callback){
  var url = this.subscribeUrl.replace(/<datacenter>/, settings.datacenter);
  var msg = identify.json();
  var json = {};

  // TODO: remove
  msg.options = msg.options || msg.context;

  // Settings
  json.apikey = settings.apiKey;
  json.id = settings.listId;
  json.double_optin = false;
  json.send_welcome = false;
  json.update_existing = true;
  json.replace_interests = false;

  // Add the email
  json.email = { email : identify.email() };

  // Add in the other traits as merge_vars
  json.merge_vars = formatTraits(identify);

  return this
    .post(url)
    .type('json')
    .set('User-Agent', 'Segment.io/1.0.0')
    .send(json)
    .end(this.handle(callback));
}

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
