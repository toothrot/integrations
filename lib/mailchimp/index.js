var debug       = require('debug')('segmentio:integrations:mailchimp')
  , Integration = require('segmentio-integration')
  , extend      = require('extend')
  , objCase     = require('obj-case')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');

module.exports = MailChimp;

function MailChimp () {
  this.name = 'MailChimp';
  this.subscribeUrl = 'https://<datacenter>.api.mailchimp.com/2.0/lists/subscribe.json';
}

util.inherits(MailChimp, Integration);

MailChimp.prototype.enabled = function (message, settings) {
  var hasEmail = !!message.email();
  return Integration.enabled.apply(this, arguments) && hasEmail;
};


MailChimp.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'datacenter') ||
         this._missingSetting(settings, 'listId') ||
         this._missingSetting(settings, 'apiKey');
};

/**
 * Subscribe the user to the specified list.
 * http://apidocs.mailchimp.com/api/2.0/lists/subscribe.php
 * 
 * @param  {Object}   identify  the identify call
 * @param  {Object}   settings  the mailchimp settings
 * @param  {Function} callback  (err)
 */

// Potential problem is that MailChimp throttles:
// http://apidocs.mailchimp.com/api/faq/#faq6

MailChimp.prototype.identify = function identify (identify, settings, callback) {
  var msg = identify.json();
  msg.options = msg.options || msg.context;

  var json = {};

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

  var req = {
    url     : this.subscribeUrl.replace(/<datacenter>/, settings.datacenter),
    json    : json,
    headers : { 'User-Agent' :'Segment.io/1.0.0' }
  };

  debug('making request');
  request.post(req, this._handleResponse(callback));
}


/**
 * Format the traits from the identify
 */

function formatTraits (identify) {

  var traits = identify.traits() || {};

  console.log(traits);

  // http://kb.mailchimp.com/article/all-the-merge-tags-cheatsheet
  extend(traits, {
    FNAME  : identify.firstName(),
    LNAME  : identify.lastName(),
    USERID : identify.userId()
  });

  // Remove possible duplicate properties.
  objCase.del(traits, 'firstName');
  objCase.del(traits, 'lastName');
  objCase.del(traits, 'email');

  stripNestedObjects(traits);
  console.log(traits);
  return traits;
}

/**
 * Stringify the nested values for an object.
 */

function stripNestedObjects (obj) {
  if (!is.object(obj)) return obj;

  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    if (is.object(val)) obj[key] = null;
  });

  return obj;
}
