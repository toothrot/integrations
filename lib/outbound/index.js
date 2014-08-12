
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Outbound`
 */

var Outbound = module.exports = integration('Outbound')
  .endpoint('https://api.outbound.io')
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
  return !! (message.enabled(this.name) && message.field('userId'));
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

Outbound.prototype.track = function(payload, settings, fn){

  // Outbound v1
  // TODO REMOVE
  if (settings.v1) {
    return this
      .post('/api/v1/track')
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  }

  // Outbound v2
  return this
    .post('/v2/track')
    .set('X-Outbound-Key', settings.apiKey)
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

Outbound.prototype.identify = function(payload, settings, fn){

  // Outbound v1
  // TODO REMOVE
  if (settings.v1) {
    return this
      .post('/api/v1/identify')
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  }

  // Outbound v2
  return this
    .post('/v2/identify')
    .set('X-Outbound-Key', settings.apiKey)
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
