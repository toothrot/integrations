
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
  .ensure('settings.projectCode')
  .ensure('settings.apiSecret')
  .channels(['server'])
  .mapper(mapper)
  .retries(2);

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Preact.prototype.track = request;

/**
 * Identify.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Preact.prototype.identify = request;

/**
 * Makes a request to Preact
 *
 * @param {Object} payload
 * @param {Function} fn
 * @api private
 */

function request(payload, fn){
  return this
    .post('/events')
    .auth(this.settings.projectCode, this.settings.apiSecret)
    .type('json')
    .send(payload)
    .end(this.handle(fn));
};
