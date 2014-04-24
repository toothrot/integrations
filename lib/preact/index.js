
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Preact`
 */

var Preact = module.exports = integration('Preact')
  .endpoint('https://api.preact.io/api/v2')
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

Preact.prototype.validate = function(_, settings){
  return this.ensure(settings.projectCode, 'projectCode')
    || this.ensure(settings.apiSecret, 'apiSecret');
};

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Preact.prototype.track = function(payload, settings, fn){
  return this
    .post('/events')
    .auth(settings.projectCode, settings.apiSecret)
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};

/**
 * Identify.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Preact.prototype.identify = function(payload, settings, fn){
  return this
    .post('/events')
    .auth(settings.projectCode, settings.apiSecret)
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
