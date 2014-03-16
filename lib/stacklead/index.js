
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `StackLead`
 */

var StackLead = module.exports = integration('StackLead')
  .endpoint('https://stacklead.com/api/leads')
  .mapper(mapper)
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

StackLead.prototype.validate = function(_, settings){
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

StackLead.prototype.enabled = function(message){
  return !! (message.enabled(this.name)
    && message.email
    && message.email());
};

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

StackLead.prototype.identify = function(payload, settings, fn){
  return this
    .post('')
    .auth(settings.apiKey, '')
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
