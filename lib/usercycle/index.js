
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
  .ensure('settings.key')
  .channels(['server'])
  .mapper(mapper)
  .retries(2);

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

function request(payload, fn){
  return this
    .post('/events.json')
    .set('X-Usercycle-API-Key', this.settings.key)
    .query(payload)
    .end(this.handle(fn));
}
