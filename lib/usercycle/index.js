
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `USERcycle`
 */

var USERcycle = module.exports = integration('USERcycle')
  .endpoint('https://api.usercycle.com/api/v1')
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

USERcycle.prototype.validate = function(_, settings){
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

USERcycle.prototype.identify = request;

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

USERcycle.prototype.track = request;

/**
 * Request.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

function request(payload, settings, fn){
  return this
    .post('/events.json')
    .set('X-Usercycle-API-Key', settings.apiKey)
    .query(payload)
    .end(this.handle(fn));
}
