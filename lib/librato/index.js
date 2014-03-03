
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Librato`
 */

var Librato = module.exports = integration('Librato')
  .endpoint('https://metrics-api.librato.com/v1')
  .mapper(mapper)
  .retries(2);

/**
 * Enabled.
 *
 * @return {Boolean}
 * @api private
 */

Librato.prototype.enabled = function(message){
  return message.enabled(this.name);
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Librato.prototype.validate = function(_, settings){
  return this.ensure(settings.token, 'token')
    || this.ensure(settings.email, 'email');
};

/**
 * Track.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Librato.prototype.track = function(payload, settings, fn){
  return this
    .post('/metrics')
    .type('json')
    .auth(settings.email, settings.token)
    .set('User-Agent', 'Segment.io/0.1.0')
    .send({ gauges: [payload] })
    .end(this.handle(fn));
};
