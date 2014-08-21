
/**
 * Module dependencies.
 */
var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `MailChimp`
 */

var MailChimp = module.exports = integration('MailChimp')
  .channels(['server', 'mobile', 'client'])
  .ensure('settings.datacenter')
  .ensure('settings.apiKey')
  .ensure('settings.listId')
  .ensure('message.email')
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
 * Subscribe the user to the specified list.
 * http://apidocs.mailchimp.com/api/2.0/lists/subscribe.php
 *
 * Potential problem is that MailChimp throttles:
 * http://apidocs.mailchimp.com/api/faq/#faq6
 *
 * @param  {Object}   identify  the identify call
 * @param  {Function} callback  (err)
 * @api public
 */

MailChimp.prototype.identify = function(payload, callback){
  var url = this.subscribeUrl.replace(/<datacenter>/, this.settings.datacenter);
  return this
    .post(url)
    .type('json')
    .set('User-Agent', 'Segment.io/1.0.0')
    .send(payload)
    .end(this.handle(callback));
}
