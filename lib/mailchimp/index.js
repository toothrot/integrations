var debug       = require('debug')('segmentio:integrations:mailchimp')
  , Integration = require('segmentio-integration')
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
  json.apikey = settings.apiKey;
  json.id = settings.listId;
  json.email = { email : identify.email() };
  json.double_optin = false;
  json.send_welcome = false;
  json.update_existing = true;
  json.replace_interests = false;

  var req = {
    url     : this.subscribeUrl.replace(/<datacenter>/, settings.datacenter),
    json    : json,
    headers : { 'User-Agent' :'Segment.io/1.0.0' }
  };

  debug('making request');
  request.post(req, this._handleResponse(callback));
}
