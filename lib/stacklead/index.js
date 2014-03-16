
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var fmt = require('util').format;
var mapper = require('./mapper');
var VALID_DELIVERY_METHODS = ['email', 'webhook'];

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
  var err = this.ensure(settings.apiKey, 'apiKey');
  if (!err && settings.delivery_method && VALID_DELIVERY_METHODS.indexOf(settings.delivery_method) === -1) {
    var msg = fmt('"%s" integration requires delivery_method to be one of "%s" but was "%s"',
      this.name, VALID_DELIVERY_METHODS, settings.delivery_method);
    err = new integration.errors.Validation(msg);
  }
  return err;
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
  if (settings.delivery_method) {
    payload.delivery_method = settings.delivery_method;
  }
  return this
    .post('')
    .auth(settings.apiKey, '')
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
