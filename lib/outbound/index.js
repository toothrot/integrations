
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Outbound`
 */

var Outbound = module.exports = integration('Outbound')
  .endpoint('http://api.outbound.io/api/v1')
  .mapper(mapper)
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} message
 * @return {Boolean}
 * @api public
 */

Outbound.prototype.enabled = function(message){
  return message.enabled(this.name);
};

/**
 * Validate.
 *
 * @param {Facade} validate
 * @param {Object} settings
 * @api private
 */

Outbound.prototype.validate = function(_, settings){
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Track.
 *
 * @apram {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Outbound.prototype.track = function(payload, _, fn){
  return this
    .post('/track')
    .set('X-Outbound-Key', _.apiKey)
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Outbound.prototype.identify = function(payload, _, fn){
  return this
    .post('/identify')
    .set('X-Outbound-Key', _.apiKey)
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
