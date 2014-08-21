
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var fmt = require('util').format;
var mapper = require('./mapper');
var ValidationError = integration.errors.Validation;

/**
 * Delivery methods
 */

var methods = ['email', 'webhook'];

/**
 * Expose `StackLead`
 */

var StackLead = module.exports = integration('StackLead')
  .endpoint('https://stacklead.com/api')
  .channels(['server', 'client'])
  .ensure('settings.apiKey')
  .ensure('message.email')
  .mapper(mapper)
  .retries(2);

/**
 * Delivery method
 */

StackLead.ensure('settings.deliveryMethod', function(msg, settings){
  var method = settings.deliveryMethod;
  if (!method || methods.indexOf(method) > -1) return;
  return this.invalid('`deliveryMethod` must be one of %s but was %s', methods, method);
});

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Function} fn
 * @api private
 */

StackLead.prototype.identify = function(payload, fn){
  return this
    .post('/leads')
    .auth(this.settings.apiKey, '')
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
