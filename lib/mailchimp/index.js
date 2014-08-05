
/**
 * Module dependencies.
 */
var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `MailChimp`
 */

var MailChimp = module.exports = integration('MailChimp')
  .mapper(mapper)
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

MailChimp.prototype.identify = function(payload, settings, callback){
  var url = this.subscribeUrl.replace(/<datacenter>/, settings.datacenter);
  return this
    .post(url)
    .type('json')
    .set('User-Agent', 'Segment.io/1.0.0')
    .send(payload)
    .end(this.handle(callback));
}
