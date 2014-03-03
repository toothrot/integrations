
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `TrakIO`
 */

var TrakIO = module.exports = integration('trak.io')
  .endpoint('https://api.trak.io/v1')
  .mapper(mapper)
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api private
 */

TrakIO.prototype.validate = function(_, settings){
  return this.ensure(settings.token, 'token');
};

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

TrakIO.prototype.identify = request('/identify');

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

TrakIO.prototype.track = request('/track');

/**
 * Alias.
 *
 * @param {Alias} alias
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

TrakIO.prototype.alias = request('/alias');

/**
 * Request.
 *
 * @param {String} path
 * @return {Function}
 * @api private
 */

function request(path){
  return function(payload, settings, fn){
    return this
      .post(path)
      .set('X-Token', settings.token)
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  };
}
