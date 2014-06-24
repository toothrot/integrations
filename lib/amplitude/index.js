
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Amplitude`
 */

var Amplitude = module.exports = integration('Amplitude')
  .endpoint('https://api.amplitude.com/httpapi')
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

Amplitude.prototype.validate = function (message, settings) {
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Set up our prototype methods
 */

Amplitude.prototype.page = send;
Amplitude.prototype.screen = send;
Amplitude.prototype.track = send;

/**
 * Track an event, screen, or page call.
 *
 * @param {Facade} facade
 * @param {Object} settings
 * @param {Function} fn
 */

function send(payload, settings, fn){
  return this
    .get()
    .type('json')
    .query({ api_key: settings.apiKey })
    .query({ event: JSON.stringify(payload) })
    .end(this.handle(fn));
}